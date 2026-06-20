import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const depenses = await prisma.depense.findMany({
      orderBy: {
        dateDepense: 'desc'
      }
    });

    return NextResponse.json(depenses);
  } catch (error) {
    console.error("Erreur API Dépenses (GET):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { categorie, montant, dateDepense, description, recuUrl } = body;

    if (!categorie || !montant) {
       return NextResponse.json({ error: "Catégorie et montant obligatoires" }, { status: 400 });
    }

    const depense = await prisma.depense.create({
      data: {
        categorie,
        montant: parseInt(montant),
        dateDepense: dateDepense ? new Date(dateDepense) : new Date(),
        description: description || null,
        recuUrl: recuUrl || null,
        saisiePar: parseInt(userId)
      }
    });

    return NextResponse.json({ success: true, depense });
  } catch (error) {
    console.error("Erreur API Dépenses (POST):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
