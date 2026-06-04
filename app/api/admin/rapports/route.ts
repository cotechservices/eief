// app/api/admin/rapports/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // 1. KPI globaux
    const totalElevesResult = await query(`SELECT COUNT(*) as count FROM eleves WHERE est_inscrit = true`);
    const totalEleves = parseInt(totalElevesResult.rows[0]?.count || 0);

    const totalPersonnelResult = await query(`
      SELECT COUNT(*) as count 
      FROM personnels p 
      JOIN utilisateurs u ON p.utilisateur_id = u.id 
      WHERE u.est_actif = true
    `);
    const totalPersonnel = parseInt(totalPersonnelResult.rows[0]?.count || 0);

    // Recettes totales (somme de tous les paiements valides)
    const totalRecettesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE statut IN ('valide', 'paye')
    `);
    const totalRecettes = parseInt(totalRecettesResult.rows[0]?.total || 0);

    // Masse salariale totale payée
    const totalSalairesResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements_salaires 
      WHERE statut = 'paye'
    `);
    const totalSalaires = parseInt(totalSalairesResult.rows[0]?.total || 0);

    // 2. Évolution des recettes (6 derniers mois)
    const evolutionResult = await query(`
      SELECT 
        TO_CHAR(date_paiement, 'YYYY-MM') as mois,
        SUM(montant) as total
      FROM paiements
      WHERE statut IN ('valide', 'paye')
      GROUP BY TO_CHAR(date_paiement, 'YYYY-MM')
      ORDER BY mois DESC
      LIMIT 6
    `);
    
    // Formatter les mois (ex: "Jan", "Fév") et trier chronologiquement
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const evolutionStats = evolutionResult.rows.reverse().map(row => {
      const parts = row.mois.split('-');
      const mIndex = parseInt(parts[1]) - 1;
      return {
        name: monthNames[mIndex],
        recettes: parseInt(row.total)
      };
    });

    // 3. Répartition des élèves par cycle
    const cycleResult = await query(`
      SELECT 
        c.niveau as cycle,
        COUNT(e.id) as count
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.est_inscrit = true
      GROUP BY c.niveau
    `);

    const studentsByCycle = cycleResult.rows.map(row => ({
      name: row.cycle || "Non assigné",
      value: parseInt(row.count)
    }));

    // 4. Répartition des recettes par type
    const recettesByTypeResult = await query(`
      SELECT 
        CASE 
          WHEN type_frais = 'inscription' THEN 'Inscription'
          WHEN type_frais = 'mensualite' THEN 'Mensualité'
          WHEN type_frais = 'cantine' THEN 'Cantine'
          WHEN type_frais = 'transport' THEN 'Transport'
          WHEN type_frais = 'bibliotheque' THEN 'Bibliothèque'
          ELSE 'Autre'
        END as type,
        SUM(montant) as total
      FROM paiements
      WHERE statut IN ('valide', 'paye')
      GROUP BY type_frais
    `);

    const recettesByType = recettesByTypeResult.rows.map(row => ({
      name: row.type || "Autre",
      value: parseInt(row.total)
    }));

    return NextResponse.json({
      kpis: {
        totalEleves,
        totalPersonnel,
        totalRecettes,
        totalSalaires,
        soldeGlobal: totalRecettes - totalSalaires
      },
      charts: {
        evolution: evolutionStats,
        studentsByCycle,
        recettesByType
      }
    });

  } catch (error) {
    console.error("Erreur API Rapports:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}