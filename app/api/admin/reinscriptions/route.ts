// app/api/admin/reinscriptions/route.ts - Version complète avec DELETE corrigé
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Récupérer les demandes de réinscription
export async function GET(request: NextRequest) {
  console.log("=== API ADMIN REINSCRIPTIONS GET ===");
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    // ⭐ Si un ID spécifique est demandé, retourner les détails complets
    if (id) {
      const detailResult = await query(`
        SELECT 
          r.*,
          -- ⭐ PLAN DE PAIEMENT depuis la table classes
          COALESCE(
            (SELECT JSON_BUILD_OBJECT(
              'id', c.id,
              'premier_versement', c.reinscription_premier_versement,
              'deuxieme_versement', c.reinscription_deuxieme_versement,
              'troisieme_versement', c.reinscription_troisieme_versement,
              'total', c.reinscription_total_versement,
              'type_inscription', 'reinscription',
              'niveau', c.niveau,
              'nom_classe', c.nom
            )
            FROM classes c
            WHERE c.id = r.classe_id
            LIMIT 1),
            NULL
          ) as plan_paiement,
          -- ⭐ Récupérer les échéances de paiement
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', e.id,
                'type', e.type,
                'echeance', e.echeance,
                'montant', e.montant,
                'statut', e.statut,
                'date_echeance', e.date_echeance,
                'date_paiement', e.date_paiement,
                'reference_transaction', e.reference_transaction,
                'mode_paiement', e.mode_paiement
              )
              ORDER BY 
                CASE e.echeance
                  WHEN '1er_versement' THEN 1
                  WHEN '2eme_versement' THEN 2
                  WHEN '3eme_versement' THEN 3
                  WHEN 'transport' THEN 4
                  WHEN 'cantine' THEN 5
                  WHEN 'fournitures' THEN 6
                  ELSE 7
                END
            )
            FROM echeances_paiement e
            WHERE e.reinscription_id = r.id),
            '[]'::json
          ) as echeances_paiement,
          -- ⭐ Récupérer les services optionnels depuis les échéances
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'type', e.type,
                'echeance', e.echeance,
                'montant', e.montant,
                'statut', e.statut
              )
            )
            FROM echeances_paiement e
            WHERE e.reinscription_id = r.id AND e.type IN ('transport', 'cantine', 'fournitures')),
            '[]'::json
          ) as services_optionnels
        FROM reinscriptions r
        WHERE r.id = $1
      `, [id]);

      if (detailResult.rows.length === 0) {
        return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
      }

      const data = detailResult.rows[0];
      const echeances = data.echeances_paiement || [];
      const servicesOptionnels = data.services_optionnels || [];

      // ⭐ Calculer les totaux des services
      let totalTransport = 0;
      let totalCantine = 0;
      let totalFournitures = 0;

      for (const service of servicesOptionnels) {
        if (service.type === 'transport') totalTransport += Number(service.montant) || 0;
        if (service.type === 'cantine') totalCantine += Number(service.montant) || 0;
        if (service.type === 'fournitures') totalFournitures += Number(service.montant) || 0;
      }

      // ⭐ Calculer les paiements effectués
      const paiementsResult = await query(`
        SELECT COALESCE(SUM(montant), 0) as total_paye
        FROM echeances_paiement
        WHERE reinscription_id = $1 AND statut = 'paye'
      `, [id]);
      const fraisPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

      console.log(` Montant payé (via échéances) pour la réinscription ${id}: ${fraisPaye} GNF`);

      // ⭐ Vérifier les échéances payées
      const echeancesInscription = echeances.filter((e: any) => e.type === 'reinscription');
      const toutesPayees = echeancesInscription.length > 0 && echeancesInscription.every((e: any) => e.statut === 'paye');
      
      let fraisStatut = data.frais_statut;
      if (toutesPayees && fraisStatut !== 'paye') {
        await query(`
          UPDATE reinscriptions SET frais_statut = 'paye' WHERE id = $1
        `, [id]);
        fraisStatut = 'paye';
      }

      // ⭐ Calculer le montant total
      const montantFrais = Number(data.montant_frais) || 0;
      const totalServices = totalTransport + totalCantine + totalFournitures;
      const totalGeneral = montantFrais + totalServices;
      const reste = Math.max(0, totalGeneral - fraisPaye);

      console.log("📊 Détails des frais pour réinscription:", {
        inscription: montantFrais,
        transport: totalTransport,
        cantine: totalCantine,
        fournitures: totalFournitures,
        total: totalGeneral,
        paye: fraisPaye,
        reste: reste
      });

      return NextResponse.json({
        ...data,
        frais_statut: fraisStatut,
        echeances_paiement: echeances,
        services_optionnels: servicesOptionnels,
        plan_paiement: data.plan_paiement,
        transport_montant: totalTransport,
        cantine_montant: totalCantine,
        fournitures_montant: totalFournitures,
        montant_total: totalGeneral,
        details_frais: {
          inscription: montantFrais,
          cantine: totalCantine,
          transport: totalTransport,
          librairie: totalFournitures,
          scolarite: 0,
          total: totalGeneral,
          paye: fraisPaye,
          reste: reste
        }
      });
    }

    // ⭐ Sinon, retourner la liste des réinscriptions
    let sql = `
      SELECT 
        r.id,
        r.numero_dossier,
        r.date_reinscription,
        r.statut,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.frais_reference,
        r.frais_date_paiement,
        r.acte_naissance_url,
        r.photo_url,
        r.bulletin_url,
        r.enfant_nom,
        r.enfant_prenom,
        r.date_naissance,
        r.lieu_naissance,
        r.sexe,
        r.niveau,
        r.classe_nom as classe,
        r.parent_nom,
        r.parent_prenom,
        r.parent_email,
        r.parent_telephone,
        r.montant_total_plan,
        r.montant_restant_plan
      FROM reinscriptions r
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND r.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (r.enfant_nom ILIKE $${params.length + 1} OR r.enfant_prenom ILIKE $${params.length + 1} OR r.numero_dossier ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY r.date_reinscription DESC`;

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut d'une réinscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    const result = await query(`
      UPDATE reinscriptions 
      SET statut = $1, observations = $2, date_traitement = NOW()
      WHERE id = $3 
      RETURNING *
    `, [statut, observations, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    // Si validé, mettre à jour la classe de l'élève
    if (statut === "valide") {
      const reinscription = result.rows[0];
      if (reinscription.classe_id) {
        await query(`
          UPDATE eleves 
          SET classe_id = $1 
          WHERE id = $2
        `, [reinscription.classe_id, reinscription.eleve_id]);
      }
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Réinscriptions (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ DELETE - Supprimer une réinscription (avec suppression en cascade)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Vérifier si la réinscription existe
    const checkResult = await query(`
      SELECT r.id, r.enfant_nom, r.enfant_prenom, r.statut
      FROM reinscriptions r
      WHERE r.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const reinscription = checkResult.rows[0];

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // 1. Supprimer les paiements associés (via preinscription_id = id)
      await query(`
        DELETE FROM paiements 
        WHERE preinscription_id = $1
      `, [id]);

      // 2. Supprimer les échéances de paiement
      await query(`
        DELETE FROM echeances_paiement 
        WHERE reinscription_id = $1
      `, [id]);

      // 3. Supprimer la réinscription
      await query(`
        DELETE FROM reinscriptions 
        WHERE id = $1
      `, [id]);

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: `Réinscription de ${reinscription.enfant_prenom} ${reinscription.enfant_nom} supprimée avec succès` 
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
    console.error("Erreur API Réinscriptions (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}