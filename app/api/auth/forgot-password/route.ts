// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // 1. Vérifier si l'utilisateur existe
    const userResult = await query(
      "SELECT id, email, nom, prenom FROM utilisateurs WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      console.log(`[Sécurité] Email non trouvé: ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: "Si cette adresse email correspond à un compte, un lien de réinitialisation a été envoyé." 
      });
    }

    // 2. Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    // ⭐ 3. Sauvegarder le token - CORRIGÉ avec used = FALSE
    await query(
      `INSERT INTO reset_tokens (email, token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE 
       SET token = $2, 
           expires_at = $3, 
           created_at = NOW(),
           used = FALSE  -- ⭐ AJOUT ESSENTIEL !
      `,
      [email, token, expiresAt]
    );

    // 4. Construire le lien
    const resetLink = `${process.env.NEXTAUTH_URL || 'https://eief.vercel.app'}/reset-password/${token}`;

    // 5. Configuration email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #201f1fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #003de7ff, #1e65ffff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #1e65ffff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #003de7ff; }
          .footer { text-align: center; margin-top: 20px; color: #000000ff; font-size: 14px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.prenom} ${user.nom},</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
            <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <p style="font-size: 14px; color: #000000ff;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">${resetLink}</p>
            <div class="warning">
              ⚠️ Ce lien expire dans 1 heure pour des raisons de sécurité.
            </div>
            <p style="color: #000000ff; font-size: 14px; margin-top: 20px;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
            <hr style="border: none; border-top: 1px solid #000000ff; margin: 20px 0;">
            <p style="font-size: 12px; color: #000000ff; text-align: center;">
              Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 E.I.E.F - École Internationale d'Enseignement Fondamental</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"E.I.E.F" <eief.infos@gmail.com>',
      to: email,
      subject: "Réinitialisation de votre mot de passe - E.I.E.F",
      html: htmlContent,
    });

    console.log(`✅ Email de réinitialisation envoyé à: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: "Un lien de réinitialisation a été envoyé à votre adresse email." 
    });
    
  } catch (error) {
    console.error("Erreur dans l'API forgot-password:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de l'email." }, 
      { status: 500 }
    );
  }
}