@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo   SlotAI Auto-Recovery Development Environment
echo ===============================================
echo.

REM Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Define log file
set "LOGFILE=%~dp0startup.log"
echo Starting SlotAI Auto-Recovery at %date% %time% > "%LOGFILE%"

echo %BLUE%[INFO]%NC% Checking system requirements...

REM Check if Node.js is installed
echo %BLUE%[CHECK]%NC% Testing Node.js...
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%NC% Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available  
echo %BLUE%[CHECK]%NC% Testing npm...
npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%NC% npm is not available
    pause
    exit /b 1
)

echo %GREEN%[OK]%NC% Node.js and npm are available

REM Function to kill processes on specific ports
echo %BLUE%[INFO]%NC% Cleaning up existing processes...

REM Kill processes on port 8080 (Node server)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8080') do (
    if "%%a" neq "" (
        echo %YELLOW%[CLEANUP]%NC% Killing process %%a on port 8080
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill processes on port 5173 (Vite server)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173') do (
    if "%%a" neq "" (
        echo %YELLOW%[CLEANUP]%NC% Killing process %%a on port 5173
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill any lingering node processes that might be holding file locks
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if !errorlevel! equ 0 (
    echo %YELLOW%[CLEANUP]%NC% Stopping lingering Node.js processes...
    taskkill /F /IM node.exe >nul 2>&1
)

REM Wait for processes to fully terminate
timeout /t 2 /nobreak >nul

echo %GREEN%[OK]%NC% Process cleanup complete

REM Check if package.json exists
if not exist "package.json" (
    echo %RED%[ERROR]%NC% package.json not found in current directory
    echo Please run this script from the SlotAI project root
    pause
    exit /b 1
)

REM Check and validate dependencies
echo %BLUE%[INFO]%NC% Checking dependencies...

REM Check if node_modules exists and has basic structure
if not exist "node_modules" (
    echo %YELLOW%[WARN]%NC% node_modules directory missing
    set "NEED_INSTALL=1"
) else (
    REM Check for critical packages
    if not exist "node_modules\vite" (
        echo %YELLOW%[WARN]%NC% Vite package missing
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\pixi.js" (
        echo %YELLOW%[WARN]%NC% PIXI.js package missing  
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\react" (
        echo %YELLOW%[WARN]%NC% React package missing
        set "NEED_INSTALL=1"
    )
)

REM Check package.json integrity for PIXI.js
findstr /C:"pixi.js" package.json >nul
if !errorlevel! neq 0 (
    echo %YELLOW%[WARN]%NC% PIXI.js not found in package.json
    set "NEED_INSTALL=1"
)

REM Install/repair dependencies if needed
if defined NEED_INSTALL (
    echo %BLUE%[INFO]%NC% Installing/repairing dependencies...
    echo This may take a few minutes...
    
    REM Clear npm cache to prevent corruption issues
    npm cache clean --force >nul 2>&1
    
    REM Remove corrupted node_modules if it exists
    if exist "node_modules" (
        echo %YELLOW%[CLEANUP]%NC% Removing corrupted node_modules...
        rmdir /S /Q "node_modules" 2>nul
    )
    
    REM Remove package-lock.json to force fresh resolution
    if exist "package-lock.json" (
        echo %YELLOW%[CLEANUP]%NC% Removing package-lock.json for fresh install...
        del "package-lock.json" 2>nul
    )
    
    REM Install dependencies with specific flags for better compatibility
    echo %BLUE%[INFO]%NC% Running npm install with recovery options...
    npm install --no-package-lock --legacy-peer-deps --force >> "%LOGFILE%" 2>&1
    
    if !errorlevel! neq 0 (
        echo %RED%[ERROR]%NC% npm install failed, trying alternative approach...
        
        REM Try with different flags
        npm install --legacy-peer-deps >> "%LOGFILE%" 2>&1
        
        if !errorlevel! neq 0 (
            echo %RED%[ERROR]%NC% Dependency installation failed
            echo Check the log file: %LOGFILE%
            echo.
            echo Possible solutions:
            echo 1. Delete node_modules and package-lock.json manually
            echo 2. Run: npm cache clean --force
            echo 3. Run: npm install --legacy-peer-deps
            echo 4. Check your internet connection
            pause
            exit /b 1
        )
    )
    
    echo %GREEN%[OK]%NC% Dependencies installed successfully
) else (
    echo %GREEN%[OK]%NC% Dependencies appear to be intact
)

REM Verify critical files exist
echo %BLUE%[INFO]%NC% Verifying project structure...

set "MISSING_FILES="
if not exist "src\main.tsx" set "MISSING_FILES=!MISSING_FILES! src\main.tsx"
if not exist "src\App.tsx" set "MISSING_FILES=!MISSING_FILES! src\App.tsx"
if not exist "index.html" set "MISSING_FILES=!MISSING_FILES! index.html"
if not exist "vite.config.ts" if not exist "vite.config.ts.backup" set "MISSING_FILES=!MISSING_FILES! vite.config.ts"

if defined MISSING_FILES (
    echo %RED%[ERROR]%NC% Missing critical files:!MISSING_FILES!
    pause
    exit /b 1
)

REM Restore vite.config.ts if it was backed up
if not exist "vite.config.ts" if exist "vite.config.ts.backup" (
    echo %YELLOW%[FIX]%NC% Restoring vite.config.ts from backup...
    copy "vite.config.ts.backup" "vite.config.ts" >nul
)

echo %GREEN%[OK]%NC% Project structure validated

REM Start Node.js server with error handling
echo %BLUE%[INFO]%NC% Starting Node.js server (port 8080)...

if not exist "server.cjs" (
    echo %RED%[ERROR]%NC% server.cjs not found
    pause
    exit /b 1
)

start "SlotAI Node Server" cmd /k "node server.cjs"

REM Wait and verify Node server started
timeout /t 3 /nobreak >nul
netstat -aon | findstr :8080 >nul
if !errorlevel! neq 0 (
    echo %YELLOW%[WARN]%NC% Node server may not have started on port 8080
    echo Continuing anyway...
) else (
    echo %GREEN%[OK]%NC% Node server started successfully
)

REM Start Vite development server with error handling  
echo %BLUE%[INFO]%NC% Starting Vite development server (port 5173)...

REM Check if vite command is available
npx vite --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%NC% Vite is not available via npx
    echo Trying to install vite globally...
    npm install -g vite
)

start "SlotAI Vite Dev Server" cmd /k "npx vite --host 0.0.0.0 --port 5173"

REM Wait longer for Vite to start (it's slower)
echo %BLUE%[INFO]%NC% Waiting for Vite server to initialize...
timeout /t 8 /nobreak >nul

REM Verify Vite server is running
netstat -aon | findstr :5173 >nul
if !errorlevel! neq 0 (
    echo %YELLOW%[WARN]%NC% Vite server may not have started on port 5173
    echo This might take a moment longer...
    timeout /t 5 /nobreak >nul
    netstat -aon | findstr :5173 >nul
    if !errorlevel! neq 0 (
        echo %RED%[ERROR]%NC% Vite server failed to start
        echo Check vite-server.log for errors
        pause
        exit /b 1
    )
)

echo %GREEN%[OK]%NC% Vite development server started successfully

REM Final verification and user information
echo.
echo %GREEN%===============================================%NC%
echo %GREEN%     SlotAI Development Environment Ready!    %NC%
echo %GREEN%===============================================%NC%
echo.
echo %BLUE%Available URLs:%NC%
echo   • Main App:      http://localhost:5173
echo   • Animation Lab: http://localhost:5173/animtest  
echo   • Node API:      http://localhost:8080
echo.
echo %BLUE%Log Files:%NC%
echo   • Startup Log:   %LOGFILE%
echo.
echo %YELLOW%To stop servers:%NC%
echo   Close the command windows or press Ctrl+C in each window
echo.

REM Try to open the Animation Lab automatically
echo %BLUE%[INFO]%NC% Opening Animation Lab in default browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173/animtest

echo %GREEN%[SUCCESS]%NC% Setup complete! Animation Lab should open automatically.
echo.
echo Press any key to exit this setup window...
pause >nul