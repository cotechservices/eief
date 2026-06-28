// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;

    // ========== STATISTIQUES GÉNÉRALES (pour tous) ==========
    const eleves = await query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END) as hommes,
             SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END) as femmes
      FROM eleves WHERE est_inscrit = true
    `);

    const enseignants = await query("SELECT COUNT(*) as total FROM personnels WHERE type = 'enseignant'");
    const classes = await query("SELECT COUNT(*) as total FROM classes");
    const parents = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'PARENT'");
    const preinscriptions = await query("SELECT COUNT(*) as total FROM preinscriptions WHERE statut = 'en_attente'");

    // ========== STATISTIQUES FINANCIÈRES ==========

    // ⭐⭐⭐ 1. TOTAL RECETTES (Paiements validés) ⭐⭐⭐
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_recettes
      FROM paiements
      WHERE statut IN ('valide', 'paye')
    `);
    const totalRecettes = Number(recettesResult.rows[0]?.total_recettes) || 0;

    // ⭐⭐⭐ 2. TOTAL DÉPENSES (SALAIRES + AUTRES DÉPENSES) ⭐⭐⭐
    // ✅ Correction : On additionne les salaires (paiements_salaires) et les autres dépenses (depenses)
    const depensesResult = await query(`
      SELECT
        COALESCE(
          (SELECT SUM(montant) FROM paiements_salaires WHERE statut = 'paye'),
          0
        ) +
        COALESCE(
          (SELECT SUM(montant) FROM depenses WHERE statut = 'valide'),
          0
        ) as total_depenses
    `);
    const totalDepenses = Number(depensesResult.rows[0]?.total_depenses) || 0;

    // ⭐⭐⭐ 3. TOTAL À PAYER (TOUTES LES PRÉ-INSCRIPTIONS) ⭐⭐⭐
    const totalAPayerResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total_a_payer
      FROM preinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalAPayer = Number(totalAPayerResult.rows[0]?.total_a_payer) || 0;

    // ⭐⭐⭐ 4. TOTAL PAYÉ (par pré-inscription) ⭐⭐⭐
    const totalPayeResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND preinscription_id IS NOT NULL
    `);
    const totalPaye = Number(totalPayeResult.rows[0]?.total_paye) || 0;

    // ⭐⭐⭐ 5. SOLDE RESTANT = TOTAL À PAYER - TOTAL PAYÉ ⭐⭐⭐
    const soldeRestant = Math.max(0, totalAPayer - totalPaye);

    // ⭐⭐⭐ 6. TAUX DE RECOUVREMENT ⭐⭐⭐
    const tauxRecouvrement = totalAPayer > 0 ? Math.round((totalPaye / totalAPayer) * 100) : 0;

    // ⭐⭐⭐ 7. DÉTAIL PAR CATÉGORIE ⭐⭐⭐
    const inscriptionResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total
      FROM preinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalInscription = Number(inscriptionResult.rows[0]?.total) || 0;

    const transportResult = await query(`
      SELECT COALESCE(SUM(pt.prix), 0) as total_transport
      FROM preinscriptions p
      JOIN preinscription_transport pt ON pt.preinscription_id = p.id
      WHERE p.statut IN ('en_attente', 'valide')
    `);
    const totalTransport = Number(transportResult.rows[0]?.total_transport) || 0;

    const cantineResult = await query(`
      SELECT COALESCE(SUM(pc.prix), 0) as total_cantine
      FROM preinscriptions p
      JOIN preinscription_cantine pc ON pc.preinscription_id = p.id
      WHERE p.statut IN ('en_attente', 'valide')
    `);
    const totalCantine = Number(cantineResult.rows[0]?.total_cantine) || 0;

    const fournituresResult = await query(`
      SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total_fournitures
      FROM preinscriptions p
      JOIN commandes_fournitures cf ON cf.preinscription_id = p.id
      WHERE p.statut IN ('en_attente', 'valide')
    `);
    const totalFournitures = Number(fournituresResult.rows[0]?.total_fournitures) || 0;

    const scolariteResult = await query(`
      SELECT COALESCE(SUM(f.montant), 0) as total_scolarite
      FROM frais_scolaires f
      WHERE f.type_frais = 'mensualite'
        AND f.annee_scolaire_id = (
          SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
        )
    `);
    const totalScolarite = Number(scolariteResult.rows[0]?.total_scolarite) || 0;

    // ⭐⭐⭐ 8. SOLDE RESTANT DÉTAILLÉ PAR PRÉ-INSCRIPTION ⭐⭐⭐
    const soldeParPreinscription = await query(`
      SELECT
        p.id,
        p.enfant_prenom || ' ' || p.enfant_nom as enfant,
        p.montant_total_plan,
        COALESCE(SUM(pa.montant), 0) as total_paye,
        GREATEST(0, p.montant_total_plan - COALESCE(SUM(pa.montant), 0)) as solde_restant
      FROM preinscriptions p
      LEFT JOIN paiements pa ON pa.preinscription_id = p.id AND pa.statut IN ('valide', 'paye')
      WHERE p.statut IN ('en_attente', 'valide')
      GROUP BY p.id, p.enfant_prenom, p.enfant_nom, p.montant_total_plan
      HAVING GREATEST(0, p.montant_total_plan - COALESCE(SUM(pa.montant), 0)) > 0
    `);

    console.log("📊 DASHBOARD FINANCIER:", {
      totalAPayer,
      totalPaye,
      soldeRestant,
      tauxRecouvrement,
      totalDepenses,
      soldeParPreinscription: soldeParPreinscription.rows
    });

    // Derniers paiements
    const derniersPaiements = await query(`
      SELECT
        pa.id,
        p.enfant_prenom || ' ' || p.enfant_nom as eleve,
        p.classe as classe,
        pa.montant,
        pa.type_frais as type,
        pa.date_paiement as date,
        pa.mode_paiement as mode,
        pa.statut
      FROM paiements pa
      JOIN preinscriptions p ON pa.preinscription_id = p.id
      WHERE pa.statut IN ('valide', 'paye')
      ORDER BY pa.date_paiement DESC
      LIMIT 10
    `);

    // Paiements par type
    const paiementsParType = await query(`
      SELECT
        CASE
          WHEN type_frais = 'inscription' THEN 'Inscription'
          WHEN type_frais = 'mensualite' THEN 'Mensualité'
          WHEN type_frais = 'cantine' THEN 'Cantine'
          WHEN type_frais = 'transport' THEN 'Transport'
          WHEN type_frais = 'librairie' THEN 'Fournitures'
          ELSE 'Autre'
        END as name,
        COALESCE(SUM(montant), 0) as montant
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND preinscription_id IS NOT NULL
      GROUP BY type_frais
    `);

    const totalRecettesCat = paiementsParType.rows.reduce((acc, row) => acc + Number(row.montant), 0);
    const categoriesRecettes = paiementsParType.rows.map((cat: any) => ({
      name: cat.name,
      montant: Number(cat.montant),
      pourcentage: totalRecettesCat > 0 ? Math.round((Number(cat.montant) / totalRecettesCat) * 100) : 0
    }));

    // Évolution mensuelle
    const evolution = await query(`
      SELECT
        TO_CHAR(date_paiement, 'Mon') as mois,
        COALESCE(SUM(montant), 0) as recettes,
        0 as depenses
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND preinscription_id IS NOT NULL
        AND date_paiement >= NOW() - INTERVAL '6 months'
      GROUP BY EXTRACT(MONTH FROM date_paiement), TO_CHAR(date_paiement, 'Mon')
      ORDER BY EXTRACT(MONTH FROM date_paiement) DESC
      LIMIT 6
    `);

    // ⭐ Correction du solde : recettes - dépenses (incluant les salaires)
    const solde = totalRecettes - totalDepenses;

    return NextResponse.json({
      general: {
        totalEleves: parseInt(eleves.rows[0]?.total || 0),
        totalEnseignants: parseInt(enseignants.rows[0]?.total || 0),
        totalClasses: parseInt(classes.rows[0]?.total || 0),
        totalParents: parseInt(parents.rows[0]?.total || 0),
        preinscriptionsEnAttente: parseInt(preinscriptions.rows[0]?.total || 0),
        hommes: parseInt(eleves.rows[0]?.hommes || 0),
        femmes: parseInt(eleves.rows[0]?.femmes || 0),
        totalPaiementsAnnee: totalRecettes
      },
      financieres: {
        totalRecettes: totalRecettes,
        totalDepenses: totalDepenses, // ✅ Correction : inclut les salaires
        solde: solde, // ✅ Correction : solde = recettes - (salaires + autres dépenses)
        tauxRecouvrement: tauxRecouvrement,
        totalAPayer: totalAPayer,
        totalPaye: totalPaye,
        soldeRestant: soldeRestant,
        totalScolarite: totalScolarite,
        totalTransport: totalTransport,
        totalCantine: totalCantine,
        totalFournitures: totalFournitures,
        totalInscription: totalInscription,
        soldeParPreinscription: soldeParPreinscription.rows,
        evolutionRecettes: evolution.rows.reverse(),
        derniersPaiements: derniersPaiements.rows,
        categoriesRecettes: categoriesRecettes
      }
    });
  } catch (error) {
    console.error("Erreur dashboard stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}