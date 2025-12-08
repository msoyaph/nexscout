#!/bin/bash

# Setup script for Facebook Data Deletion Edge Function
# This script creates the directory structure and copies the Edge Function file

echo "🚀 Setting up Facebook Data Deletion Edge Function..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p supabase/functions/facebook-data-deletion

# Copy the Edge Function file
echo "📋 Copying Edge Function file..."
if [ -f "FACEBOOK_DATA_DELETION_EDGE_FUNCTION.ts" ]; then
    cp FACEBOOK_DATA_DELETION_EDGE_FUNCTION.ts supabase/functions/facebook-data-deletion/index.ts
    echo "✅ File copied successfully!"
else
    echo "❌ Error: FACEBOOK_DATA_DELETION_EDGE_FUNCTION.ts not found!"
    exit 1
fi

# Verify the file was created
if [ -f "supabase/functions/facebook-data-deletion/index.ts" ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📂 File location:"
    echo "   supabase/functions/facebook-data-deletion/index.ts"
    echo ""
    echo "📊 File size:"
    ls -lh supabase/functions/facebook-data-deletion/index.ts
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Go to Supabase Dashboard → Edge Functions"
    echo "   2. Create new function: facebook-data-deletion"
    echo "   3. Copy code from: supabase/functions/facebook-data-deletion/index.ts"
    echo "   4. Deploy the function"
    echo "   5. Set secrets: FACEBOOK_APP_SECRET and VITE_APP_URL"
    echo ""
else
    echo "❌ Error: File was not created successfully!"
    exit 1
fi




