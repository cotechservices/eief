import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DIRECTEUR_ETUDES") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classeId = searchParams.get("classe_id");

    if (!classeId) {
      return NextResponse.json({ error: "classe_id est requis" }, { status: 400 });
    }

    // 1. Récupérer les élèves
    const elevesRes = await query(`
      SELECT e.id, e.matricule, u.prenom, u.nom, COALESCE(e.photo_url, u.photo_url) as photo_url
      FROM eleves e
      JOIN utilisateurs u ON u.id = e.utilisateur_id
      WHERE e.classe_id = $1 AND e.est_inscrit = true
      ORDER BY u.nom, u.prenom
    `, [classeId]);

    // 2. Récupérer les enseignements (Matières) de la classe
    const enseignementsRes = await query(`
      SELECT 
        en.id as enseignement_id,
        COALESCE(m.nom, 'Matière Générale') as matiere_nom,
        COALESCE(m.coefficient, 1) as default_coefficient
      FROM enseignements en
      LEFT JOIN matieres m ON m.id = en.matiere_id
      WHERE en.classe_id = $1
      ORDER BY m.nom
    `, [classeId]);

    // 3. Récupérer toutes les notes de la classe
    const notesRes = await query(`
      SELECT 
        n.id,
        n.eleve_id,
        n.enseignement_id,
        n.valeur,
        n.note_sur,
        n.coefficient
      FROM notes n
      JOIN enseignements en ON en.id = n.enseignement_id
      WHERE en.classe_id = $1
    `, [classeId]);

    return NextResponse.json({
      eleves: elevesRes.rows,
      enseignements: enseignementsRes.rows,
      notes: notesRes.rows
    });

  } catch (error: any) {
    console.error("API /directeur_etudes/notes/grid GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "DIRECTEUR_ETUDES") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { notes } = body;

    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    let savedCount = 0;
    
    for (const note of notes) {
      if (note.valeur === undefined || note.valeur === null || note.valeur === '') {
        // Optionnel: On peut supprimer la note si l'utilisateur vide le champ ?
        // Pour l'instant on ignore.
        continue;
      }
      
      const valeur = parseFloat(note.valeur);
      const noteSur = parseInt(note.note_sur) || 10;
      const coeff = parseInt(note.coefficient) || 1;

      if (isNaN(valeur) || valeur < 0 || valeur > noteSur) {
        return NextResponse.json({ error: `Note invalide: ${note.valeur}` }, { status: 400 });
      }

      if (note.id) {
        // Mise à jour
        await query(`
          UPDATE notes 
          SET valeur = $1, note_sur = $2, coefficient = $3, date_saisie = NOW()
          WHERE id = $4
        `, [valeur, noteSur, coeff, note.id]);
      } else {
        // Nouvelle note (Vérifier si elle existe déjà pour cet élève et cet enseignement)
        const check = await query(`
          SELECT id FROM notes WHERE eleve_id = $1 AND enseignement_id = $2
        `, [note.eleve_id, note.enseignement_id]);
        
        if (check.rows.length > 0) {
          await query(`
            UPDATE notes 
            SET valeur = $1, note_sur = $2, coefficient = $3, date_saisie = NOW()
            WHERE id = $4
          `, [valeur, noteSur, coeff, check.rows[0].id]);
        } else {
          await query(`
            INSERT INTO notes (eleve_id, enseignement_id, valeur, coefficient, type_note, note_sur, date_saisie)
            VALUES ($1, $2, $3, $4, 'Devoir', $5, NOW())
          `, [note.eleve_id, note.enseignement_id, valeur, coeff, noteSur]);
        }
      }
      savedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      saved_count: savedCount,
      message: `${savedCount} note(s) enregistrée(s) avec succès`
    });

  } catch (error: any) {
    console.error("API /directeur_etudes/notes/grid POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
