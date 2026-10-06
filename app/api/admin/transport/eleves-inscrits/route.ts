// app/api/admin/transport/eleves-inscrits/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "ADMIN_TRANSPORT")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les élèves inscrits au transport
    const result = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.prenom,
        u.nom,
        c.nom as classe,
        COALESCE(it.date_debut, it.date_inscription)::text as date_inscription,
        it.est_actif as status,
        COALESCE(l.nom, 'Non assigné') as ligne_nom,
        COALESCE(b.immatriculation, 'Non assigné') as bus_immatriculation
      FROM inscriptions_transport it
      JOIN eleves e ON e.id = it.eleve_id
      JOIN utilisateurs u ON u.id = e.utilisateur_id
      LEFT JOIN classes c ON c.id = e.classe_id
      LEFT JOIN lignes_transport l ON l.id = it.ligne_id
      LEFT JOIN bus b ON b.id = l.bus_id
      WHERE it.est_actif = true

      UNION ALL

      SELECT 
        p.id as id,
        p.numero_dossier as matricule,
        p.enfant_prenom as prenom,
        p.enfant_nom as nom,
        p.classe,
        pt.created_at::text as date_inscription,
        true as status,
        COALESCE(l.nom, 'Non assigné') as ligne_nom,
        COALESCE(b.immatriculation, 'Non assigné') as bus_immatriculation
      FROM preinscription_transport pt
      JOIN preinscriptions p ON pt.preinscription_id = p.id
      LEFT JOIN lignes_transport l ON pt.ligne_id = l.id
      LEFT JOIN bus b ON b.id = l.bus_id
      WHERE p.statut != 'rejete'

      ORDER BY date_inscription DESC
    `);

    // Si aucun élève n'est inscrit, retourner un tableau vide
    const eleves = result.rows.map(row => ({
      id: row.id,
      matricule: row.matricule,
      prenom: row.prenom,
      nom: row.nom,
      classe: row.classe || 'Non assigné',
      ligne: row.ligne_nom || 'Aucune ligne',
      bus: row.bus_immatriculation || 'Aucun bus',
      date_inscription: row.date_inscription || new Date().toISOString().split('T')[0],
      status: row.status ? 'actif' : 'inactif'
    }));

    return NextResponse.json({ 
      eleves,
      total: eleves.length 
    });

  } catch (error) {
    console.error("Erreur API élèves inscrits transport:", error);
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}