'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const dns     = require('dns').promises;
const db      = require('../config/db');
const { updateOverdueReservations } = require('../utils/statusEngine');

const SALT_ROUNDS = 12;

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    {
      id:        user.id,
      email:     user.email,
      role:      user.role,
      full_name: user.full_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── Helper: sanitize user (strip password_hash) ──────────────────────────────
function sanitize(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  const { email, password, full_name, role } = req.body;

  try {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Validate Email format via Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error('Invalid email format.');
      err.statusCode = 400;
      return next(err);
    }

    // 2. Validate Email Domain MX Records (Cost-Free Validation)
    const domain = cleanEmail.split('@')[1];
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new Error('No MX records');
      }
    } catch (e) {
      const err = new Error(`Email domain "${domain}" does not exist or cannot receive emails.`);
      err.statusCode = 400;
      return next(err);
    }

    // 3. Check for duplicate email
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );
    if (existing.rowCount > 0) {
      const err = new Error('An account with that email already exists.');
      err.statusCode = 409;
      return next(err);
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insert user — role defaults to 'student' if not provided or invalid.
    //    NOTE: Only 'student' and 'professor' are allowed via self-registration.
    //    Admins must be promoted directly in the database.
    const safeRole = ['student', 'professor'].includes(role) ? role : 'student';

    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cleanEmail, password_hash, full_name.trim(), safeRole]
    );

    const user  = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      status:  'ok',
      message: 'Account created successfully.',
      token,
      user:    sanitize(user),
    });
  } catch (err) {
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message    = 'An account with that email already exists.';
    }
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Find user (include inactive check)
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase().trim()]
    );

    if (!result.rowCount) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      return next(err);
    }

    const user = result.rows[0];

    // 2. Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      return next(err);
    }

    // 3. Sign and return token
    const token = signToken(user);

    // 4. Trigger background status engine to catch overdue items
    updateOverdueReservations();

    res.status(200).json({
      status:  'ok',
      message: 'Login successful.',
      token,
      user:    sanitize(user),
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the current user's profile (token required).
const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rowCount) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
