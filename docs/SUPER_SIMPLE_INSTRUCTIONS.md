# Super Simple Logging Instructions

These instructions are for using the standalone logging system with your Vite app.

## Setup (One-Time Only)

1. Run `direct-install.bat`
   - This creates a separate folder with its own Node.js setup
   - Completely isolated from your main project
   - Installs only Express, CORS, and body-parser

## Start the Logging System

2. Run `super-simple-log-direct.bat`
   - This starts the log server on port 3501
   - Keeps it running in a separate command window

## Start Your App (In a Separate Command Prompt)

3. Open a new command prompt
4. Run: `npm run dev`
   - This starts your Vite development server normally

## Access Everything

- Your Vite app: http://localhost:5173
- Log viewer: http://localhost:3501/get-logs

## How It Works

- The log server is completely standalone
- It receives logs via HTTP requests from your app
- The MEGA-LOGGER script in your app sends data to the log server
- All data is saved to the STEPFUCK.log file

This approach keeps everything completely separate and avoids any dependency or compatibility issues.