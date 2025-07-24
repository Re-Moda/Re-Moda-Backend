const express = require('express');
const router = express.Router();
const outfitController = require('../controllers/outfitController');
const authenticateToken = require('../middlewares/auth');

// Lists outfits for user (supports ?favorite=, ?recurring=)
router.get('/', authenticateToken, outfitController.getOutfits);

// Creates a new outfit with selected items
router.post('/', authenticateToken, outfitController.createOutfit);

// Gets details for a specific outfit
router.get('/:id', authenticateToken, outfitController.getOutfitById);

// Edits title, mark as favorite/recurring
router.patch('/:id', authenticateToken, outfitController.updateOutfit);

// Deletes outfit (does NOT delete clothing items)
router.delete('/:id', authenticateToken, outfitController.deleteOutfit);

// Increments wear count & last_worn for outfit and its items
router.post('/:id/wear', authenticateToken, outfitController.wearOutfit);

// Adds clothing item to outfit (many-to-many mapping)
router.post('/:id/add-item', authenticateToken, outfitController.addItemToOutfit);

// Removes clothing item from outfit; auto-delete outfit if empty
router.delete('/:id/remove-item/:itemId', authenticateToken, outfitController.removeItemFromOutfit);

// Add this route for generating avatar with outfit
router.post('/generate-avatar', authenticateToken, outfitController.generateAvatarWithOutfit);

module.exports = router;
