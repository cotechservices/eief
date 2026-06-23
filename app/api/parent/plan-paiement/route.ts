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
      // ⭐ 1. Récupérer la pré-inscription
      const result = await query(`
        SELECT 
          p.id,
          p.niveau,
          p.classe,
          p.frais_statut,
          p.montant_total_plan,
          p.montant_restant_plan,
          p.type_inscription,
          p.plan_paiement_id,
          COALESCE(
            (SELECT c.frais_inscription FROM classes c WHERE LOWER(c.nom) = LOWER(p.classe)),
            p.frais_montant,
            0
          ) as frais_classe
        FROM preinscriptions p
        WHERE p.id = $1
      `, [preinscriptionId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const data = result.rows[0];
      const niveau = data.niveau;

      // ⭐ 2. Récupérer le plan de paiement (par ID ou par niveau)
      let planData = null;
      
      // Essayer d'abord avec plan_paiement_id
      if (data.plan_paiement_id) {
        const planResult = await query(`
          SELECT 
            id,
            niveau,
            premier_versement,
            deuxieme_versement,
            troisieme_versement,
            total
          FROM plans_paiement_niveaux
          WHERE id = $1 AND type_inscription = 'inscription'
        `, [data.plan_paiement_id]);
        
        if (planResult.rows.length > 0) {
          planData = planResult.rows[0];
        }
      }
      
      // Si pas de plan trouvé, essayer par niveau
      if (!planData) {
        const planResult = await query(`
          SELECT 
            id,
            niveau,
            premier_versement,
            deuxieme_versement,
            troisieme_versement,
            total
          FROM plans_paiement_niveaux
          WHERE LOWER(niveau) = LOWER($1) AND type_inscription = 'inscription'
        `, [niveau]);
        
        if (planResult.rows.length > 0) {
          planData = planResult.rows[0];
          
          // ⭐ Mettre à jour la pré-inscription avec l'ID du plan trouvé
          await query(`
            UPDATE preinscriptions 
            SET plan_paiement_id = $1,
                montant_total_plan = $2,
                montant_restant_plan = $2
            WHERE id = $3
          `, [planData.id, planData.total, preinscriptionId]);
        }
      }

      // ⭐ 3. Construire le plan
      const plan = planData ? {
        id: planData.id,
        niveau: planData.niveau || niveau,
        premier_versement: Number(planData.premier_versement) || 0,
        deuxieme_versement: Number(planData.deuxieme_versement) || 0,
        troisieme_versement: Number(planData.troisieme_versement) || 0,
        total: Number(planData.total) || 0
      } : {
        id: null,
        niveau: niveau,
        premier_versement: 0,
        deuxieme_versement: 0,
        troisieme_versement: 0,
        total: 0
      };

      // ⭐ 4. Récupérer les services optionnels
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
          ) FILTER (WHERE lt.id IS NOT NULL), '[]') as details
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
          ) FILTER (WHERE cm.id IS NOT NULL), '[]') as details
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
          ) FILTER (WHERE cf.id IS NOT NULL), '[]') as details
        FROM preinscriptions p
        LEFT JOIN commandes_fournitures cf ON cf.preinscription_id = p.id
        LEFT JOIN articles_librairie al ON cf.article_id = al.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [preinscriptionId]);

      // ⭐ 5. Récupérer les échéances
      let echeancesResult = await query(`
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
          END
      `, [preinscriptionId]);

      // ⭐ 6. Si pas d'échéances mais un plan existe, créer les échéances
      if (echeancesResult.rows.length === 0 && plan.total > 0) {
        await query(`
          INSERT INTO echeances_paiement (preinscription_id, type, echeance, montant, date_echeance, statut)
          VALUES 
            ($1, 'inscription', '1er_versement', $2, CURRENT_DATE, 'en_attente'),
            ($1, 'inscription', '2eme_versement', $3, CURRENT_DATE + INTERVAL '2 months', 'en_attente'),
            ($1, 'inscription', '3eme_versement', $4, CURRENT_DATE + INTERVAL '4 months', 'en_attente')
        `, [preinscriptionId, plan.premier_versement, plan.deuxieme_versement, plan.troisieme_versement]);

        // Recharger les échéances
        echeancesResult = await query(`
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
            END
        `, [preinscriptionId]);
      }

      // ⭐ 7. Calculer les totaux des services
      const totalTransport = Number(transport.rows[0]?.total_transport) || 0;
      const totalCantine = Number(cantine.rows[0]?.total_cantine) || 0;
      const totalFournitures = Number(fournitures.rows[0]?.total_fournitures) || 0;
      const totalServices = totalTransport + totalCantine + totalFournitures;

      // ⭐ 8. Filtrer les échéances d'inscription
      const echeancesInscription = echeancesResult.rows.filter(
        (e: any) => e.type === 'inscription'
      );

      // ⭐ 9. Construire la réponse
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
        frais_classe: Number(data.frais_classe) || 0
      };

      return NextResponse.json(response);
    }

    // Si on a un niveau
    const niveau = url.searchParams.get("niveau");
    if (niveau) {
      const result = await query(`
        SELECT * FROM plans_paiement_niveaux 
        WHERE LOWER(niveau) = LOWER($1) AND type_inscription = 'inscription'
      `, [niveau]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Plan non trouvé pour ce niveau" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    // Retourner tous les plans
    const result = await query(`
      SELECT * FROM plans_paiement_niveaux WHERE type_inscription = 'inscription' ORDER BY total ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur plan paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}