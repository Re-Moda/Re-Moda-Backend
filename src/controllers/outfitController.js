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
const generateAvatarWithOutfit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topId, bottomId } = req.body;
    if (!topId || !bottomId) {
      return res.status(400).json({ success: false, message: 'topId and bottomId are required.' });
    }

    // Fetch user and their base avatar
    const user = await require('../services/authService').findUserById(userId);
    const avatarUrl = user.avatar_url || 'https://ui-avatars.com/api/?name=User';

    // 1. Get avatar description from GPT-4 Vision
    const avatarDescription = await describeAvatarImage(avatarUrl);

    // 2. Fetch clothing item descriptions
    const prisma = require('../prismaClient');
    const top = await prisma.clothingItem.findUnique({ where: { id: Number(topId) } });
    const bottom = await prisma.clothingItem.findUnique({ where: { id: Number(bottomId) } });
    if (!top || !bottom) {
      return res.status(404).json({ success: false, message: 'Top or bottom item not found.' });
    }

    // 3. Build DALL·E prompt
    const hardcodedAvatarDescription = `A photorealistic mannequin, female, full-body, front-facing, arms relaxed by sides. Skin tone is medium brown with neutral undertones. Head is completely bald (no hair), scalp is smooth and evenly contoured, ears are symmetrical and close to the skull with no piercings. Face is oval-shaped, with almond-shaped, dark brown eyes that are evenly spaced, thin and faint gently arched eyebrows, a straight nose with a medium-width bridge and round nostrils, full lips with a natural shape and slight smile, a soft jawline with moderate definition, and a narrow, tapered chin. Body is toned athletic: broad, proportionate shoulders; defined biceps and forearms with relaxed fingers; visible muscle tone at the core and balanced waist-hip ratio; strong thighs and calves, standing hip-width apart; barefoot, toes relaxed and grounded. Lighting is even studio lighting with no shadows. Background is plain white.`;
    const prompt = `\nGenerate a realistic, full-body, head-to-toe image of a single person, centered in the image. The person is described as: ${hardcodedAvatarDescription}. Be extremely specific: the person must have no hair (bald), and their skin color, eye color, nose shape, lip color, lip shape, and body type must match exactly as described. The entire body, from head to feet, must be visible in the image. The image must clearly show the person’s full upper body, torso, hips, legs, and feet, from head to toe. The person must be standing, with arms relaxed by their sides and feet visible. Show the complete outfit: ${top.description} and ${bottom.description}. Do not crop out the legs, hips, or any part of the body. Do not crop, do not zoom in, do not show only the face, upper body, or torso. No close-ups, no portraits, no zoomed-in images. The full body must be visible. Do not change the person’s race, gender, skin tone, body shape, eye color, nose, lips, or facial features. Do not add hair. Do not show more than one person. No duplicate people, no reflections, no twins, no props, no text, no extra objects. The background should be plain white.\n`;

    // 4. Call DALL·E to generate the image
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });
    const generatedImageUrl = response.data[0].url;

    // 5. Download the image and upload to S3
    const axios = require('axios');
    const s3Service = require('../services/s3Service');
    const imageRes = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' });
    const file = {
      originalname: `avatar-${userId}-outfit.png`,
      buffer: Buffer.from(imageRes.data),
      mimetype: 'image/png'
    };
    const s3Url = await s3Service.uploadFileToS3(file);

    // 6. Return the new image URL (do NOT update user.avatar_url)
    return res.json({ success: true, generated_avatar_url: s3Url });
  } catch (error) {
    console.error('Error in generateAvatarWithOutfit:', error);
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
