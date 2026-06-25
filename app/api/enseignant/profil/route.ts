// app/api/enseignant/profil/route.ts
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

    // Profil enseignant
    const enseignantRes = await query(
      `SELECT 
        p.id, p.matricule_personnel, p.type, p.date_embauche, p.statut, p.departement,
        u.prenom, u.nom, u.email, u.telephone, u.photo_url
       FROM public.personnels p
       JOIN public.utilisateurs u ON u.id = p.utilisateur_id
       WHERE u.id = $1 AND p.type = 'enseignant'`,
      [userId]
    );

    if (enseignantRes.rows.length === 0) {
      return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 });
    }
    const enseignant = enseignantRes.rows[0];

    // Ses enseignements (classe + matière)
    const enseignementsRes = await query(
      `SELECT 
        en.id AS enseignement_id,
        c.id AS classe_id,
        c.nom AS classe_nom,
        c.niveau,
        c.salle,
        m.id AS matiere_id,
        m.nom AS matiere_nom,
        m.coefficient,
        en.heures_semaine,
        an.libelle AS annee_scolaire,
        COUNT(DISTINCT e.id) AS nb_eleves
       FROM public.enseignements en
       JOIN public.classes c ON c.id = en.classe_id
       JOIN public.matieres m ON m.id = en.matiere_id
       JOIN public.annees_scolaires an ON an.id = en.annee_scolaire_id
       LEFT JOIN public.eleves e ON e.classe_id = c.id AND e.est_inscrit = true
       WHERE en.enseignant_id = $1
         AND an.est_active = true
       GROUP BY en.id, c.id, c.nom, c.niveau, c.salle, m.id, m.nom, m.coefficient,
                en.heures_semaine, an.libelle
       ORDER BY c.nom, m.nom`,
      [enseignant.id]
    );

    // Stats globales
    const statsRes = await query(
      `SELECT 
        COUNT(DISTINCT d.id) AS total_devoirs,
        COUNT(DISTINCT sd.id) FILTER (WHERE sd.note IS NULL) AS soumissions_a_noter,
        COUNT(DISTINCT ex.id) AS total_examens
       FROM public.enseignements en
       LEFT JOIN public.devoirs d ON d.enseignement_id = en.id
       LEFT JOIN public.soumissions_devoirs sd ON sd.devoir_id = d.id
       LEFT JOIN public.examens ex ON ex.enseignement_id = en.id
       WHERE en.enseignant_id = $1`,
      [enseignant.id]
    );

    return NextResponse.json({
      profil: enseignant,
      enseignements: enseignementsRes.rows,
      stats: statsRes.rows[0],
    });
  } catch (error: any) {
    console.error("API /enseignant/profil error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
