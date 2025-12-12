-- Migration: Add complete set pricing fields to products table
-- This allows products to have a special "complete set" option with accessories

-- Add complete set fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_complete_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS complete_set_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS complete_set_description TEXT DEFAULT NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN products.is_complete_set IS 'Whether this product is available as a complete set with accessories';
COMMENT ON COLUMN products.complete_set_price IS 'Special pricing when purchased as a complete set (includes accessories)';
COMMENT ON COLUMN products.complete_set_description IS 'Description of what is included in the complete set';

-- Create index for querying complete set products
CREATE INDEX IF NOT EXISTS idx_products_complete_set ON products(is_complete_set) WHERE is_complete_set = true;
