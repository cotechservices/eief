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

    const result = await query(`
      SELECT id, prenom, nom, role, email
      FROM utilisateurs
      WHERE est_actif = true
      ORDER BY nom ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Utilisateurs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}