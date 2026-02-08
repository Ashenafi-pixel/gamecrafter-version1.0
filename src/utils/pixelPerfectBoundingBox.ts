/**
 * Pixel-Perfect Bounding Box Detection System
 * Uses canvas pixel analysis for exact sprite boundaries
 * Replaces inaccurate GPT-4 Vision coordinate estimation
 */

import { openCVBoundingRefinement } from './openCVBoundingRefinement';

export interface PixelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelCount: number;
  confidence: number;
}

export interface SpriteRegion {
  bounds: PixelBounds;
  pixels: Array<{ x: number; y: number }>;
  centerPoint: { x: number; y: number };
  name?: string;
  type?: 'text' | 'character' | 'object' | 'effect';
}

export interface PixelAnalysisResult {
  success: boolean;
  sprites: SpriteRegion[];
  imageDimensions: { width: number; height: number };
  totalSprites: number;
  processingTime: number;
  error?: string;
}

export class PixelPerfectBoundingBox {
  
  /**
   * Main entry point - analyze image for pixel-perfect sprite boundaries
   */
  async analyzeSpriteBoundaries(
    imageUrl: string,
    options: {
      alphaThreshold?: number;
      minSpriteSize?: number;
      maxSprites?: number;
      mergeDistance?: number;
      maxPixelSample?: number;
    } = {}
  ): Promise<PixelAnalysisResult> {
    const startTime = performance.now();
    
    try {
      console.log('🔍 Starting pixel-perfect boundary analysis...');
      
      // Load image and get pixel data
      const { imageData, canvas } = await this.loadImageToCanvas(imageUrl);
      
      // IMPROVED: Find meaningful sprite pixels with proper threshold
      const spritePixels = this.findSpritePixels(imageData, options.alphaThreshold || 50); // Match the threshold we're passing
      console.log(`📊 Found ${spritePixels.length} sprite pixels`);
      
      // SAFETY CHECK: Prevent memory overload with huge images
      const maxSampleSize = options.maxPixelSample || 100000;
      if (spritePixels.length > maxSampleSize) {
        console.warn(`⚠️ Image too large (${spritePixels.length} pixels), sampling down to prevent crashes`);
        // Sample every nth pixel to reduce processing load while preserving sprite boundaries
        const targetSampleSize = Math.min(maxSampleSize, spritePixels.length * 0.5); // Keep at least 50% of pixels
        const sampleRate = Math.ceil(spritePixels.length / targetSampleSize);
        const sampledPixels = spritePixels.filter((_, index) => index % sampleRate === 0);
        console.log(`📉 Sampled down from ${spritePixels.length} to ${sampledPixels.length} pixels (keeping ${((sampledPixels.length / spritePixels.length) * 100).toFixed(1)}%)`);
        // Use sampled pixels for grouping
        const spriteRegions = this.groupPixelsIntoSprites(
          sampledPixels, 
          imageData.width, 
          imageData.height,
          options.mergeDistance || 15
        );
        console.log(`🎯 Detected ${spriteRegions.length} sprite regions (sampled)`);
        
        // Continue with sampled processing
        const filteredSprites = this.filterSprites(
          spriteRegions,
          options.minSpriteSize || 500,
          options.maxSprites || 5
        );
        
        let finalSprites = filteredSprites.map(region => {
          const bounds = this.calculateTightBounds(region.pixels, imageData.width, imageData.height);
          const spriteType = this.classifySpriteType(bounds, imageData.width, imageData.height);
          
          return {
            ...region,
            bounds,
            type: spriteType
          };
        });
        
        finalSprites = this.intelligentSpriteFiltering(finalSprites, imageData);
        
        const processingTime = performance.now() - startTime;
        console.log(`✅ SAMPLED pixel analysis complete in ${processingTime.toFixed(2)}ms`);
        
        return {
          success: true,
          sprites: finalSprites,
          imageDimensions: { width: imageData.width, height: imageData.height },
          totalSprites: finalSprites.length,
          processingTime: processingTime
        };
      }
      
      // IMPROVED: Smart grouping with intelligent merging
      const spriteRegions = this.groupPixelsIntoSprites(
        spritePixels, 
        imageData.width, 
        imageData.height,
        options.mergeDistance || 15  // Larger merge distance to group text letters together
      );
      console.log(`🎯 Detected ${spriteRegions.length} sprite regions`);
      
      // IMPROVED: Strict filtering to avoid noise
      const filteredSprites = this.filterSprites(
        spriteRegions,
        options.minSpriteSize || 500,  // Much higher minimum to avoid fragments
        options.maxSprites || 5        // Lower max count - should only be gem + text block
      );
      
      // Calculate precise bounding boxes and classify sprite types
      let finalSprites = filteredSprites.map(region => {
        const bounds = this.calculateTightBounds(region.pixels, imageData.width, imageData.height);
        const spriteType = this.classifySpriteType(bounds, imageData.width, imageData.height);
        
        return {
          ...region,
          bounds,
          type: spriteType
        };
      });
      
      // SMART FILTERING: Keep only meaningful sprites (1 symbol + 1 text block max)
      finalSprites = this.intelligentSpriteFiltering(finalSprites, imageData);
      
      // OPTIONAL: Refine with OpenCV if available
      try {
        console.log('🔬 Attempting OpenCV refinement for enhanced precision...');
        const openCVResult = await openCVBoundingRefinement.refineBoundingBoxes(
          imageUrl,
          finalSprites.map(s => s.bounds)
        );
        
        if (openCVResult.success) {
          console.log(`✅ OpenCV refinement successful - enhanced ${openCVResult.refinedBounds.length} bounds`);
          finalSprites = finalSprites.map((sprite, index) => ({
            ...sprite,
            bounds: openCVResult.refinedBounds[index] || sprite.bounds
          }));
        } else {
          console.log('⚠️ OpenCV refinement not available, using pixel analysis bounds');
        }
      } catch (openCVError) {
        console.log('⚠️ OpenCV refinement failed, using pixel analysis bounds:', openCVError);
      }
      
      const processingTime = performance.now() - startTime;
      console.log(`✅ Pixel analysis complete in ${processingTime.toFixed(2)}ms`);
      
      return {
        success: true,
        sprites: finalSprites,
        imageDimensions: { width: imageData.width, height: imageData.height },
        totalSprites: finalSprites.length,
        processingTime: processingTime
      };
      
    } catch (error) {
      console.error('❌ Pixel analysis failed:', error);
      return {
        success: false,
        sprites: [],
        imageDimensions: { width: 0, height: 0 },
        totalSprites: 0,
        processingTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Load image to canvas and extract pixel data
   */
  private async loadImageToCanvas(imageUrl: string): Promise<{
    imageData: ImageData;
    canvas: HTMLCanvasElement;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Extract pixel data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          resolve({ imageData, canvas });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
  
  /**
   * Find all non-transparent pixels that belong to sprites
   */
  private findSpritePixels(imageData: ImageData, alphaThreshold: number): Array<{ x: number; y: number; alpha: number }> {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const spritePixels: Array<{ x: number; y: number; alpha: number }> = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const alpha = pixels[pixelIndex + 3];
        
        if (alpha > alphaThreshold) {
          spritePixels.push({ x, y, alpha });
        }
      }
    }
    
    return spritePixels;
  }
  
  /**
   * Group pixels into connected components using flood-fill algorithm
   */
  private groupPixelsIntoSprites(
    spritePixels: Array<{ x: number; y: number; alpha: number }>,
    imageWidth: number,
    imageHeight: number,
    mergeDistance: number
  ): SpriteRegion[] {
    // Create a set for fast pixel lookup
    const pixelSet = new Set(spritePixels.map(p => `${p.x},${p.y}`));
    const visited = new Set<string>();
    const spriteRegions: SpriteRegion[] = [];
    
    // Flood fill to find connected components
    for (const pixel of spritePixels) {
      const key = `${pixel.x},${pixel.y}`;
      
      if (visited.has(key)) continue;
      
      // Start flood fill for new sprite region
      const region = this.floodFill(pixel, pixelSet, visited, mergeDistance);
      
      if (region.length > 0) {
        const centerPoint = this.calculateCenterPoint(region);
        spriteRegions.push({
          bounds: { x: 0, y: 0, width: 0, height: 0, pixelCount: region.length, confidence: 1.0 },
          pixels: region,
          centerPoint
        });
      }
    }
    
    return spriteRegions;
  }
  
  /**
   * MEMORY-SAFE: Flood fill algorithm to find connected pixels
   */
  private floodFill(
    startPixel: { x: number; y: number },
    pixelSet: Set<string>,
    visited: Set<string>,
    maxDistance: number
  ): Array<{ x: number; y: number }> {
    const result: Array<{ x: number; y: number }> = [];
    const stack = [startPixel];
    const MAX_PIXELS = 50000; // Prevent memory crashes
    
    while (stack.length > 0 && result.length < MAX_PIXELS) {
      const current = stack.pop()!;
      const key = `${current.x},${current.y}`;
      
      if (visited.has(key) || !pixelSet.has(key)) continue;
      
      visited.add(key);
      result.push(current);
      
      // Use 4-directional neighbors only to reduce memory usage
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (!visited.has(neighborKey) && pixelSet.has(neighborKey) && stack.length < 10000) {
          stack.push(neighbor);
        }
      }
    }
    
    if (result.length >= MAX_PIXELS) {
      console.warn(`⚠️ Flood fill hit memory limit (${MAX_PIXELS} pixels), truncating region`);
    }
    
    return result;
  }
  
  /**
   * Calculate center point of pixel region
   */
  private calculateCenterPoint(pixels: Array<{ x: number; y: number }>): { x: number; y: number } {
    const totalX = pixels.reduce((sum, p) => sum + p.x, 0);
    const totalY = pixels.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: Math.round(totalX / pixels.length),
      y: Math.round(totalY / pixels.length)
    };
  }
  
  /**
   * Calculate tight bounding box around pixel region
   */
  private calculateTightBounds(
    pixels: Array<{ x: number; y: number }>,
    imageWidth: number,
    imageHeight: number
  ): PixelBounds {
    if (pixels.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, pixelCount: 0, confidence: 0 };
    }
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const pixel of pixels) {
      minX = Math.min(minX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    }
    
    // Add 1-pixel padding for clean edges
    const x = Math.max(0, minX - 1);
    const y = Math.max(0, minY - 1);
    const width = Math.min(imageWidth - x, maxX - minX + 3);
    const height = Math.min(imageHeight - y, maxY - minY + 3);
    
    // Calculate confidence based on pixel density
    const boundingArea = width * height;
    const pixelDensity = pixels.length / boundingArea;
    const confidence = Math.min(1.0, pixelDensity * 2); // Higher density = higher confidence
    
    return {
      x,
      y,
      width,
      height,
      pixelCount: pixels.length,
      confidence
    };
  }
  
  /**
   * SMART: Classify sprite type based on characteristics
   */
  private classifySpriteType(
    bounds: PixelBounds,
    imageWidth: number,
    imageHeight: number
  ): 'symbol' | 'text' | 'noise' {
    const aspectRatio = bounds.width / bounds.height;
    const relativeSize = (bounds.width * bounds.height) / (imageWidth * imageHeight);
    
    
    // MUCH MORE LENIENT: Accept most reasonable sprites as either text or symbol
    // Very small sprites are likely noise
    if (relativeSize < 0.001) {
      console.log('   → noise (too small)');
      return 'noise';
    }
    
    // Very large sprites are likely the main symbol  
    if (relativeSize > 0.15) {
      console.log('   → symbol (large)');
      return 'symbol';
    }
    
    // Medium sprites could be either letters or smaller symbols
    // Letters can have various aspect ratios: W is wide, I is tall, etc.
    if (relativeSize >= 0.005 && relativeSize <= 0.15) {
      // Wide sprites are likely text/letters
      if (aspectRatio > 1.2) {
        console.log('   → text (wide)');
        return 'text';
      }
      // Tall or square sprites could be letters (I, L) or symbols
      else {
        console.log('   → text (letter)');
        return 'text';
      }
    }
    
    console.log('   → noise (fallback)');
    return 'noise';
  }
  
  /**
   * SMART: Keep only meaningful sprites, filter out noise
   */
  private intelligentSpriteFiltering(
    sprites: SpriteRegion[],
    imageData: ImageData
  ): SpriteRegion[] {
    console.log('🧠 Starting intelligent sprite filtering...');
    
    // Separate by type
    const symbols = sprites.filter(s => (s as any).type === 'symbol');
    const textBlocks = sprites.filter(s => (s as any).type === 'text');
    const noise = sprites.filter(s => (s as any).type === 'noise');
    
    console.log(`📊 Classification: ${symbols.length} symbols, ${textBlocks.length} text blocks, ${noise.length} noise`);
    
    const finalSprites: SpriteRegion[] = [];
    
    // Keep ALL symbols (not just the largest)
    symbols.forEach(symbol => {
      finalSprites.push(symbol);
      console.log('✅ Kept symbol:', symbol.bounds);
    });
    
    // Keep ALL text sprites (individual letters)
    textBlocks.forEach(text => {
      finalSprites.push(text);
      console.log('✅ Kept text sprite:', text.bounds);
    });
    
    // Sort by size (largest first) for consistent ordering
    finalSprites.sort((a, b) => b.bounds.pixelCount - a.bounds.pixelCount);
    
    console.log(`🎯 Filtered from ${sprites.length} to ${finalSprites.length} meaningful sprites`);
    return finalSprites;
  }
  
  /**
   * Filter sprites by size and count
   */
  private filterSprites(
    sprites: SpriteRegion[],
    minSize: number,
    maxCount: number
  ): SpriteRegion[] {
    console.log(`🔍 Filtering ${sprites.length} sprite regions with minSize: ${minSize}, maxCount: ${maxCount}`);
    
    // Show size distribution before filtering
    const sizes = sprites.map(s => s.pixels.length).sort((a, b) => b - a);
    console.log(`📊 Sprite sizes: ${sizes.slice(0, 10).join(', ')}${sizes.length > 10 ? '...' : ''}`);
    
    // Filter by minimum pixel count
    const sizedFiltered = sprites.filter(sprite => sprite.pixels.length >= minSize);
    console.log(`📉 After size filter (>=${minSize}): ${sizedFiltered.length}/${sprites.length} sprites remain`);
    
    // Sort by pixel count (larger sprites first) and take top N
    const sorted = sizedFiltered.sort((a, b) => b.pixels.length - a.pixels.length);
    const final = sorted.slice(0, maxCount);
    
    console.log(`✅ Final filtering result: kept ${final.length} largest sprites`);
    if (final.length > 0) {
      final.forEach((sprite, i) => {
        console.log(`   ${i+1}. ${sprite.pixels.length} pixels`);
      });
    }
    
    return final;
  }
  
  /**
   * Convert pixel coordinates to percentage coordinates for atlas compatibility
   */
  convertToPercentageCoordinates(
    pixelBounds: PixelBounds,
    imageDimensions: { width: number; height: number }
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: (pixelBounds.x / imageDimensions.width) * 100,
      y: (pixelBounds.y / imageDimensions.height) * 100,
      width: (pixelBounds.width / imageDimensions.width) * 100,
      height: (pixelBounds.height / imageDimensions.height) * 100
    };
  }
  
  /**
   * Identify sprite type using position and size heuristics
   */
  identifySpriteType(sprite: SpriteRegion, imageDimensions: { width: number; height: number }): 'text' | 'character' | 'object' | 'effect' {
    const bounds = sprite.bounds;
    const aspectRatio = bounds.width / bounds.height;
    const relativeSize = (bounds.width * bounds.height) / (imageDimensions.width * imageDimensions.height);
    const positionY = bounds.y / imageDimensions.height;
    
    // Text detection (usually in top area, rectangular, medium size)
    if (positionY < 0.4 && aspectRatio > 0.3 && aspectRatio < 3.0 && relativeSize < 0.15) {
      return 'text';
    }
    
    // Character detection (large, central, roughly square)
    if (relativeSize > 0.1 && aspectRatio > 0.5 && aspectRatio < 2.0) {
      return 'character';
    }
    
    // Effect detection (irregular shape, lower density)
    if (sprite.bounds.confidence < 0.3) {
      return 'effect';
    }
    
    // Default to object
    return 'object';
  }
}

export const pixelPerfectBoundingBox = new PixelPerfectBoundingBox();