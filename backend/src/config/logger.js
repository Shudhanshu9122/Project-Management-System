const winston = require('winston');
const env = require('./env');

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack }) => {
            const line = `${timestamp} ${level} ${message}`;
            return stack ? `${line}\n${stack}` : line;
          })
        )
  ),
  transports: [new winston.transports.Console()],
  // Tests assert on behaviour, not on log volume.
  silent: env.isTest,
});

// morgan writes request lines through winston so everything lands in one stream.
logger.stream = { write: (message) => logger.info(message.trim()) };

module.exports = logger;
