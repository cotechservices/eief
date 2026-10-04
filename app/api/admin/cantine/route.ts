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

    // ===================== 1. MENUS DE LA CANTINE =====================
    const menusResult = await query(`
      SELECT 
        m.id, 
        m.date, 
        m.plat, 
        m.accompagnement, 
        m.dessert, 
        m.regime_special,
        m.prix,
        m.prix_annuel,
        -- ⭐ CALCULER LE PRIX MENSUEL (prix_annuel / 9 mois scolaires)
        CASE 
          WHEN m.prix_annuel IS NOT NULL AND m.prix_annuel > 0 
          THEN m.prix_annuel / 9 
          WHEN m.prix IS NOT NULL AND m.prix > 0 
          THEN m.prix 
          ELSE NULL 
        END as prix_mensuel,
        -- ⭐ Inscrits depuis reserves_cantine
        (SELECT COUNT(*) FROM inscriptions_cantine WHERE est_actif = true) as inscrits,
        -- ⭐ Présents depuis reserves_cantine
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
      prix: r.prix !== null && r.prix !== undefined ? Number(r.prix) : null,
      prix_annuel: r.prix_annuel !== null && r.prix_annuel !== undefined ? Number(r.prix_annuel) : null,
      // ⭐ AJOUTER prix_mensuel
      prix_mensuel: r.prix_mensuel !== null && r.prix_mensuel !== undefined ? Number(r.prix_mensuel) : null,
      inscrits: parseInt(r.inscrits || 0),
      presents: parseInt(r.presents || 0)
    }));

    // ===================== 2. STATISTIQUES GLOBALES =====================

    // ⭐ TOTAL INSCRITS À LA CANTINE (depuis inscriptions_cantine)
    const inscritsTotal = await query(`
      SELECT COUNT(DISTINCT eleve_id) as total 
      FROM inscriptions_cantine 
      WHERE est_actif = true
    `);

    // ⭐ INSCRITS PAR SEXE (depuis inscriptions_cantine)
    const inscritsParSexe = await query(`
      SELECT 
        e.sexe,
        COUNT(DISTINCT e.id) as total
      FROM inscriptions_cantine ic
      JOIN eleves e ON ic.eleve_id = e.id
      WHERE ic.est_actif = true
      GROUP BY e.sexe
    `);

    // ⭐ PRÉ-INSCRIPTIONS AVEC CANTINE (depuis preinscription_cantine)
    const preinscriptionsCantine = await query(`
      SELECT 
        p.id as preinscription_id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.classe,
        p.statut,
        pc.menu_id,
        cm.plat as menu_plat,
        cm.prix_annuel as prix_cantine,
        p.frais_statut,
        p.date_preinscription
      FROM preinscriptions p
      INNER JOIN preinscription_cantine pc ON p.id = pc.preinscription_id
      INNER JOIN cantine_menus cm ON pc.menu_id = cm.id
      WHERE p.statut != 'rejete'
      ORDER BY p.date_preinscription DESC
    `);

    // ⭐ INSCRIPTIONS AVEC CANTINE (élèves inscrits)
    const inscriptionsCantine = await query(`
      SELECT 
        e.id as eleve_id,
        e.matricule,
        e.sexe,
        e.classe_id,
        c.nom as classe_nom,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        ic.id as inscription_cantine_id,
        ic.est_actif,
        ic.solde,
        ic.date_inscription
      FROM inscriptions_cantine ic
      INNER JOIN eleves e ON ic.eleve_id = e.id
      INNER JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE ic.est_actif = true
      ORDER BY ic.date_inscription DESC
    `);

    // ⭐ RÉINSCRIPTIONS AVEC CANTINE (depuis echeances_paiement)
    const reinscriptionsCantine = await query(`
      SELECT 
        r.id as reinscription_id,
        r.numero_dossier,
        r.enfant_nom,
        r.enfant_prenom,
        r.classe_nom,
        r.statut,
        r.date_reinscription,
        r.frais_statut,
        COALESCE(
          (SELECT SUM(e.montant) 
           FROM echeances_paiement e 
           WHERE e.reinscription_id = r.id AND e.type = 'cantine'),
          0
        ) as montant_cantine
      FROM reinscriptions r
      WHERE r.statut != 'rejete'
        AND EXISTS (
          SELECT 1 FROM echeances_paiement e 
          WHERE e.reinscription_id = r.id AND e.type = 'cantine'
        )
      ORDER BY r.date_reinscription DESC
    `);

    // ⭐ MOYENNE DE PRÉSENCES PAR JOUR
    const moyenneJourResult = await query(`
      SELECT AVG(count_presents) as moyenne
      FROM (
        SELECT date, COUNT(*) as count_presents 
        FROM reserves_cantine 
        WHERE est_present = true
        GROUP BY date
      ) sub
    `);

    // ⭐ RECETTES DU MOIS
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE type_frais = 'cantine' AND statut = 'valide'
      AND EXTRACT(MONTH FROM date_paiement) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date_paiement) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // ⭐ RECETTES ANNUELLES
    const recettesAnnuelResult = await query(`
      SELECT COALESCE(SUM(prix_annuel), 0) as total 
      FROM cantine_menus 
      WHERE prix_annuel IS NOT NULL
    `);

    // ⭐ TAUX DE PRÉSENCE
    const totalPresentsQuery = await query(`SELECT COUNT(*) as total FROM reserves_cantine WHERE est_present = true`);
    const totalReservesQuery = await query(`SELECT COUNT(*) as total FROM reserves_cantine`);
    const totalP = parseInt(totalPresentsQuery.rows[0]?.total || 0);
    const totalR = parseInt(totalReservesQuery.rows[0]?.total || 0);

    // ⭐ PRÉSENTS PAR SEXE
    const presentsParSexe = await query(`
      SELECT 
        e.sexe,
        COUNT(DISTINCT rc.eleve_id) as total
      FROM reserves_cantine rc
      JOIN eleves e ON rc.eleve_id = e.id
      WHERE rc.est_present = true
      GROUP BY e.sexe
    `);

    // ⭐ CALCULS DES STATISTIQUES
    const totalInscrits = parseInt(inscritsTotal.rows[0]?.total || 0);
    const totalGarcons = parseInt(inscritsParSexe.rows.find((r: any) => r.sexe === 'M')?.total || 0);
    const totalFilles = parseInt(inscritsParSexe.rows.find((r: any) => r.sexe === 'F')?.total || 0);
    const presentsGarcons = parseInt(presentsParSexe.rows.find((r: any) => r.sexe === 'M')?.total || 0);
    const presentsFilles = parseInt(presentsParSexe.rows.find((r: any) => r.sexe === 'F')?.total || 0);
    const moyenneJour = Math.round(parseFloat(moyenneJourResult.rows[0]?.moyenne || 0));
    const recettesMois = parseInt(recettesResult.rows[0]?.total || 0);
    const recettesAnnuel = parseInt(recettesAnnuelResult.rows[0]?.total || 0);
    const tauxPresence = totalR > 0 ? Math.round((totalP / totalR) * 100) : 0;
    const totalMenus = menus.length;
    const nbMenusAvecPrix = menus.filter(m => m.prix_annuel !== null).length;
    
    // ⭐ RECETTE TOTALE RÉELLE (prix_annuel * inscrits)
    const recetteTotaleReelle = menus.reduce((sum, m) => {
      return sum + ((m.prix_annuel || 0) * m.inscrits);
    }, 0);

    const recetteMoyenneParMenu = totalMenus > 0 ? 
      menus.reduce((sum, m) => sum + (m.prix_annuel || 0), 0) / totalMenus : 0;

    // ===================== 3. STRUCTURE DE LA RÉPONSE =====================
    const stats = {
      totalInscrits: totalInscrits,
      totalGarcons: totalGarcons,
      totalFilles: totalFilles,
      moyenneJour: moyenneJour,
      recettesMois: recettesMois,
      recettesAnnuel: recettesAnnuel,
      recetteTotaleReelle: recetteTotaleReelle,
      tauxPresence: tauxPresence,
      totalMenus: totalMenus,
      nbMenusAvecPrix: nbMenusAvecPrix,
      recetteMoyenneParMenu: Math.round(recetteMoyenneParMenu),
      presentsGarcons: presentsGarcons,
      presentsFilles: presentsFilles,
      preinscriptions: preinscriptionsCantine.rows.map((r: any) => ({
        id: r.preinscription_id,
        numero_dossier: r.numero_dossier,
        enfant_nom: r.enfant_nom,
        enfant_prenom: r.enfant_prenom,
        classe: r.classe,
        statut: r.statut,
        menu_plat: r.menu_plat,
        prix_cantine: Number(r.prix_cantine) || 0,
        frais_statut: r.frais_statut,
        date: r.date_preinscription
      })),
      inscriptions: inscriptionsCantine.rows.map((r: any) => ({
        eleve_id: r.eleve_id,
        matricule: r.matricule,
        sexe: r.sexe,
        enfant_nom: r.enfant_nom,
        enfant_prenom: r.enfant_prenom,
        classe_nom: r.classe_nom || 'Non assigné',
        est_actif: r.est_actif,
        solde: Number(r.solde) || 0,
        date_inscription: r.date_inscription
      })),
      reinscriptions: reinscriptionsCantine.rows.map((r: any) => ({
        id: r.reinscription_id,
        numero_dossier: r.numero_dossier,
        enfant_nom: r.enfant_nom,
        enfant_prenom: r.enfant_prenom,
        classe_nom: r.classe_nom,
        statut: r.statut,
        montant_cantine: Number(r.montant_cantine) || 0,
        frais_statut: r.frais_statut,
        date: r.date_reinscription
      }))
    };

    return NextResponse.json({ menus, stats });
  } catch (error) {
    console.error("Erreur API Cantine:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ POST - Ajouter un menu
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { date, plat, accompagnement, dessert, regime_special, prix_mensuel, prix_annuel } = body;

    // ⭐ SI UN SEUL PRIX EST FOURNI, CALCULER L'AUTRE
    let prixMensuelFinal = prix_mensuel ? parseInt(prix_mensuel) : null;
    let prixAnnuelFinal = prix_annuel ? parseInt(prix_annuel) : null;

    if (prixAnnuelFinal && !prixMensuelFinal) {
      prixMensuelFinal = Math.round(prixAnnuelFinal / 9);
    }
    if (prixMensuelFinal && !prixAnnuelFinal) {
      prixAnnuelFinal = prixMensuelFinal * 9;
    }

    const result = await query(`
      INSERT INTO cantine_menus (date, plat, accompagnement, dessert, regime_special, prix, prix_annuel)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      date || new Date().toISOString().split('T')[0], 
      plat, 
      accompagnement || '', 
      dessert || '', 
      regime_special || false,
      prixMensuelFinal,
      prixAnnuelFinal
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Menu ajouté avec succès",
      menu: result.rows[0] 
    });
  } catch (error) {
    console.error("Erreur API Cantine (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ PUT - Modifier un menu
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_CANTINE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, plat, accompagnement, dessert, regime_special, prix_mensuel, prix_annuel } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // ⭐ SI UN SEUL PRIX EST FOURNI, CALCULER L'AUTRE
    let prixMensuelFinal = prix_mensuel ? parseInt(prix_mensuel) : null;
    let prixAnnuelFinal = prix_annuel ? parseInt(prix_annuel) : null;

    if (prixAnnuelFinal && !prixMensuelFinal) {
      prixMensuelFinal = Math.round(prixAnnuelFinal / 9);
    }
    if (prixMensuelFinal && !prixAnnuelFinal) {
      prixAnnuelFinal = prixMensuelFinal * 9;
    }

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
      date || new Date().toISOString().split('T')[0], 
      plat, 
      accompagnement || '', 
      dessert || '', 
      regime_special || false,
      prixMensuelFinal,
      prixAnnuelFinal,
      id
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Menu modifié avec succès" 
    });
  } catch (error) {
    console.error("Erreur API Cantine (PUT):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ DELETE - Supprimer un menu
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

    // Supprimer les références
    await query('DELETE FROM preinscription_cantine WHERE menu_id = $1', [id]);
    await query('DELETE FROM reservations_cantine WHERE menu_id = $1', [id]);

    const result = await query('DELETE FROM cantine_menus WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Menu non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Menu supprimé avec succès" 
    });
  } catch (error) {
    console.error("Erreur API Cantine (DELETE):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}