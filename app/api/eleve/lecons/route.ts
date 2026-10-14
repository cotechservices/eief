// app/api/eleve/lecons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getEleveSession } from "@/lib/eleve-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getEleveSession(req);
    if (auth.error) return auth.error;

    const { classeId } = auth;

    if (!classeId) {
      return NextResponse.json({
        lecons: [],
        parMatiere: [],
        total: 0,
      });
    }

    const leconsRes = await query(
      `SELECT 
        l.id,
        l.titre,
        l.description,
        l.contenu,
        l.fichier_url,
        l.video_url,
        l.date_publication,
        COALESCE(m.nom, 'Général') AS matiere,
        COALESCE(m.id, 0) AS matiere_id,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant
      FROM public.lecons l
      JOIN public.enseignements en ON en.id = l.enseignement_id
      LEFT JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      WHERE en.classe_id = $1
      ORDER BY matiere, l.date_publication DESC`,
      [classeId]
    );

    // Grouper par matière
    const parMatiere: Record<string, any> = {};
    for (const l of leconsRes.rows) {
      if (!parMatiere[l.matiere_id]) {
        parMatiere[l.matiere_id] = {
          matiere: l.matiere,
          enseignant: l.enseignant,
          lecons: [],
        };
      }
      parMatiere[l.matiere_id].lecons.push({
        id: l.id,
        titre: l.titre,
        description: l.description,
        contenu: l.contenu,
        fichier_url: l.fichier_url,
        video_url: l.video_url,
        date_publication: l.date_publication,
      });
    }

    return NextResponse.json({
      lecons: leconsRes.rows,
      parMatiere: Object.values(parMatiere),
      total: leconsRes.rows.length,
    });
  } catch (error: any) {
    console.error("API /eleve/lecons error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
