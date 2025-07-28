const prisma = require('../prismaClient');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create a new chat session
const createChatSession = async (userId) => {
  try {
    const session = await prisma.chatSession.create({
      data: {
        user_id: userId
      }
    });
    return session;
  } catch (error) {
    console.error('Error in createChatSession:', error);
    throw new Error('Failed to create chat session');
  }
};

// Get chat session with messages
const getChatSession = async (sessionId, userId) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: userId
      },
      include: {
        messages: {
          orderBy: { sent_at: 'asc' }
        }
      }
    });
    return session;
  } catch (error) {
    console.error('Error in getChatSession:', error);
    throw new Error('Failed to fetch chat session');
  }
};

// Add message to chat session
const addMessage = async (sessionId, role, content) => {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        role,
        content
      }
    });
    return message;
  } catch (error) {
    console.error('Error in addMessage:', error);
    throw new Error('Failed to add message');
  }
};

// Get user's clothing items for context
const getUserClothingItems = async (userId) => {
  try {
    console.log('getUserClothingItems called for userId:', userId);
    
    const items = await prisma.clothingItem.findMany({
      where: {
        closet: {
          user_id: userId
        }
      },
      include: {
        category: true
      }
    });
    
    console.log('Found clothing items:', items.length);
    console.log('Items:', items.map(item => ({ id: item.id, label: item.label, category: item.category.title })));
    
    return items;
  } catch (error) {
    console.error('Error in getUserClothingItems:', error);
    throw new Error('Failed to fetch clothing items');
  }
};

// AI Stylist: Generate outfit recommendations based on user request
const generateOutfitRecommendations = async (userId, userRequest, sessionId) => {
  try {
    console.log('generateOutfitRecommendations called with:', { userId, userRequest, sessionId });
    
    // Get user's clothing items
    const clothingItems = await getUserClothingItems(userId);
    
    console.log('User clothing items:', clothingItems.length);
    
    if (clothingItems.length === 0) {
      throw new Error('No clothing items found. Please upload some clothes first.');
    }

    // Create context for the AI
    const clothingContext = clothingItems.map(item => 
      `- ${item.label} (${item.category.title}, ID: ${item.id}): ${item.description}`
    ).join('\n');

    console.log('Clothing context:', clothingContext);

    const systemPrompt = `You are a personal AI fashion stylist. Your job is to recommend 3 different outfit combinations from the user's wardrobe based on their request.

User's Clothing Items:
${clothingContext}

Instructions:
1. Analyze the user's request and clothing items
2. Create 3 different outfit combinations
3. Each outfit should include 2-4 items that work well together
4. Consider the occasion, weather, and user's style preferences
5. Use the EXACT item IDs provided in the clothing list above
6. Return ONLY a JSON array with 3 outfits, each containing:
   - "title": A catchy name for the outfit
   - "description": Brief description of the outfit
   - "clothingItemIds": Array of the EXACT item IDs from the list above
   - "reasoning": Why this outfit works for their request

Example response format:
[
  {
    "title": "Casual Weekend Look",
    "description": "A comfortable and stylish outfit perfect for a casual day out",
    "clothingItemIds": [186, 187],
    "reasoning": "This combination provides comfort and style for outdoor activities"
  }
]`;

    const userPrompt = `User Request: "${userRequest}"

Please recommend 3 outfit combinations from my wardrobe that would be perfect for this occasion.`;

    console.log('Sending request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    console.log('OpenAI response:', response.choices[0].message.content);

    let recommendations;
    try {
      // Clean the response to remove markdown code blocks
      let cleanResponse = response.choices[0].message.content.trim();
      
      // Remove ```json and ``` if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      console.log('Cleaned response:', cleanResponse);
      
      recommendations = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', response.choices[0].message.content);
      throw new Error('Failed to parse AI response. Please try again.');
    }
    
    console.log('Parsed recommendations:', recommendations);
    
    // Save the recommendations as an AI message
    console.log('Saving message to chat session...');
    await addMessage(sessionId, 'assistant', JSON.stringify({
      type: 'outfit_recommendations',
      recommendations,
      userRequest
    }));
    
    console.log('Message saved successfully');

    return recommendations;
  } catch (error) {
    console.error('Error in generateOutfitRecommendations:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to generate outfit recommendations');
  }
};

// Generate AI-generated images for outfit recommendations
const generateOutfitImages = async (recommendations, userId) => {
  try {
    console.log('generateOutfitImages called with:', recommendations.length, 'recommendations');
    
    // For now, just return the recommendations without generating images
    const outfitImages = recommendations.map((outfit, index) => ({
      ...outfit,
      imageUrl: `https://example.com/outfit-${index + 1}.jpg` // Placeholder URL
    }));
    
    console.log('Returning outfit images:', outfitImages.length);
    return outfitImages;
  } catch (error) {
    console.error('Error in generateOutfitImages:', error);
    throw new Error('Failed to generate outfit images');
  }
};

module.exports = {
  createChatSession,
  getChatSession,
  addMessage,
  getUserClothingItems,
  generateOutfitRecommendations,
  generateOutfitImages
};
