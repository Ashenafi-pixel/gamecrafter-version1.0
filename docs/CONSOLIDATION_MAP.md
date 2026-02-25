# SlotAI Consolidation Map

## Overview
This document maps out which components to keep, merge, or delete during the consolidation phase.

## 🟢 KEEP (Core Components)

### Engine Components
- ✅ `/src/hooks/usePixiApp.ts` - Core PIXI hook, well structured
- ✅ `/src/engine/pixi/SymbolPool.ts` - Good performance optimization
- ✅ `/src/components/slot-visualization/Tier1PixiSlot.tsx` → **Rename to SlotEngine.tsx**

### UI Components  
- ✅ `/src/components/layout/PremiumLayout.tsx` - Main layout wrapper
- ✅ `/src/components/layout/SidebarContext.tsx` - Navigation state
- ✅ `/src/components/visual-journey/steps/*` - All step components (need updates)

### State Management
- ✅ `/src/store.ts` - Redux store configuration
- ✅ All Redux slices (but need consolidation)

### Utilities
- ✅ `/src/utils/enhancedOpenaiClient.ts` - GPT-4 integration
- ✅ `/src/utils/symbolStorage.ts` - Local storage management
- ✅ `/src/utils/stepStorage.ts` - Step state persistence

## 🔄 MERGE (Redundant Components)

### Preview Components → **UnifiedSlotPreview.tsx**
```
MERGE INTO ONE:
- /src/components/shared/PremiumSlotPreview.tsx
- /src/components/visual-journey/grid-preview/UnifiedGridPreview.tsx
- /src/components/visual-journey/grid-preview/GridPreviewWrapper.tsx
- /src/components/visual-journey/grid-preview/PremiumGridPreviewInjector.tsx
- /src/components/visual-journey/grid-preview/PremiumSlotPreviewBlock.tsx
- /src/components/visual-journey/grid-preview/ProfessionalUnifiedGridPreview.tsx
```

### Slot Machine Components → **Integrate into SlotEngine**
```
MERGE INTO ENGINE:
- /src/components/slot-visualization/PremiumSlotMachine.tsx (and all .bak versions)
- /src/components/visual-journey/slot-animation/PixiSlotMachine.tsx
- /src/components/visual-journey/slot-animation/PixiSlotPreview.tsx
- /src/components/visual-journey/slot-animation/ProfessionalCSSSlot.tsx
- /src/components/visual-journey/slot-animation/StepAwarePremiumSlotPreview.tsx
```

### PIXI Components → **Core Engine Classes**
```
MERGE INTO ENGINE:
- /src/engine/pixi/SlotScene.ts
- /src/engine/pixi/ProfessionalSlotMachine.ts
- /src/engine/pixi/ProfessionalReelStrip.ts
→ Create single /src/engine/core/SlotEngine.ts
```

## DELETE (Redundant/Unused)

### Documentation Clutter (Move to /docs folder)
```
DELETE FROM ROOT:
- All *.md files except README.md
- All *_FIX.md files
- All *_DOCUMENTATION.md files
```

### Unused Entry Points
```
DELETE:
- /src/DirectPreviewApp.tsx
- /src/NintendoApp.tsx
- /src/PreviewOnlyApp.tsx
- /src/RefinedEntry.tsx
- /src/SafeBootApp.tsx
- /src/SimplifiedEntry.tsx
- /src/StreamlinedApp.tsx
- /src/SymbolPreviewTest.tsx
```

### Test/Debug Components
```
DELETE:
- /src/components/AssetTest.tsx
- /src/components/FrameImageTest.tsx
- /src/components/ImageTestApp.tsx
- /src/components/PreviewTesting.tsx
- /src/components/StandaloneImageTest.tsx
```

### Backup Files
```
DELETE:
- All *.bak files
- All *.backup files
- All *.broken files
- /backup folder
- /temp folder
```

### Redundant UI Components
```
DELETE:
- /src/components/visual-journey/slot-animation/BlackBarUI.tsx
- /src/components/visual-journey/slot-animation/MinimalReproduction.tsx
- /src/components/visual-journey/slot-animation/EndlessReelPreview.tsx
```

### Old HTML Files
```
DELETE:
- All HTML files in /public except index.html
- All test HTML files in root
```

## 📁 NEW STRUCTURE (After Consolidation)

```
/src
├── engine/
│   ├── core/
│   │   ├── SlotEngine.ts         (Main engine class)
│   │   ├── interfaces.ts         (All interfaces)
│   │   ├── StateManager.ts       (Game state)
│   │   └── EventBus.ts          (Event system)
│   ├── rendering/
│   │   ├── Renderer.ts          (PIXI abstraction)
│   │   ├── SymbolPool.ts        (Performance)
│   │   └── AnimationManager.ts   (All animations)
│   ├── audio/
│   │   └── AudioManager.ts      (New - basic audio)
│   ├── assets/
│   │   └── AssetManager.ts      (Centralized loading)
│   └── rgs/
│       └── RGSClient.ts         (Mock for MVP)
│
├── components/
│   ├── SlotGame.tsx             (Main game component)
│   ├── layout/
│   │   ├── PremiumLayout.tsx
│   │   └── SidebarContext.tsx
│   └── steps/
│       ├── Step1_Theme.tsx
│       ├── Step2_GameType.tsx
│       ├── Step3_Grid.tsx
│       ├── Step4_Symbols.tsx
│       ├── Step5_Visuals.tsx
│       ├── Step6_Audio.tsx
│       └── Step7_Animation.tsx
│
├── store/
│   ├── index.ts
│   ├── gameConfig.slice.ts      (Merged config)
│   ├── engine.slice.ts          (Engine state)
│   └── ui.slice.ts              (UI state)
│
└── utils/
    ├── api/
    │   ├── openai.ts
    │   └── storage.ts
    └── validation/
        └── configValidator.ts
```

## 🎯 Priority Order

### Phase 1: Clean Up (Day 3 Morning)
1. Move all .md files to /docs
2. Delete all backup/test files
3. Delete unused components

### Phase 2: Create New Structure (Day 3 Afternoon)
1. Create /src/engine folder structure
2. Create core interfaces
3. Set up new state management

### Phase 3: Merge Components (Day 4)
1. Merge all preview components → UnifiedSlotPreview
2. Merge slot machines → SlotEngine
3. Consolidate PIXI components

### Phase 4: Refactor (Day 5-7)
1. Update all imports
2. Connect new engine to steps
3. Test everything works

## 🚨 Critical Dependencies

### Must Fix During Consolidation:
1. **Grid switching bug** - Happens in transition between components
2. **Memory leaks** - Multiple PIXI instances not being destroyed
3. **State sync issues** - Preview not updating with config changes
4. **Symbol loading race conditions** - Async loading conflicts

### Keep Working During Merge:
1. Symbol generation (Step 4)
2. Theme selection (Step 1)
3. Basic grid preview
4. Spin animation

## 📊 Success Metrics

After consolidation:
- ✅ Single SlotEngine instance
- ✅ No duplicate preview components
- ✅ Clean file structure
- ✅ Working grid transitions
- ✅ No memory leaks
- ✅ < 50% of current file count
- ✅ Clear separation of concerns