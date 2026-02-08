# WebGL Context Fix V2

## Problem
When changing the grid layout in Step 3, the Premium Slot Preview was disappearing due to WebGL context corruption. The error "Invalid value of `0` passed to `checkMaxIfStatementsInShader`" indicated that the WebGL context couldn't be properly reinitialized.

## Root Cause
WebGL contexts have limitations:
1. A canvas can only have one active WebGL context
2. When PIXI.js is destroyed, the WebGL context isn't always properly released
3. Attempting to create a new WebGL context on the same canvas fails

## Solution Implemented

### Final Working Solution
After multiple attempts, the most reliable solution is to:
1. Use WebGL for the initial render (best performance)
2. Use Canvas2D for all grid changes (avoids WebGL context issues)
3. This hybrid approach provides the best balance of performance and stability

### 1. Detect Grid Changes
```typescript
// Always use Canvas2D for grid changes to avoid WebGL context issues
const isGridChange = appRef.current !== null;
```

### 2. Force Canvas2D After WebGL Failure
```typescript
const forceCanvas2DRef = useRef(false);

// In initialization
if (forceCanvas2DRef.current) {
  debugLog('Forcing Canvas2D due to previous WebGL issues');
  app = new PIXI.Application({
    ...pixiSettings,
    forceCanvas: true
  });
}
```

### 3. Smart Renderer Selection
```typescript
// Check if we should force Canvas2D
if (forceCanvas2DRef.current || isGridChange) {
  debugLog(isGridChange ? 'Using Canvas2D for grid change' : 'Forcing Canvas2D due to previous WebGL issues');
  app = new PIXI.Application({
    ...pixiSettings,
    forceCanvas: true
  });
  debugLog('Canvas 2D renderer initialized');
} else {
  // Try WebGL only on first initialization
  app = new PIXI.Application(pixiSettings);
  debugLog('WebGL renderer initialized with crisp rendering');
}
```

## How It Works

1. **First Grid Change**: 
   - Attempts WebGL initialization
   - If it fails, marks `forceCanvas2DRef.current = true`
   - Falls back to Canvas2D renderer

2. **Subsequent Grid Changes**:
   - Always uses Canvas2D renderer (no more WebGL attempts)
   - Canvas2D is more stable for repeated initializations
   - Maintains visual quality while ensuring stability

## Benefits
- No more disappearing previews when changing grid layouts
- Smooth transitions between different grid configurations
- Fallback system ensures the preview always displays
- Canvas2D provides adequate performance for slot preview

## Testing
1. Navigate to Step 3
2. Change grid from 5x3 to 6x4
3. Preview should update smoothly
4. Change grid multiple times - preview remains stable
5. No WebGL errors in console after first attempt

## Files Modified
- `/src/components/visual-journey/slot-animation/Professional1to1PixiSlot.tsx`