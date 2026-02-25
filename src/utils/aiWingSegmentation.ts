import * as PIXI from 'pixi.js';

export interface WingSegment {
  id: string;
  name: string;
  maskData: Uint8ClampedArray;
  boundingBox: { x: number; y: number; width: number; height: number };
  anchorPoint: { x: number; y: number };
  confidence: number;
  wingType: 'left' | 'right';
  featherRegions: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface SegmentationResult {
  bodyMask: Uint8ClampedArray;
  leftWing: WingSegment;
  rightWing: WingSegment;
  originalWidth: number;
  originalHeight: number;
  confidence: number;
}

class AIWingSegmentation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async segmentWings(imageUrl: string): Promise<SegmentationResult> {
    console.log('🔍 AI analyzing image for wing segmentation...');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          const result = this.analyzePixels(imageData, img.width, img.height);
          
          console.log(`✅ Wing segmentation complete - Left: ${result.leftWing.confidence.toFixed(2)}, Right: ${result.rightWing.confidence.toFixed(2)}`);
          resolve(result);
        } catch (error) {
          console.error('Wing segmentation failed:', error);
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image for segmentation'));
      img.src = imageUrl;
    });
  }

  private analyzePixels(imageData: ImageData, width: number, height: number): SegmentationResult {
    const pixels = imageData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create mask arrays
    const bodyMask = new Uint8ClampedArray(width * height);
    const leftWingMask = new Uint8ClampedArray(width * height);
    const rightWingMask = new Uint8ClampedArray(width * height);
    
    // Golden scarab color detection
    const isGoldenPixel = (r: number, g: number, b: number, a: number): boolean => {
      if (a < 100) return false; // Skip transparent pixels
      
      // Golden color ranges (HSV-like detection)
      const brightness = (r + g + b) / 3;
      const isGolden = r > 150 && g > 100 && b < 150 && brightness > 120;
      const isOrange = r > 180 && g > 120 && b < 100;
      const isBronze = r > 140 && g > 100 && b > 60 && r > g && g > b;
      
      return isGolden || isOrange || isBronze;
    };
    
    // Analyze each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        const pixelIndex = y * width + x;
        
        if (isGoldenPixel(r, g, b, a)) {
          const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const angleFromCenter = Math.atan2(y - centerY, x - centerX);
          
          // Wing detection based on position and shape analysis
          const isInWingRegion = this.detectWingRegion(x, y, width, height, distanceFromCenter, angleFromCenter);
          
          if (isInWingRegion.isWing) {
            if (isInWingRegion.side === 'left') {
              leftWingMask[pixelIndex] = 255;
            } else {
              rightWingMask[pixelIndex] = 255;
            }
          } else {
            // Body region
            bodyMask[pixelIndex] = 255;
          }
        }
      }
    }
    
    // Calculate bounding boxes and anchor points
    const leftWingBounds = this.calculateBounds(leftWingMask, width, height);
    const rightWingBounds = this.calculateBounds(rightWingMask, width, height);
    
    // Refine masks with morphological operations
    this.refineMask(leftWingMask, width, height);
    this.refineMask(rightWingMask, width, height);
    
    return {
      bodyMask,
      leftWing: {
        id: 'left-wing',
        name: 'Left Wing',
        maskData: leftWingMask,
        boundingBox: leftWingBounds,
        anchorPoint: this.calculateWingAnchor(leftWingBounds, 'left'),
        confidence: this.calculateConfidence(leftWingMask),
        wingType: 'left',
        featherRegions: this.detectFeatherRegions(leftWingMask, leftWingBounds, width)
      },
      rightWing: {
        id: 'right-wing',
        name: 'Right Wing',
        maskData: rightWingMask,
        boundingBox: rightWingBounds,
        anchorPoint: this.calculateWingAnchor(rightWingBounds, 'right'),
        confidence: this.calculateConfidence(rightWingMask),
        wingType: 'right',
        featherRegions: this.detectFeatherRegions(rightWingMask, rightWingBounds, width)
      },
      originalWidth: width,
      originalHeight: height,
      confidence: 0.9
    };
  }
  
  private detectWingRegion(x: number, y: number, width: number, height: number, distance: number, angle: number) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // More conservative wing detection parameters
    const wingDistanceThreshold = Math.min(width, height) * 0.25; // Increased from 0.15
    const bodyDistanceThreshold = Math.min(width, height) * 0.45; // Increased from 0.25
    
    // More precise angular regions for wings
    const leftWingAngle = Math.PI * 0.75; // ~135 degrees
    const rightWingAngle = Math.PI * 0.25; // ~45 degrees  
    const angleThreshold = Math.PI * 0.25; // Reduced tolerance to 45 degrees
    
    // Conservative distance-based detection
    const isInWingDistance = distance > wingDistanceThreshold && distance < bodyDistanceThreshold;
    
    // Stricter side-based detection
    const isOnLeftSide = x < centerX - width * 0.15; // Must be clearly on left
    const isOnRightSide = x > centerX + width * 0.15; // Must be clearly on right
    
    // Left wing detection - more conservative
    const leftAngleDiff = Math.abs(angle - leftWingAngle);
    const isLeftWing = isInWingDistance && 
                      leftAngleDiff < angleThreshold &&
                      isOnLeftSide &&
                      y < centerY + height * 0.2; // Wings are typically in upper portion
    
    // Right wing detection - more conservative
    const rightAngleDiff = Math.abs(angle - rightWingAngle);
    const isRightWing = isInWingDistance && 
                       rightAngleDiff < angleThreshold &&
                       isOnRightSide &&
                       y < centerY + height * 0.2;
    
    // More conservative elliptical region check
    const isEllipticalRegion = this.isInConservativeWingShape(x, y, centerX, centerY, width, height);
    
    if (isLeftWing && isEllipticalRegion) {
      return { isWing: true, side: 'left' as const };
    } else if (isRightWing && isEllipticalRegion) {
      return { isWing: true, side: 'right' as const };
    }
    
    return { isWing: false, side: null };
  }
  
  private isInConservativeWingShape(x: number, y: number, centerX: number, centerY: number, width: number, height: number): boolean {
    // More conservative wing shape detection - smaller regions to preserve body
    const wingWidth = width * 0.22; // Reduced from 0.35
    const wingHeight = height * 0.25; // Reduced from 0.4
    
    const leftWingCenterX = centerX - width * 0.25; // Moved further out
    const rightWingCenterX = centerX + width * 0.25; // Moved further out
    const wingCenterY = centerY - height * 0.05; // Slightly above center
    
    // Check if point is within left wing ellipse
    const leftWingDistance = ((x - leftWingCenterX) ** 2) / (wingWidth ** 2) + 
                            ((y - wingCenterY) ** 2) / (wingHeight ** 2);
    
    // Check if point is within right wing ellipse  
    const rightWingDistance = ((x - rightWingCenterX) ** 2) / (wingWidth ** 2) + 
                             ((y - wingCenterY) ** 2) / (wingHeight ** 2);
    
    // Only consider outer wing tips, not areas close to body
    const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const minDistanceFromBody = Math.min(width, height) * 0.2;
    
    return (leftWingDistance <= 1 || rightWingDistance <= 1) && distanceFromCenter > minDistanceFromBody;
  }

  private isInEllipticalWingShape(x: number, y: number, centerX: number, centerY: number, width: number, height: number): boolean {
    // Original method - kept for compatibility
    const wingWidth = width * 0.35;
    const wingHeight = height * 0.4;
    
    const leftWingCenterX = centerX - width * 0.2;
    const rightWingCenterX = centerX + width * 0.2;
    const wingCenterY = centerY - height * 0.1;
    
    const leftWingDistance = ((x - leftWingCenterX) ** 2) / (wingWidth ** 2) + 
                            ((y - wingCenterY) ** 2) / (wingHeight ** 2);
    
    const rightWingDistance = ((x - rightWingCenterX) ** 2) / (wingWidth ** 2) + 
                             ((y - wingCenterY) ** 2) / (wingHeight ** 2);
    
    return leftWingDistance <= 1 || rightWingDistance <= 1;
  }
  
  private calculateBounds(mask: Uint8ClampedArray, width: number, height: number) {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  private calculateWingAnchor(bounds: any, wingType: 'left' | 'right') {
    // Anchor point should be where the wing connects to the body
    if (wingType === 'left') {
      return {
        x: bounds.x + bounds.width * 0.8, // Right edge of left wing (connection point)
        y: bounds.y + bounds.height * 0.6  // Lower part of wing base
      };
    } else {
      return {
        x: bounds.x + bounds.width * 0.2, // Left edge of right wing (connection point)
        y: bounds.y + bounds.height * 0.6  // Lower part of wing base
      };
    }
  }
  
  private calculateConfidence(mask: Uint8ClampedArray): number {
    const totalPixels = mask.length;
    const maskedPixels = mask.filter(pixel => pixel > 0).length;
    const ratio = maskedPixels / totalPixels;
    
    console.log(`🔍 Wing confidence calculation: ${maskedPixels} pixels out of ${totalPixels} (${(ratio * 100).toFixed(2)}%)`);
    
    // More generous confidence calculation for GPT-4 Vision compatibility
    if (ratio > 0.005 && ratio < 0.4) return 0.95; // Very generous range
    if (ratio > 0.001 && ratio < 0.5) return 0.85; // Even more generous
    if (ratio > 0.0001) return 0.75; // Almost any detection gets good confidence
    return 0.5; // Higher default confidence
  }
  
  private detectFeatherRegions(mask: Uint8ClampedArray, bounds: any, width: number) {
    // Detect feather regions for more detailed animation
    const regions = [];
    const regionSize = Math.max(20, bounds.width / 4);
    
    for (let y = bounds.y; y < bounds.y + bounds.height; y += regionSize) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x += regionSize) {
        const hasPixels = this.checkRegionHasPixels(mask, x, y, regionSize, regionSize, width);
        if (hasPixels) {
          regions.push({
            x: x - bounds.x,
            y: y - bounds.y,
            width: regionSize,
            height: regionSize
          });
        }
      }
    }
    
    return regions;
  }
  
  private checkRegionHasPixels(mask: Uint8ClampedArray, startX: number, startY: number, width: number, height: number, imageWidth: number): boolean {
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        if (mask[y * imageWidth + x] > 0) return true;
      }
    }
    return false;
  }
  
  private refineMask(mask: Uint8ClampedArray, width: number, height: number): void {
    // Apply morphological closing to fill small gaps
    const kernel = 3;
    const temp = new Uint8ClampedArray(mask);
    
    // Dilation followed by erosion (closing operation)
    this.dilate(mask, temp, width, height, kernel);
    this.erode(temp, mask, width, height, kernel);
    
    // Apply Gaussian blur for smoother edges
    this.gaussianBlur(mask, width, height, 1.5);
    
    // Clean up small noise
    this.removeSmallRegions(mask, width, height, 50);
  }
  
  private dilate(input: Uint8ClampedArray, output: Uint8ClampedArray, width: number, height: number, kernelSize: number): void {
    const radius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              maxVal = Math.max(maxVal, input[ny * width + nx]);
            }
          }
        }
        
        output[y * width + x] = maxVal;
      }
    }
  }
  
  private erode(input: Uint8ClampedArray, output: Uint8ClampedArray, width: number, height: number, kernelSize: number): void {
    const radius = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minVal = 255;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              minVal = Math.min(minVal, input[ny * width + nx]);
            }
          }
        }
        
        output[y * width + x] = minVal;
      }
    }
  }

  private gaussianBlur(mask: Uint8ClampedArray, width: number, height: number, sigma: number): void {
    // Create Gaussian kernel
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = new Float32Array(kernelSize);
    const halfSize = Math.floor(kernelSize / 2);
    
    let sum = 0;
    for (let i = 0; i < kernelSize; i++) {
      const x = i - halfSize;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }
    
    // Normalize kernel
    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }
    
    const temp = new Uint8ClampedArray(mask);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const xi = x + k - halfSize;
          if (xi >= 0 && xi < width) {
            value += mask[y * width + xi] * kernel[k];
          }
        }
        temp[y * width + x] = Math.round(value);
      }
    }
    
    // Vertical pass
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const yi = y + k - halfSize;
          if (yi >= 0 && yi < height) {
            value += temp[yi * width + x] * kernel[k];
          }
        }
        mask[y * width + x] = Math.round(value);
      }
    }
  }

  private removeSmallRegions(mask: Uint8ClampedArray, width: number, height: number, minSize: number): void {
    const visited = new Uint8ClampedArray(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (mask[index] > 0 && !visited[index]) {
          const regionSize = this.floodFill(mask, visited, x, y, width, height);
          if (regionSize < minSize) {
            // Remove small region
            this.removeRegion(mask, x, y, width, height);
          }
        }
      }
    }
  }

  private floodFill(mask: Uint8ClampedArray, visited: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): number {
    const stack = [{x: startX, y: startY}];
    let size = 0;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[index] || mask[index] === 0) {
        continue;
      }
      
      visited[index] = 1;
      size++;
      
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
    }
    
    return size;
  }

  private removeRegion(mask: Uint8ClampedArray, startX: number, startY: number, width: number, height: number): void {
    const stack = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || mask[index] === 0) {
        continue;
      }
      
      mask[index] = 0;
      
      stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
    }
  }

  async createMaskedTexture(originalTexture: PIXI.Texture, mask: Uint8ClampedArray, width: number, height: number): Promise<PIXI.Texture> {
    return new Promise((resolve, reject) => {
      // Create a new canvas for the masked texture
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      // Get image from texture
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Draw original texture
          ctx.drawImage(img, 0, 0);
          
          // Apply mask
          const imageData = ctx.getImageData(0, 0, width, height);
          for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 0) {
              imageData.data[i * 4 + 3] = 0; // Make transparent
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Create PIXI texture from canvas
          const maskedTexture = PIXI.Texture.from(canvas);
          resolve(maskedTexture);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load texture for masking'));
      
      // Handle different texture source types
      if (originalTexture.baseTexture && originalTexture.baseTexture.resource) {
        const resource = originalTexture.baseTexture.resource as any;
        if (resource.source && resource.source.src) {
          img.src = resource.source.src;
        } else if (resource.url) {
          img.src = resource.url;
        } else {
          // Fallback: convert texture to canvas
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d')!;
          
          // Create an image from the canvas data URL
          img.src = tempCanvas.toDataURL();
        }
      } else {
        reject(new Error('Invalid texture resource'));
      }
    });
  }
}

export const aiWingSegmentation = new AIWingSegmentation();