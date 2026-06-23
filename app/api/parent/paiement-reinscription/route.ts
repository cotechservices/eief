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
et 
// app/api/parent/plan-paiement/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ⭐ Accepter PARENT, SUPER_ADMIN et COMPTABLE
    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const preinscriptionId = url.searchParams.get("preinscriptionId");
    const niveau = url.searchParams.get("niveau");

    // Si on a un ID de pré-inscription
    if (preinscriptionId) {
      // 1. Récupérer la pré-inscription et le plan
      const result = await query(`
        SELECT 
          p.id,
          p.niveau,
          p.montant_total_plan,
          p.montant_restant_plan,
          ppn.id as plan_id,
          ppn.niveau as plan_niveau,
          ppn.premier_versement,
          ppn.deuxieme_versement,
          ppn.troisieme_versement,
          ppn.total
        FROM preinscriptions p
        LEFT JOIN plans_paiement_niveaux ppn ON p.plan_paiement_id = ppn.id
        WHERE p.id = $1
      `, [preinscriptionId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
      }

      const data = result.rows[0];

      // 2. Récupérer les échéances séparément
      const echeancesResult = await query(`
        SELECT 
          id,
          type,
          echeance,
          montant,
          statut,
          date_echeance,
          date_paiement
        FROM echeances_paiement
        WHERE preinscription_id = $1
        ORDER BY 
          CASE echeance
            WHEN '1er_versement' THEN 1
            WHEN '2eme_versement' THEN 2
            WHEN '3eme_versement' THEN 3
          END
      `, [preinscriptionId]);

      // 3. Construire la réponse
      const response = {
        ...data,
        echeances: echeancesResult.rows,
        plan: {
          id: data.plan_id,
          niveau: data.plan_niveau || data.niveau,
          premier_versement: Number(data.premier_versement) || 0,
          deuxieme_versement: Number(data.deuxieme_versement) || 0,
          troisieme_versement: Number(data.troisieme_versement) || 0,
          total: Number(data.total) || 0
        }
      };

      return NextResponse.json(response);
    }

    // Si on a un niveau
    if (niveau) {
      const result = await query(`
        SELECT * FROM plans_paiement_niveaux 
        WHERE LOWER(niveau) = LOWER($1)
      `, [niveau]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Plan non trouvé pour ce niveau" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    // Retourner tous les plans
    const result = await query(`
      SELECT * FROM plans_paiement_niveaux ORDER BY total ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur plan paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}