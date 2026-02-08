#\!/bin/bash

# Stop any running servers
echo "Stopping any running servers..."
pkill -f "node.*server" || true
pkill -f "npm run dev" || true

# Clean cache directories
echo "Cleaning caches..."
rm -rf node_modules/.vite
rm -rf .vite-cache
rm -rf dist

# Clean npm cache for the project
echo "Cleaning npm cache..."
npm cache clean --force

# Restart the development server with a clean slate
echo "Starting dev server with clean slate..."
npm run dev

