// app/api/parent/paiement-preinscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

// Configuration email (à configurer avec vos paramètres)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { preinscriptionId, modePaiement, reference } = body;
    const userEmail = session.user?.email;

    if (!preinscriptionId || !modePaiement) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    // Vérifier que la pré-inscription appartient au parent et récupérer le montant
    const preinscription = await query(`
      SELECT 
        p.*, 
        u.email as parent_email, 
        u.nom as parent_nom, 
        u.prenom as parent_prenom,
        COALESCE(c.frais_inscription, p.frais_montant, 500000) as montant_calcule
      FROM preinscriptions p
      JOIN parents pa ON p.parent_id = pa.id
      JOIN utilisateurs u ON pa.utilisateur_id = u.id
      LEFT JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
      WHERE p.id = $1 AND u.email = $2
    `, [preinscriptionId, userEmail]);

    if (preinscription.rows.length === 0) {
      return NextResponse.json({ error: "Pré-inscription non trouvée" }, { status: 404 });
    }

    const data = preinscription.rows[0];
    const montantAPayer = data.montant_calcule;

    // Enregistrer le paiement avec le montant dynamique
    await query(`
      UPDATE preinscriptions 
      SET frais_montant = $1,
          frais_statut = 'paye',
          frais_mode_paiement = $2,
          frais_reference = $3,
          frais_date_paiement = NOW()
      WHERE id = $4
    `, [montantAPayer, modePaiement, reference || null, preinscriptionId]);

    // Envoyer email au comptable
    const comptableEmail = process.env.COMPTABLE_EMAIL || "comptable@eief.com";
    
    await transporter.sendMail({
      from: `"Scolarité EIEF" <${process.env.SMTP_USER}>`,
      to: comptableEmail,
      cc: userEmail,
      subject: `Paiement reçu - Dossier ${data.numero_dossier}`,
      html: `
        <h2>Nouveau paiement enregistré</h2>
        <p><strong>Parent:</strong> ${data.parent_prenom} ${data.parent_nom}</p>
        <p><strong>Email:</strong> ${data.parent_email}</p>
        <p><strong>Enfant:</strong> ${data.enfant_prenom} ${data.enfant_nom}</p>
        <p><strong>Dossier:</strong> ${data.numero_dossier}</p>
        <p><strong>Classe:</strong> ${data.classe || "Non spécifiée"}</p>
        <p><strong>Montant:</strong> ${montantAPayer.toLocaleString()} GNF</p>
        <p><strong>Mode de paiement:</strong> ${modePaiement === "orange_money" ? "Orange Money" : modePaiement === "carte" ? "Carte Visa" : "Espèces"}</p>
        ${reference ? `<p><strong>Référence:</strong> ${reference}</p>` : ""}
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>Connectez-vous à l'administration pour finaliser l'inscription.</p>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Paiement effectué avec succès. Un email a été envoyé au comptable."
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}