// app/api/parent/paiement-personnalise/route.ts
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
    const { 
      id,
      type,
      montant,
      modePaiement,
      reference 
    } = body;

    if (!id || !type || !montant || montant <= 0 || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const table = type === 'reinscription' ? 'reinscriptions' : 'preinscriptions';
    const idField = type === 'reinscription' ? 'reinscription_id' : 'preinscription_id';
    const typeFrais = type === 'reinscription' ? 'reinscription' : 'inscription';

    await query('BEGIN');

    try {
      // ⭐ 1. Vérifier que l'enregistrement existe
      const checkResult = await query(`
        SELECT ${table}.*
        FROM ${table}
        WHERE ${table}.id = $1
      `, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ 
          error: type === 'reinscription' ? "Réinscription non trouvée" : "Pré-inscription non trouvée" 
        }, { status: 404 });
      }

      // ⭐ 2. Récupérer les échéances en attente
      const echeancesResult = await query(`
        SELECT 
          id,
          montant,
          type,
          echeance,
          statut
        FROM echeances_paiement
        WHERE ${idField} = $1 AND statut = 'en_attente'
        ORDER BY 
          CASE type
            WHEN '${typeFrais}' THEN 1
            WHEN 'transport' THEN 2
            WHEN 'cantine' THEN 3
            WHEN 'fournitures' THEN 4
            ELSE 5
          END,
          CASE echeance
            WHEN '1er_versement' THEN 1
            WHEN '2eme_versement' THEN 2
            WHEN '3eme_versement' THEN 3
            ELSE 4
          END
      `, [id]);

      const echeances = echeancesResult.rows;
      const totalRestant = echeances.reduce((sum: number, e: any) => sum + Number(e.montant), 0);

      // ⭐ 3. Vérifier le montant
      let montantAPayer = Math.min(montant, totalRestant);

      if (montantAPayer <= 0) {
        await query('ROLLBACK');
        return NextResponse.json({ 
          error: "Aucun montant à payer ou déjà payé" 
        }, { status: 400 });
      }

      // ⭐ 4. Répartir le paiement sur les échéances
      let montantRestantAPayer = montantAPayer;
      let echeancesPayees = [];

      for (const echeance of echeances) {
        if (montantRestantAPayer <= 0) break;

        const montantEcheance = Number(echeance.montant);
        const montantPaye = Math.min(montantRestantAPayer, montantEcheance);

        if (montantPaye >= montantEcheance) {
          // Paiement complet
          await query(`
            UPDATE echeances_paiement 
            SET statut = 'paye',
                date_paiement = CURRENT_DATE,
                reference_transaction = $1,
                mode_paiement = $2,
                updated_at = NOW()
            WHERE id = $3
          `, [reference || null, modePaiement, echeance.id]);
          echeancesPayees.push(echeance.id);
        } else {
          // ⭐ Paiement partiel - Créer une nouvelle ligne
          await query(`
            INSERT INTO echeances_paiement (
              ${idField}, type, echeance, montant, statut, date_echeance, 
              date_paiement, mode_paiement, reference_transaction
            ) VALUES (
              $1, $2, $3 || '_partiel', $4, 'paye', CURRENT_DATE, 
              CURRENT_DATE, $5, $6
            )
          `, [id, echeance.type, echeance.echeance, montantPaye, modePaiement, reference || null]);

          // Réduire le montant de l'échéance originale
          await query(`
            UPDATE echeances_paiement 
            SET montant = montant - $1
            WHERE id = $2
          `, [montantPaye, echeance.id]);
        }

        montantRestantAPayer -= montantPaye;
      }

      // ⭐ 5. Enregistrer le paiement
      const userResult = await query(`
        SELECT id FROM utilisateurs WHERE email = $1
      `, [session.user.email]);
      const userId = userResult.rows[0]?.id || null;

      // Déterminer le type de frais principal
      let typeFraisPrincipal = typeFrais;
      if (echeancesPayees.length > 0) {
        const premierType = echeances.find((e: any) => echeancesPayees.includes(e.id))?.type;
        if (premierType && premierType !== typeFrais) {
          typeFraisPrincipal = premierType;
        }
      }

      await query(`
        INSERT INTO paiements (
          preinscription_id,
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
          $4,
          $5,
          $6,
          'valide',
          CURRENT_DATE,
          EXTRACT(MONTH FROM CURRENT_DATE),
          EXTRACT(YEAR FROM CURRENT_DATE),
          $7
        )
      `, [
        type === 'preinscription' ? id : null,
        type === 'reinscription' ? id : null,
        montantAPayer,
        typeFraisPrincipal,
        modePaiement,
        reference || null,
        userId
      ]);

      // ⭐ 6. Mettre à jour le statut
      const nouveauRestant = totalRestant - montantAPayer;

      await query(`
        UPDATE ${table} 
        SET 
          montant_restant_plan = $1,
          frais_statut = CASE 
            WHEN $1 <= 0 THEN 'paye'
            ELSE 'partiel'
          END,
          frais_mode_paiement = CASE WHEN $2 IS NOT NULL THEN $2 ELSE frais_mode_paiement END,
          frais_reference = CASE WHEN $3 IS NOT NULL THEN $3 ELSE frais_reference END,
          frais_date_paiement = CASE 
            WHEN $1 <= 0 OR frais_statut = 'non_paye' THEN NOW() 
            ELSE frais_date_paiement 
          END
        WHERE id = $4
      `, [nouveauRestant, modePaiement, reference || null, id]);

      // ⭐ 7. Récupérer les échéances mises à jour
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
        WHERE ${idField} = $1
        ORDER BY 
          CASE type
            WHEN '${typeFrais}' THEN 1
            WHEN 'transport' THEN 2
            WHEN 'cantine' THEN 3
            WHEN 'fournitures' THEN 4
            ELSE 5
          END,
          CASE echeance
            WHEN '1er_versement' THEN 1
            WHEN '2eme_versement' THEN 2
            WHEN '3eme_versement' THEN 3
            ELSE 4
          END
      `, [id]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Paiement effectué avec succès",
        montant_paye: montantAPayer,
        montant_restant: nouveauRestant,
        est_termine: nouveauRestant <= 0,
        echeances: updatedEcheances.rows,
        type: type,
        date_paiement: new Date().toISOString()
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement personnalisé:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error as Error).message 
    }, { status: 500 });
  }
}