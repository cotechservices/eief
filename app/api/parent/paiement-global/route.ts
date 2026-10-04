// app/api/parent/paiement-global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const body = await request.json();
    const { montant, modePaiement, reference, parentId: requestedParentId } = body;

    let parentId: number | null = null;

    if (userRole === "SUPER_ADMIN" || userRole === "COMPTABLE" || userRole === "DIRECTEUR_GENERAL") {
      if (requestedParentId) {
        parentId = parseInt(requestedParentId);
      }
    }

    if (!parentId) {
      const parentCheck = await query(
        `SELECT p.id FROM parents p JOIN utilisateurs u ON p.utilisateur_id = u.id WHERE u.email = $1`,
        [session.user?.email]
      );
      if (parentCheck.rows.length > 0) {
        parentId = parentCheck.rows[0].id;
      }
    }

    if (!parentId) {
      return NextResponse.json({ error: "Compte parent introuvable" }, { status: 404 });
    }

    const montantTotal = Number(montant);
    if (!montantTotal || montantTotal <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (!modePaiement) {
      return NextResponse.json({ error: "Mode de paiement requis" }, { status: 400 });
    }

    const userId = (session.user as any).id || null;

    await query('BEGIN');

    try {
      let restantADistribuer = montantTotal;

      // 1. Récupérer les préinscriptions avec un solde restant (basé sur le total de toutes les échéances)
      const preinscriptions = await query(`
        SELECT 
          p.id, 
          COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id), p.montant_total_plan, 0) AS montant_total_reel,
          GREATEST(0, COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id), p.montant_total_plan, 0) - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.preinscription_id = p.id AND pp.statut = 'valide'), 0)) AS montant_restant_reel,
          p.enfant_nom, 
          p.enfant_prenom
        FROM preinscriptions p
        WHERE p.parent_id = $1 AND p.statut IN ('en_attente', 'valide')
          AND GREATEST(0, COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id), p.montant_total_plan, 0) - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.preinscription_id = p.id AND pp.statut = 'valide'), 0)) > 0
        ORDER BY p.id ASC
      `, [parentId]);

      for (const pre of preinscriptions.rows) {
        if (restantADistribuer <= 0) break;
        const soldePre = Number(pre.montant_restant_reel);
        const montantApplique = Math.min(restantADistribuer, soldePre);

        // Insérer le paiement
        await query(`
          INSERT INTO paiements (
            preinscription_id,
            montant,
            type_frais,
            mode_paiement,
            reference_transaction,
            statut,
            date_paiement,
            mois,
            annee,
            saisie_par
          ) VALUES ($1, $2, 'inscription', $3, $4, 'valide', CURRENT_DATE, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $5)
        `, [pre.id, montantApplique, modePaiement, reference || `GLB-PRE-${pre.id}`, userId]);

        const nouveauSolde = Math.max(0, soldePre - montantApplique);
        await query(`
          UPDATE preinscriptions
          SET montant_total_plan = COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.preinscription_id = $2 AND ep.type = 'inscription'), montant_total_plan),
              montant_restant_plan = $1,
              frais_statut = CASE WHEN $1 = 0 THEN 'paye' ELSE 'partiel' END
          WHERE id = $2
        `, [nouveauSolde, pre.id]);

        restantADistribuer -= montantApplique;
      }

      // 2. Récupérer les réinscriptions avec un solde restant (basé sur le total des échéances)
      if (restantADistribuer > 0) {
        const reinscriptions = await query(`
          SELECT 
            r.id, 
            r.eleve_id, 
            COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id), r.montant_total_plan, 0) AS montant_total_reel,
            GREATEST(0, COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id), r.montant_total_plan, 0) - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.reinscription_id = r.id AND pp.statut = 'valide'), 0)) AS montant_restant_reel,
            r.enfant_nom, 
            r.enfant_prenom
          FROM reinscriptions r
          WHERE r.parent_id = $1 AND r.statut IN ('en_attente', 'valide')
            AND GREATEST(0, COALESCE((SELECT SUM(ep.montant) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id), r.montant_total_plan, 0) - COALESCE((SELECT SUM(pp.montant) FROM paiements pp WHERE pp.reinscription_id = r.id AND pp.statut = 'valide'), 0)) > 0
          ORDER BY r.id ASC
        `, [parentId]);

        for (const rein of reinscriptions.rows) {
          if (restantADistribuer <= 0) break;
          const soldeRein = Number(rein.montant_restant_reel);
          const montantApplique = Math.min(restantADistribuer, soldeRein);

          await query(`
            INSERT INTO paiements (
              reinscription_id,
              eleve_id,
              montant,
              type_frais,
              mode_paiement,
              reference_transaction,
              statut,
              date_paiement,
              mois,
              annee,
              saisie_par
            ) VALUES ($1, $2, $3, 'reinscription', $4, $5, 'valide', CURRENT_DATE, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $6)
          `, [rein.id, rein.eleve_id || null, montantApplique, modePaiement, reference || `GLB-REIN-${rein.id}`, userId]);

          const nouveauSolde = Math.max(0, soldeRein - montantApplique);
          await query(`
            UPDATE reinscriptions
            SET montant_restant_plan = $1,
                frais_statut = CASE WHEN $1 = 0 THEN 'paye' ELSE 'partiel' END,
                updated_at = NOW()
            WHERE id = $2
          `, [nouveauSolde, rein.id]);

          restantADistribuer -= montantApplique;
        }
      }

      // 3. Si surplus restant ou élèves sans pre/reinscription
      if (restantADistribuer > 0) {
        const enfants = await query(`
          SELECT e.id as eleve_id
          FROM eleves e
          JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
          WHERE lpe.parent_id = $1
          LIMIT 1
        `, [parentId]);

        const eleveId = enfants.rows[0]?.eleve_id || null;

        await query(`
          INSERT INTO paiements (
            eleve_id,
            montant,
            type_frais,
            mode_paiement,
            reference_transaction,
            statut,
            date_paiement,
            mois,
            annee,
            saisie_par
          ) VALUES ($1, $2, 'scolarite', $3, $4, 'valide', CURRENT_DATE, EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $5)
        `, [eleveId, restantADistribuer, modePaiement, reference || `GLB-EXTRA-${parentId}`, userId]);
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Paiement global de ${montantTotal.toLocaleString()} GNF enregistré avec succès`
      });

    } catch (error) {
      await query('ROLLBACK');
      console.error("Erreur transaction paiement global:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erreur paiement global:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}
