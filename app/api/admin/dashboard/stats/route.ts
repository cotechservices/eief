// app/api/admin/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Total élèves
    const eleves = await query("SELECT COUNT(*) as total, SUM(CASE WHEN sexe = 'M' THEN 1 ELSE 0 END) as hommes, SUM(CASE WHEN sexe = 'F' THEN 1 ELSE 0 END) as femmes FROM eleves WHERE est_inscrit = true");
    
    // Total enseignants
    const enseignants = await query("SELECT COUNT(*) as total FROM personnels WHERE type = 'enseignant'");
    
    // Total classes
    const classes = await query("SELECT COUNT(*) as total FROM classes");
    
    // Total parents (utilisateurs avec rôle PARENT)
    const parents = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'PARENT'");
    
    // Pré-inscriptions en attente
    const preinscriptions = await query("SELECT COUNT(*) as total FROM preinscriptions WHERE statut = 'en_attente'");
    
    // Paiements de l'année
    const paiementsAnnee = await query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE statut = 'valide' 
      AND EXTRACT(YEAR FROM date_paiement) = EXTRACT(YEAR FROM NOW())
    `);

    return NextResponse.json({
      totalEleves: parseInt(eleves.rows[0]?.total || 0),
      totalEnseignants: parseInt(enseignants.rows[0]?.total || 0),
      totalClasses: parseInt(classes.rows[0]?.total || 0),
      totalParents: parseInt(parents.rows[0]?.total || 0),
      totalPaiementsAnnee: parseFloat(paiementsAnnee.rows[0]?.total || 0),
      preinscriptionsEnAttente: parseInt(preinscriptions.rows[0]?.total || 0),
      hommes: parseInt(eleves.rows[0]?.hommes || 0),
      femmes: parseInt(eleves.rows[0]?.femmes || 0),
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}