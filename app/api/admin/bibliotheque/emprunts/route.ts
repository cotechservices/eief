// app/api/admin/bibliotheque/emprunts/route.ts
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

    // Requête corrigée avec la bonne jointure
    const result = await query(`
      SELECT 
        e.id,
        e.livre_id,
        l.titre as livre_titre,
        e.eleve_id,
        u.prenom || ' ' || u.nom as eleve_nom,
        c.nom as classe_nom,
        e.date_emprunt,
        e.date_retour_prevue,
        e.date_retour_reelle,
        e.statut
      FROM emprunts_bibliotheque e
      JOIN livres_bibliotheque l ON e.livre_id = l.id
      JOIN eleves el ON e.eleve_id = el.id
      JOIN utilisateurs u ON el.utilisateur_id = u.id
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

    if (!livre_id || !eleve_id || !date_retour_prevue) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    // Vérifier si le livre existe et est disponible
    const checkLivre = await query(`
      SELECT id, disponible, titre 
      FROM livres_bibliotheque 
      WHERE id = $1
    `, [livre_id]);

    if (checkLivre.rows.length === 0) {
      return NextResponse.json({ error: "Livre non trouvé" }, { status: 404 });
    }

    if (checkLivre.rows[0].disponible < 1) {
      return NextResponse.json({ error: "Ce livre n'est pas disponible pour le moment" }, { status: 400 });
    }

    // Vérifier si l'élève existe
    const checkEleve = await query(`
      SELECT e.id, u.prenom, u.nom
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      WHERE e.id = $1
    `, [eleve_id]);

    if (checkEleve.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    // Créer l'emprunt
    const result = await query(`
      INSERT INTO emprunts_bibliotheque (livre_id, eleve_id, date_emprunt, date_retour_prevue, statut)
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3, 'en_cours')
      RETURNING *
    `, [livre_id, eleve_id, date_retour_prevue]);

    // Diminuer la quantité disponible
    await query(`
      UPDATE livres_bibliotheque 
      SET disponible = disponible - 1 
      WHERE id = $1
    `, [livre_id]);

    return NextResponse.json({ 
      success: true, 
      emprunt: result.rows[0],
      message: `Livre "${checkLivre.rows[0].titre}" emprunté par ${checkEleve.rows[0].prenom} ${checkEleve.rows[0].nom}`
    });
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
    const { id, action } = body;

    if (!id || action !== 'retourner') {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    // Récupérer l'emprunt
    const empruntResult = await query(`
      SELECT livre_id, statut 
      FROM emprunts_bibliotheque 
      WHERE id = $1
    `, [id]);

    if (empruntResult.rows.length === 0) {
      return NextResponse.json({ error: "Emprunt non trouvé" }, { status: 404 });
    }
    
    const { livre_id, statut } = empruntResult.rows[0];
    
    if (statut === 'retourne') {
      return NextResponse.json({ error: "Ce livre a déjà été retourné" }, { status: 400 });
    }

    // Marquer comme retourné
    await query(`
      UPDATE emprunts_bibliotheque 
      SET statut = 'retourne', date_retour_reelle = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    // Remettre le livre en stock
    await query(`
      UPDATE livres_bibliotheque 
      SET disponible = disponible + 1 
      WHERE id = $1
    `, [livre_id]);

    return NextResponse.json({ success: true, message: "Livre retourné avec succès" });
  } catch (error) {
    console.error("Erreur API Emprunts (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN_BIBLIOTHEQUE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Récupérer l'emprunt avant suppression
    const empruntResult = await query(`
      SELECT livre_id, statut 
      FROM emprunts_bibliotheque 
      WHERE id = $1
    `, [id]);

    if (empruntResult.rows.length === 0) {
      return NextResponse.json({ error: "Emprunt non trouvé" }, { status: 404 });
    }

    const { livre_id, statut } = empruntResult.rows[0];

    // Si l'emprunt est encore en cours, remettre le livre en stock
    if (statut !== 'retourne') {
      await query(`
        UPDATE livres_bibliotheque 
        SET disponible = disponible + 1 
        WHERE id = $1
      `, [livre_id]);
    }

    // Supprimer l'emprunt
    await query(`DELETE FROM emprunts_bibliotheque WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: "Emprunt supprimé avec succès" });
  } catch (error) {
    console.error("Erreur API Emprunts (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}