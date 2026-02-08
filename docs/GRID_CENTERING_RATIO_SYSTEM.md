# Grid Centering Ratio System

## Overview
The grid is now centered using a ratio-based positioning system that ensures consistent placement across different screen sizes and orientations.

## How It Works

### Centering Configuration
The renderer maintains centering configurations for different device types:

```typescript
private centeringConfig = {
  desktop: { x: 0.5, y: 0.5 },           // Center of screen
  mobileLandscape: { x: 0.5, y: 0.5 },   // Center of screen
  mobilePortrait: { x: 0.5, y: 0.45 }    // Slightly above center
};
```

### Ratio Values
- `0.0` = Left/Top edge
- `0.5` = Center
- `1.0` = Right/Bottom edge

### Example Configurations
- `{ x: 0.5, y: 0.5 }` - Perfect center
- `{ x: 0.5, y: 0.3 }` - Centered horizontally, upper third vertically
- `{ x: 0.7, y: 0.5 }` - Right of center horizontally

## Dynamic Adjustment

### Method: `setCenteringRatio(xRatio, yRatio, deviceType?)`

You can dynamically adjust the centering:

```javascript
// Center the grid slightly to the right
renderer.setCenteringRatio(0.6, 0.5);

// Set specific ratio for mobile portrait
renderer.setCenteringRatio(0.5, 0.4, 'mobilePortrait');
```

## Coverage Ratios

The grid size is also calculated using coverage ratios:

### Desktop
- Width Coverage: 70% of screen width
- Height Coverage: 70% of screen height

### Mobile Landscape
- Width Coverage: 60% of screen width
- Height Coverage: 80% of screen height

### Mobile Portrait
- Width Coverage: 80% of screen width
- Height Coverage: 50% of screen height

## Benefits

1. **Consistent Positioning**: Grid maintains relative position across screen sizes
2. **Flexible Layout**: Easy to adjust for different UI requirements
3. **Device-Specific**: Different settings for desktop/mobile/orientation
4. **Dynamic Updates**: Can be changed at runtime
5. **Prevents Overflow**: Includes margin checks to keep grid on-screen

## Implementation Details

### centerGridContainer()
1. Determines current device type
2. Gets appropriate centering ratios
3. Calculates center point: `centerX = screenWidth * xRatio`
4. Positions grid: `x = centerX - (gridWidth / 2)`
5. Applies margin constraints
6. Logs final position

### calculateOptimalSymbolSize()
1. Determines coverage ratios based on device
2. Calculates available space: `available = screenSize * coverageRatio`
3. Accounts for padding between symbols
4. Calculates optimal symbol size
5. Applies min/max constraints
6. Rounds down to ensure fit

## Visual Enhancements

### Grid Background
- Semi-transparent dark background (0.95 alpha)
- 20px padding around grid
- Rounded corners (15px radius)
- Subtle drop shadow effect

### Symbol Positioning
- Centered anchoring (0.5, 0.5)
- 80% cell coverage for padding
- Z-index ordering for proper layering

## Usage Examples

### Adjust for UI Controls
```javascript
// Mobile portrait with bottom UI controls
renderer.setCenteringRatio(0.5, 0.4, 'mobilePortrait');
```

### Side Panel Layout
```javascript
// Desktop with left sidebar
renderer.setCenteringRatio(0.6, 0.5, 'desktop');
```

### Custom Positioning
```javascript
// Upper-left quadrant
renderer.setCenteringRatio(0.25, 0.25);
```

## Testing
1. Resize the window - grid should maintain ratio position
2. Switch orientations - grid should use device-specific ratios
3. Change grid size - grid should stay centered
4. Check margins - grid should never go off-screen