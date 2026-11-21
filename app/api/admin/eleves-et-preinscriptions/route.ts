// app/api/admin/eleves-et-preinscriptions/route.ts
// Retourne tous les élèves inscrits + les pré-inscriptions en attente
// Utilisé par les formulaires d'inscription cantine/transport admin

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
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN_CANTINE", "ADMIN_TRANSPORT", "DIRECTEUR_GENERAL"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // 1. Élèves inscrits (est_inscrit = true)
    const elevesResult = await query(`
      SELECT
        e.id,
        u.nom,
        u.prenom,
        e.matricule,
        COALESCE(e.photo_url, u.photo_url) as photo_url,
        c.nom as classe_nom,
        'eleve' as source,
        NULL::int as preinscription_id,
        e.id as ref_id
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE e.est_inscrit = true AND e.deleted_at IS NULL
      ORDER BY u.nom, u.prenom
    `);

    // 2. Pré-inscriptions en attente (pas encore validées en élèves)
    const preinscriptionsResult = await query(`
      SELECT
        NULL::int as id,
        p.enfant_nom as nom,
        p.enfant_prenom as prenom,
        p.numero_dossier as matricule,
        p.photo_url,
        p.classe as classe_nom,
        'preinscription' as source,
        p.id as preinscription_id,
        p.id as ref_id
      FROM preinscriptions p
      WHERE p.statut = 'en_attente'
        AND NOT EXISTS (
          SELECT 1 FROM inscriptions i WHERE i.preinscription_id = p.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM eleves el 
          JOIN utilisateurs ul ON el.utilisateur_id = ul.id 
          WHERE TRIM(LOWER(ul.nom)) = TRIM(LOWER(p.enfant_nom)) 
            AND TRIM(LOWER(ul.prenom)) = TRIM(LOWER(p.enfant_prenom))
        )
      ORDER BY p.enfant_nom, p.enfant_prenom
    `);

    const tous = [
      ...elevesResult.rows.map((r: any) => ({
        id: r.id,
        nom: r.nom,
        prenom: r.prenom,
        matricule: r.matricule,
        photo_url: r.photo_url || null,
        classe_nom: r.classe_nom || "Non assigné",
        source: "eleve",
        preinscription_id: null,
        ref_id: r.id,
      })),
      ...preinscriptionsResult.rows.map((r: any) => ({
        id: null,
        nom: r.nom,
        prenom: r.prenom,
        matricule: r.matricule || `PRE-${r.preinscription_id}`,
        photo_url: r.photo_url || null,
        classe_nom: r.classe_nom || "En attente",
        source: "preinscription",
        preinscription_id: r.preinscription_id,
        ref_id: r.preinscription_id,
      })),
    ];

    return NextResponse.json(tous);
  } catch (error) {
    console.error("Erreur API eleves-et-preinscriptions:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}
