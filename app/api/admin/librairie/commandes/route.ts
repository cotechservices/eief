// app/api/admin/librairie/commandes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer toutes les commandes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

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

// PUT - Mettre à jour le statut d'une commande
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    if (!id || !statut) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 });
    }

    // Vérifier que la commande existe
    const checkResult = await query(`
      SELECT id, statut FROM commandes_librairie WHERE id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // Mettre à jour le statut
    const result = await query(`
      UPDATE commandes_librairie 
      SET statut = $1, 
          observations = $2,
          date_traitement = NOW()
      WHERE id = $3
      RETURNING *
    `, [statut, observations || null, id]);

    // ⭐ Si validée, créer les ventes et mettre à jour le stock
    if (statut === "valide") {
      // ⭐ Récupérer les articles de la commande (CORRECTION: commandes_librairie_articles)
      const articles = await query(`
        SELECT article_id, quantite, prix_unitaire
        FROM commandes_librairie_articles
        WHERE commande_id = $1
      `, [id]);

      console.log(`📦 ${articles.rows.length} articles à traiter pour la commande ${id}`);

      // ⭐ Créer les ventes et mettre à jour le stock
      for (const article of articles.rows) {
        const montant_total = article.quantite * article.prix_unitaire;
        
        // Créer la vente
        await query(`
          INSERT INTO ventes_librairie (
            article_id,
            eleve_id,
            quantite,
            montant_total,
            date_vente,
            vendu_par
          ) VALUES (
            $1,
            NULL,
            $2,
            $3,
            NOW(),
            $4
          )
        `, [
          article.article_id,
          article.quantite,
          montant_total,
          (session.user as any).id
        ]);

        // ⭐ Mettre à jour le stock
        await query(`
          UPDATE articles_librairie 
          SET quantite_stock = quantite_stock - $1 
          WHERE id = $2
        `, [article.quantite, article.article_id]);

        console.log(`✅ Stock mis à jour pour l'article ${article.article_id}: -${article.quantite} (${montant_total} GNF)`);
      }

      console.log(`✅ Commande ${id} validée avec succès`);
    }

    return NextResponse.json({ 
      success: true, 
      message: statut === "valide" ? "Commande validée avec succès" : "Commande rejetée",
      data: result.rows[0] 
    });
  } catch (error) {
    console.error("Erreur API Commandes (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}