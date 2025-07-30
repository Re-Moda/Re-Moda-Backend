const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const s3Service = require('./s3Service');
const clothingItemService = require('./clothingItemService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UploadQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 12000; // 12 seconds between uploads (5 per minute)
    this.maxRetries = 3;
    this.lastOpenAICall = 0; // Track last OpenAI API call
    this.openAIMinInterval = 12000; // Minimum 12 seconds between OpenAI calls
  }

  // Add upload to queue
  async addToQueue(uploadData) {
    const queueItem = {
      id: Date.now() + Math.random(),
      data: uploadData,
      status: 'pending',
      retries: 0,
      createdAt: new Date()
    };

    this.queue.push(queueItem);
    console.log(`📤 Added upload to queue. Queue length: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  // Process queue with rate limiting
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Starting queue processing. Items in queue: ${this.queue.length}`);

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        console.log(`⏳ Processing upload ${item.id}...`);
        item.status = 'processing';
        
        // Process the upload with retry logic
        const result = await this.processUploadWithRetry(item);
        
        item.status = 'completed';
        item.result = result;
        console.log(`✅ Upload ${item.id} completed successfully`);

      } catch (error) {
        console.error(`❌ Upload ${item.id} failed:`, error.message);
        item.status = 'failed';
        item.error = error.message;
        
        // Retry logic
        if (item.retries < this.maxRetries) {
          item.retries++;
          item.status = 'pending';
          this.queue.unshift(item); // Put back at front of queue
          console.log(`🔄 Retrying upload ${item.id} (attempt ${item.retries}/${this.maxRetries})`);
        }
      }

      // Rate limiting delay between uploads
      if (this.queue.length > 0) {
        console.log(`⏸️ Waiting ${this.rateLimitDelay}ms before next upload...`);
        await this.delay(this.rateLimitDelay);
      }
    }

    this.isProcessing = false;
    console.log('🏁 Queue processing completed');
  }

  // Process single upload with retry logic
  async processUploadWithRetry(queueItem) {
    const { userId, file, category, label, description } = queueItem.data;

    try {
      console.log(`Step 1: Uploading to S3 for upload ${queueItem.id}...`);
      const originalImageUrl = await s3Service.uploadFileToS3(file);
      console.log(`S3 upload successful for upload ${queueItem.id}:`, originalImageUrl);

      console.log(`Step 2: Getting AI description for upload ${queueItem.id}...`);
      const aiDescription = await this.describeImageWithRetry(originalImageUrl, queueItem);
      console.log(`AI description received for upload ${queueItem.id}:`, aiDescription);

      console.log(`Step 3: Generating store image for upload ${queueItem.id}...`);
      const generatedImageUrl = await this.generateStoreImageWithRetry(aiDescription, queueItem);
      console.log(`Store image generated for upload ${queueItem.id}:`, generatedImageUrl);

      // Generate label from AI description if none provided
      let itemLabel = label;
      if (!itemLabel || itemLabel.trim() === '') {
        const shortName = aiDescription.split('.')[0].replace('This is a ', '').replace('This is ', '');
        itemLabel = shortName || 'Clothing Item';
      }

      console.log(`Step 4: Saving to database for upload ${queueItem.id}...`);
      const item = await this.saveToDatabase(userId, category, itemLabel, aiDescription, originalImageUrl, generatedImageUrl);
      console.log(`Database save successful for upload ${queueItem.id}`);

      return {
        success: true,
        data: {
          id: item.id,
          generatedImageUrl,
          title: itemLabel,
          description: aiDescription,
          originalImageUrl,
          label: itemLabel,
          category: category
        }
      };

    } catch (error) {
      console.error(`Error in processUploadWithRetry for upload ${queueItem.id}:`, error);
      throw error;
    }
  }

  // Describe image with retry logic
  async describeImageWithRetry(imageUrl, queueItem) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rate limit check for OpenAI API
        await this.waitForOpenAIRateLimit();
        
        const prompt = `
Describe the clothing item in this image in 2-3 sentences. 
Be concise and consistent. 
Include the color, texture, and what the item is. 
Do not mention the background or other objects. 
Example: "This is a soft, light blue cotton T-shirt with a classic crew neck and short sleeves. The fabric is smooth and comfortable, perfect for everyday wear."
`;

        console.log(`🔄 Calling OpenAI GPT-4 Vision (attempt ${attempt}/${maxRetries})`);
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

        this.lastOpenAICall = Date.now();
        console.log(`✅ OpenAI GPT-4 Vision call successful`);
        return response.choices[0].message.content.trim();

      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt}/${maxRetries} failed for describeImage:`, error.message);
        
        if (error.response?.status === 429) {
          // Rate limit - wait longer with exponential backoff
          const waitTime = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s
          console.log(`🚫 OpenAI rate limit hit, waiting ${waitTime}ms before retry...`);
          await this.delay(waitTime);
        } else if (attempt < maxRetries) {
          // Other error - wait a bit and retry
          console.log(`⚠️ Other error, waiting 5s before retry...`);
          await this.delay(5000);
        }
      }
    }

    throw new Error(`Failed to describe image after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Generate store image with retry logic
  async generateStoreImageWithRetry(description, queueItem) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rate limit check for OpenAI API
        await this.waitForOpenAIRateLimit();
        
        console.log(`🔄 Calling OpenAI DALL-E 3 (attempt ${attempt}/${maxRetries})`);
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

        this.lastOpenAICall = Date.now();
        console.log(`✅ OpenAI DALL-E 3 call successful`);

        // Download and upload to S3
        const axios = require('axios');
        const imageRes = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' });
        
        const { v4: uuidv4 } = require('uuid');
        const path = require('path');
        
        const file = {
          originalname: `store-image-${uuidv4()}.png`,
          buffer: Buffer.from(imageRes.data),
          mimetype: 'image/png'
        };
        
        const s3Url = await s3Service.uploadFileToS3(file);
        console.log('Uploaded to S3:', s3Url);
        
        return s3Url;

      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt}/${maxRetries} failed for generateStoreImage:`, error.message);
        
        if (error.response?.status === 429) {
          // Rate limit - wait longer with exponential backoff
          const waitTime = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s
          console.log(`🚫 OpenAI rate limit hit, waiting ${waitTime}ms before retry...`);
          await this.delay(waitTime);
        } else if (attempt < maxRetries) {
          // Other error - wait a bit and retry
          console.log(`⚠️ Other error, waiting 5s before retry...`);
          await this.delay(5000);
        }
      }
    }

    throw new Error(`Failed to generate store image after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Save to database
  async saveToDatabase(userId, category, label, description, originalImageUrl, generatedImageUrl) {
    // Get or create closet and categories
    const { closet, categories } = await this.getOrCreateDefaultClosetAndCategories(userId);
    
    let categoryRecord = categories.find(cat => cat.title.toLowerCase() === (category || '').toLowerCase());
    if (!categoryRecord) categoryRecord = categories[0];

    return await clothingItemService.createClothingItem({
      userId,
      closetId: closet.id,
      category: categoryRecord.id,
      label,
      description,
      originalImageUrl,
      generatedImageUrl,
      tag: categoryRecord.title,
    });
  }

  // Get or create default closet and categories
  async getOrCreateDefaultClosetAndCategories(userId) {
    // Get or create closet
    let closet = await prisma.closet.findFirst({
      where: { user_id: userId }
    });

    if (!closet) {
      closet = await prisma.closet.create({
        data: {
          user_id: userId,
          name: 'My Closet'
        }
      });
    }

    // Get or create default categories
    const defaultCategories = ['Top', 'Bottom', 'Shoes', 'Accessories'];
    const categories = [];

    for (const title of defaultCategories) {
      let category = await prisma.category.findFirst({
        where: { title }
      });

      if (!category) {
        category = await prisma.category.create({
          data: { title }
        });
      }

      categories.push(category);
    }

    return { closet, categories };
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length
    };
  }

  // Get upload status by ID
  getUploadStatus(uploadId) {
    const item = this.queue.find(item => item.id === uploadId);
    return item ? {
      id: item.id,
      status: item.status,
      result: item.result,
      error: item.error,
      retries: item.retries,
      createdAt: item.createdAt
    } : null;
  }

  // Wait for OpenAI rate limit
  async waitForOpenAIRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastOpenAICall;
    
    if (timeSinceLastCall < this.openAIMinInterval) {
      const waitTime = this.openAIMinInterval - timeSinceLastCall;
      console.log(`⏸️ Waiting ${waitTime}ms for OpenAI rate limit (${Math.round(waitTime/1000)}s)...`);
      await this.delay(waitTime);
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const uploadQueueService = new UploadQueueService();

module.exports = uploadQueueService; 