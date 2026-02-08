# Infinite Resize Loop Fix

## Problem
The renderer was constantly recalculating symbol sizes and logging:
```
Symbol size calculated: 150x150 (portrait, mobile: false)
```

This created an infinite loop that was consuming resources and cluttering the console.

## Root Cause
1. The ResizeObserver was triggering resize events continuously
2. Each resize would update the renderer, which might cause tiny layout shifts
3. These shifts would trigger another resize event, creating an infinite loop
4. There was no debouncing or size change detection

## Solution Implemented

### 1. Added Debouncing
- Added a 100ms debounce to resize events
- Multiple rapid resize events are now coalesced into a single update

### 2. Size Change Detection
- Track the last known size with `lastSize` property
- Only process resize if dimensions actually changed
- Prevents unnecessary recalculations

### 3. Conditional Logging
- Symbol size calculation only logs when the size actually changes
- Reduces console spam significantly

### 4. Proper Cleanup
- Clear resize timeout on component destruction
- Prevents memory leaks from pending timeouts

## Code Changes

```typescript
// Added properties
private resizeTimeout: NodeJS.Timeout | null = null;
private lastSize = { width: 0, height: 0 };

// Enhanced resize handler with debouncing
private handleResize = (): void => {
  if (this.resizeTimeout) {
    clearTimeout(this.resizeTimeout);
  }
  
  this.resizeTimeout = setTimeout(() => {
    if (newWidth !== this.lastSize.width || newHeight !== this.lastSize.height) {
      // Only resize if dimensions changed
      this.lastSize.width = newWidth;
      this.lastSize.height = newHeight;
      // ... perform resize operations
    }
  }, 100); // 100ms debounce
};
```

## Benefits
1. Eliminates infinite resize loops
2. Improves performance by reducing unnecessary calculations
3. Cleaner console output
4. Better resource management

## SES_UNCAUGHT_EXCEPTION Note
The `lockdown-install.js:1 SES_UNCAUGHT_EXCEPTION: null` errors appear to be from a browser extension (likely MetaMask or similar) that uses Secure EcmaScript (SES). These are not related to our application code and can be safely ignored.