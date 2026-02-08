import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { Tier1PixiSlot } from '../../slot-visualization/Tier1PixiSlot';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PurePixiGridPreview Component
 * ============================
 * 
 * State-of-the-art PIXI.js-only grid preview system.
 * No CSS grids, no competing implementations - just pure WebGL rendering.
 * 
 * Features:
 * - Single PIXI.js engine for all grid rendering
 * - Proper device mockups (Desktop, Mobile Portrait, Mobile Landscape)
 * - Responsive scaling and positioning
 * - Clean architecture with no competing systems
 */

interface PurePixiGridPreviewProps {
  className?: string;
  showMockups?: boolean;
}

type ViewMode = 'desktop' | 'portrait' | 'landscape';

export const PurePixiGridPreview: React.FC<PurePixiGridPreviewProps> = ({
  className = '',
  showMockups = true
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('desktop');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get current game configuration
  const { config } = useGameStore();
  const reels = config?.reels?.layout?.reels || 5;
  const rows = config?.reels?.layout?.rows || 3;
  
  // Helper function to get symbol URLs from both array and object formats
  const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
    if (!symbols) return [];
    if (Array.isArray(symbols)) return symbols;
    return Object.values(symbols);
  };

  // Get symbols from store
  const symbols = React.useMemo(() => {
    const symbolList = [];

    // Add generated symbols
    if (config?.theme?.generated?.symbols) {
      const symbolUrls = getSymbolUrls(config.theme.generated.symbols);
      symbolUrls.forEach((url, index) => {
        let symbolType = 'medium';
        const lowerUrl = url.toLowerCase();

        if (lowerUrl.includes('wild')) symbolType = 'wild';
        else if (lowerUrl.includes('scatter')) symbolType = 'scatter';
        else if (lowerUrl.includes('high') || index < 3) symbolType = 'high';
        else if (lowerUrl.includes('low') || index > 6) symbolType = 'low';

        symbolList.push({
          id: `generated_${index}`,
          url,
          type: symbolType
        });
      });
    }
    
    // Add uploaded symbols
    if (config?.symbols?.uploaded) {
      Object.entries(config.symbols.uploaded).forEach(([type, urls]) => {
        if (Array.isArray(urls)) {
          urls.forEach((url, index) => {
            symbolList.push({
              id: `${type}_${index}`,
              url,
              type
            });
          });
        }
      });
    }
    
    return symbolList;
  }, [config]);
  
  // Get background and frame
  const backgroundUrl = config?.theme?.generated?.background || null;
  const frameUrl = config?.theme?.generated?.frame || null;
  
  // Calculate dimensions based on view mode and grid size
  const getDimensions = () => {
    // Base dimensions for each view mode
    const baseDimensions = {
      desktop: { width: 1200, height: 800 },
      portrait: { width: 400, height: 700 },
      landscape: { width: 700, height: 400 }
    };
    
    const base = baseDimensions[viewMode] || baseDimensions.desktop;
    
    // Adjust for larger grids to ensure they fit
    if (reels >= 7 || rows >= 5) {
      // Scale up for larger grids
      return {
        width: Math.min(base.width * 1.2, 1400),
        height: Math.min(base.height * 1.2, 960)
      };
    }
    
    return base;
  };
  
  const { width, height } = getDimensions();
  
  if (!showMockups) {
    // Simple mode - just the PIXI canvas
    return (
      <div className={`w-full h-full bg-gray-900 ${className}`}>
        <Tier1PixiSlot
          width={width}
          height={height}
          className="w-full h-full"
        />
      </div>
    );
  }
  
  // Full mockup mode
  return (
    <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-4 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setViewMode('desktop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'desktop'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Desktop
        </button>
        <button
          onClick={() => setViewMode('portrait')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'portrait'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Portrait
        </button>
        <button
          onClick={() => setViewMode('landscape')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'landscape'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Smartphone className="w-4 h-4 rotate-90" />
          Landscape
        </button>
      </div>
      
      {/* Device Mockup */}
      <div className="flex-1 flex items-center justify-center p-8" ref={containerRef}>
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {viewMode === 'desktop' ? (
            <DesktopMockup width={width} height={height} />
          ) : viewMode === 'portrait' ? (
            <PhoneMockup orientation="portrait" width={width} height={height} />
          ) : (
            <PhoneMockup orientation="landscape" width={width} height={height} />
          )}
        </motion.div>
      </div>
      
      {/* Grid Info */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 text-center text-sm text-gray-400">
        Grid: {reels}×{rows} | Symbols: {symbols.length} | Mode: {viewMode}
      </div>
    </div>
  );
};

// Desktop Browser Mockup
const DesktopMockup: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
      {/* Browser Chrome */}
      <div className="bg-gray-700 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-600 rounded px-4 py-1 text-xs text-gray-300">
            slotgame.com
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ width: `${width}px`, height: `${height}px` }}>
        <Tier1PixiSlot
          width={width}
          height={height}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

// Phone Mockup
const PhoneMockup: React.FC<{ 
  orientation: 'portrait' | 'landscape'; 
  width: number; 
  height: number 
}> = ({ orientation, width, height }) => {
  const isPortrait = orientation === 'portrait';
  
  return (
    <div 
      className="relative bg-gray-900 rounded-3xl shadow-2xl p-2"
      style={{
        width: isPortrait ? `${width + 40}px` : `${width + 60}px`,
        height: isPortrait ? `${height + 80}px` : `${height + 40}px`
      }}
    >
      {/* Phone Frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl" />
      
      {/* Screen */}
      <div className="relative bg-black rounded-2xl overflow-hidden" 
           style={{ width: `${width}px`, height: `${height}px`, margin: 'auto' }}>
        <Tier1PixiSlot
          width={width}
          height={height}
          className="w-full h-full"
        />
      </div>
      
      {/* Notch (for portrait) */}
      {isPortrait && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-full" />
      )}
      
      {/* Home Indicator */}
      <div className={`absolute ${
        isPortrait ? 'bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1' : 'right-2 top-1/2 transform -translate-y-1/2 h-32 w-1'
      } bg-gray-600 rounded-full`} />
    </div>
  );
};

export default PurePixiGridPreview;