/**
 * Image Analysis Pipeline for Animation Lab
 * Analyzes uploaded images to determine animation potential and object classification
 */

export interface ImageAnalysisResult {
  id: string;
  objectType: string; // Allow any specific object type (e.g., "chalice", "emerald", "medieval sword")
  animationPotential: AnimationPotential[];
  components: ComponentAnalysis[];
  metadata: ImageMetadata;
  confidence: number;
}

export interface AnimationPotential {
  type: 'rotation' | 'scale' | 'pulse' | 'glow' | 'swing' | 'bounce' | 'morph' | 'particle';
  confidence: number;
  description: string;
  requiredAssets?: string[];
}

export interface ComponentAnalysis {
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  type: 'primary' | 'secondary' | 'detail';
  separable: boolean;
  description: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasTransparency: boolean;
  dominantColors: string[];
  complexity: 'simple' | 'medium' | 'complex';
  aspectRatio: number;
}

export class ImageAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Analyze uploaded image for animation potential
   */
  async analyzeImage(
    imageSource: HTMLImageElement | ImageData | HTMLCanvasElement,
    assetId: string
  ): Promise<ImageAnalysisResult> {
    try {
      // Extract image data
      const imageData = await this.extractImageData(imageSource);
      
      // Perform basic analysis
      const metadata = this.analyzeMetadata(imageData);
      const objectType = this.classifyObject(imageData, metadata);
      const components = this.analyzeComponents(imageData, objectType);
      const animationPotential = this.determineAnimationPotential(objectType, components, metadata);
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(objectType, components, metadata);

      return {
        id: assetId,
        objectType,
        animationPotential,
        components,
        metadata,
        confidence
      };
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error}`);
    }
  }

  /**
   * Extract ImageData from various source types
   */
  private async extractImageData(
    source: HTMLImageElement | ImageData | HTMLCanvasElement
  ): Promise<ImageData> {
    if (source instanceof ImageData) {
      return source;
    }

    if (source instanceof HTMLImageElement) {
      // Ensure image is loaded
      if (!source.complete) {
        await new Promise((resolve, reject) => {
          source.onload = resolve;
          source.onerror = reject;
        });
      }
      
      this.canvas.width = source.naturalWidth;
      this.canvas.height = source.naturalHeight;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(source, 0, 0);
      
      return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    if (source instanceof HTMLCanvasElement) {
      const ctx = source.getContext('2d')!;
      return ctx.getImageData(0, 0, source.width, source.height);
    }

    throw new Error('Unsupported image source type');
  }

  /**
   * Analyze basic image metadata
   */
  private analyzeMetadata(imageData: ImageData): ImageMetadata {
    const { width, height, data } = imageData;
    
    // Check for transparency
    let hasTransparency = false;
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 255) {
        hasTransparency = true;
      }
      
      // Sample colors for dominant color analysis
      if (alpha > 128) { // Only count non-transparent pixels
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const colorKey = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
    }

    // Get dominant colors
    const dominantColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => `rgb(${color})`);

    // Determine complexity based on color variation and edge detection
    const uniqueColors = colorMap.size;
    const complexity = uniqueColors < 50 ? 'simple' : uniqueColors < 200 ? 'medium' : 'complex';

    return {
      width,
      height,
      format: 'image', // Will be set properly by AssetManager
      hasTransparency,
      dominantColors,
      complexity,
      aspectRatio: width / height
    };
  }

  /**
   * Classify object type based on image characteristics
   */
  private classifyObject(imageData: ImageData, metadata: ImageMetadata): string {
    const { width, height, hasTransparency, complexity, aspectRatio } = metadata;
    
    // Simple heuristic-based classification
    // In Phase 2, this will be replaced with AI classification
    
    // Gem characteristics: compact, symmetrical, transparent background
    if (hasTransparency && aspectRatio > 0.7 && aspectRatio < 1.3 && complexity === 'simple') {
      return 'gem';
    }
    
    // Weapon characteristics: elongated, complex details
    if (aspectRatio > 2.0 || aspectRatio < 0.5) {
      return 'weapon';
    }
    
    // Character characteristics: complex, usually tall
    if (complexity === 'complex' && aspectRatio < 0.8) {
      return 'character';
    }
    
    // Mechanical characteristics: geometric patterns, medium complexity
    if (complexity === 'medium' && this.hasGeometricPatterns(imageData)) {
      return 'mechanical';
    }
    
    // Organic characteristics: irregular shapes, natural colors
    if (complexity === 'complex' && this.hasOrganicShapes(imageData)) {
      return 'organic';
    }
    
    return 'unknown';
  }

  /**
   * Analyze image components for potential separation
   */
  private analyzeComponents(
    imageData: ImageData, 
    objectType: string
  ): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];
    
    // Basic component analysis based on object type
    // This will be enhanced with proper image segmentation algorithms
    
    const { width, height } = imageData;
    
    switch (objectType) {
      case 'gem':
        components.push({
          name: 'main_body',
          bounds: { x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.8 },
          type: 'primary',
          separable: false,
          description: 'Main gem body'
        });
        break;
        
      case 'weapon':
        components.push(
          {
            name: 'blade',
            bounds: { x: 0, y: 0, width: width * 0.7, height: height },
            type: 'primary',
            separable: true,
            description: 'Weapon blade/head'
          },
          {
            name: 'handle',
            bounds: { x: width * 0.7, y: height * 0.3, width: width * 0.3, height: height * 0.4 },
            type: 'secondary',
            separable: true,
            description: 'Weapon handle/grip'
          }
        );
        break;
        
      case 'character':
        components.push(
          {
            name: 'body',
            bounds: { x: width * 0.2, y: height * 0.3, width: width * 0.6, height: height * 0.5 },
            type: 'primary',
            separable: false,
            description: 'Character body'
          },
          {
            name: 'appendages',
            bounds: { x: 0, y: height * 0.2, width: width, height: height * 0.6 },
            type: 'secondary',
            separable: true,
            description: 'Arms, legs, accessories'
          }
        );
        break;
        
      default:
        components.push({
          name: 'main_object',
          bounds: { x: 0, y: 0, width, height },
          type: 'primary',
          separable: false,
          description: 'Primary object'
        });
    }
    
    return components;
  }

  /**
   * Determine animation potential based on analysis
   */
  private determineAnimationPotential(
    objectType: string,
    components: ComponentAnalysis[],
    metadata: ImageMetadata
  ): AnimationPotential[] {
    const potential: AnimationPotential[] = [];
    
    // Base animations available for all objects
    potential.push(
      {
        type: 'scale',
        confidence: 0.9,
        description: 'Grow/shrink animation'
      },
      {
        type: 'pulse',
        confidence: 0.8,
        description: 'Pulsing effect'
      },
      {
        type: 'glow',
        confidence: 0.7,
        description: 'Glowing outline effect'
      }
    );
    
    // Object-specific animations
    switch (objectType) {
      case 'gem':
        potential.push(
          {
            type: 'rotation',
            confidence: 0.6,
            description: 'Spinning rotation (requires generated frames)',
            requiredAssets: ['rotation_frames_8']
          },
          {
            type: 'bounce',
            confidence: 0.8,
            description: 'Elastic bounce animation'
          }
        );
        break;
        
      case 'weapon':
        potential.push(
          {
            type: 'swing',
            confidence: 0.8,
            description: 'Swinging motion'
          },
          {
            type: 'rotation',
            confidence: 0.7,
            description: 'Spinning weapon'
          }
        );
        break;
        
      case 'character':
        potential.push(
          {
            type: 'bounce',
            confidence: 0.9,
            description: 'Character celebration bounce'
          },
          {
            type: 'particle',
            confidence: 0.7,
            description: 'Particle effects around character'
          }
        );
        break;
        
      case 'organic':
        potential.push(
          {
            type: 'morph',
            confidence: 0.6,
            description: 'Shape morphing animation'
          }
        );
        break;
    }
    
    return potential;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    objectType: string,
    components: ComponentAnalysis[],
    metadata: ImageMetadata
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for known object types
    if (objectType !== 'unknown') {
      confidence += 0.2;
    }
    
    // Higher confidence for transparent images (easier to work with)
    if (metadata.hasTransparency) {
      confidence += 0.1;
    }
    
    // Higher confidence for simpler images (more predictable)
    if (metadata.complexity === 'simple') {
      confidence += 0.1;
    } else if (metadata.complexity === 'medium') {
      confidence += 0.05;
    }
    
    // Higher confidence for multiple separable components
    const separableComponents = components.filter(c => c.separable).length;
    confidence += Math.min(separableComponents * 0.05, 0.1);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Detect geometric patterns (simple heuristic)
   */
  private hasGeometricPatterns(imageData: ImageData): boolean {
    // Simple edge detection to identify geometric patterns
    // This is a placeholder - real implementation would use proper algorithms
    return Math.random() > 0.7; // Temporary random
  }

  /**
   * Detect organic shapes (simple heuristic)
   */
  private hasOrganicShapes(imageData: ImageData): boolean {
    // Simple curve detection to identify organic shapes
    // This is a placeholder - real implementation would use proper algorithms
    return Math.random() > 0.6; // Temporary random
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Canvas cleanup is automatic
  }
}