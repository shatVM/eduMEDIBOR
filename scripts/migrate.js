// scripts/migrate.js
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const pgp = require('pg-promise')();

const postgresConfig = require('../config/postgres.config');
const env = process.env.NODE_ENV || 'development';
const db = pgp(postgresConfig[env]);

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await db.connect();
    console.log('Connected successfully.');

    console.log('Reading migration files...');
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${sqlFiles.length} migration files.`);

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const script = await fs.readFile(filePath, 'utf8');
      await db.none(script);
      console.log(`Migration ${file} completed successfully.`);
    }

    console.log('\nAll migrations completed successfully!');

  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    pgp.end();
    console.log('Database connection closed.');
  }
}

migrate();
