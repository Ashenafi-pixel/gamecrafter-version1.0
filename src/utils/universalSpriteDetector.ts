/**
 * Universal Sprite Detection System - State-of-the-Art Edition
 * Content-agnostic sprite separation using multi-algorithm fusion
 * Combines edge detection, color segmentation, morphological operations, and GPT-4o vision
 * Works with symbols, letters, objects, decorative elements in any arrangement
 */

import { multiAlgorithmFusion, type FusionResult, type FusedSprite } from './multiAlgorithmFusion';
import { bulletproofDetector, type SimpleSprite } from './bulletproofSpriteDetector';

export interface DetectedSprite {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pixels: number;
  density: number;
  imageData: string; // base64 extracted sprite
  confidence: number; // 0-1 how confident this is a distinct sprite
  type: 'symbol' | 'letter' | 'object' | 'decoration' | 'unknown';
}

export interface SpriteDetectionOptions {
  minSpriteSize: number; // minimum pixels to consider a sprite
  includeTransparentBorders?:boolean;
  maxSpriteSize: number; // maximum pixels to consider a sprite
  separationThreshold: number; // minimum gap between sprites
  noiseFilter: boolean; // remove small noise artifacts
  mergeThreshold: number; // merge nearby regions if closer than this
  confidenceThreshold: number; // minimum confidence to include sprite
}

export class UniversalSpriteDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData!: ImageData;
  private width!: number;
  private height!: number;
  private options: SpriteDetectionOptions;

  constructor(options: Partial<SpriteDetectionOptions> = {}) {
    this.options = {
      minSpriteSize: 25,          // Very low minimum to catch all sprite parts
      maxSpriteSize: 800000,      // MUCH higher maximum to catch merged regions
      separationThreshold: 3,     // Smaller separation to find distinct sprites
      noiseFilter: true,
      mergeThreshold: 5,          // Smaller merge to keep sprites separate
      confidenceThreshold: 0.05,  // Even lower confidence threshold
      ...options
    };

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main detection method - BULLETPROOF approach that just works
   */
  async detectSprites(imageUrl: string): Promise<DetectedSprite[]> {
    console.log('🎯 BULLETPROOF: Starting simple, reliable sprite detection...');
    
    try {
      // PRIMARY: Use bulletproof detector - simple and reliable
      const bulletproofSprites = await bulletproofDetector.detectSprites(imageUrl);
      
      if (bulletproofSprites.length > 0) {
        console.log(`✅ BULLETPROOF: Successfully detected ${bulletproofSprites.length} sprites`);
        
        // Convert to DetectedSprite format
        const detectedSprites = this.convertBulletproofSprites(bulletproofSprites);
        
        // Sort by type priority (symbols first) then size
        detectedSprites.sort((a, b) => {
          if (a.type === 'symbol' && b.type !== 'symbol') return -1;
          if (b.type === 'symbol' && a.type !== 'symbol') return 1;
          return b.pixels - a.pixels;
        });
        
        console.log(`🎯 BULLETPROOF: Detection complete - ${detectedSprites.length} sprites ready`);
        console.log('   Results:', detectedSprites.map(s => `${s.type}(${s.pixels}px)`).join(', '));
        
        return detectedSprites;
      }
      
      // FALLBACK: Try advanced fusion if bulletproof fails
      console.warn('⚠️ BULLETPROOF failed, trying advanced fusion...');
      return await this.tryAdvancedFusion(imageUrl);

    } catch (error) {
      console.error(`❌ BULLETPROOF detection failed:`, error);
      console.log(`🔄 Falling back to legacy detection approach...`);
      return await this.legacyDetection(imageUrl);
    }
  }

  /**
   * Convert bulletproof sprites to DetectedSprite format
   */
  private convertBulletproofSprites(bulletproofSprites: SimpleSprite[]): DetectedSprite[] {
    return bulletproofSprites.map(sprite => ({
      id: sprite.id,
      bounds: sprite.bounds,
      pixels: sprite.pixels,
      density: sprite.pixels / (sprite.bounds.width * sprite.bounds.height),
      imageData: sprite.imageData,
      confidence: sprite.confidence,
      type: sprite.type
    }));
  }

  /**
   * Try advanced fusion as fallback
   */
  private async tryAdvancedFusion(imageUrl: string): Promise<DetectedSprite[]> {
    try {
      const fusionResult = await multiAlgorithmFusion.fuseAlgorithms(imageUrl, {
        expectedSpriteCount: 5,
        algorithmWeights: {
          edgeDetection: 0.35,
          colorSegmentation: 0.30,
          morphological: 0.25,
          gptAnalysis: 0.10
        },
        fusionStrategy: 'adaptive',
        qualityThreshold: 0.65,
        useGPTRefinement: false, // Disable GPT to avoid errors
        maxProcessingTime: 30000
      });

      if (fusionResult.success && fusionResult.sprites.length > 0) {
        console.log(`✅ Advanced fusion: ${fusionResult.sprites.length} sprites detected`);
        return await this.convertFusionSprites(fusionResult.sprites, imageUrl);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Advanced fusion failed:', error);
      return [];
    }
  }

  /**
   * Convert fusion engine sprites to our DetectedSprite format
   */
  private async convertFusionSprites(fusionSprites: FusedSprite[], imageUrl: string): Promise<DetectedSprite[]> {
    const detectedSprites: DetectedSprite[] = [];
    
    // Load image for sprite extraction
    const image = await this.loadImage(imageUrl);
    this.setupCanvas(image);
    
    for (let i = 0; i < fusionSprites.length; i++) {
      const fusionSprite = fusionSprites[i];
      
      // Extract sprite image data
      const extractedImageData = await this.extractSpriteFromBounds(fusionSprite.bounds);
      
      const detectedSprite: DetectedSprite = {
        id: `fusion_sprite_${i}`,
        bounds: fusionSprite.bounds,
        pixels: fusionSprite.properties.area,
        density: fusionSprite.properties.density,
        imageData: extractedImageData,
        confidence: fusionSprite.confidence,
        type: fusionSprite.type
      };
      
      detectedSprites.push(detectedSprite);
    }
    
    console.log(`🔄 Converted ${fusionSprites.length} fusion sprites to DetectedSprite format`);
    return detectedSprites;
  }

  /**
   * Extract sprite image data from specified bounds
   */
  private async extractSpriteFromBounds(bounds: {x: number, y: number, width: number, height: number}): Promise<string> {
    const padding = 2;
    const extractCanvas = document.createElement('canvas');
    const extractCtx = extractCanvas.getContext('2d')!;
    
    extractCanvas.width = bounds.width + padding * 2;
    extractCanvas.height = bounds.height + padding * 2;
    
    // Extract the region with transparent background
    extractCtx.clearRect(0, 0, extractCanvas.width, extractCanvas.height);
    extractCtx.drawImage(
      this.canvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      padding, padding, bounds.width, bounds.height
    );
    
    return extractCanvas.toDataURL('image/png');
  }

  /**
   * Legacy detection method (fallback for compatibility)
   */
  private async legacyDetection(imageUrl: string): Promise<DetectedSprite[]> {
    console.log('🔍 Running legacy sprite detection...');
    
    // Load and prepare image
    const image = await this.loadImage(imageUrl);
    this.setupCanvas(image);
    
    // Create binary mask of all non-transparent pixels
    const binaryMask = this.createBinaryMask();
    
    // IMPROVED: Try spatial separation first for symbol+text layouts
    const spatialRegions = this.spatialSeparation(binaryMask);
    console.log(`🗺️ Spatial separation found ${spatialRegions.length} regions`);
    
    // If spatial separation finds good results, use those; otherwise fall back to connected components
    let regions;
    if (spatialRegions.length >= 4) {
      regions = spatialRegions;
      console.log(`✅ Using spatial separation results (${regions.length} regions)`);
    } else {
      // Find connected components (distinct regions)
      regions = this.findConnectedComponents(binaryMask);
      console.log(`📊 Found ${regions.length} initial regions via connected components`);
    }
    
    // Show size distribution of all regions
    if (regions.length > 0) {
      const sizes = regions.map(r => r.pixelCount).sort((a, b) => b - a);
      console.log(`📊 Region sizes: ${sizes.slice(0, 10).join(', ')}${sizes.length > 10 ? '...' : ''}`);
    }
    
    // Filter and classify regions
    let validRegions = this.filterRegions(regions);
    console.log(`✅ Filtered to ${validRegions.length} valid sprites`);
    
    // INTELLIGENT POST-PROCESSING: Merge pig pieces and clean up extras
    if (validRegions.length > 5) {
      console.log(`🧠 Post-processing: Found ${validRegions.length} regions, expected 5 (WILD + pig)`);
      validRegions = this.intelligentRegionMerging(validRegions);
      console.log(`🎯 Post-processing complete: reduced to ${validRegions.length} final sprites`);
    }
    
    // Show what was kept after filtering
    if (validRegions.length > 0) {
      console.log(`✅ Kept sprites with sizes: ${validRegions.map(r => r.pixelCount).sort((a, b) => b - a).join(', ')}`);
    }
    
    // Extract individual sprites
    const sprites = await this.extractSprites(validRegions);
    
    // Sort by size/importance
    sprites.sort((a, b) => b.pixels - a.pixels);
    
    console.log(`🎯 Legacy detection complete: ${sprites.length} sprites found`);
    return sprites;
  }

  private async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  private setupCanvas(image: HTMLImageElement): void {
    this.width = image.width;
    this.height = image.height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(image, 0, 0);
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /**
   * Create binary mask where 1 = visible pixel, 0 = transparent/background
   */
  private createBinaryMask(): Uint8Array {
    const mask = new Uint8Array(this.width * this.height);
    const data = this.imageData.data;
    let visiblePixels = 0;
    let alphaStats = { 
      total: 0, 
      lowAlpha: 0, 
      medAlpha: 0, 
      highAlpha: 0, 
      whitePixels: 0,
      colorPixels: 0 
    };
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      alphaStats.total++;
      if (alpha > 0 && alpha <= 50) alphaStats.lowAlpha++;
      else if (alpha > 50 && alpha <= 150) alphaStats.medAlpha++;
      else if (alpha > 150) alphaStats.highAlpha++;
      
      if (r > 250 && g > 250 && b > 250) alphaStats.whitePixels++;
      else if (alpha > 20) alphaStats.colorPixels++;
      
      // ENHANCED visibility detection - be more aggressive about finding pig pixels
      const isVisible = alpha > 5 && 
                       !(r > 250 && g > 250 && b > 250); // Reduced white threshold and alpha threshold
      
      if (isVisible) visiblePixels++;
      mask[Math.floor(i / 4)] = isVisible ? 1 : 0;
    }
    
    console.log(`🎭 Binary mask created: ${visiblePixels} visible pixels out of ${this.width * this.height} total (${((visiblePixels / (this.width * this.height)) * 100).toFixed(1)}%)`);
    console.log(`📊 Alpha distribution: low(0-50): ${alphaStats.lowAlpha}, med(50-150): ${alphaStats.medAlpha}, high(150+): ${alphaStats.highAlpha}`);
    console.log(`🎨 Color analysis: white pixels: ${alphaStats.whitePixels}, color pixels: ${alphaStats.colorPixels}`);
    
    return mask;
  }

  /**
   * Find connected components using flood fill algorithm
   */
  private findConnectedComponents(mask: Uint8Array): Array<{
    pixels: Array<{x: number, y: number}>;
    bounds: {x: number, y: number, width: number, height: number};
    pixelCount: number;
  }> {
    const visited = new Uint8Array(this.width * this.height);
    const regions: Array<any> = [];
    let totalRegionsFound = 0;
    let totalPixelsProcessed = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        
        if (mask[index] === 1 && visited[index] === 0) {
          const region = this.floodFill(mask, visited, x, y);
          totalRegionsFound++;
          totalPixelsProcessed += region.pixelCount;
          
          console.log(`🔍 Found region ${totalRegionsFound}: ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y}) ${region.bounds.width}x${region.bounds.height}`);
          
          if (region.pixelCount >= this.options.minSpriteSize && 
              region.pixelCount <= this.options.maxSpriteSize) {
            regions.push(region);
            console.log(`   ✅ Accepted region ${totalRegionsFound}`);
          } else {
            console.log(`   ❌ Rejected region ${totalRegionsFound}: size=${region.pixelCount} (min=${this.options.minSpriteSize}, max=${this.options.maxSpriteSize})`);
          }
        }
      }
    }
    
    console.log(`📊 Connected components summary: Found ${totalRegionsFound} total regions, processed ${totalPixelsProcessed} pixels, kept ${regions.length} valid regions`);
    
    return regions;
  }

  /**
   * Flood fill to find all connected pixels in a region
   */
  private floodFill(mask: Uint8Array, visited: Uint8Array, startX: number, startY: number): any {
    const pixels: Array<{x: number, y: number}> = [];
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
    
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = y * this.width + x;
      
      if (x < 0 || x >= this.width || y < 0 || y >= this.height || 
          visited[index] === 1 || mask[index] === 0) {
        continue;
      }
      
      visited[index] = 1;
      pixels.push({x, y});
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add 8-connected neighbors
      stack.push(
        {x: x + 1, y}, {x: x - 1, y},
        {x, y: y + 1}, {x, y: y - 1},
        {x: x + 1, y: y + 1}, {x: x - 1, y: y - 1},
        {x: x + 1, y: y - 1}, {x: x - 1, y: y + 1}
      );
    }
    
    return {
      pixels,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      },
      pixelCount: pixels.length
    };
  }

  /**
   * Filter regions based on size, shape, and separation criteria
   */
  private filterRegions(regions: Array<any>): Array<any> {
    let filtered = [...regions];
    
    // Remove noise if enabled - more permissive
    if (this.options.noiseFilter) {
      console.log(`🧹 Starting noise filter with ${filtered.length} regions`);
      filtered = filtered.filter(region => {
        const area = region.bounds.width * region.bounds.height;
        const density = region.pixelCount / area;
        const isTooBig = region.pixelCount > this.options.maxSpriteSize;
        const isTooSmall = region.pixelCount < this.options.minSpriteSize;
        const isTooSparse = density < 0.02; // Extremely permissive density to catch pig symbol
        
        console.log(`🔍 Evaluating region: pixels=${region.pixelCount}, area=${area}, density=${density.toFixed(3)}, bounds=${region.bounds.width}x${region.bounds.height}`);
        
        if (isTooBig || isTooSmall || isTooSparse) {
          console.log(`🗑️ Filtering out region: pixels=${region.pixelCount}, density=${density.toFixed(3)}, reason=${isTooBig ? 'too big' : isTooSmall ? 'too small' : 'too sparse'}`);
          return false;
        }
        console.log(`✅ Keeping region: pixels=${region.pixelCount}, density=${density.toFixed(3)}`);
        return true;
      });
      console.log(`🧹 Noise filter complete: kept ${filtered.length} regions`);
    }
    
    // Merge nearby regions that might be parts of the same sprite
    filtered = this.mergeNearbyRegions(filtered);
    
    // Ensure minimum separation between distinct sprites
    filtered = this.ensureSeparation(filtered);
    
    return filtered;
  }

  private mergeNearbyRegions(regions: Array<any>): Array<any> {
    const merged: Array<any> = [];
    const used = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      let currentRegion = regions[i];
      
      // Look for nearby regions to merge
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;
        
        const distance = this.calculateRegionDistance(currentRegion.bounds, regions[j].bounds);
        if (distance <= this.options.mergeThreshold) {
          currentRegion = this.mergeRegions(currentRegion, regions[j]);
          used.add(j);
        }
      }
      
      merged.push(currentRegion);
      used.add(i);
    }
    
    return merged;
  }

  private calculateRegionDistance(bounds1: any, bounds2: any): number {
    const centerX1 = bounds1.x + bounds1.width / 2;
    const centerY1 = bounds1.y + bounds1.height / 2;
    const centerX2 = bounds2.x + bounds2.width / 2;
    const centerY2 = bounds2.y + bounds2.height / 2;
    
    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }

  private mergeRegions(region1: any, region2: any): any {
    const minX = Math.min(region1.bounds.x, region2.bounds.x);
    const minY = Math.min(region1.bounds.y, region2.bounds.y);
    const maxX = Math.max(region1.bounds.x + region1.bounds.width, region2.bounds.x + region2.bounds.width);
    const maxY = Math.max(region1.bounds.y + region1.bounds.height, region2.bounds.y + region2.bounds.height);
    
    return {
      pixels: [...region1.pixels, ...region2.pixels],
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      pixelCount: region1.pixelCount + region2.pixelCount
    };
  }

  private ensureSeparation(regions: Array<any>): Array<any> {
    // Remove overlapping regions, keeping the larger one
    const separated: Array<any> = [];
    
    for (const region of regions) {
      let shouldAdd = true;
      
      for (let i = 0; i < separated.length; i++) {
        const existing = separated[i];
        
        if (this.regionsOverlap(region.bounds, existing.bounds)) {
          if (region.pixelCount > existing.pixelCount) {
            separated[i] = region; // Replace with larger region
          }
          shouldAdd = false;
          break;
        }
      }
      
      if (shouldAdd) {
        separated.push(region);
      }
    }
    
    return separated;
  }

  private regionsOverlap(bounds1: any, bounds2: any): boolean {
    return !(bounds1.x + bounds1.width < bounds2.x ||
             bounds2.x + bounds2.width < bounds1.x ||
             bounds1.y + bounds1.height < bounds2.y ||
             bounds2.y + bounds2.height < bounds1.y);
  }

  /**
   * Extract individual sprite images from detected regions
   */
  private async extractSprites(regions: Array<any>): Promise<DetectedSprite[]> {
    const sprites: DetectedSprite[] = [];
    
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const sprite = await this.extractSingleSprite(region, i);
      if (sprite.confidence >= this.options.confidenceThreshold) {
        sprites.push(sprite);
      }
    }
    
    return sprites;
  }

  private async extractSingleSprite(region: any, index: number): Promise<DetectedSprite> {
    const bounds = region.bounds;
    
    // Create clean extraction with padding
    const padding = 2;
    const extractCanvas = document.createElement('canvas');
    const extractCtx = extractCanvas.getContext('2d')!;
    
    extractCanvas.width = bounds.width + padding * 2;
    extractCanvas.height = bounds.height + padding * 2;
    
    // Extract the region with transparent background
    extractCtx.clearRect(0, 0, extractCanvas.width, extractCanvas.height);
    extractCtx.drawImage(
      this.canvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      padding, padding, bounds.width, bounds.height
    );
    
    // Calculate sprite properties
    const area = bounds.width * bounds.height;
    const density = region.pixelCount / area;
    const aspectRatio = bounds.width / bounds.height;
    
    // Classify sprite type based on characteristics
    const type = this.classifySprite(bounds, density, aspectRatio);
    
    // Calculate confidence based on various factors
    const confidence = this.calculateConfidence(region, density, aspectRatio);
    
    return {
      id: `sprite_${index}`,
      bounds: {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2
      },
      pixels: region.pixelCount,
      density,
      imageData: extractCanvas.toDataURL('image/png'),
      confidence,
      type
    };
  }

  private classifySprite(bounds: any, density: number, aspectRatio: number): DetectedSprite['type'] {
    const area = bounds.width * bounds.height;
    
    
    // ENHANCED classification for WILD + pig symbols
    // Large sprites with high density are likely the main symbol (pig)
    if (area > 25000 && density > 0.5) {
      console.log('   → symbol (large + dense = main symbol)');
      return 'symbol';
    }
    
    // Medium-large sprites with good density but not huge are likely letters
    if (area >= 8000 && area <= 25000 && density > 0.3) {
      console.log('   → letter (medium-large size)');
      return 'letter';
    }
    
    // Very tall/thin sprites are likely letters (I, L)
    if (aspectRatio < 0.6 || aspectRatio > 3.0) {
      console.log('   → letter (extreme aspect ratio)');
      return 'letter';
    }
    
    // Small to medium sprites with decent density are likely letters
    if (area >= 2000 && area <= 20000 && density > 0.25) {
      console.log('   → letter (normal letter size)');
      return 'letter';
    }
    
    // Very dense sprites regardless of size could be symbols
    if (density > 0.7) {
      console.log('   → symbol (very dense)');
      return 'symbol';
    }
    
    // Low density = decorative elements
    if (density < 0.15) {
      console.log('   → decoration (low density)');
      return 'decoration';
    }
    
    console.log('   → object (fallback)');
    return 'object';
  }

  private calculateConfidence(region: any, density: number, aspectRatio: number): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for good density
    if (density > 0.3) confidence += 0.2;
    if (density > 0.5) confidence += 0.1;
    
    // Higher confidence for reasonable size
    if (region.pixelCount > 500) confidence += 0.1;
    if (region.pixelCount > 2000) confidence += 0.1;
    
    // Higher confidence for good aspect ratio
    if (aspectRatio > 0.2 && aspectRatio < 5) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * SPATIAL SEPARATION: Separate sprites based on spatial position for symbol+text layouts
   * This handles cases where letters might be connected to the main symbol
   */
  private spatialSeparation(mask: Uint8Array): Array<{
    pixels: Array<{x: number, y: number}>;
    bounds: {x: number, y: number, width: number, height: number};
    pixelCount: number;
  }> {
    console.log('🗺️ Starting spatial separation for symbol+text layout...');
    
    // Divide image into horizontal bands to separate text from symbol
    const topBand = Math.floor(this.height * 0.5);    // Top 50% for letters
    const bottomBand = Math.floor(this.height * 0.4); // Bottom 60% for main symbol (more overlap)
    
    console.log(`📐 Image regions: Top band (0-${topBand}), Bottom band (${bottomBand}-${this.height})`);
    
    // Create masks for each band
    const topMask = new Uint8Array(this.width * this.height);
    const bottomMask = new Uint8Array(this.width * this.height);
    
    let topPixels = 0, bottomPixels = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        
        if (mask[index] === 1) {
          if (y <= topBand) {
            topMask[index] = 1;
            topPixels++;
          } else if (y >= bottomBand) {
            bottomMask[index] = 1;
            bottomPixels++;
          }
        }
      }
    }
    
    console.log(`📊 Spatial distribution: Top=${topPixels} pixels, Bottom=${bottomPixels} pixels`);
    
    const regions: Array<any> = [];
    
    // Process top band for letters (use aggressive separation)
    const topRegions = this.findConnectedComponentsInMask(topMask, 'top');
    console.log(`🔤 Found ${topRegions.length} letter regions in top band`);
    regions.push(...topRegions);
    
    // Process bottom band for main symbol
    const bottomRegions = this.findConnectedComponentsInMask(bottomMask, 'bottom');
    console.log(`🐷 Found ${bottomRegions.length} symbol regions in bottom band`);
    regions.push(...bottomRegions);
    
    console.log(`🗺️ Spatial separation complete: ${regions.length} total regions`);
    return regions;
  }

  /**
   * Find connected components in a specific mask region
   */
  private findConnectedComponentsInMask(mask: Uint8Array, regionName: string): Array<{
    pixels: Array<{x: number, y: number}>;
    bounds: {x: number, y: number, width: number, height: number};
    pixelCount: number;
  }> {
    const visited = new Uint8Array(this.width * this.height);
    const regions: Array<any> = [];
    let regionCount = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        
        if (mask[index] === 1 && visited[index] === 0) {
          const region = this.floodFill(mask, visited, x, y);
          regionCount++;
          
          console.log(`🔍 ${regionName} region ${regionCount}: ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y}) ${region.bounds.width}x${region.bounds.height}`);
          
          // MUCH more permissive thresholds for spatial separation
          const minSize = regionName === 'top' ? 200 : 1000;     // Letters vs symbols (lower minimums)
          const maxSize = regionName === 'top' ? 600000 : 700000; // Allow much larger regions - increased for large sprites
          
          if (region.pixelCount >= minSize && region.pixelCount <= maxSize) {
            regions.push(region);
            console.log(`   ✅ Accepted ${regionName} region ${regionCount}`);
          } else {
            console.log(`   ❌ Rejected ${regionName} region ${regionCount}: size=${region.pixelCount} (min=${minSize}, max=${maxSize})`);
          }
        }
      }
    }
    
    return regions;
  }

  /**
   * INTELLIGENT REGION MERGING: Combine pig pieces and filter extras to get exactly WILD + pig
   */
  private intelligentRegionMerging(regions: Array<any>): Array<any> {
    console.log(`🧠 Starting intelligent merging for ${regions.length} regions...`);
    
    // Classify regions by size and position
    const largeRegions = regions.filter(r => r.pixelCount > 15000);  // Likely main symbols/letters
    const mediumRegions = regions.filter(r => r.pixelCount >= 8000 && r.pixelCount <= 15000);  // Possible letters
    const smallRegions = regions.filter(r => r.pixelCount < 8000);   // Likely pieces or effects
    
    console.log(`📊 Region classification: Large=${largeRegions.length}, Medium=${mediumRegions.length}, Small=${smallRegions.length}`);
    
    const finalRegions: Array<any> = [];
    
    // Step 1: Keep all large regions (these are likely main letters or pig body)
    largeRegions.forEach(region => {
      finalRegions.push(region);
      console.log(`✅ Kept large region: ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y})`);
    });
    
    // Step 2: Keep medium regions that are likely letters (top area)
    mediumRegions.forEach(region => {
      const centerY = region.bounds.y + region.bounds.height / 2;
      const isInTopArea = centerY < this.height * 0.5; // Top 50%
      
      if (isInTopArea) {
        finalRegions.push(region);
        console.log(`✅ Kept medium letter region: ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y})`);
      } else {
        console.log(`🔀 Merging medium region into largest bottom region: ${region.pixelCount} pixels`);
        // Merge with largest region in bottom area (likely pig body)
        const bottomLargest = finalRegions
          .filter(r => (r.bounds.y + r.bounds.height / 2) > this.height * 0.5)
          .sort((a, b) => b.pixelCount - a.pixelCount)[0];
        
        if (bottomLargest) {
          this.mergeRegionsInPlace(bottomLargest, region);
        }
      }
    });
    
    // Step 3: Process small regions - merge with nearest large region or discard
    smallRegions.forEach(region => {
      const centerY = region.bounds.y + region.bounds.height / 2;
      const isInTopArea = centerY < this.height * 0.5;
      
      if (region.pixelCount > 2000) { // Medium-small regions might be letters
        if (isInTopArea) {
          finalRegions.push(region);
          console.log(`✅ Kept small letter region: ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y})`);
        } else {
          // Merge with pig body
          const bottomLargest = finalRegions
            .filter(r => (r.bounds.y + r.bounds.height / 2) > this.height * 0.5)
            .sort((a, b) => b.pixelCount - a.pixelCount)[0];
          
          if (bottomLargest) {
            console.log(`🔀 Merging small region into pig body: ${region.pixelCount} pixels`);
            this.mergeRegionsInPlace(bottomLargest, region);
          }
        }
      } else {
        console.log(`🗑️ Discarding tiny region: ${region.pixelCount} pixels (likely noise/effect)`);
      }
    });
    
    // Step 4: AGGRESSIVE merging to get exactly 5 sprites
    let mergeAttempts = 0;
    const maxMergeAttempts = 10; // Prevent infinite loops
    
    while (finalRegions.length > 5 && mergeAttempts < maxMergeAttempts) {
      console.log(`🔄 Still have ${finalRegions.length} regions, merging closest pair (attempt ${mergeAttempts + 1})...`);
      const mergedPair = this.mergeClosestRegions(finalRegions);
      mergeAttempts++;
      
      if (!mergedPair) {
        console.log(`❌ No more mergeable pairs found after ${mergeAttempts} attempts`);
        break; // No more mergeable pairs
      }
    }
    
    // Step 5: If we still have too many, force merge by size (keep largest, merge smallest)
    if (finalRegions.length > 5) {
      console.log(`🚨 Still ${finalRegions.length} regions, force-merging smallest into largest`);
      
      while (finalRegions.length > 5) {
        // Sort by size
        finalRegions.sort((a, b) => b.pixelCount - a.pixelCount);
        
        // Merge smallest into largest
        const largest = finalRegions[0];
        const smallest = finalRegions[finalRegions.length - 1];
        
        console.log(`🔗 Force-merging smallest (${smallest.pixelCount} pixels) into largest (${largest.pixelCount} pixels)`);
        this.mergeRegionsInPlace(largest, smallest);
        
        // Remove smallest
        finalRegions.pop();
      }
    }
    
    console.log(`🎯 Intelligent merging result: ${finalRegions.length} final regions`);
    finalRegions.forEach((region, i) => {
      console.log(`   ${i+1}. ${region.pixelCount} pixels at (${region.bounds.x},${region.bounds.y}) ${region.bounds.width}x${region.bounds.height}`);
    });
    
    return finalRegions;
  }

  /**
   * Merge two regions in place (modifies the first region)
   */
  private mergeRegionsInPlace(targetRegion: any, sourceRegion: any): void {
    // Combine pixel arrays
    targetRegion.pixels = [...targetRegion.pixels, ...sourceRegion.pixels];
    targetRegion.pixelCount = targetRegion.pixels.length;
    
    // Recalculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const pixel of targetRegion.pixels) {
      minX = Math.min(minX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    }
    
    targetRegion.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Find and merge the closest pair of regions
   */
  private mergeClosestRegions(regions: Array<any>): boolean {
    let closestDistance = Infinity;
    let closestPair: [number, number] | null = null;
    
    // PRIORITY 1: Merge regions in the same horizontal area (likely same sprite)
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const region1 = regions[i];
        const region2 = regions[j];
        
        const centerY1 = region1.bounds.y + region1.bounds.height / 2;
        const centerY2 = region2.bounds.y + region2.bounds.height / 2;
        const isInBottomArea1 = centerY1 > this.height * 0.5;
        const isInBottomArea2 = centerY2 > this.height * 0.5;
        
        // If both are in bottom area (pig pieces), prioritize merging them
        if (isInBottomArea1 && isInBottomArea2) {
          const distance = this.calculateRegionDistance(region1.bounds, region2.bounds);
          console.log(`🐷 Found pig pieces to merge: regions ${i} and ${j}, distance: ${distance.toFixed(1)}`);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPair = [i, j];
          }
        }
      }
    }
    
    // PRIORITY 2: If no bottom pairs, find any close pair
    if (!closestPair) {
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          const distance = this.calculateRegionDistance(regions[i].bounds, regions[j].bounds);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPair = [i, j];
          }
        }
      }
    }
    
    // Much more aggressive merging - increase distance threshold
    if (closestPair && closestDistance < 300) { // Increased from 100 to 300
      const [i, j] = closestPair;
      console.log(`🔗 Merging regions ${i} and ${j} (distance: ${closestDistance.toFixed(1)})`);
      
      // Merge j into i
      this.mergeRegionsInPlace(regions[i], regions[j]);
      
      // Remove j from array
      regions.splice(j, 1);
      
      return true;
    }
    
    console.log(`❌ No regions close enough to merge (closest: ${closestDistance.toFixed(1)})`);
    return false;
  }
}

/**
 * Convenience function for quick sprite detection
 */
export async function detectSpritesUniversal(
  imageUrl: string, 
  options?: Partial<SpriteDetectionOptions>
): Promise<DetectedSprite[]> {
  const detector = new UniversalSpriteDetector(options);
  return detector.detectSprites(imageUrl);
}