@echo off
echo Starting super simple standalone logging system...

:: Copy the log server to the temporary directory
copy log-server.cjs log-server-tmp\log-server.cjs

:: Start log server from the temp directory
cd log-server-tmp
start cmd /k "node log-server.cjs"
cd ..

echo.
echo Log server started on port 3501!
echo.
echo 1. View logs at: http://localhost:3501/get-logs
echo 2. Start your Vite server with: npm run dev
echo.
echo Press any key to exit...
pause > nul