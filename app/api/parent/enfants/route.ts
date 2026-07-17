// app/api/parent/enfants/route.ts - Version corrigée

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userEmail = session.user?.email;

    const result = await query(`
      SELECT 
        e.id,
        e.matricule,
        e.id as eleve_id,
        u.nom,
        u.prenom,
        c.nom as classe_nom,
        c.niveau,
        e.sexe,
        e.date_naissance,
        e.lieu_naissance,
        c.frais_inscription as frais_inscription_classe,
        -- ⭐ Frais de réinscription depuis la classe
        COALESCE(c.reinscription_total_versement, c.total_versement, 0) as frais_reinscription_classe,
        COALESCE(e.photo_url, pre.photo_url) as photo_url,
        COALESCE((
          SELECT AVG(n.valeur) 
          FROM notes n 
          WHERE n.eleve_id = e.id 
          AND n.type_note = 'composition'
        ), 0) as moyenne,
        -- ⭐ Montant total de l'inscription (pré-inscription)
        COALESCE(pre.montant_total_plan, c.total_versement, c.frais_inscription, 0) as montant_total_inscription,
        -- ⭐ Montant des frais de la classe
        COALESCE(c.total_versement, c.frais_inscription, 0) as frais_inscription,
        COALESCE(
          (SELECT cm.prix_annuel
           FROM cantine_menus cm
           ORDER BY cm.date DESC
           LIMIT 1),
          0
        ) as frais_cantine,
        COALESCE(
          (SELECT SUM(lt.prix_abonnement) 
           FROM lignes_transport lt),
          0
        ) as frais_transport,
        COALESCE(
          (SELECT SUM(cf.quantite * cf.prix_unitaire)
           FROM commandes_fournitures cf
           WHERE cf.preinscription_id = pre.id),
          0
        ) as frais_librairie,
        -- ⭐ FRAIS DÉJÀ PAYÉS : PAIEMENTS DIRECTS
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.eleve_id = e.id AND pai.statut = 'valide'),
          0
        ) as frais_paye_direct,
        -- ⭐ FRAIS DÉJÀ PAYÉS : ÉCHÉANCES
        COALESCE(
          (SELECT SUM(eche.montant) 
           FROM echeances_paiement eche
           JOIN preinscriptions pre2 ON eche.preinscription_id = pre2.id
           JOIN inscriptions i2 ON i2.preinscription_id = pre2.id
           WHERE i2.eleve_id = e.id AND eche.statut = 'paye'),
          0
        ) as frais_paye_echeances
      FROM inscriptions i
      JOIN eleves e ON i.eleve_id = e.id
      JOIN utilisateurs u ON e.utilisateur_id = u.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN preinscriptions pre ON i.preinscription_id = pre.id
      JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
      JOIN parents p ON lpe.parent_id = p.id
      JOIN utilisateurs pu ON p.utilisateur_id = pu.id
      WHERE pu.email = $1 AND i.statut = 'active'
    `, [userEmail]);

    // Calculer les totaux pour chaque enfant
    const enfantsAvecFrais = result.rows.map((enfant: any) => {
      const fraisReinscriptionClasse = Number(enfant.frais_reinscription_classe) || 0;
      const montantTotalInscription = Number(enfant.montant_total_inscription) || 0;
      const fraisPayeDirect = Number(enfant.frais_paye_direct) || 0;
      const fraisPayeEcheances = Number(enfant.frais_paye_echeances) || 0;
      const totalPaye = fraisPayeDirect + fraisPayeEcheances;

      // ⭐ Si c'est une réinscription, utiliser les frais de réinscription
      const totalFrais = fraisReinscriptionClasse > 0 ? fraisReinscriptionClasse : montantTotalInscription;
      const reste = Math.max(0, totalFrais - totalPaye);

      console.log(`📊 Frais pour ${enfant.prenom} ${enfant.nom}:`, {
        fraisReinscriptionClasse,
        montantTotalInscription,
        totalFrais,
        totalPaye,
        reste
      });

      return {
        ...enfant,
        frais_reinscription_classe: fraisReinscriptionClasse,
        details_frais: {
          inscription: Number(enfant.frais_inscription) || 0,
          cantine: Number(enfant.frais_cantine) || 0,
          transport: Number(enfant.frais_transport) || 0,
          librairie: Number(enfant.frais_librairie) || 0,
          scolarite: 0,
          total: totalFrais,
          paye: totalPaye,
          reste: reste
        }
      };
    });

    return NextResponse.json(enfantsAvecFrais);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}