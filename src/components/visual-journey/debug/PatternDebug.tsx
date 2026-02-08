import React from 'react';

// This is a debugging component to visualize all 10 payline patterns for a 3x3 grid
const PatternDebug: React.FC = () => {
  // Hard-coded patterns for 3x3 grid (must match those in PaylinePreview.tsx)
  const patterns = [
    [0, 0, 0], // Pattern 1: Top row
    [1, 1, 1], // Pattern 2: Middle row
    [2, 2, 2], // Pattern 3: Bottom row
    [0, 1, 2], // Pattern 4: Diagonal top-left to bottom-right
    [2, 1, 0], // Pattern 5: Diagonal bottom-left to top-right
    [0, 0, 1], // Pattern 6: Top row to middle (different from all others)
    [2, 2, 1], // Pattern 7: Bottom row to middle
    [1, 0, 0], // Pattern 8: Middle to top row
    [1, 2, 2], // Pattern 9: Middle to bottom row
    [1, 0, 2]  // Pattern 10: Middle to top to bottom (zigzag)
  ];

  // Create visual grid patterns for each pattern
  const createPatternGrid = (pattern: number[]) => {
    const grid = Array(3).fill(0).map(() => Array(3).fill(0));
    
    // Mark active cells
    for (let i = 0; i < 3; i++) {
      const rowPos = pattern[i];
      if (rowPos >= 0 && rowPos < 3) {
        grid[rowPos][i] = 1;
      }
    }
    
    return grid;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Payline Pattern Debug View</h2>
      <p className="text-sm text-gray-600 mb-4">
        This shows all 10 payline patterns used for a 3x3 grid, each should be unique
      </p>
      
      <div className="grid grid-cols-5 gap-4">
        {patterns.map((pattern, index) => {
          const grid = createPatternGrid(pattern);
          
          return (
            <div key={`pattern-${index}`} className="border border-gray-200 p-2 rounded">
              <div className="text-sm font-medium mb-1">Pattern {index + 1}</div>
              <div className="text-xs text-gray-500 mb-2">[{pattern.join(',')}]</div>
              
              <div className="grid-pattern">
                {grid.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex gap-0.5 mb-0.5">
                    {row.map((cell, colIndex) => (
                      <div 
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`w-6 h-6 rounded ${
                          cell === 1 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100'
                        } flex items-center justify-center text-xs`}
                      >
                        {cell === 1 && colIndex + 1}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternDebug;