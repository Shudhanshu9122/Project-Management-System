const db = require('../config/db');
const { AppError } = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');
const { verifyToken } = require('../utils/token');

function readBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    throw AppError.unauthorized('INVALID_TOKEN', 'Authentication required.');
  }

  const payload = verifyToken(token);

  
  
  const { rows } = await db.query('SELECT 1 FROM revoked_tokens WHERE jti = $1', [payload.jti]);
  if (rows.length > 0) {
    throw AppError.unauthorized('TOKEN_REVOKED', 'This session has been logged out. Please log in again.');
  }

  req.user = { id: payload.sub };
  req.token = { jti: payload.jti, exp: payload.exp };
  next();
});

module.exports = { requireAuth };
