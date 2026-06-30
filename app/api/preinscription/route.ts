// app/api/preinscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// ⭐ Fonction utilitaire pour calculer la date d'échéance
function getEcheanceDate(echeance: string): Date {
  const date = new Date();
  if (echeance === '1er_versement') {
    return date;
  } else if (echeance === '2eme_versement') {
    date.setMonth(date.getMonth() + 2);
    return date;
  } else if (echeance === '3eme_versement') {
    date.setMonth(date.getMonth() + 4);
    return date;
  }
  return date;
}

// ⭐ Fonction pour créer le plan de paiement et les échéances
// ⭐ Utilise la table classes pour les montants individuels
async function createPlanPaiement(preinscriptionId: number, niveau: string, classeNom: string, body: any) {
  console.log(` Création du plan de paiement pour la pré-inscription ${preinscriptionId}`);

  // ⭐ Récupérer les montants DEPUIS LA TABLE CLASSES (montants individuels)
  // ⭐ Priorité: chercher par nom de classe d'abord, puis par niveau
  let planResult = await query(`
    SELECT 
      nom,
      niveau,
      COALESCE(premier_versement, 0) as premier_versement,
      COALESCE(deuxieme_versement, 0) as deuxieme_versement,
      COALESCE(troisieme_versement, 0) as troisieme_versement,
      COALESCE(total_versement, 0) as total
    FROM classes
    WHERE LOWER(nom) = LOWER($1)
    LIMIT 1
  `, [classeNom]);

  // ⭐ Si pas trouvé par le nom de la classe, essayer par le niveau
  if (planResult.rows.length === 0) {
    console.log(`⚠️ Classe "${classeNom}" non trouvée, recherche par niveau: ${niveau}`);

    planResult = await query(`
      SELECT 
        NULL as nom,
        niveau,
        COALESCE(SUM(premier_versement), 0) as premier_versement,
        COALESCE(SUM(deuxieme_versement), 0) as deuxieme_versement,
        COALESCE(SUM(troisieme_versement), 0) as troisieme_versement,
        COALESCE(SUM(total_versement), 0) as total
      FROM classes
      WHERE LOWER(niveau) = LOWER($1)
      GROUP BY niveau
    `, [niveau]);
  }

  if (planResult.rows.length === 0) {
    console.log(`⚠️ Aucune classe trouvée pour: ${classeNom} ou ${niveau}`);
    return;
  }

  const plan = planResult.rows[0];
  console.log(`📋 Plan trouvé: ${plan.nom || plan.niveau} - 1er: ${plan.premier_versement}, 2ème: ${plan.deuxieme_versement}, 3ème: ${plan.troisieme_versement}, Total: ${plan.total}`);

  // Mettre à jour la pré-inscription avec le plan (montants individuels)
  await query(`
    UPDATE preinscriptions 
    SET montant_total_plan = $1,
        montant_restant_plan = $1
    WHERE id = $2
  `, [plan.total, preinscriptionId]);

  // ⭐ CRÉER LES ÉCHÉANCES AVEC LES MONTANTS INDIVIDUELS (NON MULTIPLIÉS)
  const echeances = [
    { echeance: '1er_versement', montant: Number(plan.premier_versement) || 0 },
    { echeance: '2eme_versement', montant: Number(plan.deuxieme_versement) || 0 },
    { echeance: '3eme_versement', montant: Number(plan.troisieme_versement) || 0 }
  ];

  for (const e of echeances) {
    if (e.montant > 0) {
      const dateEcheance = getEcheanceDate(e.echeance);
      await query(`
        INSERT INTO echeances_paiement (
          preinscription_id,
          type,
          echeance,
          montant,
          date_echeance,
          statut
        ) VALUES ($1, $2, $3, $4, $5, 'en_attente')
      `, [preinscriptionId, 'inscription', e.echeance, e.montant, dateEcheance]);
      console.log(`✅ Échéance ${e.echeance} créée: ${e.montant} GNF`);
    }
  }

  // ⭐ CRÉER LES ÉCHÉANCES POUR LES SERVICES OPTIONNELS (montants individuels)
  const services = [
    { type: 'transport', montant: Number(body.montant_transport) || 0 },
    { type: 'cantine', montant: Number(body.montant_cantine) || 0 },
    { type: 'fournitures', montant: Number(body.montant_fournitures) || 0 }
  ];

  for (const service of services) {
    if (service.montant > 0) {
      const dateEcheance = getEcheanceDate('1er_versement');
      await query(`
        INSERT INTO echeances_paiement (
          preinscription_id,
          type,
          echeance,
          montant,
          date_echeance,
          statut
        ) VALUES ($1, $2, $3, $4, $5, 'en_attente')
      `, [preinscriptionId, service.type, service.type, service.montant, dateEcheance]);
      console.log(`✅ Échéance ${service.type} créée: ${service.montant} GNF`);
    }
  }

  console.log(`✅ Plan de paiement complété pour la pré-inscription ${preinscriptionId}`);
}

export async function POST(request: NextRequest) {
  console.log("=== API PREINSCRIPTION POST CALLED ===");

  try {
    const body = await request.json();
    const { parent, parentId, enfants, fournitures_commande, montant_fournitures } = body;

    console.log("Données reçues:", {
      parentEmail: parent?.email,
      parentId,
      enfantsCount: enfants?.length,
      fournituresCount: fournitures_commande?.length || 0,
      montantFournitures: montant_fournitures || 0,
      montantTransport: body.montant_transport || 0,
      montantCantine: body.montant_cantine || 0
    });

    if (!enfants || enfants.length === 0) {
      return NextResponse.json(
        { success: false, message: "Données incomplètes" },
        { status: 400 }
      );
    }

    let parentIdToUse: number;

    // Cas 1: Parent déjà connecté (parentId fourni - peut être parent_id ou utilisateur_id)
    if (parentId) {
      console.log("Parent déjà connecté - ID reçu:", parentId);

      // Vérifier d'abord si c'est un parent_id
      let verifyParent = await query(
        "SELECT id FROM parents WHERE id = $1",
        [parentId]
      );

      // Si ce n'est pas un parent_id, vérifier si c'est un utilisateur_id
      if (verifyParent.rows.length === 0) {
        verifyParent = await query(
          "SELECT id FROM parents WHERE utilisateur_id = $1",
          [parentId]
        );
      }

      if (verifyParent.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Parent non trouvé" },
          { status: 404 }
        );
      }

      parentIdToUse = verifyParent.rows[0].id;
      console.log("Parent existant validé - ID:", parentIdToUse);
    }
    // Cas 2: Nouveau parent (création de compte)
    else if (parent) {
      console.log("Nouveau parent - création de compte");

      if (!parent.email || !parent.password || !parent.pereNom || !parent.perePrenom) {
        return NextResponse.json(
          { success: false, message: "Informations parent incomplètes" },
          { status: 400 }
        );
      }

      // 1. Chercher ou créer l'utilisateur
      let utilisateurId: number;
      const existingUser = await query(
        "SELECT id FROM utilisateurs WHERE email = $1",
        [parent.email]
      );

      if (existingUser.rows.length > 0) {
        utilisateurId = existingUser.rows[0].id;
        console.log("Utilisateur existant ID:", utilisateurId);

        await query(
          "UPDATE utilisateurs SET role = 'PARENT' WHERE id = $1 AND role != 'PARENT'",
          [utilisateurId]
        );
      } else {
        const hashedPassword = await bcrypt.hash(parent.password, 10);
        const newUser = await query(
          `INSERT INTO utilisateurs (email, password, prenom, nom, telephone, adresse, role, est_actif) 
           VALUES ($1, $2, $3, $4, $5, $6, 'PARENT', true) RETURNING id`,
          [parent.email, hashedPassword, parent.perePrenom, parent.pereNom, parent.perePhone || null, parent.adresse || null]
        );
        utilisateurId = newUser.rows[0].id;
        console.log("Nouvel utilisateur créé ID:", utilisateurId);
      }

      // 2. Vérifier et créer l'entrée dans parents
      const existingParent = await query(
        "SELECT id FROM parents WHERE utilisateur_id = $1",
        [utilisateurId]
      );

      if (existingParent.rows.length > 0) {
        parentIdToUse = existingParent.rows[0].id;
        console.log("Parent existant ID:", parentIdToUse);
      } else {
        const mereInfo = JSON.stringify({
          mereNom: parent.mereNom || null,
          merePrenom: parent.merePrenom || null,
          merePhone: parent.merePhone || null,
          mereProfession: parent.mereProfession || null,
        });
        const newParent = await query(
          `INSERT INTO parents (utilisateur_id, profession, situation_matrimoniale) 
           VALUES ($1, $2, $3) RETURNING id`,
          [utilisateurId, parent.pereProfession || "Non renseigné", mereInfo]
        );
        parentIdToUse = newParent.rows[0].id;
        console.log("Nouveau parent créé ID:", parentIdToUse);
      }

    } else {
      return NextResponse.json(
        { success: false, message: "Aucune information parent fournie" },
        { status: 400 }
      );
    }

    // 3. Créer les pré-inscriptions
    const preinscriptions = [];
    for (const enfant of enfants) {
      const annee = new Date().getFullYear().toString().slice(-2);
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 10000);
      const numeroDossier = `PRE-${annee}-${timestamp.slice(-6)}-${random}`;

      // Récupérer le montant des frais d'inscription pour la classe
      let montantFrais = 0;
      if (enfant.classe) {
        const classeResult = await query(
          "SELECT frais_inscription FROM classes WHERE LOWER(nom) = LOWER($1)",
          [enfant.classe]
        );
        if (classeResult.rows.length > 0) {
          montantFrais = classeResult.rows[0].frais_inscription || 0;
        }
      }

      console.log("Insertion enfant:", enfant.prenom, enfant.nom, "Classe:", enfant.classe, "Frais:", montantFrais);

      const result = await query(
        `INSERT INTO preinscriptions (
          parent_id, enfant_nom, enfant_prenom, date_naissance, lieu_naissance, 
          sexe, niveau, classe, statut, numero_dossier, date_preinscription,
          acte_naissance_url, photo_url, bulletin_url, frais_montant
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente', $9, NOW(), $10, $11, $12, $13)
        RETURNING id, numero_dossier`,
        [
          parentIdToUse,
          enfant.nom,
          enfant.prenom,
          enfant.dateNaissance,
          enfant.lieuNaissance || null,
          enfant.sexe,
          enfant.niveau,
          enfant.classe,
          numeroDossier,
          enfant.acteNaissanceUrl || null,
          enfant.photoUrl || null,
          enfant.bulletinUrl || null,
          montantFrais
        ]
      );

      const preinscriptionId = result.rows[0].id;

      // ⭐ 4. Enregistrer les fournitures commandées pour cette pré-inscription
      if (fournitures_commande && fournitures_commande.length > 0) {
        console.log(`Enregistrement de ${fournitures_commande.length} fournitures pour la pré-inscription ${preinscriptionId}`);
        for (const fourniture of fournitures_commande) {
          await query(
            `INSERT INTO commandes_fournitures (
              preinscription_id, 
              article_id, 
              quantite, 
              prix_unitaire
            ) VALUES ($1, $2, $3, $4)`,
            [
              preinscriptionId,
              fourniture.id,
              fourniture.quantite,
              fourniture.prix_unitaire
            ]
          );
        }
        console.log(`✅ ${fournitures_commande.length} fournitures enregistrées avec succès`);
      }

      // ⭐ 5. Enregistrer le transport sélectionné
      if (body.transport && body.transport.length > 0) {
        console.log(`Enregistrement du transport pour la pré-inscription ${preinscriptionId}`);
        for (const transport of body.transport) {
          await query(
            `INSERT INTO preinscription_transport (
              preinscription_id, 
              ligne_id, 
              prix
            ) VALUES ($1, $2, $3)`,
            [
              preinscriptionId,
              transport.id,
              transport.prix
            ]
          );
        }
      }

      // ⭐ 6. Enregistrer la cantine sélectionnée
      if (body.cantine && body.cantine.length > 0) {
        console.log(`Enregistrement de la cantine pour la pré-inscription ${preinscriptionId}`);
        for (const cantine of body.cantine) {
          await query(
            `INSERT INTO preinscription_cantine (
              preinscription_id, 
              menu_id, 
              prix
            ) VALUES ($1, $2, $3)`,
            [
              preinscriptionId,
              cantine.id,
              cantine.prix
            ]
          );
        }
      }

      // ⭐ 7. Créer le plan de paiement et les échéances
      // ⭐ Passer classeNom ET niveau pour la recherche
      await createPlanPaiement(preinscriptionId, enfant.niveau, enfant.classe, body);

      preinscriptions.push({
        id: preinscriptionId,
        numeroDossier: result.rows[0].numero_dossier,
        enfant: `${enfant.prenom} ${enfant.nom}`
      });
    }

    console.log("Succès! Préinscriptions créées:", preinscriptions.length);

    return NextResponse.json({
      success: true,
      message: "Pré-inscription envoyée avec succès",
      parentId: parentIdToUse,
      preinscriptions
    });

  } catch (error) {
    console.error("ERREUR:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}