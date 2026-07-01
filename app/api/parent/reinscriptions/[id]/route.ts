// app/api/parent/reinscriptions/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "PARENT" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // ⭐ Attendre les params (Next.js 15)
    const resolvedParams = await params;
    const reinscriptionId = parseInt(resolvedParams.id);

    if (!reinscriptionId) {
      return NextResponse.json({ error: "ID de réinscription invalide" }, { status: 400 });
    }

    // Vérifier que la réinscription appartient bien au parent
    const userEmail = session.user?.email;
    const checkResult = await query(`
      SELECT r.id, r.statut, r.frais_statut, 
             r.enfant_nom, r.enfant_prenom
      FROM reinscriptions r
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE r.id = $1 AND u.email = $2
    `, [reinscriptionId, userEmail]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    const reinscription = checkResult.rows[0];

    // Vérifier que la réinscription est en attente
    if (reinscription.statut !== "en_attente") {
      return NextResponse.json({
        error: "Impossible d'annuler une réinscription déjà traitée"
      }, { status: 400 });
    }

    // Vérifier qu'aucun paiement n'a été effectué
    if (reinscription.frais_statut === "paye") {
      return NextResponse.json({
        error: "Impossible d'annuler une réinscription déjà payée"
      }, { status: 400 });
    }

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // Supprimer les échéances de paiement
      await query(`
        DELETE FROM echeances_paiement 
        WHERE reinscription_id = $1
      `, [reinscriptionId]);

      // Supprimer la réinscription
      await query(`
        DELETE FROM reinscriptions 
        WHERE id = $1
      `, [reinscriptionId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Réinscription annulée avec succès",
        enfantNom: `${reinscription.enfant_prenom} ${reinscription.enfant_nom}`
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Erreur annulation réinscription:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error as Error).message
    }, { status: 500 });
  }
}