// lib/eleve-auth.ts
// Helper partagé pour authentifier l'accès aux routes élèves (app/api/eleve/*)
// Gère à la fois l'élève connecté et le parent qui consulte le compte de son enfant.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { verifyParentChildAccess } from "@/lib/parentChildAuth";

export interface EleveAuthResult {
  eleveId?: number;
  classeId?: number | null;
  userRole?: string;
  userId?: number;
  parentId?: number | null;
  error?: NextResponse;
}

export async function getEleveSession(
  req: NextRequest
): Promise<EleveAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  // 1. CAS ÉLÈVE CONNECTÉ
  if (userRole === "ELEVE") {
    const eleveRes = await query(
      "SELECT id, classe_id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return { error: NextResponse.json({ error: "Profil élève introuvable" }, { status: 404 }) };
    }
    return {
      eleveId: eleveRes.rows[0].id,
      classeId: eleveRes.rows[0].classe_id,
      userRole: "ELEVE",
      userId,
    };
  }

  // 2. CAS PARENT OU ADMIN
  const isParent = userRole === "PARENT";
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "DIRECTEUR_GENERAL", "DIRECTEUR", "COMPTABLE"].includes(userRole);

  if (!isParent && !isAdmin) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }

  // Récupération de l'identifiant de l'élève (query param -> cookie -> premier enfant du parent)
  let eleveIdParam = req.nextUrl.searchParams.get("eleveId") || req.cookies.get("active_eleve_id")?.value;

  if (!eleveIdParam && isParent) {
    // Chercher le premier élève lié au parent
    const firstChildRes = await query(
      `SELECT lpe.eleve_id
       FROM lien_parent_eleve lpe
       JOIN parents p ON p.id = lpe.parent_id
       WHERE p.utilisateur_id = $1
       ORDER BY lpe.eleve_id ASC
       LIMIT 1`,
      [userId]
    );

    if (firstChildRes.rows.length > 0) {
      eleveIdParam = firstChildRes.rows[0].eleve_id.toString();
    } else {
      // Vérifier préinscription ou réinscription
      const preinsRes = await query(
        `SELECT pr.id
         FROM preinscriptions pr
         JOIN parents p ON p.id = pr.parent_id
         WHERE p.utilisateur_id = $1
         LIMIT 1`,
        [userId]
      );
      if (preinsRes.rows.length > 0) {
        eleveIdParam = preinsRes.rows[0].id.toString();
      }
    }
  }

  if (!eleveIdParam) {
    return {
      error: NextResponse.json(
        { error: "Aucun enfant associé trouvé ou paramètre eleveId requis" },
        { status: 400 }
      ),
    };
  }

  const auth = await verifyParentChildAccess(eleveIdParam);
  if (auth.error) {
    return { error: auth.error };
  }

  return {
    eleveId: auth.eleveId,
    classeId: auth.classeId,
    userRole,
    userId,
    parentId: auth.parentId,
  };
}
