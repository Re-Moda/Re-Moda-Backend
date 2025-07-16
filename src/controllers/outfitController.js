const outfitService = require('../services/outfitService');

// List outfits for user (supports ?favorite=, ?recurring=)
const getOutfits = async (req, res) => {
  try {
    const { favorite, recurring } = req.query;
    const userId = req.user.userId;
    
    const outfits = await outfitService.getOutfits(userId, { favorite, recurring });
    
    res.status(200).json({
      success: true,
      data: outfits,
      message: "Outfits retrieved successfully"
    });
  } catch (error) {
    console.error('Error getting outfits:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Creates a new outfit with selected items
const createOutfit = async (req, res) => {
  try {
    const { title, clothingItemIds, is_favorite = false, is_recurring = false } = req.body;
    const userId = req.user.userId;
    
    if (!title || !clothingItemIds || !Array.isArray(clothingItemIds)) {
      return res.status(400).json({
        success: false,
        message: "Title and clothing item IDs array are required"
      });
    }
    
    const outfit = await outfitService.createOutfit(userId, {
      title,
      clothingItemIds,
      is_favorite,
      is_recurring
    });
    
    res.status(201).json({
      success: true,
      data: outfit,
      message: "Outfit created successfully"
    });
  } catch (error) {
    console.error('Error creating outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Gets details for a specific outfit
const getOutfitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const outfit = await outfitService.getOutfitById(userId, parseInt(id));
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: outfit,
      message: "Outfit retrieved successfully"
    });
  } catch (error) {
    console.error('Error getting outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Edits title, mark as favorite/recurring
const updateOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_favorite, is_recurring } = req.body;
    const userId = req.user.userId;
    
    const outfit = await outfitService.updateOutfit(userId, parseInt(id), {
      title,
      is_favorite,
      is_recurring
    });
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: outfit,
      message: "Outfit updated successfully"
    });
  } catch (error) {
    console.error('Error updating outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Deletes outfit (does NOT delete clothing items)
const deleteOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const deleted = await outfitService.deleteOutfit(userId, parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Outfit deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Increments wear count & last_worn for outfit and its items
const wearOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const outfit = await outfitService.wearOutfit(userId, parseInt(id));
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: outfit,
      message: "Outfit wear count updated successfully"
    });
  } catch (error) {
    console.error('Error wearing outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Adds clothing item to outfit (many-to-many mapping)
const addItemToOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const { clothingItemId } = req.body;
    const userId = req.user.userId;
    
    if (!clothingItemId) {
      return res.status(400).json({
        success: false,
        message: "Clothing item ID is required"
      });
    }
    
    const outfit = await outfitService.addItemToOutfit(userId, parseInt(id), parseInt(clothingItemId));
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: outfit,
      message: "Item added to outfit successfully"
    });
  } catch (error) {
    console.error('Error adding item to outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Removes clothing item from outfit; auto-delete outfit if empty
const removeItemFromOutfit = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const userId = req.user.userId;
    
    const result = await outfitService.removeItemFromOutfit(userId, parseInt(id), parseInt(itemId));
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Outfit or item not found"
      });
    }
    
    const message = result.outfitDeleted 
      ? "Item removed and outfit deleted (was empty)" 
      : "Item removed from outfit successfully";
    
    res.status(200).json({
      success: true,
      data: result.outfit,
      message
    });
  } catch (error) {
    console.error('Error removing item from outfit:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
