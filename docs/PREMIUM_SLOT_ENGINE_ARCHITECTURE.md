# Premium Slot Engine Architecture

## Overview

The Premium Slot Preview system has been completely redesigned to address WebGL context corruption, symbol rendering issues, and cross-step consistency problems. The new architecture uses a modular approach with proper lifecycle management.

## Key Components

### 1. **PremiumSlotEngine** (`/src/components/slot-engine/PremiumSlotEngine.tsx`)
The core rendering component that integrates:
- PIXI.js for high-performance graphics (Canvas2D mode for stability)
- The modular slot engine for game logic
- Proper lifecycle management to prevent WebGL issues
- Responsive layouts for desktop and mobile views
- Symbol fallback system with transparent placeholders

Key features:
- **Single Canvas Instance**: Prevents multiple WebGL contexts
- **Canvas2D Rendering**: Uses `forceCanvas: true` to avoid WebGL issues
- **Engine Integration**: Uses the modular slot engine for game logic
- **Symbol Management**: Handles loading, caching, and fallback creation
- **Event-Driven Updates**: Responds to engine events for animations

### 2. **UnifiedSlotPreview** (`/src/components/slot-engine/UnifiedSlotPreview.tsx`)
A wrapper component that ensures consistent behavior across all steps:
- Manages the PremiumSlotEngine lifecycle
- Coordinates configuration changes
- Emits events for cross-component communication
- Handles refresh on grid/symbol changes

### 3. **PremiumSlotPreviewBlock** (`/src/components/visual-journey/grid-preview/PremiumSlotPreviewBlock.tsx`)
The UI container that provides:
- Responsive sizing with aspect ratio preservation
- Symbol validation messaging
- Status indicators
- Clean integration with the step workflow

### 4. **PremiumGridPreviewInjector** (`/src/components/visual-journey/grid-preview/PremiumGridPreviewInjector.tsx`)
A simplified bridge component that:
- Gathers symbols from various sources (store, overrides, config)
- Passes props to PremiumSlotPreviewBlock
- Maintains backward compatibility with existing steps

## Architecture Benefits

### 1. **Single Source of Truth**
- One shared canvas instance across all steps
- Centralized symbol management
- Consistent rendering behavior

### 2. **Proper Lifecycle Management**
- Clean initialization and disposal
- No memory leaks or dangling references
- Graceful handling of configuration changes

### 3. **WebGL Context Safety**
- Uses Canvas2D rendering by default
- Proper cleanup on grid changes
- No context corruption issues

### 4. **Modular Design**
- Separation of concerns (rendering, logic, UI)
- Easy to extend and maintain
- Clear component responsibilities

## Integration Guide

### Step 3 (Grid Configuration)
```tsx
import PremiumGridPreviewInjector from '../grid-preview/PremiumGridPreviewInjector';

// In your component
<PremiumGridPreviewInjector
  stepSource="step3"
  customTitle="Grid Layout Preview"
  customInfo="Configure your slot machine grid"
/>
```

### Step 4 (Symbol Generation)
```tsx
import PremiumGridPreviewInjector from '../grid-preview/PremiumGridPreviewInjector';

// In your component
<PremiumGridPreviewInjector
  stepSource="step4"
  symbolsOverride={generatedSymbols}
  customTitle="Symbol Preview"
  customInfo="Your generated symbols in action"
/>
```

### Step 5 (Frame Design)
```tsx
import UnifiedSlotPreview from '../../slot-engine/UnifiedSlotPreview';

// For direct integration
<UnifiedSlotPreview
  stepSource="step5"
  width={1200}
  height={800}
/>
```

## Symbol Priority System

The system uses a priority-based approach for symbol resolution:

1. **Override Symbols** (passed directly to component)
2. **Symbol Store** (from `useStoredSymbols`)
3. **Generated Symbols** (from config store)
4. **Fallback Symbols** (transparent placeholders)

## Event System

The components emit and listen to custom events for coordination:

- `slotPreviewConfig`: Emitted when configuration changes
- `symbolsChanged`: Emitted when symbols are updated
- `gridConfigChanged`: Emitted when grid layout changes

## Performance Optimizations

1. **Texture Caching**: Symbols are cached in a Map for reuse
2. **Canvas2D Rendering**: More stable than WebGL for frequent updates
3. **Lazy Loading**: Symbols are loaded on demand
4. **Efficient Updates**: Only changed elements are re-rendered

## Troubleshooting

### Issue: Blank or black canvas
- Check browser console for errors
- Verify symbols are loading correctly
- Ensure Canvas2D is being used (check debug panel)

### Issue: Symbols not updating
- Check symbol priority order
- Verify events are being emitted
- Check for stale references

### Issue: Performance issues
- Reduce symbol texture size
- Enable production mode
- Check for memory leaks in dev tools

## Future Enhancements

1. **WebGL Recovery**: Implement WebGL with proper context management
2. **Animation System**: Add spin animations using GSAP
3. **Sound Integration**: Add audio feedback for wins
4. **Progressive Loading**: Stream symbols as they're generated
5. **3D Effects**: Add depth and perspective to reels

## Migration from Old System

To migrate from the old PremiumSlotPreview system:

1. Replace `PremiumSlotPreview` imports with `UnifiedSlotPreview`
2. Update props to match new interface
3. Remove any direct PIXI.js initialization
4. Use `PremiumGridPreviewInjector` for step integration
5. Test thoroughly across all steps

The new architecture provides a more stable, maintainable, and performant solution for the premium slot preview system.