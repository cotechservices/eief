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

    // Récupérer les échéances
    const placeholders = echeancesIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    const echeancesResult = await query(`
      SELECT ep.*, p.id as preinscription_id, p.parent_id, p.frais_montant
      FROM echeances_paiement ep
      JOIN preinscriptions p ON ep.preinscription_id = p.id
      WHERE ep.id IN (${placeholders}) AND ep.statut = 'en_attente'
    `, echeancesIds);

    if (echeancesResult.rows.length === 0) {
      return NextResponse.json({ error: "Aucune échéance valide trouvée" }, { status: 404 });
    }

    const echeances = echeancesResult.rows;
    const preinscriptionId = echeances[0].preinscription_id;
    const montantTotal = echeances.reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    console.log(`💰 Montant total: ${montantTotal} GNF pour ${echeances.length} échéances`);

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

      // Mettre à jour le montant restant de la pré-inscription
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

      const restant = Number(remainingResult.rows[0].total_restant) || 0;
      
      if (restant === 0) {
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = 'paye'
          WHERE id = $1
        `, [preinscriptionId]);
        console.log(`✅ Pré-inscription ${preinscriptionId} entièrement payée`);
      } else {
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = 'partiel'
          WHERE id = $1 AND frais_statut != 'paye'
        `, [preinscriptionId]);
        console.log(`⚠️ Pré-inscription ${preinscriptionId} partiellement payée (reste: ${restant} GNF)`);
      }

      // Déterminer le type de frais pour l'insertion dans paiements
      // ⭐ SI c'est un paiement groupé (frais_seuls ou tout) ET qu'il y a une échéance d'inscription
      // ALORS le type doit être 'inscription'
      // SINON on prend le type de la première échéance
      let typeFrais = 'inscription';
      const typesInclus = [...new Set(echeances.map((e: any) => e.type))];
      console.log(`📋 Types d'échéances inclus: ${typesInclus.join(', ')}`);

      if (typesInclus.length > 0) {
        if (typesInclus.includes('inscription')) {
          // Si l'inscription est dans la liste, on utilise 'inscription' comme type principal
          typeFrais = 'inscription';
        } else {
          // Sinon, on prend le premier type de la liste
          const typeMapping: { [key: string]: string } = {
            'transport': 'transport',
            'cantine': 'cantine',
            'fournitures': 'librairie'
          };
          typeFrais = typeMapping[typesInclus[0]] || 'autre';
        }
      }
      console.log(`🏷️ Type de frais pour le paiement: ${typeFrais}`);

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
        preinscriptionId,
        montantTotal,
        typeFrais,
        modePaiement,
        reference || null,
        session.user.email
      ]);

      await query('COMMIT');

      // ⭐ RÉCUPÉRER LES DONNÉES MISES À JOUR
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

      console.log(`✅ Paiement enregistré: ${montantTotal} GNF (${typeFrais}) pour pré-inscription ${preinscriptionId}`);
      console.log(`📊 Échéances mises à jour: ${updatedEcheances.rows.length} échéances`);

      return NextResponse.json({ 
        success: true, 
        message: "Paiement effectué avec succès",
        montant: montantTotal,
        restant: restant,
        echeances: updatedEcheances.rows,
        echeances_originales: echeances.map((e: any) => ({ id: e.id, type: e.type, echeance: e.echeance })),
        type_frais: typeFrais
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement multiple:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}