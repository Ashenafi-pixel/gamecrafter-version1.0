import React, { useState, useEffect } from 'react';
import UnifiedSlotPreview from '../../slot-engine/UnifiedSlotPreview';

interface PremiumSlotPreviewBlockProps {
  title?: string;
  infoText?: string | React.ReactNode;
  hasEnoughSymbols?: () => boolean;
  notEnoughSymbolsMessage?: string;
  stepSource?: string;
  symbolsOverride?: string[];
  className?: string;
}

/**
 * Premium Slot Preview Block Component
 * 
 * This component provides the container and UI wrapper for the slot preview.
 * It includes:
 * - Title and info text
 * - Symbol validation messaging
 * - Responsive container sizing
 * - Integration with the UnifiedSlotPreview
 * 
 * The actual slot rendering is delegated to UnifiedSlotPreview to ensure
 * consistency across all steps.
 */
const PremiumSlotPreviewBlock: React.FC<PremiumSlotPreviewBlockProps> = ({
  title = "Premium Slot Preview",
  infoText = "This is a live preview of your slot machine.",
  hasEnoughSymbols = () => true,
  notEnoughSymbolsMessage = "Generate at least 9 symbols for a complete preview",
  stepSource = "unknown",
  symbolsOverride,
  className = ""
}) => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
  // Calculate responsive dimensions
  useEffect(() => {
    if (!containerRef) return;
    
    const updateDimensions = () => {
      const rect = containerRef.getBoundingClientRect();
      const aspectRatio = 1.5; // 3:2 aspect ratio
      
      let width = rect.width;
      let height = width / aspectRatio;
      
      // Constrain to container height if needed
      if (height > rect.height) {
        height = rect.height;
        width = height * aspectRatio;
      }
      
      // Apply max dimensions
      width = Math.min(width, 1200);
      height = Math.min(height, 800);
      
      setDimensions({ width, height });
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);
  
  const showPreview = hasEnoughSymbols();
  
  return (
    <div className={`premium-slot-preview-block ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        {typeof infoText === 'string' ? (
          <p className="text-gray-400 text-sm">{infoText}</p>
        ) : (
          infoText
        )}
      </div>
      
      {/* Preview Container */}
      <div 
        ref={setContainerRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {showPreview ? (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <UnifiedSlotPreview
              stepSource={stepSource}
              symbolsOverride={symbolsOverride}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400">{notEnoughSymbolsMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${showPreview ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-gray-400">
            {showPreview ? 'Preview Active' : 'Waiting for Symbols'}
          </span>
        </div>
        <span className="text-gray-500">
          Source: {stepSource}
        </span>
      </div>
    </div>
  );
};

export default PremiumSlotPreviewBlock;