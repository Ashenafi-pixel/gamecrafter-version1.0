import React from 'react';

const PaylinePreview: React.FC<{
  reels: number;
  rows: number;
  paylines: number;
  currentPayline: number;
  themeSymbols?: string[];
}> = ({ reels, rows, paylines, currentPayline, themeSymbols }) => {
  
  // Generate standard payline patterns for any grid size
  const generateStandardPaylinePatterns = () => {
    // This will hold all our payline patterns
    const patterns: number[][] = [];
    
    // SPECIAL CASE: Hard-coded unique patterns for 3x3 grid
    if (reels === 3 && rows === 3 && paylines <= 10) {
      // These are 10 GUARANTEED unique patterns for a 3x3 grid
      // Each pattern is completely distinct from every other pattern
      const patterns3x3 = [
        [0, 0, 0], // Pattern 1: Top row - horizontal
        [1, 1, 1], // Pattern 2: Middle row - horizontal
        [2, 2, 2], // Pattern 3: Bottom row - horizontal
        [0, 1, 2], // Pattern 4: Diagonal top-left to bottom-right ↘
        [2, 1, 0], // Pattern 5: Diagonal bottom-left to top-right ↗
        [0, 1, 0], // Pattern 6: Top-Middle-Top (V shape)
        [2, 1, 2], // Pattern 7: Bottom-Middle-Bottom (inverted V)
        [0, 1, 1], // Pattern 8: Top-Middle-Middle (unique zigzag)
        [2, 1, 1], // Pattern 9: Bottom-Middle-Middle (unique zigzag)
        [0, 2, 1]  // Pattern 10: Top-Bottom-Middle (unique zigzag)
      ];
      
      // Verify uniqueness with a Set by converting each pattern to a string
      const uniqueCheck = new Set(patterns3x3.map(p => p.join(',')));
      console.log(`3x3 pattern uniqueness verified: ${uniqueCheck.size === patterns3x3.length}`);
      
      return patterns3x3.slice(0, paylines);
    }
    
    // For other grid sizes, use the standard approach
    // Define payline patterns that adapt to different grid sizes
    // Each pattern contains row indices for each reel

    // --------------- BASIC HORIZONTAL PATTERNS ---------------
    // Line 1: Top horizontal
    patterns.push(Array(reels).fill(0));
    
    // Line 2: Middle horizontal
    if (rows === 3) {
      patterns.push(Array(reels).fill(1));
    } else {
      // For 4+ rows, use the middle-upper row
      const middleUpper = Math.floor(rows / 2) - (rows % 2 === 0 ? 1 : 0);
      patterns.push(Array(reels).fill(middleUpper));
    }
    
    // For 4+ rows, add a middle-lower horizontal
    if (rows >= 4) {
      const middleLower = Math.ceil(rows / 2);
      patterns.push(Array(reels).fill(middleLower));
    }
    
    // Line 3: Bottom horizontal
    patterns.push(Array(reels).fill(rows - 1));
    
    // --------------- DIAGONAL PATTERNS ---------------
    // Diagonal top-left to bottom-right
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        pattern.push(Math.min(i, rows - 1));
      }
      patterns.push(pattern);
    }
    
    // Diagonal bottom-left to top-right
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        pattern.push(Math.max(rows - 1 - i, 0));
      }
      patterns.push(pattern);
    }
    
    // --------------- V-SHAPES & INVERTED V-SHAPES ---------------
    // V-shape (top to bottom to top)
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        const midpoint = Math.floor(reels / 2);
        if (i <= midpoint) {
          pattern.push(Math.min(i, rows - 1));
        } else {
          pattern.push(Math.min(reels - i - 1, rows - 1));
        }
      }
      patterns.push(pattern);
    }
    
    // Inverted V-shape (bottom to top to bottom)
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        const midpoint = Math.floor(reels / 2);
        if (i <= midpoint) {
          pattern.push(Math.max(rows - 1 - i, 0));
        } else {
          pattern.push(Math.max(i - midpoint, 0));
        }
      }
      patterns.push(pattern);
    }
    
    // --------------- ZIGZAG PATTERNS ---------------
    // Zigzag pattern (top-bottom alternating)
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        pattern.push(i % 2 === 0 ? 0 : rows - 1);
      }
      patterns.push(pattern);
    }
    
    // Zigzag pattern (bottom-top alternating)
    {
      const pattern = [];
      for (let i = 0; i < reels; i++) {
        pattern.push(i % 2 === 0 ? rows - 1 : 0);
      }
      patterns.push(pattern);
    }
    
    // Add more patterns as needed
    while (patterns.length < paylines) {
      const patternType = patterns.length % 3;
      
      if (patternType === 0) {
        // Various zigzag patterns
        const pattern = [];
        const middle = Math.floor(rows / 2);
        for (let i = 0; i < reels; i++) {
          if (i % 3 === 0) pattern.push(0);
          else if (i % 3 === 1) pattern.push(middle);
          else pattern.push(rows - 1);
        }
        patterns.push(pattern);
      } else if (patternType === 1) {
        // Staircase pattern ascending
        const pattern = [];
        for (let i = 0; i < reels; i++) {
          pattern.push(Math.min(i % rows, rows - 1));
        }
        patterns.push(pattern);
      } else {
        // Staircase pattern descending
        const pattern = [];
        for (let i = 0; i < reels; i++) {
          pattern.push(Math.min(rows - 1 - (i % rows), rows - 1));
        }
        patterns.push(pattern);
      }
    }
    
    return patterns.slice(0, paylines);
  };
  
  // Get all payline patterns
  const allPatterns = generateStandardPaylinePatterns();
  
  // Get current payline pattern
  const currentPattern = allPatterns[currentPayline % allPatterns.length];
  
  // Create the pattern grid
  const pattern = Array(rows).fill(0).map(() => Array(reels).fill(0));
  
  // Mark active cells
  for (let i = 0; i < reels; i++) {
    if (i < currentPattern.length) {
      const rowPos = currentPattern[i];
      if (rowPos >= 0 && rowPos < rows) {
        pattern[rowPos][i] = 1;
      }
    }
  }
  
  // Set of payline colors for variety
  const paylineColors = [
    '#4f46e5', // Indigo
    '#2563eb', // Blue
    '#db2777', // Pink
    '#9333ea', // Purple
    '#16a34a', // Green
    '#ea580c', // Orange
    '#dc2626', // Red
    '#ca8a04'  // Yellow
  ];
  
  // Get color based on payline index
  const lineColor = paylineColors[currentPayline % paylineColors.length];
  
  // For small grids (especially 3x3), give names to payline patterns
  const getPaylinePatternName = (pattern: number[]): string => {
    if (reels === 3 && rows === 3) {
      const patternStr = pattern.join(',');
      
      // Exact names for our guaranteed unique patterns
      const patternNames: Record<string, string> = {
        '0,0,0': 'Top Row',
        '1,1,1': 'Middle Row',
        '2,2,2': 'Bottom Row',
        '0,1,2': 'Diagonal ↘',
        '2,1,0': 'Diagonal ↗',
        '0,1,0': 'V-Shape (Top)',
        '2,1,2': 'V-Shape (Bottom)',
        '0,1,1': 'Top-Mid-Mid',
        '2,1,1': 'Bottom-Mid-Mid',
        '0,2,1': 'Top-Bottom-Mid'
      };
      
      return patternNames[patternStr] || `Pattern #${currentPayline + 1}`;
    }
    
    // For larger grids, return a generic name
    return `Pattern #${currentPayline + 1}`;
  };
  
  // Get a description of the current pattern
  const patternName = getPaylinePatternName(currentPattern);
  
  // Special visual elements for 3x3 grids to make patterns more obvious
  const getPatternIcon = (pattern: number[]): React.ReactNode => {
    if (reels === 3 && rows === 3) {
      const patternStr = pattern.join(',');
      
      switch(patternStr) {
        case '0,0,0': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        );
        case '1,1,1': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        );
        case '2,2,2': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round" />
          </svg>
        );
        case '0,1,2': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l14 14" strokeLinecap="round" />
          </svg>
        );
        case '2,1,0': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 19l14-14" strokeLinecap="round" />
          </svg>
        );
        case '0,1,0': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l7 7l7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
        case '2,1,2': return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 19l7-7l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
        default: return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l5 5l4-4l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="payline-preview">
      <div className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-md px-3 py-2 border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center" style={{ backgroundColor: lineColor }}>
              {getPatternIcon(currentPattern) || (
                <span className="text-white font-bold text-xs">{currentPayline + 1}</span>
              )}
            </div>
            <span className="text-sm font-medium text-indigo-800">{patternName}</span>
          </div>
          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
            #{currentPayline + 1}/{paylines}
          </span>
        </div>
        <div className="text-xs text-indigo-600 mt-1 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span>Symbol positions: {currentPattern.map(p => p + 1).join(' → ')}</span>
        </div>
      </div>
      
      <div className="grid-pattern relative bg-white p-3 rounded-lg shadow-sm border border-gray-100 mt-2 mb-4">
        {/* Create a connecting line to show the payline path */}
        <svg className="absolute inset-0 z-0 h-full w-full overflow-visible" style={{ pointerEvents: 'none' }}>
          <path 
            d={`M ${
              // Generate path through center of active cells
              currentPattern.map((rowPos, colIndex) => {
                // Get center of cell
                // Cell size is inversely proportional to grid dimensions
                const cellSize = reels <= 3 && rows <= 3 ? 48 : 
                                reels <= 5 && rows <= 4 ? 36 : 28; // Responsive cell sizing based on grid
                const x = colIndex * cellSize + (cellSize / 2); 
                const y = rowPos * cellSize + (cellSize / 2);   
                return `${colIndex === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')
            }`}
            stroke={lineColor}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70"
            strokeDasharray="0"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="0"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={lineColor}
              />
            </marker>
          </defs>
        </svg>
        
        {/* Cell grid */}
        <div className={`grid gap-2 ${reels === 3 && rows === 3 ? 'scale-110 transform' : ''}`} 
             style={{ 
               gridTemplateColumns: `repeat(${reels}, 1fr)`,
               gridTemplateRows: `repeat(${rows}, 1fr)`
             }}>
          {Array.from({ length: reels * rows }).map((_, index) => {
            const rowIndex = Math.floor(index / reels);
            const colIndex = index % reels;
            const isActive = pattern[rowIndex][colIndex] === 1;
            const sequenceNumber = isActive ? currentPattern.findIndex(v => v === rowIndex && currentPattern.indexOf(v) === colIndex) + 1 : 0;
            
            // Apply special styling for active cells in 3x3 grids to make them more distinctive
            const specialStyling = reels === 3 && rows === 3 && isActive;
            
            return (
              <div 
                key={`cell-${rowIndex}-${colIndex}`}
                className={`
                  ${reels <= 3 && rows <= 3 ? 'w-12 h-12' : 
                    reels <= 5 && rows <= 4 ? 'w-9 h-9' : 'w-6 h-6'} 
                  rounded-md flex items-center justify-center transition-all duration-300 relative
                  ${isActive 
                    ? specialStyling 
                      ? 'bg-white shadow-lg z-10 scale-115 transform border-2' 
                      : 'bg-white shadow-md z-10 scale-110 border-2'
                    : 'bg-gray-100/80'
                  }
                `}
                style={isActive ? { 
                  borderColor: lineColor,
                  boxShadow: specialStyling ? `0 0 12px 2px ${lineColor}40` : ''
                } : {}}
              >
                {isActive && (
                  <div className="flex items-center justify-center w-full h-full">
                    <span className={`${reels <= 3 && rows <= 3 ? 'text-base' : 
                               reels <= 5 && rows <= 4 ? 'text-sm' : 'text-xs'} font-bold`} 
                          style={{ color: lineColor }}>
                      {colIndex + 1}
                    </span>
                    
                    {/* Position indicator */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                         style={{ backgroundColor: lineColor }}>
                      {currentPattern.indexOf(rowIndex) + 1}
                    </div>
                    
                    {/* Enhanced pulse animation for active cells */}
                    <div 
                      className="absolute inset-0 rounded-md animate-pulse opacity-20"
                      style={{ backgroundColor: lineColor }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced pattern description */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 p-2 rounded-md border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-600 flex items-start">
            <svg className="w-3.5 h-3.5 mr-1 text-indigo-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <span className="font-medium text-gray-700">How to win:</span> Match 3+ identical symbols along this payline
            </div>
          </div>
        </div>
        
        {reels === 3 && rows === 3 && (
          <div className="text-xs bg-blue-50 p-2 rounded-md border border-blue-100 text-blue-600 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>All 10 payline patterns are completely unique and guaranteed to be distinct</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaylinePreview;