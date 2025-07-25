const { uploadFileToS3 } = require('../services/s3Service');
const { describeImage, generateStoreImage } = require('../services/llmService');
const clothingItemService = require('../services/clothingItemService');
const prisma = require('../prismaClient');
const axios = require('axios');

// Helper to get or create default closet and categories for a user
async function getOrCreateDefaultClosetAndCategories(userId) {
  let closet = await prisma.closet.findFirst({ where: { user_id: userId } });
  if (!closet) {
    closet = await prisma.closet.create({ data: { user_id: userId, name: 'My Closet' } });
  }
  const categories = await prisma.category.findMany({ where: { user_id: userId } });
  if (categories.length < 3) {
    await prisma.category.createMany({
      data: [
        { user_id: userId, title: 'Top' },
        { user_id: userId, title: 'Bottom' },
        { user_id: userId, title: 'Shoe' }
      ],
      skipDuplicates: true
    });
  }
  return { closet, categories: await prisma.category.findMany({ where: { user_id: userId } }) };
}

// Helper to download an image from a URL to a buffer
async function downloadImageToBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

async function getClothingItems(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    const items = await clothingItemService.getClothingItems(userId);
    // Map each item to include only the relevant fields for the frontend
    const result = (Array.isArray(items) ? items : []).map(item => ({
      id: item.id,
      generatedImageUrl: item.image_key || item.generatedImageUrl, // S3 URL for AI image
      label: item.label || item.title,
      title: item.title || item.label,
      description: item.description,
      category: item.category?.title || item.tag || item.category, // user-selected category
      tag: item.tag || item.category?.title || item.category,
      closetId: item.closet_id || (item.closet && item.closet.id),
      // Add any other fields you want to expose
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getClothingItems:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch clothing items' });
  }
}

async function uploadClothingItem(req, res) {
  try {
    const userId = req.user.userId;
    // Ensure user has a closet and categories
    const { closet, categories } = await getOrCreateDefaultClosetAndCategories(userId);
    // Use provided or default category
    let category = req.body.category;
    let categoryRecord = categories.find(cat => cat.title.toLowerCase() === (category || '').toLowerCase());
    if (!categoryRecord) categoryRecord = categories[0];

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const { label, description } = req.body;
    // 1. Upload original image to S3
    const originalImageUrl = await uploadFileToS3(req.file);
    // 2. Get description from GPT-4 Vision
    const aiDescription = await describeImage(originalImageUrl);
    // 3. Generate store-like image from description
    const generatedImageUrl = await generateStoreImage(aiDescription);
    // 4. Save all info in DB
    const item = await clothingItemService.createClothingItem({
      userId,
      closetId: closet.id,
      category: categoryRecord.id,
      label: label || '',
      description: aiDescription,
      originalImageUrl,
      generatedImageUrl,
      tag: categoryRecord.title,
    });
    res.status(201).json({
      success: true,
      data: {
        id: item.id,
        generatedImageUrl,
        title: label || '',
        tag: categoryRecord.title,
        description: aiDescription,
        originalImageUrl,
        closetId: closet.id,
        label: label || '',
        category: categoryRecord.id,
        dbItem: item
      }
    });
  } catch (error) {
    console.error('Error in uploadClothingItem:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process image or create item.' });
  }
}

async function getClothingItemById(req, res) {
  try {
    const item = await clothingItemService.getClothingItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ success: false, message: 'Clothing item not found.' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch clothing item.' });
  }
}

async function updateClothingItem(req, res) {
  try {
    const item = await clothingItemService.updateClothingItem(Number(req.params.id), req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update clothing item.' });
  }
}

async function deleteClothingItem(req, res) {
  try {
    const result = await clothingItemService.deleteClothingItem(Number(req.params.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete clothing item.' });
  }
}

async function wearClothingItem(req, res) {
  try {
    const item = await clothingItemService.wearClothingItem(Number(req.params.id));
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update wear count.' });
  }
}

module.exports = {
  getClothingItems,
  uploadClothingItem,
  getClothingItemById,
  updateClothingItem,
  deleteClothingItem,
  wearClothingItem
};