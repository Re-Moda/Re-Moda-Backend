-- Add is_unused and unused_at columns to ClothingItem table
-- This script fixes the production database issue

-- Add is_unused column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'is_unused'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added is_unused column';
    ELSE
        RAISE NOTICE 'is_unused column already exists';
    END IF;
END $$;

-- Add unused_at column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'unused_at'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3);
        RAISE NOTICE 'Added unused_at column';
    ELSE
        RAISE NOTICE 'unused_at column already exists';
    END IF;
END $$; 