import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Thermometer, 
  Calculator, 
  LineChart, 
  PieChart as PieChartIcon, 
  BarChart, 
  Percent, 
  DollarSign, 
  BarChart2, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Lock,
  Unlock,
  Activity,
  Sliders,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGameStore } from '../../store';

// Interface for win distribution data
interface WinDistribution {
  multiplier: string;
  probability: number;
  contribution: number;
  color: string;
}

// RTP Distribution section component
const RTPDistribution: React.FC<{
  rtpDistribution: Record<string, number>;
  totalRTP: number;
  onDistributionChange: (distribution: Record<string, number>) => void;
  config: any; // Game configuration
  rtpDistributionValid?: boolean;
  validationMessage?: string;
}> = ({ rtpDistribution, totalRTP, onDistributionChange, config, rtpDistributionValid = true, validationMessage = '' }) => {
  // Colors for RTP segments
  const colors = {
    baseGame: '#3B82F6', // Blue
    features: '#10B981', // Green
    jackpots: '#F59E0B'  // Amber
  };
  
  // Get active feature information
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
  
  // Calculate scatter hit frequency if free spins are enabled
  const scatterHitFrequency = hasFreespins ? 
    Math.round(160 - config?.rtp?.volatilityScale * 5) : 0;
    
  // Calculate feature contributions for the pie chart visualization
  const getFeatureContributions = () => {
    if (!hasFreespins && !hasWheel && !hasPickAndClick && !hasHoldAndSpin) {
      return null;
    }
    
    // Base allocation percentages (of feature RTP)
    const contributions = {
      freeSpins: hasFreespins ? 0.45 : 0,
      wheel: hasWheel ? 0.25 : 0,
      pickAndClick: hasPickAndClick ? 0.15 : 0,
      holdAndSpin: hasHoldAndSpin ? 0.35 : 0
    };
    
    // Normalize to make sure they add up to 100%
    const total = Object.values(contributions).reduce((sum, val) => sum + val, 0);
    
    // Avoid division by zero
    if (total <= 0) return null;
    
    return {
      freeSpins: hasFreespins ? Math.round((contributions.freeSpins / total) * 100) : 0,
      wheel: hasWheel ? Math.round((contributions.wheel / total) * 100) : 0,
      pickAndClick: hasPickAndClick ? Math.round((contributions.pickAndClick / total) * 100) : 0,
      holdAndSpin: hasHoldAndSpin ? Math.round((contributions.holdAndSpin / total) * 100) : 0
    };
  };
  
  const featureContributions = getFeatureContributions();

  return (
    <div className="rtp-distribution">
      <h3 className="text-sm font-medium mb-4">RTP Distribution</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Enhanced RTP Pie Chart Visualization */}
        <div className="relative flex items-center justify-center">
          {/* Improved pie chart with divs */}
          <div className="w-36 h-36 rounded-full relative overflow-hidden border border-gray-200">
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
            <div className="text-center bg-white bg-opacity-80 rounded-full h-16 w-16 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">{totalRTP.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Total RTP</div>
            </div>
          </div>
          
          {/* Feature breakdown labels */}
          {featureContributions && rtpDistribution.features > 10 && (
            <div className="absolute right-0 top-0 bg-white bg-opacity-90 p-2 rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-700 mb-1">Feature Breakdown</div>
              {hasFreespins && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                    Free Spins
                  </span>
                  <span className="ml-2">{featureContributions.freeSpins}%</span>
                </div>
              )}
              {hasWheel && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Wheel
                  </span>
                  <span className="ml-2">{featureContributions.wheel}%</span>
                </div>
              )}
              {hasPickAndClick && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                    Pick & Click
                  </span>
                  <span className="ml-2">{featureContributions.pickAndClick}%</span>
                </div>
              )}
              {hasHoldAndSpin && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></span>
                    Hold & Spin
                  </span>
                  <span className="ml-2">{featureContributions.holdAndSpin}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* RTP Sliders */}
        <div className="space-y-3 ">
          {/* Base Game segment always shown */}
          <div className="space-y-1 bg-gray-50 p-3 rounded-md border-gray-200 border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium capitalize flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors.baseGame }}
                />
                Base Game
              </label>
              <div className="flex items-center">
                <span className="text-sm font-medium">{rtpDistribution.baseGame.toFixed(1)}%</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({(rtpDistribution.baseGame / totalRTP * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={rtpDistribution.baseGame}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                onDistributionChange({
                  ...rtpDistribution,
                  baseGame: newValue
                });
              }}
              className="w-full"
              style={{ accentColor: colors.baseGame }}
            />
          </div>
          
          {/* Features segment with dynamic label */}
          <div className="space-y-1 bg-gray-50 p-3 rounded-md border-gray-200 border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium capitalize flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: colors.features }}
                />
                {getFeaturesLabel()}
              </label>
              <div className="flex items-center">
                <span className="text-sm font-medium">{rtpDistribution.features.toFixed(1)}%</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({(rtpDistribution.features / totalRTP * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={rtpDistribution.features}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                onDistributionChange({
                  ...rtpDistribution,
                  features: newValue
                });
              }}
              className="w-full"
              style={{ accentColor: colors.features }}
            />
            
            {/* Feature-specific warnings/recommendations */}
            {hasFreespins && rtpDistribution.features < 10 && (
              <div className="text-xs text-amber-600 mt-1 flex items-start">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 mr-1" />
                Free Spins feature needs higher RTP allocation for optimal player experience
              </div>
            )}
            {hasHoldAndSpin && rtpDistribution.features < 15 && (
              <div className="text-xs text-amber-600 mt-1 flex items-start">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 mr-1" />
                Hold & Spin feature typically requires higher RTP allocation
              </div>
            )}
          </div>
          
          {/* Jackpots segment - only show if jackpots are enabled */}
          {showJackpots && (
            <div className="space-y-1 ">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium capitalize flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors.jackpots }}
                  />
                  Jackpots
                </label>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{rtpDistribution.jackpots.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({(rtpDistribution.jackpots / totalRTP * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={rtpDistribution.jackpots}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  onDistributionChange({
                    ...rtpDistribution,
                    jackpots: newValue
                  });
                }}
                className="w-full"
                style={{ accentColor: colors.jackpots }}
              />
              
              {/* Jackpot-specific warnings */}
              {config?.bonus?.jackpots?.type === 'progressive' && rtpDistribution.jackpots < 5 && (
                <div className="text-xs text-amber-600 mt-1 flex items-start">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 mr-1" />
                  Progressive jackpots typically require higher RTP allocation
                </div>
              )}
            </div>
          )}
          
          {/* Scatter hit frequency - show if free spins are enabled */}
          {hasFreespins && (
            <div className="mt-4 bg-blue-50 p-2 rounded text-sm">
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
          
          {/* RTP Validation Messages */}
          {!rtpDistributionValid && (
            <div className="mt-2 p-2 rounded bg-red-100 text-red-800 text-sm flex items-start">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 mr-1" />
              <div>{validationMessage || 'RTP distribution requires adjustment'}</div>
            </div>
          )}
          
          {/* RTP Status indicator */}
          <div className={`text-sm mt-2 p-2 rounded ${
            totalRTP < 88 ? 'bg-red-100 text-red-800' : 
            totalRTP < 94 ? 'bg-yellow-100 text-yellow-800' : 
            totalRTP > 98 ? 'bg-blue-100 text-blue-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {totalRTP < 88 && (
              <div className="flex items-start gap-1">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>RTP too low. Most jurisdictions require minimum 88%.</div>
              </div>
            )}
            {totalRTP >= 88 && totalRTP < 94 && (
              <div className="flex items-start gap-1">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>RTP is acceptable but below industry standard (94-96%).</div>
              </div>
            )}
            {totalRTP >= 94 && totalRTP <= 98 && (
              <div className="flex items-start gap-1">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>RTP is within ideal range. Good balance of player value and house edge.</div>
              </div>
            )}
            {totalRTP > 98 && (
              <div className="flex items-start gap-1">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>RTP very high. May not be economically viable long-term.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Volatility and Win Distribution Component
const VolatilityControl: React.FC<{
  volatility: number;
  setVolatility: (vol: number) => void;
  winDistribution: WinDistribution[];
}> = ({ volatility, setVolatility, winDistribution }) => {
  // Function to get volatility description
  const getVolatilityDescription = (vol: number) => {
    if (vol <= 3) return "Low volatility games have frequent small wins.";
    if (vol <= 6) return "Medium volatility balances win size and frequency.";
    return "High volatility offers larger but less frequent wins.";
  };
  
  // For the win distribution chart height
  const maxProbability = Math.max(...winDistribution.map(w => w.probability));
  
  return (
    <div className="volatility-control">
      <h3 className="text-sm   font-medium mb-4">Volatility & Win Distribution</h3>
      
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          {/* <Thermometer className="w-5 h-5 text-blue-600 mr-2" /> */}
          <h4 className="font-medium text-gray-800">Volatility Control</h4>
        </div>
        
        <div className="relative pt-1">
         
          
          <div className="h-2 bg-gradient-to-r from-blue-300 via-yellow-300 to-red-300 rounded-full">
            <div
              className="absolute w-4 h-4 bg-white rounded-full shadow border-2 border-gray-400 -mt-1 top-1"
              style={{ left: `calc(${(volatility - 1) / 9 * 100}% - 0.5rem)` }}
            />
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={volatility}
            onChange={(e) => setVolatility(parseFloat(e.target.value))}
            className="absolute top-0 w-full h-6 opacity-0 cursor-pointer"
          />
        </div>
         <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-blue-600">Low</span>
            <span className="text-xs font-medium text-yellow-600">Medium</span>
            <span className="text-xs font-medium text-red-600">High</span>
          </div>
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <div className="font-medium text-gray-800">
              {volatility < 3.5 ? 'Low' : volatility < 7 ? 'Medium' : 'High'} Volatility
            </div>
            <div className="text-sm text-gray-500">
              {volatility.toFixed(1)}/10
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {getVolatilityDescription(volatility)}
          </p>
        </div>
      </div>
      
      {/* Win Distribution Chart */}
      <div className="win-distribution">
        <div className="flex items-center mb-3">
          {/* <BarChart2 className="w-5 h-5 text-blue-600 mr-2" /> */}
          <h4 className="font-medium text-gray-800">Win Distribution</h4>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="h-40 flex items-end gap-0.5 mb-4">
            {winDistribution.map((win, index) => (
              <div 
                key={index}
                className="flex-1 flex flex-col items-center"
                title={`${win.multiplier}: ${win.probability.toFixed(2)}%`}
              >
                <div 
                  className="w-full rounded-t transition-all duration-200"
                  style={{
                    height: `${(win.probability / maxProbability) * 100}%`,
                    backgroundColor: win.color
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="flex text-xs text-gray-600">
            {winDistribution.map((win, index) => (
              <div key={index} className="flex-1 text-center overflow-hidden">
                {win.multiplier}
              </div>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="text-xs text-gray-500">
              Base hit rate: <span className="font-medium text-gray-700">{(30 - volatility * 1.2).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-500">
              Avg win size: <span className="font-medium text-gray-700">{(volatility * 0.8).toFixed(1)}x</span>
            </div>
            <div className="text-xs text-gray-500">
              Big win (50x+): <span className="font-medium text-gray-700">1:{Math.floor(600 - volatility * 40)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Max payout: <span className="font-medium text-gray-700">{(volatility * 1000).toFixed(0)}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Symbol Value Matrix Component
const SymbolValueMatrix: React.FC<{
  volatility: number;
  rtpDistribution: Record<string, number>;
}> = ({ volatility, rtpDistribution }) => {
  // Generate symbol values based on volatility and RTP
  const generateSymbolMatrix = () => {
    const symbolCount = 10; // Typical slot
    const patterns = [
      [5, 4, 3, 2], // 5 of a kind, 4 of a kind, etc.
      [5, 4, 3],    // Some symbols don't pay for 2 of a kind
    ];
    
    // Base multiplier depends on volatility
    const baseMultiplier = 0.5 + (volatility * 0.3);
    
    return Array(symbolCount).fill(0).map((_, idx) => {
      const isHighSymbol = idx < 4;
      const isSpecial = idx === 0; // First symbol is typically special (wild or premium)
      
      // Higher volatility = bigger gaps between symbol values
      const symbolTier = isSpecial 
        ? 1 
        : isHighSymbol 
          ? 1 + (idx * (0.5 + volatility * 0.1)) 
          : 3 + ((idx - 4) * (0.3 + volatility * 0.07));
      
      // Choose pattern based on symbol type
      const patternToUse = isHighSymbol ? patterns[0] : patterns[1];
      
      return {
        id: `symbol_${idx + 1}`,
        name: isSpecial 
          ? 'WILD' 
          : isHighSymbol 
            ? `H${idx}` 
            : `L${idx - 4 + 1}`,
        pays: patternToUse.map((count, payIdx) => {
          // Higher volatility = higher top symbol values, lower bottom symbol values
          const payMultiplier = isSpecial 
            ? baseMultiplier * 2 * Math.pow(3, patternToUse.length - payIdx - 1) 
            : baseMultiplier * Math.pow(symbolTier, 0.7) * Math.pow(2 - (volatility * 0.03), patternToUse.length - payIdx - 1);
            
          return {
            count,
            value: Math.max(0.5, Math.round(payMultiplier * 10) / 10),
          };
        }),
        color: isSpecial 
          ? '#f59e0b' // amber
          : isHighSymbol 
            ? `hsl(${210 - idx * 30}, 80%, 60%)` // blues
            : `hsl(${280 + (idx - 4) * 15}, 70%, 60%)` // purples
      };
    });
  };
  
  const symbols = generateSymbolMatrix();
  
  return (
    <div className="symbol-value-matrix">
      
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <h3 className="text-lg font-medium mb-4">Symbol Values</h3>
        <div className='bg-white p-3 rounded-md border'>
        <table className="min-w-full overflow-x-auto divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              {[5, 4, 3, 2].map(count => (
                <th key={count} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {count}×
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {symbols.map((symbol, idx) => (
              <tr key={symbol.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-3 py-2">
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: symbol.color }}
                    >
                      {symbol.name}
                    </div>
                  </div>
                </td>
                {[5, 4, 3, 2].map(count => {
                  const pay = symbol.pays.find(p => p.count === count);
                  return (
                    <td key={count} className="px-3 py-2">
                      {pay ? (
                        <span className="text-sm font-medium">
                          {pay.value}×
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center">
            <InfoCircle className="w-4 h-4 mr-1 text-blue-500" />
            Symbol values are automatically calculated based on your volatility settings.
          </div>
        </div>
      </div>
    </div>
  );
};

// Help wrapper for Info circle icon
const InfoCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Risk Assessment Component
const RiskAssessment: React.FC<{
  volatility: number;
  rtpDistribution: Record<string, number>;
  totalRTP: number;
}> = ({ volatility, rtpDistribution, totalRTP }) => {
  // Calculate risk factors
  const calculatedRisks = {
    playerRisk: Math.max(1, 10 - (totalRTP - 88) / 1.2),
    operatorRisk: (totalRTP - 94) / 0.6,
    volatilityRisk: volatility,
    hitFrequencyRisk: Math.max(1, 11 - (30 - volatility * 1.2) / 3),
    rtpDistributionRisk: Math.abs(rtpDistribution.baseGame - 65) / 6
  };
  
  // Calculate overall risk score (1-10)
  const overallRisk = Math.min(10, Math.max(1, (
    calculatedRisks.playerRisk * 0.2 +
    calculatedRisks.operatorRisk * 0.2 +
    calculatedRisks.volatilityRisk * 0.3 +
    calculatedRisks.hitFrequencyRisk * 0.15 +
    calculatedRisks.rtpDistributionRisk * 0.15
  )));
  
  // Get text and color based on risk value
  const getRiskDisplay = (value: number) => {
    if (value < 3) return { text: 'Low', color: 'bg-green-500' };
    if (value < 6) return { text: 'Medium', color: 'bg-yellow-500' };
    return { text: 'High', color: 'bg-red-500' };
  };
  
  return (
    <div className="risk-assessment p-3 pb-0">
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Risk Assessment</h3>
<div className='bg-white p-3 rounded-md border'>
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-800 font-medium">Overall Risk</div>
          <div className="flex items-center">
            <div className="text-sm font-medium mr-2">
              {getRiskDisplay(overallRisk).text}
            </div>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getRiskDisplay(overallRisk).color}`}
                style={{ width: `${overallRisk * 10}%` }}
              />
            </div>
          </div>
        </div>
      
        <div className="space-y-2">
          {Object.entries(calculatedRisks).map(([key, value]) => {
            const display = getRiskDisplay(value);
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());
              
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{label}</div>
                <div className="flex items-center">
                  <div className="text-xs font-medium mr-2">
                    {display.text}
                  </div>
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${display.color}`}
                      style={{ width: `${Math.min(100, value * 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </div>
        <div className="mt-4 text-xs text-gray-500">
          Risk assessment helps you balance player experience with business requirements.
        </div>
      </div>
    </div>
  );
};

// Market Requirements Component
const MarketRequirements: React.FC<{
  totalRTP: number;
  volatility: number;
}> = ({ totalRTP, volatility }) => {
  // Key markets with their requirements
  const markets = [
    { name: 'UK', minRTP: 84, recommendedRTP: 94, volatilityRange: [1, 10], icon: '🇬🇧' },
    { name: 'Malta', minRTP: 85, recommendedRTP: 95, volatilityRange: [1, 10], icon: '🇲🇹' },
    { name: 'Sweden', minRTP: 87, recommendedRTP: 96, volatilityRange: [1, 10], icon: '🇸🇪' },
    { name: 'Italy', minRTP: 90, recommendedRTP: 95, volatilityRange: [1, 8], icon: '🇮🇹' },
    { name: 'Spain', minRTP: 85, recommendedRTP: 95, volatilityRange: [1, 7], icon: '🇪🇸' },
  ];
  
  return (
    <div className="market-requirements p-3">
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Market Compliance</h3>
<div className='bg-white border p-3 rounded-md'>
        <div className="grid grid-cols-3 gap-2">
          {markets.map(market => {
            const rtpCompliant = totalRTP >= market.minRTP;
            const volatilityCompliant = volatility >= market.volatilityRange[0] && volatility <= market.volatilityRange[1];
            const fullyCompliant = rtpCompliant && volatilityCompliant;
            
            return (
              <div 
                key={market.name}
                className={`border rounded-lg p-2 ${
                  fullyCompliant 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium flex items-center">
                    <span className="mr-1">{market.icon}</span>
                    {market.name}
                  </div>
                  {fullyCompliant ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                
                <div className="text-xs grid grid-cols-2 gap-1">
                  <div className={!rtpCompliant ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    Min RTP: {market.minRTP}%
                  </div>
                  <div className={!volatilityCompliant ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    Vol: {market.volatilityRange[0]}-{market.volatilityRange[1]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};

// Import MathAutomation components
import { 
  RTPAutoBalancer, 
  DeepSimulation as DeepSimulationComponent
} from './MathAutomationComponents';

// Main Visual Math Lab Component
const VisualMathLab: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  
  // Default values from config or set defaults
  const initialRTPBase = config?.rtp?.baseRTP || 70;
  const initialRTPFeatures = config?.rtp?.bonusRTP || 20;
  const initialRTPJackpots = config?.rtp?.featureRTP || 6;
  const initialVolatility = config?.rtp?.volatilityScale || 5;
  
  // State for configuration mode (automatic vs manual)
  const [configMode, setConfigMode] = useState<'automatic' | 'manual'>('manual');
  
  // State for bonus feature warning modal
  const [showFeatureWarning, setShowFeatureWarning] = useState<boolean>(false);
  
  // State for RTP distribution validation
  const [rtpDistributionValid, setRtpDistributionValid] = useState<boolean>(true);
  const [rtpValidationMessage, setRtpValidationMessage] = useState<string>('');
  
  // State for RTP distribution
  const [rtpDistribution, setRtpDistribution] = useState({
    baseGame: initialRTPBase,
    features: initialRTPFeatures,
    jackpots: initialRTPJackpots
  });
  
  // Calculate total RTP
  const totalRTP = Object.values(rtpDistribution).reduce((sum, val) => sum + val, 0);
  
  // State for volatility 
  const [volatility, setVolatility] = useState(initialVolatility);
  
  // Generate win distribution based on volatility and selected features
  const generateWinDistribution = (vol: number): WinDistribution[] => {
    // Adjust distribution based on selected features in step 5
    const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
    const hasWheel = config?.bonus?.wheel?.enabled || false;
    const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
    const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
    const hasJackpots = config?.bonus?.jackpots?.enabled || false;
    
    // Get more details about features for fine-tuned adjustments
    const freespinsMultiplier = hasFreespins ? 
      Math.max(...(config?.bonus?.freeSpins?.multipliers || [1])) : 1;
    const freespinsCount = hasFreespins ? 
      (config?.bonus?.freeSpins?.count || 10) : 0;
    
    const wheelMaxMultiplier = hasWheel ? 
      (config?.bonus?.wheel?.maxMultiplier || 50) : 0;
    
    const jackpotLevels = hasJackpots ? 
      (config?.bonus?.jackpots?.levels || ['Minor', 'Major']).length : 0;
    
    // Default distribution based on volatility (without feature adjustments)
    const baseDistribution: WinDistribution[] = [
      { multiplier: '0x', probability: 70 - vol * 2, contribution: 0, color: '#e5e7eb' },
      { multiplier: '1-2x', probability: 15 - vol * 0.5, contribution: 20, color: '#93c5fd' },
      { multiplier: '3-5x', probability: 7 + vol * 0.1, contribution: 25, color: '#60a5fa' },
      { multiplier: '6-10x', probability: 4 + vol * 0.2, contribution: 25, color: '#3b82f6' },
      { multiplier: '11-20x', probability: 2 + vol * 0.3, contribution: 15, color: '#2563eb' },
      { multiplier: '21-50x', probability: 1.2 + vol * 0.4, contribution: 10, color: '#1d4ed8' },
      { multiplier: '51-100x', probability: 0.5 + vol * 0.2, contribution: 3, color: '#1e40af' },
      { multiplier: '101+x', probability: 0.3 + vol * 0.3, contribution: 2, color: '#1e3a8a' }
    ];
    
    // Make sure no probability is negative after volatility adjustment
    let adjustedDistribution = baseDistribution.map(item => ({
      ...item,
      probability: Math.max(0.1, item.probability)
    }));
    
    // Enhanced feature-based adjustments
    // Free spins with detailed adjustments based on multipliers and count
    if (hasFreespins) {
      adjustedDistribution = adjustedDistribution.map((item, idx) => {
        if (idx >= 3 && idx <= 5) {
          // Medium wins increase with free spins
          // Higher multipliers have more impact
          const multiplierImpact = freespinsMultiplier > 3 ? 1.4 : 1.2;
          // More free spins also increase medium wins
          const countImpact = freespinsCount >= 15 ? 1.2 : 1.0;
          
          return {
            ...item,
            probability: item.probability * multiplierImpact * countImpact
          };
        }
        return item;
      });
    }
    
    // Wheel bonus with adjustments based on wheel size and max multiplier
    if (hasWheel) {
      const wheelImpact = wheelMaxMultiplier >= 200 ? 1.5 : 
                        wheelMaxMultiplier >= 100 ? 1.3 : 1.2;
      
      adjustedDistribution = adjustedDistribution.map((item, idx) => {
        if (idx >= 5) {
          // Large wins increase with wheel bonus
          return {
            ...item,
            probability: item.probability * wheelImpact
          };
        }
        return item;
      });
    }
    
    // Pick & Click feature adjustments
    if (hasPickAndClick) {
      const maxPrize = config?.bonus?.pickAndClick?.maxPrize || 100;
      const picks = config?.bonus?.pickAndClick?.picks || 3;
      
      adjustedDistribution = adjustedDistribution.map((item, idx) => {
        // Pick & Click primarily affects medium-sized wins
        if (idx >= 2 && idx <= 4) {
          const pickImpact = picks >= 5 ? 1.3 : 1.1;
          const prizeImpact = maxPrize >= 200 ? 1.2 : 1.0;
          
          return {
            ...item,
            probability: item.probability * pickImpact * prizeImpact
          };
        }
        return item;
      });
    }
    
    // Hold & Spin feature adjustments
    if (hasHoldAndSpin) {
      const gridSize = config?.bonus?.holdAndSpin?.gridSize || [3, 3];
      const positions = gridSize[0] * gridSize[1];
      const maxValue = config?.bonus?.holdAndSpin?.maxSymbolValue || 100;
      
      adjustedDistribution = adjustedDistribution.map((item, idx) => {
        // Hold & Spin primarily affects larger wins
        if (idx >= 4) {
          const sizeImpact = positions >= 12 ? 1.4 : 1.2;
          const valueImpact = maxValue >= 100 ? 1.3 : 1.1;
          
          return {
            ...item,
            probability: item.probability * sizeImpact * valueImpact
          };
        }
        return item;
      });
    }
    
    // Jackpot adjustments based on jackpot levels and type
    if (hasJackpots) {
      const isProgressive = config?.bonus?.jackpots?.type === 'progressive';
      const jackpotImpact = isProgressive ? 2.5 : 2.0;
      const levelImpact = jackpotLevels >= 3 ? 1.2 : 1.0;
      
      adjustedDistribution = adjustedDistribution.map((item, idx) => {
        if (idx === adjustedDistribution.length - 1) {
          // Largest win category increases significantly with jackpots
          return {
            ...item,
            probability: item.probability * jackpotImpact * levelImpact
          };
        }
        return item;
      });
    }
    
    // Normalize probabilities to ensure they sum to 100
    const totalProb = adjustedDistribution.reduce((sum, item) => sum + item.probability, 0);
    
    // Avoid division by zero
    const normalizedDistribution = totalProb > 0 
      ? adjustedDistribution.map(item => ({
          ...item,
          probability: (item.probability / totalProb) * 100
        }))
      : adjustedDistribution;
    
    // Ensure some minimum probability for each category
    return normalizedDistribution.map(item => ({
      ...item,
      probability: Math.max(0.1, item.probability) // Ensure minimum visibility
    }));
  };
  
  const winDistribution = generateWinDistribution(volatility);
  
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
  
  // Run auto-balance when component mounts or when feature selections change
  useEffect(() => {
    // Run auto-balance to reflect selected features
    autoBalanceRTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.bonus?.freeSpins?.enabled,
    config?.bonus?.wheel?.enabled,
    config?.bonus?.pickAndClick?.enabled,
    config?.bonus?.holdAndSpin?.enabled,
    config?.bonus?.jackpots?.enabled
  ]);
  
  // Function to validate RTP distribution
  const validateRTPDistribution = (distribution: Record<string, number>) => {
    const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
    const hasWheel = config?.bonus?.wheel?.enabled || false;
    const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
    const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
    const hasJackpots = config?.bonus?.jackpots?.enabled || false;
    const jackpotType = config?.bonus?.jackpots?.type || 'fixed';
    
    // Calculate total RTP
    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
    
    // Check if total is valid (between 88% and 98%)
    if (total < 88) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Total RTP is below the recommended minimum of 88%');
      return false;
    }
    
    if (total > 98) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Total RTP is very high and may not be economically viable');
      return false;
    }
    
    // Check feature-specific validations
    if (hasFreespins && distribution.features < 10) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Free Spins feature needs higher RTP allocation for optimal player experience');
      // Show warning modal if features allocation is significantly below recommendation
      if (distribution.features < 8) {
        setShowFeatureWarning(true);
      }
      return false;
    }
    
    if (hasHoldAndSpin && distribution.features < 15) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Hold & Spin feature typically requires higher RTP allocation');
      // Show warning modal if features allocation is significantly below recommendation
      if (distribution.features < 12) {
        setShowFeatureWarning(true);
      }
      return false;
    }
    
    if (hasJackpots && jackpotType === 'progressive' && distribution.jackpots < 5) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Progressive jackpots typically require higher RTP allocation');
      return false;
    }
    
    // If base game RTP is too low
    if (distribution.baseGame < 50) {
      setRtpDistributionValid(false);
      setRtpValidationMessage('Base game RTP should be at least 50% of total RTP for balanced gameplay');
      return false;
    }
    
    // If all validations pass
    setRtpDistributionValid(true);
    setRtpValidationMessage('');
    return true;
  };

  // Function to handle RTP distribution changes
  const handleRTPDistributionChange = (newDistribution: Record<string, number>) => {
    setRtpDistribution(newDistribution);
    validateRTPDistribution(newDistribution);
  };
  
  // Auto-balance function that considers selected features from step 5
  const autoBalanceRTP = () => {
    // Check which features are enabled in step 5
    const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
    const hasWheel = config?.bonus?.wheel?.enabled || false;
    const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
    const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
    const hasJackpots = config?.bonus?.jackpots?.enabled || false;
    
    // Calculate feature contribution based on enabled features
    let featuresPercentage = 0; // Start with zero
    
    // Only add feature RTP if at least one feature is enabled
    if (hasFreespins || hasWheel || hasPickAndClick || hasHoldAndSpin) {
      featuresPercentage = 22; // Base percentage with features
      
      // Add specific feature contributions
      if (hasFreespins) featuresPercentage += 6;
      if (hasWheel) featuresPercentage += 4;
      if (hasPickAndClick) featuresPercentage += 3;
      if (hasHoldAndSpin) featuresPercentage += 5;
    } else {
      // No features selected, lower percentage for feature contribution
      featuresPercentage = 10;
    }
    
    // If no features are enabled, don't allocate much to features segment
    if (!hasFreespins && !hasWheel && !hasPickAndClick && !hasHoldAndSpin) {
      featuresPercentage = Math.min(featuresPercentage, 10);
    }
    
    // Calculate jackpots percentage - more precise handling
    let jackpotsPercentage = 0;
    if (hasJackpots) {
      // Check jackpot type and levels for more precise RTP allocation
      const jackpotType = config?.bonus?.jackpots?.type || 'fixed';
      const jackpotLevels = config?.bonus?.jackpots?.levels || ['Minor', 'Major'];
      
      // Progressive jackpots contribute more to RTP than fixed
      if (jackpotType === 'progressive') {
        jackpotsPercentage = 8 + (jackpotLevels.length * 1);
      } else {
        jackpotsPercentage = 6 + (jackpotLevels.length * 0.5);
      }
    } else {
      // No jackpots selected, minimal allocation
      jackpotsPercentage = 1; // Minimal allocation when not enabled
    }
    
    // Adjust based on volatility - higher volatility = more in features/jackpots
    let baseGamePercent;
    if (volatility <= 3) { // Low volatility
      baseGamePercent = 100 - featuresPercentage - jackpotsPercentage + 5; // More in base game
    } else if (volatility <= 7) { // Medium volatility
      baseGamePercent = 100 - featuresPercentage - jackpotsPercentage; // Balanced
    } else { // High volatility
      baseGamePercent = 100 - featuresPercentage - jackpotsPercentage - 5; // Less in base game, more in features
    }
    
    // Target 96% total RTP
    const targetTotal = 96;
    
    // Calculate new values with proper rounding
    const newDistribution = {
      baseGame: Math.round((baseGamePercent / 100) * targetTotal * 10) / 10,
      features: Math.round((featuresPercentage / 100) * targetTotal * 10) / 10,
      jackpots: Math.round((jackpotsPercentage / 100) * targetTotal * 10) / 10
    };
    
    // Ensure total is exactly 96%
    const calculatedTotal = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
    if (calculatedTotal !== targetTotal) {
      // Adjust baseGame to make total exactly match target
      newDistribution.baseGame += (targetTotal - calculatedTotal);
    }
    
    // Special handling if jackpots are not enabled - redistribute jackpot RTP
    if (!hasJackpots && newDistribution.jackpots > 1) {
      // Take most of jackpot percentage and put it into base game
      const jackpotRedistribute = newDistribution.jackpots - 1;
      newDistribution.jackpots = 1;
      newDistribution.baseGame += jackpotRedistribute;
    }
    
    // Apply appropriate constraints to ensure these values are reasonable
    // Ensure baseGame is at least 50% of total
    if (newDistribution.baseGame < 50) {
      const deficit = 50 - newDistribution.baseGame;
      newDistribution.baseGame = 50;
      // Take proportionally from features and jackpots
      const featureRatio = newDistribution.features / (newDistribution.features + newDistribution.jackpots);
      newDistribution.features -= deficit * featureRatio;
      newDistribution.jackpots -= deficit * (1 - featureRatio);
    }
    
    // Ensure all values are properly rounded
    newDistribution.baseGame = Math.round(newDistribution.baseGame * 10) / 10;
    newDistribution.features = Math.round(newDistribution.features * 10) / 10;
    newDistribution.jackpots = Math.round(newDistribution.jackpots * 10) / 10;
    
    setRtpDistribution(newDistribution);
    
    // Validate the new distribution
    validateRTPDistribution(newDistribution);
  };
  
  // Manual Configuration Content
  const renderManualConfiguration = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        <div className="bg-white p-3 border rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-md font-bold text-gray-800 flex items-center">
              {/* <Calculator className=" mr-2 text-blue-600" /> */}
              RTP Designer
            </h3>
            <button
              onClick={autoBalanceRTP}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Auto-Balance
            </button>
          </div>
          
          <RTPDistribution
            rtpDistribution={rtpDistribution}
            totalRTP={totalRTP}
            onDistributionChange={handleRTPDistributionChange}
            config={config}
            rtpDistributionValid={rtpDistributionValid}
            validationMessage={rtpValidationMessage}
          />
        </div>
        
        <div className="bg-white border p-3 rounded-xl shadow-sm">
          <h3 className="text-md font-bold text-gray-800 flex items-center mb-4">
            {/* <Thermometer className="w-6 h-6 mr-2 text-blue-600" /> */}
            Volatility Tuner
          </h3>
          
          <VolatilityControl
            volatility={volatility}
            setVolatility={setVolatility}
            winDistribution={winDistribution}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
        <div className="bg-white border  rounded-xl shadow-sm lg:col-span-6">
         
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Symbol Matrix</h3>
              </div>
            </div>
          
           <div className='p-4 '>
          <SymbolValueMatrix
            volatility={volatility}
            rtpDistribution={rtpDistribution}
          />
        </div>
        </div>
        <div className="bg-white border rounded-xl shadow-sm lg:col-span-6">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors mb-3"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Game Analysis</h3>
              </div>
            </div>
         
          
          <div className="space-y-6">
            <RiskAssessment
              volatility={volatility}
              rtpDistribution={rtpDistribution}
              totalRTP={totalRTP}
            />
            
            <MarketRequirements
              totalRTP={totalRTP}
              volatility={volatility}
            />
          </div>
        </div>
      </div>
    </>
  );
  
  // State for automated mode
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTarget, setOptimizationTarget] = useState('balanced');
  
  // Automatic Configuration Content
  const renderAutomaticConfiguration = () => {
    // Get feature-specific data for feature-aware optimizations
    const wheelMaxMultiplier = config?.bonus?.wheel?.maxMultiplier || 50;
    
    // Function to run the automated symbol weight optimization
    const runSymbolOptimization = () => {
      setIsOptimizing(true);
      
      // Simulate optimization process
      setTimeout(() => {
        setIsOptimizing(false);
        // Visual feedback would be shown by the component
      }, 1500);
    };
    
    // Get the list of enabled features for display
    const enabledFeatures = [];
    if (config?.bonus?.freeSpins?.enabled) enabledFeatures.push('Free Spins');
    if (config?.bonus?.wheel?.enabled) enabledFeatures.push('Wheel Bonus');
    if (config?.bonus?.pickAndClick?.enabled) enabledFeatures.push('Pick & Click');
    if (config?.bonus?.holdAndSpin?.enabled) enabledFeatures.push('Hold & Spin');
    if (config?.bonus?.jackpots?.enabled) enabledFeatures.push('Jackpots');
    
    return (
      <div className="space-y-8">
        {/* Feature detection notification */}
        {enabledFeatures.length > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
              <Info className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-red-800 font-medium">Features Detected from Step 5</h4>
              <p className="text-sm text-red-600 mt-1">
                Math models have been adjusted to account for: {enabledFeatures.join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
            <div className="bg-yellow-100 rounded-full p-2 mr-3 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="text-yellow-800 font-medium">No Bonus Features Detected</h4>
              <p className="text-sm text-yellow-600 mt-1">
                No bonus features were selected in Step 5. Math models are optimized for base game play.
              </p>
            </div>
          </div>
        )}
      
        {/* RTP Auto-Balancer Component from MathAutomationComponents */}
        <RTPAutoBalancer
          rtpDistribution={rtpDistribution}
          totalRTP={totalRTP}
          onRTPChange={handleRTPDistributionChange}
          volatility={volatility}
        />
        
        {/* Symbol Weight Optimizer */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
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
                onClick={runSymbolOptimization}
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
          
          {/* Feature-aware information panel */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Feature-Based Optimization
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Enabled Features</h5>
                <ul className="text-sm space-y-1">
                  {config?.bonus?.freeSpins?.enabled && 
                    <li className="flex items-center text-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Free Spins
                    </li>
                  }
                  {config?.bonus?.wheel?.enabled && 
                    <li className="flex items-center text-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Wheel Feature
                    </li>
                  }
                  {config?.bonus?.pickAndClick?.enabled && 
                    <li className="flex items-center text-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pick & Click
                    </li>
                  }
                  {config?.bonus?.holdAndSpin?.enabled && 
                    <li className="flex items-center text-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Hold & Spin
                    </li>
                  }
                  {config?.bonus?.jackpots?.enabled && 
                    <li className="flex items-center text-blue-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Jackpot System
                    </li>
                  }
                  {!config?.bonus?.freeSpins?.enabled && 
                   !config?.bonus?.wheel?.enabled && 
                   !config?.bonus?.pickAndClick?.enabled && 
                   !config?.bonus?.holdAndSpin?.enabled && 
                   !config?.bonus?.jackpots?.enabled && 
                    <li className="text-gray-500 italic">No bonus features enabled</li>
                  }
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Optimization Strategy</h5>
                <p className="text-sm text-gray-600">
                  {optimizationTarget === 'balanced' && 
                    "Balanced approach for even distribution of RTP across all segments"
                  }
                  {optimizationTarget === 'hit-frequency' && 
                    "Focused on increasing hit frequency for better player retention"
                  }
                  {optimizationTarget === 'high-volatility' && 
                    "Optimized for high volatility with larger, less frequent wins"
                  }
                  {optimizationTarget === 'feature-focus' && 
                    "Prioritizes feature triggers for more bonus game interaction"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Symbol weight visual representation - responsive to optimization target */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Optimized Symbol Distribution
            </h5>
            
            {optimizationTarget === 'balanced' && (
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  {/* Adjust percentages based on enabled features */}
                  <div 
                    style={{ 
                      width: `${config?.bonus?.jackpots?.enabled ? 9 : 8}%`, 
                      backgroundColor: '#F59E0B' 
                    }} 
                    className="h-full" 
                    title={`WILD: ${config?.bonus?.jackpots?.enabled ? 9 : 8}%`} 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.freeSpins?.enabled ? 6 : 5}%`, 
                      backgroundColor: '#8B5CF6' 
                    }} 
                    className="h-full" 
                    title={`SCATTER: ${config?.bonus?.freeSpins?.enabled ? 6 : 5}%`} 
                  />
                  <div 
                    style={{ 
                      width: `${(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 28 : 27}%`, 
                      backgroundColor: '#3B82F6' 
                    }} 
                    className="h-full" 
                    title={`HIGH SYMBOLS: ${(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 28 : 27}%`} 
                  />
                  <div 
                    style={{ 
                      width: '25%', 
                      backgroundColor: '#10B981' 
                    }} 
                    className="h-full" 
                    title="MEDIUM SYMBOLS: 25%" 
                  />
                  <div 
                    style={{ 
                      width: `${(config?.bonus?.jackpots?.enabled || config?.bonus?.freeSpins?.enabled || 
                        config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 32 : 35}%`, 
                      backgroundColor: '#6B7280' 
                    }} 
                    className="h-full" 
                    title={`LOW SYMBOLS: ${(config?.bonus?.jackpots?.enabled || config?.bonus?.freeSpins?.enabled || 
                      config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 32 : 35}%`} 
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Special Symbols ({config?.bonus?.freeSpins?.enabled || config?.bonus?.jackpots?.enabled ? 15 : 13}%)
                  </span>
                  <span>
                    High Pay ({(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 28 : 27}%)
                  </span>
                  <span>
                    Medium/Low Pay ({(config?.bonus?.jackpots?.enabled || config?.bonus?.freeSpins?.enabled || 
                      config?.bonus?.holdAndSpin?.enabled || config?.bonus?.wheel?.enabled) ? 57 : 60}%)
                  </span>
                </div>
                {(config?.bonus?.freeSpins?.enabled || config?.bonus?.jackpots?.enabled) && (
                  <div className="text-xs text-blue-600 font-medium">
                    Adjusted distribution for {config?.bonus?.freeSpins?.enabled ? 'Free Spins' : ''} 
                    {config?.bonus?.freeSpins?.enabled && config?.bonus?.jackpots?.enabled ? ' and ' : ''}
                    {config?.bonus?.jackpots?.enabled ? 'Jackpots' : ''}
                  </div>
                )}
              </div>
            )}
            
            {optimizationTarget === 'hit-frequency' && (
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ 
                      width: `${config?.bonus?.holdAndSpin?.enabled ? 12 : 10}%`, 
                      backgroundColor: '#F59E0B' 
                    }} 
                    className="h-full" 
                    title={`WILD: ${config?.bonus?.holdAndSpin?.enabled ? 12 : 10}%`} 
                  />
                  <div 
                    style={{ 
                      width: '4%', 
                      backgroundColor: '#8B5CF6' 
                    }} 
                    className="h-full" 
                    title="SCATTER: 4%" 
                  />
                  <div 
                    style={{ 
                      width: '22%', 
                      backgroundColor: '#3B82F6' 
                    }} 
                    className="h-full" 
                    title="HIGH SYMBOLS: 22%" 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.pickAndClick?.enabled ? 30 : 28}%`, 
                      backgroundColor: '#10B981' 
                    }} 
                    className="h-full" 
                    title={`MEDIUM SYMBOLS: ${config?.bonus?.pickAndClick?.enabled ? 30 : 28}%`} 
                  />
                  <div 
                    style={{ 
                      width: `${(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.pickAndClick?.enabled) ? 32 : 36}%`, 
                      backgroundColor: '#6B7280' 
                    }} 
                    className="h-full" 
                    title={`LOW SYMBOLS: ${(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.pickAndClick?.enabled) ? 32 : 36}%`} 
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Special Symbols ({config?.bonus?.holdAndSpin?.enabled ? 16 : 14}%)
                  </span>
                  <span>
                    High Pay (22%)
                  </span>
                  <span>
                    Medium/Low Pay ({(config?.bonus?.holdAndSpin?.enabled || config?.bonus?.pickAndClick?.enabled) ? 62 : 64}%)
                  </span>
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {config?.bonus?.holdAndSpin?.enabled 
                    ? "Significantly boosted wild frequency for Hold & Spin triggers" 
                    : "Increased wild frequency for higher hit rate"}
                </div>
              </div>
            )}
            
            {optimizationTarget === 'high-volatility' && (
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ 
                      width: '6%', 
                      backgroundColor: '#F59E0B' 
                    }} 
                    className="h-full" 
                    title="WILD: 6%" 
                  />
                  <div 
                    style={{ 
                      width: '3%', 
                      backgroundColor: '#8B5CF6' 
                    }} 
                    className="h-full" 
                    title="SCATTER: 3%" 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 15 : 18}%`, 
                      backgroundColor: '#3B82F6' 
                    }} 
                    className="h-full" 
                    title={`HIGH SYMBOLS: ${config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 15 : 18}%`} 
                  />
                  <div 
                    style={{ 
                      width: '22%', 
                      backgroundColor: '#10B981' 
                    }} 
                    className="h-full" 
                    title="MEDIUM SYMBOLS: 22%" 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 54 : 
                        config?.bonus?.wheel?.enabled && config?.bonus?.wheel?.maxMultiplier > 200 ? 56 : 51}%`, 
                      backgroundColor: '#6B7280' 
                    }} 
                    className="h-full" 
                    title={`LOW SYMBOLS: ${config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 54 : 
                      config?.bonus?.wheel?.enabled && config?.bonus?.wheel?.maxMultiplier > 200 ? 56 : 51}%`} 
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Special Symbols (9%)
                  </span>
                  <span>
                    High Pay ({config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 15 : 18}%)
                  </span>
                  <span>
                    Medium/Low Pay ({config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive' ? 76 : 
                      config?.bonus?.wheel?.enabled && config?.bonus?.wheel?.maxMultiplier > 200 ? 78 : 73}%)
                  </span>
                </div>
                <div className="text-xs text-purple-600 font-medium">
                  {config?.bonus?.jackpots?.enabled && config?.bonus?.jackpots?.type === 'progressive'
                    ? "Extreme volatility adjusted for progressive jackpot system" 
                    : config?.bonus?.wheel?.enabled && config?.bonus?.wheel?.maxMultiplier > 200
                      ? "High wheel prizes require increased volatility" 
                      : "Reduced premium symbols for higher volatility"}
                </div>
              </div>
            )}
            
            {optimizationTarget === 'feature-focus' && (
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    style={{ 
                      width: '7%', 
                      backgroundColor: '#F59E0B' 
                    }} 
                    className="h-full" 
                    title="WILD: 7%" 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.freeSpins?.enabled ? 
                        (config?.bonus?.freeSpins?.multipliers && Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? 10 : 
                         config?.bonus?.freeSpins?.count >= 15 ? 9 : 8) : 8}%`, 
                      backgroundColor: '#8B5CF6' 
                    }} 
                    className="h-full" 
                    title={`SCATTER: ${config?.bonus?.freeSpins?.enabled ? 
                      (config?.bonus?.freeSpins?.multipliers && Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? 10 : 
                       config?.bonus?.freeSpins?.count >= 15 ? 9 : 8) : 8}%`} 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.holdAndSpin?.enabled ? 
                        (config?.bonus?.holdAndSpin?.gridSize && config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 ? 23 : 21) : 20}%`, 
                      backgroundColor: '#3B82F6' 
                    }} 
                    className="h-full" 
                    title={`HIGH SYMBOLS: ${config?.bonus?.holdAndSpin?.enabled ? 
                      (config?.bonus?.holdAndSpin?.gridSize && config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 ? 23 : 21) : 20}%`} 
                  />
                  <div 
                    style={{ 
                      width: '25%', 
                      backgroundColor: '#10B981' 
                    }} 
                    className="h-full" 
                    title="MEDIUM SYMBOLS: 25%" 
                  />
                  <div 
                    style={{ 
                      width: `${config?.bonus?.freeSpins?.enabled && config?.bonus?.freeSpins?.multipliers && 
                        Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? 33 : 
                        config?.bonus?.holdAndSpin?.enabled && config?.bonus?.holdAndSpin?.gridSize && 
                        config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 ? 35 : 40}%`, 
                      backgroundColor: '#6B7280' 
                    }} 
                    className="h-full" 
                    title={`LOW SYMBOLS: ${config?.bonus?.freeSpins?.enabled && config?.bonus?.freeSpins?.multipliers && 
                      Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? 33 : 
                      config?.bonus?.holdAndSpin?.enabled && config?.bonus?.holdAndSpin?.gridSize && 
                      config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 ? 35 : 40}%`} 
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Special Symbols ({config?.bonus?.freeSpins?.enabled && 
                      config?.bonus?.freeSpins?.multipliers && Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? 17 : 15}%)
                  </span>
                  <span>
                    High Pay ({config?.bonus?.holdAndSpin?.enabled ? 
                      (config?.bonus?.holdAndSpin?.gridSize && config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 ? 23 : 21) : 20}%)
                  </span>
                  <span>
                    Medium/Low Pay ({config?.bonus?.freeSpins?.enabled || config?.bonus?.holdAndSpin?.enabled ? 60 : 65}%)
                  </span>
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  {config?.bonus?.freeSpins?.enabled && config?.bonus?.freeSpins?.multipliers && 
                   Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3
                    ? "Boosted scatter weight for high multiplier free spins" 
                    : config?.bonus?.holdAndSpin?.enabled
                      ? "Balanced distribution for optimal Hold & Spin triggers" 
                      : "Increased scatter frequency for more feature triggers"}
                </div>
              </div>
            )}
          </div>
          
          {/* Feature-specific optimizations */}
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Feature-Specific Optimizations
            </h5>
            <div className="space-y-2 text-sm">
              {config?.bonus?.freeSpins?.enabled && (
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-medium">Free Spins:</span> Scatter symbols weight adjusted to achieve 1:{Math.round(160 - volatility * 5)} feature trigger rate
                  {config?.bonus?.freeSpins?.multipliers && Math.max(...config?.bonus?.freeSpins?.multipliers) > 1 && (
                    <div className="mt-1 text-xs text-blue-600">
                      ✓ {Math.max(...config?.bonus?.freeSpins?.multipliers)}x multiplier {Math.max(...config?.bonus?.freeSpins?.multipliers) >= 3 ? "significantly increases" : "increases"} feature value
                    </div>
                  )}
                  {(config?.bonus?.freeSpins?.count || 10) >= 15 && (
                    <div className="mt-1 text-xs text-blue-600">
                      ✓ {config?.bonus?.freeSpins?.count || 10} free spins optimized for extended play sessions
                    </div>
                  )}
                </div>
              )}
              {config?.bonus?.wheel?.enabled && (
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-medium">Wheel Bonus:</span> Symbol values optimized for {(config?.bonus?.wheel?.maxMultiplier || 50) >= 200 ? "high-volatility" : "balanced"} wheel outcome distribution
                  {(config?.bonus?.wheel?.maxMultiplier || 50) >= 200 && (
                    <div className="mt-1 text-xs text-green-600">
                      ✓ High wheel prizes ({config?.bonus?.wheel?.maxMultiplier || 50}x) require special volatility adjustments
                    </div>
                  )}
                  {config?.bonus?.wheel?.levelUp && (
                    <div className="mt-1 text-xs text-green-600">
                      ✓ Level-up mechanic integrated with multi-tier payouts
                    </div>
                  )}
                </div>
              )}
              {config?.bonus?.pickAndClick?.enabled && (
                <div className="p-2 bg-purple-50 rounded">
                  <span className="font-medium">Pick & Click:</span> Wild distribution increased to optimize feature trigger rate
                  {config?.bonus?.pickAndClick?.gridSize && 
                    config?.bonus?.pickAndClick?.gridSize[0] * config?.bonus?.pickAndClick?.gridSize[1] > 9 && (
                    <div className="mt-1 text-xs text-purple-600">
                      ✓ Larger grid size ({config?.bonus?.pickAndClick?.gridSize[0]}x{config?.bonus?.pickAndClick?.gridSize[1]}) requires adjusted symbol weights
                    </div>
                  )}
                  {(config?.bonus?.pickAndClick?.picks || 3) > 3 && (
                    <div className="mt-1 text-xs text-purple-600">
                      ✓ Higher initial picks ({config?.bonus?.pickAndClick?.picks || 3}) balanced for optimal RTP distribution
                    </div>
                  )}
                </div>
              )}
              {config?.bonus?.holdAndSpin?.enabled && (
                <div className="p-2 bg-indigo-50 rounded">
                  <span className="font-medium">Hold & Spin:</span> Premium symbol frequency adjusted for optimal feature engagement
                  {config?.bonus?.holdAndSpin?.gridSize && 
                    config?.bonus?.holdAndSpin?.gridSize[0] * config?.bonus?.holdAndSpin?.gridSize[1] > 9 && (
                    <div className="mt-1 text-xs text-indigo-600">
                      ✓ {config?.bonus?.holdAndSpin?.gridSize[0]}x{config?.bonus?.holdAndSpin?.gridSize[1]} grid optimized with higher premium symbol weights
                    </div>
                  )}
                  {(config?.bonus?.holdAndSpin?.maxSymbolValue || 0) >= 100 && (
                    <div className="mt-1 text-xs text-indigo-600">
                      ✓ High max symbol value ({config?.bonus?.holdAndSpin?.maxSymbolValue}x) requires volatility adjustments
                    </div>
                  )}
                </div>
              )}
              {config?.bonus?.jackpots?.enabled && (
                <div className="p-2 bg-amber-50 rounded">
                  <span className="font-medium">Jackpot System:</span> Symbol weights configured for {config?.bonus?.jackpots?.type === 'progressive' ? "progressive" : "fixed"} jackpot trigger mechanism
                  {config?.bonus?.jackpots?.type === 'progressive' && (
                    <div className="mt-1 text-xs text-amber-600">
                      ✓ Progressive jackpots require higher volatility adjustments
                    </div>
                  )}
                  {config?.bonus?.jackpots?.levels && config?.bonus?.jackpots?.levels.length > 2 && (
                    <div className="mt-1 text-xs text-amber-600">
                      ✓ Multi-level jackpot system ({config?.bonus?.jackpots?.levels.length} levels) with balanced trigger rates
                    </div>
                  )}
                </div>
              )}
              
              {/* Show no features message if none are enabled */}
              {!config?.bonus?.freeSpins?.enabled && 
               !config?.bonus?.wheel?.enabled && 
               !config?.bonus?.pickAndClick?.enabled && 
               !config?.bonus?.holdAndSpin?.enabled && 
               !config?.bonus?.jackpots?.enabled && (
                
                  <div
                    className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3  text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="">
                      <span className="font-medium">No Bonus Features:</span> Symbol weights optimized for base game performance
                  <div className="mt-1 text-xs text-gray-600">
                    ✓ Base game focused with balanced hit frequency and RTP distribution
                  </div>
                    </div>
                  
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Deep Simulation System */}
        <DeepSimulationComponent
          rtpDistribution={rtpDistribution}
          totalRTP={totalRTP}
          volatility={volatility}
        />
      </div>
    );
  };
  
  // Feature warning modal
  const renderFeatureWarningModal = () => {
    if (!showFeatureWarning) return null;
    
    // Get enabled features for display
    const hasFreespins = config?.bonus?.freeSpins?.enabled || false;
    const hasWheel = config?.bonus?.wheel?.enabled || false;
    const hasPickAndClick = config?.bonus?.pickAndClick?.enabled || false;
    const hasHoldAndSpin = config?.bonus?.holdAndSpin?.enabled || false;
    
    // Get the feature that's most affected (lowest RTP allocation compared to recommendation)
    let criticalFeature = '';
    if (hasFreespins && rtpDistribution.features < 8) {
      criticalFeature = 'Free Spins';
    } else if (hasHoldAndSpin && rtpDistribution.features < 12) {
      criticalFeature = 'Hold & Spin';
    } else if (hasWheel && rtpDistribution.features < 10) {
      criticalFeature = 'Wheel Bonus';
    } else if (hasPickAndClick && rtpDistribution.features < 8) {
      criticalFeature = 'Pick & Click';
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex items-start mb-4">
            <div className="bg-amber-100 p-2 rounded-full mr-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Feature RTP Warning</h3>
              <p className="text-gray-600 mt-1">
                Your RTP allocation for bonus features is too low for optimal player experience.
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4">
            <p className="text-sm text-amber-800">
              <span className="font-bold">{criticalFeature}</span> feature typically requires a higher RTP allocation 
              to provide meaningful wins and maintain player engagement.
            </p>
            <p className="text-sm text-amber-700 mt-2">
              Current feature RTP: <span className="font-bold">{rtpDistribution.features.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-amber-700">
              Recommended minimum: <span className="font-bold">
                {criticalFeature === 'Hold & Spin' ? '15.0%' : '10.0%'}
              </span>
            </p>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => setShowFeatureWarning(false)}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="visual-math-lab">
      {renderFeatureWarningModal()}
      
      
      {/* Configuration Mode Selector */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-white p-2 gap-2 rounded-lg shadow-sm flex">
          <button
            onClick={() => setConfigMode('automatic')}
            className={`flex-1 py-2 rounded-md text-center transition-colors ${
              configMode === 'automatic' 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Automated
          </button>
          <button
            onClick={() => setConfigMode('manual')}
            className={`flex-1 py-2 rounded-md text-center transition-colors ${
              configMode === 'manual' 
                ? 'bg-blue-600 text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manual
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {configMode === 'automatic' 
            ? 'Automated mode balances RTP and optimizes math model automatically' 
            : 'Manual mode gives you complete control over all math parameters'}
        </p>
      </div>
      
      {/* Render different content based on configuration mode */}
      {configMode === 'manual' ? renderManualConfiguration() : renderAutomaticConfiguration()}
    </div>
  );
};

export default VisualMathLab;