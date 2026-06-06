// app/api/admin/bibliotheque/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const extension = file.name.split(".").pop();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const fileName = `bibliotheque_${timestamp}_${random}.${extension}`;
    const filePath = `bibliotheque/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error } = await supabase.storage
      .from("preinscriptions")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("preinscriptions")
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}