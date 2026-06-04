// app/api/parent/cantine/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Email utilisateur non trouvé" }, { status: 400 });
    }

    // Récupérer les enfants avec leurs inscriptions à la cantine
    const enfantsResult = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        ic.id as inscription_cantine_id,
        ic.est_actif as cantine_actif,
        ic.solde,
        ic.preferences_alimentaires,
        ic.allergies
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions_cantine ic ON e.id = ic.eleve_id AND ic.est_actif = true
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $1 AND e.est_inscrit = true
      ORDER BY e.id
    `, [userEmail]);

    // Si aucun enfant trouvé, retourner des données vides
    if (enfantsResult.rows.length === 0) {
      return NextResponse.json({
        enfants: [],
        menus: [],
        reservations: []
      });
    }

    // Récupérer les menus de la semaine
    const menusResult = await query(`
      SELECT 
        id,
        date,
        plat,
        accompagnement,
        dessert,
        prix,
        allergenes,
        calories
      FROM menus_cantine
      WHERE date >= CURRENT_DATE 
        AND date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY date
    `);

    // Récupérer les réservations existantes
    const enfantIds = enfantsResult.rows.map((e: any) => e.id);
    let reservationsResult = { rows: [] };
    
    if (enfantIds.length > 0) {
      reservationsResult = await query(`
        SELECT 
          rc.id,
          rc.eleve_id as enfant_id,
          rc.menu_id as menu_id,
          rc.date,
          rc.statut,
          rc.paye
        FROM reservations_cantine rc
        WHERE rc.eleve_id = ANY($1::int[])
          AND rc.date >= CURRENT_DATE
          AND rc.statut = 'confirmee'
      `, [enfantIds]);
    }

    // Formater les données
    const enfantsData = enfantsResult.rows.map((e: any) => ({
      id: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      classe: e.classe_nom,
      inscritCantine: e.cantine_actif === true,
      solde: parseFloat(e.solde) || 0,
      preferences: e.preferences_alimentaires ? JSON.parse(e.preferences_alimentaires) : [],
      allergies: e.allergies ? JSON.parse(e.allergies) : [],
      menusReserves: reservationsResult.rows.filter((r: any) => r.enfant_id === e.id).length
    }));

    const menusData = menusResult.rows.map((m: any) => ({
      id: m.id,
      date: m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date,
      jour: new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
      plat: m.plat,
      accompagnement: m.accompagnement,
      dessert: m.dessert,
      prix: parseFloat(m.prix),
      allergenes: m.allergenes ? JSON.parse(m.allergenes) : [],
      calories: m.calories
    }));

    const reservationsData = reservationsResult.rows.map((r: any) => ({
      id: r.id,
      enfantId: r.enfant_id,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      menuId: r.menu_id,
      statut: r.statut,
      paye: r.paye
    }));

    return NextResponse.json({
      enfants: enfantsData,
      menus: menusData,
      reservations: reservationsData
    });
    
  } catch (error) {
    console.error("Erreur GET cantine:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue") 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { enfantId, menuIds, quantities, total } = body;

    if (!enfantId || !menuIds || !quantities || !total) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier le solde
    const soldeResult = await query(`
      SELECT solde FROM inscriptions_cantine
      WHERE eleve_id = $1 AND est_actif = true
    `, [enfantId]);

    if (soldeResult.rows.length === 0) {
      return NextResponse.json({ error: "Enfant non inscrit à la cantine" }, { status: 400 });
    }

    const soldeActuel = parseFloat(soldeResult.rows[0].solde);
    
    if (soldeActuel < total) {
      return NextResponse.json({ 
        error: `Solde insuffisant. Solde actuel: ${soldeActuel.toLocaleString()} GNF` 
      }, { status: 400 });
    }

    // Créer les réservations
    const reservations = [];
    for (const menuId of menuIds) {
      const qty = quantities[menuId];
      if (!qty) continue;
      
      // Récupérer la date du menu
      const menuResult = await query(`
        SELECT date, prix FROM menus_cantine WHERE id = $1
      `, [parseInt(menuId)]);
      
      if (menuResult.rows.length === 0) continue;
      
      const menuDate = menuResult.rows[0].date;
      const menuPrix = parseFloat(menuResult.rows[0].prix);
      
      for (let i = 0; i < qty; i++) {
        const result = await query(`
          INSERT INTO reservations_cantine (eleve_id, menu_id, date, statut, paye)
          VALUES ($1, $2, $3, 'confirmee', false)
          RETURNING id, eleve_id as enfant_id, menu_id as menu_id, date, statut, paye
        `, [enfantId, parseInt(menuId), menuDate]);
        
        reservations.push({
          id: result.rows[0].id,
          enfantId: result.rows[0].enfant_id,
          menuId: result.rows[0].menu_id,
          date: result.rows[0].date instanceof Date ? result.rows[0].date.toISOString().split('T')[0] : result.rows[0].date,
          statut: result.rows[0].statut,
          paye: result.rows[0].paye
        });
      }
    }

    // Débiter le solde
    await query(`
      UPDATE inscriptions_cantine
      SET solde = solde - $1
      WHERE eleve_id = $2
    `, [total, enfantId]);

    // Créer une transaction de débit
    await query(`
      INSERT INTO transactions_cantine (eleve_id, montant, type, description, date)
      VALUES ($1, $2, 'debit', 'Réservation repas', NOW())
    `, [enfantId, total]);

    const nouveauSolde = soldeActuel - total;

    return NextResponse.json({ 
      success: true, 
      reservations,
      nouveauSolde
    });
    
  } catch (error) {
    console.error("Erreur POST cantine:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue") 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, enfantId, menuId } = body;

    if (!reservationId || !enfantId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Récupérer le prix du menu
    const menuResult = await query(`
      SELECT m.prix, rc.date
      FROM reservations_cantine rc
      JOIN menus_cantine m ON rc.menu_id = m.id
      WHERE rc.id = $1 AND rc.eleve_id = $2
    `, [reservationId, enfantId]);

    if (menuResult.rows.length === 0) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    const prix = parseFloat(menuResult.rows[0].prix);

    // Supprimer la réservation
    await query(`
      DELETE FROM reservations_cantine
      WHERE id = $1 AND eleve_id = $2
    `, [reservationId, enfantId]);

    // Recréditer le solde
    await query(`
      UPDATE inscriptions_cantine
      SET solde = solde + $1
      WHERE eleve_id = $2
    `, [prix, enfantId]);

    // Créer une transaction de crédit
    await query(`
      INSERT INTO transactions_cantine (eleve_id, montant, type, description, date)
      VALUES ($1, $2, 'credit', 'Annulation réservation', NOW())
    `, [enfantId, prix]);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Erreur DELETE cantine:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error instanceof Error ? error.message : "Erreur inconnue") 
    }, { status: 500 });
  }
}