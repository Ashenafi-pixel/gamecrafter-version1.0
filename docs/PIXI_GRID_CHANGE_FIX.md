# PIXI.js Grid Change Fix

## Issue
When changing the grid layout in the Premium Slot Preview, the PIXI.js canvas would disappear with the following error:
```
Invalid value of `0` passed to `checkMaxIfStatementsInShader`
```

This was caused by the WebGL context becoming invalid when trying to reinitialize the PIXI application without proper cleanup.

## Root Cause
1. The PIXI.js application wasn't being properly destroyed before reinitializing
2. WebGL context was left in an invalid state
3. Rapid grid changes could cause multiple initialization attempts to overlap

## Solution

### 1. Enhanced Cleanup in `initializePixi`
```typescript
// Clean up any existing app first
if (appRef.current) {
  debugLog('Cleaning up existing PIXI app before reinitializing');
  try {
    gsap.killTweensOf("*");
    appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
    appRef.current = null;
    spinButtonRef.current = null;
  } catch (cleanupError) {
    console.warn('Cleanup error:', cleanupError);
  }
}
```

### 2. Safer WebGL Settings
```typescript
const pixiSettings: any = {
  view: canvasRef.current,
  width: width,
  height: height,
  backgroundColor: 0x0f172a,
  antialias: true,
  resolution: Math.min(devicePixelRatio, 2),
  autoDensity: true,
  // Add safer WebGL settings
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
  clearBeforeRender: true
};
```

### 3. Complete Reinitialization on Grid Change
Instead of just re-rendering, we now completely destroy and recreate the PIXI application when the grid changes:

```typescript
useEffect(() => {
  if (!isReady) return;
  
  // For grid changes, we need to reinitialize completely to avoid WebGL errors
  if (appRef.current) {
    setIsReady(false);
    
    // Clean up and reinitialize after a short delay
    setTimeout(() => {
      if (appRef.current) {
        debugLog('Destroying app for grid change');
        try {
          gsap.killTweensOf("*");
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
          appRef.current = null;
          spinButtonRef.current = null;
        } catch (error) {
          console.warn('Cleanup error during grid change:', error);
        }
      }
      
      // Reinitialize with new grid
      setTimeout(() => {
        initializePixi();
      }, 100);
    }, 50);
  }
}, [effectiveReels, effectiveRows, refreshKey, ...]);
```

## Testing
1. Navigate to any step with the Premium Slot Preview
2. Change the grid layout (e.g., from 5x3 to 6x4)
3. The preview should smoothly transition without errors
4. Check the console - no WebGL errors should appear
5. The grid should display correctly with the new dimensions

## Additional Improvements
- Added error handling for cleanup operations
- Implemented staged delays to prevent race conditions
- Preserved the DOM fallback system as a safety net
- Enhanced debug logging for better troubleshooting

## Files Modified
- `/src/components/shared/PremiumSlotPreview.tsx`
- `/src/components/visual-journey/slot-animation/Professional1to1PixiSlot.tsx`

## Additional Notes
The same fix was applied to both components that use PIXI.js for slot rendering. The Professional1to1PixiSlot component had the same WebGL initialization issue and needed the same cleanup enhancements.