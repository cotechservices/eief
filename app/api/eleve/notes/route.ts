// app/api/eleve/notes/route.ts
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

    // Récupérer l'ID élève
    const eleveRes = await query(
      "SELECT id, classe_id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const eleveId = eleveRes.rows[0].id;

    // Notes détaillées avec matière et enseignant
    const notesRes = await query(
      `SELECT 
        n.id,
        n.valeur,
        n.coefficient,
        n.type_note,
        n.date_saisie,
        n.commentaire,
        m.nom AS matiere,
        m.coefficient AS coeff_matiere,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant
      FROM public.notes n
      JOIN public.enseignements en ON en.id = n.enseignement_id
      JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      WHERE n.eleve_id = $1
      ORDER BY m.nom, n.date_saisie DESC`,
      [eleveId]
    );

    // Calculer moyennes par matière
    const matieres: Record<string, any> = {};
    for (const note of notesRes.rows) {
      if (!matieres[note.matiere]) {
        matieres[note.matiere] = {
          matiere: note.matiere,
          coefficient: note.coeff_matiere,
          enseignant: note.enseignant,
          notes: [],
          somme_ponderee: 0,
          somme_coeff: 0,
        };
      }
      matieres[note.matiere].notes.push({
        id: note.id,
        valeur: parseFloat(note.valeur),
        coefficient: note.coefficient,
        type_note: note.type_note,
        date_saisie: note.date_saisie,
        commentaire: note.commentaire,
      });
      matieres[note.matiere].somme_ponderee += parseFloat(note.valeur) * note.coefficient;
      matieres[note.matiere].somme_coeff += note.coefficient;
    }

    // Calculer la moyenne générale
    let totalPondere = 0;
    let totalCoeff = 0;
    const matieresArray = Object.values(matieres).map((m: any) => {
      const moyenne = m.somme_coeff > 0 ? m.somme_ponderee / m.somme_coeff : 0;
      totalPondere += moyenne * m.coefficient;
      totalCoeff += parseInt(m.coefficient);
      return { ...m, moyenne: Math.round(moyenne * 100) / 100 };
    });

    const moyenneGenerale = totalCoeff > 0 ? Math.round((totalPondere / totalCoeff) * 100) / 100 : 0;

    return NextResponse.json({
      matieres: matieresArray,
      moyenneGenerale,
      totalNotes: notesRes.rows.length,
    });
  } catch (error: any) {
    console.error("API /eleve/notes error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
