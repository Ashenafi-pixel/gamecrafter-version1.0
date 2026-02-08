# Grid Switching Implementation

## Overview
This document outlines the implementation of proper grid switching functionality between portrait and mobile landscape modes in the SlotAI platform.

## Changes Made

### 1. UnifiedSlotPreview Component
- Added orientation change handling with a dedicated useEffect hook
- Passes orientation and isMobile props to the GameEngine renderer
- Forces resize when orientation changes to recalculate optimal symbol sizes

### 2. Renderer Class Enhancements
- Added `setOrientation()` method to handle orientation changes
- Added orientation-aware symbol size calculation:
  - Desktop: 70% screen coverage
  - Mobile landscape: 60% screen coverage  
  - Mobile portrait: 50% screen coverage
- Proper cleanup of ResizeObserver on unmount
- Added missing methods: `setSymbols()`, `updateGridSize()`, `spinReel()`, `stopReel()`, `clearHighlights()`

### 3. GameEngine Updates
- Exposed renderer through a getter property
- Fixed all internal references from `this.renderer` to `this._renderer`
- Ensured proper initialization of renderer with orientation settings

### 4. GridPreviewWrapper
- Properly passes orientation props to UnifiedSlotPreview
- Maintains view mode state (desktop/mobile)
- Responsive UI that adapts to orientation

## How It Works

1. When the user clicks desktop/mobile buttons in GridPreviewWrapper:
   - View mode state updates
   - Props are passed to UnifiedSlotPreview
   
2. UnifiedSlotPreview detects orientation change:
   - Calls renderer.setOrientation()
   - Forces resize to recalculate layout
   
3. Renderer adjusts:
   - Recalculates optimal symbol sizes based on device/orientation
   - Recenters the grid
   - Recreates grid graphics with new dimensions
   
4. ResizeObserver ensures:
   - Container size changes are detected
   - Grid stays responsive to window resizing

## Testing

To test the grid switching:
1. Navigate to Step 3 (Reel Configuration)
2. Click between Desktop/Mobile buttons
3. Verify grid resizes appropriately
4. Check console for orientation change logs
5. Ensure no WebGL context errors occur

## Key Features

- **Responsive Sizing**: Grid automatically adjusts to 50-70% of screen based on device
- **Smooth Transitions**: Fade animations during symbol updates
- **Memory Safe**: Proper cleanup of observers and animations
- **Cross-Step Compatibility**: Works across all steps using the preview

## Next Steps

- Implement actual portrait/landscape detection for real mobile devices
- Add touch controls for mobile mode
- Optimize performance for lower-end devices
- Add orientation lock option in settings