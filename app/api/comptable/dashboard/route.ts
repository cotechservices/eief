import { NextResponse } from "next/server";
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

    // 1. Total Recettes
    const paiementsValides = await prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { statut: 'valide' }
    });
    const totalRecettes = Number(paiementsValides._sum.montant || 0);

    // 2. Total Dépenses (Salaires + Autres dépenses)
    const totalSalaires = await prisma.paiementSalaire.aggregate({
      _sum: { montant: true },
      where: { statut: 'paye' }
    });
    const totalAutresDepenses = await prisma.depense.aggregate({
      _sum: { montant: true }
    });
    const totalDepenses = Number(totalSalaires._sum.montant || 0) + Number(totalAutresDepenses._sum.montant || 0);

    // 3. Derniers paiements
    const derniersPaiementsRaw = await prisma.paiement.findMany({
      include: {
        eleve: {
          include: {
            utilisateur: true,
            classe: true
          }
        }
      },
      orderBy: [
        { datePaiement: 'desc' },
        { id: 'desc' }
      ],
      take: 10
    });

    const derniersPaiements = derniersPaiementsRaw.map(row => ({
      id: row.id,
      eleve: `${row.eleve?.utilisateur.prenom || ''} ${row.eleve?.utilisateur.nom || ''}`.trim() || 'Inconnu',
      classe: row.eleve?.classe?.nom || '-',
      montant: row.montant,
      type: row.typeFrais || 'Non défini',
      date: row.datePaiement ? new Date(row.datePaiement).toISOString().split('T')[0] : '-',
      statut: row.statut,
      mode: row.modePaiement || '-'
    }));

    // 4. Impayés / En attente
    const impayesRaw = await prisma.paiement.findMany({
      where: {
        statut: {
          in: ['en_attente', 'impaye']
        }
      },
      include: {
        eleve: {
          include: {
            utilisateur: true,
            classe: true
          }
        }
      },
      orderBy: {
        datePaiement: 'asc'
      }
    });

    const impayes = impayesRaw.map(row => {
      const datePaiement = row.datePaiement ? new Date(row.datePaiement) : new Date();
      return {
        id: row.id,
        eleve: `${row.eleve?.utilisateur.prenom || ''} ${row.eleve?.utilisateur.nom || ''}`.trim() || 'Inconnu',
        classe: row.eleve?.classe?.nom || '-',
        montant: row.montant,
        type: row.typeFrais || 'Non défini',
        retard: Math.max(0, Math.floor((new Date().getTime() - datePaiement.getTime()) / (1000 * 3600 * 24)))
      };
    });

    const encoursTotal = impayes.reduce((sum, item) => sum + item.montant, 0);

    // 5. Répartition par catégorie (Recettes)
    const paiementsParType = await prisma.paiement.groupBy({
      by: ['typeFrais'],
      _sum: { montant: true },
      where: { statut: 'valide' }
    });

    const categoriesRecettes = paiementsParType.map(cat => {
      const typeStr = cat.typeFrais || 'autre';
      const formattedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
      return {
        name: formattedType,
        montant: Number(cat._sum.montant || 0),
        pourcentage: totalRecettes > 0 ? Math.round((Number(cat._sum.montant || 0) / totalRecettes) * 100) : 0
      };
    });

    // 6. Evolution mensuelle (simplifiée pour le moment)
    // Pour une vraie évolution, il faut agréger par mois via SQL brut ou post-traitement JS.
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const currentMonth = new Date().getMonth();
    const evolutionRecettes = [
        {
            mois: monthNames[currentMonth],
            recettes: totalRecettes,
            depenses: totalDepenses
        }
    ];

    const totalEleves = await prisma.eleve.count({ where: { estInscrit: true } });
    const totalClasses = await prisma.classe.count();

    const stats = {
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      encours: encoursTotal,
      previsionMois: 0,
      tauxRecouvrement: totalRecettes > 0 ? Math.round((totalRecettes / (totalRecettes + encoursTotal)) * 100) : 0,
      nombreEleves: totalEleves,
      nombreClasses: totalClasses,
      recettesMois: evolutionRecettes[evolutionRecettes.length - 1]?.recettes || 0,
      depensesMois: evolutionRecettes[evolutionRecettes.length - 1]?.depenses || 0,
      evolutionRecettes: 0,
      evolutionDepenses: 0,
      evolutionSolde: 0
    };

    return NextResponse.json({
      stats,
      derniersPaiements,
      impayes,
      categoriesRecettes,
      evolutionRecettes
    });

  } catch (error) {
    console.error("Erreur Dashboard Comptable:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
