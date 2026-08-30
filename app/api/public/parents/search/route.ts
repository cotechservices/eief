// app/api/public/parents/search/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requis" },
        { status: 400 }
      );
    }

    // Rechercher le parent par email
    const result = await query(
      `SELECT 
        p.id as parent_id,
        u.id as utilisateur_id,
        u.email,
        u.nom,
        u.prenom,
        u.telephone,
        u.adresse,
        u.photo_url,
        p.profession,
        p.situation_matrimoniale
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Parent non trouvé" },
        { status: 404 }
      );
    }

    const parent = result.rows[0];

    // Si situation_matrimoniale contient les informations de la mère (JSON)
    let mereInfo = {};
    if (parent.situation_matrimoniale) {
      try {
        mereInfo = typeof parent.situation_matrimoniale === 'string'
          ? JSON.parse(parent.situation_matrimoniale)
          : parent.situation_matrimoniale;
      } catch (e) {
        console.error("Erreur parsing situation_matrimoniale:", e);
      }
    }

    return NextResponse.json({
      success: true,
      parent: {
        parent_id: parent.parent_id,
        utilisateur_id: parent.utilisateur_id,
        email: parent.email,
        nom: parent.nom,
        prenom: parent.prenom,
        telephone: parent.telephone,
        adresse: parent.adresse,
        photo_url: parent.photo_url,
        profession: parent.profession,
        mere: {
          nom: mereInfo.mereNom || "",
          prenom: mereInfo.merePrenom || "",
          telephone: mereInfo.merePhone || "",
          profession: mereInfo.mereProfession || ""
        }
      }
    });

  } catch (error) {
    console.error("Erreur recherche parent:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}