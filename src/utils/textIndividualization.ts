/**
 * Text Individualization System
 * Automatic text splitting into individual letters for letter-by-letter animation
 * Recreated from V1.0 functionality
 */

interface LetterBounds {
  letter: string;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

interface TextAnalysisResult {
  originalText: string;
  letters: LetterBounds[];
  totalWidth: number;
  totalHeight: number;
  spacing: number;
  layout: 'horizontal' | 'vertical' | 'custom';
}

interface IndividualizationOptions {
  minLetterWidth: number;
  minLetterHeight: number;
  maxGapSize: number;
  mergeThreshold: number;
  forceSpacing?: number;
  expectedText?: string;
}

class TextIndividualizationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Analyze image for text regions (alias for individualizeText)
   */
  async analyzeImage(
    imageUrl: string,
    options: IndividualizationOptions = {
      minLetterWidth: 10,
      minLetterHeight: 15,
      maxGapSize: 50,
      mergeThreshold: 5
    }
  ): Promise<{ success: boolean; letters: LetterBounds[]; error?: string }> {
    try {
      const result = await this.individualizeText(imageUrl, options);
      return {
        success: true,
        letters: result.letters
      };
    } catch (error) {
      console.error('❌ Text analysis failed:', error);
      return {
        success: false,
        letters: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze and individualize text from sprite image
   */
  async individualizeText(
    imageUrl: string,
    options: IndividualizationOptions = {
      minLetterWidth: 8,   // Smaller for better letter detection
      minLetterHeight: 12, // Smaller for better letter detection
      maxGapSize: 30,      // Smaller gaps to separate letters better
      mergeThreshold: 2    // Lower threshold to prevent letter merging
    }
  ): Promise<TextAnalysisResult> {
    try {
      // Load image
      const img = await this.loadImage(imageUrl);
      
      // Setup canvas
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.clearRect(0, 0, img.width, img.height);
      this.ctx.drawImage(img, 0, 0);

      // Get image data for analysis
      const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
      
      // Use improved letter detection for symbol+text images
      const letters = this.detectIndividualLetters(imageData, options);
      
      console.log(`✨ Detected ${letters.length} individual letters using improved algorithm`);
      
      // Analyze layout
      const layout = this.analyzeLayout(letters);
      
      // Calculate spacing
      const spacing = this.calculateOptimalSpacing(letters);

      const result: TextAnalysisResult = {
        originalText: options.expectedText || this.guessTextFromLetters(letters),
        letters,
        totalWidth: Math.max(...letters.map(l => l.x + l.width)) - Math.min(...letters.map(l => l.x)),
        totalHeight: Math.max(...letters.map(l => l.y + l.height)) - Math.min(...letters.map(l => l.y)),
        spacing,
        layout
      };

      console.log('📝 Text individualization result:', result);
      return result;

    } catch (error) {
      console.error('❌ Text individualization failed:', error);
      throw error;
    }
  }

  /**
   * Force letter spacing for animation optimization
   */
  optimizeForAnimation(
    letters: LetterBounds[],
    targetSpacing: number = 20
  ): LetterBounds[] {
    if (letters.length <= 1) return letters;

    // Sort letters by x position for horizontal layout
    const sortedLetters = [...letters].sort((a, b) => a.x - b.x);
    
    // Calculate new positions with forced spacing
    let currentX = sortedLetters[0].x;
    
    return sortedLetters.map((letter, index) => {
      if (index === 0) return letter;
      
      currentX += sortedLetters[index - 1].width + targetSpacing;
      
      return {
        ...letter,
        x: currentX
      };
    });
  }

  /**
   * Generate individual letter sprites
   */
  async generateLetterSprites(
    imageUrl: string,
    letters: LetterBounds[]
  ): Promise<Array<{
    letter: string;
    imageUrl: string;
    bounds: LetterBounds;
  }>> {
    const img = await this.loadImage(imageUrl);
    const letterSprites: Array<{
      letter: string;
      imageUrl: string;
      bounds: LetterBounds;
    }> = [];

    for (const letter of letters) {
      // Create canvas for individual letter
      const letterCanvas = document.createElement('canvas');
      const letterCtx = letterCanvas.getContext('2d')!;
      
      // Set canvas size with padding
      const padding = 5;
      letterCanvas.width = letter.width + padding * 2;
      letterCanvas.height = letter.height + padding * 2;
      
      // Clear with transparent background
      letterCtx.clearRect(0, 0, letterCanvas.width, letterCanvas.height);
      
      // Draw letter portion of original image
      letterCtx.drawImage(
        img,
        letter.x - padding,
        letter.y - padding,
        letter.width + padding * 2,
        letter.height + padding * 2,
        0,
        0,
        letterCanvas.width,
        letterCanvas.height
      );

      // Convert to data URL
      const letterImageUrl = letterCanvas.toDataURL('image/png');
      
      letterSprites.push({
        letter: letter.letter,
        imageUrl: letterImageUrl,
        bounds: letter
      });
    }

    return letterSprites;
  }

  /**
   * Create animation-ready letter sequence
   */
  createAnimationSequence(
    letters: LetterBounds[],
    sequenceType: 'wave' | 'typewriter' | 'bounce' | 'fade' = 'wave'
  ): Array<{
    letter: string;
    delay: number;
    duration: number;
    animation: string;
    bounds: LetterBounds;
  }> {
    return letters.map((letter, index) => {
      let delay = 0;
      let duration = 1000;
      let animation = '';

      switch (sequenceType) {
        case 'wave':
          delay = index * 100; // 100ms between letters
          duration = 800;
          animation = 'wave-bounce';
          break;
        case 'typewriter':
          delay = index * 150;
          duration = 300;
          animation = 'typewriter-appear';
          break;
        case 'bounce':
          delay = index * 80;
          duration = 600;
          animation = 'bounce-in';
          break;
        case 'fade':
          delay = index * 120;
          duration = 500;
          animation = 'fade-in';
          break;
      }

      return {
        letter: letter.letter,
        delay,
        duration,
        animation,
        bounds: letter
      };
    });
  }

  /**
   * Load image helper
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * SMART: Detect individual letters from a text block
   */
  private detectIndividualLetters(
    imageData: ImageData,
    options: IndividualizationOptions
  ): LetterBounds[] {
    console.log('🔍 Starting SMART letter detection for WILD text...');
    
    // First, find the main text region (should be "WILD" as one block)
    const textRegion = this.findMainTextRegion(imageData);
    if (!textRegion) {
      console.log('⚠️ No main text region found');
      return [];
    }
    
    console.log('🎯 Found main text region:', textRegion);
    
    // Extract the text region and split into individual letters
    const letters = this.extractTextLetters(imageData, textRegion, options.expectedText || 'WILD');
    
    console.log(`✅ Detected ${letters.length} ${options.expectedText || 'WILD'} letters:`, letters.map(l => `${l.letter}(${l.x},${l.y})`));
    return letters;
  }
  
  /**
   * Find the main text region (WILD text block)
   */
  private findMainTextRegion(
    imageData: ImageData
  ): { x: number; y: number; width: number; height: number } | null {
    const { width, height, data } = imageData;
    
    // Find text-like region (wide, horizontal)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasText = false;
    
    // Scan for text pixels (looking for horizontal text patterns)
    for (let y = 0; y < height; y++) {
      let rowPixels = 0;
      let rowMinX = width, rowMaxX = 0;
      
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 128) {
          rowPixels++;
          rowMinX = Math.min(rowMinX, x);
          rowMaxX = Math.max(rowMaxX, x);
        }
      }
      
      // If this row has significant horizontal text-like content
      if (rowPixels > width * 0.1 && (rowMaxX - rowMinX) > width * 0.2) {
        minX = Math.min(minX, rowMinX);
        maxX = Math.max(maxX, rowMaxX);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        hasText = true;
      }
    }
    
    if (!hasText) return null;
    
    return {
      x: minX - 5,
      y: minY - 5,
      width: maxX - minX + 10,
      height: maxY - minY + 10
    };
  }
  
  /**
   * Extract letters from text region using smart character width estimation
   */
  private extractTextLetters(
    imageData: ImageData,
    textRegion: { x: number; y: number; width: number; height: number },
    expectedText: string = 'WILD'
  ): LetterBounds[] {
    const letters: LetterBounds[] = [];
    const letterNames = expectedText.split('');
    
    // SMART: Use proportional widths based on character types (dynamic)
    const getCharacterWidth = (char: string): number => {
      switch (char.toUpperCase()) {
        case 'W': case 'M': return 0.28; // Wide letters
        case 'I': case 'J': case 'L': return 0.15; // Narrow letters
        case 'F': case 'P': case 'R': case 'B': return 0.22; // Medium letters
        case 'A': case 'H': case 'N': case 'U': return 0.24; // Medium-wide letters
        case 'O': case 'Q': case 'C': case 'G': case 'D': return 0.25; // Round letters
        case 'S': case 'Z': case 'K': case 'X': return 0.20; // Variable letters
        default: return 0.22; // Default medium width
      }
    };
    
    const letterWidths = letterNames.map(getCharacterWidth);
    const totalProportion = letterWidths.reduce((sum, width) => sum + width, 0);
    let currentX = 0;
    
    for (let i = 0; i < letterNames.length; i++) {
      const letterName = letterNames[i];
      const proportion = letterWidths[i] / totalProportion;
      const letterWidth = Math.floor(textRegion.width * proportion);
      
      // Add small overlap to ensure connected letters are captured properly
      const overlap = i < letterNames.length - 1 ? 3 : 0;
      
      letters.push({
        letter: letterName,
        x: Math.round(textRegion.x + currentX),
        y: Math.round(textRegion.y),
        width: Math.round(letterWidth + overlap),
        height: Math.round(textRegion.height),
        index: i
      });
      
      console.log(`📝 WILD Letter ${letterName}: x=${currentX}, width=${letterWidth + overlap} (${(proportion * 100).toFixed(1)}%)`);
      
      currentX += letterWidth;
    }
    
    // Adjust last letter to fill remaining space
    if (letters.length > 0) {
      const lastLetter = letters[letters.length - 1];
      lastLetter.width = textRegion.width - (lastLetter.x - textRegion.x);
      console.log('🔧 Adjusted last WILD letter width to:', lastLetter.width);
    }
    
    return letters;
  }

  /**
   * Find connected components using flood fill
   */
  private findConnectedComponents(
    imageData: ImageData,
    options: IndividualizationOptions
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const { width, height } = imageData;
    const data = imageData.data;
    const visited = new Array(width * height).fill(false);
    const components: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        // If pixel is visible and not visited
        if (alpha > 50 && !visited[y * width + x]) { // Lower threshold for better detection
          const component = this.floodFillComponent(imageData, x, y, visited);
          
          if (component.width >= 5 && component.height >= 5) { // Very small minimum
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }

  /**
   * Flood fill to find component boundaries
   */
  private floodFillComponent(
    imageData: ImageData,
    startX: number,
    startY: number,
    visited: boolean[]
  ): { x: number; y: number; width: number; height: number } {
    const { width, height } = imageData;
    const data = imageData.data;
    const stack = [{ x: startX, y: startY }];
    
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y * width + x]) continue;
      
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      
      if (alpha <= 50) continue; // Skip transparent pixels
      
      visited[y * width + x] = true;
      
      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors (4-connected)
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Find text regions in image (legacy method)
   */
  private findTextRegions(
    imageData: ImageData,
    options: IndividualizationOptions
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const { width, height } = imageData;
    const data = imageData.data;
    
    // Find connected components (text regions)
    const visited = new Array(width * height).fill(false);
    const regions: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        
        // If pixel is not transparent and not visited
        if (alpha > 100 && !visited[y * width + x]) {
          const region = this.floodFillRegion(imageData, x, y, visited);
          
          if (region.width >= options.minLetterWidth && 
              region.height >= options.minLetterHeight) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill to find connected region
   */
  private floodFillRegion(
    imageData: ImageData,
    startX: number,
    startY: number,
    visited: boolean[]
  ): { x: number; y: number; width: number; height: number } {
    const { width, height, data } = imageData;
    const stack = [{ x: startX, y: startY }];
    
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y * width + x]) continue;
      
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      
      if (alpha <= 100) continue; // Skip transparent pixels
      
      visited[y * width + x] = true;
      
      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Segment individual letters from text regions
   */
  private segmentLetters(
    regions: Array<{ x: number; y: number; width: number; height: number }>,
    imageData: ImageData,
    options: IndividualizationOptions
  ): LetterBounds[] {
    const letters: LetterBounds[] = [];

    regions.forEach((region, regionIndex) => {
      // If we have expected text, ALWAYS force split if there's only one region and multiple expected letters
      if (options.expectedText && options.expectedText.length > 1 && 
          (regions.length === 1 || region.width > (region.height * 1.2))) {
        
        console.log('🔤 FORCING letter split! Expected:', options.expectedText, 'Region width/height ratio:', (region.width / region.height).toFixed(2));
        
        // Split the region based on expected letter count
        const letterCount = options.expectedText.length;
        const letterWidth = region.width / letterCount;
        
        for (let i = 0; i < letterCount; i++) {
          letters.push({
            letter: options.expectedText[i],
            x: region.x + (i * letterWidth),
            y: region.y,
            width: letterWidth,
            height: region.height,
            index: i
          });
        }
        
        console.log('✅ Split into', letterCount, 'letters:', options.expectedText.split('').join(', '));
      } else {
        // Normal single letter region
        letters.push({
          letter: this.guessLetter(region, regionIndex, options.expectedText),
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          index: regionIndex
        });
        console.log('📝 Single letter region:', this.guessLetter(region, regionIndex, options.expectedText));
      }
    });

    // Sort by horizontal position (left to right)
    return letters.sort((a, b) => a.x - b.x);
  }

  /**
   * Analyze text layout (horizontal, vertical, custom)
   */
  private analyzeLayout(letters: LetterBounds[]): 'horizontal' | 'vertical' | 'custom' {
    if (letters.length <= 1) return 'horizontal';

    // Calculate average y-position variation
    const avgY = letters.reduce((sum, letter) => sum + letter.y, 0) / letters.length;
    const yVariation = letters.reduce((sum, letter) => sum + Math.abs(letter.y - avgY), 0) / letters.length;
    
    // Calculate average x-position variation  
    const avgX = letters.reduce((sum, letter) => sum + letter.x, 0) / letters.length;
    const xVariation = letters.reduce((sum, letter) => sum + Math.abs(letter.x - avgX), 0) / letters.length;

    if (yVariation < 10) return 'horizontal';
    if (xVariation < 10) return 'vertical';
    return 'custom';
  }

  /**
   * Calculate optimal spacing between letters
   */
  private calculateOptimalSpacing(letters: LetterBounds[]): number {
    if (letters.length <= 1) return 0;

    const gaps: number[] = [];
    for (let i = 1; i < letters.length; i++) {
      const gap = letters[i].x - (letters[i - 1].x + letters[i - 1].width);
      gaps.push(gap);
    }

    // Return median gap
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)] || 0;
  }

  /**
   * Guess text from letter positions and characteristics
   */
  private guessTextFromLetters(letters: LetterBounds[]): string {
    // Simple implementation - just return placeholder
    // In a more sophisticated version, we could use OCR or pattern matching
    return letters.map(l => l.letter).join('');
  }

  /**
   * Guess individual letter from region characteristics
   */
  private guessLetter(region: { width: number; height: number }, index: number, expectedText?: string): string {
    // If we have expected text, use it
    if (expectedText && index < expectedText.length) {
      return expectedText[index];
    }
    
    // Otherwise use alphabet
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[index % alphabet.length] || '?';
  }
}

export const textIndividualizationEngine = new TextIndividualizationEngine();
export type { TextAnalysisResult, LetterBounds, IndividualizationOptions };