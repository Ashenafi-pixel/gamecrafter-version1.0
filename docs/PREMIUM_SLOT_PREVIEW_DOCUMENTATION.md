# Premium Slot Preview Component Documentation

## Overview

The Premium Slot Preview component provides a professional, visually accurate representation of how slot games will appear on different devices and orientations. It offers interactive device and orientation toggles to help developers understand how their slot game will render across platforms.

## Recent Updates (May 2024)

1. **Step 5 Integration**
   - Added preset/advanced toggle for Step 5 (Game Frame Designer)
   - Synchronized toggle state between Step5_GameFrameDesigner and GridPreviewWrapper
   - Implemented bi-directional communication using custom events

2. **Improved Symbol Loading**
   - Fixed issues with symbols not appearing immediately
   - Optimized loading states to prevent flickering
   - Added symbol caching for persistence between views

3. **Mobile Adaptations**
   - Enhanced support for mobile portrait and landscape views
   - Integrated mobile-specific UI components
   - Optimized scaling for different screen sizes

## Key Components

### 1. `GridPreviewWrapper`

The main container component that handles device selection, orientation toggling, and content scaling.

#### Props:
- `className`: Optional additional CSS classes
- `slotConfig`: Optional slot configuration object with:
  - `reels`: Number of horizontal slots (default: from store)
  - `rows`: Number of vertical slots (default: from store)
  - `payMechanism`: Game mechanic type (betlines, ways, cluster)

#### Features:
- Responsive container with dynamic sizing
- Device type toggle (Mobile/Desktop)
- Orientation toggle for mobile devices (Portrait/Landscape)
- Automatic scaling for wide grid layouts (6+ reels)
- Loading state transitions
- Integration with global game store
- Cross-component event communication

### 2. `PhoneMockup`

Renders a realistic mobile phone frame with correct styling for both portrait and landscape orientations.

#### Props:
- `children`: Content to render inside the phone screen
- `orientation`: 'portrait' | 'landscape'

#### Features:
- Dynamically adjusts layout based on orientation
- Portrait mode: Bottom controls with centered SPIN button
- Landscape mode: Side panel controls with right-side SPIN button
- Hardware elements (notch, buttons) for realism
- Aspect ratio preservation (9:16 for portrait, 16:9 for landscape)
- Proper content containment and overflow handling

### 3. `DesktopMockup`

Renders a desktop/browser frame around content for PC visualization.

#### Props:
- `children`: Content to render inside the browser window

#### Features:
- Browser chrome with address bar and window controls
- Bottom game controls panel
- Status bar with game readiness indicator
- Always in landscape orientation
- Proper content sizing and centering

## Implementation Details

### Device Switching Logic

```tsx
// Toggle device type
const toggleDeviceType = () => {
  const newDeviceType = deviceType === 'desktop' ? 'mobile' : 'desktop';
  setDeviceType(newDeviceType);
  
  // Force Landscape mode when Desktop is selected
  if (newDeviceType === 'desktop' && orientation !== 'landscape') {
    setOrientation('landscape');
    setGridOrientation('landscape'); // Update store
    // ... notify other components
  }
  
  // Reset animation for visual transition
  setAnimate(false);
  setIsLoading(true);
  // ... delayed re-enable
};
```

### Responsive Layout Scaling

```tsx
// Calculate scaling for wide grids
const calculateGridScale = () => {
  if (reels <= 5) return 1; // Standard size
  
  // Scale down proportionally for wider grids
  return Math.min(1, 5 / reels * 1.1);
};

// Applied in render:
<div 
  className="game-preview-scaling-wrapper" 
  style={{ 
    transform: `scale(${calculateGridScale()})`,
    transformOrigin: 'center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  {/* Game content */}
</div>
```

### Mockup Containment

The component uses a multi-layered approach to prevent content overflow:

1. Main container with `overflow: hidden`
2. Device mockups with fixed aspect ratios
3. Content wrappers with `overflow: hidden`
4. Dynamic scaling for wide grid layouts
5. Max width/height constraints with proper centering

### Cross-Component Communication

```tsx
// Dispatch event to notify other components about changes
window.dispatchEvent(new CustomEvent('gridConfigChanged', {
  detail: {
    reels,
    rows,
    orientation: newOrientation,
    payMechanism,
    animate: true,
    source: 'gridPreviewWrapper'
  }
}));
```

## UI/UX Features

### Visual Indicators
- Device type and orientation labels
- Active button states
- Loading transitions between states
- Visual feedback when toggling views

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Clear visual state indicators
- Responsive text that adapts to container size

### Visual Polish
- Light ray animations in background
- Proper shadows and depth
- Realistic device hardware elements
- Professional color palette and gradients

## Usage Guidelines

### When to Use Each Mode

- **Desktop View**: For visualizing the game on PC/browser platforms, e.g., desktop websites
- **Mobile Portrait**: For visualizing the game on mobile phones held vertically
- **Mobile Landscape**: For visualizing the game on mobile phones held horizontally

### Grid Size Considerations

- Standard layouts: 5×3 for most slot games
- Wide layouts (6+ reels): Will automatically scale down
- Tall layouts (4+ rows): Work well in portrait mode
- Square layouts (5×5, 6×6): Better for cluster pay mechanisms

### Integration with Game Builder Flow

This component is designed to work within the game builder workflow:
- Step 3: Grid Configuration - For setting up the base layout
- Step 4: Symbols - Shows generated symbols in grid layout
- Step 5: Game Frame Designer - Shows the selected frame with preset/advanced toggle
- Step 6: Background Creator - Shows the selected background

## Step 5 - Game Frame Designer Integration

The Premium Slot Preview in Step 5 now includes:

1. **Preset/Advanced Toggle**
   - Located in the header of the preview panel
   - Synchronizes with the main controls in the left panel
   - Visually indicates current mode with blue highlighting

2. **Bi-directional Communication**
   ```javascript
   // Dispatch event from GridPreviewWrapper
   window.dispatchEvent(new CustomEvent('step5ViewModeChanged', {
     detail: { mode: newMode }
   }));

   // Listen for events in Step5_GameFrameDesigner
   window.addEventListener('step5ViewModeChanged', handleViewModeChange);
   ```

3. **Frame Preview**
   - Shows frame adjustments in real-time
   - Updates based on selected parameters
   - Maintains correct proportions across device types

## Future Enhancements

Possible future improvements:

1. **Symbol Animation**: Animate symbols in the grid for more dynamic previews
2. **Win Line Visualization**: Show potential win lines in the preview
3. **Interactive Testing**: Allow users to test spin animations
4. **Additional Device Types**: Add more device mockups (tablet, desktop widescreen)
5. **Performance Optimization**: Further reduce loading transitions and flickering
6. **Extended Controls**: Add more controls specific to each step