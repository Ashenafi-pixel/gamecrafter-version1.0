@echo off
setlocal enabledelayedexpansion

:: Git Save Script for SlotAI Project
:: Usage: git-save.bat "Your descriptive commit message"

:: Check if a commit message was provided
if "%~1"=="" (
  echo Error: Please provide a commit message
  echo Usage: git-save.bat "Your descriptive commit message"
  exit /b 1
)

set COMMIT_MESSAGE=%~1

echo === SlotAI Git Save Script ===
echo Saving changes to GitHub...

:: Check for unstaged changes
echo Checking for changes...
git status -s

:: Stage all changes
echo Staging changes...
git add .

:: Commit with message
echo Committing changes with message: %COMMIT_MESSAGE%
git commit -m "%COMMIT_MESSAGE%

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

:: Push to GitHub
echo Pushing to GitHub...
git push

:: Show completion message
echo Changes saved successfully to GitHub\!
echo Commit message: %COMMIT_MESSAGE%
echo ===========================
