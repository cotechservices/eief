// lib/db.js (version améliorée)
import { Pool } from 'pg';

let globalPool;

function getPool() {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum de connexions dans le pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return globalPool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export async function transaction(queries) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const results = [];
    for (const { text, params } of queries) {
      const res = await client.query(text, params);
      results.push(res);
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

console.log("DB URL:", process.env.DATABASE_URL);