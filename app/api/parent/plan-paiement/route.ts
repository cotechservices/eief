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
          p.plan_paiement_id
        FROM preinscriptions p
        WHERE p.id = $1
      `, [preinscriptionId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const data = result.rows[0];
      const niveau = data.niveau;
      const typeInscription = data.type_inscription || 'inscription';
      const classeNom = data.classe;

      // ⭐ 2. Récupérer les VERSEMENTS depuis la CLASSE (pas depuis plans_paiement_niveaux)
      const classResult = await query(`
        SELECT 
          premier_versement,
          deuxieme_versement,
          troisieme_versement,
          total_versement as total,
          frais_inscription
        FROM classes
        WHERE LOWER(nom) = LOWER($1)
        LIMIT 1
      `, [classeNom]);

      let montants = {
        premier: 0,
        deuxieme: 0,
        troisieme: 0,
        total: 0
      };

      if (classResult.rows.length > 0) {
        const classData = classResult.rows[0];
        montants = {
          premier: Number(classData.premier_versement) || 0,
          deuxieme: Number(classData.deuxieme_versement) || 0,
          troisieme: Number(classData.troisieme_versement) || 0,
          total: Number(classData.total) || Number(classData.frais_inscription) || 0
        };
        
        console.log(`✅ Versements trouvés pour la classe ${classeNom}: 1er=${montants.premier}, 2ème=${montants.deuxieme}, 3ème=${montants.troisieme}, Total=${montants.total}`);
      } else {
        // Fallback selon le niveau si la classe n'est pas trouvée
        console.log(`⚠️ Classe ${classeNom} non trouvée, utilisation des valeurs par défaut pour ${niveau}`);
        const niveauLower = niveau.toLowerCase();
        if (niveauLower.includes('maternelle')) {
          montants = typeInscription === 'reinscription' 
            ? { premier: 2600000, deuxieme: 2100000, troisieme: 1000000, total: 5700000 }
            : { premier: 2800000, deuxieme: 2100000, troisieme: 1000000, total: 5900000 };
        } else if (niveauLower.includes('primaire')) {
          montants = typeInscription === 'reinscription'
            ? { premier: 2600000, deuxieme: 2100000, troisieme: 1500000, total: 6200000 }
            : { premier: 2800000, deuxieme: 2100000, troisieme: 1500000, total: 6400000 };
        } else if (niveauLower.includes('collège') || niveauLower.includes('college')) {
          montants = typeInscription === 'reinscription'
            ? { premier: 3600000, deuxieme: 2100000, troisieme: 2000000, total: 7700000 }
            : { premier: 3800000, deuxieme: 2100000, troisieme: 2000000, total: 7900000 };
        } else if (niveauLower.includes('lycée') || niveauLower.includes('lycee')) {
          montants = typeInscription === 'reinscription'
            ? { premier: 3600000, deuxieme: 2600000, troisieme: 2000000, total: 8200000 }
            : { premier: 3800000, deuxieme: 2600000, troisieme: 2000000, total: 8400000 };
        }
      }

      // ⭐ 3. Construire le plan avec les montants de la classe
      const plan = {
        id: null,
        niveau: niveau,
        premier_versement: montants.premier,
        deuxieme_versement: montants.deuxieme,
        troisieme_versement: montants.troisieme,
        total: montants.total,
        type_inscription: typeInscription
      };

      // ⭐ 4. Mettre à jour la pré-inscription avec le total
      await query(`
        UPDATE preinscriptions 
        SET montant_total_plan = $1,
            montant_restant_plan = $1
        WHERE id = $2
      `, [plan.total, preinscriptionId]);

      // ⭐ 5. Récupérer les services optionnels
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

      const totalTransport = Number(transport.rows[0]?.total_transport) || 0;
      const totalCantine = Number(cantine.rows[0]?.total_cantine) || 0;
      const totalFournitures = Number(fournitures.rows[0]?.total_fournitures) || 0;
      const totalServices = totalTransport + totalCantine + totalFournitures;

      // ⭐ 6. SUPPRIMER toutes les échéances existantes (inscription + services)
      await query(`
        DELETE FROM echeances_paiement 
        WHERE preinscription_id = $1
      `, [preinscriptionId]);

      // ⭐ 7. Créer UNIQUEMENT les échéances d'inscription avec les montants de la classe
      if (plan.total > 0) {
        await query(`
          INSERT INTO echeances_paiement (preinscription_id, type, echeance, montant, date_echeance, statut)
          VALUES 
            ($1, 'inscription', '1er_versement', $2, CURRENT_DATE, 'en_attente'),
            ($1, 'inscription', '2eme_versement', $3, CURRENT_DATE + INTERVAL '2 months', 'en_attente'),
            ($1, 'inscription', '3eme_versement', $4, CURRENT_DATE + INTERVAL '4 months', 'en_attente')
        `, [preinscriptionId, plan.premier_versement, plan.deuxieme_versement, plan.troisieme_versement]);
        
        console.log(`✅ Échéances d'inscription créées: 1er=${plan.premier_versement}, 2ème=${plan.deuxieme_versement}, 3ème=${plan.troisieme_versement}`);
      }

      // ⭐ 8. NE PAS créer d'échéances pour les services (ils seront gérés via la checkbox)
      // Les services optionnels sont uniquement affichés dans le modal, pas dans echeances_paiement

      // ⭐ 9. Recharger les échéances (uniquement les inscriptions)
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
          END
      `, [preinscriptionId]);

      // ⭐ 10. Construire la réponse
      const response = {
        ...data,
        plan: plan,
        echeances: echeancesResult.rows,
        echeances_inscription: echeancesResult.rows.filter((e: any) => e.type === 'inscription'),
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
        frais_classe: montants.total
      };

      return NextResponse.json(response);
    }

    // Si on a un niveau
    const niveau = url.searchParams.get("niveau");
    const type = url.searchParams.get("type") || "inscription";
    
    if (niveau) {
      const result = await query(`
        SELECT * FROM plans_paiement_niveaux 
        WHERE LOWER(niveau) = LOWER($1) AND type_inscription = $2
      `, [niveau, type]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Plan non trouvé pour ce niveau" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    // Retourner tous les plans
    const result = await query(`
      SELECT * FROM plans_paiement_niveaux ORDER BY type_inscription, total ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur plan paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}