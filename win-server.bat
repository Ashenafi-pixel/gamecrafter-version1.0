@echo off
echo Starting server on port 8080...
echo.
echo If this doesn't work, try these debugging steps:
echo 1. Run 'netstat -an | findstr :8080' to see if the port is in use
echo 2. Try a different port number in the server file
echo 3. Disable Windows firewall temporarily
echo 4. Make sure Node.js is installed in Windows
echo.
node.exe dist-server.cjs
pause