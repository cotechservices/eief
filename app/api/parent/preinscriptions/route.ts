// app/api/parent/preinscriptions/route.ts
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

    const result = await query(`
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.date_naissance,
        p.lieu_naissance,
        p.sexe,
        p.niveau,
        p.classe,
        p.statut,
        p.date_preinscription,
        p.frais_statut,
        p.photo_url,
        p.acte_naissance_url,
        p.bulletin_url,
        -- ⭐ INSCRIPTION - Montant depuis la table classes
        COALESCE(c.total_versement, c.frais_inscription, 0) as frais_montant,
        -- ⭐ TRANSPORT - Montant total du transport pour cette préinscription
        COALESCE(
          (SELECT SUM(pt.prix)
           FROM preinscription_transport pt
           WHERE pt.preinscription_id = p.id),
          0
        ) as transport_montant,
        -- ⭐ CANTINE - Montant total de la cantine pour cette préinscription (prix annuel)
        COALESCE(
          (SELECT SUM(cm.prix_annuel)
           FROM preinscription_cantine pc
           JOIN cantine_menus cm ON pc.menu_id = cm.id
           WHERE pc.preinscription_id = p.id),
          0
        ) as cantine_montant,
        -- ⭐ FOURNITURES - Montant total des fournitures pour cette préinscription
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           WHERE cf.preinscription_id = p.id),
          0
        ) as fournitures_montant,
        -- ⭐ SCOLARITE - Déjà incluse dans le montant de l'inscription (total_versement)
        -- On ne l'ajoute pas séparément pour éviter le double comptage
        0 as scolarite_montant,
        -- ⭐ TOTAL DES FRAIS POUR CETTE PRÉINSCRIPTION
        COALESCE(c.total_versement, c.frais_inscription, 0) + 
        COALESCE(
          (SELECT SUM(pt.prix)
           FROM preinscription_transport pt
           WHERE pt.preinscription_id = p.id),
          0
        ) +
        COALESCE(
          (SELECT SUM(cm.prix_annuel)
           FROM preinscription_cantine pc
           JOIN cantine_menus cm ON pc.menu_id = cm.id
           WHERE pc.preinscription_id = p.id),
          0
        ) +
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           WHERE cf.preinscription_id = p.id),
          0
        ) as montant_total
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
      WHERE u.email = $1
      ORDER BY p.date_preinscription DESC
    `, [userEmail]);

    // ⭐ Ajouter les montants des services pour chaque pré-inscription dans la réponse
    const rows = result.rows.map(row => ({
      ...row,
      frais_montant: Number(row.frais_montant) || 0,
      transport_montant: Number(row.transport_montant) || 0,
      cantine_montant: Number(row.cantine_montant) || 0,
      fournitures_montant: Number(row.fournitures_montant) || 0,
      montant_total: Number(row.montant_total) || 0
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}