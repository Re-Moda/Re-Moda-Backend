const { PrismaClient } = require('@prisma/client');

async function fixProductionDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Checking production database...');
    
    // Check if the columns exist
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ClothingItem' 
      AND column_name IN ('is_unused', 'unused_at')
    `;
    
    console.log('Current ClothingItem columns:', tableInfo);
    
    // Add is_unused column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false`;
      console.log('✅ Added is_unused column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ is_unused column already exists');
      } else {
        console.error('❌ Error adding is_unused column:', error.message);
      }
    }
    
    // Add unused_at column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3)`;
      console.log('✅ Added unused_at column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ unused_at column already exists');
      } else {
        console.error('❌ Error adding unused_at column:', error.message);
      }
    }
    
    // Verify the columns exist
    const finalTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ClothingItem' 
      AND column_name IN ('is_unused', 'unused_at')
    `;
    
    console.log('✅ Final ClothingItem columns:', finalTableInfo);
    
    // Test a simple query to make sure everything works
    const testQuery = await prisma.clothingItem.findMany({
      take: 1,
      select: {
        id: true,
        is_unused: true,
        unused_at: true
      }
    });
    
    console.log('✅ Test query successful:', testQuery);
    console.log('🎉 Production database fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionDatabase(); 