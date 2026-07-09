// app/api/enseignant/classes/[enseignement_id]/eleves/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enseignement_id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { enseignement_id } = await params;

    const userId = (session.user as any).id;

    // Vérifier que l'enseignement appartient à l'enseignant
    const checkRes = await query(
      `SELECT en.id, en.classe_id 
       FROM public.enseignements en
       WHERE en.id = $1 AND en.enseignant_id = (
         SELECT id FROM public.personnels WHERE utilisateur_id = $2
       )`,
      [enseignement_id, userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Enseignement non trouvé" }, { status: 404 });
    }

    const classeId = checkRes.rows[0].classe_id;

    // Récupérer les élèves de la classe
    const elevesRes = await query(
      `SELECT 
        ele.id,
        u.nom,
        u.prenom,
        ele.matricule
       FROM public.eleves ele
       JOIN public.utilisateurs u ON u.id = ele.utilisateur_id
       WHERE ele.classe_id = $1
         AND ele.est_inscrit = true
       ORDER BY u.nom, u.prenom`,
      [classeId]
    );

    return NextResponse.json({ eleves: elevesRes.rows });
  } catch (error: any) {
    console.error("API /enseignant/classes/[enseignement_id]/eleves error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}