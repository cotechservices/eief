// app/api/parent/paiement-services/route.ts
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
        error: "Non autorisé" 
      }, { status: 403 });
    }

    const body = await request.json();
    const { preinscriptionId, services, modePaiement, reference } = body;

    const totalServices = (services.transport || 0) + (services.cantine || 0) + (services.fournitures || 0);

    if (totalServices === 0) {
      return NextResponse.json({ error: "Aucun service à payer" }, { status: 400 });
    }

    // Vérifier que la pré-inscription existe
    const preinscription = await query(`
      SELECT * FROM preinscriptions WHERE id = $1
    `, [preinscriptionId]);

    if (preinscription.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    await query('BEGIN');

    try {
      // ⭐ Déterminer le type de frais pour chaque service
      // Si un seul service est payé, utiliser son type
      // Sinon, utiliser 'autre' ou 'inscription'
      let typeFrais = 'autre';
      const serviceTypes = [];
      
      if (services.transport > 0) serviceTypes.push('transport');
      if (services.cantine > 0) serviceTypes.push('cantine');
      if (services.fournitures > 0) serviceTypes.push('librairie'); // Note: fournitures -> librairie
      
      if (serviceTypes.length === 1) {
        typeFrais = serviceTypes[0];
      } else {
        // Si plusieurs services, on peut soit les regrouper en 'autre'
        // soit créer un paiement par service
        typeFrais = 'autre';
      }

      // ⭐ Option 1: Payer tous les services en un seul paiement
      await query(`
        INSERT INTO paiements (
          preinscription_id,
          montant,
          type_frais,
          mode_paiement,
          reference_transaction,
          statut,
          date_paiement,
          saisie_par
        ) VALUES (
          $1, $2, $3, $4, $5, 'valide', CURRENT_DATE,
          (SELECT id FROM utilisateurs WHERE email = $6)
        )
      `, [
        preinscriptionId,
        totalServices,
        typeFrais, // ⭐ Utiliser un type valide
        modePaiement,
        reference || null,
        session.user.email
      ]);

      // ⭐ Option 2: Créer un paiement par service (plus détaillé)
      // Décommenter cette partie si vous voulez des paiements séparés
      /*
      if (services.transport > 0) {
        await query(`
          INSERT INTO paiements (
            preinscription_id, montant, type_frais, mode_paiement, 
            reference_transaction, statut, date_paiement, saisie_par
          ) VALUES ($1, $2, 'transport', $3, $4, 'valide', CURRENT_DATE,
            (SELECT id FROM utilisateurs WHERE email = $5)
          )
        `, [preinscriptionId, services.transport, modePaiement, reference || null, session.user.email]);
      }
      
      if (services.cantine > 0) {
        await query(`
          INSERT INTO paiements (
            preinscription_id, montant, type_frais, mode_paiement, 
            reference_transaction, statut, date_paiement, saisie_par
          ) VALUES ($1, $2, 'cantine', $3, $4, 'valide', CURRENT_DATE,
            (SELECT id FROM utilisateurs WHERE email = $5)
          )
        `, [preinscriptionId, services.cantine, modePaiement, reference || null, session.user.email]);
      }
      
      if (services.fournitures > 0) {
        await query(`
          INSERT INTO paiements (
            preinscription_id, montant, type_frais, mode_paiement, 
            reference_transaction, statut, date_paiement, saisie_par
          ) VALUES ($1, $2, 'librairie', $3, $4, 'valide', CURRENT_DATE,
            (SELECT id FROM utilisateurs WHERE email = $5)
          )
        `, [preinscriptionId, services.fournitures, modePaiement, reference || null, session.user.email]);
      }
      */

      // Mettre à jour le montant restant
      await query(`
        UPDATE preinscriptions 
        SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
        WHERE id = $2
      `, [totalServices, preinscriptionId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Services optionnels payés avec succès",
        montant: totalServices,
        type_frais: typeFrais
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement services:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}