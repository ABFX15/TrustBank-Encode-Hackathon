#!/bin/bash

echo "🚀 Testing TrustBank Frontend..."

# Navigate to frontend directory
cd /Users/adambryant/defi-blitz/frontend

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🌐 Starting development server..."
    npm run dev
else
    echo "❌ Build failed!"
    exit 1
fi
