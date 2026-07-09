import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les présences d'une date
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: "Date manquante" }, { status: 400 });
    }

    const result = await query(`
      SELECT * FROM presences_transport 
      WHERE date = $1
    `, [date]);

    return NextResponse.json({ presences: result.rows });
  } catch (error) {
    console.error("Erreur GET présences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Sauvegarder les présences
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { date, presences } = body;

    if (!date || !presences) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Supprimer les anciennes présences de cette date
    await query(`DELETE FROM presences_transport WHERE date = $1`, [date]);

    // Insérer les nouvelles présences
    for (const p of presences) {
      await query(`
        INSERT INTO presences_transport (eleve_id, date, statut, heure_arrivee, commentaire)
        VALUES ($1, $2, $3, $4, $5)
      `, [p.eleve_id, date, p.statut, p.heure_arrivee || null, p.commentaire || null]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST présences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}