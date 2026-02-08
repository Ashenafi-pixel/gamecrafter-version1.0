# SlotAI Crash Prevention Documentation

This document outlines the changes implemented to prevent browser crashes in the SlotAI application, particularly addressing the `STATUS_BREAKPOINT` error that occurs immediately after app load.

## Overview of Implemented Solutions

The following features have been implemented to address memory issues and prevent crashes:

1. **Safe Boot Mode** - A minimal application mode triggered via URL parameters
2. **Memory-Safe Logging** - Replacement for MEGA-LOGGER with memory limits
3. **Early Navigation System** - Navigation fixes that load before components
4. **Memory Monitoring** - Real-time memory usage tracking with emergency shutdown
5. **React Tree Optimization** - Conditional rendering of lightweight components

## How to Use Safe Mode

Add `?safeMode=true` to any SlotAI URL to activate safe mode:

```
http://localhost:3500/?safeMode=true
```

Safe mode provides the following benefits:
- No slot animations or heavy visual effects
- No texture loading
- Minimal UI shell with basic navigation
- Disabled mega-logger (or limited to 200 logs)
- Memory monitoring tools only

## Key Files and Their Functions

### 1. SafeBootApp.tsx

A minimal React application that loads when safe mode is activated. It provides:
- Basic navigation between steps without animations
- Game type selection
- Memory-safe state management
- Error boundaries to prevent crashes

### 2. SAFE-MEGA-LOGGER.js

A memory-safe replacement for MEGA-LOGGER with:
- Reduced log capacity (200 max logs vs. 10,000)
- Memory safety checks to prevent excessive memory usage
- Optional disabling via URL parameter
- Reduced storage frequency to minimize writes

### 3. EARLY-EMERGENCY-NAV.js

An early-loading navigation fix that:
- Loads before DOM is ready
- Provides global navigation functions
- Creates a minimal emergency UI when needed
- Tracks navigation state to avoid duplicate attempts

### 4. Modified main.tsx

Changed to conditionally render SafeBootApp instead of PremiumApp when in safe mode:
```tsx
root.render(
  <StrictMode>
    {isSafeMode ? (
      // Render SafeBootApp in safe mode
      <SafeBootApp key={`safe-${BUILD_TIME}`} />
    ) : (
      // Use PremiumApp normally
      <PremiumApp key={BUILD_TIME} />
    )}
  </StrictMode>
);
```

### 5. Updated index.html

Updated to:
- Preload critical scripts
- Use SAFE-MEGA-LOGGER instead of MEGA-LOGGER
- Add memory monitoring
- Trigger emergency shutdown when memory exceeds threshold

## Memory Monitoring System

The application now includes a memory monitoring system that:
1. Checks memory usage every 3 seconds
2. Logs current usage to console
3. Triggers emergency shutdown if memory exceeds 85% of available heap
4. Automatically reloads in safe mode with a visual indicator

Example memory usage output:
```
Memory usage: 256.45MB / 2048.00MB (12.52%)
```

## Emergency Recovery Features

If the application crashes or memory usage becomes critical:

1. **Automatic Safe Mode Redirection**
   - When memory usage exceeds 85%, the app automatically reloads in safe mode
   - URL will change to: `/?safeMode=true&memoryEmergency=true&t=[timestamp]`

2. **Manual Recovery Options**
   - Visit `/?safeMode=true` directly
   - Use the "Safe Mode" button in error notifications
   - Use emergency navigation UI to jump to specific app sections

3. **Error Counting**
   - After 10 errors, automatic redirection to safe mode occurs

## Implementation Details

### Memory Monitoring Code

```javascript
// Check memory usage every 3 seconds
function checkMemoryUsage() {
  try {
    if (performance && performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
      const memoryLimit = performance.memory.jsHeapSizeLimit;
      const usagePercent = (memoryUsage / memoryLimit) * 100;
      
      console.log(`Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB / ${(memoryLimit / 1024 / 1024).toFixed(2)}MB (${usagePercent.toFixed(2)}%)`);
      
      // If we're using more than 85% of available memory, initiate emergency shutdown
      if (usagePercent > 85) {
        console.error('CRITICAL: Memory usage too high, initiating emergency shutdown');
        
        // Clear localStorage and reload in safe mode
        localStorage.setItem('slotai_memory_crash', 'true');
        window.location.href = '/?safeMode=true&memoryEmergency=true&t=' + Date.now();
        return true;
      }
    }
  } catch (e) {
    console.error('Error checking memory usage', e);
  }
  return false;
}

// Check memory every 3 seconds
const memoryInterval = setInterval(checkMemoryUsage, 3000);
```

### Safe Mode Detection

```typescript
// Check for safe mode URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isSafeMode = urlParams.has('safeMode');

// If in safe mode, output status to console
if (isSafeMode) {
  console.log('🛡️ SAFE MODE ACTIVE - Loading minimal UI with limited functionality');
}
```

## Troubleshooting Guide

If you experience crashes despite these measures:

1. **Clear Browser Cache**
   - Force reload with Ctrl+F5
   - Or use the "Hard Reload" button in safe mode

2. **Reset Application State**
   - In safe mode, click "Show Advanced Options"
   - Select "Clear All localStorage"
   - Reload the page

3. **Check Console for Memory Usage**
   - Open browser developer tools (F12)
   - Check console for memory usage logs
   - If memory usage is consistently high, report the issue

4. **Verify Script Loading**
   - Check that EARLY-EMERGENCY-NAV.js loads first
   - Ensure SAFE-MEGA-LOGGER.js is being used instead of MEGA-LOGGER.js
   - Confirm SafeBootApp is rendering in safe mode