'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/itemsController');

const router = Router();

const VALID_CONDITIONS = ['good', 'fair', 'damaged', 'retired'];

// ─── GET /api/items ───────────────────────────────────────────────────────────
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

// ─── POST /api/items ──────────────────────────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.post(
  '/',
  [
    body('category_id').isUUID().withMessage('category_id must be a valid UUID.'),
    body('name').trim().notEmpty().withMessage('Item name is required.').isLength({ max: 200 }),
    body('serial_number').trim().notEmpty().withMessage('serial_number is required.').isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('condition').optional().isIn(VALID_CONDITIONS).withMessage(`condition must be one of: ${VALID_CONDITIONS.join(', ')}.`),
    body('notes').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createItem
);

// ─── PATCH /api/items/:id ─────────────────────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.patch(
  '/:id',
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
// TODO Phase 5: add requireRole('admin') middleware before validate
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Item ID must be a valid UUID.')],
  validate,
  ctrl.softDeleteItem
);

module.exports = router;
