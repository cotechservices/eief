// app/api/admin/bibliotheque/livres/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Inclure image_url et categorie dans SELECT *
    // Note: SELECT * inclut automatiquement toutes les colonnes
    const result = await query(`
      SELECT * FROM livres_bibliotheque
      ORDER BY titre ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Livres (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { titre, auteur, isbn, quantite, emplacement, categorie, image_url } = body;

    // Insertion avec categorie et image_url
    const result = await query(`
      INSERT INTO livres_bibliotheque (titre, auteur, isbn, quantite, disponible, emplacement, categorie, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [titre, auteur, isbn, quantite, quantite, emplacement, categorie || null, image_url || null]);

    return NextResponse.json({ success: true, livre: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Livres (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, titre, auteur, isbn, quantite, emplacement, categorie, image_url } = body;

    // Récupérer les quantités actuelles
    const current = await query('SELECT quantite, disponible FROM livres_bibliotheque WHERE id = $1', [id]);
    if (current.rows.length === 0) return NextResponse.json({ error: "Livre non trouvé" }, { status: 404 });

    const diff = parseInt(quantite) - current.rows[0].quantite;
    const newDisponible = Math.max(0, current.rows[0].disponible + diff);

    // Mise à jour avec categorie et image_url
    await query(`
      UPDATE livres_bibliotheque 
      SET titre = $1, 
          auteur = $2, 
          isbn = $3, 
          quantite = $4, 
          disponible = $5, 
          emplacement = $6,
          categorie = $7,
          image_url = $8
      WHERE id = $9
    `, [titre, auteur, isbn, quantite, newDisponible, emplacement, categorie || null, image_url || null, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Livres (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await query('DELETE FROM livres_bibliotheque WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Livres (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}