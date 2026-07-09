import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    // ⭐ COMME POUR LES EXAMENS ET DEVOIRS : Ne récupérer que les classes de l'enseignant
    const classesRes = await query(
      `SELECT 
        c.id,
        c.nom,
        c.niveau,
        en.id as enseignement_id,
        COALESCE(m.nom, 'Sans matière') as matiere,
        (
          SELECT COUNT(DISTINCT ele.id) 
          FROM public.eleves ele
          WHERE ele.classe_id = c.id 
            AND ele.est_inscrit = true
        ) as nb_eleves,
        COUNT(DISTINCT q.id) as nb_quiz
      FROM public.classes c
      JOIN public.enseignements en ON en.classe_id = c.id
      LEFT JOIN public.matieres m ON m.id = en.matiere_id
      LEFT JOIN public.quiz q ON q.enseignement_id = en.id
      WHERE en.enseignant_id = $1  -- ⭐ Filtré par enseignant
        AND en.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
      GROUP BY c.id, c.nom, c.niveau, en.id, m.nom
      ORDER BY c.niveau, c.nom`,
      [personnelId]
    );

    return NextResponse.json({ classes: classesRes.rows });
  } catch (error: any) {
    console.error("API /enseignant/quiz/classes GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}