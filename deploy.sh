#!/bin/bash

# NexScout Deployment Script
# This script helps prepare and deploy NexScout to production

set -e

echo "🚀 NexScout Deployment Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating .env.production from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env.production
        echo -e "${YELLOW}⚠️  Please update .env.production with your production credentials${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create .env.production manually.${NC}"
        exit 1
    fi
fi

# Check environment variables
echo "📋 Checking environment variables..."
source .env.production 2>/dev/null || true

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not set in .env.production${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not set in .env.production${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables found${NC}"
echo ""

# Type check
echo "🔍 Running TypeScript type check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Type check failed. Please fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Type check passed${NC}"
echo ""

# Build
echo "🏗️  Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Check build size
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "📦 Build size: $BUILD_SIZE"
echo ""

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🌐 Vercel CLI detected"
    echo ""
    read -p "Deploy to Vercel? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed. Install with: npm i -g vercel${NC}"
    echo ""
    echo "📦 Production build is ready in ./dist/"
    echo "You can deploy manually to:"
    echo "  - Vercel: vercel --prod"
    echo "  - Netlify: netlify deploy --prod"
    echo "  - Cloudflare Pages: Upload dist/ folder"
fi

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"

