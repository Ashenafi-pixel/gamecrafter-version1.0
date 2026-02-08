import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, Filter, Target, Shuffle, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Button } from '../../../../ui/UIButton';
import { Input } from '../../../../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/Select';
import type { ReelStrip, ReelSymbol, Step12Configuration } from '../types/step12';

interface ReelStripEditorProps {
  reelStrips: ReelStrip[];
  reelSymbols: ReelSymbol[];
  step12Config: Step12Configuration;
  reelView: 'frequency' | 'sequence';
  sortBy: 'position' | 'symbol' | 'frequency' | 'value';
  filterSymbol: string;
  editingPosition: {reel: number, position: number} | null;
  draggedSymbol: {reelIndex: number, position: number} | null;
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  setReelView: (view: 'frequency' | 'sequence') => void;
  setSortBy: (sort: 'position' | 'symbol' | 'frequency' | 'value') => void;
  setFilterSymbol: (symbol: string) => void;
  setEditingPosition: (pos: {reel: number, position: number} | null) => void;
  setDraggedSymbol: (symbol: {reelIndex: number, position: number} | null) => void;
  updateSymbolCount: (reelIndex: number, symbolId: string, newCount: number) => void;
  autoBalanceReelStrips: () => void;
  calculateReelMetrics: (reelIndex: number) => { totalPositions: number; symbolCounts: Record<string, number>; hitRate: number; volatilityFactor: number } | null;
  updateSymbolAtPosition: (reelIndex: number, position: number, newSymbolId: string) => void;
  insertSymbolAtPosition: (reelIndex: number, position: number, symbolId?: string) => void;
  removeSymbolAtPosition: (reelIndex: number, position: number) => void;
  moveSymbol: (reelIndex: number, fromPosition: number, toPosition: number) => void;
  getSymbolDisplayName: (symbolId: string) => string;
  getFilteredAndSortedPositions: (reel: ReelStrip) => Array<{position: number; symbolId: string; symbol: ReelSymbol | undefined; displayName: string}>;
  setReelStrips: (strips: ReelStrip[] | ((prev: ReelStrip[]) => ReelStrip[])) => void;
  allowFreeSpinRetriggers?: boolean;
  isFeatureEnabled?: (feature: string) => boolean;
}

export function ReelStripEditor({
  reelStrips,
  reelSymbols,
  step12Config,
  reelView,
  sortBy,
  filterSymbol,
  editingPosition,
  draggedSymbol,
  expandedSections,
  toggleSection,
  setReelView,
  setSortBy,
  setFilterSymbol,
  setEditingPosition,
  setDraggedSymbol,
  updateSymbolCount,
  autoBalanceReelStrips,
  calculateReelMetrics,
  updateSymbolAtPosition,
  insertSymbolAtPosition,
  removeSymbolAtPosition,
  moveSymbol,
  getFilteredAndSortedPositions,
  setReelStrips,
  allowFreeSpinRetriggers,
  isFeatureEnabled
}: ReelStripEditorProps) {
  const [symbolMode, setSymbolMode] = useState<'base' | 'freespin'>('base');
  const allowRetriggers = allowFreeSpinRetriggers ?? true;
  
  // Check if Free Spin is enabled
  const freeSpinEnabled = isFeatureEnabled?.('freeSpins') || false;
  
  // Create free spin symbol variations with enhanced visuals
  const freeSpinSymbols = reelSymbols
    .filter(symbol => allowRetriggers || symbol.type !== 'scatter')
    .map(symbol => ({
      ...symbol,
      id: `${symbol.id}_fs`,
      name: symbol.name,
      icon: symbol.icon,
      rarity: symbol.rarity === 'common' ? 'uncommon' : 
              symbol.rarity === 'uncommon' ? 'rare' : 
              symbol.rarity === 'rare' ? 'epic' : 'epic'
    }));
  
  // Get current symbol list based on mode
  const currentSymbols = symbolMode === 'freespin' ? freeSpinSymbols : reelSymbols;
  
  const handleSymbolModeChange = (mode: 'base' | 'freespin') => {
    setSymbolMode(mode);
    setFilterSymbol('all');
    setEditingPosition(null);
    
    // Generate new reel strips for the selected mode
    const symbolsToUse = mode === 'freespin' ? freeSpinSymbols : reelSymbols;
    const newReelStrips = Array.from({ length: step12Config.grid.width }, (_, reelIndex) => {
      const symbols: string[] = [];
      
      symbolsToUse.forEach(symbol => {
        const count = symbol.rarity === 'epic' ? 1 : 
                     symbol.rarity === 'rare' ? 2 : 
                     symbol.rarity === 'uncommon' ? 4 : 8;
        for (let i = 0; i < count; i++) {
          symbols.push(symbol.id);
        }
      });
      
      while (symbols.length < 32) {
        const randomSymbol = symbolsToUse[Math.floor(Math.random() * symbolsToUse.length)];
        symbols.push(randomSymbol.id);
      }
      
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }
      
      return {
        reelIndex,
        symbols: symbols.slice(0, 32),
        length: 32
      };
    });
    
    setReelStrips(newReelStrips);
  };
  const createReelStripsFromRealSymbols = (grid: any): ReelStrip[] => {
    if (reelSymbols.length === 0) {
      // Fallback to mock data if no real symbols available
      return Array.from({ length: grid.width }, (_, reelIndex) => ({
        reelIndex,
        symbols: Array.from({ length: 32 }, () => {
          const rand = Math.random();
          if (rand < 0.03) return 'wild';
          if (rand < 0.08) return 'scatter';
          if (rand < 0.15) return 'pharaoh';
          if (rand < 0.23) return 'cleopatra';
          if (rand < 0.35) return 'anubis';
          if (rand < 0.48) return 'eye';
          if (rand < 0.62) return 'ankh';
          if (rand < 0.72) return 'ace';
          if (rand < 0.82) return 'king';
          if (rand < 0.91) return 'queen';
          return 'jack';
        }),
        length: 32
      }));
    }

    // Create reel strips using real symbol IDs
    const reelLength = 32;
    const reelCount = grid.width;
    
    return Array.from({ length: reelCount }, (_, reelIndex) => {
      const symbols: string[] = [];
      
      // Create weighted distribution based on symbol rarity
      reelSymbols.forEach(symbol => {
        let count = 0;
        switch (symbol.rarity) {
          case 'epic':
            count = 1; // Very rare
            break;
          case 'rare':
            count = 2; // Rare
            break;
          case 'uncommon':
            count = 4; // Uncommon
            break;
          case 'common':
            count = 8; // Common
            break;
          default:
            count = 4;
        }
        
        // Add symbols to reel
        for (let i = 0; i < count; i++) {
          symbols.push(symbol.id);
        }
      });
      
      // Fill remaining positions with random symbols
      while (symbols.length < reelLength) {
        const randomSymbol = reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
        symbols.push(randomSymbol.id);
      }
      
      // Shuffle the symbols
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }
      
      return {
        reelIndex,
        symbols: symbols.slice(0, reelLength),
        length: reelLength
      };
    });
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('reelEditor')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Professional Reel Strip Editor
          </CardTitle>
          {expandedSections.has('reelEditor') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        <CardDescription className="text-xs text-gray-500">
          Visual reel editor with real-time math impact analysis
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('reelEditor') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t pt-2'
          >
            <CardContent>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 uw:h-8 uw:w-8 text-indigo-600" />
                    <span className="text-sm font-medium uw:text-3xl">View Mode:</span>
                    <div className="flex bg-gray-100 rounded p-0.5">
                      <button
                        onClick={() => setReelView('frequency')}
                        className={[
                          "px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                          reelView === 'frequency' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800 "
                        ].filter(Boolean).join(" ")}
                      >
                        Frequency
                      </button>
                      <button
                        onClick={() => setReelView('sequence')}
                        className={[
                          "px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                          reelView === 'sequence' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                        ].filter(Boolean).join(" ")}
                      >
                        Sequence
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 uw:h-8 uw:w-8 text-gray-600" />
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'position' | 'symbol' | 'frequency' | 'value')}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="position">Position</SelectItem>
                        <SelectItem value="symbol">Symbol</SelectItem>
                        <SelectItem value="frequency">Frequency</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm uw:text-2xl">Filter:</span>
                    <Select value={filterSymbol} onValueChange={setFilterSymbol}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {currentSymbols.map(symbol => (
                          <SelectItem key={symbol.id} value={symbol.id}>
                            {symbol.icon} {symbol.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {freeSpinEnabled && (
                    <div className="flex bg-gray-100 rounded p-0.5">
                      <button
                        onClick={() => handleSymbolModeChange('base')}
                        className={[
                          "px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                          symbolMode === 'base' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                        ].join(" ")}
                      >
                        Base Reel
                      </button>
                      <button
                        onClick={() => handleSymbolModeChange('freespin')}
                        disabled={!freeSpinEnabled}
                        className={[
                          "px-2 py-1 text-xs uw:text-2xl rounded transition-all",
                          symbolMode === 'freespin' ? "bg-white text-gray-900 shadow-sm" : 
                          freeSpinEnabled ? "text-gray-600 hover:text-gray-800" : "text-gray-400 cursor-not-allowed"
                        ].join(" ")}
                      >
                        Free Spin
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 uw:gap-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={autoBalanceReelStrips}
                    className="text-xs uw:text-2xl uw:py-6"
                  >
                    <Target className="h-3 w-3 uw:h-8 uw:w-8 mr-1" />
                    Auto Balance
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReelStrips(prev => prev.map(reel => ({
                        ...reel,
                        symbols: [...reel.symbols].sort(() => Math.random() - 0.5)
                      })));
                    }}
                    className="text-xs uw:text-2xl uw:py-6 "
                  >
                    <Shuffle className="h-3 w-3 uw:h-7 uw:w-7 mr-1" />
                    Shuffle Reels
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReelStrips(createReelStripsFromRealSymbols(step12Config.grid))}
                    className="text-xs uw:text-2xl uw:py-6"
                  >
                    <RotateCcw className="h-3 w-3 uw:h-7 uw:w-7 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className={`grid gap-4 ${reelStrips.length <= 3 ? 'grid-cols-3' : reelStrips.length <= 5 ? 'grid-cols-5' : reelStrips.length <= 7 ? 'grid-cols-7' : 'grid-cols-9'}`}>
                {reelStrips.map((reel, reelIndex) => {
                  const metrics = calculateReelMetrics(reelIndex);
                  return (
                    <div key={reelIndex} className="flex flex-col">
                      <div className="text-center mb-3 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
                        <h5 className="font-semibold text-sm uw:text-3xl text-gray-800">Reel {reelIndex + 1}</h5>
                        {metrics && (
                          <div className="text-xs uw:text-2xl text-gray-600 mt-1">
                            Hit: {metrics.hitRate.toFixed(1)}% • {reel.symbols.length} symbols
                          </div>
                        )}
                      </div>

                      {reelView === 'frequency' ? (
                        <div className="relative">
                          <div className="h-96 overflow-y-auto border-2 border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-white">
                            <div className="p-2 space-y-1">
                              {/* Total symbol count display */}
                              <div className="mb-2 p-2 bg-blue-50 rounded text-xs uw:text-2xl text-center">
                                <span className="font-semibold uw:text-2xl text-blue-800">
                                  Total: {Object.values(metrics?.symbolCounts || {}).reduce((sum, count) => sum + count, 0)} / {reel.length} symbols
                                </span>
                              </div>
                              {getFilteredAndSortedPositions(reel).map(({ position, symbolId, symbol }) => {
                                const isBeingDragged = draggedSymbol?.reelIndex === reelIndex && draggedSymbol?.position === position;
                                const symbolColor = symbol?.rarity === 'epic' ? 'bg-purple-100 border-purple-300' :
                                                  symbol?.rarity === 'rare' ? 'bg-blue-100 border-blue-300' :
                                                  symbol?.rarity === 'common' ? 'bg-green-100 border-green-300' :
                                                  'bg-gray-100 border-gray-300';
                                const symbolCount = metrics?.symbolCounts[symbolId] || 0;
                                const percentage = ((symbolCount / reel.length) * 100).toFixed(1);
                                const displayName = symbol?.name || symbolId || 'Unknown';
                                const displayIcon = symbol?.icon || '?';

                                return (
                                  <div key={position} className="group relative flex items-center">
                                    <div className="w-6 text-xs uw:text-2xl text-gray-500 font-mono text-right mr-2">
                                      {position + 1}
                                    </div>
                                    <div
                                      className={[
                                        "flex-1 relative h-12 border-2 rounded-lg flex items-center justify-between px-3 cursor-pointer transition-all hover:shadow-md",
                                        symbolColor,
                                        editingPosition?.reel === reelIndex && editingPosition?.position === position
                                          ? "border-indigo-500 bg-indigo-100 shadow-lg"
                                          : "hover:border-indigo-300",
                                        isBeingDragged ? "opacity-50 scale-95" : ""
                                      ].filter(Boolean).join(" ")}
                                      draggable
                                      onDragStart={() => setDraggedSymbol({ reelIndex, position })}
                                      onDragEnd={() => setDraggedSymbol(null)}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={() => {
                                        if (draggedSymbol && draggedSymbol.reelIndex === reelIndex) {
                                          moveSymbol(reelIndex, draggedSymbol.position, position);
                                        }
                                        setDraggedSymbol(null);
                                      }}
                                      onClick={() => setEditingPosition({ reel: reelIndex, position })}
                                      title={`Position ${position + 1}: ${displayName} (Count: ${symbolCount}, ${percentage}%)`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {displayIcon && (displayIcon.startsWith('data:image/') || displayIcon.startsWith('http') || displayIcon.includes('.')) ? (
                                          <img 
                                            src={displayIcon} 
                                            alt={displayName} 
                                            className="w-8 h-8 uw:h-10 uw:w-10 object-contain"
                                          />
                                        ) : (
                                          <span className="text-xl">{displayIcon}</span>
                                        )}
                                        <div className="flex flex-col">
                                          <span className="text-sm uw:text-2xl font-medium text-gray-700 truncate">
                                            {displayName}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 uw:gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            insertSymbolAtPosition(reelIndex, position);
                                          }}
                                          className="w-6 h-6 uw:h-8 uw:w-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs uw:text-2xl  font-bold transition-colors "
                                          title="Insert symbol above"
                                        >
                                          +
                                        </button>
                                        {reel.symbols.length > 16 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeSymbolAtPosition(reelIndex, position);
                                            }}
                                            className="w-6 h-6 uw:h-8 uw:w-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs uw:text-2xl font-bold transition-colors"
                                            title="Remove symbol"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="group relative flex items-center mt-2">
                                <div className="w-6 text-xs uw:text-2xl text-gray-500 font-mono text-right mr-2">
                                  {reel.symbols.length + 1}
                                </div>
                                <button
                                  onClick={() => insertSymbolAtPosition(reelIndex, reel.symbols.length)}
                                  className="flex-1 h-10 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:text-green-600 transition-all"
                                  title="Add symbol at end"
                                >
                                  <span className="text-lg uw:text-3xl">+</span>
                                  <span className="text-sm uw:text-2xl">Add Symbol</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          {editingPosition?.reel === reelIndex && (
                            <div className="absolute left-full top-0 z-20 w-full ml-2 p-3 bg-white border-2 border-indigo-200 rounded-lg shadow-xl">
                              <div className="text-xs text-gray-600 mb-2 font-medium uw:text-3xl">Select Symbol:</div>
                              <div className="grid grid-cols-4 gap-2">
                                {currentSymbols.map(sym => (
                                  <button
                                    key={sym.id}
                                    onClick={() => updateSymbolAtPosition(reelIndex, editingPosition.position, sym.id)}
                                    className="w-10 h-10 uw:h-20 uw:w-20 border-2 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center transition-all"
                                    title={sym.name}
                                  >
                                    {sym.icon && (sym.icon.startsWith('data:image/') || sym.icon.startsWith('http') || sym.icon.includes('.')) ? (
                                      <img 
                                        src={sym.icon} 
                                        alt={sym.name} 
                                        className="w-8 h-8 uw:h-16 uw:w-16 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg uw:text-2xl">{sym.icon}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setEditingPosition(null)}
                                className="mt-2 w-full text-xs uw:text-2xl text-gray-500 hover:text-gray-700 py-1"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="h-96 overflow-y-auto border-2 border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-white">
                            <div className="p-2 space-y-1">
                              {getFilteredAndSortedPositions(reel).map(({ position, symbolId, symbol }) => {
                                const isBeingDragged = draggedSymbol?.reelIndex === reelIndex && draggedSymbol?.position === position;
                                const symbolColor = symbol?.rarity === 'epic' ? 'bg-purple-100 border-purple-300' :
                                                  symbol?.rarity === 'rare' ? 'bg-blue-100 border-blue-300' :
                                                  symbol?.rarity === 'common' ? 'bg-green-100 border-green-300' :
                                                  'bg-gray-100 border-gray-300';
                                const displayName = symbol?.name || symbolId || 'Unknown';
                                const displayIcon = symbol?.icon || '?';

                                return (
                                  <div key={position} className="group relative flex items-center">
                                    <div className="w-6 text-xs uw:text-2xl text-gray-500 font-mono text-right mr-2">
                                      {position + 1}
                                    </div>
                                    <div
                                      className={[
                                        "flex-1 relative h-12 border-2 rounded-lg flex items-center justify-between px-3 cursor-pointer transition-all hover:shadow-md",
                                        symbolColor,
                                        editingPosition?.reel === reelIndex && editingPosition?.position === position
                                          ? "border-indigo-500 bg-indigo-100 shadow-lg"
                                          : "hover:border-indigo-300",
                                        isBeingDragged ? "opacity-50 scale-95" : ""
                                      ].filter(Boolean).join(" ")}
                                      draggable
                                      onDragStart={() => setDraggedSymbol({ reelIndex, position })}
                                      onDragEnd={() => setDraggedSymbol(null)}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={() => {
                                        if (draggedSymbol && draggedSymbol.reelIndex === reelIndex) {
                                          moveSymbol(reelIndex, draggedSymbol.position, position);
                                        }
                                        setDraggedSymbol(null);
                                      }}
                                      onClick={() => setEditingPosition({ reel: reelIndex, position })}
                                      title={`Position ${position + 1}: ${displayName} (Drag to reorder)`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {displayIcon && (displayIcon.startsWith('data:image/') || displayIcon.startsWith('http') || displayIcon.includes('.')) ? (
                                          <img 
                                            src={displayIcon} 
                                            alt={displayName} 
                                            className="w-8 h-8 uw:h-10 uw:w-10 object-contain"
                                          />
                                        ) : (
                                          <span className="text-xl uw:text-2xl">{displayIcon}</span>
                                        )}
                                        <span className="text-sm uw:text-2xl font-medium text-gray-700 truncate">
                                          {displayName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            insertSymbolAtPosition(reelIndex, position);
                                          }}
                                          className="w-6 h-6 uw:h-8 uw:w-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs uw:text-2xl font-bold transition-colors"
                                          title="Insert symbol above"
                                        >
                                          +
                                        </button>
                                        {reel.symbols.length > 16 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeSymbolAtPosition(reelIndex, position);
                                            }}
                                            className="w-6 h-6 uw:h-8 uw:w-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs uw:text-2xl font-bold transition-colors"
                                            title="Remove symbol"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="group relative flex items-center mt-2">
                                <div className="w-6 text-xs uw:text-2xl text-gray-500 font-mono text-right mr-2">
                                  {reel.symbols.length + 1}
                                </div>
                                <button
                                  onClick={() => insertSymbolAtPosition(reelIndex, reel.symbols.length)}
                                  className="flex-1 h-10 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:text-green-600 transition-all"
                                  title="Add symbol at end"
                                >
                                  <span className="text-lg uw:text-4xl">+</span>
                                  <span className="text-sm uw:text-2xl">Add Symbol</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          {editingPosition?.reel === reelIndex && (
                            <div className="absolute left-full top-0 z-20 w-full ml-2 p-3 bg-white border-2 border-indigo-200 rounded-lg shadow-xl">
                              <div className="text-xs uw:text-3xl text-gray-600 mb-2 font-medium">Select Symbol:</div>
                              <div className="grid grid-cols-4 gap-2">
                                {currentSymbols.map(sym => (
                                  <button
                                    key={sym.id}
                                    onClick={() => updateSymbolAtPosition(reelIndex, editingPosition.position, sym.id)}
                                    className="w-10 h-10 uw:h-20 uw:w-20 border-2 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center transition-all"
                                    title={sym.name}
                                  >
                                    {sym.icon && (sym.icon.startsWith('data:image/') || sym.icon.startsWith('http') || sym.icon.includes('.')) ? (
                                      <img 
                                        src={sym.icon} 
                                        alt={sym.name} 
                                        className="w-8 h-8 uw:h-16 uw:w-16 object-contain"
                                      />
                                    ) : (
                                      <span className="text-lg uw:text-2xl">{sym.icon}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setEditingPosition(null)}
                                className="mt-2 w-full text-xs uw:text-2xl text-gray-500 hover:text-gray-700 py-1"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium uw:text-3xl text-indigo-800 mb-3">Reel Strip Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-indigo-600 uw:text-2xl">Total Positions:</span>
                    <div className="font-bold text-lg uw:text-2xl">{reelStrips.reduce((sum, reel) => sum + reel.length, 0)}</div>
                    <div className="text-xs uw:text-2xl text-gray-500">{reelStrips.length} reels × {reelStrips[0]?.length || 0} positions</div>
                  </div>
                  <div>
                    <span className="text-indigo-600 uw:text-3xl">Avg Hit Rate:</span>
                    <div className="font-bold text-lg uw:text-2xl">
                      {(reelStrips.map((_, i) => calculateReelMetrics(i)?.hitRate || 0)
                        .reduce((sum, rate) => sum + rate, 0) / reelStrips.length).toFixed(1)}%
                    </div>
                    <div className="text-xs uw:text-2xl text-gray-500">Across all reels</div>
                  </div>
                  <div>
                    <span className="text-indigo-600 uw:text-3xl">Volatility Impact:</span>
                    <div className="font-bold text-lg uw:text-2xl">
                      {(reelStrips.map((_, i) => calculateReelMetrics(i)?.volatilityFactor || 0)
                        .reduce((sum, factor) => sum + factor, 0) / reelStrips.length).toFixed(1)}
                    </div>
                    <div className="text-xs uw:text-2xl text-gray-500">Deviation from baseline</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
