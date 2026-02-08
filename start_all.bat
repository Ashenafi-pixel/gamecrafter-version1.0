@echo off
echo ==========================================
echo Starting SlotAI Development Environment
echo ==========================================

echo [1/2] Starting Backend Server (Port 3500)...
start "SlotAI Backend" cmd /k "node server.js"

echo [2/2] Starting Frontend App (Port 5173)...
start "SlotAI Frontend" cmd /k "npm run dev"

echo ==========================================
echo All services started! 
echo Backend running at http://localhost:3500
echo Frontend running at http://localhost:5173
echo ==========================================
ping 127.0.0.1 -n 3 > nul
