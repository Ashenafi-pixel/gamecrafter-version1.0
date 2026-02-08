@echo off
echo Installing required dependencies for logging system...

:: Make sure we have the key dependencies for the logging server
npm install --save express cors body-parser --no-optional

echo.
echo Dependencies installed!
echo You can now run the logging system with any of these commands:
echo.
echo   just-dev-with-logs.bat     - Run with Vite dev server (port 5173)
echo   run-with-logs.bat          - Run with simple static server (port 3500)
echo.
echo Press any key to exit...
pause > nul