// Manual coordinate mapping system for spaced letters
// Works "like a human would do it manually" by detecting letter boundaries

export interface LetterBounds {
  letter: string;
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface ManualLetterExtractionResult {
  detectedLetters: LetterBounds[];
  wordBounds: { x: number; y: number; width: number; height: number };
  confidence: number;
  method: 'manual_spacing_detection';
}

// Common slot game text patterns to recognize
const COMMON_SLOT_TEXTS = [
  'WILD', 'BONUS', 'SCATTER', 'FREE', 'SPIN', 'WIN', 'JACKPOT',
  'MEGA', 'SUPER', 'MINI', 'MAJOR', 'MINOR', 'GRAND'
];

export const extractLettersManually = async (
  imageBase64: string,
  expectedText?: string
): Promise<ManualLetterExtractionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for pixel analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Find text regions using horizontal scanning
        const textRegions = findTextRegionsHorizontally(pixels, canvas.width, canvas.height);
        
        if (textRegions.length === 0) {
          resolve({
            detectedLetters: [],
            wordBounds: { x: 0, y: 0, width: 0, height: 0 },
            confidence: 0,
            method: 'manual_spacing_detection'
          });
          return;
        }
        
        // Focus on the largest text region (likely the main text)
        const mainTextRegion = textRegions.reduce((largest, current) => 
          (current.width * current.height) > (largest.width * largest.height) ? current : largest
        );
        
        console.log('🎯 Focusing on main text region:', mainTextRegion);
        
        // Extract individual letters from the main text region
        const letters = extractLettersFromRegion(
          pixels, 
          canvas.width, 
          canvas.height, 
          mainTextRegion,
          expectedText
        );
        
        console.log(`📝 Manual letter extraction found ${letters.length} letters in main text region`);
        
        resolve({
          detectedLetters: letters,
          wordBounds: mainTextRegion,
          confidence: letters.length > 0 ? 0.9 : 0,
          method: 'manual_spacing_detection'
        });
        
      } catch (error) {
        console.error('Manual letter extraction failed:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for manual extraction'));
    };
    
    img.src = imageBase64;
  });
};

function findTextRegionsHorizontally(
  pixels: Uint8ClampedArray, 
  width: number, 
  height: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const textRegions: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  // Scan for non-transparent/non-white pixels that likely represent text
  const nonBackgroundRows: number[] = [];
  const nonBackgroundCols: number[] = [];
  
  // Find rows with significant content (text)
  for (let y = 0; y < height; y++) {
    let contentPixels = 0;
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];
      
      // Consider pixel as content if it's not white/transparent and has decent opacity
      if (a > 100 && (r < 240 || g < 240 || b < 240)) {
        contentPixels++;
      }
    }
    
    // If row has sufficient content density, it's likely text
    if (contentPixels > width * 0.05) { // At least 5% of row width
      nonBackgroundRows.push(y);
    }
  }
  
  // Find columns with significant content
  for (let x = 0; x < width; x++) {
    let contentPixels = 0;
    for (let y = 0; y < height; y++) {
      const pixelIndex = (y * width + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];
      
      if (a > 100 && (r < 240 || g < 240 || b < 240)) {
        contentPixels++;
      }
    }
    
    if (contentPixels > height * 0.05) { // At least 5% of column height
      nonBackgroundCols.push(x);
    }
  }
  
  if (nonBackgroundRows.length === 0 || nonBackgroundCols.length === 0) {
    return [];
  }
  
  // Create text region from content boundaries
  const minY = Math.min(...nonBackgroundRows);
  const maxY = Math.max(...nonBackgroundRows);
  const minX = Math.min(...nonBackgroundCols);
  const maxX = Math.max(...nonBackgroundCols);
  
  // Look for horizontal gaps to split multiple text regions
  const horizontalGaps = findHorizontalGaps(pixels, width, height, minY, maxY);
  
  if (horizontalGaps.length === 0) {
    // Single text region
    textRegions.push({
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    });
  } else {
    // Multiple text regions separated by gaps
    let currentStart = minX;
    
    for (const gap of horizontalGaps) {
      if (gap.start > currentStart) {
        textRegions.push({
          x: currentStart,
          y: minY,
          width: gap.start - currentStart,
          height: maxY - minY + 1
        });
      }
      currentStart = gap.end + 1;
    }
    
    // Add final region if exists
    if (currentStart <= maxX) {
      textRegions.push({
        x: currentStart,
        y: minY,
        width: maxX - currentStart + 1,
        height: maxY - minY + 1
      });
    }
  }
  
  return textRegions;
}

function findHorizontalGaps(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  minY: number,
  maxY: number
): Array<{ start: number; end: number }> {
  const gaps: Array<{ start: number; end: number }> = [];
  let inGap = false;
  let gapStart = 0;
  
  for (let x = 0; x < width; x++) {
    let hasContent = false;
    
    // Check if this column has content in the text region
    for (let y = minY; y <= maxY; y++) {
      const pixelIndex = (y * width + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];
      
      if (a > 100 && (r < 240 || g < 240 || b < 240)) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent && !inGap) {
      // Start of gap
      inGap = true;
      gapStart = x;
    } else if (hasContent && inGap) {
      // End of gap
      inGap = false;
      if (x - gapStart > 5) { // Only count significant gaps
        gaps.push({ start: gapStart, end: x - 1 });
      }
    }
  }
  
  // Close final gap if needed
  if (inGap && width - gapStart > 5) {
    gaps.push({ start: gapStart, end: width - 1 });
  }
  
  return gaps;
}

function extractLettersFromRegion(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  textRegion: { x: number; y: number; width: number; height: number },
  expectedText?: string
): LetterBounds[] {
  const letters: LetterBounds[] = [];
  
  // Find vertical gaps within the text region to separate letters
  const verticalGaps = findVerticalGaps(pixels, width, height, textRegion);
  
  if (verticalGaps.length === 0) {
    // No gaps found - treat entire region as single letter/word
    const letterName = expectedText && expectedText.length === 1 ? expectedText : 'letter';
    letters.push({
      letter: letterName,
      bounds: {
        x: textRegion.x / width * 100, // Convert to percentage
        y: textRegion.y / height * 100,
        width: textRegion.width / width * 100,
        height: textRegion.height / height * 100
      },
      confidence: 0.8
    });
    return letters;
  }
  
  // Create letter bounds between gaps
  const letterRegions: Array<{ x: number; width: number }> = [];
  let currentStart = textRegion.x;
  
  for (const gap of verticalGaps) {
    if (gap.start > currentStart) {
      letterRegions.push({
        x: currentStart,
        width: gap.start - currentStart
      });
    }
    currentStart = gap.end + 1;
  }
  
  // Add final letter region
  if (currentStart < textRegion.x + textRegion.width) {
    letterRegions.push({
      x: currentStart,
      width: (textRegion.x + textRegion.width) - currentStart
    });
  }
  
  // Create letter bounds with names
  const expectedLetters = expectedText ? expectedText.split('') : [];
  
  for (let i = 0; i < letterRegions.length; i++) {
    const region = letterRegions[i];
    const letterName = expectedLetters[i] || `letter_${i + 1}`;
    
    letters.push({
      letter: letterName,
      bounds: {
        x: region.x / width * 100, // Convert to percentage
        y: textRegion.y / height * 100,
        width: region.width / width * 100,
        height: textRegion.height / height * 100
      },
      confidence: 0.9
    });
  }
  
  return letters;
}

function findVerticalGaps(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  textRegion: { x: number; y: number; width: number; height: number }
): Array<{ start: number; end: number }> {
  const gaps: Array<{ start: number; end: number }> = [];
  let inGap = false;
  let gapStart = 0;
  
  for (let x = textRegion.x; x < textRegion.x + textRegion.width; x++) {
    let hasContent = false;
    
    // Check if this column has content in the text region
    for (let y = textRegion.y; y < textRegion.y + textRegion.height; y++) {
      const pixelIndex = (y * width + x) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];
      
      if (a > 100 && (r < 240 || g < 240 || b < 240)) {
        hasContent = true;
        break;
      }
    }
    
    if (!hasContent && !inGap) {
      // Start of gap
      inGap = true;
      gapStart = x;
    } else if (hasContent && inGap) {
      // End of gap
      inGap = false;
      if (x - gapStart > 3) { // Only count gaps wider than 3 pixels
        gaps.push({ start: gapStart, end: x - 1 });
      }
    }
  }
  
  return gaps;
}

// Smart text recognition for common slot terms
export const detectExpectedText = (imageBase64: string): Promise<string | null> => {
  return new Promise((resolve) => {
    // Simple pattern matching based on image dimensions and common slot terms
    // This is a fallback when GPT-4 Vision isn't detecting text properly
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Analyze image aspect ratio and size to guess text type
      const aspectRatio = img.width / img.height;
      
      // Wide images likely contain longer text like "SCATTER" or "BONUS"
      if (aspectRatio > 2.5) {
        resolve('SCATTER'); // Most common long slot text
      } else if (aspectRatio > 1.5) {
        resolve('WILD'); // Most common medium slot text
      } else {
        resolve('WIN'); // Most common short slot text
      }
    };
    
    img.onerror = () => resolve(null);
    img.src = imageBase64;
  });
};