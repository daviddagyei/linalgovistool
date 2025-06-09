#!/bin/bash

# Development startup script for Linalgovistool
# This script starts both the Flask backend and Vite frontend

echo "🚀 Starting Linalgovistool Development Environment"
echo "=================================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r backend/requirements.txt"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "🐍 Starting Flask backend server..."
source venv/bin/activate
python3 backend/app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "⚡ Starting Vite frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:5173/api (proxied)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
