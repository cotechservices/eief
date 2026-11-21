// app/api/admin/finances/parents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ⭐ Type pour les échéances avant répartition
interface EcheanceBrute {
  id: number;
  echeance: string;
  type: string;
  montant: number;
  montant_brut?: number;
  remise_appliquee?: number;
  statut: string;
  date_echeance: string | null;
  preinscription_id: number | null;
  reinscription_id: number | null;
  enfant_nom: string | null;
  source_type?: 'scolarite' | 'cantine' | 'transport' | 'fournitures';
}

// ⭐⭐⭐ FONCTION DE RÉPARTITION FIFO ⭐⭐⭐
type EcheanceRepartie = EcheanceBrute & {
  montant_paye: number;
  reste_a_payer: number;
  statut_calcule: 'paye' | 'partiel' | 'en_attente';
};

type CategoriePaiement = 'scolarite' | 'cantine' | 'transport' | 'fournitures';

// ⭐ Le type réel du paiement décide de la prestation concernée.
//   On ne doit jamais utiliser la date pour convertir un paiement de
//   scolarité en cantine ou en transport.
function categoriePaiement(typeFrais: string | null | undefined): CategoriePaiement {
  const v = String(typeFrais || '').toLowerCase();
  if (v.includes('cantine')) return 'cantine';
  if (v.includes('transport')) return 'transport';
  if (v.includes('fourniture') || v.includes('librairie')) return 'fournitures';
  return 'scolarite';
}

function cleDossier(preId: number | null, reinId: number | null): string {
  if (preId) return `pre:${preId}`;
  if (reinId) return `rein:${reinId}`;
  return 'divers';
}

// ⭐⭐⭐ RÉPARTITION PAR DOSSIER ENFANT + CATÉGORIE ⭐⭐⭐
// Un paiement est appliqué uniquement :
//   - au dossier de l'enfant auquel il est rattaché,
//   - à la catégorie issue de son type_frais.
// Les fournitures obligatoires restent donc liées à la scolarité du même
// élève, et un paiement de scolarité ne peut pas éteindre la cantine.
function repartirPaiementsParDossierEtCategorie(
  echeances: EcheanceBrute[],
  paiementsParDossierEtCategorie: Map<string, number>
): EcheanceRepartie[] {
  const groupes = new Map<string, EcheanceBrute[]>();

  for (const e of echeances) {
    const categorie: CategoriePaiement =
      e.source_type === 'cantine' || e.source_type === 'transport' || e.source_type === 'fournitures'
        ? e.source_type
        : categoriePaiement(e.type);
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
      let statutCalcule: 'paye' | 'partiel' | 'en_attente' = 'en_attente';

      if (reste >= montant && montant > 0) {
        montantPaye = montant;
        statutCalcule = 'paye';
        reste -= montant;
      } else if (reste > 0 && montant > 0) {
        montantPaye = reste;
        statutCalcule = 'partiel';
        reste = 0;
      }

      resultats.push({
        ...ech,
        montant_paye: montantPaye,
        reste_a_payer: montant - montantPaye,
        statut_calcule: statutCalcule,
      });
    }
  }

  return resultats.sort((a, b) => a.id - b.id);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "COMPTABLE" && role !== "DIRECTEUR_GENERAL") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    let sql = `
      SELECT 
        p.id as parent_id,
        u.id as utilisateur_id,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.adresse,
        u.photo_url,
        u.est_actif,
        p.profession,
        p.situation_matrimoniale
      FROM parents p
      JOIN utilisateurs u ON p.utilisateur_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search.trim()) {
      sql += ` AND (
        u.nom ILIKE $1 OR 
        u.prenom ILIKE $1 OR 
        u.email ILIKE $1 OR 
        u.telephone ILIKE $1 OR 
        EXISTS (
          SELECT 1 
          FROM lien_parent_eleve lpe 
          JOIN eleves e ON lpe.eleve_id = e.id 
          JOIN utilisateurs ue ON e.utilisateur_id = ue.id 
          WHERE lpe.parent_id = p.id AND (ue.nom ILIKE $1 OR ue.prenom ILIKE $1)
        )
      )`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY u.nom ASC, u.prenom ASC`;

    const parentsResult = await query(sql, params);

    if (parentsResult.rows.length === 0) {
      return NextResponse.json([]);
    }

    const parentsList = parentsResult.rows;

    const parentsFinances = await Promise.all(
      parentsList.map(async (parent) => {
        const parentId = parent.parent_id;

        // ========== 1. ENFANTS INSCRITS ==========
        const elevesResult = await query(`
          SELECT 
            e.id as eleve_id,
            e.matricule,
            u.nom,
            u.prenom,
            c.nom as classe_nom,
            c.niveau,
            c.id as classe_id,
            e.date_naissance,
            e.sexe
          FROM eleves e
          JOIN utilisateurs u ON e.utilisateur_id = u.id
          LEFT JOIN classes c ON e.classe_id = c.id
          JOIN lien_parent_eleve lpe ON e.id = lpe.eleve_id
          WHERE lpe.parent_id = $1 AND e.est_inscrit = true AND e.deleted_at IS NULL
        `, [parentId]);

        // ========== 2. PRÉ-INSCRIPTIONS ==========
        const preinsResult = await query(`
          SELECT 
            p.id as preinscription_id,
            p.numero_dossier,
            p.enfant_nom as nom,
            p.enfant_prenom as prenom,
            p.classe as classe_nom,
            p.niveau,
            p.statut,
            p.date_naissance,
            p.montant_total_plan
          FROM preinscriptions p
          WHERE p.parent_id = $1 
            AND p.statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);

        // ========== 3. REMISES ACCORDÉES ==========
        let remiseAccordee = 0;
        try {
          const remiseResult = await query(`
            SELECT COALESCE(SUM(montant), 0) as total_remise
            FROM remises_familles
            WHERE parent_id = $1
          `, [parentId]);
          remiseAccordee = Number(remiseResult.rows[0]?.total_remise) || 0;
        } catch (err) {
          console.warn("⚠️ Table remises_familles non trouvée, remise = 0");
        }

        // ========== 4. SCOLARITÉ : ACTUEL (déjà net) + BRUT RECONSTITUÉ ==========
        // ⚠️ On exclut 'fournitures' : gérées séparément (Section 12)
        let scolariteActuelle = 0;

        for (const pre of preinsResult.rows) {
          const planRes = await query(`
            SELECT COALESCE(SUM(COALESCE(ep.montant_initial, ep.montant)), 0) as total_scolarite
            FROM echeances_paiement ep
            WHERE ep.preinscription_id = $1
              AND ep.type IN ('inscription', 'scolarite', 'reinscription')
          `, [pre.preinscription_id]);
          const totalScolarite = Number(planRes.rows[0]?.total_scolarite) || 0;
          if (totalScolarite > 0) {
            scolariteActuelle += totalScolarite;
          } else {
            scolariteActuelle += Number(pre.montant_total_plan) || 0;
          }
        }

        // Réinscriptions
        const reinscriptionsPendingRes = await query(`
          SELECT r.id, r.montant_total_plan, r.montant_frais
          FROM reinscriptions r
          WHERE r.parent_id = $1 
            AND r.statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);
        for (const r of reinscriptionsPendingRes.rows) {
          scolariteActuelle += Number(r.montant_total_plan) || Number(r.montant_frais) || 0;
        }

        // ⭐ RECONSTITUTION DU BRUT
        const scolariteBrut = scolariteActuelle + remiseAccordee;

        // ========== 5. CANTINE ==========
        const cantineRes = await query(`
          SELECT COALESCE(SUM(pc.prix), 0) as total_cantine
          FROM preinscription_cantine pc
          JOIN preinscriptions p ON pc.preinscription_id = p.id
          WHERE p.parent_id = $1
            AND p.statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);
        const cantineBrut = Number(cantineRes.rows[0]?.total_cantine) || 0;

        // ========== 6. TRANSPORT ==========
        const transportRes = await query(`
          SELECT COALESCE(SUM(pt.prix), 0) as total_transport
          FROM preinscription_transport pt
          JOIN preinscriptions p ON pt.preinscription_id = p.id
          WHERE p.parent_id = $1
            AND p.statut IN ('valide', 'en_attente', 'partiel')
        `, [parentId]);
        const transportBrut = Number(transportRes.rows[0]?.total_transport) || 0;

        // ========== 7. FOURNITURES ==========
        const fournituresObligatoiresRes = await query(`
          SELECT COALESCE(SUM(cf.quantite * cf.prix_unitaire), 0) as total
          FROM commandes_fournitures cf
          JOIN preinscriptions p ON cf.preinscription_id = p.id
          WHERE p.parent_id = $1
        `, [parentId]);
        const fournituresObligatoiresBrut = Number(fournituresObligatoiresRes.rows[0]?.total) || 0;

        const librairieVentesRes = await query(`
          SELECT COALESCE(SUM(cl.total), 0) as total
          FROM commandes_librairie cl
          WHERE cl.parent_id = $1 AND cl.statut = 'valide'
        `, [parentId]);
        const librairieVentesBrut = Number(librairieVentesRes.rows[0]?.total) || 0;

        const fournituresBrut = fournituresObligatoiresBrut + librairieVentesBrut;

        // ========== 8. TOTAL PAYÉ ==========
        const paiementsResult = await query(`
          SELECT COALESCE(SUM(montant), 0) as total_paye
          FROM (
            SELECT DISTINCT ON (p.id) p.id, p.montant
            FROM paiements p
            WHERE p.statut IN ('valide', 'paye')
              AND (
                p.eleve_id IN (
                  SELECT eleve_id FROM lien_parent_eleve WHERE parent_id = $1
                )
                OR p.preinscription_id IN (
                  SELECT id FROM preinscriptions WHERE parent_id = $1
                )
                OR p.reinscription_id IN (
                  SELECT id FROM reinscriptions WHERE parent_id = $1
                )
              )
          ) paiements_uniques
        `, [parentId]);

        const totalPaye = Number(paiementsResult.rows[0]?.total_paye) || 0;

        // ⭐ PAIEMENTS RATTACHÉS À CHAQUE DOSSIER ENFANT ET À LEUR CATÉGORIE RÉELLE
        const paiementsDossierRes = await query(`
          SELECT
            preinscription_id,
            reinscription_id,
            type_frais,
            COALESCE(SUM(montant), 0) AS total
          FROM paiements
          WHERE statut IN ('valide', 'paye')
            AND (
              preinscription_id IN (SELECT id FROM preinscriptions WHERE parent_id = $1)
              OR reinscription_id IN (SELECT id FROM reinscriptions WHERE parent_id = $1)
            )
          GROUP BY preinscription_id, reinscription_id, type_frais
        `, [parentId]);

        const paiementsParDossierEtCategorie = new Map<string, number>();
        for (const p of paiementsDossierRes.rows) {
          const cle = `${cleDossier(p.preinscription_id, p.reinscription_id)}|${categoriePaiement(p.type_frais)}`;
          paiementsParDossierEtCategorie.set(
            cle,
            (paiementsParDossierEtCategorie.get(cle) || 0) + (Number(p.total) || 0)
          );
        }

        // ⭐ CALCUL FINAL
        const depensesBrutes = scolariteBrut + cantineBrut + transportBrut + fournituresObligatoiresBrut;
        const totalNet = Math.max(0, depensesBrutes - remiseAccordee);
        const soldeRestant = Math.max(0, totalNet - totalPaye);

        // ========== 9. ÉCHÉANCES SCOLAIRITÉ (ACTUELLES - déjà nettes) ==========
        // ⭐⭐⭐ CORRECTION 1 : exclusion explicite des 'fournitures' (gérées Section 12)
        // ⭐⭐⭐ CORRECTION 2 : suppression du DISTINCT ON erroné qui ne gardait qu'UNE
        //                     échéance par (préinscription, type) → perdait les versements
        //                     successifs (319, 320, 321 pour la même préinscription 48).
        //                     Le doublon venait de la double sélection Sections 9+12,
        //                     pas de la requête elle-même : chaque échéance est unique par id.
        const echeancesRes = await query(`
          SELECT
            ep.id,
            ep.echeance,
            ep.type,
            COALESCE(ep.montant_initial, ep.montant) AS montant,
            ep.statut,
            ep.date_echeance,
            ep.preinscription_id,
            ep.reinscription_id,
            COALESCE(p.enfant_prenom || ' ' || p.enfant_nom, r.enfant_prenom || ' ' || r.enfant_nom) as enfant_nom
          FROM echeances_paiement ep
          LEFT JOIN preinscriptions p ON ep.preinscription_id = p.id
          LEFT JOIN reinscriptions r ON ep.reinscription_id = r.id
          WHERE (
            ep.preinscription_id IN (
              SELECT id FROM preinscriptions WHERE parent_id = $1
            )
            OR ep.reinscription_id IN (
              SELECT id FROM reinscriptions WHERE parent_id = $1
            )
          )
          AND ep.type <> 'fournitures'
          ORDER BY ep.preinscription_id, ep.reinscription_id, ep.id ASC
        `, [parentId]);

        const echeancesScolarite: EcheanceBrute[] = echeancesRes.rows
          .map((e: any) => ({
            id: e.id,
            echeance: e.echeance,
            type: e.type,
            montant: Number(e.montant) || 0,
            statut: e.statut,
            date_echeance: e.date_echeance,
            preinscription_id: e.preinscription_id,
            reinscription_id: e.reinscription_id,
            enfant_nom: e.enfant_nom,
            source_type: 'scolarite' as const,
          }));

        // ========== 10. CANTINE ÉCHÉANCES ==========
        let echeancesCantine: EcheanceBrute[] = [];
        try {
          const cantineEchRes = await query(`
            SELECT 
              pc.id,
              pc.prix as montant,
              pc.created_at as date_creation,
              p.id as preinscription_id,
              p.enfant_prenom || ' ' || p.enfant_nom as enfant_nom
            FROM preinscription_cantine pc
            JOIN preinscriptions p ON pc.preinscription_id = p.id
            WHERE p.parent_id = $1
              AND p.statut IN ('valide', 'en_attente', 'partiel')
              AND pc.prix > 0
          `, [parentId]);

          echeancesCantine = cantineEchRes.rows.map((e: any) => ({
            id: -e.id,
            echeance: 'Frais de cantine',
            type: 'cantine',
            montant: Number(e.montant) || 0,
            statut: 'en_attente',
            date_echeance: e.date_creation,
            preinscription_id: e.preinscription_id,
            reinscription_id: null,
            enfant_nom: e.enfant_nom,
            source_type: 'cantine',
          }));
        } catch (err) {
          console.warn("⚠️ Erreur cantine:", err);
        }

        // ========== 11. TRANSPORT ÉCHÉANCES ==========
        let echeancesTransport: EcheanceBrute[] = [];
        try {
          const transportEchRes = await query(`
            SELECT 
              pt.id,
              pt.prix as montant,
              pt.created_at as date_creation,
              p.id as preinscription_id,
              p.enfant_prenom || ' ' || p.enfant_nom as enfant_nom
            FROM preinscription_transport pt
            JOIN preinscriptions p ON pt.preinscription_id = p.id
            WHERE p.parent_id = $1
              AND p.statut IN ('valide', 'en_attente', 'partiel')
              AND pt.prix > 0
          `, [parentId]);

          echeancesTransport = transportEchRes.rows.map((e: any) => ({
            id: -100000 - e.id,
            echeance: 'Frais de transport',
            type: 'transport',
            montant: Number(e.montant) || 0,
            statut: 'en_attente',
            date_echeance: e.date_creation,
            preinscription_id: e.preinscription_id,
            reinscription_id: null,
            enfant_nom: e.enfant_nom,
            source_type: 'transport',
          }));
        } catch (err) {
          console.warn("⚠️ Erreur transport:", err);
        }

        // ========== 12. FOURNITURES ÉCHÉANCES ==========
        // ⭐ Source UNIQUE des fournitures dans le breakdown.
        // Le DISTINCT ON ici est JUSTIFIÉ : plusieurs lignes 'fournitures' historiques
        // peuvent coexister (régénérations d'échéancier) → on garde la plus récente.
        let echeancesFournitures: EcheanceBrute[] = [];
        try {
          const fournEchRes = await query(`
            SELECT DISTINCT ON (ep.preinscription_id) 
              ep.id,
              ep.echeance,
              ep.type,
              COALESCE(ep.montant_initial, ep.montant) AS montant,
              ep.statut,
              ep.date_echeance,
              ep.preinscription_id,
              p.enfant_prenom || ' ' || p.enfant_nom as enfant_nom
            FROM echeances_paiement ep
            JOIN preinscriptions p ON ep.preinscription_id = p.id
            WHERE p.parent_id = $1
              AND ep.type = 'fournitures'
            ORDER BY ep.preinscription_id, ep.id DESC
          `, [parentId]);

          echeancesFournitures = fournEchRes.rows.map((e: any) => ({
            id: e.id,
            echeance: e.echeance || 'Fournitures scolaires',
            type: e.type,
            montant: Number(e.montant) || 0,
            statut: e.statut,
            date_echeance: e.date_echeance,
            preinscription_id: e.preinscription_id,
            reinscription_id: null,
            enfant_nom: e.enfant_nom,
            source_type: 'fournitures',
          }));
        } catch (err) {
          console.warn("⚠️ Erreur fournitures:", err);
        }

        // ========== 13. FUSION (avec déduplication de sécurité) ==========
        const toutesEcheancesMap = new Map<number, EcheanceBrute>();
        for (const e of [
          ...echeancesScolarite,
          ...echeancesCantine,
          ...echeancesTransport,
          ...echeancesFournitures,
        ]) {
          if (!toutesEcheancesMap.has(e.id)) {
            toutesEcheancesMap.set(e.id, e);
          } else {
            console.warn(
              `⚠️ [DÉDUPLICATION] Échéance id=${e.id} (${e.type}) ignorée (déjà présente)`
            );
          }
        }
        const toutesEcheances: EcheanceBrute[] = Array.from(toutesEcheancesMap.values());

        // ========== 14. RÉPARTITION DE LA REMISE ==========
        const remiseScolarite = remiseAccordee;

        const echeancesAvecRemise: EcheanceBrute[] = toutesEcheances.map((ech) => {
          if (ech.source_type === 'scolarite') {
            const totalScolariteNet = scolariteActuelle;
            const partEcheance = totalScolariteNet > 0 ? ech.montant / totalScolariteNet : 0;
            const remiseEcheance = remiseScolarite * partEcheance;

            return {
              ...ech,
              montant_brut: ech.montant + remiseEcheance,
              remise_appliquee: remiseEcheance,
              montant: ech.montant,
            };
          }
          return {
            ...ech,
            montant_brut: ech.montant,
            remise_appliquee: 0,
            montant: ech.montant,
          };
        });

        // ========== 15. DEBUG LOG ==========
        console.log(`[DEBUG FINANCES] Parent ${parent.prenom} ${parent.nom}:`, {
          scolariteActuelle,
          scolariteBrut,
          remiseAccordee,
          cantineBrut,
          transportBrut,
          fournituresBrut,
          depensesBrutes,
          totalNet,
          totalPaye,
          soldeRestant,
          nbEcheances: echeancesAvecRemise.length,
        });

        // ========== 16. RÉPARTITION PAR DOSSIER ENFANT + CATÉGORIE ==========
        // ⭐ Un paiement 'inscription' ne peut pas éteindre la cantine ou le transport.
        const echeancesReparties = repartirPaiementsParDossierEtCategorie(
          echeancesAvecRemise,
          paiementsParDossierEtCategorie
        );

        // ========== 17. BREAKDOWNS PAR SERVICE ==========
        const sumBy = (
          sourceType: string,
          field: 'montant' | 'montant_paye' | 'reste_a_payer' | 'montant_brut' | 'remise_appliquee'
        ) =>
          echeancesReparties
            .filter((e) => e.source_type === sourceType)
            .reduce((acc, e) => acc + Number((e as any)[field] || 0), 0);

        const services_breakdown = {
          scolarite: {
            brut: sumBy('scolarite', 'montant_brut'),
            remise: sumBy('scolarite', 'remise_appliquee'),
            total: sumBy('scolarite', 'montant'),
            paye: sumBy('scolarite', 'montant_paye'),
            reste: sumBy('scolarite', 'reste_a_payer'),
          },
          cantine: {
            brut: sumBy('cantine', 'montant_brut'),
            remise: sumBy('cantine', 'remise_appliquee'),
            total: sumBy('cantine', 'montant'),
            paye: sumBy('cantine', 'montant_paye'),
            reste: sumBy('cantine', 'reste_a_payer'),
          },
          transport: {
            brut: sumBy('transport', 'montant_brut'),
            remise: sumBy('transport', 'remise_appliquee'),
            total: sumBy('transport', 'montant'),
            paye: sumBy('transport', 'montant_paye'),
            reste: sumBy('transport', 'reste_a_payer'),
          },
          fournitures: {
            brut: sumBy('fournitures', 'montant_brut'),
            remise: sumBy('fournitures', 'remise_appliquee'),
            total: sumBy('fournitures', 'montant'),
            paye: sumBy('fournitures', 'montant_paye'),
            reste: sumBy('fournitures', 'reste_a_payer'),
          },
        };

        // ========== DEBUG LOG FOURNITURES ==========
        console.log(`[DEBUG FOURNITURES] Parent ${parent.prenom} ${parent.nom}:`, {
          fournituresObligatoiresBrut,
          fournituresBreakdown: services_breakdown.fournitures,
          echeancesFournituresCount: echeancesFournitures.length,
          echeancesFournitures: echeancesFournitures.map(e => ({ id: e.id, montant: e.montant, statut: e.statut })),
        });

        // ========== DEBUG LOG COHÉRENCE ==========
        const sommeBreakdowns =
          services_breakdown.scolarite.total +
          services_breakdown.cantine.total +
          services_breakdown.transport.total +
          services_breakdown.fournitures.total;
        const ecart = Math.abs(sommeBreakdowns - totalNet);
        if (ecart > 1) {
          console.warn(
            `⚠️ [COHÉRENCE] Parent ${parent.prenom} ${parent.nom} : ` +
            `somme breakdowns (${sommeBreakdowns}) ≠ totalNet (${totalNet}) — écart ${ecart}`
          );
        } else {
          console.log(
            `✅ [COHÉRENCE] Parent ${parent.prenom} ${parent.nom} : ` +
            `breakdowns (${sommeBreakdowns}) = totalNet (${totalNet})`
          );
        }

        // ========== 18. ÉCHÉANCES FINALES (toutes pour le modal) ==========
        const echeancesFinales = echeancesReparties
          .filter((e) => e.source_type === 'scolarite' || e.source_type === 'fournitures')
          .map((e) => ({
            id: e.id,
            echeance: e.echeance,
            type: e.type,
            montant: e.montant,
            montant_brut: e.montant_brut,
            remise_appliquee: e.remise_appliquee,
            statut: e.statut_calcule,
            statut_original: e.statut,
            date_echeance: e.date_echeance,
            preinscription_id: e.preinscription_id,
            reinscription_id: e.reinscription_id,
            enfant_nom: e.enfant_nom,
            montant_paye: e.montant_paye,
            reste_a_payer: e.reste_a_payer,
          }));

        return {
          parent_id: parent.parent_id,
          nom: parent.nom,
          prenom: parent.prenom,
          email: parent.email,
          telephone: parent.telephone,
          adresse: parent.adresse,
          profession: parent.profession,
          photo_url: parent.photo_url,
          est_actif: parent.est_actif,
          situation_matrimoniale: parent.situation_matrimoniale,
          enfants_inscrits: elevesResult.rows || [],
          preinscriptions: preinsResult.rows || [],
          totaux: {
            depenses_brutes: depensesBrutes,
            remise_accordee: remiseAccordee,
            total_net: totalNet,
            total_paye: totalPaye,
            solde_restant: soldeRestant,
          },
          services_breakdown,
          echeances: echeancesFinales,
        };
      })
    );

    return NextResponse.json(parentsFinances);
  } catch (error: any) {
    console.error("Erreur API Admin Finances Parents:", error);
    return NextResponse.json(
      { error: "Erreur serveur: " + error.message },
      { status: 500 }
    );
  }
}