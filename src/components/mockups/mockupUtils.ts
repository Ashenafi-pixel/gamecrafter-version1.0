/**
 * Mockup Utilities
 * 
 * Shared utilities for CSS mockup components to ensure consistency
 * with PIXI renderer calculations and styling.
 */

export interface MockupDimensions {
  symbolSize: number;
  gridWidth: number;
  gridHeight: number;
  gridX: number;
  gridY: number;
  symbolPadding: number;
}

export interface MockupConfig {
  cols: number;
  rows: number;
  containerWidth?: number;
  containerHeight?: number;
  isMobile?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Calculate grid dimensions using the EXACT same logic as PIXI Renderer
 * This ensures pixel-perfect consistency between CSS mockup and PIXI preview
 * 
 * MATCHED TO PIXIJS CANVAS DIMENSIONS:
 * - Default: 1200x800 (from Renderer.ts lines 102-103)
 * - Fallback: 800x600 (when config.width/height not specified)
 * - Uses identical coverage ratios and symbol size constraints as PixiJS
 */
export const calculateMockupDimensions = (config: MockupConfig): MockupDimensions => {
  const {
    cols,
    rows,
    // MATCH PIXIJS: Use same default dimensions as Renderer.ts
    containerWidth = 800,  // matches config.width || 800 default in PixiJS renderer
    containerHeight = 600,   // matches config.height || 600 default in PixiJS renderer  
    isMobile = false,
    orientation = 'portrait'
  } = config;

  // ========== EXACT COPY OF PIXIJS calculateOptimalSymbolSize() ==========
  // This is a 1:1 replica of the PixiJS Renderer.ts calculateOptimalSymbolSize method
  
  const symbolPadding = 2; // EXACT: matches PixiJS gridConfig.symbolPadding
  
  // EXACT COPY: Define coverage ratios for different scenarios - Tier 1 slot game sizing
  let widthCoverageRatio = 0.8;  // Use 80% of screen width for professional look
  let heightCoverageRatio = 0.85; // Use 85% of screen height for maximum impact
  
  // EXACT COPY: Smart coverage adjustment: Reduce width coverage for wider grids to prevent clipping
  if (cols >= 5) {
    widthCoverageRatio = 0.7;  // 70% for 5+ columns to fit in container
  }
  if (cols >= 6) {
    widthCoverageRatio = 0.65; // 65% for 6+ columns to ensure full visibility
  }
  if (cols >= 7) {
    widthCoverageRatio = 0.6;  // 60% for 7+ columns for maximum grids
  }
  
  // EXACT COPY: Mobile adjustments
  if (isMobile) {
    if (orientation === 'landscape') {
      widthCoverageRatio = Math.min(widthCoverageRatio, 0.75);  // Apply mobile constraint
      heightCoverageRatio = 0.8;  // Good height coverage in landscape
    } else {
      widthCoverageRatio = Math.min(widthCoverageRatio, 0.85);  // Apply mobile constraint
      heightCoverageRatio = 0.6;  // Leave space for UI controls in portrait
    }
  }
  
  // EXACT COPY: Calculate available space based on ratios
  const availableWidth = containerWidth * widthCoverageRatio;
  const availableHeight = containerHeight * heightCoverageRatio;
  
  // EXACT COPY: Account for padding between symbols
  const totalPaddingWidth = (cols - 1) * symbolPadding;
  const totalPaddingHeight = (rows - 1) * symbolPadding;
  
  // EXACT COPY: Calculate maximum symbol size that fits
  const maxSymbolWidth = (availableWidth - totalPaddingWidth) / cols;
  const maxSymbolHeight = (availableHeight - totalPaddingHeight) / rows;
  
  // EXACT COPY: Use the smaller dimension to maintain square symbols
  const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);
  
  // EXACT COPY: Apply min/max constraints based on device - Tier 1 slot game sizing
  const minSize = isMobile ? 60 : 60;   // Larger minimum for better visibility
  const maxSize = isMobile ? 120 : 80;  // Much larger maximum for tier 1 appearance
  const constrainedSize = Math.max(minSize, Math.min(optimalSize, maxSize));
  
  // EXACT COPY: Round down to ensure we don't exceed available space
  const symbolSize = Math.floor(constrainedSize);
  
  // DEBUG: Log the calculation like PixiJS does
  console.log(`CSS Symbol size calculated: ${symbolSize}x${symbolSize} (${orientation}, mobile: ${isMobile})`);
  console.log(`CSS Using coverage ratios - width: ${widthCoverageRatio}, height: ${heightCoverageRatio}`);
  console.log(`CSS Available space: ${availableWidth}x${availableHeight}, optimalSize: ${optimalSize}, constrainedSize: ${constrainedSize}`);
  const gridWidth = cols * symbolSize + totalPaddingWidth;
  const gridHeight = rows * symbolSize + totalPaddingHeight;
  
  // EXACT MATCH TO PIXIJS: Center positioning from Renderer.ts lines 1717-1741
  // Add padding for the background (same as PixiJS)
  const padding = 20;
  const totalWidthWithPadding = gridWidth + (padding * 2);
  const totalHeightWithPadding = gridHeight + (padding * 2);
  
  // Use same centering ratios as PixiJS (0.5, 0.5 = true center)
  const horizontalRatio = 0.5;
  const verticalRatio = 0.5;
  
  // Calculate center positions based on ratios
  const centerX = containerWidth * horizontalRatio;
  const centerY = containerHeight * verticalRatio;
  
  // Position grid container so its center (including padding) aligns with the calculated center point
  const gridX = Math.round(centerX - (totalWidthWithPadding / 2));
  const gridY = Math.round(centerY - (totalHeightWithPadding / 2));
  
  return {
    symbolSize,
    gridWidth,
    gridHeight,
    gridX,
    gridY,
    symbolPadding
  };
};

/**
 * Generate placeholder symbols for grid preview
 */
export const generatePlaceholderSymbols = (cols: number, rows: number, theme?: string): string[] => {
  const totalCells = cols * rows;
  const placeholders = [];
  
  // Use Game Crafter gold logo for all placeholder symbols
  const logoUrl = '/assets/brand/gold.png';
  
  for (let i = 0; i < totalCells; i++) {
    placeholders.push(logoUrl);
  }
  
  return placeholders;
};

/**
 * CSS styles for consistent mockup appearance
 */
export const mockupStyles = {
  container: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 70%, #1e293b 100%)',
    borderRadius: '12px',
    position: 'relative' as const,
    overflow: 'hidden' as const
  },
  
  symbolGrid: {
    position: 'absolute' as const,
    display: 'grid' as const,
    zIndex: 2
  },
  
  symbolCell: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const
  },
  
  symbolImage: {
    width: '95%', // EXACT: matches PixiJS 0.95 scale factor in positionSymbol
    height: '80%',
    objectFit: 'contain' as const, // Same as PixiJS sprite scaling
    borderRadius: '8px'
  },
  
  placeholderSymbol: {
    width: '95%', // EXACT: matches PixiJS symbol scale factor
    height: '80%',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    border: '1px dashed rgba(255, 255, 255, 0.2)'
  },
  
  backgroundLayer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
    zIndex: 1
  },
  
  frameLayer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundSize: 'contain' as const,
    backgroundPosition: 'center' as const,
    backgroundRepeat: 'no-repeat' as const,
    zIndex: 3
  },
  
  controlsBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '80px',
    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 4
  },
  
  leftControls: {
    position: 'absolute' as const,
    left: '20px',
    display: 'flex' as const,
    gap: '10px',
    color: 'white',
    fontSize: '12px'
  },
  
  rightControls: {
    position: 'absolute' as const,
    right: '20px',
    display: 'flex' as const,
    gap: '15px',
    color: 'white',
    fontSize: '12px'
  },
  
  infoOverlay: {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    zIndex: 5
  },
  
  bottomUI: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '80px',
    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  },
  
  spinButton: {
    width: '96px', // EXACT: matches PixiJS main spin button p-6 (96px)
    height: '96px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    cursor: 'default' as const
  }
};

/**
 * Animate symbol transitions for better UX
 */
export const createSymbolTransition = (element: HTMLElement, delay: number = 0) => {
  element.style.opacity = '0';
  element.style.transform = 'scale(0.8)';
  element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'scale(1)';
  }, delay);
};