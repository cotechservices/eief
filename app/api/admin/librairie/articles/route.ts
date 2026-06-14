// app/api/admin/librairie/articles/route.ts
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

    const result = await query(`
      SELECT id, nom, description, prix_unitaire, quantite_stock, categorie, image_url
      FROM articles_librairie
      ORDER BY nom ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Articles Librairie (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_LIBRAIRIE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, prix_unitaire, quantite_stock, categorie, image_url } = body;

    const result = await query(`
      INSERT INTO articles_librairie (nom, description, prix_unitaire, quantite_stock, categorie, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [nom, description || null, prix_unitaire, quantite_stock, categorie || 'fourniture', image_url || null]);

    return NextResponse.json({ success: true, article: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Articles Librairie (POST):", error);
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
    const { id, nom, description, prix_unitaire, quantite_stock, categorie, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const result = await query(`
      UPDATE articles_librairie 
      SET nom = $1, 
          description = $2, 
          prix_unitaire = $3, 
          quantite_stock = $4, 
          categorie = $5,
          image_url = $6
      WHERE id = $7
      RETURNING *
    `, [nom, description || null, prix_unitaire, quantite_stock, categorie || 'fourniture', image_url || null, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, article: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Articles Librairie (PUT):", error);
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

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await query('DELETE FROM articles_librairie WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Articles Librairie (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}