'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const validate        = require('../middleware/validate');
const { verifyToken } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const ctrl = require('../controllers/categoriesController');

const router = Router();

// ─── GET /api/categories ──────────────────────────────────────────────────────
router.get('/', ctrl.getAllCategories);

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Category ID must be a valid UUID.')],
  validate,
  ctrl.getCategoryById
);

// ─── POST /api/categories ─────────────────────────────────────────────────────
// Admin only — creates a new equipment category.
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Category name is required.')
      .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),
    body('buffer_hours')
      .optional()
      .isInt({ min: 0 }).withMessage('buffer_hours must be a non-negative integer.'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be 500 characters or fewer.'),
  ],
  validate,
  ctrl.createCategory
);

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────
// Admin only — updates category fields.
router.patch(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [
    param('id').isUUID().withMessage('Category ID must be a valid UUID.'),
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('Name cannot be empty.')
      .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),
    body('buffer_hours')
      .optional()
      .isInt({ min: 0 }).withMessage('buffer_hours must be a non-negative integer.'),
    body('description')
      .optional()
      .trim(),
  ],
  validate,
  ctrl.updateCategory
);

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
// Admin only — soft-deletes a category.
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [param('id').isUUID().withMessage('Category ID must be a valid UUID.')],
  validate,
  ctrl.softDeleteCategory
);

module.exports = router;
