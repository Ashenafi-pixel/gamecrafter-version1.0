#\!/bin/bash
# Stop script for SlotAI server

# Kill any running node server
echo "Stopping any running servers..."
pkill -f "node.*static-server.cjs" || true
echo "Server stopped."
