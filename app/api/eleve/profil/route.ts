// app/api/eleve/profil/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEleveSession } from "@/lib/eleve-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getEleveSession(req);
    if (auth.error) return auth.error;

    const { eleveId } = auth;

    const result = await query(
      `SELECT 
        e.id,
        e.matricule,
        e.date_naissance,
        e.sexe,
        u.prenom,
        u.nom,
        u.email,
        u.telephone,
        u.photo_url,
        c.id AS classe_id,
        c.nom AS classe_nom,
        c.niveau AS classe_niveau,
        c.salle,
        an.libelle AS annee_scolaire,
        an.id AS annee_scolaire_id
      FROM public.eleves e
      JOIN public.utilisateurs u ON u.id = e.utilisateur_id
      LEFT JOIN public.classes c ON c.id = e.classe_id
      LEFT JOIN public.annees_scolaires an ON an.id = c.annee_scolaire_id
      WHERE e.id = $1`,
      [eleveId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Profil élève introuvable" }, { status: 404 });
    }

    return NextResponse.json({ profil: result.rows[0] });
  } catch (error: any) {
    console.error("API /eleve/profil error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}