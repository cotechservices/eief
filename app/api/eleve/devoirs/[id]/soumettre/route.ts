// app/api/eleve/devoirs/[id]/soumettre/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEleveSession } from "@/lib/eleve-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getEleveSession(req);
    if (auth.error) return auth.error;

    const { eleveId } = auth;

    const { id } = await params;
    const devoirId = parseInt(id);
    if (isNaN(devoirId) || devoirId <= 0) {
      return NextResponse.json(
        { error: "ID de devoir invalide" },
        { status: 400 }
      );
    }

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

    if (!fichier_url && !commentaire) {
      return NextResponse.json(
        { error: "Veuillez fournir un fichier ou un commentaire" },
        { status: 400 }
      );
    }

    const dateLimite = new Date(devoirRes.rows[0].date_limite);
    const estRetard = new Date() > dateLimite;

    const result = await query(
      `INSERT INTO public.soumissions_devoirs 
        (devoir_id, eleve_id, fichier_url, commentaire, est_retard, date_soumission)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, date_soumission`,
      [devoirId, eleveId, fichier_url || null, commentaire || null, estRetard]
    );

    return NextResponse.json({
      success: true,
      soumission: result.rows[0],
      estRetard,
      message: estRetard 
        ? "Devoir soumis avec retard" 
        : "Devoir soumis avec succès"
    });
  } catch (error: any) {
    console.error("API /eleve/devoirs/[id]/soumettre error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la soumission" },
      { status: 500 }
    );
  }
}