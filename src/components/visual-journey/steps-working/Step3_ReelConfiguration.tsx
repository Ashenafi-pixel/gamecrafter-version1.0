import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import {
  PlusSquare,
  MinusSquare,
} from 'lucide-react';
import { getBetlinePatterns } from '../../../utils/betlinePatterns';

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

  // Derive three suggested betline counts (min / mid / max) that always render,
  // even when defaults exceed available patterns for the current grid.
  const getSuggestedBetlineCounts = () => {
    const maxAvailable = getAllBetlinePatterns().length;
    const maxAllowed = Math.min(max, maxAvailable);
    const minAllowed = Math.min(min, maxAllowed);

    // Clamp default within the available range
    let midAllowed = Math.min(stdDefault, maxAllowed);

    // Start with min / mid / max
    const suggestions = [minAllowed, midAllowed, maxAllowed]
      .filter((value, idx, arr) => arr.indexOf(value) === idx); // remove duplicates

    // If mid collapsed into min or max, insert a midpoint to keep three buttons when possible
    if (suggestions.length < 3 && maxAllowed > minAllowed) {
      const midpoint = Math.max(
        minAllowed + 1,
        Math.min(maxAllowed - 1, Math.round((minAllowed + maxAllowed) / 2))
      );
      if (!suggestions.includes(midpoint)) {
        suggestions.splice(1, 0, midpoint);
      }
    }

    // Ensure sorted ascending
    return suggestions.sort((a, b) => a - b);
  };

  useEffect(() => {
    const range = BETLINE_RANGES[`${gridConfig.reels}x${gridConfig.rows}`];
    if (range) {
      const maxAvailable = getAllBetlinePatterns().length;
      const maxAllowed = Math.min(range.max, maxAvailable);
      const minAllowed = Math.min(range.min, maxAllowed);
      const clampCount = (count: number) => Math.max(minAllowed, Math.min(count, maxAllowed));

      // Check if config already has betlines and betlinePatterns
      const existingBetlines = config.reels?.betlines;
      const existingPatterns = config.reels?.betlinePatterns;

      if (existingBetlines && existingPatterns && existingPatterns.length > 0) {
        // Use existing betlines from config
        const betlineCount = clampCount(existingBetlines);

        // Reconstruct selectedBetlines from existing patterns
        const allPatterns = getAllBetlinePatterns();
        const selectedIndices = new Set<number>();
        existingPatterns.forEach((pattern: number[]) => {
          const index = allPatterns.findIndex(p =>
            p.length === pattern.length &&
            p.every((val, i) => val === pattern[i])
          );
          if (index !== -1) {
            selectedIndices.add(index);
          }
        });

        // If we couldn't match patterns, default to first N
        if (selectedIndices.size === 0) {
          const clampedDefault = clampCount(betlineCount);
          const initialSelection = new Set(Array.from({ length: clampedDefault }, (_, i) => i));
          setSelectedBetlines(initialSelection);
          setBetlines(initialSelection.size);
        } else {
          // Trim any over-limit selections to keep slider value in range
          const trimmedSelections = Array.from(selectedIndices)
            .sort((a, b) => a - b)
            .slice(0, maxAllowed);
          const clampedSelectionCount = clampCount(trimmedSelections.length);
          const finalSelection = new Set(trimmedSelections.slice(0, clampedSelectionCount));
          setSelectedBetlines(finalSelection);
          setBetlines(finalSelection.size);
        }
      } else {
        // Initialize with default count
        const defaultCount = clampCount(range.default);
        setBetlines(defaultCount);
        setSelectedBetlines(new Set(Array.from({ length: defaultCount }, (_, i) => i)));

        // Generate and save patterns immediately when grid changes
        const patterns = getAllBetlinePatterns().slice(0, defaultCount);
        updateConfig({
          reels: {
            ...config.reels,
            betlines: defaultCount,
            betlinePatterns: patterns
          }
        });
      }
    }
  }, [gridConfig.reels, gridConfig.rows]);


  // UI state 
  const [animateGrid, setAnimateGrid] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [selectedBetlines, setSelectedBetlines] = useState<Set<number>>(new Set());

  // Function to send reel configuration to API
  const sendReelConfigToAPI = async (reels: number, rows: number) => {
    const gameId = config.gameId || localStorage.getItem('slotai_gameId');
    if (!gameId) {
      console.warn('No gameId found, skipping API call');
      return;
    }

  };

  // Update orientation local state when store changes
  useEffect(() => {
    setCurrentOrientation(storeOrientation);
  }, [storeOrientation]);

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
    const initialReels = config.reels?.layout?.reels || 5;
    const initialRows = config.reels?.layout?.rows || 3;

    setGridConfig({
      reels: initialReels,
      rows: initialRows
    });

    // Send default 5x3 configuration to API on initial load
    if (isInitialLoad) {
      sendReelConfigToAPI(initialReels, initialRows);
      setIsInitialLoad(false);
    }

    // Show animation when component mounts
    setTimeout(() => {
      setAnimateGrid(true);

      // Dispatch initial grid configuration event
      notifyGridConfigChanged();
    }, 500);
  }, [payMechanism, config.reels?.layout]);

  // Helper function to notify other components about grid config changes
  const notifyGridConfigChanged = () => {
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
    // Reset animation to show the change
    setAnimateGrid(false);

    setTimeout(() => {
      setAnimateGrid(true);

      // Update the store with the new configuration
      updateStoreConfig();

      // Send updated reel config to API (skip initial load)
      if (!isInitialLoad) {
        sendReelConfigToAPI(gridConfig.reels, gridConfig.rows);
      }

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
  // Update config when selectedBetlines changes - this ensures Basic and Advanced tabs stay in sync
  useEffect(() => {
    const selectedCount = selectedBetlines.size;
    const allPatterns = getAllBetlinePatterns();

    // Get patterns for selected betlines (sorted by index)
    const selectedPatterns = Array.from(selectedBetlines)
      .sort((a, b) => a - b)
      .map(index => allPatterns[index])
      .filter(Boolean);

    // Update betlines count to match selected count
    if (selectedCount !== betlines) {
      setBetlines(selectedCount);
    }

    // Update config with selected patterns
    if (selectedPatterns.length > 0) {
      updateConfig({
        reels: {
          ...config.reels,
          betlines: selectedCount,
          betlinePatterns: selectedPatterns
        }
      });
    }
  }, [selectedBetlines, gridConfig.reels, gridConfig.rows]);


  // Handle preset selection
  const selectPreset = (preset: { reels: number, rows: number }) => {
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
      'betlines': { reels: { min: 3, max: 7 }, rows: { min: 3, max: 7 } },
      'ways': { reels: { min: 3, max: 6 }, rows: { min: 3, max: 5 } },
      'cluster': { reels: { min: 5, max: 9 }, rows: { min: 5, max: 9 } }
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

  const gridMathStats = getGridMathStats();

  // Get all available betline patterns for current grid (delegated to shared util)
  const getAllBetlinePatterns = () => {
    const { reels, rows } = gridConfig;
    return getBetlinePatterns(reels, rows);
  };

  // Toggle betline selection
  const toggleBetline = (lineIndex: number) => {
    const newSelected = new Set(selectedBetlines);
    if (newSelected.has(lineIndex)) {
      newSelected.delete(lineIndex);
    } else {
      newSelected.add(lineIndex);
    }
    setSelectedBetlines(newSelected);
    // Sync betlines count with selected betlines count
    const newCount = newSelected.size;
    setBetlines(newCount);

    // Update config with new betline patterns
    const patterns = getAllBetlinePatterns().slice(0, newCount);
    updateConfig({
      reels: {
        ...config.reels,
        betlines: newCount,
        betlinePatterns: patterns
      }
    });
  };

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
            <h3 className="font-semibold text-gray-900 text-lg uw:text-4xl">Grid Presets</h3>
          </div>
          <div className="p-4 ux:p-8">
            <div className="grid grid-cols-2 gap-3 uw:gap-6">
              {relevantPresets.map((preset, index) => (
                <button
                  key={`preset-${index}`}
                  onClick={() => selectPreset(preset)}
                  className={`p-3 uw:p-6 uw:text-3xl flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out ${gridConfig.reels === preset.reels && gridConfig.rows === preset.rows
                    ? 'ring-2 ring-red-500 border-red-500 bg-white shadow-md font-semibold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t  border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 uw:text-3xl">Custom Grid Size</h4>
              <div className='flex items-center justify-center w-full'>
                <div className="flex gap-8 uw:gap-16">
                  <div>
                    <label className="text-sm uw:text-3xl font-medium text-gray-800 block mb-1">Reels (Width)</label>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateDimension('reels', gridConfig.reels - 1)}
                        className="p-1 uw:p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      >
                        <MinusSquare className="w-5 h-5 uw:w-8 uw:h-8 " />
                      </button>
                      <div className="mx-2 w-10 text-center uw:text-3xl font-semibold text-gray-900">{gridConfig.reels}</div>
                      <button
                        onClick={() => updateDimension('reels', gridConfig.reels + 1)}
                        className="p-1 uw:p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      >
                        <PlusSquare className="w-5 h-5 uw:w-8 uw:h-8" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm uw:text-3xl font-medium text-gray-800 block mb-1">Rows (Height)</label>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateDimension('rows', gridConfig.rows - 1)}
                        className="p-1 uw:p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      >
                        <MinusSquare className="w-5 h-5 uw:w-8 uw:h-8" />
                      </button>
                      <div className="mx-2 w-10 uw:text-3xl text-center font-semibold text-gray-900">{gridConfig.rows}</div>
                      <button
                        onClick={() => updateDimension('rows', gridConfig.rows + 1)}
                        className="p-1 uw:p-2  rounded bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      >
                        <PlusSquare className="w-5 h-5 uw:w-8 uw:h-8" />
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
            <h3 className="font-semibold text-gray-900 uw:text-3xl">Grid Statistics</h3>
          </div>
          <div className='flex gap-4 mt-2 uw:mt-4 uw:gap-8 items-center justify-center'>
            <div className="flex items-center justify-center">
              <button
                onClick={() => setActiveSection('basic')}
                className={`border px-3 uw:px-6 uw:py-2 uw:text-3xl py-1 rounded ${activeSection === 'basic' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Basic
              </button>
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={() => setActiveSection('advanced')}
                className={`border uw:px-6 uw:py-2 uw:text-3xl px-3 py-1 rounded ${activeSection === 'advanced' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Advanced
              </button>
            </div>
          </div>

          <div className="p-4 uw:p-8">
            {activeSection === 'basic' ? (
              /* Basic Section */
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {/* Dynamic Content based on Mechanism */}
                {payMechanism === 'cluster' ? (
                  <div>
                    <div className="font-semibold text-gray-900 mb-2 uw:text-3xl">Cluster Pays Logic</div>
                    <div className="text-sm text-gray-700 mb-4 uw:text-3xl">
                      Symbols pay when connected horizontally or vertically in groups of <span className="font-bold">5+</span>.
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-4xl font-black text-blue-600 mb-2">{gridConfig.reels * gridConfig.rows}</div>
                      <div className="text-sm text-gray-600 uppercase font-bold tracking-wider">Total Grid Positions</div>
                    </div>
                  </div>
                ) : payMechanism === 'ways' ? (
                  <div>
                    <div className="font-semibold text-gray-900 mb-2 uw:text-3xl">Ways to Win Logic</div>
                    <div className="text-sm text-gray-700 mb-4 uw:text-3xl">
                      Matching symbols on adjacent reels (left-to-right) award wins.
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-4xl font-black text-purple-600 mb-2">{Math.pow(gridConfig.rows, gridConfig.reels).toLocaleString()}</div>
                      <div className="text-sm text-gray-600 uppercase font-bold tracking-wider">Total Ways to Win</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-gray-900 mb-2 uw:text-3xl">Betlines Configuration</div>
                    <div className="text-sm text-gray-700 mb-3 flex items-center uw:text-3xl">
                      Industry Standard Betlines for <span className="font-semibold text-gray-900 ml-1 uw:text-">{gridConfig.reels}×{gridConfig.rows}:</span>
                    </div>
                    {/* Betlines Buttons */}
                    <div className="flex gap-2 uw:gap-6 mb-4">
                      {getSuggestedBetlineCounts().map((num) => {
                        const currentCount = selectedBetlines.size;
                        return (
                          <button
                            key={num}
                            onClick={() => {
                              const newSelected = new Set(Array.from({ length: num }, (_, i) => i));
                              setSelectedBetlines(newSelected);
                              setBetlines(num);
                            }}
                            className={`px-3 py-1 uw:px-6 uw:py-2 uw:text-3xl rounded-full border text-sm font-semibold transition-all duration-150 ${num === currentCount ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom Betlines Slider */}
                    <div>
                      <div className="text-sm font-semibold mb-2 uw:mb-4 uw:text-3xl">Custom Betlines:</div>
                      <div className="flex items-center gap-3 uw:gap-6">
                        <span className="text-xs text-gray-500 uw:text-3xl">{min}</span>
                        <input
                          type="range"
                          min={min}
                          max={Math.min(max, getAllBetlinePatterns().length)}
                          value={selectedBetlines.size}
                          onChange={e => {
                            const newCount = Number(e.target.value);
                            // Update selected betlines to first N lines
                            const newSelected = new Set(Array.from({ length: newCount }, (_, i) => i));
                            setSelectedBetlines(newSelected);
                            setBetlines(newCount);
                          }}
                          className="flex-1  accent-blue-600"
                        />
                        <span className="text-xs text-gray-500 uw:text-3xl">
                          {Math.min(max, getAllBetlinePatterns().length)}
                        </span>
                      </div>
                      <div className="flex justify-center mt-3">
                        <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 uw:px-6 uw:py-2 uw:text-3xl font-bold text-lg shadow-sm border border-blue-200">
                          {selectedBetlines.size} Betlines
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Advanced Section */
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                {payMechanism === 'cluster' ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="uw:text-3xl font-semibold text-gray-700">Advanced Cluster Settings</div>
                    <p className="mt-2 uw:text-2xl">Cluster definition rules are currently fixed to <span className="font-bold">Adjacent (Horizontal/Vertical)</span>.</p>
                  </div>
                ) : payMechanism === 'ways' ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="uw:text-3xl font-semibold text-gray-700">Advanced Ways Settings</div>
                    <p className="mt-2 uw:text-2xl">Ways evaluation is fixed to <span className="font-bold">Left-to-Right Adjacent Reels</span>.</p>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-gray-900 mb-3 uw:text-3xl uw:mb-6">Advanced Configuration - {gridConfig.reels}×{gridConfig.rows} Grid</div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 mb-2 uw:text-3xl">Betline Patterns :</div>
                      <div className="max-h-60 overflow-y-auto grid grid-cols-4 uw:grid-cols-5  gap-1 uw:gap-6">
                        {getAllBetlinePatterns().map((pattern, index) => {
                          const isSelected = selectedBetlines.has(index);
                          return (
                            <div
                              key={index}
                              onClick={() => toggleBetline(index)}
                              className={`border relative rounded p-1 uw:p-3 cursor-pointer transition-all duration-200 ${isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                              <p className='absolute top-1 right-1 uw:text-3xl text-xs font-medium text-gray-500'>{isSelected && '✓'}</p>
                              <div className={`text-xs uw:text-3xl font-medium mb-1 uw:mb-4 text-center ${isSelected ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                Line {index + 1}
                              </div>
                              <div className="grid gap-1 uw:gap-2 " style={{ gridTemplateColumns: `repeat(${gridConfig.reels}, 1fr)` }}>
                                {Array.from({ length: gridConfig.rows * gridConfig.reels }).map((_, cellIndex) => {
                                  const row = Math.floor(cellIndex / gridConfig.reels);
                                  const col = cellIndex % gridConfig.reels;
                                  const isHighlighted = pattern[col] === row;
                                  return (
                                    <div
                                      key={cellIndex}
                                      className={`w-4 h-4 uw:w-6 uw:h-6 border border-gray-400 rounded flex items-center justify-center uw:pb-1  uw:mx-auto text-xs  uw:text-2xl ${isHighlighted
                                        ? (isSelected ? 'bg-blue-300 border-blue-500' : 'bg-yellow-300 border-yellow-500')
                                        : 'bg-white'
                                        }`}
                                    >
                                      {isHighlighted ? '★' : ''}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="p-4 mt-2 uw:p-8 uw:text-3xl uw:mt-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
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
    </div >
  );
};

export default Step3_ReelConfiguration;
