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

    // Récupérer les pré-inscriptions du parent
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
        'preinscription' as type_dossier
      FROM preinscriptions p
      WHERE p.parent_id = $1
      ORDER BY p.date_preinscription DESC
    `, [parentId]);

    // Récupérer les réinscriptions du parent
    const reinscriptionsResult = await query(`
      SELECT 
        r.id,
        r.numero_dossier,
        r.enfant_nom,
        r.enfant_prenom,
        NULL as date_naissance,
        r.niveau,
        r.classe_id as classe,
        r.statut,
        r.frais_statut,
        r.montant_frais as frais_montant,
        r.date_reinscription as date_preinscription,
        r.montant_total_plan,
        r.montant_restant_plan,
        'reinscription' as type_dossier
      FROM reinscriptions r
      WHERE r.parent_id = $1
      ORDER BY r.date_reinscription DESC
    `, [parentId]);

    // ⭐ Calculer le solde restant exact pour les élèves du parent (identique à /api/parent/enfants)
    const elevesFraisResult = await query(`
      SELECT 
        e.id as eleve_id,
        COALESCE(c.total_versement, c.frais_inscription, 0) as frais_inscription_classe,
        COALESCE(c.reinscription_total_versement, c.total_versement, 0) as frais_reinscription_classe,
        COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.eleve_id = e.id AND pai.statut = 'valide'), 0) as frais_paye_eleve,
        COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.preinscription_id IN (SELECT i.preinscription_id FROM inscriptions i WHERE i.eleve_id = e.id) AND pai.statut = 'valide'), 0) as frais_paye_preinscription,
        COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.reinscription_id IN (SELECT id FROM reinscriptions WHERE eleve_id = e.id) AND pai.statut = 'valide'), 0) as frais_paye_reinscription,
        (SELECT p.montant_total_plan FROM preinscriptions p JOIN inscriptions i ON i.preinscription_id = p.id WHERE i.eleve_id = e.id LIMIT 1) as montant_total_plan
      FROM eleves e
      LEFT JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL
    `, [parentId]);

    let soldeElevesTotal = 0;
    for (const row of elevesFraisResult.rows) {
      const fraisClasse = Number(row.frais_reinscription_classe) > 0 ? Number(row.frais_reinscription_classe) : Number(row.frais_inscription_classe);
      const montantTotal = Number(row.montant_total_plan) > 0 ? Number(row.montant_total_plan) : fraisClasse;
      const totalPaye = Number(row.frais_paye_eleve) + Number(row.frais_paye_preinscription) + Number(row.frais_paye_reinscription);
      soldeElevesTotal += Math.max(0, montantTotal - totalPaye);
    }

    const allDossiers = [...(preinscriptionsResult.rows || []), ...(reinscriptionsResult.rows || [])];
    const soldeDossiersTotal = allDossiers.reduce((acc, p) => acc + (Number(p.montant_restant_plan) || 0), 0);

    const soldeRestantTotal = soldeElevesTotal > 0 ? soldeElevesTotal : soldeDossiersTotal;

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