// app/api/admin/personnel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - Récupérer tout le personnel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "DIRECTEUR_GENERAL" && userRole !== "COMPTABLE")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        p.id,
        p.matricule_personnel as matricule,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse,
        p.type,
        p.date_embauche as "dateEmbauche",
        p.salaire_base as salaire,
        u.est_actif as statut
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      ORDER BY p.id DESC
    `);

    const personnel = result.rows.map(p => ({
      ...p,
      statut: p.statut ? "actif" : "inactif"
    }));

    return NextResponse.json(personnel);
  } catch (error) {
    console.error("Erreur GET personnel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { nom, prenom, email, telephone, adresse, poste, dateEmbauche, salaire, statut } = body;

    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await query("SELECT id FROM utilisateurs WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Cet email existe déjà" }, { status: 400 });
    }

    // Générer un mot de passe par défaut
    const defaultPassword = "personnel123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Créer l'utilisateur
    const newUser = await query(`
      INSERT INTO utilisateurs (email, password, prenom, nom, telephone, adresse, role, est_actif)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [email, hashedPassword, prenom, nom, telephone || null, adresse || null, poste, statut === "actif"]);

    const userId = newUser.rows[0].id;

    // Générer le matricule
    const annee = new Date().getFullYear();
    const matricule = `PER-${annee}-${userId.toString().padStart(3, '0')}`;

    // 2. Créer le personnel
    await query(`
      INSERT INTO personnels (utilisateur_id, matricule_personnel, type, date_embauche, salaire_base)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, matricule, poste, dateEmbauche || new Date().toISOString().split('T')[0], salaire || null]);

    return NextResponse.json({ success: true, message: "Agent créé avec succès", matricule });
  } catch (error) {
    console.error("Erreur POST personnel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Modifier un agent
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, nom, prenom, email, telephone, adresse, poste, dateEmbauche, salaire, statut } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur_id
    const personnel = await query("SELECT utilisateur_id FROM personnels WHERE id = $1", [id]);
    if (personnel.rows.length === 0) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
    }

    const utilisateurId = personnel.rows[0].utilisateur_id;

    // Mettre à jour l'utilisateur
    await query(`
      UPDATE utilisateurs 
      SET email = $1, prenom = $2, nom = $3, telephone = $4, adresse = $5, role = $6, est_actif = $7
      WHERE id = $8
    `, [email, prenom, nom, telephone || null, adresse || null, poste, statut === "actif", utilisateurId]);

    // Mettre à jour le personnel
    await query(`
      UPDATE personnels 
      SET type = $1, date_embauche = $2, salaire_base = $3
      WHERE id = $4
    `, [poste, dateEmbauche || null, salaire || null, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT personnel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un agent
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const personnel = await query("SELECT utilisateur_id FROM personnels WHERE id = $1", [id]);
    if (personnel.rows.length > 0) {
      await query("DELETE FROM personnels WHERE id = $1", [id]);
      await query("DELETE FROM utilisateurs WHERE id = $1", [personnel.rows[0].utilisateur_id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE personnel:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}