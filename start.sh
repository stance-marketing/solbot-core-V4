#!/bin/bash

echo "🚀 Starting Solana Trading Bot Dashboard..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Start both frontend and backend
echo "🌟 Starting services..."
npm run start-all