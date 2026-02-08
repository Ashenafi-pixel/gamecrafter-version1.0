#!/bin/bash

echo "Starting SlotAI Development Environment..."
echo

# Kill any existing Node processes on port 8080
echo "Checking for existing processes on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Start the Node.js server in background
echo "Starting Node.js server on port 8080..."
node server.cjs &
NODE_PID=$!

# Wait a moment for the server to start
sleep 3

# Start the Vite dev server
echo "Starting Vite dev server..."
npm run dev &
VITE_PID=$!

echo
echo "Both servers started!"
echo
echo "Node.js server: http://localhost:8080 (PID: $NODE_PID)"
echo "Vite dev server: http://localhost:5173 (PID: $VITE_PID)"
echo
echo "To stop servers, press Ctrl+C or run: kill $NODE_PID $VITE_PID"

# Wait for both processes
wait $NODE_PID $VITE_PID