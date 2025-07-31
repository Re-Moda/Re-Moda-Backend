const express = require('express');
const multer = require('multer');
const router = express.Router();
const clothingItemController = require('../controllers/clothingItemController');
const authenticateToken = require('../middlewares/auth');
const upload = multer(); // memory storage


// List all clothing items (with filters)
router.get('/', authenticateToken, clothingItemController.getClothingItems);
// Upload a new clothing item image (S3 + LLM tagging) - MUST BE BEFORE /:id routes
router.post('/upload', authenticateToken, upload.single('image'), clothingItemController.uploadClothingItem);
// Get specific clothing item
router.get('/:id', authenticateToken, clothingItemController.getClothingItemById);
// Edit clothing item (description, tags)
router.patch('/:id', authenticateToken, clothingItemController.updateClothingItem);
// Remove (soft delete) clothing item
router.delete('/:id', authenticateToken, clothingItemController.deleteClothingItem);
// Increment wear count & set last_worn
router.post('/:id/wear', authenticateToken, clothingItemController.wearClothingItem);
// Mark item as unused
router.patch('/:id/unused', authenticateToken, clothingItemController.markAsUnused);
// Move item back to closet from unused
router.patch('/:id/restore', authenticateToken, clothingItemController.restoreToCloset);
// Get upload status
router.get('/upload/status/:uploadId', authenticateToken, clothingItemController.getUploadStatus);
// Get queue status
router.get('/upload/queue-status', authenticateToken, clothingItemController.getQueueStatus);
// Get global rate limit status
router.get('/upload/global-rate-limit', authenticateToken, clothingItemController.getGlobalRateLimitStatus);

module.exports = router;
