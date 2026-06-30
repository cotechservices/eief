// app/api/parent/paiement-multiple/route.ts
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
      return NextResponse.json({
        error: "Non autorisé - rôles acceptés: PARENT, SUPER_ADMIN, COMPTABLE"
      }, { status: 403 });
    }

    const body = await request.json();
    const { echeancesIds, modePaiement, reference, type } = body;

    console.log("📝 Paiement multiple reçu:", { echeancesIds, modePaiement, reference, type, userRole });

    if (!echeancesIds || echeancesIds.length === 0 || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // ⭐ Récupérer les échéances avec leurs liens
    const placeholders = echeancesIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    const echeancesResult = await query(`
      SELECT 
        ep.*,
        p.id as preinscription_id,
        p.parent_id as preinscription_parent_id,
        p.frais_montant as preinscription_frais_montant,
        p.montant_total_plan as preinscription_total_plan,
        p.montant_restant_plan as preinscription_restant_plan,
        r.id as reinscription_id,
        r.parent_id as reinscription_parent_id,
        r.montant_frais as reinscription_montant_frais,
        r.montant_total_plan as reinscription_total_plan,
        r.montant_restant_plan as reinscription_restant_plan,
        r.eleve_id as reinscription_eleve_id
      FROM echeances_paiement ep
      LEFT JOIN preinscriptions p ON ep.preinscription_id = p.id
      LEFT JOIN reinscriptions r ON ep.reinscription_id = r.id
      WHERE ep.id IN (${placeholders}) AND ep.statut = 'en_attente'
    `, echeancesIds);

    if (echeancesResult.rows.length === 0) {
      return NextResponse.json({ error: "Aucune échéance valide trouvée" }, { status: 404 });
    }

    const echeances = echeancesResult.rows;

    // ⭐ Déterminer si c'est une préinscription ou une réinscription
    const firstEcheance = echeances[0];
    const isReinscription = firstEcheance.reinscription_id !== null;
    const entityId = isReinscription
      ? firstEcheance.reinscription_id
      : firstEcheance.preinscription_id;
    const parentId = isReinscription
      ? firstEcheance.reinscription_parent_id
      : firstEcheance.preinscription_parent_id;
    const eleveId = isReinscription
      ? firstEcheance.reinscription_eleve_id
      : null;

    // Vérifier que le parent est bien le propriétaire
    if (parentId) {
      const parentCheck = await query(`
        SELECT p.id 
        FROM parents p
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        WHERE p.id = $1 AND u.email = $2
      `, [parentId, session.user.email]);

      if (parentCheck.rows.length === 0 && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    const montantTotal = echeances.reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    console.log(`Montant total: ${montantTotal} GNF pour ${echeances.length} échéances`);
    console.log(`📋 Type: ${isReinscription ? 'Réinscription' : 'Préinscription'}`);

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // Mettre à jour toutes les échéances
      for (const echeance of echeances) {
        await query(`
          UPDATE echeances_paiement 
          SET statut = 'paye',
              date_paiement = CURRENT_DATE,
              reference_transaction = $1,
              mode_paiement = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [reference || null, modePaiement, echeance.id]);
        console.log(`✅ Échéance ${echeance.id} (${echeance.type} - ${echeance.echeance}) payée`);
      }

      // ⭐ Gérer selon le type
      let restant = 0;
      let typeFrais = '';

      // ⭐ Récupérer l'ID de l'utilisateur
      const userResult = await query(`
        SELECT id FROM utilisateurs WHERE email = $1
      `, [session.user.email]);
      const userId = userResult.rows[0]?.id || null;

      if (isReinscription) {
        // ============================================================
        // CAS RÉINSCRIPTION
        // ============================================================
        const reinscriptionId = entityId;

        // Mettre à jour le montant restant
        await query(`
          UPDATE reinscriptions 
          SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
          WHERE id = $2
        `, [montantTotal, reinscriptionId]);

        // Vérifier si tous les paiements sont faits
        const remainingResult = await query(`
          SELECT SUM(montant) as total_restant
          FROM echeances_paiement
          WHERE reinscription_id = $1 AND statut = 'en_attente'
        `, [reinscriptionId]);

        restant = Number(remainingResult.rows[0].total_restant) || 0;

        // ⭐ Utiliser 'partiel' si reste > 0 (maintenant autorisé après modification de la contrainte)
        if (restant === 0) {
          await query(`
            UPDATE reinscriptions 
            SET frais_statut = 'paye'
            WHERE id = $1
          `, [reinscriptionId]);
          console.log(`✅ Réinscription ${reinscriptionId} entièrement payée`);
        } else {
          // ⭐ 'partiel' est maintenant autorisé pour les réinscriptions
          await query(`
            UPDATE reinscriptions 
            SET frais_statut = 'partiel'
            WHERE id = $1 AND frais_statut != 'paye'
          `, [reinscriptionId]);
          console.log(`⚠️ Réinscription ${reinscriptionId} partiellement payée (reste: ${restant} GNF) - statut mis à 'partiel'`);
        }

        // ⭐ Déterminer le type de frais
        const typesInclus = [...new Set(echeances.map((e: any) => e.type))];

        if (typesInclus.includes('reinscription')) {
          typeFrais = 'inscription';
        } else if (typesInclus.includes('transport')) {
          typeFrais = 'transport';
        } else if (typesInclus.includes('cantine')) {
          typeFrais = 'cantine';
        } else if (typesInclus.includes('fournitures')) {
          typeFrais = 'librairie';
        } else {
          typeFrais = 'inscription';
        }

        console.log(`📋 Type de frais pour réinscription: ${typeFrais}`);

        // ⭐ Pour les réinscriptions, on met preinscription_id = NULL
        // car la clé étrangère pointe vers preinscriptions
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
            $1,
            NULL,  -- ⭐ NULL car l'ID n'existe pas dans preinscriptions
            $2,
            $3,
            $4,
            $5,
            'valide',
            CURRENT_DATE,
            EXTRACT(MONTH FROM CURRENT_DATE),
            EXTRACT(YEAR FROM CURRENT_DATE),
            $6
          )
        `, [
          eleveId,
          montantTotal,
          typeFrais,
          modePaiement,
          reference || null,
          userId
        ]);

        console.log(`✅ Paiement enregistré: réinscription #${reinscriptionId} - ${montantTotal} GNF (preinscription_id = NULL)`);

        // Récupérer les échéances mises à jour
        const updatedEcheances = await query(`
          SELECT 
            id,
            type,
            echeance,
            montant,
            statut,
            date_echeance,
            date_paiement,
            reference_transaction,
            mode_paiement
          FROM echeances_paiement
          WHERE reinscription_id = $1
          ORDER BY 
            CASE echeance
              WHEN '1er_versement' THEN 1
              WHEN '2eme_versement' THEN 2
              WHEN '3eme_versement' THEN 3
              WHEN 'transport' THEN 4
              WHEN 'cantine' THEN 5
              WHEN 'fournitures' THEN 6
            END
        `, [reinscriptionId]);

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          message: "Paiement de la réinscription effectué avec succès",
          montant: montantTotal,
          restant: restant,
          echeances: updatedEcheances.rows,
          type: 'reinscription',
          type_frais: typeFrais,
          paiement_id: entityId
        });

      } else {
        // ============================================================
        // CAS PRÉINSCRIPTION
        // ============================================================
        const preinscriptionId = entityId;

        // Mettre à jour le montant restant
        await query(`
          UPDATE preinscriptions 
          SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
          WHERE id = $2
        `, [montantTotal, preinscriptionId]);

        // Vérifier si tous les paiements sont faits
        const remainingResult = await query(`
          SELECT SUM(montant) as total_restant
          FROM echeances_paiement
          WHERE preinscription_id = $1 AND statut = 'en_attente'
        `, [preinscriptionId]);

        restant = Number(remainingResult.rows[0].total_restant) || 0;

        if (restant === 0) {
          await query(`
            UPDATE preinscriptions 
            SET frais_statut = 'paye'
            WHERE id = $1
          `, [preinscriptionId]);
          console.log(`✅ Pré-inscription ${preinscriptionId} entièrement payée`);
        } else {
          // ⭐ Pour les préinscriptions, 'partiel' est accepté
          await query(`
            UPDATE preinscriptions 
            SET frais_statut = 'partiel'
            WHERE id = $1 AND frais_statut != 'paye'
          `, [preinscriptionId]);
          console.log(`⚠️ Pré-inscription ${preinscriptionId} partiellement payée (reste: ${restant} GNF)`);
        }

        // ⭐ Déterminer le type de frais
        const typesInclus = [...new Set(echeances.map((e: any) => e.type))];
        console.log(`📋 Types d'échéances inclus: ${typesInclus.join(', ')}`);

        if (typesInclus.includes('inscription')) {
          typeFrais = 'inscription';
        } else if (typesInclus.includes('transport')) {
          typeFrais = 'transport';
        } else if (typesInclus.includes('cantine')) {
          typeFrais = 'cantine';
        } else if (typesInclus.includes('fournitures')) {
          typeFrais = 'librairie';
        } else {
          typeFrais = 'inscription';
        }

        console.log(`📋 Type de frais pour préinscription: ${typeFrais}`);

        // ⭐ Pour les préinscriptions, on met preinscription_id = l'ID de la préinscription
        await query(`
          INSERT INTO paiements (
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
            $1,
            $2,
            $3,
            $4,
            $5,
            'valide',
            CURRENT_DATE,
            EXTRACT(MONTH FROM CURRENT_DATE),
            EXTRACT(YEAR FROM CURRENT_DATE),
            $6
          )
        `, [
          preinscriptionId,
          montantTotal,
          typeFrais,
          modePaiement,
          reference || null,
          userId
        ]);

        console.log(`✅ Paiement enregistré: préinscription #${preinscriptionId} - ${montantTotal} GNF (type_frais: ${typeFrais})`);

        // Récupérer les échéances mises à jour
        const updatedEcheances = await query(`
          SELECT 
            id,
            type,
            echeance,
            montant,
            statut,
            date_echeance,
            date_paiement,
            reference_transaction,
            mode_paiement
          FROM echeances_paiement
          WHERE preinscription_id = $1
          ORDER BY 
            CASE echeance
              WHEN '1er_versement' THEN 1
              WHEN '2eme_versement' THEN 2
              WHEN '3eme_versement' THEN 3
              WHEN 'transport' THEN 4
              WHEN 'cantine' THEN 5
              WHEN 'fournitures' THEN 6
            END
        `, [preinscriptionId]);

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          message: "Paiement effectué avec succès",
          montant: montantTotal,
          restant: restant,
          echeances: updatedEcheances.rows,
          type: 'preinscription',
          type_frais: typeFrais,
          paiement_id: entityId
        });
      }
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement multiple:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error as Error).message
    }, { status: 500 });
  }
}