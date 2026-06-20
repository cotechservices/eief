// app/api/public/transport/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        l.id,
        l.nom,
        l.prix_abonnement as prix,
        l.horaire_matin,
        l.horaire_soir,
        b.id as bus_id,
        b.immatriculation,
        b.chauffeur_nom as chauffeur,
        b.chauffeur_tel,
        b.capacite,
        (SELECT COUNT(*) FROM inscriptions_transport WHERE ligne_id = l.id AND est_actif = true) as inscrits
      FROM lignes_transport l
      LEFT JOIN bus b ON l.bus_id = b.id
      WHERE l.prix_abonnement IS NOT NULL AND l.prix_abonnement > 0
      ORDER BY l.nom ASC
    `);
    
    const transport = result.rows.map(r => ({
      id: r.id,
      nom: r.nom || "Transport scolaire",
      prix: Number(r.prix) || 0,
      horaire_matin: r.horaire_matin || "07:30",
      horaire_soir: r.horaire_soir || "16:30",
      bus_id: r.bus_id,
      immatriculation: r.immatriculation || "Non assigné",
      chauffeur: r.chauffeur || "Non assigné",
      chauffeur_tel: r.chauffeur_tel || "",
      capacite: r.capacite || 0,
      inscrits: Number(r.inscrits) || 0
    }));
    
    return NextResponse.json(transport);
  } catch (error) {
    console.error("Erreur API Publique Transport:", error);
    return NextResponse.json([], { status: 200 });
  }
}