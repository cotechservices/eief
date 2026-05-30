// app/api/admin/enseignants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
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
        p.type as specialite,
        p.date_embauche as "dateEmbauche",
        p.salaire_base as salaire,
        u.est_actif as statut
      FROM personnels p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE p.type = 'enseignant'
      ORDER BY p.id DESC
    `);

    const enseignants = result.rows.map(e => ({
      ...e,
      statut: e.statut ? "actif" : "inactif"
    }));

    return NextResponse.json(enseignants);
  } catch (error) {
    console.error("Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, prenom, nom, telephone, adresse, specialite, dateEmbauche, salaire } = body;

    if (!email || !password || !prenom || !nom) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const existingUser = await query("SELECT id FROM utilisateurs WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Cet email existe déjà" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await query(`
      INSERT INTO utilisateurs (email, password, prenom, nom, telephone, adresse, role, est_actif)
      VALUES ($1, $2, $3, $4, $5, $6, 'ENSEIGNANT', true)
      RETURNING id
    `, [email, hashedPassword, prenom, nom, telephone || null, adresse || null]);

    const matricule = `ENS-${new Date().getFullYear()}-${String(newUser.rows[0].id).padStart(3, '0')}`;

    await query(`
      INSERT INTO personnels (utilisateur_id, matricule_personnel, type, date_embauche, salaire_base)
      VALUES ($1, $2, 'enseignant', $3, $4)
    `, [newUser.rows[0].id, matricule, dateEmbauche || new Date().toISOString().split('T')[0], salaire || null]);

    return NextResponse.json({ success: true, message: "Enseignant créé", matricule });
  } catch (error) {
    console.error("Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Modification d'un enseignant (CORRIGÉ)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Body reçu:", body);

    const { id, email, prenom, nom, telephone, adresse, specialite, dateEmbauche, salaire } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Récupérer le personnel
    const personnel = await query("SELECT utilisateur_id FROM personnels WHERE id = $1", [id]);
    if (personnel.rows.length === 0) {
      return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });
    }

    const utilisateurId = personnel.rows[0].utilisateur_id;

    // Mettre à jour l'utilisateur
    await query(`
      UPDATE utilisateurs 
      SET email = $1, prenom = $2, nom = $3, telephone = $4, adresse = $5
      WHERE id = $6
    `, [email, prenom, nom, telephone || null, adresse || null, utilisateurId]);

    // Mettre à jour le personnel
    await query(`
      UPDATE personnels 
      SET date_embauche = $1, salaire_base = $2
      WHERE id = $3
    `, [dateEmbauche || null, salaire ? parseFloat(salaire) : null, id]);

    console.log("Enseignant modifié avec succès, ID:", id);

    return NextResponse.json({ success: true, message: "Enseignant modifié avec succès" });
  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 });
  }
}

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
    console.error("Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}