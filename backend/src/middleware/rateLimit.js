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



const authLimiter = rateLimit({
  ...shared,
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.authMax,
});

module.exports = { apiLimiter, authLimiter };
