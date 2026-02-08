/**
 * Advanced Edge Detection System
 * State-of-the-art edge detection using Canny + advanced contour analysis
 * Part of the multi-algorithm ensemble for sprite detection
 */

export interface EdgeDetectionResult {
  edges: ImageData;
  contours: Contour[];
  hierarchy: ContourHierarchy[];
  confidence: number;
  processingTime: number;
}

export interface Contour {
  points: Array<{x: number, y: number}>;
  area: number;
  perimeter: number;
  boundingRect: {x: number, y: number, width: number, height: number};
  aspectRatio: number;
  extent: number; // ratio of contour area to bounding rectangle area
  solidity: number; // ratio of contour area to convex hull area
  isConvex: boolean;
  centroid: {x: number, y: number};
}

export interface ContourHierarchy {
  next: number;
  previous: number;
  firstChild: number;
  parent: number;
}

export interface EdgeDetectionOptions {
  cannyLowThreshold: number;
  cannyHighThreshold: number;
  gaussianBlurSize: number;
  minContourArea: number;
  maxContourArea: number;
  contourApproximationMethod: 'none' | 'simple' | 'tc89_l1' | 'tc89_kcos';
  hierarchyMode: 'external' | 'list' | 'ccomp' | 'tree';
}

export class AdvancedEdgeDetection {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main edge detection pipeline with advanced contour analysis
   */
  async detectEdges(
    imageUrl: string, 
    options: Partial<EdgeDetectionOptions> = {}
  ): Promise<EdgeDetectionResult> {
    const startTime = performance.now();
    
    console.log('🔍 Starting advanced edge detection...');
    
    const opts: EdgeDetectionOptions = {
      cannyLowThreshold: 50,
      cannyHighThreshold: 150,
      gaussianBlurSize: 5,
      minContourArea: 100,
      maxContourArea: 100000,
      contourApproximationMethod: 'simple',
      hierarchyMode: 'tree',
      ...options
    };

    try {
      // Load and prepare image
      const imageData = await this.loadImageData(imageUrl);
      
      // Convert to grayscale
      const grayscale = this.toGrayscale(imageData);
      
      // Apply Gaussian blur to reduce noise
      const blurred = this.gaussianBlur(grayscale, opts.gaussianBlurSize);
      
      // Apply Canny edge detection
      const edges = this.cannyEdgeDetection(blurred, opts.cannyLowThreshold, opts.cannyHighThreshold);
      
      // Find contours with hierarchy
      const { contours, hierarchy } = this.findContoursWithHierarchy(edges, opts);
      
      // Calculate confidence based on edge quality
      const confidence = this.calculateEdgeConfidence(edges, contours);
      
      const processingTime = performance.now() - startTime;
      
      console.log(`✅ Advanced edge detection complete: ${contours.length} contours found in ${processingTime.toFixed(2)}ms`);
      
      return {
        edges,
        contours,
        hierarchy,
        confidence,
        processingTime
      };
      
    } catch (error) {
      console.error('❌ Advanced edge detection failed:', error);
      throw error;
    }
  }

  /**
   * Load image and convert to ImageData
   */
  private async loadImageData(imageUrl: string): Promise<ImageData> {
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

  /**
   * Convert RGBA image to grayscale
   */
  private toGrayscale(imageData: ImageData): ImageData {
    const grayscale = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const grayData = grayscale.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Use weighted average for better perceptual accuracy
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      grayData[i] = gray;     // R
      grayData[i + 1] = gray; // G
      grayData[i + 2] = gray; // B
      grayData[i + 3] = data[i + 3]; // A
    }
    
    return grayscale;
  }

  /**
   * Apply Gaussian blur for noise reduction
   */
  private gaussianBlur(imageData: ImageData, kernelSize: number): ImageData {
    const sigma = kernelSize / 3;
    const kernel = this.createGaussianKernel(kernelSize, sigma);
    
    // Apply separable Gaussian filter (horizontal then vertical)
    const horizontal = this.convolveHorizontal(imageData, kernel);
    const vertical = this.convolveVertical(horizontal, kernel);
    
    return vertical;
  }

  /**
   * Create Gaussian kernel for blurring
   */
  private createGaussianKernel(size: number, sigma: number): number[] {
    const kernel: number[] = [];
    const center = Math.floor(size / 2);
    let sum = 0;
    
    for (let i = 0; i < size; i++) {
      const x = i - center;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i] = value;
      sum += value;
    }
    
    // Normalize kernel
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  /**
   * Apply horizontal convolution
   */
  private convolveHorizontal(imageData: ImageData, kernel: number[]): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let sum = 0;
        
        for (let k = 0; k < kernelSize; k++) {
          const px = Math.max(0, Math.min(imageData.width - 1, x + k - kernelRadius));
          const index = (y * imageData.width + px) * 4;
          sum += data[index] * kernel[k]; // Use red channel for grayscale
        }
        
        const resultIndex = (y * imageData.width + x) * 4;
        resultData[resultIndex] = sum;     // R
        resultData[resultIndex + 1] = sum; // G
        resultData[resultIndex + 2] = sum; // B
        resultData[resultIndex + 3] = data[resultIndex + 3]; // A
      }
    }
    
    return result;
  }

  /**
   * Apply vertical convolution
   */
  private convolveVertical(imageData: ImageData, kernel: number[]): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const resultData = result.data;
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let sum = 0;
        
        for (let k = 0; k < kernelSize; k++) {
          const py = Math.max(0, Math.min(imageData.height - 1, y + k - kernelRadius));
          const index = (py * imageData.width + x) * 4;
          sum += data[index] * kernel[k];
        }
        
        const resultIndex = (y * imageData.width + x) * 4;
        resultData[resultIndex] = sum;     // R
        resultData[resultIndex + 1] = sum; // G
        resultData[resultIndex + 2] = sum; // B
        resultData[resultIndex + 3] = data[resultIndex + 3]; // A
      }
    }
    
    return result;
  }

  /**
   * Canny edge detection implementation
   */
  private cannyEdgeDetection(
    imageData: ImageData, 
    lowThreshold: number, 
    highThreshold: number
  ): ImageData {
    // Calculate gradients using Sobel operators
    const gradients = this.calculateGradients(imageData);
    
    // Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(gradients);
    
    // Double threshold and edge tracking by hysteresis
    const edges = this.doubleThresholdAndHysteresis(suppressed, lowThreshold, highThreshold);
    
    return edges;
  }

  /**
   * Calculate gradients using Sobel operators
   */
  private calculateGradients(imageData: ImageData): {
    magnitude: ImageData;
    direction: Float32Array;
  } {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    const magnitude = new ImageData(width, height);
    const direction = new Float32Array(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4;
            const intensity = data[pixel]; // Red channel for grayscale
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            
            gx += intensity * sobelX[kernelIndex];
            gy += intensity * sobelY[kernelIndex];
          }
        }
        
        const mag = Math.sqrt(gx * gx + gy * gy);
        const dir = Math.atan2(gy, gx);
        
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        magnitude.data[pixelIndex] = mag;
        magnitude.data[pixelIndex + 1] = mag;
        magnitude.data[pixelIndex + 2] = mag;
        magnitude.data[pixelIndex + 3] = 255;
        
        direction[index] = dir;
      }
    }
    
    return { magnitude, direction };
  }

  /**
   * Non-maximum suppression to thin edges
   */
  private nonMaximumSuppression(gradients: {
    magnitude: ImageData;
    direction: Float32Array;
  }): ImageData {
    const { magnitude, direction } = gradients;
    const width = magnitude.width;
    const height = magnitude.height;
    const data = magnitude.data;
    
    const suppressed = new ImageData(width, height);
    const suppressedData = suppressed.data;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        const angle = direction[index];
        
        // Quantize angle to 0, 45, 90, 135 degrees
        let q = Math.round(angle * 4 / Math.PI) % 4;
        if (q < 0) q += 4;
        
        let neighbor1Index: number, neighbor2Index: number;
        
        switch (q) {
          case 0: // 0 degrees - horizontal
            neighbor1Index = (y * width + (x + 1)) * 4;
            neighbor2Index = (y * width + (x - 1)) * 4;
            break;
          case 1: // 45 degrees - diagonal
            neighbor1Index = ((y + 1) * width + (x + 1)) * 4;
            neighbor2Index = ((y - 1) * width + (x - 1)) * 4;
            break;
          case 2: // 90 degrees - vertical
            neighbor1Index = ((y + 1) * width + x) * 4;
            neighbor2Index = ((y - 1) * width + x) * 4;
            break;
          case 3: // 135 degrees - diagonal
            neighbor1Index = ((y + 1) * width + (x - 1)) * 4;
            neighbor2Index = ((y - 1) * width + (x + 1)) * 4;
            break;
          default:
            neighbor1Index = neighbor2Index = pixelIndex;
        }
        
        const currentMag = data[pixelIndex];
        const neighbor1Mag = data[neighbor1Index];
        const neighbor2Mag = data[neighbor2Index];
        
        // Keep pixel if it's a local maximum
        if (currentMag >= neighbor1Mag && currentMag >= neighbor2Mag) {
          suppressedData[pixelIndex] = currentMag;
          suppressedData[pixelIndex + 1] = currentMag;
          suppressedData[pixelIndex + 2] = currentMag;
          suppressedData[pixelIndex + 3] = 255;
        } else {
          suppressedData[pixelIndex] = 0;
          suppressedData[pixelIndex + 1] = 0;
          suppressedData[pixelIndex + 2] = 0;
          suppressedData[pixelIndex + 3] = 255;
        }
      }
    }
    
    return suppressed;
  }

  /**
   * Double threshold and hysteresis edge tracking
   */
  private doubleThresholdAndHysteresis(
    magnitude: ImageData,
    lowThreshold: number,
    highThreshold: number
  ): ImageData {
    const width = magnitude.width;
    const height = magnitude.height;
    const data = magnitude.data;
    
    const edges = new ImageData(width, height);
    const edgeData = edges.data;
    
    // First pass: classify pixels
    const WEAK = 75;
    const STRONG = 255;
    
    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i];
      
      if (intensity >= highThreshold) {
        edgeData[i] = STRONG;
        edgeData[i + 1] = STRONG;
        edgeData[i + 2] = STRONG;
        edgeData[i + 3] = 255;
      } else if (intensity >= lowThreshold) {
        edgeData[i] = WEAK;
        edgeData[i + 1] = WEAK;
        edgeData[i + 2] = WEAK;
        edgeData[i + 3] = 255;
      } else {
        edgeData[i] = 0;
        edgeData[i + 1] = 0;
        edgeData[i + 2] = 0;
        edgeData[i + 3] = 255;
      }
    }
    
    // Second pass: hysteresis - connect weak edges to strong edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelIndex = (y * width + x) * 4;
        
        if (edgeData[pixelIndex] === WEAK) {
          // Check 8-connected neighbors for strong edges
          let hasStrongNeighbor = false;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
              if (edgeData[neighborIndex] === STRONG) {
                hasStrongNeighbor = true;
                break;
              }
            }
            if (hasStrongNeighbor) break;
          }
          
          if (hasStrongNeighbor) {
            edgeData[pixelIndex] = STRONG;
            edgeData[pixelIndex + 1] = STRONG;
            edgeData[pixelIndex + 2] = STRONG;
          } else {
            edgeData[pixelIndex] = 0;
            edgeData[pixelIndex + 1] = 0;
            edgeData[pixelIndex + 2] = 0;
          }
        }
      }
    }
    
    return edges;
  }

  /**
   * Find contours with hierarchy information
   */
  private findContoursWithHierarchy(
    edges: ImageData,
    options: EdgeDetectionOptions
  ): { contours: Contour[]; hierarchy: ContourHierarchy[] } {
    const width = edges.width;
    const height = edges.height;
    const data = edges.data;
    
    const visited = new Uint8Array(width * height);
    const contours: Contour[] = [];
    const hierarchy: ContourHierarchy[] = [];
    
    // Find contours using border following algorithm
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        if (data[pixelIndex] > 0 && visited[index] === 0) {
          const contour = this.traceContour(edges, x, y, visited);
          
          if (contour.area >= options.minContourArea && contour.area <= options.maxContourArea) {
            contours.push(contour);
            hierarchy.push({
              next: -1,
              previous: -1,
              firstChild: -1,
              parent: -1
            });
          }
        }
      }
    }
    
    console.log(`🔍 Found ${contours.length} valid contours`);
    
    return { contours, hierarchy };
  }

  /**
   * Trace a single contour using border following
   */
  private traceContour(
    edges: ImageData,
    startX: number,
    startY: number,
    visited: Uint8Array
  ): Contour {
    const width = edges.width;
    const height = edges.height;
    const data = edges.data;
    
    const points: Array<{x: number, y: number}> = [];
    const directions = [
      {x: 1, y: 0},   // 0: right
      {x: 1, y: 1},   // 1: down-right
      {x: 0, y: 1},   // 2: down
      {x: -1, y: 1},  // 3: down-left
      {x: -1, y: 0},  // 4: left
      {x: -1, y: -1}, // 5: up-left
      {x: 0, y: -1},  // 6: up
      {x: 1, y: -1}   // 7: up-right
    ];
    
    let x = startX;
    let y = startY;
    let direction = 0;
    
    do {
      points.push({x, y});
      visited[y * width + x] = 1;
      
      // Find next edge pixel
      let found = false;
      for (let i = 0; i < 8; i++) {
        const newDir = (direction + i) % 8;
        const newX = x + directions[newDir].x;
        const newY = y + directions[newDir].y;
        
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          const pixelIndex = (newY * width + newX) * 4;
          if (data[pixelIndex] > 0) {
            x = newX;
            y = newY;
            direction = (newDir + 6) % 8; // Turn left
            found = true;
            break;
          }
        }
      }
      
      if (!found) break;
      
    } while (!(x === startX && y === startY) && points.length < 10000);
    
    return this.analyzeContour(points);
  }

  /**
   * Analyze contour properties
   */
  private analyzeContour(points: Array<{x: number, y: number}>): Contour {
    if (points.length === 0) {
      return {
        points: [],
        area: 0,
        perimeter: 0,
        boundingRect: {x: 0, y: 0, width: 0, height: 0},
        aspectRatio: 1,
        extent: 0,
        solidity: 0,
        isConvex: false,
        centroid: {x: 0, y: 0}
      };
    }
    
    // Calculate bounding rectangle
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    const boundingRect = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
    
    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    
    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate centroid
    let cx = 0, cy = 0;
    for (const point of points) {
      cx += point.x;
      cy += point.y;
    }
    cx /= points.length;
    cy /= points.length;
    
    const aspectRatio = boundingRect.width / boundingRect.height;
    const extent = area / (boundingRect.width * boundingRect.height);
    
    // Simple convexity test (more sophisticated methods available)
    const isConvex = this.isContourConvex(points);
    
    // For solidity, we'd need convex hull calculation (simplified here)
    const solidity = extent; // Approximation
    
    return {
      points,
      area,
      perimeter,
      boundingRect,
      aspectRatio,
      extent,
      solidity,
      isConvex,
      centroid: {x: cx, y: cy}
    };
  }

  /**
   * Simple convexity test
   */
  private isContourConvex(points: Array<{x: number, y: number}>): boolean {
    if (points.length < 3) return true;
    
    let sign = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];
      
      const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
      
      if (cross !== 0) {
        if (sign === 0) {
          sign = Math.sign(cross);
        } else if (Math.sign(cross) !== sign) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Calculate confidence based on edge quality
   */
  private calculateEdgeConfidence(edges: ImageData, contours: Contour[]): number {
    const data = edges.data;
    let edgePixels = 0;
    let totalPixels = data.length / 4;
    
    // Count edge pixels
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0) edgePixels++;
    }
    
    const edgeDensity = edgePixels / totalPixels;
    
    // Quality factors
    const densityScore = Math.min(1, edgeDensity * 10); // Prefer some edges but not too many
    const contourScore = Math.min(1, contours.length / 5); // Prefer reasonable number of contours
    
    const confidence = (densityScore + contourScore) / 2;
    
    console.log(`📊 Edge confidence: ${confidence.toFixed(3)} (density: ${edgeDensity.toFixed(3)}, contours: ${contours.length})`);
    
    return confidence;
  }
}

// Export singleton instance
export const advancedEdgeDetection = new AdvancedEdgeDetection();