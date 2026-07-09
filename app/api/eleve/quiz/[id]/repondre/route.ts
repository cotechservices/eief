//app/api/eleve/quiz/[id]/repondre/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, transaction } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const quizId = parseInt(id);
    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;

    const body = await req.json();
    const { reponses, temps_total_ms } = body;

    if (!reponses || !Array.isArray(reponses) || reponses.length === 0) {
      return NextResponse.json({ error: "Réponses manquantes" }, { status: 400 });
    }

    // Vérifier ou créer la participation
    let participationRes = await query(
      `SELECT id FROM public.participations_quiz
       WHERE quiz_id = $1 AND eleve_id = $2 AND est_termine = false`,
      [quizId, eleveId]
    );

    let participationId: number;
    if (participationRes.rows.length === 0) {
      // Créer une nouvelle participation
      const newPart = await query(
        `INSERT INTO public.participations_quiz (quiz_id, eleve_id, date_debut)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [quizId, eleveId]
      );
      participationId = newPart.rows[0].id;
    } else {
      participationId = participationRes.rows[0].id;
      // Supprimer les anciennes réponses
      await query(
        `DELETE FROM public.reponses_quiz WHERE participation_id = $1`,
        [participationId]
      );
    }

    // Enregistrer les réponses
    const queries = reponses.map((r: { question_id: number; option_id: number }) => ({
      text: `INSERT INTO public.reponses_quiz 
             (participation_id, question_id, option_id, date_reponse)
             VALUES ($1, $2, $3, NOW())`,
      params: [participationId, r.question_id, r.option_id],
    }));

    await transaction(queries);

    // Calculer le score
    const scoreRes = await query(
      `SELECT 
        COALESCE(SUM(COALESCE(qq.points_personnalises, qs.points)) FILTER (WHERE o.est_correcte = true), 0) AS points_obtenus,
        COALESCE(SUM(COALESCE(qq.points_personnalises, qs.points)), 0) AS total_points,
        COUNT(*) AS nb_reponses,
        COUNT(*) FILTER (WHERE o.est_correcte = true) AS nb_correctes
       FROM public.reponses_quiz r
       JOIN public.options_quiz o ON o.id = r.option_id
       JOIN public.questions_quiz qs ON qs.id = r.question_id
       JOIN public.quiz_questions qq ON qq.quiz_id = $1 AND qq.question_id = qs.id
       WHERE r.participation_id = $2`,
      [quizId, participationId]
    );

    const pointsObtenus = parseFloat(scoreRes.rows[0].points_obtenus) || 0;
    const totalPoints = parseFloat(scoreRes.rows[0].total_points) || 0;
    const nbCorrectes = parseInt(scoreRes.rows[0].nb_correctes) || 0;
    const nbReponses = parseInt(scoreRes.rows[0].nb_reponses) || 0;
    const pourcentage = totalPoints > 0 ? Math.round((pointsObtenus / totalPoints) * 100) : 0;

    // Mettre à jour la participation
    await query(
      `UPDATE public.participations_quiz 
       SET date_fin = NOW(),
           score_total = $1,
           points_obtenus = $2,
           reponses_correctes = $3,
           reponses_totales = $4,
           pourcentage = $5,
           est_termine = true
       WHERE id = $6`,
      [totalPoints, pointsObtenus, nbCorrectes, nbReponses, pourcentage, participationId]
    );

    return NextResponse.json({
      success: true,
      points_obtenus: pointsObtenus,
      total_points: totalPoints,
      pourcentage: pourcentage,
      reponses_correctes: nbCorrectes,
      reponses_totales: nbReponses,
    });
  } catch (error: any) {
    console.error("API /eleve/quiz/[id]/repondre POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}