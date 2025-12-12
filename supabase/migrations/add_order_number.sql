-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Backfill existing orders with sequential numbers (optional)
-- This will give existing orders TPL# numbers based on their creation date
DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM orders WHERE order_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE orders 
    SET order_number = 'TPL#' || LPAD(counter::TEXT, 3, '0')
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Make order_number NOT NULL after backfill (optional, for data integrity)
-- ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
