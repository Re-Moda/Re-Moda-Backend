const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createClothingItem({ userId, closetId, categoryId, label, description, imageUrl }) {
  return prisma.clothingItem.create({
    data: {
      closet: { connect: { id: Number(closetId) } },
      category: { connect: { id: Number(categoryId) } },
      label,
      description,
      bucket_name: process.env.S3_BUCKET_NAME,
      image_key: imageUrl, // or just the S3 key if you want
      user_id: userId,
    },
  });
}

async function markAsUnused(itemId, userId) {
  // Find the item and check ownership
  const item = await prisma.clothingItem.findUnique({ where: { id: itemId } });
  if (!item || item.user_id !== userId) return false;
  await prisma.clothingItem.update({ where: { id: itemId }, data: { status: 'unused' } });
  return true;
}

module.exports = {
  async createClothingItem(/* data */) { return {}; },
  async getClothingItems(/* filters */) { return []; },
  async uploadClothingItem(/* data */) { return {}; },
  async getClothingItemById(/* id */) { return null; },
  async updateClothingItem(/* id, data */) { return {}; },
  async deleteClothingItem(/* id */) { return true; },
  async wearClothingItem(/* id */) { return {}; },
  markAsUnused,
};
