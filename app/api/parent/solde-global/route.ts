// app/api/parent/solde-global/route.ts
// Ventilation du solde global : chaque paiement reste rattaché à l'élève
// auquel il appartient. Les fournitures obligatoires sont donc liées à la
// scolarité du même dossier, jamais redistribuées sur un frère/sœur.

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface EcheanceBrute {
  id: number;
  montant: number;
  date_echeance: string | null;
  preinscription_id: number | null;
  reinscription_id: number | null;
  source_type: "scolarite" | "cantine" | "transport" | "fournitures";
  montant_brut?: number;
  remise_appliquee?: number;
}

type EcheanceRepartie = EcheanceBrute & {
  montant_paye: number;
  reste_a_payer: number;
};

type CategoriePaiement = "scolarite" | "cantine" | "transport" | "fournitures";

function categoriePaiement(typeFrais: string | null | undefined): CategoriePaiement {
  const v = String(typeFrais || "").toLowerCase();
  if (v.includes("cantine")) return "cantine";
  if (v.includes("transport")) return "transport";
  if (v.includes("fourniture") || v.includes("librairie")) return "fournitures";
  return "scolarite";
}

function cleDossier(preId: number | null, reinId: number | null): string {
  if (preId) return `pre:${preId}`;
  if (reinId) return `rein:${reinId}`;
  return "divers";
}

// Chaque paiement reste rattaché à son dossier ET à son type réel.
// Un paiement de scolarité ne peut donc pas être compté comme cantine/transport.
function repartirParDossierEtCategorie(
  echeances: EcheanceBrute[],
  paiementsParDossierEtCategorie: Map<string, number>
): EcheanceRepartie[] {
  const groupes = new Map<string, EcheanceBrute[]>();

  for (const e of echeances) {
    const categorie: CategoriePaiement =
      e.source_type === "cantine" ||
      e.source_type === "transport" ||
      e.source_type === "fournitures"
        ? e.source_type
        : categoriePaiement("scolarite");
    const cle = `${cleDossier(e.preinscription_id, e.reinscription_id)}|${categorie}`;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(e);
  }

  const resultats: EcheanceRepartie[] = [];

  for (const [cle, liste] of groupes.entries()) {
    let reste = paiementsParDossierEtCategorie.get(cle) || 0;

    const triees = [...liste].sort((a, b) => {
      const da = a.date_echeance ? new Date(a.date_echeance).getTime() : Infinity;
      const db = b.date_echeance ? new Date(b.date_echeance).getTime() : Infinity;
      if (da !== db) return da - db;
      return a.id - b.id;
    });

    for (const ech of triees) {
      const montant = Number(ech.montant) || 0;
      let montantPaye = 0;

      if (reste >= montant && montant > 0) {
        montantPaye = montant;
        reste -= montant;
      } else if (reste > 0 && montant > 0) {
        montantPaye = reste;
        reste = 0;
      }

      resultats.push({
        ...ech,
        montant_paye: montantPaye,
        reste_a_payer: montant - montantPaye,
      });
    }
  }

  return resultats.sort((a, b) => a.id - b.id);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const parentResult = await query(
      `SELECT id FROM parents WHERE utilisateur_id = (
         SELECT id FROM utilisateurs WHERE email = $1
       )`,
      [session.user?.email]
    );
    const parentId = parentResult.rows[0]?.id;
    if (!parentId) {
      return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
    }

    let remiseAccordee = 0;
    try {
      const remiseResult = await query(
        `SELECT COALESCE(SUM(montant), 0) AS total_remise
         FROM remises_familles
         WHERE parent_id = $1`,
        [parentId]
      );
      remiseAccordee = Number(remiseResult.rows[0]?.total_remise) || 0;
    } catch {
      // Table éventuellement absente : on continue sans remise.
    }

    let scolariteActuelle = 0;
    const preinscriptions = await query(
      `SELECT id, montant_total_plan
       FROM preinscriptions
       WHERE parent_id = $1
         AND statut IN ('valide', 'en_attente', 'partiel')`,
      [parentId]
    );
    for (const pre of preinscriptions.rows) {
      const planRes = await query(
        `SELECT COALESCE(SUM(COALESCE(montant_initial, montant)), 0) AS total_scolarite
         FROM echeances_paiement
         WHERE preinscription_id = $1
           AND type IN ('inscription', 'scolarite', 'reinscription')`,
        [pre.id]
      );
      const totalScolarite = Number(planRes.rows[0]?.total_scolarite) || 0;
      scolariteActuelle += totalScolarite > 0 ? totalScolarite : Number(pre.montant_total_plan) || 0;
    }

    const reinscriptionsRes = await query(
      `SELECT montant_total_plan, montant_frais
       FROM reinscriptions
       WHERE parent_id = $1
         AND statut IN ('valide', 'en_attente', 'partiel')`,
      [parentId]
    );
    for (const r of reinscriptionsRes.rows) {
      scolariteActuelle += Number(r.montant_total_plan) || Number(r.montant_frais) || 0;
    }

    const scolariteBrut = scolariteActuelle + remiseAccordee;

    const cantineRes = await query(
      `SELECT COALESCE(SUM(pc.prix), 0) AS total
       FROM preinscription_cantine pc
       JOIN preinscriptions p ON pc.preinscription_id = p.id
       WHERE p.parent_id = $1
         AND p.statut IN ('valide', 'en_attente', 'partiel')`,
      [parentId]
    );
    const cantineBrut = Number(cantineRes.rows[0]?.total) || 0;

    const transportRes = await query(
      `SELECT COALESCE(SUM(pt.prix), 0) AS total
       FROM preinscription_transport pt
       JOIN preinscriptions p ON pt.preinscription_id = p.id
       WHERE p.parent_id = $1
         AND p.statut IN ('valide', 'en_attente', 'partiel')`,
      [parentId]
    );
    const transportBrut = Number(transportRes.rows[0]?.total) || 0;

    const fournituresRes = await query(
      `SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) AS total
       FROM commandes_fournitures cf
       JOIN preinscriptions p ON cf.preinscription_id = p.id
       WHERE p.parent_id = $1`,
      [parentId]
    );
    const fournituresBrut = Number(fournituresRes.rows[0]?.total) || 0;

    const paiementsRes = await query(
      `SELECT COALESCE(SUM(montant), 0) AS total_paye
       FROM (
         SELECT DISTINCT ON (p.id) p.id, p.montant
         FROM paiements p
         WHERE p.statut IN ('valide', 'paye')
           AND (
             p.eleve_id IN (SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1)
             OR p.preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
             OR p.reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
           )
       ) paiements_uniques`,
      [parentId]
    );
    const totalPaye = Number(paiementsRes.rows[0]?.total_paye) || 0;

    const depensesBrutes = scolariteBrut + cantineBrut + transportBrut + fournituresBrut;
    const totalNet = Math.max(0, depensesBrutes - remiseAccordee);
    const total = Math.max(0, totalNet - totalPaye);

    // Paiements par dossier ET par type réel (cantine, transport, fournitures, scolarité).
    const paiementsDossierRes = await query(
      `SELECT preinscription_id, reinscription_id, type_frais, COALESCE(SUM(montant), 0) AS total
       FROM paiements
       WHERE statut IN ('valide', 'paye')
         AND (
           preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
           OR reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
         )
       GROUP BY preinscription_id, reinscription_id, type_frais`,
      [parentId]
    );
    const paiementsParDossierEtCategorie = new Map<string, number>();
    for (const p of paiementsDossierRes.rows) {
      const cle = `${cleDossier(p.preinscription_id, p.reinscription_id)}|${categoriePaiement(p.type_frais)}`;
      paiementsParDossierEtCategorie.set(
        cle,
        (paiementsParDossierEtCategorie.get(cle) || 0) + (Number(p.total) || 0)
      );
    }

    // Échéances par service, avec rattachement au dossier de l'enfant.
    const echeancesScolariteRes = await query(
      `SELECT
         ep.id,
         COALESCE(ep.montant_initial, ep.montant) AS montant,
         ep.date_echeance,
         ep.preinscription_id,
         ep.reinscription_id
       FROM echeances_paiement ep
       WHERE (
         ep.preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
         OR ep.reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
       )
         AND ep.type <> 'fournitures'
       ORDER BY ep.id ASC`,
      [parentId]
    );
    const echeancesScolarite: EcheanceBrute[] = echeancesScolariteRes.rows.map((e: any) => ({
      id: Number(e.id),
      montant: Number(e.montant) || 0,
      date_echeance: e.date_echeance,
      preinscription_id: e.preinscription_id ? Number(e.preinscription_id) : null,
      reinscription_id: e.reinscription_id ? Number(e.reinscription_id) : null,
      source_type: "scolarite",
    }));

    const cantineEchRes = await query(
      `SELECT pc.id, pc.prix AS montant, pc.created_at AS date_echeance, pc.preinscription_id
       FROM preinscription_cantine pc
       JOIN preinscriptions p ON pc.preinscription_id = p.id
       WHERE p.parent_id = $1
         AND p.statut IN ('valide', 'en_attente', 'partiel')
         AND pc.prix > 0`,
      [parentId]
    );
    const echeancesCantine: EcheanceBrute[] = cantineEchRes.rows.map((e: any) => ({
      id: -Number(e.id),
      montant: Number(e.montant) || 0,
      date_echeance: e.date_echeance,
      preinscription_id: Number(e.preinscription_id),
      reinscription_id: null,
      source_type: "cantine",
    }));

    const transportEchRes = await query(
      `SELECT pt.id, pt.prix AS montant, pt.created_at AS date_echeance, pt.preinscription_id
       FROM preinscription_transport pt
       JOIN preinscriptions p ON pt.preinscription_id = p.id
       WHERE p.parent_id = $1
         AND p.statut IN ('valide', 'en_attente', 'partiel')
         AND pt.prix > 0`,
      [parentId]
    );
    const echeancesTransport: EcheanceBrute[] = transportEchRes.rows.map((e: any) => ({
      id: -100000 - Number(e.id),
      montant: Number(e.montant) || 0,
      date_echeance: e.date_echeance,
      preinscription_id: Number(e.preinscription_id),
      reinscription_id: null,
      source_type: "transport",
    }));

    const fournituresEchRes = await query(
      `SELECT DISTINCT ON (ep.preinscription_id)
         ep.id,
         COALESCE(ep.montant_initial, ep.montant) AS montant,
         ep.date_echeance,
         ep.preinscription_id
       FROM echeances_paiement ep
       JOIN preinscriptions p ON ep.preinscription_id = p.id
       WHERE p.parent_id = $1
         AND ep.type = 'fournitures'
       ORDER BY ep.preinscription_id, ep.id DESC`,
      [parentId]
    );
    const echeancesFournitures: EcheanceBrute[] = fournituresEchRes.rows.map((e: any) => ({
      id: Number(e.id),
      montant: Number(e.montant) || 0,
      date_echeance: e.date_echeance,
      preinscription_id: Number(e.preinscription_id),
      reinscription_id: null,
      source_type: "fournitures",
    }));

    const toutesEcheancesMap = new Map<number, EcheanceBrute>();
    for (const e of [
      ...echeancesScolarite,
      ...echeancesCantine,
      ...echeancesTransport,
      ...echeancesFournitures,
    ]) {
      if (!toutesEcheancesMap.has(e.id)) toutesEcheancesMap.set(e.id, e);
    }

    const echeancesAvecRemise: EcheanceBrute[] = Array.from(toutesEcheancesMap.values()).map((ech) => {
      if (ech.source_type !== "scolarite") {
        return { ...ech, montant_brut: ech.montant, remise_appliquee: 0 };
      }
      const part = scolariteActuelle > 0 ? ech.montant / scolariteActuelle : 0;
      const remiseEcheance = remiseAccordee * part;
      return {
        ...ech,
        montant_brut: ech.montant + remiseEcheance,
        remise_appliquee: remiseEcheance,
      };
    });

    const echeancesReparties = repartirParDossierEtCategorie(
      echeancesAvecRemise,
      paiementsParDossierEtCategorie
    );

    const sumBy = (sourceType: EcheanceBrute["source_type"]) =>
      echeancesReparties
        .filter((e) => e.source_type === sourceType)
        .reduce((acc, e) => acc + Number(e.reste_a_payer || 0), 0);

    return NextResponse.json({
      total,
      details: {
        inscription: sumBy("scolarite"),
        transport: sumBy("transport"),
        cantine: sumBy("cantine"),
        fournitures: sumBy("fournitures"),
      },
    });
  } catch (error) {
    console.error("Erreur solde global parent:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + (error as Error).message },
      { status: 500 }
    );
  }
}
