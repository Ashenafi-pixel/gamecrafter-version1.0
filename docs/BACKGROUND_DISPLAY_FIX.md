# Background Display Fix

## Issue
The background image generated in Step 5 (via the Step6_BackgroundCreator.tsx component) was not showing up in the premium slot preview. While the background was correctly being saved to the config store, the preview components were not being notified about the change.

## Solution
1. Analyzed the event flow between components to understand how symbol changes are communicated
2. Discovered that while we properly implemented the `backgroundChanged` custom event dispatch in the Step6_BackgroundCreator.tsx component, we were missing the corresponding event listener in the UnifiedGridPreview component
3. Added an event listener for `backgroundChanged` in the UnifiedGridPreview component that:
   - Updates the store with the new background path
   - Triggers a refresh of the grid content to ensure the background is displayed

## Technical Implementation

### In UnifiedGridPreview.tsx
Added a new useEffect hook to listen for the backgroundChanged event:

```typescript
// Listen for background changed events from Step6_BackgroundCreator
useEffect(() => {
  const handleBackgroundChanged = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    console.log('UnifiedGridPreview received backgroundChanged event:', detail);
    
    if (detail?.backgroundPath) {
      // Update the store with the new background path
      const { config } = useGameStore.getState();
      useGameStore.getState().updateConfig({
        background: {
          ...config.background,
          backgroundImage: detail.backgroundPath,
          type: detail.type || 'static'
        },
        backgroundImage: detail.backgroundPath
      });
      
      console.log('Updated background path in store:', detail.backgroundPath);
      
      // Force a refresh of the grid
      setTimeout(() => {
        document.dispatchEvent(new Event('refreshGridContent'));
      }, 50);
    }
  };
  
  window.addEventListener('backgroundChanged', handleBackgroundChanged);
  
  return () => {
    window.removeEventListener('backgroundChanged', handleBackgroundChanged);
  };
}, []);
```

### Event Flow
The complete event flow is now:

1. User clicks "Generate" in Step6_BackgroundCreator.tsx
2. Background is generated using enhancedOpenaiClient
3. Generated background is saved to the store and dispatches a 'backgroundChanged' event
4. UnifiedGridPreview listens for this event and updates its display
5. The background is now visible in all preview components

## Benefits
- The premium slot preview now correctly shows the generated background
- Provides consistent behavior between symbol generation and background generation
- Maintains the event-based architecture for component communication
- Improves the user experience by showing real-time updates to the background

## Testing
The fix can be tested by:
1. Navigating to Step 5 in the slot creation process
2. Clicking the "Generate" button for the background
3. Verifying that the background appears in the premium slot preview