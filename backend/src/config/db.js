'use strict';

const { Pool } = require('pg');

// ─── Connection Pool ──────────────────────────────────────────────────────────
// Uses DATABASE_URL from .env — never hardcode credentials here.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // In production, enable SSL:
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors to avoid silent failures
pool.on('error', (err) => {
  console.error('💥 Unexpected PostgreSQL pool error:', err.message);
});

// ─── Query Helper ─────────────────────────────────────────────────────────────
/**
 * Execute a parameterized SQL query.
 * @param {string} text   - SQL statement
 * @param {Array}  params - Parameterized values (prevents SQL injection)
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

// ─── Transaction Helper ───────────────────────────────────────────────────────
/**
 * Run multiple queries inside a single transaction.
 * Automatically rolls back on any error.
 * @param {function(client: import('pg').PoolClient): Promise<any>} callback
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Connectivity Test ────────────────────────────────────────────────────────
/**
 * Test the DB connection on server startup.
 * Logs a warning but does NOT crash the server in development.
 */
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS now, current_database() AS db');
    const { now, db } = result.rows[0];
    console.log(`✅ PostgreSQL connected — DB: "${db}" | Server time: ${now}`);
  } catch (err) {
    console.warn('⚠️  PostgreSQL connection failed:', err.message);
    console.warn('   Server will continue, but DB queries will fail until resolved.');
    console.warn('   Check DATABASE_URL in your .env file.');
  }
};

module.exports = { query, withTransaction, testConnection, pool };
