// app/api/parent/transport/route.ts
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

    // Récupérer les enfants du parent avec leurs inscriptions au transport
    const enfants = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        it.id as inscription_transport_id,
        it.est_actif as transport_actif,
        lt.nom as ligne_nom,
        lt.horaire_matin,
        lt.horaire_soir,
        b.immatriculation,
        b.chauffeur_nom,
        b.chauffeur_tel,
        b.capacite
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      JOIN classes c ON e.classe_id = c.id
      LEFT JOIN inscriptions_transport it ON e.id = it.eleve_id AND it.est_actif = true
      LEFT JOIN lignes_transport lt ON it.ligne_id = lt.id
      LEFT JOIN bus b ON lt.bus_id = b.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $1 AND e.est_inscrit = true
      ORDER BY e.id
    `, [userEmail]);

    const enfantsData = enfants.rows.map(e => ({
      id: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      classe: e.classe_nom,
      inscritTransport: e.transport_actif === true,
      ligne: e.ligne_nom,
      arret: "Arrêt principal", // À définir selon vos données
      heureMatin: e.horaire_matin ? e.horaire_matin.substring(0, 5) : null,
      heureSoir: e.horaire_soir ? e.horaire_soir.substring(0, 5) : null,
      chauffeur: e.chauffeur_nom,
      chauffeurTel: e.chauffeur_tel,
      immatriculation: e.immatriculation
    }));

    // Simuler la position du bus (à remplacer par des données réelles plus tard)
    const busPosition = {
      latitude: 9.5092,
      longitude: -13.7122,
      vitesse: 35,
      derniereMiseAJour: new Date().toISOString(),
      retard: Math.floor(Math.random() * 10)
    };

    return NextResponse.json({
      enfants: enfantsData,
      busPosition
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}