// app/api/admin/reinscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les demandes de réinscription
export async function GET(request: NextRequest) {
  console.log("=== API ADMIN REINSCRIPTIONS GET ===");

  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    // ⭐ Si un ID spécifique est demandé, retourner les détails complets
    if (id) {
      const detailResult = await query(`
        SELECT 
          r.*,
          -- ⭐ PLAN DE PAIEMENT depuis la table classes
          COALESCE(
            (SELECT JSON_BUILD_OBJECT(
              'id', c.id,
              'premier_versement', c.reinscription_premier_versement,
              'deuxieme_versement', c.reinscription_deuxieme_versement,
              'troisieme_versement', c.reinscription_troisieme_versement,
              'total', c.reinscription_total_versement,
              'type_inscription', 'reinscription',
              'niveau', c.niveau,
              'nom_classe', c.nom
            )
            FROM classes c
            WHERE c.id = r.classe_id
            LIMIT 1),
            NULL
          ) as plan_paiement,
          -- ⭐ Récupérer les échéances de paiement (pour affichage uniquement)
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
                  WHEN 'transport' THEN 4
                  WHEN 'cantine' THEN 5
                  WHEN 'fournitures' THEN 6
                  ELSE 7
                END
            )
            FROM echeances_paiement e
            WHERE e.reinscription_id = r.id),
            '[]'::json
          ) as echeances_paiement,
          -- ⭐ Récupérer les services optionnels depuis les échéances
          COALESCE(
            (SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'type', e.type,
                'echeance', e.echeance,
                'montant', e.montant,
                'statut', e.statut
              )
            )
            FROM echeances_paiement e
            WHERE e.reinscription_id = r.id AND e.type IN ('transport', 'cantine', 'fournitures')),
            '[]'::json
          ) as services_optionnels
        FROM reinscriptions r
        WHERE r.id = $1
      `, [id]);

      if (detailResult.rows.length === 0) {
        return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
      }

      const data = detailResult.rows[0];
      const echeances = data.echeances_paiement || [];
      const servicesOptionnels = data.services_optionnels || [];

      // ⭐ Calculer les totaux des services
      let totalTransport = 0;
      let totalCantine = 0;
      let totalFournitures = 0;

      for (const service of servicesOptionnels) {
        if (service.type === 'transport') totalTransport += Number(service.montant) || 0;
        if (service.type === 'cantine') totalCantine += Number(service.montant) || 0;
        if (service.type === 'fournitures') totalFournitures += Number(service.montant) || 0;
      }

      // ⭐ UNIQUE SOURCE : Calculer le total payé UNIQUEMENT depuis paiements
      const paiementsResult = await query(`
        SELECT COALESCE(SUM(montant), 0) as total_paye
        FROM paiements
        WHERE reinscription_id = $1 AND statut = 'valide'
      `, [id]);
      const totalPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

      // ⭐ Calculer le montant total
      const montantFrais = Number(data.montant_frais) || 0;
      const totalServices = totalTransport + totalCantine + totalFournitures;
      const totalGeneral = montantFrais + totalServices;
      const reste = Math.max(0, totalGeneral - totalPaye);

      // ⭐ Déterminer le statut de paiement UNIQUEMENT à partir des paiements
      let fraisStatut = 'non_paye';
      if (totalGeneral > 0) {
        if (reste === 0) {
          fraisStatut = 'paye';
        } else if (totalPaye > 0) {
          fraisStatut = 'partiel';
        }
      }

      // ⭐ Mettre à jour le statut et le restant dans la base si différent
      if (fraisStatut !== data.frais_statut || reste !== Number(data.montant_restant_plan)) {
        await query(`
          UPDATE reinscriptions 
          SET frais_statut = $1,
              montant_restant_plan = $2
          WHERE id = $3
        `, [fraisStatut, reste, id]);
        console.log(`✅ Statut mis à jour: ${fraisStatut}, restant: ${reste} pour la réinscription ${id}`);
      }

      console.log("📊 Détails des frais pour réinscription (UNIQUEMENT paiements):", {
        inscription: montantFrais,
        transport: totalTransport,
        cantine: totalCantine,
        fournitures: totalFournitures,
        total: totalGeneral,
        paye: totalPaye,
        reste: reste,
        statut: fraisStatut
      });

      return NextResponse.json({
        ...data,
        frais_statut: fraisStatut,
        echeances_paiement: echeances,
        services_optionnels: servicesOptionnels,
        plan_paiement: data.plan_paiement,
        transport_montant: totalTransport,
        cantine_montant: totalCantine,
        fournitures_montant: totalFournitures,
        montant_total: totalGeneral,
        details_frais: {
          inscription: montantFrais,
          cantine: totalCantine,
          transport: totalTransport,
          librairie: totalFournitures,
          scolarite: 0,
          total: totalGeneral,
          paye: totalPaye,
          reste: reste
        }
      });
    }

    // ⭐ Sinon, retourner la liste des réinscriptions
    let sql = `
      SELECT 
        r.id,
        r.numero_dossier,
        r.date_reinscription,
        r.statut,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.frais_reference,
        r.frais_date_paiement,
        r.acte_naissance_url,
        r.photo_url,
        r.bulletin_url,
        r.enfant_nom,
        r.enfant_prenom,
        r.date_naissance,
        r.lieu_naissance,
        r.sexe,
        r.niveau,
        r.classe_nom as classe,
        r.parent_nom,
        r.parent_prenom,
        r.parent_email,
        r.parent_telephone,
        r.montant_total_plan,
        r.montant_restant_plan,
        -- ⭐ UNIQUE SOURCE : Calculer le total payé via paiements UNIQUEMENT
        COALESCE(
          (SELECT SUM(montant) 
           FROM paiements 
           WHERE reinscription_id = r.id AND statut = 'valide'),
          0
        ) as frais_paye_calcule
      FROM reinscriptions r
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND r.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (r.enfant_nom ILIKE $${params.length + 1} OR r.enfant_prenom ILIKE $${params.length + 1} OR r.numero_dossier ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY r.date_reinscription DESC`;

    const result = await query(sql, params);

    // ⭐ Mapper les résultats avec le bon statut UNIQUEMENT à partir des paiements
    const rows = result.rows.map(row => {
      const montantTotal = Number(row.montant_total_plan) || Number(row.montant_frais) || 0;
      const totalPaye = Number(row.frais_paye_calcule) || 0;
      const restant = Math.max(0, montantTotal - totalPaye);
      
      let finalStatut = row.frais_statut || 'non_paye';
      
      if (restant === 0 && montantTotal > 0) {
        finalStatut = 'paye';
      } else if (totalPaye > 0 && restant > 0) {
        finalStatut = 'partiel';
      } else if (montantTotal === 0) {
        finalStatut = 'paye';
      }

      return {
        ...row,
        frais_statut: finalStatut,
        frais_paye: totalPaye,
        frais_restant: restant,
        frais_montant: montantTotal
      };
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur API Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ POST - Créer une réinscription par l'admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      eleveId, 
      classeId, 
      montantFrais,
      transport,
      cantine,
      fournitures,
      montantTransport,
      montantCantine,
      montantFournitures
    } = body;

    if (!eleveId || !classeId) {
      return NextResponse.json({ error: "ID élève et classe requis" }, { status: 400 });
    }

    // Récupérer l'ID du parent de l'élève
    const parentResult = await query(`
      SELECT lpe.parent_id
      FROM lien_parent_eleve lpe
      WHERE lpe.eleve_id = $1
      LIMIT 1
    `, [eleveId]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Aucun parent trouvé pour cet élève" }, { status: 404 });
    }

    const parentId = parentResult.rows[0].parent_id;

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    // Récupérer les informations de l'élève
    const eleveInfo = await query(`
      SELECT 
        e.id,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        pre.photo_url as photo_url,
        c.nom as classe_actuelle_nom,
        c.niveau
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions ins ON e.id = ins.eleve_id
      LEFT JOIN preinscriptions pre ON ins.preinscription_id = pre.id
      WHERE e.id = $1
      ORDER BY ins.id DESC
      LIMIT 1
    `, [eleveId]);

    if (eleveInfo.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const info = eleveInfo.rows[0];

    // Récupérer la classe choisie
    const classeInfo = await query(`
      SELECT 
        nom,
        niveau,
        reinscription_premier_versement,
        reinscription_deuxieme_versement,
        reinscription_troisieme_versement,
        reinscription_total_versement,
        total_versement
      FROM classes 
      WHERE id = $1
    `, [classeId]);

    if (classeInfo.rows.length === 0) {
      return NextResponse.json({ error: "Classe non trouvée" }, { status: 404 });
    }

    const classe = classeInfo.rows[0];
    const classeNom = classe.nom;

    // Calculer les frais de réinscription
    let fraisReinscription = Number(classe.reinscription_total_versement) || Number(classe.total_versement) || montantFrais || 500000;

    // Calculer le total des services
    const totalServices = (montantTransport || 0) + (montantCantine || 0) + (montantFournitures || 0);
    const totalGeneral = fraisReinscription + totalServices;

    // Générer un numéro de dossier
    const currentYear = new Date().getFullYear();
    const countResult = await query(`
      SELECT COUNT(*) as count FROM reinscriptions WHERE EXTRACT(YEAR FROM date_reinscription) = $1
    `, [currentYear]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const numeroDossier = `R${currentYear}-${count.toString().padStart(4, '0')}`;

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // Créer la réinscription
      const result = await query(`
        INSERT INTO reinscriptions (
          eleve_id, 
          parent_id, 
          annee_scolaire_id, 
          classe_id, 
          montant_frais, 
          statut,
          numero_dossier,
          enfant_nom,
          enfant_prenom,
          classe_nom,
          photo_url,
          montant_total_plan,
          montant_restant_plan,
          niveau
        )
        VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        eleveId,
        parentId,
        anneeScolaire.rows[0]?.id || null,
        classeId,
        fraisReinscription,
        numeroDossier,
        info.enfant_nom,
        info.enfant_prenom,
        classeNom,
        info.photo_url,
        totalGeneral,
        totalGeneral,
        info.niveau || classe.niveau
      ]);

      const reinscriptionId = result.rows[0].id;

      // Créer les échéances pour la réinscription (3 versements)
      const premier = Number(classe.reinscription_premier_versement) || Number(classe.premier_versement) || 0;
      const deuxieme = Number(classe.reinscription_deuxieme_versement) || Number(classe.deuxieme_versement) || 0;
      const troisieme = Number(classe.reinscription_troisieme_versement) || Number(classe.troisieme_versement) || 0;

      if (premier > 0) {
        await query(`
          INSERT INTO echeances_paiement (
            reinscription_id, type, echeance, montant, date_echeance, statut
          ) VALUES ($1, 'reinscription', '1er_versement', $2, CURRENT_DATE, 'en_attente')
        `, [reinscriptionId, premier]);
      }

      if (deuxieme > 0) {
        await query(`
          INSERT INTO echeances_paiement (
            reinscription_id, type, echeance, montant, date_echeance, statut
          ) VALUES ($1, 'reinscription', '2eme_versement', $2, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 months', 'en_attente')
        `, [reinscriptionId, deuxieme]);
      }

      if (troisieme > 0) {
        await query(`
          INSERT INTO echeances_paiement (
            reinscription_id, type, echeance, montant, date_echeance, statut
          ) VALUES ($1, 'reinscription', '3eme_versement', $2, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 months', 'en_attente')
        `, [reinscriptionId, troisieme]);
      }

      // Créer les échéances pour le transport
      if (transport && transport.length > 0) {
        for (const t of transport) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, type, echeance, montant, date_echeance, statut
            ) VALUES ($1, 'transport', $2, $3, CURRENT_DATE, 'en_attente')
          `, [reinscriptionId, t.nom || 'transport', t.prix || 0]);
        }
      }

      // Créer les échéances pour la cantine
      if (cantine && cantine.length > 0) {
        for (const c of cantine) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, type, echeance, montant, date_echeance, statut
            ) VALUES ($1, 'cantine', $2, $3, CURRENT_DATE, 'en_attente')
          `, [reinscriptionId, c.nom || 'cantine', c.prix || 0]);
        }
      }

      // Créer les échéances pour les fournitures
      if (fournitures && fournitures.length > 0) {
        for (const f of fournitures) {
          const montantTotal = (f.quantite || 1) * (f.prix_unitaire || 0);
          if (montantTotal > 0) {
            await query(`
              INSERT INTO echeances_paiement (
                reinscription_id, type, echeance, montant, date_echeance, statut
              ) VALUES ($1, 'fournitures', $2, $3, CURRENT_DATE, 'en_attente')
            `, [reinscriptionId, f.nom || 'fournitures', montantTotal]);
          }
        }
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        data: { id: reinscriptionId },
        message: "Réinscription créée avec succès"
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur API Admin Réinscriptions (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut d'une réinscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    if (statut === "valide") {
      const checkResult = await query(`
        SELECT 
          r.frais_statut,
          r.montant_total_plan,
          r.montant_restant_plan,
          COALESCE(
            (SELECT SUM(montant) 
             FROM paiements 
             WHERE reinscription_id = r.id AND statut = 'valide'),
            0
          ) as total_paye
        FROM reinscriptions r
        WHERE r.id = $1
      `, [id]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
      }

      const check = checkResult.rows[0];
      const totalPaye = Number(check.total_paye) || 0;
      const montantTotal = Number(check.montant_total_plan) || Number(check.montant_frais) || 0;

      if (totalPaye === 0 && montantTotal > 0) {
        return NextResponse.json(
          { error: "❌ Aucun paiement n'a été effectué. Veuillez d'abord enregistrer le paiement." },
          { status: 400 }
        );
      }
    }

    const result = await query(`
      UPDATE reinscriptions 
      SET statut = $1, observations = $2, date_traitement = NOW()
      WHERE id = $3 
      RETURNING *
    `, [statut, observations, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    if (statut === "valide") {
      const reinscription = result.rows[0];
      if (reinscription.classe_id) {
        await query(`
          UPDATE eleves 
          SET classe_id = $1 
          WHERE id = $2
        `, [reinscription.classe_id, reinscription.eleve_id]);
      }
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Réinscriptions (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une réinscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const checkResult = await query(`
      SELECT r.id, r.enfant_nom, r.enfant_prenom, r.statut
      FROM reinscriptions r
      WHERE r.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const reinscription = checkResult.rows[0];

    await query('BEGIN');

    try {
      await query(`
        DELETE FROM paiements 
        WHERE reinscription_id = $1
      `, [id]);

      await query(`
        DELETE FROM echeances_paiement 
        WHERE reinscription_id = $1
      `, [id]);

      await query(`
        DELETE FROM reinscriptions 
        WHERE id = $1
      `, [id]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Réinscription de ${reinscription.enfant_prenom} ${reinscription.enfant_nom} supprimée avec succès`
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
    console.error("Erreur API Réinscriptions (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}