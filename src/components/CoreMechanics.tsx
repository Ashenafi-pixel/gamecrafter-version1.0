import React, { useRef, useState } from 'react';
import { useGameStore } from '../store';
import { Grid, Layers, Box, Hexagon, Star, Coins, Zap, Settings, ChevronUp, ChevronDown, X, Trophy } from 'lucide-react';
import clsx from 'clsx';

const payMechanisms = [
  {
    id: 'betlines',
    name: 'Betlines',
    description: 'Classic slot game with fixed or adjustable paylines',
    icon: Layers,
    details: [
      'Fixed or adjustable paylines',
      'Traditional slot experience',
      'Simple win evaluation'
    ]
  },
  {
    id: 'cluster',
    name: 'Cluster Pays',
    description: 'Wins formed by connecting matching symbols',
    icon: Grid,
    details: [
      'Connected symbol groups',
      'No fixed paylines',
      'Cascading wins possible'
    ]
  },
  {
    id: 'ways',
    name: 'Ways to Win',
    description: 'All possible combinations across adjacent reels',
    icon: Star,
    details: [
      'No fixed paylines',
      'Left to right matching',
      'Multiple win paths'
    ]
  }
];

const gridTypes = [
  { 
    id: 'square', 
    name: 'Square', 
    reels: 5,
    rows: 5,
    icon: Grid,
    description: 'Classic square layout'
  },
  { 
    id: 'landscape', 
    name: 'Landscape', 
    reels: 5,
    rows: 3,
    icon: Box,
    description: 'Wider viewing area'
  },
  { 
    id: 'portrait', 
    name: 'Portrait', 
    reels: 3,
    rows: 5,
    icon: Box,
    description: 'Taller viewing area'
  },
  { 
    id: 'honeycomb', 
    name: 'Honeycomb', 
    reels: 5,
    rows: 5,
    icon: Hexagon,
    description: 'Unique hexagonal pattern'
  },
  {
    id: 'custom',
    name: 'Custom',
    reels: 3,
    rows: 3,
    icon: Settings,
    description: 'Custom grid layout'
  }
];

interface GridPreviewProps {
  shape: string;
  reels: number;
  rows: number;
  isSelected: boolean;
  onSelect: () => void;
}

const GridPreview: React.FC<GridPreviewProps> = ({ shape, reels: defaultReels, rows: defaultRows, isSelected, onSelect }) => {
  const { config } = useGameStore();
  
  // Use config values for custom grid, otherwise use default values
  const reels = shape === 'custom' ? config.reels?.layout?.reels || 3 : defaultReels;
  const rows = shape === 'custom' ? config.reels?.layout?.rows || 3 : defaultRows;
  
  // Currently only supporting landscape (5x3) classic reels grid
  const isAvailable = shape === 'landscape';

  const getHoneycombPattern = () => {
    const pattern = [
      [1, 2, 3],      // Top row
      [0, 1, 2, 3, 4], // Second row
      [0, 1, 2, 3, 4], // Middle row
      [0, 1, 2, 3, 4], // Fourth row
      [1, 2, 3],      // Bottom row
    ];
    return pattern;
  };

  const getCustomPattern = () => {
    // Create a dynamic grid based on actual reels and rows
    return Array.from({ length: rows }, () =>
      Array.from({ length: reels }, (_, i) => i)
    );
  };

  const renderGrid = () => {
    if (shape === 'honeycomb') {
      const pattern = getHoneycombPattern();
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          {pattern.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex gap-1"
              style={{
                transform: rowIndex % 2 === 0 ? 'translateX(8px)' : 'none'
              }}
            >
              {row.map((col) => (
                <div
                  key={`${rowIndex}-${col}`}
                  className="w-5 h-5 md:w-6 md:h-6"
                >
                  <div
                    className={clsx(
                      'w-full h-full rounded-full transition-all duration-200',
                      isSelected
                        ? 'bg-blue-200'
                        : 'bg-white border border-blue-100 group-hover:bg-blue-50'
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (shape === 'custom') {
      const pattern = getCustomPattern();
      const cellSize = Math.min(100 / Math.max(reels, rows), 20); // Dynamic cell size

      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative" style={{ width: `${cellSize * reels}px`, height: `${cellSize * rows}px` }}>
            {pattern.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((col) => (
                  <div
                    key={`${rowIndex}-${col}`}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px`, padding: '2px' }}
                  >
                    <div
                      className={clsx(
                        'w-full h-full rounded-full transition-all duration-200',
                        isSelected
                          ? 'bg-blue-200'
                          : 'bg-white border border-blue-100 group-hover:bg-blue-50'
                      )}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const aspectRatio = shape === 'landscape' ? 1.5 : shape === 'portrait' ? 0.67 : 1;
    const containerStyle = {
      aspectRatio: aspectRatio,
      width: shape === 'portrait' ? '75%' : '100%',
      margin: '0 auto'
    };

    return (
      <div className="h-full flex items-center justify-center">
        <div 
          className="grid gap-1.5"
          style={{
            ...containerStyle,
            gridTemplateColumns: `repeat(${reels}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: reels * rows }).map((_, i) => (
            <div
              key={i}
              className="aspect-square flex items-center justify-center"
            >
              <div
                className={clsx(
                  'w-full h-full rounded-full transition-all duration-200',
                  isSelected
                    ? 'bg-blue-200'
                    : 'bg-white border border-blue-100'
                )}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        onClick={() => isAvailable && onSelect()}
        className={clsx(
          'w-[140px] md:w-48 aspect-square rounded-xl transition-all duration-300 p-3 md:p-4 group overflow-hidden',
          isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
          isSelected 
            ? 'bg-blue-600 shadow-md'
            : 'bg-white border border-blue-100',
          isAvailable && !isSelected && 'hover:bg-blue-50'
        )}
      >
        {/* Coming Soon overlay for unavailable grids */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-gray-800/70 px-4 py-2 rounded-lg text-white font-semibold rotate-[-10deg]">
              COMING SOON
            </div>
          </div>
        )}
        
        {/* Grid Preview */}
        <div className="relative w-full h-full">
          {renderGrid()}
        </div>

        {/* Grid Info */}
        <div className={clsx(
          'absolute inset-x-0 bottom-0 p-3 md:p-4 text-center transition-all duration-200',
          isSelected ? 'text-white' : 'text-blue-600'
        )}>
          <h3 className="text-sm md:text-base font-medium mb-0.5">{gridTypes.find(g => g.id === shape)?.name}</h3>
          <p className="text-xs md:text-sm opacity-80">{reels}x{rows}</p>
        </div>
      </div>
    </div>
  );
};

const CoreMechanics: React.FC = () => {
  const { config, updateConfig, setStep } = useGameStore();
  const { reels } = config;
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current!.offsetLeft);
    setScrollLeft(sliderRef.current!.scrollLeft);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current!.offsetLeft);
    setScrollLeft(sliderRef.current!.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - sliderRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMechanismSelect = (mechanismId: string) => {
    updateConfig({
      reels: {
        ...config.reels,
        payMechanism: mechanismId
      }
    });
  };

  const handleGridSelect = (gridId: string) => {
    const grid = gridTypes.find(g => g.id === gridId);
    if (!grid) return;

    updateConfig({
      reels: {
        ...config.reels,
        layout: {
          ...config.reels?.layout,
          shape: gridId,
          reels: grid.reels,
          rows: grid.rows
        }
      }
    });
  };

  const updateGridDimension = (type: 'reels' | 'rows', value: number) => {
    const newValue = Math.min(Math.max(value, 3), 8);
    updateConfig({
      reels: {
        ...config.reels,
        layout: {
          ...config.reels?.layout,
          [type]: newValue
        }
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-32">
      {/* Pay Mechanism */}
      <div className="space-y-4">
        <div className="px-4 md:px-0">
          <h2 className="text-lg md:text-xl font-semibold text-[#172B4D] mb-2">Pay Mechanism</h2>
          <p className="text-sm md:text-base text-[#0052CC]">Choose how winning combinations are formed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 px-4 md:px-0">
          {payMechanisms.map((mechanism) => {
            // Only betlines (classic reels) is available
            const isAvailable = mechanism.id === 'betlines';
            
            return (
              <div
                key={mechanism.id}
                onClick={() => isAvailable && handleMechanismSelect(mechanism.id)}
                className={clsx(
                  'p-4 md:p-6 rounded-xl border transition-all duration-200',
                  !isAvailable && 'opacity-60 cursor-not-allowed relative',
                  isAvailable && 'cursor-pointer',
                  reels?.payMechanism === mechanism.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-800',
                  isAvailable && reels?.payMechanism !== mechanism.id && 'hover:border-blue-300'
                )}
              >
                {/* "Coming Soon" overlay for unavailable mechanisms */}
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-gray-800/70 px-4 py-2 rounded-lg text-white font-semibold rotate-[-10deg]">
                      COMING SOON
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={clsx(
                    'w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center',
                    reels?.payMechanism === mechanism.id
                      ? 'bg-white/20'
                      : 'bg-blue-100'
                  )}>
                    <mechanism.icon className={clsx(
                      'w-5 h-5 md:w-6 md:h-6',
                      reels?.payMechanism === mechanism.id
                        ? 'text-white'
                        : 'text-blue-600'
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-medium mb-1">{mechanism.name}</h3>
                    <p className="text-sm mb-2 md:mb-3">{mechanism.description}</p>
                    <ul className="space-y-1">
                      {mechanism.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs md:text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Configuration */}
      <div className="space-y-4">
        <div className="px-4 md:px-0">
          <h2 className="text-lg md:text-xl font-semibold text-blue-600 mb-2">Grid Configuration</h2>
          <p className="text-sm md:text-base text-blue-700">Select your game grid layout</p>
        </div>

        {/* Swipeable Grid Previews */}
        <div className="relative bg-white border border-blue-100 rounded-lg shadow-sm p-4 mx-4 md:mx-0">
          <h3 className="text-base md:text-lg font-medium text-blue-600 mb-4">Interactive Grid Designer</h3>
          <div 
            ref={sliderRef}
            className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 py-4"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {gridTypes.map((grid) => (
              <GridPreview
                key={grid.id}
                shape={grid.id}
                reels={grid.reels}
                rows={grid.rows}
                isSelected={reels?.layout?.shape === grid.id}
                onSelect={() => handleGridSelect(grid.id)}
              />
            ))}
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center items-center gap-2 mt-4">
            {gridTypes.map((grid) => (
              <button
                key={grid.id}
                onClick={() => handleGridSelect(grid.id)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  reels?.layout?.shape === grid.id
                    ? 'bg-[#0052CC] w-4'
                    : 'bg-[#DFE1E6] hover:bg-[#B3D4FF]'
                )}
                aria-label={`Select ${grid.name} layout`}
              />
            ))}
          </div>
        </div>

        {/* Custom Grid Controls */}
        {reels?.layout?.shape === 'custom' && (
          <div className="px-4 md:px-0 space-y-6">
            {/* Reels Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#172B4D]">
                  Number of Reels
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateGridDimension('reels', (reels?.layout?.reels || 3) - 1)}
                    disabled={reels?.layout?.reels <= 3}
                    className="p-1 hover:bg-[#F4F5F7] rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronDown className="w-4 h-4 text-[#172B4D]" />
                  </button>
                  <div className="w-12 px-2 py-1 bg-[#F4F5F7] rounded text-center text-[#172B4D]">
                    {reels?.layout?.reels}
                  </div>
                  <button
                    onClick={() => updateGridDimension('reels', (reels?.layout?.reels || 3) + 1)}
                    disabled={reels?.layout?.reels >= 8}
                    className="p-1 hover:bg-[#F4F5F7] rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronUp className="w-4 h-4 text-[#172B4D]" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={reels?.layout?.reels || 3}
                onChange={(e) => updateGridDimension('reels', parseInt(e.target.value))}
                className="w-full h-2 bg-[#DFE1E6] rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 
                  [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-[#0052CC]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            {/* Rows Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#172B4D]">
                  Number of Rows
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateGridDimension('rows', (reels?.layout?.rows || 3) - 1)}
                    disabled={reels?.layout?.rows <= 3}
                    className="p-1 hover:bg-[#F4F5F7] rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronDown className="w-4 h-4 text-[#172B4D]" />
                  </button>
                  <div className="w-12 px-2 py-1 bg-[#F4F5F7] rounded text-center text-[#172B4D]">
                    {reels?.layout?.rows}
                  </div>
                  <button
                    onClick={() => updateGridDimension('rows', (reels?.layout?.rows || 3) + 1)}
                    disabled={reels?.layout?.rows >= 8}
                    className="p-1 hover:bg-[#F4F5F7] rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronUp className="w-4 h-4 text-[#172B4D]" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={reels?.layout?.rows || 3}
                onChange={(e) => updateGridDimension('rows', parseInt(e.target.value))}
                className="w-full h-2 bg-[#DFE1E6] rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 
                  [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-[#0052CC]
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            <div className="text-xs text-[#5E6C84] text-center">
              Min: 3×3 • Max: 8×8
            </div>
          </div>
        )}
      </div>

      {/* Game Preview and Win Patterns */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 mx-4 md:mx-0">
        {/* Game Preview */}
        <div className="bg-white rounded-lg p-4 md:p-6 border border-blue-100 shadow-sm">
          <h3 className="text-base md:text-lg font-medium text-blue-600 mb-4">Game Preview</h3>
          <div className="aspect-video rounded-lg overflow-hidden bg-white border border-blue-100 flex items-center justify-center">
            <div className="grid grid-cols-5 grid-rows-3 gap-1 p-2 w-full max-w-xs">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="aspect-square rounded bg-blue-50 border border-blue-100"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Win Patterns */}
        <div className="bg-white rounded-lg p-4 md:p-6 border border-blue-100 shadow-sm">
          <h3 className="text-base md:text-lg font-medium text-blue-600 mb-4">Win Patterns</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((pattern) => (
              <div key={pattern} className="flex items-center gap-3">
                <div className="text-sm font-medium text-blue-600 w-8">#{pattern}</div>
                <div className="flex-1 bg-white border border-blue-100 rounded-lg p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded ${pattern === i+1 ? 'bg-blue-200' : 'bg-white border border-blue-100'}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-8 md:mt-12 bg-white rounded-xl p-4 md:p-6 border border-blue-100 shadow-sm mx-4 md:mx-0">
        <h3 className="text-lg md:text-xl font-semibold text-blue-600 mb-4 md:mb-6">Configuration Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="p-4 md:p-6 rounded-xl bg-blue-50 border border-blue-300">
            <h4 className="text-base md:text-lg font-medium text-blue-800 mb-3 md:mb-4">Pay Mechanism</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white flex items-center justify-center">
                <Layers className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm md:text-base">
                  {payMechanisms.find(m => m.id === reels?.payMechanism)?.name || 'Not selected'}
                </div>
                <div className="text-xs md:text-sm text-blue-600">
                  {payMechanisms.find(m => m.id === reels?.payMechanism)?.description}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 rounded-xl bg-blue-50 border border-blue-300">
            <h4 className="text-base md:text-lg font-medium text-blue-800 mb-3 md:mb-4">Grid Layout</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white flex items-center justify-center">
                <Grid className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-800 text-sm md:text-base">
                  {gridTypes.find(g => g.id === reels?.layout?.shape)?.name || 'Not selected'}
                </div>
                <div className="text-xs md:text-sm text-blue-600">
                  {reels?.layout?.reels}x{reels?.layout?.rows} Grid
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue to Features Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setStep(2)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-medium flex items-center gap-2 shadow-sm"
          >
            <Trophy className="w-5 h-5" />
            Continue to Bonus Features
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoreMechanics;