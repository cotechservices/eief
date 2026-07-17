// app/api/parent/paiement-libre-reinscription/route.ts
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

    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { reinscriptionId, montant, modePaiement, reference, type } = body;

    if (!reinscriptionId || !montant || montant <= 0 || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // Récupérer l'ID de l'utilisateur connecté
    const userResult = await query(`
      SELECT id FROM utilisateurs WHERE email = $1
    `, [session.user.email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Récupérer la réinscription
    const reinscriptionResult = await query(`
      SELECT 
        r.id,
        r.montant_total_plan,
        r.montant_restant_plan,
        r.frais_statut,
        r.parent_id,
        r.eleve_id
      FROM reinscriptions r
      WHERE r.id = $1
    `, [reinscriptionId]);

    if (reinscriptionResult.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const reinscription = reinscriptionResult.rows[0];
    const montantRestant = Number(reinscription.montant_restant_plan) || 0;

    // Vérifier les droits
    if (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      const parentCheck = await query(`
        SELECT p.id 
        FROM parents p
        WHERE p.id = $1 AND p.utilisateur_id = $2
      `, [reinscription.parent_id, userId]);

      if (parentCheck.rows.length === 0) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    if (montant > montantRestant) {
      return NextResponse.json({ 
        error: `Le montant (${montant.toLocaleString()} GNF) dépasse le solde restant (${montantRestant.toLocaleString()} GNF)` 
      }, { status: 400 });
    }

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // ⭐ 1. Mettre à jour le montant restant
      const nouveauRestant = montantRestant - montant;
      await query(`
        UPDATE reinscriptions 
        SET montant_restant_plan = $1
        WHERE id = $2
      `, [nouveauRestant, reinscriptionId]);

      // ⭐ 2. Mettre à jour le statut
      let nouveauStatut = 'partiel';
      if (nouveauRestant === 0) {
        nouveauStatut = 'paye';
      }
      
      await query(`
        UPDATE reinscriptions 
        SET frais_statut = $1
        WHERE id = $2
      `, [nouveauStatut, reinscriptionId]);

      // ⭐ 3. UNIQUE INSERTION dans paiements
      await query(`
        INSERT INTO paiements (
          eleve_id,
          reinscription_id,
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
          $1,
          $2,
          $3,
          'inscription',
          $4,
          $5,
          'valide',
          CURRENT_DATE,
          EXTRACT(MONTH FROM CURRENT_DATE),
          EXTRACT(YEAR FROM CURRENT_DATE),
          $6
        )
      `, [
        reinscription.eleve_id,
        reinscriptionId,
        montant,
        modePaiement,
        reference || null,
        userId
      ]);

      console.log(`✅ Paiement de ${montant} GNF enregistré pour la réinscription ${reinscriptionId}`);
      console.log(`📊 Nouveau restant: ${nouveauRestant} GNF, Statut: ${nouveauStatut}`);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Paiement de ${montant.toLocaleString()} GNF effectué avec succès`,
        montant_paye: montant,
        restant: nouveauRestant,
        statut: nouveauStatut,
        est_termine: nouveauRestant === 0
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement libre réinscription:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error as Error).message 
    }, { status: 500 });
  }
}