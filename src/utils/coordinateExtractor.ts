/**
 * Professional Coordinate-Based Sprite Extraction System
 * Extracts sprite pieces from a single source image using precise coordinates
 * Much more efficient and accurate than regenerating separate sprites
 */

export interface SpriteCoordinates {
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  type: 'character' | 'accessory' | 'text' | 'effect' | 'background';
  zIndex: number;
}

export interface ExtractedSprite {
  name: string;
  imageUrl: string; // Base64 data URL of the cropped sprite
  thumbnail: string; // Smaller preview version
  coordinates: SpriteCoordinates;
  originalBounds: { x: number; y: number; width: number; height: number };
}

export interface ExtractionResult {
  success: boolean;
  originalImage: string;
  originalDimensions: { width: number; height: number };
  extractedSprites: ExtractedSprite[];
  error?: string;
}

/**
 * Extracts sprites from source image using coordinate data
 */
export class CoordinateExtractor {
  
  /**
   * Main extraction function - crops sprites from original image using coordinates
   */
  async extractSpritesFromCoordinates(
    sourceImage: File | string,
    coordinates: SpriteCoordinates[]
  ): Promise<ExtractionResult> {
    try {
      console.log('🔧 Starting coordinate-based sprite extraction...');
      
      // Load the source image
      const { canvas, ctx, imageDimensions } = await this.loadImageToCanvas(sourceImage);
      
      console.log(`📏 Source image loaded: ${imageDimensions.width}x${imageDimensions.height}`);
      
      const extractedSprites: ExtractedSprite[] = [];
      
      // Extract each sprite using coordinates
      for (const coord of coordinates) {
        console.log(`✂️ Extracting sprite: ${coord.name}`);
        
        const sprite = await this.extractSingleSprite(canvas, ctx, coord, imageDimensions);
        if (sprite) {
          extractedSprites.push(sprite);
          console.log(`✅ Extracted: ${coord.name} (${sprite.coordinates.bounds.width}x${sprite.coordinates.bounds.height})`);
        }
      }
      
      // Convert original canvas to data URL for reference
      const originalImageUrl = canvas.toDataURL('image/png', 1.0);
      
      return {
        success: true,
        originalImage: originalImageUrl,
        originalDimensions: imageDimensions,
        extractedSprites,
      };
      
    } catch (error) {
      console.error('❌ Coordinate extraction failed:', error);
      return {
        success: false,
        originalImage: '',
        originalDimensions: { width: 0, height: 0 },
        extractedSprites: [],
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }
  
  /**
   * Loads image (File or data URL) onto a canvas for processing
   */
  private async loadImageToCanvas(source: File | string): Promise<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    imageDimensions: { width: number; height: number };
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw the source image onto canvas
        ctx.drawImage(img, 0, 0);
        
        resolve({
          canvas,
          ctx,
          imageDimensions: { width: img.width, height: img.height }
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load source image'));
      };
      
      // Handle both File objects and data URLs
      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(source);
      }
    });
  }
  
  /**
   * Extracts a single sprite from the canvas using coordinates
   */
  private async extractSingleSprite(
    sourceCanvas: HTMLCanvasElement,
    sourceCtx: CanvasRenderingContext2D,
    coordinates: SpriteCoordinates,
    imageDimensions: { width: number; height: number }
  ): Promise<ExtractedSprite | null> {
    try {
      // Convert percentage coordinates to actual pixels
      const actualBounds = this.convertPercentageToPixels(coordinates.bounds, imageDimensions);
      
      // Ensure bounds are within image dimensions
      const safeBounds = this.clampBoundsToImage(actualBounds, imageDimensions);
      
      // Create new canvas for the extracted sprite
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = safeBounds.width;
      spriteCanvas.height = safeBounds.height;
      
      const spriteCtx = spriteCanvas.getContext('2d');
      if (!spriteCtx) {
        throw new Error('Failed to create sprite canvas context');
      }
      
      // Extract the sprite area from source canvas
      const imageData = sourceCtx.getImageData(
        safeBounds.x,
        safeBounds.y,
        safeBounds.width,
        safeBounds.height
      );
      
      // Draw extracted data onto sprite canvas
      spriteCtx.putImageData(imageData, 0, 0);
      
      // Generate high-quality sprite image
      const spriteImageUrl = spriteCanvas.toDataURL('image/png', 1.0);
      
      // Generate thumbnail (smaller version for UI)
      const thumbnail = await this.generateThumbnail(spriteCanvas, 80, 80);
      
      return {
        name: coordinates.name,
        imageUrl: spriteImageUrl,
        thumbnail,
        coordinates,
        originalBounds: safeBounds
      };
      
    } catch (error) {
      console.error(`❌ Failed to extract sprite ${coordinates.name}:`, error);
      return null;
    }
  }
  
  /**
   * Converts percentage-based coordinates to pixel coordinates
   */
  private convertPercentageToPixels(
    bounds: { x: number; y: number; width: number; height: number },
    imageDimensions: { width: number; height: number }
  ) {
    return {
      x: Math.round((bounds.x / 100) * imageDimensions.width),
      y: Math.round((bounds.y / 100) * imageDimensions.height),
      width: Math.round((bounds.width / 100) * imageDimensions.width),
      height: Math.round((bounds.height / 100) * imageDimensions.height)
    };
  }
  
  /**
   * Ensures extraction bounds don't exceed image dimensions
   */
  private clampBoundsToImage(
    bounds: { x: number; y: number; width: number; height: number },
    imageDimensions: { width: number; height: number }
  ) {
    const clampedBounds = {
      x: Math.max(0, Math.min(bounds.x, imageDimensions.width - 1)),
      y: Math.max(0, Math.min(bounds.y, imageDimensions.height - 1)),
      width: bounds.width,
      height: bounds.height
    };
    
    // Adjust width and height to fit within image
    clampedBounds.width = Math.min(clampedBounds.width, imageDimensions.width - clampedBounds.x);
    clampedBounds.height = Math.min(clampedBounds.height, imageDimensions.height - clampedBounds.y);
    
    return clampedBounds;
  }
  
  /**
   * Generates a thumbnail version of the sprite
   */
  private async generateThumbnail(
    spriteCanvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    
    if (!thumbnailCtx) {
      return spriteCanvas.toDataURL('image/png', 0.8);
    }
    
    // Calculate thumbnail dimensions maintaining aspect ratio
    const aspectRatio = spriteCanvas.width / spriteCanvas.height;
    let thumbWidth = maxWidth;
    let thumbHeight = maxHeight;
    
    if (aspectRatio > 1) {
      thumbHeight = maxWidth / aspectRatio;
    } else {
      thumbWidth = maxHeight * aspectRatio;
    }
    
    thumbnailCanvas.width = Math.round(thumbWidth);
    thumbnailCanvas.height = Math.round(thumbHeight);
    
    // Draw scaled sprite onto thumbnail canvas
    thumbnailCtx.drawImage(
      spriteCanvas,
      0, 0, spriteCanvas.width, spriteCanvas.height,
      0, 0, thumbnailCanvas.width, thumbnailCanvas.height
    );
    
    return thumbnailCanvas.toDataURL('image/png', 0.8);
  }
  
  /**
   * Utility function to validate coordinates
   */
  validateCoordinates(coordinates: SpriteCoordinates[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    coordinates.forEach((coord, index) => {
      if (!coord.name || coord.name.trim() === '') {
        errors.push(`Coordinate ${index}: Missing name`);
      }
      
      if (coord.bounds.x < 0 || coord.bounds.x > 100) {
        errors.push(`Coordinate ${index} (${coord.name}): X position out of range (0-100%)`);
      }
      
      if (coord.bounds.y < 0 || coord.bounds.y > 100) {
        errors.push(`Coordinate ${index} (${coord.name}): Y position out of range (0-100%)`);
      }
      
      if (coord.bounds.width <= 0 || coord.bounds.width > 100) {
        errors.push(`Coordinate ${index} (${coord.name}): Invalid width`);
      }
      
      if (coord.bounds.height <= 0 || coord.bounds.height > 100) {
        errors.push(`Coordinate ${index} (${coord.name}): Invalid height`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const coordinateExtractor = new CoordinateExtractor();