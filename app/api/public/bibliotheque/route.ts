import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const inferCategorie = (titre: string) => {
  const t = titre.toLowerCase();
  if (t.includes("math") || t.includes("physique") || t.includes("français") || t.includes("science") || t.includes("cours") || t.includes("exercice") || t.includes("chimie") || t.includes("biologie")) {
    return "scolaire";
  }
  if (t.includes("histoire") || t.includes("géographie") || t.includes("guinée") || t.includes("afrique")) {
    return "histoire";
  }
  return "litterature";
};

export async function GET() {
  try {
    const result = await query(`
      SELECT id, titre, auteur, isbn, quantite, disponible, emplacement
      FROM livres_bibliotheque
      ORDER BY titre ASC
    `);
    const livres = result.rows.map(r => ({
      id: r.id,
      titre: r.titre,
      auteur: r.auteur || "-",
      isbn: r.isbn || "-",
      quantite: parseInt(r.quantite || 0),
      disponible: parseInt(r.disponible || 0) > 0, // boolean in UI
      emplacement: r.emplacement || "-",
      categorie: inferCategorie(r.titre)
    }));
    return NextResponse.json(livres);
  } catch (error) {
    console.error("Erreur API Publique Bibliothèque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
