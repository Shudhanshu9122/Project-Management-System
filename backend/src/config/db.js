const { Pool, types } = require('pg');
const env = require('./env');
const logger = require('./logger');




types.setTypeParser(types.builtins.DATE, (value) => value);

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.databasePoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});



pool.on('error', (error) => {
  logger.error(`Idle database client error: ${error.message}`);
});

function query(text, params) {
  return pool.query(text, params);
}

async function ping() {
  await pool.query('SELECT 1');
}



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
