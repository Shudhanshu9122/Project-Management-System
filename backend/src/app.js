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

// Only meaningful when the service really sits behind a proxy; TRUST_PROXY keeps
// that decision with the operator instead of trusting X-Forwarded-For blindly.
app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Native apps and server-to-server calls send no Origin, and there is no
      // browser policy to enforce for them - the JWT is the real boundary.
      // An unknown origin simply gets no CORS headers and the browser blocks it.
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      logger.warn(`Blocked CORS origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Token based API: no cookies, so no cross-site credential sharing.
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

// Registered before the limiter: a container probe should never be throttled,
// and a failing probe should say so instead of returning a stack trace.
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
