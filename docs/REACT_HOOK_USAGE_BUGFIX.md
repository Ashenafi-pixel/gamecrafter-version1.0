# React Hook Usage Bugfix - Symbol Loading and Display Issues

## Issue #1: Frame and Background Props in Grid Preview (PREVIOUSLY FIXED)

The application was crashing with the following error:

```
ReferenceError: framePath is not defined
    at PhoneMockup (GridPreviewWrapper.tsx:301:17)
```

This error occurred because we were using variables that weren't properly defined in the component scope. Specifically, the PhoneMockup component was trying to pass `framePath`, `framePosition`, `frameScale`, `frameStretch`, and `backgroundPath` props to the UnifiedGridPreview component, but these variables weren't defined in the PhoneMockup component interface.

*This issue was already fixed in a previous update.*

## Issue #2: Symbol Flashing When Switching Device Types

When switching between device types (desktop to mobile) or orientations in the Premium Slot Preview, there was a brief flash of fallback symbols (J, Q, K, ★, ♥, ♣, etc.) before the real symbols loaded. This created a jarring user experience and made the product look unpolished.

### Root Cause Analysis

The issue stemmed from a timing problem in the loading state management between components:

1. When device type or orientation changed, the `GridPreviewWrapper` component would:
   - Set a loading state locally
   - Dispatch a `symbolLoadingStateChange` event to `UnifiedGridPreview`
   - Request symbols from the store
   - After a short delay, mark loading as complete

2. However, the loading state in `UnifiedGridPreview` was not properly synchronized:
   - `symbolsLoading` state was set to false too early
   - The component would fall back to placeholder symbols during the brief window when `symbolsLoading` was false but real symbols hadn't loaded yet
   - This created the flash of placeholder symbols (J, Q, K, etc.)

3. Additional issues included:
   - The animation state didn't properly handle the loading state
   - The event system used inconsistent timing between state changes
   - The loading indicators weren't fully preventing fallback symbols from showing

### Solution Implemented

1. Added dual loading state management in `UnifiedGridPreview`:
   - `symbolsLoading`: Specific to symbol loading
   - `isLoading`: Global component loading state
   - Both must be false before showing real symbols

2. Enhanced the cell animation system:
   - Added a dedicated "loading" animation state
   - Cells now show loading placeholders when in loading state
   - Improved the visual appearance of loading placeholders

3. Improved event synchronization:
   - Extended loading state with multiple timed events
   - Increased delays between state changes to ensure proper sequencing
   - Added redundant loading state events to prevent race conditions

4. Enhanced the symbol rendering logic:
   - Only show actual symbols when both loading states are false
   - Improved loading placeholder visuals with shadow effects
   - Made the loading state check more robust

5. Fixed timing issues in the loading state reset:
   - Increased delay before resetting loading state (100ms → 300ms)
   - Added additional loading state extensions to bridge potential gaps
   - Made symbol loading more progressive with multiple check points

### Implementation Details

#### 1. UnifiedGridPreview.tsx Changes

- Added a new `isLoading` state alongside existing `symbolsLoading` state
- Enhanced cell animation variants with a new "loading" state
- Improved loading state event handler to manage both states
- Modified symbol rendering to check both loading states
- Added shadow effects to loading placeholders for better visuals
- Enhanced loading state checks to verify symbols are available

#### 2. GridPreviewWrapper.tsx Changes

- Extended loading state duration for device type changes (100ms → 300ms)
- Added intermediate loading state extension at 50ms
- Improved synchronization between component state and event dispatching
- Enhanced symbol loading logic with more reliable timing

### Testing

The fix was tested across multiple scenarios:

- Switching from desktop to mobile and vice versa
- Toggling between portrait and landscape orientations
- Testing with various grid configurations (3x3, 5x3, etc.)
- Testing with different sets of symbols
- Testing with empty symbol state

In all cases, the fallback symbols (J, Q, K, etc.) no longer flash when switching views, providing a seamless transition between device types and orientations.

### Future Considerations

1. Consider implementing a proper loading state machine for more complex state transitions
2. Add formal unit tests for the loading state behavior
3. Consider a more centralized approach to symbol management using React Context
4. Explore using React Suspense when it becomes stable for data loading

### Related Files

1. `/src/components/visual-journey/grid-preview/UnifiedGridPreview.tsx`
2. `/src/components/visual-journey/grid-preview/GridPreviewWrapper.tsx`
3. `/src/components/visual-journey/grid-preview/SymbolPreviewWrapper.tsx` (referenced but not modified)