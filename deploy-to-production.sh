#!/bin/bash

# Deploy to Production Script
# This script commits and pushes all changes to trigger Vercel deployment

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Show current status
echo ""
echo "📊 Current git status:"
git status --short

# Stage all changes
echo ""
echo "📦 Staging all changes..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit. Everything is up to date."
    exit 0
fi

# Commit changes
echo ""
echo "💾 Committing changes..."
git commit -m "Fix: Public chat production readiness - HTTPS normalization, error handling, .maybeSingle() queries

- Fixed .single() to .maybeSingle() in PublicChatPage for better error handling
- Enhanced URL normalization in supabaseUrl.ts (HTTPS enforcement, double-slash removal)
- Added defensive URL validation in PublicChatPage
- Created production readiness checklist and documentation
- All fixes ensure public chatbot works correctly in production"

# Push to remote
echo ""
echo "📤 Pushing to remote repository..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Check Vercel Dashboard for deployment status"
echo "2. Verify environment variables are set correctly:"
echo "   - VITE_SUPABASE_URL=https://dohrkewdanppkqulvhhz.supabase.co"
echo "   - VITE_SUPABASE_ANON_KEY=(your key)"
echo "   - VITE_APP_URL=https://nexscout.co"
echo "3. Test production URL: https://nexscout.co/chat/[your-chatbot-id]"
echo ""
echo "🎉 Done!"

