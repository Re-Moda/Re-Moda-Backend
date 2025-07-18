const express = require('express');
const router = express.Router();
const clothingItemController = require('../controllers/clothingItemController');
const authenticateToken = require('../middlewares/auth');

// List all clothing items (with filters)
router.get('/', authenticateToken, clothingItemController.getClothingItems);
// Upload a new clothing item image (S3 + LLM tagging)
router.post('/upload', authenticateToken, clothingItemController.uploadClothingItem);
// Get clothing item details
router.get('/:id', authenticateToken, clothingItemController.getClothingItemById);
// Edit clothing item (description, tags)
router.patch('/:id', authenticateToken, clothingItemController.updateClothingItem);
// Remove (soft delete) clothing item
router.delete('/:id', authenticateToken, clothingItemController.deleteClothingItem);
// Increment wear count & set last_worn
router.post('/:id/wear', authenticateToken, clothingItemController.wearClothingItem);

module.exports = router;
