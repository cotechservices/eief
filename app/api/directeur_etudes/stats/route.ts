import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DIRECTEUR_ETUDES") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Classes
    const classesRes = await query(`SELECT COUNT(*) as count FROM classes`);
    
    // Notes saisies
    const notesRes = await query(`SELECT COUNT(*) as count FROM notes`);
    
    // Élèves inscrits
    const elevesRes = await query(`SELECT COUNT(*) as count FROM eleves WHERE est_inscrit = true`);
    
    // Élèves avec au moins une note
    const bulletinsRes = await query(`SELECT COUNT(DISTINCT eleve_id) as count FROM notes`);

    // Dernières notes saisies
    const recentNotesRes = await query(`
      SELECT 
        n.id,
        n.valeur,
        n.coefficient,
        n.type_note,
        n.date_saisie,
        u_eleve.prenom AS eleve_prenom,
        u_eleve.nom AS eleve_nom,
        COALESCE(e.photo_url, u_eleve.photo_url) AS eleve_photo_url,
        c.nom AS classe_nom,
        COALESCE(m.nom, 'Général') AS matiere_nom
      FROM notes n
      JOIN eleves e ON e.id = n.eleve_id
      JOIN utilisateurs u_eleve ON u_eleve.id = e.utilisateur_id
      LEFT JOIN classes c ON c.id = e.classe_id
      LEFT JOIN enseignements en ON en.id = n.enseignement_id
      LEFT JOIN matieres m ON m.id = en.matiere_id
      ORDER BY n.date_saisie DESC
      LIMIT 5
    `);

    // Vue d'ensemble des classes
    const classesOverviewRes = await query(`
      SELECT 
        c.id,
        c.nom,
        c.niveau,
        COUNT(DISTINCT e.id) as total_eleves,
        COUNT(DISTINCT n.id) as total_notes
      FROM classes c
      LEFT JOIN eleves e ON e.classe_id = c.id AND e.est_inscrit = true
      LEFT JOIN enseignements en ON en.classe_id = c.id
      LEFT JOIN notes n ON n.enseignement_id = en.id
      GROUP BY c.id, c.nom, c.niveau
      ORDER BY c.niveau, c.nom
      LIMIT 6
    `);

    return NextResponse.json({
      classesActives: parseInt(classesRes.rows[0]?.count || "0"),
      notesSaisies: parseInt(notesRes.rows[0]?.count || "0"),
      elevesInscrits: parseInt(elevesRes.rows[0]?.count || "0"),
      elevesEvalues: parseInt(bulletinsRes.rows[0]?.count || "0"),
      recentNotes: recentNotesRes.rows || [],
      classesOverview: classesOverviewRes.rows || []
    });

  } catch (error: any) {
    console.error("API /directeur_etudes/stats GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
