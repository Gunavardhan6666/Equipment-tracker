'use strict';

/**
 * seed-items.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates the database with realistic FilmDept University equipment.
 * Uses the existing db pool directly — no HTTP server needed.
 *
 * Run: node seed-items.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const db = require('../src/config/db');

// ─── Colour helpers for terminal output ───────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;  // green
const Y = (s) => `\x1b[33m${s}\x1b[0m`;  // yellow
const R = (s) => `\x1b[31m${s}\x1b[0m`;  // red
const B = (s) => `\x1b[34m${s}\x1b[0m`;  // blue
const DIM = (s) => `\x1b[2m${s}\x1b[0m`; // dim

async function seed() {
  console.log('');
  console.log(B('  ┌─────────────────────────────────────────────────────────┐'));
  console.log(B('  │  🎬  FilmDept University — Equipment Seed Script         │'));
  console.log(B('  └─────────────────────────────────────────────────────────┘'));
  console.log('');

  // ── 0. Ensure categories exist (idempotent) ──────────────────────────────────
  console.log(Y('  › Ensuring categories exist…'));
  await db.query(`
    INSERT INTO equipment_categories (name, buffer_hours, description)
    VALUES 
      ('Cameras',       24, 'High-end cinema and mirrorless camera bodies'),
      ('Lenses',         4, 'Prime and zoom photographic and cinema lenses'),
      ('Tripods',        4, 'Heavy-duty camera tripods, fluid heads, and slider tracks'),
      ('Lighting',       2, 'LED panels, softboxes, light stands, and C-stands'),
      ('Audio',          2, 'Shotgun mics, wireless lavaliers, and field recorders'),
      ('Cables',         0, 'HDMI, XLR, SDI, power cables, and adapters'),
      ('Grip Equipment', 1, 'Clamps, flags, sandbags, and general rigging accessories')
    ON CONFLICT (name) DO UPDATE
      SET buffer_hours = EXCLUDED.buffer_hours,
          description  = EXCLUDED.description
  `);

  // Fetch category IDs
  const catResult = await db.query(
    `SELECT id, name FROM equipment_categories WHERE is_active = TRUE`
  );
  const cat = {};
  catResult.rows.forEach((r) => { cat[r.name] = r.id; });
  console.log(G(`    ✓ ${Object.keys(cat).length} categories ready`));

  // ── 1. Insert equipment items ─────────────────────────────────────────────────
  console.log('');
  console.log(Y('  › Inserting equipment items…'));

  const items = [
    // ── Cameras ──
    {
      category: 'Cameras',
      name: 'Sony FX6 Cinema Camera',
      serial: 'SNY-FX6-001',
      description: 'Full-frame cinema camera with dual ISO up to 12,800. Includes body, battery grip, and V-lock plate.',
      condition: 'good',
      notes: 'Handle with care. Lens mount requires regular inspection.',
    },
    {
      category: 'Cameras',
      name: 'Blackmagic Pocket Cinema 6K G2',
      serial: 'BM-P6KG2-002',
      description: 'Super 35 sensor, 6K RAW recording. Requires LP-E6NH batteries (included in kit).',
      condition: 'good',
      notes: 'Check CFast card before checkout.',
    },
    {
      category: 'Cameras',
      name: 'Canon EOS R5 Mirrorless',
      serial: 'CAN-EOS-R5-003',
      description: '45MP full-frame mirrorless, 8K RAW internal video. RF mount.',
      condition: 'fair',
      notes: 'Minor scuff on bottom plate — cosmetic only. Fully functional.',
    },

    // ── Lenses ──
    {
      category: 'Lenses',
      name: 'Sigma 18-35mm f/1.8 Art (EF Mount)',
      serial: 'SIG-1835-004',
      description: 'Constant f/1.8 zoom, widely used for run-and-gun and narrative productions.',
      condition: 'good',
      notes: 'Comes with lens caps and UV filter. Check for dust before shooting.',
    },
    {
      category: 'Lenses',
      name: 'Canon RF 50mm f/1.2L USM',
      serial: 'CAN-RF50-005',
      description: 'Premium portrait and narrative prime for Canon RF mount. Ultra-fast autofocus.',
      condition: 'good',
    },

    // ── Tripods ──
    {
      category: 'Tripods',
      name: 'Sachtler Video 18 S2 Fluid Head Tripod',
      serial: 'SAC-V18-006',
      description: 'Professional fluid head with 18 kg payload. Includes spreader, case, and quick-release plate.',
      condition: 'good',
      notes: 'Balance the head before each use. Return with fluid head locked.',
    },
    {
      category: 'Tripods',
      name: 'Manfrotto 502 Aluminium Tripod Kit',
      serial: 'MAN-502-007',
      description: 'Mid-weight tripod with 502 head, ideal for documentary and run-and-gun shoots.',
      condition: 'fair',
      notes: 'Left leg locking lever is slightly stiff — functional but note at checkout.',
    },

    // ── Lighting ──
    {
      category: 'Lighting',
      name: 'Aputure 300D Mark II LED Light',
      serial: 'APT-300D-008',
      description: '300W daylight LED with Bowens mount, 5500K. Includes light dome, barn doors, and Bluetooth controller.',
      condition: 'good',
    },

    // ── Audio ──
    {
      category: 'Audio',
      name: 'Rode NTG5 Shotgun Microphone Kit',
      serial: 'ROD-NTG5-009',
      description: 'Broadcast-grade RF-biased shotgun mic. Includes pistol grip, windshield, Rycote mount, and XLR cable.',
      condition: 'good',
    },
    {
      category: 'Audio',
      name: 'Zoom H6 Field Recorder',
      serial: 'ZOM-H6-010',
      description: '6-track portable field recorder with interchangeable mic capsule. Accepts 4 XLR/TRS inputs.',
      condition: 'good',
      notes: 'Comes with AA batteries (replace before return). SD card not included.',
    },
  ];

  const insertedItems = {};
  let itemCount = 0;

  for (const item of items) {
    const catId = cat[item.category];
    if (!catId) {
      console.warn(R(`    ✗ Category not found: ${item.category} — skipping ${item.name}`));
      continue;
    }

    try {
      const res = await db.query(
        `INSERT INTO equipment_items (category_id, name, serial_number, description, condition, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (serial_number) DO UPDATE
           SET name        = EXCLUDED.name,
               description = EXCLUDED.description,
               condition   = EXCLUDED.condition,
               notes       = EXCLUDED.notes
         RETURNING id, name`,
        [catId, item.name, item.serial, item.description || null, item.condition, item.notes || null]
      );
      const row = res.rows[0];
      insertedItems[item.serial] = row.id;
      console.log(G(`    ✓ ${row.name}`) + DIM(` [${item.serial}]`));
      itemCount++;
    } catch (err) {
      console.error(R(`    ✗ Failed: ${item.name} — ${err.message}`));
    }
  }

  console.log('');
  console.log(Y('  › Creating kits…'));

  // ── 2. Create Kit: Documentary Run-and-Gun Kit ─────────────────────────────
  const kitRes = await db.query(
    `INSERT INTO kits (name, description)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING id, name`,
    [
      'Documentary Run-and-Gun Kit',
      'Essential kit for fast-moving documentary shoots. Camera, wide zoom, lightweight tripod, shotgun mic, and field recorder.',
    ]
  );

  let kitId = null;
  if (kitRes.rowCount > 0) {
    kitId = kitRes.rows[0].id;
    console.log(G(`    ✓ Kit: ${kitRes.rows[0].name}`));
  } else {
    // Kit already exists — fetch its ID
    const existing = await db.query(
      `SELECT id FROM kits WHERE name = $1 AND is_active = TRUE`,
      ['Documentary Run-and-Gun Kit']
    );
    if (existing.rowCount) {
      kitId = existing.rows[0].id;
      console.log(Y(`    ~ Kit already exists (reusing existing kit)`));
    }
  }

  // ── 3. Create Kit: Studio Narrative Kit ───────────────────────────────────
  const kit2Res = await db.query(
    `INSERT INTO kits (name, description)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING id, name`,
    [
      'Studio Narrative Kit',
      'High-quality studio setup for scripted narrative shoots. Cinema camera, fast prime, fluid head tripod, and LED light.',
    ]
  );

  let kit2Id = null;
  if (kit2Res.rowCount > 0) {
    kit2Id = kit2Res.rows[0].id;
    console.log(G(`    ✓ Kit: ${kit2Res.rows[0].name}`));
  } else {
    const existing = await db.query(
      `SELECT id FROM kits WHERE name = $1 AND is_active = TRUE`,
      ['Studio Narrative Kit']
    );
    if (existing.rowCount) {
      kit2Id = existing.rows[0].id;
      console.log(Y(`    ~ Kit 2 already exists (reusing existing kit)`));
    }
  }

  // ── 4. Add items to kits ───────────────────────────────────────────────────
  console.log('');
  console.log(Y('  › Adding items to kits…'));

  const kitMembers = {
    [kitId]: ['BM-P6KG2-002', 'SIG-1835-004', 'MAN-502-007', 'ROD-NTG5-009', 'ZOM-H6-010'],
    [kit2Id]: ['SNY-FX6-001', 'CAN-RF50-005', 'SAC-V18-006', 'APT-300D-008'],
  };

  for (const [kId, serials] of Object.entries(kitMembers)) {
    if (!kId || kId === 'null') continue;
    for (const serial of serials) {
      const itemId = insertedItems[serial];
      if (!itemId) {
        // Try to look up from DB (in case script is re-run)
        const lookup = await db.query(
          `SELECT id FROM equipment_items WHERE serial_number = $1`, [serial]
        );
        if (!lookup.rowCount) continue;
        insertedItems[serial] = lookup.rows[0].id;
      }
      try {
        await db.query(
          `INSERT INTO kit_items (kit_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [kId, insertedItems[serial]]
        );
        console.log(DIM(`    + linked ${serial} → kit`));
      } catch (err) {
        console.error(R(`    ✗ kit_items error: ${err.message}`));
      }
    }
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const finalItems = await db.query(`SELECT COUNT(*) FROM equipment_items WHERE is_active = TRUE`);
  const finalKits  = await db.query(`SELECT COUNT(*) FROM kits WHERE is_active = TRUE`);

  console.log('');
  console.log(B('  ┌─────────────────────────────────────────────────────────┐'));
  console.log(B(`  │  ✅  Seed complete!                                      │`));
  console.log(B(`  │  📦  Equipment items : ${String(finalItems.rows[0].count).padEnd(33)}│`));
  console.log(B(`  │  🎒  Kits            : ${String(finalKits.rows[0].count).padEnd(33)}│`));
  console.log(B('  └─────────────────────────────────────────────────────────┘'));
  console.log('');

  await db.pool.end();
}

seed().catch((err) => {
  console.error(R('\n  ✗ Seed script failed:'), err.message);
  console.error(err.stack);
  process.exit(1);
});
