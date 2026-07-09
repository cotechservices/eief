//app\api\enseignant\classes\[enseignementId]\eleves\route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enseignementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { enseignementId } = await params;

    if (!enseignementId || isNaN(parseInt(enseignementId))) {
      return NextResponse.json({ error: "ID d'enseignement invalide" }, { status: 400 });
    }

    // Vérifier que l'enseignement appartient à cet enseignant
    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );

    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });
    }

    const personnelId = personnelRes.rows[0].id;

    // Vérifier que l'enseignement appartient bien à l'enseignant
    const ensCheck = await query(
      `SELECT id, classe_id 
       FROM public.enseignements 
       WHERE id = $1 AND enseignant_id = $2`,
      [enseignementId, personnelId]
    );

    if (ensCheck.rows.length === 0) {
      return NextResponse.json({ error: "Enseignement non trouvé ou non autorisé" }, { status: 404 });
    }

    const classeId = ensCheck.rows[0].classe_id;

    // Récupérer la liste des élèves de la classe
    const elevesRes = await query(
      `SELECT 
         e.id,
         u.nom,
         u.prenom,
         e.matricule
       FROM public.eleves e
       JOIN public.utilisateurs u ON u.id = e.utilisateur_id
       WHERE e.classe_id = $1
         AND e.est_inscrit = true
       ORDER BY u.nom, u.prenom ASC`,
      [classeId]
    );

    return NextResponse.json({ 
      eleves: elevesRes.rows,
      classe_id: classeId
    });
  } catch (error: any) {
    console.error("API /enseignant/classes/[enseignementId]/eleves error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}