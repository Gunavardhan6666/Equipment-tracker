'use strict';

const db = require('../config/db');

// ─── GET /api/kits ────────────────────────────────────────────────────────────
const getAllKits = async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         k.id, k.name, k.description, k.is_active, k.created_at, k.updated_at,
         u.full_name  AS created_by_name,
         COUNT(ki.id) AS item_count
       FROM kits k
       LEFT JOIN users     u  ON u.id  = k.created_by
       LEFT JOIN kit_items ki ON ki.kit_id = k.id
       WHERE k.is_active = TRUE
       GROUP BY k.id, u.full_name
       ORDER BY k.created_at DESC`
    );
    res.status(200).json({ status: 'ok', count: result.rowCount, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/kits/:id ────────────────────────────────────────────────────────
const getKitById = async (req, res, next) => {
  try {
    // Fetch kit metadata
    const kitResult = await db.query(
      `SELECT k.id, k.name, k.description, k.is_active, k.created_at, k.updated_at,
              u.full_name AS created_by_name
       FROM kits k
       LEFT JOIN users u ON u.id = k.created_by
       WHERE k.id = $1`,
      [req.params.id]
    );
    if (!kitResult.rowCount) {
      const err = new Error('Kit not found.');
      err.statusCode = 404;
      return next(err);
    }

    // Fetch all member items for this kit
    const itemsResult = await db.query(
      `SELECT
         ei.id, ei.name, ei.serial_number, ei.condition, ei.is_active,
         ec.id AS category_id, ec.name AS category_name, ec.buffer_hours,
         ki.id AS kit_item_id
       FROM kit_items ki
       JOIN equipment_items      ei ON ei.id = ki.item_id
       JOIN equipment_categories ec ON ec.id = ei.category_id
       WHERE ki.kit_id = $1
       ORDER BY ec.name, ei.name`,
      [req.params.id]
    );

    res.status(200).json({
      status: 'ok',
      data: {
        ...kitResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/kits ───────────────────────────────────────────────────────────
const createKit = async (req, res, next) => {
  const { name, description, created_by } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO kits (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, created_by || null]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      err.statusCode = 400;
      err.message = `User with id "${created_by}" does not exist.`;
    }
    next(err);
  }
};

// ─── POST /api/kits/:id/items ─────────────────────────────────────────────────
const addItemToKit = async (req, res, next) => {
  const { item_id } = req.body;
  const { id: kit_id } = req.params;
  try {
    // Verify kit exists
    const kitCheck = await db.query(`SELECT id FROM kits WHERE id = $1 AND is_active = TRUE`, [kit_id]);
    if (!kitCheck.rowCount) {
      const err = new Error('Kit not found.');
      err.statusCode = 404;
      return next(err);
    }

    const result = await db.query(
      `INSERT INTO kit_items (kit_id, item_id) VALUES ($1, $2) RETURNING *`,
      [kit_id, item_id]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message = 'This item is already a member of this kit.';
    }
    if (err.code === '23503') {
      err.statusCode = 400;
      err.message = `Equipment item with id "${item_id}" does not exist.`;
    }
    next(err);
  }
};

// ─── DELETE /api/kits/:id/items/:itemId ───────────────────────────────────────
// This is a real DELETE (junction table row removal — not soft-deleted assets)
const removeItemFromKit = async (req, res, next) => {
  const { id: kit_id, itemId: item_id } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM kit_items WHERE kit_id = $1 AND item_id = $2 RETURNING *`,
      [kit_id, item_id]
    );
    if (!result.rowCount) {
      const err = new Error('Item is not a member of this kit.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', message: 'Item removed from kit.' });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/kits/:id (soft delete) ───────────────────────────────────────
const softDeleteKit = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE kits SET is_active = FALSE WHERE id = $1 RETURNING id, name`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Kit not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({
      status: 'ok',
      message: `Kit "${result.rows[0].name}" has been archived.`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllKits,
  getKitById,
  createKit,
  addItemToKit,
  removeItemFromKit,
  softDeleteKit,
};
