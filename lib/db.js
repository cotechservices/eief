// lib/db.js
import { Pool } from 'pg';

let globalPool;

function getPool() {
  if (!globalPool) {
    console.log('Creating new database pool...');
    
    // Utiliser DIRECT_URL en développement, DATABASE_URL en production
    const connectionString = process.env.NODE_ENV === 'production' 
      ? process.env.DATABASE_URL 
      : (process.env.DIRECT_URL || process.env.DATABASE_URL);
    
    globalPool = new Pool({
      connectionString: connectionString,
      max: 10, // Réduit pour le développement
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Augmenté à 10 secondes
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false, // Désactiver SSL en développement
      // Ajouter ces options pour plus de stabilité
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    });
    
    // Gérer les erreurs du pool
    globalPool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
    
    globalPool.on('connect', () => {
      console.log('New client connected to database');
    });
  }
  return globalPool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  
  try {
    console.log('Executing query:', text.substring(0, 100));
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed successfully', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error after', duration, 'ms:', error.message);
    console.error('Failed query:', text);
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
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Fonction pour tester la connexion
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

console.log("DB Environment:", process.env.NODE_ENV);
console.log("DB URL configured:", process.env.DATABASE_URL ? "Yes" : "No");
console.log("DIRECT URL configured:", process.env.DIRECT_URL ? "Yes" : "No");