// app/api/eleve/examens/[id]/route.ts
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
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const examenId = parseInt(params.id);
    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;

    // Infos examen
    const examenRes = await query(
      `SELECT ex.id, ex.titre, ex.duree_minutes, ex.date_debut, ex.date_fin, ex.est_actif,
              m.nom AS matiere
       FROM public.examens ex
       JOIN public.enseignements en ON en.id = ex.enseignement_id
       JOIN public.matieres m ON m.id = en.matiere_id
       WHERE ex.id = $1 AND ex.est_actif = true`,
      [examenId]
    );

    if (examenRes.rows.length === 0) {
      return NextResponse.json({ error: "Examen introuvable ou inactif" }, { status: 404 });
    }

    // Vérifier si déjà passé
    const reponsesExist = await query(
      "SELECT COUNT(*) as nb FROM public.reponses_eleves_qcm WHERE examen_id = $1 AND eleve_id = $2",
      [examenId, eleveId]
    );
    const dejaPassé = parseInt(reponsesExist.rows[0].nb) > 0;

    // Questions avec options (sans révéler les bonnes réponses)
    const questionsRes = await query(
      `SELECT q.id, q.question, q.points, q.ordre
       FROM public.questions_qcm q
       WHERE q.examen_id = $1
       ORDER BY q.ordre ASC`,
      [examenId]
    );

    const optionsRes = await query(
      `SELECT o.id, o.question_id, o.option_texte
       FROM public.options_qcm o
       JOIN public.questions_qcm q ON q.id = o.question_id
       WHERE q.examen_id = $1
       ORDER BY o.id ASC`,
      [examenId]
    );

    const questions = questionsRes.rows.map((q) => ({
      ...q,
      options: optionsRes.rows.filter((o) => o.question_id === q.id),
    }));

    // Si déjà passé, récupérer les réponses et le score
    let resultat = null;
    if (dejaPassé) {
      const reponsesRes = await query(
        `SELECT r.question_id, r.option_id, o.est_correcte, o.option_texte,
                q.points, q.question
         FROM public.reponses_eleves_qcm r
         JOIN public.options_qcm o ON o.id = r.option_id
         JOIN public.questions_qcm q ON q.id = r.question_id
         WHERE r.examen_id = $1 AND r.eleve_id = $2`,
        [examenId, eleveId]
      );

      let score = 0;
      let totalPoints = 0;
      for (const r of reponsesRes.rows) {
        totalPoints += parseFloat(r.points);
        if (r.est_correcte) score += parseFloat(r.points);
      }

      resultat = {
        reponses: reponsesRes.rows,
        score: Math.round(score * 100) / 100,
        totalPoints: Math.round(totalPoints * 100) / 100,
        note: totalPoints > 0 ? Math.round((score / totalPoints) * 20 * 100) / 100 : 0,
      };
    }

    return NextResponse.json({
      examen: examenRes.rows[0],
      questions,
      dejaPassé,
      resultat,
    });
  } catch (error: any) {
    console.error("API /eleve/examens/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
