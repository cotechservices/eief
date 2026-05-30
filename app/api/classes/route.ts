import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const classes = await prisma.classe.findMany({
    include: {
      _count: {
        select: { eleves: true },
      },
    },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { nom, niveau, salle, capaciteMax } = body;

  const nouvelleClasse = await prisma.classe.create({
    data: {
      nom,
      niveau,
      salle,
      capaciteMax,
      anneeScolaireId: 1,
    },
  });

  return NextResponse.json(nouvelleClasse);
}