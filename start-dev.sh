#!/bin/bash

echo "========================================"
echo "  LiveBoard Development Startup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[INFO] Node.js version:"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH"
    exit 1
fi

echo "[INFO] npm version:"
npm --version
echo ""

# Install dependencies if needed
echo "[STEP 1/4] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "[INFO] Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "[INFO] Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo "[SUCCESS] Dependencies ready!"
echo ""

# Start backend server in background
echo "[STEP 2/4] Starting backend server on port 4000..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..
sleep 3

# Start frontend dev server in background
echo "[STEP 3/4] Starting frontend dev server on port 5173..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 3

echo ""
echo "========================================"
echo "  LiveBoard Started Successfully!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Demo Login Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
