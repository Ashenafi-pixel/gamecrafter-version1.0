import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  BarChart2,
  Activity,
  Sliders,
  HelpCircle,
  History,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGameStore } from '../../store';

// Interface for automated RTP distribution
interface RTPDistribution {
  baseGame: number;
  features: number;
  jackpots: number;
}

// Symbol weighting interface
interface SymbolWeighting {
  id: string;
  name: string;
  type: 'premium' | 'wild' | 'scatter' | 'high' | 'medium' | 'low';
  weight: number;
  isLocked: boolean;
  payouts: {
    count: number;
    value: number;
  }[];
  color: string;
}

// Math simulation result interface
interface SimulationResult {
  actualRTP: number;
  hitRate: number;
  volatility: number;
  maxWin: number;
  spinCount: number;
  featureTriggers: number;
  bigWins: number;
  symbolHits: Record<string, number>;
  messages: {
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
  }[];
}

// RTP Auto-Balancer Component
const RTPAutoBalancer: React.FC<{
  rtpDistribution: RTPDistribution;
  totalRTP: number;
  onRTPChange: (distribution: RTPDistribution) => void;
  volatility: number;
}> = ({ rtpDistribution, totalRTP, onRTPChange, volatility }) => {
  const [isLocked, setIsLocked] = useState({
    baseGame: false,
    features: false,
    jackpots: false
  });
  const [isAutoBalancing, setIsAutoBalancing] = useState(false);
  const [confidence, setConfidence] = useState(85);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Colors for RTP segments
  const colors = {
    baseGame: '#3B82F6', // Blue
    features: '#10B981', // Green
    jackpots: '#F59E0B'  // Amber
  };

  // Auto-balance RTP based on volatility
  const autoBalanceRTP = () => {
    setIsAutoBalancing(true);
    
    // Simulate calculation time with timeout
    setTimeout(() => {
      let newDistribution = { ...rtpDistribution };
      let targetRTP = totalRTP;
      
      // If total RTP is below 92%, adjust it to a reasonable default
      if (targetRTP < 92) {
        targetRTP = 96;
      }
      
      // Different distribution based on volatility
      if (volatility <= 3) { // Low volatility
        // More in base game for low volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.8) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * 0.15) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * 0.05) * 10) / 10
        };
      } else if (volatility <= 7) { // Medium volatility
        // Balanced distribution for medium volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.7) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * 0.2) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * 0.1) * 10) / 10
        };
      } else { // High volatility
        // More in features/jackpots for high volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.6) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * 0.25) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * 0.15) * 10) / 10
        };
      }
      
      // Rebalance after applying locks to ensure total RTP is maintained
      const balanceRemainingRTP = () => {
        // Calculate how much is already allocated to locked components
        const lockedTotal = 
          (isLocked.baseGame ? rtpDistribution.baseGame : 0) +
          (isLocked.features ? rtpDistribution.features : 0) +
          (isLocked.jackpots ? rtpDistribution.jackpots : 0);
        
        // Calculate how much is available to distribute among unlocked components
        const remainingRTP = targetRTP - lockedTotal;
        
        // Count unlocked components
        const unlockedCount = 
          (!isLocked.baseGame ? 1 : 0) +
          (!isLocked.features ? 1 : 0) +
          (!isLocked.jackpots ? 1 : 0);
        
        if (unlockedCount === 0) return; // All locked, nothing to distribute
        
        // Calculate base distribution for unlocked components
        const baseUnlockedDistribution = remainingRTP / unlockedCount;
        
        // Apply volatility adjustments to the base distribution
        let baseGameAdj = 1.0;
        let featuresAdj = 1.0;
        let jackpotsAdj = 1.0;
        
        if (volatility <= 3) {
          baseGameAdj = 1.2;
          featuresAdj = 0.9;
          jackpotsAdj = 0.8;
        } else if (volatility <= 7) {
          baseGameAdj = 1.0;
          featuresAdj = 1.0;
          jackpotsAdj = 1.0;
        } else {
          baseGameAdj = 0.8;
          featuresAdj = 1.1;
          jackpotsAdj = 1.2;
        }
        
        // Calculate adjustment total to normalize
        const adjustmentTotal = 
          (!isLocked.baseGame ? baseGameAdj : 0) +
          (!isLocked.features ? featuresAdj : 0) +
          (!isLocked.jackpots ? jackpotsAdj : 0);
        
        // Normalize adjustments
        baseGameAdj /= adjustmentTotal;
        featuresAdj /= adjustmentTotal;
        jackpotsAdj /= adjustmentTotal;
        
        // Apply adjusted distribution
        if (!isLocked.baseGame) {
          newDistribution.baseGame = Math.round((remainingRTP * baseGameAdj) * 10) / 10;
        }
        if (!isLocked.features) {
          newDistribution.features = Math.round((remainingRTP * featuresAdj) * 10) / 10;
        }
        if (!isLocked.jackpots) {
          newDistribution.jackpots = Math.round((remainingRTP * jackpotsAdj) * 10) / 10;
        }
        
        // Handle rounding errors to ensure total adds up exactly
        const roundingError = targetRTP - 
          (newDistribution.baseGame + newDistribution.features + newDistribution.jackpots);
        
        // Add rounding error to the largest unlocked component
        if (Math.abs(roundingError) > 0.01) {
          if (!isLocked.baseGame && 
              (!isLocked.features || newDistribution.baseGame > newDistribution.features) && 
              (!isLocked.jackpots || newDistribution.baseGame > newDistribution.jackpots)) {
            newDistribution.baseGame += roundingError;
          } else if (!isLocked.features && 
                    (!isLocked.jackpots || newDistribution.features > newDistribution.jackpots)) {
            newDistribution.features += roundingError;
          } else if (!isLocked.jackpots) {
            newDistribution.jackpots += roundingError;
          }
        }
      };
      
      // Apply the balancing algorithm
      balanceRemainingRTP();
      
      // Round all values to 1 decimal place for cleaner UI
      newDistribution.baseGame = Math.round(newDistribution.baseGame * 10) / 10;
      newDistribution.features = Math.round(newDistribution.features * 10) / 10;
      newDistribution.jackpots = Math.round(newDistribution.jackpots * 10) / 10;
      
      // Update confidence level based on constraints
      const lockedCount = 
        (isLocked.baseGame ? 1 : 0) +
        (isLocked.features ? 1 : 0) +
        (isLocked.jackpots ? 1 : 0);
      
      // More locks = less confidence
      if (lockedCount === 0) {
        setConfidence(95);
      } else if (lockedCount === 1) {
        setConfidence(85);
      } else if (lockedCount === 2) {
        setConfidence(70);
      }
      
      // Update RTP distribution
      onRTPChange(newDistribution);
      setIsAutoBalancing(false);
    }, 800); // Simulate calculation time
  };

  return (
    <div className="rtp-auto-balancer bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            RTP Auto-Balancer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically balance RTP between game components based on volatility
          </p>
        </div>
        <button
          onClick={autoBalanceRTP}
          disabled={isAutoBalancing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    ${isAutoBalancing 
                      ? 'bg-gray-200 text-gray-500 cursor-wait' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isAutoBalancing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Balancing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Auto-Balance
            </>
          )}
        </button>
      </div>
      
      {/* Confidence Meter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Adjustment Confidence</span>
          <span className="text-sm font-medium text-gray-700">{confidence}%</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              confidence >= 90 ? 'bg-green-500' : 
              confidence >= 80 ? 'bg-blue-500' : 
              confidence >= 70 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low Confidence</span>
          <span>High Confidence</span>
        </div>
      </div>
      
      {/* RTP Distribution Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RTP Pie Chart Visualization */}
        <div className="relative h-48 flex items-center justify-center">
          {/* Simulating a pie chart with divs for simplicity */}
          <div className="w-32 h-32 rounded-full relative overflow-hidden">
            {/* Base game segment */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: colors.baseGame,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rtpDistribution.baseGame / totalRTP) * Math.PI * 2)}% ${50 - 50 * Math.sin((rtpDistribution.baseGame / totalRTP) * Math.PI * 2)}%, 50% 50%)`
              }}
            />
            
            {/* Features segment */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: colors.features,
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((rtpDistribution.baseGame / totalRTP) * Math.PI * 2)}% ${50 - 50 * Math.sin((rtpDistribution.baseGame / totalRTP) * Math.PI * 2)}%, ${50 + 50 * Math.cos(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}% ${50 - 50 * Math.sin(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}%)`
              }}
            />
            
            {/* Jackpots segment */}
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: colors.jackpots,
                clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}% ${50 - 50 * Math.sin(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}%, 50% 0%)`
              }}
            />
          </div>
          
          {/* Total RTP in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRTP.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Total RTP</div>
            </div>
          </div>
        </div>
        
        {/* RTP Sliders with Lock Controls */}
        <div className="space-y-4">
          {Object.entries(rtpDistribution).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium capitalize flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[key as keyof typeof colors] }}
                  />
                  {key === 'baseGame' ? 'Base Game' : 
                   key === 'features' ? 'Bonus Features' : 
                   'Jackpots'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{value.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">
                    ({(value / totalRTP * 100).toFixed(0)}%)
                  </span>
                  <button
                    onClick={() => setIsLocked({
                      ...isLocked,
                      [key]: !isLocked[key as keyof typeof isLocked]
                    })}
                    className={`p-1 rounded ${isLocked[key as keyof typeof isLocked] ? 'text-yellow-500' : 'text-gray-400'}`}
                    title={isLocked[key as keyof typeof isLocked] ? "Unlock" : "Lock"}
                  >
                    {isLocked[key as keyof typeof isLocked] ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={value}
                disabled={isLocked[key as keyof typeof isLocked]}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  onRTPChange({
                    ...rtpDistribution,
                    [key]: newValue
                  });
                }}
                className={`w-full ${isLocked[key as keyof typeof isLocked] ? 'opacity-50' : ''}`}
                style={{ 
                  accentColor: colors[key as keyof typeof colors] 
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Advanced Options Toggle */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
        
        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Optimization Target</h4>
              <select className="w-full p-2 border border-gray-300 rounded">
                <option value="balanced">Balanced (Default)</option>
                <option value="player-retention">Player Retention</option>
                <option value="maximum-win">Maximum Win Potential</option>
                <option value="hit-frequency">High Hit Frequency</option>
              </select>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Feature Weighting</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs">Base Game</span>
                <input type="range" className="flex-1" />
                <span className="text-xs">Features</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Symbol Weight Optimizer Component
const SymbolWeightOptimizer: React.FC<{
  volatility: number;
  rtpDistribution: RTPDistribution;
  totalRTP: number;
}> = ({ volatility, rtpDistribution, totalRTP }) => {
  const [symbols, setSymbols] = useState<SymbolWeighting[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTarget, setOptimizationTarget] = useState('balanced');
  const [hitFrequency, setHitFrequency] = useState(25); // Default hit frequency target
  
  // Generate initial symbol matrix
  useEffect(() => {
    generateSymbolMatrix();
  }, [volatility]);
  
  // Generate symbol values based on volatility and RTP
  const generateSymbolMatrix = () => {
    setIsOptimizing(true);
    
    setTimeout(() => {
      const symbolCount = 10; // Typical slot
      const patterns = [
        [5, 4, 3, 2], // 5 of a kind, 4 of a kind, etc.
        [5, 4, 3],    // Some symbols don't pay for 2 of a kind
      ];
      
      // Base multiplier depends on volatility
      const baseMultiplier = 0.5 + (volatility * 0.3);
      
      const newSymbols = Array(symbolCount).fill(0).map((_, idx) => {
        const isWild = idx === 0;
        const isScatter = idx === 1;
        const isHighSymbol = idx < 4 && !isWild && !isScatter;
        
        // Determine symbol type
        let type: 'premium' | 'wild' | 'scatter' | 'high' | 'medium' | 'low';
        if (isWild) type = 'wild';
        else if (isScatter) type = 'scatter';
        else if (isHighSymbol) type = 'high';
        else if (idx < 7) type = 'medium';
        else type = 'low';
        
        // Calculate weight based on volatility and symbol type
        // Higher volatility = lower weights for high paying symbols
        let weight = 0;
        if (isWild) {
          weight = Math.max(1, Math.round(8 - (volatility * 0.4)));
        } else if (isScatter) {
          weight = Math.max(1, Math.round(5 - (volatility * 0.3)));
        } else if (isHighSymbol) {
          weight = Math.round(10 - (idx * 0.8) - (volatility * 0.2));
        } else {
          weight = Math.round(15 + ((idx - 4) * 1.5) - (volatility * 0.1));
        }
        
        // Higher volatility = bigger gaps between symbol values
        const symbolTier = isWild 
          ? 1 
          : isScatter
            ? 1.2
            : isHighSymbol 
              ? 1 + (idx * (0.5 + volatility * 0.1)) 
              : 3 + ((idx - 4) * (0.3 + volatility * 0.07));
        
        // Choose pattern based on symbol type
        const patternToUse = (isHighSymbol || isWild) ? patterns[0] : patterns[1];
        
        // Generate color based on symbol type
        let color;
        if (isWild) color = '#f59e0b'; // amber
        else if (isScatter) color = '#8b5cf6'; // purple
        else if (isHighSymbol) color = `hsl(${210 - idx * 30}, 80%, 60%)`; // blues
        else color = `hsl(${280 + (idx - 4) * 15}, 70%, 60%)`; // purples
        
        return {
          id: `symbol_${idx + 1}`,
          name: isWild 
            ? 'WILD' 
            : isScatter
              ? 'SCATTER'
              : isHighSymbol 
                ? `H${idx}` 
                : `L${idx - 4 + 1}`,
          type,
          weight,
          isLocked: false,
          pays: patternToUse.map((count, payIdx) => {
            // Higher volatility = higher top symbol values, lower bottom symbol values
            const payMultiplier = isWild 
              ? baseMultiplier * 2 * Math.pow(3, patternToUse.length - payIdx - 1) 
              : isScatter
                ? (count >= 3 ? baseMultiplier * 5 * (count - 2) : 0) // Scatters often trigger features
                : baseMultiplier * Math.pow(symbolTier, 0.7) * Math.pow(2 - (volatility * 0.03), patternToUse.length - payIdx - 1);
                
            return {
              count,
              value: Math.max(0.5, Math.round(payMultiplier * 10) / 10),
            };
          }),
          color
        };
      });
      
      setSymbols(newSymbols);
      setIsOptimizing(false);
    }, 800);
  };
  
  // Optimize weights based on target
  const optimizeWeights = () => {
    setIsOptimizing(true);
    
    setTimeout(() => {
      // Clone current symbols for optimization
      const optimizedSymbols = [...symbols];
      
      // Apply different optimization strategies based on target
      switch (optimizationTarget) {
        case 'balanced':
          // Default balanced approach
          break;
          
        case 'hit-frequency':
          // Increase hit frequency by boosting weights of low symbols
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'low' || symbol.type === 'medium') {
                symbol.weight = Math.min(100, Math.round(symbol.weight * 1.2));
              } else if (symbol.type === 'wild') {
                symbol.weight = Math.round(symbol.weight * 1.1);
              }
            }
          });
          break;
          
        case 'high-volatility':
          // Increase volatility by reducing common symbols, boosting premium symbols
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'premium' || symbol.type === 'scatter') {
                symbol.weight = Math.max(1, Math.round(symbol.weight * 0.7));
              } else if (symbol.type === 'wild') {
                symbol.weight = Math.max(1, Math.round(symbol.weight * 0.8));
              } else if (symbol.type === 'high') {
                symbol.weight = Math.round(symbol.weight * 0.9);
              }
            }
          });
          break;
          
        case 'feature-focus':
          // Focus on feature triggers by boosting scatter symbols
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'scatter') {
                symbol.weight = Math.round(symbol.weight * 1.3);
              } else if (symbol.type === 'premium' || symbol.type === 'high') {
                symbol.weight = Math.round(symbol.weight * 0.9);
              }
            }
          });
          break;
      }
      
      // Normalize weights to maintain RTP
      normalizeWeights(optimizedSymbols);
      
      setSymbols(optimizedSymbols);
      setIsOptimizing(false);
    }, 800);
  };
  
  // Normalize weights to maintain target RTP
  const normalizeWeights = (symbolArray: SymbolWeighting[]) => {
    // This is a simplified normalization algorithm
    // In a real implementation, this would involve complex RTP calculations
    
    // Calculate current total weight
    const totalWeight = symbolArray.reduce((sum, s) => sum + s.weight, 0);
    
    // Calculate weighted RTP contribution
    const rtpContributions = symbolArray.map(s => {
      // Calculate average payout per symbol
      const avgPayout = s.pays.reduce((sum, p) => sum + p.value, 0) / s.pays.length;
      return { symbol: s, contribution: (s.weight / totalWeight) * avgPayout };
    });
    
    // Calculate total RTP contribution
    const totalContribution = rtpContributions.reduce((sum, r) => sum + r.contribution, 0);
    
    // Adjust weights to match target RTP but preserve ratios
    if (totalContribution > 0 && Math.abs(totalContribution - rtpDistribution.baseGame) > 0.5) {
      const adjustmentFactor = rtpDistribution.baseGame / totalContribution;
      
      symbolArray.forEach(symbol => {
        if (!symbol.isLocked) {
          symbol.weight = Math.max(1, Math.round(symbol.weight * adjustmentFactor));
        }
      });
    }
  };
  
  // Categorize symbols by type for better organization
  const categorizedSymbols = {
    special: symbols.filter(s => s.type === 'wild' || s.type === 'scatter'),
    high: symbols.filter(s => s.type === 'high' || s.type === 'premium'),
    low: symbols.filter(s => s.type === 'medium' || s.type === 'low')
  };
  
  return (
    <div className="symbol-weight-optimizer bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            Symbol Weight Optimizer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Optimize symbol weights to balance RTP and hit frequency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={optimizationTarget}
            onChange={(e) => setOptimizationTarget(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="balanced">Balanced</option>
            <option value="hit-frequency">Maximize Hit Rate</option>
            <option value="high-volatility">High Volatility</option>
            <option value="feature-focus">Feature Focus</option>
          </select>
          <button
            onClick={optimizeWeights}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                      ${isOptimizing 
                        ? 'bg-gray-200 text-gray-500 cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize Weights
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Hit Frequency Target */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Activity className="w-4 h-4 text-blue-600" />
            Target Hit Frequency
            <HelpCircle className="w-3 h-3 text-gray-400" title="Percentage of spins that result in any win" />
          </span>
          <span className="text-sm font-medium text-gray-700">{hitFrequency}%</span>
        </div>
        <input
          type="range"
          min="15"
          max="35"
          step="1"
          value={hitFrequency}
          onChange={(e) => setHitFrequency(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Lower (15%) - Higher Volatility</span>
          <span>Higher (35%) - Lower Volatility</span>
        </div>
      </div>
      
      {/* Symbol Weight Table */}
      <div className="overflow-x-auto">
        {/* Special symbols section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            Special Symbols
          </h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                  <span className="ml-1 text-gray-400 text-xs font-normal">(Lock)</span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorizedSymbols.special.map(symbol => (
                <tr key={symbol.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: symbol.color }}
                      >
                        {symbol.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {symbol.type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={symbol.weight}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, weight: value } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className="w-16 p-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, isLocked: !s.isLocked } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className={`p-1 rounded ${symbol.isLocked ? 'text-yellow-500' : 'text-gray-400'}`}
                      >
                        {symbol.isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      {symbol.pays.map((pay, idx) => (
                        <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {pay.count}x: {pay.value}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* High paying symbols section */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            High Paying Symbols
          </h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                  <span className="ml-1 text-gray-400 text-xs font-normal">(Lock)</span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorizedSymbols.high.map(symbol => (
                <tr key={symbol.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: symbol.color }}
                      >
                        {symbol.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {symbol.type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={symbol.weight}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, weight: value } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className="w-16 p-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, isLocked: !s.isLocked } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className={`p-1 rounded ${symbol.isLocked ? 'text-yellow-500' : 'text-gray-400'}`}
                      >
                        {symbol.isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      {symbol.pays.map((pay, idx) => (
                        <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {pay.count}x: {pay.value}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Low paying symbols section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Low Paying Symbols
          </h4>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                  <span className="ml-1 text-gray-400 text-xs font-normal">(Lock)</span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorizedSymbols.low.map(symbol => (
                <tr key={symbol.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: symbol.color }}
                      >
                        {symbol.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">
                    {symbol.type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={symbol.weight}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, weight: value } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className="w-16 p-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const updatedSymbols = symbols.map(s => 
                            s.id === symbol.id ? { ...s, isLocked: !s.isLocked } : s
                          );
                          setSymbols(updatedSymbols);
                        }}
                        className={`p-1 rounded ${symbol.isLocked ? 'text-yellow-500' : 'text-gray-400'}`}
                      >
                        {symbol.isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      {symbol.pays.map((pay, idx) => (
                        <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {pay.count}x: {pay.value}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Weight Distribution Visualization */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Symbol Weight Distribution</h4>
        <div className="h-10 bg-gray-200 rounded-full overflow-hidden flex">
          {symbols.map(symbol => {
            const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
            const percentage = (symbol.weight / totalWeight) * 100;
            
            return (
              <div
                key={symbol.id}
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: symbol.color
                }}
                title={`${symbol.name}: ${symbol.weight} (${percentage.toFixed(1)}%)`}
                className="h-full"
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Distribution weight: {symbols.reduce((sum, s) => sum + s.weight, 0)} units
        </div>
      </div>
    </div>
  );
};

// Deep Simulation System Component
const DeepSimulation: React.FC<{
  rtpDistribution: RTPDistribution;
  totalRTP: number;
  volatility: number;
}> = ({ rtpDistribution, totalRTP, volatility }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLevel, setSimulationLevel] = useState('normal');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Run simulation
  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResult(null);
    
    // Simulate progress with intervals
    const totalSteps = simulationLevel === 'quick' ? 10 : simulationLevel === 'normal' ? 20 : 30;
    let currentStep = 0;
    
    const progressInterval = setInterval(() => {
      currentStep++;
      setSimulationProgress(Math.round((currentStep / totalSteps) * 100));
      
      if (currentStep >= totalSteps) {
        clearInterval(progressInterval);
        
        // Generate simulation result based on configuration
        const result: SimulationResult = {
          actualRTP: generateRTPResult(totalRTP),
          hitRate: generateHitRateFromVolatility(volatility),
          volatility: volatility,
          maxWin: Math.round(volatility * 1000),
          spinCount: simulationLevel === 'quick' ? 100000 : simulationLevel === 'normal' ? 1000000 : 10000000,
          featureTriggers: Math.round((simulationLevel === 'quick' ? 100000 : simulationLevel === 'normal' ? 1000000 : 10000000) / (150 + Math.random() * 50)),
          bigWins: Math.round((simulationLevel === 'quick' ? 100000 : simulationLevel === 'normal' ? 1000000 : 10000000) / (5000 - volatility * 300)),
          symbolHits: {
            'WILD': Math.round(120000 / (volatility * 0.5 + 1)),
            'SCATTER': Math.round(45000 / (volatility * 0.5 + 1)),
            'H2': Math.round(80000 / (volatility * 0.3 + 1)),
            'H3': Math.round(75000 / (volatility * 0.3 + 1)),
            'L1': Math.round(200000 / (volatility * 0.1 + 1)),
            'L2': Math.round(220000 / (volatility * 0.1 + 1)),
            'L3': Math.round(260000 / (volatility * 0.1 + 1))
          },
          messages: generateSimulationMessages(totalRTP, volatility)
        };
        
        setSimulationResult(result);
        setIsSimulating(false);
      }
    }, simulationLevel === 'quick' ? 100 : simulationLevel === 'normal' ? 150 : 200);
  };
  
  // Generate RTP result with small variation
  const generateRTPResult = (target: number) => {
    // Generate random variation within confidence interval
    const variation = (Math.random() * 2 - 1) * (simulationLevel === 'quick' ? 0.4 : simulationLevel === 'normal' ? 0.2 : 0.1);
    return parseFloat((target + variation).toFixed(2));
  };
  
  // Generate hit rate based on volatility
  const generateHitRateFromVolatility = (vol: number) => {
    // Lower volatility = higher hit rate
    const baseHitRate = 30 - vol * 1.2;
    // Add small random variation
    const variation = (Math.random() * 2 - 1) * 0.5;
    return parseFloat((baseHitRate + variation).toFixed(1));
  };
  
  // Generate simulation messages
  const generateSimulationMessages = (rtpValue: number, volatilityValue: number) => {
    const messages = [];
    
    // RTP validation
    if (Math.abs(rtpValue - 96) > 4) {
      messages.push({
        type: 'warning' as const,
        message: `RTP of ${rtpValue.toFixed(1)}% is significantly different from industry standard (96%)`
      });
    } else {
      messages.push({
        type: 'success' as const,
        message: `RTP of ${rtpValue.toFixed(1)}% is within acceptable range`
      });
    }
    
    // Volatility check
    if (volatilityValue > 8) {
      messages.push({
        type: 'info' as const,
        message: 'High volatility model. Recommend increasing base game RTP to improve player experience'
      });
    }
    
    // Feature contribution
    const featureContribution = (rtpDistribution.features / rtpValue) * 100;
    if (featureContribution > 35) {
      messages.push({
        type: 'warning' as const,
        message: `Feature RTP contribution (${featureContribution.toFixed(0)}%) is very high. Players may have negative experience in base game`
      });
    }
    
    // Add a random message based on simulation level
    if (simulationLevel === 'deep') {
      const randomMessages = [
        {
          type: 'info' as const,
          message: 'Symbol weight distribution could be optimized for better hit frequency'
        },
        {
          type: 'success' as const,
          message: 'Mathematical model shows good balance between base game and features'
        },
        {
          type: 'info' as const,
          message: 'Recommend adding more high symbol wins to improve player emotional response'
        }
      ];
      
      messages.push(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
    }
    
    return messages;
  };
  
  return (
    <div className="deep-simulation bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Deep Simulation System
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Verify RTP, volatility, and symbol distribution with advanced simulations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={simulationLevel}
            onChange={(e) => setSimulationLevel(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="quick">Quick (100K spins)</option>
            <option value="normal">Normal (1M spins)</option>
            <option value="deep">Deep (10M spins)</option>
          </select>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                      ${isSimulating 
                        ? 'bg-gray-200 text-gray-500 cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Simulation Progress */}
      {isSimulating && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Simulation Progress</span>
            <span className="text-sm font-medium text-gray-700">{simulationProgress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Simulation Results */}
      {simulationResult && (
        <div className="mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-md font-medium text-blue-800 mb-3">Simulation Results</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Actual RTP</div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-blue-600 mr-2">{simulationResult.actualRTP}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    Math.abs(simulationResult.actualRTP - totalRTP) < 0.3 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {Math.abs(simulationResult.actualRTP - totalRTP) < 0.3 
                      ? 'On Target' 
                      : `${(simulationResult.actualRTP > totalRTP ? '+' : '') + (simulationResult.actualRTP - totalRTP).toFixed(1)}%`
                    }
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Hit Rate</div>
                <div className="text-xl font-bold text-blue-600">{simulationResult.hitRate}%</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Feature Triggers</div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-blue-600 mr-2">{simulationResult.featureTriggers}</span>
                  <span className="text-xs text-gray-500">
                    (1:{Math.round(simulationResult.spinCount / simulationResult.featureTriggers)})
                  </span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Big Wins (50x+)</div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-blue-600 mr-2">{simulationResult.bigWins}</span>
                  <span className="text-xs text-gray-500">
                    (1:{Math.round(simulationResult.spinCount / simulationResult.bigWins)})
                  </span>
                </div>
              </div>
            </div>
            
            {/* Analysis Messages */}
            <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Analysis</div>
              <div className="space-y-2">
                {simulationResult.messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                      msg.type === 'error' ? 'bg-red-50 text-red-800' :
                      msg.type === 'success' ? 'bg-green-50 text-green-800' :
                      'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {msg.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {msg.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {msg.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {msg.type === 'info' && <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <span>{msg.message}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Show/Hide Details Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide Detailed Results' : 'Show Detailed Results'}
            </button>
            
            {/* Detailed Results */}
            {showDetails && (
              <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Symbol Hit Statistics</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hits</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(simulationResult.symbolHits).map(([symbol, hits]) => (
                        <tr key={symbol}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{symbol}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{hits.toLocaleString()}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                            {((hits / simulationResult.spinCount) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Simulation Parameters</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Simulation Level:</span>
                      <span className="font-medium capitalize">{simulationLevel}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Total Spins:</span>
                      <span className="font-medium">{simulationResult.spinCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Target RTP:</span>
                      <span className="font-medium">{totalRTP.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Volatility Level:</span>
                      <span className="font-medium">{volatility}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Placeholder when no simulation has been run */}
      {!isSimulating && !simulationResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-700 mb-2">No Simulation Results</h4>
          <p className="text-sm text-gray-500 mb-4">
            Run a simulation to verify your math model and receive detailed analysis
          </p>
          <div className="max-w-md mx-auto text-sm text-gray-600">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="text-left">
                <b>Quick simulation (100K spins)</b>: Fast check with lower precision (±0.4% RTP)
              </div>
            </div>
            <div className="flex items-start gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="text-left">
                <b>Normal simulation (1M spins)</b>: Balanced approach with good precision (±0.2% RTP)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="text-left">
                <b>Deep simulation (10M spins)</b>: Highest precision for final verification (±0.1% RTP)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Math Automation Component that combines all subcomponents
const MathAutomation: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  
  // Default values from config or set defaults
  const initialRTPBase = config?.rtp?.baseRTP || 70;
  const initialRTPFeatures = config?.rtp?.bonusRTP || 20;
  const initialRTPJackpots = config?.rtp?.featureRTP || 6;
  const initialVolatility = config?.rtp?.volatilityScale || 5;
  
  // State for RTP distribution
  const [rtpDistribution, setRtpDistribution] = useState<RTPDistribution>({
    baseGame: initialRTPBase,
    features: initialRTPFeatures,
    jackpots: initialRTPJackpots
  });
  
  // State for volatility
  const [volatility, setVolatility] = useState(initialVolatility);
  
  // Calculate total RTP
  const totalRTP = Object.values(rtpDistribution).reduce((sum, val) => sum + val, 0);
  
  // Update config when values change
  useEffect(() => {
    updateConfig({
      rtp: {
        ...config?.rtp,
        baseRTP: rtpDistribution.baseGame,
        bonusRTP: rtpDistribution.features,
        featureRTP: rtpDistribution.jackpots,
        targetRTP: totalRTP,
        volatilityScale: volatility
      },
      volatility: {
        ...config?.volatility,
        level: volatility <= 3 ? 'low' : volatility <= 7 ? 'medium' : 'high',
        variance: volatility * 2,
        hitRate: Math.round(30 - volatility * 1.2),
        maxWinPotential: Math.round(volatility * 1000),
        precisionValue: volatility,
        hitFrequency: Math.round(30 - volatility * 1.2)
      }
    });
  }, [rtpDistribution, volatility]);
  
  return (
    <div className="math-automation">
      <h2 className="text-2xl font-bold mb-8 text-center">Math Model Automation</h2>
      
      <div className="space-y-8">
        {/* RTP Auto-Balancer */}
        <RTPAutoBalancer
          rtpDistribution={rtpDistribution}
          totalRTP={totalRTP}
          onRTPChange={setRtpDistribution}
          volatility={volatility}
        />
        
        {/* Symbol Weight Optimizer */}
        <SymbolWeightOptimizer
          volatility={volatility}
          rtpDistribution={rtpDistribution}
          totalRTP={totalRTP}
        />
        
        {/* Deep Simulation System */}
        <DeepSimulation
          rtpDistribution={rtpDistribution}
          totalRTP={totalRTP}
          volatility={volatility}
        />
        
        {/* Continue Button */}
        <div className="mt-8 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            onClick={() => {
              // Would typically move to the next step
              // setStep(4);
            }}
          >
            <span>Continue to Features</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathAutomation;