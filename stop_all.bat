@echo off
echo ==========================================
echo Stopping SlotAI Development Environment
echo ==========================================

echo Terminating all Node.js processes...
taskkill /F /IM node.exe

echo ==========================================
echo All services stopped successfully.
echo ==========================================
ping 127.0.0.1 -n 2 > nul
