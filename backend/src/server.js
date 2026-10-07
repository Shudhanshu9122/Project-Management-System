const http = require('node:http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/db');

const server = http.createServer(app);
const SHUTDOWN_TIMEOUT_MS = 10_000;

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);

  // Stop accepting connections, then release the pool so Postgres is not left
  // holding sessions for a process that no longer exists.
  server.close(async (error) => {
    if (error) {
      logger.error(`Failed to close HTTP server: ${error.message}`);
      process.exitCode = 1;
    }

    try {
      await db.close();
    } catch (closeError) {
      logger.error(`Failed to close database pool: ${closeError.message}`);
      process.exitCode = 1;
    }

    process.exit(process.exitCode || 0);
  });

  // A hung keep-alive connection must not keep the container alive.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  try {
    await db.ping();
  } catch (error) {
    logger.error(`Cannot reach the database: ${error.message}`);
    process.exit(1);
  }

  server.listen(env.port, () => {
    logger.info(`API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
