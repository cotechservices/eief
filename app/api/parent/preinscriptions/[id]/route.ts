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

    console.log(` Récupération des détails de la pré-inscription ${preinscriptionId} pour le parent`);

    // Vérifier que la pré-inscription appartient au parent connecté
    const checkParent = await query(`
      SELECT 1 FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkParent.rows.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // ===================== RÉCUPÉRER LA PRÉ-INSCRIPTION =====================
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
        p.photo_url,
        p.acte_naissance_url,
        p.bulletin_url,
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

    // ===================== FRAIS DEPUIS echeances_paiement (source de vérité) =====================
    const echeancesResult = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'inscription'  THEN montant ELSE 0 END), 0) AS inscription,
        COALESCE(SUM(CASE WHEN type = 'cantine'      THEN montant ELSE 0 END), 0) AS cantine,
        COALESCE(SUM(CASE WHEN type = 'transport'    THEN montant ELSE 0 END), 0) AS transport,
        COALESCE(SUM(CASE WHEN type = 'fournitures'  THEN montant ELSE 0 END), 0) AS fournitures,
        COALESCE(SUM(CASE WHEN type NOT IN ('inscription','cantine','transport','fournitures') THEN montant ELSE 0 END), 0) AS autres
      FROM echeances_paiement
      WHERE preinscription_id = $1
    `, [preinscriptionId]);

    const fraisRow         = echeancesResult.rows[0] || {};
    const fraisInscription = Number(fraisRow.inscription) || Number(data.montant_total_plan) || Number(data.frais_montant) || 0;

    // Cantine : echeances_paiement OU preinscription_cantine
    let cantineSelected = Number(fraisRow.cantine) || 0;
    if (cantineSelected === 0) {
      const cantineRes = await query(`SELECT COALESCE(SUM(prix), 0) as total FROM preinscription_cantine WHERE preinscription_id = $1`, [preinscriptionId]);
      cantineSelected = Number(cantineRes.rows[0]?.total) || 0;
    }

    // Transport : echeances_paiement OU preinscription_transport
    let transportSelected = Number(fraisRow.transport) || 0;
    if (transportSelected === 0) {
      const transRes = await query(`SELECT COALESCE(SUM(prix), 0) as total FROM preinscription_transport WHERE preinscription_id = $1`, [preinscriptionId]);
      transportSelected = Number(transRes.rows[0]?.total) || 0;
    }

    // Fournitures : echeances_paiement OU commandes_fournitures
    let fournituresSelected = Number(fraisRow.fournitures) || 0;
    if (fournituresSelected === 0) {
      const fournRes = await query(`SELECT COALESCE(SUM(quantite * prix_unitaire), 0) as total FROM commandes_fournitures WHERE preinscription_id = $1`, [preinscriptionId]);
      fournituresSelected = Number(fournRes.rows[0]?.total) || 0;
    }

    const autresSelected = Number(fraisRow.autres) || 0;

    // ===================== CALCUL DES TOTAUX =====================
    const totalFrais = fraisInscription + cantineSelected + transportSelected + fournituresSelected + autresSelected;

    // ⭐ Récupérer les paiements effectués
    const paiementsResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE preinscription_id = $1 AND statut = 'valide'
    `, [preinscriptionId]);

    const fraisPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

    console.log("📊 Détails des frais complets:", {
      inscription: fraisInscription,
      cantine: cantineSelected,
      transport: transportSelected,
      fournitures: fournituresSelected,
      autres: autresSelected,
      total: totalFrais,
      paye: fraisPaye,
      reste: Math.max(0, totalFrais - fraisPaye)
    });

    // ===================== RÉPONSE =====================
    return NextResponse.json({
      ...data,
      transport_montant: transportSelected,
      cantine_montant: cantineSelected,
      fournitures_montant: fournituresSelected,
      scolarite_montant: fraisInscription,
      montant_total: totalFrais,
      fournitures_commandees: [],
      transport_selectionne: [],
      cantine_selectionnee: [],
      details_frais: {
        inscription: fraisInscription,
        cantine: cantineSelected,
        transport: transportSelected,
        fournitures: fournituresSelected,
        librairie: fournituresSelected,
        autres: autresSelected,
        scolarite: fraisInscription,
        total: totalFrais,
        paye: fraisPaye,
        reste: Math.max(0, totalFrais - fraisPaye)
      }
    });


  } catch (error) {
    console.error("Erreur GET détail pré-inscription parent:", error);
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

    // ⭐ Vérifier si la pré-inscription peut être annulée
    if (preinscription.statut === "valide") {
      return NextResponse.json({ error: "Impossible d'annuler une pré-inscription déjà validée" }, { status: 400 });
    }

    if (preinscription.statut === "rejete") {
      return NextResponse.json({ error: "Cette pré-inscription a déjà été rejetée" }, { status: 400 });
    }

    if (preinscription.frais_statut === "paye") {
      return NextResponse.json({ error: "Impossible d'annuler une pré-inscription déjà payée" }, { status: 400 });
    }

    // ⭐ Vérifier le nombre de paiements
    const paiementsCheck = await query(`
      SELECT COUNT(*) as count FROM paiements WHERE preinscription_id = $1
    `, [preinscriptionId]);

    const hasPaiements = parseInt(paiementsCheck.rows[0].count) > 0;

    // ⭐ Démarrer une transaction
    await query('BEGIN');

    try {
      // ⭐ Supprimer les paiements s'ils existent
      if (hasPaiements) {
        await query(`
          DELETE FROM paiements WHERE preinscription_id = $1
        `, [preinscriptionId]);
        console.log(`✅ ${paiementsCheck.rows[0].count} paiement(s) supprimés pour la pré-inscription ${preinscriptionId}`);
      }

      // Supprimer les autres données associées
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
      console.error("Erreur dans la transaction:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression: " + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}