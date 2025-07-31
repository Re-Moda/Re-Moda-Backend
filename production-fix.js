// Production Database Fix Script
// Run this on the production server to add missing columns

const { PrismaClient } = require('@prisma/client');

async function fixProductionDB() {
  console.log('🔧 Fixing production database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Add is_unused column
    console.log('Adding is_unused column...');
    await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN IF NOT EXISTS "is_unused" BOOLEAN NOT NULL DEFAULT false`;
    
    // Add unused_at column  
    console.log('Adding unused_at column...');
    await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN IF NOT EXISTS "unused_at" TIMESTAMP(3)`;
    
    console.log('✅ Database columns added successfully!');
    
    // Test the fix
    const testItem = await prisma.clothingItem.findFirst({
      select: { id: true, is_unused: true, unused_at: true }
    });
    
    console.log('✅ Test query successful:', testItem);
    console.log('🎉 Production database is now fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionDB(); 