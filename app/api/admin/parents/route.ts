// app/api/admin/parents/route.ts
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

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL" && role !== "COMPTABLE") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // Récupérer tous les parents
    const parentsResult = await query(`
      SELECT 
        p.id,
        p.utilisateur_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.photo_url,
        p.profession,
        p.situation_matrimoniale
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE u.est_actif = true
      ORDER BY u.nom, u.prenom
    `);

    console.log("👨‍👩‍👧‍👦 Parents trouvés:", parentsResult.rows.length);

    const parents = parentsResult.rows;

    // Pour chaque parent, récupérer ses enfants ET ses pré-inscriptions
    const parentsWithEnfants = await Promise.all(
      parents.map(async (parent) => {
        try {
          // Récupérer les enfants inscrits
          const enfantsResult = await query(`
            SELECT 
              e.id,
              e.matricule,
              u.nom,
              u.prenom,
              u.photo_url,
              e.date_naissance,
              e.sexe,
              c.nom as classe_nom,
              c.niveau,
              c.id as classe_id
            FROM eleves e
            JOIN utilisateurs u ON e.utilisateur_id = u.id
            LEFT JOIN classes c ON e.classe_id = c.id
            JOIN lien_parent_eleve l ON l.eleve_id = e.id
            WHERE l.parent_id = $1
            ORDER BY u.nom, u.prenom
          `, [parent.id]);

          // ⭐ Récupérer le nombre de pré-inscriptions pour ce parent
          // On utilise parent.id qui correspond à preinscriptions.parent_id
          const preinscriptionsResult = await query(`
            SELECT COUNT(*) as total_preinscriptions
            FROM preinscriptions p
            WHERE p.parent_id = $1
          `, [parent.id]);

          const totalPreinscriptions = parseInt(preinscriptionsResult.rows[0]?.total_preinscriptions) || 0;

          console.log(`📋 Parent ${parent.id} (${parent.prenom} ${parent.nom}): ${totalPreinscriptions} pré-inscriptions`);

          // ⭐ Récupérer les pré-inscriptions en attente
          const preinscriptionsEnAttente = await query(`
            SELECT COUNT(*) as en_attente
            FROM preinscriptions p
            WHERE p.parent_id = $1 AND p.statut = 'en_attente'
          `, [parent.id]);

          const totalEnAttente = parseInt(preinscriptionsEnAttente.rows[0]?.en_attente) || 0;

          // ⭐ DEBUG : Récupérer toutes les pré-inscriptions pour vérifier
          const allPreinscriptions = await query(`
            SELECT p.id, p.parent_id, p.enfant_prenom, p.enfant_nom, p.statut
            FROM preinscriptions p
            WHERE p.parent_id = $1
          `, [parent.id]);

          console.log(`📋 Détail pré-inscriptions pour parent ${parent.id}:`, allPreinscriptions.rows);

          return {
            ...parent,
            situation_matrimoniale: parent.situation_matrimoniale 
              ? (typeof parent.situation_matrimoniale === 'string' 
                  ? JSON.parse(parent.situation_matrimoniale) 
                  : parent.situation_matrimoniale)
              : null,
            enfants: enfantsResult.rows || [],
            totalEnfants: enfantsResult.rows.length,
            // ⭐ Nouveaux champs
            totalPreinscriptions: totalPreinscriptions,
            preinscriptionsEnAttente: totalEnAttente,
            aDesPreinscriptions: totalPreinscriptions > 0,
          };
        } catch (error) {
          console.error(`Erreur récupération données pour parent ${parent.id}:`, error);
          return {
            ...parent,
            situation_matrimoniale: parent.situation_matrimoniale 
              ? (typeof parent.situation_matrimoniale === 'string' 
                  ? JSON.parse(parent.situation_matrimoniale) 
                  : parent.situation_matrimoniale)
              : null,
            enfants: [],
            totalEnfants: 0,
            totalPreinscriptions: 0,
            preinscriptionsEnAttente: 0,
            aDesPreinscriptions: false,
          };
        }
      })
    );

    // ⭐ DEBUG GLOBAL : Afficher toutes les pré-inscriptions
    const allPreins = await query(`
      SELECT p.id, p.parent_id, p.enfant_prenom, p.enfant_nom, p.statut
      FROM preinscriptions p
    `);
    console.log("📋 TOUTES les pré-inscriptions:", allPreins.rows);

    return NextResponse.json(parentsWithEnfants);
  } catch (error) {
    console.error("Erreur récupération parents:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}