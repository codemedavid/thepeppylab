-- 1. Order Number Logic
-- Create a sequence for order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Sync the sequence with the existing highest order number to ensure continuity
DO $$
DECLARE
    max_val INTEGER;
BEGIN
    -- Extract the numeric part from 'TPL#xxx' and find the max
    SELECT COALESCE(MAX(NULLIF(regexp_replace(order_number, '\D', '', 'g'), '')::INTEGER), 0) 
    INTO max_val 
    FROM orders 
    WHERE order_number LIKE 'TPL#%';
    
    -- If we found existing orders, update sequence. If 0, it starts from 1.
    IF max_val > 0 THEN
        PERFORM setval('order_number_seq', max_val);
    END IF;
END $$;

-- Function to automatically assign TPL# order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if not provided (though we will stop providing it from frontend)
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'TPL#' || LPAD(nextval('order_number_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();


-- 2. Stock Deduction Logic
-- Function to deduct stock based on order_items JSON
CREATE OR REPLACE FUNCTION deduct_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item jsonb;
    v_product_id uuid;
    v_variation_id uuid;
    v_quantity int;
BEGIN
    -- Loop through each item in the order_items JSON array
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.order_items)
    LOOP
        v_product_id := (item->>'product_id')::uuid;
        v_quantity := (item->>'quantity')::int;
        
        -- Check if it is a variation or a main product
        IF item->>'variation_id' IS NOT NULL AND item->>'variation_id' != 'null' THEN
            v_variation_id := (item->>'variation_id')::uuid;
            
            -- Deduct from product_variations
            UPDATE product_variations
            SET stock_quantity = stock_quantity - v_quantity
            WHERE id = v_variation_id;
        ELSE
            -- Deduct from products (main product stock)
            UPDATE products
            SET stock_quantity = stock_quantity - v_quantity
            WHERE id = v_product_id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after insert (deduct stock once order is created)
DROP TRIGGER IF EXISTS trigger_deduct_stock ON orders;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_on_order();
