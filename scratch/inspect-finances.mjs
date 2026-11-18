import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function q(label, sql, params = []) {
  try {
    const r = await pool.query(sql, params);
    console.log(`\n===== ${label} (${r.rowCount}) =====`);
    console.log(JSON.stringify(r.rows, null, 2));
    return r.rows;
  } catch (e) {
    console.log(`\n===== ${label} ERREUR =====\n${e.message}`);
    return [];
  }
}

const parents = await q(
  "parent",
  `SELECT p.id, u.nom, u.prenom, u.email FROM parents p JOIN utilisateurs u ON u.id = p.utilisateur_id WHERE u.email = $1 OR u.nom ILIKE '%camara%'`,
  ['mohamedkc237@gmail.com']
);

const parentId = parents[0]?.id;

await q(
  "preinscriptions du parent",
  `SELECT id, parent_id, enfant_nom, enfant_prenom, classe, niveau, statut, numero_dossier,
          frais_montant, frais_statut, montant_total_plan, montant_restant_plan,
          type_inscription, est_reinscription, plan_paiement_id
   FROM preinscriptions WHERE parent_id = $1 ORDER BY id`,
  [parentId]
);

const pres = await q(
  "toutes preinscriptions Fanta",
  `SELECT * FROM preinscriptions WHERE enfant_nom ILIKE '%camara%' ORDER BY id`
);

const preIds = [...new Set(pres.map((p) => p.id))];

if (preIds.length) {
  await q(
    "inscriptions liees",
    `SELECT * FROM inscriptions WHERE preinscription_id = ANY($1::int[]) ORDER BY id`,
    [preIds]
  );
  await q(
    "paiements lies",
    `SELECT id, eleve_id, preinscription_id, reinscription_id, montant, type_frais, mois, annee, statut, date_paiement
     FROM paiements WHERE preinscription_id = ANY($1::int[]) OR eleve_id IN (SELECT eleve_id FROM inscriptions WHERE preinscription_id = ANY($1::int[]))
     ORDER BY id`,
    [preIds]
  );
  await q(
    "echeances liees",
    `SELECT id, preinscription_id, type, echeance, montant, statut, date_echeance, date_paiement
     FROM echeances_paiement WHERE preinscription_id = ANY($1::int[]) ORDER BY preinscription_id, id`,
    [preIds]
  );
  await q(
    "fournitures liees",
    `SELECT cf.*, a.nom AS article_nom FROM commandes_fournitures cf
     LEFT JOIN articles_librairie a ON a.id = cf.article_id
     WHERE cf.preinscription_id = ANY($1::int[]) ORDER BY cf.id`,
    [preIds]
  );
  await q(
    "cantine liees",
    `SELECT * FROM preinscription_cantine WHERE preinscription_id = ANY($1::int[]) ORDER BY id`,
    [preIds]
  );
  await q(
    "transport liees",
    `SELECT * FROM preinscription_transport WHERE preinscription_id = ANY($1::int[]) ORDER BY id`,
    [preIds]
  );
}

await q("classe MS-A", `SELECT * FROM classes WHERE nom ILIKE '%MS-A%' OR nom ILIKE '%MS A%'`);
await q("frais_scolaires", `SELECT * FROM frais_scolaires ORDER BY id`);
await q(
  "remises du parent",
  `SELECT * FROM remises_familles WHERE parent_id = $1`,
  [parentId]
);

await pool.end();
