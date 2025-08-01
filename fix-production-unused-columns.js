const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProductionUnusedColumns() {
  try {
    console.log('🔧 Fixing production database - adding is_unused and unused_at columns...');
    
    // Check if columns already exist
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ClothingItem' 
      AND column_name IN ('is_unused', 'unused_at')
    `;
    
    console.log('Current columns:', tableInfo);
    
    // Add is_unused column if it doesn't exist
    if (!tableInfo.find(col => col.column_name === 'is_unused')) {
      console.log('➕ Adding is_unused column...');
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false`;
      console.log('✅ is_unused column added successfully');
    } else {
      console.log('✅ is_unused column already exists');
    }
    
    // Add unused_at column if it doesn't exist
    if (!tableInfo.find(col => col.column_name === 'unused_at')) {
      console.log('➕ Adding unused_at column...');
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3)`;
      console.log('✅ unused_at column added successfully');
    } else {
      console.log('✅ unused_at column already exists');
    }
    
    console.log('🎉 Production database fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionUnusedColumns(); 