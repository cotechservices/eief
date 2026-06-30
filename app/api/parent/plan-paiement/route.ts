// app/api/parent/plan-paiement/route.ts
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
    const preinscriptionId = url.searchParams.get("preinscriptionId");

    if (preinscriptionId) {
      // ⭐ Récupérer la pré-inscription avec les montants depuis la table classes
      const result = await query(`
        SELECT 
          p.id,
          p.niveau,
          p.classe,
          p.frais_statut,
          p.montant_total_plan,
          p.montant_restant_plan,
          p.type_inscription,
          -- ⭐ Montants depuis la table classes
          COALESCE(c.frais_inscription, 0) as frais_inscription,
          COALESCE(c.premier_versement, 0) as premier_versement,
          COALESCE(c.deuxieme_versement, 0) as deuxieme_versement,
          COALESCE(c.troisieme_versement, 0) as troisieme_versement,
          COALESCE(c.total_versement, 0) as total_versement
        FROM preinscriptions p
        LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
        WHERE p.id = $1
      `, [preinscriptionId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const data = result.rows[0];

      // ⭐ Construire le plan avec les montants EXACTS depuis la table classes
      const plan = {
        id: null,
        niveau: data.niveau,
        classe: data.classe,
        premier_versement: Number(data.premier_versement) || 0,
        deuxieme_versement: Number(data.deuxieme_versement) || 0,
        troisieme_versement: Number(data.troisieme_versement) || 0,
        total: Number(data.total_versement) || 0,
        frais_inscription: Number(data.frais_inscription) || 0,
        type_inscription: data.type_inscription || 'inscription'
      };

      console.log(` Plan pour la pré-inscription ${preinscriptionId}:`, plan);

      // ⭐ Récupérer les services optionnels
      const transport = await query(`
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
      `, [preinscriptionId]);

      const cantine = await query(`
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
      `, [preinscriptionId]);

      const fournitures = await query(`
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
      `, [preinscriptionId]);

      const totalTransport = Number(transport.rows[0]?.total_transport) || 0;
      const totalCantine = Number(cantine.rows[0]?.total_cantine) || 0;
      const totalFournitures = Number(fournitures.rows[0]?.total_fournitures) || 0;
      const totalServices = totalTransport + totalCantine + totalFournitures;

      // ⭐ Récupérer les échéances existantes (qui ont maintenant les bons montants)
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

      console.log(` Échéances pour ${preinscriptionId}:`, echeancesResult.rows);

      // ⭐ Filtrer les échéances d'inscription
      const echeancesInscription = echeancesResult.rows.filter(
        (e: any) => e.type === 'inscription'
      );

      // ⭐ Recalculer le montant restant
      const restantCalcul = echeancesResult.rows
        .filter((e: any) => e.statut === 'en_attente')
        .reduce((sum: number, e: any) => sum + Number(e.montant), 0);

      // ⭐ Mettre à jour le montant restant
      await query(`
        UPDATE preinscriptions 
        SET montant_restant_plan = $1
        WHERE id = $2
      `, [restantCalcul, preinscriptionId]);

      // ⭐ Construire la réponse
      const response = {
        ...data,
        plan: plan,
        echeances: echeancesResult.rows,
        echeances_inscription: echeancesInscription,
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
        est_reinscription: data.type_inscription === 'reinscription',
        est_paye: data.frais_statut === 'paye',
        frais_inscription: Number(data.frais_inscription) || 0,
        restant_calcule: restantCalcul
      };

      return NextResponse.json(response);
    }

    // ... reste du code pour les niveaux
    const niveau = url.searchParams.get("niveau");
    const type = url.searchParams.get("type") || "inscription";

    if (niveau) {
      const result = await query(`
        SELECT 
          niveau,
          SUM(frais_inscription) as frais_inscription,
          SUM(premier_versement) as premier_versement,
          SUM(deuxieme_versement) as deuxieme_versement,
          SUM(troisieme_versement) as troisieme_versement,
          SUM(total_versement) as total,
          $1 as type_inscription
        FROM classes
        WHERE LOWER(niveau) = LOWER($2)
        GROUP BY niveau
      `, [type, niveau]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Aucune classe trouvée pour ce niveau" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    const result = await query(`
      SELECT 
        niveau,
        SUM(frais_inscription) as frais_inscription,
        SUM(premier_versement) as premier_versement,
        SUM(deuxieme_versement) as deuxieme_versement,
        SUM(troisieme_versement) as troisieme_versement,
        SUM(total_versement) as total
      FROM classes
      GROUP BY niveau
      ORDER BY niveau
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur plan paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}