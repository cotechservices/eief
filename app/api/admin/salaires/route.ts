import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== "SUPER_ADMIN" && userRole !== "COMPTABLE" && userRole !== "DIRECTEUR_GENERAL")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const personnels = await prisma.personnel.findMany({
      include: {
        utilisateur: true,
        paiementsSalaires: {
          where: {
            mois: month,
            annee: year
          }
        }
      },
      where: {
        utilisateur: {
          estActif: true
        }
      },
      orderBy: {
        utilisateur: {
          nom: 'asc'
        }
      }
    });

    const salaries = personnels.map(p => {
      const paiement = p.paiementsSalaires[0];
      return {
        personnel_id: p.id,
        employe: `${p.utilisateur.prenom} ${p.utilisateur.nom}`,
        poste: p.type,
        salaire_base: p.salaireBase,
        statut: paiement?.statut || 'non_paye',
        date_paiement: paiement?.datePaiement ? new Date(paiement.datePaiement).toISOString().split('T')[0] : null
      };
    });

    return NextResponse.json(salaries);
  } catch (error) {
    console.error("Erreur API Salaires:", error);
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
    const { personnel_id, montant, mois, annee, mode_paiement, reference_transaction } = body;

    const existingPayment = await prisma.paiementSalaire.findFirst({
      where: {
        personnelId: personnel_id,
        mois: mois,
        annee: annee
      }
    });

    if (existingPayment) {
      return NextResponse.json({ error: "Salaire déjà payé pour ce mois" }, { status: 400 });
    }

    await prisma.paiementSalaire.create({
      data: {
        personnelId: personnel_id,
        montant: montant,
        mois: mois,
        annee: annee,
        modePaiement: mode_paiement || "Virement",
        referenceTransaction: reference_transaction,
        saisiePar: parseInt(userId)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur paiement salaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}