// ================================================================
// CIL Youth Development Platform — Database Configuration
// PostgreSQL connection using pg (node-postgres)
// ================================================================

const { Pool } = require('pg');

// ── Connection Pool ──────────────────────────────────────────────
// Pool manages multiple database connections efficiently
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max             : 10,   // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s if can't connect
});

// ── Test Connection ──────────────────────────────────────────────
// Called when server starts — verifies DB is reachable
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    console.log('✓ Database connected:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
}

// ── Query Helper ─────────────────────────────────────────────────
// Simplifies running database queries throughout the app
// Usage: const result = await query('SELECT * FROM users WHERE id = $1', [id])
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`  Query: ${text.substring(0, 60)}... (${duration}ms)`);
    }
    return result;
  } catch (error) {
    console.error('Query Error:', error.message);
    throw error;
  }
}

// ── Transaction Helper ───────────────────────────────────────────
// Use when multiple queries must all succeed or all fail
// Example: creating a participant + their profile at the same time
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, testConnection, transaction };