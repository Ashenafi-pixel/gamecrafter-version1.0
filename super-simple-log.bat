@echo off
echo Starting super simple logging system...

:: Start log server (extremely simple version)
start cmd /k "node log-server.cjs"

echo Log server started on port 3501!
echo View logs at: http://localhost:3501/get-logs
echo.
echo Next, start your application with: npm run dev
echo.
echo Press any key to exit...
pause > nul