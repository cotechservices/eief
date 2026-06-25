// app/api/enseignant/devoirs/route.ts
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

    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    const devoirsRes = await query(
      `SELECT 
        d.id,
        d.titre,
        d.description,
        d.fichier_url,
        d.date_limite,
        d.date_publication,
        m.nom AS matiere,
        c.nom AS classe,
        c.id AS classe_id,
        en.id AS enseignement_id,
        COUNT(DISTINCT sd.id) AS nb_soumissions,
        COUNT(DISTINCT e.id) AS nb_eleves_classe,
        COUNT(DISTINCT sd.id) FILTER (WHERE sd.note IS NOT NULL) AS nb_notes
       FROM public.devoirs d
       JOIN public.enseignements en ON en.id = d.enseignement_id
       JOIN public.matieres m ON m.id = en.matiere_id
       JOIN public.classes c ON c.id = en.classe_id
       LEFT JOIN public.soumissions_devoirs sd ON sd.devoir_id = d.id
       LEFT JOIN public.eleves e ON e.classe_id = c.id AND e.est_inscrit = true
       WHERE en.enseignant_id = $1
       GROUP BY d.id, d.titre, d.description, d.fichier_url, d.date_limite, 
                d.date_publication, m.nom, c.nom, c.id, en.id
       ORDER BY d.date_publication DESC`,
      [personnelId]
    );

    return NextResponse.json({ devoirs: devoirsRes.rows });
  } catch (error: any) {
    console.error("API /enseignant/devoirs GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const personnelRes = await query(
      "SELECT id FROM public.personnels WHERE utilisateur_id = $1",
      [userId]
    );
    if (personnelRes.rows.length === 0) {
      return NextResponse.json({ error: "Personnel introuvable" }, { status: 404 });
    }
    const personnelId = personnelRes.rows[0].id;

    const body = await req.json();
    const { enseignement_id, titre, description, fichier_url, date_limite } = body;

    if (!enseignement_id || !titre || !date_limite) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Vérifier que l'enseignement appartient à cet enseignant
    const ensRes = await query(
      "SELECT id FROM public.enseignements WHERE id = $1 AND enseignant_id = $2",
      [enseignement_id, personnelId]
    );
    if (ensRes.rows.length === 0) {
      return NextResponse.json({ error: "Enseignement non trouvé" }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO public.devoirs (enseignement_id, titre, description, fichier_url, date_limite, date_publication)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
       RETURNING *`,
      [enseignement_id, titre, description || null, fichier_url || null, date_limite]
    );

    return NextResponse.json({ success: true, devoir: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("API /enseignant/devoirs POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
