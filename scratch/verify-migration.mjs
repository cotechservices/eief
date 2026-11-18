import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const client = await pool.connect();

try {
  // 1. Vérifier la rejouabilité de la migration
  const sql = fs.readFileSync('prisma/migrations/20261118120000_montant_initial_echeances/migration.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migration rejouable (idempotente)');

  // 2. Vérifier le trigger sur une insertion puis annuler
  await client.query('BEGIN');
  const ins = await client.query(`
    INSERT INTO echeances_paiement (preinscription_id, type, echeance, montant, date_echeance, statut)
    VALUES (50, 'test', 'test_trigger', 123456, CURRENT_DATE, 'en_attente')
    RETURNING id, montant, montant_initial
  `);
  console.log('Insertion test :', ins.rows[0]);
  if (Number(ins.rows[0].montant_initial) !== 123456) {
    throw new Error('Le trigger n’a pas mémorisé le montant initial');
  }
  console.log('✅ Trigger montant_initial opérationnel');
  await client.query('ROLLBACK');

  // 3. Contrôle final du dossier 50
  const res = await client.query(`
    SELECT
      p.id,
      p.montant_total_plan,
      p.montant_restant_plan,
      p.frais_statut,
      (SELECT COALESCE(SUM(COALESCE(montant_initial, montant)), 0) FROM echeances_paiement WHERE preinscription_id = p.id) AS total_initial,
      (SELECT COALESCE(SUM(montant), 0) FROM echeances_paiement WHERE preinscription_id = p.id AND statut IN ('en_attente','partiel')) AS reste,
      (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE preinscription_id = p.id AND statut = 'valide') AS paye
    FROM preinscriptions p WHERE p.id = 50
  `);
  console.log('\nDossier 50 :', res.rows[0]);
} catch (e) {
  console.error('❌', e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
