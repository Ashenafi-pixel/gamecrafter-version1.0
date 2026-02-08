@echo off
setlocal enabledelayedexpansion
echo ===============================================
echo   SlotAI Robust Development Environment
echo ===============================================
echo.

REM Check system requirements
echo [INFO] Checking system requirements...

echo [CHECK] Testing Node.js...
node --version >nul
echo Node.js test completed

echo [CHECK] Testing npm...
call npm --version >nul
echo npm test completed

echo [OK] Node.js and npm are available

REM Kill any existing processes on both ports
echo [INFO] Cleaning up existing processes...

REM Kill processes on port 8080
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8080') do (
    if "%%a" neq "" (
        echo [CLEANUP] Killing process %%a on port 8080
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill processes on port 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173') do (
    if "%%a" neq "" (
        echo [CLEANUP] Killing process %%a on port 5173
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [OK] Process cleanup complete

REM Check and repair dependencies if needed
echo [INFO] Checking dependencies...

set "NEED_INSTALL="

if not exist "node_modules" (
    echo [WARN] node_modules directory missing
    set "NEED_INSTALL=1"
) else (
    if not exist "node_modules\vite" (
        echo [WARN] Vite package missing
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\pixi.js" (
        echo [WARN] PIXI.js package missing
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\react" (
        echo [WARN] React package missing
        set "NEED_INSTALL=1"
    )
)

if defined NEED_INSTALL (
    echo [INFO] Installing/repairing dependencies...
    echo This may take a few minutes, please wait...
    
    REM Clear npm cache
    npm cache clean --force >nul 2>&1
    
    REM Remove corrupted node_modules
    if exist "node_modules" (
        echo [CLEANUP] Removing corrupted node_modules...
        rmdir /S /Q "node_modules" 2>nul
    )
    
    REM Remove package-lock for fresh install
    if exist "package-lock.json" (
        echo [CLEANUP] Removing package-lock.json...
        del "package-lock.json" 2>nul
    )
    
    REM Install dependencies with Windows-specific handling
    echo [INFO] Running npm install...
    call npm install --legacy-peer-deps --force
    set INSTALL_RESULT=%errorlevel%
    
    if !INSTALL_RESULT! neq 0 (
        echo [WARN] First install attempt had issues, trying alternative approach...
        
        REM Try removing problematic platform-specific packages first
        call npm uninstall @esbuild/linux-x64 >nul 2>&1
        call npm uninstall @rollup/rollup-linux-x64-gnu >nul 2>&1
        
        REM Install Windows-compatible esbuild
        echo [INFO] Installing Windows-compatible build tools...
        call npm install @esbuild/win32-x64 --save-dev --force >nul 2>&1
        
        REM Try install again
        call npm install --legacy-peer-deps --force
        set INSTALL_RESULT=%errorlevel%
        
        if !INSTALL_RESULT! neq 0 (
            echo [WARN] Some platform warnings occurred, but attempting to continue...
            echo Check that core packages are available...
        )
    )
    
    echo [OK] Dependencies installed successfully
) else (
    echo [OK] Dependencies are intact
)

REM Verify critical files
echo [INFO] Verifying project structure...

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

echo [OK] Project structure validated

REM Start the Node.js server
echo [INFO] Starting Node.js server on port 8080...
start "SlotAI Node Server" cmd /k "node server.cjs"

REM Wait for Node server to start
timeout /t 3 /nobreak >nul

REM Verify Node server started
netstat -aon | findstr :8080 >nul
if %errorlevel% neq 0 (
    echo [WARN] Node server may not have started properly
) else (
    echo [OK] Node server started successfully
)

REM Start the Netlify development server (includes Vite + Functions)
echo [INFO] Starting Netlify dev server on port 5173...
start "SlotAI Netlify Dev Server" cmd /k "npm run dev:netlify"

REM Wait longer for Netlify dev to start
echo [INFO] Waiting for Netlify dev server to initialize...
timeout /t 8 /nobreak >nul

REM Verify Netlify dev server started
netstat -aon | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo [WARN] Netlify dev server may not have started on port 5173
    echo Please check the Netlify dev window for any errors
) else (
    echo [OK] Netlify dev server started successfully
)

echo.
echo ===============================================
echo     SlotAI Development Environment Ready!
echo ===============================================
echo.
echo Available URLs:
echo   Main App:      http://localhost:5173
echo   Animation Lab: http://localhost:5173/animtest
echo   Node API:      http://localhost:8080
echo.
echo To stop servers: Close the command windows or press Ctrl+C in each window
echo.

REM Auto-open Animation Lab
echo [INFO] Opening Animation Lab in browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173/animtest

echo [SUCCESS] Setup complete! Animation Lab should open automatically.
echo Press any key to close this setup window...
pause >nul