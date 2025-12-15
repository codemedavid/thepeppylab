DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'courier_name') THEN 
        ALTER TABLE orders ADD COLUMN courier_name text; 
    END IF; 
END $$;
