import { useMemo } from 'react';

/**
 * Interface for the slot layout parameters returned by the hook
 */
export interface SlotLayoutParams {
  /** Whether this is a small grid (3x3 or smaller) */
  isSmallGrid: boolean;
  /** Whether this is a medium grid (up to 5x4) */
  isMediumGrid: boolean;
  /** Whether this is a large grid (larger than 5x4) */
  isLargeGrid: boolean;
  /** Gap size between symbols in pixels */
  gapSize: number;
  /** Size of each symbol in pixels */
  symbolSize: number;
  /** Font size for symbols in pixels */
  fontSize: number;
  /** Padding around the grid in pixels */
  gridPadding: number;
  /** Container aspect ratio */
  containerAspectRatio: string;
  /** Debug label text */
  debugLabel: string;
  /** Grid width percentage relative to container */
  gridWidthPct: number;
  /** Grid height percentage relative to container */
  gridHeightPct: number;
  /** Scale factor for the entire grid (1.0 = 100%) */
  gridScale: number;
  /** Virtual container width (for responsive sizing) */
  virtualContainerWidth: number;
  /** Virtual container height (for responsive sizing) */
  virtualContainerHeight: number;
}

/**
 * Calculates the appropriate grid scale factor based on dimensions and orientation
 */
function calculateGridScale({
  reels,
  rows,
  containerWidth,
  containerHeight,
  orientation
}: {
  reels: number;
  rows: number;
  containerWidth: number;
  containerHeight: number;
  orientation: 'landscape' | 'portrait';
}): { symbolSize: number; gridScale: number } {
  // Define base dimensions for landscape orientation
  let baseWidth = containerWidth;
  let baseHeight = containerHeight;
  
  // In portrait mode, we simulate a mobile phone screen
  if (orientation === 'portrait') {
    // iPhone 13 ratio (approximately 390x844)
    const mobileRatio = 390 / 844;
    
    // Calculate the virtual container size based on available space
    if (containerHeight * mobileRatio <= containerWidth) {
      // Height constrained
      baseHeight = containerHeight * 0.9; // 90% of available height
      baseWidth = baseHeight * mobileRatio;
    } else {
      // Width constrained
      baseWidth = containerWidth * 0.9; // 90% of available width
      baseHeight = baseWidth / mobileRatio;
    }
  }
  
  // Calculate the maximum area the grid can occupy - improved for premium sizing
  const gridAvailableWidth = orientation === 'landscape' 
    ? baseWidth * 0.98  // Increased from 95% to 98% for maximum screen utilization
    : baseWidth * 0.92; // Increased from 88% to 92% for mobile view
    
  const gridAvailableHeight = orientation === 'landscape'
    ? baseHeight * 0.88  // Increased from 85% to 88% for better vertical fill
    : baseHeight * 0.70; // Increased from 65% to 70% in portrait
  
  // Calculate optimized gap size based on grid density for premium look
  const gridDensity = reels * rows;
  let gapMultiplier = 1;
  
  // Refined gap multipliers for better symbol spacing
  if (gridDensity <= 9) { // 3x3 or similar
    gapMultiplier = 0.9; // Reduced from 1.0 to give symbols more space
  } else if (gridDensity <= 15) { // 5x3 or similar (standard)
    gapMultiplier = 0.8; // Standard size
  } else if (gridDensity <= 24) { // 6x4 or similar
    gapMultiplier = 0.7; // Reduced slightly for better spacing
  } else if (gridDensity <= 36) { // 6x6 or similar
    gapMultiplier = 0.5; // Reduced from 0.6 to maximize symbol size
  } else { // Very dense grids
    gapMultiplier = 0.3; // Reduced from 0.4 for maximizing symbol visibility
  }
  
  // Base gap size in pixels - adjusted for tier 1 AAA look
  const baseGapSize = orientation === 'landscape' ? 4 : 3; // Reduced from original values to maximize symbol size
  const gapSize = Math.max(2, baseGapSize * gapMultiplier); // Ensure minimum 2px gap for visual separation
  
  // Total space occupied by gaps
  const totalHorizontalGaps = (reels - 1) * gapSize;
  const totalVerticalGaps = (rows - 1) * gapSize;
  
  // Available space for symbols after gaps
  const availableWidthForSymbols = gridAvailableWidth - totalHorizontalGaps;
  const availableHeightForSymbols = gridAvailableHeight - totalVerticalGaps;
  
  // Calculate symbol size based on available space and grid dimensions
  const symbolWidthBased = availableWidthForSymbols / reels;
  const symbolHeightBased = availableHeightForSymbols / rows;
  
  // Use the smaller dimension to maintain square symbols
  const rawSymbolSize = Math.min(symbolWidthBased, symbolHeightBased);
  
  // Calculate grid scale (percentage of available space used)
  // This helps with centering and positioning
  const horizontalScale = (rawSymbolSize * reels + totalHorizontalGaps) / gridAvailableWidth;
  const verticalScale = (rawSymbolSize * rows + totalVerticalGaps) / gridAvailableHeight;
  const gridScale = Math.min(horizontalScale, verticalScale);
  
  // Ensure minimum and maximum symbol sizes for readability and aesthetics
  let symbolSize = rawSymbolSize;
  
  // Apply size limits based on orientation and grid dimensions
  const isSmallGrid = reels <= 3 && rows <= 3;
  const isMediumGrid = (reels <= 5 && rows <= 4) && !isSmallGrid;
  
  // Adjust max symbol size based on orientation and grid density - enhanced for premium look
  let maxSymbolSize;
  let minSymbolSize;
  
  if (orientation === 'landscape') {
    // Increased maximum sizes for better visibility
    maxSymbolSize = isSmallGrid ? 95 : isMediumGrid ? 85 : 75; // Increased from 90/80/70
    // Increased minimum sizes to prevent tiny symbols in larger grids
    minSymbolSize = isSmallGrid ? 45 : isMediumGrid ? 40 : 35; // Increased from 40/35/30
  } else {
    // Portrait mode with improved sizes
    maxSymbolSize = isSmallGrid ? 75 : isMediumGrid ? 65 : 55; // Increased from 70/60/50
    minSymbolSize = isSmallGrid ? 40 : isMediumGrid ? 35 : 30; // Increased from 35/30/25
  }
  
  // Apply improved minimum/maximum limits for premium appearance
  symbolSize = Math.min(Math.max(symbolSize, minSymbolSize), maxSymbolSize);
  
  // Adjust for AAA tier 1 quality - boost symbol size by 7% if below 90% of maximum
  // This ensures symbols have maximum visual impact while maintaining proportions
  if (symbolSize < maxSymbolSize * 0.9) {
    symbolSize = Math.min(symbolSize * 1.07, maxSymbolSize);
  }
  
  return {
    symbolSize: Math.floor(symbolSize), // Integer pixels for crisp rendering
    gridScale
  };
}

/**
 * Custom hook to calculate slot layout dimensions
 * Follows industry standard proportions for commercial slot games
 * 
 * @param reels Number of reels (columns)
 * @param rows Number of rows
 * @param orientation 'landscape' or 'portrait'
 * @returns Object with calculated layout parameters
 */
export function useSlotLayout(
  reels: number, 
  rows: number, 
  orientation: 'landscape' | 'portrait'
): SlotLayoutParams {
  return useMemo(() => {
    // Basic dimensions for calculation reference
    // These will be scaled proportionally in the actual rendering
    const referenceWidth = orientation === 'landscape' ? 1000 : 390;
    const referenceHeight = orientation === 'landscape' ? 600 : 844;
    
    // Virtual container dimensions - simulates display device
    // For landscape, this is the game window, for portrait, it's a phone screen
    const virtualContainerWidth = orientation === 'landscape' ? referenceWidth : 390;
    const virtualContainerHeight = orientation === 'landscape' ? referenceHeight : 844;
    
    // Calculate realistic aspect ratio based on grid dimensions and orientation
    let containerAspectRatio: string;
    
    if (orientation === 'landscape') {
      // Standard landscape aspect ratios (based on grid dimensions)
      if (reels === 3 && rows === 3) {
        containerAspectRatio = '4/3'; // More square for 3x3
      } else if (reels === 5 && rows === 3) {
        containerAspectRatio = '16/9'; // Standard widescreen for 5x3
      } else if (reels >= 6) {
        containerAspectRatio = '21/9'; // Ultra-wide for 6+ reels
      } else {
        // Dynamic ratio for unusual combinations
        containerAspectRatio = `${Math.max(1.2, reels/rows * 1.1)}/1`;
      }
    } else {
      // Portrait aspect ratios (inverted dimensions)
      if (reels === 3 && rows === 5) {
        containerAspectRatio = '9/16'; // Mobile-friendly vertical
      } else if (reels === 3 && rows === 3) {
        containerAspectRatio = '3/4'; // More square for 3x3
      } else {
        // Dynamic ratio for unusual combinations
        containerAspectRatio = `1/${Math.max(1.2, rows/reels * 1.1)}`;
      }
    }
    
    // Calculate grid scale and symbol size based on dimensions
    const { symbolSize, gridScale } = calculateGridScale({
      reels,
      rows,
      containerWidth: virtualContainerWidth,
      containerHeight: virtualContainerHeight,
      orientation
    });
    
    // Determine grid size category with more nuanced categorization
    const isSmallGrid = reels <= 3 && rows <= 3;
    const isMediumGrid = (reels <= 5 && rows <= 4) && !isSmallGrid;
    const isLargeGrid = !isSmallGrid && !isMediumGrid;
    
    // Calculate base gap size - varies by grid density
    // Professional slots use bigger gaps for small grids and smaller for dense grids
    let baseGapSize: number;
    
    if (isSmallGrid) {
      baseGapSize = orientation === 'landscape' ? 6 : 4; // Reduced from 8/6 for better symbol visibility
    } else if (isMediumGrid) {
      baseGapSize = orientation === 'landscape' ? 4 : 3; // Reduced from 6/5 for standard 5x3 slots
    } else {
      // For large grids, scale gap down as dimensions increase
      const gridDensity = reels * rows;
      if (gridDensity <= 25) {
        baseGapSize = orientation === 'landscape' ? 3 : 2; // 5x5 or similar (reduced from 5/4)
      } else if (gridDensity <= 36) {
        baseGapSize = orientation === 'landscape' ? 3 : 2; // 6x6 or similar (reduced from 4/3)
      } else if (gridDensity <= 49) {
        baseGapSize = orientation === 'landscape' ? 2 : 1; // 7x7 or similar (reduced from 3/2)
      } else {
        baseGapSize = orientation === 'landscape' ? 2 : 1; // Very large grids (unchanged)
      }
    }
    
    // Apply orientation adjustment
    const gapSize = Math.max(1, baseGapSize);
    
    // Calculate font size proportional to symbol size
    // This ensures text symbols scale appropriately with the container
    const calculateFontSize = (baseSize: number): number => {
      // Scale font size based on grid category
      if (isSmallGrid) {
        return Math.min(Math.max(16, baseSize * 0.6), 28);
      } else if (isMediumGrid) {
        return Math.min(Math.max(14, baseSize * 0.55), 26);
      } else {
        // For large grids, ensure minimum readability
        return Math.min(Math.max(12, baseSize * 0.5), 24);
      }
    };
    
    // Calculate font size and round to nearest integer
    const fontSize = Math.floor(calculateFontSize(symbolSize));
    
    // Calculate padding around the grid based on grid size
    // AAA slot games use proportional padding relative to symbol size
    const gridPadding = isSmallGrid ? 
      Math.floor(symbolSize * 0.2) : 
      isMediumGrid ? 
        Math.floor(symbolSize * 0.15) : 
        Math.floor(symbolSize * 0.1);
    
    // Calculate grid size percentages for container
    // These values determine how much of the container the grid takes up
    const gridWidthPct = orientation === 'landscape' ? 98 : 92;
    const gridHeightPct = orientation === 'landscape' ? 88 : 70;
    
    // Create debug label text with correct orientation
    const debugLabel = `${reels}×${rows} - ${orientation}`;
    
    return {
      isSmallGrid,
      isMediumGrid,
      isLargeGrid,
      gapSize,
      symbolSize,
      fontSize,
      gridPadding,
      containerAspectRatio,
      debugLabel,
      gridWidthPct,
      gridHeightPct,
      gridScale,
      virtualContainerWidth,
      virtualContainerHeight
    };
  }, [reels, rows, orientation]);
}

export default useSlotLayout;