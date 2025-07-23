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

module.exports = {
  async createClothingItem(/* data */) { return {}; },
  async getClothingItems(/* filters */) { return []; },
  async uploadClothingItem(/* data */) { return {}; },
  async getClothingItemById(/* id */) { return null; },
  async updateClothingItem(/* id, data */) { return {}; },
  async deleteClothingItem(/* id */) { return true; },
  async wearClothingItem(/* id */) { return {}; }
};
