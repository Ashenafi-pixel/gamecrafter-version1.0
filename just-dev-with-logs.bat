@echo off
echo Starting logging system with pure Vite development server...

:: Start log server in a new window
start cmd /k "node log-server.cjs"

:: Wait a moment for the log server to start
timeout /t 2 > nul

:: Create a short-lived setup script to modify MEGA-LOGGER.js to point to Vite port
echo Configuring logger for Vite port...

:: Start Vite development server in a new window 
start cmd /k "npm run dev"

:: Wait for Vite to start
echo Waiting for Vite server to start...
timeout /t 5 > nul

:: Open browser to the development server
start http://localhost:5173

echo.
echo ===== SlotAI DEV MODE with MEGA-LOGGER =====
echo Development app: http://localhost:5173
echo Log viewer:      http://localhost:3501/get-logs
echo.
echo Window will close in 30 seconds. Your servers will remain running.
echo ============================================

timeout /t 30