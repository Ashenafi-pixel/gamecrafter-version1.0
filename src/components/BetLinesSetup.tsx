import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  ArrowLeftRight,
  ArrowUpDown,
  Play,
  Pause,
  Grid,
  Info
} from 'lucide-react';
import clsx from 'clsx';

// Helper function to generate unique betlines
const generateBetlines = (reels: number, rows: number, totalLines: number) => {
  const betlines = [];
  const center = Math.floor(rows / 2);

  // Center line
  betlines.push(Array(reels).fill(center));

  // Top and bottom lines
  betlines.push(Array(reels).fill(0));
  betlines.push(Array(reels).fill(rows - 1));

  // Generate zigzag patterns
  while (betlines.length < totalLines) {
    // Zigzag from top
    const topZigzag = Array(reels).fill(0).map((_, i) => i % 2 === 0 ? 0 : 1);
    if (betlines.length < totalLines) betlines.push(topZigzag);

    // Zigzag from bottom
    const bottomZigzag = Array(reels).fill(0).map((_, i) => i % 2 === 0 ? rows - 1 : rows - 2);
    if (betlines.length < totalLines) betlines.push(bottomZigzag);

    // V pattern
    const vPattern = Array(reels).fill(0).map((_, i) => {
      const mid = Math.floor(reels / 2);
      return i <= mid ? i : reels - 1 - i;
    });
    if (betlines.length < totalLines) betlines.push(vPattern);

    // Inverted V pattern
    const invertedV = Array(reels).fill(0).map((_, i) => {
      const mid = Math.floor(reels / 2);
      return i <= mid ? rows - 1 - i : i - mid;
    });
    if (betlines.length < totalLines) betlines.push(invertedV);
  }

  return betlines.slice(0, totalLines);
};

const BetLinesSetup: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { reels, bet } = config;

  const [isAnimating, setIsAnimating] = useState(true);
  const [currentLine, setCurrentLine] = useState(0);
  const [selectedBet, setSelectedBet] = useState(bet?.min || 0.20);
  const [betRange, setBetRange] = useState({
    min: bet?.min || 0.20,
    max: bet?.max || 100.00
  });

  const isClusterPays = reels?.payMechanism === 'cluster';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleBetChange = (amount: number) => {
    const min = bet?.min || 0.20;
    const max = bet?.max || 100;
    const newBet = Math.min(Math.max(amount, min), max);
    setSelectedBet(newBet);
  };

  const handleQuickBet = (multiplier: number) => {
    const baseBet = bet?.min || 0.20;
    handleBetChange(baseBet * multiplier);
  };

  const handleBetRangeChange = (type: 'min' | 'max', value: number) => {
    const newRange = {
      ...betRange,
      [type]: value
    };
    
    if (type === 'min' && value > betRange.max) {
      newRange.min = betRange.max;
    }
    if (type === 'max' && value < betRange.min) {
      newRange.max = betRange.min;
    }

    setBetRange(newRange);
    updateConfig({
      bet: {
        ...config.bet,
        min: newRange.min,
        max: newRange.max
      }
    });
  };

  const handleClusterSettingsChange = (setting: string, value: any) => {
    updateConfig({
      reels: {
        ...config.reels,
        cluster: {
          ...config.reels?.cluster,
          [setting]: value
        }
      }
    });
  };

  const betlinePatterns = isClusterPays ? [] : 
    generateBetlines(
      reels?.layout?.reels || 5,
      reels?.layout?.rows || 3,
      reels?.betlines || 20
    );

  useEffect(() => {
    if (isAnimating && !isClusterPays) {
      const interval = setInterval(() => {
        setCurrentLine((prev) => (prev + 1) % betlinePatterns.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isAnimating, betlinePatterns.length, isClusterPays]);

  return (
    <div className="space-y-8 pb-32">
      {/* Bet Configuration */}
      <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm">
        <h3 className="text-xl font-semibold text-[#172B4D] mb-6">Bet Configuration</h3>
        
        {/* Current Bet Display */}
        <div className="bg-[#DEEBFF] rounded-lg border border-[#2684FF] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5E6C84] mb-1">Current Bet</div>
              <div className="text-3xl font-bold text-[#172B4D]">€{selectedBet.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBetChange(selectedBet - (bet?.increment || 0.20))}
                className="p-2 bg-white hover:bg-[#F4F5F7] rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-[#172B4D]" />
              </button>
              <button
                onClick={() => handleBetChange(selectedBet + (bet?.increment || 0.20))}
                className="p-2 bg-white hover:bg-[#F4F5F7] rounded-lg transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-[#172B4D]" />
              </button>
            </div>
          </div>

          {/* Quick Bet Options */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {[1, 2, 5, 10, 20, 50].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => handleQuickBet(multiplier)}
                className={clsx(
                  'p-2 rounded-lg border transition-colors text-center',
                  selectedBet === (bet?.min || 0.20) * multiplier
                    ? 'bg-[#0052CC] border-[#0052CC] text-white'
                    : 'bg-white border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]'
                )}
              >
                {multiplier}x
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-2">
              Bet Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#5E6C84] mb-1">
                  Minimum Bet
                </label>
                <input
                  type="number"
                  min="0.10"
                  step="0.10"
                  value={betRange.min}
                  onChange={(e) => handleBetRangeChange('min', parseFloat(e.target.value))}
                  className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5E6C84] mb-1">
                  Maximum Bet
                </label>
                <input
                  type="number"
                  min={betRange.min}
                  step="1"
                  value={betRange.max}
                  onChange={(e) => handleBetRangeChange('max', parseFloat(e.target.value))}
                  className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-2">
              Bet Increment
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0.10, 0.20, 0.50, 1.00].map((increment) => (
                <button
                  key={increment}
                  onClick={() => updateConfig({
                    bet: {
                      ...config.bet,
                      increment
                    }
                  })}
                  className={clsx(
                    'p-2 rounded-lg border transition-colors text-center',
                    bet?.increment === increment
                      ? 'bg-[#0052CC] text-white border-[#0052CC]'
                      : 'bg-white border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]'
                  )}
                >
                  €{increment.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lines Configuration */}
      <div className="bg-white rounded-lg p-6 border border-[#DFE1E6] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[#172B4D]">
              {isClusterPays ? 'Cluster Configuration' : 'Lines Configuration'}
            </h3>
            <p className="text-sm text-[#5E6C84] mt-1">
              {isClusterPays 
                ? 'Configure cluster pay settings'
                : 'Configure paylines and spin direction'
              }
            </p>
          </div>
          {!isClusterPays && (
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="p-2 bg-[#F4F5F7] hover:bg-[#DFE1E6] rounded-lg transition-colors"
            >
              {isAnimating ? (
                <Pause className="w-5 h-5 text-[#172B4D]" />
              ) : (
                <Play className="w-5 h-5 text-[#172B4D]" />
              )}
            </button>
          )}
        </div>

        {isClusterPays ? (
          <div className="space-y-6">
            {/* Minimum Cluster Size */}
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">
                Minimum Adjacent Symbols
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleClusterSettingsChange('minSymbols', size)}
                    className={clsx(
                      'p-2 rounded-lg border transition-colors',
                      reels?.cluster?.minSymbols === size
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagonal Connections */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reels?.cluster?.diagonalAllowed}
                  onChange={(e) => handleClusterSettingsChange('diagonalAllowed', e.target.checked)}
                  className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                />
                <span className="text-[#172B4D]">Allow Diagonal Connections</span>
                <div className="group relative">
                  <Info className="w-4 h-4 text-[#5E6C84]" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#172B4D] rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal w-48 text-center">
                    When enabled, symbols can connect diagonally to form clusters
                  </div>
                </div>
              </label>
            </div>

            {/* Cluster Preview */}
            <div className="bg-[#F4F5F7] rounded-lg p-4">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }).map((_, index) => {
                  const row = Math.floor(index / 5);
                  const col = index % 5;
                  const isCenter = row === 2 && col === 2;
                  const isAdjacent = (
                    (row === 1 && col === 2) || // top
                    (row === 2 && col === 1) || // left
                    (row === 2 && col === 3) || // right
                    (row === 3 && col === 2) || // bottom
                    (reels?.cluster?.diagonalAllowed && (
                      (row === 1 && col === 1) || // top-left
                      (row === 1 && col === 3) || // top-right
                      (row === 3 && col === 1) || // bottom-left
                      (row === 3 && col === 3)    // bottom-right
                    ))
                  );

                  return (
                    <div
                      key={index}
                      className={clsx(
                        'aspect-square rounded-lg transition-all duration-300',
                        isCenter ? 'bg-[#0052CC]' :
                        isAdjacent ? 'bg-[#2684FF]' :
                        'bg-[#DFE1E6]'
                      )}
                    />
                  );
                })}
              </div>
              <div className="text-center mt-4 text-sm text-[#5E6C84]">
                Example cluster formation
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">
                Number of Lines
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[10, 20, 25, 30, 40, 50].map((lines) => (
                  <button
                    key={lines}
                    onClick={() => updateConfig({
                      reels: {
                        ...config.reels,
                        betlines: lines
                      }
                    })}
                    className={clsx(
                      'p-2 rounded-lg border transition-colors',
                      reels?.betlines === lines
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]'
                    )}
                  >
                    {lines} Lines
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  // Generate betlines based on current grid and settings
                  const generatedLines = generateBetlines(
                    reels?.layout?.reels || 5,
                    reels?.layout?.rows || 3,
                    reels?.betlines || 20
                  );
                  
                  // Update the config with the generated betlines
                  updateConfig({
                    reels: {
                      ...config.reels,
                      betlinePatterns: generatedLines
                    }
                  });
                }}
                className="w-full p-3 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Auto-Generate Betlines</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">
                Spin Direction
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'vertical', label: 'Vertical', icon: ArrowUpDown },
                  { id: 'horizontal', label: 'Horizontal', icon: ArrowLeftRight }
                ].map((direction) => (
                  <button
                    key={direction.id}
                    onClick={() => updateConfig({
                      reels: {
                        ...config.reels,
                        spinDirection: direction.id
                      }
                    })}
                    className={clsx(
                      'p-4 rounded-lg border transition-colors flex items-center gap-2',
                      reels?.spinDirection === direction.id
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7]'
                    )}
                  >
                    <direction.icon className="w-5 h-5" />
                    <span>{direction.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payline Preview */}
        {!isClusterPays && betlinePatterns.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-lg border border-[#DFE1E6] p-4">
              <div className="grid gap-2" style={{
                gridTemplateColumns: `repeat(${reels?.layout?.reels || 5}, 1fr)`
              }}>
                {Array(reels?.layout?.rows || 3).fill(0).map((_, rowIndex) =>
                  Array(reels?.layout?.reels || 5).fill(0).map((_, colIndex) => {
                    const isHighlighted = betlinePatterns[currentLine]?.[colIndex] === rowIndex;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={clsx(
                          'aspect-square rounded-lg transition-all duration-300',
                          isHighlighted
                            ? 'bg-[#DEEBFF] border border-[#2684FF]'
                            : 'bg-[#F4F5F7] border border-[#DFE1E6]'
                        )}
                      />
                    );
                  })
                )}
              </div>
              <div className="text-center mt-4 text-sm text-[#5E6C84]">
                Showing line {currentLine + 1} of {betlinePatterns.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetLinesSetup;