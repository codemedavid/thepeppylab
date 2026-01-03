-- Add hero section settings to site_settings table
-- These settings allow admins to customize the homepage hero section

-- Insert hero settings (upsert to avoid conflicts)
INSERT INTO site_settings (id, value, type, description) VALUES
  ('hero_title', 'Welcome to The Peppy Lab', 'text', 'Main headline text for the hero section'),
  ('hero_subtitle', 'At Peppy Lab, we offer high-quality peptides to support weight loss, glowing skin, wellness, and confidence. Because looking and feeling your best doesn''t have to be expensive. 💕', 'text', 'Subheadline text below the main title'),
  ('hero_image_url', '', 'image', 'Background image URL for the hero section (leave empty for gradient background)'),
  ('hero_video_url', '', 'text', 'Background video URL for the hero section (optional)'),
  ('hero_cta_text', 'Shop All Products', 'text', 'Primary call-to-action button text'),
  ('hero_cta_link', '/', 'text', 'Primary call-to-action button link'),
  ('hero_cta_secondary_text', 'Start Assessment', 'text', 'Secondary call-to-action button text'),
  ('hero_cta_secondary_link', '/assessment', 'text', 'Secondary call-to-action button link'),
  ('hero_overlay_opacity', '0', 'number', 'Background overlay opacity (0-100)'),
  ('hero_overlay_color', '#000000', 'text', 'Background overlay color (hex code)'),
  ('hero_badge_text', '🧪 Peptides & Essentials', 'text', 'Badge text shown above the headline')
ON CONFLICT (id) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  description = EXCLUDED.description;

-- Add index for faster hero settings lookup
CREATE INDEX IF NOT EXISTS idx_site_settings_hero ON site_settings (id) WHERE id LIKE 'hero_%';
