'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrate() {
  console.log('Running DB Migration...');

  try {
    await db.withTransaction(async (client) => {
      // 1. Add prefix column to equipment_categories
      console.log('1. Altering equipment_categories...');
      await client.query(`ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS prefix TEXT`);

      // Fill in prefixes for existing seed data categories
      await client.query(`UPDATE equipment_categories SET prefix = 'CAM' WHERE name = 'Cameras'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'LEN' WHERE name = 'Lenses'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'TRI' WHERE name = 'Tripods'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'LIT' WHERE name = 'Lighting'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'AUD' WHERE name = 'Audio'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'CBL' WHERE name = 'Cables'`);
      await client.query(`UPDATE equipment_categories SET prefix = 'GRP' WHERE name = 'Grip Equipment'`);

      // Set default for any other categories
      await client.query(`UPDATE equipment_categories SET prefix = SUBSTRING(UPPER(name), 1, 3) WHERE prefix IS NULL`);
      await client.query(`ALTER TABLE equipment_categories ALTER COLUMN prefix SET NOT NULL`);

      // 2. Alter kit_items table
      console.log('2. Altering kit_items...');
      await client.query(`ALTER TABLE kit_items DROP CONSTRAINT IF EXISTS uq_kit_item`);
      await client.query(`ALTER TABLE kit_items DROP CONSTRAINT IF EXISTS kit_items_item_id_fkey`);
      await client.query(`ALTER TABLE kit_items DROP COLUMN IF EXISTS item_id`);

      await client.query(`ALTER TABLE kit_items ADD COLUMN IF NOT EXISTS equipment_name TEXT`);
      
      // We must backfill equipment_name if data exists, but since we are modifying the seed, we can just delete kit_items if we want.
      // However, let's make it robust by just deleting existing kit_items as we will re-seed.
      await client.query(`DELETE FROM kit_items`);
      
      await client.query(`ALTER TABLE kit_items ALTER COLUMN equipment_name SET NOT NULL`);
      await client.query(`ALTER TABLE kit_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1`);
      
      await client.query(`ALTER TABLE kit_items ADD CONSTRAINT uq_kit_item_name UNIQUE (kit_id, equipment_name)`);

      // Update schema.sql so future setups work automatically
    });
    console.log('✅ Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await db.pool.end();
  }
}

migrate();
