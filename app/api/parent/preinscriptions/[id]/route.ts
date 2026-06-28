// app/api/parent/preinscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer les détails d'une pré-inscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const preinscriptionId = parseInt(id);
    const userEmail = session.user?.email;

    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    console.log(`📊 Récupération des détails de la pré-inscription ${preinscriptionId} pour le parent`);

    // Vérifier que la pré-inscription appartient au parent connecté
    const checkParent = await query(`
      SELECT 1 FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkParent.rows.length === 0) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer les détails complets de la pré-inscription
    const detailResult = await query(`
      SELECT 
        p.*,
        u.nom as parent_nom,
        u.prenom as parent_prenom,
        u.email as parent_email,
        u.telephone as parent_telephone,
        pa.profession as parent_profession,
        pa.situation_matrimoniale as mere_info,
        -- Frais de la classe
        COALESCE(c.frais_inscription, 0) as frais_montant,
        -- ⭐ Frais de cantine - UNIQUEMENT pour cette pré-inscription
        COALESCE(
          (SELECT SUM(cm.prix_annuel)
           FROM preinscription_cantine pc
           JOIN cantine_menus cm ON pc.menu_id = cm.id
           WHERE pc.preinscription_id = p.id),
          0
        ) as frais_cantine,
        -- ⭐ Frais de transport - UNIQUEMENT pour cette pré-inscription
        COALESCE(
          (SELECT SUM(lt.prix_abonnement) 
           FROM preinscription_transport pt
           JOIN lignes_transport lt ON pt.ligne_id = lt.id
           WHERE pt.preinscription_id = p.id),
          0
        ) as frais_transport,
        -- ⭐ Frais de fourniture - UNIQUEMENT pour cette pré-inscription
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           WHERE cf.preinscription_id = p.id),
          0
        ) as frais_librairie,
        -- Frais de scolarité (mensualités)
        COALESCE(
          (SELECT SUM(f.montant) 
           FROM frais_scolaires f
           WHERE f.type_frais = 'mensualite' 
             AND f.annee_scolaire_id = (
               SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
             )),
          0
        ) as frais_scolarite,
        -- Frais déjà payés
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.preinscription_id = p.id AND pai.statut = 'valide'),
          0
        ) as frais_paye,
        -- Récupérer les fournitures commandées
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'nom', al.nom,
              'quantite', cf.quantite,
              'prix_unitaire', cf.prix_unitaire,
              'total', cf.quantite * cf.prix_unitaire
            )
          )
          FROM commandes_fournitures cf
          JOIN articles_librairie al ON cf.article_id = al.id
          WHERE cf.preinscription_id = p.id),
          '[]'::json
        ) as fournitures_commandees,
        -- Récupérer le transport sélectionné
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'nom', lt.nom,
              'prix', pt.prix,
              'horaire_matin', lt.horaire_matin,
              'horaire_soir', lt.horaire_soir
            )
          )
          FROM preinscription_transport pt
          JOIN lignes_transport lt ON pt.ligne_id = lt.id
          WHERE pt.preinscription_id = p.id),
          '[]'::json
        ) as transport_selectionne,
        -- Récupérer la cantine sélectionnée
        COALESCE(
          (SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'nom', cm.plat || ' - ' || cm.accompagnement,
              'prix', pc.prix,
              'date', cm.date
            )
          )
          FROM preinscription_cantine pc
          JOIN cantine_menus cm ON pc.menu_id = cm.id
          WHERE pc.preinscription_id = p.id),
          '[]'::json
        ) as cantine_selectionnee
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
      WHERE p.id = $1
    `, [preinscriptionId]);

    if (detailResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const data = detailResult.rows[0];
    
    // Calculer les totaux
    const fraisInscription = Number(data.frais_montant) || 0;
    const fraisCantine = Number(data.frais_cantine) || 0;
    const fraisTransport = Number(data.frais_transport) || 0;
    const fraisLibrairie = Number(data.frais_librairie) || 0;
    const fraisScolarite = Number(data.frais_scolarite) || 0;
    
    const totalFrais = fraisInscription + fraisCantine + fraisTransport + fraisLibrairie + fraisScolarite;
    const fraisPaye = Number(data.frais_paye) || 0;

    console.log("📊 Détails des frais calculés:", {
      inscription: fraisInscription,
      cantine: fraisCantine,
      transport: fraisTransport,
      librairie: fraisLibrairie,
      scolarite: fraisScolarite,
      total: totalFrais,
      paye: fraisPaye,
      reste: Math.max(0, totalFrais - fraisPaye)
    });

    return NextResponse.json({
      ...data,
      fournitures_commandees: data.fournitures_commandees || [],
      transport_selectionne: data.transport_selectionne || [],
      cantine_selectionnee: data.cantine_selectionnee || [],
      details_frais: {
        inscription: fraisInscription,
        cantine: fraisCantine,
        transport: fraisTransport,
        librairie: fraisLibrairie,
        scolarite: fraisScolarite,
        total: totalFrais,
        paye: fraisPaye,
        reste: Math.max(0, totalFrais - fraisPaye)
      }
    });

  } catch (error) {
    console.error("Erreur GET détail pré-inscription parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une pré-inscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const preinscriptionId = parseInt(id);
    const userEmail = session.user?.email;

    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // ⭐ Vérifier que la pré-inscription appartient au parent
    const checkResult = await query(`
      SELECT p.id, p.statut, p.frais_statut
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const preinscription = checkResult.rows[0];

    // ⭐ Vérifier si la pré-inscription peut être annulée
    if (preinscription.statut === "valide") {
      return NextResponse.json({ error: "Impossible d'annuler une pré-inscription déjà validée" }, { status: 400 });
    }

    if (preinscription.statut === "rejete") {
      return NextResponse.json({ error: "Cette pré-inscription a déjà été rejetée" }, { status: 400 });
    }

    if (preinscription.frais_statut === "paye") {
      return NextResponse.json({ error: "Impossible d'annuler une pré-inscription déjà payée" }, { status: 400 });
    }

    // ⭐ Vérifier le nombre de paiements
    const paiementsCheck = await query(`
      SELECT COUNT(*) as count FROM paiements WHERE preinscription_id = $1
    `, [preinscriptionId]);
    
    const hasPaiements = parseInt(paiementsCheck.rows[0].count) > 0;

    // ⭐ Démarrer une transaction
    await query('BEGIN');

    try {
      // ⭐ Supprimer les paiements s'ils existent
      if (hasPaiements) {
        await query(`
          DELETE FROM paiements WHERE preinscription_id = $1
        `, [preinscriptionId]);
        console.log(`✅ ${paiementsCheck.rows[0].count} paiement(s) supprimés pour la pré-inscription ${preinscriptionId}`);
      }

      // Supprimer les autres données associées
      await query(`DELETE FROM echeances_paiement WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM inscriptions WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM commandes_fournitures WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM preinscription_transport WHERE preinscription_id = $1`, [preinscriptionId]);
      await query(`DELETE FROM preinscription_cantine WHERE preinscription_id = $1`, [preinscriptionId]);
      
      // Enfin, supprimer la pré-inscription
      await query(`DELETE FROM preinscriptions WHERE id = $1`, [preinscriptionId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Pré-inscription annulée avec succès"
      });
    } catch (error) {
      await query('ROLLBACK');
      console.error("Erreur dans la transaction:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression: " + (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}