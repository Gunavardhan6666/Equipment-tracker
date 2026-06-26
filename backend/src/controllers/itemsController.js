'use strict';

const db = require('../config/db');

// ══════════════════════════════════════════════════════════════════════════════
// THE OVERLAP ENGINE
// Pure SQL algebraic check — no JavaScript date math (Rule B).
// Buffer is applied symmetrically: pads after existing end_time and before
// the new requested start_time.
//
// Returns rows if CONFLICT exists. No rows = item is AVAILABLE.
// ══════════════════════════════════════════════════════════════════════════════
const OVERLAP_SQL = `
  SELECT
    r.id                                             AS reservation_id,
    r.start_time,
    r.end_time,
    r.status,
    (ec.buffer_hours || ' hours')::INTERVAL          AS buffer_applied
  FROM reservations r
  JOIN equipment_items      ei ON ei.id = r.item_id
  JOIN equipment_categories ec ON ec.id = ei.category_id
  WHERE r.item_id    = $1
    AND r.status    NOT IN ('cancelled', 'returned')
    AND r.is_active  = TRUE
    AND r.start_time < ($3::TIMESTAMPTZ + (ec.buffer_hours || ' hours')::INTERVAL)
    AND (r.end_time  + (ec.buffer_hours || ' hours')::INTERVAL) > $2::TIMESTAMPTZ
`;
// $1 = item_id  |  $2 = requested_start  |  $3 = requested_end

// ─── GET /api/items ───────────────────────────────────────────────────────────
const getAllItems = async (req, res, next) => {
  try {
    const { category_id, condition, search } = req.query;

    const conditions = ['ei.is_active = TRUE'];
    const params = [];
    let idx = 1;

    if (category_id) {
      conditions.push(`ei.category_id = $${idx++}`);
      params.push(category_id);
    }
    if (condition) {
      conditions.push(`ei.condition = $${idx++}`);
      params.push(condition);
    }
    if (search) {
      conditions.push(`(ei.name ILIKE $${idx} OR ei.serial_number ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const sql = `
      SELECT
        ei.id, ei.name, ei.serial_number, ei.description,
        ei.condition, ei.notes, ei.is_active,
        ei.created_at, ei.updated_at,
        ec.id   AS category_id,
        ec.name AS category_name,
        ec.buffer_hours
      FROM equipment_items ei
      JOIN equipment_categories ec ON ec.id = ei.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ei.created_at DESC
    `;

    const result = await db.query(sql, params);
    res.status(200).json({ status: 'ok', count: result.rowCount, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/items/:id ───────────────────────────────────────────────────────
const getItemById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         ei.id, ei.name, ei.serial_number, ei.description,
         ei.condition, ei.notes, ei.is_active,
         ei.created_at, ei.updated_at,
         ec.id          AS category_id,
         ec.name        AS category_name,
         ec.buffer_hours,
         ec.description AS category_description
       FROM equipment_items ei
       JOIN equipment_categories ec ON ec.id = ei.category_id
       WHERE ei.id = $1`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Equipment item not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/items/:id/availability ─────────────────────────────────────────
// Uses the Overlap Engine SQL to check if the item is free for a time window.
// Query params: ?start=ISO8601&end=ISO8601
const checkAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    // Fetch item info for the response envelope
    const itemResult = await db.query(
      `SELECT ei.id, ei.name, ei.serial_number, ec.buffer_hours
       FROM equipment_items ei
       JOIN equipment_categories ec ON ec.id = ei.category_id
       WHERE ei.id = $1 AND ei.is_active = TRUE`,
      [id]
    );
    if (!itemResult.rowCount) {
      const err = new Error('Equipment item not found or is archived.');
      err.statusCode = 404;
      return next(err);
    }

    // ── Run the Overlap Engine ────────────────────────────────────────────────
    const overlapResult = await db.query(OVERLAP_SQL, [id, start, end]);

    const item = itemResult.rows[0];
    const conflicts = overlapResult.rows;

    res.status(200).json({
      status: 'ok',
      data: {
        item_id:        item.id,
        item_name:      item.name,
        serial_number:  item.serial_number,
        buffer_hours:   item.buffer_hours,
        requested: { start, end },
        available:      conflicts.length === 0,
        conflicts:      conflicts.map((c) => ({
          reservation_id: c.reservation_id,
          start_time:     c.start_time,
          end_time:       c.end_time,
          status:         c.status,
          buffer_applied: c.buffer_applied,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/items ──────────────────────────────────────────────────────────
const createItem = async (req, res, next) => {
  const { category_id, name, description, condition, notes } = req.body;
  try {
    const result = await db.withTransaction(async (client) => {
      // 1. Fetch category prefix
      const catCheck = await client.query(
        `SELECT prefix FROM equipment_categories WHERE id = $1`,
        [category_id]
      );
      if (!catCheck.rowCount) {
        const err = new Error(`Category with id "${category_id}" does not exist.`);
        err.statusCode = 400;
        throw err;
      }
      const prefix = catCheck.rows[0].prefix;

      // 2. Find highest serial number for this prefix
      const maxSerialRes = await client.query(
        `SELECT serial_number FROM equipment_items 
         WHERE serial_number LIKE $1 
         ORDER BY serial_number DESC LIMIT 1`,
        [`${prefix}-%`]
      );

      let nextNum = 1;
      if (maxSerialRes.rowCount > 0) {
        const lastSerial = maxSerialRes.rows[0].serial_number;
        const match = lastSerial.match(new RegExp(`^${prefix}-(\\d+)$`));
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      const serial_number = `${prefix}-${String(nextNum).padStart(3, '0')}`;

      // 3. Insert new item
      const insertRes = await client.query(
        `INSERT INTO equipment_items (category_id, name, serial_number, description, condition, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [category_id, name, serial_number, description || null, condition || 'good', notes || null]
      );
      return insertRes.rows[0];
    });

    res.status(201).json({ status: 'ok', data: result });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/items/:id ─────────────────────────────────────────────────────
const updateItem = async (req, res, next) => {
  const { category_id, name, serial_number, description, condition, notes } = req.body;
  try {
    const fields = [];
    const params = [];
    let idx = 1;

    if (category_id    !== undefined) { fields.push(`category_id = $${idx++}`);    params.push(category_id); }
    if (name           !== undefined) { fields.push(`name = $${idx++}`);           params.push(name); }
    if (serial_number  !== undefined) { fields.push(`serial_number = $${idx++}`);  params.push(serial_number); }
    if (description    !== undefined) { fields.push(`description = $${idx++}`);    params.push(description); }
    if (condition      !== undefined) { fields.push(`condition = $${idx++}`);      params.push(condition); }
    if (notes          !== undefined) { fields.push(`notes = $${idx++}`);          params.push(notes); }

    if (!fields.length) {
      const err = new Error('No updatable fields provided.');
      err.statusCode = 400;
      return next(err);
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE equipment_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (!result.rowCount) {
      const err = new Error('Equipment item not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      err.statusCode = 409;
      err.message = `Serial number "${serial_number}" is already assigned to another item.`;
    }
    next(err);
  }
};

// ─── DELETE /api/items/:id (soft delete) ──────────────────────────────────────
const softDeleteItem = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE equipment_items SET is_active = FALSE WHERE id = $1 RETURNING id, name, serial_number`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Equipment item not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({
      status: 'ok',
      message: `Item "${result.rows[0].name}" (S/N: ${result.rows[0].serial_number}) has been archived.`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  OVERLAP_SQL, // exported so reservationsController can import it
  getAllItems,
  getItemById,
  checkAvailability,
  createItem,
  updateItem,
  softDeleteItem,
};
