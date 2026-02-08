#!/bin/bash
echo "Starting SlotAI server with folder structure setup..."

# Create required directories if they don't exist
mkdir -p public/game-assets
mkdir -p public/saved-images

# Start the server
node server.cjs

echo "Server stopped."