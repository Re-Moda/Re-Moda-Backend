const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BACKEND_URL = 'https://re-moda-backend.onrender.com';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

async function testUpload() {
  try {
    console.log('🧪 Testing upload endpoint...\n');

    // Create a test image if it doesn't exist
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('📝 Creating a test image file...');
      // Create a simple test image (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
        0x07, 0xFF, 0xD9
      ]);
      fs.writeFileSync(TEST_IMAGE_PATH, testImageBuffer);
      console.log('✅ Test image created\n');
    }

    // Test upload without authentication (should fail with 401)
    console.log('📤 Test 1: Uploading without authentication...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('category', 'Top');

    try {
      const response = await axios.post(`${BACKEND_URL}/clothing-items/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload successful!');
      console.log('📋 Response data:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ Upload failed as expected (no auth):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Details:', error.response?.data?.details);
      console.log('Step:', error.response?.data?.step);
    }

    // Test with invalid token
    console.log('\n📤 Test 2: Uploading with invalid token...');
    try {
      const response2 = await axios.post(`${BACKEND_URL}/clothing-items/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': 'Bearer invalid-token'
        }
      });

      console.log('✅ Upload successful!');
      console.log('📋 Response data:');
      console.log(JSON.stringify(response2.data, null, 2));

    } catch (error) {
      console.log('❌ Upload failed as expected (invalid token):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Details:', error.response?.data?.details);
      console.log('Step:', error.response?.data?.step);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpload(); 