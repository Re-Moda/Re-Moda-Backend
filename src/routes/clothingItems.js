const express = require('express');
const multer = require('multer');
const router = express.Router();
const clothingItemController = require('../controllers/clothingItemController');
const authenticateToken = require('../middlewares/auth');
const upload = multer(); // memory storage


// List all clothing items (with filters)
router.get('/', authenticateToken, clothingItemController.getClothingItems);
router.get('/:id', authenticateToken, clothingItemController.getClothingItemById);
// Edit clothing item (description, tags)
router.patch('/:id', authenticateToken, clothingItemController.updateClothingItem);
// Remove (soft delete) clothing item
router.delete('/:id', authenticateToken, clothingItemController.deleteClothingItem);
// Increment wear count & set last_worn
router.post('/:id/wear', authenticateToken, clothingItemController.wearClothingItem);
// Upload a new clothing item image (S3 + LLM tagging)
router.post('/upload', authenticateToken, upload.single('image'), clothingItemController.uploadClothingItem);
// Mark clothing item as unused
router.patch('/:id/unused', authenticateToken, clothingItemController.markAsUnused);

module.exports = router;
