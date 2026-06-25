// app/api/admin/finances/depenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Liste des dépenses avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const mois = url.searchParams.get("mois");
    const annee = url.searchParams.get("annee");
    const categorie = url.searchParams.get("categorie");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (mois) {
      whereClause += ` AND EXTRACT(MONTH FROM COALESCE(d.date_depense, d."dateDepense", NOW())) = $${paramIndex}`;
      params.push(parseInt(mois));
      paramIndex++;
    }
    if (annee) {
      whereClause += ` AND EXTRACT(YEAR FROM COALESCE(d.date_depense, d."dateDepense", NOW())) = $${paramIndex}`;
      params.push(parseInt(annee));
      paramIndex++;
    }
    if (categorie) {
      whereClause += ` AND d.categorie ILIKE $${paramIndex}`;
      params.push(`%${categorie}%`);
      paramIndex++;
    }

    params.push(limit);

    const result = await query(`
      SELECT 
        d.id,
        d.categorie,
        d.montant,
        d.description,
        COALESCE(d.date_depense, d."dateDepense", NOW()) as date_depense,
        d.recu_url,
        COALESCE(CONCAT(u.prenom, ' ', u.nom), 'Système') as saisi_par_nom,
        d.statut
      FROM depenses d
      LEFT JOIN utilisateurs u ON d.saisi_par = u.id
      ${whereClause}
      ORDER BY COALESCE(d.date_depense, d."dateDepense", NOW()) DESC
      LIMIT $${paramIndex}
    `, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Dépenses GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une dépense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { categorie, montant, description, dateDepense, recuUrl, statut } = body;

    if (!categorie || !montant) {
      return NextResponse.json({ error: "Catégorie et montant obligatoires" }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO depenses (categorie, montant, description, "dateDepense", recu_url, saisi_par, statut, exercice_annee, exercice_mois)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      categorie,
      parseInt(montant),
      description || null,
      dateDepense ? new Date(dateDepense) : new Date(),
      recuUrl || null,
      userId || null,
      statut || 'valide',
      new Date().getFullYear(),
      new Date().getMonth() + 1
    ]);

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Erreur API Dépenses POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une dépense
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    await query("DELETE FROM depenses WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Dépenses DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
