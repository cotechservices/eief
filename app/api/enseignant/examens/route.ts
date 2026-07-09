//app\api\enseignant\examens\route.ts
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

    // ⭐ Vérifier si la table examens_eleves existe
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'examens_eleves'
      )`
    );
    const tableExists = tableCheck.rows[0]?.exists || false;

    let examensRes;

    if (tableExists) {
      examensRes = await query(
        `SELECT 
          ex.id,
          ex.titre,
          ex.duree_minutes,
          ex.date_debut,
          ex.date_fin,
          ex.est_actif,
          ex.fichier_url,  -- ⭐ Ajouté
          '' AS matiere,
          c.nom AS classe,
          c.id AS classe_id,
          en.id AS enseignement_id,
          COUNT(DISTINCT q.id) AS nb_questions,
          COALESCE(SUM(q.points), 0) AS total_points,
          COALESCE(
            (SELECT COUNT(DISTINCT ee.eleve_id)
             FROM public.examens_eleves ee
             WHERE ee.examen_id = ex.id),
            0
          ) AS nb_eleves_passes
        FROM public.examens ex
        JOIN public.enseignements en ON en.id = ex.enseignement_id
        JOIN public.classes c ON c.id = en.classe_id
        LEFT JOIN public.questions_qcm q ON q.examen_id = ex.id
        WHERE en.enseignant_id = $1
          AND en.annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE est_active = true)
        GROUP BY ex.id, ex.titre, ex.duree_minutes, ex.date_debut, ex.date_fin,
                 ex.est_actif, ex.fichier_url, c.nom, c.id, en.id
        ORDER BY ex.date_debut DESC NULLS LAST`,
        [personnelId]
      );
    } else {
      examensRes = await query(
        `SELECT 
          ex.id,
          ex.titre,
          ex.duree_minutes,
          ex.date_debut,
          ex.date_fin,
          ex.est_actif,
          ex.fichier_url,  -- ⭐ Ajouté
          '' AS matiere,
          c.nom AS classe,
          c.id AS classe_id,
          en.id AS enseignement_id,
          COUNT(DISTINCT q.id) AS nb_questions,
          COALESCE(SUM(q.points), 0) AS total_points,
          0 AS nb_eleves_passes
        FROM public.examens ex
        JOIN public.enseignements en ON en.id = ex.enseignement_id
        JOIN public.classes c ON c.id = en.classe_id
        LEFT JOIN public.questions_qcm q ON q.examen_id = ex.id
        WHERE en.enseignant_id = $1
          AND en.annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE est_active = true)
        GROUP BY ex.id, ex.titre, ex.duree_minutes, ex.date_debut, ex.date_fin,
                 ex.est_actif, ex.fichier_url, c.nom, c.id, en.id
        ORDER BY ex.date_debut DESC NULLS LAST`,
        [personnelId]
      );
    }

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
    // ⭐ Ajout de fichier_url
    const { enseignement_id, titre, duree_minutes, date_debut, date_fin, fichier_url, eleves_ids, questions } = body;

    // Validation des champs requis
    if (!enseignement_id || !titre) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!eleves_ids || !Array.isArray(eleves_ids) || eleves_ids.length === 0) {
      return NextResponse.json({ error: "Veuillez sélectionner au moins un élève" }, { status: 400 });
    }

    // Vérifier que l'enseignement appartient à cet enseignant
    const ensRes = await query(
      "SELECT id FROM public.enseignements WHERE id = $1 AND enseignant_id = $2",
      [enseignement_id, personnelId]
    );
    if (ensRes.rows.length === 0) {
      return NextResponse.json({ error: "Enseignement non trouvé" }, { status: 404 });
    }

    // ⭐ Créer l'examen avec fichier_url
    const examenRes = await query(
      `INSERT INTO public.examens (enseignement_id, titre, duree_minutes, date_debut, date_fin, est_actif, fichier_url)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING id`,
      [enseignement_id, titre, duree_minutes || 30, date_debut || null, date_fin || null, fichier_url || null]
    );

    const examenId = examenRes.rows[0].id;

    // ⭐ Vérifier si la table examens_eleves existe
    const tableCheck = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'examens_eleves'
      )`
    );
    const tableExists = tableCheck.rows[0]?.exists || false;

    // ⭐ Associer les élèves sélectionnés à l'examen
    if (tableExists && eleves_ids.length > 0) {
      for (const eleveId of eleves_ids) {
        await query(
          `INSERT INTO public.examens_eleves (examen_id, eleve_id)
           VALUES ($1, $2)
           ON CONFLICT (examen_id, eleve_id) DO NOTHING`,
          [examenId, eleveId]
        );
      }
    } else if (!tableExists) {
      console.warn("⚠️ La table examens_eleves n'existe pas. Les élèves ne sont pas associés.");
    }

    // ⭐ Créer les questions et options si fournies
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (!q.question || q.question.trim() === "") continue;
        
        const questionRes = await query(
          `INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [examenId, q.question.trim(), q.points || 1, i + 1]
        );
        const questionId = questionRes.rows[0].id;

        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          for (const opt of q.options) {
            if (!opt.texte || opt.texte.trim() === "") continue;
            
            await query(
              `INSERT INTO public.options_qcm (question_id, option_texte, est_correcte)
               VALUES ($1, $2, $3)`,
              [questionId, opt.texte.trim(), opt.est_correcte || false]
            );
          }
        }
      }
    }

    const message = tableExists 
      ? `Évaluation créée avec succès pour ${eleves_ids.length} élève${eleves_ids.length > 1 ? 's' : ''}`
      : "Évaluation créée avec succès (mais les élèves n'ont pas été associés car la table examens_eleves n'existe pas)";

    return NextResponse.json({ 
      success: true, 
      examen_id: examenId,
      message
    }, { status: 201 });
  } catch (error: any) {
    console.error("API /enseignant/examens POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}