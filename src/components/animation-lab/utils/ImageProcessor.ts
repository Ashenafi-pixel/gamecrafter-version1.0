/**
 * Image Processing Utilities for Animation Lab
 * Handles image manipulation, format conversion, and optimization
 */

export interface ProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG quality
  format?: 'png' | 'jpeg' | 'webp';
  maintainAspectRatio?: boolean;
  backgroundColor?: string; // For JPEG conversion
}

export interface ImageInfo {
  width: number;
  height: number;
  hasTransparency: boolean;
  size: number; // File size in bytes
  format: string;
  colorDepth: number;
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Resize image with various options
   */
  async resizeImage(
    source: File | HTMLImageElement | HTMLCanvasElement,
    options: ProcessingOptions = {}
  ): Promise<{ blob: Blob; canvas: HTMLCanvasElement }> {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 0.9,
      format = 'png',
      maintainAspectRatio = true,
      backgroundColor = '#FFFFFF'
    } = options;

    // Load source image
    const sourceImage = await this.loadImage(source);
    const { width: originalWidth, height: originalHeight } = sourceImage;

    // Calculate new dimensions
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (maintainAspectRatio) {
      const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
      if (ratio < 1) {
        newWidth = Math.round(originalWidth * ratio);
        newHeight = Math.round(originalHeight * ratio);
      }
    } else {
      newWidth = Math.min(originalWidth, maxWidth);
      newHeight = Math.min(originalHeight, maxHeight);
    }

    // Setup canvas
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, newWidth, newHeight);

    // Set background for non-transparent formats
    if (format === 'jpeg') {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, newWidth, newHeight);
    }

    // Draw resized image
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(sourceImage, 0, 0, newWidth, newHeight);

    // Convert to blob
    const mimeType = this.getMimeType(format);
    const blob = await this.canvasToBlob(this.canvas, mimeType, quality);

    return { blob, canvas: this.canvas };
  }

  /**
   * Convert image format
   */
  async convertFormat(
    source: File | HTMLImageElement | HTMLCanvasElement,
    targetFormat: 'png' | 'jpeg' | 'webp',
    quality: number = 0.9
  ): Promise<Blob> {
    const sourceImage = await this.loadImage(source);
    
    this.canvas.width = sourceImage.width;
    this.canvas.height = sourceImage.height;
    
    this.ctx.clearRect(0, 0, sourceImage.width, sourceImage.height);
    
    // Set white background for JPEG
    if (targetFormat === 'jpeg') {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, sourceImage.width, sourceImage.height);
    }
    
    this.ctx.drawImage(sourceImage, 0, 0);
    
    const mimeType = this.getMimeType(targetFormat);
    return this.canvasToBlob(this.canvas, mimeType, quality);
  }

  /**
   * Remove background (simple threshold-based)
   */
  async removeBackground(
    source: File | HTMLImageElement | HTMLCanvasElement,
    tolerance: number = 10
  ): Promise<HTMLCanvasElement> {
    const sourceImage = await this.loadImage(source);
    
    this.canvas.width = sourceImage.width;
    this.canvas.height = sourceImage.height;
    
    this.ctx.clearRect(0, 0, sourceImage.width, sourceImage.height);
    this.ctx.drawImage(sourceImage, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    const data = imageData.data;
    
    // Get corner pixel as background reference
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    
    // Remove similar colors
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      
      if (diff <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    
    return this.canvas;
  }

  /**
   * Extract sprite frames from sprite sheet
   */
  extractFrames(
    spriteSheet: HTMLImageElement | HTMLCanvasElement,
    frameWidth: number,
    frameHeight: number,
    columns: number,
    rows: number
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = frameWidth;
        frameCanvas.height = frameHeight;
        
        const frameCtx = frameCanvas.getContext('2d')!;
        frameCtx.drawImage(
          spriteSheet,
          col * frameWidth, row * frameHeight, frameWidth, frameHeight,
          0, 0, frameWidth, frameHeight
        );
        
        frames.push(frameCanvas);
      }
    }
    
    return frames;
  }

  /**
   * Create sprite sheet from individual frames
   */
  createSpriteSheet(
    frames: (HTMLImageElement | HTMLCanvasElement)[],
    columns: number
  ): HTMLCanvasElement {
    if (frames.length === 0) {
      throw new Error('No frames provided');
    }
    
    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;
    const rows = Math.ceil(frames.length / columns);
    
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = columns * frameWidth;
    sheetCanvas.height = rows * frameHeight;
    
    const sheetCtx = sheetCanvas.getContext('2d')!;
    
    frames.forEach((frame, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      sheetCtx.drawImage(
        frame,
        col * frameWidth,
        row * frameHeight
      );
    });
    
    return sheetCanvas;
  }

  /**
   * Optimize image for web
   */
  async optimizeForWeb(
    source: File | HTMLImageElement | HTMLCanvasElement,
    targetSizeKB: number = 500
  ): Promise<{ blob: Blob; compressionRatio: number }> {
    let quality = 0.9;
    let blob: Blob;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      const result = await this.resizeImage(source, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality,
        format: 'jpeg'
      });
      
      blob = result.blob;
      attempts++;
      
      if (blob.size > targetSizeKB * 1024 && attempts < maxAttempts) {
        quality *= 0.8; // Reduce quality
      }
    } while (blob.size > targetSizeKB * 1024 && attempts < maxAttempts);
    
    const originalSize = source instanceof File ? source.size : 0;
    const compressionRatio = originalSize > 0 ? blob.size / originalSize : 1;
    
    return { blob, compressionRatio };
  }

  /**
   * Get detailed image information
   */
  async getImageInfo(
    source: File | HTMLImageElement | HTMLCanvasElement
  ): Promise<ImageInfo> {
    const sourceImage = await this.loadImage(source);
    
    this.canvas.width = sourceImage.width;
    this.canvas.height = sourceImage.height;
    this.ctx.clearRect(0, 0, sourceImage.width, sourceImage.height);
    this.ctx.drawImage(sourceImage, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    const data = imageData.data;
    
    // Check for transparency
    let hasTransparency = false;
    const uniqueColors = new Set<string>();
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 255) {
        hasTransparency = true;
      }
      
      // Count unique colors (simplified)
      if (alpha > 0) {
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        uniqueColors.add(color);
      }
    }
    
    // Determine color depth based on unique colors
    let colorDepth = 24; // Default RGB
    if (hasTransparency) colorDepth = 32; // RGBA
    if (uniqueColors.size <= 256) colorDepth = 8; // 8-bit palette
    
    const size = source instanceof File ? source.size : 0;
    const format = source instanceof File ? 
      source.type.split('/')[1] || 'unknown' : 'canvas';
    
    return {
      width: sourceImage.width,
      height: sourceImage.height,
      hasTransparency,
      size,
      format,
      colorDepth
    };
  }

  /**
   * Apply filters to image
   */
  async applyFilter(
    source: File | HTMLImageElement | HTMLCanvasElement,
    filter: 'grayscale' | 'sepia' | 'invert' | 'brightness' | 'contrast',
    intensity: number = 1.0
  ): Promise<HTMLCanvasElement> {
    const sourceImage = await this.loadImage(source);
    
    this.canvas.width = sourceImage.width;
    this.canvas.height = sourceImage.height;
    this.ctx.clearRect(0, 0, sourceImage.width, sourceImage.height);
    this.ctx.drawImage(sourceImage, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, sourceImage.width, sourceImage.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      switch (filter) {
        case 'grayscale':
          const gray = (r * 0.299 + g * 0.587 + b * 0.114) * intensity + 
                      (r * (1 - intensity));
          data[i] = data[i + 1] = data[i + 2] = gray;
          break;
          
        case 'sepia':
          data[i] = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * intensity + r * (1 - intensity));
          data[i + 1] = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * intensity + g * (1 - intensity));
          data[i + 2] = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * intensity + b * (1 - intensity));
          break;
          
        case 'invert':
          data[i] = 255 - r * intensity + r * (1 - intensity);
          data[i + 1] = 255 - g * intensity + g * (1 - intensity);
          data[i + 2] = 255 - b * intensity + b * (1 - intensity);
          break;
          
        case 'brightness':
          data[i] = Math.min(255, Math.max(0, r + (255 * intensity - 255)));
          data[i + 1] = Math.min(255, Math.max(0, g + (255 * intensity - 255)));
          data[i + 2] = Math.min(255, Math.max(0, b + (255 * intensity - 255)));
          break;
          
        case 'contrast':
          const factor = (259 * (intensity * 255 + 255)) / (255 * (259 - intensity * 255));
          data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
          data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
          data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
          break;
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return this.canvas;
  }

  // Private helper methods

  private async loadImage(
    source: File | HTMLImageElement | HTMLCanvasElement
  ): Promise<HTMLImageElement | HTMLCanvasElement> {
    if (source instanceof HTMLCanvasElement) {
      return source;
    }
    
    if (source instanceof HTMLImageElement) {
      if (!source.complete) {
        await new Promise((resolve, reject) => {
          source.onload = resolve;
          source.onerror = reject;
        });
      }
      return source;
    }
    
    // File to Image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(source);
    });
  }

  private getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'png':
      default:
        return 'image/png';
    }
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, mimeType, quality);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Canvas cleanup is automatic
  }
}