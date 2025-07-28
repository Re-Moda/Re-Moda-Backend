const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middlewares/auth');

// Start a new chat session
router.post('/sessions', authenticateToken, chatController.startChatSession);

// Get user's chat sessions
router.get('/sessions', authenticateToken, chatController.getUserChatSessions);

// Get specific chat session with messages
router.get('/sessions/:sessionId', authenticateToken, chatController.getChatSession);

// Send message to AI stylist and get outfit recommendations
router.post('/sessions/:sessionId/messages', authenticateToken, chatController.sendMessage);

// Create outfit from recommendation and generate avatar try-on
router.post('/sessions/:sessionId/outfits', authenticateToken, chatController.createOutfitFromRecommendation);

module.exports = router;
