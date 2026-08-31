// app/api/admin/librairie/commandes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Assurer l'existence des colonnes de paiement dans la table
async function ensurePaymentColumns() {
  try {
    await query(`
      ALTER TABLE commandes_librairie ADD COLUMN IF NOT EXISTS mode_paiement VARCHAR(50) DEFAULT 'especes';
      ALTER TABLE commandes_librairie ADD COLUMN IF NOT EXISTS reference_paiement VARCHAR(100);
    `);
  } catch (e) {
    console.error("Erreur alteration table commandes_librairie:", e);
  }
}

// GET - Récupérer toutes les commandes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await ensurePaymentColumns();

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut") || "all";

    let sql = `
      SELECT 
        c.id,
        c.numero_commande,
        c.date_commande,
        c.statut,
        c.total,
        c.observations,
        COALESCE(c.mode_paiement, 'especes') as mode_paiement,
        c.reference_paiement,
        c.parent_id,
        u.nom as parent_nom,
        u.prenom as parent_prenom,
        u.email as parent_email,
        u.telephone as parent_telephone,
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', cl.id,
              'article_id', cl.article_id,
              'nom', a.nom,
              'description', a.description,
              'quantite', cl.quantite,
              'prix_unitaire', cl.prix_unitaire,
              'total', cl.quantite * cl.prix_unitaire
            )
          )
          FROM commandes_librairie_articles cl
          JOIN articles_librairie a ON cl.article_id = a.id
          WHERE cl.commande_id = c.id),
          '[]'::json
        ) as articles
      FROM commandes_librairie c
      JOIN parents p ON c.parent_id = p.id
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE 1=1
    `;

    if (statut !== "all") {
      sql += ` AND c.statut = $1`;
    }

    sql += ` ORDER BY c.date_commande DESC`;

    const params = statut !== "all" ? [statut] : [];
    const result = await query(sql, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Commandes (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut d'une commande avec mode de paiement
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await ensurePaymentColumns();

    const body = await request.json();
    const { id, statut, mode_paiement, reference_paiement, observations } = body;

    if (!id || !statut) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 });
    }

    // Vérifier que la commande existe
    const checkResult = await query(`
      SELECT id, statut, parent_id, total, numero_commande FROM commandes_librairie WHERE id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const commande = checkResult.rows[0];
    const userRes = await query(`SELECT id FROM utilisateurs WHERE email = $1`, [session?.user?.email]);
    const adminUserId = userRes.rows[0]?.id || null;

    const modePaiementFinal = mode_paiement || 'especes';
    const refPaiementFinal = reference_paiement || commande.numero_commande;

    // Mettre à jour le statut, le mode et la référence de paiement
    const result = await query(`
      UPDATE commandes_librairie 
      SET statut = $1, 
          mode_paiement = $2,
          reference_paiement = $3,
          observations = $4,
          date_traitement = NOW()
      WHERE id = $5
      RETURNING *
    `, [statut, modePaiementFinal, refPaiementFinal, observations || null, id]);

    // ⭐ Si validée, créer les ventes, mettre à jour le stock et enregistrer le paiement
    if (statut === "valide") {
      // 1. Récupérer les articles de la commande
      const articles = await query(`
        SELECT article_id, quantite, prix_unitaire
        FROM commandes_librairie_articles
        WHERE commande_id = $1
      `, [id]);

      console.log(`📦 ${articles.rows.length} articles à traiter pour la commande ${id}`);

      // 2. Créer les ventes et décrémenter le stock
      for (const article of articles.rows) {
        const montant_total = article.quantite * article.prix_unitaire;
        
        await query(`
          INSERT INTO ventes_librairie (
            article_id,
            eleve_id,
            quantite,
            montant_total,
            date_vente,
            vendu_par
          ) VALUES (
            $1, NULL, $2, $3, NOW(), $4
          )
        `, [
          article.article_id,
          article.quantite,
          montant_total,
          adminUserId
        ]);

        await query(`
          UPDATE articles_librairie 
          SET quantite_stock = GREATEST(0, quantite_stock - $1) 
          WHERE id = $2
        `, [article.quantite, article.article_id]);
      }

      // 3. Enregistrer un paiement officiel dans la table paiements pour générer le reçu
      if (commande.parent_id) {
        // Trouver un élève ou préinscription du parent si disponible pour liaison
        const eleveRes = await query(`
          SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1 LIMIT 1
        `, [commande.parent_id]);
        const eleveId = eleveRes.rows.length > 0 ? eleveRes.rows[0].eleve_id : null;

        await query(`
          INSERT INTO paiements (
            eleve_id,
            montant,
            type_frais,
            mode_paiement,
            reference_transaction,
            statut,
            date_paiement,
            mois,
            annee,
            saisie_par
          ) VALUES (
            $1,
            $2,
            'fournitures',
            $3,
            $4,
            'valide',
            CURRENT_DATE,
            EXTRACT(MONTH FROM CURRENT_DATE),
            EXTRACT(YEAR FROM CURRENT_DATE),
            $5
          )
        `, [
          eleveId,
          commande.total,
          modePaiementFinal,
          refPaiementFinal,
          adminUserId
        ]);
      }

      console.log(`✅ Commande ${id} validée et règlement enregistré (${modePaiementFinal})`);
    }

    return NextResponse.json({ 
      success: true, 
      message: statut === "valide" ? "Commande validée et paiement enregistré" : "Commande rejetée",
      data: result.rows[0] 
    });
  } catch (error) {
    console.error("Erreur API Commandes (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 });
  }
}