// app/api/admin/transport/route.ts
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

    // 1. Liste des bus et leurs trajets avec prix_abonnement
    const busResult = await query(`
      SELECT 
        b.id, 
        b.immatriculation, 
        b.chauffeur_nom as chauffeur, 
        b.chauffeur_tel,
        b.capacite,
        l.id as ligne_id,
        l.nom as trajet, 
        l.horaire_matin, 
        l.horaire_soir,
        l.prix_abonnement,
        (SELECT COUNT(*) FROM inscriptions_transport i WHERE i.ligne_id = l.id AND i.est_actif = true) as inscrits
      FROM bus b
      LEFT JOIN lignes_transport l ON l.bus_id = b.id
      ORDER BY b.id ASC
    `);

    const bus = busResult.rows.map(r => ({
      id: r.id,
      immatriculation: r.immatriculation,
      chauffeur: r.chauffeur || "Non assigné",
      chauffeur_tel: r.chauffeur_tel || "",
      capacite: r.capacite || 0,
      inscrits: parseInt(r.inscrits || 0),
      trajet: r.trajet || "Aucun trajet",
      horaireMatin: r.horaire_matin || "-",
      horaireSoir: r.horaire_soir || "-",
      prix_abonnement: parseInt(r.prix_abonnement) || 0, // ⭐ Ajout du prix
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_TRANSPORT")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      immatriculation, 
      chauffeur, 
      chauffeur_tel, 
      capacite, 
      trajet, 
      horaireMatin, 
      horaireSoir,
      prix_abonnement  // ⭐ Ajout du prix
    } = body;

    // 1. Insérer le bus
    const busResult = await query(`
      INSERT INTO bus (immatriculation, capacite, chauffeur_nom, chauffeur_tel)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [immatriculation, parseInt(capacite || 0), chauffeur, chauffeur_tel || null]);

    const busId = busResult.rows[0].id;

    // 2. Insérer la ligne de transport associée avec prix_abonnement
    if (trajet) {
      await query(`
        INSERT INTO lignes_transport (nom, bus_id, horaire_matin, horaire_soir, prix_abonnement)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        trajet, 
        busId, 
        horaireMatin || null, 
        horaireSoir || null,
        parseInt(prix_abonnement) || 0  // ⭐ Insertion du prix
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Transport (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_TRANSPORT")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      immatriculation, 
      chauffeur, 
      chauffeur_tel, 
      capacite, 
      trajet, 
      horaireMatin, 
      horaireSoir,
      prix_abonnement  // ⭐ Ajout du prix
    } = body;

    // 1. Mettre à jour le bus
    await query(`
      UPDATE bus
      SET immatriculation = $1, capacite = $2, chauffeur_nom = $3, chauffeur_tel = $4
      WHERE id = $5
    `, [immatriculation, parseInt(capacite || 0), chauffeur, chauffeur_tel || null, id]);

    // 2. Mettre à jour ou insérer la ligne de transport avec prix_abonnement
    const ligneCheck = await query('SELECT id FROM lignes_transport WHERE bus_id = $1', [id]);
    if (ligneCheck.rows.length > 0) {
      await query(`
        UPDATE lignes_transport
        SET nom = $1, horaire_matin = $2, horaire_soir = $3, prix_abonnement = $4
        WHERE bus_id = $5
      `, [
        trajet, 
        horaireMatin || null, 
        horaireSoir || null,
        parseInt(prix_abonnement) || 0,  // ⭐ Mise à jour du prix
        id
      ]);
    } else if (trajet) {
      await query(`
        INSERT INTO lignes_transport (nom, bus_id, horaire_matin, horaire_soir, prix_abonnement)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        trajet, 
        id, 
        horaireMatin || null, 
        horaireSoir || null,
        parseInt(prix_abonnement) || 0  // ⭐ Insertion du prix
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Transport (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_TRANSPORT")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    // Récupérer la ligne pour supprimer ses inscriptions d'abord
    const ligneResult = await query('SELECT id FROM lignes_transport WHERE bus_id = $1', [id]);
    const ligneIds = ligneResult.rows.map(r => r.id);

    if (ligneIds.length > 0) {
      await query(`DELETE FROM inscriptions_transport WHERE ligne_id = ANY($1)`, [ligneIds]);
      await query(`DELETE FROM lignes_transport WHERE bus_id = $1`, [id]);
    }

    await query('DELETE FROM bus WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Transport (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}