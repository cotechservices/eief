// app/api/admin/enseignants/[id]/assignations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Attendre params car c'est une Promise dans Next.js 16
    const { id } = await params;
    const enseignantId = parseInt(id);

    if (isNaN(enseignantId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        e.id,
        c.nom as classe_nom,
        m.nom as matiere_nom,
        e.heures_semaine
      FROM enseignements e
      JOIN classes c ON e.classe_id = c.id
      JOIN matieres m ON e.matiere_id = m.id
      WHERE e.enseignant_id = $1
    `, [enseignantId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}