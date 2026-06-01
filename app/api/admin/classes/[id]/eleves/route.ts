// app/api/admin/classes/[id]/eleves/route.ts
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
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const classeId = parseInt(id);

    if (isNaN(classeId)) {
      return NextResponse.json([]);
    }

    const result = await query(`
      SELECT 
        e.id,
        e.matricule,
        u.nom,
        u.prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.sexe,
        e.date_inscription,
        e.est_inscrit as statut,
        pu.nom as parent_nom,
        pu.prenom as parent_prenom,
        pu.telephone as parent_telephone,
        pu.email as parent_email,
        -- Récupérer la photo depuis preinscriptions (priorité à la photo de l'élève)
        COALESCE(e.photo_url, pre.photo_url) as photo_url
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      LEFT JOIN parents p ON lpe.parent_id = p.id
      LEFT JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      LEFT JOIN preinscriptions pre ON pre.enfant_nom = u.nom AND pre.enfant_prenom = u.prenom
      WHERE e.classe_id = $1 AND e.est_inscrit = true
    `, [classeId]);

    const eleves = result.rows.map(e => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      matricule: e.matricule,
      dateNaissance: e.date_naissance,
      lieuNaissance: e.lieu_naissance,
      sexe: e.sexe,
      telephone: e.telephone,
      email: e.email,
      parentNom: `${e.parent_prenom || ''} ${e.parent_nom || ''}`.trim(),
      parentTelephone: e.parent_telephone,
      dateInscription: e.date_inscription,
      statut: e.statut ? "actif" : "inactif",
      photo_url: e.photo_url || null  // Ajout du champ photo_url
    }));

    return NextResponse.json(eleves);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json([]);
  }
}