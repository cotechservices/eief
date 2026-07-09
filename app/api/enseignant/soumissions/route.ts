// app/api/enseignant/soumissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = req.nextUrl.searchParams;
    const devoirId = searchParams.get("devoir_id");

    if (!devoirId) {
      return NextResponse.json({ error: "devoir_id requis" }, { status: 400 });
    }

    // ⭐ Vérifier que l'ID est valide
    if (isNaN(parseInt(devoirId))) {
      return NextResponse.json(
        { error: "ID de devoir invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le devoir appartient à cet enseignant
    const checkRes = await query(
      `SELECT d.id 
       FROM public.devoirs d
       JOIN public.enseignements e ON e.id = d.enseignement_id
       JOIN public.personnels p ON p.id = e.enseignant_id
       WHERE d.id = $1 AND p.utilisateur_id = $2`,
      [parseInt(devoirId), userId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Devoir non trouvé ou non autorisé" }, { status: 404 });
    }

    const soumissionsRes = await query(
      `SELECT 
        sd.id,
        sd.devoir_id,
        sd.eleve_id,
        sd.fichier_url,
        sd.commentaire,
        sd.date_soumission,
        sd.note,
        sd.est_retard,
        d.titre AS devoir_titre,
        c.nom AS classe,
        u.prenom || ' ' || u.nom AS eleve_nom
       FROM public.soumissions_devoirs sd
       JOIN public.devoirs d ON d.id = sd.devoir_id
       JOIN public.eleves e ON e.id = sd.eleve_id
       JOIN public.utilisateurs u ON u.id = e.utilisateur_id
       JOIN public.classes c ON c.id = e.classe_id
       WHERE sd.devoir_id = $1
       ORDER BY sd.date_soumission DESC`,
      [parseInt(devoirId)]
    );

    return NextResponse.json({ soumissions: soumissionsRes.rows });
  } catch (error: any) {
    console.error("API /enseignant/soumissions GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}