@echo off
echo ======================================
echo       SLOTAI SAFE MODE LAUNCHER
echo ======================================
echo This launcher will start SlotAI with memory optimizations

:: Set higher memory limits for Node.js
set NODE_OPTIONS=--max-old-space-size=4096

:: Check if the optimize config exists
if exist vite.config.ts.optimize (
  echo Backing up current vite.config.ts
  copy vite.config.ts vite.config.ts.backup
  echo Applying optimized configuration
  copy vite.config.ts.optimize vite.config.ts
)

:: Create light version of index.html
if not exist index.html.safe (
  echo Creating safer version of index.html
  copy index.html index.html.backup
  
  :: Create a safer version by removing some scripts
  powershell -Command "(Get-Content index.html) -replace '<!-- EMERGENCY NUCLEAR NAVIGATION FIX -->[^<]*<script src=\"/public/EMERGENCY-FORCE-NAVFIX.js[^<]*</script>', '<!-- Disabled for safe mode -->' | Set-Content index.html.safe"
)

:: Use the safer index.html
copy index.html.safe index.html

echo.
echo Starting in SAFE MODE...
echo.

:: Run with safe mode URL parameter
start http://localhost:5173/?safe_mode=true

:: Start the dev server with memory optimizations
npm run dev

:: Restore original config after server stops
echo Restoring original configuration...
if exist vite.config.ts.backup (
  copy vite.config.ts.backup vite.config.ts
  del vite.config.ts.backup
)

if exist index.html.backup (
  copy index.html.backup index.html
  del index.html.backup
)

echo.
echo ======================================
echo            SERVER STOPPED
echo ======================================
echo.
pause