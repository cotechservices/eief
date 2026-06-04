// app/api/parent/finances/route.ts
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

    const userEmail = session.user?.email;

    // Récupérer les enfants du parent
    const enfants = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        c.nom as classe_nom
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $1 AND e.est_inscrit = true
    `, [userEmail]);

    // Pour chaque enfant, récupérer les paiements
    const enfantsAvecPaiements = await Promise.all(
      enfants.rows.map(async (enfant) => {
        // Récupérer tous les paiements de l'enfant
        const paiements = await query(`
          SELECT 
            p.id,
            p.montant,
            p.type_frais,
            p.mode_paiement,
            p.reference_transaction,
            p.statut,
            p.date_paiement,
            p.mois,
            p.annee
          FROM paiements p
          WHERE p.eleve_id = $1
          ORDER BY p.date_paiement DESC
        `, [enfant.id]);

        // Calculer les totaux
        const totalPaye = paiements.rows
          .filter(p => p.statut === 'valide')
          .reduce((acc, p) => acc + p.montant, 0);
        
        const totalEnAttente = paiements.rows
          .filter(p => p.statut === 'en_attente')
          .reduce((acc, p) => acc + p.montant, 0);

        // Récupérer les frais d'inscription de la classe
        const fraisClasse = await query(`
          SELECT c.frais_inscription
          FROM eleves e
          JOIN classes c ON e.classe_id = c.id
          WHERE e.id = $1
        `, [enfant.id]);

        const fraisTotal = fraisClasse.rows[0]?.frais_inscription || 0;
        const soldeRestant = fraisTotal - totalPaye;

        return {
          id: enfant.id,
          matricule: enfant.matricule,
          nom: enfant.nom,
          prenom: enfant.prenom,
          classe_nom: enfant.classe_nom,
          frais_total: fraisTotal,
          total_paye: totalPaye,
          total_en_attente: totalEnAttente,
          solde_restant: soldeRestant,
          paiements: paiements.rows.map(p => ({
            id: p.id,
            montant: p.montant,
            type_frais: p.type_frais,
            mode_paiement: p.mode_paiement,
            reference: p.reference_transaction,
            statut: p.statut === 'valide' ? 'paye' : p.statut === 'en_attente' ? 'en_attente' : 'impaye',
            date: p.date_paiement,
            mois: p.mois,
            annee: p.annee
          }))
        };
      })
    );

    // Calculer les totaux globaux
    const totals = {
      total_du: enfantsAvecPaiements.reduce((acc, e) => acc + e.frais_total, 0),
      total_paye: enfantsAvecPaiements.reduce((acc, e) => acc + e.total_paye, 0),
      total_en_attente: enfantsAvecPaiements.reduce((acc, e) => acc + e.total_en_attente, 0),
      solde_restant: enfantsAvecPaiements.reduce((acc, e) => acc + e.solde_restant, 0)
    };

    return NextResponse.json({
      enfants: enfantsAvecPaiements,
      totals
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}