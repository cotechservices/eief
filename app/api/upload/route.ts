// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("ERREUR: NEXT_PUBLIC_SUPABASE_URL n'est pas définie");
}

if (!supabaseServiceKey) {
  console.error("ERREUR: SUPABASE_SERVICE_ROLE_KEY n'est pas définie");
}

const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

export async function POST(request: NextRequest) {
  console.log("=== API UPLOAD CALLED ===");
  
  try {
    // Vérifier les variables d'environnement
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante. Vérifiez les variables d'environnement." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const enfantId = formData.get("enfantId") as string;
    const type = formData.get("type") as string;

    console.log("Upload reçu:", { enfantId, type, fileName: file?.name });

    if (!file || !enfantId || !type) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const extension = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${enfantId}_${type}_${timestamp}.${extension}`;
    const filePath = `${enfantId}/${fileName}`;

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from("preinscriptions")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Erreur upload Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'upload: " + error.message },
        { status: 500 }
      );
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from("preinscriptions")
      .getPublicUrl(filePath);

    console.log("Upload réussi, URL:", urlData.publicUrl);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Erreur générale:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}