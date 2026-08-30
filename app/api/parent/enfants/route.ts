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
        -- ⭐ Frais optionnels RÉELS (uniquement si l'élève y est inscrit)
        COALESCE(
          (SELECT cm.prix_annuel
           FROM inscriptions_cantine ic
           JOIN cantine_menus cm ON cm.id = (
             SELECT id FROM cantine_menus ORDER BY date DESC LIMIT 1
           )
           WHERE ic.eleve_id = e.id AND ic.est_actif = true
           LIMIT 1),
          0
        ) as frais_cantine_reel,
        COALESCE(
          (SELECT lt.prix_abonnement
           FROM inscriptions_transport it
           JOIN lignes_transport lt ON it.ligne_id = lt.id
           WHERE it.eleve_id = e.id AND it.est_actif = true
           LIMIT 1),
          0
        ) as frais_transport_reel,
        -- ⭐ FOURNITURES (pour les élèves, via la pré-inscription)
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           JOIN preinscriptions p ON cf.preinscription_id = p.id
           JOIN inscriptions i ON i.preinscription_id = p.id
           WHERE i.eleve_id = e.id),
          0
        ) as frais_fournitures,
        -- ⭐ PAIEMENTS DIRECTS (eleve_id)
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.eleve_id = e.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_eleve,
        -- ⭐ PAIEMENTS VIA PRÉ-INSCRIPTION
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
        -- ⭐ PAIEMENTS VIA RÉINSCRIPTION
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.reinscription_id IN (
             SELECT id FROM reinscriptions WHERE eleve_id = e.id
           )
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_reinscription,
        -- ⭐ ÉCHÉANCES PAYÉES VIA PRÉ-INSCRIPTION
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
        -- ⭐ PRÉ-INSCRIPTION ID pour récupérer le montant total plan
        (SELECT i.preinscription_id 
         FROM inscriptions i 
         WHERE i.eleve_id = e.id
         LIMIT 1) as preinscription_id,
        (SELECT p.montant_total_plan 
         FROM preinscriptions p
         JOIN inscriptions i ON i.preinscription_id = p.id
         WHERE i.eleve_id = e.id
         LIMIT 1) as montant_total_plan,
        -- ⭐⭐⭐ CORRECTION : Utiliser 0 car les colonnes n'existent pas dans preinscriptions ⭐⭐⭐
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
        p.frais_montant as frais_inscription_classe,
        0 as frais_reinscription_classe,
        p.photo_url,
        -- ⭐ Frais optionnels pour pré-inscriptions
        0 as frais_cantine_reel,
        0 as frais_transport_reel,
        -- ⭐ FOURNITURES pour les pré-inscriptions
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           WHERE cf.preinscription_id = p.id),
          0
        ) as frais_fournitures,
        -- ⭐ Paiements pour les pré-inscriptions
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.preinscription_id = p.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_direct,
        COALESCE(
          (SELECT SUM(eche.montant) 
           FROM echeances_paiement eche
           WHERE eche.preinscription_id = p.id
           AND eche.statut = 'paye'),
          0
        ) as frais_paye_echeances,
        p.montant_total_plan,
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
        r.montant_frais as frais_inscription_classe,
        r.montant_frais as frais_reinscription_classe,
        r.photo_url,
        0 as frais_cantine_reel,
        0 as frais_transport_reel,
        0 as frais_fournitures,
        -- ⭐ Paiements pour les réinscriptions
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.reinscription_id = r.id
           AND pai.statut = 'valide'),
          0
        ) as frais_paye_direct,
        COALESCE(
          (SELECT SUM(eche.montant) 
           FROM echeances_paiement eche
           WHERE eche.reinscription_id = r.id
           AND eche.statut = 'paye'),
          0
        ) as frais_paye_echeances,
        r.montant_total_plan,
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
      // Récupérer tous les montants
      const fraisInscription = Number(enfant.frais_inscription_classe) || 0;
      const fraisReinscription = Number(enfant.frais_reinscription_classe) || 0;
      const montantTotalPlan = Number(enfant.montant_total_plan) || 0;

      // ⭐ Services sélectionnés
      let fraisCantine = Number(enfant.frais_cantine_reel) || 0;
      let fraisTransport = Number(enfant.frais_transport_reel) || 0;
      let fraisFournitures = Number(enfant.frais_fournitures) || 0;

      // ⭐⭐ LOGIQUE PRINCIPALE : Déterminer le montant de base ⭐⭐
      let montantBase = 0;

      if (enfant.est_preinscription) {
        // Pour les pré-inscriptions : utiliser montant_total_plan ou frais_inscription
        montantBase = montantTotalPlan > 0 ? montantTotalPlan : fraisInscription;
      } else if (enfant.type === 'eleve') {
        // Pour les élèves : vérifier si les services sont déjà inclus
        if (montantTotalPlan > 0) {
          // Récupérer les frais de la pré-inscription (maintenant toujours 0)
          const preFraisCantine = Number(enfant.preinscription_frais_cantine) || 0;
          const preFraisTransport = Number(enfant.preinscription_frais_transport) || 0;
          const preFraisFournitures = Number(enfant.preinscription_frais_fournitures) || 0;

          // Calculer le total des services dans la pré-inscription
          const totalServicesPre = preFraisCantine + preFraisTransport + preFraisFournitures;

          // Calculer le montant de la classe
          const fraisClasse = fraisReinscription > 0 ? fraisReinscription : fraisInscription;

          // Vérifier si montant_total_plan = fraisClasse + services
          const difference = montantTotalPlan - fraisClasse;

          console.log(`=== VÉRIFICATION SERVICES INCLUS pour ${enfant.id} ===`);
          console.log(`fraisClasse: ${fraisClasse}`);
          console.log(`montantTotalPlan: ${montantTotalPlan}`);
          console.log(`difference: ${difference}`);
          console.log(`totalServicesPre: ${totalServicesPre}`);
          console.log(`fraisCantine_reel: ${fraisCantine}`);
          console.log(`fraisTransport_reel: ${fraisTransport}`);
          console.log(`fraisFournitures: ${fraisFournitures}`);

          // ⭐ Si la différence correspond aux services de la pré-inscription
          // Alors les services sont DÉJÀ inclus dans montant_total_plan
          if (Math.abs(difference - totalServicesPre) < 100 && totalServicesPre > 0) {
            console.log(`✅ Services déjà inclus dans montant_total_plan`);
            // ⭐ NE PAS AJOUTER les services séparément
            montantBase = montantTotalPlan;
            fraisCantine = 0;
            fraisTransport = 0;
            fraisFournitures = 0;
          } else {
            // Les services ne sont pas inclus, les ajouter séparément
            console.log(`❌ Services NON inclus dans montant_total_plan`);
            montantBase = montantTotalPlan;
            // On garde fraisCantine, fraisTransport, fraisFournitures
          }
        } else {
          // Pas de montant_total_plan, utiliser la classe
          montantBase = fraisReinscription > 0 ? fraisReinscription : fraisInscription;
        }
      } else {
        // Réinscriptions
        montantBase = montantTotalPlan > 0 ? montantTotalPlan : fraisInscription;
      }

      // ⭐ TOTAL = montantBase + services (si non inclus)
      const montantTotal = montantBase + fraisCantine + fraisTransport + fraisFournitures;

      // ⭐⭐ CALCUL DU TOTAL PAYÉ ⭐⭐
      let totalPaye = 0;

      if (enfant.est_eleve) {
        // Pour les élèves : additionner toutes les sources
        const fraisPayeEleve = Number(enfant.frais_paye_eleve) || 0;
        const fraisPayePreinscription = Number(enfant.frais_paye_preinscription) || 0;
        const fraisPayeReinscription = Number(enfant.frais_paye_reinscription) || 0;
        const fraisPayeEcheances = Number(enfant.frais_paye_echeances) || 0;

        totalPaye = fraisPayeEleve + fraisPayePreinscription + fraisPayeReinscription + fraisPayeEcheances;
      } else {
        // Pour les pré-inscriptions et réinscriptions
        const fraisPayeDirect = Number(enfant.frais_paye_direct) || 0;
        const fraisPayeEcheances = Number(enfant.frais_paye_echeances) || 0;
        totalPaye = fraisPayeDirect + fraisPayeEcheances;
      }

      let reste = Math.max(0, montantTotal - totalPaye);

      return {
        ...enfant,
        frais_montant: montantTotal,
        frais_paye: totalPaye,
        frais_reste: reste,
        details_frais: {
          inscription: fraisInscription,
          reinscription: fraisReinscription,
          cantine: fraisCantine,
          transport: fraisTransport,
          librairie: fraisFournitures,
          scolarite: montantBase,
          total: montantTotal,
          paye: totalPaye,
          reste: reste
        }
      };
    });

    // Appliquer la remise globale du parent sur le total des frais pour chaque enfant
    if (totalRemiseParent > 0) {
      let remiseADeduire = totalRemiseParent;
      for (const e of enfantsAvecFrais) {
        e.total_remise_parent = totalRemiseParent;
        const deduction = Math.min(e.details_frais.total, remiseADeduire);
        e.details_frais.remise = (e.details_frais.remise || 0) + deduction;
        e.details_frais.net = Math.max(0, e.details_frais.total - e.details_frais.remise);
        e.details_frais.reste = Math.max(0, e.details_frais.net - e.details_frais.paye);
        e.frais_reste = e.details_frais.reste;
        if (remiseADeduire > 0) {
          remiseADeduire -= deduction;
        }
      }
    } else {
      for (const e of enfantsAvecFrais) {
        e.total_remise_parent = 0;
        e.details_frais.remise = 0;
        e.details_frais.net = e.details_frais.total;
        e.details_frais.reste = Math.max(0, e.details_frais.total - e.details_frais.paye);
        e.frais_reste = e.details_frais.reste;
      }
    }

    // Afficher les totaux
    const totalAPayer = enfantsAvecFrais.reduce((acc, e) => acc + e.frais_montant, 0);
    const totalPaye = enfantsAvecFrais.reduce((acc, e) => acc + e.frais_paye, 0);
    const totalReste = enfantsAvecFrais.reduce((acc, e) => acc + e.frais_reste, 0);

    console.log(`📋 Enfants trouvés: ${enfantsAvecFrais.length}`);
    console.log(`📊 Total à payer: ${totalAPayer.toLocaleString()} GNF`);
    console.log(`📊 Total payé: ${totalPaye.toLocaleString()} GNF`);
    console.log(`📊 Solde restant: ${totalReste.toLocaleString()} GNF`);

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