const { uploadFileToS3 } = require('../services/s3Service');
const { generateProductImage, describeClothingItem } = require('../services/llmService');
const clothingItemService = require('../services/clothingItemService');
const axios = require('axios');

// Helper to download an image from a URL to a buffer
async function downloadImageToBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

module.exports = {
  getClothingItems: (req, res) => res.json({ message: 'List all clothing items (not implemented)' }),
  uploadClothingItem: async (req, res) => {
    try {
      // Validate file
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      // Validate required fields
      const { closetId, categoryId, label, description } = req.body;
      if (!closetId || !categoryId || !label || !description) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      // 1. Upload original image to S3
      const originalImageUrl = await uploadFileToS3(req.file);

      // 2. Generate clean product image with DALL·E
      const dalleImageUrl = await generateProductImage(originalImageUrl);

      // 3. Download generated image and upload to S3
      const dalleImageBuffer = await downloadImageToBuffer(dalleImageUrl);
      const dalleFile = {
        originalname: 'generated-image.png',
        mimetype: 'image/png',
        buffer: dalleImageBuffer,
      };
      const generatedImageUrl = await uploadFileToS3(dalleFile);

      // 4. Get title, description, tag from GPT-4 Vision
      const { title, description: aiDescription, tag } = await describeClothingItem(generatedImageUrl);

      // 5. Save all info in DB
      const item = await clothingItemService.createClothingItem({
        userId: req.user.userId,
        closetId,
        categoryId: tag || categoryId, // use AI tag if you want, or original
        label: title || label,
        description: aiDescription || description,
        originalImageUrl,
        generatedImageUrl,
        tag,
      });

      res.status(201).json({
        message: 'File uploaded and item created',
        originalImageUrl,
        generatedImageUrl,
        title: title || label,
        description: aiDescription || description,
        tag,
        item,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process image or create item.' });
    }
  },
  getClothingItemById: (req, res) => res.json({ message: 'Get clothing item by ID (not implemented)' }),
  updateClothingItem: (req, res) => res.json({ message: 'Update clothing item (not implemented)' }),
  deleteClothingItem: (req, res) => res.json({ message: 'Delete clothing item (not implemented)' }),
  wearClothingItem: (req, res) => res.json({ message: 'Wear clothing item (not implemented)' })
};