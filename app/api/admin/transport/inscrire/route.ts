// app/api/admin/transport/inscrire/route.ts
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
    const allowedRoles = ["SUPER_ADMIN", "COMPTABLE", "ADMIN_TRANSPORT"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { eleveId, preinscriptionId, ligneId, mois, montantMensuel } = body;

    if ((!eleveId && !preinscriptionId) || !mois || !montantMensuel) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // ⭐ CAS PRÉ-INSCRIPTION (en_attente) : inscrire dans preinscription_transport
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
      const ligneIdToUse = ligneId || null;

      // Vérifier si déjà inscrit → mettre à jour au lieu de refuser
      const existingPreins = await query(`
        SELECT id FROM preinscription_transport WHERE preinscription_id = $1
      `, [preinscriptionId]);

      if (existingPreins.rows.length > 0) {
        await query(`
          UPDATE preinscription_transport 
          SET prix = $1, ligne_id = $2 
          WHERE preinscription_id = $3
        `, [prixTotal, ligneIdToUse, preinscriptionId]);
        return NextResponse.json({
          success: true,
          message: `Inscription transport mise à jour pour ${preins.prenom} ${preins.nom}`,
        });
      }

      await query(`
        INSERT INTO preinscription_transport (preinscription_id, ligne_id, prix)
        VALUES ($1, $2, $3)
      `, [preinscriptionId, ligneIdToUse, prixTotal]);

      // Mettre à jour le montant_total_plan de la pré-inscription
      await query(`
        UPDATE preinscriptions
        SET montant_total_plan = COALESCE(montant_total_plan, frais_montant, 0) + $1
        WHERE id = $2
      `, [prixTotal, preinscriptionId]);

      return NextResponse.json({
        success: true,
        message: `${preins.prenom} ${preins.nom} inscrit au transport (dossier en attente)`,
      });
    }

    // ⭐ CAS ÉLÈVE INSCRIT : inscrire dans inscriptions_transport
    if (!ligneId) {
      return NextResponse.json({ error: "Ligne de transport requise" }, { status: 400 });
    }

    // Vérifier que l'élève existe
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

    // Vérifier que la ligne existe
    const ligneCheck = await query(`
      SELECT id, prix_abonnement FROM lignes_transport WHERE id = $1
    `, [ligneId]);

    if (ligneCheck.rows.length === 0) {
      return NextResponse.json({ error: "Ligne de transport non trouvée" }, { status: 404 });
    }

    const prixMensuel = montantMensuel || ligneCheck.rows[0].prix_abonnement || 0;
    const moisInt = parseInt(mois);
    const total = prixMensuel * moisInt;

    // Vérifier si l'élève est déjà inscrit activement
    const existing = await query(`
      SELECT id FROM inscriptions_transport 
      WHERE eleve_id = $1 AND est_actif = true
    `, [eleveId]);

    if (existing.rows.length > 0) {
      return NextResponse.json({ 
        error: "Cet élève est déjà inscrit au transport" 
      }, { status: 400 });
    }

    // Démarrer une transaction
    await query('BEGIN');

    try {
      const result = await query(`
        INSERT INTO inscriptions_transport (
          eleve_id,
          ligne_id,
          est_actif,
          solde,
          date_inscription,
          mois_total,
          mois_restants,
          montant_mensuel,
          montant_total
        ) VALUES ($1, $2, true, $3, NOW(), $4, $4, $5, $6)
        RETURNING id
      `, [eleveId, ligneId, total, moisInt, prixMensuel, total]);

      const inscriptionId = result.rows[0].id;

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `${eleveCheck.rows[0].prenom} ${eleveCheck.rows[0].nom} inscrit au transport pour ${moisInt} mois`,
        inscriptionId: inscriptionId
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Erreur inscription transport:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}