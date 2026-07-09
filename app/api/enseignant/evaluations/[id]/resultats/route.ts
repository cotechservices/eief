import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const examenId = parseInt(id);

    if (isNaN(examenId) || examenId <= 0) {
      return NextResponse.json({ error: "ID d'examen invalide" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Vérifier appartenance
    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    const personnelId = personnelRes.rows[0]?.id;

    if (!personnelId) {
      return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });
    }

    // Récupérer les infos de l'examen
    const examenRes = await query(
      `SELECT ex.id, ex.titre, c.nom as classe
       FROM public.examens ex
       JOIN public.enseignements en ON en.id = ex.enseignement_id
       JOIN public.classes c ON c.id = en.classe_id
       WHERE ex.id = $1 AND en.enseignant_id = $2`,
      [examenId, personnelId]
    );

    if (examenRes.rows.length === 0) {
      return NextResponse.json({ error: "Examen introuvable" }, { status: 404 });
    }

    // ⭐ Récupérer les résultats des élèves UNIQUEMENT ceux associés via examens_eleves
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
         COALESCE(s.score, 0) AS score,
         COALESCE(s.total_points, 0) AS total_points,
         COALESCE(s.nb_correctes, 0) AS nb_correctes,
         COALESCE(s.nb_reponses, 0) AS nb_reponses,
         CASE 
           WHEN COALESCE(s.total_points, 0) > 0 
           THEN ROUND((COALESCE(s.score, 0)::numeric / s.total_points::numeric) * 20, 2) 
           ELSE 0 
         END AS note
       FROM public.eleves e
       JOIN public.utilisateurs u ON u.id = e.utilisateur_id
       INNER JOIN public.examens_eleves ee ON ee.eleve_id = e.id AND ee.examen_id = $1
       LEFT JOIN scores s ON s.eleve_id = e.id
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