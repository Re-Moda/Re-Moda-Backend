const express = require('express');
const router = express.Router();
const mcpController = require('../controllers/mcpController');
const authenticateToken = require('../middlewares/auth');

// Analyze user's wardrobe and suggest items for donation
router.post('/analyze-wardrobe', authenticateToken, mcpController.analyzeWardrobe);

// Get donation suggestions with detailed analysis
router.post('/donation-suggestions', authenticateToken, mcpController.getDonationSuggestions);

// Mark items as unused (for donation)
router.post('/mark-unused', authenticateToken, mcpController.markItemsAsUnused);

// Get all unused items for user
router.get('/unused-items', authenticateToken, mcpController.getUnusedItems);

// Move items not worn in X months to unused
router.post('/move-old-items', authenticateToken, mcpController.moveOldItems);

// Move items with low wear count to unused
router.post('/move-low-wear-items', authenticateToken, mcpController.moveLowWearItems);

// Move specific item by description to unused
router.post('/move-item-by-description', authenticateToken, mcpController.moveItemByDescription);

module.exports = router;
