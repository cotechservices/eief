// app/api/eleve/devoirs/[id]/soumettre/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const devoirId = parseInt(params.id);
    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;

    // Vérifier que le devoir existe
    const devoirRes = await query(
      "SELECT id, date_limite FROM public.devoirs WHERE id = $1",
      [devoirId]
    );
    if (devoirRes.rows.length === 0) {
      return NextResponse.json({ error: "Devoir introuvable" }, { status: 404 });
    }

    // Vérifier si déjà soumis
    const existingRes = await query(
      "SELECT id FROM public.soumissions_devoirs WHERE devoir_id = $1 AND eleve_id = $2",
      [devoirId, eleveId]
    );
    if (existingRes.rows.length > 0) {
      return NextResponse.json({ error: "Devoir déjà soumis" }, { status: 409 });
    }

    const body = await req.json();
    const { fichier_url, commentaire } = body;

    const dateLimite = new Date(devoirRes.rows[0].date_limite);
    const estRetard = new Date() > dateLimite;

    const result = await query(
      `INSERT INTO public.soumissions_devoirs 
        (devoir_id, eleve_id, fichier_url, commentaire, est_retard)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, date_soumission`,
      [devoirId, eleveId, fichier_url || null, commentaire || null, estRetard]
    );

    return NextResponse.json({
      success: true,
      soumission: result.rows[0],
      estRetard,
    });
  } catch (error: any) {
    console.error("API /eleve/devoirs/[id]/soumettre error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
