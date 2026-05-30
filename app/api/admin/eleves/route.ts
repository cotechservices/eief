// app/api/admin/eleves/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
    SELECT 
      e.id,
      e.matricule,
      e.date_naissance,
      e.lieu_naissance,
      e.sexe,
      COALESCE(e.photo_url, pre.photo_url) as photo_url,  -- Priorité à la photo de l'élève, sinon celle de la pré-inscription
      e.date_inscription,
      u.nom as enfant_nom,
      u.prenom as enfant_prenom,
      c.nom as classe_nom,
      c.niveau,
      pu.nom as parent_nom,
      pu.prenom as parent_prenom,
      pu.email as parent_email,
      pu.telephone as parent_telephone,
      COALESCE(pre.frais_statut, 'non_paye') as frais_statut,
      pre.frais_mode_paiement,
      pre.numero_dossier,
      CASE 
        WHEN e.est_inscrit = true THEN 'actif'
        ELSE 'inactif'
      END as statut
    FROM eleves e
    JOIN utilisateurs u ON e.utilisateur_id = u.id
    LEFT JOIN classes c ON e.classe_id = c.id
    LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
    LEFT JOIN parents p ON lpe.parent_id = p.id
    LEFT JOIN utilisateurs pu ON p.utilisateur_id = pu.id
    LEFT JOIN preinscriptions pre ON pre.parent_id = p.id AND pre.enfant_nom = u.nom AND pre.enfant_prenom = u.prenom
    WHERE e.est_inscrit = true
    ORDER BY e.id DESC
  `);

    // Ajouter console.log pour debug
    console.log("Nombre d'élèves:", result.rows.length);
    console.log("Premier élève:", result.rows[0]?.photo_url);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}