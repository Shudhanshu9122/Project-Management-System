const path = require('node:path');
const dotenv = require('dotenv');



dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optionalNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, received "${raw}"`);
  }
  return parsed;
}



function portNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`Environment variable ${name} must be a port between 0 and 65535, received "${raw}"`);
  }
  return parsed;
}

function parseOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const jwtSecret = required('JWT_SECRET');



if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters when NODE_ENV=production');
}

const trustProxyRaw = (process.env.TRUST_PROXY || 'false').trim();
const trustProxy =
  trustProxyRaw === 'true' ? true : trustProxyRaw === 'false' ? false : Number(trustProxyRaw);

if (typeof trustProxy === 'number' && !Number.isInteger(trustProxy)) {
  throw new Error(`TRUST_PROXY must be "true", "false" or a hop count, received "${trustProxyRaw}"`);
}

module.exports = {
  nodeEnv,
  isProduction,
  isTest,
  port: portNumber('PORT', 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: optionalNumber('BCRYPT_ROUNDS', 12),
  
  
  databasePoolMax: optionalNumber('DATABASE_POOL_MAX', 10),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS || 'http://localhost:5173'),
  trustProxy,
  rateLimit: {
    windowMs: optionalNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: optionalNumber('RATE_LIMIT_MAX', 300),
    authMax: optionalNumber('AUTH_RATE_LIMIT_MAX', 10),
  },
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
};
