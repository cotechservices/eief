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
        p.id,
        p.montant,
        p.date_paiement as date,
        p.mode_paiement as mode,
        p.reference_transaction as reference,
        p.type_frais as type,
        p.statut,
        e.matricule,
        u.nom as eleve_nom,
        u.prenom as eleve_prenom,
        c.nom as classe
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      ORDER BY p.date_paiement DESC
    `);

    const paiements = result.rows.map(r => ({
      id: r.id,
      reference: r.reference || `REF-${r.id}`,
      eleve: `${r.eleve_prenom} ${r.eleve_nom}`,
      matricule: r.matricule,
      classe: r.classe || "Non assigné",
      montant: r.montant,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : "",
      type: r.type,
      mode: r.mode,
      statut: r.statut
    }));

    return NextResponse.json(paiements);
  } catch (error) {
    console.error("Erreur API Paiements:", error);
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
    const { id, statut } = body;

    if (!id || !statut) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 });
    }

    await query(`
      UPDATE paiements
      SET statut = $1
      WHERE id = $2
    `, [statut, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur modification paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
