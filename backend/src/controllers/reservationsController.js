'use strict';

const db = require('../config/db');
const { OVERLAP_SQL } = require('./itemsController');

// ══════════════════════════════════════════════════════════════════════════════
// STATUS TRANSITION STATE MACHINE
// Only these transitions are valid. Any other attempt returns 400.
// ══════════════════════════════════════════════════════════════════════════════
const VALID_TRANSITIONS = {
  pending:   ['approved', 'cancelled'],
  approved:  ['active', 'cancelled'],
  active:    ['returned', 'overdue'],
  overdue:   ['returned'],
  returned:  [], // terminal
  cancelled: [], // terminal
};

// ──────────────────────────────────────────────────────────────────────────────
// HELPER: Derive initial booking status from requester role (Phase 3 stub).
// In Phase 5 this will read from req.user.role (JWT).
// ──────────────────────────────────────────────────────────────────────────────
const initialStatus = (role) => {
  if (role === 'student') return 'pending';
  if (role === 'professor' || role === 'admin') return 'approved';
  return 'pending'; // safe default
};

// ─── Phase 5 note ──────────────────────────────────────────────────────────────
// user_id and role are now sourced from req.user (JWT payload), not req.body.
// The route middleware (verifyToken) guarantees req.user is always set.
// ──────────────────────────────────────────────────────────────────────────────

// ─── GET /api/reservations ────────────────────────────────────────────────────
// Optional query filters: item_id, user_id, status, start_after, start_before
const getAllReservations = async (req, res, next) => {
  try {
    const { item_id, user_id, status, start_after, start_before, kit_id } = req.query;

    const conditions = ['r.is_active = TRUE'];
    const params = [];
    let idx = 1;

    if (item_id)      { conditions.push(`r.item_id = $${idx++}`);                       params.push(item_id); }
    if (user_id)      { conditions.push(`r.user_id = $${idx++}`);                       params.push(user_id); }
    if (status)       { conditions.push(`r.status = $${idx++}`);                        params.push(status); }
    if (kit_id)       { conditions.push(`r.kit_id = $${idx++}`);                        params.push(kit_id); }
    if (start_after)  { conditions.push(`r.start_time >= $${idx++}::TIMESTAMPTZ`);      params.push(start_after); }
    if (start_before) { conditions.push(`r.start_time <= $${idx++}::TIMESTAMPTZ`);      params.push(start_before); }

    const sql = `
      SELECT
        r.id, r.start_time, r.end_time, r.status, r.notes, r.is_active,
        r.created_at, r.updated_at,
        ei.id            AS item_id,
        ei.name          AS item_name,
        ei.serial_number,
        ec.name          AS category_name,
        ec.buffer_hours,
        u.id             AS user_id,
        u.full_name      AS user_name,
        u.email          AS user_email,
        u.role           AS user_role,
        ab.full_name     AS approved_by_name,
        k.name           AS kit_name
      FROM reservations r
      JOIN equipment_items      ei ON ei.id = r.item_id
      JOIN equipment_categories ec ON ec.id = ei.category_id
      JOIN users                u  ON u.id  = r.user_id
      LEFT JOIN users           ab ON ab.id = r.approved_by
      LEFT JOIN kits            k  ON k.id  = r.kit_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.start_time DESC
    `;

    const result = await db.query(sql, params);
    res.status(200).json({ status: 'ok', count: result.rowCount, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reservations/:id ────────────────────────────────────────────────
const getReservationById = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         r.id, r.start_time, r.end_time, r.status, r.notes, r.is_active,
         r.created_at, r.updated_at,
         ei.id            AS item_id,
         ei.name          AS item_name,
         ei.serial_number,
         ei.condition     AS item_condition,
         ec.id            AS category_id,
         ec.name          AS category_name,
         ec.buffer_hours,
         u.id             AS user_id,
         u.full_name      AS user_name,
         u.email          AS user_email,
         u.role           AS user_role,
         ab.full_name     AS approved_by_name,
         k.id             AS kit_id,
         k.name           AS kit_name
       FROM reservations r
       JOIN equipment_items      ei ON ei.id = r.item_id
       JOIN equipment_categories ec ON ec.id = ei.category_id
       JOIN users                u  ON u.id  = r.user_id
       LEFT JOIN users           ab ON ab.id = r.approved_by
       LEFT JOIN kits            k  ON k.id  = r.kit_id
       WHERE r.id = $1 AND r.is_active = TRUE`,
      [req.params.id]
    );
    if (!result.rowCount) {
      const err = new Error('Reservation not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/reservations ───────────────────────────────────────────────────
// Single-item booking. Runs the Overlap Engine before inserting.
// user_id and role come from the verified JWT (req.user), not req.body.
const createReservation = async (req, res, next) => {
  const { item_id, start_time, end_time, notes } = req.body;
  const { id: user_id, role } = req.user;

  try {
    // 1. Confirm item exists and is active
    const itemCheck = await db.query(
      `SELECT id, name, serial_number FROM equipment_items WHERE id = $1 AND is_active = TRUE`,
      [item_id]
    );
    if (!itemCheck.rowCount) {
      const err = new Error('Equipment item not found or is archived.');
      err.statusCode = 404;
      return next(err);
    }

    // 2. ── RUN THE OVERLAP ENGINE ─────────────────────────────────────────────
    const overlapResult = await db.query(OVERLAP_SQL, [item_id, start_time, end_time]);

    if (overlapResult.rowCount > 0) {
      return res.status(409).json({
        status: 'error',
        message: `"${itemCheck.rows[0].name}" is not available for the requested window. The item (or its buffer period) is already reserved.`,
        conflicts: overlapResult.rows.map((c) => ({
          reservation_id: c.reservation_id,
          start_time:     c.start_time,
          end_time:       c.end_time,
          status:         c.status,
          buffer_applied: c.buffer_applied,
        })),
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 3. Determine initial status from requester role (Phase 5: use JWT role)
    const status = initialStatus(role);

    // 4. INSERT the reservation
    const result = await db.query(
      `INSERT INTO reservations (item_id, user_id, start_time, end_time, status, notes)
       VALUES ($1, $2, $3::TIMESTAMPTZ, $4::TIMESTAMPTZ, $5, $6)
       RETURNING *`,
      [item_id, user_id, start_time, end_time, status, notes || null]
    );

    res.status(201).json({
      status: 'ok',
      message: `Reservation created with status "${status}".`,
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23503') {
      err.statusCode = 400;
      err.message = 'Invalid item_id or user_id — referenced record does not exist.';
    }
    next(err);
  }
};

// ─── POST /api/reservations/kit ───────────────────────────────────────────────
// ATOMIC kit booking. Checks ALL kit member items inside a single transaction.
// Either every item is booked, or nothing is booked (all-or-nothing).
// user_id and role come from the verified JWT (req.user), not req.body.
const createKitReservation = async (req, res, next) => {
  const { kit_id, start_time, end_time, notes } = req.body;
  const { id: user_id, role } = req.user;

  try {
    const reservations = await db.withTransaction(async (client) => {
      // 1. Verify kit exists
      const kitCheck = await client.query(
        `SELECT id, name FROM kits WHERE id = $1 AND is_active = TRUE`,
        [kit_id]
      );
      if (!kitCheck.rowCount) {
        const err = new Error('Kit not found or is archived.');
        err.statusCode = 404;
        throw err;
      }
      const kitName = kitCheck.rows[0].name;

      // 2. Fetch all member items
      const membersResult = await client.query(
        `SELECT
           ei.id, ei.name, ei.serial_number
         FROM kit_items ki
         JOIN equipment_items ei ON ei.id = ki.item_id
         WHERE ki.kit_id = $1 AND ei.is_active = TRUE`,
        [kit_id]
      );
      if (!membersResult.rowCount) {
        const err = new Error(`Kit "${kitName}" has no active items and cannot be booked.`);
        err.statusCode = 400;
        throw err;
      }

      const members = membersResult.rows;

      // 3. ── RUN OVERLAP ENGINE FOR EACH MEMBER ─────────────────────────────
      const blockedItems = [];
      const availableItems = [];

      for (const item of members) {
        const overlapResult = await client.query(OVERLAP_SQL, [item.id, start_time, end_time]);
        if (overlapResult.rowCount > 0) {
          blockedItems.push({
            item_id:       item.id,
            item_name:     item.name,
            serial_number: item.serial_number,
            conflicts:     overlapResult.rows.map((c) => ({
              reservation_id: c.reservation_id,
              start_time:     c.start_time,
              end_time:       c.end_time,
              status:         c.status,
              buffer_applied: c.buffer_applied,
            })),
          });
        } else {
          availableItems.push(item);
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      // 4. If ANY item is blocked → ROLLBACK (thrown error triggers withTransaction's catch)
      if (blockedItems.length > 0) {
        const err = new Error(
          `Kit booking failed: ${blockedItems.length} of ${members.length} item(s) are unavailable for the requested window.`
        );
        err.statusCode = 409;
        err.details = { blocked_items: blockedItems, available_items: availableItems };
        throw err;
      }

      // 5. All clear — INSERT one reservation row per kit item
      const status = initialStatus(role);
      const insertedRows = [];

      for (const item of members) {
        const insertResult = await client.query(
          `INSERT INTO reservations (item_id, kit_id, user_id, start_time, end_time, status, notes)
           VALUES ($1, $2, $3, $4::TIMESTAMPTZ, $5::TIMESTAMPTZ, $6, $7)
           RETURNING *`,
          [item.id, kit_id, user_id, start_time, end_time, status, notes || null]
        );
        insertedRows.push(insertResult.rows[0]);
      }

      return { kitName, status, reservations: insertedRows };
    });

    res.status(201).json({
      status: 'ok',
      message: `Kit "${reservations.kitName}" booked successfully. ${reservations.reservations.length} reservations created with status "${reservations.status}".`,
      data: reservations.reservations,
    });
  } catch (err) {
    // Propagate overlap conflict details with 409
    if (err.statusCode === 409 && err.details) {
      return res.status(409).json({
        status: 'error',
        message: err.message,
        ...err.details,
      });
    }
    next(err);
  }
};

// ─── PATCH /api/reservations/:id/status ──────────────────────────────────────
// Enforces the status transition state machine.
// approved_by is always the authenticated user (req.user.id) — not from body.
const updateStatus = async (req, res, next) => {
  const { status: newStatus } = req.body;
  const approved_by = req.user.id;

  try {
    // Fetch current status
    const current = await db.query(
      `SELECT id, status FROM reservations WHERE id = $1 AND is_active = TRUE`,
      [req.params.id]
    );
    if (!current.rowCount) {
      const err = new Error('Reservation not found.');
      err.statusCode = 404;
      return next(err);
    }

    const currentStatus = current.rows[0].status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      const err = new Error(
        `Invalid status transition: "${currentStatus}" → "${newStatus}". Allowed: [${allowed.join(', ') || 'none — this is a terminal state'}]`
      );
      err.statusCode = 400;
      return next(err);
    }

    // Build update: set approved_by if transitioning to 'approved'
    const fields = ['status = $1'];
    const params = [newStatus];
    let idx = 2;

    if (newStatus === 'approved' && approved_by) {
      fields.push(`approved_by = $${idx++}`);
      params.push(approved_by);
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    res.status(200).json({
      status: 'ok',
      message: `Reservation status updated: "${currentStatus}" → "${newStatus}".`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/reservations/:id/condition-log ─────────────────────────────────
// Logs item condition at return. Also updates equipment_items.condition atomically.
// logged_by is always the authenticated user (req.user.id) — not from body.
const createConditionLog = async (req, res, next) => {
  const { condition_before, condition_after, damage_notes } = req.body;
  const logged_by = req.user.id;

  try {
    const log = await db.withTransaction(async (client) => {
      // 1. Fetch the reservation to get item_id
      const resResult = await client.query(
        `SELECT id, item_id, status FROM reservations WHERE id = $1 AND is_active = TRUE`,
        [req.params.id]
      );
      if (!resResult.rowCount) {
        const err = new Error('Reservation not found.');
        err.statusCode = 404;
        throw err;
      }
      const { item_id, status } = resResult.rows[0];

      if (!['active', 'returned', 'overdue'].includes(status)) {
        const err = new Error(`Condition logs can only be filed for active, overdue, or returned reservations. Current status: "${status}".`);
        err.statusCode = 400;
        throw err;
      }

      // 2. Insert the condition log
      const logResult = await client.query(
        `INSERT INTO condition_logs (item_id, reservation_id, logged_by, condition_before, condition_after, damage_notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [item_id, req.params.id, logged_by, condition_before || null, condition_after || null, damage_notes || null]
      );

      // 3. If condition_after is provided, update the item's current condition
      if (condition_after) {
        await client.query(
          `UPDATE equipment_items SET condition = $1 WHERE id = $2`,
          [condition_after, item_id]
        );
      }

      return logResult.rows[0];
    });

    res.status(201).json({ status: 'ok', data: log });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  createKitReservation,
  updateStatus,
  createConditionLog,
};
