import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { ChevronDown, ChevronUp, Star, Gift, Coins, Zap, HelpCircle, BarChart2, AlertCircle, Grid, Dice1 as Dice, Target, Plus, Minus, Award, Clock, RotateCw, RefreshCw, Lock, ArrowRight } from 'lucide-react';

export const BonusFeatures: React.FC = () => {
  const { config, updateConfig, setStep } = useGameStore();
  const { bonus } = config;

  // Track expanded features
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>(['freeSpins', 'jackpots']);
  const [mathModel, setMathModel] = useState({
    featureRTP: 0,
    hitFrequency: 0,
    maxWin: 0
  });
  
  // Track preview states separately for each feature
  const [previewStates, setPreviewStates] = useState({
    wheel: false,
    pickAndClick: false,
    holdAndSpin: false
  });
  
  // Reference for setting which preview is actively displayed (for UI purposes)
  const [activePreview, setActivePreview] = useState<string | null>(null);
  
  // Canvas references
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdSpinCanvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw wheel bonus preview
  const drawWheel = (segmentCount: number, hasLevelUp: boolean, hasRespin: boolean) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.45;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#F8C630';
    ctx.fill();
    
    // Define segment colors
    const colors = [
      '#EF5350', '#42A5F5', '#66BB6A', '#FFA726', 
      '#8D6E63', '#26A69A', '#EC407A', '#7E57C2',
      '#5C6BC0', '#FFB74D', '#9CCC65', '#4DD0E1'
    ];
    
    // Define segment types - prizes, special segments, etc.
    let segments: {type: string, value: number}[] = [];
    const maxPrize = bonus?.wheel?.maxMultiplier || 50;
    
    // Create an array of random prizes
    for (let i = 0; i < segmentCount; i++) {
      // Add some level up and respin segments if enabled
      if (hasLevelUp && i === 2) {
        segments.push({ type: 'levelup', value: 0 });
      } else if (hasRespin && i === 5) {
        segments.push({ type: 'respin', value: 0 });
      } else {
        // Generate random prize values distributed based on segment position
        let value;
        if (i < segmentCount * 0.6) { // 60% low values
          value = Math.floor(Math.random() * (maxPrize * 0.2) + 1);
        } else if (i < segmentCount * 0.9) { // 30% medium values
          value = Math.floor(Math.random() * (maxPrize * 0.5) + (maxPrize * 0.2));
        } else { // 10% high values
          value = Math.floor(Math.random() * (maxPrize * 0.3) + (maxPrize * 0.7));
        }
        segments.push({ type: 'prize', value });
      }
    }
    
    // Shuffle segments
    segments = segments.sort(() => Math.random() - 0.5);
    
    // Draw wheel segments
    const anglePerSegment = (Math.PI * 2) / segmentCount;
    for (let i = 0; i < segmentCount; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Coloring based on segment type
      if (segments[i].type === 'levelup') {
        ctx.fillStyle = '#FFD700'; // Gold for level up
      } else if (segments[i].type === 'respin') {
        ctx.fillStyle = '#D1C4E9'; // Light purple for respin
      } else {
        ctx.fillStyle = colors[i % colors.length];
      }
      ctx.fill();
      
      // Add stroke
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      
      // Draw segment text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FFFFFF';
      
      // Different text based on segment type
      if (segments[i].type === 'levelup') {
        ctx.fillText('LEVEL UP', radius * 0.7, 0);
      } else if (segments[i].type === 'respin') {
        ctx.fillText('RESPIN', radius * 0.7, 0);
      } else {
        ctx.fillText(`${segments[i].value}x`, radius * 0.7, 0);
      }
      
      ctx.restore();
    }
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#F8C630';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 20);
    ctx.lineTo(centerX - 15, centerY - radius + 5);
    ctx.lineTo(centerX + 15, centerY - radius + 5);
    ctx.closePath();
    ctx.fillStyle = '#E53935';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  };

  // Helper functions
  const toggleFeature = (feature: string) => {
    setExpandedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // Function to render Pick & Click grid preview
  const renderPickAndClickGrid = () => {
    const gridSize = bonus?.pickAndClick?.gridSize || [3, 3];
    const picks = bonus?.pickAndClick?.picks || 3;
    const maxPrize = bonus?.pickAndClick?.maxPrize || 100;
    const hasMultipliers = !!bonus?.pickAndClick?.multipliers;
    const hasExtraPicks = !!bonus?.pickAndClick?.extraPicks;
    
    const rows = gridSize[0];
    const cols = gridSize[1];
    
    // Create grid with different symbol types
    const grid = Array(rows).fill(0).map(() => Array(cols).fill(null));
    
    // Randomly distribute different cell types
    let remainingPrizes = [];
    
    // Generate prize values with distribution
    for (let i = 0; i < rows * cols; i++) {
      let value;
      if (i < (rows * cols) * 0.5) { // 50% low prizes
        value = Math.floor(Math.random() * (maxPrize * 0.3) + 1);
      } else if (i < (rows * cols) * 0.8) { // 30% medium prizes
        value = Math.floor(Math.random() * (maxPrize * 0.4) + (maxPrize * 0.3));
      } else { // 20% high prizes
        value = Math.floor(Math.random() * (maxPrize * 0.3) + (maxPrize * 0.7));
      }
      remainingPrizes.push({ type: 'prize', value });
    }
    
    // Add special symbols if enabled
    if (hasExtraPicks) {
      const extraPickIndex = Math.floor(Math.random() * remainingPrizes.length);
      remainingPrizes[extraPickIndex] = { type: 'extraPick', value: 0 };
    }
    
    if (hasMultipliers) {
      const multiplierIndex = Math.floor(Math.random() * remainingPrizes.length);
      if (multiplierIndex !== remainingPrizes.findIndex(p => p.type === 'extraPick')) {
        remainingPrizes[multiplierIndex] = { type: 'multiplier', value: [2, 3, 5][Math.floor(Math.random() * 3)] };
      }
    }
    
    // Shuffle prizes and assign to grid
    remainingPrizes = remainingPrizes.sort(() => Math.random() - 0.5);
    
    // Fill grid with prizes
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (remainingPrizes.length > 0) {
          grid[r][c] = remainingPrizes.pop();
        }
      }
    }
    
    // Simulate already opened cells
    const revealedCells = Array(rows).fill(0).map(() => Array(cols).fill(false));
    const openedCount = Math.min(picks, 4);
    
    // Randomly open a few cells
    for (let i = 0; i < openedCount; i++) {
      let r, c;
      do {
        r = Math.floor(Math.random() * rows);
        c = Math.floor(Math.random() * cols);
      } while (revealedCells[r][c]);
      
      revealedCells[r][c] = true;
    }
    
    return { grid, revealedCells, picks, totalPicks: picks };
  };

  const isFeatureEnabled = (feature: string) => {
    return bonus?.[feature]?.enabled || false;
  };

  // Helper to update a specific preview state
  const updatePreviewState = (feature: string, value: boolean) => {
    if (feature === 'wheel' || feature === 'pickAndClick' || feature === 'holdAndSpin') {
      setPreviewStates(prev => ({
        ...prev,
        [feature]: value
      }));
      
      if (value) {
        setActivePreview(feature);
      }
    }
  };
  
  const toggleFeatureEnabled = (feature: string) => {
    updateConfig({
      bonus: {
        ...config.bonus,
        [feature]: {
          ...config.bonus?.[feature],
          enabled: !isFeatureEnabled(feature)
        }
      }
    });
    
    // When enabling a feature, automatically show its preview
    if (!isFeatureEnabled(feature)) {
      if (feature === 'wheel' || feature === 'pickAndClick' || feature === 'holdAndSpin') {
        updatePreviewState(feature, true);
      }
    }
  };

  // Initialize preview states based on enabled features
  useEffect(() => {
    setPreviewStates({
      wheel: isFeatureEnabled('wheel'),
      pickAndClick: isFeatureEnabled('pickAndClick'),
      holdAndSpin: isFeatureEnabled('holdAndSpin')
    });
    
    // Set active preview to the first enabled feature
    if (isFeatureEnabled('wheel')) {
      setActivePreview('wheel');
    } else if (isFeatureEnabled('pickAndClick')) {
      setActivePreview('pickAndClick');
    } else if (isFeatureEnabled('holdAndSpin')) {
      setActivePreview('holdAndSpin');
    }
  }, []);
  
  // Render wheel preview when wheel state is active
  useEffect(() => {
    if (previewStates.wheel && isFeatureEnabled('wheel') && bonus?.wheel?.enabled) {
      const segmentCount = bonus?.wheel?.segments || 8;
      const hasLevelUp = !!bonus?.wheel?.levelUp;
      const hasRespin = !!bonus?.wheel?.respin;
      drawWheel(segmentCount, hasLevelUp, hasRespin);
    }
  }, [previewStates.wheel, bonus?.wheel?.segments, bonus?.wheel?.levelUp, bonus?.wheel?.respin, bonus?.wheel?.enabled]);
  
  // Function to draw Hold & Spin preview
  const drawHoldAndSpin = () => {
    const canvas = holdSpinCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#0F1423';
    ctx.fillRect(0, 0, width, height);
    
    // Get grid size
    const gridSize = bonus?.holdAndSpin?.gridSize || [3, 3];
    const rows = gridSize[0];
    const cols = gridSize[1];
    
    // Calculate cell size
    const padding = 20;
    const cellWidth = (width - padding * 2) / cols;
    const cellHeight = (height - padding * 2) / rows;
    
    // Generate random symbols and locked state
    const symbols = [];
    const locked = [];
    
    // Generate symbol values with distribution
    const maxValue = bonus?.holdAndSpin?.maxSymbolValue || 100;
    
    for (let r = 0; r < rows; r++) {
      symbols[r] = [];
      locked[r] = [];
      for (let c = 0; c < cols; c++) {
        // 50% chance of locked symbols (already held)
        locked[r][c] = Math.random() < 0.5;
        
        // Generate symbol value
        if (locked[r][c]) {
          // For locked symbols, use value distribution
          if (Math.random() < 0.7) {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.3) + 1); // Low value
          } else if (Math.random() < 0.9) {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.4) + (maxValue * 0.3)); // Medium value
          } else {
            symbols[r][c] = Math.floor(Math.random() * (maxValue * 0.3) + (maxValue * 0.7)); // High value
          }
        } else {
          symbols[r][c] = 0; // Empty cells
        }
      }
    }
    
    // Draw the grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padding + c * cellWidth;
        const y = padding + r * cellHeight;
        const value = symbols[r][c];
        const isLocked = locked[r][c];
        
        // Draw cell background
        ctx.fillStyle = isLocked ? '#1A5276' : '#2C3E50';
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 5, cellWidth - 10, cellHeight - 10, 8);
        ctx.fill();
        
        if (isLocked) {
          // Draw value for locked symbols
          ctx.fillStyle = value < (maxValue * 0.3) 
            ? '#3498DB' // Low value color
            : value < (maxValue * 0.7)
              ? '#E74C3C' // Medium value color
              : '#F1C40F'; // High value color
              
          ctx.beginPath();
          ctx.arc(x + cellWidth/2, y + cellHeight/2, cellWidth * 0.35, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw symbol value
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${value}x`, x + cellWidth/2, y + cellHeight/2);
        } else {
          // Draw empty slot
          ctx.strokeStyle = '#95A5A6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + cellWidth/2, y + cellHeight/2, cellWidth * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Draw header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HOLD & SPIN BONUS', width/2, 8);
    
    // Draw respins info
    ctx.font = '12px Arial';
    ctx.fillText(`RESPINS: ${bonus?.holdAndSpin?.initialRespins || 3}`, width/2, height - 20);
  }
  
  // Render Hold & Spin preview when holdAndSpin state is active
  useEffect(() => {
    if (previewStates.holdAndSpin && isFeatureEnabled('holdAndSpin')) {
      drawHoldAndSpin();
    }
  }, [previewStates.holdAndSpin, bonus?.holdAndSpin?.gridSize, bonus?.holdAndSpin?.initialRespins, bonus?.holdAndSpin?.maxSymbolValue]);

  // Calculate math model based on selected features
  useEffect(() => {
    let totalRTP = 0;
    let totalHitFrequency = 0;
    let maxWinPotential = 0;

    // Free Spins contribution
    if (bonus?.freeSpins?.enabled) {
      const multiplier = Math.max(...(bonus.freeSpins.multipliers || [1]));
      const spinsCount = bonus.freeSpins.count || 10;
      totalRTP += (multiplier * spinsCount * 0.1);
      totalHitFrequency += 1/165; // Base hit rate
      maxWinPotential = Math.max(maxWinPotential, multiplier * spinsCount * 100);
    }

    // Pick & Click contribution
    if (bonus?.pickAndClick?.enabled) {
      const picks = bonus.pickAndClick.picks || 3;
      const maxPrize = bonus.pickAndClick.maxPrize || 100;
      totalRTP += (picks * maxPrize * 0.05);
      totalHitFrequency += 1/200;
      maxWinPotential = Math.max(maxWinPotential, maxPrize);
    }

    // Wheel Bonus contribution
    if (bonus?.wheel?.enabled) {
      const segments = bonus.wheel.segments || 8;
      const maxMultiplier = bonus.wheel.maxMultiplier || 50;
      totalRTP += (maxMultiplier * 0.2);
      totalHitFrequency += 1/250;
      maxWinPotential = Math.max(maxWinPotential, maxMultiplier * 100);
    }

    // Hold & Spin contribution
    if (bonus?.holdAndSpin?.enabled) {
      const positions = (bonus.holdAndSpin.gridSize?.[0] || 3) * (bonus.holdAndSpin.gridSize?.[1] || 3);
      const maxValue = bonus.holdAndSpin.maxSymbolValue || 100;
      totalRTP += (positions * maxValue * 0.02);
      totalHitFrequency += 1/180;
      maxWinPotential = Math.max(maxWinPotential, positions * maxValue);
    }
    
    // Jackpots contribution
    if (bonus?.jackpots?.enabled) {
      const jackpotLevels = bonus.jackpots.levels || ['Minor', 'Major'];
      const isProgressive = bonus.jackpots.type === 'progressive';
      
      // Calculate based on jackpot levels
      const baseContribution = isProgressive ? 6 : 4; // Progressive jackpots contribute more to RTP
      totalRTP += baseContribution * jackpotLevels.length * 0.5;
      
      // Higher hit frequency for more levels
      totalHitFrequency += jackpotLevels.length / 1000;
      
      // Max win potential for highest jackpot
      const highestLevel = jackpotLevels[jackpotLevels.length - 1];
      const jackpotValue = 
        highestLevel === 'Mini' ? 20 : 
        highestLevel === 'Minor' ? 100 : 
        highestLevel === 'Major' ? 1000 : 
        highestLevel === 'Grand' ? 10000 : 1000;
      
      maxWinPotential = Math.max(maxWinPotential, jackpotValue);
    }

    setMathModel({
      featureRTP: totalRTP,
      hitFrequency: totalHitFrequency,
      maxWin: maxWinPotential
    });
  }, [bonus]);

  return (
    <div className="space-y-2 rounded-md">
      {/* Bonus Features */}
      <div className="bg-white rounded-md p-0 border border-[#DFE1E6] shadow-sm">
        <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left transition-colors mb-"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Bonus Features</h3>
              </div>
            </div>
        
        <div className="p-3 space-y-2 bg-white rounded-md">
          {/* Free Spins */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D]">Free Spins</h4>
                    <p className="text-sm text-[#5E6C84]">Classic free spins bonus</p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('freeSpins')}
                      onChange={() => toggleFeatureEnabled('freeSpins')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span className="text-sm text-[#172B4D]">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('freeSpins') && (
              <div className="px-2 pb-4">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Trigger Requirements */}
                  <div className='border p-2 rounded-md bg-white'>
                    <label className="block text-sm font-medium text-[#172B4D] mb-1">
                      Trigger Requirements
                    </label>
                    <select
                      value={bonus?.freeSpins?.triggers?.[0] || 3}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          freeSpins: {
                            ...config.bonus?.freeSpins,
                            triggers: [parseInt(e.target.value)]
                          }
                        }
                      })}
                      className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D]"
                    >
                      <option value="3">3 Scatters</option>
                      <option value="4">4 Scatters</option>
                      <option value="5">5 Scatters</option>
                    </select>
                  </div>

                  {/* Free Spins Count */}
                  <div className="mt-2 border bg-white rounded-md p-2">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2">
                      Number of Free Spins
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[8, 10, 12, 15, 20, 25].map((count) => (
                        <button
                          key={count}
                          onClick={() => updateConfig({
                            bonus: {
                              ...config.bonus,
                              freeSpins: {
                                ...config.bonus?.freeSpins,
                                count
                              }
                            }
                          })}
                          className={`p-2 rounded-lg border transition-colors ${
                            bonus?.freeSpins?.count === count
                              ? 'bg-red-50 border-[#0052CC] border-red-500'
                              : 'bg-white border-[#DFE1E6]'
                          }`}
                        >
                          {count} Spins
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multipliers */}
                  <div className="mt-2 border p-2 rounded-md bg-white">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2">
                      Win Multipliers
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 5, 10].map((mult) => (
                        <label key={mult} className="flex items-center border py-1 px-2 rounded-md">
                          <input
                            type="checkbox"
                            checked={bonus?.freeSpins?.multipliers?.includes(mult)}
                            onChange={(e) => {
                              const newMults = e.target.checked
                                ? [...(bonus?.freeSpins?.multipliers || []), mult]
                                : (bonus?.freeSpins?.multipliers || []).filter(m => m !== mult);
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  freeSpins: {
                                    ...config.bonus?.freeSpins,
                                    multipliers: newMults
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-[#172B4D]">x{mult}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="mt-2 border bg-white p-2 rounded-md space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bonus?.freeSpins?.retriggers}
                        onChange={(e) => updateConfig({
                          bonus: {
                            ...config.bonus,
                            freeSpins: {
                              ...config.bonus?.freeSpins,
                              retriggers: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                      />
                      <span className="ml-2 text-[#172B4D]">Allow Retriggers</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Pick & Click */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D]">Pick & Click</h4>
                    <p className="text-sm text-[#5E6C84]">Interactive bonus game</p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('pickAndClick')}
                      onChange={() => toggleFeatureEnabled('pickAndClick')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span className="text-sm text-[#172B4D]">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('pickAndClick') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Preview and Configuration in two columns */}
                  <div className="flex border p-1 rounded-md bg-white flex-col md:flex-row gap-6">
                    {/* Left column - Configuration */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {/* Grid Size */}
                      <div>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Grid Size
                        </label>
                        <div className="grid grid-cols-3 gap-2 border p-1 bg-gray-50 rounded-md">
                          {[
                            { label: '3x3', size: [3, 3] },
                            { label: '3x4', size: [3, 4] },
                            { label: '4x4', size: [4, 4] }
                          ].map((grid) => (
                            <button
                              key={grid.label}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: {
                                      ...config.bonus?.pickAndClick,
                                      gridSize: grid.size
                                    }
                                  }
                                });
                                // Only set active preview, don't affect other previews
                                if (activePreview !== 'pickAndClick') {
                                  setActivePreview('pickAndClick');
                                } else {
                                  // Refresh the pick & click preview
                                  const tempPreview = activePreview;
                                  setActivePreview(null);
                                  setTimeout(() => setActivePreview(tempPreview), 50);
                                }
                              }}
                              className={`p-1 rounded-lg border transition-colors ${
                                JSON.stringify(bonus?.pickAndClick?.gridSize) === JSON.stringify(grid.size)
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-white '
                              }`}
                            >
                              {grid.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Number of Picks */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Initial Picks
                        </label>
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              const currentPicks = bonus?.pickAndClick?.picks || 3;
                              if (currentPicks > 1) {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: {
                                      ...config.bonus?.pickAndClick,
                                      picks: currentPicks - 1
                                    }
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[#F4F5F7] rounded-l-lg border border-[#DFE1E6] text-[#172B4D] hover:bg-[#E9ECF0]"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={bonus?.pickAndClick?.picks || 3}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: {
                                    ...config.bonus?.pickAndClick,
                                    picks: parseInt(e.target.value)
                                  }
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="flex-1 h-8 bg-white border-t border-b border-[#DFE1E6] px-4 text-center text-[#172B4D]"
                          />
                          
                          <button
                            onClick={() => {
                              const currentPicks = bonus?.pickAndClick?.picks || 3;
                              if (currentPicks < 10) {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: {
                                      ...config.bonus?.pickAndClick,
                                      picks: currentPicks + 1
                                    }
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[#F4F5F7] rounded-r-lg border border-[#DFE1E6] text-[#172B4D] hover:bg-[#E9ECF0]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-center mt-1 text-xs text-[#5E6C84]">
                          <span>Picks remaining: {bonus?.pickAndClick?.picks || 3}</span>
                        </div>
                      </div>

                      {/* Prize Configuration */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Maximum Prize
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[50, 100, 200, 500].map((prize) => (
                            <button
                              key={prize}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    pickAndClick: {
                                      ...config.bonus?.pickAndClick,
                                      maxPrize: prize
                                    }
                                  }
                                });
                                setActivePreview('pickAndClick');
                              }}
                              className={`p-1 rounded-lg text-base border transition-colors ${
                                bonus?.pickAndClick?.maxPrize === prize
                                  ? ' bg-red-50 border-red-500'
                                  : 'bg-white'
                              }`}
                            >
                              {prize}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="space-y-2 border p-2 rounded-md bg-gray-50">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.pickAndClick?.extraPicks}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: {
                                    ...config.bonus?.pickAndClick,
                                    extraPicks: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-[#172B4D]">Include Extra Pick Symbols</span>
                          <Plus className="ml-2 w-4 h-4 text-[#66BB6A]" />
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.pickAndClick?.multipliers}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  pickAndClick: {
                                    ...config.bonus?.pickAndClick,
                                    multipliers: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('pickAndClick');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-[#172B4D]">Include Multiplier Symbols</span>
                          <span className="ml-2 text-xs font-bold text-[#FFA726]">x2</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2 ">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center">
                          <span>Live Preview</span>
                          {!previewStates.pickAndClick && (
                            <button
                              onClick={() => updatePreviewState('pickAndClick', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>
                        
                        {previewStates.pickAndClick && activePreview === 'pickAndClick' ? (
                          <div>
                            {/* Render Pick & Click grid preview */}
                            {(() => {
                              const { grid, revealedCells, picks } = renderPickAndClickGrid();
                              const gridSize = bonus?.pickAndClick?.gridSize || [3, 3];
                              const rows = gridSize[0];
                              const cols = gridSize[1];
                              
                              return (
                                <div className="bg-[#0F1423] p-2 rounded-md">
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="text-white font-semibold">PICK & CLICK BONUS</div>
                                    <div className="text-[#FFF176] font-semibold">Picks: {picks}</div>
                                  </div>
                                  
                                  <div 
                                    className="grid gap-2 mx-auto" 
                                    style={{
                                      gridTemplateColumns: `repeat(${cols}, 1fr)`, 
                                      gridTemplateRows: `repeat(${rows}, 1fr)`
                                    }}
                                  >
                                    {Array(rows).fill(0).map((_, r) => (
                                      Array(cols).fill(0).map((_, c) => {
                                        const cell = grid[r][c];
                                        const isRevealed = revealedCells[r][c];
                                        
                                        if (isRevealed && cell) {
                                          // Render revealed cell with different styles based on type
                                          let content, bgColor;
                                          
                                          if (cell.type === 'extraPick') {
                                            content = (
                                              <div className="flex flex-col items-center text-center justify-center">
                                                <Plus className="w-4 h-4 text-white" />
                                                <p className="text-xs mt-1 text-white">EXTRA PICK</p>
                                              </div>
                                            );
                                            bgColor = 'bg-[#66BB6A]';
                                          } else if (cell.type === 'multiplier') {
                                            content = (
                                              <div className="flex flex-col items-center justify-center">
                                                <div className="text-base font-bold text-white">x{cell.value}</div>
                                                <div className="text-xs text-white">MULTIPLIER</div>
                                              </div>
                                            );
                                            bgColor = 'bg-[#FFA726]';
                                          } else {
                                            content = (
                                              <div className="flex flex-col items-center justify-center">
                                                <div className="text-base font-bold text-white">{cell.value}x</div>
                                                <div className="text-xs  text-white">WIN</div>
                                              </div>
                                            );
                                            bgColor = cell.value < (bonus?.pickAndClick?.maxPrize * 0.3) 
                                              ? 'bg-[#5C6BC0]' // Low prize
                                              : cell.value < (bonus?.pickAndClick?.maxPrize * 0.7)
                                                ? 'bg-[#EF5350]' // Medium prize
                                                : 'bg-[#FFD700]'; // High prize
                                          }
                                          
                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className={`${bgColor} w-12 h-12 rounded-lg shadow-md flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105`}
                                            >
                                              {content}
                                            </div>
                                          );
                                        } else {
                                          // Render unrevealed cell
                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className="w-12 h-12 bg-[#2D3748] rounded-lg flex items-center justify-center text-white cursor-pointer shadow-md transition-all duration-300 hover:bg-[#4A5568]"
                                              onClick={() => setActivePreview('pickAndClick')} // Re-render to show a different random setup
                                            >
                                              <div className="text-3xl font-bold text-[#A0AEC0]">?</div>
                                            </div>
                                          );
                                        }
                                      })
                                    ))}
                                  </div>
                                  
                                  <div className="flex justify-center mt-3">
                                    <button
                                      onClick={() => {
                                        // Just call renderPickAndClickGrid again by refreshing state
                                        const tempPreview = activePreview;
                                        setActivePreview(null);
                                        setTimeout(() => setActivePreview(tempPreview), 50);
                                      }}
                                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                                    >
                                      Randomize Preview
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] border border-dashed border-[#DFE1E6] rounded-lg flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => updatePreviewState('pickAndClick', true)}
                          >
                            <div className="text-center p-5">
                              <Gift className="w-10 h-10 text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium">Click to preview your Pick & Click Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights & Tips */}
                  {/* <div className="mt-6 bg-[#F4F5F7] p-4 rounded-lg text-sm text-[#5E6C84]">
                    <h5 className="font-medium text-[#172B4D] mb-1">Design Insights</h5>
                    <ul className="space-y-1 list-disc pl-5">
                      <li>Larger grids give more possibilities but reduce odds of high-value prizes</li>
                      <li>Extra Pick symbols extend the bonus and increase win potential</li>
                      <li>Multipliers add depth to gameplay and can lead to surprise big wins</li>
                    </ul>
                  </div> */}
                </div>
              </div>
            )}
          </div>

          {/* Wheel Bonus */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D]">Wheel Bonus</h4>
                    <p className="text-sm text-[#5E6C84]">Wheel of fortune style bonus</p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('wheel')}
                      onChange={() => toggleFeatureEnabled('wheel')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span className="text-sm text-[#172B4D]">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('wheel') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Preview and Configuration in two columns */}
                  <div className="flex border p-2 rounded-md bg-white flex-col md:flex-row gap-6">
                    {/* Left column - Configuration */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {/* Number of Segments */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-1">
                          Number of Segments
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[8, 12, 16, 20].map((segments) => (
                            <button
                              key={segments}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    wheel: {
                                      ...config.bonus?.wheel,
                                      segments
                                    }
                                  }
                                });
                                setActivePreview('wheel');
                              }}
                              className={`p-1 rounded-lg border transition-colors ${
                                bonus?.wheel?.segments === segments
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-white ]'
                              }`}
                            >
                              {segments}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Maximum Multiplier */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Maximum Multiplier
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[50, 100, 250, 500].map((mult) => (
                            <button
                              key={mult}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    wheel: {
                                      ...config.bonus?.wheel,
                                      maxMultiplier: mult
                                    }
                                  }
                                });
                                setActivePreview('wheel');
                              }}
                              className={`p-1 rounded-lg border transition-colors ${
                                bonus?.wheel?.maxMultiplier === mult
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-white'
                              }`}
                            >
                              {mult}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="space-y-2 border p-2 rounded-md bg-gray-50">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.wheel?.levelUp}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  wheel: {
                                    ...config.bonus?.wheel,
                                    levelUp: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('wheel');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC]"
                          />
                          <span className="ml-2 text-base text-[#172B4D]">Include Level Up Segments</span>
                          {/* <Award className="ml-2 w-4 h-4 text-[#FFD700]" /> */}
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.wheel?.respin}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  wheel: {
                                    ...config.bonus?.wheel,
                                    respin: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('wheel');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-base text-[#172B4D]">Include Respin Segments</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center">
                          <span>Live Preview</span>
                          {!previewStates.wheel && (
                            <button
                              onClick={() => updatePreviewState('wheel', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>
                        {previewStates.wheel && activePreview === 'wheel' ? (
                          <div className="relative">
                            <canvas 
                              ref={wheelCanvasRef} 
                              width={250} 
                              height={250} 
                              className="border border-[#DFE1E6] rounded-full shadow-sm"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => {
                                  const segmentCount = bonus?.wheel?.segments || 8;
                                  const hasLevelUp = !!bonus?.wheel?.levelUp;
                                  const hasRespin = !!bonus?.wheel?.respin;
                                  drawWheel(segmentCount, hasLevelUp, hasRespin);
                                }}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <RotateCw className="w-5 h-5 text-[#0052CC]" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] border border-dashed border-[#DFE1E6] rounded-full flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => {
                              updatePreviewState('wheel', true);
                            }}
                          >
                            <div className="text-center p-5">
                              <Zap className="w-10 h-10 text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium">Click to preview your Wheel Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights & Tips */}
                  {/* <div className="mt-6 bg-[#F4F5F7] p-4 rounded-lg text-sm text-[#5E6C84]">
                    <h5 className="font-medium text-[#172B4D] mb-1">Design Insights</h5>
                    <ul className="space-y-1 list-disc pl-5">
                      <li>Wheels with more segments reduce the chance of landing on high-value prizes</li>
                      <li>Level Up segments can lead to multiple tiers with increasing prizes</li>
                      <li>Respin segments keep players engaged with extended bonus sessions</li>
                    </ul>
                  </div> */}
                </div>
              </div>
            )}
          </div>

          {/* Hold & Spin */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D]">Hold & Spin</h4>
                    <p className="text-sm text-[#5E6C84]">Respin feature with locked symbols</p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('holdAndSpin')}
                      onChange={() => toggleFeatureEnabled('holdAndSpin')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span className="text-sm text-[#172B4D]">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('holdAndSpin') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Preview and Configuration in two columns */}
                  <div className="flex border p-2 rounded-md bg-white flex-col md:flex-row gap-6">
                    {/* Left column - Configuration */}
                    <div className="w-full md:w-1/2 space-y-2">
                      {/* Grid Size */}
                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Grid Size
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: '3x3', size: [3, 3] },
                            { label: '3x4', size: [3, 4] },
                            { label: '4x4', size: [4, 4] }
                          ].map((grid) => (
                            <button
                              key={grid.label}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    holdAndSpin: {
                                      ...config.bonus?.holdAndSpin,
                                      gridSize: grid.size
                                    }
                                  }
                                });
                                setActivePreview('holdAndSpin');
                              }}
                              className={`p-1 rounded-lg border transition-colors ${
                                JSON.stringify(bonus?.holdAndSpin?.gridSize) === JSON.stringify(grid.size)
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-white'
                              }`}
                            >
                              {grid.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Initial Respins */}
                      <div className="mt-2 border rounded-md bg-gray-50 p-2">
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Initial Respins
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={bonus?.holdAndSpin?.initialRespins || 3}
                          onChange={(e) => {
                            updateConfig({
                              bonus: {
                                ...config.bonus,
                                holdAndSpin: {
                                  ...config.bonus?.holdAndSpin,
                                  initialRespins: parseInt(e.target.value)
                                }
                              }
                            });
                            setActivePreview('holdAndSpin');
                          }}
                          className="w-full bg-white border border-[#DFE1E6] rounded-lg px-2 py-1 text-[#172B4D]"
                        />
                      </div>

                      {/* Symbol Values */}
                      <div className="mt-2 border rounded-md bg-gray-50 p-2">
                        <label className="block text-sm font-medium text-[#172B4D] mb-2">
                          Maximum Symbol Value
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                          {[25, 50, 100, 250].map((value) => (
                            <button
                              key={value}
                              onClick={() => {
                                updateConfig({
                                  bonus: {
                                    ...config.bonus,
                                    holdAndSpin: {
                                      ...config.bonus?.holdAndSpin,
                                      maxSymbolValue: value
                                    }
                                  }
                                });
                                setActivePreview('holdAndSpin');
                              }}
                              className={`p-1 rounded-lg border transition-colors ${
                                bonus?.holdAndSpin?.maxSymbolValue === value
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-white '
                              }`}
                            >
                              {value}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="mt-2 border rounded-md p-2 bg-gray-50 space-y-2">
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.holdAndSpin?.resetRespins}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  holdAndSpin: {
                                    ...config.bonus?.holdAndSpin,
                                    resetRespins: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('holdAndSpin');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-[#172B4D]">Reset Respins on Symbol Land</span>
                        </label>
                        <label className="flex items-center border p-1 rounded-md bg-white">
                          <input
                            type="checkbox"
                            checked={bonus?.holdAndSpin?.collectAll}
                            onChange={(e) => {
                              updateConfig({
                                bonus: {
                                  ...config.bonus,
                                  holdAndSpin: {
                                    ...config.bonus?.holdAndSpin,
                                    collectAll: e.target.checked
                                  }
                                }
                              });
                              setActivePreview('holdAndSpin');
                            }}
                            className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span className="ml-2 text-[#172B4D]">Include Collect All Symbol</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Right column - Preview */}
                    <div className="w-full md:w-1/2">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 text-sm font-medium text-[#172B4D] flex items-center">
                          <span>Live Preview</span>
                          {!previewStates.holdAndSpin && (
                            <button
                              onClick={() => updatePreviewState('holdAndSpin', true)}
                              className="ml-2 text-[#0052CC] hover:text-[#0747A6] transition-colors"
                            >
                              (Show)
                            </button>
                          )}
                        </div>
                        
                        {previewStates.holdAndSpin && activePreview === 'holdAndSpin' ? (
                          <div className="relative">
                            <canvas 
                              ref={holdSpinCanvasRef} 
                              width={260} 
                              height={250} 
                              className="border border-[#DFE1E6] rounded-lg shadow-sm"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => drawHoldAndSpin()}
                                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <RefreshCw className="w-5 h-5 text-[#0052CC]" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-[300px] h-[300px] border border-dashed border-[#DFE1E6] rounded-lg flex items-center justify-center bg-[#F4F5F7] cursor-pointer hover:bg-[#DEEBFF] transition-colors"
                            onClick={() => updatePreviewState('holdAndSpin', true)}
                          >
                            <div className="text-center p-5">
                              <Coins className="w-10 h-10 text-[#0052CC] mx-auto mb-2" />
                              <p className="text-[#172B4D] font-medium">Click to preview your Hold & Spin Bonus</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights & Tips */}
                  {/* <div className="mt-6 bg-[#F4F5F7] p-4 rounded-lg text-sm text-[#5E6C84]">
                    <h5 className="font-medium text-[#172B4D] mb-1">Design Insights</h5>
                    <ul className="space-y-1 list-disc pl-5">
                      <li>Hold & Spin features focus on filling the grid with special symbols</li>
                      <li>Resetting respins extends play time and increases excitement</li>
                      <li>Larger grids offer more potential but are harder to fill</li>
                    </ul>
                  </div> */}
                </div>
              </div>
            )}
          </div>
          
          {/* Jackpots */}
          <div className="bg-gray-50 rounded-md border border-[#DFE1E6] overflow-hidden shadow-sm">
            <div className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-[#172B4D]">Jackpots</h4>
                    <p className="text-sm text-[#5E6C84]">Progressive or fixed jackpot prizes</p>
                  </div>
                </div>
                <div className="flex items-center mr-2 p-1 px-2 border rounded-md bg-white gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isFeatureEnabled('jackpots')}
                      onChange={() => toggleFeatureEnabled('jackpots')}
                      className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
                    />
                    <span className="text-sm text-[#172B4D]">Enable</span>
                  </label>
                </div>
              </div>
            </div>

            {isFeatureEnabled('jackpots') && (
              <div className="px-2 pb-2">
                <div className="pt-2 border-t border-[#DFE1E6]">
                  {/* Jackpot Type */}
                  <div className='flex gap-4'>
                  <div className='border p-2 rounded-md bg-white w-full'>
                    <label className="block text-sm font-medium text-[#172B4D] mb-2">
                      Jackpot Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {['Fixed', 'Progressive'].map((type) => (
                        <button
                          key={type}
                          onClick={() => updateConfig({
                            bonus: {
                              ...config.bonus,
                              jackpots: {
                                ...config.bonus?.jackpots,
                                type: type.toLowerCase()
                              }
                            }
                          })}
                          className={`p-2 rounded-lg border transition-colors ${
                            config.bonus?.jackpots?.type === type.toLowerCase()
                              ? 'bg-red-50 border-red-500'
                              : 'bg-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jackpot Levels */}
                  <div className="border p-2 rounded-md bg-white w-full">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2">
                      Jackpot Levels
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: '2 Levels', levels: ['Minor', 'Major'] },
                        { label: '4 Levels', levels: ['Mini', 'Minor', 'Major', 'Grand'] }
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => updateConfig({
                            bonus: {
                              ...config.bonus,
                              jackpots: {
                                ...config.bonus?.jackpots,
                                levels: option.levels
                              }
                            }
                          })}
                          className={`p-2 rounded-lg border transition-colors ${
                            JSON.stringify(config.bonus?.jackpots?.levels) === JSON.stringify(option.levels)
                              ? 'bg-red-50 border-red-500'
                              : 'bg-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>

                  {/* Trigger Mechanism */}
                  <div className="mt-2 border rounded-md bg-white p-2">
                    <label className="block text-sm font-medium text-[#172B4D] mb-2">
                      Trigger Mechanism
                    </label>
                    <select
                      value={config.bonus?.jackpots?.trigger || 'random'}
                      onChange={(e) => updateConfig({
                        bonus: {
                          ...config.bonus,
                          jackpots: {
                            ...config.bonus?.jackpots,
                            trigger: e.target.value
                          }
                        }
                      })}
                      className="w-full bg-white border border-[#DFE1E6] rounded-lg px-4 py-2 text-[#172B4D]"
                    >
                      <option value="random">Random (Mystery)</option>
                      <option value="symbol">Dedicated Symbols</option>
                      <option value="bonus">Bonus Feature</option>
                    </select>
                  </div>

                  {/* Max Jackpot Values */}
                  {config.bonus?.jackpots?.type === 'fixed' && (
                    <div className="mt-2 border p-2 rounded-md bg-white space-y-1">
                      <label className="block text-sm font-medium text-[#172B4D] mb-2">
                        Jackpot Values (x Bet)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(config.bonus?.jackpots?.levels || ['Minor', 'Major']).map((level) => (
                          <div key={level} className="flex items-center border p-1 bg-gray-50 rounded-md gap-2">
                            <label className="w-20 text-[#172B4D]">{level}:</label>
                            <input
                              type="number"
                              min="10"
                              max="100000"
                              value={level === 'Mini' ? 20 : level === 'Minor' ? 100 : level === 'Major' ? 1000 : 10000}
                              className="w-full bg-white border border-[#DFE1E6] rounded-lg px-3 py-1 text-[#172B4D]"
                            />
                            {/* <span className="text-[#5E6C84]">x</span> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Math Model Impact */}
      <div className="bg-white rounded-lg p-0  border border-[#DFE1E6] shadow-sm">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors mb-"
            >
              <div className="flex flex-col items-start">
                <h3 className="text-lg font-semibold text-gray-900">Math Model Impact</h3>
            <p className="text-sm text-[#5E6C84] mt-1">Feature contribution to overall game math</p>

              </div>
              <button className="p-2 text-[#5E6C84] hover:text-[#172B4D] transition-colors">
          </button>
            </div>

        <div className="grid grid-cols-3 p-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84]">Feature RTP</div>
            <div className="text-2xl font-bold text-[#172B4D]">{mathModel.featureRTP.toFixed(1)}%</div>
            <div className="text-xs text-[#5E6C84] mt-1">of total {config.mathModel?.rtp || 96}% RTP</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84]">Hit Frequency</div>
            <div className="text-2xl font-bold text-[#172B4D]">1:{Math.round(1/mathModel.hitFrequency)}</div>
            <div className="text-xs text-[#5E6C84] mt-1">spins per feature</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-[#5E6C84]">Win Potential</div>
            <div className="text-2xl font-bold text-[#172B4D]">{mathModel.maxWin.toLocaleString()}x</div>
            <div className="text-xs text-[#5E6C84] mt-1">maximum feature win</div>
          </div>
        </div>

        {/* Feature Warnings */}
        {expandedFeatures.length > 3 && (
          <div className="mt-6 p-4 bg-[#FFFAE6] border border-[#FF991F] rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF8B00] mt-0.5" />
            <div>
              <h5 className="font-medium text-[#172B4D]">Feature Complexity Warning</h5>
              <p className="text-sm text-[#5E6C84] mt-1">
                Having more than 3 active bonus features may increase game complexity and affect player experience.
                Consider focusing on fewer, more impactful features.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Spacer div to maintain consistent spacing */}
      <div className="mt-10 bg-gray-50 h-2"></div>
    </div>
  );
};

export default BonusFeatures;