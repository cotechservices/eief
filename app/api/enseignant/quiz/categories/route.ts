//app/api/enseignant/quiz/categories/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(
      `SELECT id, nom, description, couleur, icon, est_active 
       FROM public.categories_quiz 
       WHERE est_active = true 
       ORDER BY nom ASC`
    );

    return NextResponse.json({ categories: result.rows });
  } catch (error: any) {
    console.error("API /enseignant/quiz/categories GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ENSEIGNANT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { nom, description, couleur, icon } = body;

    if (!nom) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO public.categories_quiz (nom, description, couleur, icon, est_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, nom, description, couleur, icon`,
      [nom, description || null, couleur || '#6B46C1', icon || 'BookOpen']
    );

    return NextResponse.json({ category: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return NextResponse.json({ error: "Cette catégorie existe déjà" }, { status: 409 });
    }
    console.error("API /enseignant/quiz/categories POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}