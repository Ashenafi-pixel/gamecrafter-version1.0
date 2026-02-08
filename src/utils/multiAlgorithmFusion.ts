/**
 * Multi-Algorithm Fusion Engine
 * State-of-the-art sprite detection using ensemble of computer vision algorithms
 * Combines edge detection, color segmentation, morphological operations, and GPT-4o vision
 */

import { advancedEdgeDetection, type EdgeDetectionResult } from './advancedEdgeDetection';
import { colorSegmentation, type ColorSegmentationResult } from './colorSegmentation';
import { morphologicalOperations, type MorphologicalResult } from './morphologicalOperations';
import { enhancedOpenaiClient } from './enhancedOpenaiClient';

export interface FusionResult {
  success: boolean;
  sprites: FusedSprite[];
  confidenceScore: number;
  processingTime: number;
  algorithmResults: {
    edgeDetection: EdgeDetectionResult;
    colorSegmentation: ColorSegmentationResult;
    morphological: MorphologicalResult;
    gptAnalysis?: any;
  };
  fusionStrategy: string;
  qualityMetrics: QualityMetrics;
}

export interface FusedSprite {
  id: string;
  bounds: {x: number, y: number, width: number, height: number};
  type: 'letter' | 'symbol' | 'object' | 'decoration';
  confidence: number;
  sourceAlgorithms: string[];
  fusionMethod: string;
  imageData: string; // base64 extracted sprite
  properties: {
    area: number;
    aspectRatio: number;
    density: number;
    edgeStrength: number;
    colorUniformity: number;
  };
}

export interface QualityMetrics {
  algorithmAgreement: number;
  spatialConsistency: number;
  sizeDistribution: number;
  expectedCount: number;
  overallQuality: number;
}

export interface FusionOptions {
  expectedSpriteCount: number;
  algorithmWeights: {
    edgeDetection: number;
    colorSegmentation: number;
    morphological: number;
    gptAnalysis: number;
  };
  fusionStrategy: 'voting' | 'weighted' | 'hierarchical' | 'adaptive';
  qualityThreshold: number;
  useGPTRefinement: boolean;
  maxProcessingTime: number;
}

export class MultiAlgorithmFusion {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main fusion pipeline - combines multiple algorithms for optimal sprite detection
   */
  async fuseAlgorithms(
    imageUrl: string,
    options: Partial<FusionOptions> = {}
  ): Promise<FusionResult> {
    const startTime = performance.now();
    
    console.log('🚀 Starting multi-algorithm fusion pipeline...');
    
    const opts: FusionOptions = {
      expectedSpriteCount: 5, // 4 letters + 1 symbol for WILD
      algorithmWeights: {
        edgeDetection: 0.3,
        colorSegmentation: 0.3,
        morphological: 0.25,
        gptAnalysis: 0.15
      },
      fusionStrategy: 'adaptive',
      qualityThreshold: 0.7,
      useGPTRefinement: true,
      maxProcessingTime: 30000, // 30 seconds max
      ...options
    };

    try {
      // Phase 1: Run all algorithms in parallel
      console.log('📊 Phase 1: Running parallel algorithm analysis...');
      
      const [edgeResult, colorResult, morphResult] = await Promise.all([
        this.runEdgeDetection(imageUrl),
        this.runColorSegmentation(imageUrl),
        this.runMorphologicalAnalysis(imageUrl)
      ]);

      // Phase 2: Initial fusion based on geometric overlap
      console.log('🔗 Phase 2: Performing initial geometric fusion...');
      
      const initialSprites = this.performGeometricFusion(
        edgeResult,
        colorResult,
        morphResult,
        opts
      );

      // Phase 3: Analyze quality and determine if GPT refinement needed
      console.log('📈 Phase 3: Quality analysis and refinement decision...');
      
      const qualityMetrics = this.calculateQualityMetrics(initialSprites, opts);
      
      let finalSprites = initialSprites;
      let gptAnalysis = undefined;

      if (opts.useGPTRefinement && qualityMetrics.overallQuality < opts.qualityThreshold) {
        console.log('🧠 Phase 4: GPT-4o refinement needed - low quality detected');
        
        const gptResult = await this.performGPTRefinement(imageUrl, initialSprites, opts);
        finalSprites = gptResult.sprites;
        gptAnalysis = gptResult.analysis;
      }

      // Phase 4: Final validation and confidence calculation
      console.log('✅ Phase 5: Final validation and confidence calculation...');
      
      const confidenceScore = this.calculateOverallConfidence(
        finalSprites,
        edgeResult,
        colorResult,
        morphResult,
        opts
      );

      const processingTime = performance.now() - startTime;

      console.log(`🎯 Fusion complete: ${finalSprites.length} sprites detected with ${confidenceScore.toFixed(3)} confidence in ${processingTime.toFixed(2)}ms`);

      return {
        success: true,
        sprites: finalSprites,
        confidenceScore,
        processingTime,
        algorithmResults: {
          edgeDetection: edgeResult,
          colorSegmentation: colorResult,
          morphological: morphResult,
          gptAnalysis
        },
        fusionStrategy: opts.fusionStrategy,
        qualityMetrics
      };

    } catch (error) {
      console.error('❌ Multi-algorithm fusion failed:', error);
      
      return {
        success: false,
        sprites: [],
        confidenceScore: 0,
        processingTime: performance.now() - startTime,
        algorithmResults: {
          edgeDetection: {} as EdgeDetectionResult,
          colorSegmentation: {} as ColorSegmentationResult,
          morphological: {} as MorphologicalResult
        },
        fusionStrategy: opts.fusionStrategy,
        qualityMetrics: {
          algorithmAgreement: 0,
          spatialConsistency: 0,
          sizeDistribution: 0,
          expectedCount: 0,
          overallQuality: 0
        }
      };
    }
  }

  /**
   * Run edge detection with optimized parameters
   */
  private async runEdgeDetection(imageUrl: string): Promise<EdgeDetectionResult> {
    console.log('🔍 Running advanced edge detection...');
    
    return await advancedEdgeDetection.detectEdges(imageUrl, {
      cannyLowThreshold: 40,          // Slightly higher to reduce noise
      cannyHighThreshold: 120,        // More selective edge detection
      gaussianBlurSize: 7,            // More aggressive blur to merge close edges
      minContourArea: 5000,           // MUCH higher - only large meaningful regions
      maxContourArea: 150000,         // Accommodate larger merged sprites
      contourApproximationMethod: 'simple',
      hierarchyMode: 'tree'
    });
  }

  /**
   * Run color segmentation with optimized parameters
   */
  private async runColorSegmentation(imageUrl: string): Promise<ColorSegmentationResult> {
    console.log('🎨 Running K-means color segmentation...');
    
    return await colorSegmentation.segmentByColor(imageUrl, {
      k: 8, // More clusters to better separate sprite elements
      maxIterations: 75,
      convergenceThreshold: 1.5,      // Tighter convergence
      excludeTransparent: true,
      alphaThreshold: 50,              // Higher alpha threshold to ignore semi-transparent
      colorSpace: 'lab',
      initialization: 'kmeans++'
    });
  }

  /**
   * Run morphological analysis with optimized parameters
   */
  private async runMorphologicalAnalysis(imageUrl: string): Promise<MorphologicalResult> {
    console.log('🔧 Running morphological operations...');
    
    return await morphologicalOperations.separateSprites(imageUrl, {
      operations: ['close', 'open'],     // Close first to connect sprite parts
      structuringElement: {
        shape: 'ellipse',
        size: 7                          // Larger kernel to merge fragments
      },
      iterations: 3,                     // More iterations for better merging
      separationMethod: 'watershed',
      minRegionSize: 3000,               // Much higher minimum
      maxRegionSize: 120000              // Higher maximum for merged regions
    });
  }

  /**
   * Perform geometric fusion of algorithm results
   */
  private performGeometricFusion(
    edgeResult: EdgeDetectionResult,
    colorResult: ColorSegmentationResult,
    morphResult: MorphologicalResult,
    options: FusionOptions
  ): FusedSprite[] {
    console.log('🔗 Performing geometric fusion...');
    
    // Convert all results to common format
    const edgeRegions = this.convertEdgeContoursToRegions(edgeResult);
    const colorRegions = this.convertColorClustersToRegions(colorResult);
    const morphRegions = this.convertMorphRegionsToRegions(morphResult);
    
    console.log(`📊 Input regions: Edge=${edgeRegions.length}, Color=${colorRegions.length}, Morph=${morphRegions.length}`);
    
    // Combine all regions
    const allRegions = [
      ...edgeRegions.map(r => ({...r, source: 'edge', weight: options.algorithmWeights.edgeDetection})),
      ...colorRegions.map(r => ({...r, source: 'color', weight: options.algorithmWeights.colorSegmentation})),
      ...morphRegions.map(r => ({...r, source: 'morph', weight: options.algorithmWeights.morphological}))
    ];

    // Apply fusion strategy
    let fusedSprites: FusedSprite[];
    
    switch (options.fusionStrategy) {
      case 'voting':
        fusedSprites = this.votingFusion(allRegions, options);
        break;
      case 'weighted':
        fusedSprites = this.weightedFusion(allRegions, options);
        break;
      case 'hierarchical':
        fusedSprites = this.hierarchicalFusion(edgeRegions, colorRegions, morphRegions, options);
        break;
      case 'adaptive':
      default:
        fusedSprites = this.adaptiveFusion(allRegions, options);
        break;
    }

    console.log(`✅ Geometric fusion complete: ${fusedSprites.length} fused sprites`);
    return fusedSprites;
  }

  /**
   * Convert edge detection contours to common region format
   */
  private convertEdgeContoursToRegions(edgeResult: EdgeDetectionResult): any[] {
    return edgeResult.contours.map((contour, index) => ({
      id: `edge_${index}`,
      bounds: contour.boundingRect,
      area: contour.area,
      confidence: contour.extent * contour.solidity, // Combine quality metrics
      aspectRatio: contour.aspectRatio,
      centroid: contour.centroid,
      properties: {
        edgeStrength: 1.0,
        colorUniformity: 0.5,
        density: contour.extent
      }
    }));
  }

  /**
   * Convert color clusters to common region format
   */
  private convertColorClustersToRegions(colorResult: ColorSegmentationResult): any[] {
    return colorResult.clusters
      .filter(cluster => cluster.averageAlpha > 80) // Higher alpha threshold
      .filter(cluster => cluster.size >= 1000)      // Only significant clusters
      .map((cluster, index) => {
        // Calculate bounding box from pixels
        const pixels = cluster.pixels;
        let minX = pixels[0]?.x || 0, maxX = pixels[0]?.x || 0;
        let minY = pixels[0]?.y || 0, maxY = pixels[0]?.y || 0;
        
        for (const pixel of pixels) {
          minX = Math.min(minX, pixel.x);
          maxX = Math.max(maxX, pixel.x);
          minY = Math.min(minY, pixel.y);
          maxY = Math.max(maxY, pixel.y);
        }
        
        const bounds = {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        };
        
        return {
          id: `color_${index}`,
          bounds,
          area: cluster.size,
          confidence: Math.min(1.0, cluster.dominance / 50), // Scale dominance appropriately
          aspectRatio: bounds.width / bounds.height,
          centroid: {
            x: minX + bounds.width / 2,
            y: minY + bounds.height / 2
          },
          properties: {
            edgeStrength: 0.5,
            colorUniformity: 1.0,
            density: cluster.size / (bounds.width * bounds.height)
          }
        };
      });
  }

  /**
   * Convert morphological regions to common format
   */
  private convertMorphRegionsToRegions(morphResult: MorphologicalResult): any[] {
    return morphResult.separatedRegions.map((region, index) => ({
      id: `morph_${index}`,
      bounds: region.bounds,
      area: region.area,
      confidence: region.confidence,
      aspectRatio: region.bounds.width / region.bounds.height,
      centroid: {
        x: region.bounds.x + region.bounds.width / 2,
        y: region.bounds.y + region.bounds.height / 2
      },
      properties: {
        edgeStrength: 0.7,
        colorUniformity: 0.6,
        density: region.area / (region.bounds.width * region.bounds.height)
      }
    }));
  }

  /**
   * Adaptive fusion strategy - intelligently combines algorithms based on image characteristics
   */
  private adaptiveFusion(regions: any[], options: FusionOptions): FusedSprite[] {
    console.log('🧠 Applying adaptive fusion strategy...');
    
    // Step 1: Group overlapping regions
    const groups = this.groupOverlappingRegions(regions, 0.3); // 30% overlap threshold
    
    console.log(`📊 Grouped ${regions.length} regions into ${groups.length} clusters`);
    
    // Step 2: For each group, select best representative or merge
    const fusedSprites: FusedSprite[] = [];
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      
      if (group.length === 1) {
        // Single region - convert directly
        fusedSprites.push(this.convertRegionToSprite(group[0], i, ['single']));
      } else {
        // Multiple overlapping regions - intelligently merge
        const merged = this.intelligentMerge(group, options);
        fusedSprites.push(this.convertRegionToSprite(merged, i, merged.sourceAlgorithms));
      }
    }
    
    // Step 3: Filter and validate results
    const validated = this.validateAndFilterSprites(fusedSprites, options);
    
    console.log(`✅ Adaptive fusion: ${regions.length} → ${groups.length} → ${fusedSprites.length} → ${validated.length} sprites`);
    
    return validated;
  }

  /**
   * Group overlapping regions using geometric overlap
   */
  private groupOverlappingRegions(regions: any[], overlapThreshold: number): any[][] {
    const groups: any[][] = [];
    const used = new Set<number>();
    
    // First pass: group by proximity and overlap
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      const group = [regions[i]];
      used.add(i);
      
      // Find all regions that overlap or are very close to this group
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;
        
        // Check if region j overlaps with any region in current group
        let shouldMerge = false;
        for (const groupRegion of group) {
          const overlap = this.calculateOverlap(groupRegion.bounds, regions[j].bounds);
          const proximity = this.calculateProximity(groupRegion.bounds, regions[j].bounds);
          
          // Merge if overlapping OR if very close and similar size
          if (overlap > overlapThreshold || 
              (proximity < 20 && Math.abs(groupRegion.area - regions[j].area) / Math.max(groupRegion.area, regions[j].area) < 0.5)) {
            shouldMerge = true;
            break;
          }
        }
        
        if (shouldMerge) {
          group.push(regions[j]);
          used.add(j);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  /**
   * Calculate overlap percentage between two bounding boxes
   */
  private calculateOverlap(bounds1: any, bounds2: any): number {
    const x1 = Math.max(bounds1.x, bounds2.x);
    const y1 = Math.max(bounds1.y, bounds2.y);
    const x2 = Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width);
    const y2 = Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height);
    
    if (x1 >= x2 || y1 >= y2) return 0; // No overlap
    
    const overlapArea = (x2 - x1) * (y2 - y1);
    const area1 = bounds1.width * bounds1.height;
    const area2 = bounds2.width * bounds2.height;
    const unionArea = area1 + area2 - overlapArea;
    
    return overlapArea / unionArea; // IoU (Intersection over Union)
  }

  /**
   * Calculate proximity between two bounding boxes (minimum distance)
   */
  private calculateProximity(bounds1: any, bounds2: any): number {
    const cx1 = bounds1.x + bounds1.width / 2;
    const cy1 = bounds1.y + bounds1.height / 2;
    const cx2 = bounds2.x + bounds2.width / 2;
    const cy2 = bounds2.y + bounds2.height / 2;
    
    return Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
  }

  /**
   * Intelligently merge overlapping regions
   */
  private intelligentMerge(regions: any[], options: FusionOptions): any {
    // Sort by confidence * weight
    regions.sort((a, b) => (b.confidence * b.weight) - (a.confidence * a.weight));
    
    const primary = regions[0];
    const sourceAlgorithms = [...new Set(regions.map(r => r.source))];
    
    // Calculate weighted average bounds
    let totalWeight = 0;
    let weightedX = 0, weightedY = 0, weightedWidth = 0, weightedHeight = 0;
    
    for (const region of regions) {
      const weight = region.confidence * region.weight;
      totalWeight += weight;
      
      weightedX += region.bounds.x * weight;
      weightedY += region.bounds.y * weight;
      weightedWidth += region.bounds.width * weight;
      weightedHeight += region.bounds.height * weight;
    }
    
    const mergedBounds = {
      x: Math.round(weightedX / totalWeight),
      y: Math.round(weightedY / totalWeight),
      width: Math.round(weightedWidth / totalWeight),
      height: Math.round(weightedHeight / totalWeight)
    };
    
    // Calculate merged properties
    const mergedArea = mergedBounds.width * mergedBounds.height;
    const mergedConfidence = regions.reduce((sum, r) => sum + r.confidence * r.weight, 0) / totalWeight;
    
    return {
      ...primary,
      bounds: mergedBounds,
      area: mergedArea,
      confidence: mergedConfidence,
      aspectRatio: mergedBounds.width / mergedBounds.height,
      sourceAlgorithms,
      fusionMethod: 'intelligent_merge'
    };
  }

  /**
   * Convert region to final sprite format
   */
  private convertRegionToSprite(region: any, index: number, sourceAlgorithms: string[]): FusedSprite {
    // Classify sprite type based on characteristics
    const type = this.classifySpriteType(region);
    
    return {
      id: `fused_${index}`,
      bounds: region.bounds,
      type,
      confidence: region.confidence,
      sourceAlgorithms,
      fusionMethod: region.fusionMethod || 'direct_conversion',
      imageData: '', // Will be filled later if needed
      properties: {
        area: region.area,
        aspectRatio: region.aspectRatio,
        density: region.properties.density,
        edgeStrength: region.properties.edgeStrength,
        colorUniformity: region.properties.colorUniformity
      }
    };
  }

  /**
   * Classify sprite type based on characteristics
   */
  private classifySpriteType(region: any): 'letter' | 'symbol' | 'object' | 'decoration' {
    const { area, aspectRatio } = region;
    const bounds = region.bounds;
    
    
    // Classify based on size hierarchy - largest is main symbol
    if (area > 20000) {
      console.log('   → symbol (area > 20000 - main symbol)');
      return 'symbol';
    }
    
    // Large regions could be the main symbol or grouped letters
    if (area > 10000) {
      // Use aspect ratio to distinguish
      if (aspectRatio >= 0.5 && aspectRatio <= 2.0) {
        console.log('   → symbol (large with good proportions)');
        return 'symbol';
      } else {
        console.log('   → object (large but poor proportions)');
        return 'object';
      }
    }
    
    // Medium-sized sprites are likely individual letters
    if (area >= 5000 && area <= 10000) {
      console.log('   → letter (medium size)');
      return 'letter';
    }
    
    // Smaller sprites could be letters if well-proportioned
    if (area >= 2000 && aspectRatio >= 0.2 && aspectRatio <= 4.0) {
      console.log('   → letter (small but reasonable)');
      return 'letter';
    }
    
    // Very small sprites are likely noise/decorations
    if (area < 2000) {
      console.log('   → decoration (too small)');
      return 'decoration';
    }
    
    console.log('   → object (fallback)');
    return 'object';
  }

  /**
   * Validate and filter sprites based on quality criteria
   */
  private validateAndFilterSprites(sprites: FusedSprite[], options: FusionOptions): FusedSprite[] {
    console.log('🔍 Validating and filtering sprites...');
    
    // Filter by confidence threshold
    let filtered = sprites.filter(sprite => sprite.confidence > 0.2);
    
    // Filter by size constraints - much more restrictive
    filtered = filtered.filter(sprite => {
      const area = sprite.properties.area;
      return area >= 2000 && area <= 200000;  // Only meaningful-sized sprites
    });
    
    // Prefer larger sprites and symbols over tiny fragments
    filtered.sort((a, b) => {
      // Primary: prioritize symbols over letters
      if (a.type === 'symbol' && b.type !== 'symbol') return -1;
      if (b.type === 'symbol' && a.type !== 'symbol') return 1;
      
      // Secondary: larger area (meaningful sprites)
      const sizeDiff = b.properties.area - a.properties.area;
      if (Math.abs(sizeDiff) > 1000) return sizeDiff;
      
      // Tertiary: confidence
      return b.confidence - a.confidence;
    });
    
    // Keep best candidates up to expected count + some buffer
    if (filtered.length > options.expectedSpriteCount + 2) {
      filtered = filtered.slice(0, options.expectedSpriteCount + 2);
    }
    
    console.log(`🔍 Validation: ${sprites.length} → ${filtered.length} sprites after filtering`);
    console.log('🔍 Remaining sprites:', filtered.map(s => `${s.type}(${s.properties.area} pixels)`).join(', '));
    
    return filtered;
  }

  /**
   * Voting fusion strategy (placeholder for alternative approaches)
   */
  private votingFusion(regions: any[], options: FusionOptions): FusedSprite[] {
    // Group regions and vote on best representatives
    return this.adaptiveFusion(regions, options); // Use adaptive as fallback
  }

  /**
   * Weighted fusion strategy
   */
  private weightedFusion(regions: any[], options: FusionOptions): FusedSprite[] {
    // Apply algorithm weights more strictly
    return this.adaptiveFusion(regions, options); // Use adaptive as fallback
  }

  /**
   * Hierarchical fusion strategy
   */
  private hierarchicalFusion(
    edgeRegions: any[],
    colorRegions: any[],
    morphRegions: any[],
    options: FusionOptions
  ): FusedSprite[] {
    // Process algorithms in hierarchy: edge → color → morph
    return this.adaptiveFusion([...edgeRegions, ...colorRegions, ...morphRegions], options);
  }

  /**
   * Calculate quality metrics for fusion result
   */
  private calculateQualityMetrics(sprites: FusedSprite[], options: FusionOptions): QualityMetrics {
    // Algorithm agreement - how many algorithms contributed to each sprite
    const avgSourceCount = sprites.reduce((sum, sprite) => sum + sprite.sourceAlgorithms.length, 0) / sprites.length;
    const algorithmAgreement = Math.min(1.0, avgSourceCount / 3); // Max 3 algorithms
    
    // Spatial consistency - are sprites well-distributed?
    const spatialConsistency = this.calculateSpatialConsistency(sprites);
    
    // Size distribution - are sprite sizes reasonable?
    const sizeDistribution = this.calculateSizeDistribution(sprites);
    
    // Expected count - how close are we to expected number?
    const countDiff = Math.abs(sprites.length - options.expectedSpriteCount);
    const expectedCount = Math.max(0, 1 - countDiff / options.expectedSpriteCount);
    
    // Overall quality
    const overallQuality = (algorithmAgreement + spatialConsistency + sizeDistribution + expectedCount) / 4;
    
    const metrics = {
      algorithmAgreement,
      spatialConsistency,
      sizeDistribution,
      expectedCount,
      overallQuality
    };
    
    console.log(`📊 Quality metrics:`, metrics);
    
    return metrics;
  }

  /**
   * Calculate spatial consistency score
   */
  private calculateSpatialConsistency(sprites: FusedSprite[]): number {
    if (sprites.length <= 1) return 1.0;
    
    // Check for reasonable spacing between sprites
    let totalOverlap = 0;
    let pairCount = 0;
    
    for (let i = 0; i < sprites.length; i++) {
      for (let j = i + 1; j < sprites.length; j++) {
        const overlap = this.calculateOverlap(sprites[i].bounds, sprites[j].bounds);
        totalOverlap += overlap;
        pairCount++;
      }
    }
    
    const avgOverlap = totalOverlap / pairCount;
    return Math.max(0, 1 - avgOverlap * 2); // Penalize excessive overlap
  }

  /**
   * Calculate size distribution score
   */
  private calculateSizeDistribution(sprites: FusedSprite[]): number {
    if (sprites.length === 0) return 0;
    
    const areas = sprites.map(s => s.properties.area);
    const avgArea = areas.reduce((sum, area) => sum + area, 0) / areas.length;
    
    // Calculate coefficient of variation
    const variance = areas.reduce((sum, area) => sum + Math.pow(area - avgArea, 2), 0) / areas.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgArea;
    
    // Lower variation is better (letters should be similar size)
    return Math.max(0, 1 - cv);
  }

  /**
   * Perform GPT-4o refinement for low quality detections
   */
  private async performGPTRefinement(
    imageUrl: string,
    initialSprites: FusedSprite[],
    options: FusionOptions
  ): Promise<{sprites: FusedSprite[], analysis: any}> {
    console.log('🧠 Performing GPT-4o refinement...');
    
    try {
      // Create detailed prompt for GPT-4o
      const prompt = this.createGPTRefinementPrompt(initialSprites, options);
      
      // Call GPT-4o vision API
      const gptResponse = await enhancedOpenaiClient.analyzeImageWithGPT4O(imageUrl, prompt);
      
      // Parse GPT response and integrate with existing results
      const refinedSprites = await this.integrateGPTResults(gptResponse, initialSprites, options);
      
      console.log(`🧠 GPT refinement: ${initialSprites.length} → ${refinedSprites.length} sprites`);
      
      return {
        sprites: refinedSprites,
        analysis: gptResponse
      };
      
    } catch (error) {
      console.warn('⚠️ GPT refinement failed, using original results:', error);
      return {
        sprites: initialSprites,
        analysis: null
      };
    }
  }

  /**
   * Create GPT refinement prompt
   */
  private createGPTRefinementPrompt(sprites: FusedSprite[], options: FusionOptions): string {
    const spriteInfo = sprites.map((sprite, i) => 
      `Sprite ${i+1}: ${sprite.type} at (${sprite.bounds.x},${sprite.bounds.y}) size ${sprite.bounds.width}x${sprite.bounds.height}, confidence: ${sprite.confidence.toFixed(2)}`
    ).join('\n');
    
    return `Analyze this slot machine symbol image for sprite detection quality.
    
Current detection results (${sprites.length} sprites found):
${spriteInfo}

Expected: ${options.expectedSpriteCount} sprites (typically 4 letters + 1 main symbol for "WILD")

Please assess:
1. Are any obvious sprites missing?
2. Are any detections false positives?
3. Should any detections be merged or split?
4. What are the precise boundaries of each distinct visual element?

Respond with specific corrections and boundary refinements in JSON format.`;
  }

  /**
   * Integrate GPT results with existing sprites
   */
  private async integrateGPTResults(
    gptResponse: any,
    initialSprites: FusedSprite[],
    options: FusionOptions
  ): Promise<FusedSprite[]> {
    // Parse GPT response and apply corrections
    // This would involve sophisticated natural language processing
    // For now, return initial sprites with adjusted confidence
    
    return initialSprites.map(sprite => ({
      ...sprite,
      confidence: Math.min(1.0, sprite.confidence + 0.1), // Slight boost for GPT validation
      sourceAlgorithms: [...sprite.sourceAlgorithms, 'gpt_refined']
    }));
  }

  /**
   * Calculate overall confidence based on all algorithm results
   */
  private calculateOverallConfidence(
    sprites: FusedSprite[],
    edgeResult: EdgeDetectionResult,
    colorResult: ColorSegmentationResult,
    morphResult: MorphologicalResult,
    options: FusionOptions
  ): number {
    if (sprites.length === 0) return 0;
    
    // Individual algorithm confidences
    const edgeConfidence = edgeResult.confidence;
    const colorConfidence = colorResult.confidence;
    const morphConfidence = morphResult.confidence;
    
    // Sprite-level confidence
    const avgSpriteConfidence = sprites.reduce((sum, sprite) => sum + sprite.confidence, 0) / sprites.length;
    
    // Count accuracy
    const countAccuracy = Math.max(0, 1 - Math.abs(sprites.length - options.expectedSpriteCount) / options.expectedSpriteCount);
    
    // Algorithm agreement
    const avgSourceCount = sprites.reduce((sum, sprite) => sum + sprite.sourceAlgorithms.length, 0) / sprites.length;
    const agreementScore = Math.min(1.0, avgSourceCount / 3);
    
    // Weighted final confidence
    const weights = options.algorithmWeights;
    const finalConfidence = (
      edgeConfidence * weights.edgeDetection +
      colorConfidence * weights.colorSegmentation +
      morphConfidence * weights.morphological +
      avgSpriteConfidence * 0.3 +
      countAccuracy * 0.2 +
      agreementScore * 0.1
    );
    
    return Math.min(1.0, finalConfidence);
  }
}

// Export singleton instance
export const multiAlgorithmFusion = new MultiAlgorithmFusion();