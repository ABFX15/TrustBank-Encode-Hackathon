#!/bin/bash

echo "🔍 TrustBank Deployment Verification"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "hardhat.config.ts" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Contract Deployment Status:"
echo "-----------------------------"

# Check deployment file
if [ -f "deployment-etherlink-1752326998575.json" ]; then
    echo "✅ Etherlink deployment found"
    echo "📄 Deployment details:"
    cat deployment-etherlink-1752326998575.json | jq '.'
else
    echo "❌ No Etherlink deployment found"
fi

echo ""
echo "🔧 Frontend Configuration:"
echo "-------------------------"

# Check frontend config
if [ -f "frontend/src/config/wagmi.ts" ]; then
    echo "✅ Wagmi config found"
    echo "📋 Contract addresses configured:"
    grep -A 10 "etherlinkTestnet.id" frontend/src/config/wagmi.ts
else
    echo "❌ Wagmi config not found"
fi

echo ""
echo "📦 Frontend Dependencies:"
echo "------------------------"

# Check frontend dependencies
cd frontend
if [ -f "package.json" ]; then
    echo "✅ Frontend package.json found"
    echo "🔍 Key dependencies:"
    npm list --depth=0 | grep -E "(next|wagmi|rainbowkit|tailwind)" || echo "⚠️  Some dependencies may not be installed"
else
    echo "❌ Frontend package.json not found"
fi

echo ""
echo "🎨 Build Status:"
echo "---------------"

# Try to build
echo "🔨 Building frontend..."
npm run build > build.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    echo "📄 Build errors:"
    tail -20 build.log
fi

echo ""
echo "🌐 Ready to Start:"
echo "-----------------"
echo "Run 'npm run dev' in the frontend directory to start the development server"
echo "Visit http://localhost:3000 to see the application"
echo ""
echo "🔗 Etherlink Testnet:"
echo "- Chain ID: 128123"
echo "- RPC: https://node.ghostnet.etherlink.com"
echo "- Explorer: https://testnet.explorer.etherlink.com"
echo "- Faucet: https://faucet.etherlink.com"
