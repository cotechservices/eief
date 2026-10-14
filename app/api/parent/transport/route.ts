// app/api/parent/transport/route.ts
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

    // ⭐⭐⭐ ENFANTS INSCRITS (élèves) avec paiements transport ⭐⭐⭐
    let elevesQuery = `
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        it.id as inscription_transport_id,
        it.est_actif as transport_actif,
        it.montant_mensuel,
        it.montant_total,
        it.mois_total,
        it.mois_restants,
        it.solde,
        it.date_debut,
        lt.id as ligne_id,
        lt.nom as ligne_nom,
        lt.horaire_matin,
        lt.horaire_soir,
        lt.prix_abonnement,
        b.immatriculation,
        b.chauffeur_nom,
        b.chauffeur_tel,
        b.capacite,
        COALESCE((
          SELECT SUM(pay.montant)
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'transport'
            AND pay.eleve_id = e.id
        ), 0) AS montant_paye_eleve,
        COALESCE((
          SELECT SUM(pay.montant)
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'transport'
            AND pay.preinscription_id IN (
              SELECT i.preinscription_id FROM inscriptions i WHERE i.eleve_id = e.id
            )
        ), 0) AS montant_paye_preinscription,
        COALESCE((
          SELECT SUM(pay.montant)
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'transport'
            AND pay.reinscription_id IN (
              SELECT id FROM reinscriptions WHERE eleve_id = e.id
            )
        ), 0) AS montant_paye_reinscription,
        'eleve' as source
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions_transport it ON e.id = it.eleve_id AND it.est_actif = true
      LEFT JOIN lignes_transport lt ON it.ligne_id = lt.id
      LEFT JOIN bus b ON lt.bus_id = b.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL
    `;
    const elevesParams: any[] = [parentId];

    if (enfantId) {
      elevesQuery += ` AND e.id = $2`;
      elevesParams.push(enfantId);
    }

    elevesQuery += ` ORDER BY e.id`;

    const elevesResult = await query(elevesQuery, elevesParams);

    // ⭐⭐⭐ PRÉ-INSCRIPTIONS avec transport + paiements ⭐⭐⭐
    let preinscriptionsQuery = `
      SELECT 
        pr.id,
        pr.numero_dossier as matricule,
        pr.enfant_nom as nom,
        pr.enfant_prenom as prenom,
        pr.classe as classe_nom,
        pt.id as inscription_transport_id,
        (pt.id IS NOT NULL) as transport_actif,
        COALESCE(pt.prix, 0) as montant_total,
        COALESCE((
          SELECT SUM(pay.montant)
          FROM paiements pay
          WHERE pay.statut IN ('valide', 'paye')
            AND pay.type_frais = 'transport'
            AND pay.preinscription_id = pr.id
        ), 0) AS montant_paye,
        pt.ligne_id,
        lt.nom as ligne_nom,
        lt.horaire_matin,
        lt.horaire_soir,
        lt.prix_abonnement,
        b.immatriculation,
        b.chauffeur_nom,
        b.chauffeur_tel,
        b.capacite,
        9 as mois_total,
        9 as mois_restants,
        COALESCE(lt.prix_abonnement, 0) as montant_mensuel,
        'preinscription' as source
      FROM preinscriptions pr
      JOIN parents par ON pr.parent_id = par.id
      LEFT JOIN preinscription_transport pt ON pt.preinscription_id = pr.id
      LEFT JOIN lignes_transport lt ON pt.ligne_id = lt.id
      LEFT JOIN bus b ON lt.bus_id = b.id
      WHERE par.id = $1 
        AND pr.statut IN ('en_attente', 'valide', 'partiel')
    `;
    const preinscParams: any[] = [parentId];

    if (enfantId) {
      preinscriptionsQuery += ` AND pr.id = $2`;
      preinscParams.push(enfantId);
    }

    preinscriptionsQuery += ` ORDER BY pr.id`;

    const preinscriptionsResult = await query(preinscriptionsQuery, preinscParams);

    const tousEnfants = [...elevesResult.rows, ...preinscriptionsResult.rows];

    // ⭐⭐⭐ FORMATAGE AVEC STATUT DE PAIEMENT ⭐⭐⭐
    const enfantsData = tousEnfants.map((e: any) => {
      const montantTotal = Number(e.montant_total) || 0;

      let montantPaye = 0;
      if (e.source === 'preinscription') {
        montantPaye = Number(e.montant_paye) || 0;
      } else {
        montantPaye =
          (Number(e.montant_paye_eleve) || 0) +
          (Number(e.montant_paye_preinscription) || 0) +
          (Number(e.montant_paye_reinscription) || 0);
      }

      const solde = Math.max(0, montantTotal - montantPaye);

      let paiementStatut: 'paye' | 'partiel' | 'non_paye' = 'non_paye';
      if (montantTotal > 0) {
        if (montantPaye >= montantTotal) {
          paiementStatut = 'paye';
        } else if (montantPaye > 0) {
          paiementStatut = 'partiel';
        } else {
          paiementStatut = 'non_paye';
        }
      }

      return {
        id: e.id,
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe_nom,
        inscritTransport: e.transport_actif === true,
        ligne: e.ligne_nom,
        ligneId: e.ligne_id,
        arret: "Arrêt principal",
        heureMatin: e.horaire_matin ? String(e.horaire_matin).substring(0, 5) : null,
        heureSoir: e.horaire_soir ? String(e.horaire_soir).substring(0, 5) : null,
        chauffeur: e.chauffeur_nom,
        chauffeurTel: e.chauffeur_tel,
        immatriculation: e.immatriculation,
        capacite: e.capacite,
        prixAbonnement: parseFloat(e.prix_abonnement) || 0,
        montantMensuel: Number(e.montant_mensuel) || 0,
        montantTotal,
        montantPaye,
        solde,
        paiementStatut,
        moisTotal: e.mois_total,
        moisRestants: e.mois_restants,
        source: e.source || 'eleve',
        statut: e.source === 'preinscription' ? 'en_attente' : 'inscrit'
      };
    });

    // ⭐ Lignes disponibles
    const lignesResult = await query(`
      SELECT 
        lt.id, lt.nom, lt.horaire_matin, lt.horaire_soir, lt.prix_abonnement,
        b.immatriculation, b.chauffeur_nom, b.chauffeur_tel, b.capacite
      FROM lignes_transport lt
      LEFT JOIN bus b ON lt.bus_id = b.id
      ORDER BY lt.nom
    `);

    const lignesData = lignesResult.rows.map((l: any) => ({
      id: l.id,
      nom: l.nom,
      horaireMatin: l.horaire_matin ? String(l.horaire_matin).substring(0, 5) : null,
      horaireSoir: l.horaire_soir ? String(l.horaire_soir).substring(0, 5) : null,
      prixAbonnement: parseFloat(l.prix_abonnement) || 0,
      immatriculation: l.immatriculation,
      chauffeur: l.chauffeur_nom,
      chauffeurTel: l.chauffeur_tel,
      capacite: l.capacite
    }));

    const busPosition = {
      latitude: 9.5092,
      longitude: -13.7122,
      vitesse: 35,
      derniereMiseAJour: new Date().toISOString(),
      retard: 0
    };

    return NextResponse.json({
      enfants: enfantsData,
      lignes: lignesData,
      busPosition
    });

  } catch (error) {
    console.error("Erreur GET transport:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue")
    }, { status: 500 });
  }
}