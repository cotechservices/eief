// app/api/admin/cantine/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Menus de la semaine/mois avec le prix et prix_annuel
    const menusResult = await query(`
      SELECT 
        m.id, 
        m.date, 
        m.plat, 
        m.accompagnement, 
        m.dessert, 
        m.regime_special,
        COALESCE(m.prix, 5000) as prix,
        COALESCE(m.prix_annuel, 0) as prix_annuel,
        (SELECT COUNT(*) FROM reserves_cantine r WHERE r.date = m.date) as inscrits,
        (SELECT COUNT(*) FROM reserves_cantine r WHERE r.date = m.date AND r.est_present = true) as presents
      FROM cantine_menus m
      ORDER BY m.date DESC
      LIMIT 30
    `);

    const menus = menusResult.rows.map(r => ({
      id: r.id,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : "",
      plat: r.plat || "-",
      accompagnement: r.accompagnement || "-",
      dessert: r.dessert || "-",
      regime_special: r.regime_special || false,
      prix: Number(r.prix) || 5000,
      prix_annuel: Number(r.prix_annuel) || 0,
      inscrits: parseInt(r.inscrits || 0),
      presents: parseInt(r.presents || 0)
    }));

    // 2. Statistiques globales
    const inscritsTotal = await query(`
      SELECT COUNT(DISTINCT eleve_id) as total FROM paiements WHERE type_frais = 'cantine' AND statut = 'valide'
    `);
    
    // Moyenne de présences par jour
    const moyenneJourResult = await query(`
      SELECT AVG(count_presents) as moyenne
      FROM (
        SELECT date, COUNT(*) as count_presents 
        FROM reserves_cantine 
        WHERE est_present = true
        GROUP BY date
      ) sub
    `);
    
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE type_frais = 'cantine' AND statut = 'valide'
      AND EXTRACT(MONTH FROM date_paiement) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date_paiement) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Taux de présence moyen
    const totalPresentsQuery = await query(`SELECT COUNT(*) as total FROM reserves_cantine WHERE est_present = true`);
    const totalReservesQuery = await query(`SELECT COUNT(*) as total FROM reserves_cantine`);
    const totalP = parseInt(totalPresentsQuery.rows[0]?.total || 0);
    const totalR = parseInt(totalReservesQuery.rows[0]?.total || 0);

    const stats = {
      totalInscrits: parseInt(inscritsTotal.rows[0]?.total || 0),
      moyenneJour: Math.round(parseFloat(moyenneJourResult.rows[0]?.moyenne || 0)),
      recettesMois: parseInt(recettesResult.rows[0]?.total || 0),
      tauxPresence: totalR > 0 ? Math.round((totalP / totalR) * 100) : 0
    };

    return NextResponse.json({ menus, stats });
  } catch (error) {
    console.error("Erreur API Cantine:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { date, plat, accompagnement, dessert, regime_special, prix, prix_annuel } = body;

    const result = await query(`
      INSERT INTO cantine_menus (date, plat, accompagnement, dessert, regime_special, prix, prix_annuel)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      date, 
      plat, 
      accompagnement, 
      dessert, 
      regime_special || false,
      prix || 5000,
      prix_annuel || 0
    ]);

    return NextResponse.json({ success: true, menu: result.rows[0] });
  } catch (error) {
    console.error("Erreur API Cantine (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, plat, accompagnement, dessert, regime_special, prix, prix_annuel } = body;

    await query(`
      UPDATE cantine_menus 
      SET date = $1, 
          plat = $2, 
          accompagnement = $3, 
          dessert = $4, 
          regime_special = $5,
          prix = $6,
          prix_annuel = $7
      WHERE id = $8
    `, [
      date, 
      plat, 
      accompagnement, 
      dessert, 
      regime_special || false,
      prix || 5000,
      prix_annuel || 0,
      id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Cantine (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await query('DELETE FROM cantine_menus WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API Cantine (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}