// app/api/parent/preinscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Attendre la résolution de params
    const { id } = await params;
    const preinscriptionId = parseInt(id);
    const userEmail = session.user?.email;

    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que la pré-inscription appartient au parent et n'est pas déjà validée
    const checkResult = await query(`
      SELECT p.id, p.statut, p.frais_statut
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const preinscription = checkResult.rows[0];

    // Empêcher l'annulation si déjà validée
    if (preinscription.statut === "valide") {
      return NextResponse.json({ error: "Impossible d'annuler une pré-inscription déjà validée" }, { status: 400 });
    }

    // Empêcher l'annulation si déjà rejetée
    if (preinscription.statut === "rejete") {
      return NextResponse.json({ error: "Cette pré-inscription a déjà été rejetée" }, { status: 400 });
    }

    // Supprimer la pré-inscription
    await query("DELETE FROM preinscriptions WHERE id = $1", [preinscriptionId]);

    return NextResponse.json({ success: true, message: "Pré-inscription annulée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}