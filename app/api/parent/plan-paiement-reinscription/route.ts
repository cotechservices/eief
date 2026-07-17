// app/api/parent/plan-paiement-reinscription/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const reinscriptionId = url.searchParams.get("reinscriptionId");

    if (!reinscriptionId) {
      return NextResponse.json({ error: "ID de réinscription requis" }, { status: 400 });
    }

    // ⭐ Récupérer la réinscription avec les montants depuis la table classes
    const result = await query(`
      SELECT 
        r.id,
        r.niveau,
        r.classe_nom as classe,
        r.frais_statut,
        r.montant_total_plan,
        r.montant_restant_plan,
        r.montant_frais,
        r.enfant_nom,
        r.enfant_prenom,
        r.classe_id,
        r.eleve_id,
        -- ⭐ Montants de réinscription depuis la table classes
        COALESCE(c.reinscription_premier_versement, 0) as premier_versement,
        COALESCE(c.reinscription_deuxieme_versement, 0) as deuxieme_versement,
        COALESCE(c.reinscription_troisieme_versement, 0) as troisieme_versement,
        COALESCE(c.reinscription_total_versement, c.total_versement, 0) as total_versement
      FROM reinscriptions r
      LEFT JOIN classes c ON r.classe_id = c.id
      WHERE r.id = $1
    `, [reinscriptionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const data = result.rows[0];

    // ⭐ Construire le plan avec les montants de réinscription depuis la table classes
    const plan = {
      id: data.id,
      niveau: data.niveau || "Non défini",
      classe: data.classe,
      premier_versement: Number(data.premier_versement) || 0,
      deuxieme_versement: Number(data.deuxieme_versement) || 0,
      troisieme_versement: Number(data.troisieme_versement) || 0,
      total: Number(data.total_versement) || Number(data.montant_total_plan) || 0,
      frais_inscription: Number(data.montant_frais) || 0,
      type_inscription: 'reinscription'
    };

    console.log(`📊 Plan pour la réinscription ${reinscriptionId}:`, plan);

    // ⭐ Récupérer les services optionnels (transport, cantine, fournitures)
    const servicesResult = await query(`
      SELECT 
        type,
        echeance,
        montant,
        statut,
        date_echeance,
        date_paiement,
        reference_transaction,
        mode_paiement
      FROM echeances_paiement
      WHERE reinscription_id = $1 AND type IN ('transport', 'cantine', 'fournitures')
    `, [reinscriptionId]);

    // ⭐ Calculer les totaux des services
    let totalTransport = 0;
    let totalCantine = 0;
    let totalFournitures = 0;
    const servicesDetails = {
      transport: [],
      cantine: [],
      fournitures: []
    };

    for (const service of servicesResult.rows) {
      const montant = Number(service.montant) || 0;
      if (service.type === 'transport') {
        totalTransport += montant;
        servicesDetails.transport.push(service);
      } else if (service.type === 'cantine') {
        totalCantine += montant;
        servicesDetails.cantine.push(service);
      } else if (service.type === 'fournitures') {
        totalFournitures += montant;
        servicesDetails.fournitures.push(service);
      }
    }

    const totalServices = totalTransport + totalCantine + totalFournitures;

    // ⭐ Récupérer les échéances de réinscription
    const echeancesResult = await query(`
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
        CASE type
          WHEN 'reinscription' THEN 1
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
    `, [reinscriptionId]);

    console.log(`📋 Échéances pour la réinscription ${reinscriptionId}:`, echeancesResult.rows);

    // ⭐ Filtrer les échéances de réinscription
    const echeancesReinscription = echeancesResult.rows.filter(
      (e: any) => e.type === 'reinscription'
    );

    // ⭐ UNIQUE SOURCE : Calculer le montant restant à partir des paiements UNIQUEMENT
    const paiementsResult = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye
      FROM paiements
      WHERE reinscription_id = $1 AND statut = 'valide'
    `, [reinscriptionId]);

    const totalPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;
    const totalInscription = Number(plan.total) || 0;
    const totalGeneral = totalInscription + totalServices;
    const restantCalcul = Math.max(0, totalGeneral - totalPaye);

    console.log(`💰 Calcul restant: total=${totalGeneral}, paye=${totalPaye}, restant=${restantCalcul}`);

    // ⭐ Mettre à jour le montant restant
    await query(`
      UPDATE reinscriptions 
      SET montant_restant_plan = $1
      WHERE id = $2
    `, [restantCalcul, reinscriptionId]);

    // ⭐ Mettre à jour le statut si nécessaire
    let nouveauStatut = data.frais_statut || 'non_paye';
    if (totalGeneral > 0) {
      if (restantCalcul === 0) {
        nouveauStatut = 'paye';
      } else if (totalPaye > 0) {
        nouveauStatut = 'partiel';
      }
    }
    
    if (nouveauStatut !== data.frais_statut) {
      await query(`
        UPDATE reinscriptions 
        SET frais_statut = $1
        WHERE id = $2
      `, [nouveauStatut, reinscriptionId]);
      console.log(`✅ Statut mis à jour: ${nouveauStatut}`);
    }

    // ⭐ Construire la réponse
    const response = {
      ...data,
      plan: plan,
      echeances: echeancesResult.rows,
      echeances_reinscription: echeancesReinscription,
      services_optionnels: {
        transport: {
          total: totalTransport,
          details: servicesDetails.transport
        },
        cantine: {
          total: totalCantine,
          details: servicesDetails.cantine
        },
        fournitures: {
          total: totalFournitures,
          details: servicesDetails.fournitures
        },
        total_services: totalServices
      },
      est_reinscription: true,
      est_paye: nouveauStatut === 'paye',
      frais_inscription: Number(data.montant_frais) || 0,
      restant_calcule: restantCalcul,
      total_paye: totalPaye,
      total_general: totalGeneral,
      enfant_nom: data.enfant_nom,
      enfant_prenom: data.enfant_prenom,
      eleve_id: data.eleve_id
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erreur plan paiement réinscription:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error as Error).message
    }, { status: 500 });
  }
}