import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const q = async (sql, params = []) => (await pool.query(sql, params)).rows;

console.log('=== PREINSCRIPTIONS : AUDIT ===');
const pre = await q(`
  SELECT
    p.id,
    p.statut,
    p.classe,
    p.niveau,
    p.frais_montant,
    p.montant_total_plan,
    p.montant_restant_plan,
    p.frais_statut,
    c.id AS classe_id,
    COALESCE(c.total_versement,0) AS scolarite_classe,
    COALESCE(c.premier_versement,0)+COALESCE(c.deuxieme_versement,0)+COALESCE(c.troisieme_versement,0) AS somme_versements_classe,
    COALESCE((SELECT SUM(montant) FROM echeances_paiement e WHERE e.preinscription_id=p.id AND e.type='inscription'),0) AS ech_inscription,
    COALESCE((SELECT SUM(montant) FROM echeances_paiement e WHERE e.preinscription_id=p.id AND e.type='fournitures'),0) AS ech_fournitures,
    COALESCE((SELECT SUM(quantite*prix_unitaire) FROM commandes_fournitures cf WHERE cf.preinscription_id=p.id),0) AS cmd_fournitures,
    COALESCE((SELECT SUM(prix) FROM preinscription_cantine pc WHERE pc.preinscription_id=p.id),0) AS cantine,
    COALESCE((SELECT SUM(prix) FROM preinscription_transport pt WHERE pt.preinscription_id=p.id),0) AS transport,
    COALESCE((SELECT SUM(montant) FROM paiements pa WHERE pa.preinscription_id=p.id AND pa.statut='valide'),0) AS paye
  FROM preinscriptions p
  LEFT JOIN classes c ON LOWER(c.nom)=LOWER(p.classe)
  ORDER BY p.id
`);
console.log('total preinscriptions:', pre.length);

const flags = { totalPlanMismatch: 0, echInscriptionMismatch: 0, restantMismatch: 0, overpaid: 0, noClass: 0, fournituresMismatch: 0 };
let sumEcartsTotaux = 0;
const details = [];
for (const r of pre) {
  const scolarite = Number(r.scolarite_classe) || 0;
  const sommeVers = Number(r.somme_versements_classe) || 0;
  const baseScolarite = scolarite || sommeVers;
  const totalPlan = Number(r.montant_total_plan) || 0;
  const restant = Number(r.montant_restant_plan) || 0;
  const echIns = Number(r.ech_inscription) || 0;
  const echFour = Number(r.ech_fournitures) || 0;
  const cmdFour = Number(r.cmd_fournitures) || 0;
  const paye = Number(r.paye) || 0;
  const attenduRestant = Math.max(0, baseScolarite - paye);
  const expectedTotal = baseScolarite + (cmdFour || echFour) + Number(r.cantine) + Number(r.transport);

  const f = [];
  if (!r.classe_id) { f.push('NO_CLASSE'); flags.noClass++; }
  if (baseScolarite > 0 && totalPlan !== baseScolarite) { f.push(`TOTAL_PLAN(${totalPlan}!=${baseScolarite})`); flags.totalPlanMismatch++; }
  if (baseScolarite > 0 && echIns !== baseScolarite) { f.push(`ECH_INS(${echIns}!=${baseScolarite})`); flags.echInscriptionMismatch++; }
  if (baseScolarite > 0 && restant !== attenduRestant) { f.push(`RESTANT(${restant}!=${attenduRestant})`); flags.restantMismatch++; }
  if (paye > expectedTotal) { f.push(`SURPAYE(${paye}>${expectedTotal})`); flags.overpaid++; }
  if ((cmdFour || echFour) > 0 && echFour !== cmdFour) { f.push(`FOURN(${echFour}!=${cmdFour})`); flags.fournituresMismatch++; }

  if (f.length) {
    sumEcartsTotaux += Math.abs(totalPlan - baseScolarite);
    details.push({ id: r.id, statut: r.statut, classe: r.classe, totalPlan, baseScolarite, echIns, attenduRestant, restant, paye, cmdFour, echFour, flags: f });
  }
}
console.log('anomalies:', details.length, JSON.stringify(flags, null, 2));
console.log('somme |ecarts total_plan|:', sumEcartsTotaux);
console.log('--- 30 premiers cas ---');
console.log(JSON.stringify(details.slice(0, 30), null, 2));

console.log('\n=== REINSCRIPTIONS : AUDIT ===');
const rein = await q(`
  SELECT
    r.id, r.statut, r.classe_nom, r.eleve_id, r.montant_frais, r.montant_total_plan, r.montant_restant_plan,
    c.id AS classe_id,
    COALESCE(c.reinscription_total_versement, c.total_versement, 0) AS scolarite_classe,
    COALESCE((SELECT SUM(montant) FROM echeances_paiement e WHERE e.reinscription_id=r.id AND e.type='reinscription'),0) AS ech_reinscription,
    COALESCE((SELECT SUM(montant) FROM echeances_paiement e WHERE e.reinscription_id=r.id AND e.type='fournitures'),0) AS ech_fournitures,
    COALESCE((SELECT SUM(montant) FROM paiements pa WHERE pa.reinscription_id=r.id AND pa.statut='valide'),0) AS paye
  FROM reinscriptions r
  LEFT JOIN classes c ON c.nom = r.classe_nom
  ORDER BY r.id
`);
console.log('total reinscriptions:', rein.length);
let reinAno = 0;
const reinDetails = [];
for (const r of rein) {
  const scolarite = Number(r.scolarite_classe) || Number(r.montant_frais) || 0;
  const totalPlan = Number(r.montant_total_plan) || 0;
  const restant = Number(r.montant_restant_plan) || 0;
  const paye = Number(r.paye) || 0;
  const attenduRestant = Math.max(0, scolarite - paye);
  const f = [];
  if (scolarite > 0 && totalPlan !== scolarite) f.push(`TOTAL_PLAN(${totalPlan}!=${scolarite})`);
  if (scolarite > 0 && Number(r.ech_reinscription) !== scolarite) f.push(`ECH(${r.ech_reinscription}!=${scolarite})`);
  if (scolarite > 0 && restant !== attenduRestant) f.push(`RESTANT(${restant}!=${attenduRestant})`);
  if (f.length) { reinAno++; reinDetails.push({ id: r.id, statut: r.statut, classe: r.classe_nom, totalPlan, scolarite, restant, attenduRestant, paye, flags: f }); }
}
console.log('anomalies reinscriptions:', reinAno);
console.log(JSON.stringify(reinDetails.slice(0, 20), null, 2));

console.log('\n=== ECHEANCES : STATUTS / TOTAUX ===');
const echStats = await q(`
  SELECT type, statut, COUNT(*)::int AS nb, COALESCE(SUM(montant),0)::bigint AS somme
  FROM echeances_paiement GROUP BY type, statut ORDER BY type, statut
`);
console.log(JSON.stringify(echStats, null, 2));

console.log('\n=== PAIEMENTS ===');
console.log(JSON.stringify(await q(`
  SELECT COUNT(*)::int AS nb, COALESCE(SUM(montant),0)::bigint AS total,
         COUNT(*) FILTER (WHERE preinscription_id IS NOT NULL)::int AS via_preinscription,
         COUNT(*) FILTER (WHERE reinscription_id IS NOT NULL)::int AS via_reinscription,
         COUNT(*) FILTER (WHERE eleve_id IS NOT NULL)::int AS via_eleve
  FROM paiements WHERE statut='valide'
`), null, 2));

await pool.end();
