import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!session || !userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") || "inbox";

    let result;
    
    if (folder === "inbox") {
      result = await query(`
        SELECT 
          m.id,
          m.sujet,
          m.contenu,
          m.est_lu,
          m.date_envoi,
          u.prenom || ' ' || u.nom as expediteur_nom,
          u.email as expediteur_email
        FROM messages m
        JOIN utilisateurs u ON m.expediteur_id = u.id
        WHERE m.destinataire_id = $1
        ORDER BY m.date_envoi DESC
      `, [userId]);
    } else {
      result = await query(`
        SELECT 
          m.id,
          m.sujet,
          m.contenu,
          m.est_lu,
          m.date_envoi,
          u.prenom || ' ' || u.nom as destinataire_nom,
          u.email as destinataire_email
        FROM messages m
        JOIN utilisateurs u ON m.destinataire_id = u.id
        WHERE m.expediteur_id = $1
        ORDER BY m.date_envoi DESC
      `, [userId]);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur API Messages GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { destinataire_id, sujet, contenu } = body;

    if (!destinataire_id || !sujet || !contenu) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    await query(`
      INSERT INTO messages (expediteur_id, destinataire_id, sujet, contenu)
      VALUES ($1, $2, $3, $4)
    `, [userId, destinataire_id, sujet, contenu]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Messages POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    // Check ownership
    const check = await query('SELECT destinataire_id FROM messages WHERE id = $1', [id]);
    if (check.rows.length === 0 || check.rows[0].destinataire_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await query('UPDATE messages SET est_lu = true WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Messages PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
