// app/api/admin/preinscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Récupérer toutes les pré-inscriptions
export async function GET(request: NextRequest) {
  console.log("=== API ADMIN GET ===");
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé - besoin SUPER_ADMIN ou COMPTABLE" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    let sql = `
      SELECT 
        p.id,
        p.numero_dossier,
        p.enfant_nom,
        p.enfant_prenom,
        p.date_naissance,
        p.lieu_naissance,
        p.sexe,
        p.niveau,
        p.classe,
        p.statut,
        p.date_preinscription,
        p.observations,
        p.frais_montant,
        p.frais_statut,
        p.frais_mode_paiement,
        p.frais_reference,
        p.acte_naissance_url,
        p.photo_url,
        p.bulletin_url,
        u.nom as parent_nom,
        u.prenom as parent_prenom,
        u.email as parent_email,
        u.telephone as parent_telephone,
        pa.profession as parent_profession,
        pa.situation_matrimoniale as mere_info
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== "all") {
      sql += ` AND p.statut = $${params.length + 1}`;
      params.push(statut);
    }

    if (search) {
      sql += ` AND (p.enfant_nom ILIKE $${params.length + 1} OR p.enfant_prenom ILIKE $${params.length + 1} OR p.numero_dossier ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY p.date_preinscription DESC`;

    const result = await query(sql, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le statut (avec création d'inscription)
// app/api/admin/preinscriptions/route.ts - Partie PUT modifiée
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, observations } = body;

    if (!id || !statut) {
      return NextResponse.json(
        { error: "ID et statut requis" },
        { status: 400 }
      );
    }

    // Vérifier le paiement si on essaie de valider
    if (statut === "valide") {
      const preinscription = await query(
        "SELECT frais_statut, frais_montant, classe, frais_mode_paiement, frais_reference FROM preinscriptions WHERE id = $1",
        [id]
      );
      
      if (preinscription.rows[0]?.frais_statut !== "paye") {
        return NextResponse.json(
          { error: "❌ Le paiement des frais est requis avant la validation" },
          { status: 400 }
        );
      }

      // Récupérer toutes les infos de la pré-inscription
      const preinsData = await query(`
        SELECT 
          p.*,
          pa.id as parent_id,
          u.id as parent_utilisateur_id,
          u.email as parent_email,
          u.nom as parent_nom,
          u.prenom as parent_prenom
        FROM preinscriptions p
        JOIN parents pa ON p.parent_id = pa.id
        JOIN utilisateurs u ON pa.utilisateur_id = u.id
        WHERE p.id = $1
      `, [id]);

      if (preinsData.rows.length === 0) {
        return NextResponse.json(
          { error: "Pré-inscription non trouvée" },
          { status: 404 }
        );
      }

      const data = preinsData.rows[0];

      try {
        // 1. Récupérer l'ID de la classe correspondante et son montant de frais
        let classeId = null;
        let montantFrais = data.frais_montant || 350000;
        
        if (data.classe) {
          const classeResult = await query(
            "SELECT id, frais_inscription FROM classes WHERE LOWER(nom) = LOWER($1)",
            [data.classe]
          );
          if (classeResult.rows.length > 0) {
            classeId = classeResult.rows[0].id;
            if (classeResult.rows[0].frais_inscription) {
              montantFrais = classeResult.rows[0].frais_inscription;
            }
            console.log(`Classe trouvée: ${data.classe} (ID: ${classeId}, Frais: ${montantFrais})`);
          } else {
            console.log(`Classe non trouvée: ${data.classe}`);
          }
        }

        // 2. Créer l'utilisateur élève
        const emailEleve = `${data.enfant_prenom.toLowerCase()}.${data.enfant_nom.toLowerCase()}${Math.floor(Math.random() * 1000)}@eief.com`;
        const motDePasseTemp = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(motDePasseTemp, 10);

        const newEleveUser = await query(`
          INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
          VALUES ($1, $2, $3, $4, 'ELEVE', true)
          RETURNING id
        `, [emailEleve, hashedPassword, data.enfant_prenom, data.enfant_nom]);

        // 3. Créer la fiche élève AVEC la classe
        const matricule = `ELE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const newEleve = await query(`
          INSERT INTO eleves (utilisateur_id, matricule, date_naissance, lieu_naissance, sexe, classe_id, est_inscrit)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          RETURNING id
        `, [newEleveUser.rows[0].id, matricule, data.date_naissance, data.lieu_naissance, data.sexe, classeId]);

        // 4. Lier l'élève au parent
        await query(`
          INSERT INTO lien_parent_eleve (parent_id, eleve_id)
          VALUES ($1, $2)
        `, [data.parent_id, newEleve.rows[0].id]);

        // 5. Récupérer l'année scolaire active
        const anneeScolaire = await query(`
          SELECT id FROM annees_scolaires WHERE est_active = true
        `);

        // 6. Créer l'inscription
        await query(`
          INSERT INTO inscriptions (preinscription_id, eleve_id, parent_id, numero_matricule, annee_scolaire_id, statut)
          VALUES ($1, $2, $3, $4, $5, 'active')
        `, [id, newEleve.rows[0].id, data.parent_id, matricule, anneeScolaire.rows[0]?.id || null]);

        // 7. Convertir le mode de paiement pour la table paiements
        let modePaiementValide = 'especes';
        if (data.frais_mode_paiement === 'orange_money') {
          modePaiementValide = 'mobile_money';
        } else if (data.frais_mode_paiement === 'carte') {
          modePaiementValide = 'carte';
        } else if (data.frais_mode_paiement === 'especes') {
          modePaiementValide = 'especes';
        }

        // 8. INSÉRER LE PAIEMENT DANS LA TABLE paiements
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        await query(`
          INSERT INTO paiements (
            eleve_id, 
            montant, 
            type_frais, 
            mode_paiement, 
            reference_transaction, 
            statut, 
            date_paiement,
            mois,
            annee,
            saisie_par
          )
          VALUES ($1, $2, 'inscription', $3, $4, 'valide', NOW(), $5, $6, $7)
        `, [
          newEleve.rows[0].id, 
          montantFrais, 
          modePaiementValide, 
          data.frais_reference || null,
          currentMonth,
          currentYear,
          (session.user as any).id
        ]);

        console.log(`✅ Élève créé: ${data.enfant_prenom} ${data.enfant_nom}`);
        console.log(`   - Matricule: ${matricule}`);
        console.log(`   - Classe ID: ${classeId}`);
        console.log(`   - Frais: ${montantFrais} GNF inséré dans paiements`);
        console.log(`   - Mode: ${modePaiementValide}`);

      } catch (createError) {
        console.error("Erreur lors de la création de l'élève:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la création de l'élève: " + (createError as Error).message },
          { status: 500 }
        );
      }
    }

    // Mettre à jour le statut de la pré-inscription
    const result = await query(
      `UPDATE preinscriptions 
       SET statut = $1, observations = $2, traite_par = $3, date_traitement = NOW()
       WHERE id = $4 RETURNING *`,
      [statut, observations || null, (session.user as any).id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pré-inscription non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: statut === "valide" ? "✅ Inscription validée, élève créé et paiement enregistré" : "❌ Pré-inscription rejetée",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une pré-inscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID requis" },
        { status: 400 }
      );
    }

    await query("DELETE FROM preinscriptions WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}