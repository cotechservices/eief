// app/api/parent/enfants/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    
    // Récupérer les enfants du parent connecté via les inscriptions
    const result = await query(`
      SELECT 
        e.id,
        e.matricule,
        e.utilisateur_id as eleve_id,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        c.niveau,
        COALESCE((
          SELECT AVG(n.valeur) 
          FROM notes n 
          WHERE n.eleve_id = e.id 
          AND n.type_note = 'composition'
        ), 0) as moyenne
      FROM inscriptions i
      JOIN eleves e ON i.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $1 AND i.statut = 'active'
    `, [userEmail]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}