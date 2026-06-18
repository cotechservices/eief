// app/api/parent/fournitures/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les fournitures depuis articles_librairie
    const result = await query(`
      SELECT 
        id, 
        nom, 
        description,
        prix_unitaire, 
        quantite_stock,
        categorie,
        image_url
      FROM articles_librairie
      WHERE quantite_stock > 0 
        AND categorie IN ('fourniture', 'cahier', 'livre', 'uniforme')
      ORDER BY nom ASC
    `);

    // Retourner avec une propriété 'data' pour une structure cohérente
    return NextResponse.json({ 
      data: result.rows,
      success: true 
    });
  } catch (error) {
    console.error("Erreur API Fournitures:", error);
    return NextResponse.json(
      { error: "Erreur serveur", success: false }, 
      { status: 500 }
    );
  }
}