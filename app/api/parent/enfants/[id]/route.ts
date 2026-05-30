// app/api/parent/enfants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const eleveId = parseInt(params.id);
    const userEmail = session.user?.email;

    // Récupérer les détails de l'enfant
    const result = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        c.nom as classe_nom,
        c.niveau
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE e.id = $1 AND pu.email = $2 AND e.est_inscrit = true
    `, [eleveId, userEmail]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Enfant non trouvé" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}