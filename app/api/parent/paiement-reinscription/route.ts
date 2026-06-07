// app/api/parent/paiement-reinscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { reinscriptionId, modePaiement, reference } = body;
    const userEmail = session.user?.email;

    if (!reinscriptionId || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // Vérifier que la réinscription appartient au parent connecté
    const reinscription = await query(`
      SELECT 
        r.*,
        pu.email as parent_email
      FROM reinscriptions r
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE r.id = $1 AND pu.email = $2
    `, [reinscriptionId, userEmail]);

    if (reinscription.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const data = reinscription.rows[0];

    if (data.frais_statut === "paye") {
      return NextResponse.json({ error: "Cette réinscription est déjà payée" }, { status: 400 });
    }

    // Enregistrer le paiement
    await query(`
      UPDATE reinscriptions 
      SET frais_statut = 'paye',
          frais_mode_paiement = $1,
          frais_reference = $2,
          frais_date_paiement = NOW()
      WHERE id = $3
    `, [modePaiement, reference || null, reinscriptionId]);

    return NextResponse.json({ 
      success: true, 
      message: "Paiement effectué avec succès"
    });
  } catch (error) {
    console.error("Erreur paiement réinscription:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
