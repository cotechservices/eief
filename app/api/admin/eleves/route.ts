// app/api/admin/eleves/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
    SELECT 
      e.id,
      e.matricule,
      e.date_naissance,
      e.lieu_naissance,
      e.sexe,
      COALESCE(e.photo_url, pre.photo_url) as photo_url,
      e.date_inscription,
      u.nom as enfant_nom,
      u.prenom as enfant_prenom,
      c.nom as classe_nom,
      c.niveau,
      c.frais_inscription as frais_montant,
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
      END as statut,
      -- Transport
      EXISTS (
        SELECT 1 FROM inscriptions_transport it 
        WHERE it.eleve_id = e.id AND it.est_actif = true
      ) as transport_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'transport' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as transport_statut,
      -- Cantine
      EXISTS (
        SELECT 1 FROM inscriptions_cantine ic 
        WHERE ic.eleve_id = e.id AND ic.est_actif = true
      ) as cantine_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'cantine' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as cantine_statut,
      -- Bibliothèque
      EXISTS (
        SELECT 1 FROM emprunts_bibliotheque eb 
        WHERE eb.eleve_id = e.id AND eb.statut = 'en_cours'
      ) as bibliotheque_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'bibliotheque' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as bibliotheque_statut
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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}