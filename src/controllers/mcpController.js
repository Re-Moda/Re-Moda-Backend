const mcpService = require('../services/mcpService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /mcp/analyze-wardrobe
async function analyzeWardrobe(req, res) {
  try {
    const userId = req.user.userId;
    console.log(`Wardrobe analysis requested for user ${userId}`);

    // Create MCP session
    const session = await mcpService.createMCPSession(userId, {
      action: 'analyze_wardrobe',
      timestamp: new Date().toISOString()
    });

    // Analyze wardrobe
    const result = await mcpService.analyzeWardrobeForDonation(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Complete MCP session
    await mcpService.completeMCPSession(session.id);

    // Format response for LLM consumption
    const response = {
      success: true,
      data: result.data,
      message: `I've analyzed your wardrobe and found ${result.data.suggestedForDonation.length} items that might be good candidates for donation.`,
      analysis: {
        totalItems: result.data.analysis.totalItems,
        itemsWornZeroTimes: result.data.analysis.itemsWornZeroTimes,
        itemsWornOnce: result.data.analysis.itemsWornOnce,
        itemsNotWornIn6Months: result.data.analysis.itemsNotWornIn6Months,
        averageWearCount: Math.round(result.data.analysis.averageWearCount * 10) / 10
      },
      suggestedForDonation: result.data.suggestedForDonation,
      itemsToKeep: result.data.itemsToKeep
    };

    res.json(response);

  } catch (error) {
    console.error('Error in analyzeWardrobe:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze wardrobe'
    });
  }
}

// POST /mcp/mark-unused
async function markItemsAsUnused(req, res) {
  try {
    const userId = req.user.userId;
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'itemIds array is required'
      });
    }

    console.log(`🏷️ Marking items as unused for user ${userId}:`, itemIds);

    const result = await mcpService.markItemsAsUnused(userId, itemIds);

    res.json({
      success: true,
      message: result.message,
      count: result.count
    });

  } catch (error) {
    console.error('Error in markItemsAsUnused:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark items as unused'
    });
  }
}

// GET /mcp/unused-items
async function getUnusedItems(req, res) {
  try {
    const userId = req.user.userId;

    const result = await mcpService.getUnusedItems(userId);

    res.json({
      success: true,
      data: result.data,
      count: result.data.length
    });

  } catch (error) {
    console.error('Error in getUnusedItems:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch unused items'
    });
  }
}

// POST /mcp/donation-suggestions
async function getDonationSuggestions(req, res) {
  try {
    const userId = req.user.userId;
    const { percentage = 5 } = req.body; // Default 5% of wardrobe

    console.log(`🎯 Getting donation suggestions for user ${userId} (${percentage}%)`);

    // Create MCP session
    const session = await mcpService.createMCPSession(userId, {
      action: 'donation_suggestions',
      percentage,
      timestamp: new Date().toISOString()
    });

    // Get wardrobe analysis
    const result = await mcpService.analyzeWardrobeForDonation(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Complete MCP session
    await mcpService.completeMCPSession(session.id);

    // Generate natural language response
    const suggestions = result.data.suggestedForDonation;
    const analysis = result.data.analysis;

    const response = {
      success: true,
      message: `I've analyzed your wardrobe and found ${suggestions.length} items that might be good candidates for donation.`,
      analysis: {
        totalItems: analysis.totalItems,
        itemsWornZeroTimes: analysis.itemsWornZeroTimes,
        itemsWornOnce: analysis.itemsWornOnce,
        itemsNotWornIn6Months: analysis.itemsNotWornIn6Months,
        averageWearCount: Math.round(analysis.averageWearCount * 10) / 10
      },
      suggestedForDonation: suggestions.map(item => ({
        id: item.id,
        label: item.label,
        description: item.description,
        category: item.category,
        wear_count: item.wear_count,
        last_worn_at: item.last_worn_at,
        created_at: item.created_at,
        image_key: item.image_key,
        reason: item.wear_count === 0 ? 'Never worn' : `Worn only ${item.wear_count} time${item.wear_count === 1 ? '' : 's'}`
      })),
      itemsToKeep: result.data.itemsToKeep,
      sessionId: session.id
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getDonationSuggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get donation suggestions'
    });
  }
}

// POST /mcp/move-old-items
async function moveOldItems(req, res) {
  try {
    const userId = req.user.userId;
    const { months = 3 } = req.body;

    console.log(`📅 Moving items not worn in ${months} months for user ${userId}`);

    const result = await mcpService.moveOldItems(userId, months);

    res.json({
      success: true,
      message: result.message,
      count: result.count,
      movedItems: result.movedItems
    });

  } catch (error) {
    console.error('Error in moveOldItems:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to move old items'
    });
  }
}

// POST /mcp/move-low-wear-items
async function moveLowWearItems(req, res) {
  try {
    const userId = req.user.userId;
    const { maxWearCount = 3 } = req.body;

    console.log(`📊 Moving items with wear count <= ${maxWearCount} for user ${userId}`);

    const result = await mcpService.moveLowWearItems(userId, maxWearCount);

    res.json({
      success: true,
      message: result.message,
      count: result.count,
      movedItems: result.movedItems
    });

  } catch (error) {
    console.error('Error in moveLowWearItems:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to move low wear items'
    });
  }
}

// POST /mcp/move-item-by-description
async function moveItemByDescription(req, res) {
  try {
    const userId = req.user.userId;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    console.log(`🔍 Moving item by description: "${description}" for user ${userId}`);

    const result = await mcpService.moveItemByDescription(userId, description);

    res.json({
      success: true,
      message: result.message,
      count: result.count,
      movedItems: result.movedItems
    });

  } catch (error) {
    console.error('Error in moveItemByDescription:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to move item by description'
    });
  }
}

module.exports = {
  analyzeWardrobe,
  markItemsAsUnused,
  getUnusedItems,
  getDonationSuggestions,
  moveOldItems,
  moveLowWearItems,
  moveItemByDescription
};
