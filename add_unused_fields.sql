-- Add missing columns to ClothingItem table
-- This migration adds the is_unused and unused_at fields that are referenced in the code

-- Add is_unused column with default value false
ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false;

-- Add unused_at column (nullable)
ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3);

-- Add a comment to document the change
COMMENT ON COLUMN "ClothingItem"."is_unused" IS 'Indicates if the clothing item is marked as unused';
COMMENT ON COLUMN "ClothingItem"."unused_at" IS 'Timestamp when the item was marked as unused'; 