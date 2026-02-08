@echo off
echo Starting SlotAI server with folder structure setup...

REM Create required directories if they don't exist
mkdir public\game-assets 2>nul
mkdir public\saved-images 2>nul

REM Start the server
node server.cjs

echo Server stopped.