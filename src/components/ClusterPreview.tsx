import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';

interface ClusterPreviewProps {
  diagonalAllowed: boolean;
  minSymbols: number;
}

const ClusterPreview: React.FC<ClusterPreviewProps> = ({ diagonalAllowed, minSymbols }) => {
  const [currentPattern, setCurrentPattern] = useState(0);

  // Memoize the patterns array since it's static data
  const patterns = useMemo(() => [
    // Square pattern (3x3)
    [
      [0,0,0,0,0],
      [0,1,1,1,0],
      [0,1,1,1,0],
      [0,1,1,1,0],
      [0,0,0,0,0]
    ],
    // L-shape pattern
    [
      [0,0,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,0]
    ],
    // T-shape pattern
    [
      [0,0,0,0,0],
      [0,0,1,0,0],
      [0,1,1,1,0],
      [0,0,1,0,0],
      [0,0,0,0,0]
    ],
    // Diagonal pattern (only shown if diagonal allowed)
    [
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,1,1,1,0],
      [0,0,1,1,0],
      [0,0,0,0,0]
    ],
    // Line pattern
    [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,1],
      [0,0,0,0,0],
      [0,0,0,0,0]
    ]
  ], []);

  // Memoize the pattern names to prevent recreation
  const patternNames = useMemo(() => [
    'Square Cluster',
    'L-Shape Cluster',
    'T-Shape Cluster',
    'Diagonal Cluster',
    'Line Cluster'
  ], []);

  // Filter patterns based on diagonal setting - memoized to avoid recalculation
  const availablePatterns = useMemo(() => 
    patterns.filter((_, index) => diagonalAllowed || index !== 3),
  [patterns, diagonalAllowed]);

  // Rotate through patterns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern((prev) => (prev + 1) % availablePatterns.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [availablePatterns.length]);

  // Lookup the pattern name - memoized to avoid recalculation on each render
  const currentPatternName = useMemo(() => {
    const patternIndex = patterns.indexOf(availablePatterns[currentPattern]);
    return patternNames[patternIndex];
  }, [patterns, availablePatterns, currentPattern, patternNames]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {availablePatterns[currentPattern].map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={clsx(
                'aspect-square rounded-lg transition-all duration-300',
                cell === 1 
                  ? 'bg-[#0052CC]' 
                  : 'bg-[#DFE1E6]'
              )}
            />
          ))
        ))}
      </div>
      
      <div className="flex items-center justify-between text-sm text-[#5E6C84]">
        <span>{currentPatternName}</span>
        <span>Min. {minSymbols} symbols required</span>
      </div>

      {/* Pattern Indicators */}
      <div className="flex justify-center gap-2">
        {availablePatterns.map((_, index) => (
          <div
            key={index}
            className={clsx(
              'w-2 h-2 rounded-full transition-all duration-200',
              currentPattern === index
                ? 'bg-[#0052CC] w-4'
                : 'bg-[#DFE1E6]'
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default React.memo(ClusterPreview);