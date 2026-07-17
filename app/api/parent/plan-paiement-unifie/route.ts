// app/api/parent/plan-paiement-unifie/route.ts
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
    const type = url.searchParams.get("type") || "preinscription";
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // ⭐ Déterminer la table et les champs
    const table = type === 'reinscription' ? 'reinscriptions' : 'preinscriptions';
    const prefix = type === 'reinscription' ? 'r' : 'p';
    const idField = type === 'reinscription' ? 'reinscription_id' : 'preinscription_id';
    const typeFrais = type === 'reinscription' ? 'reinscription' : 'inscription';

    // ⭐ 1. Récupérer les informations de base (comme dans l'ancien API)
    const infoResult = await query(`
      SELECT 
        ${prefix}.id,
        ${prefix}.niveau,
        ${prefix}.classe,
        ${prefix}.frais_statut,
        ${prefix}.montant_total_plan,
        ${prefix}.montant_restant_plan,
        ${prefix}.montant_frais,
        ${prefix}.enfant_nom,
        ${prefix}.enfant_prenom,
        ${prefix}.parent_id,
        ${prefix}.type_inscription,
        ${prefix}.est_reinscription,
        ${prefix}.created_at,
        c.id as classe_id,
        c.niveau as niveau_classe,
        c.nom as classe_nom_complet,
        COALESCE(c.premier_versement, 0) as premier_versement,
        COALESCE(c.deuxieme_versement, 0) as deuxieme_versement,
        COALESCE(c.troisieme_versement, 0) as troisieme_versement,
        COALESCE(c.total_versement, 0) as total_versement,
        COALESCE(c.reinscription_premier_versement, 0) as reinscription_premier_versement,
        COALESCE(c.reinscription_deuxieme_versement, 0) as reinscription_deuxieme_versement,
        COALESCE(c.reinscription_troisieme_versement, 0) as reinscription_troisieme_versement,
        COALESCE(c.reinscription_total_versement, 0) as reinscription_total_versement,
        COALESCE(c.frais_inscription, 0) as frais_inscription
      FROM ${table} ${prefix}
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(${prefix}.classe)
      WHERE ${prefix}.id = $1
    `, [id]);

    if (infoResult.rows.length === 0) {
      return NextResponse.json({ error: "Enregistrement non trouvé" }, { status: 404 });
    }

    const data = infoResult.rows[0];
    const isReinscription = type === 'reinscription' || data.est_reinscription;

    // ⭐ 2. Construire le plan (comme dans l'ancien API)
    const plan = {
      id: null,
      niveau: data.niveau_classe || data.niveau,
      classe: data.classe_nom_complet || data.classe,
      premier_versement: Number(isReinscription ? data.reinscription_premier_versement : data.premier_versement) || 0,
      deuxieme_versement: Number(isReinscription ? data.reinscription_deuxieme_versement : data.deuxieme_versement) || 0,
      troisieme_versement: Number(isReinscription ? data.reinscription_troisieme_versement : data.troisieme_versement) || 0,
      total: Number(isReinscription ? data.reinscription_total_versement : data.total_versement) || Number(data.montant_total_plan) || 0,
      frais_inscription: Number(data.frais_inscription) || 0,
      type_inscription: isReinscription ? 'reinscription' : 'inscription'
    };

    console.log(`📋 Plan pour ${type} ${id}:`, plan);

    // ⭐ 3. Récupérer les services optionnels (comme dans l'ancien API)
    // Pour préinscription uniquement
    let transport = { rows: [{ total_transport: 0, details: [] }] };
    let cantine = { rows: [{ total_cantine: 0, details: [] }] };
    let fournitures = { rows: [{ total_fournitures: 0, details: [] }] };

    if (!isReinscription) {
      transport = await query(`
        SELECT 
          COALESCE(SUM(lt.prix_abonnement), 0) as total_transport,
          COALESCE(json_agg(
            json_build_object(
              'id', lt.id,
              'nom', lt.nom,
              'prix', lt.prix_abonnement,
              'horaire_matin', lt.horaire_matin,
              'horaire_soir', lt.horaire_soir
            )
          ) FILTER (WHERE lt.id IS NOT NULL AND lt.prix_abonnement > 0), '[]') as details
        FROM preinscriptions p
        LEFT JOIN preinscription_transport pt ON pt.preinscription_id = p.id
        LEFT JOIN lignes_transport lt ON pt.ligne_id = lt.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);

      cantine = await query(`
        SELECT 
          COALESCE(SUM(cm.prix_annuel), 0) as total_cantine,
          COALESCE(json_agg(
            json_build_object(
              'id', cm.id,
              'plat', cm.plat,
              'accompagnement', cm.accompagnement,
              'prix_annuel', cm.prix_annuel,
              'date', cm.date
            )
          ) FILTER (WHERE cm.id IS NOT NULL AND cm.prix_annuel > 0), '[]') as details
        FROM preinscriptions p
        LEFT JOIN preinscription_cantine pc ON pc.preinscription_id = p.id
        LEFT JOIN cantine_menus cm ON pc.menu_id = cm.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);

      fournitures = await query(`
        SELECT 
          COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total_fournitures,
          COALESCE(json_agg(
            json_build_object(
              'id', cf.id,
              'nom', al.nom,
              'quantite', cf.quantite,
              'prix_unitaire', cf.prix_unitaire,
              'total', cf.quantite * cf.prix_unitaire
            )
          ) FILTER (WHERE cf.id IS NOT NULL AND cf.quantite > 0), '[]') as details
        FROM preinscriptions p
        LEFT JOIN commandes_fournitures cf ON cf.preinscription_id = p.id
        LEFT JOIN articles_librairie al ON cf.article_id = al.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);
    }

    const totalTransport = Number(transport.rows[0]?.total_transport) || 0;
    const totalCantine = Number(cantine.rows[0]?.total_cantine) || 0;
    const totalFournitures = Number(fournitures.rows[0]?.total_fournitures) || 0;
    const totalServices = totalTransport + totalCantine + totalFournitures;

    // ⭐ 4. Récupérer les échéances (comme dans l'ancien API)
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

    const echeances = echeancesResult.rows || [];
    console.log(`📋 Échéances trouvées: ${echeances.length}`);

    // ⭐ 5. Filtrer les échéances par type
    const echeancesPrincipales = echeances.filter((e: any) => e.type === typeFrais);
    const echeancesServices = echeances.filter((e: any) => e.type !== typeFrais);

    // ⭐ 6. Calculer les totaux
    const restantCalcul = echeances
      .filter((e: any) => e.statut === 'en_attente')
      .reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    const payeCalcul = echeances
      .filter((e: any) => e.statut === 'paye')
      .reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    const totalGeneral = echeances.reduce((sum: number, e: any) => sum + Number(e.montant), 0);

    // ⭐ 7. Mettre à jour le montant restant
    await query(`
      UPDATE ${table} 
      SET montant_restant_plan = $1
      WHERE id = $2
    `, [restantCalcul, id]);

    // ⭐ 8. Construire la réponse
    const response = {
      ...data,
      plan: plan,
      echeances: echeances,
      echeances_principales: echeancesPrincipales,
      echeances_services: echeancesServices,
      services_optionnels: {
        transport: {
          total: totalTransport,
          details: transport.rows[0]?.details || []
        },
        cantine: {
          total: totalCantine,
          details: cantine.rows[0]?.details || []
        },
        fournitures: {
          total: totalFournitures,
          details: fournitures.rows[0]?.details || []
        },
        total_services: totalServices
      },
      totals: {
        total_principal: totalGeneral - totalServices,
        total_services: totalServices,
        total_general: totalGeneral,
        paye: payeCalcul,
        restant: restantCalcul,
        pourcentage_paye: totalGeneral > 0 ? Math.round((payeCalcul / totalGeneral) * 100) : 0
      },
      est_reinscription: isReinscription,
      est_paye: data.frais_statut === 'paye' || restantCalcul === 0,
      frais_inscription: Number(data.frais_inscription) || 0,
      restant_calcule: restantCalcul,
      enfant_nom: data.enfant_nom,
      enfant_prenom: data.enfant_prenom
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erreur plan paiement unifié:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error as Error).message 
    }, { status: 500 });
  }
}