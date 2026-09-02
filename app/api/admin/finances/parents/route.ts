// app/api/admin/finances/parents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "COMPTABLE" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    // ⭐ Récupérer TOUS les parents avec leurs informations utilisateur
    let sql = `
      SELECT 
        p.id as parent_id,
        u.id as utilisateur_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse,
        u.photo_url,
        u.est_actif,
        p.profession,
        p.situation_matrimoniale
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search.trim()) {
      sql += ` AND (
        u.nom ILIKE $1 OR 
        u.prenom ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.telephone ILIKE $1 OR 
        EXISTS (
          SELECT 1 
          FROM lien_parent_eleve lpe 
          JOIN eleves e ON lpe.eleve_id = e.id 
          JOIN utilisateurs ue ON e.utilisateur_id = ue.id 
          WHERE lpe.parent_id = p.id AND (ue.nom ILIKE $1 OR ue.prenom ILIKE $1)
        )
      )`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY u.nom ASC, u.prenom ASC`;

    const parentsResult = await query(sql, params);
    
    // ⭐ Si aucun parent n'est trouvé, retourner un tableau vide
    if (parentsResult.rows.length === 0) {
      return NextResponse.json([]);
    }

    const parentsList = parentsResult.rows;

    const parentsFinances = await Promise.all(
      parentsList.map(async (parent) => {
        const parentId = parent.parent_id;

        // 1. Liste des enfants inscrits
        const elevesResult = await query(`
          SELECT 
            e.id as eleve_id,
            e.matricule,
            u.nom,
            u.prenom,
            c.nom as classe_nom,
            c.niveau,
            c.id as classe_id,
            e.date_naissance,
            e.sexe
          FROM eleves e
          JOIN utilisateurs u ON e.utilisateur_id = u.id
          LEFT JOIN classes c ON e.classe_id = c.id
          JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
          WHERE lpe.parent_id = $1 AND e.est_inscrit = true AND e.deleted_at IS NULL
        `, [parentId]);

        // 2. Liste des pré-inscriptions
        const preinsResult = await query(`
          SELECT 
            p.id as preinscription_id,
            p.numero_dossier,
            p.enfant_nom as nom,
            p.enfant_prenom as prenom,
            p.classe as classe_nom,
            p.niveau,
            p.statut,
            p.date_naissance
          FROM preinscriptions p
          WHERE p.parent_id = $1 AND p.statut != 'rejete'
        `, [parentId]);

        // 3. Remise accordée à la famille
        const remiseResult = await query(`
          SELECT COALESCE(SUM(montant), 0) as total_remise
          FROM remises_familles
          WHERE parent_id = $1
        `, [parentId]);
        const remiseAccordee = Number(remiseResult.rows[0]?.total_remise) || 0;

        // 4. Détails des frais Scolarité / Inscription
        let scolariteBrut = 0;
        
        // 4a. Calculer la scolarité pour chaque enfant inscrit
        for (const eleve of elevesResult.rows) {
          // Récupérer le plan de paiement depuis la classe
          const planRes = await query(`
            SELECT c.total_versement as total_plan
            FROM eleves e
            LEFT JOIN classes c ON e.classe_id = c.id
            WHERE e.id = $1
          `, [eleve.eleve_id]);
          
          const row = planRes.rows[0];
          let totalPlan = Number(row?.total_plan) || 0;
          
          // Si aucun total_plan, essayer de récupérer depuis les pré-inscriptions
          if (totalPlan === 0) {
            const prePlanRes = await query(`
              SELECT p.montant_total_plan, p.frais_montant
              FROM inscriptions i
              JOIN preinscriptions p ON i.preinscription_id = p.id
              WHERE i.eleve_id = $1
              LIMIT 1
            `, [eleve.eleve_id]);
            const preRow = prePlanRes.rows[0];
            totalPlan = Number(preRow?.montant_total_plan) || Number(preRow?.frais_montant) || 0;
          }
          
          scolariteBrut += totalPlan;
        }

        // 4b. Calculer la scolarité pour les pré-inscriptions
        for (const pre of preinsResult.rows) {
          const prePlanRes = await query(`
            SELECT p.montant_total_plan, p.frais_montant
            FROM preinscriptions p 
            WHERE p.id = $1
          `, [pre.preinscription_id]);
          const row = prePlanRes.rows[0];
          scolariteBrut += Number(row?.montant_total_plan) || Number(row?.frais_montant) || 0;
        }

        // 5. Détails Cantine
        const cantineRes = await query(`
          SELECT 
            COALESCE(
              (SELECT SUM(montant_total) 
               FROM inscriptions_cantine 
               WHERE eleve_id IN (
                 SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
               )), 0
            ) +
            COALESCE(
              (SELECT SUM(prix) 
               FROM preinscription_cantine 
               WHERE preinscription_id IN (
                 SELECT id FROM preinscriptions WHERE parent_id = $1
               )), 0
            ) as total_cantine
        `, [parentId]);
        const cantineBrut = Number(cantineRes.rows[0]?.total_cantine) || 0;

        // 6. Détails Transport
        const transportRes = await query(`
          SELECT 
            COALESCE(
              (SELECT SUM(it.montant_mensuel * it.mois_total) 
               FROM inscriptions_transport it 
               JOIN eleves e ON it.eleve_id = e.id 
               JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id 
               WHERE lpe.parent_id = $1), 0
            ) +
            COALESCE(
              (SELECT SUM(prix) 
               FROM preinscription_transport 
               WHERE preinscription_id IN (
                 SELECT id FROM preinscriptions WHERE parent_id = $1
               )), 0
            ) as total_transport
        `, [parentId]);
        const transportBrut = Number(transportRes.rows[0]?.total_transport) || 0;

        // 7. Détails Fournitures / Librairie
        const fournituresRes = await query(`
          SELECT 
            COALESCE(
              (SELECT SUM(quantite * prix_unitaire) 
               FROM commandes_fournitures 
               WHERE preinscription_id IN (
                 SELECT id FROM preinscriptions WHERE parent_id = $1
               )), 0
            ) +
            COALESCE(
              (SELECT SUM(total) 
               FROM commandes_librairie 
               WHERE parent_id = $1 AND statut = 'valide'), 0
            ) as total_fournitures
        `, [parentId]);
        const fournituresBrut = Number(fournituresRes.rows[0]?.total_fournitures) || 0;

        // Total brut global
        const depensesBrutes = scolariteBrut + cantineBrut + transportBrut + fournituresBrut;
        const totalNet = Math.max(0, depensesBrutes - remiseAccordee);

        // 8. Total payé via la table paiements
        // ⭐ Inclure les paiements des enfants inscrits ET des pré-inscriptions
        const paiementsRes = await query(`
          SELECT COALESCE(SUM(p.montant), 0) as total_paye
          FROM paiements p
          WHERE p.statut = 'valide'
            AND (
              p.eleve_id IN (
                SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
              )
              OR p.preinscription_id IN (
                SELECT id FROM preinscriptions WHERE parent_id = $1
              )
              OR p.reinscription_id IN (
                SELECT id FROM reinscriptions WHERE eleve_id IN (
                  SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
                )
              )
            )
        `, [parentId]);
        
        // ⭐ Alternativement, récupérer tous les paiements liés à ce parent
        let totalPaye = Number(paiementsRes.rows[0]?.total_paye) || 0;
        
        // Si aucun paiement trouvé, essayer une autre approche
        if (totalPaye === 0) {
          const paiementsAlt = await query(`
            SELECT COALESCE(SUM(p.montant), 0) as total_paye
            FROM paiements p
            WHERE p.statut = 'valide'
          `, []);
          // On ne peut pas faire de jointure directe parent-paiement, on utilise une autre approche
          
          // Récupérer les paiements des enfants du parent via les échéances
          const paiementsEcheances = await query(`
            SELECT COALESCE(SUM(p.montant), 0) as total_paye
            FROM paiements p
            WHERE p.statut = 'valide'
              AND p.preinscription_id IN (
                SELECT id FROM preinscriptions WHERE parent_id = $1
              )
          `, [parentId]);
          totalPaye = Number(paiementsEcheances.rows[0]?.total_paye) || 0;
        }

        const soldeRestant = Math.max(0, totalNet - totalPaye);

        // 9. Échéances de paiement pour la scolarité
        const echeancesRes = await query(`
          SELECT 
            ep.id,
            ep.echeance,
            ep.type,
            ep.montant,
            ep.statut,
            ep.date_echeance,
            ep.preinscription_id,
            ep.reinscription_id
          FROM echeances_paiement ep
          WHERE ep.preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
             OR ep.reinscription_id IN (
               SELECT id FROM reinscriptions WHERE eleve_id IN (
                 SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
               )
             )
          ORDER BY ep.id ASC
        `, [parentId]);

        return {
          parent_id: parent.parent_id,
          nom: parent.nom,
          prenom: parent.prenom,
          email: parent.email,
          telephone: parent.telephone,
          adresse: parent.adresse,
          profession: parent.profession,
          photo_url: parent.photo_url,
          est_actif: parent.est_actif,
          situation_matrimoniale: parent.situation_matrimoniale,
          enfants_inscrits: elevesResult.rows || [],
          preinscriptions: preinsResult.rows || [],
          totaux: {
            depenses_brutes: depensesBrutes,
            remise_accordee: remiseAccordee,
            total_net: totalNet,
            total_paye: totalPaye,
            solde_restant: soldeRestant
          },
          services_breakdown: {
            scolarite: { total: scolariteBrut },
            cantine: { total: cantineBrut },
            transport: { total: transportBrut },
            fournitures: { total: fournituresBrut }
          },
          echeances: echeancesRes.rows || []
        };
      })
    );

    return NextResponse.json(parentsFinances);
  } catch (error: any) {
    console.error("Erreur API Admin Finances Parents:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + error.message },
      { status: 500 }
    );
  }
}