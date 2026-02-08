# Fullscreen PIXI Symbol Scaling Fix

## Problem
When clicking the fullscreen button in the Premium Slot Preview, the PIXI canvas and symbols remained the same size instead of scaling up to fill the fullscreen space.

## Solution
Implemented proper fullscreen detection and resize handling in multiple layers:

### 1. Enhanced Resize Detection in usePixiApp Hook
```typescript
// Added fullscreen change event listeners
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Also added window resize listener for better coverage
window.addEventListener('resize', handleResize);
```

### 2. Improved Fullscreen Detection in SlotScene
```typescript
// Better fullscreen detection using multiple methods
const isFullscreen = document.fullscreenElement != null || 
                    width > window.screen.width * 0.9 || 
                    height > window.screen.height * 0.9;

// Increased max symbol size in fullscreen from 250px to 350px
const maxSymbolSize = isFullscreen ? 350 : 180;
```

### 3. Force Resize Events in GridPreviewWrapper
```typescript
// When entering/exiting fullscreen, dispatch resize events
setTimeout(() => {
  window.dispatchEvent(new Event('resize'));
  document.dispatchEvent(new Event('fullscreenchange'));
}, 100);
```

## How It Works

1. **Fullscreen Button Click**: User clicks the amber/brown fullscreen button
2. **Enter Fullscreen**: Browser enters fullscreen mode
3. **Event Detection**: Multiple event listeners detect the fullscreen change
4. **Resize Calculation**: PIXI calculates new dimensions based on fullscreen size
5. **Symbol Scaling**: Symbols are resized up to 350px max (vs 180px normal)
6. **Grid Rebuild**: If size change is significant (>5px), grid is rebuilt with new sizes

## Testing
1. Click the fullscreen button (amber button in top right)
2. Symbols should immediately scale up to fill the screen
3. Grid should maintain proper spacing and centering
4. Exit fullscreen - symbols should scale back down

## Files Modified
- `/src/hooks/usePixiApp.ts` - Added fullscreen event listeners and resize handling
- `/src/engine/pixi/SlotScene.ts` - Improved fullscreen detection and increased symbol sizes
- `/src/components/visual-journey/grid-preview/GridPreviewWrapper.tsx` - Force resize events on fullscreen toggle