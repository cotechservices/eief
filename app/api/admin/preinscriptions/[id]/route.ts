// app/api/admin/preinscriptions/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - Récupérer le détail des frais d'une pré-inscription (accessible aux admins)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "COMPTABLE", "DIRECTEUR_GENERAL", "DIRECTEUR"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const preinscriptionId = parseInt(params.id);
    if (isNaN(preinscriptionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer les montants depuis echeances_paiement (source de vérité), groupés par type
    const fraisRes = await query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'inscription'  THEN montant ELSE 0 END), 0) AS inscription,
        COALESCE(SUM(CASE WHEN type = 'cantine'      THEN montant ELSE 0 END), 0) AS cantine,
        COALESCE(SUM(CASE WHEN type = 'transport'    THEN montant ELSE 0 END), 0) AS transport,
        COALESCE(SUM(CASE WHEN type = 'fournitures'  THEN montant ELSE 0 END), 0) AS fournitures,
        COALESCE(SUM(CASE WHEN type NOT IN ('inscription','cantine','transport','fournitures') THEN montant ELSE 0 END), 0) AS autres
      FROM echeances_paiement
      WHERE preinscription_id = $1
    `, [preinscriptionId]);

    // Paiements déjà effectués
    const paiementsRes = await query(`
      SELECT COALESCE(SUM(montant), 0) AS paye
      FROM paiements
      WHERE preinscription_id = $1 AND statut = 'valide'
    `, [preinscriptionId]);

    if (fraisRes.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const row       = fraisRes.rows[0];
    const inscription = Number(row.inscription);
    const cantine     = Number(row.cantine);
    const transport   = Number(row.transport);
    const fournitures = Number(row.fournitures);
    const autres      = Number(row.autres);
    const total       = inscription + cantine + transport + fournitures + autres;
    const paye        = Number(paiementsRes.rows[0]?.paye || 0);

    return NextResponse.json({
      details_frais: {
        inscription,
        cantine,
        transport,
        librairie: fournitures,
        fournitures,
        autres,
        scolarite: 0,
        total,
        paye,
        reste: Math.max(0, total - paye)
      }
    });

  } catch (error) {
    console.error("Erreur GET détail frais preinscription (admin):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "SUPER_ADMIN" && role !== "DIRECTEUR_GENERAL") {
            return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
        }

        const preinscriptionId = parseInt(params.id);
        if (isNaN(preinscriptionId)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const body = await request.json();
        const {
            enfant_nom,
            enfant_prenom,
            date_naissance,
            lieu_naissance,
            sexe,
            classe,
            niveau,
            photo_url,
            acte_naissance_url,
            bulletin_url,
            statut,
            cantineData,
            transportData
        } = body;

        // Mettre à jour la pré-inscription
        const result = await query(`
            UPDATE preinscriptions
            SET 
                enfant_nom = $1,
                enfant_prenom = $2,
                date_naissance = $3,
                lieu_naissance = $4,
                sexe = $5,
                classe = $6,
                niveau = $7,
                photo_url = $8,
                acte_naissance_url = $9,
                bulletin_url = $10,
                statut = $11,
                updated_at = NOW()
            WHERE id = $12
            RETURNING *
        `, [
            enfant_nom,
            enfant_prenom,
            date_naissance,
            lieu_naissance,
            sexe,
            classe,
            niveau,
            photo_url,
            acte_naissance_url,
            bulletin_url,
            statut,
            preinscriptionId
        ]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
        }

        // ⭐ Gérer la Cantine pour la pré-inscription
        if (cantineData !== undefined) {
            await query(`DELETE FROM preinscription_cantine WHERE preinscription_id = $1`, [preinscriptionId]);

            if (cantineData.inscrire) {
                const defaultMenuRes = await query(`SELECT id FROM cantine_menus ORDER BY id LIMIT 1`);
                const menuId = defaultMenuRes.rows[0]?.id || 1;
                const prixCantine = (Number(cantineData.mois) || 0) * (Number(cantineData.montantMensuel) || 0);

                await query(`
                    INSERT INTO preinscription_cantine (preinscription_id, menu_id, prix)
                    VALUES ($1, $2, $3)
                `, [preinscriptionId, menuId, prixCantine]);
            }
        }

        // ⭐ Gérer le Transport pour la pré-inscription
        if (transportData !== undefined) {
            await query(`DELETE FROM preinscription_transport WHERE preinscription_id = $1`, [preinscriptionId]);

            if (transportData.inscrire && transportData.ligneId) {
                const prixTransport = (Number(transportData.mois) || 0) * (Number(transportData.montantMensuel) || 0);

                await query(`
                    INSERT INTO preinscription_transport (preinscription_id, ligne_id, prix)
                    VALUES ($1, $2, $3)
                `, [preinscriptionId, transportData.ligneId, prixTransport]);
            }
        }

        // ⭐ Re-calculer le plan de paiement et les totaux financiers (scolarité + cantine + transport + fournitures)
        const totalFraisRes = await query(`
            SELECT 
                COALESCE(
                  (SELECT c.total_versement FROM classes c WHERE LOWER(c.nom) = LOWER(p.classe) LIMIT 1),
                  (SELECT c.frais_inscription FROM classes c WHERE LOWER(c.nom) = LOWER(p.classe) LIMIT 1),
                  p.frais_montant,
                  0
                ) as frais_scolarite,
                COALESCE((SELECT SUM(prix) FROM preinscription_cantine WHERE preinscription_id = p.id), 0) as cantine_prix,
                COALESCE((SELECT SUM(prix) FROM preinscription_transport WHERE preinscription_id = p.id), 0) as transport_prix,
                COALESCE((SELECT SUM(quantite * prix_unitaire) FROM commandes_fournitures WHERE preinscription_id = p.id), 0) as fournitures_prix,
                COALESCE((SELECT SUM(montant) FROM paiements WHERE preinscription_id = p.id AND statut = 'valide'), 0) as total_paye
            FROM preinscriptions p
            WHERE p.id = $1
        `, [preinscriptionId]);

        if (totalFraisRes.rows.length > 0) {
            const row = totalFraisRes.rows[0];
            const totalPlan = Number(row.frais_scolarite) + Number(row.cantine_prix) + Number(row.transport_prix) + Number(row.fournitures_prix);
            const totalPaye = Number(row.total_paye);
            const restantPlan = Math.max(0, totalPlan - totalPaye);

            await query(`
                UPDATE preinscriptions
                SET montant_total_plan = $1,
                    montant_restant_plan = $2,
                    frais_montant = $3
                WHERE id = $4
            `, [totalPlan, restantPlan, Number(row.frais_scolarite), preinscriptionId]);
        }

        return NextResponse.json({ success: true, preinscription: result.rows[0] });

    } catch (error) {
        console.error("Erreur mise à jour pré-inscription:", error);
        return NextResponse.json(
            { error: "Erreur serveur: " + (error as Error).message },
            { status: 500 }
        );
    }
}