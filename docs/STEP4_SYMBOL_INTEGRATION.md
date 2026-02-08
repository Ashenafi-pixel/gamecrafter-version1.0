# Step 4 Symbol Integration Documentation

## Overview
This document outlines the integration of the Premium Slot Preview in Step 4 of the symbol generation workflow and fixes for related issues. The goal was to display the Premium Slot Preview component in Step 4, showing symbols as they are created or uploaded.

## Changes Made

### 1. Fixed Reference Error in Step3_ReelConfiguration.tsx
Fixed the reference error related to `useStoredSymbols.getState()` in the `notifyGridConfigChanged` function:

```typescript
// Original problematic code
const { symbols } = useStoredSymbols.getState();
if (symbols && symbols.length > 0) {
  window.dispatchEvent(new CustomEvent('symbolsChanged', { 
    detail: { 
      symbols: symbols.map(s => s.image).filter(Boolean),
      source: 'step3'
    } 
  }));
}

// Fixed implementation
// Get stored symbols from the store if available
const symbolsFromStore = config.theme?.generated?.symbols;
if (symbolsFromStore && symbolsFromStore.length > 0) {
  window.dispatchEvent(new CustomEvent('symbolsChanged', { 
    detail: { 
      symbols: symbolsFromStore,
      source: 'step3'
    } 
  }));
}
```

1. Imported the `useStoredSymbols` hook properly at the top of the file
2. Replaced `useStoredSymbols.getState()` with a direct reference to symbols from the config store
3. Used `config.theme?.generated?.symbols` to retrieve symbols instead of accessing the hook state directly

### 2. Cross-Component Communication for Symbol Updates
The implementation establishes effective communication between components:

- Step4_SymbolGeneration dispatches `symbolsChanged` events when symbols are updated
- PremiumLayout conditionally renders GridPreviewWrapper for both Steps 3 and 4
- Step3_ReelConfiguration dispatches grid configuration events and available symbols

### 3. Event-Based Communication Pattern
The system uses these DOM custom events:

- `symbolsChanged`: Broadcasts symbol updates with payload: `{symbols: string[], source: string}`
- `gridConfigChanged`: Broadcasts grid layout updates with payload: `{reels: number, rows: number, orientation: string}`
- `requestSymbols`: Requests fresh symbols from the manager component

### 4. Storage Optimization for localStorage
Implementation changes to prevent localStorage quota errors:

- Added optimization in Step4_SymbolGeneration that stores minimal versions of symbols
- Avoids storing full base64 image data in localStorage

## Features

1. **Live Symbol Preview**
   - The Premium Slot Preview component shows the current symbols as they are being configured
   - Updates in real-time as symbols are created, modified, or deleted

2. **Data Sources Priority**
   - The component first tries to use symbols from the config store
   - Falls back to the current local state if needed
   - This ensures maximum compatibility with existing code paths

3. **Synchronized Storage**
   - Symbol updates now save to both the Zustand store and localStorage
   - This maintains consistency between the preview in different steps

4. **Responsive Layout**
   - Preview is contained within a consistent layout for optimal display
   - The layout adjusts responsively while maintaining visual consistency

## Keyboard Shortcuts
- Press `R` to refresh symbols in the preview (for debugging)

## Integration Summary

The Premium Slot Preview is now fully integrated into Step 4, providing users with a real-time preview of their symbol configuration. This update maintains visual consistency with the previews in other steps, improving the overall user experience by giving immediate visual feedback during the symbol creation and configuration process.

The implementation also fixes errors related to symbol storage and cross-component communication, ensuring a smooth user experience without localStorage quota errors.