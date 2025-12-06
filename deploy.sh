#!/bin/bash

# NexScout Production Deployment Script
# This script builds and deploys the application to Vercel

set -e  # Exit on error

echo "🚀 Starting NexScout Production Deployment..."
echo ""

# Step 1: Build the application
echo "📦 Step 1: Building application..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist/ directory not found."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Deploy to production
echo "🌐 Step 2: Deploying to Vercel Production..."
echo ""
echo "⚠️  IMPORTANT: Make sure you have set these environment variables in Vercel:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_APP_URL"
echo ""
read -p "Press Enter to continue with deployment..."

npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify environment variables in Vercel Dashboard"
echo "   2. Test your production URL"
echo "   3. Check browser console for errors"
echo ""
