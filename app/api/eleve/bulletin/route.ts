// app/api/eleve/bulletin/route.ts
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
      `SELECT e.id, e.matricule, c.nom AS classe_nom, c.niveau,
              u.prenom, u.nom, an.libelle AS annee_scolaire
       FROM public.eleves e
       JOIN public.utilisateurs u ON u.id = e.utilisateur_id
       LEFT JOIN public.classes c ON c.id = e.classe_id
       LEFT JOIN public.annees_scolaires an ON an.id = c.annee_scolaire_id
       WHERE e.utilisateur_id = $1`,
      [userId]
    );

    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }

    const eleve = eleveRes.rows[0];

    // Notes avec toutes les infos pour le bulletin
    const notesRes = await query(
      `SELECT 
        m.id AS matiere_id,
        m.nom AS matiere,
        m.coefficient AS coeff_matiere,
        n.valeur,
        n.coefficient AS coeff_note,
        n.type_note,
        n.date_saisie,
        n.commentaire,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant
      FROM public.notes n
      JOIN public.enseignements en ON en.id = n.enseignement_id
      JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      WHERE n.eleve_id = $1
      ORDER BY m.nom, n.type_note, n.date_saisie`,
      [eleve.id]
    );

    // Grouper par matière
    const matieresMap: Record<string, any> = {};
    for (const row of notesRes.rows) {
      const key = row.matiere_id;
      if (!matieresMap[key]) {
        matieresMap[key] = {
          matiere: row.matiere,
          coefficient: parseInt(row.coeff_matiere),
          enseignant: row.enseignant,
          devoirs: [],
          compositions: [],
          examens_notes: [],
        };
      }
      const noteObj = {
        valeur: parseFloat(row.valeur),
        coefficient: parseInt(row.coeff_note),
        date: row.date_saisie,
        commentaire: row.commentaire,
      };
      if (row.type_note === "devoir") matieresMap[key].devoirs.push(noteObj);
      else if (row.type_note === "composition") matieresMap[key].compositions.push(noteObj);
      else if (row.type_note === "examen") matieresMap[key].examens_notes.push(noteObj);
    }

    // Calcul des moyennes
    let totalMoyennePonderee = 0;
    let totalCoeff = 0;

    const lignesBulletin = Object.values(matieresMap).map((m: any) => {
      const allNotes = [...m.devoirs, ...m.compositions, ...m.examens_notes];
      const somme = allNotes.reduce((acc: number, n: any) => acc + n.valeur * n.coefficient, 0);
      const sommCoeff = allNotes.reduce((acc: number, n: any) => acc + n.coefficient, 0);
      const moyenne = sommCoeff > 0 ? Math.round((somme / sommCoeff) * 100) / 100 : 0;

      const moyDevoirs = m.devoirs.length > 0
        ? Math.round((m.devoirs.reduce((a: number, n: any) => a + n.valeur * n.coefficient, 0) /
            m.devoirs.reduce((a: number, n: any) => a + n.coefficient, 0)) * 100) / 100
        : null;
      const moyCompos = m.compositions.length > 0
        ? Math.round((m.compositions.reduce((a: number, n: any) => a + n.valeur * n.coefficient, 0) /
            m.compositions.reduce((a: number, n: any) => a + n.coefficient, 0)) * 100) / 100
        : null;

      totalMoyennePonderee += moyenne * m.coefficient;
      totalCoeff += m.coefficient;

      const appreciation =
        moyenne >= 16 ? "Très Bien" :
        moyenne >= 14 ? "Bien" :
        moyenne >= 12 ? "Assez Bien" :
        moyenne >= 10 ? "Passable" :
        "Insuffisant";

      return {
        ...m,
        moyenne,
        moyenne_devoirs: moyDevoirs,
        moyenne_compositions: moyCompos,
        appreciation,
        nbNotes: allNotes.length,
      };
    });

    const moyenneGenerale = totalCoeff > 0
      ? Math.round((totalMoyennePonderee / totalCoeff) * 100) / 100
      : 0;

    const mentionGenerale =
      moyenneGenerale >= 16 ? "Très Bien" :
      moyenneGenerale >= 14 ? "Bien" :
      moyenneGenerale >= 12 ? "Assez Bien" :
      moyenneGenerale >= 10 ? "Passable" :
      "Insuffisant";

    return NextResponse.json({
      eleve: {
        nom: `${eleve.prenom} ${eleve.nom}`,
        prenom: eleve.prenom,
        matricule: eleve.matricule,
        classe: eleve.classe_nom,
        niveau: eleve.niveau,
        annee_scolaire: eleve.annee_scolaire,
      },
      lignes: lignesBulletin,
      moyenneGenerale,
      mentionGenerale,
      totalCoeff,
    });
  } catch (error: any) {
    console.error("API /eleve/bulletin error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
