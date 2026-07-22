// app/api/enseignant/salaire/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur non trouvé" }, { status: 400 });
    }

    // Récupérer le personnel_id de l'enseignant connecté
    const personnelResult = await query(`
      SELECT p.id as personnel_id, p.matricule_personnel, p.salaire_base, 
             COALESCE(p.prime_mensuelle, 0) as prime_mensuelle,
             p.departement, p.type as poste, p.statut,
             u.prenom, u.nom, CONCAT(u.prenom, ' ', u.nom) as employe
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (personnelResult.rows.length === 0) {
      return NextResponse.json({ error: "Profil personnel non trouvé" }, { status: 404 });
    }

    const personnel = personnelResult.rows[0];

    // Paramètres mois/année
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    // Récupérer le paiement pour ce mois/année
    const paiementResult = await query(`
      SELECT id, montant, statut, date_paiement, mode_paiement, reference_transaction
      FROM paiements_salaires
      WHERE personnel_id = $1 AND mois = $2 AND annee = $3
    `, [personnel.personnel_id, month, year]);

    const paiement = paiementResult.rows[0] || null;

    // Historique des 12 derniers mois
    const historiqueResult = await query(`
      SELECT mois, annee, montant, statut, date_paiement, mode_paiement
      FROM paiements_salaires
      WHERE personnel_id = $1
      ORDER BY annee DESC, mois DESC
      LIMIT 12
    `, [personnel.personnel_id]);

    const salaireBase = Number(personnel.salaire_base || 0);
    const prime = Number(personnel.prime_mensuelle || 0);
    const salaireTotal = salaireBase + prime;

    return NextResponse.json({
      profil: {
        employe: personnel.employe,
        matricule: personnel.matricule_personnel,
        poste: personnel.poste,
        departement: personnel.departement,
        statut_agent: personnel.statut,
      },
      salaire: {
        salaire_base: salaireBase,
        prime_mensuelle: prime,
        salaire_total: salaireTotal,
      },
      paiement: paiement ? {
        statut: paiement.statut,
        montant_paye: Number(paiement.montant),
        date_paiement: new Date(paiement.date_paiement).toISOString().split('T')[0],
        mode_paiement: paiement.mode_paiement,
        reference_transaction: paiement.reference_transaction,
      } : null,
      historique: historiqueResult.rows.map((r: any) => ({
        mois: r.mois,
        annee: r.annee,
        montant: Number(r.montant),
        statut: r.statut,
        date_paiement: r.date_paiement ? new Date(r.date_paiement).toISOString().split('T')[0] : null,
        mode_paiement: r.mode_paiement,
      })),
    });
  } catch (error) {
    console.error("Erreur API salaire enseignant GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
