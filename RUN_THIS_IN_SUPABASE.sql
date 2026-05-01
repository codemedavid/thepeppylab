-- =====================================================
-- CONSOLIDATED FIX: orders + vouchers + columns + RLS
-- Paste this entire file into Supabase SQL Editor and Run.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards).
-- =====================================================

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_barangay TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip_code TEXT NOT NULL,
  shipping_country TEXT,
  shipping_location TEXT,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  courier_name TEXT,
  order_items JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method_id TEXT,
  payment_method_name TEXT,
  payment_proof_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  contact_method TEXT,
  order_status TEXT DEFAULT 'new',
  notes TEXT,
  voucher_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD ANY MISSING COLUMNS (for already-existing orders tables)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_barangay TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_location TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Make sure customer_email is nullable (phone-fallback checkout)
ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL;

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. DISABLE RLS so checkout can insert
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 6. VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_spend DECIMAL(10, 2) DEFAULT 0,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION increment_voucher_usage(voucher_code TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE vouchers
  SET times_used = times_used + 1
  WHERE code = voucher_code;
END;
$$;
