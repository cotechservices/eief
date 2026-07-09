// app/api/admin/enseignants/[id]/classes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ CHANGEMENT: Ajout de Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // ⭐ CHANGEMENT: Utilisation de await pour déballer params
    const enseignantId = parseInt(id);

    if (isNaN(enseignantId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        c.id,
        c.nom,
        c.niveau
      FROM enseignements e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.enseignant_id = $1
      AND e.annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE est_active = true)
      ORDER BY c.niveau, c.nom
    `, [enseignantId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET classes enseignant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}