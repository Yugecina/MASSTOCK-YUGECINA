#!/bin/bash

# MasStock Frontend - Start Server Script
# This script starts the development server

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   MasStock Frontend - Dev Server          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env - Update VITE_API_URL if needed"
    echo ""
fi

# Show current config
echo "📋 Configuration:"
echo "   API URL: $(grep VITE_API_URL .env || echo 'Not set')"
echo ""

# Start the dev server
echo "🚀 Starting development server..."
echo "   URL: http://localhost:5173"
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
