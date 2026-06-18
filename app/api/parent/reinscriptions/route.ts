// app/api/parent/reinscriptions/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    // Récupérer les réinscriptions du parent AVEC la photo
    const result = await query(`
      SELECT 
        r.id,
        r.numero_dossier,
        r.date_reinscription,
        r.statut,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.enfant_nom,
        r.enfant_prenom,
        r.classe_nom,
        r.photo_url,
        r.acte_naissance_url,
        r.bulletin_url,
        e.matricule,
        c.nom as classe_actuelle_nom,
        a.libelle as annee_scolaire
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs u_parent ON p.utilisateur_id = u_parent.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN annees_scolaires a ON r.annee_scolaire_id = a.id
      WHERE u_parent.email = $1
      ORDER BY r.date_reinscription DESC
    `, [userEmail]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Parent Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { eleveId, classeId, montantFrais } = body;

    // Récupérer l'ID du parent
    const parentResult = await query(`
      SELECT p.id 
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [session.user?.email]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parentId = parentResult.rows[0].id;

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    // Récupérer les informations de l'élève et sa photo
    const eleveInfo = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        pre.photo_url as photo_url,
        c.nom as classe_actuelle_nom
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions ins ON e.id = ins.eleve_id
      LEFT JOIN preinscriptions pre ON ins.preinscription_id = pre.id
      WHERE e.id = $1
      ORDER BY ins.id DESC
      LIMIT 1
    `, [eleveId]);

    if (eleveInfo.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const info = eleveInfo.rows[0];

    // Récupérer la classe choisie
    const classeInfo = await query(`
      SELECT nom FROM classes WHERE id = $1
    `, [classeId]);

    const classeNom = classeInfo.rows[0]?.nom || null;

    // Générer un numéro de dossier
    const currentYear = new Date().getFullYear();
    const countResult = await query(`
      SELECT COUNT(*) as count FROM reinscriptions WHERE EXTRACT(YEAR FROM date_reinscription) = $1
    `, [currentYear]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const numeroDossier = `R${currentYear}-${count.toString().padStart(4, '0')}`;

    // Créer la réinscription
    const result = await query(`
      INSERT INTO reinscriptions (
        eleve_id, 
        parent_id, 
        annee_scolaire_id, 
        classe_id, 
        montant_frais, 
        statut,
        numero_dossier,
        enfant_nom,
        enfant_prenom,
        classe_nom,
        photo_url
      )
      VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      eleveId,
      parentId,
      anneeScolaire.rows[0]?.id || null,
      classeId,
      montantFrais || 500000,
      numeroDossier,
      info.enfant_nom,
      info.enfant_prenom,
      classeNom,
      info.photo_url
    ]);

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error("Erreur API Parent Réinscriptions (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}