// app/api/parent/paiement-echeance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ⭐ Accepter PARENT, SUPER_ADMIN et COMPTABLE
    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      return NextResponse.json({ 
        error: "Non autorisé - rôles acceptés: PARENT, SUPER_ADMIN, COMPTABLE" 
      }, { status: 403 });
    }

    const body = await request.json();
    const { echeanceId, modePaiement, reference } = body;

    if (!echeanceId || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // Récupérer l'échéance
    const echeanceResult = await query(`
      SELECT ep.*, p.id as preinscription_id, p.parent_id, p.frais_montant
      FROM echeances_paiement ep
      JOIN preinscriptions p ON ep.preinscription_id = p.id
      WHERE ep.id = $1 AND ep.statut = 'en_attente'
    `, [echeanceId]);

    if (echeanceResult.rows.length === 0) {
      return NextResponse.json({ error: "Échéance non trouvée ou déjà payée" }, { status: 404 });
    }

    const echeance = echeanceResult.rows[0];

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // Mettre à jour l'échéance
      await query(`
        UPDATE echeances_paiement 
        SET statut = 'paye',
            date_paiement = CURRENT_DATE,
            reference_transaction = $1,
            mode_paiement = $2,
            updated_at = NOW()
        WHERE id = $3
      `, [reference || null, modePaiement, echeanceId]);

      // Mettre à jour le montant restant de la pré-inscription
      await query(`
        UPDATE preinscriptions 
        SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
        WHERE id = $2
      `, [echeance.montant, echeance.preinscription_id]);

      // Vérifier si tous les paiements sont faits
      const remainingResult = await query(`
        SELECT SUM(montant) as total_restant
        FROM echeances_paiement
        WHERE preinscription_id = $1 AND statut = 'en_attente'
      `, [echeance.preinscription_id]);

      const restant = Number(remainingResult.rows[0].total_restant) || 0;
      
      if (restant === 0) {
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = 'paye'
          WHERE id = $1
        `, [echeance.preinscription_id]);
        console.log(`✅ Pré-inscription ${echeance.preinscription_id} entièrement payée`);
      } else {
        // ⭐ Si des échéances restent, mettre le statut à 'partiel'
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = 'partiel'
          WHERE id = $1 AND frais_statut != 'paye'
        `, [echeance.preinscription_id]);
        console.log(`⚠️ Pré-inscription ${echeance.preinscription_id} partiellement payée (reste: ${restant} GNF)`);
      }

      // Enregistrer le paiement
      await query(`
        INSERT INTO paiements (
          eleve_id,
          preinscription_id,
          montant,
          type_frais,
          mode_paiement,
          reference_transaction,
          statut,
          date_paiement,
          mois,
          annee,
          saisie_par
        ) VALUES (
          NULL,
          $1,
          $2,
          $3,
          $4,
          $5,
          'valide',
          CURRENT_DATE,
          EXTRACT(MONTH FROM CURRENT_DATE),
          EXTRACT(YEAR FROM CURRENT_DATE),
          (SELECT id FROM utilisateurs WHERE email = $6)
        )
      `, [
        echeance.preinscription_id,
        echeance.montant,
        echeance.type,
        modePaiement,
        reference || null,
        session.user.email
      ]);

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: "Paiement effectué avec succès",
        echeance: echeance,
        restant: restant
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement échéance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}