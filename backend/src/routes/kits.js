'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/kitsController');

const router = Router();

// ─── GET /api/kits ────────────────────────────────────────────────────────────
router.get('/', ctrl.getAllKits);

// ─── GET /api/kits/:id ────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Kit ID must be a valid UUID.')],
  validate,
  ctrl.getKitById
);

// ─── POST /api/kits ───────────────────────────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Kit name is required.').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('created_by').optional().isUUID().withMessage('created_by must be a valid UUID.'),
  ],
  validate,
  ctrl.createKit
);

// ─── POST /api/kits/:id/items ─────────────────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.post(
  '/:id/items',
  [
    param('id').isUUID().withMessage('Kit ID must be a valid UUID.'),
    body('item_id').isUUID().withMessage('item_id must be a valid UUID.'),
  ],
  validate,
  ctrl.addItemToKit
);

// ─── DELETE /api/kits/:id/items/:itemId ───────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.delete(
  '/:id/items/:itemId',
  [
    param('id').isUUID().withMessage('Kit ID must be a valid UUID.'),
    param('itemId').isUUID().withMessage('itemId must be a valid UUID.'),
  ],
  validate,
  ctrl.removeItemFromKit
);

// ─── DELETE /api/kits/:id ─────────────────────────────────────────────────────
// TODO Phase 5: add requireRole('admin') middleware before validate
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Kit ID must be a valid UUID.')],
  validate,
  ctrl.softDeleteKit
);

module.exports = router;
