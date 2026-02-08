# Grid Preview System Documentation

## Overview

The Grid Preview System is a comprehensive solution for displaying slot game grid layouts in realistic device mockups. It provides an intuitive way to visualize how slot game grids will appear on different devices and orientations.

## Components

### 1. `GridPreviewWrapper`

The main container component that handles device switching, orientation changes, and houses the mockups.

**Location**: `/src/components/visual-journey/grid-preview/GridPreviewWrapper.tsx`

**Features**:
- Device switching between mobile and desktop
- Orientation switching between portrait and landscape (mobile only)
- Realistic device mockups with proper UI elements
- Auto-syncing with game store for grid dimensions
- Fullscreen mode support
- Animation reset capability
- Realistic light ray background effects

### 2. `PhoneMockup`

A subcomponent that renders a realistic mobile phone frame in either portrait or landscape orientation.

**Features**:
- Phone notch and side buttons
- Battery/clock status bar
- Game title bar
- Bottom control area with spin button
- Proper scaling for different grid sizes
- Independent scaling logic for large grids in portrait
- Direct integration of UnifiedGridPreview without nesting

### 3. `DesktopMockup`

A subcomponent that renders a simplified browser-like frame for desktop preview.

**Features**:
- Browser-like top bar with URL and security icon
- Browser control buttons (red, yellow, green dots)
- Bottom control area with game buttons
- Status bar at the bottom
- Simplified browser-like design
- Special "landscape-only" enforcement
- Direct integration of UnifiedGridPreview without nesting

### 4. `UnifiedGridPreview`

The actual grid rendering component that displays the slot game grid with symbols.

**Location**: `/src/components/visual-journey/grid-preview/UnifiedGridPreview.tsx`

**Features**:
- Renders grid of various dimensions (3×3 up to 9×9)
- Supports both portrait and landscape orientations
- Auto-scaling for different grid sizes
- Dynamic symbol sizing and spacing
- Win line visualization
- Symbol variety based on position

## Recent Updates

### Debugging Elements Removed
We've removed debugging elements from the production view to provide a cleaner user experience:

1. **Removed Debug Label**: The default for `showDebugLabel` is now `false`, eliminating the overlay text that displayed grid dimensions and orientation in the top-left corner.

2. **Eliminated Console Logging**: Removed all diagnostic console logs related to:
   - Mobile detection processes
   - Orientation change events
   - Layout calculation values
   - Scale factor computation

3. **Removed Debug Data Attributes**: Eliminated data attributes used for development:
   - `data-is-mobile` attribute
   - `data-is-landscape` attribute

4. **Streamlined UI**: Removed the debug panel that showed technical details like "Mobile: Yes" that were visible to users.

## Usage

### Basic Use in PremiumLayout

The `GridPreviewWrapper` is automatically used in the `PremiumLayout` component for Step 3 (Grid Layout Configuration):

```jsx
// In PremiumLayout.tsx
{currentStep === 2 ? (
  <GridPreviewWrapper />
) : (
  // Other content for other steps
)}
```

### Standalone Usage

You can use the component independently:

```tsx
import GridPreviewWrapper from './components/visual-journey/grid-preview/GridPreviewWrapper';

// Inside your component:
<GridPreviewWrapper className="my-custom-class" />
```

The component will automatically read grid configuration from the store.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

The component automatically retrieves grid configuration, orientation, and pay mechanism from the store.

## Component Architecture

The component architecture is designed to prevent nesting issues and ensure proper display:

1. `GridPreviewWrapper` is the main controller component
2. `PhoneMockup` and `DesktopMockup` are exclusively used for their respective device types
3. The `UnifiedGridPreview` is now directly integrated inside each mockup
4. No nested wrappers to cause double rendering or visual clutter
5. Proper data attributes for device and orientation consistency

The component hierarchy is:
```
GridPreviewWrapper
├── Header (Controls)
└── Preview Container
    ├── Device Label
    └── PhoneMockup OR DesktopMockup
        └── UnifiedGridPreview (direct integration)
```

## Auto-Scaling Logic

The grid preview implements smart scaling logic:
1. Standard layouts (3×3, 5×3) display at 100% scale
2. Larger grids (6×3, 5×4, etc.) automatically scale down proportionally
3. Different scaling factors apply for portrait vs. landscape orientations

```tsx
// PhoneMockup has enhanced scaling for portrait mode
const calculateGridScale = (): number => {
  // Base scale factor - standard layouts (3x3, 5x3) use scale 1
  if (reels <= 5 && rows <= 3) return 1;
  
  // For wider grids (6+ reels), scale down proportionally
  if (reels > 5) {
    const reelFactor = 5 / reels;
    // Apply more aggressive scaling for portrait mode
    return orientation === 'portrait' 
      ? Math.min(1, reelFactor * 0.85) 
      : Math.min(1, reelFactor * 1.1);
  }
  
  // For taller grids (4+ rows), scale down proportionally
  if (rows > 3) {
    const rowFactor = 3 / rows;
    // Apply more aggressive scaling for portrait mode
    return orientation === 'portrait'
      ? Math.min(1, rowFactor * 0.85)
      : Math.min(1, rowFactor * 1.1);
  }
  
  // For very large grids (both wide and tall), scale down even more
  if (reels > 5 && rows > 3) {
    const combinedFactor = (5 / reels) * (3 / rows);
    return orientation === 'portrait'
      ? Math.min(1, combinedFactor * 0.8)
      : Math.min(1, combinedFactor * 1.2);
  }
  
  // Default scale if none of the above conditions met
  return 1;
};
```

### Device & Orientation Controls

The component includes UI controls for:
- Switching between mobile and desktop devices
- Toggling orientation (mobile only - desktop is always landscape)
- Resetting animations
- Toggling fullscreen mode

### State Management

The component integrates with the global store:
- Retrieves current grid dimensions (`reels` and `rows`)
- Gets current orientation
- Gets current pay mechanism
- Updates store when orientation is changed

## Integration Details

### Store Integration

The component uses the following from the game store:
```javascript
const { config } = useGameStore();
const reels = config.reels?.layout?.reels || 5;
const rows = config.reels?.layout?.rows || 3;
const storeOrientation = config.reels?.layout?.orientation || 'landscape';
const payMechanism = config.reels?.payMechanism || 'betlines';
```

### Event Handling

The component dispatches and listens for events:
```javascript
// Reset grid animation
const resetAnimation = () => {
  setIsLoading(true);
  
  // Trigger the grid animation reset event
  const event = new Event('resetGridAnimation');
  document.dispatchEvent(event);
  
  // Update loading state after a delay for animation
  setTimeout(() => {
    setIsLoading(false);
  }, 300);
};
```

## Final Fixes Applied

### 1. Removed Nested Portrait Mockup on Mobile
- Fixed the nested mockup issue in portrait mode
- Integrated UnifiedGridPreview directly inside PhoneMockup
- Removed any recursive children rendering
- Each mockup now directly creates its own grid preview
- Modified props to pass essential data directly

### 2. Simplified Desktop Landscape Mockup
- Completely flattened the desktop mockup structure
- Removed unnecessary container divs and duplicate borders
- Used simple browser-like layout with only needed elements
- Applied flex layout with proper height management (flex-grow, shrink)
- Added clear data attributes for identification

### 3. Improved Display Rules
- Portrait: Single phone mockup with top notch and controls
- Landscape: Simple browser chrome with URL bar
- Desktop: Always landscape with browser frame
- Data attributes consistently match visual display
- Each display mode uses most appropriate controls

### 4. Enhanced Scaling Logic
- Improved scaling for tall grids (5x4) in portrait
- Aggressive scaling in portrait (0.85 vs 1.1 for landscape)
- Added proper transformOrigin for centered scaling
- Different scaling approaches for phone vs desktop
- Flex container with padding for consistent spacing

### 5. Improved Structure and Performance
- Faster render times with direct component usage
- Cleaner component hierarchy without nesting
- Consistent data-* attributes to aid debugging
- Proper component type checking with TypeScript interfaces

### 6. Removed Debug Elements
- Eliminated debug labels from production view
- Removed console logging statements
- Removed debugging data attributes
- Streamlined UI for production usage
- Default showDebugLabel set to false

## Styling & Animations

### Device Mockups

The mockups use realistic styling with:
- Proper device proportions
- Shadow effects
- Gradient backgrounds
- Rounded corners matching real devices
- Device-specific UI elements

### Animations

The component includes several animations:
- Fade in/out transitions when switching devices or orientations
- Light ray background effects
- Loading spinner during transitions
- Scale animations when switching views

### CSS Features

Custom CSS animations are used for background light effects:
```css
@keyframes light-sweep {
  0% { transform: translateX(-100%) rotate(35deg); }
  100% { transform: translateX(200%) rotate(35deg); }
}
.animate-light-sweep {
  animation: light-sweep 8s infinite ease-in-out;
}
.animate-light-sweep-delayed {
  animation: light-sweep 8s infinite 4s ease-in-out;
}
```

## Best Practices

1. **Device Compatibility**: Desktop view should always use landscape orientation
2. **Performance**: Use loading states during transitions to prevent UI jank
3. **Labeling**: Keep device and grid dimension labels in sync with actual state
4. **Scaling**: Apply appropriate scaling based on grid dimensions and orientation
5. **Nesting**: Avoid nesting device mockups or wrappers inside each other
6. **Integration**: UnifiedGridPreview should be directly integrated inside mockups
7. **Debug Elements**: Keep debug elements out of production views

## Visual Rules

1. **Phone Portrait**: 
   - Vertical phone frame with notch and side buttons
   - Game title bar at top
   - Controls at bottom with floating spin button

2. **Phone Landscape**:
   - Horizontal phone frame with power button and side buttons
   - Controls on left side
   - Floating spin button on right side

3. **Desktop Browser**:
   - Clean browser chrome with tab bar
   - URL/address bar with security icon
   - Control bar at bottom
   - Status bar for game state

4. **All Devices**:
   - Single device label in top-left corner
   - No nested wrappers or borders
   - Proper padding and margins
   - Centered content with automatic scaling
   - No debug elements in production

## Future Enhancements

Potential improvements to consider:
1. Add tablet device mockup option
2. Support different aspect ratios for specialized slot games
3. Add toggle for different symbol sets
4. Implement animated reels for more realistic preview
5. Add win pattern visualization options
6. Support custom background themes
7. Add zoom controls for examining details

## Technical Notes

- Built with React/TypeScript
- Uses Framer Motion for animations
- Integrates with Zustand store
- Responsive design with ResizeObserver
- Custom SVG icons for device-specific elements
- Fullscreen API support
- Custom event handling
- Improved scaling algorithm for large grids
- Direct component integration without nesting
- Clean production UI with no debugging elements