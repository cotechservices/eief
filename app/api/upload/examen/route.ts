//app/api/upload/examen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Format non supporté. Utilisez une image (JPEG, PNG, GIF) ou un fichier PDF." 
      }, { status: 400 });
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 10 Mo." }, { status: 400 });
    }

    // Générer un nom unique
    const extension = file.name.split('.').pop();
    const fileName = `examens/examen_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('preinscriptions')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 });
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('preinscriptions')
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: fileName 
    });
  } catch (error: any) {
    console.error("Erreur upload examen:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}