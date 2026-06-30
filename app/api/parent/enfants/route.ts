// app/api/parent/enfants/route.ts
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
        COALESCE(e.photo_url, pre.photo_url) as photo_url,
        COALESCE((
          SELECT AVG(n.valeur) 
          FROM notes n 
          WHERE n.eleve_id = e.id 
          AND n.type_note = 'composition'
        ), 0) as moyenne,
        -- ⭐ Pour un enfant déjà inscrit, le montant total est le frais_montant de la pré-inscription
        -- qui inclut déjà tous les services (transport, cantine, fournitures)
        COALESCE(pre.frais_montant, c.frais_inscription, 0) as montant_total_inscription,
        -- ⭐ On garde les détails mais on ne les additionne pas pour le total
        COALESCE(c.frais_inscription, 0) as frais_inscription,
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
        COALESCE(
          (SELECT SUM(f.montant) 
           FROM frais_scolaires f
           WHERE f.type_frais = 'mensualite' 
             AND f.annee_scolaire_id = (
               SELECT id FROM annees_scolaires WHERE est_active = true LIMIT 1
             )),
          0
        ) as frais_scolarite,
        -- ⭐ FRAIS DÉJÀ PAYÉS : PAIEMENTS DIRECTS + ÉCHÉANCES
        COALESCE(
          (SELECT SUM(pai.montant) 
           FROM paiements pai
           WHERE pai.eleve_id = e.id AND pai.statut = 'valide'),
          0
        ) + COALESCE(
          (SELECT SUM(eche.montant) 
           FROM echeances_paiement eche
           JOIN preinscriptions pre2 ON eche.preinscription_id = pre2.id
           JOIN inscriptions i2 ON i2.preinscription_id = pre2.id
           WHERE i2.eleve_id = e.id AND eche.statut = 'paye'),
          0
        ) as frais_paye
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
      // ⭐ Le total à payer est le montant de la pré-inscription (qui inclut déjà tous les services)
      const montantTotalInscription = Number(enfant.montant_total_inscription) || 0;
      const fraisPaye = Number(enfant.frais_paye) || 0;

      // On garde les détails pour affichage mais le total est le montant de l'inscription
      const fraisInscription = Number(enfant.frais_inscription) || 0;
      const fraisCantine = Number(enfant.frais_cantine) || 0;
      const fraisTransport = Number(enfant.frais_transport) || 0;
      const fraisLibrairie = Number(enfant.frais_librairie) || 0;
      const fraisScolarite = Number(enfant.frais_scolarite) || 0;

      // ⭐ Le total est le montant de la pré-inscription (qui inclut déjà tous les services)
      const totalFrais = montantTotalInscription;
      const reste = Math.max(0, totalFrais - fraisPaye);

      console.log(` Frais pour ${enfant.prenom} ${enfant.nom}:`, {
        montantTotalInscription: montantTotalInscription,
        fraisInscription: fraisInscription,
        fraisCantine: fraisCantine,
        fraisTransport: fraisTransport,
        fraisLibrairie: fraisLibrairie,
        fraisScolarite: fraisScolarite,
        total: totalFrais,
        paye: fraisPaye,
        reste: reste
      });

      return {
        ...enfant,
        details_frais: {
          inscription: fraisInscription,
          cantine: fraisCantine,
          transport: fraisTransport,
          librairie: fraisLibrairie,
          scolarite: fraisScolarite,
          total: totalFrais,
          paye: fraisPaye,
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