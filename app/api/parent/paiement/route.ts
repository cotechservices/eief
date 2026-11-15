// app/api/parent/paiement/route.ts
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

    const body = await request.json();
    const { preinscriptionId, montant, modePaiement, reference } = body;
    const userEmail = session.user?.email;

    if (!preinscriptionId || !montant || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const montantNumber = Number(montant);
    if (montantNumber <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    // Vérifier que la pré-inscription appartient au parent
    const preinscription = await query(`
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.classe,
        p.frais_montant,
        p.frais_statut,
        p.montant_total_plan,
        p.montant_restant_plan,
        u.email as parent_email, 
        u.nom as parent_nom, 
        u.prenom as parent_prenom,
        COALESCE(c.frais_inscription, p.frais_montant, 500000) as montant_calcule
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (preinscription.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const data = preinscription.rows[0];
    const montantTotal = Number(data.montant_total_plan) || Number(data.montant_calcule) || 0;
    const montantRestant = Number(data.montant_restant_plan) || montantTotal;

    if (montantNumber > montantRestant) {
      return NextResponse.json({ 
        error: `Le montant (${montantNumber.toLocaleString()} GNF) dépasse le reste à payer (${montantRestant.toLocaleString()} GNF)` 
      }, { status: 400 });
    }

    const userId = (session.user as any).id || null;

    await query('BEGIN');

    try {
      // 1. Créer le paiement
      const paiementResult = await query(`
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
        ) VALUES ($1, $2, $3, $4, $5, 'valide', CURRENT_DATE,
          EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE), $6)
        RETURNING id
      `, [
        preinscriptionId,
        montantNumber,
        'inscription',
        modePaiement,
        reference || null,
        userId
      ]);

      const paiementId = paiementResult.rows[0].id;

      // 2. Mettre à jour les échéances correspondantes (FIFO)
      let montantRestant = montantNumber;
      const echeancesRes = await query(`
        SELECT id, montant, type FROM echeances_paiement
        WHERE preinscription_id = $1 AND statut IN ('en_attente', 'partiel')
        ORDER BY date_echeance ASC NULLS LAST, id ASC
      `, [preinscriptionId]);

      for (const ech of echeancesRes.rows) {
        if (montantRestant <= 0) break;
        const montantEch = Number(ech.montant);
        const applique = Math.min(montantRestant, montantEch);
        
        if (applique >= montantEch) {
          await query(`
            UPDATE echeances_paiement SET statut = 'paye', date_paiement = CURRENT_DATE,
              reference_transaction = $2, mode_paiement = $3, updated_at = NOW()
            WHERE id = $1
          `, [ech.id, reference || `PAY-${paiementId}`, modePaiement]);
        } else {
          await query(`
            UPDATE echeances_paiement SET statut = 'partiel', montant = montant - $2, updated_at = NOW()
            WHERE id = $1
          `, [ech.id, applique]);
        }
        montantRestant -= applique;
      }

      // 3. Mettre à jour le solde restant de la pré-inscription
      const restantRes = await query(`
        SELECT COALESCE(SUM(montant), 0) as restant FROM echeances_paiement
        WHERE preinscription_id = $1 AND statut IN ('en_attente', 'partiel')
      `, [preinscriptionId]);
      const soldeFinal = Number(restantRes.rows[0]?.restant) || 0;
      
      await query(`
        UPDATE preinscriptions SET montant_restant_plan = $1,
          frais_statut = CASE WHEN $1 = 0 THEN 'paye' ELSE 'partiel' END,
          frais_mode_paiement = $2,
          frais_reference = $3,
          frais_date_paiement = NOW(),
          updated_at = NOW()
        WHERE id = $4
      `, [soldeFinal, modePaiement, reference || null, preinscriptionId]);

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        message: "Paiement effectué avec succès",
        montantPaye: montantNumber,
        nouveauReste: soldeFinal,
        paiementId
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Erreur paiement:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}
