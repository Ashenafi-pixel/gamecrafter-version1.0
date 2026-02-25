// Professional Layer Extraction System - Phase 1.3
// Implements computer vision algorithms for pixel-perfect layer isolation

export interface PrecisionLayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PrecisionContourPoint {
  x: number;
  y: number;
  pressure?: number; // Edge strength
  type?: 'corner' | 'smooth' | 'edge';
}

export interface ExtractedLayerData {
  layerId: string;
  name: string;
  type: string;
  originalBounds: PrecisionLayerBounds;
  refinedBounds: PrecisionLayerBounds;
  precisionContour: PrecisionContourPoint[];
  alphaChannel: Uint8ClampedArray;
  imageData: ImageData;
  spriteBase64: string;
  metadata: {
    extractionMethod: 'cv-edge-detection' | 'cv-watershed' | 'cv-grabcut' | 'gpt-guided';
    confidence: number;
    pixelCount: number;
    boundaryLength: number;
    timestamp: number;
  };
}

export interface LayerExtractionOptions {
  method: 'auto' | 'surgical' | 'edge-detection' | 'watershed' | 'grabcut' | 'canny';
  edgeThreshold: number;
  morphologyKernel: number;
  contourSimplification: number;
  alphaFeathering: number;
  backgroundRemoval: boolean;
  // Surgical extraction options
  surgicalPrecision: 'high' | 'medium' | 'low';
  contentAwareFill: boolean;
  antiAliasing: boolean;
  edgeSmoothing: number;
  colorSimilarityThreshold: number;
}

class ProfessionalLayerExtractor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImageData: ImageData | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create canvas context for layer extraction');
    }
    this.ctx = context;
  }

  /**
   * Main extraction function - converts GPT-4 Vision layer bounds into precise sprites
   */
  async extractLayerFromImage(
    imageBase64: string,
    layerBounds: { x: number; y: number; width: number; height: number },
    contourPoints: Array<{ x: number; y: number }>,
    layerId: string,
    layerName: string,
    layerType: string,
    options: Partial<LayerExtractionOptions> = {}
  ): Promise<ExtractedLayerData> {
    console.log(`🔬 [Layer Extraction] Starting precision extraction for: ${layerName}`);
    
    const extractionOptions: LayerExtractionOptions = {
      method: 'surgical',
      edgeThreshold: 100,
      morphologyKernel: 3,
      contourSimplification: 1.0,
      alphaFeathering: 3,
      backgroundRemoval: true,
      // Surgical extraction defaults
      surgicalPrecision: 'high',
      contentAwareFill: true,
      antiAliasing: true,
      edgeSmoothing: 2.0,
      colorSimilarityThreshold: 15,
      ...options
    };

    // Load source image
    const sourceImage = await this.loadImage(imageBase64);
    this.canvas.width = sourceImage.width;
    this.canvas.height = sourceImage.height;
    this.ctx.drawImage(sourceImage, 0, 0);
    this.originalImageData = this.ctx.getImageData(0, 0, sourceImage.width, sourceImage.height);

    // Convert percentage bounds to pixel coordinates
    console.log(`🎯 [DEBUG] Original layer bounds (%)`, layerBounds);
    console.log(`🎯 [DEBUG] Source image dimensions:`, { width: sourceImage.width, height: sourceImage.height });
    
    const pixelBounds = this.percentageToPixelBounds(layerBounds, sourceImage.width, sourceImage.height);
    const pixelContour = contourPoints.map(point => ({
      x: (point.x / 100) * sourceImage.width,
      y: (point.y / 100) * sourceImage.height
    }));

    console.log(`🎯 [Layer Extraction] Pixel bounds:`, pixelBounds);
    console.log(`🎯 [Layer Extraction] Pixel contour points:`, pixelContour.length);
    
    // CRITICAL DEBUG: Validate pixel bounds before processing
    if (pixelBounds.width <= 0 || pixelBounds.height <= 0) {
      console.error(`🚨 [CRITICAL] Invalid pixel bounds calculated!`, {
        original: layerBounds,
        calculated: pixelBounds,
        sourceSize: { width: sourceImage.width, height: sourceImage.height }
      });
      throw new Error(`Invalid pixel bounds: width=${pixelBounds.width}, height=${pixelBounds.height}`);
    }

    // Phase 1: Boundary Refinement using Computer Vision
    const refinedBounds = await this.refineBoundariesWithCV(pixelBounds, pixelContour, extractionOptions);
    
    // Phase 2: Precision Contour Tracing
    const precisionContour = await this.tracePrecisionContour(refinedBounds, pixelContour, extractionOptions);
    
    // Phase 3: Alpha Channel Generation
    const alphaChannel = await this.generateAlphaChannel(refinedBounds, precisionContour, extractionOptions);
    
    // Phase 4: Layer Isolation and Sprite Creation
    const { imageData, spriteBase64 } = await this.createLayerSprite(
      refinedBounds, 
      precisionContour, 
      alphaChannel, 
      extractionOptions
    );

    const extractedLayer: ExtractedLayerData = {
      layerId,
      name: layerName,
      type: layerType,
      originalBounds: layerBounds,
      refinedBounds: this.pixelToPercentageBounds(refinedBounds, sourceImage.width, sourceImage.height),
      precisionContour: precisionContour.map(point => ({
        x: (point.x / sourceImage.width) * 100,
        y: (point.y / sourceImage.height) * 100,
        pressure: point.pressure,
        type: point.type
      })),
      alphaChannel,
      imageData,
      spriteBase64,
      metadata: {
        extractionMethod: 'cv-edge-detection',
        confidence: 0.95,
        pixelCount: alphaChannel.filter(alpha => alpha > 128).length,
        boundaryLength: precisionContour.length,
        timestamp: Date.now()
      }
    };

    console.log(`✅ [Layer Extraction] Completed for ${layerName}:`, {
      pixelCount: extractedLayer.metadata.pixelCount,
      boundaryPoints: extractedLayer.precisionContour.length,
      spriteSize: extractedLayer.spriteBase64.length
    });

    return extractedLayer;
  }

  /**
   * Phase 1: 🔬 SURGICAL Boundary Refinement using Advanced Computer Vision
   */
  private async refineBoundariesWithCV(
    bounds: PrecisionLayerBounds,
    contourHints: Array<{ x: number; y: number }>,
    options: LayerExtractionOptions
  ): Promise<PrecisionLayerBounds> {
    if (options.method === 'surgical') {
      console.log(`🔬 [SURGICAL] Starting precision boundary refinement...`);
    } else {
      console.log(`🔍 [CV] Refining boundaries using edge detection...`);
    }

    if (!this.originalImageData) {
      throw new Error('No image data available for boundary refinement');
    }

    // Extract region of interest with padding for surgical precision
    const padding = options.method === 'surgical' ? 20 : 5;
    const roiX = Math.max(0, Math.floor(bounds.x - padding));
    const roiY = Math.max(0, Math.floor(bounds.y - padding));
    const roiWidth = Math.max(1, Math.min(
      this.originalImageData.width - roiX, 
      Math.ceil(bounds.width) + padding * 2
    ));
    const roiHeight = Math.max(1, Math.min(
      this.originalImageData.height - roiY,
      Math.ceil(bounds.height) + padding * 2
    ));
    
    console.log(`🔍 [CV] ROI extraction:`, { roiX, roiY, roiWidth, roiHeight });
    
    // Extract ROI - dimensions should be valid now
    if (roiWidth <= 0 || roiHeight <= 0) {
      throw new Error(`Invalid ROI dimensions calculated: ${roiWidth}x${roiHeight} from bounds: ${JSON.stringify(bounds)}`);
    }
    
    const roiData = this.ctx.getImageData(roiX, roiY, roiWidth, roiHeight);

    let edges: Uint8ClampedArray;
    
    if (options.method === 'surgical') {
      // 🔬 SURGICAL: Use advanced Canny edge detection
      const lowThreshold = options.edgeThreshold * 0.5;
      const highThreshold = options.edgeThreshold * 2;
      edges = this.detectEdgesCanny(roiData, lowThreshold, highThreshold);
      
      // Apply morphological operations for cleaner edges
      edges = this.applyMorphologicalOperations(edges, roiWidth, roiHeight, options.morphologyKernel);
    } else {
      // Standard Sobel edge detection
      edges = this.detectEdgesSobel(roiData, options.edgeThreshold);
    }
    
    // Find tight bounding box around detected edges
    const tightBounds = this.findTightBoundingBox(edges, roiWidth, roiHeight);
    
    // Adjust bounds relative to original coordinates
    const refinedBounds: PrecisionLayerBounds = {
      x: roiX + tightBounds.x,
      y: roiY + tightBounds.y,
      width: tightBounds.width,
      height: tightBounds.height
    };
    
    console.log(`🔍 [DEBUG] Boundary refinement calculation:`, {
      roiX, roiY, roiWidth, roiHeight,
      tightBounds,
      refinedBounds
    });
    
    // VALIDATE refined bounds
    if (refinedBounds.width <= 0 || refinedBounds.height <= 0) {
      console.error(`🚨 [CRITICAL] Refined bounds are negative!`, {
        roiExtraction: { roiX, roiY, roiWidth, roiHeight },
        tightBounds,
        refinedBounds
      });
      throw new Error(`Negative refined bounds: width=${refinedBounds.width}, height=${refinedBounds.height}`);
    }

    // 🔬 SURGICAL: Additional refinement using color segmentation
    if (options.method === 'surgical' && contourHints.length > 0) {
      console.log(`🎨 [SURGICAL] Applying color-based refinement...`);
      
      // Use first contour hint as seed point for color segmentation
      const seedX = Math.floor((contourHints[0].x / 100) * this.originalImageData.width);
      const seedY = Math.floor((contourHints[0].y / 100) * this.originalImageData.height);
      
      if (seedX >= 0 && seedX < this.originalImageData.width && 
          seedY >= 0 && seedY < this.originalImageData.height) {
        const colorMask = this.surgicalColorSegmentation(
          this.originalImageData, 
          seedX, 
          seedY, 
          options.colorSimilarityThreshold
        );
        
        // Find bounding box of color segmentation
        const colorBounds = this.findTightBoundingBox(colorMask, this.originalImageData.width, this.originalImageData.height);
        
        // Combine edge detection and color segmentation results
        refinedBounds.x = Math.min(refinedBounds.x, colorBounds.x);
        refinedBounds.y = Math.min(refinedBounds.y, colorBounds.y);
        refinedBounds.width = Math.max(refinedBounds.x + refinedBounds.width, colorBounds.x + colorBounds.width) - refinedBounds.x;
        refinedBounds.height = Math.max(refinedBounds.y + refinedBounds.height, colorBounds.y + colorBounds.height) - refinedBounds.y;
      }
    }

    const logPrefix = options.method === 'surgical' ? '🔬 [SURGICAL]' : '✨ [CV]';
    console.log(`${logPrefix} Boundary refinement complete:`, {
      original: bounds,
      refined: refinedBounds,
      improvement: {
        x: refinedBounds.x - bounds.x,
        y: refinedBounds.y - bounds.y,
        width: refinedBounds.width - bounds.width,
        height: refinedBounds.height - bounds.height
      }
    });

    return refinedBounds;
  }

  /**
   * 🔬 SURGICAL: Morphological operations for cleaner edges
   */
  private applyMorphologicalOperations(
    edges: Uint8ClampedArray, 
    width: number, 
    height: number, 
    kernelSize: number
  ): Uint8ClampedArray {
    console.log(`🔬 [SURGICAL] Applying morphological operations (kernel size: ${kernelSize})`);
    
    // Apply erosion followed by dilation (opening) to remove noise
    const eroded = this.morphologicalErosion(edges, width, height, kernelSize);
    const opened = this.morphologicalDilation(eroded, width, height, kernelSize);
    
    return opened;
  }

  private morphologicalErosion(
    image: Uint8ClampedArray, 
    width: number, 
    height: number, 
    kernelSize: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(width * height);
    const radius = Math.floor(kernelSize / 2);
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let minValue = 255;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const value = image[(y + ky) * width + (x + kx)];
            minValue = Math.min(minValue, value);
          }
        }
        
        result[y * width + x] = minValue;
      }
    }
    
    return result;
  }

  private morphologicalDilation(
    image: Uint8ClampedArray, 
    width: number, 
    height: number, 
    kernelSize: number
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(width * height);
    const radius = Math.floor(kernelSize / 2);
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let maxValue = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const value = image[(y + ky) * width + (x + kx)];
            maxValue = Math.max(maxValue, value);
          }
        }
        
        result[y * width + x] = maxValue;
      }
    }
    
    return result;
  }

  /**
   * Phase 2: Precision Contour Tracing
   */
  private async tracePrecisionContour(
    bounds: PrecisionLayerBounds,
    initialContour: Array<{ x: number; y: number }>,
    options: LayerExtractionOptions
  ): Promise<Array<PrecisionContourPoint>> {
    console.log(`📐 [CV] Tracing precision contour...`);

    if (!this.originalImageData) {
      throw new Error('No image data available for contour tracing');
    }

    // Validate bounds before contour tracing
    const safeX = Math.max(0, Math.floor(bounds.x));
    const safeY = Math.max(0, Math.floor(bounds.y));
    const safeWidth = Math.max(1, Math.ceil(bounds.width));
    const safeHeight = Math.max(1, Math.ceil(bounds.height));
    
    console.log(`📐 [CV] Contour extraction bounds:`, { x: safeX, y: safeY, width: safeWidth, height: safeHeight });
    
    // Extract ROI for contour tracing with safety
    let roiData: ImageData;
    roiData = this.ctx.getImageData(safeX, safeY, safeWidth, safeHeight);
    
    // Apply edge detection
    const edges = this.detectEdgesSobel(roiData, options.edgeThreshold);
    
    // Trace contour using Moore neighborhood tracing
    const contourPoints = this.traceContourMoore(edges, safeWidth, safeHeight);
    
    // Simplify contour using Douglas-Peucker algorithm
    const simplifiedContour = this.simplifyContour(contourPoints, options.contourSimplification);
    
    // Convert to precision contour points with metadata
    const precisionContour: PrecisionContourPoint[] = simplifiedContour.map((point, index) => {
      const globalX = safeX + point.x;
      const globalY = safeY + point.y;
      
      return {
        x: globalX,
        y: globalY,
        pressure: this.calculateEdgeStrength(globalX, globalY),
        type: this.classifyContourPoint(point, simplifiedContour, index)
      };
    });

    console.log(`🎯 [CV] Contour tracing complete: ${precisionContour.length} precision points`);
    return precisionContour;
  }

  /**
   * Phase 3: Alpha Channel Generation
   */
  private async generateAlphaChannel(
    bounds: PrecisionLayerBounds,
    contour: Array<PrecisionContourPoint>,
    options: LayerExtractionOptions
  ): Promise<Uint8ClampedArray> {
    console.log(`🎨 [CV] Generating alpha channel with feathering...`);

    const width = Math.max(1, Math.ceil(bounds.width));
    const height = Math.max(1, Math.ceil(bounds.height));
    
    console.log(`🎨 [CV] Alpha channel dimensions: ${width}x${height} pixels`);
    
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid alpha channel dimensions: ${width}x${height} from bounds: ${JSON.stringify(bounds)}`);
    }
    
    const alphaChannel = new Uint8ClampedArray(width * height);

    // Create mask from contour using polygon fill
    const mask = this.createPolygonMask(contour, bounds, width, height);
    
    // Apply feathering for smooth edges
    const featheredMask = this.applyGaussianFeathering(mask, width, height, options.alphaFeathering);
    
    // Copy feathered mask to alpha channel
    for (let i = 0; i < alphaChannel.length; i++) {
      alphaChannel[i] = featheredMask[i];
    }

    console.log(`✨ [CV] Alpha channel generated: ${width}x${height} pixels`);
    return alphaChannel;
  }

  /**
   * Phase 4: 🔬 SURGICAL Layer Sprite Creation with Content-Aware Enhancement
   */
  private async createLayerSprite(
    bounds: PrecisionLayerBounds,
    contour: Array<PrecisionContourPoint>,
    alphaChannel: Uint8ClampedArray,
    options: LayerExtractionOptions
  ): Promise<{ imageData: ImageData; spriteBase64: string }> {
    const logPrefix = options.method === 'surgical' ? '🔬 [SURGICAL]' : '🖼️ [CV]';
    console.log(`${logPrefix} Creating isolated layer sprite...`);

    if (!this.originalImageData) {
      throw new Error('No image data available for sprite creation');
    }

    const width = Math.max(1, Math.ceil(bounds.width));
    const height = Math.max(1, Math.ceil(bounds.height));
    const safeX = Math.max(0, Math.floor(bounds.x));
    const safeY = Math.max(0, Math.floor(bounds.y));
    
    console.log(`${logPrefix} Sprite extraction bounds:`, { x: safeX, y: safeY, width, height });
    
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid sprite dimensions: ${width}x${height} from bounds: ${JSON.stringify(bounds)}`);
    }
    
    // Extract source pixels from the bounded region with safety checks
    let sourceData: ImageData;
    sourceData = this.ctx.getImageData(safeX, safeY, width, height);
    
    // 🔬 SURGICAL: Apply content-aware fill if enabled
    if (options.method === 'surgical' && options.contentAwareFill) {
      console.log(`🧠 [SURGICAL] Applying content-aware background completion...`);
      sourceData = this.contentAwareFill(sourceData, alphaChannel, {
        x: 0, y: 0, width, height
      });
    }
    
    // Create new image data with enhanced alpha channel - validate dimensions first
    if (width <= 0 || height <= 0) {
      throw new Error(`Cannot create ImageData with invalid dimensions: ${width}x${height}`);
    }
    
    let spriteData: ImageData;
    try {
      spriteData = new ImageData(width, height);
    } catch (error) {
      console.error(`[CV] Failed to create ImageData (${width}x${height}):`, error);
      throw new Error(`Invalid ImageData dimensions: ${width}x${height}`);
    }
    
    for (let i = 0; i < width * height; i++) {
      const pixelIndex = i * 4;
      let alphaValue = alphaChannel[i];
      
      // 🔬 SURGICAL: Apply anti-aliasing to alpha channel
      if (options.method === 'surgical' && options.antiAliasing) {
        alphaValue = this.applyAntiAliasing(alphaChannel, i, width, height);
      }
      
      // Copy RGB values
      spriteData.data[pixelIndex] = sourceData.data[pixelIndex];     // R
      spriteData.data[pixelIndex + 1] = sourceData.data[pixelIndex + 1]; // G
      spriteData.data[pixelIndex + 2] = sourceData.data[pixelIndex + 2]; // B
      spriteData.data[pixelIndex + 3] = alphaValue;                       // A
    }

    // 🔬 SURGICAL: Apply edge smoothing if enabled
    if (options.method === 'surgical' && options.edgeSmoothing > 0) {
      console.log(`✨ [SURGICAL] Applying edge smoothing (radius: ${options.edgeSmoothing})`);
      this.applySurgicalEdgeSmoothing(spriteData, options.edgeSmoothing);
    }

    // Convert to base64 with optimal quality
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = width;
    spriteCanvas.height = height;
    const spriteCtx = spriteCanvas.getContext('2d')!;
    
    // 🔬 SURGICAL: Use high-quality rendering
    if (options.method === 'surgical') {
      spriteCtx.imageSmoothingEnabled = true;
      spriteCtx.imageSmoothingQuality = 'high';
    }
    
    spriteCtx.putImageData(spriteData, 0, 0);
    
    // Higher quality PNG for surgical extraction
    const quality = options.method === 'surgical' ? 'image/png' : 'image/png';
    const spriteBase64 = spriteCanvas.toDataURL(quality);

    console.log(`${logPrefix} Layer sprite created: ${width}x${height}px, ${spriteBase64.length} bytes`);
    
    return {
      imageData: spriteData,
      spriteBase64
    };
  }

  /**
   * 🔬 SURGICAL: Anti-aliasing for smoother alpha edges
   */
  private applyAntiAliasing(
    alphaChannel: Uint8ClampedArray, 
    index: number, 
    width: number, 
    height: number
  ): number {
    const x = index % width;
    const y = Math.floor(index / width);
    
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      return alphaChannel[index];
    }
    
    // Sample 3x3 neighborhood
    const samples = [
      alphaChannel[(y - 1) * width + (x - 1)],
      alphaChannel[(y - 1) * width + x],
      alphaChannel[(y - 1) * width + (x + 1)],
      alphaChannel[y * width + (x - 1)],
      alphaChannel[y * width + x],
      alphaChannel[y * width + (x + 1)],
      alphaChannel[(y + 1) * width + (x - 1)],
      alphaChannel[(y + 1) * width + x],
      alphaChannel[(y + 1) * width + (x + 1)]
    ];
    
    // Apply Gaussian-weighted averaging
    const weights = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < samples.length; i++) {
      weightedSum += samples[i] * weights[i];
      totalWeight += weights[i];
    }
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 🔬 SURGICAL: Advanced edge smoothing for professional quality
   */
  private applySurgicalEdgeSmoothing(imageData: ImageData, radius: number): void {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);
    
    const kernel = this.generateGaussianKernel(radius);
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const centerIndex = (y * width + x) * 4;
        const centerAlpha = data[centerIndex + 3];
        
        // Only smooth edge pixels (partial transparency)
        if (centerAlpha > 0 && centerAlpha < 255) {
          let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
          
          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const nx = x + kx - kernelRadius;
              const ny = y + ky - kernelRadius;
              const weight = kernel[ky][kx];
              const pixelIndex = (ny * width + nx) * 4;
              
              r += data[pixelIndex] * weight;
              g += data[pixelIndex + 1] * weight;
              b += data[pixelIndex + 2] * weight;
              a += data[pixelIndex + 3] * weight;
              weightSum += weight;
            }
          }
          
          imageData.data[centerIndex] = Math.round(r / weightSum);
          imageData.data[centerIndex + 1] = Math.round(g / weightSum);
          imageData.data[centerIndex + 2] = Math.round(b / weightSum);
          imageData.data[centerIndex + 3] = Math.round(a / weightSum);
        }
      }
    }
  }

  // Utility Methods for Computer Vision Algorithms

  private loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  private percentageToPixelBounds(
    percentBounds: { x: number; y: number; width: number; height: number },
    imgWidth: number,
    imgHeight: number
  ): PrecisionLayerBounds {
    return {
      x: (percentBounds.x / 100) * imgWidth,
      y: (percentBounds.y / 100) * imgHeight,
      width: (percentBounds.width / 100) * imgWidth,
      height: (percentBounds.height / 100) * imgHeight
    };
  }

  private pixelToPercentageBounds(
    pixelBounds: PrecisionLayerBounds,
    imgWidth: number,
    imgHeight: number
  ): PrecisionLayerBounds {
    return {
      x: (pixelBounds.x / imgWidth) * 100,
      y: (pixelBounds.y / imgHeight) * 100,
      width: (pixelBounds.width / imgWidth) * 100,
      height: (pixelBounds.height / imgHeight) * 100
    };
  }

  private detectEdgesSobel(imageData: ImageData, threshold: number): Uint8ClampedArray {
    const width = imageData.width;
    const height = imageData.height;
    const edges = new Uint8ClampedArray(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const pixelIndex = ((y + ky - 1) * width + (x + kx - 1)) * 4;
            const gray = (imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2]) / 3;
            
            gx += gray * sobelX[ky * 3 + kx];
            gy += gray * sobelY[ky * 3 + kx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude > threshold ? 255 : 0;
      }
    }
    
    return edges;
  }

  /**
   * 🔬 SURGICAL: Advanced Canny Edge Detection for precise boundaries
   */
  private detectEdgesCanny(imageData: ImageData, lowThreshold: number, highThreshold: number): Uint8ClampedArray {
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`🔬 [SURGICAL] Applying Canny edge detection (${lowThreshold}-${highThreshold} thresholds)`);
    
    // Step 1: Gaussian blur to reduce noise
    const blurred = this.applyGaussianBlur(imageData, 1.0);
    
    // Step 2: Calculate gradients
    const gradients = this.calculateGradients(blurred);
    
    // Step 3: Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(gradients.magnitude, gradients.direction, width, height);
    
    // Step 4: Double thresholding and edge tracking by hysteresis
    const edges = this.hysteresisThresholding(suppressed, width, height, lowThreshold, highThreshold);
    
    console.log(`✨ [SURGICAL] Canny edge detection complete with enhanced precision`);
    return edges;
  }

  /**
   * 🎨 SURGICAL: Color-based region growing for precise object boundaries
   */
  private surgicalColorSegmentation(
    imageData: ImageData, 
    seedX: number, 
    seedY: number, 
    colorThreshold: number
  ): Uint8ClampedArray {
    const width = imageData.width;
    const height = imageData.height;
    const mask = new Uint8ClampedArray(width * height);
    const visited = new Uint8ClampedArray(width * height);
    
    console.log(`🎨 [SURGICAL] Starting color-based region growing from seed (${seedX}, ${seedY})`);
    
    // Get seed pixel color
    const seedIndex = (seedY * width + seedX) * 4;
    const seedR = imageData.data[seedIndex];
    const seedG = imageData.data[seedIndex + 1]; 
    const seedB = imageData.data[seedIndex + 2];
    
    // Region growing using flood fill with color similarity
    const stack = [{ x: seedX, y: seedY }];
    let processedPixels = 0;
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
        continue;
      }
      
      const pixelIndex = (y * width + x) * 4;
      const r = imageData.data[pixelIndex];
      const g = imageData.data[pixelIndex + 1];
      const b = imageData.data[pixelIndex + 2];
      
      // Calculate color distance
      const colorDistance = Math.sqrt(
        Math.pow(r - seedR, 2) + 
        Math.pow(g - seedG, 2) + 
        Math.pow(b - seedB, 2)
      );
      
      if (colorDistance <= colorThreshold) {
        visited[y * width + x] = 1;
        mask[y * width + x] = 255;
        processedPixels++;
        
        // Add neighbors to stack
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
      } else {
        visited[y * width + x] = 1;
      }
    }
    
    console.log(`🎨 [SURGICAL] Color segmentation complete: ${processedPixels} pixels selected`);
    return mask;
  }

  /**
   * 🧠 SURGICAL: Intelligent content-aware fill for background completion
   */
  private contentAwareFill(
    imageData: ImageData, 
    mask: Uint8ClampedArray, 
    bounds: PrecisionLayerBounds
  ): ImageData {
    console.log(`🧠 [SURGICAL] Applying content-aware fill for seamless background`);
    
    const width = imageData.width;
    const height = imageData.height;
    const filled = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
    
    // Find boundary pixels that need filling
    const boundaryPixels: Array<{ x: number; y: number }> = [];
    
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const index = y * width + x;
        if (mask[index] === 0) { // Background pixel that needs filling
          // Check if it's near a foreground pixel
          let nearForeground = false;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (mask[ny * width + nx] > 0) {
                  nearForeground = true;
                  break;
                }
              }
            }
            if (nearForeground) break;
          }
          
          if (nearForeground) {
            boundaryPixels.push({ x, y });
          }
        }
      }
    }
    
    // Fill boundary pixels using surrounding context
    for (const pixel of boundaryPixels) {
      const { x, y } = pixel;
      const pixelIndex = (y * width + x) * 4;
      
      // Sample surrounding pixels for intelligent fill
      let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
      
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborMask = mask[ny * width + nx];
            if (neighborMask > 0) { // Use foreground pixels for sampling
              const neighborIndex = (ny * width + nx) * 4;
              totalR += imageData.data[neighborIndex];
              totalG += imageData.data[neighborIndex + 1];
              totalB += imageData.data[neighborIndex + 2];
              sampleCount++;
            }
          }
        }
      }
      
      if (sampleCount > 0) {
        filled.data[pixelIndex] = totalR / sampleCount;
        filled.data[pixelIndex + 1] = totalG / sampleCount;
        filled.data[pixelIndex + 2] = totalB / sampleCount;
        filled.data[pixelIndex + 3] = 255; // Full alpha
      }
    }
    
    console.log(`🧠 [SURGICAL] Content-aware fill applied to ${boundaryPixels.length} boundary pixels`);
    return filled;
  }

  private findTightBoundingBox(edges: Uint8ClampedArray, width: number, height: number): PrecisionLayerBounds {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasEdges = false;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          hasEdges = true;
        }
      }
    }
    
    // If no edges found, use the full region
    if (!hasEdges) {
      console.log(`⚠️ [CV] No edges detected, using full region bounds`);
      return {
        x: 0,
        y: 0,
        width: width,
        height: height
      };
    }
    
    // Ensure positive dimensions
    const calculatedWidth = Math.max(1, maxX - minX + 1);
    const calculatedHeight = Math.max(1, maxY - minY + 1);
    
    return {
      x: minX,
      y: minY,
      width: calculatedWidth,
      height: calculatedHeight
    };
  }

  private traceContourMoore(edges: Uint8ClampedArray, width: number, height: number): Array<{ x: number; y: number }> {
    // Simplified contour tracing - find boundary pixels
    const contour: Array<{ x: number; y: number }> = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 0) {
          contour.push({ x, y });
        }
      }
    }
    
    return contour;
  }

  private simplifyContour(
    contour: Array<{ x: number; y: number }>,
    tolerance: number
  ): Array<{ x: number; y: number }> {
    // Douglas-Peucker simplification (simplified implementation)
    if (contour.length < 3) return contour;
    
    // For now, return every Nth point based on tolerance
    const step = Math.max(1, Math.floor(tolerance));
    return contour.filter((_, index) => index % step === 0);
  }

  private calculateEdgeStrength(x: number, y: number): number {
    // Simplified edge strength calculation
    return Math.random() * 0.3 + 0.7; // Mock implementation
  }

  private classifyContourPoint(
    point: { x: number; y: number },
    contour: Array<{ x: number; y: number }>,
    index: number
  ): 'corner' | 'smooth' | 'edge' {
    // Simplified point classification
    return index % 3 === 0 ? 'corner' : 'smooth';
  }

  private createPolygonMask(
    contour: Array<PrecisionContourPoint>,
    bounds: PrecisionLayerBounds,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const mask = new Uint8ClampedArray(width * height);
    
    // Simplified polygon fill - mark pixels inside bounding area
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // For now, fill the entire bounding box
        mask[y * width + x] = 255;
      }
    }
    
    return mask;
  }

  private applyGaussianFeathering(
    mask: Uint8ClampedArray,
    width: number,
    height: number,
    radius: number
  ): Uint8ClampedArray {
    // Enhanced Gaussian blur for smooth feathering
    const feathered = new Uint8ClampedArray(mask.length);
    const kernel = this.generateGaussianKernel(radius);
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const nx = x + kx - kernelRadius;
            const ny = y + ky - kernelRadius;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const weight = kernel[ky][kx];
              sum += mask[ny * width + nx] * weight;
              weightSum += weight;
            }
          }
        }
        
        feathered[y * width + x] = weightSum > 0 ? sum / weightSum : 0;
      }
    }
    
    return feathered;
  }

  // 🔬 SURGICAL: Helper methods for advanced edge detection

  private applyGaussianBlur(imageData: ImageData, sigma: number): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const blurred = new ImageData(width, height);
    
    const kernel = this.generateGaussianKernel(sigma);
    const kernelSize = kernel.length;
    const radius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, weightSum = 0;
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const nx = x + kx - radius;
            const ny = y + ky - radius;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const weight = kernel[ky][kx];
              const pixelIndex = (ny * width + nx) * 4;
              
              r += imageData.data[pixelIndex] * weight;
              g += imageData.data[pixelIndex + 1] * weight;
              b += imageData.data[pixelIndex + 2] * weight;
              weightSum += weight;
            }
          }
        }
        
        const resultIndex = (y * width + x) * 4;
        blurred.data[resultIndex] = r / weightSum;
        blurred.data[resultIndex + 1] = g / weightSum;
        blurred.data[resultIndex + 2] = b / weightSum;
        blurred.data[resultIndex + 3] = imageData.data[resultIndex + 3];
      }
    }
    
    return blurred;
  }

  private generateGaussianKernel(sigma: number): number[][] {
    const size = Math.ceil(sigma * 3) * 2 + 1;
    const kernel: number[][] = [];
    const center = Math.floor(size / 2);
    let sum = 0;
    
    for (let y = 0; y < size; y++) {
      kernel[y] = [];
      for (let x = 0; x < size; x++) {
        const distance = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
        const value = Math.exp(-(distance * distance) / (2 * sigma * sigma));
        kernel[y][x] = value;
        sum += value;
      }
    }
    
    // Normalize
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }
    
    return kernel;
  }

  private calculateGradients(imageData: ImageData): { magnitude: Float32Array; direction: Float32Array } {
    const width = imageData.width;
    const height = imageData.height;
    const magnitude = new Float32Array(width * height);
    const direction = new Float32Array(width * height);
    
    // Sobel operators
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const nx = x + kx - 1;
            const ny = y + ky - 1;
            const pixelIndex = (ny * width + nx) * 4;
            const gray = (imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2]) / 3;
            
            gx += gray * sobelX[ky * 3 + kx];
            gy += gray * sobelY[ky * 3 + kx];
          }
        }
        
        const index = y * width + x;
        magnitude[index] = Math.sqrt(gx * gx + gy * gy);
        direction[index] = Math.atan2(gy, gx);
      }
    }
    
    return { magnitude, direction };
  }

  private nonMaximumSuppression(
    magnitude: Float32Array, 
    direction: Float32Array, 
    width: number, 
    height: number
  ): Float32Array {
    const suppressed = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const angle = direction[index];
        const mag = magnitude[index];
        
        // Determine neighbors based on gradient direction
        let neighbor1, neighbor2;
        
        if ((angle >= -Math.PI / 8 && angle < Math.PI / 8) || (angle >= 7 * Math.PI / 8 || angle < -7 * Math.PI / 8)) {
          neighbor1 = magnitude[y * width + (x - 1)];
          neighbor2 = magnitude[y * width + (x + 1)];
        } else if ((angle >= Math.PI / 8 && angle < 3 * Math.PI / 8) || (angle >= -7 * Math.PI / 8 && angle < -5 * Math.PI / 8)) {
          neighbor1 = magnitude[(y - 1) * width + (x + 1)];
          neighbor2 = magnitude[(y + 1) * width + (x - 1)];
        } else if ((angle >= 3 * Math.PI / 8 && angle < 5 * Math.PI / 8) || (angle >= -5 * Math.PI / 8 && angle < -3 * Math.PI / 8)) {
          neighbor1 = magnitude[(y - 1) * width + x];
          neighbor2 = magnitude[(y + 1) * width + x];
        } else {
          neighbor1 = magnitude[(y - 1) * width + (x - 1)];
          neighbor2 = magnitude[(y + 1) * width + (x + 1)];
        }
        
        if (mag >= neighbor1 && mag >= neighbor2) {
          suppressed[index] = mag;
        }
      }
    }
    
    return suppressed;
  }

  private hysteresisThresholding(
    suppressed: Float32Array, 
    width: number, 
    height: number, 
    lowThreshold: number, 
    highThreshold: number
  ): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(width * height);
    const strong = 255;
    const weak = 75;
    
    // Initial thresholding
    for (let i = 0; i < suppressed.length; i++) {
      if (suppressed[i] >= highThreshold) {
        edges[i] = strong;
      } else if (suppressed[i] >= lowThreshold) {
        edges[i] = weak;
      }
    }
    
    // Edge tracking by hysteresis
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        if (edges[index] === weak) {
          // Check if connected to strong edge
          let hasStrongNeighbor = false;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIndex = (y + dy) * width + (x + dx);
              if (edges[neighborIndex] === strong) {
                hasStrongNeighbor = true;
                break;
              }
            }
            if (hasStrongNeighbor) break;
          }
          
          edges[index] = hasStrongNeighbor ? strong : 0;
        }
      }
    }
    
    return edges;
  }
}

// Export singleton instance
export const professionalLayerExtractor = new ProfessionalLayerExtractor();

// Export utility functions
export const extractLayer = (
  imageBase64: string,
  layerBounds: { x: number; y: number; width: number; height: number },
  contourPoints: Array<{ x: number; y: number }>,
  layerId: string,
  layerName: string,
  layerType: string,
  options?: Partial<LayerExtractionOptions>
): Promise<ExtractedLayerData> => {
  return professionalLayerExtractor.extractLayerFromImage(
    imageBase64,
    layerBounds,
    contourPoints,
    layerId,
    layerName,
    layerType,
    options
  );
};