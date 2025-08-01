-- AlterTable
ALTER TABLE "ClothingItem" ADD COLUMN     "is_unused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unused_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_id" INTEGER DEFAULT 1;
