const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/db');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./utils/AppError');
const { asyncHandler } = require('./utils/helpers');

const app = express();

app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      logger.warn(`Blocked CORS origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
  })
);

app.use(express.json({ limit: '100kb' }));

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: logger.stream,
    skip: () => env.isTest,
  })
);

app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await db.ping();
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      res.status(503).json({ status: 'degraded', database: 'unreachable' });
      return;
    }
    res.json({ status: 'ok', database: 'up', uptime: Math.round(process.uptime()) });
  })
);

app.use('/api', apiLimiter, routes);

app.use((req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `No endpoint matches ${req.method} ${req.path}.`));
});

app.use(errorHandler);

module.exports = app;
