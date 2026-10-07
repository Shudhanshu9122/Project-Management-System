const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./AppError');

// The jti is what makes logout real: the signature stays valid until expiry, so
// a server-side revocation list keyed by jti is the only way to kill it early.
function signToken(userId) {
  const jti = randomUUID();
  const token = jwt.sign({ jti }, env.jwtSecret, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: env.jwtExpiresIn,
  });
  return { token, jti };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
    }
    throw AppError.unauthorized('INVALID_TOKEN', 'Invalid authentication token.');
  }
}

module.exports = { signToken, verifyToken };
