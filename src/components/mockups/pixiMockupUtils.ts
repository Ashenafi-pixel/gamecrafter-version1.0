/**
 * PixiJS Mockup Utilities
 * 
 * Shared utilities for PixiJS mockup components to ensure consistency
 * with CSS mockup calculations and styling while using PixiJS rendering.
 */

import * as PIXI from 'pixi.js';

export interface PixiMockupDimensions {
  symbolSize: number;
  gridWidth: number;
  gridHeight: number;
  gridX: number;
  gridY: number;
  symbolPadding: number;
}

export interface PixiMockupConfig {
  cols: number;
  rows: number;
  containerWidth?: number;
  containerHeight?: number;
  isMobile?: boolean;
  orientation?: 'portrait' | 'landscape';
  reelGap?: number;
}

/**
 * Calculate grid dimensions using the EXACT same logic as CSS mockup
 * This ensures pixel-perfect consistency between CSS and PixiJS mockups
 */
export const calculatePixiMockupDimensions = (config: PixiMockupConfig): PixiMockupDimensions => {
  const {
    cols,
    rows,
    containerWidth = 800,
    containerHeight = 600,
    isMobile = false,
    orientation = 'portrait'
  } = config;

  // Use identical logic to CSS mockup
  const symbolPadding = 2;
  
  let widthCoverageRatio = 0.8;
  let heightCoverageRatio = 0.85;
  
  // Smart coverage adjustment for wider grids
  if (cols >= 5) {
    widthCoverageRatio = 0.7;
  }
  if (cols >= 6) {
    widthCoverageRatio = 0.65;
  }
  if (cols >= 7) {
    widthCoverageRatio = 0.6;
  }
  
  // Mobile adjustments
  if (isMobile) {
    if (orientation === 'landscape') {
      widthCoverageRatio = Math.min(widthCoverageRatio, 0.75);
      heightCoverageRatio = 0.8;
    } else {
      widthCoverageRatio = Math.min(widthCoverageRatio, 0.85);
      heightCoverageRatio = 0.6;
    }
  }
  
  const availableWidth = containerWidth * widthCoverageRatio;
  const availableHeight = containerHeight * heightCoverageRatio;
  
  const totalPaddingWidth = (cols - 1) * symbolPadding;
  const totalPaddingHeight = (rows - 1) * symbolPadding;
  
  const maxSymbolWidth = (availableWidth - totalPaddingWidth) / cols;
  const maxSymbolHeight = (availableHeight - totalPaddingHeight) / rows;
  
  const optimalSize = Math.min(maxSymbolWidth, maxSymbolHeight);
  
  const minSize = isMobile ? 60 : 90;
  const maxSize = isMobile ? 120 : 80;
  const constrainedSize = Math.max(minSize, Math.min(optimalSize, maxSize));
  
  const symbolSize = Math.floor(constrainedSize);
  
  
  const gridWidth = cols * symbolSize + totalPaddingWidth;
  const gridHeight = rows * symbolSize + totalPaddingHeight;
  
  // Center positioning
  const padding = 20;
  const totalWidthWithPadding = gridWidth + (padding * 2);
  const totalHeightWithPadding = gridHeight + (padding * 2);
  
  const horizontalRatio = 0.5;
  const verticalRatio = 0.5;
  
  const centerX = containerWidth * horizontalRatio;
  const centerY = containerHeight * verticalRatio;
  
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
 * Generate placeholder symbols for PixiJS grid preview
 */
export const generatePixiPlaceholderSymbols = (cols: number, rows: number, theme?: string): string[] => {
  const totalCells = cols * rows;
  const placeholders = [];
  
  const logoUrl = '/assets/brand/gold.png';
  
  for (let i = 0; i < totalCells; i++) {
    placeholders.push(logoUrl);
  }
  
  return placeholders;
};

/**
 * Create a PixiJS texture from a color for placeholder symbols
 */
export const createColorTexture = (app: PIXI.Application, color: number, width: number, height: number): PIXI.Texture => {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(color);
  graphics.drawRect(0, 0, width, height);
  graphics.endFill();
  
  return app.renderer.generateTexture(graphics);
};

/**
 * Create a PixiJS texture with border for symbol cells
 */
export const createSymbolCellTexture = (app: PIXI.Application, size: number): PIXI.Texture => {
  const graphics = new PIXI.Graphics();
  
  // Background
  graphics.beginFill(0x000000, 0); // Transparent background
  graphics.drawRoundedRect(0, 0, size, size, 10);
  graphics.endFill();
  
  // Border
  graphics.lineStyle(2, 0xffffff, 0.1);
  // graphics.drawRoundedRect(1, 1, size - 2, size - 2, 10);
  
  return app.renderer.generateTexture(graphics);
};

/**
 * Load texture from URL with error handling
 */
export const loadTextureFromUrl = async (url: string): Promise<PIXI.Texture | null> => {
  try {
    const texture = await PIXI.Texture.fromURL(url);
    return texture;
  } catch (error) {
    console.error(`Failed to load texture from ${url}:`, error);
    return null;
  }
};

/**
 * Create PixiJS styles that match CSS mockup styles
 */
export const pixiMockupStyles = {
  backgroundColor: 0x0f172a,
  symbolBorderColor: 0xffffff,
  symbolBorderAlpha: 0.1,
  placeholderColor: 0xffffff,
  placeholderAlpha: 0.1,
  uiBackgroundColor: 0x000000,
  uiBackgroundAlpha: 0.8,
  textColor: 0xffffff,
  accentColor: 0x10b981,
  buttonColor: 0x1f2937
};
