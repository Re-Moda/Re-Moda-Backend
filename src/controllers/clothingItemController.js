const { uploadFileToS3 } = require('../services/s3Service');
const { describeImage, generateStoreImage } = require('../services/llmService');
const clothingItemService = require('../services/clothingItemService');
const uploadQueueService = require('../services/uploadQueueService');
const globalRateLimitService = require('../services/globalRateLimitService');
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
      is_unused: item.is_unused || false,
      unused_at: item.unused_at,
      wear_count: item.wear_count || 0,
      last_worn_at: item.last_worn_at,
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

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { label, description } = req.body;
    const category = req.body.category || 'Top';

    console.log('📤 Adding upload to queue for user:', userId);
    console.log('File received:', req.file ? 'Yes' : 'No');

    // Add upload to queue
    const uploadData = {
      userId,
      file: req.file,
      category,
      label,
      description
    };

    const uploadId = await uploadQueueService.addToQueue(uploadData);

    // Return immediate response with upload ID
    res.status(202).json({
      success: true,
      message: 'Upload queued successfully',
      data: {
        uploadId,
        status: 'queued',
        message: 'Your upload has been queued and will be processed shortly.'
      }
    });

  } catch (error) {
    console.error('Error in uploadClothingItem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to queue upload',
      details: error.message
    });
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
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the item belongs to the user
    const item = await prisma.clothingItem.findFirst({
      where: {
        id: parseInt(id),
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true,
        closet: true
      }
    });

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clothing item not found or does not belong to user.' 
      });
    }

    // Delete the clothing item (this will cascade to related records)
    const result = await clothingItemService.deleteClothingItem(parseInt(id));
    
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        message: 'Clothing item donated to thrift store successfully'
      }
    });
  } catch (error) {
    console.error('Error in deleteClothingItem:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete clothing item.' 
    });
  }
}

async function wearClothingItem(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Verify the item belongs to the user
    const item = await prisma.clothingItem.findFirst({
      where: {
        id: parseInt(id),
        closet: {
          user_id: userId
        }
      }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Clothing item not found.' });
    }

    const updatedItem = await clothingItemService.wearClothingItem(parseInt(id));
    res.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Error in wearClothingItem:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update wear count.' });
  }
}

// Mark item as unused
async function markAsUnused(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the item belongs to the user
    const item = await prisma.clothingItem.findFirst({
      where: {
        id: parseInt(id),
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true,
        closet: true
      }
    });

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clothing item not found or does not belong to user.' 
      });
    }

    // Mark item as unused
    const updatedItem = await prisma.clothingItem.update({
      where: { id: parseInt(id) },
      data: {
        is_unused: true,
        unused_at: new Date()
      },
      include: {
        category: true,
        closet: true
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        label: updatedItem.label,
        category: updatedItem.category.title,
        is_unused: updatedItem.is_unused,
        unused_at: updatedItem.unused_at,
        description: updatedItem.description,
        image_key: updatedItem.image_key,
        wear_count: updatedItem.wear_count,
        last_worn_at: updatedItem.last_worn_at
      },
      message: 'Item marked as unused successfully'
    });
  } catch (error) {
    console.error('Error in markAsUnused:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to mark item as unused.' 
    });
  }
}

// Move item back to closet from unused
async function restoreToCloset(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify the item belongs to the user
    const item = await prisma.clothingItem.findFirst({
      where: {
        id: parseInt(id),
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true,
        closet: true
      }
    });

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clothing item not found or does not belong to user.' 
      });
    }

    // Check if item is actually unused
    if (!item.is_unused) {
      return res.status(400).json({ 
        success: false, 
        message: 'Item is not in unused state.' 
      });
    }

    // Move item back to closet (mark as not unused)
    const updatedItem = await prisma.clothingItem.update({
      where: { id: parseInt(id) },
      data: {
        is_unused: false,
        unused_at: null
      },
      include: {
        category: true,
        closet: true
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        label: updatedItem.label,
        category: updatedItem.category.title,
        is_unused: updatedItem.is_unused,
        unused_at: updatedItem.unused_at,
        description: updatedItem.description,
        image_key: updatedItem.image_key,
        wear_count: updatedItem.wear_count,
        last_worn_at: updatedItem.last_worn_at
      },
      message: 'Item restored to closet successfully'
    });
  } catch (error) {
    console.error('Error in restoreToCloset:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to restore item to closet.' 
    });
  }
}



// Get upload status
async function getUploadStatus(req, res) {
  try {
    const { uploadId } = req.params;
    const status = uploadQueueService.getUploadStatus(uploadId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting upload status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload status'
    });
  }
}

// Get queue status
async function getQueueStatus(req, res) {
  try {
    const status = uploadQueueService.getQueueStatus();
    const globalStatus = globalRateLimitService.getGlobalStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        globalRateLimit: globalStatus
      }
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
}

// Get global rate limit status
async function getGlobalRateLimitStatus(req, res) {
  try {
    const status = globalRateLimitService.getGlobalStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting global rate limit status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global rate limit status'
    });
  }
}

module.exports = {
  getClothingItems,
  getClothingItemById,
  updateClothingItem,
  deleteClothingItem,
  wearClothingItem,
  markAsUnused,
  restoreToCloset,
  uploadClothingItem,
  getUploadStatus,
  getQueueStatus,
  getGlobalRateLimitStatus
};