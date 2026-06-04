// app/api/parent/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "recus"; // recus, envoye

    let sql = "";
    let params = [userEmail];

    if (type === "recus") {
      sql = `
        SELECT 
          m.id,
          m.sujet,
          m.contenu,
          m.date_envoi,
          m.est_lu,
          u_expediteur.nom as expediteur_nom,
          u_expediteur.prenom as expediteur_prenom,
          u_expediteur.email as expediteur_email,
          u_expediteur.role as expediteur_role,
          u_destinataire.nom as destinataire_nom,
          u_destinataire.prenom as destinataire_prenom,
          u_destinataire.email as destinataire_email
        FROM messages m
        JOIN utilisateurs u_expediteur ON m.expediteur_id = u_expediteur.id
        JOIN utilisateurs u_destinataire ON m.destinataire_id = u_destinataire.id
        JOIN parents p ON u_destinataire.id = p.utilisateur_id
        JOIN utilisateurs pu ON p.utilisateur_id = pu.id
        WHERE pu.email = $1
        ORDER BY m.date_envoi DESC
      `;
    } else {
      sql = `
        SELECT 
          m.id,
          m.sujet,
          m.contenu,
          m.date_envoi,
          m.est_lu,
          u_expediteur.nom as expediteur_nom,
          u_expediteur.prenom as expediteur_prenom,
          u_expediteur.email as expediteur_email,
          u_destinataire.nom as destinataire_nom,
          u_destinataire.prenom as destinataire_prenom,
          u_destinataire.email as destinataire_email
        FROM messages m
        JOIN utilisateurs u_expediteur ON m.expediteur_id = u_expediteur.id
        JOIN utilisateurs u_destinataire ON m.destinataire_id = u_destinataire.id
        JOIN parents p ON u_expediteur.id = p.utilisateur_id
        JOIN utilisateurs pu ON p.utilisateur_id = pu.id
        WHERE pu.email = $1
        ORDER BY m.date_envoi DESC
      `;
    }

    const result = await query(sql, params);
    
    const messages = result.rows.map(m => ({
      id: m.id,
      sujet: m.sujet,
      contenu: m.contenu,
      date: m.date_envoi,
      lu: m.est_lu,
      type: type === "recus" ? "recu" : "envoye",
      expediteur: `${m.expediteur_prenom} ${m.expediteur_nom}`,
      expediteurRole: m.expediteur_role,
      destinataire: `${m.destinataire_prenom} ${m.destinataire_nom}`
    }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { destinataire_id, sujet, contenu } = body;
    const userEmail = session.user?.email;

    // Récupérer l'ID du parent
    const parentResult = await query(
      "SELECT id FROM parents WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = $1)",
      [userEmail]
    );
    
    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const result = await query(`
      INSERT INTO messages (expediteur_id, destinataire_id, sujet, contenu, date_envoi)
      VALUES (
        (SELECT utilisateur_id FROM parents WHERE id = $1),
        $2,
        $3,
        $4,
        NOW()
      )
      RETURNING id
    `, [parentResult.rows[0].id, destinataire_id, sujet, contenu]);

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    await query("UPDATE messages SET est_lu = true WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}