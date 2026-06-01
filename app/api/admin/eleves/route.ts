// app/api/admin/eleves/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
    SELECT 
      e.id,
      e.matricule,
      e.date_naissance,
      e.lieu_naissance,
      e.sexe,
      COALESCE(e.photo_url, pre.photo_url) as photo_url,
      e.date_inscription,
      u.nom as enfant_nom,
      u.prenom as enfant_prenom,
      c.nom as classe_nom,
      c.niveau,
      c.frais_inscription as frais_montant,
      pu.nom as parent_nom,
      pu.prenom as parent_prenom,
      pu.email as parent_email,
      pu.telephone as parent_telephone,
      COALESCE(pre.frais_statut, 'non_paye') as frais_statut,
      pre.frais_mode_paiement,
      pre.numero_dossier,
      CASE 
        WHEN e.est_inscrit = true THEN 'actif'
        ELSE 'inactif'
      END as statut
    FROM eleves e
    JOIN utilisateurs u ON e.utilisateur_id = u.id
    LEFT JOIN classes c ON e.classe_id = c.id
    LEFT JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
    LEFT JOIN parents p ON lpe.parent_id = p.id
    LEFT JOIN utilisateurs pu ON p.utilisateur_id = pu.id
    LEFT JOIN preinscriptions pre ON pre.parent_id = p.id AND pre.enfant_nom = u.nom AND pre.enfant_prenom = u.prenom
    WHERE e.est_inscrit = true
    ORDER BY e.id DESC
    `);

    console.log("Nombre d'élèves:", result.rows.length);
    console.log("Premier élève:", result.rows[0]?.photo_url);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Méthode DELETE pour supprimer un élève
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'ID depuis l'URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID de l'élève requis" }, { status: 400 });
    }

    const eleveId = parseInt(id);
    if (isNaN(eleveId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier si l'élève existe
    const checkResult = await query(
      "SELECT id, utilisateur_id FROM eleves WHERE id = $1 AND est_inscrit = true",
      [eleveId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const utilisateurId = checkResult.rows[0].utilisateur_id;

    // Démarrer une transaction
    await query("BEGIN");

    try {
      // 1. Supprimer les liens parent-élève
      await query("DELETE FROM lien_parent_eleve WHERE eleve_id = $1", [eleveId]);

      // 2. Supprimer l'élève
      await query("DELETE FROM eleves WHERE id = $1", [eleveId]);
      await query("UPDATE eleves SET deleted_at = NOW() WHERE id = $1", [eleveId]);

      // 3. Vérifier si l'utilisateur a d'autres élèves
      const otherEleves = await query(
        "SELECT id FROM eleves WHERE utilisateur_id = $1",
        [utilisateurId]
      );

      // Si l'utilisateur n'a plus d'élèves, on peut le supprimer ou le désactiver
      if (otherEleves.rows.length === 0) {
        // Option 1: Supprimer l'utilisateur
        await query("DELETE FROM utilisateurs WHERE id = $1", [utilisateurId]);
        await query("UPDATE utilisateurs SET deleted_at = NOW() WHERE id = $1", [utilisateurId]);
        
        // Option 2: Désactiver l'utilisateur (alternative plus sûre)
        // await query("UPDATE utilisateurs SET est_actif = false WHERE id = $1", [utilisateurId]);
      }

      await query("COMMIT");

      console.log(`Élève ID ${eleveId} supprimé avec succès`);
      return NextResponse.json({ success: true, message: "Élève supprimé avec succès" });
      
    } catch (txError) {
      await query("ROLLBACK");
      console.error("Erreur transaction:", txError);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Optionnel: Méthode PUT pour modifier un élève
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, classe_id, statut } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    let updateQuery = "UPDATE eleves SET ";
    const updateFields = [];
    const values = [];

    if (classe_id !== undefined) {
      updateFields.push(`classe_id = $${updateFields.length + 1}`);
      values.push(classe_id);
    }

    if (statut !== undefined) {
      const estInscrit = statut === "actif";
      updateFields.push(`est_inscrit = $${updateFields.length + 1}`);
      values.push(estInscrit);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 });
    }

    updateQuery += updateFields.join(", ") + ` WHERE id = $${updateFields.length + 1} RETURNING *`;
    values.push(id);

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, eleve: result.rows[0] });

  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}