@echo off
echo Starting mega simple logging system...

:: Start log server
start cmd /k "node log-server.cjs"

:: Wait a moment for the log server to start
timeout /t 2 > nul

:: Start mega simple application server
start cmd /k "node mega-simple-server.cjs"

:: Wait a moment for the server to start
timeout /t 2 > nul

:: Open browser to the main application
start http://localhost:3500

echo.
echo ===== SlotAI with MEGA-LOGGER =====
echo Main application: http://localhost:3500
echo Log viewer:       http://localhost:3501/get-logs
echo.
echo Window will close in 10 seconds...
echo ====================================

timeout /t 10