# Game Creation Routes Map

This document provides a comprehensive overview of all game creation flows in the SlotAI project, including routes, game types, and initialization methods.

## 📌 Routes Summary Table

| Route Path | Game Type | Component | Notes |
|------------|-----------|-----------|-------|
| `/create?step=0&force=true` | slots | SlotCreator.tsx → VisualJourney.tsx | ✅ **Primary route** for new slot game creation |
| `/create?step=0&force=true&template={templateId}` | slots | SlotCreator.tsx → VisualJourney.tsx | ✅ Used when creating from a template |
| `/create?game={gameId}` | slots | SlotCreator.tsx → VisualJourney.tsx | ✅ Used when loading an existing game |
| `/create` | (ambiguous) | SlotCreator.tsx | ⚠️ Deprecated - defaults to slot creation but without proper initialization |
| `/slot-creator` | (redirect) | N/A (redirects to `/create`) | ⚠️ Legacy route - redirects to `/create` |
| N/A | scratch | ScratchCardJourney.tsx | 🚧 Under development - no dedicated route yet |
| N/A | crash | N/A | 🚧 Under development - no component yet |
| N/A | table | N/A | 🚧 Under development - no component yet |

## 🔁 Navigation Entry Points

### Slot Games

1. **"+ New Game" button (Dashboard)**
   - Creates a new game ID with timestamp
   - Sets initial config with game type "slots"
   - Navigates to `/create?step=0&force=true`

2. **"Slot Games" card (Dashboard)**
   - Sets game type to "slots"
   - Creates a new game ID with timestamp
   - Sets initial config with game type "slots"
   - Navigates to `/create?step=0&force=true`

3. **Template selection (Dashboard)**
   - Sets game type based on template category
   - Creates a new game ID with timestamp
   - Sets initial config with template information
   - Navigates to `/create?step=0&force=true&template={templateId}`

4. **Existing game selection (Dashboard)**
   - Sets game type based on the game's type
   - Navigates to `/create?game={gameId}`
   - Loads game data from localStorage

### Other Game Types

1. **"Scratch Cards" card (Dashboard)**
   - Sets game type to "scratch"
   - Currently navigates to `/create` without step parameters
   - No dedicated route or proper initialization yet

2. **"Crash Games" card (Dashboard)**
   - Sets game type to "crash"
   - Currently navigates to `/create` without step parameters
   - No dedicated route or proper initialization yet

3. **"Table Games" card (Dashboard)**
   - Sets game type to "table"
   - Currently navigates to `/create` without step parameters
   - No dedicated route or proper initialization yet

## 🧠 Initialization Logic Notes

### Slot Games Initialization

1. **Via URL Parameters**
   - SlotCreator.tsx parses URL parameters in useEffect
   - Required parameters for proper initialization:
     - `step`: Defines which step to show (0 = Theme Selection)
     - `force=true`: Forces the step to be set in the store
   - Optional parameters:
     - `game`: Game ID to load from localStorage
     - `template`: Template ID to apply
     - `clean_url`: Whether to clean the URL after navigation (defaults to true)

2. **Via Zustand Store**
   - Game type is set using `setGameType('visual_journey')` for slot games
   - Step is set using `setStep(targetStep)`
   - Game configuration is updated using `useGameStore.getState().updateConfig(initialConfig)`

3. **Default Initialization**
   - When no parameters are provided, defaults to:
     - Game type: "visual_journey"
     - Step: 0 (Theme Selection)

### Other Game Types Initialization

1. **Scratch Cards**
   - Uses `setGameType('scratch')` 
   - No dedicated initialization flow yet
   - Renders ScratchCardJourney.tsx directly in SlotCreator if game type is "scratch"
   - Has 6 steps defined in the store instead of 9

2. **Crash Games & Table Games**
   - No dedicated initialization or components yet
   - Set game type in store but don't have custom creation flow

## Deprecated Routes

1. **`/create` (without parameters)**
   - **Issue**: Doesn't properly initialize the step or force parameter
   - **Risk**: Can lead to navigation issues or blank screens
   - **Fix**: Always use `/create?step=0&force=true` for new games

2. **`/slot-creator`**
   - **Issue**: Legacy route that redirects to `/create`
   - **Risk**: Loses any parameters in the redirect
   - **Fix**: Use `/create` with proper parameters instead

## 🚧 Development Status

1. **Slot Games**: ✅ Fully implemented with proper navigation
2. **Scratch Cards**: 🚧 Basic component exists but no dedicated route
3. **Crash Games**: 🚧 Only type definition, no implementation
4. **Table Games**: 🚧 Only type definition, no implementation

## 📋 Recommendations

1. **For New Game Creation**:
   - Always use `/create?step=0&force=true` with proper store initialization
   - Always set the game type in the store before navigation
   - Always generate a new gameId using timestamp

2. **For Future Development**:
   - Create dedicated routes for each game type:
     - `/scratch-creator` for scratch cards
     - `/crash-creator` for crash games
     - `/table-creator` for table games
   - Implement proper initialization for each game type
   - Follow the pattern established by slot games

3. **For Clean Navigation**:
   - Use React Router's `useNavigate()` for all navigation
   - Set store state before navigation
   - Use URL parameters to pass essential information
   - Clean URL after navigation if needed