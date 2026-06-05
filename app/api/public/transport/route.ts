import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        b.id, b.immatriculation, b.chauffeur_nom as chauffeur, b.chauffeur_tel, b.capacite,
        l.nom as trajet, l.horaire_matin, l.horaire_soir
      FROM bus b
      LEFT JOIN lignes_transport l ON l.bus_id = b.id
      ORDER BY b.id ASC
    `);
    const transport = result.rows.map(r => ({
      id: r.id,
      immatriculation: r.immatriculation,
      chauffeur: r.chauffeur || "Non assigné",
      chauffeur_tel: r.chauffeur_tel || "-",
      capacite: r.capacite || 0,
      trajet: r.trajet || "Aucun trajet",
      horaireMatin: r.horaire_matin || "-",
      horaireSoir: r.horaire_soir || "-"
    }));
    return NextResponse.json(transport);
  } catch (error) {
    console.error("Erreur API Publique Transport:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
