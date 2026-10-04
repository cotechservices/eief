// app/api/admin/parents/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ⭐ CORRECTION : Ajout de l'interface pour les params avec Promise
interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL" && role !== "COMPTABLE") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // ⭐ CORRECTION : Déballer params avec await
    const { id } = await params;

    // ⭐ Vérifier que l'ID est valide
    const parentId = parseInt(id);

    // ⭐ Si l'ID n'est pas un nombre valide, retourner une erreur
    if (isNaN(parentId) || parentId <= 0) {
      return NextResponse.json(
        { error: "ID de parent invalide" },
        { status: 400 }
      );
    }

    // Récupérer le parent
    const parentResult = await query(`
      SELECT 
        p.id,
        p.utilisateur_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse,
        u.photo_url,
        p.profession,
        p.situation_matrimoniale,
        u.created_at,
        u.est_actif
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [parentId]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentResult.rows[0];

    // Récupérer les enfants inscrits avec plus de détails
    const enfantsResult = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.photo_url,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.date_inscription,
        e.est_inscrit,
        c.nom as classe_nom,
        c.niveau,
        c.id as classe_id,
        c.frais_inscription,
        l.lien as lien_parent,
        (SELECT p.acte_naissance_url FROM preinscriptions p JOIN inscriptions i ON i.preinscription_id = p.id WHERE i.eleve_id = e.id LIMIT 1) as acte_naissance_url,
        (SELECT p.bulletin_url FROM preinscriptions p JOIN inscriptions i ON i.preinscription_id = p.id WHERE i.eleve_id = e.id LIMIT 1) as bulletin_url
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve l ON l.eleve_id = e.id
      WHERE l.parent_id = $1
      ORDER BY u.nom, u.prenom
    `, [parentId]);

    // ⭐ Récupérer les pré-inscriptions en attente du parent (non encore validées en élèves)
    const preinscriptionsEnAttenteResult = await query(`
      SELECT 
        p.id as preinscription_id,
        p.numero_dossier,
        p.enfant_nom as nom,
        p.enfant_prenom as prenom,
        p.date_naissance,
        p.lieu_naissance,
        p.sexe,
        p.niveau,
        p.classe as classe_nom,
        p.photo_url,
        p.acte_naissance_url,
        p.bulletin_url,
        p.statut,
        'preinscription' as type_dossier
      FROM preinscriptions p
      WHERE p.parent_id = $1
        AND p.statut = 'en_attente'
        AND NOT EXISTS (
          SELECT 1 
          FROM inscriptions i 
          JOIN eleves e ON i.eleve_id = e.id
          WHERE i.parent_id = $1 
            AND TRIM(e.matricule) = TRIM(p.id::text)
        )
    `, [parentId]);

    // ⭐ Combiner la liste complète : élèves inscrits + pré-inscriptions en attente
    const tousEnfants = [
      ...(enfantsResult.rows || []),
      ...(preinscriptionsEnAttenteResult.rows || []).map((preins: any) => ({
        ...preins,
        id: undefined,
        matricule: preins.numero_dossier || `PRE-${preins.preinscription_id}`,
        classe_id: null,
        est_inscrit: false,
        est_preinscription: true,
        preinscription_id: preins.preinscription_id
      }))
    ];

    // Récupérer les pré-inscriptions du parent avec montants détaillés (scolarité, fournitures, cantine, transport, paiements)
    const preinscriptionsResult = await query(`
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.date_naissance,
        p.lieu_naissance,
        p.sexe,
        p.photo_url,
        p.acte_naissance_url,
        p.bulletin_url,
        p.niveau,
        p.classe,
        p.statut,
        p.frais_statut,
        p.frais_montant,
        p.date_preinscription,
        p.montant_total_plan,
        p.montant_restant_plan,
        'preinscription' as type_dossier,
        COALESCE((SELECT SUM(cf.quantite * cf.prix_unitaire) FROM commandes_fournitures cf WHERE cf.preinscription_id = p.id), 0) as fournitures_montant,
        COALESCE((SELECT SUM(pc.prix) FROM preinscription_cantine pc WHERE pc.preinscription_id = p.id), 0) as cantine_montant,
        COALESCE((SELECT SUM(pt.prix) FROM preinscription_transport pt WHERE pt.preinscription_id = p.id), 0) as transport_montant,
        COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.preinscription_id = p.id AND pai.statut IN ('valide', 'paye')), 0) as paye_montant
      FROM preinscriptions p
      WHERE p.parent_id = $1
      ORDER BY p.date_preinscription DESC
    `, [parentId]);

    // Récupérer les réinscriptions du parent avec montants détaillés
    const reinscriptionsResult = await query(`
      SELECT 
        r.id,
        r.numero_dossier,
        r.enfant_nom,
        r.enfant_prenom,
        NULL as date_naissance,
        r.niveau,
        r.classe_nom as classe,
        r.statut,
        r.frais_statut,
        r.montant_frais as frais_montant,
        r.date_reinscription as date_preinscription,
        r.montant_total_plan,
        r.montant_restant_plan,
        'reinscription' as type_dossier,
        0 as fournitures_montant,
        COALESCE((SELECT SUM(ic.montant_total) FROM inscriptions_cantine ic WHERE ic.eleve_id = r.eleve_id), 0) as cantine_montant,
        COALESCE((SELECT SUM(it.montant_mensuel * it.mois_total) FROM inscriptions_transport it WHERE it.eleve_id = r.eleve_id), 0) as transport_montant,
        COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.reinscription_id = r.id AND pai.statut IN ('valide', 'paye')), 0) as paye_montant
      FROM reinscriptions r
      WHERE r.parent_id = $1
      ORDER BY r.date_reinscription DESC
    `, [parentId]);

    // ⭐ Calcul complet et précis de la scolarité et des services
    let totalScolarite = 0;
    for (const eleve of enfantsResult.rows) {
      const inscr = Number(eleve.total_versement) || Number(eleve.frais_inscription) || 0;
      totalScolarite += inscr;
    }
    for (const pre of preinscriptionsResult.rows) {
      if (pre.statut === 'en_attente') {
        totalScolarite += Number(pre.montant_total_plan) || Number(pre.frais_montant) || 0;
      }
    }
    for (const rein of reinscriptionsResult.rows) {
      if (rein.statut === 'en_attente') {
        totalScolarite += Number(rein.montant_total_plan) || Number(rein.frais_montant) || 0;
      }
    }

    // Cantine totale (élèves + préinscriptions en attente)
    const cantineTotalRes = await query(`
      SELECT 
        COALESCE((SELECT SUM(ic.montant_total) FROM inscriptions_cantine ic JOIN eleves e ON ic.eleve_id = e.id JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL), 0) +
        COALESCE((SELECT SUM(pc.prix) FROM preinscription_cantine pc JOIN preinscriptions p ON pc.preinscription_id = p.id WHERE p.parent_id = $1 AND p.statut = 'en_attente'), 0) as total_cantine
    `, [parentId]);
    const totalCantine = Number(cantineTotalRes.rows[0]?.total_cantine) || 0;

    // Transport total (élèves + préinscriptions en attente)
    const transportTotalRes = await query(`
      SELECT 
        COALESCE((SELECT SUM(it.montant_mensuel * it.mois_total) FROM inscriptions_transport it JOIN eleves e ON it.eleve_id = e.id JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL), 0) +
        COALESCE((SELECT SUM(pt.prix) FROM preinscription_transport pt JOIN preinscriptions p ON pt.preinscription_id = p.id WHERE p.parent_id = $1 AND p.statut = 'en_attente'), 0) as total_transport
    `, [parentId]);
    const totalTransport = Number(transportTotalRes.rows[0]?.total_transport) || 0;

    // Fournitures totales (commandes_fournitures + commandes_librairie)
    const fournituresTotalRes = await query(`
      SELECT 
        COALESCE((SELECT SUM(cf.quantite * cf.prix_unitaire) FROM commandes_fournitures cf JOIN preinscriptions p ON cf.preinscription_id = p.id WHERE p.parent_id = $1), 0) +
        COALESCE((SELECT SUM(cl.total) FROM commandes_librairie cl WHERE cl.parent_id = $1 AND cl.statut = 'valide'), 0) as total_fournitures
    `, [parentId]);
    const totalFournitures = Number(fournituresTotalRes.rows[0]?.total_fournitures) || 0;

    // Remise accordée à la famille
    const remiseResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_remise
      FROM remises_familles
      WHERE parent_id = $1
    `, [parentId]);
    const remiseAccordee = Number(remiseResult.rows[0]?.total_remise) || 0;

    // Total des paiements reçus
    const paiementsRes = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_paye
      FROM (
        SELECT p.id, p.montant FROM paiements p WHERE p.statut IN ('valide', 'paye') AND p.eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)
        UNION ALL
        SELECT p.id, p.montant FROM paiements p WHERE p.statut IN ('valide', 'paye') AND p.preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
        UNION ALL
        SELECT p.id, p.montant FROM paiements p WHERE p.statut IN ('valide', 'paye') AND p.reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
      ) paiements_uniques
    `, [parentId]);
    const totalPaye = Number(paiementsRes.rows[0]?.total_paye) || 0;

    // Répartition des paiements par catégorie
    const paiementsParCatRes = await query(`
      SELECT 
        CASE 
          WHEN type_frais IN ('cantine') THEN 'cantine'
          WHEN type_frais IN ('transport') THEN 'transport'
          WHEN type_frais IN ('fournitures', 'librairie') THEN 'fournitures'
          ELSE 'inscription'
        END as cat,
        COALESCE(SUM(montant), 0) as montant
      FROM paiements
      WHERE statut IN ('valide', 'paye')
        AND (
          eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)
          OR preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
          OR reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
        )
      GROUP BY 1
    `, [parentId]);

    let payeScolarite = 0;
    let payeCantine = 0;
    let payeTransport = 0;
    let payeFournitures = 0;
    for (const r of paiementsParCatRes.rows) {
      if (r.cat === 'cantine') payeCantine = Number(r.montant) || 0;
      else if (r.cat === 'transport') payeTransport = Number(r.montant) || 0;
      else if (r.cat === 'fournitures') payeFournitures = Number(r.montant) || 0;
      else payeScolarite += Number(r.montant) || 0;
    }

    const totalDepensesBrutes = totalScolarite + totalCantine + totalTransport + totalFournitures;
    const totalNetAPayer = Math.max(0, totalDepensesBrutes - remiseAccordee);
    const soldeRestantTotal = Math.max(0, totalNetAPayer - totalPaye);

    const soldeGlobal = {
      total: soldeRestantTotal,
      details: {
        inscription: Math.max(0, totalScolarite - payeScolarite),
        transport: Math.max(0, totalTransport - payeTransport),
        cantine: Math.max(0, totalCantine - payeCantine),
        fournitures: Math.max(0, totalFournitures - payeFournitures)
      }
    };

    const allDossiers = [
      ...preinscriptionsResult.rows.map((p: any) => {
        const scolarite = Number(p.montant_total_plan) || Number(p.frais_montant) || 0;
        const fournitures = Number(p.fournitures_montant) || 0;
        const cantine = Number(p.cantine_montant) || 0;
        const transport = Number(p.transport_montant) || 0;
        const totalGlobal = scolarite + fournitures + cantine + transport;
        const paye = Number(p.paye_montant) || 0;
        const restant = Math.max(0, totalGlobal - paye);
        return {
          ...p,
          scolarite_montant: scolarite,
          fournitures_montant: fournitures,
          cantine_montant: cantine,
          transport_montant: transport,
          montant_total_global: totalGlobal,
          paye_montant: paye,
          montant_restant_global: restant
        };
      }),
      ...reinscriptionsResult.rows.map((r: any) => {
        const scolarite = Number(r.montant_total_plan) || Number(r.frais_montant) || 0;
        const fournitures = Number(r.fournitures_montant) || 0;
        const cantine = Number(r.cantine_montant) || 0;
        const transport = Number(r.transport_montant) || 0;
        const totalGlobal = scolarite + fournitures + cantine + transport;
        const paye = Number(r.paye_montant) || 0;
        const restant = Math.max(0, totalGlobal - paye);
        return {
          ...r,
          scolarite_montant: scolarite,
          fournitures_montant: fournitures,
          cantine_montant: cantine,
          transport_montant: transport,
          montant_total_global: totalGlobal,
          paye_montant: paye,
          montant_restant_global: restant
        };
      })
    ];

    return NextResponse.json({
      ...parent,
      situation_matrimoniale: parent.situation_matrimoniale
        ? (typeof parent.situation_matrimoniale === 'string'
          ? JSON.parse(parent.situation_matrimoniale)
          : parent.situation_matrimoniale)
        : null,
      enfants: tousEnfants,
      preinscriptions: allDossiers,
      solde_restant_total: soldeRestantTotal,
      solde_global: soldeGlobal,
      totaux: {
        depenses_brutes: totalDepensesBrutes,
        remise_accordee: remiseAccordee,
        total_net: totalNetAPayer,
        total_paye: totalPaye,
        solde_restant: soldeRestantTotal
      },
      services_breakdown: {
        scolarite: totalScolarite,
        cantine: totalCantine,
        transport: totalTransport,
        fournitures: totalFournitures
      }
    });
  } catch (error) {
    console.error("Erreur récupération parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// ⭐ MÉTHODE DELETE - Supprimer un parent et tous ses enfants
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    // Seuls SUPER_ADMIN et DIRECTEUR_GENERAL peuvent supprimer
    if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);

    if (isNaN(parentId) || parentId <= 0) {
      return NextResponse.json(
        { error: "ID de parent invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le parent existe
    const parentCheck = await query(`
      SELECT 
        p.id, 
        p.utilisateur_id,
        u.nom,
        u.prenom,
        u.email
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [parentId]);

    if (parentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentCheck.rows[0];

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // 1. Récupérer tous les IDs des enfants du parent
      const enfantsResult = await query(`
        SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
      `, [parentId]);

      const enfantIds = enfantsResult.rows.map(row => row.eleve_id);

      // 2. Supprimer les données liées aux pré-inscriptions
      await query(`
        DELETE FROM commandes_fournitures 
        WHERE preinscription_id IN (
          SELECT id FROM preinscriptions WHERE parent_id = $1
        )
      `, [parentId]);

      await query(`
        DELETE FROM echeances_paiement 
        WHERE preinscription_id IN (
          SELECT id FROM preinscriptions WHERE parent_id = $1
        )
      `, [parentId]);

      await query(`
        DELETE FROM paiements 
        WHERE preinscription_id IN (
          SELECT id FROM preinscriptions WHERE parent_id = $1
        )
      `, [parentId]);

      await query(`
        DELETE FROM preinscriptions WHERE parent_id = $1
      `, [parentId]);

      // 3. Supprimer les données liées aux réinscriptions
      await query(`
        DELETE FROM echeances_paiement 
        WHERE reinscription_id IN (
          SELECT id FROM reinscriptions WHERE parent_id = $1
        )
      `, [parentId]);

      await query(`
        DELETE FROM paiements 
        WHERE reinscription_id IN (
          SELECT id FROM reinscriptions WHERE parent_id = $1
        )
      `, [parentId]);

      await query(`
        DELETE FROM reinscriptions WHERE parent_id = $1
      `, [parentId]);

      // 4. Supprimer les inscriptions
      await query(`
        DELETE FROM inscriptions WHERE parent_id = $1
      `, [parentId]);

      // 5. Supprimer les présences et notes des enfants - ✅ CORRIGÉ
      if (enfantIds.length > 0) {
        await query(`
          DELETE FROM presences WHERE eleve_id IN (SELECT unnest($1::int[]))
        `, [enfantIds]);

        await query(`
          DELETE FROM notes WHERE eleve_id IN (SELECT unnest($1::int[]))
        `, [enfantIds]);

        await query(`
          DELETE FROM inscriptions_transport WHERE eleve_id IN (SELECT unnest($1::int[]))
        `, [enfantIds]);

        await query(`
          DELETE FROM inscriptions_cantine WHERE eleve_id IN (SELECT unnest($1::int[]))
        `, [enfantIds]);
      }

      // 6. Supprimer les liens parent-enfant
      await query(`
        DELETE FROM lien_parent_eleve WHERE parent_id = $1
      `, [parentId]);

      // 7. Supprimer les enfants et leurs comptes utilisateurs
      for (const enfantId of enfantIds) {
        // Récupérer l'utilisateur_id de l'enfant
        const enfantResult = await query(`
          SELECT utilisateur_id FROM eleves WHERE id = $1
        `, [enfantId]);

        if (enfantResult.rows.length > 0) {
          const utilisateurId = enfantResult.rows[0].utilisateur_id;

          // Supprimer l'élève
          await query(`
            DELETE FROM eleves WHERE id = $1
          `, [enfantId]);

          // Supprimer l'utilisateur (élève)
          await query(`
            DELETE FROM utilisateurs WHERE id = $1
          `, [utilisateurId]);
        }
      }

      // 8. Supprimer le parent
      await query(`
        DELETE FROM parents WHERE id = $1
      `, [parentId]);

      // 9. Supprimer l'utilisateur du parent
      await query(`
        DELETE FROM utilisateurs WHERE id = $1
      `, [parent.utilisateur_id]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Parent ${parent.prenom} ${parent.nom} et ses ${enfantIds.length} enfant(s) supprimés avec succès`,
        deletedChildren: enfantIds.length
      });

    } catch (error) {
      await query('ROLLBACK');
      console.error("Erreur dans la transaction:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erreur suppression parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// ⭐ MÉTHODE PUT - Mettre à jour un parent
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL" && role !== "COMPTABLE") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const parentId = parseInt(id);

    if (isNaN(parentId) || parentId <= 0) {
      return NextResponse.json(
        { error: "ID de parent invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nom, prenom, email, telephone, adresse, profession, situation_matrimoniale } = body;

    // Vérifier que le parent existe
    const parentCheck = await query(`
      SELECT p.id, p.utilisateur_id
      FROM parents p
      WHERE p.id = $1
    `, [parentId]);

    if (parentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentCheck.rows[0];

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // 1. Mettre à jour l'utilisateur (nom, prenom, email, telephone, adresse)
      await query(`
        UPDATE utilisateurs 
        SET nom = $1, prenom = $2, email = $3, telephone = $4, adresse = $5, updated_at = NOW()
        WHERE id = $6
      `, [nom, prenom, email, telephone, adresse, parent.utilisateur_id]);

      // 2. Mettre à jour le parent (profession, situation_matrimoniale)
      await query(`
        UPDATE parents 
        SET profession = $1, situation_matrimoniale = $2, updated_at = NOW()
        WHERE id = $3
      `, [profession, JSON.stringify(situation_matrimoniale), parentId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Parent mis à jour avec succès`
      });

    } catch (error) {
      await query('ROLLBACK');
      console.error("Erreur dans la transaction:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erreur modification parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}