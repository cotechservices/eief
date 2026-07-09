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

    const anneeActiveRes = await query(
      "SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1"
    );
    const anneeActiveId = anneeActiveRes.rows[0]?.id;

    if (!anneeActiveId) {
      return NextResponse.json({ devoirs: [] });
    }

    const devoirsRes = await query(
      `SELECT 
        d.id,
        d.titre,
        d.description,
        d.fichier_url,
        d.date_limite,
        d.date_publication,
        c.nom AS classe,
        c.id AS classe_id,
        en.id AS enseignement_id,
        COALESCE(
          (SELECT COUNT(DISTINCT sd.id) 
           FROM public.soumissions_devoirs sd 
           WHERE sd.devoir_id = d.id),
          0
        ) AS nb_soumissions,
        COALESCE(
          (SELECT COUNT(DISTINCT ele.id)
           FROM public.inscriptions i
           JOIN public.eleves ele ON i.eleve_id = ele.id
           WHERE ele.classe_id = c.id
             AND i.statut = 'active'
             AND i.annee_scolaire_id = $2
             AND ele.est_inscrit = true),
          0
        ) AS nb_eleves_classe,
        COALESCE(
          (SELECT COUNT(DISTINCT sd.id) 
           FROM public.soumissions_devoirs sd 
           WHERE sd.devoir_id = d.id AND sd.note IS NOT NULL),
          0
        ) AS nb_notes
      FROM public.devoirs d
      JOIN public.enseignements en ON en.id = d.enseignement_id
      JOIN public.classes c ON c.id = en.classe_id
      WHERE en.enseignant_id = $1
        AND en.annee_scolaire_id = $2
      ORDER BY d.date_publication DESC`,
      [personnelId, anneeActiveId]
    );

    console.log("✅ Devoirs trouvés:", devoirsRes.rows.length);
    if (devoirsRes.rows.length > 0) {
      console.log("📊 Premier devoir:", devoirsRes.rows[0]);
    }

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

    if (!enseignement_id) {
      return NextResponse.json(
        { error: "enseignement_id requis" },
        { status: 400 }
      );
    }
    if (!titre || titre.trim() === "") {
      return NextResponse.json(
        { error: "Le titre du devoir est requis" },
        { status: 400 }
      );
    }
    if (!date_limite) {
      return NextResponse.json(
        { error: "La date limite est requise" },
        { status: 400 }
      );
    }

    if (new Date(date_limite) < new Date()) {
      return NextResponse.json(
        { error: "La date limite doit être dans le futur" },
        { status: 400 }
      );
    }

    const ensRes = await query(
      `SELECT e.id, e.annee_scolaire_id, e.classe_id, c.nom 
       FROM public.enseignements e
       JOIN public.classes c ON c.id = e.classe_id
       WHERE e.id = $1 AND e.enseignant_id = $2`,
      [enseignement_id, personnelId]
    );
    
    if (ensRes.rows.length === 0) {
      return NextResponse.json(
        { error: "Enseignement non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    const result = await query(
      `INSERT INTO public.devoirs 
        (enseignement_id, titre, description, fichier_url, date_limite, date_publication)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
       RETURNING *`,
      [enseignement_id, titre.trim(), description || null, fichier_url || null, date_limite]
    );

    return NextResponse.json(
      { 
        success: true, 
        devoir: result.rows[0],
        message: "Devoir créé avec succès"
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /enseignant/devoirs POST error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du devoir" },
      { status: 500 }
    );
  }
}