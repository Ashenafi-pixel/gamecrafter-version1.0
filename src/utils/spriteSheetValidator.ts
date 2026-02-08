/**
 * Sprite Sheet Validation and Cutting Utilities
 * Ensures proper sprite sheet format and provides precise cutting logic
 */

export interface SpriteSheetValidationResult {
  isValid: boolean;
  dimensions: { width: number; height: number; frameWidth: number; frameHeight: number; };
  gridInfo: { cols: number; rows: number; totalFrames: number; };
  issues: string[];
  recommendations: string[];
}

export interface SpriteFrame {
  x: number; y: number; width: number; height: number;
  frameIndex: number; row: number; col: number;
}
// ───────────────────────────────────────────────────
const COLS         = 5;
const ROWS         = 5;
const SYMBOL_SIZE  = 180;  // px of actual symbol in each frame
const GUTTER       = 0;   // px between each frame
const OUTER_MARGIN = 16;   // px around all edges

// Derived:
const CELL_SIZE    = SYMBOL_SIZE + GUTTER;  
const SPRITE_WIDTH  = SYMBOL_SIZE*COLS + GUTTER*(COLS-1) + OUTER_MARGIN*2;
const SPRITE_HEIGHT = SYMBOL_SIZE*ROWS + GUTTER*(ROWS-1) + OUTER_MARGIN*2;
// ───────────────────────────────────────────────────


/**
 * Validate sprite sheet dimensions and grid alignment
 */
export const validateSpriteSheet = (
  imageWidth: number,
  imageHeight: number,
  gridCols = COLS,
  gridRows = ROWS
): SpriteSheetValidationResult => {
  const issues: string[] = [];
  const recs: string[] = [];

  // For standard 5x5 grids, use strict validation
  if (gridCols === 5 && gridRows === 5) {
    if (imageWidth !== SPRITE_WIDTH || imageHeight !== SPRITE_HEIGHT) {
      issues.push(
        `Invalid sheet size ${imageWidth}×${imageHeight}; expected ${SPRITE_WIDTH}×${SPRITE_HEIGHT} for 5x5 grid.`
      );
    }
    const frameW = SYMBOL_SIZE;
    const frameH = SYMBOL_SIZE;

    return {
      isValid: issues.length === 0,
      dimensions: { width: imageWidth, height: imageHeight, frameWidth: frameW, frameHeight: frameH },
      gridInfo: { cols: gridCols, rows: gridRows, totalFrames: gridCols * gridRows },
      issues,
      recommendations: recs
    };
  }

  // For other grid sizes (like single row), use dynamic validation
  const frameWidth = Math.floor(imageWidth / gridCols);
  const frameHeight = Math.floor(imageHeight / gridRows);

  // Basic validation for non-standard grids
  if (frameWidth < 32 || frameHeight < 32) {
    issues.push(`Frame size too small: ${frameWidth}×${frameHeight}. Minimum 32×32 recommended.`);
  }

  if (imageWidth % gridCols !== 0 || imageHeight % gridRows !== 0) {
    recs.push(`Image dimensions should be divisible by grid size for perfect frame alignment.`);
  }

  return {
    isValid: issues.length === 0,
    dimensions: { width: imageWidth, height: imageHeight, frameWidth, frameHeight },
    gridInfo: { cols: gridCols, rows: gridRows, totalFrames: gridCols * gridRows },
    issues,
    recommendations: recs
  };
};

export const validateSpriteSheet1 = (
  imageWidth: number,
  imageHeight: number,
  gridCols = COLS,
  gridRows = ROWS
): SpriteSheetValidationResult => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Only accept exactly the dimensions we asked the AI to produce:
  if (imageWidth !== SPRITE_WIDTH || imageHeight !== SPRITE_HEIGHT) {
    issues.push(
      `Unexpected sprite size: ${imageWidth}×${imageHeight}. ` +
      `Expected exactly ${SPRITE_WIDTH}×${SPRITE_HEIGHT}.`
    );
  }

  return {
    isValid: issues.length === 0,
    dimensions: {
      width: imageWidth,
      height: imageHeight,
      frameWidth: SYMBOL_SIZE,
      frameHeight: SYMBOL_SIZE
    },
    gridInfo: { cols: gridCols, rows: gridRows, totalFrames: gridCols * gridRows },
    issues,
    recommendations
  };
};


/**
 * Generate precise frame coordinates for sprite cutting with proper spacing
 * For standard 5x5 AI-generated sprite sheets
 */
export const generateFrameCoordinates = (
  imageWidth: number,
  imageHeight: number,
  gridCols = COLS,
  gridRows = ROWS
): SpriteFrame[] => {
  const frames: SpriteFrame[] = [];
  let index = 0;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const x = OUTER_MARGIN + col * (SYMBOL_SIZE + GUTTER);
      const y = OUTER_MARGIN + row * (SYMBOL_SIZE + GUTTER);

      frames.push({
        x, y,
        width: SYMBOL_SIZE,
        height: SYMBOL_SIZE,
        frameIndex: index,
        row, col
      });
      index++;
    }
  }
  return frames;
};

/**
 * Generate dynamic frame coordinates for uploaded sprite sheets
 * Calculates frame dimensions based on actual image size and grid layout
 */
export const generateDynamicFrameCoordinates = (
  imageWidth: number,
  imageHeight: number,
  gridCols: number,
  gridRows: number
): SpriteFrame[] => {
  const frames: SpriteFrame[] = [];
  let index = 0;

  // Calculate frame dimensions based on image size and grid
  const frameWidth = Math.floor(imageWidth / gridCols);
  const frameHeight = Math.floor(imageHeight / gridRows);

  console.log(`🔧 Dynamic frame calculation: ${imageWidth}×${imageHeight} ÷ ${gridCols}×${gridRows} = ${frameWidth}×${frameHeight}px per frame`);

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const x = col * frameWidth;
      const y = row * frameHeight;

      frames.push({
        x, y,
        width: frameWidth,
        height: frameHeight,
        frameIndex: index,
        row, col
      });
      index++;
    }
  }

  console.log(`✅ Generated ${frames.length} dynamic frames`);
  return frames;
};


/**
 * Analyze sprite sheet for common issues
 */
export const analyzeSpriteSheet = async (
  imageUrl: string, 
  gridCols: number = 5, 
  gridRows: number = 5
): Promise<{
  analysis: SpriteSheetValidationResult;
  frames: SpriteFrame[];
  debugInfo: {
    loadTime: number;
    imageFormat: string;
    hasTransparency: boolean;
  };
}> => {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const loadTime = Date.now() - startTime;
      
      // Create canvas to analyze the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Check for transparency
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      let hasTransparency = false;
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          hasTransparency = true;
          break;
        }
      }
      
      // Validate sprite sheet with custom grid
      const analysis = validateSpriteSheet(img.width, img.height, gridCols, gridRows);

      // Use appropriate frame generation based on grid type
      const frames = (gridCols === 5 && gridRows === 5)
        ? generateFrameCoordinates(img.width, img.height, gridCols, gridRows)
        : generateDynamicFrameCoordinates(img.width, img.height, gridCols, gridRows);
      
      resolve({
        analysis,
        frames,
        debugInfo: {
          loadTime,
          imageFormat: imageUrl.includes('.png') ? 'PNG' : 
                      imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? 'JPEG' : 'Unknown',
          hasTransparency
        }
      });
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Generate debug visualization of sprite sheet cutting
 */
export const generateDebugVisualization = (
  frames: SpriteFrame[],
  imageWidth: number,
  imageHeight: number
): string => {
  let visualization = `Sprite Sheet Debug (${imageWidth}x${imageHeight}):\n`;
  visualization += `${'─'.repeat(50)}\n`;
  
  frames.forEach((frame, index) => {
    visualization += `Frame ${index.toString().padStart(2, '0')}: `;
    visualization += `(${frame.x.toString().padStart(3, ' ')},${frame.y.toString().padStart(3, ' ')}) `;
    visualization += `${frame.width}x${frame.height} `;
    visualization += `[Row ${frame.row}, Col ${frame.col}]\n`;
  });
  
  return visualization;
};

/**
 * Recommended sprite sheet generation settings
 */
export const SPRITE_SHEET_RECOMMENDATIONS = {
  // Optimal dimensions for 5x5 grid
  OPTIMAL_SIZES: [
    { width: 1000, height: 1000, frameSize: 200 },
    { width: 1024, height: 1024, frameSize: 204.8 },
    { width: 1280, height: 1280, frameSize: 256 },
    { width: 1600, height: 1600, frameSize: 320 }
  ],

  // Grid configurations
  GRID_CONFIGS: [
    { cols: 5, rows: 5, frames: 25, name: 'Standard 5x5' },
    { cols: 4, rows: 4, frames: 16, name: 'Compact 4x4' },
    { cols: 6, rows: 6, frames: 36, name: 'Extended 6x6' },
    { cols: 8, rows: 4, frames: 32, name: 'Wide 8x4' }
  ],

  // Quality settings
  QUALITY_SETTINGS: {
    MIN_FRAME_SIZE: 64,
    RECOMMENDED_FRAME_SIZE: 200,
    MAX_FRAME_SIZE: 512,
    PREFERRED_FORMAT: 'PNG',
    TRANSPARENCY_REQUIRED: true
  }
};

/**
 * Detect object bounds within a canvas using edge detection
 */
export const detectObjectBounds = (canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { x: 0, y: 0, width: canvas.width, height: canvas.height };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;

  // Find bounds of non-transparent pixels
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 10) { // Consider pixels with alpha > 10 as part of the object
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Return bounds or fallback to center if no object detected
  if (minX <= maxX && minY <= maxY) {
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  } else {
    // Fallback: assume object is in center 80% of frame
    const padding = 0.1;
    return {
      x: Math.floor(canvas.width * padding),
      y: Math.floor(canvas.height * padding),
      width: Math.floor(canvas.width * (1 - 2 * padding)),
      height: Math.floor(canvas.height * (1 - 2 * padding))
    };
  }
};

/**
 * Align sprite sheet frames to ensure consistent object positioning
 * This fixes the "jumping" issue where objects move between frames
 */
export const alignSpriteSheetFrames = async (
  spriteSheetUrl: string,
  frames: SpriteFrame[]
): Promise<{ alignedFrames: SpriteFrame[]; alignedSpriteSheetUrl: string }> => {
  console.log('🎯 Aligning sprite sheet frames for consistent positioning...');

  try {
    // Load the original sprite sheet
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = spriteSheetUrl;
    });

    // Create canvas for each frame and detect object bounds
    const frameCanvases: HTMLCanvasElement[] = [];
    const objectBounds: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (const frame of frames) {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d')!;

      // Extract frame from sprite sheet
      ctx.drawImage(
        img,
        frame.x, frame.y, frame.width, frame.height,
        0, 0, frame.width, frame.height
      );

      frameCanvases.push(canvas);
      objectBounds.push(detectObjectBounds(canvas));
    }

    // Find the largest object bounds to create consistent frame size
    let maxObjectWidth = 0;
    let maxObjectHeight = 0;

    objectBounds.forEach(bounds => {
      maxObjectWidth = Math.max(maxObjectWidth, bounds.width);
      maxObjectHeight = Math.max(maxObjectHeight, bounds.height);
    });

    // Add padding around the largest object
    const padding = 20;
    const alignedFrameWidth = maxObjectWidth + (padding * 2);
    const alignedFrameHeight = maxObjectHeight + (padding * 2);

    // Create aligned frames
    const alignedCanvases: HTMLCanvasElement[] = [];

    for (let i = 0; i < frameCanvases.length; i++) {
      const originalCanvas = frameCanvases[i];
      const bounds = objectBounds[i];

      // Create new aligned canvas
      const alignedCanvas = document.createElement('canvas');
      alignedCanvas.width = alignedFrameWidth;
      alignedCanvas.height = alignedFrameHeight;
      const ctx = alignedCanvas.getContext('2d')!;

      // Calculate center position for the object
      const centerX = alignedFrameWidth / 2;
      const centerY = alignedFrameHeight / 2;

      // Draw the object centered in the new frame
      ctx.drawImage(
        originalCanvas,
        bounds.x, bounds.y, bounds.width, bounds.height,
        centerX - bounds.width / 2, centerY - bounds.height / 2, bounds.width, bounds.height
      );

      alignedCanvases.push(alignedCanvas);
    }

    // Create new sprite sheet from aligned frames
    const newSpriteSheet = document.createElement('canvas');
    const cols = 5;
    const rows = 5;
    newSpriteSheet.width = alignedFrameWidth * cols;
    newSpriteSheet.height = alignedFrameHeight * rows;
    const spriteCtx = newSpriteSheet.getContext('2d')!;

    // Draw aligned frames into new sprite sheet
    for (let i = 0; i < alignedCanvases.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * alignedFrameWidth;
      const y = row * alignedFrameHeight;

      spriteCtx.drawImage(alignedCanvases[i], x, y);
    }

    // Convert to data URL
    const alignedSpriteSheetUrl = newSpriteSheet.toDataURL('image/png');

    // Create new frame coordinates for the aligned sprite sheet
    const alignedFrames: SpriteFrame[] = [];
    for (let i = 0; i < 25; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      alignedFrames.push({
        x: col * alignedFrameWidth,
        y: row * alignedFrameHeight,
        width: alignedFrameWidth,
        height: alignedFrameHeight,
        frameIndex: i,
        row,
        col
      });
    }

    console.log(`✅ Aligned ${alignedFrames.length} frames with consistent positioning`);
    console.log(`📐 New frame size: ${alignedFrameWidth}x${alignedFrameHeight}`);

    return {
      alignedFrames,
      alignedSpriteSheetUrl
    };

  } catch (error) {
    console.error('❌ Frame alignment failed:', error);
    // Return original frames if alignment fails
    return {
      alignedFrames: frames,
      alignedSpriteSheetUrl: spriteSheetUrl
    };
  }
};
