// app/api/admin/classes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer toutes les classes avec leur plan de paiement
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
        COUNT(e.id) as effectif,
        -- ⭐ Préinscriptions
        c.premier_versement,
        c.deuxieme_versement,
        c.troisieme_versement,
        c.total_versement,
        -- ⭐ Réinscriptions
        c.reinscription_premier_versement,
        c.reinscription_deuxieme_versement,
        c.reinscription_troisieme_versement,
        c.reinscription_total_versement
      FROM classes c
      LEFT JOIN eleves e ON e.classe_id = c.id AND e.est_inscrit = true
      GROUP BY c.id, c.nom, c.niveau, c.salle, c.capacite_max, c.frais_inscription,
               c.premier_versement, c.deuxieme_versement, c.troisieme_versement, c.total_versement,
               c.reinscription_premier_versement, c.reinscription_deuxieme_versement,
               c.reinscription_troisieme_versement, c.reinscription_total_versement
      ORDER BY c.niveau, c.nom
    `);

    const classes = result.rows.map(c => ({
      ...c,
      effectif: parseInt(c.effectif) || 0,
      capacite: parseInt(c.capacite) || 0,
      statut: "active",
      horaires: "08:00 - 15:00",
      // ⭐ Préinscriptions
      premier_versement: parseInt(c.premier_versement) || 0,
      deuxieme_versement: parseInt(c.deuxieme_versement) || 0,
      troisieme_versement: parseInt(c.troisieme_versement) || 0,
      total_versement: parseInt(c.total_versement) || 0,
      // ⭐ Réinscriptions
      reinscription_premier_versement: parseInt(c.reinscription_premier_versement) || 0,
      reinscription_deuxieme_versement: parseInt(c.reinscription_deuxieme_versement) || 0,
      reinscription_troisieme_versement: parseInt(c.reinscription_troisieme_versement) || 0,
      reinscription_total_versement: parseInt(c.reinscription_total_versement) || 0,
      frais_inscription: parseInt(c.frais_inscription) || 0
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
    const { 
      nom, 
      niveau, 
      salle, 
      capacite_max, 
      frais_inscription,
      // ⭐ Préinscriptions
      premier_versement,
      deuxieme_versement,
      troisieme_versement,
      total_versement,
      // ⭐ Réinscriptions
      reinscription_premier_versement,
      reinscription_deuxieme_versement,
      reinscription_troisieme_versement,
      reinscription_total_versement
    } = body;

    if (!nom || !niveau) {
      return NextResponse.json({ error: "Nom et niveau requis" }, { status: 400 });
    }

    if (!frais_inscription || frais_inscription <= 0) {
      return NextResponse.json({ error: "Le montant des frais d'inscription est requis" }, { status: 400 });
    }

    if (!premier_versement || !deuxieme_versement || !troisieme_versement) {
      return NextResponse.json({ error: "Les 3 versements d'inscription sont requis" }, { status: 400 });
    }

    // Récupérer l'année scolaire active
    const anneeActive = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);
    const anneeId = anneeActive.rows[0]?.id || null;

    // Créer la classe avec toutes les colonnes
    const result = await query(`
      INSERT INTO classes (
        nom, niveau, salle, capacite_max, frais_inscription, annee_scolaire_id,
        premier_versement, deuxieme_versement, troisieme_versement, total_versement,
        reinscription_premier_versement, reinscription_deuxieme_versement,
        reinscription_troisieme_versement, reinscription_total_versement
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      nom, niveau, salle || null, capacite_max || 30, frais_inscription, anneeId,
      premier_versement, deuxieme_versement, troisieme_versement, total_versement,
      reinscription_premier_versement, reinscription_deuxieme_versement,
      reinscription_troisieme_versement, reinscription_total_versement
    ]);

    return NextResponse.json({ 
      success: true, 
      id: result.rows[0].id,
      message: "Classe créée avec succès"
    });
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
    const { 
      id, 
      nom, 
      niveau, 
      salle, 
      capacite_max, 
      frais_inscription,
      // ⭐ Préinscriptions
      premier_versement,
      deuxieme_versement,
      troisieme_versement,
      total_versement,
      // ⭐ Réinscriptions
      reinscription_premier_versement,
      reinscription_deuxieme_versement,
      reinscription_troisieme_versement,
      reinscription_total_versement
    } = body;

    if (!id || !nom || !niveau) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    if (!frais_inscription || frais_inscription <= 0) {
      return NextResponse.json({ error: "Le montant des frais d'inscription est requis" }, { status: 400 });
    }

    // Mettre à jour la classe avec toutes les colonnes
    await query(`
      UPDATE classes 
      SET 
        nom = $1, 
        niveau = $2, 
        salle = $3, 
        capacite_max = $4, 
        frais_inscription = $5,
        -- ⭐ Préinscriptions
        premier_versement = $6,
        deuxieme_versement = $7,
        troisieme_versement = $8,
        total_versement = $9,
        -- ⭐ Réinscriptions
        reinscription_premier_versement = $10,
        reinscription_deuxieme_versement = $11,
        reinscription_troisieme_versement = $12,
        reinscription_total_versement = $13
      WHERE id = $14
    `, [
      nom, niveau, salle || null, capacite_max || 30, frais_inscription,
      premier_versement, deuxieme_versement, troisieme_versement, total_versement,
      reinscription_premier_versement, reinscription_deuxieme_versement,
      reinscription_troisieme_versement, reinscription_total_versement,
      id
    ]);

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