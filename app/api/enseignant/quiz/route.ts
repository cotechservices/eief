//app/api/enseignant/quiz/route.ts
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
    const searchParams = req.nextUrl.searchParams;
    const classeId = searchParams.get("classe_id");

    // Récupérer l'ID du personnel (enseignant)
    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    // ⭐ COMME POUR LES EXAMENS ET DEVOIRS : Filtrer par enseignant
    let sql = `
      SELECT 
        q.id,
        q.titre,
        q.description,
        q.type,
        q.duree_minutes,
        q.est_actif,
        q.date_debut,
        q.date_fin,
        q.est_aleatoire,
        q.afficher_resultats,
        q.fichier_url,
        q.created_at,
        q.enseignement_id,
        c.id as classe_id,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        COALESCE(m.nom, 'Sans matière') AS matiere,
        COUNT(DISTINCT qq.question_id) AS nb_questions,
        COUNT(DISTINCT p.id) AS nb_participations,
        COALESCE(AVG(p.pourcentage), 0) AS moyenne_participations
      FROM public.quiz q
      JOIN public.enseignements en ON en.id = q.enseignement_id
      JOIN public.classes c ON c.id = en.classe_id
      LEFT JOIN public.matieres m ON m.id = en.matiere_id
      LEFT JOIN public.quiz_questions qq ON qq.quiz_id = q.id
      LEFT JOIN public.participations_quiz p ON p.quiz_id = q.id
      WHERE en.enseignant_id = $1  -- ⭐ COMME POUR EXAMENS ET DEVOIRS
        AND en.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
    `;

    const params: any[] = [personnelId];
    let paramIndex = 2;

    // Filtre par classe (optionnel)
    if (classeId) {
      sql += ` AND c.id = $${paramIndex}`;
      params.push(parseInt(classeId));
      paramIndex++;
    }

    sql += `
      GROUP BY q.id, q.titre, q.description, q.type, q.duree_minutes, 
               q.est_actif, q.date_debut, q.date_fin, q.est_aleatoire,
               q.afficher_resultats, q.fichier_url, q.created_at,
               q.enseignement_id, c.id, c.nom, c.niveau, m.nom
      ORDER BY q.created_at DESC
    `;

    const result = await query(sql, params);

    return NextResponse.json({ quiz: result.rows });
  } catch (error: any) {
    console.error("API /enseignant/quiz GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}