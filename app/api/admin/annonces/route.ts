// app/api/admin/annonces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        a.id,
        a.titre,
        a.contenu,
        a.cible,
        a.type,
        a.classe_id,
        a.image_url,
        c.nom as classe_nom,
        a.date_publication,
        u.prenom || ' ' || u.nom as auteur
      FROM annonces a
      LEFT JOIN classes c ON a.classe_id = c.id
      LEFT JOIN utilisateurs u ON a.publie_par = u.id
      ORDER BY a.date_publication DESC
    `);

    // Transformer les données pour assurer des valeurs par défaut
    const annonces = result.rows.map((row: any) => ({
      id: row.id,
      titre: row.titre,
      contenu: row.contenu,
      cible: row.cible || "tous",
      type: row.type || "information",
      classe_id: row.classe_id,
      classe_nom: row.classe_nom,
      image_url: row.image_url,
      date_publication: row.date_publication,
      auteur: row.auteur || "Administration"
    }));

    return NextResponse.json(annonces);
  } catch (error) {
    console.error("Erreur API Annonces:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { titre, contenu, cible, type, classe_id, image_url } = body;

    const result = await query(`
      INSERT INTO annonces (titre, contenu, cible, type, classe_id, publie_par, date_publication, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *
    `, [titre, contenu, cible || "tous", type || "information", classe_id || null, userId, image_url || null]);

    return NextResponse.json({ success: true, annonce: result.rows[0] });
  } catch (error) {
    console.error("Erreur création annonce:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, titre, contenu, cible, type, classe_id, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const result = await query(`
      UPDATE annonces 
      SET titre = $1, 
          contenu = $2, 
          cible = $3, 
          type = $4, 
          classe_id = $5, 
          image_url = $6,
          date_modification = NOW()
      WHERE id = $7
      RETURNING *
    `, [titre, contenu, cible || "tous", type || "information", classe_id || null, image_url || null, id]);

    return NextResponse.json({ success: true, annonce: result.rows[0] });
  } catch (error) {
    console.error("Erreur modification annonce:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await query('DELETE FROM annonces WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression annonce:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}