// app/api/auth/verify-reset-token/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    // Vérifier si le token existe et n'a pas expiré
    const result = await query(
      `SELECT email, expires_at FROM reset_tokens 
       WHERE token = $1 AND used = FALSE`,
      [token]
    );

    const resetToken = result.rows[0];

    if (!resetToken) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      valid: true,
      email: resetToken.email
    });
    
  } catch (error) {
    console.error("Erreur verify-reset-token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}