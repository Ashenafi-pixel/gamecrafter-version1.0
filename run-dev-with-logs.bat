@echo off
echo Starting logging system with development server...

:: Start log server
start cmd /k "node log-server.cjs"

:: Wait a moment for the log server to start
timeout /t 2 > nul

:: Start development server (Vite)
start cmd /k "npm run dev"

:: Wait a moment for the server to start
timeout /t 3 > nul

:: Open browser to the development server
start http://localhost:5173

echo.
echo ===== SlotAI with MEGA-LOGGER (DEV MODE) =====
echo Development app: http://localhost:5173
echo Log viewer:      http://localhost:3501/get-logs
echo.
echo Window will close in 10 seconds...
echo ============================================

timeout /t 10