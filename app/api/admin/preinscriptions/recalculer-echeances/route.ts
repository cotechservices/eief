// app/api/admin/preinscriptions/recalculer-echeances/route.ts
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
    const { preinscriptionId, planId } = body;

    if (!preinscriptionId || !planId) {
      return NextResponse.json({ error: "ID de pré-inscription et plan requis" }, { status: 400 });
    }

    const preinsCheck = await query(
      "SELECT id, statut, niveau FROM preinscriptions WHERE id = $1",
      [preinscriptionId]
    );
    
    if (preinsCheck.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    if (preinsCheck.rows[0].statut === 'valide') {
      return NextResponse.json({ error: "Impossible de modifier le plan d'une inscription déjà validée" }, { status: 400 });
    }

    const planResult = await query(`
      SELECT * FROM plans_paiement_niveaux WHERE id = $1
    `, [planId]);

    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    const plan = planResult.rows[0];

    // Supprimer les anciennes échéances d'inscription
    await query(`
      DELETE FROM echeances_paiement 
      WHERE preinscription_id = $1 AND type = 'inscription'
    `, [preinscriptionId]);

    // Créer les nouvelles échéances
    await query(`
      INSERT INTO echeances_paiement (preinscription_id, type, echeance, montant, date_echeance, statut)
      VALUES 
        ($1, 'inscription', '1er_versement', $2, CURRENT_DATE, 'en_attente'),
        ($1, 'inscription', '2eme_versement', $3, CURRENT_DATE + INTERVAL '2 months', 'en_attente'),
        ($1, 'inscription', '3eme_versement', $4, CURRENT_DATE + INTERVAL '4 months', 'en_attente')
    `, [preinscriptionId, plan.premier_versement, plan.deuxieme_versement, plan.troisieme_versement]);

    // Mettre à jour la pré-inscription
    await query(`
      UPDATE preinscriptions 
      SET plan_paiement_id = $1,
          montant_total_plan = $2,
          montant_restant_plan = $2,
          type_inscription = $3,
          frais_montant = $2,
          frais_statut = 'non_paye'
      WHERE id = $4
    `, [planId, plan.total, plan.type_inscription || 'inscription', preinscriptionId]);

    return NextResponse.json({ 
      success: true, 
      message: "Plan de paiement appliqué avec succès",
      plan: plan
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}