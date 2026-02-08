import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '../store';
import { 
  Info, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertCircle,
  BarChart2,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  FastForward,
  X,
  Target,
  LineChart,
  PieChart as PieChartIcon,
  Zap,
  TrendingUp,
  Award,
  Calculator,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  CartesianGrid
} from 'recharts';
import clsx from 'clsx';

const MathModel: React.FC = () => {
  const { config, updateConfig, setStep } = useGameStore();
  const [expandedSections, setExpandedSections] = useState<string[]>(['volatility', 'distribution', 'simulation', 'rtp-breakdown']);
  
  // Use state to manage multiple RTP selections
  const [selectedRtps, setSelectedRtps] = useState<number[]>(config.mathModel?.rtpOptions || [96]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [simulationStats, setSimulationStats] = useState({
    maxWin: 0,
    averageWin: 0,
    spinsPlayed: 0,
    hitRate: 0,
    rtpAchieved: 0
  });
  
  // Game-like UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Steps for the game-like math configuration
  const steps = [
    { 
      id: 'intro', 
      title: 'Math Laboratory', 
      description: 'Welcome to the Math Lab! Let\'s fine-tune the mathematics of your game.'
    },
    { 
      id: 'volatility', 
      title: 'Volatility Settings', 
      description: 'Adjust how risky vs. predictable your game feels to players'
    },
    { 
      id: 'rtp', 
      title: 'RTP Configuration', 
      description: 'Set the return-to-player percentages for different markets'
    },
    { 
      id: 'win-distribution', 
      title: 'Win Distribution', 
      description: 'Configure how wins are distributed across different sizes'
    },
    { 
      id: 'maxwin', 
      title: 'Maximum Win Potential', 
      description: 'Set the highest possible win for your game'
    },
    { 
      id: 'simulation', 
      title: 'Test Your Math', 
      description: 'Run simulations to verify your math model works as expected'
    }
  ];
  
  // Navigate to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Validate current step before proceeding
      if (validateCurrentStep()) {
        // Add current step to completed steps if not already there
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps([...completedSteps, currentStep]);
        }
        
        // Add haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
        
        // Actually go to the next math step
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError(null);
      }
    } else {
      // Only when we finish all math steps, go to the Symbols tab
      setStep(4); // Go to Symbols tab (index 4)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };
  
  // Validate current step before allowing navigation
  const validateCurrentStep = () => {
    switch(currentStep) {
      case 0: // Intro - always valid
        return true;
      case 1: // Volatility
        if (!config.mathModel?.volatilityValue) {
          setError('Please set a volatility level before continuing');
          return false;
        }
        return true;
      case 2: // RTP
        if (!selectedRtps || selectedRtps.length === 0) {
          setError('Please select at least one RTP value');
          return false;
        }
        return true;
      default:
        return true;
    }
  };
  
  // Mark a step as completed
  const completeStep = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(f => f !== section)
        : [...prev, section]
    );
  };
  
  // Calculate the actual RTP based on all game parameters
  const calculateActualRtp = useCallback(() => {
    // Target RTP (the selected value) is used as a guide
    const targetRtp = config.mathModel?.rtp || 96;
    
    // Calculate base game RTP from fundamental game elements
    
    // 1. Symbol configuration
    const symbolCount = config.reels?.symbols?.list?.length || 10;
    const hasWild = config.reels?.symbols?.wilds > 0;
    const hasScatter = config.reels?.symbols?.scatters > 0;
    
    // Optimal symbol count is 8-12 symbols
    // Too few symbols makes wins too frequent and reduces RTP control
    // Too many symbols makes wins too rare and decreases player engagement
    let symbolCountFactor = 1.0;
    if (symbolCount < 8) {
      symbolCountFactor = 0.97 + (symbolCount - 6) * 0.01; // Penalty for too few symbols
    } else if (symbolCount > 12) {
      symbolCountFactor = 0.99 - (symbolCount - 12) * 0.005; // Penalty for too many symbols
    }
    
    // 2. Grid configuration affects RTP 
    const reelsCount = config.reels?.layout?.reels || 5;
    const rowsCount = config.reels?.layout?.rows || 3;
    const gridSize = reelsCount * rowsCount;
    
    // Standard 5x3 grid is baseline
    const gridFactor = Math.min(1.02, Math.max(0.98, (gridSize / 15))); 
    
    // 3. Pay mechanism affects RTP calculation
    const payMechanism = config.reels?.payMechanism || 'betlines';
    const betlines = config.reels?.betlines || 20;
    
    // Different pay mechanisms have different baseline RTPs
    let payMechanismFactor = 1.0;
    if (payMechanism === 'ways') {
      payMechanismFactor = 1.02; // Ways pays tend to have slightly higher RTP
    } else if (payMechanism === 'cluster') {
      payMechanismFactor = 1.01; // Cluster pays slightly higher
    } else {
      // Betlines - depends on number of lines
      if (betlines < 10) {
        payMechanismFactor = 0.98; // Few betlines lower RTP
      } else if (betlines > 30) {
        payMechanismFactor = 1.015; // Many betlines higher RTP
      }
    }
    
    // 4. Symbol weights - we don't have exact weights, but we can approximate
    // based on volatility settings
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    
    // Volatility affects symbol distribution on reels - higher volatility 
    // means rarer high-paying symbols
    let volatilityFactor = 1.0;
    if (volatilityValue <= 3) { 
      // Low volatility - more balanced symbol distribution
      volatilityFactor = 1.01;
    } else if (volatilityValue >= 8) {
      // High volatility - more skewed symbol distribution
      volatilityFactor = 0.99;
    }
    
    // 5. Paytable values - approximated by volatility
    // Higher volatility means higher top prizes but more variance
    let paytableFactor = 1.0;
    if (volatilityValue <= 3) {
      // Low volatility - lower top pays, more consistent small/medium wins
      paytableFactor = 0.99;
    } else if (volatilityValue >= 8) {
      // High volatility - higher top pays, fewer small/medium wins
      paytableFactor = 1.01;
    }
    
    // 6. Special symbols impact
    const specialSymbolsFactor = 1.0 + (hasWild ? 0.01 : 0) + (hasScatter ? 0.01 : 0);
    
    // Calculate base game RTP from all these factors
    // Start with the target RTP and adjust based on all factors
    const baseGameRtp = targetRtp * symbolCountFactor * gridFactor * 
                      payMechanismFactor * volatilityFactor * 
                      paytableFactor * specialSymbolsFactor;
    
    // Now calculate bonus feature contributions to RTP
    let bonusFeatureRtp = 0;
    
    // Free Spins contribution
    if (config.bonus?.freeSpins?.enabled) {
      const multiplier = Math.max(...(config.bonus.freeSpins.multipliers || [1]));
      const spinsCount = config.bonus.freeSpins.count || 10;
      const retriggerable = config.bonus.freeSpins.retriggers || false;
      
      // Calculate free spins contribution - more complex features add more RTP
      let freeSpinContribution = spinsCount * 0.2; // Base contribution
      freeSpinContribution *= multiplier; // Multiplier increases RTP linearly
      if (retriggerable) freeSpinContribution *= 1.2; // Retriggers add 20% more value
      
      bonusFeatureRtp += freeSpinContribution;
    }

    // Pick & Click contribution
    if (config.bonus?.pickAndClick?.enabled) {
      const picks = config.bonus.pickAndClick.picks || 3;
      const maxPrize = config.bonus.pickAndClick.maxPrize || 100;
      const hasExtraPicks = config.bonus.pickAndClick.extraPicks || false;
      const hasMultipliers = config.bonus.pickAndClick.multipliers || false;
      
      // Base contribution from picks and max prize
      let pickContribution = (picks * maxPrize * 0.02);
      
      // Additional features increase RTP
      if (hasExtraPicks) pickContribution *= 1.15; // Extra picks add 15% value
      if (hasMultipliers) pickContribution *= 1.2; // Multipliers add 20% value
      
      bonusFeatureRtp += pickContribution;
    }

    // Wheel Bonus contribution
    if (config.bonus?.wheel?.enabled) {
      const segments = config.bonus.wheel.segments || 8;
      const maxMultiplier = config.bonus.wheel.maxMultiplier || 50;
      const hasLevelUp = config.bonus.wheel.levelUp || false;
      const hasRespin = config.bonus.wheel.respin || false;
      
      // Base contribution from wheel
      let wheelContribution = maxMultiplier * 0.1;
      
      // More segments = more balanced distribution
      wheelContribution *= (12 / Math.max(6, segments)); // Normalize for segment count
      
      // Additional features
      if (hasLevelUp) wheelContribution *= 1.3; // Level up adds 30% more value
      if (hasRespin) wheelContribution *= 1.2; // Respin adds 20% more value
      
      bonusFeatureRtp += wheelContribution;
    }

    // Hold & Spin contribution
    if (config.bonus?.holdAndSpin?.enabled) {
      const rows = config.bonus.holdAndSpin.gridSize?.[0] || 3;
      const cols = config.bonus.holdAndSpin.gridSize?.[1] || 3;
      const positions = rows * cols;
      const maxValue = config.bonus.holdAndSpin.maxSymbolValue || 100;
      const respins = config.bonus.holdAndSpin.initialRespins || 3;
      const resetRespins = config.bonus.holdAndSpin.resetRespins || false;
      
      // Base contribution
      let holdSpinContribution = positions * maxValue * 0.01;
      
      // More respins = more chance to fill grid
      holdSpinContribution *= (respins / 3);
      
      // Reset respins adds significant value
      if (resetRespins) holdSpinContribution *= 1.25;
      
      bonusFeatureRtp += holdSpinContribution;
    }
    
    // Jackpots contribution
    if (config.bonus?.jackpots?.enabled) {
      const jackpotLevels = config.bonus.jackpots.levels || ['Minor', 'Major'];
      const isProgressive = config.bonus.jackpots.type === 'progressive';
      
      // Calculate based on jackpot levels and type
      let jackpotContribution = jackpotLevels.length * 0.75; // Base contribution per level
      
      // Progressive jackpots contribute more to RTP
      if (isProgressive) jackpotContribution *= 1.5;
      
      bonusFeatureRtp += jackpotContribution;
    }
    
    // Ensure bonus features don't exceed a reasonable percentage of total RTP
    // In real slots, bonus features typically account for 15-40% of total RTP
    const maxBonusRtp = targetRtp * 0.4; // Maximum 40% of target RTP
    if (bonusFeatureRtp > maxBonusRtp) {
      bonusFeatureRtp = maxBonusRtp;
    }
    
    // Calculate total RTP by combining base game and bonus features
    // But ensure we don't exceed sensible limits
    let actualRtp = baseGameRtp * (1 - bonusFeatureRtp/targetRtp) + bonusFeatureRtp;
    
    // Apply small random variation to simulate real-world slot math
    // Real slots almost never have perfectly round RTPs
    const variation = (Math.random() * 0.4 - 0.2); // -0.2 to +0.2 variation
    actualRtp += variation;
    
    // Ensure RTP stays within realistic bounds (90-98%)
    actualRtp = Math.max(90, Math.min(98, actualRtp));
    
    // Calculate the final base game component
    const finalBaseRtp = actualRtp - bonusFeatureRtp;
    
    // Return all components
    return {
      actual: actualRtp,
      base: finalBaseRtp,
      bonus: bonusFeatureRtp
    };
  }, [
    config.mathModel?.rtp, 
    config.mathModel?.volatilityValue, 
    config.bonus, 
    config.reels?.symbols?.list?.length,
    config.reels?.symbols?.wilds,
    config.reels?.symbols?.scatters,
    config.reels?.layout?.reels,
    config.reels?.layout?.rows,
    config.reels?.payMechanism,
    config.reels?.betlines
  ]);

  // Handle RTP toggling for multi-select
  const toggleRtp = (rtp: number, event?: React.MouseEvent) => {
    let newRtps = [...selectedRtps];
    
    // Get actual RTP based on features and settings
    const { actual: calculatedRtp } = calculateActualRtp();
    
    // Handle shift key for range selection
    if (event && event.shiftKey && selectedRtps.length > 0) {
      const lastSelectedRtp = selectedRtps[selectedRtps.length - 1];
      const allRtps = [94, 95, 96, 97]; // All available RTP values
      
      // Get index range between last selected and current
      const startIdx = allRtps.indexOf(lastSelectedRtp);
      const endIdx = allRtps.indexOf(rtp);
      
      if (startIdx !== -1 && endIdx !== -1) {
        // Add all RTPs in the range
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        
        for (let i = start; i <= end; i++) {
          if (!newRtps.includes(allRtps[i])) {
            newRtps.push(allRtps[i]);
          }
        }
      }
    } else {
      // Handle setting default RTP (if empty selection or Ctrl+click)
      const isCtrlClick = event && (event.ctrlKey || event.metaKey);
      
      if (newRtps.includes(rtp)) {
        // Remove if it's already selected (but don't allow empty selection)
        if (newRtps.length > 1) {
          // If removing the default (first) RTP
          if (rtp === newRtps[0]) {
            if (isCtrlClick) {
              // Just remove it, making the next one default
              newRtps = newRtps.filter(r => r !== rtp);
            } else {
              // Move it to the end of the array instead of removing
              newRtps = [...newRtps.filter(r => r !== rtp), rtp];
            }
          } else {
            // Remove a non-default RTP
            newRtps = newRtps.filter(r => r !== rtp);
          }
        }
      } else {
        // Add if it's not selected
        if (isCtrlClick || newRtps.length === 0) {
          // If Ctrl+click or empty selection, make this the default (first) RTP
          newRtps = [rtp, ...newRtps.filter(r => r !== rtp)];
        } else {
          // Otherwise just add it to the list
          newRtps.push(rtp);
        }
      }
    }
    
    // Sort the RTPs only if not setting a default RTP
    if (!(event && (event.ctrlKey || event.metaKey))) {
      newRtps.sort((a, b) => a - b);
    }
    
    // Update state and config
    setSelectedRtps(newRtps);
    updateConfig({
      mathModel: {
        ...config.mathModel,
        rtp: newRtps[0], // Main RTP is the first one
        rtpOptions: newRtps, // All available RTPs
        calculatedRtp: calculatedRtp.toFixed(2) // Store the real calculated RTP
      }
    });
  };

  // Create dynamic win distribution data based on volatility and RTP
  const getWinDistributionData = useMemo(() => {
    const volatility = config.mathModel?.volatility || 'medium';
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    const rtp = config.mathModel?.rtp || 96;
    
    // Ensure volatilityValue dependency works properly
    console.log('Recalculating win distribution for volatility:', volatilityValue);
    
    // Base distribution patterns by standard volatility levels
    const baseDistributionPatterns = {
      low: {
        '0-1x': 25,
        '1-5x': 45,
        '5-10x': 20,
        '10-50x': 8,
        '50-100x': 1.5,
        '100x+': 0.5
      },
      medium: {
        '0-1x': 20,
        '1-5x': 35,
        '5-10x': 25,
        '10-50x': 15,
        '50-100x': 3,
        '100x+': 2
      },
      high: {
        '0-1x': 15,
        '1-5x': 25,
        '5-10x': 20,
        '10-50x': 25,
        '50-100x': 10,
        '100x+': 5
      }
    };
    
    // For fine-grained volatility, interpolate between the base patterns
    let distributionPatterns = { ...baseDistributionPatterns };
    
    // If using the slider for more precise volatility
    if (volatilityValue !== undefined) {
      if (volatilityValue <= 3) {
        // Low volatility range (1-3)
        distributionPatterns = baseDistributionPatterns.low;
      } else if (volatilityValue >= 8) {
        // High volatility range (8-10)
        distributionPatterns = baseDistributionPatterns.high;
      } else if (volatilityValue < 5) {
        // Between low and medium (4)
        const lowWeight = (5 - volatilityValue) / 2;
        const mediumWeight = (volatilityValue - 3) / 2;
        
        distributionPatterns = {
          '0-1x': baseDistributionPatterns.low['0-1x'] * lowWeight + baseDistributionPatterns.medium['0-1x'] * mediumWeight,
          '1-5x': baseDistributionPatterns.low['1-5x'] * lowWeight + baseDistributionPatterns.medium['1-5x'] * mediumWeight,
          '5-10x': baseDistributionPatterns.low['5-10x'] * lowWeight + baseDistributionPatterns.medium['5-10x'] * mediumWeight,
          '10-50x': baseDistributionPatterns.low['10-50x'] * lowWeight + baseDistributionPatterns.medium['10-50x'] * mediumWeight,
          '50-100x': baseDistributionPatterns.low['50-100x'] * lowWeight + baseDistributionPatterns.medium['50-100x'] * mediumWeight,
          '100x+': baseDistributionPatterns.low['100x+'] * lowWeight + baseDistributionPatterns.medium['100x+'] * mediumWeight
        };
      } else if (volatilityValue > 5) {
        // Between medium and high (6-7)
        const mediumWeight = (8 - volatilityValue) / 3;
        const highWeight = (volatilityValue - 5) / 3;
        
        distributionPatterns = {
          '0-1x': baseDistributionPatterns.medium['0-1x'] * mediumWeight + baseDistributionPatterns.high['0-1x'] * highWeight,
          '1-5x': baseDistributionPatterns.medium['1-5x'] * mediumWeight + baseDistributionPatterns.high['1-5x'] * highWeight,
          '5-10x': baseDistributionPatterns.medium['5-10x'] * mediumWeight + baseDistributionPatterns.high['5-10x'] * highWeight,
          '10-50x': baseDistributionPatterns.medium['10-50x'] * mediumWeight + baseDistributionPatterns.high['10-50x'] * highWeight,
          '50-100x': baseDistributionPatterns.medium['50-100x'] * mediumWeight + baseDistributionPatterns.high['50-100x'] * highWeight,
          '100x+': baseDistributionPatterns.medium['100x+'] * mediumWeight + baseDistributionPatterns.high['100x+'] * highWeight
        };
      } else {
        // Exactly medium (5)
        distributionPatterns = baseDistributionPatterns.medium;
      }
    } else {
      // Fallback to categorical volatility if slider value not available
      distributionPatterns = baseDistributionPatterns[volatility];
    }
    
    // Adjust based on selected RTP
    const rtpAdjustment = (rtp - 96) / 96; // Calculate percentage difference from 96%
    
    // Use the interpolated pattern if available, otherwise use the standard ones
    const pattern = typeof distributionPatterns === 'object' && !('low' in distributionPatterns) 
      ? distributionPatterns 
      : distributionPatterns[volatility];
    
    // Apply RTP adjustment
    Object.keys(pattern).forEach(key => {
      if (key === '0-1x') {
        // Decrease small wins as RTP increases
        pattern[key] = Math.max(0, pattern[key] * (1 - rtpAdjustment));
      } else if (['50-100x', '100x+'].includes(key)) {
        // Increase big wins as RTP increases
        pattern[key] = pattern[key] * (1 + rtpAdjustment * 3);
      }
    });
    
    // Apply symbol count adjustment - more symbols makes it harder to win
    const symbolCount = config.reels?.symbols?.list?.length || 10;
    const idealSymbolCount = 10; // Baseline for calculations
    const symbolCountAdjustment = (symbolCount - idealSymbolCount) / 10; // -10% to +10% adjustment per symbol difference
    
    // Adjust win distribution based on symbol count
    Object.keys(pattern).forEach(key => {
      if (key === '0-1x' || key === '1-5x') {
        // More symbols = more small wins (harder to get big combinations)
        pattern[key] = Math.max(0, pattern[key] * (1 + symbolCountAdjustment * 0.5));
      } else if (['10-50x', '50-100x', '100x+'].includes(key)) {
        // More symbols = fewer big wins
        pattern[key] = Math.max(0, pattern[key] * (1 - symbolCountAdjustment));
      }
    });
    
    // Convert to array format for charts
    return Object.keys(pattern).map(name => ({
      name,
      value: pattern[name]
    }));
  }, [config.mathModel?.volatility, config.mathModel?.volatilityValue, config.mathModel?.rtp]);

  // Calculate hit frequency based on game configuration
  const getHitFrequencyData = useMemo(() => {
    const volatility = config.mathModel?.volatility || 'medium';
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    const rtp = config.mathModel?.rtp || 96;
    
    // Base hit frequencies for standard volatility levels
    const baseHitRatesByLevel = {
      low: { 
        overall: 1/2.8,
        big: 1/250,
        mega: 1/5000
      },
      medium: { 
        overall: 1/3.2,
        big: 1/150,
        mega: 1/2500
      },
      high: { 
        overall: 1/3.8,
        big: 1/100,
        mega: 1/1000
      }
    };
    
    // Interpolate hit rates based on precise volatility value
    let baseHitRates;
    
    if (volatilityValue !== undefined) {
      if (volatilityValue <= 3) {
        // Low volatility range (1-3)
        baseHitRates = baseHitRatesByLevel.low;
      } else if (volatilityValue >= 8) {
        // High volatility range (8-10)
        baseHitRates = baseHitRatesByLevel.high;
      } else if (volatilityValue < 5) {
        // Between low and medium (4)
        const lowWeight = (5 - volatilityValue) / 2;
        const mediumWeight = (volatilityValue - 3) / 2;
        
        baseHitRates = {
          overall: baseHitRatesByLevel.low.overall * lowWeight + baseHitRatesByLevel.medium.overall * mediumWeight,
          big: baseHitRatesByLevel.low.big * lowWeight + baseHitRatesByLevel.medium.big * mediumWeight,
          mega: baseHitRatesByLevel.low.mega * lowWeight + baseHitRatesByLevel.medium.mega * mediumWeight
        };
      } else if (volatilityValue > 5) {
        // Between medium and high (6-7)
        const mediumWeight = (8 - volatilityValue) / 3;
        const highWeight = (volatilityValue - 5) / 3;
        
        baseHitRates = {
          overall: baseHitRatesByLevel.medium.overall * mediumWeight + baseHitRatesByLevel.high.overall * highWeight,
          big: baseHitRatesByLevel.medium.big * mediumWeight + baseHitRatesByLevel.high.big * highWeight,
          mega: baseHitRatesByLevel.medium.mega * mediumWeight + baseHitRatesByLevel.high.mega * highWeight
        };
      } else {
        // Exactly medium (5)
        baseHitRates = baseHitRatesByLevel.medium;
      }
    } else {
      // Fallback to categorical volatility
      baseHitRates = baseHitRatesByLevel[volatility];
    }
    
    // Adjust based on selected RTP
    const rtpAdjustment = (rtp - 96) / 96; // Calculate percentage difference from 96%
    
    // Use the interpolated hit rates
    const hitRates = { ...baseHitRates };
    
    // Apply RTP adjustments
    hitRates.overall = hitRates.overall * (1 + rtpAdjustment * 0.2);
    hitRates.big = hitRates.big * (1 + rtpAdjustment * 0.5);
    hitRates.mega = hitRates.mega * (1 + rtpAdjustment);
    
    // Apply symbol count adjustment to hit rates
    const symbolCount = config.reels?.symbols?.list?.length || 10; 
    const symbolCountEffect = Math.max(0.7, Math.min(1.3, 10 / Math.max(1, symbolCount)));
    
    // More symbols = lower hit rates (harder to get winning combinations)
    hitRates.overall *= symbolCountEffect;
    hitRates.big *= symbolCountEffect * 0.9; // Big wins are even more affected by symbol count
    hitRates.mega *= symbolCountEffect * 0.8; // Mega wins are most affected by symbol count
    
    // Add bonus feature hit rates if available
    if (config.bonus) {
      let bonusHitRate = 0;
      
      // Free Spins contribution
      if (config.bonus.freeSpins?.enabled) {
        bonusHitRate += 1/165; // Base hit rate
      }
      
      // Pick & Click contribution
      if (config.bonus.pickAndClick?.enabled) {
        bonusHitRate += 1/200;
      }
      
      // Wheel Bonus contribution
      if (config.bonus.wheel?.enabled) {
        bonusHitRate += 1/250;
      }
      
      // Hold & Spin contribution
      if (config.bonus.holdAndSpin?.enabled) {
        bonusHitRate += 1/180;
      }
      
      hitRates.bonus = bonusHitRate;
    }
    
    return hitRates;
  }, [config.mathModel?.volatility, config.mathModel?.volatilityValue, config.mathModel?.rtp, config.bonus]);

  // Calculate maximum win potential based on configuration
  const calculateMaxWinPotential = useMemo(() => {
    const volatility = config.mathModel?.volatility || 'medium';
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    const maxWinCap = config.mathModel?.maxWinCap || 5000;
    
    // Base maximum win values for standard volatility levels
    const baseMaxWinLevels = {
      low: 2000,
      medium: 5000,
      high: 10000
    };
    
    // Calculate maximum win based on precise volatility value (1-10 scale)
    let baseMaxWin;
    
    if (volatilityValue !== undefined) {
      if (volatilityValue <= 3) {
        // Low volatility range (1-3)
        // Linear interpolation between 1000-2000
        baseMaxWin = 1000 + (volatilityValue - 1) * 500;
      } else if (volatilityValue >= 8) {
        // High volatility range (8-10)
        // Linear interpolation between 10000-15000
        baseMaxWin = 10000 + (volatilityValue - 8) * 2500;
      } else if (volatilityValue < 5) {
        // Between low and medium (4)
        // Linear interpolation between low and medium
        const t = (volatilityValue - 3) / 2; // normalized position between 3 and 5
        baseMaxWin = baseMaxWinLevels.low * (1 - t) + baseMaxWinLevels.medium * t;
      } else if (volatilityValue > 5) {
        // Between medium and high (6-7)
        // Linear interpolation between medium and high
        const t = (volatilityValue - 5) / 3; // normalized position between 5 and 8
        baseMaxWin = baseMaxWinLevels.medium * (1 - t) + baseMaxWinLevels.high * t;
      } else {
        // Exactly medium (5)
        baseMaxWin = baseMaxWinLevels.medium;
      }
    } else {
      // Fallback to categorical volatility
      baseMaxWin = baseMaxWinLevels[volatility];
    }
    
    // Apply cap
    baseMaxWin = Math.min(baseMaxWin, maxWinCap);
    
    // Factor in bonus features
    let bonusMaxWin = 0;
    
    if (config.bonus) {
      // Free Spins contribution
      if (config.bonus.freeSpins?.enabled) {
        const multiplier = Math.max(...(config.bonus.freeSpins.multipliers || [1]));
        const spinsCount = config.bonus.freeSpins.count || 10;
        bonusMaxWin += (multiplier * spinsCount * 100);
      }
      
      // Pick & Click contribution
      if (config.bonus.pickAndClick?.enabled) {
        const maxPrize = config.bonus.pickAndClick.maxPrize || 100;
        bonusMaxWin += maxPrize;
      }
      
      // Wheel Bonus contribution
      if (config.bonus.wheel?.enabled) {
        const maxMultiplier = config.bonus.wheel.maxMultiplier || 50;
        bonusMaxWin += (maxMultiplier * 100);
      }
      
      // Hold & Spin contribution
      if (config.bonus.holdAndSpin?.enabled) {
        const positions = (config.bonus.holdAndSpin.gridSize?.[0] || 3) * (config.bonus.holdAndSpin.gridSize?.[1] || 3);
        const maxValue = config.bonus.holdAndSpin.maxSymbolValue || 100;
        bonusMaxWin += (positions * maxValue);
      }
    }
    
    // Total potential
    return Math.min(baseMaxWin + bonusMaxWin, maxWinCap);
  }, [config.mathModel?.volatility, config.mathModel?.volatilityValue, config.mathModel?.maxWinCap, config.bonus]);

  // Calculate RTP breakdown
  const rtpBreakdown = useMemo(() => {
    const volatility = config.mathModel?.volatility || 'medium';
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    
    // Calculate actual RTP instead of using the target
    const rtpCalc = calculateActualRtp();
    const totalRtp = rtpCalc.actual;
    
    // Get symbol count to adjust RTP calculation
    const symbolCount = config.reels?.symbols?.list?.length || 10;
    
    // Check if any bonus features are enabled
    const hasJackpots = config.bonus?.jackpots?.enabled || false;
    const hasFreeSpins = config.bonus?.freeSpins?.enabled || false;
    const hasPickAndClick = config.bonus?.pickAndClick?.enabled || false;
    const hasWheel = config.bonus?.wheel?.enabled || false;
    const hasHoldAndSpin = config.bonus?.holdAndSpin?.enabled || false;
    
    // Count total enabled bonus features
    const enabledFeatureCount = [hasFreeSpins, hasPickAndClick, hasWheel, hasHoldAndSpin].filter(Boolean).length;
    const hasBonusFeatures = enabledFeatureCount > 0;
    
    // Base standard RTP distributions by component and volatility level
    const baseDistributions = {
      noFeatures: {
        // No bonus features or jackpots - almost all RTP goes to base game
        baseDistribution: {
          baseGame: 95,
          features: 5,  // Small base features like wilds, scatters without bonus games
        }
      },
      jackpotsOnly: {
        // Only jackpots enabled
        baseDistribution: {
          baseGame: 80,
          features: 5,
          jackpots: 15
        }
      },
      featuresOnly: {
        // Only bonus features enabled - distribution depends on volatility
        low: {
          baseGame: 75,
          features: 25,
        },
        medium: {
          baseGame: 65, 
          features: 35,
        },
        high: {
          baseGame: 55,
          features: 45,
        }
      },
      featuresAndJackpots: {
        // Both bonus features and jackpots - full distribution
        low: {
          baseGame: 65,
          features: 25,
          jackpots: 10
        },
        medium: {
          baseGame: 55, 
          features: 30,
          jackpots: 15
        },
        high: {
          baseGame: 40,
          features: 40,
          jackpots: 20
        }
      }
    };
    
    // Determine which distribution case we're in
    let baseDistribution;
    
    if (!hasBonusFeatures && !hasJackpots) {
      baseDistribution = baseDistributions.noFeatures.baseDistribution;
    } else if (hasJackpots && !hasBonusFeatures) {
      baseDistribution = baseDistributions.jackpotsOnly.baseDistribution;
    } else if (hasBonusFeatures && !hasJackpots) {
      // For continuous volatility using the slider
      if (volatilityValue !== undefined) {
        if (volatilityValue <= 3) {
          // Low volatility range
          baseDistribution = baseDistributions.featuresOnly.low;
        } else if (volatilityValue >= 8) {
          // High volatility range
          baseDistribution = baseDistributions.featuresOnly.high;
        } else if (volatilityValue < 5) {
          // Between low and medium (4)
          const t = (volatilityValue - 3) / 2; // normalized position between 3 and 5
          const low = baseDistributions.featuresOnly.low;
          const medium = baseDistributions.featuresOnly.medium;
          
          baseDistribution = {
            baseGame: low.baseGame * (1 - t) + medium.baseGame * t,
            features: low.features * (1 - t) + medium.features * t
          };
        } else if (volatilityValue > 5) {
          // Between medium and high (6-7)
          const t = (volatilityValue - 5) / 3; // normalized position between 5 and 8
          const medium = baseDistributions.featuresOnly.medium;
          const high = baseDistributions.featuresOnly.high;
          
          baseDistribution = {
            baseGame: medium.baseGame * (1 - t) + high.baseGame * t,
            features: medium.features * (1 - t) + high.features * t
          };
        } else {
          // Exactly medium (5)
          baseDistribution = baseDistributions.featuresOnly.medium;
        }
      } else {
        // Fallback to categorical volatility
        baseDistribution = baseDistributions.featuresOnly[volatility];
      }
    } else {
      // Both bonus features and jackpots
      if (volatilityValue !== undefined) {
        if (volatilityValue <= 3) {
          // Low volatility range
          baseDistribution = baseDistributions.featuresAndJackpots.low;
        } else if (volatilityValue >= 8) {
          // High volatility range
          baseDistribution = baseDistributions.featuresAndJackpots.high;
        } else if (volatilityValue < 5) {
          // Between low and medium
          const t = (volatilityValue - 3) / 2;
          const low = baseDistributions.featuresAndJackpots.low;
          const medium = baseDistributions.featuresAndJackpots.medium;
          
          baseDistribution = {
            baseGame: low.baseGame * (1 - t) + medium.baseGame * t,
            features: low.features * (1 - t) + medium.features * t,
            jackpots: low.jackpots * (1 - t) + medium.jackpots * t
          };
        } else if (volatilityValue > 5) {
          // Between medium and high
          const t = (volatilityValue - 5) / 3;
          const medium = baseDistributions.featuresAndJackpots.medium;
          const high = baseDistributions.featuresAndJackpots.high;
          
          baseDistribution = {
            baseGame: medium.baseGame * (1 - t) + high.baseGame * t,
            features: medium.features * (1 - t) + high.features * t,
            jackpots: medium.jackpots * (1 - t) + high.jackpots * t
          };
        } else {
          // Exactly medium (5)
          baseDistribution = baseDistributions.featuresAndJackpots.medium;
        }
      } else {
        // Fallback to categorical volatility
        baseDistribution = baseDistributions.featuresAndJackpots[volatility];
      }
    }
    
    // If jackpots aren't enabled, remove that entry
    if (!hasJackpots && baseDistribution.jackpots) {
      delete baseDistribution.jackpots;
    }
    
    // Scale to actual RTP
    const rtpComponents = Object.entries(baseDistribution).map(([key, percentage]) => ({
      name: key,
      value: totalRtp * (percentage / 100)
    }));
    
    // If no bonus features are enabled, only show base game features
    if (!hasBonusFeatures && !hasJackpots) {
      const baseFeatureRtp = rtpComponents.find(comp => comp.name === 'features')?.value || 0;
      return {
        main: rtpComponents,
        features: [{
          name: 'Base Features',
          value: baseFeatureRtp
        }],
        jackpots: []
      };
    }
    
    // Further break down features if bonus features are selected
    let featureBreakdown = [];
    if (hasBonusFeatures) {
      let featureRtp = rtpComponents.find(comp => comp.name === 'features')?.value || 0;
      featureBreakdown = [];
      let remainingRtp = featureRtp;
      const enabledFeatures = [];
      
      // Count enabled features
      if (hasFreeSpins) enabledFeatures.push('freeSpins');
      if (hasPickAndClick) enabledFeatures.push('pickAndClick');
      if (hasWheel) enabledFeatures.push('wheel');
      if (hasHoldAndSpin) enabledFeatures.push('holdAndSpin');
      
      // Calculate RTP share per feature - adjust based on feature importance
      const baseShares = {
        freeSpins: 0.5,      // Free spins are typically the highest RTP contributor
        pickAndClick: 0.15,  // Pick and click features 
        wheel: 0.15,         // Wheel bonus
        holdAndSpin: 0.2     // Hold and spin features
      };
      
      // Normalize shares based on enabled features
      const totalShareWeight = enabledFeatures.reduce((sum, feature) => sum + baseShares[feature], 0);
      const normalizedShares = {};
      
      // Prevent division by zero if no features are enabled
      if (totalShareWeight > 0) {
        enabledFeatures.forEach(feature => {
          normalizedShares[feature] = baseShares[feature] / totalShareWeight;
        });
      }
      
      // Free Spins contribution
      if (hasFreeSpins && config.bonus?.freeSpins) {
        // Safely access properties with optional chaining and fallbacks
        const multipliers = config.bonus.freeSpins.multipliers || [1];
        const multiplierFactor = Math.max(...multipliers) / 5;
        const spinsFactor = (config.bonus.freeSpins.count || 10) / 10;
        const adjustedShare = (normalizedShares.freeSpins || 0.5) * (0.8 + (multiplierFactor * 0.1) + (spinsFactor * 0.1));
        
        const freeSpinsRtp = featureRtp * adjustedShare;
        featureBreakdown.push({
          name: 'Free Spins',
          value: freeSpinsRtp
        });
        remainingRtp -= freeSpinsRtp;
      }
      
      // Pick & Click contribution
      if (hasPickAndClick && config.bonus?.pickAndClick) {
        // Safely access properties with optional chaining and fallbacks
        const maxPrizeFactor = (config.bonus.pickAndClick.maxPrize || 100) / 100;
        const adjustedShare = (normalizedShares.pickAndClick || 0.15) * (0.9 + (maxPrizeFactor * 0.1));
        
        const pickRtp = featureRtp * adjustedShare;
        featureBreakdown.push({
          name: 'Pick & Click',
          value: pickRtp
        });
        remainingRtp -= pickRtp;
      }
      
      // Wheel Bonus contribution
      if (hasWheel && config.bonus?.wheel) {
        // Safely access properties with optional chaining and fallbacks
        const maxMultiplierFactor = (config.bonus.wheel.maxMultiplier || 50) / 50;
        const adjustedShare = (normalizedShares.wheel || 0.15) * (0.9 + (maxMultiplierFactor * 0.1));
        
        const wheelRtp = featureRtp * adjustedShare;
        featureBreakdown.push({
          name: 'Wheel',
          value: wheelRtp
        });
        remainingRtp -= wheelRtp;
      }
      
      // Hold & Spin contribution
      if (hasHoldAndSpin && config.bonus?.holdAndSpin) {
        // Safely access properties with optional chaining and fallbacks
        const rows = config.bonus.holdAndSpin.gridSize?.[0] || 3;
        const cols = config.bonus.holdAndSpin.gridSize?.[1] || 3;
        const gridSize = (rows * cols) / 9;
        const maxValueFactor = (config.bonus.holdAndSpin.maxSymbolValue || 100) / 100;
        const adjustedShare = (normalizedShares.holdAndSpin || 0.2) * (0.8 + (gridSize * 0.1) + (maxValueFactor * 0.1));
        
        const holdRtp = featureRtp * adjustedShare;
        featureBreakdown.push({
          name: 'Hold & Spin',
          value: holdRtp
        });
        remainingRtp -= holdRtp;
      }
      
      // Add any remaining RTP to "Base Features"
      if (remainingRtp > 0.1) { // Only add if it's significant
        featureBreakdown.push({
          name: 'Base Features',
          value: remainingRtp
        });
      }
    }
    
    // If jackpots are enabled, add a Jackpots breakdown based on levels
    const jackpotsBreakdown = [];
    if (hasJackpots && config.bonus?.jackpots) {
      const jackpotsRtp = rtpComponents.find(comp => comp.name === 'jackpots')?.value || 0;
      const jackpotLevels = config.bonus?.jackpots?.levels || ['Mini', 'Minor', 'Major', 'Grand'];
      
      // Distribution for different levels (traditionally higher levels get less RTP but bigger prizes)
      const levelShares = {
        Mini: 0.3,
        Minor: 0.25,
        Major: 0.25,
        Grand: 0.2
      };
      
      // Ensure we have at least one level if somehow the levels array is empty
      if (jackpotLevels.length === 0) {
        jackpotLevels.push('Jackpot');
      }
      
      // Create breakdown for each level
      jackpotLevels.forEach(level => {
        const share = levelShares[level] || (1 / jackpotLevels.length);
        jackpotsBreakdown.push({
          name: level,
          value: jackpotsRtp * share
        });
      });
    }
    
    // Ensure we have valid data for the charts
    try {
      const featuresValue = rtpComponents.find(comp => comp.name === 'features')?.value || 0;
      
      // Handle cases where components might be undefined or empty
      return {
        main: rtpComponents.length > 0 ? rtpComponents : [{name: 'baseGame', value: totalRtp}],
        features: featuresValue > 0 
          ? (hasBonusFeatures && featureBreakdown.length > 0 
              ? featureBreakdown 
              : [{name: 'Base Features', value: featuresValue}])
          : [],
        jackpots: jackpotsBreakdown
      };
    } catch (error) {
      console.error("Error calculating RTP breakdown:", error);
      // Return safe default values
      return {
        main: [{name: 'baseGame', value: totalRtp}],
        features: [],
        jackpots: []
      };
    }
  }, [config.mathModel?.volatility, config.mathModel?.volatilityValue, config.mathModel?.rtp, config.bonus]);

  // Run a simple simulation of the game
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Get configuration parameters
    const volatility = config.mathModel?.volatility || 'medium';
    const volatilityValue = config.mathModel?.volatilityValue || 5;
    const rtp = config.mathModel?.rtp || 96;
    const maxWinCap = calculateMaxWinPotential || 5000; // Use a default if the memoized value isn't available
    const hitRates = getHitFrequencyData || { overall: 1/3.2, big: 1/150, mega: 1/2500 }; // Default if not available
    
    // Consider symbol count in RTP simulation
    const symbolCount = config.reels?.symbols?.list?.length || 10;
    const symbolCountFactor = Math.max(0.9, Math.min(1.1, 10 / Math.max(1, symbolCount)));
    const adjustedRtp = rtp * symbolCountFactor; // Adjust RTP based on symbol count
    
    // Simulation parameters
    const spins = 1000;
    const results = [];
    let totalWin = 0;
    let hits = 0;
    let biggestWin = 0;
    
    // Base volatility factors for standard levels
    const baseVolatilityFactors = {
      low: { variance: 0.5, hitMultiplier: 1.2 },
      medium: { variance: 1.0, hitMultiplier: 1.0 },
      high: { variance: 2.0, hitMultiplier: 0.8 }
    };
    
    // Calculate factors based on precise volatility value
    let volatilityFactors;
    
    if (volatilityValue !== undefined) {
      // Create continuous volatility factors across the 1-10 scale
      let variance, hitMultiplier;
      
      if (volatilityValue <= 3) {
        // Low volatility range (1-3)
        // Linear interpolation for variance between 0.3-0.5
        variance = 0.3 + (volatilityValue - 1) * 0.1;
        // Linear interpolation for hit multiplier between 1.3-1.2
        hitMultiplier = 1.3 - (volatilityValue - 1) * 0.05;
      } else if (volatilityValue >= 8) {
        // High volatility range (8-10)
        // Linear interpolation for variance between 2.0-3.0
        variance = 2.0 + (volatilityValue - 8) * 0.5;
        // Linear interpolation for hit multiplier between 0.8-0.6
        hitMultiplier = 0.8 - (volatilityValue - 8) * 0.1;
      } else if (volatilityValue < 5) {
        // Between low and medium (4)
        const t = (volatilityValue - 3) / 2; // normalized position between 3 and 5
        variance = baseVolatilityFactors.low.variance * (1 - t) + baseVolatilityFactors.medium.variance * t;
        hitMultiplier = baseVolatilityFactors.low.hitMultiplier * (1 - t) + baseVolatilityFactors.medium.hitMultiplier * t;
      } else if (volatilityValue > 5) {
        // Between medium and high (6-7)
        const t = (volatilityValue - 5) / 3; // normalized position between 5 and 8
        variance = baseVolatilityFactors.medium.variance * (1 - t) + baseVolatilityFactors.high.variance * t;
        hitMultiplier = baseVolatilityFactors.medium.hitMultiplier * (1 - t) + baseVolatilityFactors.high.hitMultiplier * t;
      } else {
        // Exactly medium (5)
        variance = baseVolatilityFactors.medium.variance;
        hitMultiplier = baseVolatilityFactors.medium.hitMultiplier;
      }
      
      volatilityFactors = { variance, hitMultiplier };
    } else {
      // Fallback to categorical volatility
      volatilityFactors = baseVolatilityFactors[volatility];
    }
    
    const factor = volatilityFactors;
    
    try {
      // Run the simulation
      for (let i = 0; i < spins; i++) {
        // Determine if this spin is a hit
        const isHit = Math.random() < (hitRates.overall * factor.hitMultiplier);
        
        // Calculate win amount if it's a hit
        let win = 0;
        if (isHit) {
          hits++;
          
          // Most wins are small
          const winType = Math.random();
          
          if (winType > 0.995) {
            // Mega win (0.5% chance)
            win = (50 + Math.random() * 450) * factor.variance;
          } else if (winType > 0.95) {
            // Big win (4.5% chance)
            win = (10 + Math.random() * 40) * factor.variance;
          } else if (winType > 0.80) {
            // Medium win (15% chance)
            win = (5 + Math.random() * 5) * factor.variance;
          } else {
            // Small win (80% chance)
            win = (0.1 + Math.random() * 4.9) * factor.variance;
          }
          
          // Ensure win doesn't exceed max win
          win = Math.min(win, maxWinCap);
          
          // Track biggest win
          biggestWin = Math.max(biggestWin, win);
        }
        
        totalWin += win;
        
        // Record result for this spin
        results.push({
          spin: i + 1,
          win,
          balance: totalWin - (i + 1), // Net balance (total win - total bet)
          rtp: totalWin / (i + 1) * 100, // Running RTP
          isHit
        });
      }
      
      // Calculate final statistics
      const finalStats = {
        maxWin: biggestWin,
        averageWin: hits > 0 ? totalWin / hits : 0, // Avoid division by zero
        spinsPlayed: spins,
        hitRate: hits / spins,
        rtpAchieved: totalWin / spins * 100
      };
      
      // Add information about symbol count effect to the stats
      if (symbolCount < 8) {
        finalStats.symbolNote = "Too few symbols may increase variance and affect RTP distribution";
      } else if (symbolCount > 12) {
        finalStats.symbolNote = "Large symbol count may reduce hit rate and affect RTP distribution";
      }
      
      setSimulationResults(results);
      setSimulationStats(finalStats);
    } catch (error) {
      console.error("Simulation error:", error);
      // Set some default results in case of error
      setSimulationResults([
        { spin: 1, win: 0, balance: -1, rtp: 0, isHit: false },
        { spin: 1000, win: 0, balance: -1000, rtp: 0, isHit: false }
      ]);
      setSimulationStats({
        maxWin: 0,
        averageWin: 0,
        spinsPlayed: 1000,
        hitRate: 0,
        rtpAchieved: 0
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Get volatility comparison data based on volatility value
  const volatilityComparisonData = useMemo(() => {
    // Use a safe default if volatilityValue is undefined or invalid
    const volatilityValue = config.mathModel?.volatilityValue !== undefined 
      ? Math.min(Math.max(1, config.mathModel.volatilityValue), 10) 
      : 5;
    const standardData = [
      { 
        name: 'Low',
        'win frequency': 80,
        'win size': 30,
        'risk': 20
      },
      { 
        name: 'Medium',
        'win frequency': 50,
        'win size': 50,
        'risk': 50
      },
      { 
        name: 'High',
        'win frequency': 20,
        'win size': 80,
        'risk': 80
      }
    ];
    
    // If using the slider, add a custom entry for the exact volatility value
    if (volatilityValue !== undefined) {
      let customEntry = {
        name: 'Current',
        'win frequency': 0,
        'win size': 0,
        'risk': 0
      };
      
      // Calculate values based on volatility value (1-10 scale)
      const normalizedValue = (volatilityValue - 1) / 9; // 0-1 range
      
      // Win frequency decreases as volatility increases
      customEntry['win frequency'] = Math.round(80 - (normalizedValue * 60));
      
      // Win size increases as volatility increases
      customEntry['win size'] = Math.round(30 + (normalizedValue * 50));
      
      // Risk increases as volatility increases
      customEntry['risk'] = Math.round(20 + (normalizedValue * 60));
      
      // Insert custom entry at appropriate position
      if (volatilityValue <= 3) {
        return [customEntry, ...standardData.slice(1)]; // Replace Low
      } else if (volatilityValue >= 8) {
        return [...standardData.slice(0, 2), customEntry]; // Replace High
      } else {
        return [...standardData.slice(0, 1), customEntry, ...standardData.slice(2)]; // Replace Medium
      }
    }
    
    return standardData;
  }, [config.mathModel?.volatilityValue]);
  
  return (
    <div className="space-y-6 pb-24">
      {/* Game-like Interface */}
      <div className="relative">
        {/* Step progression */}
        <div className="flex justify-center mb-2">
          <div className="flex gap-1.5">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={clsx(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  currentStep === index 
                    ? "bg-blue-600 w-7" 
                    : completedSteps.includes(index)
                      ? "bg-green-500"
                      : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Intro Screen */}
          {currentStep === 0 && (
            <div className="animate-slide-in-right">
              <div className="p-8 text-center">
                <div className="h-32 flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                    <Calculator className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Math Laboratory
                </h1>
                <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                  Welcome to the Math Lab! Here, you'll fine-tune your game's mathematical model to create the perfect balance of excitement and rewards. Let's craft a math model that keeps players engaged!
                </p>
                
                <button
                  onClick={nextStep}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition duration-300 shadow-md hover:shadow-lg transform hover:translate-y-[-2px]"
                >
                  Let's Get Started! 🧮
                </button>
                
                <div className="mt-8 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <BarChart2 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Volatility</h3>
                    <p className="text-sm text-gray-600">Define the risk-reward balance</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <PieChartIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">RTP</h3>
                    <p className="text-sm text-gray-600">Set return to player rates</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <LineChart className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Simulation</h3>
                    <p className="text-sm text-gray-600">Test your math model</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Volatility Settings Step */}
          {currentStep === 1 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <BarChart2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Volatility Settings</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Volatility defines how risky your game feels. Higher volatility means bigger but less frequent wins.
                  Lower volatility means more frequent but smaller wins.
                </p>
              </div>
              
              {/* Volatility Slider with Visual Representation */}
              <div className="mb-10 max-w-3xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-800 font-medium">Volatility Level</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {config.mathModel?.volatility?.charAt(0).toUpperCase() + config.mathModel?.volatility?.slice(1) || 'Medium'} 
                      ({config.mathModel?.volatilityValue || 5}/10)
                    </span>
                  </div>
                  
                  <div className="relative py-6">
                    <div className="absolute w-full h-2 bg-gray-200 rounded-full">
                      <div className="absolute h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 rounded-full"
                           style={{ width: '100%' }}></div>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={config.mathModel?.volatilityValue || 5} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        let volatilityLevel = 'medium';
                        if (value <= 3) volatilityLevel = 'low';
                        else if (value >= 8) volatilityLevel = 'high';
                        
                        updateConfig({
                          mathModel: {
                            ...config.mathModel,
                            volatility: volatilityLevel,
                            volatilityValue: value
                          }
                        });
                      }}
                      className="absolute w-full h-10 opacity-0 cursor-pointer z-10"
                    />
                    <div className="absolute top-0 left-0 right-0 flex justify-between px-1 text-xs text-gray-500">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                    <div className="absolute top-[6px] left-0 right-0 flex justify-between px-1 pointer-events-none">
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                      <div className="h-8 w-0.5 bg-gray-300"></div>
                    </div>
                    <div 
                      className="absolute top-[-8px] w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-grab"
                      style={{ left: `calc(${((config.mathModel?.volatilityValue || 5) - 1) / 9 * 100}% - 12px)` }}
                    ></div>
                  </div>
                </div>
                
                {/* Visual Explanation */}
                <div className="grid grid-cols-3 gap-6 my-8">
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    (config.mathModel?.volatilityValue || 5) <= 3 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex flex-col items-center">
                      <div className="flex items-end h-20 mb-3 gap-1">
                        {[1,1,1,1,1,1,1,1].map((h, i) => (
                          <div key={i} className="bg-green-500 w-3" style={{height: `${h * 15 + 10}px`}}></div>
                        ))}
                      </div>
                      <h3 className="font-medium text-gray-800">Low Volatility</h3>
                      <p className="text-xs text-gray-600 text-center mt-1">Frequent small wins, low risk</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    (config.mathModel?.volatilityValue || 5) > 3 && (config.mathModel?.volatilityValue || 5) < 8
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex flex-col items-center">
                      <div className="flex items-end h-20 mb-3 gap-1">
                        {[1,2,1,3,1,2,4,1].map((h, i) => (
                          <div key={i} className="bg-blue-500 w-3" style={{height: `${h * 15}px`}}></div>
                        ))}
                      </div>
                      <h3 className="font-medium text-gray-800">Medium Volatility</h3>
                      <p className="text-xs text-gray-600 text-center mt-1">Balanced wins, moderate risk</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    (config.mathModel?.volatilityValue || 5) >= 8
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex flex-col items-center">
                      <div className="flex items-end h-20 mb-3 gap-1">
                        {[1,0,1,0,5,0,1,0].map((h, i) => (
                          <div key={i} className="bg-red-500 w-3" style={{height: `${h * 15}px`}}></div>
                        ))}
                      </div>
                      <h3 className="font-medium text-gray-800">High Volatility</h3>
                      <p className="text-xs text-gray-600 text-center mt-1">Rare huge wins, high risk</p>
                    </div>
                  </div>
                </div>
                
                {/* Hit Frequency Stats */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-3">Resulting Hit Frequency</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-sm text-gray-600">Any Win</span>
                      <div className="text-xl font-bold text-blue-800 mt-1">1:{(1/getHitFrequencyData.overall).toFixed(1)}</div>
                      <span className="text-xs text-gray-500">spins</span>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-sm text-gray-600">Big Win (50x+)</span>
                      <div className="text-xl font-bold text-blue-800 mt-1">1:{Math.round(1/getHitFrequencyData.big)}</div>
                      <span className="text-xs text-gray-500">spins</span>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-sm text-gray-600">Mega Win (500x+)</span>
                      <div className="text-xl font-bold text-blue-800 mt-1">1:{Math.round(1/getHitFrequencyData.mega)}</div>
                      <span className="text-xs text-gray-500">spins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* RTP Settings Step */}
          {currentStep === 2 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <PieChartIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">RTP Settings</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  RTP (Return To Player) is the percentage of all wagered money that will be paid back to players over time.
                  Different markets may require different RTP settings.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                {/* RTP Selection Cards */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-800">Select Target RTP</h3>
                    <span className="text-sm text-gray-600">Default: {selectedRtps[0]}%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[94, 95, 96, 97].map((rtp) => {
                      const isDefaultRtp = selectedRtps[0] === rtp;
                      const isSelected = selectedRtps.includes(rtp);
                      
                      return (
                        <button
                          key={rtp}
                          onClick={(e) => toggleRtp(rtp, e)}
                          className={clsx(
                            "relative p-6 rounded-xl border-2 transition-all duration-300",
                            isSelected 
                              ? "border-blue-600 shadow-md" 
                              : "border-gray-200 hover:border-blue-300",
                            isDefaultRtp ? "bg-blue-600 text-white" : (isSelected ? "bg-blue-50" : "bg-white")
                          )}
                        >
                          <div className="text-center">
                            <span className={clsx(
                              "text-3xl font-bold",
                              isDefaultRtp ? "text-white" : (isSelected ? "text-blue-700" : "text-gray-800")
                            )}>
                              {rtp}%
                            </span>
                            
                            {isDefaultRtp && (
                              <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                Default
                              </div>
                            )}
                            
                            {isSelected && !isDefaultRtp && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Actual RTP calculated based on game parameters */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <PieChartIcon className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Calculated Real-World RTP</h3>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-bold text-blue-800">
                        {config.mathModel?.calculatedRtp || calculateActualRtp().actual.toFixed(2)}%
                      </div>
                      <div className="text-sm text-blue-600 mb-1.5">
                        (Target Range: {selectedRtps[0]}±2%)
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Real slots have precise RTPs based on symbol count, paytable, and feature configurations. This is your game's true mathematical RTP.
                    </p>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Base Game</div>
                        <div className="text-lg font-semibold text-blue-800">
                          {Math.max(0, (calculateActualRtp().base)).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Pays, symbols & grid</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">Bonus Features</div>
                        <div className="text-lg font-semibold text-green-700">
                          {Math.max(0, (calculateActualRtp().bonus)).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">All special features</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">RTP Deviation</div>
                        <div className="text-lg font-semibold text-purple-700">
                          {(calculateActualRtp().actual > selectedRtps[0] ? "+" : "") + 
                            (calculateActualRtp().actual - selectedRtps[0]).toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">From target</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Understanding RTP Calculation:</p>
                        <ul className="mt-1 space-y-1 list-disc pl-5">
                          <li>Target RTP is your selected default percentage</li>
                          <li>Actual RTP is calculated based on bonus features, symbol count, and volatility</li>
                          <li>The difference is typical in real slot games and affects game behavior</li>
                        </ul>
                        <p className="mt-2">
                          {selectedRtps.length > 1 
                            ? `Selected RTPs: ${selectedRtps.join('%, ')}%` 
                            : `Selected RTP: ${selectedRtps[0]}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* RTP Breakdown Visualization */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-4">RTP Distribution</h3>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="text-center text-sm font-medium text-gray-700 mb-2">Components</div>
                      <div className="h-64 p-4 bg-white rounded-lg border border-gray-200">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={rtpBreakdown.main}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius="60%"
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, value }) => {
                                const displayName = name === 'baseGame' ? 'Base Game' : 
                                                  name === 'features' ? 'Features' : 
                                                  name === 'jackpots' ? 'Jackpots' : name;
                                return `${displayName}: ${Number(value).toFixed(1)}%`;
                              }}
                            >
                              {rtpBreakdown.main.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={
                                    entry.name === 'baseGame' ? '#36B37E' : 
                                    entry.name === 'features' ? '#0052CC' : 
                                    '#FF8B00'
                                  } 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {rtpBreakdown.features.length > 0 && (
                      <div className="flex-1">
                        <div className="text-center text-sm font-medium text-gray-700 mb-2">Feature Breakdown</div>
                        <div className="h-64 p-4 bg-white rounded-lg border border-gray-200">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={rtpBreakdown.features}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius="60%"
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, value }) => {
                                  const displayName = name.length > 10 ? 
                                    name.replace('Free Spins', 'FS')
                                      .replace('Pick & Click', 'P&C')
                                      .replace('Hold & Spin', 'H&S')
                                      .replace('Base Features', 'Base') : name;
                                  return `${displayName}: ${Number(value).toFixed(1)}%`;
                                }}
                              >
                                {rtpBreakdown.features.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                      entry.name === 'Free Spins' ? '#4C9AFF' : 
                                      entry.name === 'Pick & Click' ? '#6554C0' : 
                                      entry.name === 'Wheel' ? '#FF5630' : 
                                      entry.name === 'Hold & Spin' ? '#FFAB00' : 
                                      entry.name === 'Base Features' ? '#00C7E6' :
                                      '#00B8D9'
                                    } 
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700">
                      <span className="font-medium">Actual Total RTP:</span> {config.mathModel?.calculatedRtp || calculateActualRtp().actual.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      RTP distribution reflects your bonus features, symbol count, and volatility settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Win Distribution Step */}
          {currentStep === 3 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <BarChart2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Win Distribution</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Define how wins are spread across different sizes. This depends on your volatility settings.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                {/* Win Distribution Chart */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-3">Win Size Distribution</h3>
                  <div className="h-72 p-4 bg-white rounded-lg border border-gray-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getWinDistributionData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                      >
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0052CC" radius={[4, 4, 0, 0]}>
                          {getWinDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.name === '100x+' ? '#00875A' : 
                              entry.name === '50-100x' ? '#36B37E' :
                              entry.name === '10-50x' ? '#57D9A3' :
                              entry.name === '5-10x' ? '#79E2F2' :
                              entry.name === '1-5x' ? '#4C9AFF' :
                              '#0052CC'
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {['Balanced', 'Frequent Small Wins', 'Big Win Focus'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          const newVolatilityValue = preset === 'Balanced' ? 5 : 
                                                   preset === 'Frequent Small Wins' ? 3 : 
                                                   preset === 'Big Win Focus' ? 8 : 5;
                          
                          let volatilityLevel = 'medium';
                          if (newVolatilityValue <= 3) volatilityLevel = 'low';
                          else if (newVolatilityValue >= 8) volatilityLevel = 'high';
                          
                          updateConfig({
                            mathModel: {
                              ...config.mathModel,
                              volatility: volatilityLevel,
                              volatilityValue: newVolatilityValue,
                              winDistributionPreset: preset.toLowerCase().replace(/\s+/g, '-')
                            }
                          });
                        }}
                        className={clsx(
                          "p-3 rounded-lg border-2 transition-all duration-300",
                          config.mathModel?.winDistributionPreset === preset.toLowerCase().replace(/\s+/g, '-')
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-200 text-gray-700"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Maximum Win Potential Step */}
          {currentStep === 4 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Maximum Win Potential</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Set the highest possible win for your game. This affects player excitement and regulatory compliance.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-3">Maximum Win Cap</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[5000, 10000, 25000, 50000].map((cap) => (
                      <button
                        key={cap}
                        onClick={() => updateConfig({
                          mathModel: {
                            ...config.mathModel,
                            maxWinCap: cap
                          }
                        })}
                        className={clsx(
                          "p-6 rounded-xl border-2 transition-all duration-300 text-center",
                          config.mathModel?.maxWinCap === cap
                            ? "border-blue-600 bg-blue-600 text-white shadow-md"
                            : "border-gray-200 hover:border-blue-200 text-gray-700"
                        )}
                      >
                        <span className="text-3xl font-bold block">{cap}x</span>
                        <span className="text-xs mt-1 block">bet</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-8 h-8 text-blue-600" />
                      <h3 className="text-xl font-bold text-blue-800">
                        Calculated Maximum Win Potential
                      </h3>
                    </div>
                    <div className="text-5xl font-bold text-blue-900 ml-3 mb-2">
                      {calculateMaxWinPotential.toLocaleString()}x
                    </div>
                    <p className="text-blue-700 ml-3">
                      Based on your volatility, bonus features, and maximum win cap settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Math Simulation Step */}
          {currentStep === 5 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <LineChart className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Test Your Math</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Run simulations to verify your math model works as expected. This helps ensure the RTP and volatility match your goals.
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-8">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className={clsx(
                      "px-8 py-4 rounded-lg flex items-center gap-3 text-lg font-medium transition-all duration-300 shadow-md",
                      isSimulating
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:translate-y-[-2px]"
                    )}
                  >
                    {isSimulating ? (
                      <>
                        <RotateCcw className="w-6 h-6 animate-spin" />
                        <span>Running Simulation...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        <span>Run 1,000 Spin Simulation</span>
                      </>
                    )}
                  </button>
                </div>
                
                {simulationResults.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-80 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={simulationResults.filter((_, i) => i % 10 === 0)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis 
                            dataKey="spin" 
                            label={{ value: 'Spins', position: 'insideBottomRight', offset: -5 }}
                          />
                          <YAxis 
                            yAxisId="left" 
                            label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            label={{ value: 'RTP %', angle: 90, position: 'insideRight' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="balance" 
                            name="Net Balance" 
                            stroke="#0052CC" 
                            dot={false} 
                            strokeWidth={3}
                            yAxisId="left" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rtp" 
                            name="Running RTP (%)" 
                            stroke="#00B8D9" 
                            dot={false} 
                            strokeWidth={2}
                            yAxisId="right" 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm text-blue-700 mb-1">Maximum Win</h4>
                        <div className="text-3xl font-bold text-blue-900">{simulationStats.maxWin.toFixed(1)}x</div>
                        <p className="text-xs text-blue-600 mt-1">Highest single win in simulation</p>
                      </div>
                      
                      <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm text-blue-700 mb-1">Hit Rate</h4>
                        <div className="text-3xl font-bold text-blue-900">{(simulationStats.hitRate * 100).toFixed(1)}%</div>
                        <p className="text-xs text-blue-600 mt-1">Percentage of spins with wins</p>
                      </div>
                      
                      <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm text-blue-700 mb-1">Actual RTP</h4>
                        <div className="text-3xl font-bold text-blue-900">{simulationStats.rtpAchieved.toFixed(2)}%</div>
                        <p className="text-xs text-blue-600 mt-1">RTP achieved in simulation</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-medium">Simulation Complete!</p>
                        <p className="text-green-700 text-sm mt-1">
                          Your math settings have been validated through 1,000 simulated spins.
                          The achieved RTP of {simulationStats.rtpAchieved.toFixed(2)}% {
                            Math.abs(simulationStats.rtpAchieved - (config.mathModel?.rtp || 96)) < 1 
                              ? 'is very close to your target RTP.' 
                              : 'differs from your target RTP, which is normal for shorter simulations.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <TrendingUp className="w-10 h-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No Simulation Data Yet</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Run a simulation to see how your math model performs over time. We'll generate 1,000 simulated spins to verify your settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation Controls */}
          <div className="bg-gray-50 p-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={clsx(
                "px-4 py-2 rounded-lg flex items-center gap-2",
                currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            
            <button
              onClick={nextStep}
              disabled={false}
              className={clsx(
                "px-4 py-2 rounded-lg flex items-center gap-2",
                currentStep === steps.length - 1
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 shadow-lg z-50 max-w-md">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export { MathModel };