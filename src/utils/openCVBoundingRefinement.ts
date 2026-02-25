/**
 * OpenCV.js Integration for Enhanced Bounding Box Precision
 * Uses computer vision algorithms for pixel-perfect edge detection
 */

import type { PixelBounds } from './pixelPerfectBoundingBox';

declare global {
  interface Window {
    cv: any;
  }
}

export interface OpenCVRefinementResult {
  success: boolean;
  refinedBounds: PixelBounds[];
  processingTime: number;
  error?: string;
}

export class OpenCVBoundingRefinement {
  private isOpenCVLoaded = false;
  
  /**
   * Check if OpenCV.js is available and load it if needed
   */
  async initializeOpenCV(): Promise<boolean> {
    if (this.isOpenCVLoaded && window.cv) {
      return true;
    }
    
    try {
      // Try to load OpenCV.js from CDN if not already loaded
      if (!window.cv) {
        console.log('📚 Loading OpenCV.js from CDN...');
        await this.loadOpenCVScript();
        await this.waitForOpenCV();
      }
      
      this.isOpenCVLoaded = true;
      console.log('✅ OpenCV.js initialized successfully');
      return true;
      
    } catch (error) {
      console.warn('⚠️ OpenCV.js not available, using fallback detection:', error);
      return false;
    }
  }
  
  /**
   * Load OpenCV.js script dynamically
   */
  private loadOpenCVScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * Wait for OpenCV to be ready
   */
  private waitForOpenCV(): Promise<void> {
    return new Promise((resolve) => {
      const checkOpenCV = () => {
        if (window.cv && window.cv.Mat) {
          resolve();
        } else {
          setTimeout(checkOpenCV, 100);
        }
      };
      checkOpenCV();
    });
  }
  
  /**
   * Refine bounding boxes using OpenCV contour detection
   */
  async refineBoundingBoxes(
    imageUrl: string,
    roughBounds: PixelBounds[]
  ): Promise<OpenCVRefinementResult> {
    const startTime = performance.now();
    
    try {
      const isReady = await this.initializeOpenCV();
      if (!isReady) {
        return {
          success: false,
          refinedBounds: roughBounds, // Return original bounds as fallback
          processingTime: performance.now() - startTime,
          error: 'OpenCV.js not available'
        };
      }
      
      console.log('🔬 Refining bounding boxes with OpenCV contour detection...');
      
      // Load image to canvas
      const { imageData, canvas } = await this.loadImageToCanvas(imageUrl);
      
      // Convert to OpenCV Mat
      const src = window.cv.matFromImageData(imageData);
      const gray = new window.cv.Mat();
      const binary = new window.cv.Mat();
      const contours = new window.cv.MatVector();
      const hierarchy = new window.cv.Mat();
      
      // Convert to grayscale
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
      
      // Apply threshold to create binary image
      window.cv.threshold(gray, binary, 50, 255, window.cv.THRESH_BINARY);
      
      // Find contours
      window.cv.findContours(binary, contours, hierarchy, window.cv.RETR_EXTERNAL, window.cv.CHAIN_APPROX_SIMPLE);
      
      // Refine each rough bound with closest contour
      const refinedBounds: PixelBounds[] = [];
      
      for (const roughBound of roughBounds) {
        const refinedBound = this.findBestContourMatch(roughBound, contours, imageData.width, imageData.height);
        refinedBounds.push(refinedBound);
      }
      
      // Cleanup OpenCV objects
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
      
      const processingTime = performance.now() - startTime;
      console.log(`✅ OpenCV refinement complete in ${processingTime.toFixed(2)}ms`);
      
      return {
        success: true,
        refinedBounds,
        processingTime
      };
      
    } catch (error) {
      console.error('OpenCV refinement failed:', error);
      return {
        success: false,
        refinedBounds: roughBounds, // Return original bounds as fallback
        processingTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Find the best contour match for a rough bounding box
   */
  private findBestContourMatch(
    roughBound: PixelBounds,
    contours: any,
    imageWidth: number,
    imageHeight: number
  ): PixelBounds {
    let bestMatch = roughBound;
    let bestOverlap = 0;
    
    const roughCenterX = roughBound.x + roughBound.width / 2;
    const roughCenterY = roughBound.y + roughBound.height / 2;
    
    // Check each contour
    for (let i = 0; i < contours.size(); i++) {
      try {
        const contour = contours.get(i);
        const boundingRect = window.cv.boundingRect(contour);
        
        // Skip very small contours
        if (boundingRect.width < 10 || boundingRect.height < 10) {
          continue;
        }
        
        // Calculate overlap with rough bound
        const overlapArea = this.calculateOverlapArea(roughBound, boundingRect);
        const overlapRatio = overlapArea / (roughBound.width * roughBound.height);
        
        // Check if contour center is close to rough bound center
        const contourCenterX = boundingRect.x + boundingRect.width / 2;
        const contourCenterY = boundingRect.y + boundingRect.height / 2;
        const distance = Math.sqrt(
          Math.pow(contourCenterX - roughCenterX, 2) + 
          Math.pow(contourCenterY - roughCenterY, 2)
        );
        
        // Use contour if it has good overlap and close center
        if (overlapRatio > 0.3 && distance < 50 && overlapRatio > bestOverlap) {
          bestOverlap = overlapRatio;
          bestMatch = {
            x: Math.max(0, boundingRect.x - 1), // Add 1px padding
            y: Math.max(0, boundingRect.y - 1),
            width: Math.min(imageWidth - boundingRect.x + 1, boundingRect.width + 2),
            height: Math.min(imageHeight - boundingRect.y + 1, boundingRect.height + 2),
            pixelCount: boundingRect.width * boundingRect.height,
            confidence: Math.min(1.0, overlapRatio * 2) // Higher overlap = higher confidence
          };
        }
      } catch (contourError) {
        // Skip problematic contours
        continue;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Calculate overlap area between two rectangles
   */
  private calculateOverlapArea(rect1: PixelBounds, rect2: any): number {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    if (x2 <= x1 || y2 <= y1) {
      return 0; // No overlap
    }
    
    return (x2 - x1) * (y2 - y1);
  }
  
  /**
   * Load image to canvas for OpenCV processing
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
      
      img.onerror = () => reject(new Error('Failed to load image for OpenCV processing'));
      img.src = imageUrl;
    });
  }
}

export const openCVBoundingRefinement = new OpenCVBoundingRefinement();