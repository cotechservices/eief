// app/api/enseignant/evaluations/[id]/resultats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const examenId = parseInt(params.id);
    const userId = (session.user as any).id;

    // Vérifier appartenance
    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    const personnelId = personnelRes.rows[0]?.id;

    const examenRes = await query(
      `SELECT ex.id, ex.titre, m.nom as matiere, c.nom as classe
       FROM public.examens ex
       JOIN public.enseignements en ON en.id = ex.enseignement_id
       JOIN public.matieres m ON m.id = en.matiere_id
       JOIN public.classes c ON c.id = en.classe_id
       WHERE ex.id = $1 AND en.enseignant_id = $2`,
      [examenId, personnelId]
    );

    if (examenRes.rows.length === 0) {
      return NextResponse.json({ error: "Examen introuvable" }, { status: 404 });
    }

    // Récupérer les résultats des élèves
    const resultatsRes = await query(
      `WITH scores AS (
         SELECT 
           r.eleve_id,
           SUM(q.points) FILTER (WHERE o.est_correcte = true) AS score,
           SUM(q.points) AS total_points,
           COUNT(*) FILTER (WHERE o.est_correcte = true) AS nb_correctes,
           COUNT(*) AS nb_reponses
         FROM public.reponses_eleves_qcm r
         JOIN public.options_qcm o ON o.id = r.option_id
         JOIN public.questions_qcm q ON q.id = r.question_id
         WHERE r.examen_id = $1
         GROUP BY r.eleve_id
       )
       SELECT 
         e.id AS eleve_id,
         u.nom,
         u.prenom,
         u.email,
         s.score,
         s.total_points,
         s.nb_correctes,
         s.nb_reponses,
         CASE WHEN s.total_points > 0 THEN ROUND((s.score::numeric / s.total_points::numeric) * 20, 2) ELSE 0 END AS note
       FROM scores s
       JOIN public.eleves e ON e.id = s.eleve_id
       JOIN public.utilisateurs u ON u.id = e.utilisateur_id
       ORDER BY note DESC, u.nom ASC`,
      [examenId]
    );

    return NextResponse.json({
      examen: examenRes.rows[0],
      resultats: resultatsRes.rows
    });
  } catch (error: any) {
    console.error("API /enseignant/evaluations/[id]/resultats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
