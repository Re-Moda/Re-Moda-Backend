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
    const { title, clothingItemIds, is_favorite = false, is_recurring = false, image_key, bucket_name } = req.body;
    const userId = req.user.userId;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }
    
    if (!clothingItemIds || !Array.isArray(clothingItemIds) || clothingItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one clothing item ID is required"
      });
    }
    
    const outfit = await outfitService.createOutfit(userId, {
      title,
      clothingItemIds,
      is_favorite,
      is_recurring,
      image_key,
      bucket_name
    });
    
    res.status(201).json({
      success: true,
      data: outfit,
      message: "Outfit created successfully"
    });
  } catch (error) {
    console.error('Error creating outfit:', error);
    
    // Handle specific validation errors
    if (error.message.includes('Clothing items not found')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
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
    const { title, is_favorite, is_recurring, image_key, bucket_name } = req.body;
    const userId = req.user.userId;
    const outfit = await outfitService.updateOutfit(userId, parseInt(id), {
      title,
      is_favorite,
      is_recurring,
      image_key,
      bucket_name
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

// Mark outfit as worn
const markAsWorn = async (req, res) => {
  try {
    const { id } = req.params;
    const { worn, worn_date } = req.body;
    const userId = req.user.userId;
    
    if (worn === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot unmark as worn. Use wear count to track usage."
      });
    }
    
    const outfit = await outfitService.markAsWorn(userId, parseInt(id), { worn_date });
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        message: "Outfit not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: outfit,
      message: "Outfit marked as worn successfully"
    });
  } catch (error) {
    console.error('Error marking outfit as worn:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark outfit as worn"
    });
  }
};

// Toggle favorite status for an outfit
const toggleFavorite = async (req, res) => {
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
    
    // Toggle the favorite status
    const updatedOutfit = await outfitService.updateOutfit(userId, parseInt(id), {
      is_favorite: !outfit.is_favorite
    });
    
    res.status(200).json({
      success: true,
      data: updatedOutfit,
      message: `Outfit ${updatedOutfit.is_favorite ? 'added to' : 'removed from'} favorites`
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle favorite status"
    });
  }
};

// Helper: Get hardcoded avatar description based on avatar ID
function getAvatarDescriptionByAvatarId(avatarId) {
  // Hardcoded descriptions for each avatar (1-15)
  const avatarDescriptions = {
    1: 'A bald woman with medium brown skin and warm undertones. Her skin has a smooth, matte texture with no visible blemishes or freckles. She has an athletic, lean body type with defined shoulders, a narrow waist, toned arms, and muscular legs. Her face is oval-shaped and symmetrical, featuring high cheekbones, a soft jawline, full lips, and almond-shaped dark brown eyes. She has no visible eyebrows or hair. Her facial expression is relaxed and neutral, with a slight natural smile. The person is standing upright in a straight, balanced pose with both feet flat on the ground and spaced shoulder-width apart. Her arms hang naturally by her sides.',
    
    2: 'A bald woman with medium brown skin and neutral undertones. Her complexion is smooth and matte, with no visible freckles, blemishes, or shine. She has a curvy, full-figured body type with soft, rounded proportions. Her arms, hips, and thighs are fuller, and her midsection has a natural curve without visible muscle definition. Her face is round with full cheeks, a soft jawline, and symmetrical features. She has almond-shaped dark brown eyes, a medium-sized nose, full lips, and no visible eyebrows. Her facial expression is neutral with a calm, relaxed demeanor and a subtle, soft smile. She is standing upright, with both feet flat on the ground and spaced shoulder-width apart, and her arms are relaxed by her sides.',
    
    3: 'A bald woman with deep, rich brown skin and neutral-to-warm undertones. Her complexion is smooth and matte, with no visible shine, freckles, or blemishes. She has a full-figured, plus-size body type with soft, rounded proportions throughout. Her arms, chest, abdomen, hips, and legs are all visibly fuller and evenly proportioned. Her posture is balanced and upright, with her arms relaxed at her sides and feet placed shoulder-width apart, flat on the ground. Her face is oval-shaped with a soft jawline, full cheeks, and symmetrical features. She has almond-shaped deep brown eyes, full lips, a broad nose, and no visible eyebrows. Her facial expression is calm and neutral, with a subtle, gentle smile.',
    
    4: 'A bald man with medium-deep brown skin and neutral undertones. His skin has a smooth, matte texture with no visible gloss, shine, or blemishes. He has a full-figured, plus-size body type with a broad chest, rounded stomach, thick arms, and strong legs. His body proportions are natural and balanced, with a slightly wider upper body and muscular legs. He is standing in a neutral pose with both feet flat on the ground, shoulder-width apart, and arms relaxed by his sides. His face is oval with full cheeks, a rounded jawline, and symmetrical features. He has deep-set dark brown eyes, full lips, a wide nose, and no visible eyebrows or facial hair. His facial expression is calm and neutral, with a slight, soft smile.',
    
    5: 'A bald woman with medium-deep brown skin and warm undertones. Her skin is smooth and matte, without any visible blemishes, shine, or freckles. She has a lean, proportionate body type with a narrow waist, defined limbs, and a straight, upright posture. Her arms and legs are slender and toned, with subtle muscle definition. Her face is oval-shaped with high cheekbones, a soft but defined jawline, and symmetrical facial features. She has almond-shaped dark brown eyes, full lips, a medium-sized nose, and no visible eyebrows or hair. Her facial expression is neutral, with a calm demeanor and a slightly serious or focused gaze. She is standing with both feet flat on the ground, shoulder-width apart, and her arms relaxed by her sides.',
    
    6: 'A bald woman with very light, pale beige skin and cool undertones. Her skin is uniformly matte, with no visible pores, freckles, blemishes, or shine. She has a slender, straight-proportioned body type with narrow shoulders, a small waist, and long, lean limbs. Her stance is upright with a relaxed posture: feet flat on the ground and spaced shoulder-width apart, arms loosely resting by her sides. Her face is oval and symmetrical, featuring narrow cheekbones, a softly defined jawline, and a slightly pointed chin. She has small, almond-shaped light gray eyes, a small nose, full lips, and no visible eyebrows or eyelashes. Her facial expression is neutral and expressionless — calm but not smiling.',
    
    7: 'A bald man with very light, pale ivory skin and neutral-cool undertones. His skin has a smooth, matte finish with no gloss, shine, blemishes, or freckles. He has an athletic body type with broad shoulders, a flat chest, visible arm and leg muscle definition, and a narrow waist. His arms and legs are muscular and proportionate, with no exaggerated features. He is standing in a relaxed, upright pose with both feet flat on the ground and spaced shoulder-width apart, and his arms are gently resting by his sides. His face is oval and symmetrical, featuring a defined jawline, high cheekbones, and a slightly pointed chin. He has almond-shaped light gray eyes, a straight nose, and full lips, with no visible eyebrows, eyelashes, or hair. His facial expression is neutral and calm, with a subtle, natural demeanor.',
    
    8: 'A bald man with medium brown skin and warm undertones. His skin is smooth and matte, with no gloss, shine, or visible imperfections. He has an athletic, well-proportioned build with broad shoulders, a defined chest, muscular arms, and strong, toned legs. His waist is narrow, and his posture is upright and balanced. He stands with his feet flat on the ground, shoulder-width apart, and arms resting naturally by his sides. His face is oval and symmetrical, with a defined jawline, high cheekbones, and a straight chin. He has almond-shaped dark brown eyes, a medium-sized nose, and full lips. There are no visible eyebrows, eyelashes, or facial hair. His expression is neutral, calm, and composed — not smiling.',
    
    9: 'A bald man with dark brown skin and warm undertones. His skin is even-toned and matte, with no shine, reflections, blemishes, or freckles. He has a fit and athletic build with defined shoulders, a sculpted chest, strong arms, and well-developed leg muscles. His waist is narrow and hips are proportionate to his upper body, creating a classic V-shaped frame. He stands tall with a neutral posture: both feet flat on the ground, shoulder-width apart, and arms naturally resting at his sides. His face is symmetrical and oval-shaped, with high cheekbones, a squared jawline, and a straight chin. He has almond-shaped dark brown eyes, a wide nose, full lips, and no visible eyebrows, eyelashes, or facial hair. His facial expression is calm and serious, without a smile.',
    
    10: 'A bald man with very light, pale pinkish-white skin and cool undertones. His skin has a smooth, matte finish with no gloss, blemishes, freckles, or visible pores. He has an athletic, well-defined build with broad shoulders, a firm chest, muscular arms, and proportionately strong legs. His waist is narrow and his stance is upright and symmetrical. He is standing with both feet flat on the ground and spaced shoulder-width apart, while his arms rest naturally by his sides. His face is oval and symmetrical with a defined jawline, narrow cheekbones, a rounded chin, and a straight nose. He has almond-shaped light gray eyes, full lips, and no visible eyebrows, eyelashes, or facial hair. His facial expression is neutral with a slightly serious, calm demeanor.',
    
    11: 'A bald woman with light-medium beige skin and warm-neutral undertones. Her complexion is smooth and matte, with no shine, freckles, or visible blemishes. She has a slim, well-proportioned figure with a narrow waist, gently defined hips, and lean arms and legs. Her build is balanced and natural, without exaggerated muscularity or curvature. She stands in an upright, symmetrical pose with both feet flat on the ground, shoulder-width apart, and her arms gently relaxed by her sides. Her face is oval and symmetrical, with softly contoured cheekbones, a smooth jawline, and a rounded chin. She has almond-shaped light brown eyes, a straight nose, and full lips. She has no visible eyebrows, eyelashes, or hair. Her facial expression is neutral and serene, with a calm gaze and no smile.',
    
    12: 'A bald man with very dark brown, nearly black skin and neutral undertones. His complexion is smooth and matte, with no visible texture, shine, or blemishes. He has a fit and proportionate body type with broad shoulders, a defined chest, strong arms, and muscular legs. His waist is narrow and his build is athletic but natural — not exaggerated. He stands upright with a straight, balanced stance: both feet flat on the ground, shoulder-width apart, and arms resting naturally at his sides. His face is symmetrical and oval-shaped, with strong cheekbones, a square jawline, and a straight chin. He has almond-shaped deep brown eyes, a straight nose, full lips, and no visible eyebrows, eyelashes, or facial hair. His facial expression is calm and serious, with a neutral gaze and no smile.',
    
    13: 'A bald woman with very dark brown, almost black skin and neutral undertones. Her skin is smooth and matte, with no visible shine, freckles, or blemishes. She has a slim, straight-proportioned figure with a narrow waist, soft curves, and long, lean limbs. Her posture is upright and symmetrical, with both feet flat on the ground and spaced shoulder-width apart. Her arms hang naturally by her sides. Her face is oval and well-balanced, with high cheekbones, a soft jawline, and a gently rounded chin. She has almond-shaped deep brown eyes, a straight nose, full lips, and no visible eyebrows, eyelashes, or facial hair. Her expression is calm and neutral, with a composed gaze and no visible smile.',
    
    14: 'A bald woman with extremely light, pale skin and cool-pink undertones. Her skin has a porcelain-like matte texture with no visible pores, shine, freckles, or blemishes. She has a slim, proportionate build with a narrow waist, gently defined hips, and long, slender limbs. Her posture is upright and balanced, with both feet flat on the ground and spaced shoulder-width apart. Her arms are relaxed and hang naturally at her sides. Her face is oval and symmetrical with soft cheekbones, a straight nose, a rounded chin, and a smooth jawline. She has almond-shaped pale gray-blue eyes, full lips, and no visible eyebrows, eyelashes, or facial hair. Her facial expression is calm and neutral with a soft, serene gaze and no smile.',
    
    15: 'A bald woman with extremely fair, porcelain-white skin and cool undertones. Her skin has a matte, even texture with no visible pores, freckles, or blemishes. She has a slim and elongated body with narrow shoulders, a defined waist, and long, lean legs. Her arms are slender and symmetrical, resting naturally by her sides. She stands upright in a balanced posture with both feet flat on the ground and spaced shoulder-width apart. Her face is oval and symmetrical with delicate cheekbones, a narrow jawline, a straight chin, and a long neck. She has light gray-blue almond-shaped eyes, a small nose, full lips, and no visible eyebrows, eyelashes, or facial hair. Her facial expression is neutral, calm, and serene — with no visible smile.'
  };
  
  // Return the hardcoded description or a fallback
  return avatarDescriptions[avatarId] || avatarDescriptions[1]; // Default to avatar 1 if not found
}

// OpenAI import for DALL-E 3 generation
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Legacy function for backward compatibility
async function describeAvatarImage(avatarUrl) {
  return getAvatarDescription(avatarUrl);
}

// POST /outfits/generate-avatar
const generateAvatarWithOutfit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topId, bottomId, shoesId, accessories } = req.body;

    console.log('generateAvatarWithOutfit called with:', { userId, topId, bottomId, shoesId, accessories });

    if (!topId || !bottomId) {
      return res.status(400).json({ success: false, message: 'topId and bottomId are required.' });
    }

    // Fetch clothing item images and descriptions
    const prisma = require('../prismaClient');
    const top = await prisma.clothingItem.findUnique({ where: { id: Number(topId) } });
    const bottom = await prisma.clothingItem.findUnique({ where: { id: Number(bottomId) } });
    const shoes = shoesId ? await prisma.clothingItem.findUnique({ where: { id: Number(shoesId) } }) : null;

    console.log('Found clothing items:', {
      top: top ? { id: top.id, image_key: top.image_key, description: top.description } : null,
      bottom: bottom ? { id: bottom.id, image_key: bottom.image_key, description: bottom.description } : null,
      shoes: shoes ? { id: shoes.id, image_key: shoes.image_key, description: shoes.description } : null
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

    // Get the user's avatar information
    const user = await require('../services/authService').findUserById(userId);
    const avatarId = user.avatar_id; // Use the user's selected avatar

    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No avatar selected. Please select an avatar first.' 
      });
    }

    console.log('User avatar ID:', avatarId);

    // Get the hardcoded avatar description based on avatar ID
    console.log('Getting avatar description...');
    const avatarDescription = getAvatarDescriptionByAvatarId(avatarId);
    console.log('Avatar description:', avatarDescription);

    // Generate new avatar with outfit using DALL-E 3
    console.log('Generating avatar with outfit using DALL-E 3...');
    
    const prompt = `
A person with these exact characteristics: ${avatarDescription}. The person is wearing ${top.description} on top, ${bottom.description} on bottom, and ${shoes ? `${shoes.description} on their feet` : `barefoot`}. The clothing fits perfectly on the person's body.

MANDATORY REQUIREMENTS (do NOT ignore any):
- Show ONLY one person. Absolutely do not generate multiple people, multiple views, mirrored versions, reflections, or background figures.
- The person must be shown COMPLETELY from head to toe. The top of the head and both feet must be fully visible in the frame. Do NOT crop, zoom, or cut off any part of the head, body, or feet. No close-ups.
- Center the person in the image, standing upright and facing directly forward. Do NOT tilt, turn, or angle the body. No creative camera angles.
- The pose, body type, facial features, skin tone, and gender must EXACTLY match the avatar description provided. Do NOT change gender, facial structure, proportions, or skin color. Do NOT beautify or stylize.
- The person must be bald. No hair should be visible. No eyebrows unless described.
- The result should look like a neutral mannequin-style avatar, not a photorealistic human, not a fashion model, not a fashion illustration, not a 3D render.
- No props, accessories, or background objects unless described. Only a plain white background.

STYLE & LIGHTING:
- Use flat, even, soft lighting as in a technical clothing catalog. No shadows, no reflections, no dramatic lighting, no backlight.
- Clothing must appear matte unless otherwise specified in the clothing description.

STRICTLY PROHIBITED:
- No photorealistic effects, no 3D effects, no stylized filters, no creative or artistic edits.
- No cropping, no zoom, no close-ups, no side-by-side figures, no duplicated avatars, no background people, no mirrors, no extra figures, no multiple poses.

FINAL OUTPUT:
A single, consistent, mannequin-style avatar, shown from head to toe, centered, and fully visible in a neutral pose, wearing the specified outfit, with NO deviations from these requirements.
`;

    console.log('DALL-E 3 prompt:', prompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const generatedImageUrl = response.data[0].url;
    console.log('Generated avatar URL:', generatedImageUrl);

    // Download the image and upload to S3 with retry logic
    let imageRes;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to download image (attempt ${retryCount + 1}/${maxRetries})...`);
        imageRes = await axios.get(generatedImageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ReModa/1.0)'
          }
        });
        console.log('Image downloaded successfully');
        break;
      } catch (downloadError) {
        retryCount++;
        console.error(`Download attempt ${retryCount} failed:`, downloadError.message);
        
        if (retryCount >= maxRetries) {
          console.error('All download attempts failed');
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to download generated image after multiple attempts. Please try again.' 
          });
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

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

// POST /outfits/build-your-own - Enhanced version for multiple clothing items
const buildYourOwnOutfit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { clothingItems } = req.body; // Array of clothing item IDs

    console.log('buildYourOwnOutfit called with:', { userId, clothingItems });

    if (!clothingItems || !Array.isArray(clothingItems) || clothingItems.length === 0) {
      return res.status(400).json({ success: false, message: 'clothingItems array is required with at least one item.' });
    }

    // Fetch all clothing items
    const prisma = require('../prismaClient');
    const items = await Promise.all(
      clothingItems.map(id => prisma.clothingItem.findUnique({ 
        where: { id: Number(id) },
        include: { category: true }
      }))
    );

    console.log('Found clothing items:', items.map(item => ({
      id: item?.id,
      label: item?.label,
      category: item?.category?.title,
      description: item?.description
    })));

    // Check if all items exist
    const missingItems = items.filter(item => !item);
    if (missingItems.length > 0) {
      return res.status(404).json({ success: false, message: 'One or more clothing items not found.' });
    }

    // Check if all items have images
    const itemsWithoutImages = items.filter(item => !item.image_key);
    if (itemsWithoutImages.length > 0) {
      return res.status(400).json({ success: false, message: 'One or more clothing items are missing images.' });
    }

    // Get the user's avatar information
    const user = await require('../services/authService').findUserById(userId);
    const avatarId = user.avatar_id; // Use the user's selected avatar

    if (!avatarId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No avatar selected. Please select an avatar first.' 
      });
    }

    console.log('User avatar ID:', avatarId);

    // Get the hardcoded avatar description based on avatar ID
    console.log('Getting avatar description...');
    const avatarDescription = getAvatarDescriptionByAvatarId(avatarId);
    console.log('Avatar description:', avatarDescription);

    // Build outfit description based on categories
    let outfitDescription = 'The person is wearing ';
    const categoryDescriptions = [];

    items.forEach(item => {
      const category = item.category.title.toLowerCase();
      if (category === 'top') {
        categoryDescriptions.push(`${item.description} on top`);
      } else if (category === 'bottom') {
        categoryDescriptions.push(`${item.description} on bottom`);
      } else if (category === 'shoes') {
        categoryDescriptions.push(`${item.description} on their feet`);
      } else if (category === 'accessories') {
        categoryDescriptions.push(`${item.description} as an accessory`);
      }
    });

    outfitDescription += categoryDescriptions.join(', ');

    // Generate new avatar with outfit using DALL-E 3
    console.log('Generating avatar with outfit using DALL-E 3...');
    
    const dallePrompt = `
A person with these exact characteristics: ${avatarDescription}. The person is wearing ${outfitDescription}. The clothing fits perfectly on the person's body.

MANDATORY REQUIREMENTS (do NOT ignore any):
- Show ONLY one person. Absolutely do not generate multiple people, multiple views, mirrored versions, reflections, or background figures.
- The person must be shown COMPLETELY from head to toe. The top of the head and both feet must be fully visible in the frame. Do NOT crop, zoom, or cut off any part of the head, body, or feet. No close-ups.
- Center the person in the image, standing upright and facing directly forward. Do NOT tilt, turn, or angle the body. No creative camera angles.
- The pose, body type, facial features, skin tone, and gender must EXACTLY match the avatar description provided. Do NOT change gender, facial structure, proportions, or skin color. Do NOT beautify or stylize.
- The person must be bald. No hair should be visible. No eyebrows unless described.
- The result should look like a neutral mannequin-style avatar, not a photorealistic human, not a fashion model, not a fashion illustration, not a 3D render.
- No props, accessories, or background objects unless described. Only a plain white background.

STYLE & LIGHTING:
- Use flat, even, soft lighting as in a technical clothing catalog. No shadows, no reflections, no dramatic lighting, no backlight.
- Clothing must appear matte unless otherwise specified in the clothing description.

STRICTLY PROHIBITED:
- No photorealistic effects, no 3D effects, no stylized filters, no creative or artistic edits.
- No cropping, no zoom, no close-ups, no side-by-side figures, no duplicated avatars, no background people, no mirrors, no extra figures, no multiple poses.

FINAL OUTPUT:
A single, consistent, mannequin-style avatar, shown from head to toe, centered, and fully visible in a neutral pose, wearing the specified outfit, with NO deviations from these requirements.
`;

    console.log('DALL-E 3 prompt:', dallePrompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const generatedImageUrl = response.data[0].url;
    console.log('Generated avatar URL:', generatedImageUrl);

    // Download the image and upload to S3 with retry logic
    let imageRes;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to download image (attempt ${retryCount + 1}/${maxRetries})...`);
        imageRes = await axios.get(generatedImageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ReModa/1.0)'
          }
        });
        console.log('Image downloaded successfully');
        break;
      } catch (downloadError) {
        retryCount++;
        console.error(`Download attempt ${retryCount} failed:`, downloadError.message);
        
        if (retryCount >= maxRetries) {
          console.error('All download attempts failed');
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to download generated image after multiple attempts. Please try again.' 
          });
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    const s3Service = require('../services/s3Service');
    const file = {
      originalname: `avatar-${userId}-build-your-own.png`,
      buffer: Buffer.from(imageRes.data),
      mimetype: 'image/png'
    };
    const s3Url = await s3Service.uploadFileToS3(file);

    console.log('Uploaded to S3:', s3Url);

    // Return the new image URL
    return res.json({ 
      success: true, 
      generated_avatar_url: s3Url,
      outfit_items: items.map(item => ({
        id: item.id,
        label: item.label,
        category: item.category.title,
        description: item.description
      }))
    });

  } catch (error) {
    console.error('Error in buildYourOwnOutfit:', error?.response?.data || error.message || error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate avatar with build your own outfit.' });
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
  removeItemFromOutfit,
  markAsWorn,
  toggleFavorite
};
module.exports.generateAvatarWithOutfit = generateAvatarWithOutfit;
module.exports.buildYourOwnOutfit = buildYourOwnOutfit;
