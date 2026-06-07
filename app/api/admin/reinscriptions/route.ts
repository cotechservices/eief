// app/api/admin/reinscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les demandes de réinscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    // Requête adaptée à la structure réelle de la table reinscriptions
    let sql = `
      SELECT 
        r.id,
        r.eleve_id,
        r.parent_id,
        r.annee_scolaire_id,
        r.classe_id,
        r.date_reinscription,
        r.statut,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.frais_reference,
        r.frais_date_paiement,
        r.acte_naissance_url,
        r.photo_url,
        r.bulletin_url,
        -- Informations de l'élève
        u_enfant.nom as enfant_nom,
        u_enfant.prenom as enfant_prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.matricule,
        -- Informations du parent
        u_parent.nom as parent_nom,
        u_parent.prenom as parent_prenom,
        u_parent.email as parent_email,
        u_parent.telephone as parent_telephone,
        -- Classe
        c.nom as classe_nom,
        c.niveau
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN utilisateurs u_enfant ON e.utilisateur_id = u_enfant.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs u_parent ON p.utilisateur_id = u_parent.id
      LEFT JOIN classes c ON r.classe_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND r.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (u_enfant.nom ILIKE $${params.length + 1} OR u_enfant.prenom ILIKE $${params.length + 1} OR e.matricule ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY r.date_reinscription DESC`;

    const result = await query(sql, params);
    
    // Transformer les données pour le frontend
    const reinscriptions = result.rows.map(row => ({
      id: row.id,
      numero_dossier: row.matricule || `R${row.id.toString().padStart(5, '0')}`,
      date_reinscription: row.date_reinscription,
      statut: row.statut,
      observations: row.observations || "",
      frais_montant: row.montant_frais || 500000,
      frais_statut: row.frais_statut || "non_paye",
      frais_mode_paiement: row.frais_mode_paiement || "",
      acte_naissance_url: row.acte_naissance_url,
      photo_url: row.photo_url,
      bulletin_url: row.bulletin_url,
      // Parent
      parent_nom: row.parent_nom,
      parent_prenom: row.parent_prenom,
      parent_email: row.parent_email,
      parent_telephone: row.parent_telephone,
      // Enfant
      enfant_nom: row.enfant_nom,
      enfant_prenom: row.enfant_prenom,
      date_naissance: row.date_naissance,
      lieu_naissance: row.lieu_naissance || "Non renseigné",
      sexe: row.sexe,
      niveau: row.niveau || "Non défini",
      classe: row.classe_nom || "Non assignée"
    }));

    return NextResponse.json(reinscriptions);
  } catch (error) {
    console.error("Erreur API Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une demande de réinscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { eleveId, classeId, montantFrais } = body;

    // Récupérer le parent
    const parent = await query(`
      SELECT p.id 
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [session.user?.email]);

    if (parent.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    const result = await query(`
      INSERT INTO reinscriptions (eleve_id, parent_id, annee_scolaire_id, classe_id, montant_frais, statut)
      VALUES ($1, $2, $3, $4, $5, 'en_attente')
      RETURNING *
    `, [eleveId, parent.rows[0].id, anneeScolaire.rows[0]?.id, classeId, montantFrais || 500000]);

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Réinscriptions (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour le statut d'une réinscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    const result = await query(`
      UPDATE reinscriptions 
      SET statut = $1, observations = $2, date_traitement = NOW()
      WHERE id = $3 
      RETURNING *
    `, [statut, observations, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Réinscription non trouvée" }, { status: 404 });
    }

    // Si validé, mettre à jour la classe de l'élève
    if (statut === "valide") {
      const reinscription = result.rows[0];
      await query(`
        UPDATE eleves 
        SET classe_id = $1 
        WHERE id = $2
      `, [reinscription.classe_id, reinscription.eleve_id]);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Réinscriptions (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une réinscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await query('DELETE FROM reinscriptions WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Réinscriptions (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}