# Slot Engine Modules Documentation

## Overview

This documentation covers the completion of a modular, production-ready frontend slot engine written in TypeScript. The following modules have been generated to complement the existing `SlotEngine.ts`, `SpinManager`, `SymbolPool`, `ReelManager`, and `WinEvaluator` components.

## Generated Modules

### 1. AnimationManager.ts
**Location:** `src/engine/modules/AnimationManager.ts`

**Purpose:** 
Manages visual effects and animations for the slot engine, handling spinStart, reelStop, winReveal, and other FX via configurable presets.

**Key Features:**
- ✅ UI-agnostic design - delegates rendering to registered handlers
- ✅ GSAP integration support via handler registry
- ✅ Event-driven animation triggering via EventBus
- ✅ Configurable animation presets from Step 7 builder
- ✅ Queue management for concurrent animations
- ✅ Priority-based handler system

**Core Methods:**
```typescript
// Register animation handler
registerHandler(animationName: string, handler: AnimationHandler): void

// Play animation effect
async playFX(name: string, context?: AnimationContext): Promise<void>

// Play sequence of animations
async playSequence(animations: Array<{name: string, context?, delay?}>): Promise<void>

// Play multiple animations simultaneously  
async playParallel(animations: Array<{name: string, context?}>): Promise<void>

// Stop all active animations
stopAll(): void
```

**Integration Points:**
- Listens to `spin:start`, `reel:stop`, `win:reveal`, `spin:complete` events
- Automatically maps win amounts to appropriate animation types
- Supports custom context passing for reel-specific and win-specific effects

---

### 2. defaultConfig.ts
**Location:** `src/engine/config/defaultConfig.ts`

**Purpose:**
Provides default `GameConfig` for easy engine initialization with sensible defaults for a standard 5x3 slot machine.

**Configuration Includes:**
- ✅ **Layout:** 5 reels × 3 rows landscape orientation
- ✅ **Symbols:** 8 symbols including wild/scatter with balanced weights
- ✅ **Paylines:** 20 traditional payline patterns
- ✅ **RTP:** 96% target with medium variance
- ✅ **Betting:** £0.20 - £100.00 range with 11 bet levels
- ✅ **Audio:** Complete sound configuration with volume controls
- ✅ **Animations:** High-quality effects with preset mappings
- ✅ **Features:** Autoplay, freespins, turbo mode support
- ✅ **Performance:** 60fps targeting with optimization settings

**Usage:**
```typescript
import { defaultConfig } from './config/defaultConfig';
import { SlotEngine } from './SlotEngine';

const engine = new SlotEngine(defaultConfig);
```

**Additional Export:**
- `minimalConfig` - Lightweight 3×3 configuration for testing

---

### 3. animationPresets.ts  
**Location:** `src/engine/config/animationPresets.ts`

**Purpose:**
Registry of named animation presets used by AnimationManager, providing default visual effects that can be triggered via `playFX()` calls.

**Preset Categories:**
- ✅ **Entrance:** `blurIn`, `fadeIn`, `popIn`, `slideInTop`
- ✅ **Reel:** `bounce`, `shake`, `spinStart`, `reelStop`  
- ✅ **Win:** `smallWin`, `bigWin`, `megaWin`, `coinBurst`, `highlight`
- ✅ **Special:** `lightning`, `rainbow`, `pulse`, `glitch`
- ✅ **Transition:** `spinComplete`, `noWin`, `gameStart`
- ✅ **UI:** `buttonPress`, `modalAppear`, `toast`

**Preset Structure:**
```typescript
interface AnimationPreset {
  duration?: number;        // Animation duration in ms
  easing?: string | Function; // Easing function
  params?: Record<string, any>; // Animation parameters
  delay?: number;          // Start delay
  loop?: number;           // Loop count (0 = infinite)
  description?: string;    // UI description
  category?: string;       // Grouping category
}
```

**Utility Functions:**
- `getPresetsByCategory()` - Filter presets by category
- `validatePreset()` - Validate preset configuration
- `createCustomPreset()` - Merge with existing preset

---

### 4. utils.ts
**Location:** `src/engine/utils.ts`

**Purpose:**
Shared utility functions for easing resolution, delays, symbol shuffling, and other common operations used throughout the engine.

**Function Categories:**

**Randomization:**
- `randomFromArray<T>(array: T[]): T`
- `randomFromArrayMultiple<T>(array: T[], count: number): T[]`
- `randomInt(min: number, max: number): number`
- `weightedRandom<T>(items: T[], weights: number[]): T`

**Array Operations:**
- `shuffleArray<T>(array: T[]): T[]`
- `createArray<T>(length: number, fillValue: T | Function): T[]`
- `chunkArray<T>(array: T[], chunkSize: number): T[][]`
- `uniqueArray<T>(array: T[]): T[]`

**Timing:**
- `delay(ms: number): Promise<void>`
- `debounce<T>(func: T, wait: number): Function`
- `throttle<T>(func: T, limit: number): Function`

**Easing System:**
- 20+ built-in easing functions (linear, quad, cubic, sine, expo, etc.)
- `resolveEasing(name: string | Function): EasingFunction`
- CSS cubic-bezier and keyword support

**Math Operations:**
- `clamp(value: number, min: number, max: number): number`
- `lerp(start: number, end: number, t: number): number`
- `mapRange(value, fromMin, fromMax, toMin, toMax): number`

**Validation:**
- `isValidNumber(value: any): boolean`
- `isValidPosition(position: Position, reels: number, rows: number): boolean`
- `isValidRange(range: Range): boolean`

---

## Integration Architecture

### EventBus Communication
```typescript
// AnimationManager listens for engine events
eventBus.on('spin:start', () => animationManager.playFX('spinStart'));
eventBus.on('reel:stop', (data) => animationManager.playFX('reelStop', data));
eventBus.on('win:reveal', (data) => animationManager.playFX('bigWin', data));
```

### Configuration Flow
```typescript
// Engine initialization with default config
import { defaultConfig } from './config/defaultConfig';
import { SlotEngine } from './SlotEngine';

const customConfig = {
  ...defaultConfig,
  animations: {
    ...defaultConfig.animations,
    presets: {
      spinStart: 'popIn',      // Override default preset
      megaWin: 'lightning'     // Custom mapping
    }
  }
};

const engine = new SlotEngine(customConfig);
```

### Animation Handler Registration
```typescript
// Register GSAP handler for animations
animationManager.registerHandler('bounce', {
  execute: async (config, context) => {
    // GSAP implementation
    await gsap.to(context.targets, {
      duration: config.duration / 1000,
      scale: 1.1,
      ease: config.easing,
      yoyo: true,
      repeat: 1
    });
  },
  priority: 10
});
```

## Code Quality Features

### TypeScript Compliance
- ✅ Full TypeScript with strict mode compatibility
- ✅ Comprehensive interfaces and type definitions
- ✅ Generic functions for type safety
- ✅ Proper error handling and validation

### Production Readiness
- ✅ Modular architecture with clean separation
- ✅ UI-agnostic design (no DOM/PIXI dependencies)
- ✅ Event-driven communication
- ✅ Configuration-driven behavior
- ✅ Performance optimizations (RAF, debouncing, object pooling)

### Maintainability
- ✅ Comprehensive documentation and JSDoc comments
- ✅ Consistent naming conventions
- ✅ Error logging and debugging support
- ✅ Extensible plugin architecture

## Usage Examples

### Basic Engine Setup
```typescript
import { SlotEngine } from './engine/SlotEngine';
import { defaultConfig } from './engine/config/defaultConfig';

// Initialize with defaults
const engine = new SlotEngine(defaultConfig);

// Start the engine
await engine.initialize();
```

### Custom Animation Integration
```typescript
import { AnimationManager } from './engine/modules/AnimationManager';
import { animationPresets } from './engine/config/animationPresets';

// Create animation manager
const animationManager = new AnimationManager(eventBus);

// Register custom GSAP handler
animationManager.registerHandler('customWin', {
  execute: async (config, context) => {
    // Custom GSAP animation
    await gsap.timeline()
      .to(context.targets, { scale: 1.2, duration: 0.2 })
      .to(context.targets, { rotation: 360, duration: 0.5 })
      .to(context.targets, { scale: 1, duration: 0.2 });
  }
});

// Trigger animations
await animationManager.playFX('customWin', { targets: symbolElements });
```

### Utility Functions
```typescript
import { randomFromArray, delay, resolveEasing } from './engine/utils';

// Random symbol selection
const selectedSymbol = randomFromArray(availableSymbols);

// Timing
await delay(500);

// Easing resolution
const easingFunc = resolveEasing('ease-in-out');
```

## Performance Considerations

### Memory Management
- Animation handlers support cleanup functions
- Object pooling for frequently created instances
- Efficient array operations with minimal allocations

### Rendering Optimization
- RAF-based timing utilities
- Debounced and throttled function variants
- Maximum concurrent animation limits

### Configuration Efficiency
- Lazy loading of animation presets
- Minimal default configurations
- Efficient symbol weight calculations

## Testing Strategy

### Unit Testing
Each module includes validation functions and error handling suitable for unit testing:
- Animation preset validation
- Utility function edge cases
- Configuration merging behavior

### Integration Testing
- EventBus communication patterns
- Animation sequencing and timing
- Configuration override behavior

## Future Extensions

### Planned Enhancements
- WebGL shader animation support
- Advanced particle system integration
- Dynamic preset loading from external sources
- Performance profiling and optimization tools

### Plugin Architecture
The modular design supports future plugins for:
- Custom animation renderers
- Alternative configuration sources
- Advanced mathematical models
- Real-time performance monitoring

## Summary

The completed slot engine modules provide a robust, production-ready foundation for slot machine games with:

- **AnimationManager**: Event-driven visual effects system
- **defaultConfig**: Comprehensive game configuration defaults  
- **animationPresets**: Rich library of visual effect presets
- **utils**: Essential utility functions for engine operations

All modules maintain the same code quality standards as the existing engine components, ensuring consistency, maintainability, and extensibility for production deployment.