#!/bin/bash
# Startup script for Cocktail Sort Web Visualizer

echo "🍹 Cocktail Sort Web Visualizer"
echo "================================"

# Check if Flask is installed
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

echo "🚀 Starting web server..."
echo "📍 Open your browser and go to: http://localhost:5000"
echo "⏹️  Press Ctrl+C to stop the server"
echo "================================"
echo ""

python3 app.py
