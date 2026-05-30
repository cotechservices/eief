// app/api/admin/dashboard/activites/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const activites = [];

    // Récupérer les dernières inscriptions
    try {
      const inscriptions = await query(`
        SELECT 
          'Nouvel élève inscrit' as action,
          CONCAT(u.prenom, ' ', u.nom) as utilisateur,
          e.date_inscription as date,
          'success' as type
        FROM eleves e
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        ORDER BY e.date_inscription DESC
        LIMIT 5
      `);
      activites.push(...inscriptions.rows);
    } catch (e) {
      console.log("Pas de données d'inscriptions");
    }

    // Récupérer les derniers paiements
    try {
      const paiements = await query(`
        SELECT 
          'Paiement effectué' as action,
          CONCAT(u.prenom, ' ', u.nom) as utilisateur,
          p.date_paiement as date,
          'success' as type
        FROM paiements p
        JOIN eleves e ON p.eleve_id = e.id
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        ORDER BY p.date_paiement DESC
        LIMIT 5
      `);
      activites.push(...paiements.rows);
    } catch (e) {
      console.log("Pas de données de paiements");
    }

    // Si pas d'activités, retourner des données par défaut
    if (activites.length === 0) {
      return NextResponse.json([
        { id: 1, action: "Bienvenue sur le tableau de bord", utilisateur: "Administrateur", date: "À l'instant", type: "info" },
      ]);
    }

    // Trier par date
    const sorted = activites
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((a, idx) => ({
        id: idx,
        action: a.action,
        utilisateur: a.utilisateur,
        date: formatRelativeTime(new Date(a.date)),
        type: a.type
      }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Erreur activites:", error);
    return NextResponse.json([
      { id: 1, action: "Bienvenue sur le tableau de bord", utilisateur: "Administrateur", date: "À l'instant", type: "info" },
    ]);
  }
}