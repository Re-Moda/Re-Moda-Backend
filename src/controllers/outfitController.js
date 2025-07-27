const outfitService = require('../services/outfitService');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
const generateAvatarWithOutfit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topId, bottomId } = req.body;

    console.log('generateAvatarWithOutfit called with:', { userId, topId, bottomId });

    if (!topId || !bottomId) {
      return res.status(400).json({ success: false, message: 'topId and bottomId are required.' });
    }

    // Fetch clothing item images and descriptions
    const prisma = require('../prismaClient');
    const top = await prisma.clothingItem.findUnique({ where: { id: Number(topId) } });
    const bottom = await prisma.clothingItem.findUnique({ where: { id: Number(bottomId) } });

    console.log('Found clothing items:', {
      top: top ? { id: top.id, image_key: top.image_key, description: top.description } : null,
      bottom: bottom ? { id: bottom.id, image_key: bottom.image_key, description: bottom.description } : null
    });

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

    console.log('User avatar URL:', avatarImageUrl);

    if (!avatarImageUrl) {
      return res.status(400).json({ success: false, message: 'User avatar image not found.' });
    }

    // Describe the avatar using GPT-4 Vision
    console.log('Describing avatar image...');
    const avatarDescription = await describeAvatarImage(avatarImageUrl);
    console.log('Avatar description:', avatarDescription);

    // Generate new avatar with outfit using DALL-E 3
    console.log('Generating avatar with outfit using DALL-E 3...');
    
    const outfitPrompt = `A person with these exact characteristics: ${avatarDescription}. The person is wearing ${top.description} on top and ${bottom.description} on bottom. The clothing fits perfectly on the person's body. Use natural, even lighting like a studio photo shoot—no shadows, no dramatic lighting, no backlight. The person must look like a real human—not a model, not a fashion illustration. Preserve the original avatar's proportions, skin tone, pose, and realism. Do not beautify or change facial structure. Do not render in 3D, do not use CGI effects, do not make skin glossy or clothing shiny. No surreal edits. Output should resemble a candid clothing catalog photo. The clothing is matte fabric, no gloss, realistic photo, no highlights. The person has the exact same face, pose, body type, skin tone, and hair as described.`;

    console.log('DALL-E 3 prompt:', outfitPrompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: outfitPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const generatedImageUrl = response.data[0].url;
    console.log('Generated avatar URL:', generatedImageUrl);

    // Download the image and upload to S3
    const imageRes = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' });
    const s3Service = require('../services/s3Service');
    const file = {
      originalname: `avatar-${userId}-outfit.png`,
      buffer: Buffer.from(imageRes.data),
      mimetype: 'image/png'
    };
    const s3Url = await s3Service.uploadFileToS3(file);

    console.log('Uploaded to S3:', s3Url);

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
