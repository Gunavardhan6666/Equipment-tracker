-- Default Seed Data for Categories with Specific Buffer Times
-- Cameras: 24h, Cables: 0h, Tripods: 4h, Lighting: 2h, Audio: 2h, Others: 1h

INSERT INTO equipment_categories (name, buffer_hours, description)
VALUES 
    ('Cameras', 24, 'High-end cinema and mirrorless camera bodies'),
    ('Cables', 0, 'HDMI, XLR, SDI, power cables, and adapters'),
    ('Tripods', 4, 'Heavy-duty camera tripods, fluid heads, and slider tracks'),
    ('Lighting', 2, 'LED panels, softboxes, light stands, and C-stands'),
    ('Audio', 2, 'Shotgun mics, wireless lavaliers, and field recorders'),
    ('Lenses', 4, 'Prime and zoom photographic and cinema lenses'),
    ('Grip Equipment', 1, 'Clamps, flags, sandbags, and general rigging accessories')
ON CONFLICT (name) DO UPDATE 
SET buffer_hours = EXCLUDED.buffer_hours, 
    description = EXCLUDED.description;
