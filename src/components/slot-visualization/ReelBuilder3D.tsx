import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { CheckCircle, Sparkles, PlusSquare, MinusSquare } from 'lucide-react';
import { gsap } from 'gsap';

/**
 * Enhanced ReelBuilder with grid visualization
 * To be used as a drop-in replacement for the default ReelBuilder
 */
const ReelBuilder3D: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  
  // Local state for reel configuration
  const [reelConfig, setReelConfig] = useState({
    reels: config.reels?.layout?.reels || 5,
    rows: config.reels?.layout?.rows || 3,
    paylines: config.reels?.betlines || 20,
    payMechanism: config.reels?.payMechanism || 'betlines'
  });
  
  // Flags
  const [showPaylineDesigner, setShowPaylineDesigner] = useState(false);
  const [showSymbolWeights, setShowSymbolWeights] = useState(false);
  const [showSymbolManagement, setShowSymbolManagement] = useState(false);
  const [activePayline, setActivePayline] = useState<number | null>(null);
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Refs for the reels
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Volatility vs hit rate simulation stats
  const [gameStats, setGameStats] = useState({
    volatility: 5,
    volatilityText: 'Medium',
    hitRate: 24.5,
    rtpMin: '94.8',
    rtpMax: '97.2'
  });

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
  
  // Initialize reelRefs
  useEffect(() => {
    reelRefs.current = reelRefs.current.slice(0, reelConfig.reels);
    while (reelRefs.current.length < reelConfig.reels) {
      reelRefs.current.push(null);
    }
  }, [reelConfig.reels]);

  // Initialize component based on config - only on first mount or game type change
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
    
    // No automatic store update - this prevents feedback loops
  }, [config.selectedGameType]); // Only run when game type changes

  // Only update config on manual changes, not initial render or config changes
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
  
  // Calculate stats whenever reelConfig changes
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
  }, [reelConfig]);
  
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
  
  // Update pay mechanism
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
  
  // Spin the reels with GSAP animation
  const spinReels = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Get the total symbols needed for a smooth animation
    const symbolHeight = 100; // Height of each symbol
    const visibleRows = reelConfig.rows;
    const totalDistance = symbolHeight * 30; // Make this much larger for lots of scrolling
    
    // Animate each reel with staggered timing
    reelRefs.current.forEach((reelRef, i) => {
      if (!reelRef) return;
      
      const delay = i * 0.2; // Stagger the start of each reel
      
      // Clone some symbols to create the illusion of infinite spinning
      const originalSymbols = Array.from(reelRef.children);
      
      // Clone symbols to ensure we have enough for the animation
      originalSymbols.forEach(symbol => {
        const clone = symbol.cloneNode(true);
        reelRef.appendChild(clone);
      });
      
      // Clone again to ensure we have plenty of symbols
      const secondBatch = Array.from(reelRef.children).slice(originalSymbols.length);
      secondBatch.forEach(symbol => {
        const clone = symbol.cloneNode(true);
        reelRef.appendChild(clone);
      });
      
      // We now have 3x the original symbols - plenty for a smooth animation
      
      // Critical: Position the reel so symbols start ABOVE the visible area
      // This creates the illusion that symbols are coming from off-screen
      gsap.set(reelRef, { y: -totalDistance });
      
      // Animate from off-screen position to final position (top to bottom motion)
      
      // Acceleration phase - start slow, speed up
      gsap.to(reelRef, {
        y: -totalDistance * 0.6, // First move UP from initial -totalDistance position
        duration: 0.5,
        delay,
        ease: "power2.in",
        onComplete: () => {
          // Constant speed phase - full speed
          gsap.to(reelRef, {
            y: 0, // Move DOWN to the middle (original position)
            duration: 1.5,
            ease: "linear",
            onComplete: () => {
              // Deceleration phase - slow down
              // Set the position to zero to ensure no gap at the top
              // This ensures all symbol positions are fully visible with no empty space
              const perfectStopPosition = 0;
              
              gsap.to(reelRef, {
                y: perfectStopPosition, // Align to show symbols perfectly
                duration: 0.8,
                ease: "power3.out",
                onComplete: () => {
                  // Final bounce effect
                  gsap.to(reelRef, {
                    y: perfectStopPosition + 10, // Slight overshoot
                    duration: 0.1,
                    ease: "power1.out",
                    onComplete: () => {
                      // Elastic bounce back
                      gsap.to(reelRef, {
                        y: perfectStopPosition, // Back to perfect position
                        duration: 0.3,
                        ease: "elastic.out(3, 0.5)",
                        onComplete: () => {
                          // Reset position with new symbol arrangement
                          if (i === reelRefs.current.length - 1) {
                            // Last reel finished
                            
                            // Clean up cloned symbols
                            while (reelRef.children.length > originalSymbols.length) {
                              reelRef.removeChild(reelRef.lastChild as Node);
                            }
                            
                            // Position the reel at the perfect stopping point with no gaps
                            gsap.set(reelRefs.current, { y: 0 });
                            
                            // Add a small delay to ensure UI updates before next operations
                            setTimeout(() => {
                              // Generate new reel state with different symbols
                              shuffleReelSymbols();
                              setIsSpinning(false);
                            }, 50);
                          }
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  };
  
  // Shuffle the symbols on each reel
  const shuffleReelSymbols = () => {
    // This will be called to update the symbol display when spinning completes
    // We're using React state, so we just need to trigger a re-render
    // The symbols are already randomized in the render function
    setReelConfig({
      ...reelConfig
    });
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
                  
                  <div className="relative mx-auto" style={{ 
                    // Calculate responsive width based on grid dimensions
                    width: `${Math.min(800, Math.max(320, reelConfig.reels * 80))}px`,
                    // Set height proportionally to the reels and rows with fixed calculation
                    height: `${reelConfig.rows * (Math.max(40, 90 - (reelConfig.reels + reelConfig.rows) * 5) + 8)}px`,
                    overflow: 'visible', // Show everything to diagnose layout issues
                    perspective: '1000px', // Add 3D perspective for more realistic motion
                    maxWidth: '100%'     // Prevent overflow on small screens
                  }}>
                    {/* No shadows - completely removed */}
                    
                    <div className="p-4" style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${reelConfig.reels}, 1fr)`,
                      gridTemplateRows: `repeat(${reelConfig.rows}, 1fr)`,
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      margin: '0 auto'    // Center the grid within the container
                    }}>
                      {/* Initialize reelRefs with correct length */}
                      {/* This useEffect has been moved to the component level */}
                      
                      {/* Validate dimensions to prevent excessive rendering */}
                      {(reelConfig.reels > 0 && reelConfig.reels <= 7 && reelConfig.rows > 0 && reelConfig.rows <= 5) ? 
                      Array(reelConfig.reels).fill(0).map((_, reelIndex) => {
                        // For each reel, we need to create enough symbols to animate
                        // Add a reasonable number of extra symbols for animation
                        const visibleRows = reelConfig.rows;
                        // Limit extra rows to a reasonable number
                        const extraRows = Math.min(9, reelConfig.rows * 2); // Much more reasonable number
                        const totalRows = visibleRows + extraRows;
                        
                        // Calculate symbols - randomize but ensure consistent during animation
                        const reelSymbols = Array(totalRows).fill(0).map((_, rowIndex) => {
                          // Generate a symbol index based on position
                          // Use a more random algorithm but with a seed based on reelIndex
                          const symbolIndex = Math.floor(
                            (Math.sin(reelIndex * 100 + rowIndex * 50) + 1) * 4.5
                          ) % 9;
                          
                          const symbols = [
                            '/assets/symbols/wild.png',
                            '/assets/symbols/scatter.png',
                            '/assets/symbols/high_1.png',
                            '/assets/symbols/high_2.png',
                            '/assets/symbols/high_3.png',
                            '/assets/symbols/mid_1.png',
                            '/assets/symbols/mid_2.png',
                            '/assets/symbols/low_1.png',
                            '/assets/symbols/low_2.png'
                          ];
                          
                          return {
                            image: symbols[symbolIndex],
                            index: symbolIndex
                          };
                        });
                        
                        return (
                          <div 
                            key={`reel-${reelIndex}`}
                            ref={el => reelRefs.current[reelIndex] = el}
                            className="flex flex-col gap-1 relative"
                            style={{
                              transform: 'translateY(0px)',
                              transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
                            }}
                          >
                            {reelSymbols.map((symbol, rowIndex) => (
                              <div 
                                key={`symbol-${reelIndex}-${rowIndex}`} 
                                className="relative aspect-square rounded-md overflow-hidden border-2 transition-all border-gray-300/80 hover:border-blue-400"
                                style={{
                                  // Calculate symbol size inversely to grid size
                                  // More rows/reels = smaller symbols
                                  height: `${Math.max(40, 90 - (reelConfig.reels + reelConfig.rows) * 5)}px`,
                                  width: `${Math.max(40, 90 - (reelConfig.reels + reelConfig.rows) * 5)}px`,
                                  backgroundColor: "transparent",
                                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                                  margin: '0 auto'
                                }}
                              >
                                <img 
                                  src={symbol.image} 
                                  alt={`Symbol at reel ${reelIndex}, row ${rowIndex}`}
                                  className="w-full h-full object-contain z-10 relative"
                                  // Slightly reduced padding for smaller grid sizes
                                  style={{ padding: reelConfig.reels > 4 || reelConfig.rows > 3 ? '2px' : '4px' }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })
                    : <div className="text-center py-4 text-gray-500">Invalid grid dimensions</div>}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    onClick={spinReels}
                    disabled={isSpinning}
                    className={`px-6 py-2 font-semibold rounded-lg ${
                      isSpinning ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSpinning ? 'Spinning...' : 'SPIN REELS'}
                  </button>
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

export default ReelBuilder3D;