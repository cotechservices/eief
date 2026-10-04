// app/api/admin/finances/remises/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "COMPTABLE" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const minEnfantsParam = url.searchParams.get("minEnfants");
    const minEnfants = minEnfantsParam ? parseInt(minEnfantsParam) : 2;

    // S'assurer que la table remises_familles existe
    await query(`
      CREATE TABLE IF NOT EXISTS remises_familles (
        id SERIAL PRIMARY KEY,
        parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        montant NUMERIC(12, 2) NOT NULL,
        motif TEXT,
        saisie_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Récupérer la liste des parents avec leurs enfants (par défaut 2 enfants ou plus)
    const parentsResult = await query(`
      SELECT 
        p.id as parent_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        GREATEST(
          COUNT(DISTINCT lpe.eleve_id),
          (SELECT COUNT(*) FROM preinscriptions WHERE parent_id = p.id AND statut != 'rejete') +
          (SELECT COUNT(*) FROM reinscriptions WHERE parent_id = p.id AND statut != 'rejete')
        ) as nb_enfants,
        COALESCE((SELECT SUM(montant) FROM remises_familles WHERE parent_id = p.id), 0) as total_remises
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN lien_parent_eleve lpe ON p.id = lpe.parent_id
      GROUP BY p.id, u.nom, u.prenom, u.email, u.telephone
      HAVING GREATEST(
        COUNT(DISTINCT lpe.eleve_id),
        (SELECT COUNT(*) FROM preinscriptions WHERE parent_id = p.id AND statut != 'rejete') +
        (SELECT COUNT(*) FROM reinscriptions WHERE parent_id = p.id AND statut != 'rejete')
      ) >= $1
      ORDER BY nb_enfants DESC, u.nom ASC
    `, [minEnfants]);

    // Pour chaque parent, calculer les détails financiers (dette totale, payé, solde)
    const parentsComplets = [];

    for (const parent of parentsResult.rows) {
      const parentId = parent.parent_id;

      // Calculer les frais des élèves inscrits
      const elevesFraisResult = await query(`
        SELECT 
          e.id as eleve_id,
          COALESCE(c.total_versement, c.frais_inscription, 0) as frais_inscription_classe,
          COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.eleve_id = e.id AND pai.statut = 'valide'), 0) as frais_paye_eleve,
          COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.preinscription_id IN (SELECT i.preinscription_id FROM inscriptions i WHERE i.eleve_id = e.id) AND pai.statut = 'valide'), 0) as frais_paye_preinscription,
          COALESCE((SELECT SUM(pai.montant) FROM paiements pai WHERE pai.reinscription_id IN (SELECT id FROM reinscriptions WHERE eleve_id = e.id) AND pai.statut = 'valide'), 0) as frais_paye_reinscription
        FROM eleves e
        LEFT JOIN classes c ON e.classe_id = c.id
        JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
        WHERE lpe.parent_id = $1 AND e.deleted_at IS NULL
      `, [parentId]);

      // Preinscriptions & Reinscriptions en attente
      const preinsPending = await query(`
        SELECT COALESCE(SUM(COALESCE(montant_total_plan, frais_montant)), 0) as total
        FROM preinscriptions
        WHERE parent_id = $1 AND statut = 'en_attente'
      `, [parentId]);
      const preinsTotal = Number(preinsPending.rows[0]?.total) || 0;

      const reinscrPending = await query(`
        SELECT COALESCE(SUM(COALESCE(montant_total_plan, montant_frais)), 0) as total
        FROM reinscriptions
        WHERE parent_id = $1 AND statut = 'en_attente'
      `, [parentId]);
      const reinscrTotal = Number(reinscrPending.rows[0]?.total) || 0;

      // Cantine + Transport + Librairie
      const servicesRes = await query(`
        SELECT 
          COALESCE((SELECT SUM(montant_total) FROM inscriptions_cantine WHERE eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)), 0) +
          COALESCE((SELECT SUM(montant_mensuel * mois_total) FROM inscriptions_transport WHERE eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)), 0) +
          COALESCE((SELECT SUM(total) FROM commandes_librairie WHERE parent_id = $1 AND statut = 'valide'), 0) as total_services
      `, [parentId]);
      const totalServices = Number(servicesRes.rows[0]?.total_services) || 0;

      let scolariteEleves = 0;
      let totalPaye = 0;

      for (const row of elevesFraisResult.rows) {
        scolariteEleves += Number(row.frais_inscription_classe) || 0;
        totalPaye += Number(row.frais_paye_eleve) + Number(row.frais_paye_preinscription) + Number(row.frais_paye_reinscription);
      }

      const totalAPayer = scolariteEleves + preinsTotal + reinscrTotal + totalServices;
      const totalRemises = Number(parent.total_remises) || 0;
      const soldeRestant = Math.max(0, totalAPayer - totalPaye - totalRemises);

      parentsComplets.push({
        id: parent.parent_id,
        nom: parent.nom,
        prenom: parent.prenom,
        email: parent.email,
        telephone: parent.telephone,
        nb_enfants: Number(parent.nb_enfants),
        total_a_payer: totalAPayer,
        total_paye: totalPaye,
        total_remises: totalRemises,
        solde_restant: soldeRestant
      });
    }

    return NextResponse.json(parentsComplets);
  } catch (error: any) {
    console.error("Erreur GET remises:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "COMPTABLE" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const { parentId, montant, motif } = body;

    if (!parentId || !montant || montant <= 0) {
      return NextResponse.json({ error: "Parent ID et montant valide requis" }, { status: 400 });
    }

    // Vérifier si la table remises_familles existe, sinon la créer à la volée
    await query(`
      CREATE TABLE IF NOT EXISTS remises_familles (
        id SERIAL PRIMARY KEY,
        parent_id INT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        montant NUMERIC(12, 2) NOT NULL,
        motif TEXT,
        saisie_par INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insérer la remise
    const insertResult = await query(`
      INSERT INTO remises_familles (parent_id, montant, motif, saisie_par)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [parentId, montant, motif || "Remise Famille Nombreuse", (session.user as any).id || null]);

    // Également réduire le montant_restant_plan sur la dernière pré-inscription ou réinscription active si disponible
    await query(`
      UPDATE preinscriptions
      SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
      WHERE parent_id = $2 AND montant_restant_plan > 0
    `, [montant, parentId]);

    await query(`
      UPDATE reinscriptions
      SET montant_restant_plan = GREATEST(0, montant_restant_plan - $1)
      WHERE parent_id = $2 AND montant_restant_plan > 0
    `, [montant, parentId]);

    return NextResponse.json({
      success: true,
      message: `Remise de ${Number(montant).toLocaleString()} GNF appliquée avec succès.`,
      remise: insertResult.rows[0]
    });
  } catch (error: any) {
    console.error("Erreur POST remise:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}
