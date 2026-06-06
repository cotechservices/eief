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
      ORDER BY nom ASC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Publique Librairie:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}