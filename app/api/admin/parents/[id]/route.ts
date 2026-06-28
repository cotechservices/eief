// app/api/admin/parents/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ⭐ CORRECTION : Ajout de l'interface pour les params avec Promise
interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL" && role !== "COMPTABLE") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // ⭐ CORRECTION : Déballer params avec await
    const { id } = await params;
    
    // ⭐ Vérifier que l'ID est valide
    const parentId = parseInt(id);
    
    // ⭐ Si l'ID n'est pas un nombre valide, retourner une erreur
    if (isNaN(parentId) || parentId <= 0) {
      return NextResponse.json(
        { error: "ID de parent invalide" },
        { status: 400 }
      );
    }

    // Récupérer le parent
    const parentResult = await query(`
      SELECT 
        p.id,
        p.utilisateur_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse,
        u.photo_url,
        p.profession,
        p.situation_matrimoniale,
        u.created_at,
        u.est_actif
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [parentId]);

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    const parent = parentResult.rows[0];

    // Récupérer les enfants avec plus de détails
    const enfantsResult = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.photo_url,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.date_inscription,
        e.est_inscrit,
        c.nom as classe_nom,
        c.niveau,
        c.id as classe_id,
        c.frais_inscription,
        l.lien as lien_parent
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      JOIN lien_parent_eleve l ON l.eleve_id = e.id
      WHERE l.parent_id = $1
      ORDER BY u.nom, u.prenom
    `, [parentId]);

    // Récupérer les pré-inscriptions du parent
    const preinscriptionsResult = await query(`
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.date_naissance,
        p.niveau,
        p.classe,
        p.statut,
        p.frais_statut,
        p.frais_montant,
        p.date_preinscription,
        p.montant_total_plan,
        p.montant_restant_plan
      FROM preinscriptions p
      WHERE p.parent_id = $1
      ORDER BY p.date_preinscription DESC
    `, [parentId]);

    return NextResponse.json({
      ...parent,
      situation_matrimoniale: parent.situation_matrimoniale
        ? (typeof parent.situation_matrimoniale === 'string'
            ? JSON.parse(parent.situation_matrimoniale)
            : parent.situation_matrimoniale)
        : null,
      enfants: enfantsResult.rows || [],
      preinscriptions: preinscriptionsResult.rows || [],
    });
  } catch (error) {
    console.error("Erreur récupération parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}