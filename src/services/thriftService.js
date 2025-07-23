const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUnusedItems({ userId, location } = {}) {
  const where = { status: 'unused' };
  if (userId) where.user_id = userId;
  // Add location filter if needed
  return prisma.clothingItem.findMany({ where });
}

module.exports = { getUnusedItems };
