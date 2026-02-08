# Step 5 Upload and Preview Fix

## Issues Fixed

### 1. File Upload Not Working
- Added detailed console logging to all upload handlers
- Added explicit accept attributes for common image formats
- Added unique keys to file inputs to prevent React caching issues
- Added error handlers for FileReader operations

### 2. Background/Frame Not Showing in Preview
- Fixed Tier1PixiSlot to look for background at correct path in config
  - Changed from `config?.ui?.background?.url` to `config?.background?.backgroundImage`
  - Changed from `config?.ui?.frame?.url` to `config?.frame`
- Background and frame now properly update when uploaded or generated

### 3. Frame Adjustments Not Applied
- Updated SlotScene `setFrame` method to accept adjustment parameters
- Modified usePixiApp hook to pass frame adjustments
- Tier1PixiSlot now passes frame scale, position, and stretch to PIXI

### 4. Advanced Grid Controls Not Working
- Added `setGridAdjustments` method to SlotScene
- Grid position (x/y offset) now properly moves the entire grid
- Grid scale now properly scales the grid from center
- Symbol square grid toggle now works via `setShowSymbolBackgrounds`

## Technical Changes

### SlotScene.ts
```typescript
// Added methods:
setFrame(url, adjustments?: { scale, position, stretch })
setGridAdjustments({ position, scale })
setShowSymbolBackgrounds(show: boolean)
```

### usePixiApp.ts
```typescript
// Exposed new methods:
setFrame(url, adjustments)
setGridAdjustments(adjustments)
setShowSymbolBackgrounds(show)
```

### Tier1PixiSlot.tsx
```typescript
// Added effects to update:
- Background from correct config path
- Frame with adjustments
- Grid position and scale
- Symbol background visibility
```

## Testing Instructions

1. **Upload Background**
   - Click "Upload Image" in Background section
   - Select any image file
   - Should see console log "Background upload triggered"
   - Background should appear in preview

2. **Upload Frame**
   - Click "Upload Image" in Frame section
   - Select transparent PNG for best results
   - Adjust scale/position/stretch sliders
   - Frame should update in real-time

3. **Advanced Grid Controls**
   - Switch to Advanced tab
   - Toggle "Symbol Square Grid" - blue backgrounds should show/hide
   - Move "Horizontal Offset" slider - grid should move left/right
   - Move "Vertical Offset" slider - grid should move up/down
   - Adjust "Grid Scale" - entire grid should scale

4. **AI Generation**
   - Enter prompts and click Generate for each asset type
   - Generated images should appear in preview

All settings are automatically saved to the store and persist across steps.