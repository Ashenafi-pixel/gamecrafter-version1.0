import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store';
import { CheckCircle, PlusSquare, MinusSquare, Maximize2, Minimize2 } from 'lucide-react';
import { slotApiClient } from '../../utils/apiClient';
import PaylinePreview from './PaylinePreview';

// Default symbol set if no theme has been configured
const defaultSymbols = [
  '/public/assets/symbols/wild.png',     // Wild
  '/public/assets/symbols/scatter.png',  // Scatter
  '/public/assets/symbols/high_1.png',   // High 1
  '/public/assets/symbols/high_2.png',   // High 2
  '/public/assets/symbols/high_3.png',   // High 3
  '/public/assets/symbols/high_4.png',   // High 4
  '/public/assets/symbols/mid_1.png',    // Mid 1
  '/public/assets/symbols/mid_2.png',    // Mid 2
  '/public/assets/symbols/mid_3.png',    // Mid 3
  '/public/assets/symbols/mid_4.png',    // Mid 4 
  '/public/assets/symbols/low_1.png',    // Low 1
  '/public/assets/symbols/low_2.png',    // Low 2
  '/public/assets/symbols/low_3.png',    // Low 3
  '/public/assets/symbols/low_4.png'     // Low 4
];

// Create fallback placeholders for symbols that don't exist yet
const createPlaceholderSymbol = (text) => {
  return `/public/themes/${
    text.includes('wild') ? 'base-style.png' :
    text.includes('scatter') ? 'ancient-egypt.png' :
    text.includes('high') ? 'cosmic-adventure.png' :
    text.includes('mid') ? 'deep-ocean.png' : 'enchanted-forest.png'
  }`;
};

// Check for which symbols actually exist and use them
const fileExists = (filename) => {
  // This is a client-side function, so we can't check file existence directly
  // Instead, we'll check if we have evidence that the file exists
  if (filename.includes('wild.png') || 
      filename.includes('scatter.png') || 
      filename.includes('high_1.png') ||
      filename.includes('high_2.png') ||
      filename.includes('high_3.png') ||
      filename.includes('mid_1.png')) {
    return true; // We know these files exist based on the directory listing
  }
  return false;
};

// Custom symbols with fallbacks
const customSymbols = {
  wild: '/public/assets/symbols/wild.png',
  scatter: '/public/assets/symbols/scatter.png',
  high_1: '/public/assets/symbols/high_1.png',
  high_2: fileExists('/public/assets/symbols/high_2.png') ? '/public/assets/symbols/high_2.png' : createPlaceholderSymbol('high_2'),
  high_3: fileExists('/public/assets/symbols/high_3.png') ? '/public/assets/symbols/high_3.png' : createPlaceholderSymbol('high_3'),
  high_4: fileExists('/public/assets/symbols/high_4.png') ? '/public/assets/symbols/high_4.png' : createPlaceholderSymbol('high_4'),
  mid_1: fileExists('/public/assets/symbols/mid_1.png') ? '/public/assets/symbols/mid_1.png' : createPlaceholderSymbol('mid_1'),
  mid_2: fileExists('/public/assets/symbols/mid_2.png') ? '/public/assets/symbols/mid_2.png' : createPlaceholderSymbol('mid_2'),
  mid_3: fileExists('/public/assets/symbols/mid_3.png') ? '/public/assets/symbols/mid_3.png' : createPlaceholderSymbol('mid_3'),
  mid_4: fileExists('/public/assets/symbols/mid_4.png') ? '/public/assets/symbols/mid_4.png' : createPlaceholderSymbol('mid_4'),
  low_1: fileExists('/public/assets/symbols/low_1.png') ? '/public/assets/symbols/low_1.png' : createPlaceholderSymbol('low_1'),
  low_2: fileExists('/public/assets/symbols/low_2.png') ? '/public/assets/symbols/low_2.png' : createPlaceholderSymbol('low_2'),
  low_3: fileExists('/public/assets/symbols/low_3.png') ? '/public/assets/symbols/low_3.png' : createPlaceholderSymbol('low_3'),
  low_4: fileExists('/public/assets/symbols/low_4.png') ? '/public/assets/symbols/low_4.png' : createPlaceholderSymbol('low_4')
};

/**
 * Symbol mapping component for configuring reels and paylines
 */
const ReelBuilder: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  
  // Local state for reel configuration
  const [reelConfig, setReelConfig] = useState({
    reels: config.reels?.layout?.reels || 5,
    rows: config.reels?.layout?.rows || 3,
    paylines: config.reels?.betlines || 20,
    payMechanism: config.reels?.payMechanism || 'betlines'
  });
  
  // Current reel state (what symbols are shown)
  const [reelState, setReelState] = useState<string[][]>([]);
  
  // Volatility vs hit rate simulation stats
  const [gameStats, setGameStats] = useState({
    volatility: 5,
    volatilityText: 'Medium',
    hitRate: 24.5,
    rtpMin: '94.8',
    rtpMax: '97.2'
  });
  
  // Flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaylineDesigner, setShowPaylineDesigner] = useState(false);
  const [showSymbolWeights, setShowSymbolWeights] = useState(false);
  const [showSymbolManagement, setShowSymbolManagement] = useState(false);
  const [activePayline, setActivePayline] = useState<number | null>(null);
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  
  // Payline patterns (simplified for demo)
  const [paylinePatterns, setPaylinePatterns] = useState<number[][]>([
    [1,1,1,1,1], // Middle line
    [0,0,0,0,0], // Top line
    [2,2,2,2,2], // Bottom line
    [0,1,2,1,0], // V shape
    [2,1,0,1,2], // Inverted V
    [0,0,1,2,2], // Top to bottom
    [2,2,1,0,0], // Bottom to top
    [1,0,1,2,1], // Zigzag top
    [1,2,1,0,1], // Zigzag bottom
    [0,1,0,1,0], // Zigzag top half
    [2,1,2,1,2], // Zigzag bottom half
    [0,1,1,1,0], // Smile
    [2,1,1,1,2], // Frown
    [1,0,0,0,1], // Top corners
    [1,2,2,2,1], // Bottom corners
    [0,0,1,0,0], // Top zigzag
    [2,2,1,2,2], // Bottom zigzag
    [0,1,2,2,2], // Diagonal 1
    [2,1,0,0,0], // Diagonal 2
    [0,0,0,1,2], // Stairs top
  ]);
  
  // Initialize component from config - only on first mount or game type change
  useEffect(() => {
    // Initialize state from config on first load or game type change
    const selectedGameType = config.selectedGameType || 'classic-reels';
    
    // Force 3x3 grid for grid-slot game type
    let newReels = config.reels?.layout?.reels || 5;
    let newRows = config.reels?.layout?.rows || 3;
    
    // Override for specific game types
    if (selectedGameType === 'grid-slot') {
      newReels = 3;
      newRows = 3;
    }
    
    setReelConfig({
      reels: newReels,
      rows: newRows,
      paylines: config.reels?.betlines || 20,
      payMechanism: config.reels?.payMechanism || 'betlines'
    });
    
    // Initialize reel state without triggering store updates
    generateInitialReelState();
  }, [config.selectedGameType]); // Only run when game type changes
  
  // Only update config on manual changes, not initial render
  const updateStoreConfig = () => {
    // Save the reel config to the store
    updateConfig({
      reels: {
        ...config.reels,
        layout: {
          reels: reelConfig.reels,
          rows: reelConfig.rows,
          shape: 'rectangle'
        },
        payMechanism: reelConfig.payMechanism,
        betlines: reelConfig.paylines,
        spinDirection: 'vertical'
      }
    });
  };
  
  // Calculate stats separately to avoid unnecessary store updates
  useEffect(() => {
    // Simulate volatility stats based on reel config
    const volatilityValue = Math.min(10, Math.max(1, 
      (reelConfig.reels * reelConfig.rows) / (reelConfig.paylines / 10)
    ));
    
    let volatilityText = 'Medium';
    if (volatilityValue <= 3) volatilityText = 'Low';
    else if (volatilityValue > 7) volatilityText = 'High';
    
    const hitRateBase = 30 - (volatilityValue * 1.5); // Higher volatility = lower hit rate
    const hitRateVariance = Math.sin(reelConfig.paylines / 10) * 5; // Add some variance
    const hitRate = Math.max(5, Math.min(45, hitRateBase + hitRateVariance));
    
    // Set the calculated stats
    setGameStats({
      volatility: volatilityValue,
      volatilityText,
      hitRate,
      rtpMin: (93 + (reelConfig.paylines / 100)).toFixed(1),
      rtpMax: (96 + (reelConfig.paylines / 100)).toFixed(1)
    });
    
    // Generate new reel state when config changes
    generateInitialReelState();
  }, [reelConfig]);
  
  // Generate the initial reel state for display
  const generateInitialReelState = () => {
    // Get current config values
    const reels = reelConfig.reels;
    const rows = reelConfig.rows;
    
    // Check for valid dimensions to prevent excessive rendering
    if (reels <= 0 || rows <= 0 || reels > 7 || rows > 5) {
      console.warn("Invalid grid dimensions:", reels, "x", rows);
      return;
    }
    
    const newReelState: string[][] = [];
    
    // Create reel state with exact number of symbols needed
    for (let i = 0; i < reels; i++) {
      const reel: string[] = [];
      for (let j = 0; j < rows; j++) {
        // Pass the reel index and row index to better position specific symbols
        reel.push(getSymbolForPosition(i * rows + j, i, j));
      }
      newReelState.push(reel);
    }
    
    setReelState(newReelState);
  };
  
  // Function stub for spinning animation (no longer used in UI)
  const spinReels = () => {
    // Generate a new reel state (simplified)
    const finalReelState: string[][] = [];
    for (let i = 0; i < reelConfig.reels; i++) {
      const reel: string[] = [];
      for (let j = 0; j < reelConfig.rows; j++) {
        reel.push(getSymbolForPosition(i * reelConfig.rows + j, i, j));
      }
      finalReelState.push(reel);
    }
    setReelState(finalReelState);
  };
  
  // Update reels or rows
  const updateDimension = (type: 'reels' | 'rows', value: number) => {
    if (value < 1) return;
    
    // Max limits
    if (type === 'reels' && value > 7) return;
    if (type === 'rows' && value > 5) return;
    
    // If value didn't change, don't do anything
    if (reelConfig[type] === value) return;
    
    // Update local state
    setReelConfig(prev => ({
      ...prev,
      [type]: value
    }));
    
    // Update the store directly - this is a controlled, explicit user action
    updateConfig({
      reels: {
        ...config.reels,
        layout: {
          ...config.reels?.layout,
          [type]: value,
          shape: 'rectangle'
        }
      }
    });
    
    // Re-generate the reel state with new dimensions
    setTimeout(() => {
      generateInitialReelState();
    }, 50);
  };
  
  // Update paylines
  const updatePaylines = (value: number) => {
    if (value < 1) return;
    
    // Calculate maximum possible paylines based on grid size
    // For an NxM grid, maximum possible unique paylines is N^M
    const maxPossiblePaylines = Math.pow(reelConfig.rows, reelConfig.reels);
    
    // Cap at 50 for UI reasons (too many paylines would be hard to display)
    const displayLimit = 50;
    const actualLimit = Math.min(maxPossiblePaylines, displayLimit);
    
    if (value > actualLimit) return;
    
    // If value didn't change, don't do anything
    if (reelConfig.paylines === value) return;
    
    // Update local state
    setReelConfig(prev => ({
      ...prev,
      paylines: value
    }));
    
    // Update the store directly - this is a controlled, explicit user action
    updateConfig({
      reels: {
        ...config.reels,
        betlines: value
      }
    });
  };
  
  // Update pay mechanism (function retained but no longer used in UI)
  const updatePayMechanism = (mechanism: 'betlines' | 'ways' | 'cluster') => {
    // If value didn't change, don't do anything
    if (reelConfig.payMechanism === mechanism) return;
    
    // Update local state
    setReelConfig(prev => ({
      ...prev,
      payMechanism: mechanism
    }));
    
    // Update the store directly - this is a controlled, explicit user action
    updateConfig({
      reels: {
        ...config.reels,
        payMechanism: mechanism
      }
    });
  };
  
  // Toggle the view of payline configuration
  const togglePaylineDesigner = () => {
    setShowPaylineDesigner(!showPaylineDesigner);
  };
  
  // Toggle view of symbol weights
  const toggleSymbolWeights = () => {
    setShowSymbolWeights(!showSymbolWeights);
  };
  
  // Toggle symbol management section
  const toggleSymbolManagement = () => {
    setShowSymbolManagement(!showSymbolManagement);
  };
  
  // Save the current reel configuration to the global store
  const saveConfiguration = () => {
    // Explicitly save to the store
    updateStoreConfig();
    
    // Show a success feedback
    alert('Reel configuration saved!');
  };
  
  // Update a specific payline pattern
  const updatePaylinePattern = (index: number, reelIndex: number, value: number) => {
    if (reelIndex < 0 || reelIndex >= reelConfig.reels) return;
    if (value < 0 || value >= reelConfig.rows) return;
    
    const newPatterns = [...paylinePatterns];
    
    // Ensure the pattern exists and has correct length
    if (!newPatterns[index]) {
      newPatterns[index] = Array(reelConfig.reels).fill(0);
    }
    
    // Update the specific position
    newPatterns[index][reelIndex] = value;
    setPaylinePatterns(newPatterns);
  };
  
  // Get appropriate symbol for a position
  const getSymbolForPosition = (index: number, reelIndex: number, rowIndex: number) => {
    // Use theme symbols if available
    const themeSymbols = config.theme?.generated?.symbols || [];
    
    if (themeSymbols.length > 0) {
      return themeSymbols[index % themeSymbols.length];
    } else {
      // Create a more realistic distribution of symbols across the reels
      
      // Wild symbols are rare and typically appear on middle reels
      if (reelIndex > 0 && reelIndex < reelConfig.reels - 1 && Math.random() < 0.1) {
        return customSymbols.wild;
      }
      
      // Scatter symbols appear rarely, usually at most 3 on the entire grid
      if (Math.random() < 0.05) {
        return customSymbols.scatter;
      }
      
      // Symbol distribution based on reel position (classic slot design)
      // Higher paying symbols more common on reel 1, lower paying more common on later reels
      const reelPosition = reelIndex / (reelConfig.reels - 1); // 0 to 1
      const r = Math.random();
      
      if (reelPosition < 0.3) {
        // First reels: More high paying symbols
        if (r < 0.4) return customSymbols.high_1;
        if (r < 0.6) return customSymbols.high_2;
        if (r < 0.7) return customSymbols.high_3;
        if (r < 0.8) return customSymbols.high_4;
        if (r < 0.9) return customSymbols.mid_1;
        return customSymbols.mid_2;
      } else if (reelPosition < 0.7) {
        // Middle reels: More mid paying symbols
        if (r < 0.2) return customSymbols.high_1;
        if (r < 0.3) return customSymbols.high_2;
        if (r < 0.5) return customSymbols.mid_1;
        if (r < 0.7) return customSymbols.mid_2;
        if (r < 0.8) return customSymbols.mid_3;
        if (r < 0.9) return customSymbols.mid_4;
        return customSymbols.low_1;
      } else {
        // Last reels: More low paying symbols
        if (r < 0.1) return customSymbols.high_1;
        if (r < 0.2) return customSymbols.mid_1;
        if (r < 0.3) return customSymbols.mid_2;
        if (r < 0.5) return customSymbols.low_1;
        if (r < 0.7) return customSymbols.low_2;
        if (r < 0.8) return customSymbols.low_3;
        return customSymbols.low_4;
      }
    }
  };
  
  return (
    <div className="reel-builder bg-gradient-to-b from-gray-50 to-white">
      {/* Title heading instead of visual divider */}
      <div className="w-full py-3 bg-white border-b border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800">Grid Configuration</h2>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left panel - Grid & Paylines */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {/* Grid Designer Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Grid Designer</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLayoutView(layoutView === 'grid' ? 'list' : 'grid')}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title={layoutView === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                  >
                    {layoutView === 'grid' ? (
                      <Maximize2 className="w-5 h-5" />
                    ) : (
                      <Minimize2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Grid Configuration Controls */}
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Reels</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateDimension('reels', reelConfig.reels - 1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.reels <= 3}
                      >
                        <MinusSquare className="w-4 h-4" />
                      </button>
                      <div className="w-10 text-center font-semibold text-gray-800">{reelConfig.reels}</div>
                      <button 
                        onClick={() => updateDimension('reels', reelConfig.reels + 1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.reels >= 7}
                      >
                        <PlusSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Rows</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateDimension('rows', reelConfig.rows - 1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.rows <= 3}
                      >
                        <MinusSquare className="w-4 h-4" />
                      </button>
                      <div className="w-10 text-center font-semibold text-gray-800">{reelConfig.rows}</div>
                      <button 
                        onClick={() => updateDimension('rows', reelConfig.rows + 1)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.rows >= 5}
                      >
                        <PlusSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Paylines</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updatePaylines(reelConfig.paylines - 5)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.paylines <= 5}
                      >
                        <MinusSquare className="w-4 h-4" />
                      </button>
                      <div className="w-10 text-center font-semibold text-gray-800">{reelConfig.paylines}</div>
                      <button 
                        onClick={() => updatePaylines(reelConfig.paylines + 5)}
                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                        disabled={reelConfig.paylines >= Math.min(Math.pow(reelConfig.rows, reelConfig.reels), 50)}
                      >
                        <PlusSquare className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {Math.min(Math.pow(reelConfig.rows, reelConfig.reels), 50)}
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Reel Display */}
              <div className="mb-4">
                <div className="relative rounded-lg border border-gray-300 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20">
                  {/* Animated lights and slot machine glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse"></div>
                  <div className="absolute inset-0 bg-[url('/public/themes/base-style.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
                  
                  {/* Calculate dimensions based on grid size */}
                  <div
                    className="mx-auto"
                    style={{
                      // Fixed container with defined height based on grid size
                      width: `${Math.min(800, Math.max(320, reelConfig.reels * 80))}px`,
                      maxWidth: '100%',
                      // Explicitly set the exact needed height to prevent overflow
                      height: `${reelConfig.rows * (Math.max(40, 90 - (reelConfig.reels + reelConfig.rows) * 5) + 8)}px`,
                      padding: '12px',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Inner grid container with fixed dimensions */}
                    <div 
                      className="grid gap-1" 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${reelConfig.reels}, 1fr)`,
                        gridTemplateRows: `repeat(${reelConfig.rows}, 1fr)`,
                        width: '100%',
                        height: '100%'
                      }}
                  >
                    {/* Render all symbols in a pure grid layout */}
                    {reelState.map((reel, reelIndex) => (
                      // Map over each reel
                      reel.map((symbol, rowIndex) => {
                        // Only render up to the configured number of rows
                        if (rowIndex >= reelConfig.rows) return null;
                        
                        // Calculate symbol size inversely to grid size
                        // More rows/reels = smaller symbols
                        const symbolSize = Math.max(40, 90 - (reelConfig.reels + reelConfig.rows) * 5);
                        
                        return (
                          <div 
                            key={`symbol-${reelIndex}-${rowIndex}`}
                            className={`relative rounded-md overflow-hidden border-2 transition-all border-gray-300/80 hover:border-blue-400`}
                            style={{
                              backgroundColor: "transparent",
                              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                              width: '100%',
                              height: '100%',
                              gridColumn: reelIndex + 1,
                              gridRow: rowIndex + 1
                            }}
                          >
                            {/* Highlight cells that are part of active payline */}
                            {activePayline !== null && paylinePatterns[activePayline] && 
                              paylinePatterns[activePayline][reelIndex] === rowIndex && (
                              <div className="absolute inset-0 border-4 border-yellow-400 z-10 pointer-events-none"></div>
                            )}
                            
                            <img 
                              src={symbol} 
                              alt={`Symbol at reel ${reelIndex}, row ${rowIndex}`}
                              className="w-full h-full object-contain z-10 relative p-1"
                              // Slightly reduced padding for smaller grid sizes
                              style={{ padding: reelConfig.reels > 4 || reelConfig.rows > 3 ? '2px' : '4px' }}
                            />
                          </div>
                        );
                      })
                    ))}
                  </div>
                  </div>
                </div>
                
                {/* Payline Preview */}
                <div className="mt-4">
                  <PaylinePreview 
                    reels={reelConfig.reels}
                    rows={reelConfig.rows}
                    paylines={reelConfig.paylines}
                    currentPayline={activePayline !== null ? activePayline : 0}
                  />
                </div>
                
                {/* Symbol Legend */}
                <div className="mt-2 p-2 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-indigo-900/5">
                  <div className="text-xs font-medium text-gray-700 mb-2">Symbol Legend:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {/* Special Symbols */}
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.wild} alt="Wild" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Wild</span>
                    </div>
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.scatter} alt="Scatter" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Scatter</span>
                    </div>
                    
                    {/* High-paying Symbols */}
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.high_1} alt="High 1" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">High 1</span>
                    </div>
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.high_2} alt="High 2" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">High 2</span>
                    </div>
                    
                    {/* Mid-paying Symbols */}
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.mid_1} alt="Mid 1" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Mid 1</span>
                    </div>
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.mid_2} alt="Mid 2" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Mid 2</span>
                    </div>
                    
                    {/* Low-paying Symbols */}
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.low_1} alt="Low 1" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Low 1</span>
                    </div>
                    <div className="flex items-center p-1 rounded border border-gray-100/50 bg-transparent">
                      <div className="w-6 h-6 mr-1 flex items-center justify-center rounded overflow-hidden"
                        style={{
                          backgroundColor: "transparent",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)"
                        }}>
                        <img src={customSymbols.low_2} alt="Low 2" className="w-5 h-5 object-contain" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Low 2</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Symbol Management Section (conditionally rendered) */}
              {showSymbolManagement && (
                <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-3">Symbol Management</h4>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Recommended Symbols:</div>
                    <ul className="mt-1 space-y-1 text-sm text-gray-600">
                      <li>• <span className="font-medium">1 Wild Symbol</span></li>
                      <li>• <span className="font-medium">1 Scatter Symbol</span></li>
                      <li>• <span className="font-medium">{Math.max(3, Math.floor(reelConfig.reels * 0.8))} High-paying Symbols</span></li>
                      <li>• <span className="font-medium">{Math.max(4, Math.floor(reelConfig.reels * 1.2))} Low-paying Symbols</span></li>
                      <li className="text-xs text-gray-500 pt-1">Total: {2 + Math.max(3, Math.floor(reelConfig.reels * 0.8)) + Math.max(4, Math.floor(reelConfig.reels * 1.2))} symbols</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Placeholder Locations:</div>
                    <p className="text-sm text-gray-600">Place your custom symbol images in:</p>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">/public/assets/symbols/</code>
                    <p className="text-xs text-gray-500 mt-1">
                      Follow naming pattern: symbol_1.png, symbol_2.png, etc.
                    </p>
                  </div>
                </div>
              </div>
              )}
              
              {/* Payline Designer (conditionally rendered) */}
              {showPaylineDesigner && (
                <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-lg font-medium text-gray-800 mb-3">Payline Designer</h4>
                  
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payline
                          </th>
                          {Array.from({ length: reelConfig.reels }, (_, i) => (
                            <th key={`header-${i}`} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reel {i+1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paylinePatterns.slice(0, reelConfig.paylines).map((pattern, index) => (
                          <tr 
                            key={`payline-${index}`}
                            className={`hover:bg-blue-50 cursor-pointer ${activePayline === index ? 'bg-blue-100' : ''}`}
                            onClick={() => setActivePayline(activePayline === index ? null : index)}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            {Array.from({ length: reelConfig.reels }, (_, reelIndex) => (
                              <td 
                                key={`payline-${index}-${reelIndex}`} 
                                className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                              >
                                <select
                                  value={pattern[reelIndex] || 0}
                                  onChange={(e) => updatePaylinePattern(index, reelIndex, parseInt(e.target.value))}
                                  className="py-1 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {Array.from({ length: reelConfig.rows }, (_, rowIndex) => (
                                    <option key={`option-${rowIndex}`} value={rowIndex}>
                                      Row {rowIndex + 1}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right panel - Math Model & Statistics */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Math Model</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleSymbolWeights}
                    className={`p-2 rounded-lg ${showSymbolWeights ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    title={showSymbolWeights ? 'Hide symbol weights' : 'Show symbol weights'}
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <button
                    onClick={saveConfiguration}
                    className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                    title="Save configuration"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Math Model Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">Volatility</div>
                  <div className="text-lg font-semibold" style={{
                    color: gameStats.volatility <= 3 ? '#16a34a' : 
                            gameStats.volatility <= 7 ? '#ca8a04' : '#dc2626'
                  }}>
                    {gameStats.volatilityText}
                  </div>
                  <div className="mt-1.5 flex flex-col space-y-1 items-center">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" 
                        style={{
                          width: `${(gameStats.volatility / 10) * 100}%`,
                          backgroundColor: gameStats.volatility <= 3 ? '#16a34a' : 
                                           gameStats.volatility <= 7 ? '#ca8a04' : '#dc2626'
                        }}>
                      </div>
                    </div>
                    <span className="text-[10px] mt-1 inline-block">{gameStats.volatility.toFixed(1)} / 10</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">Hit Frequency</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {gameStats.hitRate.toFixed(1)}%
                  </div>
                  <div className="mt-1.5 flex flex-col space-y-1 items-center">
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(gameStats.hitRate / 40) * 100}%` }}>
                      </div>
                    </div>
                    <span className="text-[10px] mt-1 inline-block">{gameStats.hitRate.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                  <div className="text-xs text-gray-500 mb-1">RTP Range</div>
                  <div className="text-lg font-semibold text-green-600">
                    {gameStats.rtpMin}–{gameStats.rtpMax}%
                  </div>
                  <div className="mt-1.5 flex justify-center items-center">
                    <div className="text-[10px] text-green-900 bg-green-100 rounded-full px-2 py-0.5">
                      Industry Standard: 96%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RTP range indicator with improved gradient */}
              <div className="mb-4">
                <div className="relative w-full h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200"></div>
                  <div 
                    className="absolute h-full bg-gradient-to-r from-green-400 to-green-500 opacity-80" 
                    style={{ 
                      left: `${((parseFloat(gameStats.rtpMin) - 92) / 6) * 100}%`,
                      width: `${((parseFloat(gameStats.rtpMax) - parseFloat(gameStats.rtpMin)) / 6) * 100}%` 
                    }}
                  ></div>
                  <div className="absolute inset-0 flex justify-between items-center px-1 text-[10px] text-gray-700 font-medium">
                    <span>92%</span>
                    <span>94%</span>
                    <span>96%</span>
                    <span>98%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 p-3 rounded-lg border border-gray-200 bg-gray-50">
                The <span className="font-medium">{reelConfig.reels}×{reelConfig.rows}</span> grid with <span className="font-medium">{reelConfig.paylines} paylines</span> creates 
                a <span className="font-medium" style={{ 
                  color: gameStats.volatility <= 3 ? '#16a34a' : 
                          gameStats.volatility <= 7 ? '#ca8a04' : '#dc2626'
                }}>{gameStats.volatilityText.toLowerCase()}-volatility</span> game with 
                <span className="font-medium text-blue-600"> {gameStats.hitRate.toFixed(1)}%</span> hit frequency.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelBuilder;