import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the Symbol type that we'll be working with
interface GridSymbol {
  type: 'wild' | 'scatter' | 'bonus' | 'high' | 'medium' | 'low';
  name?: string;
  path: string;
}

// Props for the SymbolGrid component
interface SymbolGridProps {
  symbols: string[];  // Array of symbol image paths
  rows?: number;      // Number of rows in the grid (default: 3)
  cols?: number;      // Number of columns in the grid (default: 5)
  animate?: boolean;  // Whether to animate symbols (default: true)
  showBadges?: boolean; // Whether to show type badges (default: true)
}

// Badge colors for different symbol types
const typeBadgeColors: Record<string, string> = {
  wild: 'bg-amber-500 text-white',
  scatter: 'bg-purple-500 text-white',
  bonus: 'bg-pink-500 text-white',
  high: 'bg-red-500 text-white',
  medium: 'bg-green-500 text-white',
  low: 'bg-blue-500 text-white',
};

// Badge labels - prettier versions of the type names
const typeBadgeLabels: Record<string, string> = {
  wild: 'WILD',
  scatter: 'SCATTER',
  bonus: 'BONUS',
  high: 'HIGH',
  medium: 'MID',
  low: 'LOW',
};

/**
 * Component that displays symbols in a game-like grid layout
 */
const SymbolGrid: React.FC<SymbolGridProps> = ({
  symbols = [],
  rows = 3,
  cols = 5,
  animate = true,
  showBadges = true
}) => {
  // State to track whether symbols are loaded and ready to animate
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Detect symbol types from file paths
  const getSymbolType = (path: string): 'wild' | 'scatter' | 'bonus' | 'high' | 'medium' | 'low' => {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('wild')) return 'wild';
    if (pathLower.includes('scatter')) return 'scatter';
    if (pathLower.includes('bonus')) return 'bonus';
    if (pathLower.includes('high')) return 'high';
    if (pathLower.includes('mid') || pathLower.includes('medium')) return 'medium';
    
    // Default to low
    return 'low';
  };
  
  // Process symbols to ensure we have enough to fill the grid
  const processedSymbols: GridSymbol[] = [];
  const totalSlots = rows * cols;
  
  // ALWAYS use these fallback paths if the provided symbols don't load
  const fallbackSymbols = [
    '/assets/symbols/wild.png',
    '/assets/symbols/scatter.png',
    '/assets/symbols/high_1.png',
    '/assets/symbols/high_2.png',
    '/assets/symbols/high_3.png',
    '/assets/symbols/mid_1.png',
    '/assets/symbols/mid_2.png',
    '/assets/symbols/low_1.png',
    '/assets/symbols/low_2.png',
    '/assets/symbols/low_3.png',
    '/assets/symbols/placeholder.png' // last resort
  ];
  
  console.log('SymbolGrid rendering with', symbols.length, 'symbols');
  
  // Fill the grid with symbols
  for (let i = 0; i < totalSlots; i++) {
    // If we have a symbol at this index, use it
    // Otherwise, cycle through available symbols
    const symbolPath = symbols && symbols.length > 0 
      ? symbols[i % symbols.length] 
      : fallbackSymbols[i % fallbackSymbols.length];
    
    const type = i === 0 ? 'wild' : 
                i === 1 ? 'scatter' : 
                i < 5 ? 'high' : 'low';
    
    processedSymbols.push({
      type: type,
      path: symbolPath || fallbackSymbols[i % fallbackSymbols.length]
    });
  }
  
  // Trigger animation after component mounts
  useEffect(() => {
    setIsLoaded(false);
    
    // Small delay to ensure animation is visible
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [symbols.join(',')]);  // Re-run when symbols change
  
  return (
    <div className="w-full h-full relative">
      {/* Symbol grid container */}
      <div 
        className="grid absolute inset-0"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: '2px', // Minimal gap for a tighter slot machine look
          padding: '4px'  // Minimal padding to maximize symbol size
        }}
      >
        {/* Map each processed symbol to a grid cell */}
        {processedSymbols.map((symbol, index) => {
          // Calculate staggered animation delay based on position
          const row = Math.floor(index / cols);
          const col = index % cols;
          const delay = animate ? (row * 0.1 + col * 0.05) : 0;
          
          return (
            <AnimatePresence key={`${index}-${symbol.path}`}>
              <motion.div
                className="relative flex items-center justify-center h-full w-full"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                initial={animate ? { scale: 0.5, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={isLoaded ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20,
                  delay: delay
                }}
                layout // Added layout prop for automatic smooth animations when container changes
              >
                {/* Symbol image with enhanced fallback handling */}
                <img 
                  src={symbol.path} 
                  alt={symbol.name || `Symbol ${index}`}
                  className="object-contain"
                  style={{ 
                    width: '90%',  /* Fill more of the cell for better visibility */
                    height: '90%', /* Fill more of the cell for better visibility */
                    objectFit: 'contain', /* Keep aspect ratio */
                    filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.15))',
                    backgroundColor: 'rgba(255,255,255,0.1)', /* Subtle background for empty symbols */
                    borderRadius: '5px' /* Slight rounding for better appearance */
                  }}
                  onLoad={() => console.log(`Symbol loaded successfully: ${symbol.path.split('/').pop()}`)}
                  onError={(e) => {
                    console.error(`Symbol failed to load: ${symbol.path}`, e);
                    // Set a fallback image if loading fails - try different fallbacks in order
                    const fallbackPaths = [
                      '/assets/symbols/placeholder.png',
                      symbol.type === 'wild' ? '/assets/symbols/wild.png' : null,
                      symbol.type === 'scatter' ? '/assets/symbols/scatter.png' : null,
                      symbol.type === 'high' ? '/assets/symbols/high_1.png' : null,
                      symbol.type === 'medium' ? '/assets/symbols/mid_1.png' : null,
                      symbol.type === 'low' ? '/assets/symbols/low_1.png' : null,
                      '/assets/mockups/ancient-egypt/symbols/wild.png'
                    ].filter(Boolean);
                    
                    // Try the first fallback path
                    (e.target as HTMLImageElement).src = fallbackPaths[0];
                    (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop if fallback also fails
                  }}
                />
                
                {/* Symbol Type - always visible whether image loads or not */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`
                    ${typeBadgeColors[symbol.type]} 
                    w-8 h-8 flex items-center justify-center 
                    rounded-full text-xs font-bold z-0 opacity-70
                  `}>
                    {symbol.type.slice(0,1).toUpperCase()}
                  </div>
                </div>
                
                {/* Type badge */}
                {showBadges && (
                  <div 
                    className={`absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold ${typeBadgeColors[symbol.type]}`}
                    style={{ 
                      fontSize: '0.5rem', 
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      opacity: 0.9
                    }}
                  >
                    {typeBadgeLabels[symbol.type]}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
};

export default SymbolGrid;