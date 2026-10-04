// app/api/admin/recus/parents/[parentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ parentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN", "DIRECTEUR_GENERAL", "DIRECTEUR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { parentId } = await params;
    const parentIdInt = parseInt(parentId);

    if (isNaN(parentIdInt)) {
      return NextResponse.json({ error: "ID parent invalide" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const annee = searchParams.get("annee") || new Date().getFullYear().toString();

    console.log(`🔍 Recherche des reçus pour le parent ${parentIdInt}, année ${annee}`);

    // 1. Récupérer les infos du parent
    const parentResult = await query(`
      SELECT 
        p.id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [parentIdInt]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentResult.rows[0];

    // Récupérer la liste des enfants de ce parent
    const enfantsListeResult = await query(`
      SELECT 
        u.nom,
        u.prenom,
        COALESCE(c.nom, 'Non assigné') as classe
      FROM lien_parent_eleve lpe
      JOIN eleves e ON lpe.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL
      UNION
      SELECT 
        enfant_nom as nom,
        enfant_prenom as prenom,
        COALESCE(classe, niveau, 'Pré-inscription') as classe
      FROM preinscriptions
      WHERE parent_id = $1 AND statut IN ('en_attente', 'valide')
      UNION
      SELECT 
        enfant_nom as nom,
        enfant_prenom as prenom,
        COALESCE(classe_nom, 'Réinscription') as classe
      FROM reinscriptions
      WHERE parent_id = $1 AND statut IN ('en_attente', 'valide')
    `, [parentIdInt]);

    // 2. Récupérer TOUS les paiements liés au parent (pré-inscription, réinscription, élèves)
    const paiementsResult = await query(`
      SELECT 
        CONCAT('REC-', LPAD(COALESCE(pay.id, r.id, 0)::text, 5, '0')) AS numero_recu,
        COALESCE(pay.date_paiement, p.frais_date_paiement, r.date_reinscription, NOW()) AS date_paiement,
        COALESCE(
          p.enfant_prenom || ' ' || p.enfant_nom,
          r.enfant_prenom || ' ' || r.enfant_nom,
          ue.prenom || ' ' || ue.nom,
          'Élève inconnu'
        ) AS enfant,
        COALESCE(pay.montant, p.frais_montant, r.montant_frais, 0) AS montant,
        COALESCE(pay.mode_paiement, p.frais_mode_paiement, 'especes') AS mode_paiement,
        COALESCE(pay.type_frais, 'inscription') AS type_frais,
        COALESCE(pay.reference_transaction, p.numero_dossier, CONCAT('REF-', COALESCE(pay.id, r.id, 0))) AS reference,
        COALESCE(p.classe, r.classe_nom, c.nom, 'N/A') AS classe,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id),
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id),
          p.montant_total_plan, r.montant_total_plan, c.total_versement, 0
        ) AS montant_total,
        GREATEST(0, COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id),
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id),
          p.montant_total_plan, r.montant_total_plan, 0
        ) - COALESCE(
          (SELECT SUM(pp.montant) FROM paiements pp WHERE (pp.preinscription_id = p.id OR pp.reinscription_id = r.id OR (pp.eleve_id = e.id AND pp.preinscription_id IS NULL AND pp.reinscription_id IS NULL)) AND pp.statut = 'valide'),
          0
        )) AS reste_a_payer,
        'paiement' AS source,
        COALESCE(pay.id, 0) AS source_id,
        p.id AS preinscription_id
      FROM parents pa
      -- Paiements via pré-inscriptions
      LEFT JOIN preinscriptions p ON p.parent_id = pa.id
      LEFT JOIN paiements pay ON pay.preinscription_id = p.id
      -- Paiements via réinscriptions
      LEFT JOIN reinscriptions r ON r.parent_id = pa.id
      LEFT JOIN paiements pay_r ON pay_r.reinscription_id = r.id
      -- Élèves directs
      LEFT JOIN lien_parent_eleve lpe ON lpe.parent_id = pa.id
      LEFT JOIN eleves e ON e.id = lpe.eleve_id
      LEFT JOIN utilisateurs ue ON e.utilisateur_id = ue.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN paiements pay_e ON pay_e.eleve_id = e.id AND pay_e.preinscription_id IS NULL AND pay_e.reinscription_id IS NULL
      WHERE pa.id = $1
        AND (
          pay.id IS NOT NULL OR 
          p.frais_statut = 'paye' OR 
          pay_r.id IS NOT NULL OR 
          pay_e.id IS NOT NULL
        )
        AND EXTRACT(YEAR FROM COALESCE(pay.date_paiement, p.frais_date_paiement, r.date_reinscription, pay_r.date_paiement, pay_e.date_paiement, NOW())) = $2
      ORDER BY COALESCE(pay.date_paiement, p.frais_date_paiement, r.date_reinscription, pay_r.date_paiement, pay_e.date_paiement, NOW()) DESC
    `, [parentIdInt, parseInt(annee)]);

    console.log(`📊 ${paiementsResult.rows.length} paiements trouvés pour le parent ${parentIdInt}`);

    // 3. Récupérer les reçus de la table recus pour ce parent
    const recusResult = await query(`
      SELECT 
        r.numero_recu,
        r.date_paiement,
        COALESCE(r.enfant_nom, 'Élève inconnu') AS enfant,
        r.montant,
        COALESCE(r.mode_paiement, 'especes') AS mode_paiement,
        COALESCE(r.type_frais, 'inscription') AS type_frais,
        COALESCE(r.reference, r.numero_recu) AS reference,
        COALESCE(r.classe_nom, 'N/A') AS classe,
        COALESCE(r.montant_total, 0) AS montant_total,
        COALESCE(r.reste_a_payer, 0) AS reste_a_payer,
        'recus' AS source,
        r.paiement_id AS source_id,
        r.preinscription_id
      FROM recus r
      WHERE r.parent_nom = $1
        AND EXTRACT(YEAR FROM r.date_paiement) = $2
      ORDER BY r.date_paiement DESC
    `, [`${parent.prenom} ${parent.nom}`, parseInt(annee)]);

    console.log(`📊 ${recusResult.rows.length} reçus trouvés dans la table recus`);

    // 4. Fusionner les résultats et éviter les doublons
    const allRecus = [...paiementsResult.rows, ...recusResult.rows];
    
    // Éliminer les doublons (par montant + date + enfant)
    const seen = new Set();
    const uniqueRecus = allRecus.filter((recu: any) => {
      const key = `${recu.montant}-${new Date(recu.date_paiement).toDateString()}-${recu.enfant}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`✅ ${uniqueRecus.length} reçus uniques après dédoublonnage`);

    // Calculer les totaux
    const totalRecus = uniqueRecus.length;
    const totalMontant = uniqueRecus.reduce((acc, r) => acc + Number(r.montant || 0), 0);
    const totalMontantTotal = uniqueRecus.reduce((acc, r) => acc + Number(r.montant_total || 0), 0);
    const totalReste = uniqueRecus.reduce((acc, r) => acc + Number(r.reste_a_payer || 0), 0);

    return NextResponse.json({
      parent,
      enfants: enfantsListeResult.rows,
      recus: uniqueRecus,
      statistiques: {
        total_recus: totalRecus,
        total_montant: totalMontant,
        total_montant_total: totalMontantTotal,
        total_reste: totalReste
      }
    });
  } catch (error) {
    console.error("Erreur API /api/admin/recus/parents/[parentId]:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ parentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN", "DIRECTEUR_GENERAL", "DIRECTEUR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { parentId } = await params;
    const parentIdInt = parseInt(parentId);

    if (isNaN(parentIdInt)) {
      return NextResponse.json({ error: "ID parent invalide" }, { status: 400 });
    }

    // 1. Vérifier l'existence du parent
    const parentRes = await query(`
      SELECT p.id, u.nom, u.prenom
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [parentIdInt]);

    if (parentRes.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentRes.rows[0];
    const parentNomComplet = `${parent.prenom} ${parent.nom}`;

    // 2. Récupérer les IDs des préinscriptions du parent
    const preinscRes = await query(
      `SELECT id FROM preinscriptions WHERE parent_id = $1`,
      [parentIdInt]
    );
    const preinscIds: number[] = preinscRes.rows.map((r: any) => r.id);

    // 3. Récupérer les IDs des réinscriptions du parent
    const reinscRes = await query(
      `SELECT id FROM reinscriptions WHERE parent_id = $1`,
      [parentIdInt]
    );
    const reinscIds: number[] = reinscRes.rows.map((r: any) => r.id);

    // 4. Récupérer les IDs des élèves liés au parent
    const elevesRes = await query(
      `SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1`,
      [parentIdInt]
    );
    const eleveIds: number[] = elevesRes.rows.map((r: any) => r.eleve_id);

    // 5. Récupérer les paiements concernés
    let paiementsIds: number[] = [];
    const paiementsRes = await query(`
      SELECT id FROM paiements
      WHERE (preinscription_id = ANY($1::int[]))
         OR (reinscription_id = ANY($2::int[]))
         OR (eleve_id = ANY($3::int[]))
    `, [
      preinscIds.length > 0 ? preinscIds : [-1],
      reinscIds.length > 0 ? reinscIds : [-1],
      eleveIds.length > 0 ? eleveIds : [-1]
    ]);
    paiementsIds = paiementsRes.rows.map((r: any) => r.id);

    // 6. Supprimer les reçus associés dans la table recus
    await query(`
      DELETE FROM recus
      WHERE (preinscription_id = ANY($1::int[]))
         OR (paiement_id = ANY($2::int[]))
         OR (parent_nom ILIKE $3)
    `, [
      preinscIds.length > 0 ? preinscIds : [-1],
      paiementsIds.length > 0 ? paiementsIds : [-1],
      parentNomComplet
    ]);

    // 7. Supprimer les paiements associés dans la table paiements
    if (paiementsIds.length > 0) {
      await query(`
        DELETE FROM paiements
        WHERE id = ANY($1::int[])
      `, [paiementsIds]);
    }

    // 8. Réinitialiser les soldes des préinscriptions (sans supprimer les dossiers d'élèves)
    if (preinscIds.length > 0) {
      await query(`
        UPDATE preinscriptions
        SET 
          montant_restant_plan = COALESCE(montant_total_plan, 0),
          frais_statut = 'non_paye',
          frais_montant = 0,
          frais_date_paiement = NULL,
          frais_mode_paiement = NULL,
          frais_reference = NULL
        WHERE parent_id = $1
      `, [parentIdInt]);
    }

    // 9. Réinitialiser les soldes des réinscriptions (sans supprimer les dossiers d'élèves)
    if (reinscIds.length > 0) {
      await query(`
        UPDATE reinscriptions
        SET 
          montant_restant_plan = COALESCE(montant_total_plan, 0),
          frais_statut = 'non_paye',
          montant_frais = 0,
          frais_date_paiement = NULL,
          frais_mode_paiement = NULL,
          frais_reference = NULL
        WHERE parent_id = $1
      `, [parentIdInt]);
    }

    return NextResponse.json({
      success: true,
      message: `Tous les paiements et reçus de la famille de ${parentNomComplet} ont été supprimés avec succès. Les comptes parent et élèves restent intacts.`,
      supprimes: {
        paiements: paiementsIds.length,
        parent: parentNomComplet
      }
    });

  } catch (error) {
    console.error("Erreur DELETE /api/admin/recus/parents/[parentId]:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression: " + (error as Error).message },
      { status: 500 }
    );
  }
}