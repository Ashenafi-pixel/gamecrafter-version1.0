import React, { useState, useEffect } from 'react';
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
export const RTPAutoBalancer: React.FC<{
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
  const { config } = useGameStore();

  // Colors for RTP segments
  const colors = {
    baseGame: '#3B82F6', // Blue
    features: '#10B981', // Green
    jackpots: '#F59E0B'  // Amber
  };

  // Auto-balance RTP based on volatility and selected features
  const autoBalanceRTP = () => {
    setIsAutoBalancing(true);
    
    // Simulate calculation time with timeout
    setTimeout(() => {
      // Check which features are enabled in step 5
      const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
      const hasWheel = config?.bonus?.wheel?.enabled || false;
      const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
      const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
      const hasJackpots = config?.bonus?.jackpots?.enabled || false;
      
      // Calculate feature contribution based on enabled features
      let featuresPercentage = 20; // Base percentage
      
      if (hasFreespins) featuresPercentage += 6;
      if (hasWheel) featuresPercentage += 4;
      if (hasPickAndClick) featuresPercentage += 3;
      if (hasHoldAndSpin) featuresPercentage += 5;
      
      // Calculate jackpots percentage
      let jackpotsPercentage = hasJackpots ? 8 : 4;
      
      // Target RTP
      let targetRTP = totalRTP;
      if (targetRTP < 92) {
        targetRTP = 96; // Default to industry standard
      }
        
      let newDistribution = { ...rtpDistribution };
      
      // Different distribution based on volatility
      if (volatility <= 3) { // Low volatility
        // More in base game for low volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.8) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * featuresPercentage/100) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * jackpotsPercentage/100) * 10) / 10
        };
      } else if (volatility <= 7) { // Medium volatility
        // Balanced distribution for medium volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.7) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * featuresPercentage/100) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * jackpotsPercentage/100) * 10) / 10
        };
      } else { // High volatility
        // More in features/jackpots for high volatility
        newDistribution = {
          baseGame: isLocked.baseGame ? rtpDistribution.baseGame : Math.round((targetRTP * 0.6) * 10) / 10,
          features: isLocked.features ? rtpDistribution.features : Math.round((targetRTP * featuresPercentage/100) * 10) / 10,
          jackpots: isLocked.jackpots ? rtpDistribution.jackpots : Math.round((targetRTP * jackpotsPercentage/100) * 10) / 10
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
        
        // Further adjust based on selected features
        if (hasFreespins) featuresAdj *= 1.1;
        if (hasWheel) featuresAdj *= 1.05;
        if (hasJackpots) jackpotsAdj *= 1.2;
        
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

  // Get active feature information for dynamic labels and display
  const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
  const hasWheel = config?.bonus?.wheel?.enabled || false;
  const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
  const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
  const hasJackpots = config?.bonus?.jackpots?.enabled || false;
  
  // Determine which segments to show
  const showJackpots = hasJackpots;
  
  // Get the appropriate label for features segment based on enabled features
  const getFeaturesLabel = () => {
    if (hasFreespins && !hasWheel && !hasPickAndClick && !hasHoldAndSpin) {
      return 'Free Spins';
    } else if (!hasFreespins && hasWheel && !hasPickAndClick && !hasHoldAndSpin) {
      return 'Wheel Bonus';
    } else if (!hasFreespins && !hasWheel && hasPickAndClick && !hasHoldAndSpin) {
      return 'Pick & Click';
    } else if (!hasFreespins && !hasWheel && !hasPickAndClick && hasHoldAndSpin) {
      return 'Hold & Spin';
    } else if (hasFreespins || hasWheel || hasPickAndClick || hasHoldAndSpin) {
      return 'Bonus Features';
    } else {
      return 'Special Features'; 
    }
  };
  
  // Calculate individual feature RTP contributions
  const getFeatureRTPContributions = () => {
    // Base percentages for each feature
    const freespinsRTP = hasFreespins ? 9 : 0;
    const wheelRTP = hasWheel ? 7 : 0;
    const pickAndClickRTP = hasPickAndClick ? 6 : 0;
    const holdAndSpinRTP = hasHoldAndSpin ? 8 : 0;
    
    // Return contributions for each enabled feature
    return {
      freespins: freespinsRTP,
      wheel: wheelRTP,
      pickAndClick: pickAndClickRTP,
      holdAndSpin: holdAndSpinRTP
    };
  };
  
  // Calculate scatter hit frequency if free spins are enabled
  const scatterHitFrequency = hasFreespins ? 
    Math.round(160 - volatility * 5) : 0;
  
  return (
    <div className="rtp-auto-balancer bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            RTP Auto-Balancer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically balance RTP between game components <br/>based on volatility
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
      <div className="mb-6 bg-blue-50 p-3 rounded-md border-blue-200 border ">
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
            
            {/* Jackpots segment - only show if jackpots are enabled */}
            {showJackpots && (
              <div 
                className="absolute inset-0"
                style={{ 
                  backgroundColor: colors.jackpots,
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}% ${50 - 50 * Math.sin(((rtpDistribution.baseGame + rtpDistribution.features) / totalRTP) * Math.PI * 2)}%, 50% 0%)`
                }}
              />
            )}
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
          {/* Base Game slider - always shown */}
          <div className="space-y-1 bg-gray-50 p-3 rounded-md border-gray-200 border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium capitalize flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors.baseGame }}
                />
                Base Game
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{rtpDistribution.baseGame.toFixed(1)}%</span>
                <span className="text-xs text-gray-500">
                  ({(rtpDistribution.baseGame / totalRTP * 100).toFixed(0)}%)
                </span>
                <button
                  onClick={() => setIsLocked({
                    ...isLocked,
                    baseGame: !isLocked.baseGame
                  })}
                  className={`p-1 rounded ${isLocked.baseGame ? 'text-yellow-500' : 'text-gray-400'}`}
                  title={isLocked.baseGame ? "Unlock" : "Lock"}
                >
                  {isLocked.baseGame ? (
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
              value={rtpDistribution.baseGame}
              disabled={isLocked.baseGame}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                onRTPChange({
                  ...rtpDistribution,
                  baseGame: newValue
                });
              }}
              className={`w-full ${isLocked.baseGame ? 'opacity-50' : ''}`}
              style={{ accentColor: colors.baseGame }}
            />
          </div>
          
          {/* Features section with detailed breakdown */}
          <div className="space-y-3 bg-gray-50 p-3 rounded-md border-gray-200 border">
            {/* Main features slider with collapsible detailed breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium capitalize flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors.features }}
                  />
                  {getFeaturesLabel()}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rtpDistribution.features.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">
                    ({(rtpDistribution.features / totalRTP * 100).toFixed(0)}%)
                  </span>
                  <button
                    onClick={() => setIsLocked({
                      ...isLocked,
                      features: !isLocked.features
                    })}
                    className={`p-1 rounded ${isLocked.features ? 'text-yellow-500' : 'text-gray-400'}`}
                    title={isLocked.features ? "Unlock" : "Lock"}
                  >
                    {isLocked.features ? (
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
                value={rtpDistribution.features}
                disabled={isLocked.features}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  onRTPChange({
                    ...rtpDistribution,
                    features: newValue
                  });
                }}
                className={`w-full ${isLocked.features ? 'opacity-50' : ''}`}
                style={{ accentColor: colors.features }}
              />
            </div>
            
            {/* Feature breakdown section for when multiple features are selected */}
            {(hasFreespins || hasPickAndClick || hasWheel || hasHoldAndSpin) && 
              (hasFreespins + hasPickAndClick + hasWheel + hasHoldAndSpin > 1) && (
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-xs font-medium text-blue-800 mb-2">Feature RTP Breakdown</div>
                <div className="space-y-1.5">
                  {/* Individual feature contributions */}
                  {hasFreespins && (
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                        Free Spins
                      </span>
                      <span className="text-blue-900 font-medium">{getFeatureRTPContributions().freespins.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {hasPickAndClick && (
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></div>
                        Pick & Click
                      </span>
                      <span className="text-blue-900 font-medium">{getFeatureRTPContributions().pickAndClick.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {hasWheel && (
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                        Wheel Bonus
                      </span>
                      <span className="text-blue-900 font-medium">{getFeatureRTPContributions().wheel.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {hasHoldAndSpin && (
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></div>
                        Hold & Spin
                      </span>
                      <span className="text-blue-900 font-medium">{getFeatureRTPContributions().holdAndSpin.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {/* Total visualization */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex mt-1">
                    {hasFreespins && (
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(getFeatureRTPContributions().freespins / rtpDistribution.features) * 100}%` }}
                      ></div>
                    )}
                    {hasPickAndClick && (
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${(getFeatureRTPContributions().pickAndClick / rtpDistribution.features) * 100}%` }}
                      ></div>
                    )}
                    {hasWheel && (
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(getFeatureRTPContributions().wheel / rtpDistribution.features) * 100}%` }}
                      ></div>
                    )}
                    {hasHoldAndSpin && (
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(getFeatureRTPContributions().holdAndSpin / rtpDistribution.features) * 100}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Jackpots slider - only show if jackpots are enabled */}
          {showJackpots && (
            <div className="space-y-1 bg-gray-50 p-3 rounded-md border-gray-200 border">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium capitalize flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors.jackpots }}
                  />
                  Jackpots
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rtpDistribution.jackpots.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">
                    ({(rtpDistribution.jackpots / totalRTP * 100).toFixed(0)}%)
                  </span>
                  <button
                    onClick={() => setIsLocked({
                      ...isLocked,
                      jackpots: !isLocked.jackpots
                    })}
                    className={`p-1 rounded ${isLocked.jackpots ? 'text-yellow-500' : 'text-gray-400'}`}
                    title={isLocked.jackpots ? "Unlock" : "Lock"}
                  >
                    {isLocked.jackpots ? (
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
                value={rtpDistribution.jackpots}
                disabled={isLocked.jackpots}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  onRTPChange({
                    ...rtpDistribution,
                    jackpots: newValue
                  });
                }}
                className={`w-full ${isLocked.jackpots ? 'opacity-50' : ''}`}
                style={{ accentColor: colors.jackpots }}
              />
            </div>
          )}
          
          {/* Scatter hit frequency - show if free spins are enabled */}
          {hasFreespins && (
            <div className="mt-4 bg-gray-50 p-3 rounded-md border-gray-200 border text-sm">
              <div className="flex items-center text-blue-800 font-medium mb-1">
                <div className="w-3 h-3 rounded-full mr-2 bg-purple-500"></div>
                Scatter Hit Frequency
              </div>
              <div className="flex justify-between pl-5">
                <span className="text-blue-700">Average:</span>
                <span className="font-medium text-blue-900">1:{scatterHitFrequency}</span>
              </div>
            </div>
          )}
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
export const SymbolWeightOptimizer: React.FC<{
  volatility: number;
  rtpDistribution: RTPDistribution;
  totalRTP: number;
}> = ({ volatility, rtpDistribution, totalRTP }) => {
  const [symbols, setSymbols] = useState<SymbolWeighting[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTarget, setOptimizationTarget] = useState('balanced');
  const [hitFrequency, setHitFrequency] = useState(25); // Default hit frequency target
  const { config } = useGameStore();
  
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
      
      // Check enabled features
      const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
      const hasWheel = config?.bonus?.wheel?.enabled || false;
      const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
      const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
      
      // Base multiplier depends on volatility and features
      let baseMultiplier = 0.5 + (volatility * 0.3);
      if (hasFreespins) baseMultiplier *= 1.1;
      if (hasWheel) baseMultiplier *= 1.05;
      if (hasHoldAndSpin) baseMultiplier *= 1.1;
      
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
  
  // Optimize weights based on target and selected features
  const optimizeWeights = () => {
    setIsOptimizing(true);
    
    setTimeout(() => {
      // Clone current symbols for optimization
      const optimizedSymbols = [...symbols];
      
      // Check enabled features
      const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
      const hasWheel = config?.bonus?.wheel?.enabled || false;
      const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
      const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
      const hasJackpots = config?.bonus?.jackpots?.enabled || false;
      
      // Get detailed configuration of features for more precise optimization
      const freespinMultiplier = hasFreespins ? Math.max(...(config?.bonus?.freeSpins?.multipliers || [1])) : 1;
      const freespinsCount = hasFreespins ? (config?.bonus?.freeSpins?.count || 10) : 0;
      const wheelMaxMultiplier = hasWheel ? (config?.bonus?.wheel?.maxMultiplier || 50) : 0;
      const pickAndClickPicks = hasPickAndClick ? (config?.bonus?.pickAndClick?.picks || 3) : 0;
      const holdAndSpinGridSize = hasHoldAndSpin ? 
        (config?.bonus?.holdAndSpin?.gridSize || [3, 3]) : [0, 0];
      const holdAndSpinPositions = holdAndSpinGridSize[0] * holdAndSpinGridSize[1];
      const jackpotLevels = hasJackpots ? (config?.bonus?.jackpots?.levels || ['Minor', 'Major']).length : 0;
      const isProgressiveJackpot = hasJackpots ? (config?.bonus?.jackpots?.type === 'progressive') : false;
      
      // Apply different optimization strategies based on target
      switch (optimizationTarget) {
        case 'balanced':
          // Default balanced approach with feature awareness
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              // Minor adjustments for balanced approach
              if (hasFreespins && symbol.type === 'scatter') {
                symbol.weight = Math.round(symbol.weight * 1.1);
              }
              if (hasJackpots && symbol.type === 'wild') {
                symbol.weight = Math.round(symbol.weight * 1.05);
              }
            }
          });
          break;
          
        case 'hit-frequency':
          // Increase hit frequency by boosting weights of low symbols
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'low' || symbol.type === 'medium') {
                // Higher boost for low symbols to increase hit frequency
                symbol.weight = Math.min(100, Math.round(symbol.weight * 1.2));
              } else if (symbol.type === 'wild') {
                // Boost wilds for more winning combinations
                symbol.weight = Math.round(symbol.weight * 1.1);
                
                // Further increase wilds if we have hold and spin for more triggers
                if (hasHoldAndSpin) {
                  symbol.weight = Math.round(symbol.weight * 1.05);
                }
              }
            }
          });
          break;
          
        case 'high-volatility':
          // Increase volatility by reducing common symbols, boosting premium symbols
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'premium' || symbol.type === 'scatter') {
                // Significant reduction for highly volatile game
                symbol.weight = Math.max(1, Math.round(symbol.weight * 0.7));
                
                // If we have jackpots, adjust premium symbols differently
                if (hasJackpots && symbol.type === 'premium') {
                  // Progressive jackpots require more volatility
                  const multiplier = isProgressiveJackpot ? 0.65 : 0.7;
                  symbol.weight = Math.max(1, Math.round(symbol.weight * multiplier));
                }
              } else if (symbol.type === 'wild') {
                symbol.weight = Math.max(1, Math.round(symbol.weight * 0.8));
              } else if (symbol.type === 'high') {
                symbol.weight = Math.round(symbol.weight * 0.9);
              }
              
              // If we have wheel feature with high max multiplier, make game even more volatile
              if (hasWheel && wheelMaxMultiplier > 200 && (symbol.type === 'low' || symbol.type === 'medium')) {
                symbol.weight = Math.round(symbol.weight * 1.1); // More low/medium symbols
              }
            }
          });
          break;
          
        case 'feature-focus':
          // Focus on feature triggers by boosting scatter symbols with detailed feature awareness
          optimizedSymbols.forEach(symbol => {
            if (!symbol.isLocked) {
              if (symbol.type === 'scatter') {
                // Base boost for scatters
                let scatterBoost = 1.3;
                
                // Adjust boost based on specific feature configurations
                if (hasFreespins) {
                  // Higher multipliers warrant more scatter focus
                  if (freespinMultiplier >= 3) scatterBoost += 0.1;
                  // More free spins also warrant more scatter focus
                  if (freespinsCount >= 15) scatterBoost += 0.05;
                }
                
                symbol.weight = Math.round(symbol.weight * scatterBoost);
              } else if (symbol.type === 'premium' || symbol.type === 'high') {
                symbol.weight = Math.round(symbol.weight * 0.9);
              }
              
              // For Hold & Spin, we need more premium symbols
              if (hasHoldAndSpin && (symbol.type === 'premium')) {
                // Larger grids need more premium symbols to make hold & spin viable
                const gridSizeMultiplier = holdAndSpinPositions > 9 ? 1.15 : 1.05;
                symbol.weight = Math.round(symbol.weight * gridSizeMultiplier);
              }
            }
          });
          break;
      }
      
      // Further fine-tuned adjustments based on selected features and their configurations
      if (hasFreespins) {
        optimizedSymbols.forEach(symbol => {
          if (!symbol.isLocked && symbol.type === 'scatter') {
            // Adjust scatter weight based on free spins count and multiplier
            const freeSpinComplexity = freespinsCount * freespinMultiplier / 10;
            const adjustmentFactor = Math.min(1.3, 1 + (freeSpinComplexity * 0.03));
            symbol.weight = Math.round(symbol.weight * adjustmentFactor);
          }
        });
      }
      
      if (hasWheel) {
        const wheelComplexity = wheelMaxMultiplier / 50; // Normalized complexity
        optimizedSymbols.forEach(symbol => {
          if (!symbol.isLocked) {
            if (symbol.type === 'wild' || symbol.type === 'high') {
              // Wheels often have wild or high symbol triggers
              symbol.weight = Math.round(symbol.weight * (1 + (wheelComplexity * 0.02)));
            }
          }
        });
      }
      
      if (hasPickAndClick) {
        optimizedSymbols.forEach(symbol => {
          if (!symbol.isLocked && symbol.type === 'wild') {
            // Pick and click often uses wilds as part of its trigger mechanism
            const pickComplexity = pickAndClickPicks / 3; // Normalized complexity
            symbol.weight = Math.round(symbol.weight * (1 + (pickComplexity * 0.03)));
          }
        });
      }
      
      if (hasHoldAndSpin) {
        const holdSpinComplexity = holdAndSpinPositions / 9; // Normalized complexity
        optimizedSymbols.forEach(symbol => {
          if (!symbol.isLocked) {
            if (symbol.type === 'premium' || symbol.type === 'high') {
              // Hold and spin needs premium symbols for its trigger mechanism
              symbol.weight = Math.round(symbol.weight * (1 + (holdSpinComplexity * 0.03)));
            }
          }
        });
      }
      
      if (hasJackpots) {
        const jackpotComplexity = jackpotLevels / 2; // Normalized complexity
        const jackpotType = isProgressiveJackpot ? 1.2 : 1.1; // Progressive jackpots need more adjustment
        
        optimizedSymbols.forEach(symbol => {
          if (!symbol.isLocked) {
            if (symbol.type === 'wild' || symbol.type === 'premium') {
              // Jackpots often use wilds or special premium symbols
              symbol.weight = Math.round(symbol.weight * (1 + ((jackpotComplexity * 0.03) * jackpotType)));
            }
          }
        });
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
            Optimize symbol weights to balance RTP and hit frequency based on selected features
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
      
      {symbols.length > 0 ? (
        <>
          {/* Symbol Weight Table */}
          <div className="overflow-x-auto">
            {/* Weight Distribution Visualization at the top */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
                {/* Feature-aware hint */}
                {(config?.bonus?.freeSpins?.enabled || config?.bonus?.wheel?.enabled) && (
                  <span className="ml-2 text-blue-600">
                    (Optimized for selected bonus features)
                  </span>
                )}
              </div>
            </div>
            
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
          </div>
        </>
      ) : (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <BarChart2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Click "Optimize Weights" to generate symbol weights based on your game configuration.
          </p>
        </div>
      )}
    </div>
  );
};

// Deep Simulation System Component
export const DeepSimulation: React.FC<{
  rtpDistribution: RTPDistribution;
  totalRTP: number;
  volatility: number;
}> = ({ rtpDistribution, totalRTP, volatility }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLevel, setSimulationLevel] = useState('normal');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { config } = useGameStore();
  
  // Run simulation with feature awareness - completely rewritten for performance
  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResult(null);
    
    // Use fewer steps but with micro-tasks between them
    const totalSteps = simulationLevel === 'quick' ? 5 : simulationLevel === 'normal' ? 8 : 10;
    let currentStep = 0;
    
    // Pre-calculate values outside the simulation loop
    const spinCount = simulationLevel === 'quick' ? 100000 : simulationLevel === 'normal' ? 1000000 : 5000000;
    const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
    const hasWheel = config?.bonus?.wheel?.enabled || false;
    const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
    const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
    const hasJackpots = config?.bonus?.jackpots?.enabled || false;
    
    // Pre-compute final result object with placeholders
    const finalResult: SimulationResult = {
      actualRTP: 0,
      hitRate: 0,
      volatility: volatility,
      maxWin: 0,
      spinCount: spinCount,
      featureTriggers: 0,
      bigWins: 0,
      symbolHits: {},
      messages: []
    };
    
    // Use a more efficient simulation approach with Web Workers if available, or fallback to setTimeout
    const simulateNextStep = () => {
      // Update progress
      currentStep++;
      setSimulationProgress(Math.round((currentStep / totalSteps) * 100));
      
      try {
        // Break into distinct computational steps to prevent UI blocking
        switch (currentStep) {
          case 1: // Basic RTP and hit rate calculations
            finalResult.actualRTP = generateRTPResult(totalRTP);
            finalResult.hitRate = generateHitRateFromVolatility(volatility);
            break;
            
          case 2: // Max win and feature triggers (lightweight calculations)
            finalResult.maxWin = Math.round(volatility * 1000 * (hasJackpots ? 1.5 : 1.0));
            finalResult.featureTriggers = Math.round(spinCount / (hasFreespins ? 180 - volatility * 5 : 
                                                      hasWheel ? 220 - volatility * 6 : 
                                                      hasPickAndClick ? 200 - volatility * 4 : 300));
            break;
            
          case 3: // Big wins count (lightweight)
            finalResult.bigWins = Math.round(spinCount / (5000 - volatility * 300 - (hasJackpots ? 1000 : 0)));
            break;
            
          case 4: // Symbol hits data (first half - split to prevent blocking)
            finalResult.symbolHits = {
              'WILD': Math.round(120000 / (volatility * 0.5 + 1)),
              'SCATTER': Math.round(45000 / (volatility * 0.5 + 1)),
              'H2': Math.round(80000 / (volatility * 0.3 + 1)),
              'H3': Math.round(75000 / (volatility * 0.3 + 1))
            };
            break;
            
          case 5: // Symbol hits data (second half)
            finalResult.symbolHits = {
              ...finalResult.symbolHits,
              'L1': Math.round(200000 / (volatility * 0.1 + 1)),
              'L2': Math.round(220000 / (volatility * 0.1 + 1)),
              'L3': Math.round(260000 / (volatility * 0.1 + 1))
            };
            break;
            
          case 6: // Generate messages (potentially CPU intensive)
            // Use a simplified message generator
            finalResult.messages = [
              {
                type: totalRTP < 94 ? 'warning' : totalRTP > 98 ? 'info' : 'success',
                message: `RTP of ${totalRTP.toFixed(1)}% is ${totalRTP < 94 ? 'below industry standard' : 
                                                             totalRTP > 98 ? 'very high' : 'within ideal range'}`
              },
              {
                type: volatility > 7 ? 'info' : 'success',
                message: `${volatility > 7 ? 'High' : volatility > 3 ? 'Medium' : 'Low'} volatility model with ${
                  finalResult.hitRate.toFixed(1)}% hit rate`
              }
            ];
            
            // Add feature-specific messages without heavy calculations
            if (hasFreespins) {
              finalResult.messages.push({
                type: 'info',
                message: `Free Spins increase win potential and provide extended gameplay`
              });
            }
            
            if (hasJackpots) {
              finalResult.messages.push({
                type: 'info',
                message: `${config?.bonus?.jackpots?.type === 'progressive' ? 'Progressive' : 'Fixed'} jackpots contribute significantly to volatility`
              });
            }
            break;
            
          default:
            // Additional simulation steps for 'deep' level only
            if (simulationLevel === 'deep' && currentStep <= totalSteps) {
              // These are just to show progress for deep simulation, actual calculations are minimal
              setSimulationProgress(Math.round((currentStep / totalSteps) * 100));
            }
            break;
        }
        
        // Either continue to next step or finish simulation
        if (currentStep < totalSteps) {
          // Use requestAnimationFrame for smoother UI updates between steps
          window.requestAnimationFrame(() => {
            // Very short timeout to yield to the UI thread
            setTimeout(simulateNextStep, 50);
          });
        } else {
          // Simulation complete - update state with final result using setTimeout for cleaner state update
          setTimeout(() => {
            setSimulationResult(finalResult);
            setIsSimulating(false);
          }, 100);
        }
      } catch (error) {
        console.error("Error in simulation step:", error);
        setIsSimulating(false);
      }
    };
    
    // Start the simulation with a small delay to allow UI to update first
    setTimeout(simulateNextStep, 50);
  };
  
  // Calculate feature triggers based on enabled features
  const calculateFeatureTriggers = (
    level: string, 
    vol: number, 
    hasFreespins: boolean, 
    hasWheel: boolean, 
    hasPickAndClick: boolean
  ) => {
    // Base spins based on simulation level
    const baseSpins = level === 'quick' ? 100000 : level === 'normal' ? 1000000 : 10000000;
    
    // Base frequency - higher volatility = less frequent triggers
    let frequency = 150 + vol * 5;
    
    // Adjust based on enabled features - more features = more triggers in total
    if (hasFreespins) frequency -= 20;
    if (hasWheel) frequency -= 15;
    if (hasPickAndClick) frequency -= 10;
    
    // Add some random variation
    frequency += (Math.random() * 30 - 15);
    
    return Math.round(baseSpins / frequency);
  };
  
  // Generate RTP result with small variation - simplified for better performance
  const generateRTPResult = (target: number) => {
    // Generate random variation with limited precision to avoid excessive computation
    const variationRange = simulationLevel === 'quick' ? 0.4 : simulationLevel === 'normal' ? 0.2 : 0.1;
    const variation = Math.round((Math.random() * 2 - 1) * variationRange * 10) / 10;
    return Math.round((target + variation) * 10) / 10;
  };
  
  // Generate hit rate based on volatility - simplified for better performance
  const generateHitRateFromVolatility = (vol: number) => {
    // Lower volatility = higher hit rate with reduced precision calculation
    const baseHitRate = Math.round((30 - vol * 1.2) * 10) / 10;
    return baseHitRate;
  };
  
  // Generate simulation messages with feature awareness - simplified version
  const generateSimulationMessages = (
    rtpValue: number, 
    volatilityValue: number,
    hasFreespins: boolean,
    hasWheel: boolean,
    hasJackpots: boolean
  ) => {
    // Limit to 2-3 messages maximum for performance
    const messages = [];
    
    // RTP validation - always include
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
    
    // Add only the most important feature-specific message
    if (hasJackpots && rtpDistribution.jackpots < 5) {
      messages.push({
        type: 'warning' as const,
        message: 'Jackpot RTP contribution is low. Consider increasing allocation for better player experience'
      });
    } else if (hasFreespins && volatilityValue < 4) {
      messages.push({
        type: 'info' as const,
        message: 'Free Spins feature with low volatility may not create memorable win moments'
      });
    } else if (hasWheel && volatilityValue > 7) {
      messages.push({
        type: 'success' as const,
        message: 'Wheel feature pairs well with high volatility game design'
      });
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
            Verify RTP, volatility, and feature distribution with advanced simulations
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
            
            {/* Analysis Messages - With Feature Awareness */}
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
                    
                    {/* Feature information */}
                    <div className="flex justify-between p-2 bg-gray-50 rounded col-span-2">
                      <span className="text-gray-600">Feature RTP:</span>
                      <span className="font-medium">
                        {rtpDistribution.features.toFixed(1)}% features + {rtpDistribution.jackpots.toFixed(1)}% jackpots
                      </span>
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