-- Create COA (Certificate of Analysis) table for HP GLOW
-- This ensures the coa_reports table exists with the correct schema

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS coa_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  batch TEXT,
  test_date DATE NOT NULL,
  purity_percentage DECIMAL(5,3) NOT NULL,
  quantity TEXT NOT NULL,
  task_number TEXT NOT NULL,
  verification_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  manufacturer TEXT DEFAULT 'HP GLOW',
  laboratory TEXT DEFAULT 'Janoshik Analytical',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coa_reports_product_name ON coa_reports(product_name);
CREATE INDEX IF NOT EXISTS idx_coa_reports_featured ON coa_reports(featured);
CREATE INDEX IF NOT EXISTS idx_coa_reports_test_date ON coa_reports(test_date DESC);

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger (drop first if exists)
DROP TRIGGER IF EXISTS update_coa_reports_updated_at ON coa_reports;
CREATE TRIGGER update_coa_reports_updated_at 
  BEFORE UPDATE ON coa_reports
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE coa_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to coa_reports" ON coa_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert coa_reports" ON coa_reports;
DROP POLICY IF EXISTS "Allow authenticated users to update coa_reports" ON coa_reports;
DROP POLICY IF EXISTS "Allow authenticated users to delete coa_reports" ON coa_reports;
DROP POLICY IF EXISTS "Allow public full access to coa_reports" ON coa_reports;

-- Create RLS policies - Allow full public access
-- (Admin dashboard is protected by password, not database auth)
CREATE POLICY "Allow public full access to coa_reports" 
  ON coa_reports 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coa_reports') THEN
    RAISE NOTICE '✅ COA reports table created successfully!';
  ELSE
    RAISE EXCEPTION '❌ Failed to create coa_reports table';
  END IF;
END $$;
