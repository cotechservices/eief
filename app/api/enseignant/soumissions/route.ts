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
    const { searchParams } = new URL(req.url);
    const devoirId = searchParams.get("devoir_id");

    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    let sql = `
      SELECT 
        sd.id,
        sd.devoir_id,
        sd.eleve_id,
        sd.fichier_url,
        sd.date_soumission,
        sd.note,
        sd.commentaire,
        sd.est_retard,
        d.titre AS devoir_titre,
        d.date_limite,
        m.nom AS matiere,
        c.nom AS classe,
        CONCAT(ue.prenom, ' ', ue.nom) AS eleve_nom,
        ue.email AS eleve_email
       FROM public.soumissions_devoirs sd
       JOIN public.devoirs d ON d.id = sd.devoir_id
       JOIN public.enseignements en ON en.id = d.enseignement_id
       JOIN public.matieres m ON m.id = en.matiere_id
       JOIN public.classes c ON c.id = en.classe_id
       JOIN public.eleves e ON e.id = sd.eleve_id
       JOIN public.utilisateurs ue ON ue.id = e.utilisateur_id
       WHERE en.enseignant_id = $1
    `;
    const params: any[] = [personnelId];

    if (devoirId) {
      sql += " AND sd.devoir_id = $2";
      params.push(parseInt(devoirId));
    }

    sql += " ORDER BY sd.date_soumission DESC";

    const result = await query(sql, params);
    return NextResponse.json({ soumissions: result.rows });
  } catch (error: any) {
    console.error("API /enseignant/soumissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
