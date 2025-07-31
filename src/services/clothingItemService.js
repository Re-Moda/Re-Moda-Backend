const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createClothingItem({ closetId, category, label, description, generatedImageUrl, tag, originalImageUrl }) {
  try {
    return await prisma.clothingItem.create({
      data: {
        closet: { connect: { id: Number(closetId) } },
        category: { connect: { id: Number(category) } },
        label,
        description,
        image_key: generatedImageUrl,
        ai_tag: tag,
        original_image_url: originalImageUrl,
        bucket: {
          connectOrCreate: {
            where: { name: "clothing-items-remoda" }, // or process.env.S3_BUCKET_NAME
            create: { 
              name: "clothing-items-remoda",
              region: "us-east-2"
             }
          }
        }
      },
    });
  } catch (error) {
    console.error('Error in createClothingItem:', error);
    throw new Error('Failed to create clothing item');
  }
}

async function getClothingItems(userId) {
  try {
    return await prisma.clothingItem.findMany({
      where: {
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true,
        closet: true
      }
    });
  } catch (error) {
    console.error('Error in getClothingItems:', error);
    throw new Error('Failed to fetch clothing items');
  }
}

async function uploadClothingItem(data) {
  // Placeholder for future implementation
  throw new Error('Not implemented');
}

async function getClothingItemById(id) {
  try {
    const item = await prisma.clothingItem.findUnique({ where: { id: Number(id) } });
    if (!item) return null;
    return item;
  } catch (error) {
    console.error('Error in getClothingItemById:', error);
    throw new Error('Failed to fetch clothing item');
  }
}

async function updateClothingItem(id, data) {
  try {
    const item = await prisma.clothingItem.update({ where: { id: Number(id) }, data });
    return item;
  } catch (error) {
    console.error('Error in updateClothingItem:', error);
    throw new Error('Failed to update clothing item');
  }
}

async function deleteClothingItem(id) {
  try {
    // First, delete any related outfit-clothing item associations
    await prisma.outfitClothingItem.deleteMany({
      where: { clothing_item_id: Number(id) }
    });
    
    // Then delete the clothing item itself
    await prisma.clothingItem.delete({ 
      where: { id: Number(id) } 
    });
    
    return { success: true, message: 'Clothing item deleted successfully' };
  } catch (error) {
    console.error('Error in deleteClothingItem:', error);
    throw new Error('Failed to delete clothing item');
  }
}

async function wearClothingItem(id) {
  try {
    // Example: increment wear_count and update last_worn_at
    const item = await prisma.clothingItem.update({
      where: { id: Number(id) },
      data: {
        wear_count: { increment: 1 },
        last_worn_at: new Date()
      }
    });
    return item;
  } catch (error) {
    console.error('Error in wearClothingItem:', error);
    throw new Error('Failed to update wear count');
  }
}

module.exports = {
  createClothingItem,
  getClothingItems,
  uploadClothingItem,
  getClothingItemById,
  updateClothingItem,
  deleteClothingItem,
  wearClothingItem
};
