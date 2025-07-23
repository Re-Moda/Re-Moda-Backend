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
    throw error;
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
    throw error;
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
    
    return outfit;
  } catch (error) {
    console.error('Error in getOutfitById:', error);
    throw error;
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
    throw error;
  }
};

// Delete outfit (does NOT delete clothing items)
const deleteOutfit = async (userId, outfitId) => {
  try {
    // First delete the outfit-clothing item relationships
    await prisma.outfitClothingItem.deleteMany({
      where: {
        outfit_id: outfitId
      }
    });
    
    // Then delete the outfit
    const deletedOutfit = await prisma.outfit.delete({
      where: {
        id: outfitId,
        user_id: userId
      }
    });
    
    return deletedOutfit;
  } catch (error) {
    console.error('Error in deleteOutfit:', error);
    throw error;
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
    
    if (!outfit) {
      return null;
    }
    
    const now = new Date();
    
    // Update outfit wear count and last_worn
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
    
    // Update wear count for all clothing items in the outfit
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
    throw error;
  }
};

// Add clothing item to outfit (many-to-many mapping)
const addItemToOutfit = async (userId, outfitId, clothingItemId) => {
  try {
    // Check if outfit exists and belongs to user
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      }
    });
    
    if (!outfit) {
      return null;
    }
    
    // Check if item is already in outfit
    const existingItem = await prisma.outfitClothingItem.findFirst({
      where: {
        outfit_id: outfitId,
        clothing_item_id: clothingItemId
      }
    });
    
    if (existingItem) {
      throw new Error('Item already in outfit');
    }
    
    // Add item to outfit
    await prisma.outfitClothingItem.create({
      data: {
        outfit_id: outfitId,
        clothing_item_id: clothingItemId
      }
    });
    
    // Return updated outfit
    return await getOutfitById(userId, outfitId);
  } catch (error) {
    console.error('Error in addItemToOutfit:', error);
    throw error;
  }
};

// Remove clothing item from outfit; auto-delete outfit if empty
const removeItemFromOutfit = async (userId, outfitId, clothingItemId) => {
  try {
    // Check if outfit exists and belongs to user
    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId
      },
      include: {
        outfitClothingItems: true
      }
    });
    
    if (!outfit) {
      return null;
    }
    
    // Remove the item from outfit
    await prisma.outfitClothingItem.delete({
      where: {
        outfit_id_clothing_item_id: {
          outfit_id: outfitId,
          clothing_item_id: clothingItemId
        }
      }
    });
    
    // Check if outfit is now empty
    const remainingItems = await prisma.outfitClothingItem.count({
      where: { outfit_id: outfitId }
    });
    
    let result = { outfit: null, outfitDeleted: false };
    
    if (remainingItems === 0) {
      // Delete empty outfit
      await prisma.outfit.delete({
        where: { id: outfitId }
      });
      result.outfitDeleted = true;
    } else {
      // Return updated outfit
      result.outfit = await getOutfitById(userId, outfitId);
    }
    
    return result;
  } catch (error) {
    console.error('Error in removeItemFromOutfit:', error);
    throw error;
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
