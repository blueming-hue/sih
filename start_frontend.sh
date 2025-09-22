#!/bin/bash

echo "🚀 Starting MINDLY Frontend..."
echo "================================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error installing dependencies!"
        exit 1
    fi
fi

echo "🔧 Starting React development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo ""
echo "Make sure the Python backend is running on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo "================================================"

npm start
