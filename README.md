# ReModa Backend

A comprehensive AI-powered fashion styling platform backend built with Node.js, Express, Prisma, and OpenAI. This powers the ReModa frontend application, providing intelligent outfit generation, wardrobe management, wear tracking, and natural language command processing.

## 🚀 Features

### ✅ Core Features
- **AI-Powered Outfit Generation** - GPT-4 Vision + DALL-E 3
- **Wear Tracking System** - Automatic wear count and date tracking
- **MCP (Model Context Protocol) Server** - Intelligent wardrobe analysis
- **Natural Language Commands** - Chat-based wardrobe management
- **Avatar Generation** - Personalized outfit visualization
- **Upload Queue System** - Asynchronous image processing
- **Automatic Database Schema Management** - Production-ready migrations

### ✅ AI Integrations
- **OpenAI GPT-4 Vision** - Clothing item analysis and description
- **OpenAI DALL-E 3** - Store image generation and avatar creation
- **OpenAI GPT-4** - Chat responses and outfit recommendations
- **Fuzzy Category Matching** - Intelligent clothing categorization

### ✅ Wardrobe Management
- **Move to Unused** - Manual and automatic item management
- **Wear Analysis** - Time-based and frequency-based suggestions
- **Donation Suggestions** - AI-powered wardrobe optimization
- **Batch Operations** - Bulk item management commands

## 🏗️ Architecture

<img width="1887" height="1332" alt="Untitled" src="https://github.com/user-attachments/assets/9f98fec6-9a43-4604-9727-8d71ffd912e8" />

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Signup    │  │   Upload    │  │    Chat     │           │
│  │   Signin    │  │   Closet    │  │   Stylist   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   CORS      │  │   JWT Auth  │  │   Routes    │           │
│  │ Middleware  │  │ Middleware  │  │   Router    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    CORE SERVICES                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Upload    │  │    Chat     │  │    MCP      │           │
│  │   Queue     │  │  Service    │  │  Service    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Outfit    │  │   Clothing  │  │   Avatar    │           │
│  │  Service    │  │   Service   │  │ Generation  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    Users    │  │  Clothing   │  │   Outfits   │           │
│  │   (JWT)     │  │   Items     │  │  (Wear)     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Categories │  │   Chat      │  │   MCP       │           │
│  │   (User)    │  │  Sessions   │  │  Sessions   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** database
- **AWS S3** (for image storage)
- **OpenAI API** key (for AI features)
- **Render** (for deployment)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/Re-Moda/Re-Moda-Backend.git
cd Re-Moda-Backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/remoda_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-2"
AWS_S3_BUCKET="clothing-items-remoda"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Schema

### Core Models

#### User Model
```prisma
model User {
  id                   Int          @id @default(autoincrement())
  email                String       @unique
  username             String       @unique
  password_hash        String
  google_id            String?
  coin_balance         Int          @default(0)
  security_question    String
  security_answer_hash String
  created_at           DateTime     @default(now())
  updated_at           DateTime     @updatedAt
  role                 String       @default("user")
  avatar_url           String?
  avatar_key           String?
  avatar_id            Int?         @default(1)

  // Relations
  closets              Closet[]
  categories           Category[]
  outfits              Outfit[]
  chatSessions         ChatSession[]
  mcpSessions          MCPSession[]
}
```

#### ClothingItem Model
```prisma
model ClothingItem {
  id                Int      @id @default(autoincrement())
  closet_id         Int
  category_id       Int
  bucket_name       String
  image_key         String
  label             String
  description       String
  ai_tag            String?      // AI-generated tag
  original_image_url String?     // Original image URL
  wear_count        Int      @default(0)
  last_worn_at      DateTime?
  is_unused         Boolean  @default(false)
  unused_at         DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Relations
  closet     Closet    @relation(fields: [closet_id], references: [id])
  category   Category  @relation(fields: [category_id], references: [id])
  bucket     S3Bucket  @relation("BucketClothingItems", fields: [bucket_name], references: [name])
  outfitClothingItems OutfitClothingItem[]
}
```

#### Outfit Model
```prisma
model Outfit {
  id             Int      @id @default(autoincrement())
  user_id        Int
  bucket_name    String?
  image_key      String?
  title          String
  is_favorite    Boolean  @default(false)
  is_recurring   Boolean  @default(false)
  wear_count     Int      @default(0)
  last_worn_at   DateTime?
  mcp_session_id Int?
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  // Relations
  user       User     @relation(fields: [user_id], references: [id])
  bucket     S3Bucket? @relation("BucketOutfits", fields: [bucket_name], references: [name])
  mcpSession MCPSession? @relation(fields: [mcp_session_id], references: [id])
  outfitClothingItems OutfitClothingItem[]
  mcpSessionOutfits  MCPSessionOutfit[]
}
```

#### MCP Session Model
```prisma
model MCPSession {
  id             Int      @id @default(autoincrement())
  user_id        Int
  prompt_payload Json
  status         String   @default("pending")
  created_at     DateTime @default(now())
  completed_at   DateTime?

  // Relations
  user           User     @relation(fields: [user_id], references: [id])
  outfits        Outfit[]
  mcpSessionOutfits MCPSessionOutfit[]
}
```

#### Chat Session & Messages
```prisma
model ChatSession {
  id         Int      @id @default(autoincrement())
  user_id    Int
  started_at DateTime @default(now())

  // Relations
  user       User     @relation(fields: [user_id], references: [id])
  messages   ChatMessage[]
}

model ChatMessage {
  id         Int      @id @default(autoincrement())
  session_id Int
  role       String
  content    String
  sent_at    DateTime @default(now())

  // Relations
  session    ChatSession @relation(fields: [session_id], references: [id])
}
```

## 🔐 Authentication

All protected routes require JWT authentication via Bearer token:

```javascript
headers: {
  Authorization: `Bearer ${jwt_token}`
}
```

### JWT Token Structure
```javascript
{
  userId: number,
  email: string,
  iat: number,
  exp: number
}
```

## 📡 API Endpoints

### 🔐 Authentication Routes

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "fashionista",
  "password": "securepassword123",
  "security_question": "What's your favorite color?",
  "security_answer": "blue"
}
```

#### POST /auth/signin
Authenticate existing user.

**Request Body:**
```json
{
  "username": "fashionista",
  "password": "securepassword123"
}
```

### 👤 User Management Routes

#### GET /users/me
Get current user profile.

#### PATCH /users/me
Update user profile.

#### GET /users/me/coins
Get user's coin balance.

#### POST /users/me/coins/spend
Spend coins for AI features.

### 👕 Clothing Items Routes

#### GET /clothing-items
Get all clothing items for the authenticated user.

#### POST /clothing-items/upload
Upload a new clothing item with AI analysis.

#### PATCH /clothing-items/:id/unused
Mark a clothing item as unused.

#### PATCH /clothing-items/:id/restore
Restore an unused item back to closet.

### 🎨 Outfits Routes

#### GET /outfits
Get all outfits for the authenticated user.

#### POST /outfits
Create a new outfit.

#### PATCH /outfits/:id/favorite
Toggle favorite status for an outfit.

#### PATCH /outfits/:id/worn
Mark outfit as worn (updates wear counts).

#### POST /outfits/generate-avatar
Generate AI outfit on user avatar.

#### POST /outfits/build-your-own
Create custom outfit with multiple items.

### 🤖 MCP (Model Context Protocol) Routes

#### POST /mcp/analyze-wardrobe
Analyze user's wardrobe for donation suggestions.

#### POST /mcp/donation-suggestions
Get detailed donation recommendations.

#### POST /mcp/mark-unused
Mark specific items as unused.

#### GET /mcp/unused-items
Get all unused items for user.

#### POST /mcp/move-old-items
Move items not worn in X months to unused.

**Request Body:**
```json
{
  "months": 3
}
```

#### POST /mcp/move-low-wear-items
Move items with low wear count to unused.

**Request Body:**
```json
{
  "maxWearCount": 3
}
```

#### POST /mcp/move-item-by-description
Move specific item by description to unused.

**Request Body:**
```json
{
  "description": "blue shirt"
}
```

### 💬 Chat Routes

#### POST /chat/sessions
Create a new chat session.

#### GET /chat/sessions
Get all chat sessions for the user.

#### GET /chat/sessions/:sessionId
Get specific chat session with all messages.

#### POST /chat/sessions/:sessionId/messages
Send a message to the AI stylist.

#### POST /chat/sessions/:sessionId/clear
Clear chat (save current session and start new one).

#### DELETE /chat/sessions/:sessionId
Delete a chat session and all its messages.

## 🔄 Upload Queue System

### How It Works
1. **User Uploads Image** → Added to queue
2. **S3 Upload** → Image stored in AWS S3
3. **AI Analysis** → GPT-4 Vision analyzes image
4. **Category Matching** → Fuzzy matching for categories
5. **DALL-E Generation** → Store image created
6. **Database Storage** → Item saved with all metadata

### Queue Processing
```javascript
// Automatic processing with retry logic
const uploadQueue = new UploadQueueService();
uploadQueue.processQueue(); // Runs continuously
```

## 🤖 AI Integration

### OpenAI Services Used

#### GPT-4 Vision (Image Analysis)
```javascript
// Analyzes uploaded clothing images
const description = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this clothing item...' },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ]
});
```

#### DALL-E 3 (Image Generation)
```javascript
// Generates store images and avatars
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'Generate a full-body image...',
  n: 1,
  size: '1024x1024',
  response_format: 'url'
});
```


# Backend API Requests Graph

### Legend
- ✅ = Authentication Required
- ❌ = No Authentication Required
- `GET` = Retrieve data
- `POST` = Create new resource
- `PATCH` = Update existing resource
- `DELETE` = Remove resource

## 🔐 Authentication Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | ❌ | Register a new user account |
| `POST` | `/auth/signin` | ❌ | Authenticate existing user |

## 👤 User Management Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/me` | ✅ | Get current user profile |
| `PATCH` | `/users/me` | ✅ | Update user profile |
| `GET` | `/users/me/coins` | ✅ | Get user coin balance |
| `POST` | `/users/me/coins/spend` | ✅ | Spend coins for AI features |

## 👕 Clothing Items Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/clothing-items` | ✅ | Get all clothing items for user |
| `POST` | `/clothing-items/upload` | ✅ | Upload new clothing item with AI analysis |
| `PATCH` | `/clothing-items/:id/unused` | ✅ | Mark clothing item as unused |
| `PATCH` | `/clothing-items/:id/restore` | ✅ | Restore unused item back to closet |

## 🎨 Outfits Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/outfits` | ✅ | Get all outfits for user |
| `POST` | `/outfits` | ✅ | Create new outfit |
| `PATCH` | `/outfits/:id/favorite` | ✅ | Toggle favorite status for outfit |
| `PATCH` | `/outfits/:id/worn` | ✅ | Mark outfit as worn (updates wear counts) |
| `POST` | `/outfits/generate-avatar` | ✅ | Generate AI outfit on user avatar |
| `POST` | `/outfits/build-your-own` | ✅ | Create custom outfit with multiple items |

## �� MCP (Model Context Protocol) Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/mcp/analyze-wardrobe` | ✅ | Analyze user wardrobe for donation suggestions |
| `POST` | `/mcp/donation-suggestions` | ✅ | Get detailed donation recommendations |
| `POST` | `/mcp/mark-unused` | ✅ | Mark specific items as unused |
| `GET` | `/mcp/unused-items` | ✅ | Get all unused items for user |
| `POST` | `/mcp/move-old-items` | ✅ | Move items not worn in X months to unused |
| `POST` | `/mcp/move-low-wear-items` | ✅ | Move items with low wear count to unused |
| `POST` | `/mcp/move-item-by-description` | ✅ | Move specific item by description to unused |

## 💬 Chat Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/chat/sessions` | ✅ | Create new chat session |
| `GET` | `/chat/sessions` | ✅ | Get all chat sessions for user |
| `GET` | `/chat/sessions/:sessionId` | ✅ | Get specific chat session with all messages |
| `POST` | `/chat/sessions/:sessionId/messages` | ✅ | Send message to AI stylist |
| `POST` | `/chat/sessions/:sessionId/clear` | ✅ | Clear chat (save current session and start new one) |
| `DELETE` | `/chat/sessions/:sessionId` | ✅ | Delete chat session and all messages |

## 🏥 Health Check Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Check API health status |

## 📊 API Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Authentication | 2 | No |
| User Management | 4 | Yes |
| Clothing Items | 4 | Yes |
| Outfits | 6 | Yes |
| MCP Server | 7 | Yes |
| Chat System | 6 | Yes |
| Health Check | 1 | No |

**Total Endpoints: 30**




#### GPT-4 (Chat & Recommendations)
```javascript
// Powers chat responses and outfit recommendations
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a personal AI fashion stylist...' },
    { role: 'user', content: userRequest }
  ]
});
```

## 🎯 MCP Server Features

### Wardrobe Analysis
- **Time-based filtering** - Items not worn in X months
- **Frequency analysis** - Items worn less than X times
- **Donation suggestions** - AI-powered recommendations
- **Batch operations** - Bulk item management

### Natural Language Commands
```javascript
// Supported commands:
"move items i have nto work in the past 3 months to unsued"
"move low wear items to unused"
"move blue shirt to unused"
"analyze my wardrobe"
```

### Command Processing
```javascript
// Fuzzy matching for typos
if (userMessage.includes('unsued')) userMessage = userMessage.replace('unsued', 'unused');
if (userMessage.includes('nto work')) userMessage = userMessage.replace('nto work', 'not worn');
```

## 📊 Wear Tracking System

### Automatic Wear Count Updates
```javascript
// When user marks outfit as worn
const markAsWorn = async (userId, outfitId) => {
  // Update outfit wear count
  await prisma.outfit.update({
    where: { id: outfitId },
    data: {
      wear_count: { increment: 1 },
      last_worn_at: new Date()
    }
  });
  
  // Update all clothing items in outfit
  await prisma.clothingItem.updateMany({
    where: { id: { in: clothingItemIds } },
    data: {
      wear_count: { increment: 1 },
      last_worn_at: new Date()
    }
  });
};
```

### Wear Analysis
- **Items worn 0 times** - Never worn
- **Items worn 1-2 times** - Rarely worn
- **Items not worn in 6+ months** - Old items
- **Average wear count** - Wardrobe utilization

## 🗂️ S3 Bucket Management

### Bucket Structure
```
clothing-items-remoda/
├── clothing-items/
│   ├── original-images/
│   └── store-images/
├── outfits/
│   └── generated-images/
└── avatars/
    └── user-avatars/
```

### File Naming Convention
```javascript
// Original images
const originalKey = `clothing-items/original-images/${uuid}.png`;

// Store images (DALL-E generated)
const storeKey = `clothing-items/store-images/${uuid}.png`;

// Outfit images
const outfitKey = `outfits/generated-images/${uuid}.png`;

// Avatar images
const avatarKey = `avatars/user-avatars/${userId}-${timestamp}.png`;
```

### S3 Service Functions
```javascript
// Upload file to S3
const uploadFileToS3 = async (file, key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  return await s3.upload(params).promise();
};

// Delete file from S3
const deleteFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };
  return await s3.deleteObject(params).promise();
};
```

## 🔄 Automatic Database Schema Management

### Production Database Fix
```javascript
// Automatically adds missing columns on startup
const fixDatabaseSchema = async () => {
  // Check and add avatar_id column
  const userColumns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'avatar_id'
  `;
  
  if (userColumns.length === 0) {
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "avatar_id" INTEGER DEFAULT 1`;
  }
  
  // Check and add is_unused, unused_at columns
  const clothingColumns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'ClothingItem' AND column_name IN ('is_unused', 'unused_at')
  `;
  
  if (!clothingColumns.includes('is_unused')) {
    await prisma.$executeRaw`ALTER TABLE "ClothingItem" ADD COLUMN "is_unused" BOOLEAN NOT NULL DEFAULT false`;
  }
};
```

## 🚀 Deployment

### Render Deployment
1. **Connect GitHub Repository** to Render
2. **Set Environment Variables** in Render dashboard
3. **Deploy as Web Service**
4. **Build Command**: `npm install && npx prisma generate`
5. **Start Command**: `npm start`

### Production Environment Variables
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-production-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-2"
AWS_S3_BUCKET="clothing-items-remoda"
OPENAI_API_KEY="your-openai-key"
NODE_ENV=production
PORT=3000
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "build": "npm install",
    "postinstall": "npx prisma generate && node src/utils/databaseFix.js"
  }
}
```

## 🧪 Testing

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"1234"}'

# Test upload
curl -X POST http://localhost:3000/clothing-items/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "category=Top"

# Test MCP analysis
curl -X POST http://localhost:3000/mcp/analyze-wardrobe \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Testing
```bash
# Test database connection
npx prisma db push

# Test migrations
npx prisma migrate dev

# Test schema generation
npx prisma generate
```

## 📈 Monitoring & Logging

### Log Levels
- `error` - Application errors and failures
- `warn` - Warning conditions
- `info` - General information
- `debug` - Debug information

### Health Checks
```javascript
// Database connection status
const dbHealth = await prisma.$queryRaw`SELECT 1`;

// S3 connectivity
const s3Health = await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();

// OpenAI API status
const openaiHealth = await openai.models.list();
```

### Performance Metrics
- **Upload processing time** - Average time for image processing
- **AI API response time** - OpenAI API performance
- **Database query time** - Prisma query performance
- **Memory usage** - Node.js memory consumption

## 🔒 Security Features

### JWT Token Security
- **24-hour expiration** - Tokens expire after 24 hours
- **Secure storage** - Tokens stored securely
- **Refresh mechanism** - Automatic token refresh

### Input Validation
- **Request body validation** - All inputs validated
- **File type validation** - Only images accepted
- **File size limits** - 10MB maximum file size
- **SQL injection prevention** - Prisma ORM protection

### Rate Limiting
- **API rate limiting** - Per-user rate limits
- **Upload rate limiting** - Maximum uploads per hour
- **AI feature limits** - Coin-based usage limits

### CORS Configuration
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://my-remoda.com',
    'https://www.my-remoda.com'
  ],
  credentials: true
}));
```

## 🐛 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `413` - Payload Too Large
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Retry Logic
```javascript
// Exponential backoff for AI API calls
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## 📚 API Documentation

### Complete API Reference
- **Authentication** - User registration and login
- **User Management** - Profile and coin management
- **Clothing Items** - Upload, categorize, and manage items
- **Outfits** - Create and manage outfits
- **MCP Server** - Wardrobe analysis and management
- **Chat System** - AI stylist conversations
- **Avatar Generation** - AI-powered outfit visualization

### Example API Calls
```javascript
// Upload clothing item
const uploadItem = async (file, category) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('category', category);
  
  const response = await fetch('/clothing-items/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};

// Generate outfit avatar
const generateAvatar = async (topId, bottomId) => {
  const response = await fetch('/outfits/generate-avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ top_id: topId, bottom_id: bottomId })
  });
  return response.json();
};

// Analyze wardrobe
const analyzeWardrobe = async () => {
  const response = await fetch('/mcp/analyze-wardrobe', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Style
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety (future)

### Testing Guidelines
- **Unit tests** - Service layer testing
- **Integration tests** - API endpoint testing
- **E2E tests** - Full workflow testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Complete API documentation
- **Discord** - Community support channel

---

**Built with ❤️ by the ReModa Team**



