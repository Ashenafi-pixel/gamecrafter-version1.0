# Step 5 Slot Preview Integration

This document describes the integration of the Premium Slot Preview component into Step 5 (Game Frame Designer).

## Problem

The premium slot preview in Step 5 was missing the "Preset" and "Advanced" toggle buttons that allow users to switch between different views in the frame designer.

## Solution

1. **Modified PremiumLayout.tsx**
   - Updated the conditional rendering to include Step 5 (index 4) in the list of steps that use GridPreviewWrapper
   - Previously only Step 3 (index 2) and Step 4 (index 3) were using GridPreviewWrapper

2. **Created Step5PreviewWrapper.tsx**
   - New component specifically for Step 5 that integrates with GridPreviewWrapper
   - Includes the Preset/Advanced toggle UI in the header
   - Communicates view mode changes to the parent Step5_GameFrameDesigner component

3. **Updated Step5_GameFrameDesigner.tsx**
   - Replaced the import of PremiumSlotPreviewBlock with Step5PreviewWrapper
   - Added an effect to listen for view mode changes from Step5PreviewWrapper
   - The viewMode state now stays in sync between the main component and the preview panel

## Testing

The implementation has been tested to ensure:
- The GridPreviewWrapper appears in the right panel of Step 5
- The Preset/Advanced toggle buttons are visible and functional
- The view mode state is synchronized between the left panel controls and right panel toggle

## Technical Implementation Details

1. **Communication Between Components**
   - Custom events: `step5ViewModeChanged` event is dispatched when the view mode changes
   - DOM attribute: A hidden element with id `step5-view-mode` stores the current mode
   - Interval polling: A backup method to ensure state consistency

2. **View Modes**
   - **Preset**: Shows the carousel interfaces for style, material, and decoration selection
   - **Advanced**: Shows the custom prompt input and frame upload options

## Future Improvements

1. Potential improvements to consider:
   - Replace interval polling with React context or Redux for more efficient state sharing
   - Add animations for smoother transitions between view modes
   - Implement direct preview of frame changes in the right panel