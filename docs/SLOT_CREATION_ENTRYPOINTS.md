# Slot Creation Entry Points

This document outlines the correct routes and components for accessing the full slot game creation experience in SlotAI.

## Primary Entry Point

The full slot creation experience with the 12-step sidebar flow is accessible through:

```
/create?step=0&force=true
```

### Component Hierarchy

1. `App.tsx` - Defines the `/create` route which loads the `SlotCreator` component
2. `SlotCreator.tsx` - Initializes the game based on URL parameters and renders `VisualJourney`
3. `VisualJourney.tsx` - Manages the 12-step creation process with sidebar navigation

### URL Parameters

- `step=0` - Initializes at Step 1 (Theme Selection)
- `force=true` - Ensures the step is properly set in the store, bypassing any saved progress

### Additional Parameters

- `game={gameId}` - Optional: Loads an existing game with the specified ID
- `template={templateName}` - Optional: Initializes from a template

## Why This Route Works

The `/create?step=0&force=true` route works correctly because:

1. The `SlotCreator` component is configured to initialize the game state based on URL parameters
2. The `force=true` parameter ensures the step is explicitly set, bypassing any cached state
3. This route properly integrates with the store's initialization logic
4. It maintains compatibility with the progress tracking system

## Deprecated/Ambiguous Routes

The following routes should be avoided:

- `/create` (without parameters) - Falls back to emergency UI or saved progress
- `/slot-creator` - Legacy route, not maintained with current navigation patterns

## Game Type Initialization

When accessing the slot creation flow, proper initialization includes:

1. Setting game type to "slots" in the store
2. Generating a unique game ID (typically using timestamp)
3. Initializing config with game type and default values
4. Setting total steps to 12 for the slot game journey

## Code Implementation

The correct implementation for navigating to the slot creation flow:

```javascript
// Generate a new game ID
const newGameId = `game_${Date.now()}`;

// Initialize config
const initialConfig = {
  gameId: newGameId,
  displayName: 'New Slot Game',
  gameType: 'slots'
};

// Update store
useGameStore.getState().updateConfig(initialConfig);
setGameType('slots');

// Navigate to slot creator
navigate('/create?step=0&force=true');
```

## Testing Verification

To verify the correct route is working:

1. Navigate to `/create?step=0&force=true`
2. Confirm the Theme Selection step is displayed
3. Verify the sidebar shows 12 steps for the complete slot creation journey
4. Check that navigation between steps works correctly

By following this route pattern, the application will consistently load the full 12-step slot game creation experience.