// app/api/admin/preinscriptions/paiement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Obtenir les frais pour une pré-inscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const preinscriptionId = searchParams.get("id");

    if (!preinscriptionId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const result = await query(
      `SELECT id, frais_montant, frais_statut, frais_mode_paiement, frais_reference, frais_date_paiement
       FROM preinscriptions 
       WHERE id = $1`,
      [preinscriptionId]
    );

    return NextResponse.json(result.rows[0] || {});
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Enregistrer un paiement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { preinscriptionId, montant, modePaiement, reference } = body;

    if (!preinscriptionId || !montant || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const result = await query(
      `UPDATE preinscriptions 
       SET frais_montant = $1, 
           frais_statut = 'paye', 
           frais_mode_paiement = $2, 
           frais_reference = $3, 
           frais_date_paiement = NOW()
       WHERE id = $4 
       RETURNING *`,
      [montant, modePaiement, reference || null, preinscriptionId]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Paiement enregistré avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}