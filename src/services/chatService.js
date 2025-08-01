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

// Analyze user intent to determine if they want outfit recommendations
const analyzeUserIntent = async (userRequest) => {
  try {
    console.log('Analyzing user intent for:', userRequest);
    
    const intentPrompt = `Analyze this user message and determine if they are asking for outfit help or fashion advice.

User message: "${userRequest}"

Respond with ONLY a JSON object:
{
  "needsOutfitHelp": true/false,
  "reason": "brief explanation of why they do or don't need outfit help"
}

Examples:
- "hello" → needsOutfitHelp: false
- "hi" → needsOutfitHelp: false
- "hey" → needsOutfitHelp: false
- "HI" → needsOutfitHelp: false
- "Hello" → needsOutfitHelp: false
- "I need an outfit for a job interview" → needsOutfitHelp: true
- "What should I wear to a wedding?" → needsOutfitHelp: true
- "How are you?" → needsOutfitHelp: false
- "I want to look good for a date" → needsOutfitHelp: true
- "Can you help me?" → needsOutfitHelp: false (too vague)
- "Show me some outfits" → needsOutfitHelp: true
- "What should I wear?" → needsOutfitHelp: true
- "Help me pick an outfit" → needsOutfitHelp: true`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an intent analyzer. Determine if users need outfit help.' },
        { role: 'user', content: intentPrompt }
      ],
      max_tokens: 200,
      temperature: 0.1
    });

    let cleanResponse = response.choices[0].message.content.trim();
    
    // Remove markdown if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const intent = JSON.parse(cleanResponse);
    console.log('Intent analysis result:', intent);
    
    return intent;
  } catch (error) {
    console.error('Error analyzing user intent:', error);
    // Default to false if analysis fails
    return { needsOutfitHelp: false, reason: "Intent analysis failed" };
  }
};

// AI Stylist: Generate outfit recommendations based on user request
const generateOutfitRecommendations = async (userId, userRequest, sessionId) => {
  try {
    console.log('generateOutfitRecommendations called with:', { userId, userRequest, sessionId });
    
    // First, analyze if the user actually needs outfit help
    const intent = await analyzeUserIntent(userRequest);
    console.log('Intent analysis result:', intent);
    
        if (!intent.needsOutfitHelp) {
      // Check if user said "hi" or similar greetings
      const userMessage = userRequest.toLowerCase().trim();
      console.log('Checking for greeting:', userMessage);
      console.log('Intent analysis result:', intent);
      
      if (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'hey' || userMessage === 'hi!' || userMessage === 'hi ' || userMessage === 'hello!' || userMessage === 'hey!') {
        console.log('Greeting detected, sending prompt options');
        // Return clickable outfit suggestions
        const promptResponse = JSON.stringify({
          type: 'promptOptions',
          content: "Hi there! 👋 I'm your personal AI stylist. I can help you create amazing outfits from your wardrobe! Here are some ideas to get started:",
          suggestions: [
            "I need an outfit for a job interview",
            "Help me style a blazer for work", 
            "I want to look confident for a presentation",
            "Show me some casual weekend outfits",
            "What should I wear to a wedding?"
          ]
        });
        
        await addMessage(sessionId, 'assistant', promptResponse);
        return null; // No outfit recommendations needed
      }
      
      // User doesn't need outfit help, return a helpful response instead
      const helpfulResponse = `Hi! I'm your personal AI stylist. I can help you create amazing outfits from your wardrobe! 

Try asking me things like:
• "I need an outfit for a job interview"
• "What should I wear to a wedding?"
• "Help me pick an outfit for a date"
• "I want to look professional for work"
• "Show me some casual weekend outfits"

What kind of outfit are you looking for? 😊`;

      await addMessage(sessionId, 'assistant', helpfulResponse);
      return null; // No outfit recommendations needed
    }
    
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
