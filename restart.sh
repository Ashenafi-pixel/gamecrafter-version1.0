#!/bin/bash
# Restart script for SlotAI server

# Kill any running node server
echo "Stopping any running servers..."
pkill -f "node.*static-server.cjs" || true

# Start the server in the background
echo "Starting the server..."
node static-server.cjs &

# Output the URL
echo "Server should be available at:"
echo "http://localhost:3500"
echo ""
echo "To stop the server, run: ./stop-server.sh or pkill -f 'node.*static-server.cjs'"