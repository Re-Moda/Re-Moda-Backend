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

module.exports = router;
