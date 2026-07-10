// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    console.log(`🔍 Tentative de réinitialisation`);
    console.log(`📊 Token reçu: ${token?.substring(0, 20)}...`);
    console.log(`📊 Nouveau mot de passe: ${newPassword ? '✅ Reçu' : '❌ Non reçu'}`);

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Token et mot de passe requis (minimum 6 caractères)" },
        { status: 400 }
      );
    }

    // ⭐ Vérifier le token - RECHERCHE SANS CONDITION used = FALSE d'abord
    const tokenResult = await query(
      `SELECT email, expires_at, used FROM reset_tokens WHERE token = $1`,
      [token]
    );

    console.log(`📊 Résultat: ${tokenResult.rows.length} ligne(s) trouvée(s)`);

    if (tokenResult.rows.length === 0) {
      console.log('❌ Token non trouvé');
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      );
    }

    const resetToken = tokenResult.rows[0];
    console.log(`📧 Email: ${resetToken.email}`);
    console.log(`✅ Utilisé: ${resetToken.used}`);
    console.log(`⏰ Expire: ${resetToken.expires_at}`);

    // Vérifier si déjà utilisé
    if (resetToken.used) {
      console.log('❌ Token déjà utilisé');
      return NextResponse.json(
        { error: "Token déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le token a expiré
    if (new Date(resetToken.expires_at) < new Date()) {
      console.log('❌ Token expiré');
      return NextResponse.json(
        { error: "Le token a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    // ⭐ Mettre à jour le mot de passe
    console.log(`🔑 Hashage du nouveau mot de passe...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE utilisateurs SET password = $1 WHERE email = $2`,
      [hashedPassword, resetToken.email]
    );
    console.log(`✅ Mot de passe mis à jour pour: ${resetToken.email}`);

    // ⭐ Marquer le token comme utilisé
    await query(
      `UPDATE reset_tokens SET used = TRUE WHERE token = $1`,
      [token]
    );
    console.log(`✅ Token marqué comme utilisé`);

    return NextResponse.json({ 
      success: true, 
      message: "Votre mot de passe a été réinitialisé avec succès." 
    });
    
  } catch (error) {
    console.error("❌ Erreur reset-password:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation" },
      { status: 500 }
    );
  }
}