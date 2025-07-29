# ReModa Backend

A comprehensive fashion styling platform backend built with Node.js, Express, and Prisma. This powers the ReModa frontend application, providing AI-powered outfit generation, user management, and clothing item organization.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- AWS S3 (for image storage)
- OpenAI API key (for AI features)

### Installation
```bash
# Clone the repository
git clone <your-backend-repo-url>
cd re-moda-backend

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

## 📋 Environment Variables

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
  id              Int       @id @default(autoincrement())
  email           String    @unique
  password        String
  username        String?
  avatar_url      String?
  coin_balance    Int       @default(100)
  upload_count    Int       @default(0)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  clothingItems   ClothingItem[]
  outfits         Outfit[]
  chatSessions    ChatSession[]
}
```

#### ClothingItem Model
```prisma
model ClothingItem {
  id              Int       @id @default(autoincrement())
  user_id         Int
  label           String
  category        String    // "Top", "Bottom", "Shoe"
  tag             String?   // Alternative category field
  description     String?
  image_url       String    // S3 URL
  is_unused       Boolean   @default(false)
  unused_at       DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  user            User      @relation(fields: [user_id], references: [id])
  outfitItems     OutfitItem[]
}
```

#### Outfit Model
```prisma
model Outfit {
  id              Int       @id @default(autoincrement())
  user_id         Int
  title           String
  generated_image_url String?
  is_favorite     Boolean   @default(false)
  is_recurring    Boolean   @default(false)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  user            User      @relation(fields: [user_id], references: [id])
  outfitItems     OutfitItem[]
}
```

#### OutfitItem Model (Junction Table)
```prisma
model OutfitItem {
  id              Int       @id @default(autoincrement())
  outfit_id       Int
  clothing_item_id Int
  created_at      DateTime  @default(now())

  // Relations
  outfit          Outfit    @relation(fields: [outfit_id], references: [id])
  clothingItem    ClothingItem @relation(fields: [clothing_item_id], references: [id])
}
```

#### ChatSession Model
```prisma
model ChatSession {
  id              Int       @id @default(autoincrement())
  user_id         Int
  title           String?
  started_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  user            User      @relation(fields: [user_id], references: [id])
  messages        ChatMessage[]
}
```

#### ChatMessage Model
```prisma
model ChatMessage {
  id              Int       @id @default(autoincrement())
  session_id      Int
  role            String    // "user" or "assistant"
  content         String
  sent_at         DateTime  @default(now())

  // Relations
  session         ChatSession @relation(fields: [session_id], references: [id])
}
```

## 🔐 Authentication

All protected routes require JWT authentication via Bearer token in the Authorization header:

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

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "fashionista"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "fashionista",
      "coin_balance": 100,
      "upload_count": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "fashionista",
      "coin_balance": 100,
      "upload_count": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 👤 User Management Routes

#### GET /users/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "fashionista",
    "avatar_url": "https://s3.amazonaws.com/...",
    "coin_balance": 100,
    "upload_count": 5
  }
}
```

#### PATCH /users/me
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newusername",
  "avatar_url": "https://s3.amazonaws.com/..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "newusername",
    "avatar_url": "https://s3.amazonaws.com/..."
  },
  "message": "Profile updated successfully"
}
```

#### GET /users/me/coins
Get user's coin balance.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "coin_balance": 100
  }
}
```

#### POST /users/me/coins/spend
Spend coins for AI features.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coin_balance": 90
  },
  "message": "Coins spent successfully"
}
```

#### GET /users/me/upload-count
Get user's upload count and closet access status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "hasMetMinimum": true
  }
}
```

### 👕 Clothing Items Routes

#### GET /clothing-items
Get all clothing items for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Blue T-shirt",
      "category": "Top",
      "tag": "top",
      "description": "A comfortable blue t-shirt",
      "image_url": "https://s3.amazonaws.com/...",
      "is_unused": false,
      "unused_at": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /clothing-items/upload
Upload a new clothing item.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `multipart/form-data`
```
image: [file] - The clothing item image
category: "Top" | "Bottom" | "Shoe"
label: "Blue T-shirt" - Item name
description: "A comfortable blue t-shirt" - Optional description
tag: "top" - Alternative category field
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "label": "Blue T-shirt",
    "category": "Top",
    "image_url": "https://s3.amazonaws.com/...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Clothing item uploaded successfully"
}
```

#### PATCH /clothing-items/:id/unused
Mark a clothing item as unused.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "label": "Blue T-shirt",
    "is_unused": true,
    "unused_at": "2024-01-01T00:00:00Z"
  },
  "message": "Item marked as unused successfully"
}
```

### 👗 Outfits Routes

#### GET /outfits
Get all outfits for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Casual Summer Look",
      "generated_image_url": "https://s3.amazonaws.com/...",
      "is_favorite": true,
      "is_recurring": false,
      "created_at": "2024-01-01T00:00:00Z",
      "outfitItems": [
        {
          "clothingItem": {
            "id": 1,
            "label": "Blue T-shirt",
            "category": "Top"
          }
        }
      ]
    }
  ]
}
```

#### POST /outfits
Create a new outfit.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Casual Summer Look",
  "clothingItemIds": [1, 2],
  "generated_image_url": "https://s3.amazonaws.com/..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Casual Summer Look",
    "generated_image_url": "https://s3.amazonaws.com/...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Outfit created successfully"
}
```

#### PATCH /outfits/:id/favorite
Toggle favorite status for an outfit.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_favorite": true
  },
  "message": "Favorite status updated successfully"
}
```

#### PATCH /outfits/:id/worn
Toggle worn/recurring status for an outfit.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_recurring": true
  },
  "message": "Worn status updated successfully"
}
```

### 🤖 AI Features Routes

#### POST /outfits/generate-avatar
Generate AI outfit on user avatar.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "top_id": 1,
  "bottom_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_image_url": "https://s3.amazonaws.com/...",
    "cost": 10
  },
  "message": "Avatar generated successfully"
}
```

### 💬 Chat Routes

#### POST /chat/sessions
Create a new chat session.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": 1,
    "message": "Chat session started successfully"
  }
}
```

#### GET /chat/sessions
Get all chat sessions for the user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Summer Outfit Request",
      "started_at": "2024-01-01T00:00:00Z",
      "messages": [
        {
          "id": 1,
          "role": "user",
          "content": "I need a summer outfit",
          "sent_at": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

#### GET /chat/sessions/:sessionId
Get specific chat session with all messages.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Summer Outfit Request",
    "started_at": "2024-01-01T00:00:00Z",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "I need a summer outfit",
        "sent_at": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "Here are some summer outfit recommendations...",
        "sent_at": "2024-01-01T00:00:01Z"
      }
    ]
  }
}
```

#### POST /chat/sessions/:sessionId/messages
Send a message to the AI stylist.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "I need a casual outfit for a picnic"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "outfit": "Casual Picnic Look",
        "description": "A comfortable and stylish outfit perfect for outdoor activities",
        "image_url": "https://s3.amazonaws.com/..."
      }
    ]
  },
  "message": "Outfit recommendations generated successfully"
}
```

#### POST /chat/sessions/:sessionId/outfits
Create outfit from chat recommendation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recommendationIndex": 0,
  "outfitData": {
    "title": "Casual Picnic Look",
    "clothingItemIds": [1, 2, 3],
    "imageUrl": "https://s3.amazonaws.com/..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outfit": {
      "id": 1,
      "title": "Casual Picnic Look"
    },
    "avatarImage": "https://s3.amazonaws.com/...",
    "message": "Outfit created and avatar updated successfully"
  }
}
```

#### PATCH /chat/sessions/:sessionId
Update chat session title.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Chat Title"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Chat Title"
  },
  "message": "Session title updated successfully"
}
```

#### DELETE /chat/sessions/:sessionId
Delete a chat session and all its messages.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Chat session deleted successfully"
}
```

### 🏥 Health Check Routes

#### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔧 Error Handling

### Standard Error Response Format
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
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `413` - Payload Too Large (file too big)
- `422` - Unprocessable Entity (validation error)
- `500` - Internal Server Error

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 🚀 Deployment

### Render Deployment
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service
4. Set build command: `npm install && npx prisma generate`
5. Set start command: `npm start`

### Environment Variables for Production
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-production-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-2"
AWS_S3_BUCKET="your-s3-bucket"
OPENAI_API_KEY="your-openai-key"
NODE_ENV=production
PORT=3000
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "User API"
```

### API Testing with Postman
Import the provided Postman collection to test all endpoints:
- Authentication flows
- CRUD operations
- AI features
- Chat functionality

## 📊 Monitoring & Logging

### Log Levels
- `error` - Application errors
- `warn` - Warning conditions
- `info` - General information
- `debug` - Debug information

### Health Monitoring
- Database connection status
- AWS S3 connectivity
- OpenAI API status
- Memory usage
- Response times

## 🔒 Security Features

### JWT Token Security
- Tokens expire after 24 hours
- Refresh token mechanism
- Secure token storage

### Input Validation
- Request body validation
- File type validation
- File size limits
- SQL injection prevention

### Rate Limiting
- API rate limiting per user
- Upload rate limiting
- AI feature usage limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Use ESLint configuration
- Follow Prettier formatting
- Write meaningful commit messages
- Add JSDoc comments for functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples
- Contact the development team

---

**Built with ❤️ for the ReModa fashion platform**
