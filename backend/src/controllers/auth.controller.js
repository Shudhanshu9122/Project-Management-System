const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');
const { AppError } = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');
const { signToken } = require('../utils/token');



const USER_COLUMNS = 'id, full_name AS "fullName", email, created_at AS "createdAt"';




const DUMMY_HASH = bcrypt.hashSync('password-that-never-matches', env.bcryptRounds);

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  let rows;
  try {
    ({ rows } = await db.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING ${USER_COLUMNS}`,
      [fullName, email, passwordHash]
    ));
  } catch (error) {
    if (error.code === '23505') {
      throw AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists.');
    }
    throw error;
  }

  const user = rows[0];
  const { token } = signToken(user.id);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash"
     FROM users
     WHERE lower(email) = lower($1)`,
    [email]
  );

  const account = rows[0];
  const passwordMatches = await bcrypt.compare(password, account ? account.passwordHash : DUMMY_HASH);

  
  
  if (!account || !passwordMatches) {
    throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const { passwordHash, ...user } = account;
  const { token } = signToken(user.id);
  res.json({ user, token });
});

const logout = asyncHandler(async (req, res) => {
  const { jti, exp } = req.token;

  await db.query(
    `INSERT INTO revoked_tokens (jti, expires_at)
     VALUES ($1, to_timestamp($2))
     ON CONFLICT (jti) DO NOTHING`,
    [jti, exp]
  );

  res.status(204).end();
});

const me = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [req.user.id]);

  if (rows.length === 0) {
    throw AppError.unauthorized('INVALID_TOKEN', 'This account no longer exists.');
  }

  res.json({ user: rows[0] });
});

module.exports = { register, login, logout, me };
