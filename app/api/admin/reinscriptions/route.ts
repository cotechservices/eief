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

    let sql = `
      SELECT 
        r.*,
        u.nom as eleve_nom,
        u.prenom as eleve_prenom,
        e.matricule,
        c.nom as classe_nom,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        pu.email as parent_email,
        a.libelle as annee_scolaire
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      LEFT JOIN classes c ON r.classe_id = c.id
      LEFT JOIN annees_scolaires a ON r.annee_scolaire_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND r.statut = $${params.length + 1}`;
      params.push(statut);
    }

    sql += ` ORDER BY r.date_reinscription DESC`;

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
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
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Valider une réinscription
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
      WHERE id = $3 RETURNING *
    `, [statut, observations, id]);

    // Si validé, mettre à jour la classe de l'élève
    if (statut === "valide") {
      const reinscription = result.rows[0];
      await query(`
        UPDATE eleves SET classe_id = $1 WHERE id = $2
      `, [reinscription.classe_id, reinscription.eleve_id]);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}