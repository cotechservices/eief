// app/api/parent/enfants/[id]/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ⭐ STATS PAR DÉFAUT
const DEFAULT_STATS_RESPONSE = {
  notes: [],
  presences: { total: 0, presents: 0, absents: 0, retards: 0 },
  paiements: { total_paye: 0, nombre_paiements: 0, details: [] },
  frais_inscription: 0,
  frais_reinscription: 0,
  transport: 0,
  cantine: 0,
  fournitures: 0,
  scolarite: 0,
  total_frais_general: 0,
  montant_a_payer: 0,
  solde_restant: 0,
  plan_paiement: null,
  pourcentage_paye: 0
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { ...DEFAULT_STATS_RESPONSE, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const eleveId = parseInt(resolvedParams.id);
    const userEmail = session.user?.email;
    const userRole = (session.user as any)?.role;

    if (isNaN(eleveId)) {
      return NextResponse.json(
        { ...DEFAULT_STATS_RESPONSE, error: "ID invalide" },
        { status: 400 }
      );
    }

    // ⭐ VÉRIFICATION DES DROITS - Retourner des stats par défaut si pas d'accès
    let hasAccess = false;

    // Si SUPER_ADMIN ou COMPTABLE, accès total
    if (userRole === "SUPER_ADMIN" || userRole === "COMPTABLE") {
      hasAccess = true;
    } else {
      // Vérifier que l'enfant appartient au parent
      const checkParent = await query(`
        SELECT 1 FROM lien_parent_eleve lpe
        JOIN parents p ON lpe.parent_id = p.id
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        WHERE lpe.eleve_id = $1 AND u.email = $2
      `, [eleveId, userEmail]);

      hasAccess = checkParent.rows.length > 0;
    }

    // ⭐ SI PAS D'ACCÈS, RETOURNER DES STATS PAR DÉFAUT (pas d'erreur 403)
    if (!hasAccess) {
      console.warn(`⚠️ Accès refusé pour l'élève ${eleveId} par l'utilisateur ${userEmail} - Retour des stats par défaut`);
      return NextResponse.json(DEFAULT_STATS_RESPONSE);
    }

    // ⭐ RÉCUPÉRATION DES STATISTIQUES
    // 1. NOTES
    const notes = await query(`
      SELECT 
        m.nom as matiere,
        COALESCE(AVG(n.valeur), 0) as moyenne,
        m.coefficient,
        COUNT(n.id) as nombre_notes
      FROM notes n
      JOIN enseignements e ON n.enseignement_id = e.id
      JOIN matieres m ON e.matiere_id = m.id
      WHERE n.eleve_id = $1
      GROUP BY m.id, m.nom, m.coefficient
    `, [eleveId]);

    // 2. PRÉSENCES
    const presences = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards
      FROM presences
      WHERE eleve_id = $1
    `, [eleveId]);

    // 3. FRAIS DE LA CLASSE
    const classeInfo = await query(`
      SELECT 
        c.total_versement as frais_inscription,
        c.reinscription_total_versement as frais_reinscription,
        c.premier_versement,
        c.deuxieme_versement,
        c.troisieme_versement,
        c.nom as classe_nom,
        c.niveau
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    const fraisInscription = Number(classeInfo.rows[0]?.frais_inscription) || 0;
    const fraisReinscription = Number(classeInfo.rows[0]?.frais_reinscription) || 0;
    const fraisBase = fraisReinscription > 0 ? fraisReinscription : fraisInscription;

    // 4. SERVICES OPTIONNELS - Transport
    const transportQuery = await query(`
      SELECT COALESCE(SUM(lt.prix_abonnement), 0) as total
      FROM inscriptions_transport it
      JOIN lignes_transport lt ON it.ligne_id = lt.id
      WHERE it.eleve_id = $1 AND it.est_actif = true
    `, [eleveId]);
    const transportTotal = Number(transportQuery.rows[0]?.total) || 0;

    // Cantine
    const cantineQuery = await query(`
      SELECT COALESCE(SUM(prix_annuel), 0) as total
      FROM inscriptions_cantine ic
      JOIN cantine_menus cm ON cm.id = (
        SELECT id FROM cantine_menus 
        WHERE date <= CURRENT_DATE 
        ORDER BY date DESC LIMIT 1
      )
      WHERE ic.eleve_id = $1 AND ic.est_actif = true
    `, [eleveId]);
    const cantineTotal = Number(cantineQuery.rows[0]?.total) || 0;

    // Fournitures
    const fournituresQuery = await query(`
      SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total
      FROM commandes_fournitures cf
      JOIN preinscriptions p ON cf.preinscription_id = p.id
      JOIN inscriptions i ON i.preinscription_id = p.id
      WHERE i.eleve_id = $1
    `, [eleveId]);
    const fournituresTotal = Number(fournituresQuery.rows[0]?.total) || 0;

    // 5. TOTAL DES FRAIS
    const totalFraisGeneral = fraisBase + transportTotal + cantineTotal + fournituresTotal;

    // 6. PAIEMENTS - SOURCE UNIQUE SANS DOUBLE COMPTAGE
    // On récupère en une seule requête TOUS les paiements valides liés à cet élève :
    //   - Directement via eleve_id
    //   - Via SA pré-inscription (inscriptions.preinscription_id pour cet élève)
    //   - Via SA réinscription (reinscriptions.eleve_id)
    // On évite de passer par parent_id (qui ramènerait les paiements de TOUS les enfants du parent)
    const paiementsResult = await query(`
      SELECT COALESCE(SUM(montant), 0) as total
      FROM paiements
      WHERE statut = 'valide'
        AND (
          eleve_id = $1
          OR preinscription_id IN (
            SELECT preinscription_id FROM inscriptions WHERE eleve_id = $1 AND preinscription_id IS NOT NULL
          )
          OR reinscription_id IN (
            SELECT id FROM reinscriptions WHERE eleve_id = $1
          )
        )
    `, [eleveId]);
    const totalPaye = Number(paiementsResult.rows[0]?.total) || 0;

    // 7. CALCUL FINAL
    const montantAPayer = Math.max(0, totalFraisGeneral - totalPaye);
    const pourcentagePaye = totalFraisGeneral > 0 ? Math.round((totalPaye / totalFraisGeneral) * 100) : 0;

    console.log(`📊 Stats pour eleve_id ${eleveId}:`, {
      fraisBase,
      transportTotal,
      cantineTotal,
      fournituresTotal,
      totalFraisGeneral,
      totalPaye,
      montantAPayer,
      pourcentagePaye
    });

    return NextResponse.json({
      notes: notes.rows || [],
      presences: presences.rows[0] || { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: {
        total_paye: totalPaye,
        nombre_paiements: 0,
        details: []
      },
      frais_inscription: fraisInscription,
      frais_reinscription: fraisReinscription,
      transport: transportTotal,
      cantine: cantineTotal,
      fournitures: fournituresTotal,
      scolarite: 0,
      total_frais_general: totalFraisGeneral,
      montant_a_payer: montantAPayer,
      solde_restant: montantAPayer,
      plan_paiement: classeInfo.rows[0] || null,
      pourcentage_paye: pourcentagePaye
    });

  } catch (error) {
    console.error("Erreur stats:", error);
    // ⭐ En cas d'erreur, retourner des stats par défaut
    return NextResponse.json(DEFAULT_STATS_RESPONSE);
  }
}