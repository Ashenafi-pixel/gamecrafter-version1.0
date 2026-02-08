# Premium Slot Preview Integration Examples

## Quick Start

The new Premium Slot Preview system provides a unified, stable solution for rendering slot machines across all steps. Here are integration examples for common use cases.

## Step 3: Grid Configuration

```tsx
import React from 'react';
import PremiumGridPreviewInjector from '../grid-preview/PremiumGridPreviewInjector';

const Step3_ReelConfiguration = () => {
  return (
    <div className="flex gap-6">
      {/* Configuration Panel */}
      <div className="flex-1">
        {/* Your grid configuration controls */}
      </div>
      
      {/* Premium Preview */}
      <div className="w-1/2">
        <PremiumGridPreviewInjector
          stepSource="step3"
          customTitle="Grid Layout Preview"
          customInfo="See your grid configuration in real-time"
        />
      </div>
    </div>
  );
};
```

## Step 4: Symbol Generation

```tsx
import React, { useState } from 'react';
import PremiumGridPreviewInjector from '../grid-preview/PremiumGridPreviewInjector';

const Step4_SymbolGeneration = () => {
  const [generatedSymbols, setGeneratedSymbols] = useState<string[]>([]);
  
  return (
    <div className="flex gap-6">
      {/* Symbol Generation Panel */}
      <div className="flex-1">
        {/* Your symbol generation UI */}
      </div>
      
      {/* Premium Preview with Generated Symbols */}
      <div className="w-1/2">
        <PremiumGridPreviewInjector
          stepSource="step4"
          symbolsOverride={generatedSymbols}
          customTitle="Symbol Preview"
          customInfo={
            <div>
              <p>Your generated symbols in the slot machine</p>
              <p className="text-xs mt-1">
                {generatedSymbols.length} symbols loaded
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};
```

## Step 5: Frame Design

```tsx
import React from 'react';
import { UnifiedSlotPreview } from '../../slot-engine';

const Step5_FrameDesign = () => {
  return (
    <div className="relative h-screen">
      {/* Full-screen preview */}
      <UnifiedSlotPreview
        stepSource="step5"
        className="absolute inset-0"
      />
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-black/50 p-4 rounded">
        {/* Frame selection controls */}
      </div>
    </div>
  );
};
```

## Custom Integration

For more control, you can use the components directly:

```tsx
import { PremiumSlotEngine } from '../../slot-engine';
import { useGameStore } from '../../../store';

const CustomSlotPreview = () => {
  const { config } = useGameStore();
  
  const handleSpin = () => {
    console.log('Spin initiated!');
  };
  
  return (
    <PremiumSlotEngine
      width={1200}
      height={800}
      viewMode="desktop"
      onSpin={handleSpin}
      balance={1000}
      bet={1.00}
      win={0.00}
    />
  );
};
```

## Symbol Management

The system automatically handles symbols from multiple sources:

```tsx
// Priority 1: Direct override
<PremiumGridPreviewInjector
  symbolsOverride={['path/to/symbol1.png', 'path/to/symbol2.png']}
/>

// Priority 2: Symbol store (automatic)
// The component will use symbols from useStoredSymbols()

// Priority 3: Config store (automatic)
// Falls back to config.theme.generated.symbols

// Priority 4: Transparent fallbacks (automatic)
// Creates placeholder symbols if none available
```

## Responsive Sizing

The preview automatically adjusts to container size:

```tsx
// Fixed size container
<div style={{ width: '800px', height: '600px' }}>
  <UnifiedSlotPreview stepSource="responsive" />
</div>

// Flexible container
<div className="flex-1 h-full">
  <UnifiedSlotPreview stepSource="flexible" />
</div>
```

## Event Handling

Listen to slot events:

```tsx
useEffect(() => {
  const handleConfig = (event: CustomEvent) => {
    console.log('Slot config:', event.detail);
  };
  
  window.addEventListener('slotPreviewConfig', handleConfig);
  
  return () => {
    window.removeEventListener('slotPreviewConfig', handleConfig);
  };
}, []);
```

## Common Issues & Solutions

### Preview not updating
```tsx
// Force refresh by changing key
const [refreshKey, setRefreshKey] = useState(0);

<PremiumGridPreviewInjector
  key={refreshKey}
  stepSource="step4"
/>

// Trigger refresh
setRefreshKey(prev => prev + 1);
```

### Custom validation
```tsx
<PremiumGridPreviewInjector
  stepSource="step4"
  hasEnoughSymbols={() => {
    // Custom validation logic
    return mySymbols.length >= 9 && allSymbolsValid;
  }}
  notEnoughSymbolsMessage="Please generate all required symbols"
/>
```

### Mobile-first design
```tsx
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

<UnifiedSlotPreview
  stepSource="mobile"
  width={isMobile ? 375 : 1200}
  height={isMobile ? 667 : 800}
/>
```

## Performance Tips

1. **Use production build**: Significantly improves performance
2. **Limit symbol size**: Keep textures under 512x512px
3. **Batch updates**: Update multiple symbols at once
4. **Cleanup**: Components auto-cleanup, but manual cleanup is available

```tsx
// Manual cleanup example
const engineRef = useRef(null);

useEffect(() => {
  return () => {
    if (engineRef.current) {
      engineRef.current.dispose();
    }
  };
}, []);
```

## Next Steps

- Review the [Architecture Documentation](./PREMIUM_SLOT_ENGINE_ARCHITECTURE.md)
- Check the [Engine Module Documentation](./SLOT_ENGINE_MODULES_DOCUMENTATION.md)
- Explore the example implementations in the codebase