import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_TRANSPORT")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Liste des bus et leurs trajets
    const busResult = await query(`
      SELECT 
        b.id, b.immatriculation, b.chauffeur_nom as chauffeur, b.capacite,
        l.nom as trajet, l.horaire_matin, l.horaire_soir,
        (SELECT COUNT(*) FROM inscriptions_transport i WHERE i.ligne_id = l.id AND i.est_actif = true) as inscrits
      FROM bus b
      LEFT JOIN lignes_transport l ON l.bus_id = b.id
      ORDER BY b.id ASC
    `);

    const bus = busResult.rows.map(r => ({
      id: r.id,
      immatriculation: r.immatriculation,
      chauffeur: r.chauffeur || "Non assigné",
      capacite: r.capacite || 0,
      inscrits: parseInt(r.inscrits || 0),
      trajet: r.trajet || "Aucun trajet",
      horaireMatin: r.horaire_matin || "-",
      horaireSoir: r.horaire_soir || "-",
      statut: "actif"
    }));

    // 2. Statistiques globales
    const totalBus = bus.length;
    const totalInscrits = bus.reduce((acc, curr) => acc + curr.inscrits, 0);
    const capaciteTotale = bus.reduce((acc, curr) => acc + curr.capacite, 0);
    const tauxRemplissage = capaciteTotale > 0 ? Math.round((totalInscrits / capaciteTotale) * 100) : 0;
    
    // Recettes Transport (Mois en cours)
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE type_frais = 'transport' AND statut = 'valide'
      AND EXTRACT(MONTH FROM date_paiement) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date_paiement) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);
    const recettesMois = parseInt(recettesResult.rows[0]?.total || 0);

    const stats = {
      totalBus,
      totalInscrits,
      tauxRemplissage,
      recettesMois
    };

    return NextResponse.json({ bus, stats });
  } catch (error) {
    console.error("Erreur API Transport:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
