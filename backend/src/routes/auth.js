'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const validate   = require('../middleware/validate');
const ctrl       = require('../controllers/authController');
const { verifyToken } = require('../middleware/authenticate');

const router = Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email')
      .isEmail().withMessage('A valid email address is required.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('full_name')
      .trim()
      .notEmpty().withMessage('Full name is required.')
      .isLength({ max: 120 }).withMessage('Full name must be at most 120 characters.'),
    body('role')
      .optional()
      .isIn(['student', 'professor'])
      .withMessage('Role must be "student" or "professor". Admins are promoted via the database.'),
  ],
  validate,
  ctrl.register
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('A valid email address is required.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],
  validate,
  ctrl.login
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', verifyToken, ctrl.getMe);

module.exports = router;
