// app/api/comptable/dashboard/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Total Recettes (paiements élèves valides)
    const recettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements
      WHERE statut IN ('valide', 'paye')
    `);
    const totalRecettes = Number(recettesResult.rows[0]?.total || 0);

    // 2. Recettes du mois en cours
    const recettesMoisResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements
      WHERE statut IN ('valide', 'paye')
      AND EXTRACT(MONTH FROM date_paiement) = $1
      AND EXTRACT(YEAR FROM date_paiement) = $2
    `, [currentMonth, currentYear]);
    const recettesMois = Number(recettesMoisResult.rows[0]?.total || 0);

    // 3. Total Dépenses (salaires + autres)
    const salairesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements_salaires
      WHERE statut = 'paye'
    `);
    const depensesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM depenses
      WHERE COALESCE(statut, 'valide') = 'valide'
    `);
    const totalSalaires = Number(salairesResult.rows[0]?.total || 0);
    const totalAutresDepenses = Number(depensesResult.rows[0]?.total || 0);
    const totalDepenses = totalSalaires + totalAutresDepenses;

    // 4. Dépenses du mois - ✅ CORRIGÉ : dateDepense → date_depense
    const depensesMoisResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM depenses
      WHERE COALESCE(statut, 'valide') = 'valide'
      AND EXTRACT(MONTH FROM COALESCE(date_depense, NOW())) = $1
      AND EXTRACT(YEAR FROM COALESCE(date_depense, NOW())) = $2
    `, [currentMonth, currentYear]);
    const depensesMois = Number(depensesMoisResult.rows[0]?.total || 0);

    // 5. Impayés
    const encours = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements
      WHERE statut IN ('en_attente', 'impaye')
    `);
    const encoursTotal = Number(encours.rows[0]?.total || 0);

    // 6. Derniers paiements (tous types : élèves, préinscriptions, réinscriptions)
    const derniersPaiementsResult = await query(`
      SELECT
        p.id,
        COALESCE(
          NULLIF(TRIM(CONCAT(u.prenom, ' ', u.nom)), ''),
          NULLIF(TRIM(CONCAT(pre.enfant_prenom, ' ', pre.enfant_nom)), ''),
          NULLIF(TRIM(CONCAT(rein.enfant_prenom, ' ', rein.enfant_nom)), ''),
          'Élève'
        ) as eleve,
        COALESCE(c.nom, pre.classe, rein.classe_nom, '-') as classe,
        p.montant,
        p.type_frais as type,
        TO_CHAR(p.date_paiement, 'DD/MM/YYYY') as date,
        p.statut,
        p.mode_paiement as mode
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN preinscriptions pre ON p.preinscription_id = pre.id
      LEFT JOIN reinscriptions rein ON p.reinscription_id = rein.id
      WHERE p.statut IN ('valide', 'paye')
      ORDER BY p.date_paiement DESC, p.id DESC
      LIMIT 10
    `);

    // 7. Répartition par catégorie de recettes
    const categoriesResult = await query(`
      SELECT
        COALESCE(type_frais, 'Autre') as name,
        SUM(montant) as montant
      FROM paiements
      WHERE statut IN ('valide', 'paye')
      GROUP BY type_frais
      ORDER BY montant DESC
    `);
    const categoriesRecettes = categoriesResult.rows.map(cat => ({
      name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      montant: Number(cat.montant),
      pourcentage: totalRecettes > 0 ? Math.round((Number(cat.montant) / totalRecettes) * 100) : 0
    }));

    // 8. Évolution mensuelle (Systématiquement les 12 mois de Janvier à Décembre de l'année en cours)
    const MOIS_NOMS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    const evolutionRecettes = await Promise.all(
      monthsArray.map(async (m) => {
        const recettesRes = await query(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements 
          WHERE statut IN ('valide', 'paye')
            AND EXTRACT(MONTH FROM date_paiement) = $1
            AND EXTRACT(YEAR FROM date_paiement) = $2
        `, [m, currentYear]);

        const depensesRes = await query(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM depenses 
          WHERE COALESCE(statut, 'valide') = 'valide'
            AND EXTRACT(MONTH FROM COALESCE(date_depense, NOW())) = $1
            AND EXTRACT(YEAR FROM COALESCE(date_depense, NOW())) = $2
        `, [m, currentYear]);

        const salairesRes = await query(`
          SELECT COALESCE(SUM(montant), 0) as total
          FROM paiements_salaires
          WHERE statut = 'paye'
            AND mois = $1
            AND annee = $2
        `, [m, currentYear]);

        const totalRecettesMois = Number(recettesRes.rows[0]?.total || 0);
        const totalDepensesMois = Number(depensesRes.rows[0]?.total || 0) + Number(salairesRes.rows[0]?.total || 0);

        return {
          mois: `${MOIS_NOMS_FR[m - 1]} ${currentYear}`,
          num_mois: m,
          num_annee: currentYear,
          recettes: totalRecettesMois,
          depenses: totalDepensesMois
        };
      })
    );

    // 9. Statistiques masse salariale
    const masseSalarialeMoisResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements_salaires
      WHERE statut = 'paye' AND mois = $1 AND annee = $2
    `, [currentMonth, currentYear]);
    const masseSalarialeMois = Number(masseSalarialeMoisResult.rows[0]?.total || 0);

    // 10. Répartition des dépenses par catégorie
    const depensesCategResult = await query(`
      SELECT categorie as name, SUM(montant) as montant
      FROM depenses
      WHERE COALESCE(statut, 'valide') = 'valide'
      GROUP BY categorie
      ORDER BY montant DESC
    `);
    const categoriesDepenses = depensesCategResult.rows.map(cat => ({
      name: cat.name,
      montant: Number(cat.montant),
      pourcentage: totalDepenses > 0 ? Math.round((Number(cat.montant) / totalDepenses) * 100) : 0
    }));

    // 11. Nombre d'élèves et classes
    const elevesResult = await query("SELECT COUNT(*) as total FROM eleves WHERE est_inscrit = true");
    const classesResult = await query("SELECT COUNT(*) as total FROM classes");
    const personnelResult = await query("SELECT COUNT(*) as total FROM personnels p JOIN utilisateurs u ON p.utilisateur_id = u.id WHERE u.est_actif = true");

    const stats = {
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      encours: encoursTotal,
      recettesMois,
      depensesMois,
      masseSalarialeMois,
      tauxRecouvrement: totalRecettes > 0 ? Math.round((totalRecettes / (totalRecettes + encoursTotal)) * 100) : 0,
      nombreEleves: Number(elevesResult.rows[0]?.total || 0),
      nombreClasses: Number(classesResult.rows[0]?.total || 0),
      nombrePersonnel: Number(personnelResult.rows[0]?.total || 0)
    };

    return NextResponse.json({
      stats,
      derniersPaiements: derniersPaiementsResult.rows,
      impayes: [],
      categoriesRecettes,
      categoriesDepenses,
      evolutionRecettes
    });

  } catch (error) {
    console.error("Erreur Dashboard Comptable:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}