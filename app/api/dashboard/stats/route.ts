// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;

    // ========== STATISTIQUES GÉNÉRALES (pour tous) ==========
    const eleves = await query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END) as hommes, 
             SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END) as femmes 
      FROM eleves WHERE est_inscrit = true
    `);
    
    const enseignants = await query("SELECT COUNT(*) as total FROM personnels WHERE type = 'enseignant'");
    const classes = await query("SELECT COUNT(*) as total FROM classes");
    const parents = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'PARENT'");
    const preinscriptions = await query("SELECT COUNT(*) as total FROM preinscriptions WHERE statut = 'en_attente'");

    // ========== STATISTIQUES FINANCIÈRES ==========
    // Total recettes
    const recettes = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE statut = 'valide'
    `);

    // Total dépenses
    const depenses = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE statut = 'valide' AND type_frais IN ('salaire', 'depense')
    `);

    // Derniers paiements
    const derniersPaiements = await query(`
      SELECT 
        p.id,
        CONCAT(u.prenom, ' ', u.nom) as eleve,
        c.nom as classe,
        p.montant,
        p.type_frais as type,
        p.date_paiement as date,
        p.mode_paiement as mode,
        p.statut
      FROM paiements p
      JOIN eleves e ON p.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      ORDER BY p.date_paiement DESC
      LIMIT 10
    `);

    // Paiements par type
    const paiementsParType = await query(`
      SELECT type_frais, COALESCE(SUM(montant), 0) as total
      FROM paiements 
      WHERE statut = 'valide'
      GROUP BY type_frais
    `);

    const totalRecettes = recettes.rows[0]?.total || 0;
    const totalDepenses = depenses.rows[0]?.total || 0;
    const solde = totalRecettes - totalDepenses;
    const tauxRecouvrement = totalRecettes > 0 ? Math.round((totalRecettes / (totalRecettes + totalDepenses)) * 100) : 0;

    // Évolution mensuelle
    const evolution = await query(`
      SELECT 
        TO_CHAR(date_paiement, 'Mon') as mois,
        COALESCE(SUM(CASE WHEN type_frais NOT IN ('salaire', 'depense') THEN montant ELSE 0 END), 0) as recettes,
        COALESCE(SUM(CASE WHEN type_frais IN ('salaire', 'depense') THEN montant ELSE 0 END), 0) as depenses
      FROM paiements
      WHERE date_paiement >= NOW() - INTERVAL '6 months'
      GROUP BY EXTRACT(MONTH FROM date_paiement), TO_CHAR(date_paiement, 'Mon')
      ORDER BY EXTRACT(MONTH FROM date_paiement) DESC
      LIMIT 6
    `);

    // Répartition des recettes par catégorie
    const categoriesRecettes = paiementsParType.rows.map((cat: any) => {
      const pourcentage = totalRecettes > 0 ? Math.round((cat.total / totalRecettes) * 100) : 0;
      let name = cat.type_frais;
      if (name === "inscription") name = "Inscription";
      else if (name === "mensualite") name = "Mensualité";
      else if (name === "cantine") name = "Cantine";
      else if (name === "transport") name = "Transport";
      else if (name === "bibliotheque") name = "Bibliothèque";
      else name = "Autre";
      return { name, montant: cat.total, pourcentage };
    });

    return NextResponse.json({
      general: {
        totalEleves: parseInt(eleves.rows[0]?.total || 0),
        totalEnseignants: parseInt(enseignants.rows[0]?.total || 0),
        totalClasses: parseInt(classes.rows[0]?.total || 0),
        totalParents: parseInt(parents.rows[0]?.total || 0),
        preinscriptionsEnAttente: parseInt(preinscriptions.rows[0]?.total || 0),
        hommes: parseInt(eleves.rows[0]?.hommes || 0),
        femmes: parseInt(eleves.rows[0]?.femmes || 0),
        totalPaiementsAnnee: totalRecettes
      },
      financieres: {
        totalRecettes,
        totalDepenses,
        solde,
        tauxRecouvrement,
        evolutionRecettes: evolution.rows.reverse(),
        derniersPaiements: derniersPaiements.rows,
        categoriesRecettes
      }
    });
  } catch (error) {
    console.error("Erreur dashboard stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}