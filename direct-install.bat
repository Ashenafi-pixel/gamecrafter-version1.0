@echo off
echo Installing logging server dependencies directly...

:: Create a temporary directory for the log server
mkdir log-server-tmp

:: Move into the directory
cd log-server-tmp

:: Initialize a new project with default settings
echo {"name": "log-server", "version": "1.0.0"} > package.json

:: Install just the dependencies we need
npm install express cors body-parser

:: Move back up
cd ..

echo.
echo Dependencies installed in log-server-tmp folder!
echo.
echo Next: Run the super-simple-log-direct.bat script
echo.
echo Press any key to exit...
pause > nul