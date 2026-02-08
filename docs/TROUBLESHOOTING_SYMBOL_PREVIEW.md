# Symbol Preview Troubleshooting Guide

## Overview
This document provides troubleshooting guidance for the Premium Slot Preview in Step 4 (Symbol Generation). If symbols aren't appearing in the preview, use the techniques below to diagnose and fix the issue.

## Quick Fixes

### 1. Press 'R' Key
Press the 'R' key while on Step 4 to manually trigger a symbol refresh. This sends all current symbols to the preview component.

### 2. Add New Symbols
Adding a new symbol often triggers the preview to update. Try adding a Wild or Scatter symbol to see if it refreshes the display.

### 3. Check Console Logs
Open your browser's developer console (F12) and look for debug logs starting with:
- `[DEBUG]` - Detailed debugging information
- `SymbolPreviewWrapper` - Logs from the preview component

## Common Issues and Solutions

### Issue: Symbols Not Appearing in Preview

#### Cause 1: Path Format Issues
The symbols might be using incorrect path formats.

**Solution**: 
- Ensure symbol paths don't start with `/public/` (incorrect)
- Make sure paths start with a leading slash like `/assets/...` (correct)

#### Cause 2: Event Communication Issues
The event system might not be properly dispatching or receiving events.

**Solution**:
- Press 'R' to manually trigger events
- Check console for event-related logs
- Verify that `symbolsChanged` events are both sent and received

#### Cause 3: Symbol Storage Issues
There may be localStorage quota issues affecting symbol storage.

**Solution**:
- Clear localStorage using browser dev tools
- Check for quota errors in the console
- Use different browser or incognito mode

## Technical Details

### Event Communication System
The preview uses a robust event system:
- `symbolsChanged` - Sends symbol data to the preview
- `requestSymbols` - Requests current symbols from Step 4
- `gridConfigChanged` - Updates grid layout configuration

### Symbol Source Priority
The system looks for symbols in this order:
1. Overrides from `symbolsChanged` events
2. Symbols from symbolStore (localStorage)
3. Symbols from config.theme.generated.symbols
4. Fallback to placeholder symbols

### Debug Helpers Added
- Verbose console logging throughout the pipeline
- Multiple redundant event dispatching
- Keyboard shortcut ('R') for manual refresh
- Automatic periodic refresh attempts

## Advanced Solutions

If you continue experiencing issues:
1. Try refreshing the page to clear any stale state
2. Verify that paths are correct in the console logs
3. Check that the event listeners are registered (search for 'addEventListener')
4. Inspect network requests to ensure symbol images are loading correctly