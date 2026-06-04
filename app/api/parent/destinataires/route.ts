// app/api/parent/destinataires/route.ts
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

    // Récupérer les enseignants et l'administration
    const result = await query(`
      SELECT 
        u.id,
        u.nom,
        u.prenom,
        u.role,
        p.type as poste
      FROM utilisateurs u
      LEFT JOIN personnels p ON u.id = p.utilisateur_id
      WHERE u.role IN ('ENSEIGNANT', 'DIRECTEUR_GENERAL', 'DIRECTEUR_ETUDES', 'SURVEILLANT_GENERAL', 'COMPTABLE')
      AND u.est_actif = true
      ORDER BY u.role, u.nom
    `);

    const destinataires = result.rows.map(d => ({
      id: d.id,
      nom: `${d.prenom} ${d.nom}`,
      role: d.role,
      poste: d.poste
    }));

    // Toujours retourner un tableau, même vide
    return NextResponse.json(destinataires || []);
  } catch (error) {
    console.error("Erreur:", error);
    // En cas d'erreur, retourner un tableau vide
    return NextResponse.json([]);
  }
}