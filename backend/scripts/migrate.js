require('dotenv').config();
const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await db.query(`
      ALTER TABLE equipment_items 
      ADD COLUMN IF NOT EXISTS turnaround_buffer_minutes INTEGER DEFAULT 0 NOT NULL;
    `);
    console.log('Migration successful: added turnaround_buffer_minutes to equipment_items.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.pool.end();
  }
}

migrate();
