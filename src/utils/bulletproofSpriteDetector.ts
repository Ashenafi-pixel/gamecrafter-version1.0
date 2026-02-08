/**
 * BULLETPROOF SPRITE DETECTOR
 * Simple, reliable detection that just fucking works
 * No over-engineering, no complex fusion - just results
 */

export interface SimpleSprite {
  id: string;
  type: 'letter' | 'symbol';
  bounds: {x: number, y: number, width: number, height: number};
  pixels: number;
  confidence: number;
  imageData: string;
}

export class BulletproofSpriteDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * SIMPLE DETECTION - finds 4 letters + 1 symbol, no bullshit
   */
  async detectSprites(imageUrl: string): Promise<SimpleSprite[]> {
    console.log('🎯 BULLETPROOF: Starting simple, reliable detection...');
    
    try {
      // Load image
      const imageData = await this.loadImage(imageUrl);
      
      // Find all connected regions
      const regions = this.findConnectedRegions(imageData);
      
      console.log(`🔍 BULLETPROOF: Found ${regions.length} regions`);
      
      // Filter to meaningful sizes only - increased limit for pig symbol
      const meaningfulRegions = regions.filter(r => r.pixels >= 500 && r.pixels <= 300000);
      
      console.log(`✅ BULLETPROOF: ${meaningfulRegions.length} meaningful regions after filtering`);
      
      // Simple classification: biggest = symbol, rest = letters
      const classified = this.classifySimple(meaningfulRegions);
      
      // Dynamic expected count based on detected content  
      const expectedCount = Math.max(5, classified.length); // At least 5, or whatever we found
      let finalClassified = classified;
      
      const letterCount = classified.filter(s => s.type === 'letter').length;
      const symbolCount = classified.filter(s => s.type === 'symbol').length;
      
      console.log(`🔍 BULLETPROOF: Found ${letterCount} letters, ${symbolCount} symbols (total: ${classified.length})`);
      
      // Only split if we're missing sprites AND don't have a proper symbol
      if (classified.length < expectedCount && symbolCount === 0) {
        console.log(`🔧 BULLETPROOF: Missing sprites and no symbol found. Trying to split merged regions...`);
        finalClassified = this.splitMergedRegions(classified, imageData);
      } else if (classified.length >= expectedCount) {
        console.log(`✅ BULLETPROOF: Good sprite count detected, skipping region splitting`);
      }
      
      // Convert to sprites with extracted images
      const sprites = await this.createSprites(finalClassified, imageData, imageUrl);
      
      console.log(`🎯 BULLETPROOF: Detection complete - ${sprites.length} sprites found`);
      console.log('   Types:', sprites.map(s => `${s.type}(${s.pixels}px)`).join(', '));
      
      return sprites;
      
    } catch (error) {
      console.error('❌ BULLETPROOF: Detection failed:', error);
      return [];
    }
  }

  private async loadImage(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        
        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  private findConnectedRegions(imageData: ImageData): Array<{
    id: number;
    bounds: {x: number, y: number, width: number, height: number};
    pixels: number;
    centroid: {x: number, y: number};
  }> {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const visited = new Uint8Array(width * height);
    const regions: Array<{
      id: number;
      bounds: {x: number, y: number, width: number, height: number};
      pixels: number;
      centroid: {x: number, y: number};
    }> = [];

    let regionId = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        const alpha = data[pixelIndex + 3];
        
        // Only process opaque pixels that haven't been visited - LOWER threshold for pig gradients
        if (alpha > 30 && visited[index] === 0) {
          const regionPixels = this.floodFill(imageData, x, y, visited);
          
          if (regionPixels.length >= 500) { // Minimum meaningful size
            // Calculate bounding box
            let minX = regionPixels[0].x, maxX = regionPixels[0].x;
            let minY = regionPixels[0].y, maxY = regionPixels[0].y;
            let totalX = 0, totalY = 0;
            
            for (const pixel of regionPixels) {
              minX = Math.min(minX, pixel.x);
              maxX = Math.max(maxX, pixel.x);
              minY = Math.min(minY, pixel.y);
              maxY = Math.max(maxY, pixel.y);
              totalX += pixel.x;
              totalY += pixel.y;
            }
            
            regions.push({
              id: regionId++,
              bounds: {
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
              },
              pixels: regionPixels.length,
              centroid: {
                x: totalX / regionPixels.length,
                y: totalY / regionPixels.length
              }
            });
          }
        }
      }
    }

    return regions;
  }

  private floodFill(imageData: ImageData, startX: number, startY: number, visited: Uint8Array): Array<{x: number, y: number}> {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const pixels: Array<{x: number, y: number}> = [];
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];

    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited[index] === 1) {
        continue;
      }

      const pixelIndex = index * 4;
      const alpha = data[pixelIndex + 3];
      
      if (alpha <= 30) { // Skip transparent/semi-transparent - LOWER for gradients
        continue;
      }

      visited[index] = 1;
      pixels.push({x, y});

      // Add 4-connected neighbors
      stack.push(
        {x: x + 1, y},
        {x: x - 1, y},
        {x, y: y + 1},
        {x, y: y - 1}
      );
    }

    return pixels;
  }

  private classifySimple(regions: Array<{
    id: number;
    bounds: {x: number, y: number, width: number, height: number};
    pixels: number;
    centroid: {x: number, y: number};
  }>): Array<{
    id: number;
    type: 'letter' | 'symbol';
    bounds: {x: number, y: number, width: number, height: number};
    pixels: number;
    confidence: number;
  }> {
    // Sort by size (largest first)
    const sorted = [...regions].sort((a, b) => b.pixels - a.pixels);
    
    console.log(`🔍 BULLETPROOF: Classifying ${sorted.length} regions by size:`);
    sorted.forEach((r, i) => console.log(`  ${i+1}. Region ${r.id}: ${r.pixels} pixels`));
    
    const classified = sorted.map((region, index) => {
      // FIXED CLASSIFICATION - much clearer thresholds based on actual image analysis
      let type: 'letter' | 'symbol';
      
      // The pig symbol should be much larger than letters (55k+ pixels)
      // Letters (W,I,L,D) should be 10k-50k pixels
      if (region.pixels > 100000) {
        // Only very large regions (pig symbol with gradients)
        type = 'symbol';
        console.log(`🐷 BULLETPROOF: Region ${region.id} (${region.pixels} pixels) → SYMBOL (pig - much larger than letters)`);
      } else if (region.pixels >= 10000) {
        // Medium regions (individual letters W, I, L, D)
        type = 'letter';
        console.log(`🔤 BULLETPROOF: Region ${region.id} (${region.pixels} pixels) → LETTER (individual letter)`);
      } else {
        // Small regions (likely fragments or shadows - ignore)
        type = 'letter'; // Keep as letter but with low confidence
        console.log(`🔸 BULLETPROOF: Region ${region.id} (${region.pixels} pixels) → LETTER (small fragment)`);
      }
      
      // Higher confidence for appropriately sized regions
      let confidence: number;
      if (type === 'symbol' && region.pixels > 100000) {
        confidence = 1.0; // High confidence for pig symbol
      } else if (type === 'letter' && region.pixels >= 10000 && region.pixels <= 100000) {
        confidence = 1.0; // High confidence for properly sized letters
      } else {
        confidence = 0.5; // Lower confidence for edge cases
      }
      
      return {
        id: region.id,
        type,
        bounds: region.bounds,
        pixels: region.pixels,
        confidence
      };
    });

    // Dynamically keep regions based on content (detect expected count from image)
    // For symbol-text: letters + 1 symbol, for symbol-only: 1-3 symbols max
    const maxRegions = Math.min(classified.length, 10); // Cap at 10 for safety
    const topN = classified.slice(0, maxRegions);
    
    console.log(`🎯 BULLETPROOF: Top ${topN.length} regions selected:`);
    topN.forEach((r, i) => console.log(`  ${i+1}. ${r.type.toUpperCase()} - ${r.pixels} pixels (confidence: ${r.confidence})`));
    
    return topN;
  }

  private splitMergedRegions(
    classified: Array<{
      id: number;
      type: 'letter' | 'symbol';
      bounds: {x: number, y: number, width: number, height: number};
      pixels: number;
      confidence: number;
    }>,
    imageData: ImageData
  ): Array<{
    id: number;
    type: 'letter' | 'symbol';
    bounds: {x: number, y: number, width: number, height: number};
    pixels: number;
    confidence: number;
  }> {
    const result = [...classified];
    
    for (const region of classified) {
      // Try to split large regions that might contain multiple elements
      if (region.pixels > 25000) {
        console.log(`🔧 BULLETPROOF: Attempting to split large region ${region.id} (${region.pixels} pixels)`);
        
        // Extract the region and try horizontal/vertical splitting
        const splitRegions = this.trySplitRegion(region, imageData);
        
        if (splitRegions.length > 1) {
          console.log(`✅ BULLETPROOF: Split region ${region.id} into ${splitRegions.length} parts`);
          
          // Remove original region and add split regions
          const originalIndex = result.findIndex(r => r.id === region.id);
          if (originalIndex !== -1) {
            result.splice(originalIndex, 1, ...splitRegions);
          }
        }
      }
    }
    
    console.log(`🔧 BULLETPROOF: After splitting: ${result.length} total regions`);
    return result.slice(0, 8); // Limit results
  }

  private trySplitRegion(
    region: {
      id: number;
      type: 'letter' | 'symbol';
      bounds: {x: number, y: number, width: number, height: number};
      pixels: number;
      confidence: number;
    },
    imageData: ImageData
  ): Array<{
    id: number;
    type: 'letter' | 'symbol';
    bounds: {x: number, y: number, width: number, height: number};
    pixels: number;
    confidence: number;
  }> {
    const { bounds } = region;
    const splitRegions: Array<{
      id: number;
      type: 'letter' | 'symbol';
      bounds: {x: number, y: number, width: number, height: number};
      pixels: number;
      confidence: number;
    }> = [];
    
    // Try vertical splitting (for horizontally arranged letters like "WI" or "LD")
    const thirds = Math.floor(bounds.width / 3);
    
    for (let i = 0; i < 3; i++) {
      const splitBounds = {
        x: bounds.x + (i * thirds),
        y: bounds.y,
        width: thirds,
        height: bounds.height
      };
      
      // Count pixels in this split region
      const pixelCount = this.countPixelsInBounds(splitBounds, imageData);
      
      if (pixelCount > 1000) { // Only keep meaningful splits
        splitRegions.push({
          id: region.id * 10 + i, // Unique ID for split
          type: 'letter', // Assume split regions are letters
          bounds: splitBounds,
          pixels: pixelCount,
          confidence: region.confidence * 0.8 // Lower confidence for splits
        });
      }
    }
    
    // Only return split if we got multiple meaningful regions
    return splitRegions.length > 1 ? splitRegions : [region];
  }

  private countPixelsInBounds(
    bounds: {x: number, y: number, width: number, height: number},
    imageData: ImageData
  ): number {
    const data = imageData.data;
    const width = imageData.width;
    let count = 0;
    
    for (let y = bounds.y; y < bounds.y + bounds.height && y < imageData.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width && x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        if (alpha > 30) { // Count opaque pixels - LOWER for gradients
          count++;
        }
      }
    }
    
    return count;
  }

  private async createSprites(
    classified: Array<{
      id: number;
      type: 'letter' | 'symbol';
      bounds: {x: number, y: number, width: number, height: number};
      pixels: number;
      confidence: number;
    }>,
    originalImage: ImageData,
    imageUrl: string
  ): Promise<SimpleSprite[]> {
    const sprites: SimpleSprite[] = [];

    for (const region of classified) {
      // Extract sprite image data
      const spriteCanvas = document.createElement('canvas');
      const spriteCtx = spriteCanvas.getContext('2d')!;
      
      spriteCanvas.width = region.bounds.width;
      spriteCanvas.height = region.bounds.height;
      
      // Copy the region from original image
      const regionImageData = this.ctx.getImageData(
        region.bounds.x,
        region.bounds.y,
        region.bounds.width,
        region.bounds.height
      );
      
      spriteCtx.putImageData(regionImageData, 0, 0);
      const spriteDataUrl = spriteCanvas.toDataURL('image/png');
      
      sprites.push({
        id: `bulletproof_${region.id}`,
        type: region.type,
        bounds: region.bounds,
        pixels: region.pixels,
        confidence: region.confidence,
        imageData: spriteDataUrl
      });
    }

    return sprites;
  }
}

// Export singleton
export const bulletproofDetector = new BulletproofSpriteDetector();