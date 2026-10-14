// app/api/parent/cantine/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyParentChildAccess } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email utilisateur non trouvé" }, { status: 400 });
    }

    const url = new URL(request.url);
    const enfantIdParam = url.searchParams.get("enfantId");
    const enfantId = enfantIdParam ? parseInt(enfantIdParam) : null;

    if (enfantId) {
      const { autorise } = await verifyParentChildAccess(userEmail, enfantId, 'eleves');
      if (!autorise) {
        return NextResponse.json(
          { error: "Accès refusé : cet enfant ne vous appartient pas" },
          { status: 403 }
        );
      }
    }

    // ⭐ Récupérer le parent connecté
    const parentRes = await query(`
      SELECT p.id FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [userEmail]);

    if (parentRes.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }
    const parentId = parentRes.rows[0].id;

    // ⭐⭐⭐ ENFANTS INSCRITS (élèves) AVEC PAIEMENTS CANTINE ⭐⭐⭐
    let enfantsQuery = `
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        ic.id as inscription_cantine_id,
        ic.est_actif as cantine_actif,
        ic.solde,
        ic.mois_total,
        ic.mois_restants,
        ic.montant_mensuel,
        ic.montant_total,
        ic.date_inscription,
        -- ⭐ Montant payé pour ce service via preinscriptions liées
        COALESCE((
          SELECT SUM(pay.montant) 
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'cantine'
            AND pay.eleve_id = e.id
        ), 0) AS montant_paye_eleve,
        -- ⭐ Nom du menu si disponible
        (SELECT cm.plat FROM cantine_menus cm LIMIT 1) AS menu_nom,
        'eleve' as source
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions_cantine ic ON e.id = ic.eleve_id AND ic.est_actif = true
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL
    `;
    const enfantsParams: any[] = [parentId];

    if (enfantId) {
      enfantsQuery += ` AND e.id = $2`;
      enfantsParams.push(enfantId);
    }

    enfantsQuery += ` ORDER BY e.id`;

    const enfantsResult = await query(enfantsQuery, enfantsParams);

    // ⭐⭐⭐ PRÉ-INSCRIPTIONS AVEC CANTINE ⭐⭐⭐
    let preinscriptionsQuery = `
      SELECT 
        p.id,
        p.numero_dossier as matricule,
        p.enfant_nom as nom,
        p.enfant_prenom as prenom,
        p.classe as classe_nom,
        pc.id as inscription_cantine_id,
        (pc.id IS NOT NULL) as cantine_actif,
        COALESCE(pc.prix, 0) as montant_total,
        -- ⭐ Montant payé pour cette pré-inscription spécifique
        COALESCE((
          SELECT SUM(pay.montant)
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'cantine'
            AND pay.preinscription_id = p.id
        ), 0) as montant_paye,
        0 as solde,
        CASE WHEN pc.id IS NOT NULL THEN 9 ELSE 0 END as mois_total,
        CASE WHEN pc.id IS NOT NULL THEN 9 ELSE 0 END as mois_restants,
        CASE WHEN pc.id IS NOT NULL THEN 400000 ELSE 0 END as montant_mensuel,
        p.date_preinscription as date_inscription,
        cm.plat as menu_nom,
        'preinscription' as source
      FROM preinscriptions p
      JOIN parents par ON p.parent_id = par.id
      LEFT JOIN preinscription_cantine pc ON pc.preinscription_id = p.id
      LEFT JOIN cantine_menus cm ON cm.id = pc.menu_id
      WHERE par.id = $1
        AND p.statut IN ('en_attente', 'valide', 'partiel')
        AND NOT EXISTS (
          SELECT 1 FROM inscriptions i
          WHERE i.preinscription_id = p.id
        )
    `;
    const preinscParams: any[] = [parentId];

    if (enfantId) {
      preinscriptionsQuery += ` AND p.id = $2`;
      preinscParams.push(enfantId);
    }

    preinscriptionsQuery += ` ORDER BY p.id`;

    const preinscriptionsResult = await query(preinscriptionsQuery, preinscParams);

    const tousEnfants = [...enfantsResult.rows, ...preinscriptionsResult.rows];

    if (tousEnfants.length === 0) {
      return NextResponse.json({ enfants: [], reservations: [] });
    }

    const enfantIds = enfantsResult.rows.map((e: any) => e.id).filter(Boolean);
    let reservationsResult = { rows: [] as any[] };

    if (enfantIds.length > 0) {
      reservationsResult = await query(`
        SELECT 
          rc.id, rc.eleve_id as enfant_id, rc.menu_id, rc.date, rc.statut, rc.paye
        FROM reservations_cantine rc
        WHERE rc.eleve_id = ANY($1::int[])
          AND rc.date >= CURRENT_DATE
          AND rc.statut = 'confirmee'
      `, [enfantIds]);
    }

    // ⭐⭐⭐ FORMATAGE AVEC STATUT DE PAIEMENT ⭐⭐⭐
    const enfantsData = tousEnfants.map((e: any) => {
      const montantTotal = Number(e.montant_total) || 0;
      const montantPaye = Number(e.montant_paye ?? e.montant_paye_eleve) || 0;
      const montantRestant = Math.max(0, montantTotal - montantPaye);

      // ⭐ Calcul du statut de paiement
      let paiementStatut: 'paye' | 'partiel' | 'non_paye' = 'non_paye';
      if (montantPaye > 0 && montantRestant === 0) {
        paiementStatut = 'paye';
      } else if (montantPaye > 0 && montantRestant > 0) {
        paiementStatut = 'partiel';
      } else {
        paiementStatut = 'non_paye';
      }

      return {
        id: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe_nom,
        inscritCantine: e.cantine_actif === true,
        solde: parseFloat(e.solde) || 0,
        preferences: [],
        allergies: [],
        menusReserves: reservationsResult.rows.filter((r: any) => r.enfant_id === e.id).length,
        source: e.source || 'eleve',
        statut: e.source === 'preinscription' ? 'en_attente' : 'inscrit',
        moisTotal: Number(e.mois_total) || 0,
        moisRestants: Number(e.mois_restants) || 0,
        montantMensuel: Number(e.montant_mensuel) || 0,
        montantTotal,
        montantPaye,
        montantRestant,
        menuNom: e.menu_nom || null,
        paiementStatut,
        dateInscription: e.date_inscription
          ? (e.date_inscription instanceof Date
              ? e.date_inscription.toISOString().split('T')[0]
              : e.date_inscription)
          : null
      };
    });

    const reservationsData = reservationsResult.rows.map((r: any) => ({
      id: r.id,
      enfantId: r.enfant_id,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      menuId: r.menu_id,
      statut: r.statut,
      paye: r.paye
    }));

    return NextResponse.json({
      enfants: enfantsData,
      reservations: reservationsData
    });

  } catch (error) {
    console.error("Erreur GET cantine:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue")
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email utilisateur non trouvé" }, { status: 400 });
    }

    const body = await request.json();
    const { enfantId, menuIds, quantities, total } = body;

    if (!enfantId || !menuIds || !quantities || !total) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const { autorise } = await verifyParentChildAccess(userEmail, enfantId, 'eleves');
    if (!autorise) {
      return NextResponse.json(
        { error: "Accès refusé : cet enfant ne vous appartient pas" },
        { status: 403 }
      );
    }

    const soldeResult = await query(`
      SELECT solde FROM inscriptions_cantine
      WHERE eleve_id = $1 AND est_actif = true
    `, [enfantId]);

    const soldeActuel = soldeResult.rows.length > 0
      ? parseFloat(soldeResult.rows[0].solde) || 0
      : 0;

    if (soldeActuel < total) {
      return NextResponse.json({
        error: `Solde insuffisant. Solde actuel: ${soldeActuel.toLocaleString()} GNF.`
      }, { status: 400 });
    }

    const reservations = [];
    for (const menuId of menuIds) {
      const qty = quantities[menuId];
      if (!qty) continue;
      const menuDate = body.date || new Date().toISOString().split('T')[0];

      for (let i = 0; i < qty; i++) {
        const result = await query(`
          INSERT INTO reservations_cantine (eleve_id, menu_id, date, statut, paye)
          VALUES ($1, $2, $3, 'confirmee', false)
          RETURNING id, eleve_id, menu_id, date, statut, paye
        `, [enfantId, parseInt(menuId), menuDate]);

        reservations.push({
          id: result.rows[0].id,
          enfantId: result.rows[0].eleve_id,
          menuId: result.rows[0].menu_id,
          date: result.rows[0].date,
          statut: result.rows[0].statut,
          paye: result.rows[0].paye
        });
      }
    }

    await query(`
      UPDATE inscriptions_cantine
      SET solde = solde - $1
      WHERE eleve_id = $2 AND est_actif = true
    `, [total, enfantId]);

    await query(`
      INSERT INTO transactions_cantine (eleve_id, montant, type, description, date)
      VALUES ($1, $2, 'debit', 'Réservation repas', NOW())
    `, [enfantId, total]);

    return NextResponse.json({
      success: true,
      reservations,
      nouveauSolde: soldeActuel - total
    });

  } catch (error) {
    console.error("Erreur POST cantine:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue")
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Email utilisateur non trouvé" }, { status: 400 });
    }

    const body = await request.json();
    const { reservationId, enfantId } = body;

    if (!reservationId || !enfantId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const { autorise } = await verifyParentChildAccess(userEmail, enfantId, 'eleves');
    if (!autorise) {
      return NextResponse.json(
        { error: "Accès refusé : cet enfant ne vous appartient pas" },
        { status: 403 }
      );
    }

    await query(`DELETE FROM reservations_cantine WHERE id = $1 AND eleve_id = $2`, [reservationId, enfantId]);

    const prix = body.montant || 0;
    if (prix > 0) {
      await query(`
        UPDATE inscriptions_cantine
        SET solde = solde + $1
        WHERE eleve_id = $2 AND est_actif = true
      `, [prix, enfantId]);

      await query(`
        INSERT INTO transactions_cantine (eleve_id, montant, type, description, date)
        VALUES ($1, $2, 'credit', 'Annulation réservation', NOW())
      `, [enfantId, prix]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur DELETE cantine:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue")
    }, { status: 500 });
  }
}