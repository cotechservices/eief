// app/api/eleve/lecons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id, classe_id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const { classe_id: classeId } = eleveRes.rows[0];

    const leconsRes = await query(
      `SELECT 
        l.id,
        l.titre,
        l.description,
        l.contenu,
        l.fichier_url,
        l.video_url,
        l.date_publication,
        m.nom AS matiere,
        m.id AS matiere_id,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant
      FROM public.lecons l
      JOIN public.enseignements en ON en.id = l.enseignement_id
      JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      WHERE en.classe_id = $1
      ORDER BY m.nom, l.date_publication DESC`,
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
