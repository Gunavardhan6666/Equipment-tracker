'use strict';

const db = require('../config/db');

// ─── GET /api/categories ──────────────────────────────────────────────────────
const getAllCategories = async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, buffer_hours, description, is_active, created_at, updated_at
       FROM equipment_categories
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    res.status(200).json({ status: 'ok', count: result.rowCount, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
const getCategoryById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, buffer_hours, description, is_active, created_at, updated_at
       FROM equipment_categories
       WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/categories ─────────────────────────────────────────────────────
const createCategory = async (req, res, next) => {
  const { name, buffer_hours = 1, description } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO equipment_categories (name, buffer_hours, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, buffer_hours, description || null]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    // Unique constraint violation
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message = `A category named "${name}" already exists.`;
    }
    next(err);
  }
};

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────
const updateCategory = async (req, res, next) => {
  const { name, buffer_hours, description } = req.body;
  try {
    // Build a dynamic SET clause — only update provided fields
    const fields = [];
    const params = [];
    let idx = 1;

    if (name !== undefined)         { fields.push(`name = $${idx++}`);         params.push(name); }
    if (buffer_hours !== undefined)  { fields.push(`buffer_hours = $${idx++}`);  params.push(buffer_hours); }
    if (description !== undefined)   { fields.push(`description = $${idx++}`);   params.push(description); }

    if (!fields.length) {
      const err = new Error('No updatable fields provided.');
      err.statusCode = 400;
      return next(err);
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE equipment_categories SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      params
    );
    if (!result.rowCount) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message = `A category named "${name}" already exists.`;
    }
    next(err);
  }
};

// ─── DELETE /api/categories/:id (soft delete) ─────────────────────────────────
const softDeleteCategory = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE equipment_categories SET is_active = FALSE WHERE id = $1 RETURNING id, name`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({
      status: 'ok',
      message: `Category "${result.rows[0].name}" has been archived.`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory,
};
