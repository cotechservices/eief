// app/api/admin/reinscriptions/route.ts - Version corrigée
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

    let sql = `
      SELECT 
        r.id,
        r.numero_dossier,
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
        r.enfant_nom,
        r.enfant_prenom,
        r.date_naissance,
        r.lieu_naissance,
        r.sexe,
        r.niveau,
        r.classe_nom as classe,
        r.parent_nom,
        r.parent_prenom,
        r.parent_email,
        r.parent_telephone
      FROM reinscriptions r
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND r.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (r.enfant_nom ILIKE $${params.length + 1} OR r.enfant_prenom ILIKE $${params.length + 1} OR r.numero_dossier ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY r.date_reinscription DESC`;

    const result = await query(sql, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une demande de réinscription (récupère les photos depuis preinscriptions)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { eleveId, classeId, montantFrais } = body;

    // Récupérer les informations depuis preinscriptions (comme dans l'API préinscriptions)
    const infos = await query(`
      SELECT 
        e.id as eleve_id,
        u_eleve.nom as enfant_nom,
        u_eleve.prenom as enfant_prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        c.nom as classe_nom,
        c.niveau,
        p.id as parent_id,
        u_parent.nom as parent_nom,
        u_parent.prenom as parent_prenom,
        u_parent.email as parent_email,
        u_parent.telephone as parent_telephone,
        -- Récupérer les documents DEPUIS LA PREINSCRIPTION comme dans l'API préinscriptions
        pre.photo_url,
        pre.acte_naissance_url,
        pre.bulletin_url,
        pre.numero_dossier as pre_numero_dossier
      FROM eleves e
      JOIN utilisateurs u_eleve ON e.utilisateur_id = u_eleve.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs u_parent ON p.utilisateur_id = u_parent.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions ins ON e.id = ins.eleve_id
      LEFT JOIN preinscriptions pre ON ins.preinscription_id = pre.id
      WHERE e.id = $1
      ORDER BY ins.id DESC
      LIMIT 1
    `, [eleveId]);

    if (infos.rows.length === 0) {
      return NextResponse.json({ error: "Élève ou parent non trouvé" }, { status: 404 });
    }

    const info = infos.rows[0];

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    // Générer un numéro de dossier pour la réinscription
    const currentYear = new Date().getFullYear();
    const countResult = await query(`
      SELECT COUNT(*) as count FROM reinscriptions WHERE EXTRACT(YEAR FROM date_reinscription) = $1
    `, [currentYear]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const numeroDossier = `R${currentYear}-${count.toString().padStart(4, '0')}`;

    // Créer la réinscription AVEC les photos récupérées de la préinscription
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
        date_naissance,
        lieu_naissance,
        sexe,
        niveau,
        classe_nom,
        parent_nom,
        parent_prenom,
        parent_email,
        parent_telephone,
        photo_url,
        acte_naissance_url,
        bulletin_url
      )
      VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      eleveId, 
      info.parent_id, 
      anneeScolaire.rows[0]?.id || null, 
      classeId || null, 
      montantFrais || 500000,
      numeroDossier,
      info.enfant_nom,
      info.enfant_prenom,
      info.date_naissance,
      info.lieu_naissance || "Non renseigné",
      info.sexe,
      info.niveau || "Non défini",
      info.classe_nom || "Non assignée",
      info.parent_nom,
      info.parent_prenom,
      info.parent_email,
      info.parent_telephone || "Non renseigné",
      info.photo_url,      // Récupéré depuis preinscriptions
      info.acte_naissance_url,
      info.bulletin_url
    ]);

    return NextResponse.json({ 
      success: true, 
      data: result.rows[0]
    });
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
      if (reinscription.classe_id) {
        await query(`
          UPDATE eleves 
          SET classe_id = $1 
          WHERE id = $2
        `, [reinscription.classe_id, reinscription.eleve_id]);
      }
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