'use strict';

const db = require('../config/db');

/**
 * Updates reservations that have passed their end_time to 'overdue'.
 * Only reservations currently in 'active' status are affected.
 */
const updateOverdueReservations = async () => {
  try {
    const resOverdue = await db.query(
      `UPDATE reservations 
       SET status = 'overdue' 
       WHERE status = 'active' AND end_time < CURRENT_TIMESTAMP
       RETURNING id`
    );
    if (resOverdue.rowCount > 0) {
      console.log(`[StatusEngine] Marked ${resOverdue.rowCount} reservations as overdue.`);
    }

    const resMaintenance = await db.query(
      `UPDATE equipment_items
       SET condition = 'good', updated_at = CURRENT_TIMESTAMP
       WHERE condition = 'in_maintenance' AND updated_at < CURRENT_TIMESTAMP - INTERVAL '3 hours'
       RETURNING id`
    );
    if (resMaintenance.rowCount > 0) {
      console.log(`[StatusEngine] Converted ${resMaintenance.rowCount} items from 'in_maintenance' to 'good'.`);
    }
  } catch (err) {
    console.error('[StatusEngine] Error in status engine:', err);
  }
};

module.exports = {
  updateOverdueReservations
};
