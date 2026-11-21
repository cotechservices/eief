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

      // ======================================================
      // 1. Récupérer TOUTES les dettes impayées du parent,
      //    avec la catégorie réelle de chaque prestation.
      // ======================================================
      const echeancesResult = await query(`
        SELECT 
          ep.id,
          ep.echeance,
          ep.type,
          ep.montant,
          ep.statut,
          ep.date_echeance,
          ep.preinscription_id,
          ep.reinscription_id,
          COALESCE(pre.enfant_prenom || ' ' || pre.enfant_nom, rein.enfant_prenom || ' ' || rein.enfant_nom) as enfant_nom
        FROM echeances_paiement ep
        LEFT JOIN preinscriptions pre ON ep.preinscription_id = pre.id
        LEFT JOIN reinscriptions rein ON ep.reinscription_id = rein.id
        WHERE ep.statut IN ('en_attente', 'partiel')
          AND (
            ep.preinscription_id IN (
              SELECT id FROM preinscriptions WHERE parent_id = $1 AND statut IN ('en_attente', 'valide', 'partiel')
            )
            OR ep.reinscription_id IN (
              SELECT id FROM reinscriptions WHERE parent_id = $1 AND statut IN ('en_attente', 'valide', 'partiel')
            )
          )
        ORDER BY ep.date_echeance ASC NULLS LAST, ep.id ASC
      `, [parentId]);

      const echeances = echeancesResult.rows;

      type Dette = {
        id: number;
        source: 'echeance' | 'cantine' | 'transport';
        typePaiement: string;
        montant: number;
        date: string | null;
        preinscription_id: number | null;
        reinscription_id: number | null;
      };

      const dettes: Dette[] = echeances.map((e: any) => ({
        id: Number(e.id),
        source: 'echeance',
        typePaiement: e.type || 'inscription',
        montant: Number(e.montant) || 0,
        date: e.date_echeance,
        preinscription_id: e.preinscription_id || null,
        reinscription_id: e.reinscription_id || null,
      }));

      // La cantine et le transport n'ont pas d'échéance dans echeances_paiement :
      // leur reste à payer se déduit des paiements déjà enregistrés par type.
      const dettesSupplementaires = async (
        table: 'preinscription_cantine' | 'preinscription_transport',
        typePaiement: 'cantine' | 'transport',
        source: 'cantine' | 'transport'
      ) => {
        const res = await query(`
          SELECT pc.id, pc.preinscription_id, pc.prix, pc.created_at,
                 COALESCE((
                   SELECT SUM(p.montant)
                   FROM paiements p
                   WHERE p.preinscription_id = pc.preinscription_id
                     AND p.statut IN ('valide', 'paye')
                     AND p.type_frais ILIKE $2
                 ), 0) AS deja_paye
          FROM ${table} pc
          JOIN preinscriptions pre ON pc.preinscription_id = pre.id
          WHERE pre.parent_id = $1
            AND pre.statut IN ('en_attente', 'valide', 'partiel')
            AND pc.prix > 0
          ORDER BY pc.created_at ASC, pc.id ASC
        `, [parentId, `%${typePaiement}%`]);

        for (const row of res.rows) {
          const restant = Math.max(0, (Number(row.prix) || 0) - (Number(row.deja_paye) || 0));
          if (restant <= 0) continue;
          dettes.push({
            id: Number(row.id),
            source,
            typePaiement,
            montant: restant,
            date: row.created_at,
            preinscription_id: Number(row.preinscription_id),
            reinscription_id: null,
          });
        }
      };

      await dettesSupplementaires('preinscription_cantine', 'cantine', 'cantine');
      await dettesSupplementaires('preinscription_transport', 'transport', 'transport');

      dettes.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : Infinity;
        const db = b.date ? new Date(b.date).getTime() : Infinity;
        if (da !== db) return da - db;
        return a.id - b.id;
      });

      // Distribution : chaque paiement est enregistré avec le type de la dette.
      const echeancesPayees: number[] = [];
      const echeancesPartielles: { id: number; montantPaye: number }[] = [];

      for (const dette of dettes) {
        if (restantADistribuer <= 0) break;

        const montantDette = Number(dette.montant) || 0;
        if (montantDette <= 0) continue;

        const montantApplique = Math.min(restantADistribuer, montantDette);
        const paiRef = reference || (
          dette.source === 'echeance'
            ? `GLB-ECH-${dette.id}`
            : `GLB-${dette.source.toUpperCase()}-${dette.id}`
        );

        await query(`
          INSERT INTO paiements (
            preinscription_id,
            reinscription_id,
            montant,
            type_frais,
            mode_paiement,
            reference_transaction,
            statut,
            date_paiement,
            mois,
            annee,
            saisie_par
          ) VALUES ($1, $2, $3, $4, $5, $6, 'valide', CURRENT_DATE,
            EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $7)
        `, [
          dette.preinscription_id,
          dette.reinscription_id,
          montantApplique,
          dette.typePaiement,
          modePaiement,
          paiRef,
          userId
        ]);

        // Seules les échéances scolarité/fournitures ont un statut à mettre à jour.
        if (dette.source === 'echeance') {
          const nouveauStatut = montantApplique >= montantDette ? 'paye' : 'partiel';
          if (nouveauStatut === 'paye') {
            await query(`
              UPDATE echeances_paiement 
              SET statut = 'paye',
                  date_paiement = CURRENT_DATE,
                  reference_transaction = $2,
                  mode_paiement = $3,
                  updated_at = NOW()
              WHERE id = $1
            `, [dette.id, paiRef, modePaiement]);
            echeancesPayees.push(dette.id);
          } else {
            await query(`
              UPDATE echeances_paiement 
              SET statut = 'partiel',
                  montant = montant - $2,
                  updated_at = NOW()
              WHERE id = $1
            `, [dette.id, montantApplique]);
            echeancesPartielles.push({ id: dette.id, montantPaye: montantApplique });
          }
        }

        restantADistribuer -= montantApplique;
      }

      // ======================================================
      // 2. Si surplus (plus que toutes les dettes), enregistrer comme avance
      // ======================================================
      if (restantADistribuer > 0) {
        const preCheck = await query(`
          SELECT id FROM preinscriptions 
          WHERE parent_id = $1 AND statut IN ('en_attente', 'valide', 'partiel')
          ORDER BY id DESC LIMIT 1
        `, [parentId]);

        const reinCheck = await query(`
          SELECT id FROM reinscriptions
          WHERE parent_id = $1 AND statut IN ('en_attente', 'valide', 'partiel')
          ORDER BY id DESC LIMIT 1
        `, [parentId]);

        const preinscriptionId = preCheck.rows[0]?.id || null;
        const reinscriptionId = !preinscriptionId ? (reinCheck.rows[0]?.id || null) : null;

        const eleveCheck = await query(`
          SELECT e.id as eleve_id FROM eleves e
          JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
          WHERE lpe.parent_id = $1 LIMIT 1
        `, [parentId]);
        const eleveId = eleveCheck.rows[0]?.eleve_id || null;

        await query(`
          INSERT INTO paiements (
            preinscription_id, reinscription_id, eleve_id,
            montant, type_frais, mode_paiement, reference_transaction,
            statut, date_paiement, mois, annee, saisie_par
          ) VALUES ($1, $2, $3, $4, 'scolarite', $5, $6, 'valide', CURRENT_DATE,
            EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $7)
        `, [
          preinscriptionId,
          reinscriptionId,
          eleveId,
          restantADistribuer,
          modePaiement,
          reference || `GLB-EXTRA-${parentId}`,
          userId
        ]);
      }

      // ======================================================
      // 3. Mettre à jour le statut des preinscriptions/réinscriptions
      // ======================================================
      const preinscriptionIds = [...new Set(echeances
        .filter((e: any) => e.preinscription_id)
        .map((e: any) => Number(e.preinscription_id))
      )];

      for (const preId of preinscriptionIds) {
        const restantRes = await query(`
          SELECT COUNT(*) as nb_restant,
            COALESCE(SUM(montant), 0) as montant_restant
          FROM echeances_paiement 
          WHERE preinscription_id = $1 AND statut IN ('en_attente', 'partiel')
        `, [preId]);

        const nbRestant = Number(restantRes.rows[0]?.nb_restant) || 0;
        const montantRestant = Number(restantRes.rows[0]?.montant_restant) || 0;

        await query(`
          UPDATE preinscriptions
          SET montant_restant_plan = $1,
              frais_statut = CASE WHEN $2 = 0 THEN 'paye' ELSE 'partiel' END,
              updated_at = NOW()
          WHERE id = $3
        `, [montantRestant, nbRestant, preId]);
      }

      const reinscriptionIds = [...new Set(echeances
        .filter((e: any) => e.reinscription_id)
        .map((e: any) => Number(e.reinscription_id))
      )];

      for (const reinId of reinscriptionIds) {
        const restantRes = await query(`
          SELECT COUNT(*) as nb_restant,
            COALESCE(SUM(montant), 0) as montant_restant
          FROM echeances_paiement 
          WHERE reinscription_id = $1 AND statut IN ('en_attente', 'partiel')
        `, [reinId]);

        const nbRestant = Number(restantRes.rows[0]?.nb_restant) || 0;
        const montantRestant = Number(restantRes.rows[0]?.montant_restant) || 0;

        await query(`
          UPDATE reinscriptions
          SET montant_restant_plan = $1,
              frais_statut = CASE WHEN $2 = 0 THEN 'paye' ELSE 'partiel' END,
              updated_at = NOW()
          WHERE id = $3
        `, [montantRestant, nbRestant, reinId]);
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Paiement global de ${montantTotal.toLocaleString()} GNF enregistré avec succès`,
        echeancesPayees: echeancesPayees.length,
        echeancesPartielles: echeancesPartielles.length,
        surplus: restantADistribuer > 0 ? restantADistribuer : 0
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
