// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Token et mot de passe requis (minimum 6 caractères)" },
        { status: 400 }
      );
    }

    // ⭐ Vérifier le token
    const tokenResult = await query(
      `SELECT email, expires_at FROM reset_tokens 
       WHERE token = $1 AND used = FALSE`,
      [token]
    );

    const resetToken = tokenResult.rows[0];

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token invalide ou déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier si le token a expiré
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Le token a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    // ⭐ Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE utilisateurs SET password = $1 WHERE email = $2`,
      [hashedPassword, resetToken.email]
    );

    // ⭐ Marquer le token comme utilisé
    await query(
      `UPDATE reset_tokens SET used = TRUE WHERE token = $1`,
      [token]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Votre mot de passe a été réinitialisé avec succès." 
    });
    
  } catch (error) {
    console.error("Erreur reset-password:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation" },
      { status: 500 }
    );
  }
}