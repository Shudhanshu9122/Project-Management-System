
const path = require('node:path');
const fs = require('node:fs/promises');

const DATA_DIR = path.resolve(__dirname, '../../.devdb');
const PORT = Number(process.env.LOCAL_DB_PORT || 5433);
const USER = 'postgres';
const PASSWORD = 'postgres';
const DATABASES = ['pms', 'pms_test'];

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function createDatabases(cluster) {
  const client = cluster.getPgClient('postgres');
  await client.connect();
  try {
    for (const name of DATABASES) {
      const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (rows.length === 0) {
        
        
        await client.query(`CREATE DATABASE ${name}`);
        console.log(`Created database ${name}`);
      }
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');

  const cluster = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
    
    onLog: () => {},
    onError: (message) => console.error(String(message)),
  });

  if (!(await exists(path.join(DATA_DIR, 'PG_VERSION')))) {
    console.log(`Initialising a new cluster in ${DATA_DIR}`);
    await cluster.initialise();
  }

  await cluster.start();
  await createDatabases(cluster);

  console.log(`\nPostgreSQL is listening on ${PORT}`);
  console.log(`  DATABASE_URL=${`postgresql:
  console.log(`  TEST_DATABASE_URL=${`postgresql:
  console.log('\nPress Ctrl+C to stop.\n');

  const stop = async () => {
    console.log('\nStopping PostgreSQL');
    await cluster.stop().catch((error) => console.error(error));
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  await new Promise(() => {});
}

main().catch((error) => {
  console.error(`Could not start the local database: ${error}`);
  process.exit(1);
});
