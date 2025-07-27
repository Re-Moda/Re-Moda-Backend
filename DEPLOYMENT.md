# Re-Moda Deployment Guide

## Overview
This guide will help you deploy your Re-Moda application with a custom domain `my-remoda.com`.

## Architecture
- **Frontend**: React app deployed to Vercel (my-remoda.com)
- **Backend**: Node.js/Express API deployed to Render (api.my-remoda.com)

## Step 1: Deploy Backend to Render

### 1.1 Prepare Your Repository
1. Make sure your code is pushed to GitHub
2. Ensure all environment variables are documented in `.env.example`

### 1.2 Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `re-moda-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (free tier)

### 1.3 Set Environment Variables
In Render dashboard, add these environment variables:
```
DATABASE_URL=your-production-postgres-url
JWT_SECRET=your-super-secret-jwt-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-2
AWS_S3_BUCKET_NAME=clothing-items-remoda
OPENAI_API_KEY=your-openai-api-key
REPLICATE_API_KEY=your-replicate-api-key
NODE_ENV=production
```

### 1.4 Set Up Database
1. In Render, go to "New +" → "PostgreSQL"
2. Create a new PostgreSQL database
3. Copy the connection string to your `DATABASE_URL`
4. Run database migrations: `npx prisma db push`

### 1.5 Custom Domain Setup
1. In Render dashboard, go to your web service
2. Click "Settings" → "Custom Domains"
3. Add `api.my-remoda.com`
4. Render will provide DNS records to configure

## Step 2: Deploy Frontend to Vercel

### 2.1 Prepare Frontend
1. Update your frontend API base URL to use the production backend:
```javascript
// In your frontend code, change from:
const API_BASE_URL = 'http://localhost:3000';
// To:
const API_BASE_URL = 'https://api.my-remoda.com';
```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your frontend repository
4. Configure:
   - **Framework Preset**: React
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (or `build`)

### 2.3 Custom Domain Setup
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add `my-remoda.com`
4. Vercel will provide DNS records to configure

## Step 3: Configure DNS in Squarespace

### 3.1 Backend DNS (api.my-remoda.com)
Add these records in Squarespace DNS:
- **Type**: CNAME
- **Name**: `api`
- **Value**: `your-app.onrender.com` (from Render)

### 3.2 Frontend DNS (my-remoda.com)
Add these records in Squarespace DNS:
- **Type**: A
- **Name**: `@`
- **Value**: `76.76.19.34` (Vercel's IP)

## Step 4: Environment Variables Checklist

### Backend (Render)
- [ ] `DATABASE_URL` - Production PostgreSQL URL
- [ ] `JWT_SECRET` - Long, random string for JWT signing
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_REGION` - us-east-2
- [ ] `AWS_S3_BUCKET_NAME` - clothing-items-remoda
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `CLAID_API_KEY` - Claid AI API key
- [ ] `NODE_ENV` - production

### Frontend (Vercel)
- [ ] `REACT_APP_API_URL` - https://api.my-remoda.com

## Step 5: Testing

### 5.1 Test Backend
```bash
curl https://api.my-remoda.com/health
# Should return: {"status":"OK","message":"Re-Moda Backend is running"}
```

### 5.2 Test Frontend
1. Visit `https://my-remoda.com`
2. Test login/signup functionality
3. Test image upload and AI features

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure your backend CORS configuration includes your frontend domain
2. **Database Connection**: Verify `DATABASE_URL` is correct and database is accessible
3. **Environment Variables**: Double-check all variables are set in Render dashboard
4. **DNS Propagation**: DNS changes can take up to 48 hours to propagate

### Debugging
1. Check Render logs in the dashboard
2. Check Vercel deployment logs
3. Test API endpoints directly with curl or Postman
4. Verify database migrations ran successfully

## Security Considerations
1. Use strong, unique JWT secrets
2. Keep API keys secure and rotate regularly
3. Enable HTTPS for all domains
4. Consider rate limiting for production
5. Monitor logs for suspicious activity

## Next Steps
1. Set up monitoring and logging
2. Configure automated backups for database
3. Set up CI/CD pipelines
4. Implement error tracking (Sentry, etc.)
5. Set up SSL certificates (usually automatic with Vercel/Render) 