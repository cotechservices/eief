// app/api/admin/activites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer toutes les activités
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categorie = searchParams.get("categorie");

    let sql = `SELECT * FROM activites_periscolaires WHERE 1=1`;
    const params: any[] = [];

    if (categorie && categorie !== "all") {
      sql += ` AND categorie = $${params.length + 1}`;
      params.push(categorie);
    }

    sql += ` ORDER BY nom ASC`;

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Activités (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une activité
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, categorie, jour, heure_debut, heure_fin, age_min, age_max, capacite_max, frais_inscription, photo_url, est_actif } = body;

    const result = await query(`
      INSERT INTO activites_periscolaires (
        nom, description, categorie, jour, heure_debut, heure_fin, 
        age_min, age_max, capacite_max, frais_inscription, photo_url, est_actif
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [nom, description, categorie, jour, heure_debut, heure_fin, age_min, age_max, capacite_max, frais_inscription, photo_url, est_actif !== false]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Activités (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Modifier une activité
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, nom, description, categorie, jour, heure_debut, heure_fin, age_min, age_max, capacite_max, frais_inscription, photo_url, est_actif } = body;

    const result = await query(`
      UPDATE activites_periscolaires 
      SET nom = $1, description = $2, categorie = $3, jour = $4, 
          heure_debut = $5, heure_fin = $6, age_min = $7, age_max = $8, 
          capacite_max = $9, frais_inscription = $10, photo_url = $11, 
          est_actif = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [nom, description, categorie, jour, heure_debut, heure_fin, age_min, age_max, capacite_max, frais_inscription, photo_url, est_actif, id]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Activités (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une activité
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await query('DELETE FROM activites_periscolaires WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Activités (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}