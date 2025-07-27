require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Production database URL
const PRODUCTION_DATABASE_URL = 'postgresql://re_moda_database_user:CpZLxsrP9pOoX4XOZMe663eiqF0YwILO@dpg-d220nh63jp1c738d6ang-a.oregon-postgres.render.com/re_moda_database';

async function migrateProduction() {
  try {
    console.log('🔄 Starting production database migration...');
    
    // Set the production database URL as environment variable
    process.env.DATABASE_URL = PRODUCTION_DATABASE_URL;
    
    console.log('📊 Testing database connection...');
    
    // Test connection
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Run Prisma migrations
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma db push --schema=./prisma/schema.prisma', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: PRODUCTION_DATABASE_URL }
    });
    
    console.log('✅ Production database migration complete!');
    
    // Test if tables were created
    const userCount = await prisma.user.count();
    console.log(`📊 Users in production database: ${userCount}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateProduction(); 