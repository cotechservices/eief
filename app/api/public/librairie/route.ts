// app/api/public/librairie/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id,
        nom,
        description,
        prix_unitaire as prix,
        quantite_stock as stock,
        categorie,
        image_url
      FROM articles_librairie
      WHERE quantite_stock > 0
      ORDER BY nom ASC
    `);
    
    const articles = result.rows.map(r => ({
      id: r.id,
      nom: r.nom || "Article sans nom",
      description: r.description || "",
      prix: Number(r.prix) || 0,
      stock: Number(r.stock) || 0,
      categorie: r.categorie || "fourniture",
      image_url: r.image_url || null
    }));
    
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Erreur API Publique Librairie:", error);
    return NextResponse.json([], { status: 200 });
  }
}