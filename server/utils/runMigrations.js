const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  console.log('Checking for database migrations...');
  const client = await pool.connect();

  try {
    // 1. Ensure migrations_log table exists
    const logCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'migrations_log'
      );
    `);
    const logExists = logCheck.rows[0].exists;

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Get list of applied migrations
    const appliedResult = await client.query('SELECT migration_name FROM migrations_log');
    let appliedMigrations = new Set(appliedResult.rows.map(row => row.migration_name));

    // 3. Read migration files from server/migrations/
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sorting ensures 001 runs before 002

    // BOOTSTRAP for existing v1.0.4+ databases
    // If migrations_log is empty BUT the password_resets table exists,
    // it means this is an existing database that was manually migrated up to at least 018.
    if (appliedMigrations.size === 0) {
      const prCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'password_resets'
        );
      `);
      if (prCheck.rows[0].exists) {
        console.log('Existing v1.0.4+ database detected. Bootstrapping migration log...');
        await client.query('BEGIN');
        for (const file of files) {
          // Assume all existing SQL files were already applied
          await client.query('INSERT INTO migrations_log (migration_name) VALUES ($1)', [file]);
          appliedMigrations.add(file);
        }
        await client.query('COMMIT');
        console.log(`Bootstrapped ${files.length} existing migrations.`);
      }
    }

    let appliedCount = 0;

    // 4. Apply new migrations
    for (const file of files) {
      if (!appliedMigrations.has(file)) {
        console.log(`Applying migration: ${file}...`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Execute migration inside a transaction
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations_log (migration_name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Successfully applied ${file}`);
          appliedCount++;
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error applying migration ${file}:`, error);
          throw error; // Stop server startup on migration failure
        }
      }
    }

    if (appliedCount === 0) {
      console.log('Database is up to date. No new migrations applied.');
    } else {
      console.log(`Successfully applied ${appliedCount} migration(s).`);
    }

  } catch (error) {
    console.error('Migration framework encountered an error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = runMigrations;
