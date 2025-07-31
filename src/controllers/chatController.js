const chatService = require('../services/chatService');
const outfitService = require('../services/outfitService');
const prisma = require('../prismaClient');

// Start a new chat session
const startChatSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const session = await chatService.createChatSession(userId);
    
    // Add welcome message
    await chatService.addMessage(session.id, 'assistant', JSON.stringify({
      type: 'welcome',
      content: "Hi! I'm your personal fashion AI stylist. I can help you find the perfect outfit for any occasion. What are you looking for today?"
    }));

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        message: "Chat session started successfully"
      }
    });
  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to start chat session"
    });
  }
};

// Get chat session with messages
const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    const session = await chatService.getChatSession(parseInt(sessionId), userId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found"
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting chat session:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get chat session"
    });
  }
};

// Get all messages in a session
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId
      }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found"
      });
    }

    // Get all messages for the session
    const messages = await prisma.chatMessage.findMany({
      where: {
        session_id: parseInt(sessionId)
      },
      orderBy: {
        sent_at: 'asc'
      }
    });

    // Parse JSON messages for display
    const parsedMessages = messages.map(message => {
      let parsedContent = message.content;
      
      // Try to parse JSON content (for welcome messages)
      try {
        const jsonContent = JSON.parse(message.content);
        if (jsonContent.type === 'welcome' && jsonContent.content) {
          parsedContent = jsonContent.content;
        }
      } catch (e) {
        // If not JSON, use content as-is
        parsedContent = message.content;
      }
      
      return {
        ...message,
        content: parsedContent
      };
    });

    res.status(200).json({
      success: true,
      data: parsedMessages
    });
  } catch (error) {
    console.error('Error getting session messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get session messages"
    });
  }
};

// Delete chat session
const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId
      }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found"
      });
    }

    // Delete session (messages will be cascaded due to foreign key)
    await prisma.chatSession.delete({
      where: {
        id: parseInt(sessionId)
      }
    });

    res.status(200).json({
      success: true,
      message: "Chat session deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete chat session"
    });
  }
};

// Clear chat session (save current and start new)
const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: parseInt(sessionId),
        user_id: userId
      }
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found"
      });
    }

    // Create a new chat session
    const newSession = await chatService.createChatSession(userId);
    
    // Add welcome message to new session
    await chatService.addMessage(newSession.id, 'assistant', JSON.stringify({
      type: 'welcome',
      content: "Hi! I'm your personal fashion AI stylist. I can help you find the perfect outfit for any occasion. What are you looking for today?"
    }));

    res.status(200).json({
      success: true,
      data: {
        oldSessionId: parseInt(sessionId),
        newSessionId: newSession.id,
        message: "Chat cleared and new session started"
      }
    });
  } catch (error) {
    console.error('Error clearing chat session:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear chat session"
    });
  }
};

// Send message to AI stylist and get outfit recommendations
const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    // Add user message to chat
    await chatService.addMessage(parseInt(sessionId), 'user', message);

    // Generate outfit recommendations (or get helpful response)
    const recommendations = await chatService.generateOutfitRecommendations(
      userId, 
      message, 
      parseInt(sessionId)
    );

    // If no recommendations were generated, just return success
    if (!recommendations) {
      return res.status(200).json({
        success: true,
        data: {
          message: "Helpful response provided",
          recommendations: null
        }
      });
    }

    // Generate images for the recommendations
    const outfitImages = await chatService.generateOutfitImages(recommendations, userId);

    res.status(200).json({
      success: true,
      data: {
        recommendations: outfitImages,
        message: "Outfit recommendations generated successfully"
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process message"
    });
  }
};

// Create outfit from recommendation and generate avatar try-on
const createOutfitFromRecommendation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { recommendationIndex, outfitData } = req.body;
    const userId = req.user.userId;

    if (recommendationIndex === undefined || !outfitData) {
      return res.status(400).json({
        success: false,
        message: "Recommendation index and outfit data are required"
      });
    }

    // Create the outfit in the database
    const outfit = await outfitService.createOutfit(userId, {
      title: outfitData.title,
      clothingItemIds: outfitData.clothingItemIds,
      image_key: outfitData.imageUrl,
      bucket_name: "clothing-items-remoda",
      is_favorite: false,
      is_recurring: false
    });

    // Generate avatar try-on with the outfit
    const outfitController = require('./outfitController');
    const avatarResponse = await outfitController.generateAvatarWithOutfit({
      user: { userId },
      body: {
        topId: outfitData.clothingItemIds[0], // Use first item as top
        bottomId: outfitData.clothingItemIds[1] || outfitData.clothingItemIds[0] // Use second item as bottom, or first if only one
      }
    }, res);

    // Add message to chat about the created outfit
    await chatService.addMessage(parseInt(sessionId), 'assistant', JSON.stringify({
      type: 'outfit_created',
      outfitId: outfit.id,
      title: outfit.title,
      message: `I've created the "${outfit.title}" outfit for you! You can now see how it looks on your avatar.`
    }));

    res.status(201).json({
      success: true,
      data: {
        outfit,
        avatarImage: avatarResponse.generated_avatar_url,
        message: "Outfit created and avatar updated successfully"
      }
    });
  } catch (error) {
    console.error('Error creating outfit from recommendation:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create outfit from recommendation"
    });
  }
};

// Get user's chat sessions
const getUserChatSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const sessions = await prisma.chatSession.findMany({
      where: { user_id: userId },
      include: {
        messages: {
          orderBy: { sent_at: 'desc' },
          take: 1
        }
      },
      orderBy: { started_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Error getting user chat sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get chat sessions"
    });
  }
};

module.exports = {
  startChatSession,
  getChatSession,
  getSessionMessages,
  deleteChatSession,
  clearChatSession,
  sendMessage,
  createOutfitFromRecommendation,
  getUserChatSessions
};
