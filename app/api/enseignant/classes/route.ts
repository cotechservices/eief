//app\api\enseignant\classes\route.ts
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

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 400 });
    }

    // Récupérer l'ID du personnel (enseignant)
    const personnelResult = await query(`
      SELECT p.id 
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1 AND p.type = 'enseignant'
    `, [userEmail]);

    if (personnelResult.rows.length === 0) {
      return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });
    }

    const enseignantId = personnelResult.rows[0].id;

    // Récupérer les classes assignées à cet enseignant
    const classesResult = await query(`
      SELECT 
        c.id,
        c.nom,
        c.niveau,
        (
          SELECT COUNT(*) 
          FROM eleves e 
          WHERE e.classe_id = c.id AND e.est_inscrit = true
        ) as effectif,
        COALESCE(e.heures_semaine, 0) as "heuresSemaine",
        ROUND(
          COALESCE(
            (
              SELECT AVG(presence_percent) 
              FROM (
                SELECT 
                  COUNT(CASE WHEN statut = 'present' THEN 1 END) * 100.0 / COUNT(*) as presence_percent
                FROM presences pr
                WHERE pr.eleve_id IN (SELECT id FROM eleves WHERE classe_id = c.id)
                GROUP BY pr.eleve_id
              ) t
            ), 
            0
          )
        ) as presence,
        ROUND(
          COALESCE(
            (
              SELECT AVG(n.valeur) 
              FROM notes n
              JOIN eleves e2 ON n.eleve_id = e2.id
              WHERE e2.classe_id = c.id
            ), 
            0
          ), 
          1
        ) as moyenne,
        ARRAY_AGG(DISTINCT m.nom) as matieres
      FROM classes c
      JOIN enseignements e ON e.classe_id = c.id
      LEFT JOIN matieres m ON e.matiere_id = m.id
      WHERE e.enseignant_id = $1
        AND e.annee_scolaire_id = (
          SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
        )
      GROUP BY c.id, c.nom, c.niveau, e.heures_semaine
      ORDER BY c.niveau, c.nom
    `, [enseignantId]);

    return NextResponse.json(classesResult.rows);
  } catch (error) {
    console.error("Erreur GET classes enseignant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}