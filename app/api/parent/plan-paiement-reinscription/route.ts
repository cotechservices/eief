// app/api/parent/plan-paiement-reinscription/route.ts - VERSION COMPLÈTE CORRIGÉE
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
        c.niveau as niveau_classe,
        c.nom as classe_nom_complet,
        COALESCE(c.reinscription_premier_versement, 0) as premier_versement,
        COALESCE(c.reinscription_deuxieme_versement, 0) as deuxieme_versement,
        COALESCE(c.reinscription_troisieme_versement, 0) as troisieme_versement,
        COALESCE(c.reinscription_total_versement, 0) as total_versement
      FROM reinscriptions r
      LEFT JOIN classes c ON r.classe_id = c.id
      WHERE r.id = $1
    `, [reinscriptionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const data = result.rows[0];
    const niveauAffichage = data.niveau_classe || data.niveau || "Non défini";

    const plan = {
      id: data.id,
      niveau: niveauAffichage,
      classe: data.classe_nom_complet || data.classe,
      premier_versement: Number(data.premier_versement) || 0,
      deuxieme_versement: Number(data.deuxieme_versement) || 0,
      troisieme_versement: Number(data.troisieme_versement) || 0,
      total: Number(data.total_versement) || Number(data.montant_total_plan) || 0,
      type_inscription: 'reinscription'
    };

    console.log(` Plan pour la réinscription ${reinscriptionId}:`, plan);

    // ⭐ Récupérer TOUTES les échéances
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

    console.log(` Échéances trouvées: ${echeancesResult.rows.length}`);

    // ⭐ Séparer les échéances par type
    const echeancesReinscription = echeancesResult.rows.filter((e: any) => e.type === 'reinscription');
    const echeancesTransport = echeancesResult.rows.filter((e: any) => e.type === 'transport');
    const echeancesCantine = echeancesResult.rows.filter((e: any) => e.type === 'cantine');
    const echeancesFournitures = echeancesResult.rows.filter((e: any) => e.type === 'fournitures');

    // ⭐ Calculer les totaux des services
    const totalTransport = echeancesTransport.reduce((sum: number, e: any) => sum + Number(e.montant), 0);
    const totalCantine = echeancesCantine.reduce((sum: number, e: any) => sum + Number(e.montant), 0);
    const totalFournitures = echeancesFournitures.reduce((sum: number, e: any) => sum + Number(e.montant), 0);
    const totalServices = totalTransport + totalCantine + totalFournitures;

    // ⭐ Recalculer le montant restant
    const restantCalcul = echeancesResult.rows
      .filter((e: any) => e.statut === 'en_attente')
      .reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    // ⭐ SI AUCUNE ÉCHÉANCE DE RÉINSCRIPTION N'EXISTE, LES CRÉER
    if (echeancesReinscription.length === 0 && plan.total > 0) {
      console.log(`⚠️ Création automatique des échéances de réinscription...`);

      const versements = [
        { echeance: '1er_versement', montant: plan.premier_versement },
        { echeance: '2eme_versement', montant: plan.deuxieme_versement },
        { echeance: '3eme_versement', montant: plan.troisieme_versement }
      ];

      for (const v of versements) {
        if (v.montant > 0) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, type, echeance, montant, date_echeance, statut
            ) VALUES ($1, 'reinscription', $2, $3, NOW() + INTERVAL '1 day', 'en_attente')
          `, [reinscriptionId, v.echeance, v.montant]);
        }
      }

      // Recharger les échéances
      const newResult = await query(`
        SELECT id, type, echeance, montant, statut, date_echeance, date_paiement
        FROM echeances_paiement WHERE reinscription_id = $1
      `, [reinscriptionId]);

      const newRestant = newResult.rows
        .filter((e: any) => e.statut === 'en_attente')
        .reduce((sum: number, e: any) => sum + Number(e.montant), 0);

      await query(`UPDATE reinscriptions SET montant_restant_plan = $1 WHERE id = $2`, [newRestant, reinscriptionId]);

      return NextResponse.json({
        ...data,
        plan: plan,
        echeances: newResult.rows,
        echeances_reinscription: newResult.rows.filter((e: any) => e.type === 'reinscription'),
        echeances_services: newResult.rows.filter((e: any) => e.type !== 'reinscription'),
        services_optionnels: {
          transport: { total: totalTransport, details: echeancesTransport },
          cantine: { total: totalCantine, details: echeancesCantine },
          fournitures: { total: totalFournitures, details: echeancesFournitures },
          total_services: totalServices
        },
        est_reinscription: true,
        est_paye: false,
        frais_inscription: Number(data.montant_frais) || 0,
        restant_calcule: newRestant,
        enfant_nom: data.enfant_nom,
        enfant_prenom: data.enfant_prenom,
        montant_total: plan.total,
        montant_paye: plan.total - newRestant
      });
    }

    // ⭐ Mettre à jour le montant restant
    await query(`
      UPDATE reinscriptions SET montant_restant_plan = $1 WHERE id = $2
    `, [restantCalcul, reinscriptionId]);

    // ⭐ Construire la réponse complète
    return NextResponse.json({
      ...data,
      plan: plan,
      echeances: echeancesResult.rows,
      echeances_reinscription: echeancesReinscription,
      echeances_services: echeancesResult.rows.filter((e: any) => e.type !== 'reinscription'),
      services_optionnels: {
        transport: {
          total: totalTransport,
          details: echeancesTransport.map((e: any) => ({
            nom: e.echeance || 'Transport',
            montant: Number(e.montant),
            statut: e.statut
          }))
        },
        cantine: {
          total: totalCantine,
          details: echeancesCantine.map((e: any) => ({
            nom: e.echeance || 'Cantine',
            montant: Number(e.montant),
            statut: e.statut
          }))
        },
        fournitures: {
          total: totalFournitures,
          details: echeancesFournitures.map((e: any) => ({
            nom: e.echeance || 'Fournitures',
            montant: Number(e.montant),
            statut: e.statut
          }))
        },
        total_services: totalServices
      },
      est_reinscription: true,
      est_paye: data.frais_statut === 'paye',
      frais_inscription: Number(data.montant_frais) || 0,
      restant_calcule: restantCalcul,
      enfant_nom: data.enfant_nom,
      enfant_prenom: data.enfant_prenom,
      montant_total: Number(data.montant_total_plan) || plan.total || 0,
      montant_paye: (Number(data.montant_total_plan) || plan.total || 0) - restantCalcul
    });

  } catch (error) {
    console.error("Erreur plan paiement réinscription:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error as Error).message
    }, { status: 500 });
  }
}