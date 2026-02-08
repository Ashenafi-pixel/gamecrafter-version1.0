# Premium Slot Preview Integration with Frame and Background Support

## Issue

When uploading frames and backgrounds in the slot creation process, they were not being displayed in the Premium Slot Preview component. This was because:

1. The uploaded frame and background data were stored in the game state but not passed to the UnifiedGridPreview
2. The UnifiedGridPreview component lacked rendering code for frames and backgrounds
3. The data flow between components needed to be enhanced

## Fix Implementation

### 1. Enhanced PremiumLayout Component
- Confirmed that PremiumLayout correctly renders GridPreviewWrapper for Step 5 (index 4)
- Added clarifying comment to indicate the step indices mapping

### 2. Modified GridPreviewWrapper Component
- Added support for passing frame and background data from the store to UnifiedGridPreview
- Ensured data flows through all preview mockups (mobile portrait, mobile landscape, desktop)
- Props passing:
  - framePath: Path to the frame image
  - framePosition: Position data {x, y}
  - frameScale: Scale percentage
  - frameStretch: Stretch data {x, y}
  - backgroundPath: Path to the background image

### 3. Enhanced UnifiedGridPreview Component
- Added frame and background rendering support in both landscape and portrait modes
- Implemented proper layering with z-index to ensure correct display order:
  - Background (z-index: 0)
  - Grid/symbols (z-index: 10)
  - Frame overlay (z-index: 20)
- Added proper position and scaling for frame based on user adjustments
- Ensured background images display correctly with appropriate scaling and positioning

## Technical Details

### Frame Rendering
The frame overlay is implemented with the following features:
- Absolute positioning to overlay the entire grid area
- Background image with contain sizing to preserve aspect ratio
- Transform property to handle position, scale, and stretch adjustments
- Pointer-events: none to allow interaction with grid underneath

```jsx
{framePath && (
  <div 
    className="absolute inset-0 z-20 pointer-events-none" 
    style={{
      backgroundImage: `url(${framePath})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transform: `translate(${framePosition.x}px, ${framePosition.y}px) scale(${frameScale/100}) scaleX(${frameStretch.x/100}) scaleY(${frameStretch.y/100})`
    }}
  />
)}
```

### Background Rendering
The background image is implemented with:
- Absolute positioning to cover the entire grid area
- Background-size: cover to fill the container
- Slight scaling (1.1x) to ensure no gaps at edges
- Opacity adjustment to ensure symbols remain visible

```jsx
{backgroundPath && (
  <div 
    className="absolute inset-0 z-0" 
    style={{
      backgroundImage: `url(${backgroundPath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: 0.9,
      backgroundRepeat: 'no-repeat',
      transform: 'scale(1.1)',
    }}
  />
)}
```

## Additional Enhancements (2025-05-22)

### 0. Fixed Symbol Persistence Across Device Views

Fixed an issue where symbols would disappear or revert to fallback symbols (10, J, Q, K, etc.) when switching between mobile and desktop views:

- **Root Cause**: The symbol request mechanism wasn't reliably retrieving symbols from the store when changing device types
- **Comprehensive Solution**: 
  - Added direct symbol dispatching from the store (more reliable than request mechanism)
  - Added backup checks to load symbols directly from the store when they're missing
  - Implemented aggressive symbol refreshing with source tracking

#### Implementation Details:
- **Direct Store Access**: 
  - Added direct access to the global store using `useGameStore.getState()` 
  - Dispatches symbols directly from store instead of waiting for request responses
  - Tagged events with source information for better debugging
  - Added robust error handling with try-catch blocks

- **Backup Symbol Loading**:
  - Added effect hook to check store for symbols when local array is empty
  - Added force update logic when symbols exist in store but not in local state
  - Implemented multiple symbol requests with timeouts for reliability
  - Fixed dependency arrays to prevent unnecessary re-renders

- **Enhanced Event System**:
  - Added detailed source tracking to all symbol events (`deviceTypeChange`, `orientationChange`, etc.)
  - Added additional logging to track symbol counts and origins
  - Improved event timing with staggered dispatches for better reliability
  - Added fallback mechanisms when primary methods fail

- **Grid Content Refreshing**:
  - Enhanced refresh logic to check for store symbols first
  - Added backup symbol dispatches with delayed timing for reliability
  - Added comprehensive error handling throughout the symbol loading process
  - Fixed "config is not defined" error with proper store access

> **Important Bug Fix (2025-05-22)**: Fixed critical reference error "config is not defined" in UnifiedGridPreview component by using try-catch blocks and properly accessing the store with useGameStore.getState() instead of relying on the context variable.

### 1. Enhanced Frame Auto-Adjustment

The frame auto-adjustment feature has been significantly improved to provide optimal framing for different grid layouts:

#### Key Improvements:
- **Comprehensive Grid Detection**: System now analyzes both grid dimensions and aspect ratio
- **Grid-Specific Optimizations**: Different grid configurations receive customized adjustments
- **Intelligent Positioning**: Certain grids receive position adjustments for better visual balance
- **Aspect Ratio-Based Stretching**: Grid shape determines appropriate horizontal/vertical stretching

#### Auto-Adjustment Logic:
The enhanced algorithm considers:

1. **Grid Density** (total cells)
2. **Aspect Ratio** (width-to-height ratio)
3. **Grid Shape Classification** (wide, tall, or square)

Specific adjustments include:

- **Small Grids (≤12 cells)**:
  - 3x3 (square): 115% scale with slight upward shift
  - 4x3 (wide): 110% scale with horizontal stretch
  - 3x4 (tall): 110% scale with vertical stretch

- **Medium Grids (13-20 cells)**:
  - 4x4 (square): 105% scale with balanced stretch
  - 5x3 (standard): 100% scale (baseline)
  - 5x4 (tall): 100% scale with 108% vertical stretch

- **Large Grids (21-30 cells)**:
  - 6x3 (wide): 97% scale with 112% horizontal stretch
  - 6x4 (wide+tall): 95% scale with balanced stretching
  - 7x3/7x4: Progressively reduced scales with increased horizontal stretch

- **Very Large Grids (>30 cells)**:
  - Base scale: 90%
  - Stretching based on aspect ratio (wide/tall/balanced)

#### Implementation:
```javascript
// Calculate grid density and aspect ratio
const gridDensity = reels * rows;
const aspectRatio = reels / rows;
const isWideGrid = aspectRatio > 1.8;
const isTallGrid = aspectRatio < 1.2;
const isSquareGrid = reels === rows;

// Apply appropriate adjustments based on grid type
if (gridDensity <= 12) {
  if (isSquareGrid) {
    // 3x3 square grid - larger frame with position adjustments
    newScale = 115;
    newPosition = { x: 0, y: -5 }; // Slight upward shift
  } else if (isWideGrid) {
    // 4x3 grid - slightly larger frame
    newScale = 110;
    newStretch = { x: 102, y: 100 }; // Slight horizontal stretch
  }
}
// Additional grid-specific adjustments...
```

### 2. Blue Symbol Background Toggle Improvements

The Blue Symbol Background toggle has been enhanced with improved documentation and clarity:

#### Key Improvements:
- **Enhanced Documentation**: Clearer descriptions of the toggle's purpose
- **Visual Guidance**: Added explanatory text about transparency benefits
- **Cross-Preview Indication**: Note that the setting affects all device previews

#### Implementation:
- Added clarifying description: "Toggle symbol cell transparency"
- Enhanced help text explaining when transparent cells are beneficial
- Improved toggle description to explain effects across all preview types

This setting controls whether symbols have blue/dark backgrounds or appear with transparent cells, which can create a cleaner look with certain frames and backgrounds.

## Testing Notes

When testing this integration, verify:
1. Frames appear properly positioned and scaled in all device mockups
2. Backgrounds display correctly without overwhelming the symbols
3. Both portrait and landscape orientations render correctly
4. User adjustments to frame position and scale are properly applied
5. Frame auto-adjustment works correctly for different grid configurations
6. Blue symbol background toggle properly shows/hides cell backgrounds

## Related Files Modified

1. `/src/components/visual-journey/grid-preview/UnifiedGridPreview.tsx`
   - Added frame and background rendering code
   - Enhanced component to support proper layering
   - Added showCellBackgrounds property

2. `/src/components/visual-journey/grid-preview/GridPreviewWrapper.tsx`
   - Added code to read frame and background data from store
   - Passed frame and background props to UnifiedGridPreview
   - Added support for toggling cell backgrounds

3. `/src/components/layout/PremiumLayout.tsx`
   - Confirmed and clarified step conditions for grid preview rendering

4. `/src/components/visual-journey/steps/Step6_BackgroundCreator.tsx`
   - Enhanced auto-adjustment logic for different grid configurations
   - Improved documentation for the blue symbol backgrounds toggle
   - Added detailed console logging for frame adjustments