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

// Get all messages in a session
router.get('/sessions/:sessionId/messages', authenticateToken, chatController.getSessionMessages);

// Send message to AI stylist and get outfit recommendations
router.post('/sessions/:sessionId/messages', authenticateToken, chatController.sendMessage);

// Create outfit from recommendation and generate avatar try-on
router.post('/sessions/:sessionId/outfits', authenticateToken, chatController.createOutfitFromRecommendation);

// Delete chat session
router.delete('/sessions/:sessionId', authenticateToken, chatController.deleteChatSession);

// Clear chat (save current session and start new one)
router.post('/sessions/:sessionId/clear', authenticateToken, chatController.clearChatSession);

module.exports = router;
