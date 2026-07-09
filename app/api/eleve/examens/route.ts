import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;

    // ⭐ Récupérer UNIQUEMENT les examens associés à l'élève via examens_eleves
    const examensRes = await query(
      `SELECT 
        ex.id,
        ex.titre,
        ex.duree_minutes,
        ex.date_debut,
        ex.date_fin,
        ex.est_actif,
        ex.fichier_url,  -- ⭐ Ajouté
        COALESCE(m.nom, 'Sans matière') AS matiere,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant,
        COUNT(DISTINCT q.id) AS nb_questions,
        COALESCE(SUM(q.points), 0) AS total_points,
        COUNT(DISTINCT r.id) AS nb_reponses_eleve
      FROM public.examens ex
      INNER JOIN public.examens_eleves ee ON ee.examen_id = ex.id AND ee.eleve_id = $1
      JOIN public.enseignements en ON en.id = ex.enseignement_id
      LEFT JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      LEFT JOIN public.questions_qcm q ON q.examen_id = ex.id
      LEFT JOIN public.reponses_eleves_qcm r 
        ON r.examen_id = ex.id AND r.eleve_id = $1
      WHERE ex.est_actif = true
        AND (ex.date_debut IS NULL OR ex.date_debut <= NOW())
        AND (ex.date_fin IS NULL OR ex.date_fin >= NOW())
      GROUP BY ex.id, ex.titre, ex.duree_minutes, ex.date_debut, ex.date_fin, 
               ex.est_actif, ex.fichier_url, m.nom, u.prenom, u.nom
      ORDER BY ex.date_debut DESC NULLS LAST`,
      [eleveId]
    );

    const examens = examensRes.rows.map((e) => ({
      ...e,
      deja_passe: parseInt(e.nb_reponses_eleve) > 0,
      nb_questions: parseInt(e.nb_questions) || 0,
      total_points: parseInt(e.total_points) || 0,
    }));

    return NextResponse.json({ examens });
  } catch (error: any) {
    console.error("API /eleve/examens error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}