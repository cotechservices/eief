// app/api/admin/classes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer toutes les classes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        c.id,
        c.nom,
        c.niveau,
        c.salle,
        c.capacite_max as capacite,
        c.frais_inscription,
        COUNT(e.id) as effectif
      FROM classes c
      LEFT JOIN eleves e ON e.classe_id = c.id AND e.est_inscrit = true
      GROUP BY c.id, c.nom, c.niveau, c.salle, c.capacite_max, c.frais_inscription
      ORDER BY c.niveau, c.nom
    `);

    const classes = result.rows.map(c => ({
      ...c,
      effectif: parseInt(c.effectif) || 0,
      capacite: parseInt(c.capacite) || 0,
      statut: "active",
      horaires: "08:00 - 15:00"
    }));

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Erreur GET classes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une classe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, niveau, salle, capacite_max, frais_inscription } = body;

    if (!nom || !niveau) {
      return NextResponse.json({ error: "Nom et niveau requis" }, { status: 400 });
    }

    // Vérifier que le montant des frais est saisi
    if (!frais_inscription || frais_inscription <= 0) {
      return NextResponse.json({ error: "Le montant des frais d'inscription est requis" }, { status: 400 });
    }

    // Récupérer l'année scolaire active
    const anneeActive = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);
    const anneeId = anneeActive.rows[0]?.id || null;

    const result = await query(`
      INSERT INTO classes (nom, niveau, salle, capacite_max, frais_inscription, annee_scolaire_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [nom, niveau, salle || null, capacite_max || 30, frais_inscription, anneeId]);

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Erreur POST classe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Modifier une classe
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, nom, niveau, salle, capacite_max, frais_inscription } = body;

    if (!id || !nom || !niveau) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // Vérifier que le montant des frais est saisi
    if (!frais_inscription || frais_inscription <= 0) {
      return NextResponse.json({ error: "Le montant des frais d'inscription est requis" }, { status: 400 });
    }

    await query(`
      UPDATE classes 
      SET nom = $1, niveau = $2, salle = $3, capacite_max = $4, frais_inscription = $5
      WHERE id = $6
    `, [nom, niveau, salle || null, capacite_max || 30, frais_inscription, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT classe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une classe
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await query("DELETE FROM classes WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE classe:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}