'use strict';

const db = require('../config/db');

// ─── GET /api/kits ────────────────────────────────────────────────────────────
const getAllKits = async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         k.id, k.name, k.description, k.is_active, k.created_at, k.updated_at,
         u.full_name  AS created_by_name,
         COALESCE(SUM(ki.quantity), 0) AS item_count,
         STRING_AGG(ki.quantity || 'x ' || ki.equipment_name, ', ') AS contents_summary
       FROM kits k
       LEFT JOIN users     u  ON u.id  = k.created_by
       LEFT JOIN kit_items ki ON ki.kit_id = k.id
       WHERE k.is_active = TRUE
       GROUP BY k.id, u.full_name
       ORDER BY k.created_at DESC`
    );
    // Parse SUM back to integer since Postgres returns SUM as string/bigint
    const data = result.rows.map(row => ({
      ...row,
      item_count: parseInt(row.item_count, 10)
    }));
    res.status(200).json({ status: 'ok', count: result.rowCount, data });
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

    // Fetch all member requirements for this kit
    const itemsResult = await db.query(
      `SELECT
         ki.id AS kit_item_id,
         ki.equipment_name,
         ki.quantity
       FROM kit_items ki
       WHERE ki.kit_id = $1
       ORDER BY ki.equipment_name`,
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
  const { name, description } = req.body;
  const created_by = req.user?.id ?? null; // read from JWT — not body
  try {
    const result = await db.query(
      `INSERT INTO kits (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, created_by]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/kits/:id ─────────────────────────────────────────────────────
const updateKit = async (req, res, next) => {
  const { name, description } = req.body;
  try {
    const fields = [];
    const params = [];
    let idx = 1;

    if (name        !== undefined) { fields.push(`name = $${idx++}`);        params.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }

    if (!fields.length) {
      const err = new Error('No updatable fields provided.');
      err.statusCode = 400;
      return next(err);
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE kits SET ${fields.join(', ')} WHERE id = $${idx} AND is_active = TRUE RETURNING *`,
      params
    );
    if (!result.rowCount) {
      const err = new Error('Kit not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/kits/:id/items ─────────────────────────────────────────────────
const addItemToKit = async (req, res, next) => {
  const { equipment_name, quantity } = req.body;
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
      `INSERT INTO kit_items (kit_id, equipment_name, quantity) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (kit_id, equipment_name) DO UPDATE 
       SET quantity = EXCLUDED.quantity 
       RETURNING *`,
      [kit_id, equipment_name, quantity || 1]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/kits/:id/items/:equipmentName ───────────────────────────────────────
// This is a real DELETE (junction table row removal)
const removeItemFromKit = async (req, res, next) => {
  const { id: kit_id, equipmentName: equipment_name } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM kit_items WHERE kit_id = $1 AND equipment_name = $2 RETURNING *`,
      [kit_id, equipment_name]
    );
    if (!result.rowCount) {
      const err = new Error('Equipment is not a member of this kit.');
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
  updateKit,
  addItemToKit,
  removeItemFromKit,
  softDeleteKit,
};
