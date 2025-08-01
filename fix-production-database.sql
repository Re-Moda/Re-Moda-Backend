-- Fix Production Database - Add Missing Columns
-- This script adds all missing columns to the production database

-- 1. Add avatar_id to User table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar_id'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "avatar_id" INTEGER DEFAULT 1;
        RAISE NOTICE 'Added avatar_id column to User table';
    ELSE
        RAISE NOTICE 'avatar_id column already exists in User table';
    END IF;
END $$;

-- 2. Add is_unused to ClothingItem table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'is_unused'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added is_unused column to ClothingItem table';
    ELSE
        RAISE NOTICE 'is_unused column already exists in ClothingItem table';
    END IF;
END $$;

-- 3. Add unused_at to ClothingItem table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'unused_at'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3);
        RAISE NOTICE 'Added unused_at column to ClothingItem table';
    ELSE
        RAISE NOTICE 'unused_at column already exists in ClothingItem table';
    END IF;
END $$;

-- 4. Add ai_tag to ClothingItem table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'ai_tag'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "ai_tag" TEXT;
        RAISE NOTICE 'Added ai_tag column to ClothingItem table';
    ELSE
        RAISE NOTICE 'ai_tag column already exists in ClothingItem table';
    END IF;
END $$;

-- 5. Add original_image_url to ClothingItem table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClothingItem' AND column_name = 'original_image_url'
    ) THEN
        ALTER TABLE "ClothingItem" ADD COLUMN "original_image_url" TEXT;
        RAISE NOTICE 'Added original_image_url column to ClothingItem table';
    ELSE
        RAISE NOTICE 'original_image_url column already exists in ClothingItem table';
    END IF;
END $$;

-- 6. Add role to User table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'user';
        RAISE NOTICE 'Added role column to User table';
    ELSE
        RAISE NOTICE 'role column already exists in User table';
    END IF;
END $$;

-- 7. Add google_id to User table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "google_id" TEXT;
        RAISE NOTICE 'Added google_id column to User table';
    ELSE
        RAISE NOTICE 'google_id column already exists in User table';
    END IF;
END $$;

-- 8. Add avatar_url to User table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "avatar_url" TEXT;
        RAISE NOTICE 'Added avatar_url column to User table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in User table';
    END IF;
END $$;

-- 9. Add avatar_key to User table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar_key'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "avatar_key" TEXT;
        RAISE NOTICE 'Added avatar_key column to User table';
    ELSE
        RAISE NOTICE 'avatar_key column already exists in User table';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('User', 'ClothingItem')
ORDER BY table_name, column_name; 