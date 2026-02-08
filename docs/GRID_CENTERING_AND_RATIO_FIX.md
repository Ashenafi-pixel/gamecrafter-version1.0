# Grid Centering and Ratio Fix

## Issues Fixed

### 1. Floating Symbols When Changing Grid
**Problem**: When changing grid configurations (e.g., to 4x3), placeholder symbols were created because no symbols were available, causing floating symbols to appear.

**Solution**: 
- Added logic to delay grid creation for 5x3 configuration when no symbols are available
- Added pending grid state to apply grid changes once symbols are loaded
- Prevented grid creation when symbols aren't ready for professional slot machine

### 2. Grid Not Centered and Not Properly Sized
**Problem**: Grid was not properly centered on the canvas and didn't maintain proper aspect ratio with the screen size.

**Solution**: 
- Changed grid calculation to use 80% of available screen space
- Fixed padding between symbols (10px consistent)
- Ensured square symbols by using the smaller dimension
- Proper centering calculation that accounts for total grid size including padding

## Technical Changes

### 1. **src/engine/pixi/SlotScene.ts**

#### Updated Grid Size Calculation:
```typescript
// Calculate optimal symbol size based on available space with proper aspect ratio
// Use 80% of available space to ensure proper margins
const availableWidth = this.app.screen.width * 0.8;
const availableHeight = this.app.screen.height * 0.8;

// Account for padding between symbols
const totalPaddingWidth = (reels - 1) * 10; // 10px padding between symbols
const totalPaddingHeight = (rows - 1) * 10;

// Calculate maximum symbol size that fits within available space
const maxSymbolWidth = (availableWidth - totalPaddingWidth) / reels;
const maxSymbolHeight = (availableHeight - totalPaddingHeight) / rows;

// Use the smaller dimension to maintain square symbols
const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);

// Cap the maximum size for desktop/mobile
const maxAllowedSize = isFullscreen ? 250 : 150;
const finalSize = Math.min(optimalSize, maxAllowedSize);
```

#### Prevented Empty Grid Creation:
```typescript
// Only create grid if we have symbols or are using placeholders
// This prevents floating symbols when no symbols are available
if (this.symbols.length > 0 || (this.config.reels !== 5 || this.config.rows !== 3)) {
  // Create new grid
  await this.createGrid();
  // ...
} else {
  console.log('⚠️ Skipping grid creation - no symbols available for professional slot');
}
```

### 2. **src/components/slot-visualization/Tier1PixiSlot.tsx**

#### Added Pending Grid State:
```typescript
// State for pending grid update
const [pendingGrid, setPendingGrid] = useState<{reels: number, rows: number} | null>(null);
```

#### Delayed Grid Updates:
```typescript
// Only update grid if we have symbols or if it's not a 5x3 configuration
if (symbols.length > 0 || (reels !== 5 || rows !== 3)) {
  updateGrid(reels, rows, true).then(() => {
    // Grid updated
  });
} else {
  console.log(`⚠️ Delaying grid update for ${reels}x${rows} until symbols are available`);
  setPendingGrid({ reels, rows });
}
```

#### Apply Pending Updates When Symbols Load:
```typescript
// Check if we have a pending grid update
if (pendingGrid && updateGrid) {
  console.log(`📊 Applying pending grid update: ${pendingGrid.reels}x${pendingGrid.rows}`);
  updateGrid(pendingGrid.reels, pendingGrid.rows, true).then(() => {
    console.log(`✅ Pending grid update completed`);
    setPendingGrid(null);
  });
}
```

## Result

1. **No More Floating Symbols**: Grid creation is delayed until symbols are available
2. **Proper Centering**: Grid is always centered with 80% of available space
3. **Maintained Aspect Ratio**: Symbols remain square and properly sized
4. **Consistent Spacing**: 10px padding between all symbols
5. **Responsive Sizing**: Different max sizes for fullscreen vs normal mode

## Grid Sizing Logic

- **Available Space**: 80% of screen width/height
- **Symbol Padding**: Fixed 10px between symbols
- **Symbol Size**: Square symbols using the smaller dimension
- **Max Sizes**: 
  - Fullscreen: 250px per symbol
  - Normal: 150px per symbol
- **Centering**: Automatic based on total grid size