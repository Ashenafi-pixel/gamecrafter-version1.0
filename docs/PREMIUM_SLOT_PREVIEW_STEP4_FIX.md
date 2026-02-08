# Premium Slot Preview Step 4 Integration

## Summary
This fix properly integrates the Premium Slot Preview component into Step 4 (Symbol Generation) by centralizing its display control in PremiumLayout instead of duplicating it in the Step4 component.

## Changes Made
1. Removed the direct inclusion of GridPreviewWrapper from Step4_SymbolGeneration.tsx
2. Made the right column in Step4 empty to allow PremiumLayout's handling to show through
3. Updated PremiumLayout.tsx to show GridPreviewWrapper for both Step 3 and Step 4
4. Added proper event dispatch for symbol updates in Step 4

## Benefits
1. Eliminates duplicate canvas rendering in Step 4
2. Maintains a clean 50/50 layout split between symbol generation controls and preview
3. Leverages the existing PremiumLayout functionality for consistent UX
4. Ensures symbols are properly updated in the preview when generated

## Implementation Details
The previous issue was that the Premium Slot Preview was appearing both in the middle and on the right side of the page. This happened because:

1. Step4_SymbolGeneration was directly including a GridPreviewWrapper in its right column
2. PremiumLayout was conditionally trying to display a blank space for Step 4

By removing the duplicate GridPreviewWrapper from Step4_SymbolGeneration and allowing PremiumLayout to control the display for both Step 3 and Step 4, we now have:

- Step 3: PremiumLayout shows GridPreviewWrapper on the right
- Step 4: PremiumLayout shows GridPreviewWrapper on the right, and Step4 component has an empty right column

This ensures we have a clean 50/50 split with the symbol generation controls on the left and only one Premium Slot Preview on the right.