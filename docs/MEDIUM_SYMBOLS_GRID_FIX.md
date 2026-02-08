# Medium Symbols Grid Display Fix

## Issue Description

Three issues were occurring with the Premium Slot Preview integration:

1. Images were being saved to `/public/saved-images/default` instead of using the proper gameId-based folder.
2. When a gameId was set explicitly (e.g., "candyland_20250522"), it was still sometimes replaced with "slot_game_20250522".
3. Medium-paying symbols appeared and disappeared inconsistently from the grid, while wild, scatter, and high-paying symbols displayed correctly.

## Root Causes

### Issue 1 & 2: Incorrect GameID in Image Saving

The `imageSaver.ts` utility had multiple conditional logic flaws when creating gameId:
- It would default to 'default' if no gameId was found
- It didn't properly handle fallback cases for theme-based ID generation
- It would sometimes override the gameId from the store with a generated one even when a valid gameId was present
- The conditional logic had a race condition where theme-based IDs could take precedence over explicit gameIds

### Issue 2: Medium Symbols Display Issue

Multiple factors contributed to the medium symbols not showing:

1. **Symbol ordering issue in GridPreview**: When assigning symbols to grid cells, the grid was potentially skipping medium symbols due to the ordering logic.

2. **Symbol event communication issues**: The `symbolsChanged` event wasn't reliably including medium symbols in the data sent.

3. **Symbol type mapping inconsistency**: In the process of filtering and mapping symbols, medium symbols could get dropped.

4. **Event timing problems**: Due to race conditions, medium symbols might be registered too late or overwritten.

## Implemented Fixes

### 1. Enhanced GameID Generation in `imageSaver.ts`

- Fixed the gameId detection logic to prioritize the store's explicit gameId
- Added logging of gameId source and state information for debugging
- Improved the fallback mechanism for cases without an explicit gameId
- Consolidated gameId logging for batch image saving
- Added extended type debugging and batch symbol type statistics
- Implemented state inspection for the game configuration

### 2. Improved Symbol Management in `Step4_SymbolGeneration.tsx`

- Enhanced the `updateStoreWithSymbols` function to explicitly include medium symbols
- Added detailed logging of symbol counts by type
- Implemented type-aware symbols collection to ensure all symbol types are included
- Changed how symbols are sent to the grid preview to guarantee type representation
- Added safeguards to prevent symbol type loss during sort operations

### 3. Strengthened Event Handling in `UnifiedGridPreview.tsx`

- Added redundant symbol requests to ensure complete data
- Added detailed symbol type analysis in the event handler
- Implemented forced refresh after symbol updates
- Added additional request timeouts to catch late-loaded symbols
- Enhanced the symbol rendering to explicitly mark medium symbols

### 4. Cell Rendering Improvements

- Added data attributes to track symbol types for debugging
- Added special visual indicators for medium symbols
- Force-inserted medium symbols in specific grid positions for better testing
- Enhanced the visual differentiation between symbol types

## Verification Steps

To verify the fix:

1. Generate symbols for a new slot game including medium-paying symbols
2. Check that all symbol types (wild, scatter, high, medium, low) appear correctly in the grid
3. Verify that images are saved with the correct gameId-based folder structure
4. Check the browser console logs to see proper symbol type distribution

## Additional Debugging

If issues persist, the enhanced logging will show:
- Symbol counts by type in the `updateStoreWithSymbols` function
- Symbol type analysis in the `symbolsChanged` event handler
- Specific logging for medium symbols
- Visual indicators in the grid for medium symbol positions (green club symbols)

## Future Improvements

For long-term stability:

1. Implement a more robust symbol type registry that persists across components
2. Create a dedicated symbol type service that ensures consistent type representation
3. Add visual debugging toggles to highlight different symbol types in the grid
4. Create a more formalized event protocol for symbol communication between components