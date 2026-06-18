// app/api/preinscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  console.log("=== API PREINSCRIPTION POST CALLED ===");
  
  try {
    const body = await request.json();
    const { parent, parentId, enfants } = body;

    console.log("Données reçues:", { parentEmail: parent?.email, parentId, enfantsCount: enfants?.length });

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

      console.log("Insertion enfant:", enfant.prenom, enfant.nom);

      const result = await query(
        `INSERT INTO preinscriptions (
          parent_id, enfant_nom, enfant_prenom, date_naissance, lieu_naissance, 
          sexe, niveau, classe, statut, numero_dossier, date_preinscription,
          acte_naissance_url, photo_url, bulletin_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente', $9, NOW(), $10, $11, $12)
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
        ]
      );

      preinscriptions.push({
        id: result.rows[0].id,
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