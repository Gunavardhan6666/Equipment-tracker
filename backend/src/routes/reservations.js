'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/reservationsController');

const router = Router();

const VALID_ROLES    = ['student', 'professor', 'admin'];
const VALID_STATUSES = ['pending', 'approved', 'active', 'returned', 'cancelled', 'overdue'];
const VALID_CONDITIONS = ['good', 'fair', 'damaged', 'retired'];

// ─── Reusable datetime pair validator ─────────────────────────────────────────
const datetimePairValidators = [
  body('start_time')
    .notEmpty().withMessage('start_time is required.')
    .isISO8601().withMessage('start_time must be a valid ISO 8601 datetime (e.g. 2025-07-01T09:00:00Z).'),
  body('end_time')
    .notEmpty().withMessage('end_time is required.')
    .isISO8601().withMessage('end_time must be a valid ISO 8601 datetime.')
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.start_time)) {
        throw new Error('end_time must be strictly after start_time.');
      }
      return true;
    }),
];

// ─── GET /api/reservations ────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('item_id').optional().isUUID().withMessage('item_id must be a valid UUID.'),
    query('user_id').optional().isUUID().withMessage('user_id must be a valid UUID.'),
    query('kit_id').optional().isUUID().withMessage('kit_id must be a valid UUID.'),
    query('status').optional().isIn(VALID_STATUSES).withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}.`),
    query('start_after').optional().isISO8601().withMessage('start_after must be ISO 8601.'),
    query('start_before').optional().isISO8601().withMessage('start_before must be ISO 8601.'),
  ],
  validate,
  ctrl.getAllReservations
);

// ─── GET /api/reservations/:id ────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Reservation ID must be a valid UUID.')],
  validate,
  ctrl.getReservationById
);

// ─── POST /api/reservations (single item) ─────────────────────────────────────
router.post(
  '/',
  [
    body('item_id').isUUID().withMessage('item_id must be a valid UUID.'),
    body('user_id').isUUID().withMessage('user_id is required and must be a valid UUID.'),
    body('role')
      .isIn(VALID_ROLES)
      .withMessage(`role is required. Must be one of: ${VALID_ROLES.join(', ')}.`),
    ...datetimePairValidators,
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createReservation
);

// ─── POST /api/reservations/kit (atomic kit booking) ─────────────────────────
// NOTE: This route MUST be defined before /:id to avoid "kit" being parsed as an ID
router.post(
  '/kit',
  [
    body('kit_id').isUUID().withMessage('kit_id must be a valid UUID.'),
    body('user_id').isUUID().withMessage('user_id is required and must be a valid UUID.'),
    body('role')
      .isIn(VALID_ROLES)
      .withMessage(`role is required. Must be one of: ${VALID_ROLES.join(', ')}.`),
    ...datetimePairValidators,
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createKitReservation
);

// ─── PATCH /api/reservations/:id/status ──────────────────────────────────────
router.patch(
  '/:id/status',
  [
    param('id').isUUID().withMessage('Reservation ID must be a valid UUID.'),
    body('status')
      .isIn(VALID_STATUSES)
      .withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}.`),
    body('approved_by')
      .optional()
      .isUUID().withMessage('approved_by must be a valid UUID.'),
  ],
  validate,
  ctrl.updateStatus
);

// ─── POST /api/reservations/:id/condition-log ─────────────────────────────────
router.post(
  '/:id/condition-log',
  [
    param('id').isUUID().withMessage('Reservation ID must be a valid UUID.'),
    body('logged_by').isUUID().withMessage('logged_by must be a valid UUID.'),
    body('condition_before').optional().isIn(VALID_CONDITIONS).withMessage(`Must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    body('condition_after').optional().isIn(VALID_CONDITIONS).withMessage(`Must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    body('damage_notes').optional().trim().isLength({ max: 2000 }),
  ],
  validate,
  ctrl.createConditionLog
);

module.exports = router;
