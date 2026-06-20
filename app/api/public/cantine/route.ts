// app/api/public/cantine/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        id, 
        date, 
        plat, 
        accompagnement, 
        dessert, 
        prix,
        prix_annuel,
        regime_special
      FROM cantine_menus
      WHERE date >= CURRENT_DATE
      ORDER BY date ASC
      LIMIT 30
    `);

    const menus = result.rows.map(r => ({
      id: r.id,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : "",
      plat: r.plat || "Menu du jour",
      accompagnement: r.accompagnement || "",
      dessert: r.dessert || "",
      prix: Number(r.prix) || 5000,
      prix_annuel: Number(r.prix_annuel) || 0,
      regime_special: r.regime_special || false
    }));

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Erreur API Publique Cantine:", error);
    return NextResponse.json([], { status: 200 });
  }
}