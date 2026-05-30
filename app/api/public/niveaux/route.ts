// app/api/public/niveaux/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT DISTINCT niveau as nom
      FROM classes
      ORDER BY niveau
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json([]);
  }
}