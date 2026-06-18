// app/api/public/activites/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id, 
        nom, 
        description, 
        categorie, 
        jour, 
        heure_debut, 
        heure_fin, 
        age_min, 
        age_max, 
        capacite_max, 
        frais_inscription, 
        photo_url, 
        est_actif
      FROM activites_periscolaires
      WHERE est_actif = true
      ORDER BY nom ASC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Publique Activités:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}