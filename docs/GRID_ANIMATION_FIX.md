# Grid Animation Fix - Symbol Scaling Issues

## Problems Fixed
1. **Symbols "getting bigger as the moon then small again"** - Symbols were scaling incorrectly during grid layout changes
2. **Missing symbol files** - `medium_1.png` and `medium_2.png` files don't exist (should be `mid_1.png` and `mid_2.png`)
3. **ColorMatrixFilter deprecation warning** - Using deprecated filter API

## Solutions Implemented

### 1. Fixed Symbol File Names
- Changed `medium_1` and `medium_2` references to `mid_1` and `mid_2` to match actual files
- This prevents texture loading errors that were causing scaling issues

### 2. Improved Scale Animation Handling
- Added proper scale preservation during fade animations
- Set conservative initial scale (based on 200px estimate) to prevent huge symbols
- Added smooth scale transitions when textures load
- Ensured scale is maintained correctly during grid changes

### 3. Better Texture Loading Management
- Added animated scale transitions when textures finish loading
- Prevents jarring visual changes when actual texture dimensions are known
- Uses GSAP for smooth 0.2s transitions

## Code Changes

### `/src/components/slot-visualization/Tier1PixiSlot.tsx`
- Fixed default symbol names to match actual files

### `/src/engine/pixi/SlotScene.ts`
1. Added scale preservation in fade animations
2. Set initial opacity to 1 for new sprites
3. Added smooth scale transitions for texture loading
4. Set conservative initial scale to prevent oversized symbols

## Result
- Symbols now maintain consistent size during grid changes
- No more "moon-sized" symbols during transitions
- Smooth animations when changing grid layouts
- No texture loading errors

## Testing
The preview should now show:
- Consistent symbol sizing during grid changes
- Smooth fade transitions without scale issues
- No texture loading errors in console
- Proper symbol display with correct file references