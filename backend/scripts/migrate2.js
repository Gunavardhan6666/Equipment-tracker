require('dotenv').config();
const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('Connecting to database...');
    
    // First, drop the existing constraint. We must name it or look it up.
    // By default, if not named, we can drop it by looking up its name in pg_constraint.
    // Or we can just use ALTER TABLE ... DROP CONSTRAINT equipment_items_condition_check if we didn't name it (PostgreSQL auto-names).
    // The auto-name is usually `equipment_items_condition_check`.
    await db.query(`
      ALTER TABLE equipment_items DROP CONSTRAINT IF EXISTS equipment_items_condition_check;
    `);
    
    // Add the new constraint
    await db.query(`
      ALTER TABLE equipment_items 
      ADD CONSTRAINT equipment_items_condition_check 
      CHECK (condition IN ('good', 'fair', 'damaged', 'in_maintenance', 'retired', 'lost', 'stolen'));
    `);
    
    console.log('Migration successful: updated condition check constraint.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.pool.end();
  }
}

migrate();
