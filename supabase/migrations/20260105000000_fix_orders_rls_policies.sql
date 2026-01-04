-- Disable Row Level Security on all tables
-- This allows full CRUD operations from the frontend

-- Orders table
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;

-- Articles table
ALTER TABLE IF EXISTS articles DISABLE ROW LEVEL SECURITY;

-- FAQs table
ALTER TABLE IF EXISTS faqs DISABLE ROW LEVEL SECURITY;

-- Guides table
ALTER TABLE IF EXISTS guides DISABLE ROW LEVEL SECURITY;

-- Guide topics table
ALTER TABLE IF EXISTS guide_topics DISABLE ROW LEVEL SECURITY;

-- Site settings table
ALTER TABLE IF EXISTS site_settings DISABLE ROW LEVEL SECURITY;
