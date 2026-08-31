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

    console.log("Parents trouvés:", parentsResult.rows.length);

    const parents = parentsResult.rows;

    // Pour chaque parent, récupérer ses enfants inscrits + pré-inscriptions en attente
    const parentsWithEnfants = await Promise.all(
      parents.map(async (parent) => {
        try {
          // 1. Récupérer les enfants DÉJÀ INSCRITS (dans la table eleves)
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
              c.id as classe_id,
              e.date_inscription,
              e.est_inscrit
            FROM eleves e
            JOIN utilisateurs u ON e.utilisateur_id = u.id
            LEFT JOIN classes c ON e.classe_id = c.id
            JOIN lien_parent_eleve l ON l.eleve_id = e.id
            WHERE l.parent_id = $1
            ORDER BY u.nom, u.prenom
          `, [parent.id]);

          // 2. Récupérer les pré-inscriptions EN ATTENTE (dans la table preinscriptions)
          const preinscriptionsEnAttenteResult = await query(`
            SELECT 
              p.id,
              p.enfant_nom as nom,
              p.enfant_prenom as prenom,
              p.date_naissance,
              p.niveau,
              p.classe as classe_nom,
              p.numero_dossier,
              p.photo_url,
              p.statut,
              'preinscription' as type_dossier
            FROM preinscriptions p
            WHERE p.parent_id = $1
              AND p.statut = 'en_attente'
              AND NOT EXISTS (
                SELECT 1 
                FROM inscriptions i 
                JOIN eleves e ON i.eleve_id = e.id
                WHERE i.parent_id = $1 
                  AND TRIM(e.matricule) = TRIM(p.id::text)
              )
          `, [parent.id]);

          // 3. Combiner les deux listes : enfants inscrits + pré-inscriptions en attente
          const tousEnfants = [
            ...(enfantsResult.rows || []),
            ...(preinscriptionsEnAttenteResult.rows || []).map((preins: any) => ({
              ...preins,
              id: undefined, // pas d'ID élève pour une pré-inscription
              matricule: preins.numero_dossier || `PRE-${preins.id}`,
              classe_id: null,
              est_inscrit: false,
              est_preinscription: true,
              preinscription_id: preins.id
            }))
          ];

          // 4. Récupérer le nombre total de pré-inscriptions
          const totalPreinscriptionsResult = await query(`
            SELECT COUNT(*) as total
            FROM preinscriptions p
            WHERE p.parent_id = $1
          `, [parent.id]);
          const totalPreinscriptions = parseInt(totalPreinscriptionsResult.rows[0]?.total) || 0;

          // 5. Récupérer les pré-inscriptions en attente
          const preinscriptionsEnAttenteCount = await query(`
            SELECT COUNT(*) as en_attente
            FROM preinscriptions p
            WHERE p.parent_id = $1 AND p.statut = 'en_attente'
          `, [parent.id]);
          const totalEnAttente = parseInt(preinscriptionsEnAttenteCount.rows[0]?.en_attente) || 0;

          return {
            ...parent,
            situation_matrimoniale: parent.situation_matrimoniale 
              ? (typeof parent.situation_matrimoniale === 'string' 
                  ? JSON.parse(parent.situation_matrimoniale) 
                  : parent.situation_matrimoniale)
              : null,
            // ✅ Liste complète : enfants inscrits + pré-inscriptions en attente
            enfants: tousEnfants,
            totalEnfants: tousEnfants.length,
            // ✅ Anciens champs conservés
            enfantsInscrits: enfantsResult.rows.length,
            preinscriptionsEnAttente: totalEnAttente,
            totalPreinscriptions: totalPreinscriptions,
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
            enfantsInscrits: 0,
            totalPreinscriptions: 0,
            preinscriptionsEnAttente: 0,
            aDesPreinscriptions: false,
          };
        }
      })
    );

    return NextResponse.json(parentsWithEnfants);
  } catch (error) {
    console.error("Erreur récupération parents:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}