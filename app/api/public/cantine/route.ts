import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT id, date, plat, accompagnement, dessert, regime_special
      FROM cantine_menus
      ORDER BY date DESC
      LIMIT 15
    `);
    const menus = result.rows.map(r => ({
      id: r.id,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : "",
      plat: r.plat || "-",
      accompagnement: r.accompagnement || "-",
      dessert: r.dessert || "-",
      regime_special: r.regime_special
    }));
    return NextResponse.json(menus);
  } catch (error) {
    console.error("Erreur API Publique Cantine:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
