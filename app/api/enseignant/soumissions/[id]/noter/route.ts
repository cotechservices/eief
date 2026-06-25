// app/api/enseignant/soumissions/[id]/noter/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const soumissionId = parseInt(params.id);
    const userId = (session.user as any).id;
    const body = await req.json();
    const { note, commentaire } = body;

    if (note === undefined || note === null) {
      return NextResponse.json({ error: "Note requise" }, { status: 400 });
    }

    if (parseFloat(note) < 0 || parseFloat(note) > 20) {
      return NextResponse.json({ error: "La note doit être entre 0 et 20" }, { status: 400 });
    }

    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    // Vérifier que la soumission appartient à un devoir de cet enseignant
    const soumRes = await query(
      `SELECT sd.id FROM public.soumissions_devoirs sd
       JOIN public.devoirs d ON d.id = sd.devoir_id
       JOIN public.enseignements en ON en.id = d.enseignement_id
       WHERE sd.id = $1 AND en.enseignant_id = $2`,
      [soumissionId, personnelId]
    );

    if (soumRes.rows.length === 0) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const result = await query(
      `UPDATE public.soumissions_devoirs
       SET note = $1, commentaire = $2
       WHERE id = $3
       RETURNING id, note, commentaire, date_soumission`,
      [parseFloat(note), commentaire || null, soumissionId]
    );

    return NextResponse.json({ success: true, soumission: result.rows[0] });
  } catch (error: any) {
    console.error("API /enseignant/soumissions/[id]/noter error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
