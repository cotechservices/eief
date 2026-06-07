// app/api/parent/reinscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les réinscriptions du parent connecté
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    const result = await query(`
      SELECT 
        r.id,
        r.statut,
        r.date_reinscription,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.frais_date_paiement,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        e.matricule,
        e.photo_url,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        c_actuelle.nom as classe_actuelle_nom,
        a.libelle as annee_scolaire
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      LEFT JOIN classes c ON r.classe_id = c.id
      LEFT JOIN classes c_actuelle ON e.classe_id = c_actuelle.id
      LEFT JOIN annees_scolaires a ON r.annee_scolaire_id = a.id
      WHERE pu.email = $1
      ORDER BY r.date_reinscription DESC
    `, [userEmail]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Soumettre une demande de réinscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { eleveId, classeId, montantFrais } = body;

    if (!eleveId || !classeId) {
      return NextResponse.json({ error: "Données incomplètes (eleveId et classeId requis)" }, { status: 400 });
    }

    // Récupérer le parent connecté
    const parent = await query(`
      SELECT p.id 
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [session.user?.email]);

    if (parent.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parentId = parent.rows[0].id;

    // Vérifier que l'enfant appartient bien au parent
    const enfantCheck = await query(`
      SELECT e.id FROM eleves e
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      WHERE lpe.parent_id = $1 AND e.id = $2
    `, [parentId, eleveId]);

    if (enfantCheck.rows.length === 0) {
      return NextResponse.json({ error: "Cet enfant n'est pas lié à votre compte" }, { status: 403 });
    }

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    const anneeScolaireId = anneeScolaire.rows[0]?.id || null;

    // Vérifier qu'il n'y a pas déjà une réinscription en attente pour cet enfant cette année
    const existingReinscription = await query(`
      SELECT id FROM reinscriptions 
      WHERE eleve_id = $1 AND annee_scolaire_id = $2 AND statut = 'en_attente'
    `, [eleveId, anneeScolaireId]);

    if (existingReinscription.rows.length > 0) {
      return NextResponse.json({ error: "Une demande de réinscription est déjà en attente pour cet enfant" }, { status: 400 });
    }

    // Récupérer l'inscription active de l'élève
    const inscription = await query(`
      SELECT id FROM inscriptions 
      WHERE eleve_id = $1 AND statut = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [eleveId]);

    const inscriptionId = inscription.rows[0]?.id || null;

    // Créer la réinscription
    const result = await query(`
      INSERT INTO reinscriptions (inscription_id, eleve_id, parent_id, annee_scolaire_id, classe_id, montant_frais, statut)
      VALUES ($1, $2, $3, $4, $5, $6, 'en_attente')
      RETURNING *
    `, [inscriptionId, eleveId, parentId, anneeScolaireId, classeId, montantFrais || 500000]);

    return NextResponse.json({ 
      success: true, 
      message: "Demande de réinscription envoyée avec succès",
      data: result.rows[0] 
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
