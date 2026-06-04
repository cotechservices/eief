// app/api/public/annonces/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.id,
        a.titre,
        a.contenu,
        a.cible,
        a.classe_id,
        a.image_url,
        c.nom as classe_nom,
        a.date_publication,
        u.prenom || ' ' || u.nom as auteur
      FROM annonces a
      LEFT JOIN classes c ON a.classe_id = c.id
      LEFT JOIN utilisateurs u ON a.publie_par = u.id
      WHERE a.cible = 'tous'
      ORDER BY a.date_publication DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur récup annonces publiques:", error);
    return NextResponse.json([]);
  }
}
