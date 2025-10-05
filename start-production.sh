#!/bin/bash

echo "========================================"
echo "   LiveBoard Production Server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Set production environment
export NODE_ENV=production

# Load production environment variables
if [ -f .env.production ]; then
    echo "Loading production environment..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "WARNING: .env.production not found"
    echo "Using default configuration"
fi

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

# Start the server
echo ""
echo "Starting LiveBoard server on port ${PORT:-4000}..."
echo "Press Ctrl+C to stop"
echo ""
cd server
node src/bulletproof-server.js
