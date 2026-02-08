@echo off
echo Starting standalone logging server (super simple version)...

:: Start the standalone log server directly from its own directory
cd log-server-tmp
start cmd /k "node log-server.cjs"
cd ..

echo.
echo =================================================
echo  STANDALONE LOG SERVER RUNNING
echo =================================================
echo.
echo Log server is running at: http://localhost:3501
echo View logs at: http://localhost:3501/get-logs
echo Test server at: http://localhost:3501/test
echo.
echo Now in a separate command prompt, run:
echo npm run dev
echo.
echo Press any key to exit...
pause > nul