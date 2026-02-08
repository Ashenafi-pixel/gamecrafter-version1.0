# Grid Switching Bug Analysis

## Bug Description
When switching between grid configurations (e.g., 5x3 → 4x3 → 6x3), the following issues occur:
1. Symbols disappear or become misaligned
2. "Cannot read properties of null" errors in console
3. Floating placeholder symbols appear in top-left corner
4. Different behavior between 5x3 (professional slot) and other configurations

## Root Causes

### 1. Multiple Rendering Systems
- **5x3 Grid**: Uses `ProfessionalSlotMachine` with reel strips
- **Other Grids**: Uses legacy grid system with individual sprites
- **Problem**: Switching between systems doesn't clean up properly

### 2. Async State Management Issues
```typescript
// Current problematic flow:
1. User changes grid size
2. updateGrid() called immediately
3. Grid clears and recreates
4. Symbols aren't ready yet
5. Placeholder symbols created
6. Real symbols load
7. Both sets of symbols exist
```

### 3. Memory Leaks
- PIXI sprites not properly destroyed
- Event listeners not removed
- Textures remain in memory

### 4. Race Conditions
```typescript
// Multiple async operations competing:
- Symbol texture loading
- Grid size animation
- State updates from Redux
- PIXI rendering updates
```

## Current Code Issues

### In Tier1PixiSlot.tsx:
```typescript
// Problem: Updates grid before symbols are ready
useEffect(() => {
  if (isReady && updateGrid) {
    updateGrid(reels, rows, true) // This runs immediately
    // Symbols might not be loaded yet
  }
}, [reels, rows, isReady, updateGrid, symbols]);
```

### In SlotScene.ts:
```typescript
// Problem: Doesn't wait for cleanup to complete
async updateGrid(reels: number, rows: number) {
  this.clearGrid(); // Not awaited
  await this.createGrid(); // May start before clear finishes
}
```

### In SymbolPool.ts:
```typescript
// Problem: Returns null without proper error handling
getSymbol(textureIdOrUrl: string): PIXI.Sprite | null {
  // Can return null, causing .scale access errors
}
```

## Proposed Solution

### 1. Implement State Machine
```typescript
enum GridState {
  IDLE,
  CLEARING,
  CREATING,
  LOADING_SYMBOLS,
  READY,
  ERROR
}

class GridStateMachine {
  private state: GridState = GridState.IDLE;
  
  async transitionTo(newState: GridState) {
    // Validate transition
    if (!this.canTransition(this.state, newState)) {
      throw new Error(`Invalid transition: ${this.state} → ${newState}`);
    }
    
    // Execute transition
    await this.executeTransition(newState);
  }
}
```

### 2. Proper Cleanup Sequence
```typescript
async updateGrid(reels: number, rows: number) {
  // 1. Set loading state
  this.setState(GridState.CLEARING);
  
  // 2. Stop all animations
  await this.animationManager.stopAll();
  
  // 3. Clear event listeners
  this.removeAllListeners();
  
  // 4. Destroy PIXI objects
  await this.destroyGrid();
  
  // 5. Clear texture cache
  this.textureCache.clear();
  
  // 6. Wait for next frame
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // 7. Create new grid
  this.setState(GridState.CREATING);
  await this.createGrid(reels, rows);
  
  // 8. Load symbols
  this.setState(GridState.LOADING_SYMBOLS);
  await this.loadSymbols();
  
  // 9. Ready
  this.setState(GridState.READY);
}
```

### 3. Unified Rendering System
```typescript
// Use single system for all grid sizes
class UnifiedRenderer {
  private gridSystem: GridSystem;
  
  createGrid(reels: number, rows: number) {
    // Always use same rendering approach
    this.gridSystem = new GridSystem(reels, rows);
    // No special case for 5x3
  }
}
```

### 4. Synchronous Symbol Loading
```typescript
// Ensure symbols are ready before grid creation
async prepareGridChange(reels: number, rows: number) {
  // 1. Load all required assets first
  const requiredSymbols = await this.getRequiredSymbols();
  await this.assetManager.preloadSymbols(requiredSymbols);
  
  // 2. Then update grid
  await this.updateGrid(reels, rows);
}
```

## Implementation Steps

### Day 1: Add State Machine
1. Create GridStateMachine class
2. Add transition validation
3. Add state change events

### Day 2: Fix Cleanup
1. Implement proper destroy sequence
2. Add memory leak detection
3. Test with Chrome DevTools

### Day 3: Unify Renderers
1. Remove ProfessionalSlotMachine special case
2. Use single grid system for all configurations
3. Test all grid sizes

## Testing Plan

### Manual Tests:
1. Switch from 5x3 → 3x3 → 5x3 rapidly
2. Switch grids while symbols are loading
3. Switch grids during spin animation
4. Monitor memory usage during switches

### Automated Tests:
```typescript
describe('Grid Switching', () => {
  it('should clean up previous grid completely', async () => {
    await engine.updateGrid(5, 3);
    const initialSprites = countSprites();
    
    await engine.updateGrid(3, 3);
    const afterSprites = countSprites();
    
    expect(afterSprites).toBe(9); // Only new grid sprites
  });
  
  it('should handle rapid grid changes', async () => {
    const changes = [
      engine.updateGrid(5, 3),
      engine.updateGrid(3, 3),
      engine.updateGrid(6, 4),
      engine.updateGrid(5, 3)
    ];
    
    await Promise.all(changes);
    expect(engine.getState()).toBe(GridState.READY);
  });
});
```

## Success Criteria

After fix implementation:
- ✅ No floating symbols
- ✅ No console errors during grid switch
- ✅ Memory usage stable after multiple switches
- ✅ Smooth visual transition
- ✅ All grid sizes work identically
- ✅ No race conditions