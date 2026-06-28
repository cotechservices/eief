// app/api/admin/preinscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Récupérer toutes les pré-inscriptions
export async function GET(request: NextRequest) {
  console.log("=== API ADMIN GET ===");
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé - besoin SUPER_ADMIN ou COMPTABLE" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    // Si un ID spécifique est demandé, retourner les détails complets
    if (id) {
      const detailResult = await query(`
        SELECT 
          p.*,
          u.nom as parent_nom,
          u.prenom as parent_prenom,
          u.email as parent_email,
          u.telephone as parent_telephone,
          pa.profession as parent_profession,
          pa.situation_matrimoniale as mere_info,
          -- ⭐ FRAIS D'INSCRIPTION depuis la table classes
          COALESCE(
            (SELECT c.total_versement 
             FROM classes c
             WHERE LOWER(c.nom) = LOWER(p.classe)
             LIMIT 1),
            (SELECT c.frais_inscription 
             FROM classes c
             WHERE LOWER(c.nom) = LOWER(p.classe)
             LIMIT 1),
            0
          ) as frais_montant,
          -- ⭐ PLAN DE PAIEMENT depuis la table classes
          COALESCE(
            (SELECT JSON_BUILD_OBJECT(
              'id', c.id,
              'premier_versement', c.premier_versement,
              'deuxieme_versement', c.deuxieme_versement,
              'troisieme_versement', c.troisieme_versement,
              'total', c.total_versement,
              'type_inscription', COALESCE(p.type_inscription, 'inscription'),
              'niveau', c.niveau,
              'nom_classe', c.nom
            )
            FROM classes c
            WHERE LOWER(c.nom) = LOWER(p.classe)
            LIMIT 1),
            NULL
          ) as plan_paiement,
          -- Frais de cantine ANNUEL
          COALESCE(
            (SELECT cm.prix_annuel
             FROM cantine_menus cm
             ORDER BY cm.date DESC
             LIMIT 1),
            0
          ) as frais_cantine,
          -- Frais de transport
          COALESCE(
            (SELECT SUM(lt.prix_abonnement) 
             FROM lignes_transport lt),
            0
          ) as frais_transport,
          -- Frais de fourniture
          COALESCE(
            (SELECT SUM(cf.quantite * cf.prix_unitaire)
             FROM commandes_fournitures cf
             WHERE cf.preinscription_id = p.id),
            0
          ) as frais_librairie,
          -- Frais de scolarité (mensualités)
          COALESCE(
            (SELECT SUM(f.montant) 
             FROM frais_scolaires f
             WHERE f.type_frais = 'mensualite' 
               AND f.annee_scolaire_id = (
                 SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
               )),
            0
          ) as frais_scolarite,
          -- ⭐ FRAIS DÉJÀ PAYÉS depuis les échéances
          COALESCE(
            (SELECT SUM(e.montant) 
             FROM echeances_paiement e
             WHERE e.preinscription_id = p.id AND e.statut = 'paye'),
            0
          ) as frais_paye,
          -- Récupérer les fournitures commandées
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'nom', al.nom,
                'quantite', cf.quantite,
                'prix_unitaire', cf.prix_unitaire,
                'total', cf.quantite * cf.prix_unitaire
              )
            )
            FROM commandes_fournitures cf
            JOIN articles_librairie al ON cf.article_id = al.id
            WHERE cf.preinscription_id = p.id),
            '[]'::json
          ) as fournitures_commandees,
          -- Récupérer le transport sélectionné
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'nom', lt.nom,
                'prix', pt.prix,
                'horaire_matin', lt.horaire_matin,
                'horaire_soir', lt.horaire_soir
              )
            )
            FROM preinscription_transport pt
            JOIN lignes_transport lt ON pt.ligne_id = lt.id
            WHERE pt.preinscription_id = p.id),
            '[]'::json
          ) as transport_selectionne,
          -- Récupérer la cantine sélectionnée
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'nom', cm.plat || ' - ' || cm.accompagnement,
                'prix', pc.prix,
                'date', cm.date
              )
            )
            FROM preinscription_cantine pc
            JOIN cantine_menus cm ON pc.menu_id = cm.id
            WHERE pc.preinscription_id = p.id),
            '[]'::json
          ) as cantine_selectionnee,
          -- ⭐ Récupérer les échéances de paiement
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', e.id,
                'type', e.type,
                'echeance', e.echeance,
                'montant', e.montant,
                'statut', e.statut,
                'date_echeance', e.date_echeance,
                'date_paiement', e.date_paiement,
                'reference_transaction', e.reference_transaction,
                'mode_paiement', e.mode_paiement
              )
              ORDER BY 
                CASE e.echeance
                  WHEN '1er_versement' THEN 1
                  WHEN '2eme_versement' THEN 2
                  WHEN '3eme_versement' THEN 3
                END
            )
            FROM echeances_paiement e
            WHERE e.preinscription_id = p.id),
            '[]'::json
          ) as echeances_paiement
        FROM preinscriptions p
        JOIN parents pa ON p.parent_id = pa.id
        JOIN utilisateurs u ON pa.utilisateur_id = u.id
        WHERE p.id = $1
      `, [id]);

      if (detailResult.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const data = detailResult.rows[0];
      
      // Calculer les totaux
      const fraisInscription = Number(data.frais_montant) || 0;
      const fraisCantine = Number(data.frais_cantine) || 0;
      const fraisTransport = Number(data.frais_transport) || 0;
      const fraisLibrairie = Number(data.frais_librairie) || 0;
      const fraisScolarite = Number(data.frais_scolarite) || 0;
      
      const totalFrais = fraisInscription + fraisCantine + fraisTransport + fraisLibrairie + fraisScolarite;
      const fraisPaye = Number(data.frais_paye) || 0;

      // ⭐ Vérifier si toutes les échéances d'inscription sont payées
      const echeances = data.echeances_paiement || [];
      const echeancesInscription = echeances.filter((e: any) => e.type === 'inscription');
      const toutesPayees = echeancesInscription.length > 0 && echeancesInscription.every((e: any) => e.statut === 'paye');
      
      // ⭐ Mettre à jour le statut en fonction des échéances
      let fraisStatut = data.frais_statut;
      
      if (toutesPayees && fraisStatut !== 'paye') {
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = 'paye'
          WHERE id = $1
        `, [id]);
        fraisStatut = 'paye';
        console.log(`✅ Statut paiement mis à jour pour la pré-inscription ${id}: paye`);
      } else if (fraisPaye > 0 && fraisPaye < totalFrais) {
        if (fraisStatut !== 'partiel') {
          await query(`
            UPDATE preinscriptions 
            SET frais_statut = 'partiel'
            WHERE id = $1
          `, [id]);
          fraisStatut = 'partiel';
        }
        console.log(`⚠️ Paiement partiel pour la pré-inscription ${id}: ${fraisPaye}/${totalFrais}`);
      }

      return NextResponse.json({
        ...data,
        frais_statut: fraisStatut,
        est_partiel: fraisPaye > 0 && fraisPaye < totalFrais,
        fournitures_commandees: data.fournitures_commandees || [],
        transport_selectionne: data.transport_selectionne || [],
        cantine_selectionnee: data.cantine_selectionnee || [],
        echeances_paiement: echeances,
        plan_paiement: data.plan_paiement,
        details_frais: {
          inscription: fraisInscription,
          cantine: fraisCantine,
          transport: fraisTransport,
          librairie: fraisLibrairie,
          scolarite: fraisScolarite,
          total: totalFrais,
          paye: fraisPaye,
          reste: Math.max(0, totalFrais - fraisPaye)
        }
      });
    }

    // Sinon, retourner la liste des pré-inscriptions
    let sql = `
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.date_naissance,
        p.lieu_naissance,
        p.sexe,
        p.niveau,
        p.classe,
        p.statut,
        p.date_preinscription,
        p.observations,
        p.frais_montant,
        p.frais_statut,
        p.frais_mode_paiement,
        p.frais_reference,
        p.acte_naissance_url,
        p.photo_url,
        p.bulletin_url,
        p.type_inscription,
        p.montant_total_plan,
        p.montant_restant_plan,
        u.nom as parent_nom,
        u.prenom as parent_prenom,
        u.email as parent_email,
        u.telephone as parent_telephone,
        pa.profession as parent_profession,
        pa.situation_matrimoniale as mere_info,
        -- ⭐ Calculer le statut de paiement basé sur les échéances
        CASE 
          WHEN p.frais_statut = 'paye' THEN 'paye'
          WHEN EXISTS (
            SELECT 1 FROM echeances_paiement e 
            WHERE e.preinscription_id = p.id 
              AND e.type = 'inscription' 
              AND e.statut = 'paye'
          ) AND EXISTS (
            SELECT 1 FROM echeances_paiement e 
            WHERE e.preinscription_id = p.id 
              AND e.type = 'inscription' 
              AND e.statut != 'paye'
          ) THEN 'partiel'
          WHEN EXISTS (
            SELECT 1 FROM echeances_paiement e 
            WHERE e.preinscription_id = p.id 
              AND e.type = 'inscription'
          ) AND NOT EXISTS (
            SELECT 1 FROM echeances_paiement e 
            WHERE e.preinscription_id = p.id 
              AND e.type = 'inscription' 
              AND e.statut != 'paye'
          ) THEN 'paye'
          WHEN p.frais_statut = 'paye' THEN 'paye'
          ELSE 'non_paye'
        END as frais_statut_calcule,
        -- ⭐ Calculer le montant payé pour la liste
        COALESCE(
          (SELECT SUM(e.montant) 
           FROM echeances_paiement e
           WHERE e.preinscription_id = p.id AND e.statut = 'paye'),
          0
        ) as frais_paye_calcule
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND p.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (p.enfant_nom ILIKE $${params.length + 1} OR p.enfant_prenom ILIKE $${params.length + 1} OR p.numero_dossier ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY p.date_preinscription DESC`;

    const result = await query(sql, params);
    
    const rows = result.rows.map(row => ({
      ...row,
      frais_statut: row.frais_statut_calcule || row.frais_statut,
      frais_paye: Number(row.frais_paye_calcule) || 0,
      frais_montant: Number(row.montant_total_plan) || Number(row.frais_montant) || 0
    }));
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le statut (avec création d'inscription)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    if (!id || !statut) {
      return NextResponse.json(
        { error: "ID et statut requis" },
        { status: 400 }
      );
    }

    // Vérifier le paiement si on essaie de valider
    if (statut === "valide") {
      // ⭐ Vérifier si au moins une échéance d'inscription est payée
      const echeancesResult = await query(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN statut = 'paye' THEN 1 ELSE 0 END) as payees
        FROM echeances_paiement 
        WHERE preinscription_id = $1 AND type = 'inscription'
      `, [id]);
      
      const totalEcheances = Number(echeancesResult.rows[0]?.total) || 0;
      const payeesEcheances = Number(echeancesResult.rows[0]?.payees) || 0;
      
      // ⭐ Au moins une échéance payée pour valider
      if (totalEcheances > 0 && payeesEcheances === 0) {
        return NextResponse.json(
          { error: "❌ Au moins un versement doit être effectué avant la validation" },
          { status: 400 }
        );
      }
      
      // Vérifier le paiement unique (cas sans échéances)
      const preinscription = await query(
        "SELECT frais_statut, frais_montant, classe, frais_mode_paiement, frais_reference FROM preinscriptions WHERE id = $1",
        [id]
      );
      
      // Si pas d'échéances, vérifier que le paiement a été effectué
      if (totalEcheances === 0 && preinscription.rows[0]?.frais_statut !== "paye" && preinscription.rows[0]?.frais_statut !== "partiel") {
        return NextResponse.json(
          { error: "❌ Le paiement des frais est requis avant la validation" },
          { status: 400 }
        );
      }

      // Récupérer toutes les infos de la pré-inscription
      const preinsData = await query(`
        SELECT 
          p.*,
          pa.id as parent_id,
          u.id as parent_utilisateur_id,
          u.email as parent_email,
          u.nom as parent_nom,
          u.prenom as parent_prenom
        FROM preinscriptions p
        JOIN parents pa ON p.parent_id = pa.id
        JOIN utilisateurs u ON pa.utilisateur_id = u.id
        WHERE p.id = $1
      `, [id]);

      if (preinsData.rows.length === 0) {
        return NextResponse.json(
          { error: "Pré-inscription non trouvée" },
          { status: 404 }
        );
      }

      const data = preinsData.rows[0];

      try {
        // 1. Récupérer l'ID de la classe correspondante
        let classeId = null;
        let montantFrais = data.frais_montant || 0;
        
        if (data.classe) {
          const classeResult = await query(
            "SELECT id, frais_inscription, total_versement FROM classes WHERE LOWER(nom) = LOWER($1)",
            [data.classe]
          );
          if (classeResult.rows.length > 0) {
            classeId = classeResult.rows[0].id;
            if (classeResult.rows[0].total_versement) {
              montantFrais = classeResult.rows[0].total_versement;
            } else if (classeResult.rows[0].frais_inscription) {
              montantFrais = classeResult.rows[0].frais_inscription;
            }
          }
        }

        // 2. Créer l'utilisateur élève
        const emailEleve = `${data.enfant_prenom.toLowerCase()}.${data.enfant_nom.toLowerCase()}${Math.floor(Math.random() * 1000)}@eief.com`;
        const motDePasseTemp = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(motDePasseTemp, 10);

        const newEleveUser = await query(`
          INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
          VALUES ($1, $2, $3, $4, 'ELEVE', true)
          RETURNING id
        `, [emailEleve, hashedPassword, data.enfant_prenom, data.enfant_nom]);

        // 3. Créer la fiche élève
        const matricule = `ELE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const newEleve = await query(`
          INSERT INTO eleves (utilisateur_id, matricule, date_naissance, lieu_naissance, sexe, classe_id, est_inscrit)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          RETURNING id
        `, [newEleveUser.rows[0].id, matricule, data.date_naissance, data.lieu_naissance, data.sexe, classeId]);

        // 4. Lier l'élève au parent
        await query(`
          INSERT INTO lien_parent_eleve (parent_id, eleve_id)
          VALUES ($1, $2)
        `, [data.parent_id, newEleve.rows[0].id]);

        // 5. Récupérer l'année scolaire active
        const anneeScolaire = await query(`
          SELECT id FROM annees_scolaires WHERE est_active = true
        `);

        // 6. Créer l'inscription
        await query(`
          INSERT INTO inscriptions (preinscription_id, eleve_id, parent_id, numero_matricule, annee_scolaire_id, statut)
          VALUES ($1, $2, $3, $4, $5, 'active')
        `, [id, newEleve.rows[0].id, data.parent_id, matricule, anneeScolaire.rows[0]?.id || null]);

        // 7. ⭐ GÉRER LES PAIEMENTS UNIQUEMENT SI PAS DÉJÀ PAYÉS VIA ÉCHÉANCES
        const echeancesPayees = await query(`
          SELECT SUM(montant) as total_paye
          FROM echeances_paiement 
          WHERE preinscription_id = $1 AND statut = 'paye'
        `, [id]);
        
        const totalPayeEcheances = Number(echeancesPayees.rows[0]?.total_paye) || 0;
        
        // ⭐ On ne crée un paiement que s'il n'y a pas d'échéances
        if (totalEcheances === 0) {
          let modePaiementValide = 'especes';
          if (data.frais_mode_paiement === 'orange_money') {
            modePaiementValide = 'mobile_money';
          } else if (data.frais_mode_paiement === 'carte') {
            modePaiementValide = 'carte';
          } else if (data.frais_mode_paiement === 'especes') {
            modePaiementValide = 'especes';
          }

          const fraisInfo = await query(
            `SELECT frais_statut FROM preinscriptions WHERE id = $1`,
            [id]
          );
          const fraisStatut = fraisInfo.rows[0]?.frais_statut;

          if (fraisStatut !== 'paye' && fraisStatut !== 'partiel') {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            await query(`
              INSERT INTO paiements (
                eleve_id,
                preinscription_id,
                montant,
                type_frais,
                mode_paiement,
                reference_transaction,
                statut,
                date_paiement,
                mois,
                annee,
                saisie_par
              )
              VALUES ($1, $2, $3, $4, $5, $6, 'valide', NOW(), $7, $8, $9)
            `, [
              newEleve.rows[0].id,
              id,
              montantFrais,
              'inscription',
              modePaiementValide,
              data.frais_reference || null,
              currentMonth,
              currentYear,
              (session.user as any).id
            ]);
          }
        } else {
          console.log(`✅ Paiements déjà effectués via échéances pour la pré-inscription ${id}: ${totalPayeEcheances} GNF`);
        }

        console.log(`✅ Élève créé: ${data.enfant_prenom} ${data.enfant_nom} (Matricule: ${matricule})`);

      } catch (createError) {
        console.error("Erreur lors de la création de l'élève:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la création de l'élève: " + (createError as Error).message },
          { status: 500 }
        );
      }
    }

    const result = await query(
      `UPDATE preinscriptions 
       SET statut = $1, observations = $2, traite_par = $3, date_traitement = NOW()
       WHERE id = $4 RETURNING *`,
      [statut, observations || null, (session.user as any).id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pré-inscription non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: statut === "valide" ? "✅ Inscription validée" : "❌ Pré-inscription rejetée",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// ⭐ DELETE - Supprimer une pré-inscription (même si validée) - NE SUPPRIME PAS LE PARENT
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // ⭐ Vérifier si la pré-inscription existe
    const checkResult = await query(`
      SELECT 
        p.id, 
        p.statut,
        p.parent_id,
        -- Récupérer l'ID de l'élève si la pré-inscription a été validée
        (SELECT e.id FROM eleves e 
         JOIN inscriptions i ON i.eleve_id = e.id 
         WHERE i.preinscription_id = p.id 
         LIMIT 1) as eleve_id
      FROM preinscriptions p
      WHERE p.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const preinscription = checkResult.rows[0];
    const eleveId = preinscription.eleve_id;

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // ⭐ 1. Si la pré-inscription est validée et a un élève associé, supprimer l'élève et ses données
      if (preinscription.statut === 'valide' && eleveId) {
        console.log(`🗑️ Suppression de l'élève ${eleveId} associé à la pré-inscription ${id}`);
        
        // Supprimer l'utilisateur élève
        const eleveInfo = await query(`
          SELECT utilisateur_id FROM eleves WHERE id = $1
        `, [eleveId]);
        
        if (eleveInfo.rows.length > 0 && eleveInfo.rows[0].utilisateur_id) {
          // Supprimer les sessions de l'utilisateur
          await query(`DELETE FROM sessions WHERE utilisateur_id = $1`, [eleveInfo.rows[0].utilisateur_id]);
          // Supprimer l'utilisateur
          await query(`DELETE FROM utilisateurs WHERE id = $1`, [eleveInfo.rows[0].utilisateur_id]);
        }

        // Supprimer les données liées à l'élève
        await query(`DELETE FROM lien_parent_eleve WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM paiements WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM presences WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM notes WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM inscriptions WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM soumissions_devoirs WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM emprunts_bibliotheque WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM reservations_cantine WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM transactions_cantine WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM inscriptions_transport WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM inscriptions_cantine WHERE eleve_id = $1`, [eleveId]);
        await query(`DELETE FROM ventes_librairie WHERE eleve_id = $1`, [eleveId]);
        
        // Supprimer l'élève
        await query(`DELETE FROM eleves WHERE id = $1`, [eleveId]);
        
        console.log(`✅ Élève ${eleveId} supprimé`);
      }

      // ⭐ 2. Supprimer toutes les données associées à la pré-inscription
      await query(`DELETE FROM paiements WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM echeances_paiement WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM inscriptions WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM commandes_fournitures WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM preinscription_transport WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM preinscription_cantine WHERE preinscription_id = $1`, [id]);
      
      // ⭐ 3. Supprimer la pré-inscription
      await query(`DELETE FROM preinscriptions WHERE id = $1`, [id]);

      // ⭐ 4. NE PAS SUPPRIMER LE PARENT - On garde le parent même s'il n'a plus d'enfants
      // Le parent peut avoir d'autres pré-inscriptions ou inscriptions
      // On ne supprime donc pas la ligne dans la table parents ni l'utilisateur associé

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: preinscription.statut === 'valide' 
          ? "Pré-inscription et élève associé supprimés avec succès (parent conservé)" 
          : "Pré-inscription supprimée avec succès (parent conservé)" 
      });
    } catch (error) {
      await query('ROLLBACK');
      console.error("Erreur dans la transaction:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression: " + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}