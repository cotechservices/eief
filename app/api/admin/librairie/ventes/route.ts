// app/api/admin/librairie/ventes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // CORRECTION: Joindre avec utilisateurs pour avoir prenom et nom
    const result = await query(`
      SELECT 
        v.id,
        v.article_id,
        a.nom as article_nom,
        v.eleve_id,
        u_eleve.prenom || ' ' || u_eleve.nom as eleve_nom,
        v.quantite,
        v.montant_total,
        v.date_vente,
        u_vendeur.prenom || ' ' || u_vendeur.nom as vendeur
      FROM ventes_librairie v
      JOIN articles_librairie a ON v.article_id = a.id
      LEFT JOIN eleves e ON v.eleve_id = e.id
      LEFT JOIN utilisateurs u_eleve ON e.utilisateur_id = u_eleve.id
      LEFT JOIN utilisateurs u_vendeur ON v.vendu_par = u_vendeur.id
      ORDER BY v.date_vente DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Ventes Librairie (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { article_id, eleve_id, quantite } = body;

    // Récupérer le prix et le stock de l'article
    const articleRes = await query('SELECT prix_unitaire, quantite_stock FROM articles_librairie WHERE id = $1', [article_id]);
    if (articleRes.rows.length === 0) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    
    const { prix_unitaire, quantite_stock } = articleRes.rows[0];

    if (quantite_stock < quantite) {
      return NextResponse.json({ error: "Stock insuffisant" }, { status: 400 });
    }

    const montant_total = prix_unitaire * quantite;

    // Enregistrer la vente
    const result = await query(`
      INSERT INTO ventes_librairie (article_id, eleve_id, quantite, montant_total, date_vente, vendu_par)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      RETURNING *
    `, [article_id, eleve_id || null, quantite, montant_total, userId]);

    // Décrémenter le stock
    await query(`UPDATE articles_librairie SET quantite_stock = quantite_stock - $1 WHERE id = $2`, [quantite, article_id]);

    // Générer une transaction dans les paiements pour la traçabilité globale (optionnel, mais recommandé)
    if (eleve_id) {
      await query(`
        INSERT INTO paiements (eleve_id, montant, type_frais, mode_paiement, statut, saisie_par, date_paiement)
        VALUES ($1, $2, 'autre', 'especes', 'paye', $3, CURRENT_DATE)
      `, [eleve_id, montant_total, userId]);
    }

    return NextResponse.json({ success: true, vente: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Ventes Librairie (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (action === 'annuler') {
      // Récupérer la vente à annuler
      const venteResult = await query(`
        SELECT article_id, quantite 
        FROM ventes_librairie 
        WHERE id = $1
      `, [id]);

      if (venteResult.rows.length === 0) {
        return NextResponse.json({ error: "Vente non trouvée" }, { status: 404 });
      }

      const { article_id, quantite } = venteResult.rows[0];

      // Supprimer la vente
      await query(`DELETE FROM ventes_librairie WHERE id = $1`, [id]);

      // Remettre le stock
      await query(`
        UPDATE articles_librairie 
        SET quantite_stock = quantite_stock + $1 
        WHERE id = $2
      `, [quantite, article_id]);

      // Supprimer le paiement associé si existe
      await query(`
        DELETE FROM paiements 
        WHERE eleve_id IN (SELECT eleve_id FROM ventes_librairie WHERE id = $1) 
        AND type_frais = 'autre' 
        AND montant = (SELECT montant_total FROM ventes_librairie WHERE id = $1)
      `, [id]);

      return NextResponse.json({ success: true, message: "Vente annulée avec succès" });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur API Ventes Librairie (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Récupérer la vente avant suppression
    const venteResult = await query(`
      SELECT article_id, quantite 
      FROM ventes_librairie 
      WHERE id = $1
    `, [id]);

    if (venteResult.rows.length === 0) {
      return NextResponse.json({ error: "Vente non trouvée" }, { status: 404 });
    }

    const { article_id, quantite } = venteResult.rows[0];

    // Supprimer la vente
    await query(`DELETE FROM ventes_librairie WHERE id = $1`, [id]);

    // Remettre le stock
    await query(`
      UPDATE articles_librairie 
      SET quantite_stock = quantite_stock + $1 
      WHERE id = $2
    `, [quantite, article_id]);

    return NextResponse.json({ success: true, message: "Vente supprimée avec succès" });
  } catch (error) {
    console.error("Erreur API Ventes Librairie (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
} 