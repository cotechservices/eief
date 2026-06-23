// app/api/public/cantine/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // ⭐ Supprimer la condition WHERE date >= CURRENT_DATE
    // ⭐ Récupérer tous les menus avec un prix_annuel valide
    const result = await query(`
      SELECT 
        id, 
        plat, 
        accompagnement, 
        dessert, 
        prix,
        prix_annuel,
        regime_special
      FROM cantine_menus
      WHERE prix_annuel IS NOT NULL AND prix_annuel > 0
      ORDER BY prix_annuel ASC
      LIMIT 10
    `);

    // Si aucun menu n'existe, créer un menu par défaut
    if (result.rows.length === 0) {
      return NextResponse.json([{
        id: 0,
        plat: "Cantine scolaire",
        accompagnement: "",
        dessert: "",
        prix: 0,
        prix_annuel: 2500000,
        regime_special: false
      }]);
    }

    const menus = result.rows.map(r => ({
      id: r.id,
      plat: r.plat || "Menu du jour",
      accompagnement: r.accompagnement || "",
      dessert: r.dessert || "",
      prix: Number(r.prix) || 0,
      prix_annuel: Number(r.prix_annuel) || 0,
      regime_special: r.regime_special || false
    }));

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Erreur API Publique Cantine:", error);
    return NextResponse.json([], { status: 200 });
  }
}