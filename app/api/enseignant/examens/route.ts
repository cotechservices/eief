// app/api/enseignant/examens/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
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

    const examensRes = await query(
      `SELECT 
        ex.id,
        ex.titre,
        ex.duree_minutes,
        ex.date_debut,
        ex.date_fin,
        ex.est_actif,
        m.nom AS matiere,
        c.nom AS classe,
        en.id AS enseignement_id,
        COUNT(DISTINCT q.id) AS nb_questions,
        SUM(q.points) AS total_points,
        COUNT(DISTINCT r.eleve_id) AS nb_eleves_passes
       FROM public.examens ex
       JOIN public.enseignements en ON en.id = ex.enseignement_id
       JOIN public.matieres m ON m.id = en.matiere_id
       JOIN public.classes c ON c.id = en.classe_id
       LEFT JOIN public.questions_qcm q ON q.examen_id = ex.id
       LEFT JOIN public.reponses_eleves_qcm r ON r.examen_id = ex.id
       WHERE en.enseignant_id = $1
       GROUP BY ex.id, ex.titre, ex.duree_minutes, ex.date_debut, ex.date_fin,
                ex.est_actif, m.nom, c.nom, en.id
       ORDER BY ex.date_debut DESC NULLS LAST`,
      [personnelId]
    );

    return NextResponse.json({ examens: examensRes.rows });
  } catch (error: any) {
    console.error("API /enseignant/examens GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { enseignement_id, titre, duree_minutes, date_debut, date_fin, questions } = body;

    if (!enseignement_id || !titre) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Vérifier que l'enseignement appartient à cet enseignant
    const ensRes = await query(
      "SELECT id FROM public.enseignements WHERE id = $1 AND enseignant_id = $2",
      [enseignement_id, personnelId]
    );
    if (ensRes.rows.length === 0) {
      return NextResponse.json({ error: "Enseignement non trouvé" }, { status: 404 });
    }

    // Créer l'examen
    const examenRes = await query(
      `INSERT INTO public.examens (enseignement_id, titre, duree_minutes, date_debut, date_fin, est_actif)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [enseignement_id, titre, duree_minutes || 30, date_debut || null, date_fin || null]
    );

    const examenId = examenRes.rows[0].id;

    // Créer les questions et options si fournies
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionRes = await query(
          `INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [examenId, q.question, q.points || 1, i + 1]
        );
        const questionId = questionRes.rows[0].id;

        if (q.options && Array.isArray(q.options)) {
          for (const opt of q.options) {
            await query(
              `INSERT INTO public.options_qcm (question_id, option_texte, est_correcte)
               VALUES ($1, $2, $3)`,
              [questionId, opt.texte, opt.est_correcte || false]
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, examen_id: examenId }, { status: 201 });
  } catch (error: any) {
    console.error("API /enseignant/examens POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
