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

    // Récupérer les notes avec le nom de la matière via la table enseignements
    const notes = await query(`
      SELECT 
        m.nom as matiere,
        n.valeur as moyenne,
        n.coefficient,
        n.type_note,
        n.date_saisie
      FROM notes n
      JOIN enseignements e ON n.enseignement_id = e.id
      JOIN matieres m ON e.matiere_id = m.id
      WHERE n.eleve_id = $1
      ORDER BY n.date_saisie DESC
    `, [eleveId]);

    // Récupérer les présences
    const presences = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards
      FROM presences
      WHERE eleve_id = $1
    `, [eleveId]);

    // Récupérer les paiements effectués par cet élève
    const paiements = await query(`
      SELECT 
        COALESCE(SUM(montant), 0) as total_paye,
        COUNT(*) as nombre_paiements
      FROM paiements
      WHERE eleve_id = $1 AND statut = 'valide'
    `, [eleveId]);

    // Récupérer le montant total des frais d'inscription pour cette classe
    const fraisInscription = await query(`
      SELECT c.frais_inscription
      FROM eleves e
      JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    // Récupérer le détail des paiements
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

    // Logs de débogage
    console.log(`=== STATS pour eleve_id ${eleveId} ===`);
    console.log("Paiements:", paiements.rows);
    console.log("Frais inscription:", fraisInscription.rows);
    console.log("Notes trouvées:", notes.rows.length);

    return NextResponse.json({
      notes: notes.rows,
      presences: presences.rows[0] || { total: 0, presents: 0, absents: 0, retards: 0 },
      paiements: {
        total_paye: paiements.rows[0]?.total_paye || 0,
        nombre_paiements: paiements.rows[0]?.nombre_paiements || 0,
        details: paiementsDetail.rows || []
      },
      frais_inscription_total: fraisInscription.rows[0]?.frais_inscription || 0,
      solde_restant: (fraisInscription.rows[0]?.frais_inscription || 0) - (paiements.rows[0]?.total_paye || 0)
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}