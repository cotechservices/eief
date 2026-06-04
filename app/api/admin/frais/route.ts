import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        id,
        nom,
        montant,
        type_frais as type,
        obligatoire,
        frequence
      FROM frais_scolaires
      ORDER BY type_frais ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Frais:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, montant, type, obligatoire, frequence } = body;

    const result = await query(`
      INSERT INTO frais_scolaires (nom, montant, type_frais, obligatoire, frequence)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nom, montant, type, obligatoire, frequence]);

    return NextResponse.json({ success: true, frais: result.rows[0] });
  } catch (error) {
    console.error("Erreur création frais:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, nom, montant, type, obligatoire, frequence } = body;

    await query(`
      UPDATE frais_scolaires
      SET nom = $1, montant = $2, type_frais = $3, obligatoire = $4, frequence = $5
      WHERE id = $6
    `, [nom, montant, type, obligatoire, frequence, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur modification frais:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await query('DELETE FROM frais_scolaires WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression frais:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
