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

    // 3. Récupérer les paiements effectués (total payé)
    const paiements = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye,
        COUNT(*) as nombre_paiements
      FROM paiements
      WHERE eleve_id = $1 AND statut = 'valide'
    `, [eleveId]);

    // 4. ⭐ FRAIS D'INSCRIPTION - depuis la classe de l'élève
    const fraisInscription = await query(`
      SELECT COALESCE(c.frais_inscription, 0) as frais_inscription
      FROM eleves e
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    // 5. ⭐ TRANSPORT - frais que l'élève DOIT payer (comme dans l'admin)
    // Prendre le prix de la ligne de transport active ou le prix par défaut
    const transport = await query(`
      SELECT COALESCE(lt.prix_abonnement, 0) as total_transport
      FROM inscriptions_transport it
      LEFT JOIN lignes_transport lt ON it.ligne_id = lt.id
      WHERE it.eleve_id = $1 AND it.est_actif = true
    `, [eleveId]);

    // Si pas d'inscription transport active, prendre le prix d'une ligne par défaut
    let totalTransport = transport.rows[0]?.total_transport || 0;
    if (totalTransport === 0) {
      const defaultTransport = await query(`
        SELECT COALESCE(MAX(prix_abonnement), 0) as prix
        FROM lignes_transport
      `, []);
      totalTransport = defaultTransport.rows[0]?.prix || 0;
    }

    // 6. ⭐ CANTINE - frais que l'élève DOIT payer (comme dans l'admin)
    // Prendre le prix annuel du dernier menu
    const cantine = await query(`
      SELECT COALESCE(prix_annuel, 0) as prix_annuel
      FROM cantine_menus
      ORDER BY date DESC
      LIMIT 1
    `, []);
    const totalCantine = cantine.rows[0]?.prix_annuel || 0;

    // 7. ⭐ FOURNITURES - frais que l'élève DOIT payer (comme dans l'admin)
    const fournitures = await query(`
      SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total_fournitures
      FROM commandes_fournitures cf
      JOIN preinscriptions p ON cf.preinscription_id = p.id
      JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1
    `, [eleveId]);

    const totalFournitures = fournitures.rows[0]?.total_fournitures || 0;

    // 8. ⭐ SCOLARITÉ (mensualités) - frais que l'élève DOIT payer (comme dans l'admin)
    const scolarite = await query(`
      SELECT COALESCE(SUM(f.montant), 0) as total_scolarite
      FROM frais_scolaires f
      WHERE f.type_frais = 'mensualite' 
        AND f.annee_scolaire_id = (
          SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
        )
    `, []);
    const totalScolarite = scolarite.rows[0]?.total_scolarite || 0;

    // 9. Récupérer le détail des paiements
    const paiementsDetail = await query(`
      SELECT 
        montant,
        type_frais,
        mode_paiement,
        date_paiement,
        reference_transaction
      FROM paiements
      WHERE eleve_id = $1 AND statut = 'valide'
      ORDER BY date_paiement DESC
      LIMIT 10
    `, [eleveId]);

    // Calcul des totaux
    const fraisInscriptionTotal = Number(fraisInscription.rows[0]?.frais_inscription) || 0;
    const totalPaye = Number(paiements.rows[0]?.total_paye) || 0;

    // ⭐⭐⭐ Total général des frais (CE QUE L'ÉLÈVE DOIT PAYER) - comme dans l'admin ⭐⭐⭐
    const totalFraisGeneral = fraisInscriptionTotal + totalTransport + totalCantine + totalFournitures + totalScolarite;
    const soldeRestant = Math.max(0, totalFraisGeneral - totalPaye);

    console.log(`=== STATS pour eleve_id ${eleveId} ===`);
    console.log("Frais inscription:", fraisInscriptionTotal);
    console.log("Transport:", totalTransport);
    console.log("Cantine:", totalCantine);
    console.log("Fournitures:", totalFournitures);
    console.log("Scolarité:", totalScolarite);
    console.log("Total payé:", totalPaye);
    console.log("Total général (à payer):", totalFraisGeneral);
    console.log("Solde restant:", soldeRestant);

    return NextResponse.json({
      notes: notes.rows,
      presences: presences.rows[0] || { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: {
        total_paye: totalPaye,
        nombre_paiements: Number(paiements.rows[0]?.nombre_paiements) || 0,
        details: paiementsDetail.rows || []
      },
      // ⭐ Détail des frais (ce que l'élève DOIT payer)
      frais_inscription: fraisInscriptionTotal,
      transport: totalTransport,
      cantine: totalCantine,
      fournitures: totalFournitures,
      scolarite: totalScolarite,
      total_frais_general: totalFraisGeneral,
      solde_restant: soldeRestant
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      notes: [],
      presences: { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: { total_paye: 0, nombre_paiements: 0, details: [] },
      frais_inscription: 0,
      transport: 0,
      cantine: 0,
      fournitures: 0,
      scolarite: 0,
      total_frais_general: 0,
      solde_restant: 0
    }, { status: 500 });
  }
}