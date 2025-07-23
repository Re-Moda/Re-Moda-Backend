const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. Describe the uploaded image using GPT-4 Vision
async function describeImage(imageUrl) {
  try {
    const prompt = `
Describe the clothing item in this image in 2-3 sentences. 
Be concise and consistent. 
Include the color, texture, and what the item is. 
Do not mention the background or other objects. 
Example: "This is a soft, light blue cotton T-shirt with a classic crew neck and short sleeves. The fabric is smooth and comfortable, perfect for everyday wear."
`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 200,
      response_format: { type: 'text' },
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in describeImage:', error);
    throw new Error('Failed to describe image with LLM');
  }
}

// 2. Generate a new image from the description using DALL·E 3
async function generateStoreImage(description) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: description + 
        ". Generate a single, centered product photo of only this clothing item on a fully transparent background. No people, no props, no duplicate items, no text, no shadows, no background color.",
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });
    return response.data[0].url;
  } catch (error) {
    console.error('Error in generateStoreImage:', error);
    throw new Error('Failed to generate store image with DALL·E');
  }
}

module.exports = { describeImage, generateStoreImage };
