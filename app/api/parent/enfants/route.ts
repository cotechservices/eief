// app/api/parent/enfants/route.ts - Version corrigée

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    // 1️⃣ Récupérer le parent
    const parentResult = await query(`
      SELECT id FROM parents WHERE utilisateur_id = (
        SELECT id FROM utilisateurs WHERE email = $1
      )
    `, [userEmail]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parentId = parentResult.rows[0].id;

    // Récupérer le total des remises accordées à ce parent
    const remisesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_remise
      FROM remises_familles
      WHERE parent_id = $1
    `, [parentId]);
    const totalRemiseParent = Number(remisesResult.rows[0]?.total_remise) || 0;

    // Récupérer le total des commandes de librairie validées du parent
    const librairieResult = await query(`
      SELECT COALESCE(SUM(total), 0) as total_librairie
      FROM commandes_librairie
      WHERE parent_id = $1 AND statut = 'valide'
    `, [parentId]);
    const totalLibrairieParent = Number(librairieResult.rows[0]?.total_librairie) || 0;

    // Garantir que montant_total_plan de préinscription ne compte QUE les échéances de scolarité
    try {
      await query(`
        UPDATE preinscriptions p
        SET montant_total_plan = sub.scolarite_ech,
            montant_restant_plan = GREATEST(0, sub.scolarite_ech - COALESCE(sub.scolarite_paye, 0))
        FROM (
          SELECT 
            ep.preinscription_id,
            SUM(CASE WHEN ep.type = 'inscription' THEN ep.montant ELSE 0 END) as scolarite_ech,
            (SELECT COALESCE(SUM(montant), 0) FROM paiements pay WHERE pay.preinscription_id = ep.preinscription_id AND pay.type_frais = 'inscription' AND pay.statut = 'valide') as scolarite_paye
          FROM echeances_paiement ep
          WHERE ep.preinscription_id IS NOT NULL
          GROUP BY ep.preinscription_id
        ) sub
        WHERE p.id = sub.preinscription_id
          AND sub.scolarite_ech > 0
          AND (COALESCE(p.montant_total_plan, 0) != sub.scolarite_ech OR COALESCE(p.montant_restant_plan, 0) != GREATEST(0, sub.scolarite_ech - sub.scolarite_paye))
      `);
    } catch (syncErr) {
      console.warn("Avertissement synchro preinscriptions scolarite:", syncErr);
    }

    // 2️⃣ Récupérer les ÉLÈVES déjà inscrits
    const elevesResult = await query(`
      SELECT 
        e.id,
        e.matricule,
        e.id as eleve_id,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        c.niveau,
        e.sexe,
        e.date_naissance,
        e.lieu_naissance,
        COALESCE(c.total_versement, c.frais_inscription, 0) as frais_inscription_classe,
        COALESCE(c.reinscription_total_versement, c.total_versement, 0) as frais_reinscription_classe,
        e.photo_url,
        -- Frais optionnels
        COALESCE(
          (SELECT SUM(ic.montant_total)
           FROM inscriptions_cantine ic
           WHERE ic.eleve_id = e.id),
          0
        ) as frais_cantine_reel,
        COALESCE(
          (SELECT SUM(it.montant_mensuel * it.mois_total)
           FROM inscriptions_transport it
           WHERE it.eleve_id = e.id),
          0
        ) as frais_transport_reel,
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           JOIN preinscriptions p ON cf.preinscription_id = p.id
           JOIN inscriptions i ON i.preinscription_id = p.id
           WHERE i.eleve_id = e.id),
          0
        ) as frais_fournitures,
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.eleve_id = e.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_eleve,
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.preinscription_id IN (
             SELECT i.preinscription_id 
             FROM inscriptions i 
             WHERE i.eleve_id = e.id
           )
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_preinscription,
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.reinscription_id IN (
             SELECT id FROM reinscriptions WHERE eleve_id = e.id
           )
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_reinscription,
        COALESCE(
          (SELECT SUM(eche.montant) 
           FROM echeances_paiement eche
           WHERE eche.preinscription_id IN (
             SELECT i.preinscription_id 
             FROM inscriptions i 
             WHERE i.eleve_id = e.id
           )
           AND eche.statut = 'paye'),
          0
        ) as frais_paye_echeances,
        (SELECT i.preinscription_id 
         FROM inscriptions i 
         WHERE i.eleve_id = e.id
         LIMIT 1) as preinscription_id,
        (SELECT p.montant_total_plan 
         FROM preinscriptions p
         JOIN inscriptions i ON i.preinscription_id = p.id
         WHERE i.eleve_id = e.id
         LIMIT 1) as montant_total_plan,
        0 as preinscription_frais_cantine,
        0 as preinscription_frais_transport,
        0 as preinscription_frais_fournitures,
        TRUE as est_eleve,
        FALSE as est_preinscription,
        'eleve' as type
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      WHERE lpe.parent_id = $1
        AND e.deleted_at IS NULL
      ORDER BY u.nom, u.prenom
    `, [parentId]);

    // 3️⃣ Récupérer les PRÉ-INSCRIPTIONS en attente
    const preinscriptionsResult = await query(`
      SELECT 
        p.id,
        p.numero_dossier as matricule,
        p.id as eleve_id,
        p.enfant_nom as nom,
        p.enfant_prenom as prenom,
        p.classe as classe_nom,
        p.niveau,
        p.sexe,
        p.date_naissance,
        p.lieu_naissance,
        -- Scolarité réelle (échéances de type 'inscription' uniquement, ex: 5 900 000)
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id AND ep.type = 'inscription'), 0),
          p.frais_montant,
          0
        ) as frais_inscription_classe,
        0 as frais_reinscription_classe,
        p.photo_url,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id AND ep.type = 'cantine'),
          0
        ) as frais_cantine_reel,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id AND ep.type = 'transport'),
          0
        ) as frais_transport_reel,
        -- Fournitures réelles depuis échéances ou commandes (ex: 660 000)
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id AND ep.type = 'fournitures'), 0),
          (SELECT SUM(cf.quantite * cf.prix_unitaire) FROM commandes_fournitures cf WHERE cf.preinscription_id = p.id),
          0
        ) as frais_fournitures,
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.preinscription_id = p.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_direct,
        0 as frais_paye_echeances,
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id AND ep.type = 'inscription'), 0),
          p.montant_total_plan,
          p.frais_montant,
          0
        ) as montant_total_plan,
        0 as preinscription_frais_cantine,
        0 as preinscription_frais_transport,
        0 as preinscription_frais_fournitures,
        FALSE as est_eleve,
        TRUE as est_preinscription,
        'preinscription' as type,
        p.statut,
        p.frais_statut
      FROM preinscriptions p
      WHERE p.parent_id = $1
        AND p.statut = 'en_attente'
      ORDER BY p.date_preinscription DESC
    `, [parentId]);

    // 4️⃣ Récupérer les RÉINSCRIPTIONS
    const reinscriptionsResult = await query(`
      SELECT 
        r.id,
        r.numero_dossier as matricule,
        r.id as eleve_id,
        r.enfant_nom as nom,
        r.enfant_prenom as prenom,
        r.classe_nom as classe_nom,
        r.niveau,
        r.sexe,
        r.date_naissance,
        r.lieu_naissance,
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'reinscription'), 0),
          r.montant_frais,
          0
        ) as frais_inscription_classe,
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'reinscription'), 0),
          r.montant_frais,
          0
        ) as frais_reinscription_classe,
        r.photo_url,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'cantine'),
          0
        ) as frais_cantine_reel,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'transport'),
          0
        ) as frais_transport_reel,
        COALESCE(
          (SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'fournitures'),
          0
        ) as frais_fournitures,
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.reinscription_id = r.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_direct,
        0 as frais_paye_echeances,
        COALESCE(
          NULLIF((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id AND ep.type = 'reinscription'), 0),
          r.montant_total_plan,
          r.montant_frais,
          0
        ) as montant_total_plan,
        0 as preinscription_frais_cantine,
        0 as preinscription_frais_transport,
        0 as preinscription_frais_fournitures,
        FALSE as est_eleve,
        TRUE as est_preinscription,
        'reinscription' as type,
        r.statut,
        r.frais_statut
      FROM reinscriptions r
      WHERE r.parent_id = $1
        AND r.statut = 'en_attente'
      ORDER BY r.date_reinscription DESC
    `, [parentId]);

    // 5️⃣ Combiner tous les résultats
    const tousLesEnfants = [...elevesResult.rows, ...preinscriptionsResult.rows, ...reinscriptionsResult.rows];

    // 6️⃣ Calculer les frais pour chaque enfant
    const enfantsAvecFrais = tousLesEnfants.map((enfant: any) => {
      const fraisInscription = Number(enfant.frais_inscription_classe) || 0;
      const fraisReinscription = Number(enfant.frais_reinscription_classe) || 0;
      const montantTotalPlan = Number(enfant.montant_total_plan) || 0;

      let fraisCantine = Number(enfant.frais_cantine_reel) || 0;
      let fraisTransport = Number(enfant.frais_transport_reel) || 0;
      let fraisFournitures = Number(enfant.frais_fournitures) || 0;

      let montantBase = 0;

      if (enfant.est_preinscription) {
        montantBase = montantTotalPlan > 0 ? montantTotalPlan : fraisInscription;
      } else if (enfant.type === 'eleve') {
        if (montantTotalPlan > 0) {
          const preFraisCantine = Number(enfant.preinscription_frais_cantine) || 0;
          const preFraisTransport = Number(enfant.preinscription_frais_transport) || 0;
          const preFraisFournitures = Number(enfant.preinscription_frais_fournitures) || 0;
          const totalServicesPre = preFraisCantine + preFraisTransport + preFraisFournitures;
          const fraisClasse = fraisReinscription > 0 ? fraisReinscription : fraisInscription;
          const difference = montantTotalPlan - fraisClasse;

          if (Math.abs(difference - totalServicesPre) < 100 && totalServicesPre > 0) {
            montantBase = montantTotalPlan;
            fraisCantine = 0;
            fraisTransport = 0;
            fraisFournitures = 0;
          } else {
            montantBase = montantTotalPlan;
          }
        } else {
          montantBase = fraisInscription > 0 ? fraisInscription : fraisReinscription;
        }
      } else {
        montantBase = montantTotalPlan > 0 ? montantTotalPlan : fraisInscription;
      }

      // ⭐ TOTAL BRUT (scolarité + services)
      const totalBrut = montantBase + fraisCantine + fraisTransport + fraisFournitures;

      // ⭐⭐ CALCUL DU TOTAL PAYÉ ⭐⭐
      let totalPaye = 0;

      if (enfant.est_eleve) {
        const fraisPayeEleve = Number(enfant.frais_paye_eleve) || 0;
        const fraisPayePreinscription = Number(enfant.frais_paye_preinscription) || 0;
        const fraisPayeReinscription = Number(enfant.frais_paye_reinscription) || 0;
        const fraisPayeEcheances = Number(enfant.frais_paye_echeances) || 0;
        totalPaye = fraisPayeEleve + fraisPayePreinscription + fraisPayeReinscription + fraisPayeEcheances;
      } else {
        const fraisPayeDirect = Number(enfant.frais_paye_direct) || 0;
        const fraisPayeEcheances = Number(enfant.frais_paye_echeances) || 0;
        totalPaye = fraisPayeDirect + fraisPayeEcheances;
      }

      // ⭐⭐ RETOURNER LES DONNÉES COMPLÈTES ⭐⭐
      return {
        ...enfant,
        frais_montant: totalBrut,
        frais_paye: totalPaye,
        frais_reste: Math.max(0, totalBrut - totalPaye),
        // ⭐⭐ DÉTAILS DES FRAIS AVEC total_brut ET total ⭐⭐
        details_frais: {
          inscription: fraisInscription,
          reinscription: fraisReinscription,
          cantine: fraisCantine,
          transport: fraisTransport,
          librairie: fraisFournitures,
          scolarite: montantBase,
          total_brut: totalBrut,        // ⭐ TOTAL BRUT (scolarité + services)
          total: totalBrut,              // ⭐ Pour compatibilité, mais sera ajusté après remise
          paye: totalPaye,
          reste: Math.max(0, totalBrut - totalPaye),
          remise: 0,
          net: totalBrut
        }
      };
    });

    // ⭐⭐ INCLURE LES COMMANDES DE LIBRAIRIE VALIDÉES DU PARENT ⭐⭐
    if (enfantsAvecFrais.length > 0 && totalLibrairieParent > 0) {
      const premier = enfantsAvecFrais[0];
      premier.details_frais.librairie = (premier.details_frais.librairie || 0) + totalLibrairieParent;
      premier.details_frais.total_brut += totalLibrairieParent;
      premier.details_frais.total += totalLibrairieParent;
      premier.details_frais.net += totalLibrairieParent;
      premier.frais_montant += totalLibrairieParent;
    }

    // ⭐⭐⭐ APPLIQUER LA REMISE GLOBALE ⭐⭐⭐
    if (totalRemiseParent > 0) {
      // Calculer le total brut de tous les enfants
      const totalBrutGlobal = enfantsAvecFrais.reduce((acc, e) => acc + e.details_frais.total_brut, 0);
      
      // Appliquer la remise proportionnellement
      for (const e of enfantsAvecFrais) {
        const proportion = e.details_frais.total_brut / totalBrutGlobal;
        const remiseDeduction = Math.round(totalRemiseParent * proportion);
        
        // Mettre à jour les champs
        e.total_remise_parent = totalRemiseParent;
        e.details_frais.remise = remiseDeduction;
        e.details_frais.net = Math.max(0, e.details_frais.total_brut - remiseDeduction);
        e.details_frais.total = e.details_frais.net; // Mettre à jour total avec net après remise
        e.details_frais.reste = Math.max(0, e.details_frais.net - e.details_frais.paye);
        e.frais_reste = e.details_frais.reste;
      }
    } else {
      for (const e of enfantsAvecFrais) {
        e.total_remise_parent = 0;
        e.details_frais.remise = 0;
        e.details_frais.net = e.details_frais.total_brut;
        e.details_frais.total = e.details_frais.total_brut;
        e.details_frais.reste = Math.max(0, e.details_frais.total_brut - e.details_frais.paye);
        e.frais_reste = e.details_frais.reste;
      }
    }

    // Afficher les totaux pour débogage
    const totalBrutGlobal = enfantsAvecFrais.reduce((acc, e) => acc + e.details_frais.total_brut, 0);
    const totalNetGlobal = enfantsAvecFrais.reduce((acc, e) => acc + e.details_frais.total, 0);
    const totalPayeGlobal = enfantsAvecFrais.reduce((acc, e) => acc + e.details_frais.paye, 0);
    const totalResteGlobal = enfantsAvecFrais.reduce((acc, e) => acc + e.details_frais.reste, 0);

    console.log(`📋 Enfants trouvés: ${enfantsAvecFrais.length}`);
    console.log(`📊 Total BRUT global: ${totalBrutGlobal.toLocaleString()} GNF`);
    console.log(`📊 Total Remise: ${totalRemiseParent.toLocaleString()} GNF`);
    console.log(`📊 Total NET global: ${totalNetGlobal.toLocaleString()} GNF`);
    console.log(`📊 Total payé: ${totalPayeGlobal.toLocaleString()} GNF`);
    console.log(`📊 Solde restant: ${totalResteGlobal.toLocaleString()} GNF`);

    // ⭐⭐⭐ GARANTIR QUE LA RÉPONSE EST UN TABLEAU ⭐⭐⭐
    const result = Array.isArray(enfantsAvecFrais) ? enfantsAvecFrais : [];
    return NextResponse.json(result);

  } catch (error) {
    console.error("Erreur GET enfants:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}