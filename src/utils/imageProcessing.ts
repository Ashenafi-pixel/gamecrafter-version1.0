// Advanced color analysis utilities
const getColorSimilarity = (color1: number[], color2: number[]): number => {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
};

const getLuminance = (r: number, g: number, b: number): number => {
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Advanced background detection
const isBackground = (r: number, g: number, b: number, a: number): boolean => {
  // Check for pure white backgrounds (very strict detection)
  const isPureWhite = r >= 252 && g >= 252 && b >= 252;
  
  // Check for near-white backgrounds (slightly more forgiving)
  const isNearWhite = (r + g + b) / 3 > 250;
  
  // Check for white/light backgrounds
  const isLight = (r + g + b) / 3 > 240;
  
  // Check for black/dark backgrounds
  const isDark = (r + g + b) / 3 < 30;
  
  // Check for transparency
  const isTransparent = a < 128;
  
  // Check for grayscale (checkerboard patterns are usually grayscale)
  const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10 && isLight;
  
  return isPureWhite || isNearWhite || isDark || isTransparent || isGray;
};

// Contour detection for symbol edges
const findContours = (imageData: ImageData): boolean[][] => {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const contours = Array(height).fill(0).map(() => Array(width).fill(false));
  
  // Sobel operators for edge detection
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // Apply Sobel operators
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const idx = ((y + i) * width + (x + j)) * 4;
          const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
          gx += luminance * sobelX[i + 1][j + 1];
          gy += luminance * sobelY[i + 1][j + 1];
        }
      }
      
      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      contours[y][x] = magnitude > 30; // Adjust threshold as needed
    }
  }
  
  return contours;
};

// Main symbol processing function
export const processSymbol = async (imageUrl: string): Promise<string> => {
  try {
    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create canvas with high-performance context
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
      alpha: true
    });
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw image
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Find symbol contours
    const contours = findContours(imageData);
    
    // Find bounding box of the symbol
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    let hasSymbol = false;

    // First pass: Find symbol boundaries
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Even more strict white background detection for precise isolation
        const isPerfectlyWhite = r >= 254 && g >= 254 && b >= 254;
        const isVeryWhite = r >= 250 && g >= 250 && b >= 250;
        
        if ((!isPerfectlyWhite && !isVeryWhite && !isBackground(r, g, b, a)) || contours[y]?.[x]) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          hasSymbol = true;
        }
      }
    }

    if (!hasSymbol) {
      throw new Error('No symbol detected in image');
    }

    // Add padding around the symbol
    const padding = Math.max(20, Math.floor(Math.min(canvas.width, canvas.height) * 0.1));
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    // Create output canvas for the isolated symbol
    const symbolWidth = maxX - minX;
    const symbolHeight = maxY - minY;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = symbolWidth;
    outputCanvas.height = symbolHeight;
    const outputCtx = outputCanvas.getContext('2d', { alpha: true });
    if (!outputCtx) throw new Error('Could not get output canvas context');

    // Clear output canvas
    outputCtx.clearRect(0, 0, symbolWidth, symbolHeight);

    // Second pass: Process and copy the symbol
    const symbolData = outputCtx.createImageData(symbolWidth, symbolHeight);
    const symbolPixels = symbolData.data;

    for (let y = 0; y < symbolHeight; y++) {
      for (let x = 0; x < symbolWidth; x++) {
        const sourceIdx = ((y + minY) * canvas.width + (x + minX)) * 4;
        const targetIdx = (y * symbolWidth + x) * 4;
        
        const r = data[sourceIdx];
        const g = data[sourceIdx + 1];
        const b = data[sourceIdx + 2];
        const a = data[sourceIdx + 3];

        // Detect white/near-white pixels to make them fully transparent
        const isWhite = r > 240 && g > 240 && b > 240;
        
        if (!isBackground(r, g, b, a) && !isWhite) {
          // Keep symbol pixels
          symbolPixels[targetIdx] = r;
          symbolPixels[targetIdx + 1] = g;
          symbolPixels[targetIdx + 2] = b;
          symbolPixels[targetIdx + 3] = a;
          
          // Enhance edges if this is a contour pixel
          if (contours[y + minY]?.[x + minX]) {
            symbolPixels[targetIdx + 3] = 255; // Full opacity for edges
          }
        } else {
          // Make background fully transparent
          symbolPixels[targetIdx + 3] = 0;
        }
      }
    }

    // Put the processed symbol on the output canvas
    outputCtx.putImageData(symbolData, 0, 0);

    // Process the output canvas to ensure full transparency
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outputCanvas.width;
    finalCanvas.height = outputCanvas.height;
    const finalCtx = finalCanvas.getContext('2d', { alpha: true });
    
    if (!finalCtx) throw new Error('Could not get final canvas context');
    
    // Clear with transparent background
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    // Apply additional processing to ensure background transparency
    const outputData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const finalData = finalCtx.createImageData(outputCanvas.width, outputCanvas.height);
    
    // Adjust alpha channel more aggressively for light colors
    for (let i = 0; i < outputData.data.length; i += 4) {
      const r = outputData.data[i];
      const g = outputData.data[i + 1];
      const b = outputData.data[i + 2];
      
      // Detect near-white pixels and make them fully transparent
      const isNearWhite = (r > 245 && g > 245 && b > 245);
      
      finalData.data[i] = r;      // Red
      finalData.data[i + 1] = g;  // Green
      finalData.data[i + 2] = b;  // Blue
      finalData.data[i + 3] = isNearWhite ? 0 : outputData.data[i + 3]; // Alpha (transparent if near white)
    }
    
    // Put the processed data on the final canvas
    finalCtx.putImageData(finalData, 0, 0);
    
    // Return as PNG with transparency
    return finalCanvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error processing symbol:', error);
    throw new Error('Failed to process symbol');
  }
};

import { slotApiClient } from './apiClient';

// Static fallback content for symbols
const FALLBACK_IMAGES = [
  '/public/themes/base-style.png',      // Wild
  '/public/themes/ancient-egypt.png',   // Scatter
  '/public/themes/cosmic-adventure.png', // High
  '/public/themes/deep-ocean.png',      // Medium
  '/public/themes/enchanted-forest.png'  // Low
];

// Get a fallback image based on the index and theme
const getFallbackImage = (index: number, theme: any): string => {
  // Use theme to randomize but consistently select the same image for the same theme/index combo
  const seed = theme.mainTheme ? theme.mainTheme.length : 0;
  const adjustedIndex = (index + seed) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[adjustedIndex];
};

// Symbol regeneration function that uses placeholder images
export const regenerateSymbol = async (theme: any, index: number): Promise<string> => {
  try {
    console.log(`Generating placeholder image for symbol ${index + 1} of theme ${theme.mainTheme}`);
    
    // Use the local fallback image based on the index and theme
    const fallbackImage = getFallbackImage(index, theme);
    
    // For demonstration/placeholder mode, we'll use a consistent set of images
    // Process the symbol to remove background - this will still work with the placeholder images
    const processedSymbol = await processSymbol(fallbackImage);
    return processedSymbol;
  } catch (error) {
    console.error('Error regenerating symbol:', error);
    // If all else fails, return a placeholder URL directly
    return `https://placehold.co/512x512/6082B6/FFFFFF/png?text=Symbol_${index + 1}`;
  }
};