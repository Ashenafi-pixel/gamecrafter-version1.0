# Symbol Sizing and GlowFilter Fix

## Problems Fixed
1. **Symbols appearing "huge as a planet"** - The symbols were not properly scaled to fit within the grid cells
2. **PIXI.filters.GlowFilter not a constructor** - GlowFilter is not available in the standard PIXI v7 bundle

## Solutions Implemented

### 1. Dynamic Symbol Sizing
- Symbols now scale based on actual texture dimensions rather than assumed 200px size
- Added padding (20px) to ensure symbols don't touch cell edges
- Implemented texture loading detection to properly scale after load

### 2. Adaptive Grid Sizing
- Grid cells now automatically adjust based on available screen space
- Formula: `optimalSize = min(screenWidth * 0.8 / reels, screenHeight * 0.7 / rows, 150px)`
- Symbol size = 90% of optimal size, padding = 10%
- Maximum symbol size capped at 150px to prevent oversized symbols

### 3. GlowFilter Alternative
- Replaced unavailable GlowFilter with ColorMatrixFilter
- Uses brightness adjustment (1.5x) to create highlight effect
- Works with standard PIXI v7 without additional dependencies

## Code Changes

### `/src/engine/pixi/SlotScene.ts`
1. Updated symbol scaling logic to use actual texture dimensions
2. Added adaptive sizing based on grid configuration and screen size
3. Replaced GlowFilter with ColorMatrixFilter for win animations
4. Improved texture loading handling with proper callbacks

## Result
- Symbols now fit properly within grid cells
- Grid adapts to different reel/row configurations
- No more filter errors
- Smooth scaling when changing grid layouts

## Testing
The preview should now show:
- Properly sized placeholder symbols (with coordinates like "0,0", "1,1")
- Symbols that fit within their grid cells with appropriate padding
- Win animations with brightness effect instead of glow
- Responsive grid that adapts to different configurations