// app/api/paiements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Fonction pour générer le numéro de reçu
async function generateRecuNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const result = await query(`
    SELECT numero_recu FROM recus 
    WHERE numero_recu LIKE $1 
    ORDER BY id DESC LIMIT 1
  `, [`RECU-${year}${month}-%`]);

  if (result.rows.length === 0) {
    return `RECU-${year}${month}-0001`;
  }

  const lastNumber = result.rows[0].numero_recu;
  const parts = lastNumber.split('-');
  const sequence = parseInt(parts[parts.length - 1]) + 1;
  const paddedSequence = String(sequence).padStart(4, '0');
  
  return `RECU-${year}${month}-${paddedSequence}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eleveId = searchParams.get("eleveId");

  let paiements;
  if (eleveId) {
    paiements = await query(`
      SELECT 
        p.*,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        c.nom as classe_nom,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        r.numero_recu,
        r.id as recu_id
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      LEFT JOIN parents pa ON lpe.parent_id = pa.id
      LEFT JOIN utilisateurs pu ON pa.utilisateur_id = pu.id
      LEFT JOIN recus r ON p.id = r.paiement_id
      WHERE p.eleve_id = $1
      ORDER BY p.date_paiement DESC
    `, [parseInt(eleveId)]);
  } else {
    paiements = await query(`
      SELECT 
        p.*,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        c.nom as classe_nom,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        r.numero_recu,
        r.id as recu_id
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      LEFT JOIN parents pa ON lpe.parent_id = pa.id
      LEFT JOIN utilisateurs pu ON pa.utilisateur_id = pu.id
      LEFT JOIN recus r ON p.id = r.paiement_id
      ORDER BY p.date_paiement DESC
    `);
  }

  return NextResponse.json(paiements.rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "COMPTABLE" && userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      eleveId, 
      montant, 
      typeFrais, 
      modePaiement, 
      referenceTransaction,
      preinscriptionId,
      reinscriptionId,
      mois,
      annee
    } = body;

    if (!montant || montant <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    if (!modePaiement) {
      return NextResponse.json({ error: "Mode de paiement requis" }, { status: 400 });
    }

    // ⭐ Récupérer les infos contextuelles (parent, enfant, classe)
    // selon que c'est un élève inscrit, une preinscription ou une réinscription
    let enfantNom = '';
    let parentNom = '';
    let parentEmail = '';
    let classeNom = '';
    let montantTotal = 0;
    let totalDejaPaye = 0;

    if (eleveId) {
      const eleveCheck = await query(`
        SELECT 
          e.id,
          u.nom as enfant_nom,
          u.prenom as enfant_prenom,
          c.nom as classe_nom,
          c.frais_inscription as frais_total,
          pu.nom as parent_nom,
          pu.prenom as parent_prenom,
          pu.email as parent_email
        FROM eleves e
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        LEFT JOIN classes c ON e.classe_id = c.id
        LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
        LEFT JOIN parents pa ON lpe.parent_id = pa.id
        LEFT JOIN utilisateurs pu ON pa.utilisateur_id = pu.id
        WHERE e.id = $1
        LIMIT 1
      `, [eleveId]);

      if (eleveCheck.rows.length === 0) {
        return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
      }
      const eleve = eleveCheck.rows[0];
      enfantNom = `${eleve.enfant_prenom || ''} ${eleve.enfant_nom || ''}`.trim();
      parentNom = `${eleve.parent_prenom || ''} ${eleve.parent_nom || ''}`.trim();
      parentEmail = eleve.parent_email || '';
      classeNom = eleve.classe_nom || '';
      montantTotal = Number(eleve.frais_total) || 0;

      const payeRes = await query(`
        SELECT COALESCE(SUM(montant), 0) as total_paye
        FROM paiements WHERE eleve_id = $1 AND statut = 'valide'
      `, [eleveId]);
      totalDejaPaye = Number(payeRes.rows[0]?.total_paye) || 0;

    } else if (preinscriptionId) {
      const preCheck = await query(`
        SELECT 
          p.enfant_nom, p.enfant_prenom, p.classe,
          COALESCE((SELECT SUM(COALESCE(ep.montant_initial, ep.montant)) FROM echeances_paiement ep WHERE ep.preinscription_id = p.id), p.montant_total_plan, 0) as montant_total,
          u.nom as parent_nom,
          u.prenom as parent_prenom,
          u.email as parent_email
        FROM preinscriptions p
        JOIN parents pa ON p.parent_id = pa.id
        JOIN utilisateurs u ON pa.utilisateur_id = u.id
        WHERE p.id = $1
      `, [preinscriptionId]);

      if (preCheck.rows.length > 0) {
        const pre = preCheck.rows[0];
        enfantNom = `${pre.enfant_prenom || ''} ${pre.enfant_nom || ''}`.trim();
        parentNom = `${pre.parent_prenom || ''} ${pre.parent_nom || ''}`.trim();
        parentEmail = pre.parent_email || '';
        classeNom = pre.classe || '';
        montantTotal = Number(pre.montant_total) || 0;

        const payeRes = await query(`
          SELECT COALESCE(SUM(montant), 0) as total_paye
          FROM paiements WHERE preinscription_id = $1 AND statut IN ('valide', 'paye')
        `, [preinscriptionId]);
        totalDejaPaye = Number(payeRes.rows[0]?.total_paye) || 0;
      }

    } else if (reinscriptionId) {
      const reinCheck = await query(`
        SELECT 
          r.enfant_nom, r.enfant_prenom,
          c.nom as classe_nom,
          COALESCE((SELECT SUM(COALESCE(ep.montant_initial, ep.montant)) FROM echeances_paiement ep WHERE ep.reinscription_id = r.id), r.montant_total_plan, 0) as montant_total,
          u.nom as parent_nom,
          u.prenom as parent_prenom,
          u.email as parent_email
        FROM reinscriptions r
        JOIN parents pa ON r.parent_id = pa.id
        JOIN utilisateurs u ON pa.utilisateur_id = u.id
        LEFT JOIN eleves e ON r.eleve_id = e.id
        LEFT JOIN classes c ON e.classe_id = c.id
        WHERE r.id = $1
      `, [reinscriptionId]);

      if (reinCheck.rows.length > 0) {
        const rein = reinCheck.rows[0];
        enfantNom = `${rein.enfant_prenom || ''} ${rein.enfant_nom || ''}`.trim();
        parentNom = `${rein.parent_prenom || ''} ${rein.parent_nom || ''}`.trim();
        parentEmail = rein.parent_email || '';
        classeNom = rein.classe_nom || '';
        montantTotal = Number(rein.montant_total) || 0;

        const payeRes = await query(`
          SELECT COALESCE(SUM(montant), 0) as total_paye
          FROM paiements WHERE reinscription_id = $1 AND statut IN ('valide', 'paye')
        `, [reinscriptionId]);
        totalDejaPaye = Number(payeRes.rows[0]?.total_paye) || 0;
      }
    }

    const resteApresPaiement = Math.max(0, montantTotal - totalDejaPaye - Number(montant));

    await query('BEGIN');

    try {
      // 1. Créer le paiement
      const paiementResult = await query(`
        INSERT INTO paiements (
          eleve_id, montant, type_frais, mode_paiement, 
          reference_transaction, saisie_par, preinscription_id, reinscription_id,
          mois, annee, statut, date_paiement
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'valide', NOW())
        RETURNING id, date_paiement
      `, [
        eleveId || null, 
        montant, 
        typeFrais || 'scolarite', 
        modePaiement, 
        referenceTransaction || null,
        parseInt((session.user as any).id),
        preinscriptionId || null,
        reinscriptionId || null,
        mois || new Date().getMonth() + 1,
        annee || new Date().getFullYear()
      ]);

      const paiement = paiementResult.rows[0];

      // 2. Mettre à jour les échéances correspondantes (FIFO sur preinscription/réinscription)
      if (preinscriptionId || reinscriptionId) {
        const whereClause = preinscriptionId 
          ? `preinscription_id = ${preinscriptionId}`
          : `reinscription_id = ${reinscriptionId}`;
        
        let montantRestant = Number(montant);
        const echeancesRes = await query(`
          SELECT id, montant, type FROM echeances_paiement
          WHERE ${whereClause} AND statut IN ('en_attente', 'partiel')
          ORDER BY date_echeance ASC NULLS LAST, id ASC
        `);

        for (const ech of echeancesRes.rows) {
          if (montantRestant <= 0) break;
          const montantEch = Number(ech.montant);
          const applique = Math.min(montantRestant, montantEch);
          
          if (applique >= montantEch) {
            await query(`
              UPDATE echeances_paiement SET statut = 'paye', date_paiement = CURRENT_DATE,
                reference_transaction = $2, mode_paiement = $3, updated_at = NOW()
              WHERE id = $1
            `, [ech.id, referenceTransaction || `PAY-${paiement.id}`, modePaiement]);
          } else {
            await query(`
              UPDATE echeances_paiement SET statut = 'partiel', montant = montant - $2, updated_at = NOW()
              WHERE id = $1
            `, [ech.id, applique]);
          }
          montantRestant -= applique;
        }

        // Mettre à jour le solde restant de la preinscription/réinscription
        if (preinscriptionId) {
          const restant = await query(`
            SELECT COALESCE(SUM(montant), 0) as restant FROM echeances_paiement
            WHERE preinscription_id = $1 AND statut IN ('en_attente', 'partiel')
          `, [preinscriptionId]);
          const soldeFinal = Number(restant.rows[0]?.restant) || 0;
          await query(`
            UPDATE preinscriptions SET montant_restant_plan = $1,
              frais_statut = CASE WHEN $1 = 0 THEN 'paye' ELSE 'partiel' END, updated_at = NOW()
            WHERE id = $2
          `, [soldeFinal, preinscriptionId]);
        }

        if (reinscriptionId) {
          const restant = await query(`
            SELECT COALESCE(SUM(montant), 0) as restant FROM echeances_paiement
            WHERE reinscription_id = $1 AND statut IN ('en_attente', 'partiel')
          `, [reinscriptionId]);
          const soldeFinal = Number(restant.rows[0]?.restant) || 0;
          await query(`
            UPDATE reinscriptions SET montant_restant_plan = $1,
              frais_statut = CASE WHEN $1 = 0 THEN 'paye' ELSE 'partiel' END, updated_at = NOW()
            WHERE id = $2
          `, [soldeFinal, reinscriptionId]);
        }
      }

      // 3. Générer le numéro de reçu
      const numeroRecu = await generateRecuNumber();

      // 4. Créer le reçu
      const recuResult = await query(`
        INSERT INTO recus (
          numero_recu, paiement_id, eleve_id, preinscription_id, reinscription_id,
          enfant_nom, parent_nom, montant, type_frais, mode_paiement,
          date_paiement, reference, source,
          montant_total, reste_a_payer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        numeroRecu,
        paiement.id,
        eleveId || null,
        preinscriptionId || null,
        reinscriptionId || null,
        enfantNom,
        parentNom,
        montant,
        typeFrais || 'scolarite',
        modePaiement,
        paiement.date_paiement,
        referenceTransaction || `PAY-${paiement.id}`,
        'paiement',
        montantTotal,
        resteApresPaiement
      ]);

      await query('COMMIT');

      const recu = recuResult.rows[0];

      const recuData = {
        numero_recu: recu.numero_recu,
        date_paiement: recu.date_paiement?.toISOString?.() || new Date().toISOString(),
        enfant: recu.enfant_nom || enfantNom,
        montant: recu.montant,
        mode_paiement: recu.mode_paiement,
        type_frais: recu.type_frais,
        reference: recu.reference,
        classe: classeNom,
        parent_nom: recu.parent_nom || parentNom,
        parent_email: parentEmail,
        source: recu.source || 'paiement',
        montant_total: Number(recu.montant_total) || 0,
        reste_a_payer: Number(recu.reste_a_payer) || 0
      };

      return NextResponse.json({
        success: true,
        paiement: paiement,
        recu: recuData,
        numero_recu: recu.numero_recu
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Erreur paiement:", error);
    return NextResponse.json(
      { error: "Erreur lors du paiement: " + (error as Error).message },
      { status: 500 }
    );
  }
}