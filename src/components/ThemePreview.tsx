import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCw } from 'lucide-react';
import clsx from 'clsx';

interface ThemePreviewProps {
  background?: string;
  symbols?: string[];
  frame?: string;
  gridSize?: { rows: number; cols: number };
  blackAndWhiteMode?: boolean;
}

interface ProcessedSymbols {
  [key: string]: string;
}

interface ReelState {
  symbols: string[];
  offset: number;
  speed: number;
  spinning: boolean;
}

const PREVIEW_DIMENSIONS = {
  width: 1280, // 16:9 aspect ratio for preview
  height: 720
};

// Animation settings
const SPIN_DURATION = {
  min: 2000, // Minimum spin time in ms
  max: 4000  // Maximum spin time in ms
};

const SPIN_DECELERATION = 0.95; // Rate at which spinning slows down

const ThemePreview: React.FC<ThemePreviewProps> = ({ 
  background,
  symbols = [],
  frame,
  gridSize = { rows: 3, cols: 5 /* Grid stays 3x5 for display purposes */ },
  blackAndWhiteMode = false
}) => {
  const [processedSymbols, setProcessedSymbols] = useState<ProcessedSymbols>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState<ReelState[]>([]);
  const animationRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  // Initialize reels when symbols change
  useEffect(() => {
    if (symbols.length === 0) return;
    
    // Make sure we have enough symbols to fill the entire grid
    let paddedSymbols = [...symbols];
    
    // If we don't have enough symbols for a full reel, duplicate them
    while (paddedSymbols.length < gridSize.rows * 2) {
      paddedSymbols = [...paddedSymbols, ...symbols];
    }
    
    // Create an array of reels
    const newReels = Array(gridSize.cols).fill(null).map((_, i) => {
      // Create a different shuffle for each reel
      const shuffledSymbols = shuffleArray([...paddedSymbols]);
      
      // Make sure we have at least 3 * gridSize.rows symbols for smooth animation
      let reelSymbols = [];
      while (reelSymbols.length < gridSize.rows * 4) {
        reelSymbols = [...reelSymbols, ...shuffledSymbols];
      }
      
      return {
        symbols: reelSymbols, // Each reel has many shuffled symbols
        offset: 0,
        speed: 0,
        spinning: false
      };
    });
    
    setReels(newReels);
  }, [symbols.length, gridSize.cols, gridSize.rows]);

  // Shuffle array helper function
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Function to handle spin animation
  const animateSpin = (timestamp: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }
    
    const deltaTime = timestamp - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = timestamp;
    
    // Update reel positions
    let allStopped = true;
    
    setReels(prevReels => {
      return prevReels.map((reel, index) => {
        if (!reel.spinning) return reel;
        
        allStopped = false;
        
        // Calculate speed factor - faster at the beginning, slower when stopping
        const speedFactor = reel.speed <= 3 ? 0.5 : 1.0; // Slow down visibly when stopping
        
        // Move the reel based on its speed - faster downward motion
        // We multiply by 2 to make it faster and more exciting
        let newOffset = reel.offset + (reel.speed * speedFactor * deltaTime / 500);
        
        // Wrap around when we've gone past the end of the symbols array
        if (newOffset >= reel.symbols.length) {
          newOffset = newOffset % reel.symbols.length;
        }
        
        // When slowing down, try to align to whole symbol positions
        let finalOffset = newOffset;
        if (reel.speed < 2) {
          // Calculate how close we are to the next whole position
          const fractional = newOffset - Math.floor(newOffset);
          
          // If we're close to a whole position, snap to it
          if (reel.speed < 0.8 && fractional > 0.9) {
            finalOffset = Math.ceil(newOffset);
          }
        }
        
        // Apply deceleration with a physics-based feeling
        // Faster deceleration when slowing down, slower initially
        const decelerationRate = reel.speed < 5 ? 
          SPIN_DECELERATION * 0.9 : // Slow deceleration at high speeds
          SPIN_DECELERATION * 0.95; // Faster deceleration at low speeds
        
        const newSpeed = reel.speed * decelerationRate;
        
        // Check if the reel should stop - use a higher threshold for a more decisive stop
        const shouldStop = newSpeed < 0.3 || (newSpeed < 0.8 && Math.abs(finalOffset - Math.round(finalOffset)) < 0.05);
        
        // Add a subtle "bounce" effect when stopping
        if (shouldStop) {
          // Snap to the nearest whole symbol position
          finalOffset = Math.round(finalOffset);
        }
        
        return {
          ...reel,
          offset: finalOffset,
          speed: shouldStop ? 0 : newSpeed,
          spinning: !shouldStop
        };
      });
    });
    
    // Continue animation if any reels are still spinning
    if (!allStopped) {
      animationRef.current = requestAnimationFrame(animateSpin);
    } else {
      // All reels have stopped - add a small delay for visual effect
      setTimeout(() => {
        setIsSpinning(false);
      }, 300);
      
      // Add winning highlight effects here if needed
    }
  };

  // Start spinning all reels
  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // We need to ensure we have symbols to work with
    if (symbols.length === 0) {
      console.error("Cannot spin with no symbols");
      setIsSpinning(false);
      return;
    }
    
    // Setup initial reel states if needed
    if (reels.length === 0 || reels.length !== gridSize.cols) {
      console.log("Initializing reels first...");
      const initialReels = Array(gridSize.cols).fill(null).map(() => ({
        symbols: shuffleArray([...symbols]),
        offset: 0,
        speed: 0,
        spinning: false
      }));
      setReels(initialReels);
      
      // We need to wait a frame for state to update before continuing
      requestAnimationFrame(() => {
        startSpinLogic();
      });
      return;
    }
    
    startSpinLogic();
  };
  
  // The actual spin logic - separated so we can initialize reels first if needed
  const startSpinLogic = () => {
    // Create more symbols than needed to ensure smooth looping
    const symbolsPerReel = Math.max(20, symbols.length * 2);
    
    // Pre-shuffle all symbols for better randomness - repeat symbols to create longer reels
    const allShuffledSymbols = Array(gridSize.cols).fill(null).map(() => {
      // Create a large array of shuffled symbols by repeating and reshuffling
      let reelSymbols = [];
      
      // We want enough symbols to create a good looping effect
      while (reelSymbols.length < symbolsPerReel) {
        reelSymbols = [...reelSymbols, ...shuffleArray([...symbols])];
      }
      
      // Trim to exact length needed
      return reelSymbols.slice(0, symbolsPerReel);
    });
    
    // Add a small random offset to each reel to make them not all start at the same position
    // and ensure they have different final positions
    const randomOffsets = Array(gridSize.cols).fill(0).map(() => Math.floor(Math.random() * 5));
    
    // Set initial state with shuffled symbols but not spinning yet
    setReels(prevReels => 
      prevReels.map((reel, i) => ({
        ...reel,
        symbols: allShuffledSymbols[i],
        offset: randomOffsets[i], // Start at a slight random position
        speed: 0,
        spinning: false
      }))
    );
    
    // Play a slot machine sound if available
    try {
      const spinSound = new Audio('/sounds/spin.mp3');
      spinSound.volume = 0.3;
      spinSound.play().catch(e => console.log('Could not play sound:', e));
    } catch (e) {
      // Sound not available, continue silently
    }
    
    // Immediately start animation frame to prepare
    lastUpdateTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animateSpin);
    
    // Stagger starting each reel with a faster initial momentum
    reels.forEach((_, index) => {
      // Very tight staggering for start (looks more exciting)
      const startDelay = index * 80; // Quick 80ms delay between each reel starting
      
      setTimeout(() => {
        setReels(currentReels => {
          if (!currentReels[index]) return currentReels; // Safety check
          
          const newReels = [...currentReels];
          newReels[index] = {
            ...newReels[index],
            spinning: true,
            // Higher starting speed for more dramatic effect
            speed: 20 + (Math.random() * 5) // High initial speed
          };
          return newReels;
        });
        
        // Add "acceleration" effect - increase speed after starting
        setTimeout(() => {
          setReels(currentReels => {
            if (!currentReels[index] || !currentReels[index].spinning) return currentReels;
            
            const newReels = [...currentReels];
            newReels[index] = {
              ...newReels[index],
              // Accelerate to make it feel more exciting
              speed: currentReels[index].speed * 1.2
            };
            return newReels;
          });
        }, 150); // Short acceleration burst
      }, startDelay);
      
      // Schedule each reel to stop after a calculated delay (staggered)
      const baseStopTime = 1800; // Base spin time
      const randomExtra = Math.random() * 200; // Small random factor
      // Increasing delay between reels stopping (dramatic effect)
      const reelStopGap = index === 0 ? 0 : (index === 1 ? 700 : index * 800); 
      
      const stopTime = baseStopTime + randomExtra + reelStopGap;
      
      // First start slowing down
      setTimeout(() => {
        setReels(currentReels => {
          if (!currentReels[index] || !currentReels[index].spinning) return currentReels;
          
          const newReels = [...currentReels];
          // Start the slowdown process gradually
          newReels[index] = {
            ...newReels[index],
            speed: newReels[index].speed * 0.7
          };
          return newReels;
        });
      }, stopTime - 200); // Start slowing down just before the main stop
      
      // Then apply the final slowdown
      setTimeout(() => {
        setReels(currentReels => {
          if (!currentReels[index] || !currentReels[index].spinning) return currentReels;
          
          const newReels = [...currentReels];
          // Make it slow down dramatically
          newReels[index] = {
            ...newReels[index],
            speed: newReels[index].speed * 0.3
          };
          return newReels;
        });
        
        // Play a stop sound with increasing pitch for each reel
        try {
          const stopSound = new Audio('/sounds/reel-stop.mp3');
          stopSound.playbackRate = 0.8 + (index * 0.1); // Increasing pitch
          stopSound.volume = 0.2;
          stopSound.play().catch(e => console.log('Could not play sound:', e));
        } catch (e) {
          // Sound not available, continue silently
        }
      }, stopTime);
    });
  };

  // Function to remove white background
  const removeBackground = async (imageUrl: string): Promise<string> => {
    // Create a new image object
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Handle CORS issues
      
      img.onload = () => {
        try {
          console.log(`Image loaded for processing: ${imageUrl.substring(0, 50)}...`);
          
          // Create canvas - try PIXI first, but fall back to Canvas API if PIXI fails
          let processedImageUrl = '';
          
          try {
            // First attempt with Canvas API (more reliable)
            processedImageUrl = processWithCanvasAPI(img);
            console.log("Background removal completed successfully with Canvas API");
            resolve(processedImageUrl);
          } catch (canvasError) {
            console.error('Error using Canvas API:', canvasError);
            // If Canvas API fails, resolve with the original image
            console.log("Using original image as fallback");
            resolve(imageUrl);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error loading image for background removal:', error);
        
        // If the image is base64, try to process it anyway
        if (imageUrl.startsWith('data:image')) {
          console.log('Image is base64, continuing despite error');
          img.onerror = null; // Remove the error handler to avoid infinite loops
          img.src = imageUrl; // Try again
        } else {
          reject(new Error('Failed to load image'));
        }
      };
      
      // For base64 images, we don't need crossOrigin
      if (imageUrl.startsWith('data:image')) {
        img.crossOrigin = null;
      }
      
      img.src = imageUrl;
    });
  };
  
  // Enhanced process image with standard Canvas API
  const processWithCanvasAPI = (img: HTMLImageElement): string => {
    try {
      // Create main canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Analyze image to determine if it needs background removal
      let hasWhiteBackground = false;
      let totalPixels = 0;
      let whitePixels = 0;
      
      // Sample the image border to check for white background
      // This helps avoid unnecessary processing for images that don't need it
      const sampleEdge = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
        
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        totalPixels++;
        if (r > 240 && g > 240 && b > 240) {
          whitePixels++;
        }
      };
      
      // Sample the edges of the image
      const edgeSampleSize = Math.max(20, Math.floor(Math.min(img.width, img.height) * 0.05));
      
      // Top and bottom edges
      for (let x = 0; x < canvas.width; x += edgeSampleSize) {
        sampleEdge(x, 0);
        sampleEdge(x, canvas.height - 1);
      }
      
      // Left and right edges
      for (let y = 0; y < canvas.height; y += edgeSampleSize) {
        sampleEdge(0, y);
        sampleEdge(canvas.width - 1, y);
      }
      
      // If more than 70% of the border pixels are white, likely has a white background
      hasWhiteBackground = (whitePixels / totalPixels > 0.7);
      
      // Skip processing if no white background detected
      if (!hasWhiteBackground && !img.src.includes('white') && !img.src.includes('background')) {
        console.log("No white background detected, skipping background removal");
        return canvas.toDataURL('image/png', 1.0);
      }
      
      // Process image data - make white background transparent
      // Improved algorithm with better edge detection
      const whiteThreshold = 230; // Threshold for considering a pixel as "white"
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip already transparent pixels
        if (a === 0) continue;
        
        // Calculate whiteness - weighted to account for human perception
        const whiteness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // Calculate color variance (how "colorful" the pixel is)
        const variance = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        
        // Enhanced adaptive transparency algorithm
        if (r > whiteThreshold && g > whiteThreshold && b > whiteThreshold) {
          // Pure white pixels - fully transparent
          data[i + 3] = 0;
        }
        else if (whiteness > 220 && variance < 20) {
          // Nearly white pixels - fully transparent
          data[i + 3] = 0;
        }
        else if (whiteness > 200 && variance < 25) {
          // Light pixels that could be edges - semi-transparent
          // Use a more refined alpha calculation with smoothing
          const alpha = Math.max(0, Math.min(50, Math.pow((220 - whiteness) / 20, 1.5) * 50));
          data[i + 3] = alpha;
        }
        else if (whiteness > 180 && variance < 30) {
          // Light colored pixels - slight transparency for better blending
          const alpha = Math.max(180, a - (whiteness - 180) * 3);
          data[i + 3] = alpha;
        }
      }
      
      // Put the processed data back on the canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Perform multiple passes for edge refinement
      // First cleanup pass - remove noise and clean edges
      const cleanupCanvas = document.createElement('canvas');
      cleanupCanvas.width = canvas.width;
      cleanupCanvas.height = canvas.height;
      const cleanupCtx = cleanupCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!cleanupCtx) {
        // Fallback to single-pass if second canvas fails
        return canvas.toDataURL('image/png', 1.0);
      }
      
      // First pass - slight blur to reduce noise
      cleanupCtx.filter = 'blur(0.5px)';
      cleanupCtx.drawImage(canvas, 0, 0);
      
      // Get data for edge enhancement
      const enhancedData = cleanupCtx.getImageData(0, 0, canvas.width, canvas.height);
      const enhancedPixels = enhancedData.data;
      
      // Enhanced edge cleanup with improved algorithm
      for (let i = 0; i < enhancedPixels.length; i += 4) {
        const r = enhancedPixels[i];
        const g = enhancedPixels[i + 1];
        const b = enhancedPixels[i + 2];
        const a = enhancedPixels[i + 3];
        
        // Process semi-transparent pixels for cleaner edges
        if (a > 0 && a < 60) {
          // Very transparent pixels become fully transparent
          enhancedPixels[i + 3] = 0;
        }
        
        // Remove remaining white halos more aggressively
        if (r > 220 && g > 220 && b > 220 && a > 0) {
          enhancedPixels[i + 3] = 0;
        }
        
        // Enhanced edge smoothing for color pixels with high luminance
        if (a > 60 && a < 160 && r > 180 && g > 180 && b > 180) {
          const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
          if (luminance > 200) {
            // Adjust alpha based on luminance
            enhancedPixels[i + 3] = Math.max(0, a - (luminance - 200));
          }
        }
      }
      
      // Put the enhanced data back
      cleanupCtx.putImageData(enhancedData, 0, 0);
      
      // Second clean-up pass - create final canvas with crisp edges
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const finalCtx = finalCanvas.getContext('2d');
      
      if (finalCtx) {
        // Draw with sharpen effect to crisp up edges
        finalCtx.drawImage(cleanupCanvas, 0, 0);
        
        // Try to apply a very slight sharpen effect if supported
        try {
          // Create a slight sharpening effect using a composite operation if available
          finalCtx.globalCompositeOperation = 'source-over';
          finalCtx.drawImage(cleanupCanvas, 0, 0);
          finalCtx.globalAlpha = 0.3;
          finalCtx.globalCompositeOperation = 'lighter';
          finalCtx.drawImage(cleanupCanvas, 0, 0);
          finalCtx.globalAlpha = 1.0;
          finalCtx.globalCompositeOperation = 'source-over';
        } catch (e) {
          // If sharpening fails, continue with normal drawing
          console.error("Error applying sharpening effect:", e);
        }
        
        // Get result as data URL with maximum quality
        return finalCanvas.toDataURL('image/png', 1.0);
      } else {
        // Fallback to first cleanup pass
        return cleanupCanvas.toDataURL('image/png', 1.0);
      }
    } catch (error) {
      // Return the original image data URL if processing fails
      console.error("Error in Canvas processing:", error);
      
      try {
        // Create a basic canvas to return the original image
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = img.width;
        fallbackCanvas.height = img.height;
        const fallbackCtx = fallbackCanvas.getContext('2d');
        if (fallbackCtx) {
          fallbackCtx.drawImage(img, 0, 0);
          return fallbackCanvas.toDataURL('image/png', 1.0);
        }
      } catch (fallbackError) {
        console.error("Error in fallback canvas:", fallbackError);
      }
      
      // If all else fails, throw the error to trigger the outer fallback
      throw error;
    }
  };

  // Process symbols when they change
  useEffect(() => {
    const processSymbols = async () => {
      if (!symbols || symbols.length === 0) {
        console.log("No symbols to process");
        return;
      }
    
      console.log(`Processing ${symbols.length} symbols for theme preview`);
      const processed: ProcessedSymbols = {};
      
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        if (!symbol) {
          console.log(`Symbol ${i} is null or undefined`);
          continue;
        }
        
        // Skip if already processed or is a placeholder
        if (processedSymbols[symbol] || symbol.includes('placehold.co')) {
          processed[symbol] = symbol;
          continue;
        }
        
        try {
          // Process base64 images immediately, no checks needed
          if (symbol.startsWith('data:image')) {
            console.log(`Symbol ${i} is base64, using directly`);
            processed[symbol] = symbol;
            continue;
          }
          
          // Skip background removal for symbols that don't need it
          // Check if it's a URL that mentions it's already processed
          if (symbol.includes('processed') || symbol.includes('transparent') || 
              symbol.includes('.png') || symbol.includes('no-bg')) {
            console.log(`Symbol ${i} appears already processed, using directly`);
            processed[symbol] = symbol; // Use as-is for already processed images
            continue;
          }
          
          // Always try to process the image - we'll check for white background inside removeBackground
          console.log(`Processing symbol ${i} for background removal`);
          try {
            const processedImage = await removeBackground(symbol);
            processed[symbol] = processedImage;
            console.log(`Successfully processed symbol ${i}`);
          } catch (processingError) {
            console.error(`Failed to process symbol ${i}:`, processingError);
            processed[symbol] = symbol; // Use original on error
          }
        } catch (error) {
          console.error(`Error handling symbol ${i}:`, error);
          processed[symbol] = symbol; // Use original on error
        }
      }
      
      setProcessedSymbols(processed);
      console.log(`Finished processing ${Object.keys(processed).length} symbols`);
    };
    
    processSymbols();
  }, [symbols]);
  
  // Helper function to detect if an image has a predominantly white background
  const checkForWhiteBackground = async (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        try {
          // Create a small canvas (we only need to sample the edges)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false); // Default to not processing if we can't check
            return;
          }
          
          // Set canvas to image size
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Check border pixels for whiteness
          const borderWidth = Math.max(5, Math.min(20, Math.floor(img.width * 0.05))); // 5% of width, min 5px, max 20px
          
          // Sample points from the border areas only
          let whitePixels = 0;
          let sampledPixels = 0;
          
          // Top border
          const topData = ctx.getImageData(0, 0, img.width, borderWidth).data;
          // Right border
          const rightData = ctx.getImageData(img.width - borderWidth, 0, borderWidth, img.height).data;
          // Bottom border
          const bottomData = ctx.getImageData(0, img.height - borderWidth, img.width, borderWidth).data;
          // Left border
          const leftData = ctx.getImageData(0, 0, borderWidth, img.height).data;
          
          // Combine all border data
          const allBorderData = [topData, rightData, bottomData, leftData];
          
          for (const data of allBorderData) {
            for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel (rgba)
              if (i + 3 >= data.length) break;
              
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Check if it's white or very light
              const whiteness = (r * 0.299 + g * 0.587 + b * 0.114);
              if (whiteness > 240) {
                whitePixels++;
              }
              sampledPixels++;
            }
          }
          
          // If more than 70% of border pixels are white, assume it has a white background
          const whitePercentage = whitePixels / sampledPixels;
          resolve(whitePercentage > 0.7);
          
        } catch (error) {
          console.error('Error analyzing image:', error);
          resolve(false); // Default to not processing if there's an error
        }
      };
      
      img.onerror = () => {
        resolve(false); // Default to not processing if image can't be loaded
      };
      
      img.src = imageUrl;
    });
  };

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Get visible symbols for each reel based on current offset
  const getVisibleSymbols = (reel: ReelState, rowCount: number) => {
    if (!reel || !reel.symbols || reel.symbols.length === 0) {
      return Array(rowCount).fill(null);
    }
    
    // Calculate the base index for the first symbol, ensuring it's at a position that shows row 1
    // Instead of using floor(), use a fixed offset to ensure all rows are visible
    // For a 3-row grid, we want to show symbols at positions 0, 1, and 2
    const baseIndex = 0; // Start at the beginning of the symbol array to show all rows
    
    // Get 'rowCount' symbols from the reel, ensuring we show all rows
    return Array(rowCount).fill(null).map((_, rowIndex) => {
      // Calculate the symbol index for this row, ensuring we display row 1, 2, and 3
      const symbolIndex = (baseIndex + rowIndex) % reel.symbols.length;
      // Get the symbol
      const symbol = reel.symbols[symbolIndex];
      return symbol;
    });
  };
  
  // Debug - check if we're missing any symbols
  useEffect(() => {
    if (symbols.length > 0) {
      console.log(`ThemePreview received ${symbols.length} symbols`);
    }
    if (processedSymbols && Object.keys(processedSymbols).length > 0) {
      console.log(`ThemePreview processed ${Object.keys(processedSymbols).length} symbols`);
    }
    if (reels.length > 0) {
      console.log(`ThemePreview has ${reels.length} reels with symbols:`, 
        reels.map(reel => reel.symbols?.length || 0));
    }
  }, [symbols, processedSymbols, reels]);

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden bg-slate-900/50"
      style={{ 
        aspectRatio: `${PREVIEW_DIMENSIONS.width}/${PREVIEW_DIMENSIONS.height}`,
      }}
    >
      {/* Background */}
      {background && (
        <div className="absolute inset-0">
          <img 
            src={background} 
            alt="Game background"
            className="w-full h-full object-cover"
            width={PREVIEW_DIMENSIONS.width}
            height={PREVIEW_DIMENSIONS.height}
          />
        </div>
      )}

      {/* Game window container - acts as a positioning wrapper */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Fixed aspect ratio container for the game window - explicitly enforce 5x3 aspect ratio */}
        <div 
          className="relative w-[80%] overflow-visible"
          style={{ 
            aspectRatio: '5/3', // Hard-coded 5:3 aspect ratio
            boxShadow: '0 20px 35px rgba(0,0,0,0.4)',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)', // Faded transparent background to see symbols better
            backdropFilter: 'blur(5px)'  // Blur effect for background
          }}
        >
          {/* All Symbols Display - Grid showing all symbols at once instead of reels */}
          <div 
            className="absolute inset-0 z-40 grid rounded-xl overflow-hidden"
            style={{
              padding: '3%', // Slightly less padding for more space
              gridTemplateColumns: `repeat(5, 1fr)`,
              gridTemplateRows: `repeat(3, 1fr)`,
              gap: '2%',
              background: 'rgba(0,0,0,0.15)' // Very subtle background for the grid
            }}
          >
            {/* Display all symbols in a grid */}
            {symbols.slice(0, 15).map((symbolSrc, index) => {
              const processedSymbol = symbolSrc ? processedSymbols[symbolSrc] : null;
              const row = Math.floor(index / 5);
              const col = index % 5;
              
              return (
                <div 
                  key={`symbol-grid-${index}`}
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    gridRow: row + 1,
                    gridColumn: col + 1,
                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                  }}
                >
                  {processedSymbol && (
                    <div className="w-full h-full flex items-center justify-center p-[8%]">
                      <img
                        src={processedSymbol}
                        alt={`Symbol ${index + 1}`}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          imageRendering: 'crisp-edges',
                          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
                          transition: 'transform 100ms',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
                  
          {/* Gradient overlay for depth effect */}
          <div 
            className="absolute inset-0 z-35 pointer-events-none opacity-25"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 100%)',
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)'
            }}
          ></div>
          
          {/* No spin button in this view - displaying all symbols in grid */}
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;