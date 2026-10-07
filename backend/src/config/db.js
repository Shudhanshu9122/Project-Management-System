const { Pool, types } = require('pg');
const env = require('./env');
const logger = require('./logger');

// `pg` turns a DATE (OID 1082) into a JS Date at local midnight. Serializing that
// to JSON in a non-UTC timezone moves the calendar day by one, so the API
// contract is a plain 'YYYY-MM-DD' string and the driver should not touch it.
types.setTypeParser(types.builtins.DATE, (value) => value);

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.databasePoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// A pooled client can die between checkouts (restart, network drop). Swallowing
// the event would crash the process on an unhandled 'error'.
pool.on('error', (error) => {
  logger.error(`Idle database client error: ${error.message}`);
});

function query(text, params) {
  return pool.query(text, params);
}

async function ping() {
  await pool.query('SELECT 1');
}

// The callback receives a dedicated client; it must use that client (not
// `query`) or it will run outside the transaction.
async function withTransaction(run) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await run(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { query, ping, close, withTransaction, pool };
