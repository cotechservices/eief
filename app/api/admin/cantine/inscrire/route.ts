// app/api/admin/cantine/inscrire/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN_CANTINE"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { eleveId, preinscriptionId, mois, montantMensuel, montantTotal } = body;

    if ((!eleveId && !preinscriptionId) || !mois || !montantMensuel) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // ⭐ CAS PRÉ-INSCRIPTION (en_attente) : inscrire dans preinscription_cantine
    if (preinscriptionId && !eleveId) {
      const preinscriptionCheck = await query(`
        SELECT p.id, p.enfant_nom as nom, p.enfant_prenom as prenom
        FROM preinscriptions p
        WHERE p.id = $1 AND p.statut = 'en_attente'
      `, [preinscriptionId]);

      if (preinscriptionCheck.rows.length === 0) {
        return NextResponse.json({ error: "Pré-inscription non trouvée ou déjà validée" }, { status: 404 });
      }

      const preins = preinscriptionCheck.rows[0];
      const prixTotal = (Number(mois) || 0) * (Number(montantMensuel) || 0);
      const defaultMenuRes = await query(`SELECT id FROM cantine_menus ORDER BY id LIMIT 1`);
      const menuId = defaultMenuRes.rows[0]?.id || 1;

      // Vérifier si déjà inscrit → mettre à jour au lieu de refuser
      const existingPreins = await query(`
        SELECT id FROM preinscription_cantine WHERE preinscription_id = $1
      `, [preinscriptionId]);

      if (existingPreins.rows.length > 0) {
        await query(`
          UPDATE preinscription_cantine SET prix = $1, menu_id = $2 WHERE preinscription_id = $3
        `, [prixTotal, menuId, preinscriptionId]);
        return NextResponse.json({
          success: true,
          message: `Inscription cantine mise à jour pour ${preins.prenom} ${preins.nom}`,
        });
      }

      await query(`
        INSERT INTO preinscription_cantine (preinscription_id, menu_id, prix)
        VALUES ($1, $2, $3)
      `, [preinscriptionId, menuId, prixTotal]);

      // Mettre à jour le montant_total_plan de la pré-inscription
      await query(`
        UPDATE preinscriptions
        SET montant_total_plan = COALESCE(montant_total_plan, frais_montant, 0) + $1
        WHERE id = $2
      `, [prixTotal, preinscriptionId]);

      return NextResponse.json({
        success: true,
        message: `${preins.prenom} ${preins.nom} inscrit à la cantine (dossier en attente)`,
      });
    }

    // ⭐ CAS ÉLÈVE INSCRIT : inscrire dans inscriptions_cantine
    const eleveCheck = await query(`
      SELECT e.id, u.nom, u.prenom, c.nom as classe_nom
      FROM eleves e
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE e.id = $1
    `, [eleveId]);

    if (eleveCheck.rows.length === 0) {
      return NextResponse.json({ error: "Élève non trouvé" }, { status: 404 });
    }

    const eleve = eleveCheck.rows[0];

    // Vérifier si l'élève est déjà inscrit
    const existingInscription = await query(`
      SELECT id FROM inscriptions_cantine 
      WHERE eleve_id = $1 AND est_actif = true
    `, [eleveId]);

    if (existingInscription.rows.length > 0) {
      return NextResponse.json({ 
        error: "Cet élève est déjà inscrit à la cantine" 
      }, { status: 400 });
    }

    // Démarrer une transaction
    await query('BEGIN');

    try {
      const result = await query(`
        INSERT INTO inscriptions_cantine (
          eleve_id,
          est_actif,
          solde,
          date_inscription,
          mois_total,
          mois_restants,
          montant_mensuel,
          montant_total
        ) VALUES ($1, true, $2, NOW(), $3, $3, $4, $5)
        RETURNING id
      `, [eleveId, montantTotal, mois, montantMensuel, montantTotal]);

      const inscriptionId = result.rows[0].id;

      // Ajouter au menu du jour si disponible
      const menuResult = await query(`SELECT id FROM cantine_menus ORDER BY id DESC LIMIT 1`);
      if (menuResult.rows.length > 0) {
        await query(`
          INSERT INTO reserves_cantine (eleve_id, date, est_present, date_reservation)
          VALUES ($1, CURRENT_DATE, true, CURRENT_DATE)
        `, [eleveId]);
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `${eleve.prenom} ${eleve.nom} inscrit à la cantine pour ${mois} mois`,
        inscriptionId: inscriptionId
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur inscription cantine:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}