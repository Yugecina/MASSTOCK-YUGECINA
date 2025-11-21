/**
 * Database Migration Helper
 * Helps run SQL migrations against Supabase
 */

const { supabaseAdmin } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { logger } = require('../config/logger');

/**
 * Run a SQL migration file
 */
async function runMigration(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    logger.info(`Running migration: ${fileName}`);

    // Note: Supabase JS client doesn't support raw SQL execution
    // Migrations should be run via Supabase SQL Editor
    // This script is for reference and local testing

    logger.debug(`
╔═══════════════════════════════════════════════════════════╗
║  Migration: ${fileName.padEnd(43)} ║
╚═══════════════════════════════════════════════════════════╝

To run this migration:

1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Paste the following SQL:

${sql}

4. Click "Run"

Note: The Supabase JS client doesn't support raw SQL execution.
Migrations must be run through the Supabase Dashboard.
    `);

    return true;
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runAllMigrations() {
  const migrationsDir = path.join(__dirname, '../../database/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  logger.debug(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           MasStock Database Migration Tool                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Found ${files.length} migration files:
  `);

  files.forEach((file, index) => {
    logger.debug(`  ${index + 1}. ${file}`);
  });

  logger.debug(`
To apply these migrations:

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to SQL Editor
3. Run each migration file in order

Press Ctrl+C to exit, or continue to see migration contents...
  `);

  // Wait for user input
  await new Promise(resolve => setTimeout(resolve, 3000));

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      await runMigration(filePath);
      logger.debug('\n' + '='.repeat(60) + '\n');
    }
  }

  logger.debug(`
Migration guide complete!

Next steps:
1. Run each migration in Supabase SQL Editor
2. Verify tables created: Go to Table Editor
3. Verify RLS enabled: Go to Authentication > Policies
4. Test with: npm start
  `);
}

// Run if called directly
if (require.main === module) {
  runAllMigrations().catch(console.error);
}

module.exports = {
  runMigration,
  runAllMigrations
};
