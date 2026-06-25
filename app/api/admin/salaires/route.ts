// app/api/admin/salaires/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Liste des salaires avec statut de paiement pour un mois/année
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const result = await query(`
      SELECT 
        p.id as personnel_id,
        p.matricule_personnel as matricule,
        p.type as poste,
        p.departement,
        p.statut,
        p.salaire_base,
        COALESCE(p.prime_mensuelle, 0) as prime_mensuelle,
        (p.salaire_base + COALESCE(p.prime_mensuelle, 0)) as salaire_total,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        CONCAT(u.prenom, ' ', u.nom) as employe,
        ps.id as paiement_id,
        ps.montant as montant_paye,
        ps.statut as statut_paiement,
        ps.date_paiement,
        ps.mode_paiement,
        ps.reference_transaction
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN paiements_salaires ps ON (
        ps.personnel_id = p.id 
        AND ps.mois = $1 
        AND ps.annee = $2
      )
      WHERE u.est_actif = true
      ORDER BY u.nom ASC, u.prenom ASC
    `, [month, year]);

    const salaires = result.rows.map(row => ({
      personnel_id: row.personnel_id,
      matricule: row.matricule,
      employe: row.employe,
      poste: row.poste,
      departement: row.departement,
      statut_agent: row.statut || 'actif',
      salaire_base: Number(row.salaire_base || 0),
      prime_mensuelle: Number(row.prime_mensuelle || 0),
      salaire_total: Number(row.salaire_total || 0),
      paiement_id: row.paiement_id,
      montant_paye: row.montant_paye ? Number(row.montant_paye) : null,
      statut: row.statut_paiement || 'non_paye',
      date_paiement: row.date_paiement ? new Date(row.date_paiement).toISOString().split('T')[0] : null,
      mode_paiement: row.mode_paiement,
      reference_transaction: row.reference_transaction
    }));

    return NextResponse.json(salaires);
  } catch (error) {
    console.error("Erreur API Salaires GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Enregistrer le paiement d'un salaire
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

    if (!personnel_id || !montant || !mois || !annee) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Vérifier si déjà payé
    const existing = await query(
      "SELECT id FROM paiements_salaires WHERE personnel_id = $1 AND mois = $2 AND annee = $3",
      [personnel_id, mois, annee]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Salaire déjà payé pour ce mois" }, { status: 400 });
    }

    await query(`
      INSERT INTO paiements_salaires (personnel_id, mois, annee, montant, statut, mode_paiement, reference_transaction, saisi_par)
      VALUES ($1, $2, $3, $4, 'paye', $5, $6, $7)
    `, [personnel_id, mois, annee, montant, mode_paiement || 'virement', reference_transaction || null, userId || null]);

    return NextResponse.json({ success: true, message: "Salaire enregistré avec succès" });
  } catch (error) {
    console.error("Erreur API Salaires POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Annuler un paiement de salaire
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé - SUPER_ADMIN requis" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await query("DELETE FROM paiements_salaires WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Salaires DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}