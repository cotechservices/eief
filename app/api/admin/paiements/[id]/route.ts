// app/api/admin/paiements/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE - Supprimer un paiement/facture sans supprimer l'élève ni le parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN", "DIRECTEUR_GENERAL", "DIRECTEUR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const paiementId = parseInt(id);

    if (isNaN(paiementId)) {
      return NextResponse.json({ error: "ID de paiement invalide" }, { status: 400 });
    }

    console.log(`🗑️ Demande de suppression du paiement #${paiementId}`);

    // 1. Récupérer les informations du paiement avant suppression
    const paiementResult = await query(`
      SELECT 
        id, 
        montant, 
        type_frais, 
        eleve_id, 
        preinscription_id, 
        reinscription_id,
        reference_transaction
      FROM paiements 
      WHERE id = $1
    `, [paiementId]);

    if (paiementResult.rows.length === 0) {
      // Vérifier s'il est dans la table recus
      const recuResult = await query(`
        SELECT id, paiement_id, preinscription_id, montant 
        FROM recus 
        WHERE id = $1 OR paiement_id = $1
      `, [paiementId]);

      if (recuResult.rows.length > 0) {
        const recu = recuResult.rows[0];
        if (recu.paiement_id) {
          await query(`DELETE FROM paiements WHERE id = $1`, [recu.paiement_id]);
        }
        await query(`DELETE FROM recus WHERE id = $1 OR paiement_id = $2`, [recu.id, paiementId]);
        
        // Recalculer preinscription si liée
        if (recu.preinscription_id) {
          await recalculerPreinscription(recu.preinscription_id);
        }

        return NextResponse.json({ 
          success: true, 
          message: "Facture/Reçu supprimé avec succès." 
        });
      }

      return NextResponse.json({ error: "Paiement ou facture non trouvé" }, { status: 404 });
    }

    const paiement = paiementResult.rows[0];
    const { preinscription_id, reinscription_id, eleve_id, reference_transaction } = paiement;

    // 2. Supprimer les reçus associés
    await query(`
      DELETE FROM recus 
      WHERE paiement_id = $1 
         OR reference = $2
    `, [paiementId, reference_transaction || `PAY-${paiementId}`]);

    // 3. Supprimer le paiement de la table paiements
    await query(`
      DELETE FROM paiements 
      WHERE id = $1
    `, [paiementId]);

    console.log(`✅ Paiement #${paiementId} supprimé de la base de données.`);

    // 4. Mettre à jour l'état de la pré-inscription sans supprimer le dossier ni l'élève/parent
    if (preinscription_id) {
      await recalculerPreinscription(preinscription_id);
    }

    // 5. Mettre à jour l'état de la réinscription sans supprimer le dossier
    if (reinscription_id) {
      await recalculerReinscription(reinscription_id);
    }

    // 6. Si le paiement était lié directement à un élève, vérifier s'il a des préinscriptions/réinscriptions
    if (eleve_id && !preinscription_id && !reinscription_id) {
      const lienPreinsc = await query(`
        SELECT preinscription_id FROM inscriptions WHERE eleve_id = $1 LIMIT 1
      `, [eleve_id]);
      if (lienPreinsc.rows.length > 0 && lienPreinsc.rows[0].preinscription_id) {
        await recalculerPreinscription(lienPreinsc.rows[0].preinscription_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Le paiement et la facture ont été supprimés avec succès. Les soldes ont été recalculés sans impacter les comptes élèves et parents."
    });

  } catch (error) {
    console.error("Erreur suppression paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour recalculer le solde d'une pré-inscription
async function recalculerPreinscription(preinscriptionId: number) {
  try {
    // Total payé restant
    const totalPayeResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE preinscription_id = $1 
        AND statut IN ('valide', 'paye')
    `, [preinscriptionId]);

    const totalPaye = Number(totalPayeResult.rows[0]?.total_paye) || 0;

    // Récupérer le montant total prévu
    const preinscResult = await query(`
      SELECT montant_total_plan, frais_montant
      FROM preinscriptions
      WHERE id = $1
    `, [preinscriptionId]);

    if (preinscResult.rows.length > 0) {
      const totalPlan = Number(preinscResult.rows[0].montant_total_plan || preinscResult.rows[0].frais_montant || 0);
      const soldeRestant = Math.max(0, totalPlan - totalPaye);
      const fraisStatut = totalPaye >= totalPlan && totalPlan > 0 
        ? 'paye' 
        : (totalPaye > 0 ? 'partiel' : 'non_paye');

      await query(`
        UPDATE preinscriptions
        SET 
          montant_restant_plan = $1,
          frais_statut = $2
        WHERE id = $3
      `, [soldeRestant, fraisStatut, preinscriptionId]);

      console.log(`🔄 Pré-inscription #${preinscriptionId} mise à jour: totalPaye=${totalPaye}, restant=${soldeRestant}, statut=${fraisStatut}`);
    }
  } catch (err) {
    console.error(`Erreur recalcul pré-inscription #${preinscriptionId}:`, err);
  }
}

// Fonction utilitaire pour recalculer le solde d'une réinscription
async function recalculerReinscription(reinscriptionId: number) {
  try {
    const totalPayeResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE reinscription_id = $1 
        AND statut IN ('valide', 'paye')
    `, [reinscriptionId]);

    const totalPaye = Number(totalPayeResult.rows[0]?.total_paye) || 0;

    const reinscResult = await query(`
      SELECT montant_total_plan, montant_frais
      FROM reinscriptions
      WHERE id = $1
    `, [reinscriptionId]);

    if (reinscResult.rows.length > 0) {
      const totalPlan = Number(reinscResult.rows[0].montant_total_plan || reinscResult.rows[0].montant_frais || 0);
      const soldeRestant = Math.max(0, totalPlan - totalPaye);
      const fraisStatut = totalPaye >= totalPlan && totalPlan > 0 
        ? 'paye' 
        : (totalPaye > 0 ? 'partiel' : 'non_paye');

      await query(`
        UPDATE reinscriptions
        SET 
          montant_restant_plan = $1,
          frais_statut = $2
        WHERE id = $3
      `, [soldeRestant, fraisStatut, reinscriptionId]);

      console.log(`🔄 Réinscription #${reinscriptionId} mise à jour: totalPaye=${totalPaye}, restant=${soldeRestant}, statut=${fraisStatut}`);
    }
  } catch (err) {
    console.error(`Erreur recalcul réinscription #${reinscriptionId}:`, err);
  }
}
