@echo off
setlocal

REM Check if commit message was provided
if "%~1"=="" (
  echo Error: Please provide a commit message
  echo Usage: push-github.bat "Your commit message"
  exit /b 1
)

set COMMIT_MESSAGE=%~1

REM Stage all changes
git add .

REM Commit with message
git commit -m "%COMMIT_MESSAGE%"

REM Prompt for GitHub credentials
set /p USERNAME=Enter your GitHub username: 

REM Prompt for password/token (will be visible in command prompt)
set /p TOKEN=Enter your GitHub personal access token: 

REM Push to GitHub with credentials 
git push https://%USERNAME%:%TOKEN%@github.com/arcadien2k6/slotai.git

echo Push completed!