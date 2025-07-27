require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://re_moda_database_user:CpZLxsrP9pOoX4XOZMe663eiqF0YwILO@dpg-d220nh63jp1c738d6ang-a.oregon-postgres.render.com/re_moda_database'
    }
  }
});

async function addTestUser() {
  try {
    console.log('Connecting to production database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully!');
    
    // Check if tables exist
    const userCount = await prisma.user.count();
    console.log('Current users in database:', userCount);
    
    // Create test user
    const password_hash = await bcrypt.hash('test123', 10);
    const security_answer_hash = await bcrypt.hash('test', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password_hash,
        security_question: 'What is your favorite color?',
        security_answer_hash,
        role: 'user'
      }
    });
    
    console.log('Test user created successfully:', user.username);
    
    // Create closet for the user
    const closet = await prisma.closet.create({
      data: {
        user_id: user.id,
        name: 'My Closet'
      }
    });
    
    console.log('Closet created for user');
    
    // Create categories for the user
    const categories = await prisma.category.createMany({
      data: [
        { user_id: user.id, title: 'Top' },
        { user_id: user.id, title: 'Bottom' },
        { user_id: user.id, title: 'Shoe' }
      ]
    });
    
    console.log('Categories created for user');
    
    console.log('✅ Test user setup complete!');
    console.log('Username: testuser');
    console.log('Password: test123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestUser(); 