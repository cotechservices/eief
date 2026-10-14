import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getEleveSession } from "@/lib/eleve-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getEleveSession(req);
    if (auth.error) return auth.error;

    const { eleveId } = auth;

    const { id } = await params;
    const examenId = parseInt(id);

    // Vérifier que l'élève est bien associé à l'examen
    const checkAccess = await query(
      `SELECT 1 FROM public.examens_eleves 
       WHERE examen_id = $1 AND eleve_id = $2`,
      [examenId, eleveId]
    );

    if (checkAccess.rows.length === 0) {
      return NextResponse.json({ error: "Accès non autorisé à cet examen" }, { status: 403 });
    }

    // Vérifier que l'examen a des questions
    const questionsCheck = await query(
      `SELECT COUNT(*) as nb FROM public.questions_qcm WHERE examen_id = $1`,
      [examenId]
    );

    if (parseInt(questionsCheck.rows[0].nb) === 0) {
      return NextResponse.json({ error: "Cet examen n'a pas de questions" }, { status: 400 });
    }

    // Vérifier si déjà passé
    const existing = await query(
      "SELECT COUNT(*) as nb FROM public.reponses_eleves_qcm WHERE examen_id = $1 AND eleve_id = $2",
      [examenId, eleveId]
    );
    if (parseInt(existing.rows[0].nb) > 0) {
      return NextResponse.json({ error: "Examen déjà passé" }, { status: 409 });
    }

    const body = await req.json();
    const { reponses } = body;

    if (!reponses || !Array.isArray(reponses) || reponses.length === 0) {
      return NextResponse.json({ error: "Réponses manquantes" }, { status: 400 });
    }

    // Enregistrer les réponses
    const queries = reponses.map((r: { question_id: number; option_id: number }) => ({
      text: `INSERT INTO public.reponses_eleves_qcm 
             (examen_id, eleve_id, question_id, option_id)
             VALUES ($1, $2, $3, $4)`,
      params: [examenId, eleveId, r.question_id, r.option_id],
    }));

    await transaction(queries);

    // Calculer le score
    const scoreRes = await query(
      `SELECT 
        COALESCE(SUM(q.points) FILTER (WHERE o.est_correcte = true), 0) AS score,
        COALESCE(SUM(q.points), 0) AS total_points,
        COUNT(*) AS nb_reponses,
        COUNT(*) FILTER (WHERE o.est_correcte = true) AS nb_correctes
       FROM public.reponses_eleves_qcm r
       JOIN public.options_qcm o ON o.id = r.option_id
       JOIN public.questions_qcm q ON q.id = r.question_id
       WHERE r.examen_id = $1 AND r.eleve_id = $2`,
      [examenId, eleveId]
    );

    const score = parseFloat(scoreRes.rows[0].score) || 0;
    const totalPoints = parseFloat(scoreRes.rows[0].total_points) || 0;
    const note = totalPoints > 0 ? Math.round((score / totalPoints) * 20 * 100) / 100 : 0;

    return NextResponse.json({
      success: true,
      score,
      totalPoints,
      note,
      nbCorrectes: parseInt(scoreRes.rows[0].nb_correctes) || 0,
      nbReponses: parseInt(scoreRes.rows[0].nb_reponses) || 0,
    });
  } catch (error: any) {
    console.error("API /eleve/examens/[id]/repondre error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}