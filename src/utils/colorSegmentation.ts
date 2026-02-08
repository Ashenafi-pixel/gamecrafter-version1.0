/**
 * K-Means Color Segmentation System
 * Advanced color-based sprite separation using clustering algorithms
 * Part of the multi-algorithm ensemble for sprite detection
 */

export interface ColorCluster {
  id: number;
  centroid: {r: number, g: number, b: number};
  pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>;
  size: number;
  dominance: number; // percentage of total pixels
  averageAlpha: number;
}

export interface ColorSegmentationResult {
  clusters: ColorCluster[];
  segmentedImage: ImageData;
  clusterMask: Uint8Array; // Each pixel labeled with cluster ID
  confidence: number;
  processingTime: number;
  convergenceIterations: number;
}

export interface ColorSegmentationOptions {
  k: number; // number of clusters
  maxIterations: number;
  convergenceThreshold: number;
  excludeTransparent: boolean;
  alphaThreshold: number;
  colorSpace: 'rgb' | 'lab' | 'hsv';
  initialization: 'random' | 'kmeans++' | 'furthest';
}

export interface LABColor {
  l: number; // Lightness
  a: number; // Green-Red
  b: number; // Blue-Yellow
}

export interface HSVColor {
  h: number; // Hue
  s: number; // Saturation
  v: number; // Value
}

export class ColorSegmentation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Main color segmentation pipeline using K-means clustering
   */
  async segmentByColor(
    imageUrl: string,
    options: Partial<ColorSegmentationOptions> = {}
  ): Promise<ColorSegmentationResult> {
    const startTime = performance.now();
    
    console.log('🎨 Starting K-means color segmentation...');
    
    const opts: ColorSegmentationOptions = {
      k: 5, // 4 letters + 1 symbol + background
      maxIterations: 100,
      convergenceThreshold: 1.0,
      excludeTransparent: true,
      alphaThreshold: 25,
      colorSpace: 'lab', // Better perceptual uniformity
      initialization: 'kmeans++',
      ...options
    };

    try {
      // Load image data
      const imageData = await this.loadImageData(imageUrl);
      
      // Extract pixels with color space conversion
      const pixels = this.extractPixels(imageData, opts);
      
      console.log(`📊 Extracted ${pixels.length} pixels for clustering`);
      
      // Initialize centroids
      let centroids = this.initializeCentroids(pixels, opts.k, opts.initialization);
      
      // Run K-means algorithm
      const { finalCentroids, assignments, iterations } = this.kMeansCluster(
        pixels, 
        centroids, 
        opts.maxIterations, 
        opts.convergenceThreshold
      );
      
      // Create clusters from results
      const clusters = this.createClusters(pixels, finalCentroids, assignments);
      
      // Generate segmented visualization
      const segmentedImage = this.createSegmentedImage(imageData, assignments, clusters);
      
      // Create cluster mask
      const clusterMask = this.createClusterMask(imageData, assignments, opts);
      
      // Calculate confidence
      const confidence = this.calculateSegmentationConfidence(clusters, pixels.length);
      
      const processingTime = performance.now() - startTime;
      
      console.log(`✅ Color segmentation complete: ${clusters.length} clusters in ${iterations} iterations (${processingTime.toFixed(2)}ms)`);
      
      return {
        clusters,
        segmentedImage,
        clusterMask,
        confidence,
        processingTime,
        convergenceIterations: iterations
      };
      
    } catch (error) {
      console.error('❌ Color segmentation failed:', error);
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
   * Extract pixels from image data with color space conversion
   */
  private extractPixels(
    imageData: ImageData, 
    options: ColorSegmentationOptions
  ): Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}> {
    const pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}> = [];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        // Skip transparent pixels if requested
        if (options.excludeTransparent && alpha < options.alphaThreshold) {
          continue;
        }
        
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Convert to target color space
        let colorData: {r: number, g: number, b: number};
        
        switch (options.colorSpace) {
          case 'lab':
            const lab = this.rgbToLab(r, g, b);
            colorData = {r: lab.l, g: lab.a, b: lab.b}; // Map LAB to RGB structure
            break;
          case 'hsv':
            const hsv = this.rgbToHsv(r, g, b);
            colorData = {r: hsv.h, g: hsv.s, b: hsv.v}; // Map HSV to RGB structure
            break;
          case 'rgb':
          default:
            colorData = {r, g, b};
        }
        
        pixels.push({
          x,
          y,
          r: colorData.r,
          g: colorData.g,
          b: colorData.b,
          alpha
        });
      }
    }
    
    return pixels;
  }

  /**
   * Convert RGB to LAB color space for better perceptual uniformity
   */
  private rgbToLab(r: number, g: number, b: number): LABColor {
    // First convert RGB to XYZ
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;
    
    // Apply gamma correction
    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
    
    // Observer = 2°, Illuminant = D65
    let x = rNorm * 0.4124 + gNorm * 0.3576 + bNorm * 0.1805;
    let y = rNorm * 0.2126 + gNorm * 0.7152 + bNorm * 0.0722;
    let z = rNorm * 0.0193 + gNorm * 0.1192 + bNorm * 0.9505;
    
    // Normalize by D65 illuminant
    x = x / 0.95047;
    y = y / 1.00000;
    z = z / 1.08883;
    
    // Convert XYZ to LAB
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
    
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b_lab = 200 * (y - z);
    
    return { l, a, b: b_lab };
  }

  /**
   * Convert RGB to HSV color space
   */
  private rgbToHsv(r: number, g: number, b: number): HSVColor {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    return { h, s: s * 100, v: v * 100 };
  }

  /**
   * Initialize centroids using different strategies
   */
  private initializeCentroids(
    pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>,
    k: number,
    method: string
  ): Array<{r: number, g: number, b: number}> {
    const centroids: Array<{r: number, g: number, b: number}> = [];
    
    switch (method) {
      case 'kmeans++':
        return this.initializeKMeansPlusPlus(pixels, k);
      case 'furthest':
        return this.initializeFurthestFirst(pixels, k);
      case 'random':
      default:
        // Random initialization
        for (let i = 0; i < k; i++) {
          const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
          centroids.push({
            r: randomPixel.r,
            g: randomPixel.g,
            b: randomPixel.b
          });
        }
        return centroids;
    }
  }

  /**
   * K-means++ initialization for better initial centroids
   */
  private initializeKMeansPlusPlus(
    pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>,
    k: number
  ): Array<{r: number, g: number, b: number}> {
    const centroids: Array<{r: number, g: number, b: number}> = [];
    
    // Choose first centroid randomly
    const firstPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({
      r: firstPixel.r,
      g: firstPixel.g,
      b: firstPixel.b
    });
    
    // Choose remaining centroids based on distance
    for (let i = 1; i < k; i++) {
      const distances: number[] = [];
      let totalDistance = 0;
      
      // Calculate distance to nearest centroid for each pixel
      for (const pixel of pixels) {
        let minDistance = Infinity;
        
        for (const centroid of centroids) {
          const distance = this.euclideanDistance(pixel, centroid);
          minDistance = Math.min(minDistance, distance);
        }
        
        distances.push(minDistance * minDistance); // Square for weighted probability
        totalDistance += minDistance * minDistance;
      }
      
      // Choose next centroid with probability proportional to squared distance
      const randomValue = Math.random() * totalDistance;
      let cumulativeDistance = 0;
      
      for (let j = 0; j < pixels.length; j++) {
        cumulativeDistance += distances[j];
        if (cumulativeDistance >= randomValue) {
          const selectedPixel = pixels[j];
          centroids.push({
            r: selectedPixel.r,
            g: selectedPixel.g,
            b: selectedPixel.b
          });
          break;
        }
      }
    }
    
    console.log(`🎯 K-means++ initialization: selected ${centroids.length} centroids`);
    return centroids;
  }

  /**
   * Furthest-first initialization
   */
  private initializeFurthestFirst(
    pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>,
    k: number
  ): Array<{r: number, g: number, b: number}> {
    const centroids: Array<{r: number, g: number, b: number}> = [];
    
    // Choose first centroid randomly
    const firstPixel = pixels[Math.floor(Math.random() * pixels.length)];
    centroids.push({
      r: firstPixel.r,
      g: firstPixel.g,
      b: firstPixel.b
    });
    
    // Choose remaining centroids as furthest from existing ones
    for (let i = 1; i < k; i++) {
      let maxDistance = 0;
      let furthestPixel = pixels[0];
      
      for (const pixel of pixels) {
        let minDistanceToCentroids = Infinity;
        
        for (const centroid of centroids) {
          const distance = this.euclideanDistance(pixel, centroid);
          minDistanceToCentroids = Math.min(minDistanceToCentroids, distance);
        }
        
        if (minDistanceToCentroids > maxDistance) {
          maxDistance = minDistanceToCentroids;
          furthestPixel = pixel;
        }
      }
      
      centroids.push({
        r: furthestPixel.r,
        g: furthestPixel.g,
        b: furthestPixel.b
      });
    }
    
    return centroids;
  }

  /**
   * Calculate Euclidean distance between two points in color space
   */
  private euclideanDistance(
    point1: {r: number, g: number, b: number},
    point2: {r: number, g: number, b: number}
  ): number {
    const dr = point1.r - point2.r;
    const dg = point1.g - point2.g;
    const db = point1.b - point2.b;
    
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Run K-means clustering algorithm
   */
  private kMeansCluster(
    pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>,
    initialCentroids: Array<{r: number, g: number, b: number}>,
    maxIterations: number,
    convergenceThreshold: number
  ): {
    finalCentroids: Array<{r: number, g: number, b: number}>;
    assignments: number[];
    iterations: number;
  } {
    let centroids = [...initialCentroids];
    let assignments = new Array(pixels.length).fill(0);
    let iterations = 0;
    
    for (iterations = 0; iterations < maxIterations; iterations++) {
      // Assignment step: assign each pixel to nearest centroid
      const newAssignments = new Array(pixels.length);
      
      for (let i = 0; i < pixels.length; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;
        
        for (let j = 0; j < centroids.length; j++) {
          const distance = this.euclideanDistance(pixels[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }
        
        newAssignments[i] = bestCluster;
      }
      
      // Update step: recalculate centroids
      const newCentroids = new Array(centroids.length);
      
      for (let j = 0; j < centroids.length; j++) {
        const clusterPixels = pixels.filter((_, i) => newAssignments[i] === j);
        
        if (clusterPixels.length > 0) {
          const sumR = clusterPixels.reduce((sum, p) => sum + p.r, 0);
          const sumG = clusterPixels.reduce((sum, p) => sum + p.g, 0);
          const sumB = clusterPixels.reduce((sum, p) => sum + p.b, 0);
          
          newCentroids[j] = {
            r: sumR / clusterPixels.length,
            g: sumG / clusterPixels.length,
            b: sumB / clusterPixels.length
          };
        } else {
          // Keep old centroid if no pixels assigned
          newCentroids[j] = centroids[j];
        }
      }
      
      // Check convergence
      let totalMovement = 0;
      for (let j = 0; j < centroids.length; j++) {
        totalMovement += this.euclideanDistance(centroids[j], newCentroids[j]);
      }
      
      centroids = newCentroids;
      assignments = newAssignments;
      
      if (totalMovement < convergenceThreshold) {
        console.log(`🎯 K-means converged after ${iterations + 1} iterations`);
        break;
      }
    }
    
    return {
      finalCentroids: centroids,
      assignments,
      iterations: iterations + 1
    };
  }

  /**
   * Create cluster objects from clustering results
   */
  private createClusters(
    pixels: Array<{x: number, y: number, r: number, g: number, b: number, alpha: number}>,
    centroids: Array<{r: number, g: number, b: number}>,
    assignments: number[]
  ): ColorCluster[] {
    const clusters: ColorCluster[] = [];
    
    for (let i = 0; i < centroids.length; i++) {
      const clusterPixels = pixels.filter((_, index) => assignments[index] === i);
      
      if (clusterPixels.length > 0) {
        const averageAlpha = clusterPixels.reduce((sum, p) => sum + p.alpha, 0) / clusterPixels.length;
        const dominance = (clusterPixels.length / pixels.length) * 100;
        
        clusters.push({
          id: i,
          centroid: centroids[i],
          pixels: clusterPixels,
          size: clusterPixels.length,
          dominance,
          averageAlpha
        });
      }
    }
    
    // Sort by size (largest first)
    clusters.sort((a, b) => b.size - a.size);
    
    console.log(`📊 Created ${clusters.length} clusters:`);
    clusters.forEach((cluster, index) => {
      console.log(`   ${index + 1}. Cluster ${cluster.id}: ${cluster.size} pixels (${cluster.dominance.toFixed(1)}%)`);
    });
    
    return clusters;
  }

  /**
   * Create visualization of segmented image
   */
  private createSegmentedImage(
    originalImage: ImageData,
    assignments: number[],
    clusters: ColorCluster[]
  ): ImageData {
    const segmented = new ImageData(originalImage.width, originalImage.height);
    const originalData = originalImage.data;
    const segmentedData = segmented.data;
    
    // Create color map for clusters
    const clusterColors = this.generateClusterColors(clusters.length);
    
    // Safety check: ensure we have colors for all possible cluster indices
    // Use reduce instead of Math.max to avoid stack overflow with large arrays
    let maxClusterIndex = 0;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] > maxClusterIndex) {
        maxClusterIndex = assignments[i];
      }
    }
    
    if (maxClusterIndex >= clusterColors.length) {
      console.warn(`⚠️ Cluster index mismatch: max index ${maxClusterIndex}, but only ${clusterColors.length} colors generated`);
      // Extend clusterColors array if needed
      while (clusterColors.length <= maxClusterIndex) {
        clusterColors.push({r: 128, g: 128, b: 128}); // Gray fallback
      }
    }
    
    let pixelIndex = 0;
    for (let i = 0; i < originalData.length; i += 4) {
      const alpha = originalData[i + 3];
      
      if (alpha > 25) { // Non-transparent pixels
        const clusterIndex = assignments[pixelIndex];
        
        // Validate clusterIndex before using it
        if (clusterIndex !== undefined && clusterIndex >= 0 && clusterIndex < clusterColors.length) {
          const color = clusterColors[clusterIndex];
          
          // Safety check to prevent undefined color access
          if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            segmentedData[i] = color.r;
            segmentedData[i + 1] = color.g;
            segmentedData[i + 2] = color.b;
            segmentedData[i + 3] = alpha;
          } else {
            // Fallback to original pixel color if cluster color is invalid
            segmentedData[i] = originalData[i];
            segmentedData[i + 1] = originalData[i + 1];
            segmentedData[i + 2] = originalData[i + 2];
            segmentedData[i + 3] = alpha;
          }
        } else {
          // Fallback to original pixel color if clusterIndex is invalid
          segmentedData[i] = originalData[i];
          segmentedData[i + 1] = originalData[i + 1];
          segmentedData[i + 2] = originalData[i + 2];
          segmentedData[i + 3] = alpha;
        }
        
        pixelIndex++;
      } else {
        // Keep transparent pixels transparent
        segmentedData[i] = 0;
        segmentedData[i + 1] = 0;
        segmentedData[i + 2] = 0;
        segmentedData[i + 3] = 0;
      }
    }
    
    return segmented;
  }

  /**
   * Generate distinct colors for cluster visualization
   */
  private generateClusterColors(numClusters: number): Array<{r: number, g: number, b: number}> {
    const colors: Array<{r: number, g: number, b: number}> = [];
    
    for (let i = 0; i < numClusters; i++) {
      const hue = (i * 360 / numClusters) % 360;
      const saturation = 70;
      const value = 90;
      
      // Convert HSV to RGB
      const c = value * saturation / 10000;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = value / 100 - c;
      
      let r = 0, g = 0, b = 0;
      
      if (hue < 60) {
        r = c; g = x; b = 0;
      } else if (hue < 120) {
        r = x; g = c; b = 0;
      } else if (hue < 180) {
        r = 0; g = c; b = x;
      } else if (hue < 240) {
        r = 0; g = x; b = c;
      } else if (hue < 300) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }
      
      colors.push({
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      });
    }
    
    return colors;
  }

  /**
   * Create cluster mask for further processing
   */
  private createClusterMask(
    originalImage: ImageData,
    assignments: number[],
    options: ColorSegmentationOptions
  ): Uint8Array {
    const mask = new Uint8Array(originalImage.width * originalImage.height);
    const originalData = originalImage.data;
    
    let pixelIndex = 0;
    for (let i = 0; i < originalData.length; i += 4) {
      const alpha = originalData[i + 3];
      const maskIndex = Math.floor(i / 4);
      
      if (alpha > options.alphaThreshold) {
        mask[maskIndex] = assignments[pixelIndex] + 1; // +1 to avoid 0 (background)
        pixelIndex++;
      } else {
        mask[maskIndex] = 0; // Background
      }
    }
    
    return mask;
  }

  /**
   * Calculate confidence based on clustering quality
   */
  private calculateSegmentationConfidence(clusters: ColorCluster[], totalPixels: number): number {
    if (clusters.length === 0) return 0;
    
    // Quality factors
    
    // 1. Cluster separation - how distinct are the clusters?
    let minInterClusterDistance = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const distance = this.euclideanDistance(clusters[i].centroid, clusters[j].centroid);
        minInterClusterDistance = Math.min(minInterClusterDistance, distance);
      }
    }
    
    const separationScore = Math.min(1, minInterClusterDistance / 100); // Normalize
    
    // 2. Cluster compactness - how tight are the clusters?
    let avgCompactness = 0;
    for (const cluster of clusters) {
      let intraClusterDistance = 0;
      for (const pixel of cluster.pixels) {
        intraClusterDistance += this.euclideanDistance(pixel, cluster.centroid);
      }
      avgCompactness += intraClusterDistance / cluster.pixels.length;
    }
    avgCompactness /= clusters.length;
    
    const compactnessScore = Math.max(0, 1 - avgCompactness / 100); // Lower is better
    
    // 3. Size distribution - prefer balanced clusters
    const expectedSize = totalPixels / clusters.length;
    let sizeVariance = 0;
    for (const cluster of clusters) {
      const deviation = Math.abs(cluster.size - expectedSize) / expectedSize;
      sizeVariance += deviation;
    }
    sizeVariance /= clusters.length;
    
    const balanceScore = Math.max(0, 1 - sizeVariance);
    
    const confidence = (separationScore + compactnessScore + balanceScore) / 3;
    
    console.log(`📊 Segmentation confidence: ${confidence.toFixed(3)} (separation: ${separationScore.toFixed(3)}, compactness: ${compactnessScore.toFixed(3)}, balance: ${balanceScore.toFixed(3)})`);
    
    return confidence;
  }
}

// Export singleton instance
export const colorSegmentation = new ColorSegmentation();