// app/api/parent/preinscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les détails d'une pré-inscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const preinscriptionId = parseInt(id);
    const userEmail = session.user?.email;

    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    console.log(`📋 Récupération détails pré-inscription ${preinscriptionId} pour ${userEmail}`);

    // ⭐ Vérifier que la pré-inscription appartient au parent connecté
    const checkParent = await query(`
      SELECT 1 FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkParent.rows.length === 0) {
      console.warn(`⚠️ Accès refusé pour pré-inscription ${preinscriptionId} par ${userEmail}`);
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // ===================== PRÉ-INSCRIPTION PRINCIPALE =====================
    const detailResult = await query(`
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
        p.frais_montant,
        p.montant_total_plan,
        p.montant_restant_plan,
        p.photo_url,
        p.acte_naissance_url,
        p.bulletin_url,
        p.type_inscription,
        p.est_reinscription,
        u.nom as parent_nom,
        u.prenom as parent_prenom,
        u.email as parent_email,
        u.telephone as parent_telephone,
        pa.profession as parent_profession,
        pa.situation_matrimoniale as mere_info
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1
    `, [preinscriptionId]);

    if (detailResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const data = detailResult.rows[0];

    // ===================== FRAIS DEPUIS echeances_paiement =====================
    const echeancesResult = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'inscription'  THEN montant ELSE 0 END), 0) AS inscription,
        COALESCE(SUM(CASE WHEN type = 'scolarite'    THEN montant ELSE 0 END), 0) AS scolarite,
        COALESCE(SUM(CASE WHEN type = 'reinscription' THEN montant ELSE 0 END), 0) AS reinscription,
        COALESCE(SUM(CASE WHEN type = 'cantine'      THEN montant ELSE 0 END), 0) AS cantine,
        COALESCE(SUM(CASE WHEN type = 'transport'    THEN montant ELSE 0 END), 0) AS transport,
        COALESCE(SUM(CASE WHEN type = 'fournitures'  THEN montant ELSE 0 END), 0) AS fournitures,
        COALESCE(SUM(CASE WHEN type NOT IN ('inscription','scolarite','reinscription','cantine','transport','fournitures') THEN montant ELSE 0 END), 0) AS autres
      FROM echeances_paiement
      WHERE preinscription_id = $1
    `, [preinscriptionId]);

    const fraisRow = echeancesResult.rows[0] || {};

    // ⭐ Scolarité = inscription + scolarite + reinscription (toutes les échéances de scolarité)
    let fraisInscription =
      (Number(fraisRow.inscription) || 0) +
      (Number(fraisRow.scolarite) || 0) +
      (Number(fraisRow.reinscription) || 0);

    // Fallback : si aucune échéance, utiliser montant_total_plan
    if (fraisInscription === 0) {
      fraisInscription = Number(data.montant_total_plan) || Number(data.frais_montant) || 0;
    }

    // ===================== CANTINE =====================
    let cantineSelected = Number(fraisRow.cantine) || 0;
    if (cantineSelected === 0) {
      const cantineRes = await query(`
        SELECT COALESCE(SUM(prix), 0) as total 
        FROM preinscription_cantine 
        WHERE preinscription_id = $1
      `, [preinscriptionId]);
      cantineSelected = Number(cantineRes.rows[0]?.total) || 0;
    }

    // ===================== TRANSPORT =====================
    let transportSelected = Number(fraisRow.transport) || 0;
    if (transportSelected === 0) {
      const transRes = await query(`
        SELECT COALESCE(SUM(prix), 0) as total 
        FROM preinscription_transport 
        WHERE preinscription_id = $1
      `, [preinscriptionId]);
      transportSelected = Number(transRes.rows[0]?.total) || 0;
    }

    // ===================== FOURNITURES =====================
    let fournituresSelected = Number(fraisRow.fournitures) || 0;
    if (fournituresSelected === 0) {
      const fournRes = await query(`
        SELECT COALESCE(SUM(quantite * prix_unitaire), 0) as total 
        FROM commandes_fournitures 
        WHERE preinscription_id = $1
      `, [preinscriptionId]);
      fournituresSelected = Number(fournRes.rows[0]?.total) || 0;
    }

    const autresSelected = Number(fraisRow.autres) || 0;

    // ===================== TOTAL ET PAIEMENTS =====================
    const totalFrais =
      fraisInscription +
      cantineSelected +
      transportSelected +
      fournituresSelected +
      autresSelected;

    // ⭐ Paiements effectués
    const paiementsResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE preinscription_id = $1 AND statut IN ('valide', 'paye')
    `, [preinscriptionId]);

    const fraisPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;
    const fraisRestant = Math.max(0, totalFrais - fraisPaye);

    // ⭐ Calcul du statut de paiement
    let paiementStatut: 'paye' | 'partiel' | 'non_paye' = 'non_paye';
    if (totalFrais > 0) {
      if (fraisPaye >= totalFrais) {
        paiementStatut = 'paye';
      } else if (fraisPaye > 0) {
        paiementStatut = 'partiel';
      }
    }

    console.log("📊 Détails frais pré-inscription:", {
      inscription: fraisInscription,
      cantine: cantineSelected,
      transport: transportSelected,
      fournitures: fournituresSelected,
      autres: autresSelected,
      total: totalFrais,
      paye: fraisPaye,
      reste: fraisRestant,
      statut: paiementStatut,
    });

    // ===================== RÉPONSE COMPLÈTE =====================
    return NextResponse.json({
      // ⭐ Infos de la pré-inscription
      ...data,
      
      // ⭐ Aliases pour compatibilité frontend
      nom: data.enfant_nom,
      prenom: data.enfant_prenom,
      matricule: data.numero_dossier,
      classe_nom: data.classe,
      
      // ⭐ Montants par service
      transport_montant: transportSelected,
      cantine_montant: cantineSelected,
      fournitures_montant: fournituresSelected,
      scolarite_montant: fraisInscription,
      montant_total: totalFrais,
      montant_paye: fraisPaye,
      montant_restant: fraisRestant,
      paiement_statut: paiementStatut,
      
      // ⭐ Objets vides pour compatibilité
      fournitures_commandees: [],
      transport_selectionne: [],
      cantine_selectionnee: [],
      
      // ⭐ Structure "eleve" attendue par le modal enfant (fallback)
      eleve: {
        id: data.id,
        matricule: data.numero_dossier,
        nom: data.enfant_nom,
        prenom: data.enfant_prenom,
        date_naissance: data.date_naissance,
        lieu_naissance: data.lieu_naissance,
        sexe: data.sexe,
        photo_url: data.photo_url,
        classe_nom: data.classe,
        niveau: data.niveau,
        parent_email: data.parent_email,
        parent_nom: data.parent_nom,
        parent_prenom: data.parent_prenom,
        parent_telephone: data.parent_telephone,
        parent_profession: data.parent_profession,
        mere_info: data.mere_info,
        acte_naissance_url: data.acte_naissance_url,
        bulletin_url: data.bulletin_url,
      },
      
      // ⭐ Structure "frais" attendue par le modal (fallback)
      frais: {
        inscription: fraisInscription,
        cantine: cantineSelected,
        transport: transportSelected,
        fournitures: fournituresSelected,
        scolarite: fraisInscription,
        total_a_payer: totalFrais,
        total_brut: totalFrais,
        net: totalFrais,
        remise: 0,
        total_paye: fraisPaye,
        solde_restant: fraisRestant,
      },
      
      // ⭐ Structure "details_frais" (nouvelle)
      details_frais: {
        inscription: fraisInscription,
        cantine: cantineSelected,
        transport: transportSelected,
        fournitures: fournituresSelected,
        librairie: fournituresSelected,
        autres: autresSelected,
        scolarite: fraisInscription,
        total: totalFrais,
        total_brut: totalFrais,
        net: totalFrais,
        remise: 0,
        paye: fraisPaye,
        reste: fraisRestant,
      },
      
      // ⭐ Liste vide (pas de bulletins pour une pré-inscription)
      bulletins: [],
    });

  } catch (error) {
    console.error("❌ Erreur GET détail pré-inscription parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une pré-inscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const preinscriptionId = parseInt(id);
    const userEmail = session.user?.email;

    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // ⭐ Vérifier que la pré-inscription appartient au parent
    const checkResult = await query(`
      SELECT p.id, p.statut, p.frais_statut
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const preinscription = checkResult.rows[0];

    // ⭐ Vérifications avant suppression
    if (preinscription.statut === "valide") {
      return NextResponse.json(
        { error: "Impossible d'annuler une pré-inscription déjà validée" },
        { status: 400 }
      );
    }

    if (preinscription.statut === "rejete") {
      return NextResponse.json(
        { error: "Cette pré-inscription a déjà été rejetée" },
        { status: 400 }
      );
    }

    if (preinscription.frais_statut === "paye") {
      return NextResponse.json(
        { error: "Impossible d'annuler une pré-inscription déjà payée" },
        { status: 400 }
      );
    }

    // ⭐ Vérifier le nombre de paiements
    const paiementsCheck = await query(`
      SELECT COUNT(*) as count FROM paiements WHERE preinscription_id = $1
    `, [preinscriptionId]);

    const hasPaiements = parseInt(paiementsCheck.rows[0].count) > 0;

    // ⭐ Démarrer une transaction
    await query('BEGIN');

    try {
      // Supprimer les paiements s'ils existent
      if (hasPaiements) {
        await query(`DELETE FROM paiements WHERE preinscription_id = $1`, [preinscriptionId]);
        console.log(`✅ ${paiementsCheck.rows[0].count} paiement(s) supprimés pour pré-inscription ${preinscriptionId}`);
      }

      // Supprimer les autres données associées (ordre important pour les FK)
      await query(`DELETE FROM echeances_paiement WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM inscriptions WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM commandes_fournitures WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM preinscription_transport WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM preinscription_cantine WHERE preinscription_id = $1`, [preinscriptionId]);

      // Enfin, supprimer la pré-inscription
      await query(`DELETE FROM preinscriptions WHERE id = $1`, [preinscriptionId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Pré-inscription annulée avec succès"
      });
    } catch (error) {
      await query('ROLLBACK');
      console.error("❌ Erreur dans la transaction DELETE:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression: " + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur DELETE pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}