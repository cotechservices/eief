import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mois = searchParams.get('mois') || 'mai';
    const annee = searchParams.get('annee') || '2026';

    // Fetch personnels and check if they have a payment for the specified month/year
    const result = await query(`
      SELECT 
        p.id,
        u.nom,
        u.prenom,
        p.type as poste,
        p.salaire_base as "salaireBase",
        ps.statut,
        ps.date_paiement as "datePaiement"
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN paiements_salaires ps ON p.id = ps.personnel_id AND ps.mois = $1 AND ps.annee = $2
      WHERE u.est_actif = true
      ORDER BY u.nom ASC
    `, [mois, parseInt(annee)]);

    // Map null status to 'en_attente'
    const employes = result.rows.map(row => ({
      ...row,
      statut: row.statut || 'en_attente',
      datePaiement: row.datePaiement ? new Date(row.datePaiement).toISOString().split('T')[0] : null
    }));

    return NextResponse.json(employes);
  } catch (error) {
    console.error("Erreur GET salaires:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
