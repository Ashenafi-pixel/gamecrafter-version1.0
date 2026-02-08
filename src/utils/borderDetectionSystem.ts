/**
 * Border Detection System for Precise Letter Coordinate Cutting
 * Uses GPT-4 Vision to detect exact letter boundaries in generated spaced text
 */

import { analyzeImageLayers } from './gptVisionClient';

export interface LetterBoundary {
  letter: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface BorderDetectionResult {
  success: boolean;
  letters: LetterBoundary[];
  originalDimensions: { width: number; height: number };
  extractedLetters: Array<{
    letter: string;
    imageUrl: string;
    bounds: LetterBoundary['bounds'];
  }>;
  error?: string;
}

export class BorderDetectionSystem {
  
  /**
   * Analyze generated sprite sheet and detect precise letter boundaries
   */
  async detectLetterBoundaries(
    imageBase64: string, 
    expectedText: string,
    imageDimensions: { width: number; height: number }
  ): Promise<BorderDetectionResult> {
    try {
      console.log(`🔍 Detecting letter boundaries for "${expectedText}"...`);
      
      // Enhanced GPT-4 Vision prompt for precise border detection
      const borderDetectionPrompt = {
        textLayout: 'individual' as const,
        analysisContext: 'precise_letter_coordinate_detection' as const,
        expectedText: expectedText,
        specialInstructions: `
🎯 ULTRA-PRECISE LETTER BOUNDARY DETECTION

TASK: Detect exact boundaries for each spaced letter in "${expectedText}" for pixel-perfect cutting.

LETTER SEQUENCE: ${expectedText.split('').map((letter, i) => `${i+1}. ${letter}`).join(', ')}

DETECTION REQUIREMENTS:
📐 For EACH individual letter, provide precise coordinates:
- Bounding box (x, y, width, height) as percentages (0-100)
- Include small buffer (1-2%) around each letter for clean edges
- Letters should be well-separated horizontally
- All letters should be on similar baseline (y-coordinate)

COORDINATE VALIDATION:
✓ No overlapping boundaries between letters
✓ Progressive x-coordinates from left to right
✓ Consistent y-coordinates (baseline alignment)
✓ Proportional widths based on letter shapes

EXPECTED LAYOUT: Spaced letters across top area, clearly separated for cutting.

Return individual letter detections with precise cutting coordinates.
        `
      };
      
      // Use existing GPT-4 Vision analysis with enhanced prompt
      console.log(`🔍 Analyzing image with enhanced border detection prompt...`);
      const layerAnalysis = await analyzeImageLayers(imageBase64, undefined, borderDetectionPrompt);
      
      // Initialize letter boundaries array and expected letters
      const letterBoundaries: LetterBoundary[] = [];
      const expectedLetters = expectedText.split('');
      
      // Check if GPT-4 Vision provided useful analysis
      if (!layerAnalysis.layers || layerAnalysis.layers.length === 0) {
        console.warn('⚠️ GPT-4 Vision returned no layers, using smart fallback for all letters...');
        // Force fallback for all letters
        for (let i = 0; i < expectedLetters.length; i++) {
          const expectedLetter = expectedLetters[i];
          const totalLetters = expectedLetters.length;
          const availableWidth = 70;
          const startX = 15;
          const letterWidth = availableWidth / totalLetters * 0.7;
          const letterSpacing = availableWidth / totalLetters * 0.3;
          
          letterBoundaries.push({
            letter: expectedLetter,
            bounds: {
              x: startX + (i * (letterWidth + letterSpacing)),
              y: 5,
              width: letterWidth,
              height: 15
            },
            confidence: 0.6
          });
          console.log(`📍 Smart fallback for "${expectedLetter}": x=${startX + (i * (letterWidth + letterSpacing))}, y=5`);
        }
      } else {
        // Process detected layers normally
        for (const expectedLetter of expectedLetters) {
          const detectedLayer = layerAnalysis.layers.find(layer => 
            layer.name.toLowerCase() === expectedLetter.toLowerCase() ||
            layer.description.toLowerCase().includes(expectedLetter.toLowerCase())
          );
          
          if (detectedLayer) {
            letterBoundaries.push({
              letter: expectedLetter,
              bounds: detectedLayer.bounds,
              confidence: 0.9
            });
            console.log(`✅ Detected boundary for letter "${expectedLetter}": ${JSON.stringify(detectedLayer.bounds)}`);
          } else {
            // Individual letter fallback
            const letterIndex = expectedLetters.indexOf(expectedLetter);
            const totalLetters = expectedLetters.length;
            const availableWidth = 70;
            const startX = 15;
            const letterWidth = availableWidth / totalLetters * 0.7;
            const letterSpacing = availableWidth / totalLetters * 0.3;
            
            letterBoundaries.push({
              letter: expectedLetter,
              bounds: {
                x: startX + (letterIndex * (letterWidth + letterSpacing)),
                y: 5,
                width: letterWidth,
                height: 15
              },
              confidence: 0.6
            });
            console.log(`📍 Generated smart fallback boundary for "${expectedLetter}": x=${startX + (letterIndex * (letterWidth + letterSpacing))}`);
          }
        }
      }
      
      // Extract individual letter images using canvas cutting
      const extractedLetters = await this.extractLettersUsingCoordinates(
        imageBase64,
        letterBoundaries,
        imageDimensions
      );
      
      return {
        success: true,
        letters: letterBoundaries,
        originalDimensions: imageDimensions,
        extractedLetters: extractedLetters
      };
      
    } catch (error) {
      console.error('Border detection failed:', error);
      return {
        success: false,
        letters: [],
        originalDimensions: { width: 0, height: 0 },
        extractedLetters: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Extract individual letter images using precise coordinates
   */
  private async extractLettersUsingCoordinates(
    imageBase64: string,
    letterBoundaries: LetterBoundary[],
    originalDimensions: { width: number; height: number }
  ): Promise<Array<{ letter: string; imageUrl: string; bounds: LetterBoundary['bounds'] }>> {
    
    const extractedLetters = [];
    
    try {
      // Create image element from base64
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/png;base64,${imageBase64}`;
      });
      
      // Extract each letter using canvas
      for (const boundary of letterBoundaries) {
        try {
          // Convert percentage coordinates to pixels
          const pixelBounds = {
            x: Math.round((boundary.bounds.x / 100) * originalDimensions.width),
            y: Math.round((boundary.bounds.y / 100) * originalDimensions.height),
            width: Math.round((boundary.bounds.width / 100) * originalDimensions.width),
            height: Math.round((boundary.bounds.height / 100) * originalDimensions.height)
          };
          
          // Create canvas for extraction
          const canvas = document.createElement('canvas');
          canvas.width = pixelBounds.width;
          canvas.height = pixelBounds.height;
          const ctx = canvas.getContext('2d')!;
          
          // Extract the letter region
          ctx.drawImage(
            img,
            pixelBounds.x, pixelBounds.y, pixelBounds.width, pixelBounds.height,
            0, 0, pixelBounds.width, pixelBounds.height
          );
          
          // Convert to base64
          const letterImageUrl = canvas.toDataURL('image/png');
          
          extractedLetters.push({
            letter: boundary.letter,
            imageUrl: letterImageUrl,
            bounds: boundary.bounds
          });
          
          console.log(`✅ Extracted letter "${boundary.letter}" using coordinates`);
          
        } catch (letterError) {
          console.error(`Failed to extract letter "${boundary.letter}":`, letterError);
        }
      }
      
    } catch (error) {
      console.error('Failed to extract letters using coordinates:', error);
    }
    
    return extractedLetters;
  }
}

// Export singleton instance
export const borderDetectionSystem = new BorderDetectionSystem();