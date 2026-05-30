import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || (session.user.role !== "ENSEIGNANT" && session.user.role !== "SURVEILLANT")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { presences, classeId, date, isOffline, syncId } = body;

  const results = [];
  for (const p of presences) {
    const presence = await prisma.presence.create({
      data: {
        eleveId: p.eleveId,
        classeId,
        date: new Date(date),
        statut: p.statut,
        enseignantId: parseInt(session.user.id),
        isOffline: isOffline || false,
        syncId,
      },
    });
    results.push(presence);
  }

  return NextResponse.json({ success: true, results });
}