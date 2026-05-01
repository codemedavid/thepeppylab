-- Clear broken image URLs.
-- "A server with the specified hostname could not be found" means the saved
-- URLs point to a Supabase storage host that no longer resolves.

-- 1) Products
UPDATE products SET image_url = NULL;

-- 2) Site settings (hero_image_url, logo_url, etc. — stored as key/value rows)
UPDATE site_settings
SET value = ''
WHERE id ILIKE '%image%' OR id ILIKE '%logo%' OR id ILIKE '%video%';

-- 3) Find any remaining references to the two broken filenames so we can
--    track down which table they live in (run this AFTER the updates above).
SELECT 'products' AS source, id::text AS row_id, name AS label, image_url AS url
FROM products
WHERE image_url IS NOT NULL
UNION ALL
SELECT 'site_settings', id, id, value
FROM site_settings
WHERE value ILIKE '%1765566468278%' OR value ILIKE '%1765562977950%';
