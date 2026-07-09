// app/api/enseignant/soumissions/[id]/noter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ⭐ params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // ⭐ Déballer params avec await
    const { id: soumissionId } = await params;

    // ⭐ Vérifier que l'ID est valide
    if (!soumissionId || isNaN(parseInt(soumissionId))) {
      return NextResponse.json(
        { error: "ID de soumission invalide" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { note, commentaire } = body;

    if (note === undefined || note === null) {
      return NextResponse.json({ error: "Note requise" }, { status: 400 });
    }

    if (isNaN(note) || note < 0 || note > 20) {
      return NextResponse.json({ error: "Note invalide (0-20)" }, { status: 400 });
    }

    // Vérifier que la soumission existe et appartient à un devoir de l'enseignant
    const checkRes = await query(
      `SELECT sd.id 
       FROM public.soumissions_devoirs sd
       JOIN public.devoirs d ON d.id = sd.devoir_id
       JOIN public.enseignements e ON e.id = d.enseignement_id
       JOIN public.personnels p ON p.id = e.enseignant_id
       WHERE sd.id = $1 AND p.utilisateur_id = $2`,
      [parseInt(soumissionId), userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Soumission non trouvée ou non autorisée" }, { status: 404 });
    }

    const result = await query(
      `UPDATE public.soumissions_devoirs
       SET note = $1, commentaire = $2
       WHERE id = $3
       RETURNING *`,
      [note, commentaire || null, parseInt(soumissionId)]
    );

    return NextResponse.json({ 
      success: true, 
      soumission: result.rows[0] 
    });
  } catch (error: any) {
    console.error("API /enseignant/soumissions/noter PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}