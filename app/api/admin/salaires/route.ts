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

    const url = new URL(request.url);
    const month = url.searchParams.get("month") || new Date().getMonth() + 1;
    const year = url.searchParams.get("year") || new Date().getFullYear();

    const result = await query(`
      SELECT 
        p.id as personnel_id,
        u.nom,
        u.prenom,
        p.type as poste,
        p.salaire_base,
        ps.id as paiement_id,
        ps.statut as statut_paiement,
        ps.date_paiement
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN paiements_salaires ps ON ps.personnel_id = p.id AND ps.mois = $1 AND ps.annee = $2
      WHERE u.est_actif = true
      ORDER BY u.nom ASC
    `, [month, year]);

    const salaries = result.rows.map(r => ({
      personnel_id: r.personnel_id,
      employe: `${r.prenom} ${r.nom}`,
      poste: r.poste,
      salaire_base: r.salaire_base,
      statut: r.statut_paiement || 'non_paye',
      date_paiement: r.date_paiement ? new Date(r.date_paiement).toISOString().split('T')[0] : null
    }));

    return NextResponse.json(salaries);
  } catch (error) {
    console.error("Erreur API Salaires:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { personnel_id, montant, mois, annee, mode_paiement, reference_transaction } = body;

    // Verify if already paid
    const check = await query(`SELECT id FROM paiements_salaires WHERE personnel_id = $1 AND mois = $2 AND annee = $3`, [personnel_id, mois, annee]);
    if (check.rows.length > 0) {
      return NextResponse.json({ error: "Salaire déjà payé pour ce mois" }, { status: 400 });
    }

    await query(`
      INSERT INTO paiements_salaires (personnel_id, montant, mois, annee, mode_paiement, reference_transaction, saisie_par, statut)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'paye')
    `, [personnel_id, montant, mois, annee, mode_paiement, reference_transaction, userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur paiement salaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}