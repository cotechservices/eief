import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Auto-update 'en_retard' status
    await query(`
      UPDATE emprunts_bibliotheque 
      SET statut = 'en_retard' 
      WHERE statut = 'en_cours' AND date_retour_prevue < CURRENT_TIMESTAMP
    `);

    const result = await query(`
      SELECT 
        e.id,
        e.livre_id,
        l.titre as livre_titre,
        e.eleve_id,
        el.prenom || ' ' || el.nom as eleve_nom,
        c.nom as classe_nom,
        e.date_emprunt,
        e.date_retour_prevue,
        e.date_retour_reelle,
        e.statut
      FROM emprunts_bibliotheque e
      JOIN livres_bibliotheque l ON e.livre_id = l.id
      JOIN eleves el ON e.eleve_id = el.id
      LEFT JOIN classes c ON el.classe_id = c.id
      ORDER BY e.date_emprunt DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Emprunts (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { livre_id, eleve_id, date_retour_prevue } = body;

    // Check if livre is available
    const checkLivre = await query('SELECT disponible FROM livres_bibliotheque WHERE id = $1', [livre_id]);
    if (checkLivre.rows.length === 0 || checkLivre.rows[0].disponible < 1) {
      return NextResponse.json({ error: "Livre non disponible" }, { status: 400 });
    }

    // Insert emprunt
    const result = await query(`
      INSERT INTO emprunts_bibliotheque (livre_id, eleve_id, date_retour_prevue, statut)
      VALUES ($1, $2, $3, 'en_cours')
      RETURNING *
    `, [livre_id, eleve_id, date_retour_prevue]);

    // Decrease disponible
    await query(`UPDATE livres_bibliotheque SET disponible = disponible - 1 WHERE id = $1`, [livre_id]);

    return NextResponse.json({ success: true, emprunt: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Emprunts (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body; // action can be 'retourner'

    if (action === 'retourner') {
      const empruntResult = await query('SELECT livre_id, statut FROM emprunts_bibliotheque WHERE id = $1', [id]);
      if (empruntResult.rows.length === 0) return NextResponse.json({ error: "Emprunt non trouvé" }, { status: 404 });
      
      const { livre_id, statut } = empruntResult.rows[0];
      if (statut === 'retourne') return NextResponse.json({ error: "Déjà retourné" }, { status: 400 });

      // Marquer comme retourné
      await query(`
        UPDATE emprunts_bibliotheque 
        SET statut = 'retourne', date_retour_reelle = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      // Remettre le livre en stock
      await query(`UPDATE livres_bibliotheque SET disponible = disponible + 1 WHERE id = $1`, [livre_id]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur API Emprunts (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
