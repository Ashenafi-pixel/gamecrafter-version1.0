/**
 * Morphological Operations for Sprite Separation
 * Advanced morphological processing to separate connected sprites
 * Part of the multi-algorithm ensemble for sprite detection
 */

export interface MorphologicalResult {
  processedImage: ImageData;
  separatedRegions: SeparatedRegion[];
  operations: string[];
  confidence: number;
  processingTime: number;
}

export interface SeparatedRegion {
  id: number;
  bounds: {x: number, y: number, width: number, height: number};
  pixels: Array<{x: number, y: number}>;
  area: number;
  separationMethod: string;
  confidence: number;
}

export interface StructuringElement {
  shape: 'rectangle' | 'ellipse' | 'cross' | 'custom';
  size: number;
  anchor?: {x: number, y: number};
  kernel?: number[][];
}

export interface MorphologicalOptions {
  operations: Array<'erode' | 'dilate' | 'open' | 'close' | 'gradient' | 'tophat' | 'blackhat'>;
  structuringElement: StructuringElement;
  iterations: number;
  separationMethod: 'watershed' | 'distance_transform' | 'skeleton' | 'projection';
  minRegionSize: number;
  maxRegionSize: number;
}

export class MorphologicalOperations {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main morphological processing pipeline for sprite separation
   */
  async separateSprites(
    imageUrl: string,
    options: Partial<MorphologicalOptions> = {}
  ): Promise<MorphologicalResult> {
    const startTime = performance.now();
    
    console.log('🔧 Starting morphological sprite separation...');
    
    const opts: MorphologicalOptions = {
      operations: ['open', 'close'],
      structuringElement: {
        shape: 'ellipse',
        size: 3
      },
      iterations: 1,
      separationMethod: 'watershed',
      minRegionSize: 100,
      maxRegionSize: 100000,
      ...options
    };

    try {
      // Load and prepare binary image
      const binaryImage = await this.loadAndBinarize(imageUrl);
      
      // Apply morphological operations
      let processedImage = binaryImage;
      const appliedOperations: string[] = [];
      
      for (const operation of opts.operations) {
        processedImage = this.applyMorphologicalOperation(
          processedImage,
          operation,
          opts.structuringElement,
          opts.iterations
        );
        appliedOperations.push(`${operation}(${opts.iterations})`);
      }
      
      // Apply separation algorithm
      const separatedRegions = await this.applySeparationMethod(
        processedImage,
        opts.separationMethod,
        opts
      );
      
      // Calculate confidence
      const confidence = this.calculateSeparationConfidence(separatedRegions, binaryImage);
      
      const processingTime = performance.now() - startTime;
      
      console.log(`✅ Morphological separation complete: ${separatedRegions.length} regions found in ${processingTime.toFixed(2)}ms`);
      
      return {
        processedImage,
        separatedRegions,
        operations: appliedOperations,
        confidence,
        processingTime
      };
      
    } catch (error) {
      console.error('Morphological separation failed:', error);
      throw error;
    }
  }

  /**
   * Load image and convert to binary
   */
  private async loadAndBinarize(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        
        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        const binaryImage = this.toBinary(imageData);
        resolve(binaryImage);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  /**
   * Convert image to binary (black and white)
   */
  private toBinary(imageData: ImageData, threshold: number = 128): ImageData {
    const binary = new ImageData(imageData.width, imageData.height);
    const originalData = imageData.data;
    const binaryData = binary.data;
    
    for (let i = 0; i < originalData.length; i += 4) {
      const alpha = originalData[i + 3];
      
      // Consider pixel as foreground if it has sufficient alpha
      const isForeground = alpha > 25;
      const value = isForeground ? 255 : 0;
      
      binaryData[i] = value;     // R
      binaryData[i + 1] = value; // G
      binaryData[i + 2] = value; // B
      binaryData[i + 3] = 255;   // A
    }
    
    return binary;
  }

  /**
   * Apply morphological operation to binary image
   */
  private applyMorphologicalOperation(
    image: ImageData,
    operation: string,
    structuringElement: StructuringElement,
    iterations: number
  ): ImageData {
    let result = image;
    
    for (let i = 0; i < iterations; i++) {
      switch (operation) {
        case 'erode':
          result = this.erode(result, structuringElement);
          break;
        case 'dilate':
          result = this.dilate(result, structuringElement);
          break;
        case 'open':
          result = this.dilate(this.erode(result, structuringElement), structuringElement);
          break;
        case 'close':
          result = this.erode(this.dilate(result, structuringElement), structuringElement);
          break;
        case 'gradient':
          const dilated = this.dilate(result, structuringElement);
          const eroded = this.erode(result, structuringElement);
          result = this.subtract(dilated, eroded);
          break;
        case 'tophat':
          const opened = this.dilate(this.erode(result, structuringElement), structuringElement);
          result = this.subtract(result, opened);
          break;
        case 'blackhat':
          const closed = this.erode(this.dilate(result, structuringElement), structuringElement);
          result = this.subtract(closed, result);
          break;
      }
    }
    
    console.log(`🔧 Applied ${operation} operation with ${iterations} iteration(s)`);
    return result;
  }

  /**
   * Erosion operation - shrinks foreground objects
   */
  private erode(image: ImageData, structuringElement: StructuringElement): ImageData {
    const kernel = this.createKernel(structuringElement);
    const result = new ImageData(image.width, image.height);
    const data = image.data;
    const resultData = result.data;
    
    const kernelSize = Math.sqrt(kernel.length);
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        let minValue = 255;
        
        // Apply kernel
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - kernelRadius;
            const py = y + ky - kernelRadius;
            
            if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
              if (kernel[ky * kernelSize + kx] === 1) {
                const pixelIndex = (py * image.width + px) * 4;
                minValue = Math.min(minValue, data[pixelIndex]);
              }
            } else {
              // Outside image boundary - treat as background
              minValue = 0;
            }
          }
        }
        
        const resultIndex = (y * image.width + x) * 4;
        resultData[resultIndex] = minValue;
        resultData[resultIndex + 1] = minValue;
        resultData[resultIndex + 2] = minValue;
        resultData[resultIndex + 3] = 255;
      }
    }
    
    return result;
  }

  /**
   * Dilation operation - expands foreground objects
   */
  private dilate(image: ImageData, structuringElement: StructuringElement): ImageData {
    const kernel = this.createKernel(structuringElement);
    const result = new ImageData(image.width, image.height);
    const data = image.data;
    const resultData = result.data;
    
    const kernelSize = Math.sqrt(kernel.length);
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        let maxValue = 0;
        
        // Apply kernel
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - kernelRadius;
            const py = y + ky - kernelRadius;
            
            if (px >= 0 && px < image.width && py >= 0 && py < image.height) {
              if (kernel[ky * kernelSize + kx] === 1) {
                const pixelIndex = (py * image.width + px) * 4;
                maxValue = Math.max(maxValue, data[pixelIndex]);
              }
            }
          }
        }
        
        const resultIndex = (y * image.width + x) * 4;
        resultData[resultIndex] = maxValue;
        resultData[resultIndex + 1] = maxValue;
        resultData[resultIndex + 2] = maxValue;
        resultData[resultIndex + 3] = 255;
      }
    }
    
    return result;
  }

  /**
   * Subtract one image from another
   */
  private subtract(image1: ImageData, image2: ImageData): ImageData {
    const result = new ImageData(image1.width, image1.height);
    const data1 = image1.data;
    const data2 = image2.data;
    const resultData = result.data;
    
    for (let i = 0; i < data1.length; i += 4) {
      const diff = Math.max(0, data1[i] - data2[i]);
      resultData[i] = diff;
      resultData[i + 1] = diff;
      resultData[i + 2] = diff;
      resultData[i + 3] = 255;
    }
    
    return result;
  }

  /**
   * Create morphological kernel based on structuring element
   */
  private createKernel(structuringElement: StructuringElement): number[] {
    if (structuringElement.kernel) {
      return structuringElement.kernel.flat();
    }
    
    const size = structuringElement.size;
    const kernel = new Array(size * size).fill(0);
    const center = Math.floor(size / 2);
    
    switch (structuringElement.shape) {
      case 'rectangle':
        kernel.fill(1);
        break;
        
      case 'ellipse':
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= center) {
              kernel[y * size + x] = 1;
            }
          }
        }
        break;
        
      case 'cross':
        // Horizontal line
        for (let x = 0; x < size; x++) {
          kernel[center * size + x] = 1;
        }
        // Vertical line
        for (let y = 0; y < size; y++) {
          kernel[y * size + center] = 1;
        }
        break;
        
      case 'custom':
        // Use provided kernel or default to rectangle
        if (!structuringElement.kernel) {
          kernel.fill(1);
        }
        break;
    }
    
    return kernel;
  }

  /**
   * Apply separation method to processed image
   */
  private async applySeparationMethod(
    image: ImageData,
    method: string,
    options: MorphologicalOptions
  ): Promise<SeparatedRegion[]> {
    switch (method) {
      case 'watershed':
        return this.watershedSeparation(image, options);
      case 'distance_transform':
        return this.distanceTransformSeparation(image, options);
      case 'skeleton':
        return this.skeletonSeparation(image, options);
      case 'projection':
        return this.projectionSeparation(image, options);
      default:
        return this.watershedSeparation(image, options);
    }
  }

  /**
   * Watershed algorithm for sprite separation
   */
  private watershedSeparation(image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    console.log('🌊 Applying watershed separation...');
    
    // Compute distance transform
    const distanceMap = this.computeDistanceTransform(image);
    
    // Find local maxima as seeds
    const seeds = this.findLocalMaxima(distanceMap, 3);
    
    // Apply watershed algorithm
    const watershedMap = this.watershed(distanceMap, seeds);
    
    // Extract regions from watershed map
    const regions = this.extractRegionsFromMap(watershedMap, image, options);
    
    console.log(`🌊 Watershed found ${regions.length} regions`);
    return regions;
  }

  /**
   * Distance transform-based separation
   */
  private distanceTransformSeparation(image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    console.log('📏 Applying distance transform separation...');
    
    // Compute distance transform
    const distanceMap = this.computeDistanceTransform(image);
    
    // Threshold distance map to find separation points
    const maxDistance = Math.max(...distanceMap);
    const threshold = maxDistance * 0.7; // Use 70% of max distance
    
    // Create binary mask from thresholded distance map
    const separatedImage = new ImageData(image.width, image.height);
    const separatedData = separatedImage.data;
    
    for (let i = 0; i < distanceMap.length; i++) {
      const value = distanceMap[i] > threshold ? 255 : 0;
      const pixelIndex = i * 4;
      separatedData[pixelIndex] = value;
      separatedData[pixelIndex + 1] = value;
      separatedData[pixelIndex + 2] = value;
      separatedData[pixelIndex + 3] = 255;
    }
    
    // Find connected components in separated image
    const regions = this.findConnectedComponents(separatedImage, options);
    
    console.log(`📏 Distance transform found ${regions.length} regions`);
    return regions;
  }

  /**
   * Skeleton-based separation
   */
  private skeletonSeparation(image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    console.log('🦴 Applying skeleton separation...');
    
    // Create skeleton through iterative thinning
    const skeleton = this.createSkeleton(image);
    
    // Find branch points and endpoints in skeleton
    const branchPoints = this.findBranchPoints(skeleton);
    
    // Use branch points to guide separation
    const regions = this.separateUsingSkeleton(image, skeleton, branchPoints, options);
    
    console.log(`🦴 Skeleton found ${regions.length} regions`);
    return regions;
  }

  /**
   * Projection-based separation (for text)
   */
  private projectionSeparation(image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    console.log('📊 Applying projection separation...');
    
    // Calculate horizontal and vertical projections
    const horizontalProjection = this.calculateHorizontalProjection(image);
    const verticalProjection = this.calculateVerticalProjection(image);
    
    // Find valleys in projections (separation points)
    const verticalCuts = this.findProjectionValleys(verticalProjection, image.width);
    const horizontalCuts = this.findProjectionValleys(horizontalProjection, image.height);
    
    // Use cuts to create regions
    const regions = this.createRegionsFromCuts(image, verticalCuts, horizontalCuts, options);
    
    console.log(`📊 Projection found ${regions.length} regions`);
    return regions;
  }

  /**
   * Compute distance transform using Euclidean distance
   */
  private computeDistanceTransform(image: ImageData): number[] {
    const width = image.width;
    const height = image.height;
    const data = image.data;
    const distances = new Array(width * height).fill(Infinity);
    
    // Initialize distances for foreground pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        if (data[pixelIndex] > 128) { // Foreground pixel
          distances[index] = 0;
        }
      }
    }
    
    // Forward pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        if (x > 0) {
          distances[index] = Math.min(distances[index], distances[index - 1] + 1);
        }
        if (y > 0) {
          distances[index] = Math.min(distances[index], distances[index - width] + 1);
        }
        if (x > 0 && y > 0) {
          distances[index] = Math.min(distances[index], distances[index - width - 1] + Math.SQRT2);
        }
        if (x < width - 1 && y > 0) {
          distances[index] = Math.min(distances[index], distances[index - width + 1] + Math.SQRT2);
        }
      }
    }
    
    // Backward pass
    for (let y = height - 1; y >= 0; y--) {
      for (let x = width - 1; x >= 0; x--) {
        const index = y * width + x;
        
        if (x < width - 1) {
          distances[index] = Math.min(distances[index], distances[index + 1] + 1);
        }
        if (y < height - 1) {
          distances[index] = Math.min(distances[index], distances[index + width] + 1);
        }
        if (x < width - 1 && y < height - 1) {
          distances[index] = Math.min(distances[index], distances[index + width + 1] + Math.SQRT2);
        }
        if (x > 0 && y < height - 1) {
          distances[index] = Math.min(distances[index], distances[index + width - 1] + Math.SQRT2);
        }
      }
    }
    
    return distances;
  }

  /**
   * Find local maxima in distance map
   */
  private findLocalMaxima(distanceMap: number[], windowSize: number): Array<{x: number, y: number, value: number}> {
    const width = Math.sqrt(distanceMap.length);
    const height = width;
    const maxima: Array<{x: number, y: number, value: number}> = [];
    const radius = Math.floor(windowSize / 2);
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const centerIndex = y * width + x;
        const centerValue = distanceMap[centerIndex];
        
        if (centerValue < 2) continue; // Skip points too close to boundary
        
        let isMaximum = true;
        
        // Check if this is a local maximum
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const neighborIndex = (y + dy) * width + (x + dx);
            if (distanceMap[neighborIndex] > centerValue) {
              isMaximum = false;
              break;
            }
          }
          if (!isMaximum) break;
        }
        
        if (isMaximum) {
          maxima.push({x, y, value: centerValue});
        }
      }
    }
    
    // Sort by value (strongest first)
    maxima.sort((a, b) => b.value - a.value);
    
    console.log(`🎯 Found ${maxima.length} local maxima`);
    return maxima;
  }

  /**
   * Simple watershed implementation
   */
  private watershed(distanceMap: number[], seeds: Array<{x: number, y: number, value: number}>): number[] {
    const width = Math.sqrt(distanceMap.length);
    const height = width;
    const labels = new Array(width * height).fill(0);
    const queue: Array<{x: number, y: number, label: number}> = [];
    
    // Initialize with seeds
    seeds.forEach((seed, index) => {
      const label = index + 1;
      const seedIndex = seed.y * width + seed.x;
      labels[seedIndex] = label;
      queue.push({x: seed.x, y: seed.y, label});
    });
    
    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Check 4-connected neighbors
      const neighbors = [
        {x: current.x + 1, y: current.y},
        {x: current.x - 1, y: current.y},
        {x: current.x, y: current.y + 1},
        {x: current.x, y: current.y - 1}
      ];
      
      for (const neighbor of neighbors) {
        if (neighbor.x >= 0 && neighbor.x < width && neighbor.y >= 0 && neighbor.y < height) {
          const neighborIndex = neighbor.y * width + neighbor.x;
          
          if (labels[neighborIndex] === 0 && distanceMap[neighborIndex] > 0) {
            labels[neighborIndex] = current.label;
            queue.push({x: neighbor.x, y: neighbor.y, label: current.label});
          }
        }
      }
    }
    
    return labels;
  }

  /**
   * Extract regions from watershed or other label map
   */
  private extractRegionsFromMap(labelMap: number[], image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    const width = image.width;
    const height = image.height;
    const regionPixels = new Map<number, Array<{x: number, y: number}>>();
    
    // Group pixels by label
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const label = labelMap[index];
        
        if (label > 0) {
          if (!regionPixels.has(label)) {
            regionPixels.set(label, []);
          }
          regionPixels.get(label)!.push({x, y});
        }
      }
    }
    
    // Create regions
    const regions: SeparatedRegion[] = [];
    let regionId = 0;
    
    for (const [label, pixels] of regionPixels) {
      if (pixels.length >= options.minRegionSize && pixels.length <= options.maxRegionSize) {
        // Calculate bounding box
        let minX = pixels[0].x, maxX = pixels[0].x;
        let minY = pixels[0].y, maxY = pixels[0].y;
        
        for (const pixel of pixels) {
          minX = Math.min(minX, pixel.x);
          maxX = Math.max(maxX, pixel.x);
          minY = Math.min(minY, pixel.y);
          maxY = Math.max(maxY, pixel.y);
        }
        
        regions.push({
          id: regionId++,
          bounds: {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
          },
          pixels,
          area: pixels.length,
          separationMethod: 'watershed',
          confidence: 0.8 // Default confidence
        });
      }
    }
    
    return regions;
  }

  /**
   * Find connected components for other separation methods
   */
  private findConnectedComponents(image: ImageData, options: MorphologicalOptions): SeparatedRegion[] {
    const width = image.width;
    const height = image.height;
    const data = image.data;
    const visited = new Uint8Array(width * height);
    const regions: SeparatedRegion[] = [];
    let regionId = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        if (data[pixelIndex] > 128 && visited[index] === 0) {
          const pixels = this.floodFill(image, x, y, visited);
          
          if (pixels.length >= options.minRegionSize && pixels.length <= options.maxRegionSize) {
            // Calculate bounding box
            let minX = pixels[0].x, maxX = pixels[0].x;
            let minY = pixels[0].y, maxY = pixels[0].y;
            
            for (const pixel of pixels) {
              minX = Math.min(minX, pixel.x);
              maxX = Math.max(maxX, pixel.x);
              minY = Math.min(minY, pixel.y);
              maxY = Math.max(maxY, pixel.y);
            }
            
            regions.push({
              id: regionId++,
              bounds: {
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
              },
              pixels,
              area: pixels.length,
              separationMethod: 'connected_components',
              confidence: 0.7
            });
          }
        }
      }
    }
    
    return regions;
  }

  /**
   * Flood fill for connected component analysis
   */
  private floodFill(image: ImageData, startX: number, startY: number, visited: Uint8Array): Array<{x: number, y: number}> {
    const width = image.width;
    const height = image.height;
    const data = image.data;
    const pixels: Array<{x: number, y: number}> = [];
    const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[index] === 1) {
        continue;
      }
      
      const pixelIndex = index * 4;
      if (data[pixelIndex] <= 128) { // Background pixel
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

  /**
   * Calculate horizontal projection
   */
  private calculateHorizontalProjection(image: ImageData): number[] {
    const width = image.width;
    const height = image.height;
    const data = image.data;
    const projection = new Array(height).fill(0);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        if (data[pixelIndex] > 128) {
          projection[y]++;
        }
      }
    }
    
    return projection;
  }

  /**
   * Calculate vertical projection
   */
  private calculateVerticalProjection(image: ImageData): number[] {
    const width = image.width;
    const height = image.height;
    const data = image.data;
    const projection = new Array(width).fill(0);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pixelIndex = (y * width + x) * 4;
        if (data[pixelIndex] > 128) {
          projection[x]++;
        }
      }
    }
    
    return projection;
  }

  /**
   * Find valleys in projection for separation
   */
  private findProjectionValleys(projection: number[], size: number): number[] {
    const valleys: number[] = [];
    const smoothed = this.smoothProjection(projection);
    
    // Find local minima
    for (let i = 1; i < smoothed.length - 1; i++) {
      if (smoothed[i] < smoothed[i - 1] && smoothed[i] < smoothed[i + 1] && smoothed[i] === 0) {
        valleys.push(i);
      }
    }
    
    return valleys;
  }

  /**
   * Smooth projection to reduce noise
   */
  private smoothProjection(projection: number[]): number[] {
    const smoothed = new Array(projection.length);
    const kernelSize = 3;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let i = 0; i < projection.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = -kernelRadius; j <= kernelRadius; j++) {
        const index = i + j;
        if (index >= 0 && index < projection.length) {
          sum += projection[index];
          count++;
        }
      }
      
      smoothed[i] = sum / count;
    }
    
    return smoothed;
  }

  /**
   * Create regions from projection cuts
   */
  private createRegionsFromCuts(
    image: ImageData,
    verticalCuts: number[],
    horizontalCuts: number[],
    options: MorphologicalOptions
  ): SeparatedRegion[] {
    const regions: SeparatedRegion[] = [];
    let regionId = 0;
    
    // Add boundaries
    const xCuts = [0, ...verticalCuts, image.width - 1].sort((a, b) => a - b);
    const yCuts = [0, ...horizontalCuts, image.height - 1].sort((a, b) => a - b);
    
    // Create regions from grid
    for (let i = 0; i < xCuts.length - 1; i++) {
      for (let j = 0; j < yCuts.length - 1; j++) {
        const x1 = xCuts[i];
        const x2 = xCuts[i + 1];
        const y1 = yCuts[j];
        const y2 = yCuts[j + 1];
        
        const pixels = this.extractPixelsFromRegion(image, x1, y1, x2, y2);
        
        if (pixels.length >= options.minRegionSize && pixels.length <= options.maxRegionSize) {
          regions.push({
            id: regionId++,
            bounds: {
              x: x1,
              y: y1,
              width: x2 - x1,
              height: y2 - y1
            },
            pixels,
            area: pixels.length,
            separationMethod: 'projection',
            confidence: 0.6
          });
        }
      }
    }
    
    return regions;
  }

  /**
   * Extract pixels from rectangular region
   */
  private extractPixelsFromRegion(
    image: ImageData,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Array<{x: number, y: number}> {
    const pixels: Array<{x: number, y: number}> = [];
    const data = image.data;
    const width = image.width;
    
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const pixelIndex = (y * width + x) * 4;
        if (data[pixelIndex] > 128) {
          pixels.push({x, y});
        }
      }
    }
    
    return pixels;
  }

  /**
   * Skeleton creation and branch point methods (simplified versions)
   */
  private createSkeleton(image: ImageData): ImageData {
    // Simplified skeletonization using iterative thinning
    let current = this.copyImageData(image);
    let changed = true;
    
    while (changed) {
      changed = false;
      const thinned = this.thinningIteration(current);
      
      // Check if anything changed
      for (let i = 0; i < current.data.length; i += 4) {
        if (current.data[i] !== thinned.data[i]) {
          changed = true;
          break;
        }
      }
      
      current = thinned;
    }
    
    return current;
  }

  private copyImageData(image: ImageData): ImageData {
    const copy = new ImageData(image.width, image.height);
    copy.data.set(image.data);
    return copy;
  }

  private thinningIteration(image: ImageData): ImageData {
    // Simplified Zhang-Suen thinning algorithm
    const result = this.copyImageData(image);
    // Implementation would go here - this is a placeholder
    return result;
  }

  private findBranchPoints(skeleton: ImageData): Array<{x: number, y: number}> {
    // Find points with more than 2 neighbors
    const branchPoints: Array<{x: number, y: number}> = [];
    // Implementation would go here - this is a placeholder
    return branchPoints;
  }

  private separateUsingSkeleton(
    image: ImageData,
    skeleton: ImageData,
    branchPoints: Array<{x: number, y: number}>,
    options: MorphologicalOptions
  ): SeparatedRegion[] {
    // Use skeleton information to guide separation
    // This is a placeholder - real implementation would be more complex
    return this.findConnectedComponents(image, options);
  }

  /**
   * Calculate confidence for separation quality
   */
  private calculateSeparationConfidence(regions: SeparatedRegion[], originalImage: ImageData): number {
    if (regions.length === 0) return 0;
    
    // Factors for confidence calculation
    const expectedRegionCount = 5; // For WILD + symbol
    const countScore = Math.max(0, 1 - Math.abs(regions.length - expectedRegionCount) / expectedRegionCount);
    
    // Size consistency
    const sizes = regions.map(r => r.area);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const sizeVariance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    const consistencyScore = Math.max(0, 1 - sizeVariance / (avgSize * avgSize));
    
    // Overall confidence
    const confidence = (countScore + consistencyScore) / 2;
    
    console.log(`📊 Separation confidence: ${confidence.toFixed(3)} (count: ${countScore.toFixed(3)}, consistency: ${consistencyScore.toFixed(3)})`);
    
    return confidence;
  }
}

// Export singleton instance
export const morphologicalOperations = new MorphologicalOperations();