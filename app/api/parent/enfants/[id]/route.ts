// app/api/parent/enfants/[id]/route.ts
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

    console.log(`📊 Récupération des détails pour l'élève ${eleveId}`);

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

    // ===================== 1. INFOS DE L'ÉLÈVE AVEC DOCUMENTS =====================
    const eleveInfo = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.photo_url as eleve_photo_url,
        e.carte_scolaire_url,
        c.nom as classe_nom,
        c.niveau,
        c.frais_inscription as frais_inscription_classe,
        i.id as inscription_id,
        i.date_inscription,
        i.statut as inscription_statut,
        a.libelle as annee_scolaire,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        pu.email as parent_email,
        pu.telephone as parent_telephone,
        p.profession as parent_profession,
        p.situation_matrimoniale as mere_info,
        pre.numero_dossier,
        pre.acte_naissance_url,
        pre.bulletin_url,
        pre.photo_url as preinscription_photo_url
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions i ON i.eleve_id = e.id AND i.statut = 'active'
      LEFT JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
      LEFT JOIN preinscriptions pre ON i.preinscription_id = pre.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE e.id = $1
    `, [eleveId]);

    if (eleveInfo.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const eleveData = eleveInfo.rows[0];

    // ⭐ Fusionner les URLs des photos (priorité: eleve.photo_url, puis preinscription.photo_url)
    const photoUrl = eleveData.eleve_photo_url || eleveData.preinscription_photo_url || null;

    // ===================== 2. NOTES =====================
    const notes = await query(`
      SELECT 
        m.nom as matiere,
        COALESCE(AVG(n.valeur), 0) as moyenne,
        m.coefficient,
        COUNT(n.id) as nombre_notes,
        json_agg(
          json_build_object(
            'valeur', n.valeur,
            'type_note', n.type_note,
            'date_saisie', n.date_saisie,
            'commentaire', n.commentaire
          )
          ORDER BY n.date_saisie DESC
        ) as details_notes
      FROM notes n
      JOIN enseignements e ON n.enseignement_id = e.id
      JOIN matieres m ON e.matiere_id = m.id
      WHERE n.eleve_id = $1
      GROUP BY m.id, m.nom, m.coefficient
      ORDER BY m.nom
    `, [eleveId]);

    // ===================== 3. PRÉSENCES =====================
    const presences = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards,
        SUM(CASE WHEN statut = 'justifie' THEN 1 ELSE 0 END) as justifies
      FROM presences
      WHERE eleve_id = $1
    `, [eleveId]);

    // ===================== 4. FRAIS D'INSCRIPTION =====================
    const fraisInscription = await query(`
      SELECT COALESCE(c.frais_inscription, 0) as frais_inscription
      FROM eleves e
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    // ===================== 5. TRANSPORT =====================
    const transport = await query(`
      SELECT 
        COALESCE(lt.prix_abonnement, 0) as prix_abonnement,
        lt.nom as ligne_nom,
        lt.horaire_matin,
        lt.horaire_soir,
        it.date_debut,
        it.date_fin,
        it.est_actif
      FROM inscriptions_transport it
      LEFT JOIN lignes_transport lt ON it.ligne_id = lt.id
      WHERE it.eleve_id = $1 AND it.est_actif = true
    `, [eleveId]);

    let totalTransport = 0;
    let transportDetails = null;

    if (transport.rows.length > 0 && transport.rows[0].prix_abonnement) {
      totalTransport = Number(transport.rows[0].prix_abonnement);
      transportDetails = transport.rows[0];
    } else {
      const defaultTransport = await query(`
        SELECT 
          prix_abonnement,
          nom,
          horaire_matin,
          horaire_soir
        FROM lignes_transport
        LIMIT 1
      `, []);

      if (defaultTransport.rows.length > 0) {
        totalTransport = Number(defaultTransport.rows[0].prix_abonnement) || 0;
        transportDetails = {
          prix_abonnement: totalTransport,
          ligne_nom: defaultTransport.rows[0].nom,
          horaire_matin: defaultTransport.rows[0].horaire_matin,
          horaire_soir: defaultTransport.rows[0].horaire_soir,
          date_debut: null,
          date_fin: null,
          est_actif: false
        };
      }
    }

    // ===================== 6. CANTINE =====================
    const cantine = await query(`
      SELECT 
        prix_annuel,
        plat,
        accompagnement
      FROM cantine_menus
      ORDER BY date DESC
      LIMIT 1
    `, []);

    const totalCantine = Number(cantine.rows[0]?.prix_annuel) || 0;

    const inscriptionCantine = await query(`
      SELECT 
        ic.est_actif,
        ic.solde,
        ic.date_inscription,
        ic.preferences_alimentaires,
        ic.allergies
      FROM inscriptions_cantine ic
      WHERE ic.eleve_id = $1 AND ic.est_actif = true
    `, [eleveId]);

    // ===================== 7. FOURNITURES =====================
    const fournitures = await query(`
      SELECT 
        COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total_fournitures,
        json_agg(
          json_build_object(
            'nom', al.nom,
            'quantite', cf.quantite,
            'prix_unitaire', cf.prix_unitaire,
            'total', cf.quantite * cf.prix_unitaire
          )
        ) as details_fournitures
      FROM commandes_fournitures cf
      JOIN articles_librairie al ON cf.article_id = al.id
      LEFT JOIN preinscriptions p ON cf.preinscription_id = p.id
      LEFT JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1
    `, [eleveId]);

    const totalFournitures = Number(fournitures.rows[0]?.total_fournitures) || 0;

    // ===================== 8. SCOLARITÉ =====================
    const scolarite = await query(`
      SELECT COALESCE(SUM(montant), 0) as total_scolarite
      FROM paiements
      WHERE eleve_id = $1 
        AND type_frais = 'mensualite' 
        AND statut = 'valide'
    `, [eleveId]);

    // ===================== 9. PAIEMENTS =====================
    const paiementsDirects = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye_direct,
        COUNT(*) as nombre_paiements_direct,
        COALESCE(json_agg(
          json_build_object(
            'montant', montant,
            'type_frais', type_frais,
            'mode_paiement', mode_paiement,
            'date_paiement', date_paiement,
            'reference_transaction', reference_transaction,
            'mois', mois,
            'annee', annee,
            'source', 'paiement_direct'
          )
          ORDER BY date_paiement DESC
        ), '[]'::json) as details_direct
      FROM paiements
      WHERE eleve_id = $1 AND statut = 'valide'
    `, [eleveId]);

    // Récupérer la pré-inscription
    const preinscriptionInfo = await query(`
      SELECT preinscription_id 
      FROM inscriptions 
      WHERE eleve_id = $1 AND statut = 'active'
      LIMIT 1
    `, [eleveId]);

    let preinscriptionId = null;
    if (preinscriptionInfo.rows.length > 0) {
      preinscriptionId = preinscriptionInfo.rows[0].preinscription_id;
    } else {
      const preinsByParent = await query(`
        SELECT p.id 
        FROM preinscriptions p
        JOIN parents pa ON p.parent_id = pa.id
        JOIN lien_parent_eleve lpe ON lpe.parent_id = pa.id
        WHERE lpe.eleve_id = $1
        ORDER BY p.date_preinscription DESC
        LIMIT 1
      `, [eleveId]);
      if (preinsByParent.rows.length > 0) {
        preinscriptionId = preinsByParent.rows[0].id;
      }
    }

    let echeancesRows: any[] = [];
    let totalPayeEcheances = 0;

    if (preinscriptionId) {
      const echeancesPayees = await query(`
        SELECT 
          e.id,
          e.montant,
          e.type,
          e.echeance,
          e.mode_paiement,
          e.date_paiement,
          e.reference_transaction,
          'echeance' as source,
          CASE 
            WHEN e.type = 'inscription' THEN 'Inscription'
            WHEN e.type = 'transport' THEN 'Transport'
            WHEN e.type = 'cantine' THEN 'Cantine'
            WHEN e.type = 'fournitures' THEN 'Fournitures'
            ELSE e.type
          END as type_frais_label,
          e.echeance as echeance_label
        FROM echeances_paiement e
        WHERE e.preinscription_id = $1 AND e.statut = 'paye'
        ORDER BY e.date_paiement DESC
      `, [preinscriptionId]);
      
      echeancesRows = echeancesPayees.rows || [];
      totalPayeEcheances = echeancesRows.reduce((sum, e) => sum + Number(e.montant), 0);
    }

    const totalPayeDirect = Number(paiementsDirects.rows[0]?.total_paye_direct) || 0;
    const totalPaye = totalPayeDirect + totalPayeEcheances;

    const detailsDirects = paiementsDirects.rows[0]?.details_direct || [];
    const detailsEcheances = echeancesRows.map(e => ({
      montant: Number(e.montant),
      type_frais: e.type_frais_label || e.type || 'echeance',
      mode_paiement: e.mode_paiement || 'N/A',
      date_paiement: e.date_paiement || new Date().toISOString(),
      reference_transaction: e.reference_transaction || null,
      source: e.source || 'echeance',
      echeance_label: e.echeance_label || e.echeance || '',
      id: e.id
    }));

    const detailsPaiements = [...detailsDirects, ...detailsEcheances].sort((a, b) => 
      new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
    );

    const nombrePaiementsDirect = Number(paiementsDirects.rows[0]?.nombre_paiements_direct) || 0;
    const nombreEcheances = echeancesRows.length;
    const nombrePaiements = nombrePaiementsDirect + nombreEcheances;

    // ===================== 10. BULLETIN =====================
    let bulletinsData: any[] = [];

    try {
      const bulletins = await query(`
        SELECT 
          b.id,
          b.titre,
          b.fichier_url,
          b.periodicite,
          b.date_publication,
          b.trimestre,
          b.annee_scolaire_id,
          a.libelle as annee_scolaire
        FROM bulletins b
        LEFT JOIN annees_scolaires a ON b.annee_scolaire_id = a.id
        WHERE b.eleve_id = $1
        ORDER BY b.date_publication DESC
      `, [eleveId]);
      bulletinsData = bulletins.rows;
    } catch (e) {
      console.log("Table bulletins non trouvée, recherche dans preinscriptions");
    }

    if (bulletinsData.length === 0) {
      try {
        const preinscriptionBulletin = await query(`
          SELECT 
            pre.bulletin_url as fichier_url,
            'Bulletin scolaire' as titre,
            pre.date_preinscription as date_publication
          FROM preinscriptions pre
          JOIN inscriptions i ON i.preinscription_id = pre.id
          WHERE i.eleve_id = $1 AND pre.bulletin_url IS NOT NULL
        `, [eleveId]);
        bulletinsData = preinscriptionBulletin.rows;
      } catch (e) {
        console.log("Erreur récupération bulletin depuis preinscriptions:", e);
        bulletinsData = [];
      }
    }

    // ===================== CALCUL DES TOTAUX =====================
    const fraisInscriptionTotal = Number(fraisInscription.rows[0]?.frais_inscription) || 0;
    const totalScolarite = Number(scolarite.rows[0]?.total_scolarite) || 0;

    const totalFraisGeneral = fraisInscriptionTotal + totalTransport + totalCantine + totalFournitures;
    const soldeRestant = Math.max(0, totalFraisGeneral - totalPaye);

    // Calcul de la moyenne générale
    let moyenneGenerale = 0;
    let totalCoefficients = 0;
    notes.rows.forEach((note: any) => {
      const moyenne = Number(note.moyenne) || 0;
      const coeff = Number(note.coefficient) || 1;
      moyenneGenerale += moyenne * coeff;
      totalCoefficients += coeff;
    });
    moyenneGenerale = totalCoefficients > 0 ? moyenneGenerale / totalCoefficients : 0;

    const getAppreciation = (moyenne: number) => {
      if (moyenne >= 16) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
      if (moyenne >= 14) return { text: "Très bien", color: "text-blue-600", bg: "bg-blue-100" };
      if (moyenne >= 12) return { text: "Bien", color: "text-cyan-600", bg: "bg-cyan-100" };
      if (moyenne >= 10) return { text: "Passable", color: "text-yellow-600", bg: "bg-yellow-100" };
      return { text: "À améliorer", color: "text-red-600", bg: "bg-red-100" };
    };

    const tauxPresence = presences.rows[0]?.total > 0
      ? ((presences.rows[0].presents / presences.rows[0].total) * 100).toFixed(1)
      : "0";

    console.log(`=== DÉTAILS COMPLETS pour eleve_id ${eleveId} ===`);

    // ===================== RÉPONSE JSON =====================
    return NextResponse.json({
      eleve: {
        ...eleveData,
        // ⭐ Utiliser la photo fusionnée
        photo_url: photoUrl,
        // ⭐ Utiliser les URLs des documents depuis preinscriptions ou eleve
        acte_naissance_url: eleveData.acte_naissance_url || null,
        bulletin_url: eleveData.bulletin_url || null,
        moyenne_generale: parseFloat(moyenneGenerale.toFixed(2)),
        appreciation: getAppreciation(moyenneGenerale),
        taux_presence: tauxPresence
      },

      notes: notes.rows.map((row: any) => ({
        matiere: row.matiere,
        moyenne: parseFloat(row.moyenne.toFixed(2)),
        coefficient: row.coefficient,
        nombre_notes: row.nombre_notes,
        details_notes: row.details_notes || []
      })),

      presences: presences.rows[0] || { total: 0, presents: 0, absents: 0, retards: 0, justifies: 0 },

      frais: {
        inscription: fraisInscriptionTotal,
        transport: totalTransport,
        transport_details: transportDetails,
        cantine: totalCantine,
        cantine_details: {
          menu: cantine.rows[0] || null,
          inscription: inscriptionCantine.rows[0] || null
        },
        fournitures: totalFournitures,
        fournitures_details: fournitures.rows[0]?.details_fournitures || [],
        scolarite: totalScolarite,
        total_a_payer: totalFraisGeneral,
        total_paye: totalPaye,
        total_paye_direct: totalPayeDirect,
        total_paye_echeances: totalPayeEcheances,
        solde_restant: soldeRestant,
        paiements: detailsPaiements
      },

      bulletins: bulletinsData,

      statistiques: {
        nombre_notes: notes.rows.length,
        taux_presence: parseFloat(tauxPresence),
        nombre_paiements: nombrePaiements,
        nombre_paiements_direct: nombrePaiementsDirect,
        nombre_echeances: nombreEcheances
      }
    });

  } catch (error) {
    console.error("Erreur détail enfant:", error);
    return NextResponse.json({
      error: "Erreur serveur: " + (error as Error).message,
      eleve: null,
      notes: [],
      presences: { total: 0, presents: 0, absents: 0, retards: 0, justifies: 0 },
      frais: {
        inscription: 0,
        transport: 0,
        transport_details: null,
        cantine: 0,
        cantine_details: null,
        fournitures: 0,
        fournitures_details: [],
        scolarite: 0,
        total_a_payer: 0,
        total_paye: 0,
        total_paye_direct: 0,
        total_paye_echeances: 0,
        solde_restant: 0,
        paiements: []
      },
      bulletins: [],
      statistiques: { nombre_notes: 0, taux_presence: 0, nombre_paiements: 0 }
    }, { status: 500 });
  }
}