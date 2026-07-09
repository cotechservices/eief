//app\api\enseignant\profil\route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur non trouvé" }, { status: 400 });
    }

    // 1. Récupérer le profil de l'enseignant
    const profilResult = await query(`
      SELECT 
        u.id as utilisateur_id,
        u.prenom,
        u.nom,
        u.email,
        p.id as personnel_id,
        p.statut,
        p.type,
        p.matricule_personnel
      FROM public.utilisateurs u
      JOIN public.personnels p ON p.utilisateur_id = u.id
      WHERE u.id = $1 AND u.role = 'ENSEIGNANT'
    `, [userId]);

    if (profilResult.rows.length === 0) {
      return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });
    }

    const profil = profilResult.rows[0];
    const enseignantId = profil.personnel_id;

    // 2. Récupérer les enseignements avec les détails des classes
    const enseignementsResult = await query(`
      SELECT 
        e.id as enseignement_id,
        e.classe_id,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        COALESCE(m.nom, 'Non défini') as matiere_nom,
        (
          SELECT COUNT(DISTINCT ele.id) 
          FROM public.eleves ele
          WHERE ele.classe_id = c.id 
            AND ele.est_inscrit = true
        ) as nb_eleves
      FROM public.enseignements e
      JOIN public.classes c ON e.classe_id = c.id
      LEFT JOIN public.matieres m ON e.matiere_id = m.id
      WHERE e.enseignant_id = $1
        AND e.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
      ORDER BY c.niveau, c.nom
    `, [enseignantId]);

    // 3. Récupérer les stats globales
    const statsResult = await query(`
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM public.devoirs d 
           JOIN public.enseignements e ON d.enseignement_id = e.id
           WHERE e.enseignant_id = $1
          ), 0
        ) as total_devoirs,
        COALESCE(
          (SELECT COUNT(*) FROM public.soumissions_devoirs sd
           JOIN public.devoirs d ON sd.devoir_id = d.id
           JOIN public.enseignements e ON d.enseignement_id = e.id
           WHERE e.enseignant_id = $1
           AND sd.note IS NULL
          ), 0
        ) as soumissions_a_noter,
        COALESCE(
          (SELECT COUNT(DISTINCT ele.id)
           FROM public.eleves ele
           JOIN public.classes c ON c.id = ele.classe_id
           JOIN public.enseignements e ON e.classe_id = c.id
           WHERE e.enseignant_id = $1
             AND ele.est_inscrit = true
             AND e.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
          ), 0
        ) as total_eleves,
        COALESCE(
          (SELECT COUNT(DISTINCT c.id)
           FROM public.enseignements e
           JOIN public.classes c ON e.classe_id = c.id
           WHERE e.enseignant_id = $1
             AND e.annee_scolaire_id = (SELECT id FROM public.annees_scolaires WHERE est_active = true)
          ), 0
        ) as total_classes
    `, [enseignantId]);

    // 4. Retourner les données
    return NextResponse.json({
      profil,
      enseignements: enseignementsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error("Erreur GET profil enseignant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}