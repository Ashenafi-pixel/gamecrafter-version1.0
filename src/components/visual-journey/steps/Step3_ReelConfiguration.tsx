import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import {
  PlusSquare,
  MinusSquare,
  Tag,
  LayoutTemplate,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { useStoredSymbols } from '../../../utils/symbolStorage';

// Grid presets with recommended layouts based on game mechanics
const GRID_PRESETS = {
  'betlines': [
    { reels: 3, rows: 3, name: '3×3', description: 'Classic fruit machine layout' },
    { reels: 5, rows: 3, name: '5×3', description: 'Standard video slot layout' },
    { reels: 5, rows: 4, name: '5×4', description: 'Extended reel layout' },
    { reels: 6, rows: 3, name: '6×3', description: 'Wide layout for more symbols' },
    { reels: 6, rows: 4, name: '6×4', description: 'Extended wide layout' }
  ],
  'ways': [
    { reels: 3, rows: 3, name: '3×3', description: '27 ways' },
    { reels: 5, rows: 3, name: '5×3', description: '243 ways' },
    { reels: 5, rows: 4, name: '5×4', description: '1024 ways' },
    { reels: 6, rows: 3, name: '6×3', description: '729 ways' },
    { reels: 6, rows: 4, name: '6×4', description: '4096 ways' }
  ],
  'cluster': [
    { reels: 5, rows: 5, name: '5×5', description: 'Standard cluster grid' },
    { reels: 6, rows: 6, name: '6×6', description: 'Large cluster grid' },
    { reels: 7, rows: 7, name: '7×7', description: 'Extra large cluster grid' },
    { reels: 8, rows: 8, name: '8×8', description: 'Massive cluster grid' },
    { reels: 9, rows: 5, name: '9×5', description: 'Wide cluster grid' }
  ]
};

const BETLINE_RANGES = {
  '1x3': { min: 1, max: 1, default: 1 },
  '1x4': { min: 1, max: 1, default: 1 },
  '1x5': { min: 1, max: 1, default: 1 },
  '1x6': { min: 1, max: 1, default: 1 },
  '1x7': { min: 1, max: 1, default: 1 },
  '2x3': { min: 3, max: 5, default: 3 },
  '2x4': { min: 4, max: 7, default: 4 },
  '2x5': { min: 5, max: 9, default: 5 },
  '2x6': { min: 6, max: 11, default: 6 },
  '2x7': { min: 7, max: 13, default: 7 },
  '3x3': { min: 3, max: 9, default: 5 },
  '3x4': { min: 4, max: 11, default: 7 },
  '3x5': { min: 5, max: 13, default: 9 },
  '3x6': { min: 6, max: 15, default: 10 },
  '3x7': { min: 7, max: 17, default: 12 },
  '4x3': { min: 3, max: 15, default: 9 },
  '4x4': { min: 4, max: 20, default: 15 },
  '4x5': { min: 5, max: 25, default: 20 },
  '4x6': { min: 6, max: 30, default: 25 },
  '4x7': { min: 7, max: 35, default: 30 },
  '5x3': { min: 3, max: 30, default: 25 },
  '5x4': { min: 4, max: 40, default: 40 },
  '5x5': { min: 5, max: 50, default: 50 },
  '5x6': { min: 6, max: 60, default: 50 },
  '5x7': { min: 7, max: 70, default: 60 },
  '6x3': { min: 3, max: 30, default: 25 },
  '6x4': { min: 4, max: 50, default: 50 },
  '6x5': { min: 5, max: 60, default: 50 },
  '6x6': { min: 6, max: 75, default: 60 },
  '6x7': { min: 7, max: 90, default: 70 },
  '7x3': { min: 3, max: 35, default: 30 },
  '7x4': { min: 4, max: 60, default: 50 },
  '7x5': { min: 5, max: 75, default: 60 },
  '7x6': { min: 6, max: 90, default: 75 },
  '7x7': { min: 7, max: 100, default: 100 }
};


// Grid recommendations based on AI analysis
const AI_RECOMMENDATIONS = {
  'betlines': 'For betline games, the industry standard 5×3 layout provides a familiar player experience while the 5×4 offers more winning potential.',
  'ways': 'For ways-to-win games, the 5×3 (243 ways) grid offers balanced volatility, while 5×4 (1024 ways) or 6×4 (4096 ways) provide higher win potential.',
  'cluster': 'For cluster pays, square grids like 5×5 or 6×6 allow symbols to connect in all directions, creating more opportunities for clusters to form.'
};

// Helper function to calculate estimated ways to win based on grid dimensions
const calculateWaysToWin = (reels: number, rows: number): string => {
  const ways = Math.pow(rows, reels);
  if (ways > 1000000) {
    return `${(ways / 1000000).toFixed(2)}M ways`;
  } else if (ways > 1000) {
    return `${(ways / 1000).toFixed(0)}K ways`;
  } else {
    return `${ways} ways`;
  }
};

/**
 * Step 3: Grid Layout Configuration Component
 * Allows users to set up the grid dimensions for their slot game
 * 
 * This component renders in a split-view where:
 * - Left side shows grid presets and configuration controls
 * - The grid preview is shown in Premium Slot Preview panel
 */
const Step3_ReelConfiguration: React.FC = () => {
  const { config, updateConfig, setGridOrientation } = useGameStore();

  // Get the selected pay mechanism from previous step
  const payMechanism = config.reels?.payMechanism || 'betlines';

  // Get current orientation from global state
  const storeOrientation = config.reels?.layout?.orientation || 'landscape';

  // Local state for current orientation to ensure UI consistency
  const [currentOrientation, setCurrentOrientation] = useState<'landscape' | 'portrait'>(storeOrientation);

  // Local state for grid configuration - important to sync with the global store
  const [gridConfig, setGridConfig] = useState({
    reels: config.reels?.layout?.reels || 5,
    rows: config.reels?.layout?.rows || 3
  });
  const gridKey = `${gridConfig.reels}x${gridConfig.rows}`;
  const { min, max, default: stdDefault } = BETLINE_RANGES[gridKey] || { min: 1, max: 200, default: 200 };
  const [betlines, setBetlines] = useState(stdDefault);

  useEffect(() => {
    const range = BETLINE_RANGES[`${gridConfig.reels}x${gridConfig.rows}`];
    if (range) setBetlines(range.default);
  }, [gridConfig.reels, gridConfig.rows]);


  // UI state 
  const [animateGrid, setAnimateGrid] = useState(false);

  // Update orientation local state when store changes
  useEffect(() => {
    setCurrentOrientation(storeOrientation);
  }, [storeOrientation]);

  // Log current state for debugging
  useEffect(() => {
    console.log('Step3 Grid Config:', {
      localState: gridConfig,
      orientation: currentOrientation,
      globalState: {
        reels: config.reels?.layout?.reels,
        rows: config.reels?.layout?.rows,
        orientation: config.reels?.layout?.orientation
      }
    });
  }, [gridConfig, config.reels?.layout, currentOrientation]);

  // Initialize component with grid animation after a short delay
  useEffect(() => {
    // Start grid animation after component is mounted
    const animationDelay = setTimeout(() => {
      setAnimateGrid(true);
    }, 200);

    return () => clearTimeout(animationDelay);
  }, []);

  // Initialize component from config - only on first mount or mechanism change
  useEffect(() => {
    // Initialize state from config - ensure we get the current grid dimensions
    setGridConfig({
      reels: config.reels?.layout?.reels || 5,
      rows: config.reels?.layout?.rows || 3
    });

    // Show animation when component mounts
    setTimeout(() => {
      setAnimateGrid(true);

      // Dispatch initial grid configuration event
      notifyGridConfigChanged();
    }, 500);
  }, [payMechanism, config.reels?.layout]);

  // Helper function to notify other components about grid config changes
  const notifyGridConfigChanged = () => {
    console.log('[Step3] Dispatching gridConfigChanged event:', {
      reels: gridConfig.reels,
      rows: gridConfig.rows
    });

    window.dispatchEvent(new CustomEvent('gridConfigChanged', {
      detail: {
        reels: gridConfig.reels,
        rows: gridConfig.rows,
        orientation: currentOrientation,
        payMechanism,
        animate: animateGrid,
        source: 'step3'
      }
    }));

    // Get stored symbols from the store if available
    const symbolsFromStore = config.theme?.generated?.symbols;
    if (symbolsFromStore && symbolsFromStore.length > 0) {
      window.dispatchEvent(new CustomEvent('symbolsChanged', {
        detail: {
          symbols: symbolsFromStore,
          source: 'step3'
        }
      }));
    }
  };

  // Add effect to track grid config changes
  useEffect(() => {
    console.log('[Step3] Grid config changed:', gridConfig);

    // Reset animation to show the change
    setAnimateGrid(false);

    setTimeout(() => {
      setAnimateGrid(true);

      // Update the store with the new configuration
      updateStoreConfig();

      // Notify other components about the grid change
      notifyGridConfigChanged();
    }, 50);
  }, [gridConfig.reels, gridConfig.rows]); // Remove currentOrientation to prevent loops

  // Add a dedicated effect to monitor for global config changes and sync local state
  useEffect(() => {
    // If the store config changes from elsewhere, update our local state
    if (
      config.reels?.layout?.reels !== gridConfig.reels ||
      config.reels?.layout?.rows !== gridConfig.rows ||
      config.reels?.layout?.orientation !== currentOrientation
    ) {
      // Only update if there's a real change needed
      if (config.reels?.layout?.reels && config.reels?.layout?.rows) {
        setGridConfig({
          reels: config.reels.layout.reels,
          rows: config.reels.layout.rows
        });

        if (config.reels.layout.orientation) {
          setCurrentOrientation(config.reels.layout.orientation);
        }

        // Trigger animation reset for visual feedback
        setAnimateGrid(false);
        setTimeout(() => setAnimateGrid(true), 100);
      }
    }
  }, [config.reels?.layout?.reels, config.reels?.layout?.rows, config.reels?.layout?.orientation]);

  // Listen for grid config changed events from other components
  useEffect(() => {
    const handleGridConfigChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Only update if the event didn't come from this component
      if (detail?.orientation && detail?.source !== 'step3') {
        setCurrentOrientation(detail.orientation);
      }
    };

    window.addEventListener('gridConfigChanged', handleGridConfigChange);

    return () => {
      window.removeEventListener('gridConfigChanged', handleGridConfigChange);
    };
  }, []);

  // Update the store with grid configuration
  const updateStoreConfig = () => {
    updateConfig({
      reels: {
        ...config.reels,
        layout: {
          ...config.reels?.layout,
          reels: gridConfig.reels,
          rows: gridConfig.rows,
          shape: 'rectangle',
          orientation: currentOrientation
        }
      }
    });
  };
  useEffect(() => {
    updateConfig({
      reels: {
        ...config.reels,
        betlines
      }
    });
  }, [betlines]);

  // Toggle orientation between landscape and portrait
  const toggleOrientation = () => {
    // Determine new orientation
    const newOrientation = currentOrientation === 'landscape' ? 'portrait' : 'landscape';

    // Update local state immediately for UI responsiveness
    setCurrentOrientation(newOrientation);

    // IMPORTANT: Use the store method to preserve grid dimensions
    setGridOrientation(newOrientation);

    // Reset animation to trigger effect and make change visually obvious
    setAnimateGrid(false);

    // Apply the orientation change with a slight delay for visual transition
    setTimeout(() => {
      setAnimateGrid(true);

      // Notify other components about the orientation change
      notifyGridConfigChanged();
    }, 100);
  };

  // Handle preset selection
  const selectPreset = (preset: { reels: number, rows: number }) => {
    console.log('[Step3] Selecting preset:', preset);

    // Update local state immediately for UI responsiveness
    setGridConfig({
      reels: preset.reels,
      rows: preset.rows
    });

    // Reset animation for visual feedback
    setAnimateGrid(false);

    // After a brief delay, restore animation
    setTimeout(() => {
      setAnimateGrid(true);
    }, 100);
  };

  // Update reels or rows via stepper controls
  const updateDimension = (type: 'reels' | 'rows', value: number) => {
    // Enforce limits based on pay mechanism
    const limits = {
      'betlines': { reels: { min: 1, max: 7 }, rows: { min: 3, max: 7 } },
      'ways': { reels: { min: 3, max: 6 }, rows: { min: 3, max: 5 } },
      'cluster': { reels: { min: 4, max: 9 }, rows: { min: 4, max: 9 } }
    };

    const mechanismLimits = limits[payMechanism as keyof typeof limits];

    // Apply limits
    if (value < mechanismLimits[type].min || value > mechanismLimits[type].max) {
      return;
    }

    // Calculate the new dimensions
    const newReels = type === 'reels' ? value : gridConfig.reels;
    const newRows = type === 'rows' ? value : gridConfig.rows;

    // Update local state immediately for UI responsiveness
    setGridConfig({
      reels: newReels,
      rows: newRows
    });

    // Reset animation for visual feedback
    setAnimateGrid(false);

    // After a brief delay, restore animation
    setTimeout(() => {
      setAnimateGrid(true);
    }, 100);
  };

  // Find the relevant presets for current pay mechanism
  const relevantPresets = GRID_PRESETS[payMechanism as keyof typeof GRID_PRESETS] || GRID_PRESETS.betlines;

  // Calculate the ways/payouts based on grid dimensions
  const getMechanismStats = () => {
    const { reels, rows } = gridConfig;

    // Updated max paylines logic
    function calculateSuggestedBetlines(columns: number, rows: number): number {
      const totalWays = Math.pow(rows, columns);
      if (columns === 3 && rows === 3) return 5;
      if (columns === 5 && rows === 3) return 25;
      if (columns === 5 && rows === 4) return 40;
      if (columns === 5 && rows === 5) return 50;
      if (columns === 6 && rows === 3) return 25;
      if (columns === 6 && rows === 4) return 50;
      if (columns === 6 && rows === 5) return 243;
      if (columns === 7 && rows === 5) return 1024;
      if ((columns === 3 && rows === 1) || (columns === 4 && rows === 1)) return Math.max(1, rows);
      if (columns >= 6 && rows >= 4) return 100;
      if (columns >= 5 && rows >= 5) return 50;
      if (totalWays <= 1000) return totalWays;
      return 243; // fallback to all-ways
    }

    let maxPaylines = calculateSuggestedBetlines(reels, rows);

    switch (payMechanism) {
      case 'ways':
        return {
          label: 'Ways to Win',
          value: calculateWaysToWin(reels, rows)
        };
      case 'cluster':
        return {
          label: 'Cluster Size',
          value: `${Math.min(reels, rows)}+ symbols`
        };
      case 'betlines':
      default:
        return {
          label: 'Max Paylines',
          value: `${maxPaylines} lines`
        };
    }
  };

  // Calculate ideal RTP and volatility based on grid dimensions
  const getGridMathStats = () => {
    const { reels, rows } = gridConfig;
    const gridSize = reels * rows;

    // Base volatility calculation - larger grids tend to have higher volatility
    let baseVolatility = 4 + (gridSize - 15) / 10;

    // Adjust for mechanism specific factors
    if (payMechanism === 'ways') {
      baseVolatility += 1; // Ways games tend to be higher volatility
    } else if (payMechanism === 'cluster') {
      baseVolatility += 2; // Cluster pays tend to be highest volatility
    }

    // Clamp to valid range
    const volatility = Math.max(1, Math.min(10, baseVolatility));

    // Calculate hit frequency - inverse relationship with volatility
    const hitFrequency = Math.max(10, 35 - (volatility * 2));

    // Textual representation
    let volatilityText = 'Medium';
    if (volatility <= 3) volatilityText = 'Low';
    else if (volatility >= 7) volatilityText = 'High';

    return {
      volatility,
      volatilityText,
      hitFrequency
    };
  };

  // Calculate best suggestions based on pay mechanism
  const getAISuggestion = () => {
    return AI_RECOMMENDATIONS[payMechanism as keyof typeof AI_RECOMMENDATIONS] ||
      AI_RECOMMENDATIONS.betlines;
  };

  const mechanismStats = getMechanismStats();
  const gridMathStats = getGridMathStats();

  // Handler for resetting animation
  const handleResetAnimation = () => {
    setAnimateGrid(false);
    setTimeout(() => setAnimateGrid(true), 50);
  };

  // Setup event listener for animation reset
  useEffect(() => {
    document.addEventListener('resetGridAnimation', handleResetAnimation);

    return () => {
      document.removeEventListener('resetGridAnimation', handleResetAnimation);
    };
  }, []);

  return (
    <div
      data-testid="step3-marker"
      className="h-full w-full overflow-y-auto"
    >
      {/* Configuration Panel - FULL WIDTH (no grid preview in this component) */}
      <div data-testid="config-panel" className="w-full h-full pt-0">
        {/* Grid Presets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-lg">Grid Presets</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {relevantPresets.map((preset, index) => (
                <button
                  key={`preset-${index}`}
                  onClick={() => selectPreset(preset)}
                  className={`p-3 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out ${gridConfig.reels === preset.reels && gridConfig.rows === preset.rows
                    ? 'ring-2 ring-red-500 border-red-500 bg-white shadow-md font-semibold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t  border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Custom Grid Size</h4>
              <div className='flex items-center justify-center w-full'>
              <div className="flex gap-8">
                <div>
                  <label className="text-sm font-medium text-gray-800 block mb-1">Reels (Width)</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => updateDimension('reels', gridConfig.reels - 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    >
                      <MinusSquare className="w-5 h-5" />
                    </button>
                    <div className="mx-2 w-10 text-center font-semibold text-gray-900">{gridConfig.reels}</div>
                    <button
                      onClick={() => updateDimension('reels', gridConfig.reels + 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    >
                      <PlusSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-800 block mb-1">Rows (Height)</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => updateDimension('rows', gridConfig.rows - 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    >
                      <MinusSquare className="w-5 h-5" />
                    </button>
                    <div className="mx-2 w-10 text-center font-semibold text-gray-900">{gridConfig.rows}</div>
                    <button
                      onClick={() => updateDimension('rows', gridConfig.rows + 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    >
                      <PlusSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
</div>
            </div>
          </div>
        </div>

        {/* Grid Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Grid Statistics</h3>
          </div>
          <div className="p-4">
            <div className="mt- bg-blue-50 border border-blue-200  rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-2">Betlines Configuration</div>
              <div className="text-sm text-gray-700 mb-3 flex items-center">
                Industry Standard Betlines for <span className="font-semibold text-gray-900 ml-1">{gridConfig.reels}×{gridConfig.rows}:</span>
              </div>
              {/* Betlines Buttons */}
              <div className="flex gap-2 mb-4">
                {[min, stdDefault, max].filter((num, idx, arr) => arr.indexOf(num) === idx).map((num) => (
                  <button
                    key={num}
                    onClick={() => setBetlines(num)}
                    className={`px-3 py-1 rounded-full border text-sm font-semibold transition-all duration-150 ${num === betlines ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {/* Custom Betlines Slider */}
              <div>
                <div className="text-sm font-semibold mb-2">Custom Betlines:</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{min}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={betlines}
                    onChange={e => setBetlines(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-xs text-gray-500">{max}</span>
                </div>
                <div className="flex justify-center mt-3">
                  <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow-sm border border-blue-200">
                    {betlines} Betlines
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 mt-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <div className="text-gray-700">A {gridConfig.reels}×{gridConfig.rows} grid with <strong className="text-gray-900">{payMechanism}</strong> creates a
                <strong className={
                  gridMathStats.volatility <= 3 ? ' text-green-700' :
                    gridMathStats.volatility <= 7 ? ' text-yellow-700' :
                      ' text-red-700'
                }> {gridMathStats.volatilityText.toLowerCase()}-volatility</strong> game with approximately
                <strong className=" text-gray-900"> {gridMathStats.hitFrequency.toFixed(1)}%</strong> hit frequency.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3_ReelConfiguration;