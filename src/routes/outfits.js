const express = require('express');
const router = express.Router();
const outfitController = require('../controllers/outfitController');
const authenticateToken = require('../middlewares/auth');

// Lists outfits for user (supports ?favorite=, ?recurring=, ?worn=)
router.get('/', authenticateToken, outfitController.getOutfits);

// Creates a new outfit with selected items
router.post('/', authenticateToken, outfitController.createOutfit);

// Add this route for generating avatar with outfit
router.post('/generate-avatar', authenticateToken, outfitController.generateAvatarWithOutfit);

// Build your own outfit with multiple clothing items
router.post('/build-your-own', authenticateToken, outfitController.buildYourOwnOutfit);

// Gets details for a specific outfit
router.get('/:id', authenticateToken, outfitController.getOutfitById);

// Toggle favorite status (must come before /:id routes)
router.patch('/:id/favorite', authenticateToken, outfitController.toggleFavorite);

// Mark outfit as worn (must come before /:id routes)
router.patch('/:id/worn', authenticateToken, outfitController.markAsWorn);

// Edits title, mark as favorite/recurring (must come after specific routes)
router.patch('/:id', authenticateToken, outfitController.updateOutfit);

// Deletes outfit (does NOT delete clothing items)
router.delete('/:id', authenticateToken, outfitController.deleteOutfit);

// Increments wear count & last_worn for outfit and its items
router.post('/:id/wear', authenticateToken, outfitController.wearOutfit);

// Adds clothing item to outfit (many-to-many mapping)
router.post('/:id/add-item', authenticateToken, outfitController.addItemToOutfit);

// Removes clothing item from outfit; auto-delete outfit if empty
router.delete('/:id/remove-item/:itemId', authenticateToken, outfitController.removeItemFromOutfit);

module.exports = router;
