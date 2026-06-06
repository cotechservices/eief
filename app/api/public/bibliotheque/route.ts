// app/api/public/bibliotheque/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const getCategorieLibelle = (categorie: string, titre: string) => {
  if (categorie) return categorie;
  
  // Fallback basé sur le titre si la catégorie n'est pas définie
  const t = titre.toLowerCase();
  if (t.includes("math") || t.includes("physique") || t.includes("français") || t.includes("science") || t.includes("cours") || t.includes("exercice") || t.includes("chimie") || t.includes("biologie")) {
    return "scolaire";
  }
  if (t.includes("histoire") || t.includes("géographie") || t.includes("guinée") || t.includes("afrique")) {
    return "histoire";
  }
  if (t.includes("art") || t.includes("musique") || t.includes("peinture")) {
    return "art";
  }
  if (t.includes("anglais") || t.includes("espagnol") || t.includes("langue")) {
    return "langues";
  }
  if (t.includes("bd") || t.includes("manga") || t.includes("bande dessinée")) {
    return "bd";
  }
  return "litterature";
};

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id, 
        titre, 
        auteur, 
        isbn, 
        quantite, 
        disponible, 
        emplacement,
        categorie,
        image_url
      FROM livres_bibliotheque
      ORDER BY titre ASC
    `);
    
    const livres = result.rows.map(r => ({
      id: r.id,
      titre: r.titre,
      auteur: r.auteur || "-",
      isbn: r.isbn || "-",
      quantite: parseInt(r.quantite || 0),
      disponible: parseInt(r.disponible || 0) > 0,
      emplacement: r.emplacement || "-",
      categorie: getCategorieLibelle(r.categorie, r.titre),
      image_url: r.image_url || null
    }));
    
    return NextResponse.json(livres);
  } catch (error) {
    console.error("Erreur API Publique Bibliothèque:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
