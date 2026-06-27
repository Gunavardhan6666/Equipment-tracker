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

// ─── GET /api/kits/:id/calendar ───────────────────────────────────────────────
const getKitCalendar = async (req, res, next) => {
  // Simplified calendar: we will just return a placeholder or calculate roughly.
  // Realistically, computing a full month for kits is heavy, so we can just check day by day
  // or return an empty array for now and let the frontend fetch day slots when clicked.
  // We'll return an empty array of reservations to make the calendar look entirely available,
  // then actual clicking on a day queries /timeslots.
  try {
    const { id } = req.params;
    const { month } = req.query;
    res.status(200).json({
      status: 'ok',
      data: {
        kit_id: id,
        month,
        reservations: [] // Front-end will rely on the daily timeslots
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/kits/:id/timeslots ──────────────────────────────────────────────
const getKitTimeSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Fetch kit requirements
    const reqsResult = await db.query(
      `SELECT equipment_name, quantity FROM kit_items WHERE kit_id = $1`,
      [id]
    );
    if (!reqsResult.rowCount) {
      return res.status(200).json({ status: 'ok', data: { date, windows: [] } });
    }

    const { OVERLAP_SQL } = require('./itemsController');

    // For each requirement, calculate valid windows
    const reqWindows = [];

    for (const req of reqsResult.rows) {
      // Find eligible items
      const itemsRes = await db.query(
        `SELECT ei.id, ec.buffer_hours, ei.turnaround_buffer_minutes 
         FROM equipment_items ei
         JOIN equipment_categories ec ON ec.id = ei.category_id
         WHERE ei.name = $1 AND ei.is_active = TRUE AND ei.condition IN ('good', 'fair')`,
        [req.equipment_name]
      );
      
      const eligibleItems = itemsRes.rows;
      if (eligibleItems.length < req.quantity) {
        // Impossible to fulfill this requirement
        return res.status(200).json({ status: 'ok', data: { date, windows: [] } });
      }

      // Collect all available intervals for each item
      const itemAvailableIntervals = [];

      for (const item of eligibleItems) {
        const bufferMs = (item.buffer_hours * 60 * 60 * 1000) + (item.turnaround_buffer_minutes * 60 * 1000);
        const overlapRes = await db.query(
          `SELECT start_time, end_time
           FROM reservations
           WHERE item_id = $1 AND is_active = TRUE AND status NOT IN ('cancelled', 'returned')
             AND start_time < $3::TIMESTAMPTZ + INTERVAL '24 hours'
             AND end_time > $2::TIMESTAMPTZ - INTERVAL '24 hours'`,
          [item.id, dayStart.toISOString(), dayEnd.toISOString()]
        );
        
        const blocked = overlapRes.rows.map(r => ({
          start: new Date(new Date(r.start_time).getTime() - bufferMs),
          end: new Date(new Date(r.end_time).getTime() + bufferMs)
        }));
        
        // Merge blocked
        blocked.sort((a,b) => a.start - b.start);
        const merged = [];
        for (const b of blocked) {
          if (!merged.length) merged.push(b);
          else {
            const last = merged[merged.length - 1];
            if (b.start <= last.end) last.end = new Date(Math.max(last.end, b.end));
            else merged.push(b);
          }
        }
        
        // Invert to get available within dayStart, dayEnd
        let currentStart = dayStart;
        for (const b of merged) {
          if (b.start > currentStart) {
            itemAvailableIntervals.push({ start: currentStart, end: (b.start > dayEnd ? dayEnd : b.start) });
          }
          currentStart = new Date(Math.max(currentStart, b.end));
          if (currentStart >= dayEnd) break;
        }
        if (currentStart < dayEnd) {
          itemAvailableIntervals.push({ start: currentStart, end: dayEnd });
        }
      }

      // Line sweep to find when at least req.quantity items are available
      const events = [];
      for (const inv of itemAvailableIntervals) {
        events.push({ time: inv.start, type: 1 });
        events.push({ time: inv.end, type: -1 });
      }
      events.sort((a,b) => a.time - b.time || b.type - a.type);

      let count = 0;
      let validStart = null;
      const validIntervals = [];

      for (const e of events) {
        const prevCount = count;
        count += e.type;
        if (prevCount < req.quantity && count >= req.quantity) {
          validStart = e.time;
        } else if (prevCount >= req.quantity && count < req.quantity) {
          if (validStart && validStart < e.time) {
            validIntervals.push({ start: validStart, end: e.time });
          }
          validStart = null;
        }
      }
      reqWindows.push(validIntervals);
    }

    // Now, intersect the validIntervals of ALL requirements
    let intersection = reqWindows[0];
    for (let i = 1; i < reqWindows.length; i++) {
      const nextInt = [];
      const current = reqWindows[i];
      for (const a of intersection) {
        for (const b of current) {
          const maxStart = new Date(Math.max(a.start, b.start));
          const minEnd = new Date(Math.min(a.end, b.end));
          if (maxStart < minEnd) {
            nextInt.push({ start: maxStart, end: minEnd });
          }
        }
      }
      intersection = nextInt;
    }

    res.status(200).json({
      status: 'ok',
      data: {
        kit_id: id,
        date,
        windows: intersection.map(w => ({ start: w.start.toISOString(), end: w.end.toISOString() }))
      }
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
  getKitCalendar,
  getKitTimeSlots,
  createKit,
  updateKit,
  addItemToKit,
  removeItemFromKit,
  softDeleteKit,
};
