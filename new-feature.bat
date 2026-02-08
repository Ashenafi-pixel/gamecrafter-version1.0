@echo off
setlocal enabledelayedexpansion

:: New Feature Branch Script for SlotAI Project
:: Usage: new-feature.bat feature-name "Feature description"

:: Check if feature name was provided
if "%~1"=="" (
  echo Error: Please provide a feature name
  echo Usage: new-feature.bat feature-name "Feature description"
  exit /b 1
)

set FEATURE_NAME=%~1
set DESCRIPTION=%~2
if "%DESCRIPTION%"=="" set DESCRIPTION=New feature: %FEATURE_NAME%

echo === SlotAI New Feature Script ===
echo Creating new feature branch: %FEATURE_NAME%

:: Make sure we have the latest main branch
echo Updating main branch...
git checkout main
git pull

:: Create and switch to new branch
echo Creating branch: %FEATURE_NAME%
git checkout -b "%FEATURE_NAME%"

:: Initial commit on the new branch
echo Creating initial commit for feature...
type nul > .feature-%FEATURE_NAME%
git add .feature-%FEATURE_NAME%
git commit -m "Start feature: %DESCRIPTION%

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

:: Push to GitHub
echo Pushing new branch to GitHub...
git push -u origin "%FEATURE_NAME%"

:: Show completion message
echo Feature branch created successfully\!
echo Branch name: %FEATURE_NAME%
echo Description: %DESCRIPTION%
echo ===========================
echo Next steps:
echo 1. Make changes to implement your feature
echo 2. Use git-save.bat "Your commit message" to save progress
echo 3. When ready, create a pull request on GitHub to merge into main
