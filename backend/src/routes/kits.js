'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate        = require('../middleware/validate');
const { verifyToken } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const ctrl = require('../controllers/kitsController');

const router = Router();

// ─── GET /api/kits ────────────────────────────────────────────────────────────
// Public — any authenticated (or even unauthenticated) user can browse kits.
router.get('/', ctrl.getAllKits);

// ─── GET /api/kits/:id ────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Kit ID must be a valid UUID.')],
  validate,
  ctrl.getKitById
);

// ─── GET /api/kits/:id/calendar ──────────────────────────────────────────────
router.get(
  '/:id/calendar',
  [
    param('id').isUUID().withMessage('Kit ID must be a valid UUID.'),
    query('month').notEmpty().matches(/^\d{4}-\d{2}$/)
  ],
  validate,
  ctrl.getKitCalendar
);

// ─── GET /api/kits/:id/timeslots ─────────────────────────────────────────────
router.get(
  '/:id/timeslots',
  [
    param('id').isUUID().withMessage('Kit ID must be a valid UUID.'),
    query('date').notEmpty().matches(/^\d{4}-\d{2}-\d{2}$/)
  ],
  validate,
  ctrl.getKitTimeSlots
);

// ─── POST /api/kits ───────────────────────────────────────────────────────────
// Admin only — creates a new kit.
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Kit name is required.').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createKit
);

// ─── PATCH /api/kits/:id ──────────────────────────────────────────────────────
// Admin only — updates kit name and/or description.
router.patch(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Kit ID must be a valid UUID.'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.updateKit
);

// ─── POST /api/kits/:id/items ─────────────────────────────────────────────────
// Admin only — add an item to a kit.
router.post(
  '/:id/items',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Invalid kit ID.'),
    body('equipment_name').trim().notEmpty().withMessage('equipment_name is required.'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be at least 1.'),
  ],
  validate,
  ctrl.addItemToKit
);

// ─── DELETE /api/kits/:id/items/:equipmentName ───────────────────────────────────────
// Admin only — remove an item from a kit (hard delete from junction table).
router.delete(
  '/:id/items/:equipmentName',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Invalid kit ID.'),
    param('equipmentName').trim().notEmpty().withMessage('equipmentName is required.'),
  ],
  validate,
  ctrl.removeItemFromKit
);

// ─── DELETE /api/kits/:id ─────────────────────────────────────────────────────
// Admin only — soft-deletes (archives) the kit.
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [param('id').isUUID().withMessage('Kit ID must be a valid UUID.')],
  validate,
  ctrl.softDeleteKit
);

module.exports = router;
