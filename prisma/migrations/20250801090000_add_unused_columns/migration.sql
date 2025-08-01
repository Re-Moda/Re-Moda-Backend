-- AlterTable
ALTER TABLE "ClothingItem" ADD COLUMN     "is_unused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unused_at" TIMESTAMP(3); 