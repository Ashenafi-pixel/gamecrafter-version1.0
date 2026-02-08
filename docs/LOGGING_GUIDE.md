# SlotAI Comprehensive Logging System

This document explains how to use the ultra-comprehensive MEGA-LOGGER system for debugging the step navigation issues in SlotAI.

## Quick Start

0. **First time setup**:
   - On Windows: Run `install-logger-deps.bat` to install required dependencies
   - On Linux/Mac: Run `npm install --save express cors body-parser`

1. **Choose the best option for your needs**:
   - **Recommended: Use Vite dev server (port 5173)**
     - On Windows: Run `just-dev-with-logs.bat` 
     - This uses Vite's hot-reloading development server

   - **Alternate: Use simple static server (port 3500)**
     - On Windows: Run `run-with-logs.bat`
     - This uses a simple Express server without hot-reloading

2. **Access the application**:
   - Vite dev server: http://localhost:5173
   - Simple static server: http://localhost:3500
   - Log viewer (both methods): http://localhost:3501/get-logs

## Troubleshooting
If you encounter errors:
1. Make sure you've installed dependencies with `install-logger-deps.bat`
2. Try `just-dev-with-logs.bat` for the most reliable method
3. Restart your computer if port 3500 or 3501 is in use

## What Gets Logged

The MEGA-LOGGER tracks **EVERYTHING**:

- ✅ All clicks on any element
- ✅ All button interactions
- ✅ All navigation events (URL changes, history API)
- ✅ All React state changes
- ✅ All localStorage changes
- ✅ All network requests & responses
- ✅ All errors & unhandled exceptions
- ✅ All store state changes

## Log File

All logs are written to:
- `STEPFUCK.log` in the root directory
- Also backed up to localStorage

## Console Access

You can access the logs from the browser console:

```javascript
// Get all logs
window.MEGA_LOGGER.getLogs();

// Export logs to file
window.MEGA_LOGGER.exportLogs();

// Get logs by category
window.MEGA_LOGGER.getLogsByCategory('NAVIGATION');
window.MEGA_LOGGER.getLogsByCategory('CLICK');
window.MEGA_LOGGER.getLogsByCategory('ERROR');
window.MEGA_LOGGER.getLogsByCategory('STORE');
```

## Visual Indicator

A red indicator shows in the bottom-left corner of the screen to indicate logging is active. Click it to export logs.

## Understanding The Navigation Issue

Based on our logging, the step navigation issue appears when:

1. A user clicks the "Next" button in the VisualJourney component
2. The click event handler in VisualJourney.tsx attempts to call `nextStep()`
3. The state update in store.ts either:
   - Fails to properly update the `step` value
   - Updates the value but doesn't trigger a re-render
   - Is interrupted by another component or process

The logs in `STEPFUCK.log` will provide precise details on:
- Exact timing of navigation attempts
- Current store state before and after clicks
- Any errors that occur during navigation
- Whether store.setState() is actually changing the step value
- React component re-render cycles

## Emergency Navigation Options

If normal navigation still fails, the following options are available:

1. **Direct URL Navigation**:
   - Add `?step=2&force=true` to the URL
   - Example: http://localhost:3500/?step=2&force=true

2. **Emergency Console Command**:
   ```javascript
   window.useGameStore.getState().setStep(2)
   ```

3. **Emergency Button**:
   - Use the red emergency navigation button in the bottom-right corner

4. **Standalone Pages**:
   - Access http://localhost:3500/direct-step2.html
   - Access http://localhost:3500/force-step2.html

## Log Server API

The log server runs on port 3501 and provides these endpoints:

- `GET /get-logs` - View all logs
- `POST /write-log` - Write a new log
- `GET /clear-logs` - Clear all logs