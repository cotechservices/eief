import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
      SELECT * FROM annees_scolaires
      ORDER BY date_debut DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Paramètres (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { libelle, date_debut, date_fin, est_active } = body;

    // Si on active cette année, on doit désactiver toutes les autres (règle métier: 1 seule active à la fois)
    if (est_active) {
      await query(`UPDATE annees_scolaires SET est_active = false`);
    }

    await query(`
      INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active)
      VALUES ($1, $2, $3, $4)
    `, [libelle, date_debut, date_fin, est_active]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Paramètres (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    // Désactiver toutes
    await query(`UPDATE annees_scolaires SET est_active = false`);
    // Activer la nouvelle
    await query(`UPDATE annees_scolaires SET est_active = true WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Paramètres (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    // Vérifier si elle est active, on ne devrait pas supprimer l'année active sans avertir, mais on le permet pour simplifier
    await query('DELETE FROM annees_scolaires WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Paramètres (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
