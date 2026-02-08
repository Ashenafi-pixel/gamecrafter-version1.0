@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo   SlotAI Simple Auto-Start (Windows Compatible)
echo ===============================================
echo.

echo [INFO] Checking system requirements...

REM Check Node.js
echo [CHECK] Testing Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check npm
echo [CHECK] Testing npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available
    pause
    exit /b 1
)

echo [OK] Node.js and npm are available

REM Kill existing processes
echo [INFO] Cleaning up existing processes...

REM Kill port 8080
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8080') do (
    if "%%a" neq "" (
        echo [CLEANUP] Killing process %%a on port 8080
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill port 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173') do (
    if "%%a" neq "" (
        echo [CLEANUP] Killing process %%a on port 5173
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [OK] Process cleanup complete

REM Check dependencies
echo [INFO] Checking dependencies...

if not exist "node_modules" (
    echo [WARN] node_modules missing - installing dependencies...
    goto install_deps
)

if not exist "node_modules\vite" (
    echo [WARN] Vite missing - installing dependencies...
    goto install_deps
)

if not exist "node_modules\pixi.js" (
    echo [WARN] PIXI.js missing - installing dependencies...
    goto install_deps
)

echo [OK] Dependencies appear intact
goto start_servers

:install_deps
echo [INFO] Installing dependencies...
echo This may take a few minutes...

REM Clear npm cache
npm cache clean --force >nul 2>&1

REM Remove corrupted modules
if exist "node_modules" (
    echo [CLEANUP] Removing corrupted node_modules...
    rmdir /S /Q "node_modules" 2>nul
)

if exist "package-lock.json" (
    echo [CLEANUP] Removing package-lock.json...
    del "package-lock.json" 2>nul
)

REM Install with legacy flags
echo [INFO] Running npm install...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo [ERROR] npm install failed
    echo Try running manually: npm install --legacy-peer-deps
    pause
    exit /b 1
)

echo [OK] Dependencies installed

:start_servers
REM Verify project structure
if not exist "src\main.tsx" (
    echo [ERROR] src\main.tsx not found
    pause
    exit /b 1
)

if not exist "server.cjs" (
    echo [ERROR] server.cjs not found
    pause
    exit /b 1
)

REM Start Node server
echo [INFO] Starting Node.js server on port 8080...
start "SlotAI Node Server" cmd /k "node server.cjs"

REM Wait for Node server
timeout /t 3 /nobreak >nul

REM Start Vite server
echo [INFO] Starting Vite dev server on port 5173...
start "SlotAI Vite Dev Server" cmd /k "npx vite --port 5173"

REM Wait for Vite
echo [INFO] Waiting for servers to start...
timeout /t 10 /nobreak >nul

REM Verify servers are running
netstat -aon | findstr :8080 >nul
if errorlevel 1 (
    echo [WARN] Node server may not be running on port 8080
)

netstat -aon | findstr :5173 >nul
if errorlevel 1 (
    echo [WARN] Vite server may not be running on port 5173
    echo Please check the Vite window for errors
)

echo.
echo ===============================================
echo      SlotAI Development Environment Ready!
echo ===============================================
echo.
echo Available URLs:
echo   Main App:      http://localhost:5173
echo   Animation Lab: http://localhost:5173/animtest
echo   Node API:      http://localhost:8080
echo.
echo To stop servers: Close the command windows
echo.

REM Open Animation Lab
echo [INFO] Opening Animation Lab...
start http://localhost:5173/animtest

echo [SUCCESS] Setup complete! 
echo Press any key to close this window...
pause >nul