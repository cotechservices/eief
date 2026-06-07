// app/api/admin/reinscriptions/paiement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { reinscriptionId, montant, modePaiement, reference } = body;

    if (!reinscriptionId || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const result = await query(
      `UPDATE reinscriptions 
       SET montant_frais = COALESCE($1, montant_frais),
           frais_statut = 'paye', 
           frais_mode_paiement = $2, 
           frais_reference = $3, 
           frais_date_paiement = NOW()
       WHERE id = $4 
       RETURNING *`,
      [montant || null, modePaiement, reference || null, reinscriptionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Paiement enregistré avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur paiement réinscription admin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
