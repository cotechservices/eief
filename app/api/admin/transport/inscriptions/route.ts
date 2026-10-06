// app/api/admin/transport/inscriptions/route.ts
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

    const result = await query(`
      SELECT 
        it.id,
        it.eleve_id,
        NULL::integer as preinscription_id,
        'eleve' as source,
        it.ligne_id,
        it.est_actif,
        it.solde,
        it.date_inscription,
        it.mois_total,
        it.mois_restants,
        it.montant_mensuel,
        it.montant_total,
        u.nom as eleve_nom,
        u.prenom as eleve_prenom,
        c.nom as classe_nom,
        COALESCE(l.nom, 'Non assigné') as ligne_nom,
        COALESCE(b.immatriculation, '-') as bus_immatriculation
      FROM inscriptions_transport it
      JOIN eleves e ON it.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN lignes_transport l ON it.ligne_id = l.id
      LEFT JOIN bus b ON l.bus_id = b.id
      WHERE it.est_actif = true

      UNION ALL

      SELECT 
        pt.id,
        NULL::integer as eleve_id,
        p.id as preinscription_id,
        'preinscription' as source,
        pt.ligne_id,
        true as est_actif,
        pt.prix as solde,
        pt.created_at as date_inscription,
        CASE 
          WHEN COALESCE(l.prix_abonnement, 0) > 0 THEN GREATEST(1, ROUND(pt.prix / l.prix_abonnement))
          ELSE 9 
        END as mois_total,
        CASE 
          WHEN COALESCE(l.prix_abonnement, 0) > 0 THEN GREATEST(1, ROUND(pt.prix / l.prix_abonnement))
          ELSE 9 
        END as mois_restants,
        COALESCE(l.prix_abonnement, CASE WHEN pt.prix > 0 THEN ROUND(pt.prix / 9) ELSE 0 END) as montant_mensuel,
        pt.prix as montant_total,
        p.enfant_nom as eleve_nom,
        p.enfant_prenom as eleve_prenom,
        p.classe as classe_nom,
        COALESCE(l.nom, 'Non assigné') as ligne_nom,
        COALESCE(b.immatriculation, '-') as bus_immatriculation
      FROM preinscription_transport pt
      JOIN preinscriptions p ON pt.preinscription_id = p.id
      LEFT JOIN lignes_transport l ON pt.ligne_id = l.id
      LEFT JOIN bus b ON l.bus_id = b.id
      WHERE p.statut != 'rejete'

      ORDER BY date_inscription DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET inscriptions transport:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}