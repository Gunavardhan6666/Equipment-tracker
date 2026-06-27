'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate        = require('../middleware/validate');
const { verifyToken } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const ctrl = require('../controllers/itemsController');

const router = Router();

// All valid item condition values (equipment_items.condition is a VARCHAR — no DB enum)
const VALID_CONDITIONS = ['good', 'fair', 'damaged', 'in_maintenance', 'retired', 'lost', 'stolen'];

// ─── GET /api/items ───────────────────────────────────────────────────────────
// Public — browsing inventory does not require authentication.
router.get(
  '/',
  [
    query('category_id').optional().isUUID().withMessage('category_id must be a valid UUID.'),
    query('condition').optional().isIn(VALID_CONDITIONS).withMessage(`condition must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    query('search').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  ctrl.getAllItems
);

// ─── GET /api/items/:id ───────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Item ID must be a valid UUID.')],
  validate,
  ctrl.getItemById
);

// ─── GET /api/items/:id/availability ─────────────────────────────────────────
router.get(
  '/:id/availability',
  [
    param('id').isUUID().withMessage('Item ID must be a valid UUID.'),
    query('start')
      .notEmpty().withMessage('start query parameter is required.')
      .isISO8601().withMessage('start must be a valid ISO 8601 datetime (e.g. 2025-07-01T09:00:00Z).'),
    query('end')
      .notEmpty().withMessage('end query parameter is required.')
      .isISO8601().withMessage('end must be a valid ISO 8601 datetime.')
      .custom((end, { req }) => {
        if (new Date(end) <= new Date(req.query.start)) {
          throw new Error('end must be after start.');
        }
        return true;
      }),
  ],
  validate,
  ctrl.checkAvailability
);

// ─── GET /api/items/:id/calendar ─────────────────────────────────────────────
// Returns scrubbed availability data for a specific month (YYYY-MM).
router.get(
  '/:id/calendar',
  [
    param('id').isUUID().withMessage('Item ID must be a valid UUID.'),
    query('month')
      .notEmpty().withMessage('month query parameter is required.')
      .matches(/^\d{4}-\d{2}$/).withMessage('month must be in YYYY-MM format.')
  ],
  validate,
  ctrl.getItemCalendar
);

// ─── GET /api/items/:id/timeslots ────────────────────────────────────────────
// Returns continuous available time windows for a specific date.
router.get(
  '/:id/timeslots',
  [
    param('id').isUUID().withMessage('Item ID must be a valid UUID.'),
    query('date')
      .notEmpty().withMessage('date query parameter is required.')
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be in YYYY-MM-DD format.')
  ],
  validate,
  ctrl.getItemTimeSlots
);

// ─── POST /api/items ──────────────────────────────────────────────────────────
// Admin only — creates a new equipment item.
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('category_id').isUUID().withMessage('category_id must be a valid UUID.'),
    body('name').trim().notEmpty().withMessage('Item name is required.').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('condition').optional().isIn(VALID_CONDITIONS).withMessage(`condition must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createItem
);

// ─── PATCH /api/items/:id ─────────────────────────────────────────────────────
// Admin only — updates item fields (including condition/status).
router.patch(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Item ID must be a valid UUID.'),
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 200 }),
    body('serial_number').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('condition').optional().isIn(VALID_CONDITIONS).withMessage(`condition must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.updateItem
);

// ─── DELETE /api/items/:id ────────────────────────────────────────────────────
// Admin only — soft-deletes (archives) the item.
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [param('id').isUUID().withMessage('Item ID must be a valid UUID.')],
  validate,
  ctrl.softDeleteItem
);

module.exports = router;
