// app/api/parent/enfants/[id]/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const eleveId = parseInt(id);
    const userEmail = session.user?.email;

    console.log(`📊 Récupération des stats pour l'élève ${eleveId}`);

    // Vérifier que l'enfant appartient au parent
    const checkParent = await query(`
      SELECT 1 FROM lien_parent_eleve lpe
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE lpe.eleve_id = $1 AND u.email = $2
    `, [eleveId, userEmail]);

    if (checkParent.rows.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // 1. Récupérer les notes
    const notes = await query(`
      SELECT 
        m.nom as matiere,
        COALESCE(AVG(n.valeur), 0) as moyenne,
        m.coefficient,
        n.type_note,
        n.date_saisie
      FROM notes n
      JOIN enseignements e ON n.enseignement_id = e.id
      JOIN matieres m ON e.matiere_id = m.id
      WHERE n.eleve_id = $1
      GROUP BY m.id, m.nom, m.coefficient, n.type_note, n.date_saisie
      ORDER BY n.date_saisie DESC
    `, [eleveId]);

    // 2. Récupérer les présences
    const presences = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards
      FROM presences
      WHERE eleve_id = $1
    `, [eleveId]);

    // ⭐⭐⭐ 3. RÉCUPÉRER LE PLAN DE PAIEMENT DEPUIS LA TABLE CLASSES ⭐⭐⭐
    // Récupérer d'abord la classe de l'élève
    const classeInfo = await query(`
      SELECT 
        c.id as classe_id,
        c.nom as classe_nom,
        c.niveau,
        c.frais_inscription,
        c.premier_versement,
        c.deuxieme_versement,
        c.troisieme_versement,
        c.total_versement
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    let planTotal = 0;
    let planDetails = null;

    if (classeInfo.rows.length > 0) {
      const data = classeInfo.rows[0];
      planTotal = Number(data.total_versement) || 0;
      planDetails = {
        niveau: data.niveau,
        classe: data.classe_nom,
        frais_inscription: Number(data.frais_inscription) || 0,
        premier_versement: Number(data.premier_versement) || 0,
        deuxieme_versement: Number(data.deuxieme_versement) || 0,
        troisieme_versement: Number(data.troisieme_versement) || 0,
        total: Number(data.total_versement) || 0
      };
      console.log(`📊 Plan depuis table classes:`, planDetails);
    }

    // Si pas de classe trouvée, chercher via la pré-inscription
    if (planTotal === 0) {
      const preinscriptionInfo = await query(`
        SELECT 
          p.niveau,
          p.classe,
          p.montant_total_plan
        FROM inscriptions i
        JOIN preinscriptions p ON i.preinscription_id = p.id
        WHERE i.eleve_id = $1
        ORDER BY i.date_inscription DESC
        LIMIT 1
      `, [eleveId]);

      if (preinscriptionInfo.rows.length > 0) {
        const data = preinscriptionInfo.rows[0];
        if (data.montant_total_plan && data.montant_total_plan > 0) {
          planTotal = Number(data.montant_total_plan);
          console.log(`📊 Plan depuis preinscriptions: ${planTotal}`);
        } else {
          // Chercher les montants dans la table classes par le nom de la classe
          const classeFromPreins = await query(`
            SELECT 
              frais_inscription,
              premier_versement,
              deuxieme_versement,
              troisieme_versement,
              total_versement
            FROM classes
            WHERE LOWER(nom) = LOWER($1)
            LIMIT 1
          `, [data.classe]);

          if (classeFromPreins.rows.length > 0) {
            const cData = classeFromPreins.rows[0];
            planTotal = Number(cData.total_versement) || 0;
            planDetails = {
              niveau: data.niveau,
              classe: data.classe,
              frais_inscription: Number(cData.frais_inscription) || 0,
              premier_versement: Number(cData.premier_versement) || 0,
              deuxieme_versement: Number(cData.deuxieme_versement) || 0,
              troisieme_versement: Number(cData.troisieme_versement) || 0,
              total: Number(cData.total_versement) || 0
            };
          }
        }
      }
    }

    // ⭐⭐⭐ 4. TRANSPORT - depuis les pré-inscriptions de l'élève ⭐⭐⭐
    let transportTotal = 0;
    const transportQuery = await query(`
      SELECT COALESCE(SUM(lt.prix_abonnement), 0) as total_transport
      FROM inscriptions i
      JOIN preinscriptions p ON i.preinscription_id = p.id
      LEFT JOIN preinscription_transport pt ON pt.preinscription_id = p.id
      LEFT JOIN lignes_transport lt ON pt.ligne_id = lt.id
      WHERE i.eleve_id = $1
    `, [eleveId]);
    if (transportQuery.rows.length > 0) {
      transportTotal = Number(transportQuery.rows[0].total_transport) || 0;
    }
    console.log(`🚌 Transport: ${transportTotal}`);

    // ⭐⭐⭐ 5. CANTINE - depuis les pré-inscriptions de l'élève ⭐⭐⭐
    let cantineTotal = 0;
    const cantineQuery = await query(`
      SELECT COALESCE(SUM(cm.prix_annuel), 0) as total_cantine
      FROM inscriptions i
      JOIN preinscriptions p ON i.preinscription_id = p.id
      LEFT JOIN preinscription_cantine pc ON pc.preinscription_id = p.id
      LEFT JOIN cantine_menus cm ON pc.menu_id = cm.id
      WHERE i.eleve_id = $1
    `, [eleveId]);
    if (cantineQuery.rows.length > 0) {
      cantineTotal = Number(cantineQuery.rows[0].total_cantine) || 0;
    }
    console.log(`🍽️ Cantine: ${cantineTotal}`);

    // ⭐⭐⭐ 6. FOURNITURES - depuis les commandes de l'élève ⭐⭐⭐
    let fournituresTotal = 0;
    const fournituresQuery = await query(`
      SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total_fournitures
      FROM commandes_fournitures cf
      JOIN preinscriptions p ON cf.preinscription_id = p.id
      JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1
    `, [eleveId]);
    if (fournituresQuery.rows.length > 0) {
      fournituresTotal = Number(fournituresQuery.rows[0].total_fournitures) || 0;
    }
    console.log(`📚 Fournitures: ${fournituresTotal}`);

    // ⭐⭐⭐ 7. SCOLARITÉ (mensualités) - via paiements ⭐⭐⭐
    let scolariteTotal = 0;
    const scolariteQuery = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_scolarite
      FROM paiements
      WHERE eleve_id = $1 AND type_frais = 'mensualite' AND statut IN ('valide', 'paye')
    `, [eleveId]);
    if (scolariteQuery.rows.length > 0) {
      scolariteTotal = Number(scolariteQuery.rows[0].total_scolarite) || 0;
    }
    console.log(`📖 Scolarité: ${scolariteTotal}`);

    // ⭐⭐⭐ 8. TOTAL DES FRAIS = Plan + Transport + Cantine + Fournitures + Scolarité ⭐⭐⭐
    const totalFraisGeneral = planTotal + transportTotal + cantineTotal + fournituresTotal + scolariteTotal;

    // ⭐⭐⭐ 9. PAIEMENTS EFFECTUÉS ⭐⭐⭐
    const paiementsDirects = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye_direct,
        COUNT(*) as nombre_paiements_direct
      FROM paiements
      WHERE eleve_id = $1 AND statut IN ('valide', 'paye')
    `, [eleveId]);

    const echeancesPayees = await query(`
      SELECT 
        COALESCE(SUM(e.montant), 0) as total_paye_echeances,
        COUNT(*) as nombre_echeances
      FROM echeances_paiement e
      JOIN preinscriptions p ON e.preinscription_id = p.id
      JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1 AND e.statut = 'paye'
    `, [eleveId]);

    const totalPayeDirect = Number(paiementsDirects.rows[0]?.total_paye_direct) || 0;
    const totalPayeEcheances = Number(echeancesPayees.rows[0]?.total_paye_echeances) || 0;
    const totalPaye = totalPayeDirect + totalPayeEcheances;

    // ⭐⭐⭐ 10. MONTANT À PAYER = TOTAL DES FRAIS - DÉJÀ PAYÉ ⭐⭐⭐
    const montantAPayer = Math.max(0, totalFraisGeneral - totalPaye);

    // ⭐⭐⭐ 11. SOLDE RESTANT = MONTANT À PAYER ⭐⭐⭐
    const soldeRestant = montantAPayer;

    console.log(`=== RÉSUMÉ STATS pour eleve_id ${eleveId} ===`);
    console.log(`📊 Plan inscription: ${planTotal}`);
    console.log(`🚌 Transport: ${transportTotal}`);
    console.log(`🍽️ Cantine: ${cantineTotal}`);
    console.log(`📚 Fournitures: ${fournituresTotal}`);
    console.log(`📖 Scolarité: ${scolariteTotal}`);
    console.log(`💰 Total des frais: ${totalFraisGeneral}`);
    console.log(`💰 Total payé: ${totalPaye}`);
    console.log(`💰 Montant à payer: ${montantAPayer}`);
    console.log(`📉 Solde restant: ${soldeRestant}`);

    // ⭐ 12. DÉTAIL DES PAIEMENTS
    const paiementsDirectsDetail = await query(`
      SELECT 
        montant,
        type_frais,
        mode_paiement,
        date_paiement,
        reference_transaction,
        'paiement_direct' as source
      FROM paiements
      WHERE eleve_id = $1 AND statut IN ('valide', 'paye')
      ORDER BY date_paiement DESC
      LIMIT 10
    `, [eleveId]);

    const echeancesDetail = await query(`
      SELECT 
        e.montant,
        e.type as type_frais,
        e.mode_paiement,
        e.date_paiement,
        e.reference_transaction,
        'echeance' as source,
        e.echeance as echeance_label
      FROM echeances_paiement e
      JOIN preinscriptions p ON e.preinscription_id = p.id
      JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1 AND e.statut = 'paye'
      ORDER BY e.date_paiement DESC
      LIMIT 10
    `, [eleveId]);

    const paiementsDirectsRows = paiementsDirectsDetail.rows || [];
    const echeancesRows = echeancesDetail.rows || [];
    const paiementsDetail = [...paiementsDirectsRows, ...echeancesRows]
      .sort((a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
      .slice(0, 10);

    // ⭐ 13. RÉPONSE
    return NextResponse.json({
      notes: notes.rows,
      presences: presences.rows[0] || { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: {
        total_paye: totalPaye,
        total_paye_direct: totalPayeDirect,
        total_paye_echeances: totalPayeEcheances,
        nombre_paiements: (Number(paiementsDirects.rows[0]?.nombre_paiements_direct) || 0) + 
                         (Number(echeancesPayees.rows[0]?.nombre_echeances) || 0),
        details: paiementsDetail
      },
      // ⭐ Détail des frais
      frais_inscription: planTotal,
      transport: transportTotal,
      cantine: cantineTotal,
      fournitures: fournituresTotal,
      scolarite: scolariteTotal,
      // ⭐ Total général = somme de tous les frais
      total_frais_general: totalFraisGeneral,
      // ⭐ Montant à payer = total - déjà payé
      montant_a_payer: montantAPayer,
      // ⭐ Solde restant = montant à payer
      solde_restant: soldeRestant,
      // ⭐ Détail du plan
      plan_paiement: planDetails,
      // ⭐ Pourcentage payé
      pourcentage_paye: totalFraisGeneral > 0 ? Math.round((totalPaye / totalFraisGeneral) * 100) : 0
    });

  } catch (error) {
    console.error("❌ Erreur stats:", error);
    return NextResponse.json({
      error: "Erreur serveur",
      notes: [],
      presences: { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: {
        total_paye: 0,
        total_paye_direct: 0,
        total_paye_echeances: 0,
        nombre_paiements: 0,
        details: []
      },
      frais_inscription: 0,
      transport: 0,
      cantine: 0,
      fournitures: 0,
      scolarite: 0,
      total_frais_general: 0,
      montant_a_payer: 0,
      solde_restant: 0,
      plan_paiement: null,
      pourcentage_paye: 0
    }, { status: 500 });
  }
}