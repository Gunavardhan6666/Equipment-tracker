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
    INSERT INTO equipment_categories (name, prefix, buffer_hours, description)
    VALUES 
      ('Cameras',        'CAM', 24, 'High-end cinema and mirrorless camera bodies'),
      ('Lenses',         'LEN',  4, 'Prime and zoom photographic and cinema lenses'),
      ('Tripods',        'TRI',  4, 'Heavy-duty camera tripods, fluid heads, and slider tracks'),
      ('Lighting',       'LIT',  2, 'LED panels, softboxes, light stands, and C-stands'),
      ('Audio',          'AUD',  2, 'Shotgun mics, wireless lavaliers, and field recorders'),
      ('Cables',         'CBL',  0, 'HDMI, XLR, SDI, power cables, and adapters'),
      ('Grip Equipment', 'GRP',  1, 'Clamps, flags, sandbags, and general rigging accessories')
    ON CONFLICT (name) DO UPDATE
      SET prefix       = EXCLUDED.prefix,
          buffer_hours = EXCLUDED.buffer_hours,
          description  = EXCLUDED.description
  `);

  // Fetch category IDs
  const catResult = await db.query(
    `SELECT id, name FROM equipment_categories WHERE is_active = TRUE`
  );
  const cat = {};
  catResult.rows.forEach((r) => { cat[r.name] = r.id; });
  console.log(G(`    ✓ ${Object.keys(cat).length} categories ready`));

  // ── 1. Insert equipment items (Multiple Instances) ───────────────────────────
  console.log('');
  console.log(Y('  › Inserting equipment items…'));

  const itemsConfig = [
    // ── Cameras ──
    {
      category: 'Cameras',
      name: 'Sony FX6 Cinema Camera',
      description: 'Full-frame cinema camera with dual ISO up to 12,800. Includes body, battery grip, and V-lock plate.',
      instances: [
        { condition: 'good', notes: 'Handle with care. Lens mount requires regular inspection.' },
        { condition: 'fair', notes: 'Minor scuff on side panel.' },
      ],
    },
    {
      category: 'Cameras',
      name: 'Blackmagic Pocket Cinema 6K G2',
      description: 'Super 35 sensor, 6K RAW recording. Requires LP-E6NH batteries (included in kit).',
      instances: [
        { condition: 'good', notes: 'Check CFast card before checkout.' },
        { condition: 'good' },
        { condition: 'damaged', notes: 'Screen cracked.' },
      ],
    },
    {
      category: 'Cameras',
      name: 'Canon EOS R5 Mirrorless',
      description: '45MP full-frame mirrorless, 8K RAW internal video. RF mount.',
      instances: [
        { condition: 'fair', notes: 'Minor scuff on bottom plate — cosmetic only. Fully functional.' },
      ],
    },

    // ── Lenses ──
    {
      category: 'Lenses',
      name: 'Sigma 18-35mm f/1.8 Art (EF Mount)',
      description: 'Constant f/1.8 zoom, widely used for run-and-gun and narrative productions.',
      instances: [
        { condition: 'good', notes: 'Comes with lens caps and UV filter. Check for dust before shooting.' },
        { condition: 'good' },
      ],
    },
    {
      category: 'Lenses',
      name: 'Canon RF 50mm f/1.2L USM',
      description: 'Premium portrait and narrative prime for Canon RF mount. Ultra-fast autofocus.',
      instances: [
        { condition: 'good' },
      ],
    },

    // ── Tripods ──
    {
      category: 'Tripods',
      name: 'Sachtler Video 18 S2 Fluid Head Tripod',
      description: 'Professional fluid head with 18 kg payload. Includes spreader, case, and quick-release plate.',
      instances: [
        { condition: 'good', notes: 'Balance the head before each use. Return with fluid head locked.' },
        { condition: 'fair' },
      ],
    },
    {
      category: 'Tripods',
      name: 'Manfrotto 502 Aluminium Tripod Kit',
      description: 'Mid-weight tripod with 502 head, ideal for documentary and run-and-gun shoots.',
      instances: [
        { condition: 'fair', notes: 'Left leg locking lever is slightly stiff — functional but note at checkout.' },
        { condition: 'good' },
      ],
    },

    // ── Lighting ──
    {
      category: 'Lighting',
      name: 'Aputure 300D Mark II LED Light',
      description: '300W daylight LED with Bowens mount, 5500K. Includes light dome, barn doors, and Bluetooth controller.',
      instances: [
        { condition: 'good' },
        { condition: 'good' },
      ],
    },

    // ── Audio ──
    {
      category: 'Audio',
      name: 'Rode NTG5 Shotgun Microphone Kit',
      description: 'Broadcast-grade RF-biased shotgun mic. Includes pistol grip, windshield, Rycote mount, and XLR cable.',
      instances: [
        { condition: 'good' },
        { condition: 'good' },
      ],
    },
    {
      category: 'Audio',
      name: 'Zoom H6 Field Recorder',
      description: '6-track portable field recorder with interchangeable mic capsule. Accepts 4 XLR/TRS inputs.',
      instances: [
        { condition: 'good', notes: 'Comes with AA batteries (replace before return). SD card not included.' },
        { condition: 'good' },
      ],
    },
  ];

  // We need the prefixes to generate serials
  const catPrefixes = {};
  const prefixRes = await db.query(`SELECT name, prefix FROM equipment_categories`);
  prefixRes.rows.forEach(r => { catPrefixes[r.name] = r.prefix; });

  let itemCount = 0;
  const serialCounters = {};

  // First delete old instances for a clean seed
  await db.query(`DELETE FROM kit_items`);
  await db.query(`DELETE FROM condition_logs`);
  await db.query(`DELETE FROM reservations`);
  await db.query(`DELETE FROM equipment_items`);

  for (const group of itemsConfig) {
    const catId = cat[group.category];
    const prefix = catPrefixes[group.category];
    
    if (!catId || !prefix) {
      console.warn(R(`    ✗ Category/Prefix not found: ${group.category} — skipping ${group.name}`));
      continue;
    }

    if (!serialCounters[prefix]) serialCounters[prefix] = 1;

    for (const instance of group.instances) {
      const serial = `${prefix}-${String(serialCounters[prefix]++).padStart(3, '0')}`;
      
      try {
        const res = await db.query(
          `INSERT INTO equipment_items (category_id, name, serial_number, description, condition, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, serial_number`,
          [catId, group.name, serial, group.description || null, instance.condition, instance.notes || null]
        );
        const row = res.rows[0];
        console.log(G(`    ✓ ${row.name}`) + DIM(` [${row.serial_number}] - Condition: ${instance.condition}`));
        itemCount++;
      } catch (err) {
        console.error(R(`    ✗ Failed: ${group.name} (${serial}) — ${err.message}`));
      }
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
  console.log(Y('  › Adding items to kits (Quantity based)…'));

  const kitMembers = {
    [kitId]: [
      { name: 'Blackmagic Pocket Cinema 6K G2', qty: 1 },
      { name: 'Sigma 18-35mm f/1.8 Art (EF Mount)', qty: 1 },
      { name: 'Manfrotto 502 Aluminium Tripod Kit', qty: 1 },
      { name: 'Rode NTG5 Shotgun Microphone Kit', qty: 1 },
      { name: 'Zoom H6 Field Recorder', qty: 1 },
    ],
    [kit2Id]: [
      { name: 'Sony FX6 Cinema Camera', qty: 1 },
      { name: 'Canon RF 50mm f/1.2L USM', qty: 1 },
      { name: 'Sachtler Video 18 S2 Fluid Head Tripod', qty: 1 },
      { name: 'Aputure 300D Mark II LED Light', qty: 2 },
    ],
  };

  for (const [kId, itemsReq] of Object.entries(kitMembers)) {
    if (!kId || kId === 'null') continue;
    for (const req of itemsReq) {
      try {
        await db.query(
          `INSERT INTO kit_items (kit_id, equipment_name, quantity) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [kId, req.name, req.qty]
        );
        console.log(DIM(`    + linked ${req.qty}x ${req.name} → kit`));
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
