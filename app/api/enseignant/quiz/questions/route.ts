//app/api/enseignant/quiz/questions/route.ts
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

    const searchParams = req.nextUrl.searchParams;
    const categorieId = searchParams.get("categorie_id");
    const enseignementId = searchParams.get("enseignement_id");
    const difficulte = searchParams.get("difficulte");

    let sql = `
      SELECT 
        q.id, q.question, q.explication, q.difficulte, q.points, 
        q.temps_secondes, q.est_active, q.ordre,
        q.created_at,
        c.id as categorie_id, c.nom as categorie_nom, c.couleur as categorie_couleur,
        COALESCE(
          (SELECT json_agg(json_build_object('id', o.id, 'texte', o.option_texte, 'est_correcte', o.est_correcte, 'ordre', o.ordre) ORDER BY o.ordre)
           FROM public.options_quiz o WHERE o.question_id = q.id),
          '[]'::json
        ) as options
      FROM public.questions_quiz q
      JOIN public.categories_quiz c ON c.id = q.categorie_id
      WHERE q.est_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (categorieId) {
      sql += ` AND q.categorie_id = $${paramIndex}`;
      params.push(parseInt(categorieId));
      paramIndex++;
    }

    if (enseignementId) {
      sql += ` AND q.enseignement_id = $${paramIndex}`;
      params.push(parseInt(enseignementId));
      paramIndex++;
    }

    if (difficulte) {
      sql += ` AND q.difficulte = $${paramIndex}`;
      params.push(difficulte);
      paramIndex++;
    }

    sql += ` ORDER BY q.categorie_id, q.ordre NULLS LAST, q.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({ questions: result.rows });
  } catch (error: any) {
    console.error("API /enseignant/quiz/questions GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { 
      categorie_id, enseignement_id, question, explication, 
      difficulte, points, temps_secondes, options 
    } = body;

    if (!categorie_id || !question || !options || options.length < 2) {
      return NextResponse.json({ 
        error: "Catégorie, question et au moins 2 options sont requis" 
      }, { status: 400 });
    }

    // Vérifier qu'au moins une option est correcte
    const hasCorrect = options.some((opt: any) => opt.est_correcte === true);
    if (!hasCorrect) {
      return NextResponse.json({ 
        error: "Au moins une option doit être marquée comme correcte" 
      }, { status: 400 });
    }

    // Insérer la question
    const questionResult = await query(
      `INSERT INTO public.questions_quiz 
       (categorie_id, enseignement_id, question, explication, difficulte, points, temps_secondes, est_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING id`,
      [
        categorie_id, 
        enseignement_id || null, 
        question, 
        explication || null,
        difficulte || 'facile',
        points || 1,
        temps_secondes || 30,
        userId
      ]
    );

    const questionId = questionResult.rows[0].id;

    // Insérer les options
    for (let i = 0; i < options.length; i++) {
      await query(
        `INSERT INTO public.options_quiz (question_id, option_texte, est_correcte, ordre)
         VALUES ($1, $2, $3, $4)`,
        [questionId, options[i].texte, options[i].est_correcte, i + 1]
      );
    }

    return NextResponse.json({ 
      success: true, 
      question_id: questionId 
    }, { status: 201 });
  } catch (error: any) {
    console.error("API /enseignant/quiz/questions POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}