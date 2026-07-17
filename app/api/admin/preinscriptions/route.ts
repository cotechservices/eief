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
          -- FRAIS D'INSCRIPTION depuis la table classes
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
          -- PLAN DE PAIEMENT depuis la table classes
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
          -- Récupérer les échéances de paiement (pour affichage uniquement)
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

      // ===================== VÉRIFIER LES SERVICES SÉLECTIONNÉS =====================

      // TRANSPORT - Vérifier si sélectionné
      const transportResult = await query(`
        SELECT COALESCE(SUM(pt.prix), 0) as total
        FROM preinscription_transport pt
        WHERE pt.preinscription_id = $1
      `, [id]);
      const transportSelected = Number(transportResult.rows[0]?.total) || 0;

      // CANTINE - Vérifier si sélectionnée
      let cantineSelected = 0;
      const cantineExists = await query(`
        SELECT COUNT(*) as count FROM preinscription_cantine WHERE preinscription_id = $1
      `, [id]);

      if (Number(cantineExists.rows[0]?.count) > 0) {
        const cantinePrixResult = await query(`
          SELECT COALESCE(cm.prix_annuel, 0) as prix_annuel
          FROM preinscription_cantine pc
          JOIN cantine_menus cm ON pc.menu_id = cm.id
          WHERE pc.preinscription_id = $1
        `, [id]);

        if (cantinePrixResult.rows.length > 0) {
          cantineSelected = Number(cantinePrixResult.rows[0]?.prix_annuel) || 0;
        }

        if (cantineSelected === 0) {
          const sumResult = await query(`
            SELECT COALESCE(SUM(pc.prix), 0) as total
            FROM preinscription_cantine pc
            WHERE pc.preinscription_id = $1
          `, [id]);
          cantineSelected = Number(sumResult.rows[0]?.total) || 0;
        }

        if (cantineSelected === 0) {
          const defaultPrix = await query(`
            SELECT COALESCE(prix_annuel, 0) as prix_annuel
            FROM cantine_menus
            ORDER BY date DESC
            LIMIT 1
          `, []);
          cantineSelected = Number(defaultPrix.rows[0]?.prix_annuel) || 0;
        }
      }

      // FOURNITURES - Vérifier si sélectionnées
      const fournituresResult = await query(`
        SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total
        FROM commandes_fournitures cf
        WHERE cf.preinscription_id = $1
      `, [id]);
      const fournituresSelected = Number(fournituresResult.rows[0]?.total) || 0;

      // ⭐ Calculer le total des frais
      const fraisInscription = Number(data.frais_montant) || 0;
      const totalFrais = fraisInscription + transportSelected + cantineSelected + fournituresSelected;

      // ⭐ UNIQUE SOURCE : Récupérer les paiements UNIQUEMENT depuis la table paiements
      const paiementsResult = await query(`
        SELECT 
          COALESCE(SUM(montant), 0) as total_paye
        FROM paiements
        WHERE preinscription_id = $1 AND statut = 'valide'
      `, [id]);
      
      const totalPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

      // ⭐ Déterminer le statut de paiement UNIQUEMENT à partir des paiements
      let fraisStatut = 'non_paye';
      
      if (totalPaye >= totalFrais && totalFrais > 0) {
        fraisStatut = 'paye';
      } else if (totalPaye > 0 && totalPaye < totalFrais) {
        fraisStatut = 'partiel';
      } else if (totalFrais === 0) {
        fraisStatut = 'paye';
      }

      // ⭐ Mettre à jour le statut et le restant dans la base si différent
      const restant = Math.max(0, totalFrais - totalPaye);
      if (fraisStatut !== data.frais_statut || restant !== Number(data.montant_restant_plan)) {
        await query(`
          UPDATE preinscriptions 
          SET frais_statut = $1,
              montant_restant_plan = $2
          WHERE id = $3
        `, [fraisStatut, restant, id]);
        console.log(`✅ Statut mis à jour: ${fraisStatut}, restant: ${restant} pour la pré-inscription ${id}`);
      }

      // ⭐ Récupérer les échéances pour affichage
      const echeances = data.echeances_paiement || [];

      console.log("📊 Détails des frais calculés (UNIQUEMENT paiements):", {
        inscription: fraisInscription,
        transport: transportSelected,
        cantine: cantineSelected,
        fournitures: fournituresSelected,
        total: totalFrais,
        total_paye: totalPaye,
        reste: restant,
        statut: fraisStatut
      });

      return NextResponse.json({
        ...data,
        frais_statut: fraisStatut,
        est_partiel: totalPaye > 0 && totalPaye < totalFrais,
        fournitures_commandees: data.fournitures_commandees || [],
        transport_selectionne: data.transport_selectionne || [],
        cantine_selectionnee: data.cantine_selectionnee || [],
        echeances_paiement: echeances,
        plan_paiement: data.plan_paiement,
        transport_montant: transportSelected,
        cantine_montant: cantineSelected,
        fournitures_montant: fournituresSelected,
        scolarite_montant: 0,
        montant_total: totalFrais,
        details_frais: {
          inscription: fraisInscription,
          cantine: cantineSelected,
          transport: transportSelected,
          librairie: fournituresSelected,
          scolarite: 0,
          total: totalFrais,
          paye: totalPaye,
          reste: restant
        }
      });
    }

    // ============================================================
    // LISTE DES PRÉ-INSCRIPTIONS
    // ============================================================
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
        -- ⭐ Calculer le total des frais
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
        ) as frais_inscription_calcule,
        -- ⭐ UNIQUE SOURCE : Calculer le total payé via paiements UNIQUEMENT
        COALESCE(
          (SELECT SUM(montant) 
           FROM paiements 
           WHERE preinscription_id = p.id AND statut = 'valide'),
          0
        ) as frais_paye_direct
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

    // ⭐ Mapper les résultats avec le bon statut UNIQUEMENT à partir des paiements
    const rows = result.rows.map(row => {
      const fraisInscription = Number(row.frais_inscription_calcule) || 0;
      const totalPaye = Number(row.frais_paye_direct) || 0;
      
      // ⭐ Déterminer le statut final UNIQUEMENT à partir des paiements
      let finalStatut = 'non_paye';
      
      if (totalPaye >= fraisInscription && fraisInscription > 0) {
        finalStatut = 'paye';
      } else if (totalPaye > 0 && totalPaye < fraisInscription) {
        finalStatut = 'partiel';
      } else if (fraisInscription === 0) {
        finalStatut = 'paye';
      }

      return {
        ...row,
        frais_statut: finalStatut,
        frais_paye: totalPaye,
        frais_montant: fraisInscription
      };
    });

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
      // ⭐ Vérifier le statut de paiement UNIQUEMENT via paiements
      const checkResult = await query(`
        SELECT 
          p.frais_statut,
          p.frais_montant,
          p.classe,
          COALESCE(
            (SELECT SUM(montant) 
             FROM paiements 
             WHERE preinscription_id = p.id AND statut = 'valide'),
            0
          ) as total_paye
        FROM preinscriptions p
        WHERE p.id = $1
      `, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const check = checkResult.rows[0];
      const totalPaye = Number(check.total_paye) || 0;
      const fraisTotal = Number(check.frais_montant) || 0;

      // ⭐ Vérifier si au moins un paiement a été effectué
      if (totalPaye === 0 && fraisTotal > 0) {
        return NextResponse.json(
          { error: "❌ Aucun paiement n'a été effectué. Veuillez d'abord enregistrer le paiement." },
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

// DELETE - Supprimer une pré-inscription
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

    const checkResult = await query(`
      SELECT 
        p.id, 
        p.statut,
        p.parent_id,
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

    await query('BEGIN');

    try {
      if (preinscription.statut === 'valide' && eleveId) {
        console.log(`🗑️ Suppression de l'élève ${eleveId} associé à la pré-inscription ${id}`);

        const eleveInfo = await query(`
          SELECT utilisateur_id FROM eleves WHERE id = $1
        `, [eleveId]);

        if (eleveInfo.rows.length > 0 && eleveInfo.rows[0].utilisateur_id) {
          await query(`DELETE FROM sessions WHERE utilisateur_id = $1`, [eleveInfo.rows[0].utilisateur_id]);
          await query(`DELETE FROM utilisateurs WHERE id = $1`, [eleveInfo.rows[0].utilisateur_id]);
        }

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
        await query(`DELETE FROM eleves WHERE id = $1`, [eleveId]);

        console.log(`✅ Élève ${eleveId} supprimé`);
      }

      await query(`DELETE FROM paiements WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM echeances_paiement WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM inscriptions WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM commandes_fournitures WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM preinscription_transport WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM preinscription_cantine WHERE preinscription_id = $1`, [id]);
      await query(`DELETE FROM preinscriptions WHERE id = $1`, [id]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: preinscription.statut === 'valide'
          ? "Pré-inscription et élève associé supprimés avec succès"
          : "Pré-inscription supprimée avec succès"
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