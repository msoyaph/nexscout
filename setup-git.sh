#!/bin/bash

# Git Configuration Setup Script for NexScout

echo "🔧 Setting up Git configuration..."
echo ""

cd /Users/cliffsumalpong/Documents/NexScout2

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Set global config
echo "⚙️  Setting global Git configuration..."
git config --global user.name "Cliff Sumalpong"
git config --global user.email "geoffmax22@gmail.com"

# Set repository-specific config (overrides global)
echo "⚙️  Setting repository-specific Git configuration..."
git config user.name "Cliff Sumalpong"
git config user.email "geoffmax22@gmail.com"

# Verify
echo ""
echo "✅ Verification:"
echo "=================="
echo "Repository user.name:  $(git config user.name)"
echo "Repository user.email: $(git config user.email)"
echo "Global user.name:      $(git config --global user.name)"
echo "Global user.email:     $(git config --global user.email)"
echo ""
echo "✅ Git configuration complete!"
echo ""
echo "You can now commit your changes."

