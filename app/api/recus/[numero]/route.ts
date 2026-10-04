// app/api/recus/[numero]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { numero: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { numero } = params;

    const result = await query(`
      SELECT 
        r.*,
        e.matricule,
        u.nom as enfant_nom,
        u.prenom as enfant_prenom,
        c.nom as classe_nom,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        pu.email as parent_email,
        pu.telephone as parent_telephone,
        -- ⭐ Récupérer le montant total et le reste à payer réels
        COALESCE((
          SELECT SUM(ep.montant) FROM echeances_paiement ep
          WHERE ep.preinscription_id = p.id
        ), r.montant_total, p.montant_total_plan, 0) as montant_total,
        GREATEST(0, COALESCE((
          SELECT SUM(ep.montant) FROM echeances_paiement ep
          WHERE ep.preinscription_id = p.id
        ), r.montant_total, p.montant_total_plan, 0) - COALESCE((
          SELECT SUM(pp.montant) FROM paiements pp
          WHERE pp.preinscription_id = p.id AND pp.statut = 'valide'
        ), 0)) as reste_a_payer,
        COALESCE(r.classe_nom, p.classe, c.nom) as classe_nom
      FROM recus r
      LEFT JOIN eleves e ON r.eleve_id = e.id
      LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      LEFT JOIN parents pa ON lpe.parent_id = pa.id
      LEFT JOIN utilisateurs pu ON pa.utilisateur_id = pu.id
      LEFT JOIN preinscriptions p ON r.preinscription_id = p.id
      WHERE r.numero_recu = $1
    `, [numero]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Reçu non trouvé" },
        { status: 404 }
      );
    }

    const recu = result.rows[0];

    // Formater les données pour le composant RecuPaiement
    const recuData = {
      numero_recu: recu.numero_recu,
      date_paiement: recu.date_paiement.toISOString(),
      enfant: recu.enfant_nom || `${recu.enfant_prenom || ''} ${recu.enfant_nom || ''}`,
      montant: recu.montant,
      mode_paiement: recu.mode_paiement,
      type_frais: recu.type_frais,
      reference: recu.reference,
      classe: recu.classe_nom || '',
      parent_nom: recu.parent_nom ? `${recu.parent_prenom || ''} ${recu.parent_nom}` : '',
      parent_email: recu.parent_email || '',
      source: recu.source || 'paiement',
      // ⭐ CHAMPS IMPORTANTS
      montant_total: Number(recu.montant_total || 0),
      reste_a_payer: Number(recu.reste_a_payer || 0),
      preinscription_id: recu.preinscription_id
    };

    return NextResponse.json(recuData);

  } catch (error) {
    console.error("Erreur GET recu:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}