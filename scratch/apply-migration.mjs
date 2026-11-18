import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const sql = fs.readFileSync('prisma/migrations/20261118120000_montant_initial_echeances/migration.sql', 'utf8');

try {
  await pool.query(sql);
  console.log('✅ Migration appliquée');
} catch (e) {
  console.error('❌ Migration échouée:', e.message);
  process.exitCode = 1;
}

const show = async (label, sql, params = []) => {
  const r = await pool.query(sql, params);
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(r.rows, null, 2));
};

await show('preinscription 50', `
  SELECT id, enfant_prenom, enfant_nom, classe, statut,
         frais_montant, montant_total_plan, montant_restant_plan, frais_statut
  FROM preinscriptions WHERE id = 50`);

await show('échéances 50', `
  SELECT id, type, echeance, montant AS reste, montant_initial, statut
  FROM echeances_paiement WHERE preinscription_id = 50 ORDER BY id`);

await show('contrôle des totaux', `
  SELECT
    (SELECT COALESCE(SUM(COALESCE(montant_initial, montant)),0) FROM echeances_paiement WHERE preinscription_id = 50) AS total_initial,
    (SELECT COALESCE(SUM(montant),0) FROM echeances_paiement WHERE preinscription_id = 50 AND statut IN ('en_attente','partiel')) AS reste,
    (SELECT COALESCE(SUM(montant),0) FROM paiements WHERE preinscription_id = 50 AND statut='valide') AS paye,
    (SELECT COALESCE(SUM(quantite*prix_unitaire),0) FROM commandes_fournitures WHERE preinscription_id = 50) AS fournitures`);

await pool.end();
