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

    // ⭐ COMPTER TOUS LES PERSONNELS (au lieu de seulement enseignants)
    const personnels = await query("SELECT COUNT(*) as total FROM personnels");
    const classes = await query("SELECT COUNT(*) as total FROM classes");
    const parents = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'PARENT'");
    const preinscriptions = await query("SELECT COUNT(*) as total FROM preinscriptions WHERE statut = 'en_attente'");
    const reinscriptionsEnAttente = await query("SELECT COUNT(*) as total FROM reinscriptions WHERE statut = 'en_attente'");

    // ========== STATISTIQUES FINANCIÈRES ==========
    // (inchangé)
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_recettes
      FROM paiements
      WHERE statut IN ('valide', 'paye')
    `);
    const totalRecettes = Number(recettesResult.rows[0]?.total_recettes) || 0;

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

    const totalAPayerInscriptionResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total_a_payer
      FROM preinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalAPayerInscription = Number(totalAPayerInscriptionResult.rows[0]?.total_a_payer) || 0;

    const totalAPayerReinscriptionResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total_a_payer
      FROM reinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalAPayerReinscription = Number(totalAPayerReinscriptionResult.rows[0]?.total_a_payer) || 0;

    const totalPayeInscriptionResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND preinscription_id IS NOT NULL
    `);
    const totalPayeInscription = Number(totalPayeInscriptionResult.rows[0]?.total_paye) || 0;

    const totalPayeReinscriptionResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND reinscription_id IS NOT NULL
    `);
    const totalPayeReinscription = Number(totalPayeReinscriptionResult.rows[0]?.total_paye) || 0;

    const remisesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_remises
      FROM remises_familles
    `);
    const totalRemises = Number(remisesResult.rows[0]?.total_remises) || 0;

    const totalAPayerBrut = totalAPayerInscription + totalAPayerReinscription;
    const totalAPayer = Math.max(0, totalAPayerBrut - totalRemises);
    const totalPaye = totalPayeInscription + totalPayeReinscription;
    const soldeRestant = Math.max(0, totalAPayer - totalPaye);

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

    const tauxRecouvrement = totalAPayer > 0 ? Math.round((totalPaye / totalAPayer) * 100) : 0;

    const inscriptionResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total
      FROM preinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalInscription = Number(inscriptionResult.rows[0]?.total) || 0;

    const reinscriptionTotalResult = await query(`
      SELECT COALESCE(SUM(montant_total_plan), 0) as total
      FROM reinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalReinscription = Number(reinscriptionTotalResult.rows[0]?.total) || 0;

    const fraisReinscriptionResult = await query(`
      SELECT COALESCE(SUM(montant_frais), 0) as total
      FROM reinscriptions
      WHERE statut IN ('en_attente', 'valide')
    `);
    const totalFraisReinscription = Number(fraisReinscriptionResult.rows[0]?.total) || 0;

    const scolariteResult = await query(`
      SELECT COALESCE(SUM(f.montant), 0) as total_scolarite
      FROM frais_scolaires f
      WHERE f.type_frais = 'mensualite'
        AND f.annee_scolaire_id = (
          SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
        )
    `);
    const totalScolarite = Number(scolariteResult.rows[0]?.total_scolarite) || 0;

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

    const soldeParReinscription = await query(`
      SELECT
        r.id,
        r.enfant_prenom || ' ' || r.enfant_nom as enfant,
        r.montant_total_plan,
        COALESCE(SUM(pa.montant), 0) as total_paye,
        GREATEST(0, r.montant_total_plan - COALESCE(SUM(pa.montant), 0)) as solde_restant
      FROM reinscriptions r
      LEFT JOIN paiements pa ON pa.reinscription_id = r.id AND pa.statut IN ('valide', 'paye')
      WHERE r.statut IN ('en_attente', 'valide')
      GROUP BY r.id, r.enfant_prenom, r.enfant_nom, r.montant_total_plan
      HAVING GREATEST(0, r.montant_total_plan - COALESCE(SUM(pa.montant), 0)) > 0
    `);

    console.log("📊 DASHBOARD FINANCIER:", {
      totalAPayerInscription,
      totalAPayerReinscription,
      totalAPayer,
      totalPayeInscription,
      totalPayeReinscription,
      totalPaye,
      soldeRestant,
      tauxRecouvrement,
      totalDepenses,
      totalFraisReinscription,
      totalReinscription
    });

    const derniersPaiements = await query(`
      SELECT
        pa.id,
        COALESCE(
          NULLIF(TRIM(CONCAT(ue.prenom, ' ', ue.nom)), ''),
          NULLIF(TRIM(CONCAT(p.enfant_prenom, ' ', p.enfant_nom)), ''),
          NULLIF(TRIM(CONCAT(r.enfant_prenom, ' ', r.enfant_nom)), ''),
          'Élève'
        ) as eleve,
        COALESCE(ce.nom, p.classe, r.classe_nom, '-') as classe,
        pa.montant,
        pa.type_frais as type,
        pa.date_paiement as date,
        pa.mode_paiement as mode,
        pa.statut,
        CASE 
          WHEN pa.preinscription_id IS NOT NULL THEN 'inscription'
          WHEN pa.reinscription_id IS NOT NULL THEN 'reinscription'
          ELSE 'autre'
        END as type_demande
      FROM paiements pa
      LEFT JOIN preinscriptions p ON pa.preinscription_id = p.id
      LEFT JOIN reinscriptions r ON pa.reinscription_id = r.id
      LEFT JOIN eleves e ON pa.eleve_id = e.id
      LEFT JOIN utilisateurs ue ON e.utilisateur_id = ue.id
      LEFT JOIN classes ce ON e.classe_id = ce.id
      WHERE pa.statut IN ('valide', 'paye')
      ORDER BY pa.date_paiement DESC, pa.id DESC
      LIMIT 10
    `);

    const paiementsParType = await query(`
      SELECT
        CASE
          WHEN type_frais = 'inscription' THEN 'Inscription'
          WHEN type_frais = 'reinscription' THEN 'Réinscription'
          WHEN type_frais = 'mensualite' OR type_frais = 'scolarite' THEN 'Mensualité'
          WHEN type_frais = 'cantine' THEN 'Cantine'
          WHEN type_frais = 'transport' THEN 'Transport'
          WHEN type_frais = 'librairie' OR type_frais = 'fournitures' THEN 'Fournitures'
          ELSE 'Autre'
        END as name,
        COALESCE(SUM(montant), 0) as montant
      FROM paiements
      WHERE statut IN ('valide', 'paye')
      GROUP BY 1
      ORDER BY montant DESC
    `);

    const totalRecettesCat = paiementsParType.rows.reduce((acc, row) => acc + Number(row.montant), 0);
    const categoriesRecettes = paiementsParType.rows.map((cat: any) => ({
      name: cat.name,
      montant: Number(cat.montant),
      pourcentage: totalRecettesCat > 0 ? Math.round((Number(cat.montant) / totalRecettesCat) * 100) : 0
    }));

    const evolution = await query(`
      SELECT
        TO_CHAR(date_paiement, 'Mon') as mois,
        COALESCE(SUM(montant), 0) as recettes,
        0 as depenses
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND date_paiement >= NOW() - INTERVAL '6 months'
      GROUP BY EXTRACT(MONTH FROM date_paiement), TO_CHAR(date_paiement, 'Mon')
      ORDER BY EXTRACT(MONTH FROM date_paiement) DESC
      LIMIT 6
    `);

    const solde = totalRecettes - totalDepenses;

    return NextResponse.json({
      general: {
        totalEleves: parseInt(eleves.rows[0]?.total || 0),
        totalPersonnels: parseInt(personnels.rows[0]?.total || 0), // ← clé modifiée
        totalClasses: parseInt(classes.rows[0]?.total || 0),
        totalParents: parseInt(parents.rows[0]?.total || 0),
        preinscriptionsEnAttente: parseInt(preinscriptions.rows[0]?.total || 0),
        reinscriptionsEnAttente: parseInt(reinscriptionsEnAttente.rows[0]?.total || 0),
        hommes: parseInt(eleves.rows[0]?.hommes || 0),
        femmes: parseInt(eleves.rows[0]?.femmes || 0),
        totalPaiementsAnnee: totalRecettes
      },
      financieres: {
        totalRecettes: totalRecettes,
        totalDepenses: totalDepenses,
        solde: solde,
        tauxRecouvrement: tauxRecouvrement,
        totalAPayerBrut: totalAPayerBrut,
        totalRemises: totalRemises,
        totalAPayer: totalAPayer,
        totalPaye: totalPaye,
        soldeRestant: soldeRestant,
        totalScolarite: totalScolarite,
        totalTransport: totalTransport,
        totalCantine: totalCantine,
        totalFournitures: totalFournitures,
        totalInscription: totalInscription,
        totalReinscription: totalReinscription,
        totalFraisReinscription: totalFraisReinscription,
        totalAPayerInscription: totalAPayerInscription,
        totalAPayerReinscription: totalAPayerReinscription,
        totalPayeInscription: totalPayeInscription,
        totalPayeReinscription: totalPayeReinscription,
        soldeParPreinscription: soldeParPreinscription.rows,
        soldeParReinscription: soldeParReinscription.rows,
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