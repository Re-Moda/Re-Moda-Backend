const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List outfits for user (supports ?favorite=, ?recurring=)
const getOutfits = async (userId, filters = {}) => {
  try {
    const where = { user_id: userId };
    if (filters.favorite !== undefined) {
      where.is_favorite = filters.favorite === 'true';
    }
    if (filters.recurring !== undefined) {
      where.is_recurring = filters.recurring === 'true';
    }
    const outfits = await prisma.outfit.findMany({
      where,
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: {
              include: {
                category: true,
                closet: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    return outfits;
  } catch (error) {
    console.error('Error in getOutfits:', error);
    throw new Error('Failed to fetch outfits');
  }
};

// Create a new outfit with selected items
const createOutfit = async (userId, outfitData) => {
  try {
    const { title, clothingItemIds, is_favorite, is_recurring } = outfitData;
    const outfit = await prisma.outfit.create({
      data: {
        user_id: userId,
        title,
        is_favorite,
        is_recurring,
        outfitClothingItems: {
          create: clothingItemIds.map(itemId => ({
            clothing_item_id: itemId
          }))
        }
      },
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: {
              include: {
                category: true,
                closet: true
              }
            }
          }
        }
      }
    });
    return outfit;
  } catch (error) {
    console.error('Error in createOutfit:', error);
    throw new Error('Failed to create outfit');
  }
};

// Get details for a specific outfit
const getOutfitById = async (userId, outfitId) => {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      },
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: {
              include: {
                category: true,
                closet: true
              }
            }
          }
        }
      }
    });
    if (!outfit) return null;
    return outfit;
  } catch (error) {
    console.error('Error in getOutfitById:', error);
    throw new Error('Failed to fetch outfit');
  }
};

// Edit title, mark as favorite/recurring
const updateOutfit = async (userId, outfitId, updateData) => {
  try {
    const { title, is_favorite, is_recurring } = updateData;
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (is_favorite !== undefined) updateFields.is_favorite = is_favorite;
    if (is_recurring !== undefined) updateFields.is_recurring = is_recurring;
    const outfit = await prisma.outfit.update({
      where: {
        id: outfitId,
        user_id: userId
      },
      data: updateFields,
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: {
              include: {
                category: true,
                closet: true
              }
            }
          }
        }
      }
    });
    return outfit;
  } catch (error) {
    console.error('Error in updateOutfit:', error);
    throw new Error('Failed to update outfit');
  }
};

// Delete outfit (does NOT delete clothing items)
const deleteOutfit = async (userId, outfitId) => {
  try {
    await prisma.outfitClothingItem.deleteMany({
      where: {
        outfit_id: outfitId
      }
    });
    const deletedOutfit = await prisma.outfit.delete({
      where: {
        id: outfitId,
        user_id: userId
      }
    });
    return { success: true, data: deletedOutfit };
  } catch (error) {
    console.error('Error in deleteOutfit:', error);
    throw new Error('Failed to delete outfit');
  }
};

// Increment wear count & last_worn for outfit and its items
const wearOutfit = async (userId, outfitId) => {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      },
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: true
          }
        }
      }
    });
    if (!outfit) return null;
    const now = new Date();
    const updatedOutfit = await prisma.outfit.update({
      where: { id: outfitId },
      data: {
        wear_count: { increment: 1 },
        last_worn_at: now
      },
      include: {
        outfitClothingItems: {
          include: {
            clothingItem: {
              include: {
                category: true,
                closet: true
              }
            }
          }
        }
      }
    });
    const clothingItemIds = outfit.outfitClothingItems.map(oci => oci.clothing_item_id);
    await prisma.clothingItem.updateMany({
      where: {
        id: { in: clothingItemIds }
      },
      data: {
        wear_count: { increment: 1 },
        last_worn_at: now
      }
    });
    return updatedOutfit;
  } catch (error) {
    console.error('Error in wearOutfit:', error);
    throw new Error('Failed to update wear count');
  }
};

// Add clothing item to outfit (many-to-many mapping)
const addItemToOutfit = async (userId, outfitId, clothingItemId) => {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      }
    });
    if (!outfit) return null;
    const existingItem = await prisma.outfitClothingItem.findFirst({
      where: {
        outfit_id: outfitId,
        clothing_item_id: clothingItemId
      }
    });
    if (existingItem) {
      return { success: false, message: 'Item already in outfit' };
    }
    await prisma.outfitClothingItem.create({
      data: {
        outfit_id: outfitId,
        clothing_item_id: clothingItemId
      }
    });
    return await getOutfitById(userId, outfitId);
  } catch (error) {
    console.error('Error in addItemToOutfit:', error);
    throw new Error('Failed to add item to outfit');
  }
};

// Remove clothing item from outfit; auto-delete outfit if empty
const removeItemFromOutfit = async (userId, outfitId, clothingItemId) => {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      },
      include: {
        outfitClothingItems: true
      }
    });
    if (!outfit) return null;
    await prisma.outfitClothingItem.delete({
      where: {
        outfit_id_clothing_item_id: {
          outfit_id: outfitId,
          clothing_item_id: clothingItemId
        }
      }
    });
    const remainingItems = await prisma.outfitClothingItem.count({
      where: { outfit_id: outfitId }
    });
    let result = { outfit: null, outfitDeleted: false };
    if (remainingItems === 0) {
      await prisma.outfit.delete({
        where: { id: outfitId }
      });
      result.outfitDeleted = true;
    } else {
      result.outfit = await getOutfitById(userId, outfitId);
    }
    return result;
  } catch (error) {
    console.error('Error in removeItemFromOutfit:', error);
    throw new Error('Failed to remove item from outfit');
  }
};

module.exports = {
  getOutfits,
  createOutfit,
  getOutfitById,
  updateOutfit,
  deleteOutfit,
  wearOutfit,
  addItemToOutfit,
  removeItemFromOutfit
};
