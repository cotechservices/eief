// app/api/directeur_etudes/notes/route.ts - Version corrigée avec gestion custom_matiere_nom

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
    const action = searchParams.get("action");
    const classeId = searchParams.get("classe_id");
    const enseignementId = searchParams.get("enseignement_id");
    const matiereId = searchParams.get("matiere_id");

    // 1. Fetch Classes
    if (action === "classes") {
      const res = await query(`
        SELECT id, nom, niveau 
        FROM classes 
        ORDER BY niveau, nom
      `);
      return NextResponse.json(res.rows);
    }

    // 2. Fetch Enseignants par classe
    if (action === "enseignants" && classeId) {
      const res = await query(`
        SELECT DISTINCT
          p.id as personnel_id,
          u.id as utilisateur_id,
          u.prenom,
          u.nom,
          CONCAT(u.prenom, ' ', u.nom) as nom_complet,
          p.matricule_personnel
        FROM enseignements e
        JOIN personnels p ON e.enseignant_id = p.id
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        WHERE e.classe_id = $1
          AND p.type = 'ENSEIGNANT'
        ORDER BY u.nom, u.prenom
      `, [classeId]);
      return NextResponse.json(res.rows);
    }

    // 3. Fetch UNIQUEMENT les matières personnalisées des leçons
    if (action === "matieres") {
      const leconsRes = await query(`
        SELECT DISTINCT 
          'lecon_' || id as id,
          matiere_personnalisee as nom,
          1 as coefficient
        FROM lecons 
        WHERE matiere_personnalisee IS NOT NULL 
          AND matiere_personnalisee != ''
        ORDER BY matiere_personnalisee
      `);
      return NextResponse.json(leconsRes.rows);
    }

    // 4. Fetch Enseignements & Matieres
    if (action === "enseignements" && classeId) {
      const enseignementsRes = await query(`
        SELECT 
          en.id, 
          en.matiere_id,
          COALESCE(m.nom, 'Matière Générale') as matiere, 
          COALESCE(CONCAT(u.prenom, ' ', u.nom), 'Non assigné') as enseignant,
          COALESCE(m.coefficient, 1) as coefficient,
          en.enseignant_id
        FROM enseignements en
        LEFT JOIN matieres m ON m.id = en.matiere_id
        LEFT JOIN personnels p ON p.id = en.enseignant_id
        LEFT JOIN utilisateurs u ON u.id = p.utilisateur_id
        WHERE en.classe_id = $1
        ORDER BY m.nom
      `, [classeId]);

      const customMatieresRes = await query(`
        SELECT DISTINCT 
          'lecon_' || id as id,
          matiere_personnalisee as nom,
          1 as coefficient
        FROM lecons 
        WHERE matiere_personnalisee IS NOT NULL 
          AND matiere_personnalisee != ''
        ORDER BY matiere_personnalisee
      `);

      return NextResponse.json({
        enseignements: enseignementsRes.rows,
        customMatieres: customMatieresRes.rows
      });
    }

    // 5. Fetch Eleves & Notes
    if (action === "eleves_et_notes" && classeId) {
      let targetEnseignementId = enseignementId;
      const customMatiereNom = searchParams.get("custom_matiere_nom");
      const enseignantId = searchParams.get("enseignant_id");

      let resolvedMatiereId = matiereId;
      if (!targetEnseignementId && !resolvedMatiereId && customMatiereNom && customMatiereNom.trim()) {
        const trimmed = customMatiereNom.trim();
        
        const leconMat = await query(
          `SELECT id FROM lecons WHERE LOWER(matiere_personnalisee) = LOWER($1) LIMIT 1`, 
          [trimmed]
        );
        
        if (leconMat.rows.length > 0) {
          const existingMat = await query(
            `SELECT id FROM matieres WHERE LOWER(nom) = LOWER($1) LIMIT 1`, 
            [trimmed]
          );
          
          if (existingMat.rows.length > 0) {
            resolvedMatiereId = existingMat.rows[0].id;
          } else {
            const newMat = await query(
              `INSERT INTO matieres (nom, coefficient) VALUES ($1, 1) RETURNING id`, 
              [trimmed]
            );
            resolvedMatiereId = newMat.rows[0].id;
          }
        } else {
          const existingMat = await query(
            `SELECT id FROM matieres WHERE LOWER(nom) = LOWER($1) LIMIT 1`, 
            [trimmed]
          );
          
          if (existingMat.rows.length > 0) {
            resolvedMatiereId = existingMat.rows[0].id;
          } else {
            const newMat = await query(
              `INSERT INTO matieres (nom, coefficient) VALUES ($1, 1) RETURNING id`, 
              [trimmed]
            );
            resolvedMatiereId = newMat.rows[0].id;
          }
        }
      }

      if (!targetEnseignementId && resolvedMatiereId) {
        let findQuery = `
          SELECT id FROM enseignements WHERE classe_id = $1 AND matiere_id = $2
        `;
        let queryParams: any[] = [classeId, resolvedMatiereId];
        
        if (enseignantId && enseignantId !== '' && enseignantId !== 'undefined') {
          findQuery += ` AND enseignant_id = $3`;
          queryParams.push(parseInt(enseignantId));
        }
        findQuery += ` LIMIT 1`;

        const findEnseignement = await query(findQuery, queryParams);

        if (findEnseignement.rows.length > 0) {
          targetEnseignementId = findEnseignement.rows[0].id;
        } else {
          try {
            let enseignantIdValid = null;
            if (enseignantId && enseignantId !== '' && enseignantId !== 'undefined') {
              const checkEnseignant = await query(
                `SELECT id FROM personnels WHERE id = $1 AND type = 'ENSEIGNANT'`,
                [parseInt(enseignantId)]
              );
              if (checkEnseignant.rows.length > 0) {
                enseignantIdValid = parseInt(enseignantId);
              }
            }

            const anneeScolaire = await query(
              `SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1`
            );
            const anneeScolaireId = anneeScolaire.rows[0]?.id;

            if (!anneeScolaireId) {
              return NextResponse.json(
                { error: "Aucune année scolaire active trouvée" },
                { status: 400 }
              );
            }

            let createQuery = `
              INSERT INTO enseignements (classe_id, matiere_id, annee_scolaire_id
            `;
            let createValues = [parseInt(classeId), resolvedMatiereId, anneeScolaireId];
            let valuePlaceholders = `$1, $2, $3`;
            let paramCounter = 4;

            if (enseignantIdValid) {
              createQuery += `, enseignant_id`;
              createValues.push(enseignantIdValid);
              valuePlaceholders += `, $${paramCounter}`;
              paramCounter++;
            }
            
            createQuery += `) VALUES (${valuePlaceholders}) RETURNING id`;

            const createEnseignement = await query(createQuery, createValues);
            targetEnseignementId = createEnseignement.rows[0].id;
          } catch (err: any) {
            if (err.code === '23503') {
              const anneeScolaire = await query(
                `SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1`
              );
              const anneeScolaireId = anneeScolaire.rows[0]?.id;
              
              if (anneeScolaireId) {
                const createEnseignement = await query(`
                  INSERT INTO enseignements (classe_id, matiere_id, annee_scolaire_id)
                  VALUES ($1, $2, $3)
                  RETURNING id
                `, [parseInt(classeId), resolvedMatiereId, anneeScolaireId]);
                targetEnseignementId = createEnseignement.rows[0].id;
              }
            } else {
              throw err;
            }
          }
        }
      }

      if (!targetEnseignementId) {
        return NextResponse.json({ error: "Aucune matière ou enseignement sélectionné" }, { status: 400 });
      }

      const enseignementInfo = await query(`
        SELECT 
          en.id,
          en.classe_id,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          COALESCE(m.nom, 'Matière Générale') as matiere_nom,
          COALESCE(CONCAT(u.prenom, ' ', u.nom), 'Non assigné') as enseignant_nom,
          en.enseignant_id
        FROM enseignements en
        JOIN classes c ON en.classe_id = c.id
        LEFT JOIN matieres m ON en.matiere_id = m.id
        LEFT JOIN personnels p ON en.enseignant_id = p.id
        LEFT JOIN utilisateurs u ON u.id = p.utilisateur_id
        WHERE en.id = $1
      `, [targetEnseignementId]);

      const elevesRes = await query(`
        SELECT e.id, e.matricule, u.prenom, u.nom, COALESCE(e.photo_url, u.photo_url) as photo_url
        FROM eleves e
        JOIN utilisateurs u ON u.id = e.utilisateur_id
        WHERE e.classe_id = $1 AND e.est_inscrit = true AND e.deleted_at IS NULL
        ORDER BY u.nom, u.prenom
      `, [classeId]);

      const notesRes = await query(`
        SELECT id, eleve_id, valeur, coefficient, type_note, commentaire, note_sur
        FROM notes
        WHERE enseignement_id = $1
      `, [targetEnseignementId]);

      const eleves = elevesRes.rows.map(eleve => {
        return {
          ...eleve,
          notes: notesRes.rows.filter((n: any) => n.eleve_id === eleve.id)
        };
      });

      return NextResponse.json({
        enseignement_id: targetEnseignementId,
        enseignement: enseignementInfo.rows[0] || null,
        eleves
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });

  } catch (error: any) {
    console.error("API /directeur_etudes/notes GET error:", error);
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
    console.log("📥 POST /directeur_etudes/notes - Body reçu:", JSON.stringify(body, null, 2));

    if (body.action === "create_matiere") {
      const { nom, coefficient } = body;
      if (!nom || !nom.trim()) {
        return NextResponse.json({ error: "Le nom de la matière est requis" }, { status: 400 });
      }

      const trimNom = nom.trim();
      const coeffNum = parseInt(coefficient) || 1;

      const existing = await query(
        `SELECT id, nom, coefficient FROM matieres WHERE LOWER(nom) = LOWER($1)`, 
        [trimNom]
      );
      
      if (existing.rows.length > 0) {
        return NextResponse.json({ success: true, matiere: existing.rows[0] });
      }

      const res = await query(`
        INSERT INTO matieres (nom, coefficient) 
        VALUES ($1, $2) 
        RETURNING id, nom, coefficient
      `, [trimNom, coeffNum]);

      return NextResponse.json({ success: true, matiere: res.rows[0] });
    }

    // ⭐ Récupérer toutes les données incluant custom_matiere_nom
    let { enseignement_id, classe_id, matiere_id, notes, custom_matiere_nom } = body;

    console.log("🔍 Validation des données:", {
      enseignement_id,
      classe_id,
      matiere_id,
      custom_matiere_nom,
      notes_type: typeof notes,
      notes_is_array: Array.isArray(notes),
      notes_length: notes?.length
    });

    // ⭐ GESTION DE LA MATIÈRE PERSONNALISÉE
    if (!enseignement_id && !matiere_id && custom_matiere_nom && custom_matiere_nom.trim()) {
      console.log(`🆕 Matière personnalisée détectée: "${custom_matiere_nom}"`);
      const trimmed = custom_matiere_nom.trim();
      
      // Vérifier si la matière existe déjà dans la table matieres
      const existingMat = await query(
        `SELECT id FROM matieres WHERE LOWER(nom) = LOWER($1) LIMIT 1`, 
        [trimmed]
      );
      
      if (existingMat.rows.length > 0) {
        matiere_id = existingMat.rows[0].id;
        console.log(`✅ Matière existante trouvée: ${matiere_id}`);
      } else {
        // Créer la nouvelle matière
        const newMat = await query(
          `INSERT INTO matieres (nom, coefficient) VALUES ($1, 1) RETURNING id`, 
          [trimmed]
        );
        matiere_id = newMat.rows[0].id;
        console.log(`✅ Nouvelle matière créée: ${matiere_id}`);
      }
    }

    // Validation des notes
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      console.error("❌ Notes manquantes ou invalides:", notes);
      return NextResponse.json({ 
        error: "Aucune note à enregistrer. Veuillez saisir au moins une note." 
      }, { status: 400 });
    }

    // Vérifier que chaque note a un eleve_id
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      console.log(`📝 Note ${i + 1}:`, note);
      
      if (!note.eleve_id) {
        console.error(`❌ Note ${i + 1} sans eleve_id`);
        return NextResponse.json({ 
          error: `La note ${i + 1} n'a pas d'eleve_id`,
          note: note
        }, { status: 400 });
      }
    }

    // Vérifier que la classe est présente
    if (!classe_id) {
      console.error("❌ Pas de classe_id");
      return NextResponse.json({ 
        error: "La classe est requise" 
      }, { status: 400 });
    }

    // Vérifier que nous avons une matière
    if (!enseignement_id && !matiere_id) {
      console.error("❌ Pas de matiere_id ni enseignement_id");
      return NextResponse.json({ 
        error: "La matière est requise" 
      }, { status: 400 });
    }

    // Trouver ou créer l'enseignement
    if (!enseignement_id && classe_id && matiere_id) {
      console.log("🔍 Recherche d'un enseignement existant...");
      
      // Récupérer l'enseignant_id depuis la première note (si disponible)
      let enseignantId = null;
      if (notes.length > 0 && notes[0].enseignant_id) {
        enseignantId = notes[0].enseignant_id;
      }
      
      let findQuery = `
        SELECT id FROM enseignements WHERE classe_id = $1 AND matiere_id = $2
      `;
      let queryParams: any[] = [classe_id, matiere_id];
      let paramCounter = 3;
      
      if (enseignantId) {
        findQuery += ` AND enseignant_id = $${paramCounter}`;
        queryParams.push(enseignantId);
        paramCounter++;
      }
      findQuery += ` LIMIT 1`;

      const findEnseignement = await query(findQuery, queryParams);

      if (findEnseignement.rows.length > 0) {
        enseignement_id = findEnseignement.rows[0].id;
        console.log(`✅ Enseignement existant trouvé: ${enseignement_id}`);
      } else {
        console.log("🆕 Création d'un nouvel enseignement...");
        
        const anneeScolaire = await query(
          `SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1`
        );
        const anneeScolaireId = anneeScolaire.rows[0]?.id;
        
        if (!anneeScolaireId) {
          return NextResponse.json({ 
            error: "Aucune année scolaire active trouvée" 
          }, { status: 400 });
        }

        let createQuery = `
          INSERT INTO enseignements (classe_id, matiere_id, annee_scolaire_id
        `;
        let createValues = [classe_id, matiere_id, anneeScolaireId];
        let valuePlaceholders = `$1, $2, $3`;
        let paramIdx = 4;

        if (enseignantId) {
          // Vérifier que l'enseignant existe
          const checkEnseignant = await query(
            `SELECT id FROM personnels WHERE id = $1 AND type = 'ENSEIGNANT'`,
            [enseignantId]
          );
          if (checkEnseignant.rows.length > 0) {
            createQuery += `, enseignant_id`;
            createValues.push(enseignantId);
            valuePlaceholders += `, $${paramIdx}`;
            paramIdx++;
          }
        }
        
        createQuery += `) VALUES (${valuePlaceholders}) RETURNING id`;

        const createEnseignement = await query(createQuery, createValues);
        enseignement_id = createEnseignement.rows[0].id;
        console.log(`✅ Nouvel enseignement créé: ${enseignement_id}`);
      }
    }

    if (!enseignement_id) {
      console.error("❌ Impossible de déterminer l'enseignement");
      return NextResponse.json({ 
        error: "Impossible de déterminer l'enseignement pour ces notes" 
      }, { status: 400 });
    }

    // Enregistrer les notes
    let savedCount = 0;
    for (const note of notes) {
      // Ne sauvegarder que les notes avec une valeur
      if (!note.valeur || note.valeur === '' || note.valeur === null || note.valeur === undefined) {
        console.log(`⏭️ Note pour l'élève ${note.eleve_id} ignorée (pas de valeur)`);
        continue;
      }

      const valeur = parseFloat(note.valeur);
      const noteSur = parseInt(note.note_sur) || 20;
      const coefficient = parseInt(note.coefficient) || 1;
      const type_note = note.type_note || 'Devoir';
      const commentaire = note.commentaire || null;
      
      console.log(`💾 Sauvegarde note pour élève ${note.eleve_id}:`, { valeur, noteSur, coefficient });

      // Valider la note en fonction du barème
      if (isNaN(valeur) || valeur < 0 || valeur > noteSur) {
        console.error(`❌ Note invalide pour l'élève ${note.eleve_id}:`, { valeur, noteSur });
        return NextResponse.json({ 
          error: `Note invalide pour l'élève ${note.eleve_id}: ${note.valeur} (doit être entre 0 et ${noteSur})` 
        }, { status: 400 });
      }

      if (note.id) {
        // Mettre à jour une note existante
        await query(`
          UPDATE notes 
          SET valeur = $1, 
              coefficient = $2, 
              type_note = $3, 
              commentaire = $4,
              note_sur = $5,
              date_saisie = NOW()
          WHERE id = $6 AND enseignement_id = $7
        `, [valeur, coefficient, type_note, commentaire, noteSur, note.id, enseignement_id]);
        console.log(`✅ Note ${note.id} mise à jour`);
      } else {
        // Créer une nouvelle note
        await query(`
          INSERT INTO notes (eleve_id, enseignement_id, valeur, coefficient, type_note, commentaire, note_sur, date_saisie)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [note.eleve_id, enseignement_id, valeur, coefficient, type_note, commentaire, noteSur]);
        console.log(`✅ Nouvelle note créée pour l'élève ${note.eleve_id}`);
      }
      savedCount++;
    }

    console.log(`✅ ${savedCount} note(s) enregistrée(s) avec succès`);
    
    return NextResponse.json({ 
      success: true, 
      enseignement_id,
      saved_count: savedCount,
      message: `${savedCount} note(s) enregistrée(s) avec succès`
    });

  } catch (error: any) {
    console.error("❌ API /directeur_etudes/notes POST error:", error);
    return NextResponse.json({ 
      error: error.message || "Erreur lors de l'enregistrement des notes",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}