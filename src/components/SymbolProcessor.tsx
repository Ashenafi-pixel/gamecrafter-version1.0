import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, ImageOff, CheckCircle2, Loader } from 'lucide-react';

interface SymbolProcessorProps {
  symbol: string;
  onRegenerate: () => Promise<void>;
  index: number;
}

const SymbolProcessor: React.FC<SymbolProcessorProps> = ({ symbol, onRegenerate, index }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(true);
  const [showBackground, setShowBackground] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoize the regenerate handler to prevent recreation on every render
  const handleRegenerate = useCallback(async () => {
    setProcessing(true);
    setError(null);
    setProcessedImage(null);
    try {
      await onRegenerate();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [onRegenerate]);

  // Memoize the background removal function to prevent recreation on every render
  const removeBackground = useMemo(() => async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Handle CORS
      
      // Set up load handler
      img.onload = () => {
        try {
          console.log("Processing image for transparent background");
          
          // Create canvas with dimensions matching the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Set dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the image
          ctx.drawImage(img, 0, 0);
          
          // Get image data for processing
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Process each pixel - ultra aggressive white removal
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skip already transparent pixels
            if (data[i + 3] === 0) continue;
            
            // Calculate whiteness and variance
            const whiteness = (r * 0.299 + g * 0.587 + b * 0.114); // Weighted formula for luminance
            const variance = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
            
            // Very aggressive white detection - lower threshold to catch off-whites
            const isWhite = 
              (r > 230 && g > 230 && b > 230) || // Pure white check
              (whiteness > 225 && variance < 25); // Off-white with low color variance
            
            // Slightly off-white pixels
            const isOffWhite = (whiteness > 200 && variance < 30);
            
            // Make white pixels transparent
            if (isWhite) {
              data[i + 3] = 0; // Fully transparent
            } 
            // Make off-white pixels semi-transparent
            else if (isOffWhite) {
              data[i + 3] = Math.max(0, Math.min(255, 255 - whiteness)); // Scale transparency
            }
          }
          
          // Put processed data back to canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Apply additional processing for better results
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = canvas.width;
          finalCanvas.height = canvas.height;
          const finalCtx = finalCanvas.getContext('2d');
          
          if (finalCtx) {
            // First pass - apply slight blur for edge smoothing
            finalCtx.filter = 'blur(0.5px)';
            finalCtx.drawImage(canvas, 0, 0);
            
            // Reset filter
            finalCtx.filter = 'none';
            
            // Convert to PNG with full transparency
            const processedUrl = finalCanvas.toDataURL('image/png', 1.0);
            resolve(processedUrl);
          } else {
            // Fallback to original processed canvas
            const processedUrl = canvas.toDataURL('image/png', 1.0);
            resolve(processedUrl);
          }
        } catch (err) {
          console.error('Error processing image:', err);
          reject(err);
        }
      };
      
      // Error handler
      img.onerror = (err) => {
        console.error('Error loading image:', err);
        reject(new Error('Failed to load image for processing'));
      };
      
      // Start loading
      img.src = imageUrl;
    });
  }, []);

  // Process the image when it changes
  useEffect(() => {
    if (!symbol) return;
    
    const processImage = async () => {
      setIsProcessingImage(true);
      
      try {
        // Skip processing for placeholder images
        if (symbol.includes('placeholder') || symbol.includes('placehold.co')) {
          setProcessedImage(symbol);
          setIsProcessingImage(false);
          return;
        }
        
        console.log(`Processing symbol ${index + 1} to remove white background`);
        
        // Process image to remove white background
        const processed = await removeBackground(symbol);
        setProcessedImage(processed);
      } catch (err) {
        console.error('Error processing symbol:', err);
        setProcessedImage(symbol); // Use original as fallback
      } finally {
        setIsProcessingImage(false);
      }
    };
    
    processImage();
  }, [symbol, index, removeBackground]);

  // Function to toggle background display - memoized to prevent recreation on every render
  const toggleBackground = useCallback(() => {
    setShowBackground(prev => !prev);
  }, []);

  return (
    <div className="relative group">
      <div 
        className="aspect-square rounded-lg overflow-hidden bg-white border border-blue-100 shadow-sm"
        style={{ 
          backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.02) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.02) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
        }}
      >
        {isProcessingImage ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full relative">
            {showBackground ? (
              // Original image with background
              <img
                src={symbol}
                alt={`Symbol ${index + 1} (with background)`}
                className="w-full h-full object-contain p-2"
                style={{
                  imageRendering: 'crisp-edges',
                  mixBlendMode: 'normal'
                }}
              />
            ) : (
              // CSS masking technique for background removal
              <div className="w-full h-full">
                <div 
                  className="w-full h-full p-2"
                  style={{
                    backgroundImage: `url(${processedImage || symbol})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: `url(${processedImage || symbol})`,
                    maskImage: `url(${processedImage || symbol})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessingImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
          <div className="bg-white p-2 rounded-full shadow-md">
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
        </div>  
      )}

      {/* Control buttons */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleBackground}
          className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-md text-gray-600 hover:text-blue-600"
          title={showBackground ? "Show transparent" : "Show original"}
        >
          {showBackground ? 
            <CheckCircle2 className="w-3.5 h-3.5" /> : 
            <ImageOff className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Regenerate Button */}
      <button
        onClick={handleRegenerate}
        disabled={processing}
        className="absolute bottom-2 right-2 p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
      >
        <RefreshCw className={`w-4 h-4 text-blue-600 ${processing ? 'animate-spin' : ''}`} />
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1 shadow-lg">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(SymbolProcessor);