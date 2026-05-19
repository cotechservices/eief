import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eleveId = searchParams.get("eleveId");

  const paiements = await prisma.paiement.findMany({
    where: eleveId ? { eleveId: parseInt(eleveId) } : {},
    include: {
      eleve: {
        include: { utilisateur: true, classe: true },
      },
    },
    orderBy: { datePaiement: "desc" },
  });

  return NextResponse.json(paiements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.role !== "COMPTABLE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { eleveId, montant, typeFrais, modePaiement, referenceTransaction } = body;

  const paiement = await prisma.paiement.create({
    data: {
      eleveId,
      montant,
      typeFrais,
      modePaiement,
      referenceTransaction,
      saisiePar: parseInt(session.user.id),
    },
  });

  return NextResponse.json(paiement);
}