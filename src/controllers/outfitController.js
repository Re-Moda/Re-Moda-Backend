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
      message: error.message || "Failed to fetch outfits"
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
      message: error.message || "Failed to create outfit"
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
      message: error.message || "Failed to fetch outfit"
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
      message: error.message || "Failed to update outfit"
    });
  }
};

// Deletes outfit (does NOT delete clothing items)
const deleteOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await outfitService.deleteOutfit(userId, parseInt(id));
    if (!result || result.success === false) {
      return res.status(404).json({
        success: false,
        message: result && result.message ? result.message : "Outfit not found"
      });
    }
    res.status(200).json({
      success: true,
      data: result.data,
      message: "Outfit deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete outfit"
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
      message: error.message || "Failed to update wear count"
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
    const result = await outfitService.addItemToOutfit(userId, parseInt(id), parseInt(clothingItemId));
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    if (result.success === false) {
      return res.status(400).json(result);
    }
    res.status(200).json({
      success: true,
      data: result,
      message: "Item added to outfit successfully"
    });
  } catch (error) {
    console.error('Error adding item to outfit:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add item to outfit"
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
      message: error.message || "Failed to remove item from outfit"
    });
  }
};

// Helper: Describe avatar image using GPT-4 Vision
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function describeAvatarImage(avatarUrl) {
  const prompt = "Describe this person in detail: gender, skin tone, body type, pose, facial expression, and any other visible features. Do not mention clothing.";
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: avatarUrl } },
        ],
      },
    ],
    max_tokens: 150,
    response_format: { type: 'text' },
  });
  return response.choices[0].message.content.trim();
}

// POST /outfits/generate-avatar
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generateAvatarWithOutfit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topId, bottomId } = req.body;
    if (!topId || !bottomId) {
      return res.status(400).json({ success: false, message: 'topId and bottomId are required.' });
    }

    // Fetch clothing item images and descriptions
    const prisma = require('../prismaClient');
    const top = await prisma.clothingItem.findUnique({ where: { id: Number(topId) } });
    const bottom = await prisma.clothingItem.findUnique({ where: { id: Number(bottomId) } });
    if (!top || !bottom) {
      return res.status(404).json({ success: false, message: 'Top or bottom item not found.' });
    }

    if (!top.image_key) {
      return res.status(400).json({ success: false, message: 'Top image is missing or invalid.' });
    }
    if (!bottom.image_key) {
      return res.status(400).json({ success: false, message: 'Bottom image is missing or invalid.' });
    }

    // Get the user's avatar image URL
    const user = await require('../services/authService').findUserById(userId);
    const avatarImageUrl = user.avatar_url;
    if (!avatarImageUrl) {
      return res.status(400).json({ success: false, message: 'User avatar image not found.' });
    }

    const claidApiKey = process.env.CLAID_API_KEY;

    // --- First Claid API call: apply the top ---
    const topPayload = {
      input: avatarImageUrl,
      operations: {
        generative: {
          style_transfer: {
            prompt: `Make my avatar wear this top: "${top.description}"`,
            style_reference_image: top.image_key,
            style_strength: 0.75,
            denoising_strength: 0.75,
            depth_strength: 1.0
          }
        }
      },
      output: null
    };

    const topResponse = await axios.post(
      'https://api.claid.ai/v1-beta1/image/edit',
      topPayload,
      {
        headers: {
          Authorization: `Bearer ${claidApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const topResultUrl = topResponse.data.output?.url;
    if (!topResultUrl) {
      return res.status(502).json({ success: false, message: 'Claid API (top) did not return an image URL.' });
    }

    // --- Second Claid API call: apply the bottom ---
    const bottomPayload = {
      input: topResultUrl,
      operations: {
        generative: {
          style_transfer: {
            prompt: `Make my avatar wear these bottoms: "${bottom.description}"`,
            style_reference_image: bottom.image_key,
            style_strength: 0.75,
            denoising_strength: 0.75,
            depth_strength: 1.0
          }
        }
      },
      output: null
    };

    const bottomResponse = await axios.post(
      'https://api.claid.ai/v1-beta1/image/edit',
      bottomPayload,
      {
        headers: {
          Authorization: `Bearer ${claidApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const finalImageUrl = bottomResponse.data.output?.url;
    if (!finalImageUrl) {
      return res.status(502).json({ success: false, message: 'Claid API (bottom) did not return an image URL.' });
    }

    // Download the image and upload to S3 as before
    const imageRes = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
    const s3Service = require('../services/s3Service');
    const file = {
      originalname: `avatar-${userId}-outfit.png`,
      buffer: Buffer.from(imageRes.data),
      mimetype: 'image/png'
    };
    const s3Url = await s3Service.uploadFileToS3(file);

    // Return the new image URL (do NOT update user.avatar_url)
    return res.json({ success: true, generated_avatar_url: s3Url });

  } catch (error) {
    console.error('Error in generateAvatarWithOutfit:', error?.response?.data || error.message || error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate avatar with outfit.' });
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
module.exports.generateAvatarWithOutfit = generateAvatarWithOutfit;
