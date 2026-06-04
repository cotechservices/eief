// app/api/parent/echeances/route.ts
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

    const userEmail = session.user?.email;

    // Récupérer les échéances à venir (mensualités pour le mois prochain)
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const echeances = await query(`
      SELECT 
        e.id as eleve_id,
        CONCAT(u.prenom, ' ', u.nom) as eleve_nom,
        'mensualite' as type_frais,
        'Mensualité' as libelle,
        $1 as date_echeance,
        COALESCE((
          SELECT montant FROM frais_scolaires 
          WHERE type_frais = 'mensualite' 
          AND niveau = c.niveau
          LIMIT 1
        ), 150000) as montant
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $2 AND e.est_inscrit = true
    `, [nextMonthStr, userEmail]);

    return NextResponse.json(echeances.rows);
  } catch (error) {
    console.error("Erreur echeances:", error);
    // Retourner un tableau vide en cas d'erreur
    return NextResponse.json([]);
  }
}