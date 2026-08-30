// app/api/public/eleves/search/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matricule = searchParams.get("matricule");

    if (!matricule) {
      return NextResponse.json(
        { success: false, message: "Matricule requis" },
        { status: 400 }
      );
    }

    // ✅ Rechercher l'élève par matricule avec les bonnes colonnes
    const result = await query(
      `SELECT 
        e.id,
        e.matricule,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.classe_id,
        e.photo_url,
        u.nom,
        u.prenom,
        u.telephone,
        u.email,
        c.nom as classe_nom,
        c.niveau,
        p.id as parent_id,
        pu.nom as pere_nom,
        pu.prenom as pere_prenom,
        pu.telephone as pere_phone,
        pu.email as parent_email,
        pu.adresse as parent_adresse,
        pu.photo_url as parent_photo,
        p.profession as parent_profession,
        p.situation_matrimoniale as mere_info
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN lien_parent_eleve l ON e.id = l.eleve_id
      LEFT JOIN parents p ON l.parent_id = p.id
      LEFT JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE e.matricule = $1
      LIMIT 1`,
      [matricule]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Élève non trouvé" },
        { status: 404 }
      );
    }

    const eleve = result.rows[0];

    // ✅ Extraire les informations de la mère depuis situation_matrimoniale (JSON)
    let mereInfo = {};
    if (eleve.mere_info) {
      try {
        mereInfo = typeof eleve.mere_info === 'string'
          ? JSON.parse(eleve.mere_info)
          : eleve.mere_info;
      } catch (e) {
        console.error("Erreur parsing situation_matrimoniale:", e);
      }
    }

    return NextResponse.json({
      success: true,
      eleve: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: eleve.date_naissance,
        lieu_naissance: eleve.lieu_naissance,
        sexe: eleve.sexe,
        classe_nom: eleve.classe_nom,
        niveau: eleve.niveau,
        photo_url: eleve.photo_url,
        parent_id: eleve.parent_id,
        parent: {
          nom: eleve.pere_nom,
          prenom: eleve.pere_prenom,
          telephone: eleve.pere_phone,
          email: eleve.parent_email,
          adresse: eleve.parent_adresse,
          photo: eleve.parent_photo,
          profession: eleve.parent_profession,
          mere_nom: mereInfo.mereNom || "",
          mere_prenom: mereInfo.merePrenom || "",
          mere_phone: mereInfo.merePhone || "",
          mere_profession: mereInfo.mereProfession || ""
        }
      }
    });

  } catch (error) {
    console.error("Erreur recherche élève:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}