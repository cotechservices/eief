import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const q = async (sql, params = []) => (await pool.query(sql, params)).rows;

const PRE = 50;
const PARENT = 5;

const detail = (await q(`
  SELECT
    COALESCE(SUM(COALESCE(montant_initial, montant)), 0)::int AS total_initial,
    COALESCE(SUM(montant), 0)::int AS reste,
    COALESCE(SUM(CASE WHEN type = 'inscription' THEN COALESCE(montant_initial, montant) ELSE 0 END), 0)::int AS scolarite,
    COALESCE(SUM(CASE WHEN type = 'fournitures' THEN COALESCE(montant_initial, montant) ELSE 0 END), 0)::int AS fournitures
  FROM echeances_paiement WHERE preinscription_id = $1
`, [PRE]))[0];

const paye = (await q(`
  SELECT COALESCE(SUM(montant), 0)::int AS total
  FROM paiements WHERE preinscription_id = $1 AND statut IN ('valide', 'paye')
`, [PRE]))[0].total;

const remise = (await q(`
  SELECT COALESCE(SUM(montant), 0)::int AS total FROM remises_familles WHERE parent_id = $1
`, [PARENT]))[0].total;

// Panier de l'API parent /enfants (scolarité = échéances inscription + fournitures + cantine + transport)
const scolariteParent = (await q(`
  SELECT COALESCE(SUM(COALESCE(ep.montant_initial, ep.montant)), 0)::int AS total
  FROM echeances_paiement ep
  WHERE ep.preinscription_id = $1 AND ep.type = 'inscription'
`, [PRE]))[0].total;

const fournituresParent = (await q(`
  SELECT COALESCE(SUM(COALESCE(ep.montant_initial, ep.montant)), 0)::int AS total
  FROM echeances_paiement ep
  WHERE ep.preinscription_id = $1 AND ep.type = 'fournitures'
`, [PRE]))[0].total;

const totalBrut = scolariteParent + fournituresParent;
const totalNet = Math.max(0, totalBrut - remise);

console.log('Dossier pré-inscription', PRE, '— Fanta Camara');
console.log('  Scolarité (montant initial) :', detail.scolarite.toLocaleString('fr-FR'), 'GNF');
console.log('  Fournitures                  :', detail.fournitures.toLocaleString('fr-FR'), 'GNF');
console.log('  TOTAL                        :', detail.total_initial.toLocaleString('fr-FR'), 'GNF');
console.log('  PAYÉ                         :', paye.toLocaleString('fr-FR'), 'GNF');
console.log('  RESTE (échéances)            :', detail.reste.toLocaleString('fr-FR'), 'GNF');
console.log('');
console.log('Calculs de l’application');
console.log('  Parent  — brut  :', totalBrut.toLocaleString('fr-FR'), 'GNF');
console.log('  Parent  — remise:', remise.toLocaleString('fr-FR'), 'GNF');
console.log('  Parent  — net   :', totalNet.toLocaleString('fr-FR'), 'GNF');
console.log('  Parent  — payé  :', paye.toLocaleString('fr-FR'), 'GNF');
console.log('  Parent  — solde :', Math.max(0, totalNet - paye).toLocaleString('fr-FR'), 'GNF');
console.log('');
console.log('Fiche admin pré-inscription (répartition par type)');
console.log('  inscription :', detail.scolarite.toLocaleString('fr-FR'));
console.log('  fournitures :', detail.fournitures.toLocaleString('fr-FR'));
console.log('  autres      :', (detail.total_initial - detail.scolarite - detail.fournitures).toLocaleString('fr-FR'));

const ok =
  totalBrut === 6_560_000 &&
  paye === 2_560_000 &&
  totalNet - paye === 4_000_000 &&
  detail.total_initial === 6_560_000 &&
  detail.reste === 4_000_000;

console.log('');
console.log(ok ? '✅ COHÉRENT : 6 560 000 / 2 560 000 / 4 000 000' : '❌ INCOHÉRENCE DÉTECTÉE');

await pool.end();
process.exitCode = ok ? 0 : 1;
