#!/bin/bash

# Kill any existing node servers
pkill -f "node server.cjs" || true

# Start the server in the background
node server.cjs &

echo "Server restarted with image saving feature enabled"
echo "Test by generating symbols in Step 4"