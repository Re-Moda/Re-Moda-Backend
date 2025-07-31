// Production Startup Script
// This ensures the database is properly migrated before starting the server

const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');

async function ensureDatabaseMigration() {
  console.log('🔧 Ensuring database migration...');
  
  const prisma = new PrismaClient();
  
  try {
    // Add missing columns if they don't exist
    console.log('Adding missing columns...');
    await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN IF NOT EXISTS "is_unused" BOOLEAN NOT NULL DEFAULT false`;
    await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN IF NOT EXISTS "unused_at" TIMESTAMP(3)`;
    
    console.log('✅ Database migration completed');
    
    // Test that everything works
    const testQuery = await prisma.clothingItem.findFirst({
      select: { id: true, is_unused: true, unused_at: true }
    });
    
    console.log('✅ Database test successful');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function startServer() {
  try {
    // Ensure database is migrated
    await ensureDatabaseMigration();
    
    console.log('🚀 Starting server...');
    
    // Start the server
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: process.env
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

// Start the production server
startServer(); 