// app/api/parent/commandes/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les commandes du parent
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    const result = await query(`
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
      WHERE u.email = $1
      ORDER BY c.date_commande DESC
    `, [userEmail]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Commandes (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une commande
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { articles, total } = body;

    if (!articles || articles.length === 0) {
      return NextResponse.json({ error: "Aucun article dans la commande" }, { status: 400 });
    }

    // Récupérer l'ID du parent
    const parentResult = await query(`
      SELECT p.id 
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [session.user?.email]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parentId = parentResult.rows[0].id;

    // Générer un numéro de commande
    const currentYear = new Date().getFullYear();
    const countResult = await query(`
      SELECT COUNT(*) as count FROM commandes_librairie WHERE EXTRACT(YEAR FROM date_commande) = $1
    `, [currentYear]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const numeroCommande = `CMD-${currentYear}-${count.toString().padStart(4, '0')}`;

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // ⭐ Créer la commande dans la table commandes_librairie
      const commandeResult = await query(`
        INSERT INTO commandes_librairie (
          parent_id,
          numero_commande,
          total,
          statut,
          date_commande
        ) VALUES ($1, $2, $3, 'en_attente', NOW())
        RETURNING id
      `, [parentId, numeroCommande, total]);

      const commandeId = commandeResult.rows[0].id;

      // ⭐ Ajouter les articles dans la table commandes_librairie_articles
      for (const article of articles) {
        await query(`
          INSERT INTO commandes_librairie_articles (
            commande_id,
            article_id,
            quantite,
            prix_unitaire
          ) VALUES ($1, $2, $3, $4)
        `, [commandeId, article.id, article.quantite, article.prix_unitaire]);
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Commande créée avec succès",
        data: { id: commandeId, numero_commande: numeroCommande }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur API Commandes (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}