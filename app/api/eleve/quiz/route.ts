//app/api/eleve/quiz/route.ts
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
      "SELECT id, classe_id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;
    const classeId = eleveRes.rows[0].classe_id;

    // ⭐ Récupérer les quiz disponibles pour la classe de l'élève
    const quizRes = await query(
      `SELECT 
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
        c.id as categorie_id,
        c.nom as categorie_nom,
        c.couleur as categorie_couleur,
        c.icon as categorie_icon,
        COUNT(DISTINCT qq.question_id) AS nb_questions,
        COALESCE(SUM(qq.points_personnalises), 0) AS total_points,
        CASE 
          WHEN p.id IS NOT NULL AND p.est_termine = true THEN 'termine'
          WHEN p.id IS NOT NULL AND p.est_termine = false THEN 'en_cours'
          ELSE 'non_commence'
        END AS statut,
        p.id as participation_id,
        p.points_obtenus,
        p.pourcentage,
        p.est_termine
      FROM public.quiz q
      JOIN public.quiz_questions qq ON qq.quiz_id = q.id
      JOIN public.questions_quiz qs ON qs.id = qq.question_id
      JOIN public.categories_quiz c ON c.id = qs.categorie_id
      LEFT JOIN public.participations_quiz p 
        ON p.quiz_id = q.id AND p.eleve_id = $1
      WHERE q.est_actif = true
        AND (q.date_debut IS NULL OR q.date_debut <= NOW())
        AND (q.date_fin IS NULL OR q.date_fin >= NOW())
        AND q.enseignement_id IN (
          SELECT en.id 
          FROM public.enseignements en
          WHERE en.classe_id = $2
            AND en.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
        )
      GROUP BY q.id, q.titre, q.description, q.type, q.duree_minutes, q.est_actif,
               q.date_debut, q.date_fin, q.est_aleatoire, q.afficher_resultats,
               q.fichier_url, c.id, c.nom, c.couleur, c.icon,
               p.id, p.points_obtenus, p.pourcentage, p.est_termine
      ORDER BY q.date_debut DESC NULLS LAST, q.created_at DESC`,
      [eleveId, classeId]
    );

    return NextResponse.json({ quiz: quizRes.rows });
  } catch (error: any) {
    console.error("API /eleve/quiz GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}