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
        COALESCE(c.frais_inscription, 500000) as frais_montant,
        -- ⭐ TRANSPORT - Montant total du transport pour cette préinscription
        COALESCE(
          (SELECT SUM(lt.prix_abonnement)
           FROM preinscription_transport pt
           JOIN lignes_transport lt ON pt.ligne_id = lt.id
           WHERE pt.preinscription_id = p.id),
          0
        ) as transport_montant,
        -- ⭐ CANTINE - Montant total de la cantine pour cette préinscription
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
        -- ⭐ SCOLARITE - Montant total de la scolarité pour cette préinscription
        COALESCE(
          (SELECT SUM(f.montant) 
           FROM frais_scolaires f
           WHERE f.type_frais = 'mensualite' 
             AND f.annee_scolaire_id = (
               SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
             )),
          0
        ) as scolarite_montant,
        -- ⭐ TOTAL DES FRAIS POUR CETTE PRÉINSCRIPTION
        COALESCE(c.frais_inscription, 500000) + 
        COALESCE(
          (SELECT SUM(lt.prix_abonnement)
           FROM preinscription_transport pt
           JOIN lignes_transport lt ON pt.ligne_id = lt.id
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
        ) +
        COALESCE(
          (SELECT SUM(f.montant) 
           FROM frais_scolaires f
           WHERE f.type_frais = 'mensualite' 
             AND f.annee_scolaire_id = (
               SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
             )),
          0
        ) as montant_total
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
      WHERE u.email = $1
      ORDER BY p.date_preinscription DESC
    `, [userEmail]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}