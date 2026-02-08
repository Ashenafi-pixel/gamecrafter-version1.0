@echo off
echo Stopping any running servers...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak

echo Cleaning caches...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite-cache rmdir /s /q .vite-cache
if exist dist rmdir /s /q dist

echo Cleaning npm cache...
call npm cache clean --force

echo Starting dev server with clean slate...
call npm run dev
