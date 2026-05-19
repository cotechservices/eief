// app/api/classes/[id]/route.ts (complet)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET une classe spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const classeId = parseInt(id);
  
  const classe = await prisma.classe.findUnique({
    where: { id: classeId },
    include: {
      eleves: true,
      enseignements: {
        include: { enseignant: true, matiere: true },
      },
    },
  });

  if (!classe) {
    return NextResponse.json({ error: "Classe non trouvée" }, { status: 404 });
  }

  return NextResponse.json(classe);
}

// PUT mettre à jour une classe
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const classeId = parseInt(id);
  const body = await req.json();
  
  const classe = await prisma.classe.update({
    where: { id: classeId },
    data: {
      nom: body.nom,
      niveau: body.niveau,
      salle: body.salle,
      capaciteMax: body.capaciteMax,
    },
  });

  return NextResponse.json(classe);
}

// DELETE supprimer une classe
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const classeId = parseInt(id);
  
  await prisma.classe.delete({
    where: { id: classeId },
  });

  return NextResponse.json({ success: true });
}