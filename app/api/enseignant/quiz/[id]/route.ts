//app/api/enseignant/quiz/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = parseInt(id);

    if (isNaN(questionId) || questionId <= 0) {
      return NextResponse.json({ error: "ID de question invalide" }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        q.id, q.question, q.explication, q.difficulte, q.points, 
        q.temps_secondes, q.est_active, q.ordre, q.created_at,
        q.categorie_id, q.enseignement_id,
        c.nom as categorie_nom,
        COALESCE(
          (SELECT json_agg(json_build_object('id', o.id, 'texte', o.option_texte, 'est_correcte', o.est_correcte, 'ordre', o.ordre) ORDER BY o.ordre)
           FROM public.options_quiz o WHERE o.question_id = q.id),
          '[]'::json
        ) as options
      FROM public.questions_quiz q
      JOIN public.categories_quiz c ON c.id = q.categorie_id
      WHERE q.id = $1`,
      [questionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Question non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ question: result.rows[0] });
  } catch (error: any) {
    console.error("API /enseignant/quiz/[id] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = parseInt(id);
    const body = await req.json();
    const { 
      question, explication, difficulte, points, temps_secondes, 
      est_active, options 
    } = body;

    // Mettre à jour la question
    await query(
      `UPDATE public.questions_quiz 
       SET question = $1, explication = $2, difficulte = $3, 
           points = $4, temps_secondes = $5, est_active = $6
       WHERE id = $7`,
      [question, explication || null, difficulte, points, temps_secondes, est_active, questionId]
    );

    // Mettre à jour les options (supprimer et recréer)
    if (options && options.length > 0) {
      // Supprimer les anciennes options
      await query(
        `DELETE FROM public.options_quiz WHERE question_id = $1`,
        [questionId]
      );

      // Insérer les nouvelles options
      for (let i = 0; i < options.length; i++) {
        await query(
          `INSERT INTO public.options_quiz (question_id, option_texte, est_correcte, ordre)
           VALUES ($1, $2, $3, $4)`,
          [questionId, options[i].texte, options[i].est_correcte, i + 1]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API /enseignant/quiz/[id] PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const questionId = parseInt(id);

    // Les options sont supprimées automatiquement via ON DELETE CASCADE
    await query(
      `DELETE FROM public.questions_quiz WHERE id = $1`,
      [questionId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API /enseignant/quiz/[id] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}