#\!/bin/bash

# Stop any running servers
echo "Stopping any running servers..."
pkill -f "node.*server" || true
pkill -f "npm run dev" || true

# Replace VisualJourney.tsx cache timestamp to force reload
touch /mnt/c/ClaudeCode/slotai/src/components/visual-journey/VisualJourney.tsx

# Create a temporary file with a timestamp to refresh cache
TIMESTAMP=$(date +%s)
echo "// Cache buster timestamp: $TIMESTAMP" > /mnt/c/ClaudeCode/slotai/src/cache-buster.ts
echo "export const CACHE_BUSTER = '$TIMESTAMP';
" >> /mnt/c/ClaudeCode/slotai/src/cache-buster.ts

# Start development server
echo "Starting development server..."
npm run dev
