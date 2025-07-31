#!/bin/bash

# Production Deployment Script for Re-Moda Backend
# This script ensures the database is properly migrated before starting the server

echo "🚀 Starting production deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📊 Database URL configured: ${DATABASE_URL:0:20}..."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema changes
echo "🗄️ Pushing database schema changes..."
npx prisma db push --accept-data-loss

# Check if the push was successful
if [ $? -eq 0 ]; then
    echo "✅ Database schema updated successfully"
else
    echo "❌ Failed to update database schema"
    exit 1
fi

# Start the application
echo "🚀 Starting the application..."
npm start 