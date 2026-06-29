// app/api/parent/reinscriptions/route.ts
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

    // Récupérer les réinscriptions du parent AVEC la photo
    const result = await query(`
      SELECT 
        r.id,
        r.numero_dossier,
        r.date_reinscription,
        r.statut,
        r.observations,
        r.montant_frais,
        r.frais_statut,
        r.frais_mode_paiement,
        r.enfant_nom,
        r.enfant_prenom,
        r.classe_nom,
        r.photo_url,
        r.acte_naissance_url,
        r.bulletin_url,
        r.montant_total_plan,
        r.montant_restant_plan,
        e.matricule,
        c.nom as classe_actuelle_nom,
        a.libelle as annee_scolaire
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs u_parent ON p.utilisateur_id = u_parent.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN annees_scolaires a ON r.annee_scolaire_id = a.id
      WHERE u_parent.email = $1
      ORDER BY r.date_reinscription DESC
    `, [userEmail]);

    // ⭐ Récupérer les échéances pour chaque réinscription
    const reinscriptionsWithEcheances = await Promise.all(
      result.rows.map(async (reinscription) => {
        const echeances = await query(`
          SELECT 
            id,
            type,
            echeance,
            montant,
            statut,
            date_echeance,
            date_paiement,
            reference_transaction,
            mode_paiement
          FROM echeances_paiement
          WHERE reinscription_id = $1
          ORDER BY 
            CASE echeance
              WHEN '1er_versement' THEN 1
              WHEN '2eme_versement' THEN 2
              WHEN '3eme_versement' THEN 3
              WHEN 'transport' THEN 4
              WHEN 'cantine' THEN 5
              WHEN 'fournitures' THEN 6
            END
        `, [reinscription.id]);
        
        // ⭐ Calculer le montant total payé pour cette réinscription
        const totalPaye = echeances.rows
          .filter((e: any) => e.statut === 'paye')
          .reduce((sum: number, e: any) => sum + Number(e.montant), 0);
        
        // ⭐ Calculer le montant restant
        const montantTotal = Number(reinscription.montant_total_plan) || Number(reinscription.montant_frais) || 0;
        const restant = montantTotal - totalPaye;
        
        return {
          ...reinscription,
          echeances: echeances.rows,
          montant_total: montantTotal,
          montant_paye: totalPaye,
          montant_restant: restant,
          // ⭐ Services optionnels
          transport_montant: echeances.rows
            .filter((e: any) => e.type === 'transport' && e.statut === 'paye')
            .reduce((sum: number, e: any) => sum + Number(e.montant), 0),
          cantine_montant: echeances.rows
            .filter((e: any) => e.type === 'cantine' && e.statut === 'paye')
            .reduce((sum: number, e: any) => sum + Number(e.montant), 0),
          fournitures_montant: echeances.rows
            .filter((e: any) => e.type === 'fournitures' && e.statut === 'paye')
            .reduce((sum: number, e: any) => sum + Number(e.montant), 0)
        };
      })
    );

    return NextResponse.json(reinscriptionsWithEcheances);
  } catch (error) {
    console.error("Erreur API Parent Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// app/api/parent/reinscriptions/route.ts (POST final)

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      eleveId, 
      classeId, 
      montantFrais,
      transport,
      cantine,
      fournitures,
      montantTransport,
      montantCantine,
      montantFournitures,
      montantTotal
    } = body;

    // Récupérer l'ID du parent
    const parentResult = await query(`
      SELECT p.id 
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.email = $1
    `, [session.user?.email]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parentId = parentResult.rows[0].id;

    // Récupérer l'année scolaire active
    const anneeScolaire = await query(`
      SELECT id FROM annees_scolaires WHERE est_active = true
    `);

    // Récupérer les informations de l'élève et sa photo
    const eleveInfo = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        pre.photo_url as photo_url,
        c.nom as classe_actuelle_nom
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions ins ON e.id = ins.eleve_id
      LEFT JOIN preinscriptions pre ON ins.preinscription_id = pre.id
      WHERE e.id = $1
      ORDER BY ins.id DESC
      LIMIT 1
    `, [eleveId]);

    if (eleveInfo.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const info = eleveInfo.rows[0];

    // Récupérer la classe choisie avec les montants de réinscription
    const classeInfo = await query(`
      SELECT 
        nom,
        reinscription_premier_versement,
        reinscription_deuxieme_versement,
        reinscription_troisieme_versement,
        reinscription_total_versement
      FROM classes 
      WHERE id = $1
    `, [classeId]);

    const classe = classeInfo.rows[0];
    const classeNom = classe?.nom || null;

    // Calculer le montant total des services
    const totalServices = (montantTransport || 0) + (montantCantine || 0) + (montantFournitures || 0);
    
    // Montant total de la réinscription (frais + services)
    const fraisReinscription = montantFrais || 500000;
    const totalGeneral = fraisReinscription + totalServices;

    // Générer un numéro de dossier
    const currentYear = new Date().getFullYear();
    const countResult = await query(`
      SELECT COUNT(*) as count FROM reinscriptions WHERE EXTRACT(YEAR FROM date_reinscription) = $1
    `, [currentYear]);
    const count = parseInt(countResult.rows[0].count) + 1;
    const numeroDossier = `R${currentYear}-${count.toString().padStart(4, '0')}`;

    // Démarrer une transaction
    await query('BEGIN');

    try {
      // Créer la réinscription
      const result = await query(`
        INSERT INTO reinscriptions (
          eleve_id, 
          parent_id, 
          annee_scolaire_id, 
          classe_id, 
          montant_frais, 
          statut,
          numero_dossier,
          enfant_nom,
          enfant_prenom,
          classe_nom,
          photo_url,
          montant_total_plan,
          montant_restant_plan
        )
        VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        eleveId,
        parentId,
        anneeScolaire.rows[0]?.id || null,
        classeId,
        fraisReinscription,
        numeroDossier,
        info.enfant_nom,
        info.enfant_prenom,
        classeNom,
        info.photo_url,
        totalGeneral,
        totalGeneral
      ]);

      const reinscriptionId = result.rows[0].id;

      // ⭐ Créer les échéances pour la réinscription (3 versements)
      if (classe) {
        const premier = Number(classe.reinscription_premier_versement) || 0;
        const deuxieme = Number(classe.reinscription_deuxieme_versement) || 0;
        const troisieme = Number(classe.reinscription_troisieme_versement) || 0;

        // 1er versement (immédiat)
        if (premier > 0) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, 
              type, 
              echeance, 
              montant, 
              date_echeance, 
              statut
            ) VALUES ($1, 'reinscription', '1er_versement', $2, CURRENT_DATE, 'en_attente')
          `, [reinscriptionId, premier]);
        }

        // 2ème versement (Décembre)
        if (deuxieme > 0) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, 
              type, 
              echeance, 
              montant, 
              date_echeance, 
              statut
            ) VALUES ($1, 'reinscription', '2eme_versement', $2, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 months', 'en_attente')
          `, [reinscriptionId, deuxieme]);
        }

        // 3ème versement (Février)
        if (troisieme > 0) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, 
              type, 
              echeance, 
              montant, 
              date_echeance, 
              statut
            ) VALUES ($1, 'reinscription', '3eme_versement', $2, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 months', 'en_attente')
          `, [reinscriptionId, troisieme]);
        }
      }

      // ⭐ Créer les échéances pour le transport
      if (transport && transport.length > 0) {
        for (const t of transport) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, 
              type, 
              echeance, 
              montant, 
              date_echeance, 
              statut
            ) VALUES ($1, 'transport', $2, $3, CURRENT_DATE, 'en_attente')
          `, [reinscriptionId, t.nom || 'transport', t.prix || 0]);
        }
      }

      // ⭐ Créer les échéances pour la cantine
      if (cantine && cantine.length > 0) {
        for (const c of cantine) {
          await query(`
            INSERT INTO echeances_paiement (
              reinscription_id, 
              type, 
              echeance, 
              montant, 
              date_echeance, 
              statut
            ) VALUES ($1, 'cantine', $2, $3, CURRENT_DATE, 'en_attente')
          `, [reinscriptionId, c.nom || 'cantine', c.prix || 0]);
        }
      }
        // ⭐ Créer les échéances pour les fournitures
        if (fournitures && fournitures.length > 0) {
          for (const f of fournitures) {
            const montantTotal = (f.quantite || 1) * (f.prix_unitaire || 0);
            if (montantTotal > 0) {
              await query(`
                INSERT INTO echeances_paiement (
                  reinscription_id, 
                  type, 
                  echeance, 
                  montant, 
                  date_echeance, 
                  statut
                ) VALUES ($1, 'fournitures', $2, $3, CURRENT_DATE, 'en_attente')
              `, [
                reinscriptionId, 
                f.nom || 'fournitures', 
                montantTotal
              ]);
              console.log(`✅ Échéance fournitures créée: ${f.nom} - ${montantTotal} GNF`);
            }
          }
        }
      await query('COMMIT');

      return NextResponse.json({
        success: true,
        data: { id: reinscriptionId },
        message: "Réinscription créée avec succès"
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur API Parent Réinscriptions (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}