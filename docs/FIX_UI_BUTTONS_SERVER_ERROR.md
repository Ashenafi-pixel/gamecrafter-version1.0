# Fix for UI Buttons 500 Server Error

## Issue
UI buttons are generated and saved correctly but getting 500 errors when loading from `/game-assets` paths.

## Root Cause
The Node.js server (on port 8080) is not running or not properly configured to serve the game assets.

## Quick Fix

### Option 1: Use the Combined Startup Script (Recommended)
```bash
# For Windows:
./start-both-servers.bat

# For Mac/Linux:
./start-both-servers.sh
```

This script will:
1. Kill any existing processes on port 8080
2. Start the Node.js server
3. Wait for it to initialize
4. Start the Vite dev server

### Option 2: Start Servers Manually
```bash
# Terminal 1 - Start Node.js server
node server.cjs

# Terminal 2 - Start Vite dev server  
npm run dev
```

### Option 3: Temporary Workaround (Already Applied)
The code now uses blob URLs as fallback when server paths fail. This means buttons will still appear even if the server is down, but they won't persist across page refreshes.

## Verification Steps

1. After starting both servers, check that you can access:
   - Node.js server: http://localhost:8080
   - Vite dev server: http://localhost:5173

2. Generate UI buttons in Step 5
3. Check browser console for messages:
   - Success: "Successfully preloaded spinButton from /game-assets/..."
   - Fallback: "Using blob URL fallback for spinButton"

4. Check Network tab in DevTools:
   - Should see requests to `/game-assets/...` with 200 status
   - If you see 500 errors, the Node.js server needs restarting

## Permanent Solution

The vite.config.ts has been updated with proper proxy configuration:
```javascript
'/game-assets': {
  target: 'http://localhost:8080',
  changeOrigin: true,
  secure: false
}
```

## Troubleshooting

If buttons still don't appear:
1. Clear browser cache (Ctrl+Shift+R)
2. Check if port 8080 is blocked by firewall
3. Verify files exist in `public/game-assets/[gameId]/ui/`
4. Try accessing a button directly: http://localhost:8080/game-assets/brother-azty_20250526/ui/ui_spinButton_spinbutton.png

## What Changed
1. Added blob URL fallback in Step5_GameAssets.tsx
2. Enhanced error logging in server.cjs
3. Created startup scripts for both servers
4. Updated Vite proxy configuration