import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../store';

// Type definitions
interface LandscapeGridPreviewProps {
  /** Reels count (width) */
  reels: number;
  /** Rows count (height) */
  rows: number;
  /** Whether to animate grid cells */
  animate?: boolean;
  /** Pay mechanism (betlines, ways, cluster) */
  payMechanism?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Landscape Grid Preview Component
 * 
 * Displays a landscape mode (16:9) preview of the slot grid
 * Optimized for desktop/landscape viewing
 */
const LandscapeGridPreview: React.FC<LandscapeGridPreviewProps> = ({
  reels,
  rows,
  animate = true,
  payMechanism = 'betlines',
  className = ''
}) => {
  const { theme } = useGameStore(state => ({
    theme: state.theme
  }));
  
  // Cell animation variants for staggered animation
  const cellVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.02,
        duration: 0.3,
        type: 'spring',
        stiffness: 200,
        damping: 10
      }
    }),
    hover: { 
      scale: 1.05, 
      boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.2 }
    }
  };
  
  // Symbols for the grid
  const getSymbolPath = (index: number): string => {
    const baseSymbols = [
      "/public/assets/symbols/high_1.png",
      "/public/assets/symbols/high_2.png",
      "/public/assets/symbols/high_3.png",
      "/public/assets/symbols/low_1.png",
      "/public/assets/symbols/low_2.png",
      "/public/assets/symbols/low_3.png",
      "/public/assets/symbols/wild.png",
      "/public/assets/symbols/scatter.png",
      "/public/assets/symbols/mid_1.png"
    ];
    
    // Try to use themed symbols if available
    if (theme?.selectedThemeId) {
      const themeId = theme.selectedThemeId.toLowerCase();
      const symbolTypes = ["high_1", "high_2", "high_3", "low_1", "low_2", "low_3", "wild", "scatter", "mid_1"];
      
      // Use deterministic but seemingly random symbol type
      const symbolType = symbolTypes[index % symbolTypes.length];
      
      // Try theme-specific path first, but fall back to base symbols
      return `/public/assets/mockups/${themeId}/symbols/${symbolType}.png`;
    }
    
    return baseSymbols[index % baseSymbols.length];
  };
  
  // Generate grid cells
  const renderGridCells = () => {
    // Check for valid dimensions
    if (reels <= 0 || rows <= 0 || reels > 9 || rows > 9) return null;
    
    const cells = [];
    
    // Create the cells
    for (let row = 0; row < rows; row++) {
      for (let reel = 0; reel < reels; reel++) {
        // Generate a deterministic but seemingly random symbol index
        const symbolIndex = (row * 3 + reel * 7) % 9;
        
        cells.push(
          <motion.div
            key={`cell-${reel}-${row}`}
            className="rounded-md border border-white/30 overflow-hidden bg-black/20 hover:border-blue-400 backdrop-blur"
            custom={(row * reels) + reel} // For staggered animation
            initial="hidden"
            animate={animate ? "visible" : "hidden"}
            whileHover="hover"
            variants={cellVariants}
            style={{
              gridColumn: reel + 1,
              gridRow: row + 1,
              aspectRatio: "1/1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 5px rgba(255,255,255,0.1)"
            }}
          >
            <img 
              src={getSymbolPath(symbolIndex)} 
              alt={`Symbol at ${reel},${row}`} 
              className="w-3/4 h-3/4 object-contain transition-transform duration-300"
              onError={(e) => {
                // Fallback to base symbols if themed ones aren't available
                console.log("⚠️ Symbol image load error, using fallback", {
                  originalSrc: (e.target as HTMLImageElement).src,
                  symbolIndex
                });
                const target = e.target as HTMLImageElement;
                const fallback = `/public/assets/symbols/placeholder.png`;
                
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
          </motion.div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div 
      className={`relative bg-gradient-to-br from-gray-100 via-white to-blue-50 rounded-xl border-2 border-gray-300 p-4 overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '16/9', // 16:9 ratio (landscape)
        margin: '0 auto'
      }}
    >
      {/* Theme Background Overlay */}
      {theme?.selectedThemeId && (
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
          style={{
            backgroundImage: `url(/public/themes/${theme.selectedThemeId}.png)`
          }}
        ></div>
      )}
      
      {/* Decoration Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg"></div>
      
      {/* Game Title */}
      <div className="absolute top-2 left-0 right-0 text-center mb-2">
        <div className="inline-block px-4 py-1 bg-gray-800/70 text-white text-sm rounded-full backdrop-blur-sm">
          {theme?.mainTheme || 'Slot Game'} - Landscape
        </div>
      </div>
      
      {/* Grid Cells Container */}
      <div className="flex justify-center items-center h-full">
        <div 
          className="grid gap-[2px] w-full"
          style={{
            maxWidth: `${Math.min(600, reels * 90)}px`, 
            maxHeight: `${Math.min(400, rows * 75)}px`,
            gridTemplateColumns: `repeat(${reels}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {renderGridCells()}
        </div>
      </div>
      
      {/* Game Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-800/70 backdrop-blur-sm flex items-center justify-between px-8">
        <div className="text-white text-sm">
          <div>BALANCE: 1000.00</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gray-600/80 flex items-center justify-center">
            <span className="text-white text-xs">-</span>
          </div>
          <div className="text-white text-sm">BET: 1.00</div>
          <div className="w-10 h-10 rounded-full bg-gray-600/80 flex items-center justify-center">
            <span className="text-white text-xs">+</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xl">▶</span>
          </div>
        </div>
        
        <div className="text-white text-sm">
          <div>WIN: 0.00</div>
        </div>
      </div>
    </div>
  );
};

export default LandscapeGridPreview;