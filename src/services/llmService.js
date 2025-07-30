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
    
    if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
    } else if (error.response?.status === 402) {
      throw new Error('OpenAI quota exceeded. Please check your API credits.');
    } else if (error.message && error.message.includes('quota')) {
      throw new Error('OpenAI quota exceeded. Please check your API credits.');
    }
    
    throw new Error('Failed to describe image with LLM: ' + error.message);
  }
}

// 2. Generate a new image from the description using DALL·E 3 and upload to S3
async function generateStoreImage(description) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: description +
        ". Generate a single, centered product photo of only this clothing item on a plain white background. Do not show more than one item. No people, no props, no duplicate items, no text, no shadows, and no extra objects. The item should be fully visible and clearly separated from the background.",
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const generatedImageUrl = response.data[0].url;
    console.log('Generated DALL-E 3 URL:', generatedImageUrl);

    // Download the image and upload to S3 to make it permanent
    const axios = require('axios');
    const imageRes = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' });
    
    const s3Service = require('./s3Service');
    const { v4: uuidv4 } = require('uuid');
    const path = require('path');
    
    const file = {
      originalname: `store-image-${uuidv4()}.png`,
      buffer: Buffer.from(imageRes.data),
      mimetype: 'image/png'
    };
    
    const s3Url = await s3Service.uploadFileToS3(file);
    console.log('Uploaded to S3:', s3Url);
    
    return s3Url; // Return the permanent S3 URL instead of temporary DALL-E URL
  } catch (error) {
    console.error('Error in generateStoreImage:', error);
    
    if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a few minutes.');
    } else if (error.response?.status === 402) {
      throw new Error('OpenAI quota exceeded. Please check your API credits.');
    } else if (error.message && error.message.includes('quota')) {
      throw new Error('OpenAI quota exceeded. Please check your API credits.');
    }
    
    throw new Error('Failed to generate store image with DALL·E: ' + error.message);
  }
}

module.exports = { describeImage, generateStoreImage };
