const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('../config/db');
const logger = require('../config/logger');

const SCHEMA_PATH = path.resolve(__dirname, '../../db/schema.sql');

async function main() {
  const sql = await fs.readFile(SCHEMA_PATH, 'utf8');

  // schema.sql is idempotent, so applying it repeatedly is the migration.
  await db.query(sql);

  logger.info(`Schema applied from ${path.relative(process.cwd(), SCHEMA_PATH)}`);
}

main()
  .catch((error) => {
    logger.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
