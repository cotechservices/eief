// app/api/admin/eleves/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
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
      END as statut,
      -- Transport
      EXISTS (
        SELECT 1 FROM inscriptions_transport it 
        WHERE it.eleve_id = e.id AND it.est_actif = true
      ) as transport_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'transport' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as transport_statut,
      -- Cantine
      EXISTS (
        SELECT 1 FROM inscriptions_cantine ic 
        WHERE ic.eleve_id = e.id AND ic.est_actif = true
      ) as cantine_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'cantine' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as cantine_statut,
      -- Bibliothèque
      EXISTS (
        SELECT 1 FROM emprunts_bibliotheque eb 
        WHERE eb.eleve_id = e.id AND eb.statut = 'en_cours'
      ) as bibliotheque_inscrit,
      COALESCE(
        (SELECT statut FROM paiements p 
         WHERE p.eleve_id = e.id AND p.type_frais = 'bibliotheque' 
         ORDER BY p.date_paiement DESC LIMIT 1),
        'non_paye'
      ) as bibliotheque_statut
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

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ⭐ AJOUT DE LA MÉTHODE DELETE ⭐
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de l'élève requis" }, { status: 400 });
    }

    const eleveId = parseInt(id);
    if (isNaN(eleveId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    console.log(`🗑️ Suppression de l'élève ${eleveId}`);

    // Vérifier si l'élève existe
    const checkResult = await query(`
      SELECT id, utilisateur_id, est_inscrit FROM eleves WHERE id = $1
    `, [eleveId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const eleve = checkResult.rows[0];

    // ⭐ Démarrer une transaction
    await query('BEGIN');

    try {
      // Récupérer l'ID du parent et les préinscriptions associées
      const parentResult = await query(`
        SELECT parent_id FROM lien_parent_eleve WHERE eleve_id = $1
      `, [eleveId]);
      
      const parentId = parentResult.rows.length > 0 ? parentResult.rows[0].parent_id : null;

      // Récupérer les IDs des préinscriptions à supprimer
      let preinscriptionIds: number[] = [];
      if (parentId) {
        const preResult = await query(`
          SELECT id FROM preinscriptions 
          WHERE parent_id = $1
        `, [parentId]);
        preinscriptionIds = preResult.rows.map((row: any) => row.id);
      }

      // 1. Supprimer les commandes de fournitures des préinscriptions
      if (preinscriptionIds.length > 0) {
        await query(`
          DELETE FROM commandes_fournitures 
          WHERE preinscription_id = ANY($1::int[])
        `, [preinscriptionIds]);
        
        // Supprimer les échéances de paiement des préinscriptions
        await query(`
          DELETE FROM echeances_paiement 
          WHERE preinscription_id = ANY($1::int[])
        `, [preinscriptionIds]);
        
        // Supprimer les préinscriptions cantine
        await query(`
          DELETE FROM preinscription_cantine 
          WHERE preinscription_id = ANY($1::int[])
        `, [preinscriptionIds]);
        
        // Supprimer les préinscriptions transport
        await query(`
          DELETE FROM preinscription_transport 
          WHERE preinscription_id = ANY($1::int[])
        `, [preinscriptionIds]);
      }

      // 2. Supprimer les liens parent-élève
      await query(`DELETE FROM lien_parent_eleve WHERE eleve_id = $1`, [eleveId]);

      // 3. Supprimer les paiements
      await query(`DELETE FROM paiements WHERE eleve_id = $1`, [eleveId]);

      // 4. Supprimer les présences
      await query(`DELETE FROM presences WHERE eleve_id = $1`, [eleveId]);

      // 5. Supprimer les notes
      await query(`DELETE FROM notes WHERE eleve_id = $1`, [eleveId]);

      // 6. Supprimer les inscriptions (si l'élève a une inscription)
      await query(`
        DELETE FROM inscriptions WHERE eleve_id = $1
      `, [eleveId]);

      // 7. Supprimer les soumissions de devoirs
      await query(`DELETE FROM soumissions_devoirs WHERE eleve_id = $1`, [eleveId]);

      // 8. Supprimer les emprunts de bibliothèque
      await query(`DELETE FROM emprunts_bibliotheque WHERE eleve_id = $1`, [eleveId]);

      // 9. Supprimer les réservations cantine
      await query(`DELETE FROM reservations_cantine WHERE eleve_id = $1`, [eleveId]);

      // 10. Supprimer les transactions cantine
      await query(`DELETE FROM transactions_cantine WHERE eleve_id = $1`, [eleveId]);

      // 11. Supprimer les inscriptions transport
      await query(`DELETE FROM inscriptions_transport WHERE eleve_id = $1`, [eleveId]);

      // 12. Supprimer les inscriptions cantine
      await query(`DELETE FROM inscriptions_cantine WHERE eleve_id = $1`, [eleveId]);

      // 13. Supprimer les ventes librairie
      await query(`DELETE FROM ventes_librairie WHERE eleve_id = $1`, [eleveId]);

      // 14. Supprimer les préinscriptions (après avoir supprimé toutes les dépendances)
      if (preinscriptionIds.length > 0) {
        await query(`
          DELETE FROM preinscriptions 
          WHERE id = ANY($1::int[])
        `, [preinscriptionIds]);
      }

      // 15. Supprimer le parent si plus d'enfants
      if (parentId) {
        const childrenCount = await query(`
          SELECT COUNT(*) as count FROM lien_parent_eleve WHERE parent_id = $1
        `, [parentId]);
        
        if (parseInt(childrenCount.rows[0].count) === 0) {
          // Récupérer l'utilisateur_id du parent
          const parentUserResult = await query(`
            SELECT utilisateur_id FROM parents WHERE id = $1
          `, [parentId]);
          
          const parentUserId = parentUserResult.rows[0]?.utilisateur_id;
          
          // Supprimer le parent
          await query(`DELETE FROM parents WHERE id = $1`, [parentId]);
          
          // Supprimer l'utilisateur parent si existe
          if (parentUserId) {
            await query(`DELETE FROM sessions WHERE utilisateur_id = $1`, [parentUserId]);
            await query(`DELETE FROM utilisateurs WHERE id = $1`, [parentUserId]);
          }
        }
      }

      // 16. Supprimer l'utilisateur associé à l'élève (si existe)
      if (eleve.utilisateur_id) {
        // Vérifier si l'utilisateur existe
        const userCheck = await query(`
          SELECT id FROM utilisateurs WHERE id = $1
        `, [eleve.utilisateur_id]);
        
        if (userCheck.rows.length > 0) {
          // Supprimer les sessions de l'utilisateur
          await query(`DELETE FROM sessions WHERE utilisateur_id = $1`, [eleve.utilisateur_id]);
          // Supprimer l'utilisateur
          await query(`DELETE FROM utilisateurs WHERE id = $1`, [eleve.utilisateur_id]);
        }
      }

      // 17. Supprimer l'élève
      await query(`DELETE FROM eleves WHERE id = $1`, [eleveId]);

      await query('COMMIT');

      console.log(`✅ Élève ${eleveId} supprimé avec succès`);

      return NextResponse.json({
        success: true,
        message: "Élève supprimé avec succès"
      });
    } catch (error) {
      await query('ROLLBACK');
      console.error("❌ Erreur dans la transaction:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression: " + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}