import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. Total Recettes
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE statut = 'valide'
    `);
    const totalRecettes = parseInt(recettesResult.rows[0]?.total || 0);

    // 2. Total Dépenses Mensuelles (Somme des salaires)
    const depensesResult = await query(`
      SELECT COALESCE(SUM(salaire_base), 0) as total 
      FROM personnels
    `);
    const salaireMensuelTotal = parseInt(depensesResult.rows[0]?.total || 0);
    const totalDepenses = salaireMensuelTotal * 9; 

    // 3. Derniers paiements
    const paiementsResult = await query(`
      SELECT 
        p.id, p.montant, p.type_frais as type, p.date_paiement as date, p.statut, p.mode_paiement as mode,
        u.nom as eleve_nom, u.prenom as eleve_prenom,
        c.nom as classe
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      ORDER BY p.date_paiement DESC, p.id DESC
      LIMIT 10
    `);
    const derniersPaiements = paiementsResult.rows.map(row => ({
      id: row.id,
      eleve: `${row.eleve_prenom || ''} ${row.eleve_nom || ''}`.trim() || 'Inconnu',
      classe: row.classe || '-',
      montant: parseInt(row.montant),
      type: row.type || 'Non défini',
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '-',
      statut: row.statut,
      mode: row.mode || '-'
    }));

    // 4. Impayés / En attente
    const impayesResult = await query(`
      SELECT 
        p.id, p.montant, p.type_frais as type, p.date_paiement,
        u.nom as eleve_nom, u.prenom as eleve_prenom,
        c.nom as classe
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE p.statut IN ('en_attente', 'impaye')
      ORDER BY p.date_paiement ASC
    `);
    const impayes = impayesResult.rows.map(row => {
      const datePaiement = row.date_paiement ? new Date(row.date_paiement) : new Date();
      return {
        id: row.id,
        eleve: `${row.eleve_prenom || ''} ${row.eleve_nom || ''}`.trim() || 'Inconnu',
        classe: row.classe || '-',
        montant: parseInt(row.montant),
        type: row.type || 'Non défini',
        retard: Math.max(0, Math.floor((new Date().getTime() - datePaiement.getTime()) / (1000 * 3600 * 24)))
      };
    });

    // 5. Répartition par catégorie
    const categoriesResult = await query(`
      SELECT type_frais, SUM(montant) as montant
      FROM paiements
      WHERE statut = 'valide'
      GROUP BY type_frais
    `);
    const categoriesMap: Record<string, number> = {};
    categoriesResult.rows.forEach(r => {
      const typeStr = r.type_frais ? String(r.type_frais) : 'autre';
      // Capitalize first letter
      const formattedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
      categoriesMap[formattedType] = (categoriesMap[formattedType] || 0) + parseInt(r.montant);
    });

    const totalCategories = Object.values(categoriesMap).reduce((a, b) => a + b, 0) || 1;
    const categoriesRecettes = Object.keys(categoriesMap).map(type => ({
      name: type,
      montant: categoriesMap[type],
      pourcentage: Math.round((categoriesMap[type] / totalCategories) * 100),
    }));

    // 6. Evolution mensuelle
    const evolutionResult = await query(`
      SELECT 
        TO_CHAR(date_paiement, 'YYYY-MM') as mois_str,
        SUM(montant) as recettes
      FROM paiements
      WHERE statut = 'valide'
      GROUP BY TO_CHAR(date_paiement, 'YYYY-MM')
      ORDER BY mois_str ASC
      LIMIT 12
    `);
    
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const evolutionRecettes = evolutionResult.rows.map(row => {
      const parts = row.mois_str ? String(row.mois_str).split('-') : ['2025', '01'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return {
        mois: monthNames[mIdx >= 0 && mIdx < 12 ? mIdx : 0],
        recettes: parseInt(row.recettes),
        depenses: salaireMensuelTotal 
      };
    });

    const totalElevesResult = await query("SELECT COUNT(*) as total FROM eleves WHERE est_inscrit = true");
    const totalClassesResult = await query("SELECT COUNT(*) as total FROM classes");

    const encoursTotal = impayes.reduce((sum, item) => sum + item.montant, 0);

    const stats = {
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      encours: encoursTotal,
      previsionMois: 0,
      tauxRecouvrement: totalRecettes > 0 ? Math.round((totalRecettes / (totalRecettes + encoursTotal)) * 100) : 0,
      nombreEleves: parseInt(totalElevesResult.rows[0]?.total || 0),
      nombreClasses: parseInt(totalClassesResult.rows[0]?.total || 0),
      recettesMois: evolutionRecettes[evolutionRecettes.length - 1]?.recettes || 0,
      depensesMois: salaireMensuelTotal,
      evolutionRecettes: 0,
      evolutionDepenses: 0,
      evolutionSolde: 0
    };

    return NextResponse.json({
      stats,
      derniersPaiements,
      impayes,
      categoriesRecettes,
      evolutionRecettes
    });

  } catch (error) {
    console.error("Erreur Dashboard Comptable:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
