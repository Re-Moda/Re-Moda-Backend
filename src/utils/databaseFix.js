const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Checking and fixing database schema...');
    
    // Check if avatar_id column exists in User table
    const userColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'avatar_id'
    `;
    
    if (userColumns.length === 0) {
      console.log('➕ Adding avatar_id column to User table...');
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "avatar_id" INTEGER DEFAULT 1`;
      console.log('✅ avatar_id column added successfully');
    } else {
      console.log('✅ avatar_id column already exists');
    }
    
    // Check if is_unused column exists in ClothingItem table
    const clothingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ClothingItem' AND column_name IN ('is_unused', 'unused_at')
    `;
    
    const existingColumns = clothingColumns.map(col => col.column_name);
    
    if (!existingColumns.includes('is_unused')) {
      console.log('➕ Adding is_unused column to ClothingItem table...');
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false`;
      console.log('✅ is_unused column added successfully');
    } else {
      console.log('✅ is_unused column already exists');
    }
    
    if (!existingColumns.includes('unused_at')) {
      console.log('➕ Adding unused_at column to ClothingItem table...');
      await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "unused_at" TIMESTAMP(3)`;
      console.log('✅ unused_at column added successfully');
    } else {
      console.log('✅ unused_at column already exists');
    }
    
    console.log('🎉 Database schema check and fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    // Don't throw error - just log it so app can continue
  } finally {
    await prisma.$disconnect();
  }
}

// If this file is run directly, execute the fix
if (require.main === module) {
  fixDatabaseSchema().then(() => {
    console.log('✅ Database fix completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  });
}

module.exports = { fixDatabaseSchema }; 