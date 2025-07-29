const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Analyze user's wardrobe and suggest items for donation
async function analyzeWardrobeForDonation(userId) {
  try {
    console.log(`🔍 Analyzing wardrobe for user ${userId}...`);

    // Get all user's clothing items with wear data
    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true,
        closet: true
      },
      orderBy: {
        wear_count: 'asc'
      }
    });

    if (clothingItems.length === 0) {
      return {
        success: false,
        message: "No clothing items found in your wardrobe."
      };
    }

    const totalItems = clothingItems.length;
    const itemsToSuggest = Math.max(1, Math.floor(totalItems * 0.05)); // 5% of wardrobe

    // Analyze wear patterns
    const analysis = {
      totalItems,
      itemsWornZeroTimes: clothingItems.filter(item => item.wear_count === 0).length,
      itemsWornOnce: clothingItems.filter(item => item.wear_count === 1).length,
      itemsNotWornIn6Months: clothingItems.filter(item => {
        if (!item.last_worn_at) return true;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return item.last_worn_at < sixMonthsAgo;
      }).length,
      averageWearCount: clothingItems.reduce((sum, item) => sum + item.wear_count, 0) / totalItems
    };

    // Get items suggested for donation (lowest wear count)
    const suggestedForDonation = clothingItems.slice(0, itemsToSuggest).map(item => ({
      id: item.id,
      label: item.label,
      description: item.description,
      category: item.category.title,
      wear_count: item.wear_count,
      last_worn_at: item.last_worn_at,
      created_at: item.created_at,
      image_key: item.image_key
    }));

    // Get items to keep (highest wear count)
    const itemsToKeep = clothingItems
      .filter(item => item.wear_count > 0)
      .sort((a, b) => b.wear_count - a.wear_count)
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        label: item.label,
        description: item.description,
        category: item.category.title,
        wear_count: item.wear_count,
        last_worn_at: item.last_worn_at
      }));

    return {
      success: true,
      data: {
        analysis,
        suggestedForDonation,
        itemsToKeep,
        itemsToSuggest
      }
    };

  } catch (error) {
    console.error('Error in analyzeWardrobeForDonation:', error);
    throw new Error('Failed to drobe for donation suggestions');
  }
}

// Mark items as unused (for donation)
async function markItemsAsUnused(userId, itemIds) {
  try {
    console.log(`🏷️ Marking items as unused for user ${userId}:`, itemIds);

    // Verify items belong to user
    const userItems = await prisma.clothingItem.findMany({
      where: {
        id: { in: itemIds },
        closet: {
          user_id: userId
        }
      }
    });

    if (userItems.length !== itemIds.length) {
      throw new Error('Some items not found or do not belong to user');
    }

    // Update items to mark as unused
    const updatedItems = await prisma.clothingItem.updateMany({
      where: {
        id: { in: itemIds },
        closet: {
          user_id: userId
        }
      },
      data: {
        is_unused: true,
        unused_at: new Date()
      }
    });

    return {
      success: true,
      message: `Successfully marked ${updatedItems.count} items as unused`,
      count: updatedItems.count
    };

  } catch (error) {
    console.error('Error in markItemsAsUnused:', error);
    throw new Error('Failed to mark items as unused');
  }
}

// Get unused items for user
async function getUnusedItems(userId) {
  try {
    const unusedItems = await prisma.clothingItem.findMany({
      where: {
        closet: {
          user_id: userId
        },
        is_unused: true
      },
      include: {
        category: true
      },
      orderBy: {
        unused_at: 'desc'
      }
    });

    return {
      success: true,
      data: unusedItems
    };

  } catch (error) {
    console.error('Error in getUnusedItems:', error);
    throw new Error('Failed to fetch unused items');
  }
}

// Create MCP session for tracking
async function createMCPSession(userId, promptPayload) {
  try {
    const session = await prisma.mCPSession.create({
      data: {
        user_id: userId,
        prompt_payload: promptPayload,
        status: 'pending'
      }
    });

    return session;
  } catch (error) {
    console.error('Error in createMCPSession:', error);
    throw new Error('Failed to create MCP session');
  }
}

// Complete MCP session
async function completeMCPSession(sessionId) {
  try {
    await prisma.mCPSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completed_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error in completeMCPSession:', error);
    throw new Error('Failed to complete MCP session');
  }
}

module.exports = {
  analyzeWardrobeForDonation,
  markItemsAsUnused,
  getUnusedItems,
  createMCPSession,
  completeMCPSession
};
