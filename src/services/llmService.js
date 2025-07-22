const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate a clean product image using DALL·E 3
async function generateProductImage(imageUrl) {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Render this clothing item as a clean product photo on a white background.`,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
    image: imageUrl,
  });
  // DALL·E returns an array of images
  return response.data[0].url;
}

// Generate title, description, and tag using GPT-4 Vision
async function describeClothingItem(imageUrl) {
  const prompt = `You are an expert fashion product describer. Given this image of a clothing item, generate:\n1. A catchy product title.\n2. A 2-sentence product description.\n3. A single tag: 'top', 'bottom', or 'shoe'.\nReturn your answer as JSON with keys: title, description, tag.`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });
  // Parse the JSON response
  return JSON.parse(response.choices[0].message.content);
}

module.exports = { generateProductImage, describeClothingItem };
