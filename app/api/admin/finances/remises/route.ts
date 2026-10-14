// app/api/admin/finances/remises/route.ts
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
    const minEnfantsParam = url.searchParams.get("minEnfants");
    const minEnfants = minEnfantsParam ? parseInt(minEnfantsParam) : 2;

    // S'assurer que la table remises_familles existe
    await query(`
      CREATE TABLE IF NOT EXISTS remises_familles (
        id SERIAL PRIMARY KEY,
        parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        montant NUMERIC(12, 2) NOT NULL,
        motif TEXT,
        saisie_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ⭐ Comptage propre des enfants sans doublons
    const parentsResult = await query(`
      WITH enfants_uniques AS (
        SELECT DISTINCT lpe.parent_id, lpe.eleve_id::text AS enfant_key
        FROM lien_parent_eleve lpe
        JOIN eleves e ON e.id = lpe.eleve_id
        WHERE e.deleted_at IS NULL

        UNION

        SELECT DISTINCT p.parent_id, ('pre_' || p.id)::text AS enfant_key
        FROM preinscriptions p
        WHERE p.statut != 'rejete'

        UNION

        SELECT DISTINCT r.parent_id, ('re_' || r.id)::text AS enfant_key
        FROM reinscriptions r
        WHERE r.statut != 'rejete'
      ),
      compte_enfants AS (
        SELECT parent_id, COUNT(*) AS nb_enfants
        FROM enfants_uniques
        GROUP BY parent_id
      )
      SELECT 
        p.id as parent_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        COALESCE(ce.nb_enfants, 0) as nb_enfants,
        COALESCE((SELECT SUM(montant) FROM remises_familles WHERE parent_id = p.id), 0) as total_remises
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN compte_enfants ce ON ce.parent_id = p.id
      WHERE COALESCE(ce.nb_enfants, 0) >= $1
      ORDER BY nb_enfants DESC, u.nom ASC
    `, [minEnfants]);

    const parentsComplets: any[] = [];

    for (const parent of parentsResult.rows) {
      const parentId = parent.parent_id;

      // ⭐ Récupérer la remise accordée AVANT tout calcul
      const remiseAccordee = Number(parent.total_remises) || 0;

      // ========== 1. SCOLARITÉ : MONTANT ACTUEL (déjà net) ==========
      // Échéances préinscriptions (montants ACTUELS, déjà réduits par la remise)
      const fraisPreinsRes = await query(`
        SELECT COALESCE(SUM(ep.montant), 0) as total
        FROM echeances_paiement ep
        WHERE ep.preinscription_id IN (
          SELECT id FROM preinscriptions WHERE parent_id = $1
        )
        AND ep.type IN ('inscription', 'scolarite', 'reinscription')
      `, [parentId]);
      const scolaritePreinsActuelle = Number(fraisPreinsRes.rows[0]?.total) || 0;

      // Échéances réinscriptions (montants ACTUELS)
      const fraisReinsRes = await query(`
        SELECT COALESCE(SUM(ep.montant), 0) as total
        FROM echeances_paiement ep
        WHERE ep.reinscription_id IN (
          SELECT id FROM reinscriptions WHERE parent_id = $1
        )
        AND ep.type IN ('inscription', 'scolarite', 'reinscription')
      `, [parentId]);
      const scolariteReinsActuelle = Number(fraisReinsRes.rows[0]?.total) || 0;

      // Fallback si aucune échéance
      let scolariteFallback = 0;
      if (scolaritePreinsActuelle === 0) {
        const fallbackPreins = await query(`
          SELECT COALESCE(SUM(COALESCE(montant_total_plan, frais_montant, 0)), 0) as total
          FROM preinscriptions
          WHERE parent_id = $1 AND statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);
        scolariteFallback += Number(fallbackPreins.rows[0]?.total) || 0;
      }
      if (scolariteReinsActuelle === 0) {
        const fallbackReins = await query(`
          SELECT COALESCE(SUM(COALESCE(montant_total_plan, montant_frais, 0)), 0) as total
          FROM reinscriptions
          WHERE parent_id = $1 AND statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);
        scolariteFallback += Number(fallbackReins.rows[0]?.total) || 0;
      }

      // ⭐ Montant actuel total de la scolarité (déjà net de remise)
      const scolariteActuelle = scolaritePreinsActuelle + scolariteReinsActuelle + scolariteFallback;

      // ⭐ RECONSTITUTION DU VRAI BRUT : actuel + remise
      // (car la remise a été appliquée UNIQUEMENT sur les échéances de scolarité)
      const scolariteBrut = scolariteActuelle + remiseAccordee;

      // ========== 2. SERVICES (brut = actuel, pas de remise dessus) ==========
      const cantineRes = await query(`
        SELECT COALESCE(SUM(pc.prix), 0) as total
        FROM preinscription_cantine pc
        JOIN preinscriptions p ON pc.preinscription_id = p.id
        WHERE p.parent_id = $1
          AND p.statut IN ('valide', 'en_attente', 'partiel')
      `, [parentId]);
      const cantineBrut = Number(cantineRes.rows[0]?.total) || 0;

      const transportRes = await query(`
        SELECT COALESCE(SUM(pt.prix), 0) as total
        FROM preinscription_transport pt
        JOIN preinscriptions p ON pt.preinscription_id = p.id
        WHERE p.parent_id = $1
          AND p.statut IN ('valide', 'en_attente', 'partiel')
      `, [parentId]);
      const transportBrut = Number(transportRes.rows[0]?.total) || 0;

      const fournituresRes = await query(`
        SELECT 
          COALESCE((
            SELECT SUM(cf.quantite * cf.prix_unitaire) 
            FROM commandes_fournitures cf
            JOIN preinscriptions p ON cf.preinscription_id = p.id
            WHERE p.parent_id = $1
          ), 0) +
          COALESCE((
            SELECT SUM(cl.total) 
            FROM commandes_librairie cl
            WHERE cl.parent_id = $1 AND cl.statut = 'valide'
          ), 0) as total
      `, [parentId]);
      const fournituresBrut = Number(fournituresRes.rows[0]?.total) || 0;

      const totalServices = cantineBrut + transportBrut + fournituresBrut;

      // ========== 3. TOTAL PAYÉ ==========
      const paiementsRes = await query(`
        SELECT COALESCE(SUM(montant), 0) as total
        FROM (
          SELECT id, montant FROM paiements
          WHERE statut IN ('valide', 'paye')
            AND eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)
          UNION ALL
          SELECT id, montant FROM paiements
          WHERE statut IN ('valide', 'paye')
            AND preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
          UNION ALL
          SELECT id, montant FROM paiements
          WHERE statut IN ('valide', 'paye')
            AND reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
        ) paiements_uniques
      `, [parentId]);
      const totalPaye = Number(paiementsRes.rows[0]?.total) || 0;

      // ========== 4. CALCUL FINAL (cohérent avec l'API parents) ==========
      // Total brut AVANT remise
      const totalAPayer = scolariteBrut + totalServices;
      // Net à payer APRÈS remise
      const totalNet = Math.max(0, totalAPayer - remiseAccordee);
      // Solde restant = net - payé
      const soldeRestant = Math.max(0, totalNet - totalPaye);

      // ⭐ DEBUG pour vérifier
      console.log(`[DEBUG REMISES] Parent ${parent.prenom} ${parent.nom}:`, {
        scolariteActuelle,
        remiseAccordee,
        scolariteBrut,
        cantineBrut,
        transportBrut,
        fournituresBrut,
        totalServices,
        totalAPayer,
        totalNet,
        totalPaye,
        soldeRestant,
      });

      parentsComplets.push({
        id: Number(parent.parent_id) || 0,
        nom: parent.nom || "",
        prenom: parent.prenom || "",
        email: parent.email || "",
        telephone: parent.telephone || "",
        nb_enfants: Number(parent.nb_enfants) || 0,
        total_a_payer: Number(totalAPayer) || 0,      // 25 720 000 ✅
        total_paye: Number(totalPaye) || 0,            // 0
        total_remises: Number(remiseAccordee) || 0,    // 720 000
        solde_restant: Number(soldeRestant) || 0       // 25 000 000 ✅
      });
    }

    return NextResponse.json(parentsComplets);
  } catch (error: any) {
    console.error("Erreur GET remises:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "COMPTABLE" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const { parentId, montant, motif } = body;

    if (!parentId || !montant || montant <= 0) {
      return NextResponse.json({ error: "Parent ID et montant valide requis" }, { status: 400 });
    }

    // S'assurer que la table existe
    await query(`
      CREATE TABLE IF NOT EXISTS remises_familles (
        id SERIAL PRIMARY KEY,
        parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        montant NUMERIC(12, 2) NOT NULL,
        motif TEXT,
        saisie_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ⭐ Calculer le solde restant RÉEL avant d'appliquer la remise
    // IMPORTANT : Ici on lit les montants ACTUELS (déjà nets des remises précédentes)
    const soldeInfoRes = await query(`
      SELECT 
        -- Scolarité actuelle (déjà nette)
        COALESCE((
          SELECT SUM(ep.montant)
          FROM echeances_paiement ep
          WHERE ep.preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
            AND ep.type IN ('inscription', 'scolarite', 'reinscription')
        ), 0) +
        COALESCE((
          SELECT SUM(ep.montant)
          FROM echeances_paiement ep
          WHERE ep.reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
            AND ep.type IN ('inscription', 'scolarite', 'reinscription')
        ), 0) AS scolarite_actuelle,

        -- Services (jamais affectés par remise)
        COALESCE((
          SELECT SUM(pc.prix) FROM preinscription_cantine pc
          JOIN preinscriptions p ON pc.preinscription_id = p.id
          WHERE p.parent_id = $1 AND p.statut IN ('valide', 'en_attente', 'partiel')
        ), 0) +
        COALESCE((
          SELECT SUM(pt.prix) FROM preinscription_transport pt
          JOIN preinscriptions p ON pt.preinscription_id = p.id
          WHERE p.parent_id = $1 AND p.statut IN ('valide', 'en_attente', 'partiel')
        ), 0) +
        COALESCE((
          SELECT SUM(cf.quantite * cf.prix_unitaire) FROM commandes_fournitures cf
          JOIN preinscriptions p ON cf.preinscription_id = p.id
          WHERE p.parent_id = $1
        ), 0) +
        COALESCE((
          SELECT SUM(total) FROM commandes_librairie
          WHERE parent_id = $1 AND statut = 'valide'
        ), 0) AS services_actuels,

        -- Total déjà payé
        COALESCE((
          SELECT SUM(montant) FROM (
            SELECT montant FROM paiements
            WHERE statut IN ('valide', 'paye')
              AND eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)
            UNION ALL
            SELECT montant FROM paiements
            WHERE statut IN ('valide', 'paye')
              AND preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
            UNION ALL
            SELECT montant FROM paiements
            WHERE statut IN ('valide', 'paye')
              AND reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
          ) p
        ), 0) AS total_paye
    `, [parentId]);

    const info = soldeInfoRes.rows[0];
    const scolariteActuelle = Number(info.scolarite_actuelle) || 0;
    const servicesActuels = Number(info.services_actuels) || 0;
    const totalActuel = scolariteActuelle + servicesActuels;
    const totalPaye = Number(info.total_paye) || 0;

    // ⭐ Le solde réel = montant actuel - payé (la remise précédente est déjà dans scolariteActuelle)
    const soldeRestantReel = Math.max(0, totalActuel - totalPaye);

    // Plafonner la remise
    if (Number(montant) > soldeRestantReel) {
      return NextResponse.json({ 
        error: `La remise (${Number(montant).toLocaleString()} GNF) dépasse le solde restant réel (${soldeRestantReel.toLocaleString()} GNF).`,
        solde_restant_reel: soldeRestantReel
      }, { status: 400 });
    }

    // Insérer la remise
    const insertResult = await query(`
      INSERT INTO remises_familles (parent_id, montant, motif, saisie_par)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [parentId, montant, motif || "Remise Famille Nombreuse", (session.user as any).id || null]);

    // ⭐ Répartir la remise PROPORTIONNELLEMENT sur les échéances de SCOLARITÉ
    if (scolariteActuelle > 0) {
      const montantRemiseApplique = Math.min(Number(montant), scolariteActuelle);
      const facteurReduction = 1 - (montantRemiseApplique / scolariteActuelle);

      await query(`
        UPDATE echeances_paiement
        SET montant = GREATEST(0, ROUND(montant * $1::numeric, 2))
        WHERE (
          preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $2)
          OR reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $2)
        )
        AND type IN ('inscription', 'scolarite', 'reinscription')
      `, [facteurReduction, parentId]);
    }

    // Recalculer montant_restant_plan
    await query(`
      UPDATE preinscriptions p
      SET montant_restant_plan = GREATEST(0, 
        COALESCE((
          SELECT SUM(ep.montant) 
          FROM echeances_paiement ep 
          WHERE ep.preinscription_id = p.id
            AND ep.type IN ('inscription', 'scolarite', 'reinscription')
        ), 0)
        - COALESCE((
          SELECT SUM(pay.montant) 
          FROM paiements pay 
          WHERE pay.preinscription_id = p.id AND pay.statut IN ('valide', 'paye')
        ), 0)
      )
      WHERE p.parent_id = $1
    `, [parentId]);

    await query(`
      UPDATE reinscriptions r
      SET montant_restant_plan = GREATEST(0, 
        COALESCE((
          SELECT SUM(ep.montant) 
          FROM echeances_paiement ep 
          WHERE ep.reinscription_id = r.id
            AND ep.type IN ('inscription', 'scolarite', 'reinscription')
        ), 0)
        - COALESCE((
          SELECT SUM(pay.montant) 
          FROM paiements pay 
          WHERE pay.reinscription_id = r.id AND pay.statut IN ('valide', 'paye')
        ), 0)
      )
      WHERE r.parent_id = $1
    `, [parentId]);

    return NextResponse.json({
      success: true,
      message: `Remise de ${Number(montant).toLocaleString()} GNF appliquée avec succès.`,
      remise: insertResult.rows[0],
      solde_restant_apres: Math.max(0, soldeRestantReel - Number(montant))
    });
  } catch (error: any) {
    console.error("Erreur POST remise:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}