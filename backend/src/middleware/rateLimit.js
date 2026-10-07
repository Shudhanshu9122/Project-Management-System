const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function tooManyRequests(_req, res) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down and try again shortly.',
    },
  });
}

// express-rate-limit v7 refuses to run with a blanket `trust proxy: true` unless
// the check is disabled. The value comes from TRUST_PROXY, which is set by
// whoever deploys the service, so the warning is acknowledged rather than remade.
const shared = {
  handler: tooManyRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
};

const apiLimiter = rateLimit({
  ...shared,
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
});

// Credential endpoints get their own, much tighter budget so password guessing
// is not limited only by the general API ceiling.
const authLimiter = rateLimit({
  ...shared,
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.authMax,
});

module.exports = { apiLimiter, authLimiter };
