// app/api/parent/reinscriptions/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// app/api/parent/reinscriptions/route.ts

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    // ⭐ Récupérer les réinscriptions
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
        a.libelle as annee_scolaire,
        COALESCE(cl.reinscription_total_versement, cl.total_versement, 0) as frais_reinscription_classe,
        COALESCE(cl.reinscription_premier_versement, cl.premier_versement, 0) as premier_versement_classe,
        COALESCE(cl.reinscription_deuxieme_versement, cl.deuxieme_versement, 0) as deuxieme_versement_classe,
        COALESCE(cl.reinscription_troisieme_versement, cl.troisieme_versement, 0) as troisieme_versement_classe
      FROM reinscriptions r
      JOIN eleves e ON r.eleve_id = e.id
      JOIN parents p ON r.parent_id = p.id
      JOIN utilisateurs u_parent ON p.utilisateur_id = u_parent.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN classes cl ON r.classe_id = cl.id
      LEFT JOIN annees_scolaires a ON r.annee_scolaire_id = a.id
      WHERE u_parent.email = $1
      ORDER BY r.date_reinscription DESC
    `, [userEmail]);

    // ⭐ Récupérer les échéances et paiements pour chaque réinscription
    const reinscriptionsWithDetails = await Promise.all(
      result.rows.map(async (reinscription) => {
        // Récupérer les échéances
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

        // ⭐ Récupérer les paiements validés (UNIQUE SOURCE)
        const paiements = await query(`
          SELECT 
            id,
            montant,
            type_frais,
            mode_paiement,
            date_paiement,
            reference_transaction,
            statut
          FROM paiements
          WHERE reinscription_id = $1 AND statut = 'valide'
        `, [reinscription.id]);

        // ⭐ Calculer le montant total
        let montantTotal = Number(reinscription.frais_reinscription_classe) || 0;
        if (montantTotal === 0) montantTotal = Number(reinscription.montant_total_plan) || 0;
        if (montantTotal === 0) montantTotal = Number(reinscription.montant_frais) || 0;

        // ⭐ Calculer le total payé UNIQUEMENT à partir des paiements
        const totalPaye = paiements.rows.reduce((sum: number, p: any) => sum + Number(p.montant), 0);

        // ⭐ Calculer le restant
        const restant = Math.max(0, montantTotal - totalPaye);

        // ⭐ Déterminer le statut de paiement
        let fraisStatut = 'non_paye';
        if (montantTotal > 0) {
          if (restant === 0) {
            fraisStatut = 'paye';
          } else if (totalPaye > 0 && restant > 0) {
            fraisStatut = 'partiel';
          }
        }

        // ⭐ Mettre à jour le statut dans la base si différent
        if (fraisStatut !== reinscription.frais_statut) {
          await query(`
            UPDATE reinscriptions 
            SET frais_statut = $1,
                montant_restant_plan = $2
            WHERE id = $3
          `, [fraisStatut, restant, reinscription.id]);
        }

        // ⭐ Calculer les montants des services payés
        const transportPaye = paiements.rows
          .filter((p: any) => p.type_frais === 'transport')
          .reduce((sum: number, p: any) => sum + Number(p.montant), 0);

        const cantinePaye = paiements.rows
          .filter((p: any) => p.type_frais === 'cantine')
          .reduce((sum: number, p: any) => sum + Number(p.montant), 0);

        const fournituresPaye = paiements.rows
          .filter((p: any) => p.type_frais === 'fournitures')
          .reduce((sum: number, p: any) => sum + Number(p.montant), 0);

        return {
          ...reinscription,
          echeances: echeances.rows,
          paiements: paiements.rows,
          montant_total: montantTotal,
          montant_paye: totalPaye,
          montant_restant: restant,
          frais_statut: fraisStatut,
          transport_montant: transportPaye,
          cantine_montant: cantinePaye,
          fournitures_montant: fournituresPaye
        };
      })
    );

    return NextResponse.json(reinscriptionsWithDetails);
  } catch (error) {
    console.error("Erreur API Parent Réinscriptions (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ POST - Créer une réinscription (corrigé)
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
      montantFournitures
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

    // ⭐ Récupérer la classe choisie avec les montants de réinscription
    const classeInfo = await query(`
      SELECT 
        nom,
        reinscription_premier_versement,
        reinscription_deuxieme_versement,
        reinscription_troisieme_versement,
        reinscription_total_versement,
        total_versement,
        premier_versement,
        deuxieme_versement,
        troisieme_versement
      FROM classes 
      WHERE id = $1
    `, [classeId]);

    const classe = classeInfo.rows[0];
    const classeNom = classe?.nom || null;

    // ⭐ Calculer les frais de réinscription depuis la classe
    let fraisReinscription = 0;
    
    // Priorité: reinscription_total_versement > total_versement > montantFrais
    if (classe && classe.reinscription_total_versement > 0) {
      fraisReinscription = Number(classe.reinscription_total_versement);
      console.log(`✅ Frais de réinscription (classe): ${fraisReinscription}`);
    } else if (classe && classe.total_versement > 0) {
      fraisReinscription = Number(classe.total_versement);
      console.log(`⚠️ Utilisation des frais d'inscription: ${fraisReinscription}`);
    } else {
      fraisReinscription = montantFrais || 500000;
      console.log(`⚠️ Utilisation des frais par défaut: ${fraisReinscription}`);
    }

    // Calculer le montant total des services
    const totalServices = (montantTransport || 0) + (montantCantine || 0) + (montantFournitures || 0);
    
    // Montant total de la réinscription (frais + services)
    const totalGeneral = fraisReinscription + totalServices;

    console.log(`📊 Total réinscription: ${fraisReinscription} (frais) + ${totalServices} (services) = ${totalGeneral}`);

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
        // Utiliser les montants de réinscription de la classe
        const premier = Number(classe.reinscription_premier_versement) || Number(classe.premier_versement) || 0;
        const deuxieme = Number(classe.reinscription_deuxieme_versement) || Number(classe.deuxieme_versement) || 0;
        const troisieme = Number(classe.reinscription_troisieme_versement) || Number(classe.troisieme_versement) || 0;

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