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

    console.log(`📊 Récupération des détails de la pré-inscription ${preinscriptionId} pour le parent`);

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

    // ===================== VÉRIFIER LES SERVICES SÉLECTIONNÉS =====================

    // ⭐ TRANSPORT - Vérifier si sélectionné
    const transportResult = await query(`
      SELECT COALESCE(SUM(pt.prix), 0) as total
      FROM preinscription_transport pt
      WHERE pt.preinscription_id = $1
    `, [preinscriptionId]);
    const transportSelected = Number(transportResult.rows[0]?.total) || 0;

    // ⭐ CANTINE - Vérifier si sélectionnée et récupérer le prix correct
    let cantineSelected = 0;
    
    // Vérifier si la cantine est sélectionnée
    const cantineExists = await query(`
      SELECT COUNT(*) as count FROM preinscription_cantine WHERE preinscription_id = $1
    `, [preinscriptionId]);

    if (Number(cantineExists.rows[0]?.count) > 0) {
      // Récupérer le prix annuel depuis cantine_menus
      const cantinePrixResult = await query(`
        SELECT COALESCE(cm.prix_annuel, 0) as prix_annuel
        FROM preinscription_cantine pc
        JOIN cantine_menus cm ON pc.menu_id = cm.id
        WHERE pc.preinscription_id = $1
      `, [preinscriptionId]);
      
      if (cantinePrixResult.rows.length > 0) {
        cantineSelected = Number(cantinePrixResult.rows[0]?.prix_annuel) || 0;
      }
      
      // Si pas de prix annuel, utiliser la somme des prix
      if (cantineSelected === 0) {
        const sumResult = await query(`
          SELECT COALESCE(SUM(pc.prix), 0) as total
          FROM preinscription_cantine pc
          WHERE pc.preinscription_id = $1
        `, [preinscriptionId]);
        cantineSelected = Number(sumResult.rows[0]?.total) || 0;
      }
      
      // Si toujours 0, utiliser le prix annuel par défaut
      if (cantineSelected === 0) {
        const defaultPrix = await query(`
          SELECT COALESCE(prix_annuel, 0) as prix_annuel
          FROM cantine_menus
          ORDER BY date DESC
          LIMIT 1
        `, []);
        cantineSelected = Number(defaultPrix.rows[0]?.prix_annuel) || 0;
        console.log(`⚠️ Cantine sélectionnée, utilisation du prix annuel par défaut: ${cantineSelected}`);
      }
    }

    // ⭐ FOURNITURES - Vérifier si sélectionnées
    const fournituresResult = await query(`
      SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total
      FROM commandes_fournitures cf
      WHERE cf.preinscription_id = $1
    `, [preinscriptionId]);
    const fournituresSelected = Number(fournituresResult.rows[0]?.total) || 0;

    // ⭐ Récupérer les détails des services pour l'affichage
    const fournituresDetails = await query(`
      SELECT 
        al.nom,
        cf.quantite,
        cf.prix_unitaire,
        cf.quantite * cf.prix_unitaire as total
      FROM commandes_fournitures cf
      JOIN articles_librairie al ON cf.article_id = al.id
      WHERE cf.preinscription_id = $1
    `, [preinscriptionId]);

    const transportDetails = await query(`
      SELECT 
        lt.nom,
        pt.prix,
        lt.horaire_matin,
        lt.horaire_soir
      FROM preinscription_transport pt
      JOIN lignes_transport lt ON pt.ligne_id = lt.id
      WHERE pt.preinscription_id = $1
    `, [preinscriptionId]);

    const cantineDetails = await query(`
      SELECT 
        cm.plat,
        cm.accompagnement,
        cm.dessert,
        cm.prix_annuel as prix,
        cm.date
      FROM preinscription_cantine pc
      JOIN cantine_menus cm ON pc.menu_id = cm.id
      WHERE pc.preinscription_id = $1
    `, [preinscriptionId]);

    // ===================== CALCUL DES TOTAUX =====================
    // ⭐ UNIQUEMENT les services sélectionnés !
    const fraisInscription = Number(data.frais_montant) || 0;

    // ⭐ TOTAL = Inscription + services sélectionnés UNIQUEMENT
    const totalFrais = fraisInscription + transportSelected + cantineSelected + fournituresSelected;

    // ⭐ Récupérer les paiements effectués
    const paiementsResult = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE preinscription_id = $1 AND statut = 'valide'
    `, [preinscriptionId]);

    const fraisPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

    console.log("📊 Détails des frais calculés (UNIQUEMENT services sélectionnés):", {
      inscription: fraisInscription,
      transport: transportSelected,
      cantine: cantineSelected,
      fournitures: fournituresSelected,
      total: totalFrais,
      paye: fraisPaye,
      reste: Math.max(0, totalFrais - fraisPaye),
      transport_selectionne: transportDetails.rows || [],
      cantine_selectionnee: cantineDetails.rows || [],
      fournitures_commandees: fournituresDetails.rows || []
    });

    // ===================== RÉPONSE =====================
    return NextResponse.json({
      ...data,
      // ⭐ Surcharger les montants avec les valeurs réelles sélectionnées
      transport_montant: transportSelected,
      cantine_montant: cantineSelected,
      fournitures_montant: fournituresSelected,
      scolarite_montant: 0, // Déjà inclus dans frais_montant
      montant_total: totalFrais,
      fournitures_commandees: fournituresDetails.rows || [],
      transport_selectionne: transportDetails.rows || [],
      cantine_selectionnee: cantineDetails.rows || [],
      details_frais: {
        inscription: fraisInscription,
        cantine: cantineSelected,      // ⭐ 0 si non sélectionné
        transport: transportSelected,   // ⭐ 0 si non sélectionné
        librairie: fournituresSelected, // ⭐ 0 si non sélectionné
        scolarite: 0, // ⭐ 0 car déjà inclus
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