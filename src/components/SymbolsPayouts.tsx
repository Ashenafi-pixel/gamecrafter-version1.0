import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  Sparkles, 
  AlertCircle,
  BarChart2,
  HelpCircle,
  Wand2,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  Hexagon,
  Dices,
  Play,
  CheckCircle2,
  ArrowRight,
  Table,
  CircleDollarSign,
  Coins
} from 'lucide-react';
import clsx from 'clsx';

// Constants for cluster pays
const CLUSTER_SIZES = [5, 8, 12, 15, 20];
const DEFAULT_CLUSTER_PAYOUTS = {
  5: 5,
  8: 20,
  12: 100,
  15: 250,
  20: 1000
};

const optimizeSymbolWeights = (symbols: any[], targetRTP: number = 96.0) => {
  // First, identify and sort symbols by type and payout value
  // Higher value symbols should have lower weights
  
  // Find the max payout for each symbol to determine its "rank"
  const symbolsWithRank = symbols.map(symbol => {
    let maxPayout = 0;
    
    if (symbol.cluster?.payouts) {
      // For cluster pays
      const values = Object.values(symbol.cluster.payouts) as number[];
      maxPayout = values.length > 0 ? Math.max(...values) : 0;
    } else if (symbol.payouts) {
      // For paylines
      const values = Array.isArray(symbol.payouts) ? symbol.payouts : Object.values(symbol.payouts);
      maxPayout = values.length > 0 ? Math.max(...values.filter(v => typeof v === 'number')) : 0;
    }
    
    return {
      ...symbol,
      maxPayout
    };
  });
  
  // Sort symbols by type and payout (rank)
  const sortedSymbols = [...symbolsWithRank].sort((a, b) => {
    // Special types first
    if (a.type !== b.type) {
      if (a.type === 'wild') return -1;
      if (b.type === 'wild') return 1;
      if (a.type === 'scatter') return -1;
      if (b.type === 'scatter') return 1;
    }
    
    // Then by payout value (descending)
    return b.maxPayout - a.maxPayout;
  });
  
  // Count regular symbols for distribution
  const wildSymbols = sortedSymbols.filter(s => s.type === 'wild');
  const scatterSymbols = sortedSymbols.filter(s => s.type === 'scatter');
  const regularSymbols = sortedSymbols.filter(s => s.type === 'regular');
  
  // Reserve weights for special symbols
  let reservedWeight = 0;
  
  // 4-5% for each wild
  const wildWeight = 5;
  reservedWeight += wildSymbols.length * wildWeight;
  
  // 2-3% for each scatter
  const scatterWeight = 3;
  reservedWeight += scatterSymbols.length * scatterWeight;
  
  // Remaining weight for regular symbols
  const remainingWeight = 100 - reservedWeight;
  
  // Initialize result with special symbols
  const result = [];
  
  // Add wild symbols with fixed weight
  for (const symbol of wildSymbols) {
    result.push({
      ...symbol,
      weight: wildWeight
    });
  }
  
  // Add scatter symbols with fixed weight
  for (const symbol of scatterSymbols) {
    result.push({
      ...symbol,
      weight: scatterWeight
    });
  }
  
  // Distribute remaining weight among regular symbols based on their rank
  if (regularSymbols.length > 0) {
    // Calculate a ratio for each symbol based on its rank
    const totalRegularSymbols = regularSymbols.length;
    
    // Weight distribution for regular symbols
    // Low paying symbols (higher index in sorted list) get higher weights
    const weights = [];
    let totalWeight = 0;
    
    for (let i = 0; i < totalRegularSymbols; i++) {
      // Linear distribution - higher index = higher weight
      // Newer approach: Power distribution to create more distinct tiers
      const position = i / (totalRegularSymbols - 1 || 1); // Normalized position 0-1
      
      // Use a power curve to create more distinct tiers
      // Higher symbols are much rarer than lower symbols
      const weight = Math.pow(position, 1.5) + 0.2; // Adjust curve with power and offset
      weights.push(weight);
      totalWeight += weight;
    }
    
    // Normalize weights to sum to remainingWeight
    const normalizedWeights = weights.map(w => (w / totalWeight) * remainingWeight);
    
    // Add regular symbols with calculated weights
    for (let i = 0; i < regularSymbols.length; i++) {
      const symbol = regularSymbols[i];
      const calculatedWeight = Math.round(normalizedWeights[i]);
      
      result.push({
        ...symbol,
        weight: Math.max(1, calculatedWeight) // Ensure minimum weight of 1
      });
    }
  }
  
  // Sort back to original order while maintaining correct weights
  const symbolMap = new Map(symbols.map((s, i) => [s.id, i]));
  
  // Ensure the total weights sum to 100
  const totalWeight = result.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight !== 100) {
    // Apply a scaling factor to all weights
    const scalingFactor = 100 / totalWeight;
    for (const symbol of result) {
      symbol.weight = Math.max(1, Math.round(symbol.weight * scalingFactor));
    }
    
    // Final adjustment to ensure exactly 100%
    const newTotal = result.reduce((sum, s) => sum + s.weight, 0);
    if (newTotal !== 100) {
      // Find the symbol with highest weight (usually a low-paying symbol) and adjust
      const sortedByWeight = [...result].sort((a, b) => b.weight - a.weight);
      sortedByWeight[0].weight += (100 - newTotal);
    }
  }
  
  return result.sort((a, b) => symbolMap.get(a.id) - symbolMap.get(b.id));
}

const ClusterPayouts: React.FC<{ symbol: any, onUpdate: (symbol: any) => void }> = ({ symbol, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#172B4D] mb-2">
          Cluster Payouts
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CLUSTER_SIZES.map((size) => (
            <div key={size} className="space-y-1">
              <label className="block text-xs text-[#5E6C84]">
                {size}+ Symbols
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={symbol.cluster?.payouts?.[size] || DEFAULT_CLUSTER_PAYOUTS[size]}
                onChange={(e) => onUpdate({
                  ...symbol,
                  cluster: {
                    ...symbol.cluster,
                    payouts: {
                      ...symbol.cluster?.payouts,
                      [size]: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-white border border-[#DFE1E6] rounded-lg px-3 py-1 text-[#172B4D] text-right"
              />
            </div>
          ))}
        </div>
      </div>

      {symbol.type === 'wild' && (
        <div>
          <label className="block text-sm font-medium text-[#172B4D] mb-2">
            Wild Behavior
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={symbol.cluster?.expandingWild || false}
                onChange={(e) => onUpdate({
                  ...symbol,
                  cluster: {
                    ...symbol.cluster,
                    expandingWild: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
              />
              <span className="ml-2 text-[#172B4D]">Expanding Wild</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={symbol.cluster?.stickyWild || false}
                onChange={(e) => onUpdate({
                  ...symbol,
                  cluster: {
                    ...symbol.cluster,
                    stickyWild: e.target.checked
                  }
                })}
                className="w-4 h-4 rounded border-[#DFE1E6] text-[#0052CC] focus:ring-[#0052CC]"
              />
              <span className="ml-2 text-[#172B4D]">Sticky Wild</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export const SymbolsPayouts: React.FC = () => {
  const { config, updateConfig, setStep } = useGameStore();
  const { reels } = config;

  const [showAddSymbol, setShowAddSymbol] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<any>(null);
  const [showWeightingPanel, setShowWeightingPanel] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [highValueSymbolCount, setHighValueSymbolCount] = useState<number>(3);
  const [lowValueSymbolCount, setLowValueSymbolCount] = useState<number>(5);
  
  // Game-like UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isClusterPays = reels?.payMechanism === 'cluster';
  
  // Define steps for the game-like flow
  const steps = [
    {
      id: 'intro',
      title: 'Symbol Workshop',
      description: 'Create and customize your game symbols and their payouts'
    },
    {
      id: 'symbols',
      title: 'Setup Symbols',
      description: 'Add and configure the symbols for your game'
    },
    {
      id: 'paytable',
      title: 'Configure Paytable',
      description: 'Set how much each symbol combination pays'
    },
    {
      id: 'weights',
      title: 'Symbol Weights',
      description: 'Control how frequently each symbol appears'
    },
    {
      id: 'special',
      title: 'Special Symbols',
      description: 'Configure wild and scatter symbols with special behaviors'
    }
  ];
  
  // Navigate to next step
  // Function to complete the symbols section and move to the next main tab
  const completeSymbolsSection = () => {
    // Save any pending changes
    
    // Move to the UI Design tab (index 5)
    setStep(5);
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  };

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
        
        setCurrentStep(currentStep + 1);
        setError(null);
      }
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
      case 1: // Symbols
        if (!reels?.symbols?.list || reels.symbols.list.length === 0) {
          setError('Please add at least one symbol before continuing');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  useEffect(() => {
    const warnings = [];
    const symbols = reels?.symbols?.list || [];
    const totalWeight = symbols.reduce((sum, s) => sum + (s.weight || 0), 0);

    if (totalWeight !== 100) {
      warnings.push(`Total symbol weights (${totalWeight}%) should equal 100%`);
    }

    if (symbols.filter(s => s.type === 'wild').length > 1) {
      warnings.push('Multiple wild symbols may affect game balance');
    }

    setValidationWarnings(warnings);
  }, [reels?.symbols?.list]);

  const handleAddSymbol = (typeParam?: 'wild' | 'scatter' | 'high' | 'low') => {
    // Get the index for the new symbol based on the current list length
    const index = (reels?.symbols?.list || []).length;
    
    // Try to use a generated symbol if available from the theme
    // Make sure we're actually using the generated symbols when available
    let symbolImg = null;
    
    // Helper function to get symbol URLs from both array and object formats
    const getSymbolUrls = (symbols: string[] | Record<string, string> | undefined): string[] => {
      if (!symbols) return [];
      if (Array.isArray(symbols)) return symbols;
      return Object.values(symbols);
    };

    const symbolUrls = getSymbolUrls(config.theme?.generated?.symbols);
    if (symbolUrls.length > 0) {
      // If we have generated symbols available in the theme
      if (index < symbolUrls.length) {
        // Use the corresponding symbol for this index
        symbolImg = symbolUrls[index];
        console.log(`Using generated symbol at index ${index}:`, symbolImg);
      } else {
        // If we ran out of generated symbols, use the last one available
        symbolImg = symbolUrls[symbolUrls.length - 1];
        console.log(`Using last available symbol for index ${index}:`, symbolImg);
      }
    }
                     
    // Determine symbol type based on what's missing or explicitly requested
    const symbols = reels?.symbols?.list || [];
    const hasWild = symbols.some(s => s.type === 'wild');
    const hasScatter = symbols.some(s => s.type === 'scatter');
    
    // Validate if we're trying to add a special symbol that already exists
    if (typeParam === 'wild' && hasWild) {
      alert("A Wild symbol already exists. Only one Wild symbol is allowed.");
      return;
    }
    
    if (typeParam === 'scatter' && hasScatter) {
      alert("A Scatter symbol already exists. Only one Scatter symbol is allowed.");
      return;
    }
    
    // Prioritize adding wild and scatter if they don't exist, or use specified type
    let typeToAdd = 'regular';
    let isHighValue = typeParam === 'high';
    
    if (typeParam === 'wild') {
      typeToAdd = 'wild';
    } else if (typeParam === 'scatter') {
      typeToAdd = 'scatter';
    } else if (!hasWild) {
      typeToAdd = 'wild';
    } else if (!hasScatter) {
      typeToAdd = 'scatter';
    }
    
    // Calculate weight based on symbol type
    let initialWeight = 10;
    if (typeToAdd === 'wild') {
      initialWeight = 5;
    } else if (typeToAdd === 'scatter') {
      initialWeight = 3;
    } else if (isHighValue) {
      initialWeight = 8; // High value symbols have lower weight (rarer)
    } else {
      initialWeight = 15; // Low value symbols have higher weight (more common)
    }
    
    // Get a theme-appropriate name for the symbol
    let symbolName = '';
    if (typeToAdd === 'wild') {
      symbolName = 'Wild Symbol';
    } else if (typeToAdd === 'scatter') {
      symbolName = 'Scatter Symbol';
    } else {
      // Generate a theme-appropriate name based on the selected theme
      const themeName = config.theme?.mainTheme?.toLowerCase() || '';
      const isHighValue = symbols.filter(s => s.type === 'regular').length < 4;
      
      if (themeName.includes('egypt')) {
        const egyptSymbols = ['Pharaoh', 'Ankh', 'Scarab', 'Pyramid', 'Eye of Horus', 'Golden Mask', 'Sphinx'];
        symbolName = `${egyptSymbols[Math.min(index, egyptSymbols.length - 1)]}`;
      } else if (themeName.includes('ocean')) {
        const oceanSymbols = ['Trident', 'Shell', 'Octopus', 'Mermaid', 'Pearl', 'Dolphin', 'Treasure'];
        symbolName = `${oceanSymbols[Math.min(index, oceanSymbols.length - 1)]}`;
      } else if (themeName.includes('forest')) {
        const forestSymbols = ['Fairy', 'Mushroom', 'Tree', 'Unicorn', 'Crystal', 'Wizard', 'Potion'];
        symbolName = `${forestSymbols[Math.min(index, forestSymbols.length - 1)]}`;
      } else if (themeName.includes('cosmic')) {
        const cosmicSymbols = ['Planet', 'Star', 'Alien', 'Spaceship', 'Comet', 'Galaxy', 'Astronaut'];
        symbolName = `${cosmicSymbols[Math.min(index, cosmicSymbols.length - 1)]}`;
      } else {
        symbolName = isHighValue ? `High Value Symbol ${index + 1}` : `Regular Symbol ${index + 1}`;
      }
    }
    
    const newSymbol = {
      id: `symbol_${Date.now()}`,
      name: symbolName,
      type: typeToAdd,
      weight: initialWeight,
      weights: {},
      image: symbolImg, // Add reference to the symbol image
      ...(isClusterPays ? {
        cluster: {
          payouts: { ...DEFAULT_CLUSTER_PAYOUTS }
        }
      } : {
        payouts: Array((reels?.layout?.reels || 5) - 1).fill(0)
      })
    };

    updateConfig({
      reels: {
        ...config.reels,
        symbols: {
          ...config.reels?.symbols,
          list: [...(reels?.symbols?.list || []), newSymbol]
        }
      }
    });
    
    // We'll manually optimize weights when needed
    // No automatic optimization after adding symbols to prevent unintended removals
    
    setShowAddSymbol(false);
  };

  const handleUpdateSymbol = (updatedSymbol: any) => {
    updateConfig({
      reels: {
        ...config.reels,
        symbols: {
          ...config.reels?.symbols,
          list: (reels?.symbols?.list || []).map(s => 
            s.id === updatedSymbol.id ? updatedSymbol : s
          )
        }
      }
    });
    setEditingSymbol(null);
  };

  const handleDeleteSymbol = (symbolId: string) => {
    updateConfig({
      reels: {
        ...config.reels,
        symbols: {
          ...config.reels?.symbols,
          list: (reels?.symbols?.list || []).filter(s => s.id !== symbolId)
        }
      }
    });
  };

  const handleOptimizeWeights = () => {
    const optimizedSymbols = optimizeSymbolWeights(reels?.symbols?.list || []);
    updateConfig({
      reels: {
        ...config.reels,
        symbols: {
          ...config.reels?.symbols,
          list: optimizedSymbols
        }
      }
    });
  };

  // Function to add a complete set of symbols at once
  const handleAddAllSymbols = () => {
    const symbols = reels?.symbols?.list || [];
    const hasWild = symbols.some(s => s.type === 'wild');
    const hasScatter = symbols.some(s => s.type === 'scatter');
    
    // Add wild if it doesn't exist
    if (!hasWild) {
      handleAddSymbol('wild');
    }
    
    // Add scatter if it doesn't exist
    if (!hasScatter) {
      handleAddSymbol('scatter');
    }
    
    // Add high-value symbols (4)
    const highValueCount = 4;
    const existingHighValue = symbols.filter(s => s.type === 'regular').length;
    const highToAdd = Math.max(0, highValueCount - existingHighValue);
    
    for (let i = 0; i < highToAdd; i++) {
      handleAddSymbol('high');
    }
    
    // Add low-value symbols (5)
    const lowValueCount = 5;
    const existingTotal = symbols.length + (hasWild ? 0 : 1) + (hasScatter ? 0 : 1) + highToAdd;
    const lowToAdd = Math.max(0, lowValueCount - (existingTotal - highValueCount - (hasWild ? 1 : 0) - (hasScatter ? 1 : 0)));
    
    for (let i = 0; i < lowToAdd; i++) {
      handleAddSymbol('low');
    }
    
    // Optimize weights for all symbols
    setTimeout(() => {
      handleOptimizeWeights();
    }, 500);
  };

  // Function to auto-populate payouts based on symbols
  const handleAutoPopulatePayouts = () => {
    const symbols = reels?.symbols?.list || [];
    
    if (!symbols || symbols.length === 0) {
      return;
    }
    
    // Sort symbols by type and value
    const wildSymbols = symbols.filter(s => s.type === 'wild');
    const scatterSymbols = symbols.filter(s => s.type === 'scatter');
    const regularSymbols = symbols.filter(s => s.type === 'regular');
    
    // Calculate payout rank for regular symbols
    const regularWithRank = regularSymbols.map(symbol => {
      // Determine if this is a high or low value symbol based on weight
      // Lower weight generally means higher value symbol
      const isHighValue = symbol.weight <= 10;
      return { ...symbol, isHighValue };
    });
    
    // Sort by high/low value status
    const sortedRegulars = [...regularWithRank].sort((a, b) => {
      // Sort by high/low value first
      if (a.isHighValue !== b.isHighValue) {
        return a.isHighValue ? -1 : 1;
      }
      // Then by weight (lower weight = higher value)
      return a.weight - b.weight;
    });
    
    // Generate appropriate payouts for each symbol
    const updatedSymbols = symbols.map(symbol => {
      const newSymbol = {...symbol};
      const reelCount = reels?.layout?.reels || 5;
      
      if (isClusterPays) {
        // For cluster pays games
        if (!newSymbol.cluster) {
          newSymbol.cluster = { payouts: {} };
        }
        if (!newSymbol.cluster.payouts) {
          newSymbol.cluster.payouts = {};
        }
        
        // Set payouts based on symbol type
        if (symbol.type === 'wild') {
          // Wild symbols have highest payouts
          newSymbol.cluster.payouts = {
            5: 10,
            8: 25,
            12: 150,
            15: 500,
            20: 2000
          };
        } else if (symbol.type === 'scatter') {
          // Scatter symbols have high payouts
          newSymbol.cluster.payouts = {
            5: 5,
            8: 20,
            12: 100,
            15: 250,
            20: 1000
          };
        } else {
          // Regular symbols
          const index = sortedRegulars.findIndex(s => s.id === symbol.id);
          const rank = index / Math.max(1, sortedRegulars.length - 1); // 0 = highest, 1 = lowest
          
          // Calculate payouts based on rank (0-1 scale)
          newSymbol.cluster.payouts = {
            5: Math.max(1, Math.round(5 * (1 - rank * 0.8))),
            8: Math.max(2, Math.round(20 * (1 - rank * 0.8))),
            12: Math.max(5, Math.round(100 * (1 - rank * 0.8))),
            15: Math.max(10, Math.round(250 * (1 - rank * 0.8))),
            20: Math.max(25, Math.round(1000 * (1 - rank * 0.8)))
          };
        }
      } else {
        // For payline games
        if (!newSymbol.payouts) {
          newSymbol.payouts = Array(reelCount - 1).fill(0);
        }
        
        // Set payouts based on symbol type
        if (symbol.type === 'wild') {
          // Wild symbols have highest payouts
          for (let i = 0; i < reelCount - 1; i++) {
            const matches = i + 2; // 2-5 matches
            // Progressive payouts, higher for more matches
            newSymbol.payouts[i] = matches === 5 ? 1000 : 
                                  matches === 4 ? 200 : 
                                  matches === 3 ? 50 : 
                                  matches === 2 ? 10 : 5;
          }
        } else if (symbol.type === 'scatter') {
          // Scatter symbols have high payouts, usually used to trigger features
          for (let i = 0; i < reelCount - 1; i++) {
            const matches = i + 2; // 2-5 matches
            newSymbol.payouts[i] = matches === 5 ? 500 : 
                                  matches === 4 ? 100 : 
                                  matches === 3 ? 25 : 
                                  matches === 2 ? 5 : 2;
          }
        } else {
          // Regular symbols
          const index = sortedRegulars.findIndex(s => s.id === symbol.id);
          const rank = index / Math.max(1, sortedRegulars.length - 1); // 0 = highest, 1 = lowest
          
          for (let i = 0; i < reelCount - 1; i++) {
            const matches = i + 2; // 2-5 matches
            
            // Base values for highest value symbol
            let baseValue = matches === 5 ? 500 : 
                           matches === 4 ? 100 : 
                           matches === 3 ? 25 : 
                           matches === 2 ? 5 : 0;
            
            // Scale down for lower value symbols
            const scaledValue = Math.max(1, Math.round(baseValue * (1 - rank * 0.8)));
            newSymbol.payouts[i] = scaledValue;
          }
        }
      }
      
      return newSymbol;
    });
    
    // Update all symbols at once
    updateConfig({
      reels: {
        ...config.reels,
        symbols: {
          ...config.reels?.symbols,
          list: updatedSymbols
        }
      }
    });
  };

  // Helper function for rendering navigation buttons at the end of each step
  const renderNavigation = (thisStep: number) => {
    if (currentStep !== thisStep) return null;
    
    const isFirstStep = thisStep === 0;
    const isLastStep = thisStep === steps.length - 1;
    
    return (
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className={`px-6 py-3 ${isFirstStep ? 'invisible' : 'bg-slate-200 hover:bg-slate-300'} text-slate-800 rounded-lg transition-colors`}
        >
          Back
        </button>
        {isLastStep ? (
          <button
            onClick={completeSymbolsSection}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            Next 
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 relative">
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
                    <Dices className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Symbol Workshop
                </h1>
                <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
                  Welcome to the Symbol Workshop! Here, you'll create and customize the symbols that appear on your reels 
                  and set up the paytable for your game. Let's make your game's symbols shine!
                </p>
                
                <button
                  onClick={nextStep}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition duration-300 shadow-md hover:shadow-lg transform hover:translate-y-[-2px]"
                >
                  Let's Get Started! 🎲
                </button>
                
                <div className="mt-8 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Table className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Paytable</h3>
                    <p className="text-sm text-gray-600">Define winning combinations</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Star className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Special Symbols</h3>
                    <p className="text-sm text-gray-600">Add wilds and scatters</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <CircleDollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Payouts</h3>
                    <p className="text-sm text-gray-600">Set win amounts</p>
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              {renderNavigation(0)}
            </div>
          )}
          
          {/* Symbols Setup Step */}
          {currentStep === 1 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <Dices className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Setup Symbols</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Let's add symbols to your game. Every slot game needs regular symbols, and you can also 
                  add special symbols like wilds and scatters.
                </p>
              </div>
              
              {/* Symbol List */}
              <div className="max-w-4xl mx-auto">
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Dices className="w-5 h-5" />
                    Symbol Setup Recommendation
                  </h4>
                  <div className="text-sm text-blue-700 mb-3">
                    Slot games typically use 8-12 symbols for optimal balance. For a mathematically sound game:
                    <ul className="mt-2 space-y-1 ml-4">
                      <li>• 1 Wild Symbol (substitutes for other symbols)</li>
                      <li>• 1 Scatter Symbol (triggers bonus features)</li>
                      <li>• 3-4 High-Value Symbols (with larger payouts)</li>
                      <li>• 5-6 Low-Value Symbols (with smaller, more frequent payouts)</li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-blue-800">Current Symbols:</div>
                        <div className="p-1 px-2 bg-blue-100 rounded-full text-blue-800 text-sm">{(reels?.symbols?.list || []).length}</div>
                      </div>
                      <div className="text-sm">
                        {(reels?.symbols?.list || []).length < 8 ? (
                          <span className="text-amber-600">Need more symbols (recommended: 8-12)</span>
                        ) : (reels?.symbols?.list || []).length > 12 ? (
                          <span className="text-amber-600">Consider removing some symbols (recommended: 8-12)</span>
                        ) : (
                          <span className="text-green-600">Optimal symbol count ✓</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">Total Symbols</label>
                        <input
                          type="number"
                          min="6"
                          max="15"
                          value={(reels?.symbols?.list || []).length}
                          onChange={(e) => {
                            const targetCount = parseInt(e.target.value);
                            const currentCount = (reels?.symbols?.list || []).length;
                            
                            if (targetCount > currentCount) {
                              // Add symbols until we reach target count
                              const symbols = reels?.symbols?.list || [];
                              const hasWild = symbols.some(s => s.type === 'wild');
                              const hasScatter = symbols.some(s => s.type === 'scatter');
                              
                              for (let i = 0; i < targetCount - currentCount; i++) {
                                // First add wild and scatter if missing
                                if (!hasWild && i === 0) {
                                  handleAddSymbol('wild');
                                } else if (!hasScatter && (i === 1 || (i === 0 && hasWild))) {
                                  handleAddSymbol('scatter');
                                } else {
                                  // Alternate between high and low value symbols
                                  const highCount = symbols.filter(s => s.type === 'regular' && s.level === 'high').length;
                                  const lowCount = symbols.filter(s => s.type === 'regular' && s.level === 'low').length;
                                  
                                  if (highCount < 4) {
                                    handleAddSymbol('high');
                                  } else {
                                    handleAddSymbol('low');
                                  }
                                }
                              }
                            } else if (targetCount < currentCount) {
                              // Remove symbols until we reach target count
                              const symbolsToRemove = currentCount - targetCount;
                              
                              // Create a priority order for removal (low value symbols first)
                              const symbols = [...(reels?.symbols?.list || [])];
                              
                              // Sort by symbol type and priority for removal
                              // Regular symbols first, starting with lowest weight (typically low-value)
                              const priorityOrder = symbols
                                .map((symbol, index) => ({ symbol, index }))
                                .sort((a, b) => {
                                  // Different types have different priority
                                  if (a.symbol.type !== b.symbol.type) {
                                    // Keep wilds and scatters, remove regular symbols first
                                    if (a.symbol.type === 'wild' || a.symbol.type === 'scatter') return 1;
                                    if (b.symbol.type === 'wild' || b.symbol.type === 'scatter') return -1;
                                  }
                                  
                                  // If same type, prioritize by weight (higher weight = lower value = remove first)
                                  return a.symbol.weight < b.symbol.weight ? 1 : -1;
                                });
                              
                              // Get indices to remove in original order
                              const indicesToRemove = priorityOrder
                                .slice(0, symbolsToRemove)
                                .map(item => item.index)
                                .sort((a, b) => b - a); // Sort in reverse to remove from end first
                              
                              // Create updated list by removing symbols
                              const updatedList = [...(reels?.symbols?.list || [])];
                              for (const indexToRemove of indicesToRemove) {
                                updatedList.splice(indexToRemove, 1);
                              }
                              
                              // Update the store with the reduced list
                              updateConfig({
                                reels: {
                                  ...config.reels,
                                  symbols: {
                                    ...config.reels?.symbols,
                                    list: updatedList
                                  }
                                }
                              });
                              
                              // We'll manually optimize weights when needed
                              // No automatic optimization after removing symbols to prevent unintended changes
                            }
                          }}
                          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-blue-800 bg-blue-50"
                        />
                        <div className="text-xs mt-1 text-blue-600">
                          {(reels?.symbols?.list || []).length < 8 ? 
                            'Add more symbols (8-12 recommended)' : 
                            (reels?.symbols?.list || []).length > 12 ? 
                            'Too many symbols may reduce hit rate' : 
                            'Optimal count 👍'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div>
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-blue-800">Symbol Distribution</label>
                            <button 
                              onClick={() => setShowAddSymbol(true)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-0.5 rounded"
                            >
                              Adjust
                            </button>
                          </div>
                          
                          <div className="bg-white rounded-lg p-2 mt-1 border border-blue-100">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-blue-800">Wild:</span>
                              <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'wild').length}</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-blue-800">Scatter:</span>
                              <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'scatter').length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-800">Regular:</span>
                              <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'regular').length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Your Game Symbols ({(reels?.symbols?.list || []).length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddSymbol('high')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Add high-value symbol"
                    >
                      <Plus className="w-3 h-3" />
                      High
                    </button>
                    <button
                      onClick={() => handleAddSymbol('low')}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Add low-value symbol"
                    >
                      <Plus className="w-3 h-3" />
                      Low
                    </button>
                    <button
                      onClick={() => handleAddSymbol('wild')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Add wild symbol"
                    >
                      <Plus className="w-3 h-3" />
                      Wild
                    </button>
                    <button
                      onClick={() => handleAddSymbol('scatter')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Add scatter symbol"
                    >
                      <Plus className="w-3 h-3" />
                      Scatter
                    </button>
                    <button
                      onClick={handleAddAllSymbols}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Auto-add all symbols at once"
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-Add All
                    </button>
                  </div>
                </div>
                
                {/* Symbols Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {(reels?.symbols?.list || []).map((symbol, index) => (
                    <div
                      key={symbol.id}
                      className={clsx(
                        "p-4 border-2 rounded-xl transition-all duration-300",
                        editingSymbol?.id === symbol.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      )}
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {symbol.type === 'wild' ? (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                              <Star className="w-10 h-10 text-white" />
                            </div>
                          ) : symbol.type === 'scatter' ? (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                              <Sparkles className="w-10 h-10 text-white" />
                            </div>
                          ) : symbol.image ? (
                            <img 
                              src={symbol.image} 
                              alt="Symbol" 
                              className="w-full h-full object-contain"
                            />
                          ) : config.theme?.generated?.symbols && config.theme.generated.symbols.length > 0 ? (
                            <img 
                              src={config.theme.generated.symbols[Math.min(index, config.theme.generated.symbols.length - 1)]} 
                              alt="Symbol" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {symbol.name || `Symbol ${index + 1}`}
                              </h4>
                              <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                                  {symbol.type}
                                </span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                  Weight: {symbol.weight}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingSymbol(editingSymbol?.id === symbol.id ? null : symbol)}
                                className={clsx(
                                  "p-1 rounded transition-colors",
                                  editingSymbol?.id === symbol.id
                                    ? "bg-blue-200 text-blue-700"
                                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                )}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSymbol(symbol.id)}
                                className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Editing Panel */}
                      {editingSymbol?.id === symbol.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Symbol Name
                              </label>
                              <input
                                type="text"
                                value={editingSymbol.name}
                                onChange={(e) => setEditingSymbol({...editingSymbol, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Symbol Type
                              </label>
                              <select
                                value={editingSymbol.type}
                                onChange={(e) => setEditingSymbol({...editingSymbol, type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="regular">Regular Symbol</option>
                                <option value="wild">Wild Symbol</option>
                                <option value="scatter">Scatter Symbol</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Symbol Weight (%)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={editingSymbol.weight}
                                onChange={(e) => setEditingSymbol({...editingSymbol, weight: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-4">
                              <button
                                onClick={() => setEditingSymbol(null)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateSymbol(editingSymbol)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Empty state */}
                {(!reels?.symbols?.list || reels.symbols.list.length === 0) && (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <Dices className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Symbols Yet</h3>
                    <p className="text-gray-500 max-w-md mb-4">
                      Add symbols to your game by clicking the "Add Symbol" button above.
                    </p>
                    <button
                      onClick={() => setShowAddSymbol(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Symbol
                    </button>
                  </div>
                )}
                
                {/* Optimize weights */}
                {(reels?.symbols?.list || []).length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-800">Auto-Balance Symbol Weights</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Automatically balance symbol weights for optimal gameplay
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleOptimizeWeights}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Optimize Weights
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Validation warnings */}
                {validationWarnings.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <h4 className="font-medium">Symbol Warnings</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {validationWarnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Paytable configuration step */}
          {currentStep === 2 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <Table className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Configure Paytable</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Set the payout values for each symbol combination. Higher value symbols should pay more
                  when players match them.
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                {/* Symbol payout configuration */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">
                      Symbol Payouts {isClusterPays ? '(Cluster Pays)' : '(Paylines)'}
                    </h3>
                    <button
                      onClick={handleAutoPopulatePayouts}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-sm"
                      title="Auto-populate payouts based on symbols"
                    >
                      <Wand2 className="w-3 h-3" />
                      Auto-Populate Payouts
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {/* For standard paylines */}
                    {!isClusterPays && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Symbol</th>
                              {Array.from({ length: (reels?.layout?.reels || 5) - 1 }, (_, i) => i + 2).map((length) => (
                                <th key={length} className="px-4 py-2 text-center text-sm font-medium text-gray-600 border-b">
                                  {length} of a kind
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(reels?.symbols?.list || []).map((symbol, index) => (
                              <tr key={symbol.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border-b border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
                                      {symbol.image ? (
                                        <img src={symbol.image} alt="" className="w-full h-full object-contain" />
                                      ) : config.theme?.generated?.symbols && config.theme.generated.symbols.length > 0 ? (
                                        <img 
                                          src={config.theme.generated.symbols[Math.min(index, config.theme.generated.symbols.length - 1)]} 
                                          alt="" 
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center 
                                          ${symbol.type === 'wild' ? 'bg-yellow-500' : 
                                            symbol.type === 'scatter' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                                          {symbol.type === 'wild' ? <Star className="w-5 h-5" /> : 
                                            symbol.type === 'scatter' ? <Sparkles className="w-5 h-5" /> : 
                                            symbol.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium text-gray-700">{symbol.name || `Symbol ${index + 1}`}</span>
                                  </div>
                                </td>
                                
                                {Array.from({ length: (reels?.layout?.reels || 5) - 1 }, (_, i) => i + 2).map((length) => (
                                  <td key={length} className="px-4 py-3 border-b border-gray-100">
                                    <input
                                      type="number"
                                      min="0"
                                      value={symbol.payouts?.[length - 2] || 0}
                                      onChange={(e) => {
                                        const newSymbol = {...symbol};
                                        if (!newSymbol.payouts) newSymbol.payouts = [];
                                        newSymbol.payouts[length - 2] = parseInt(e.target.value);
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-24 mx-auto block text-center border border-gray-300 rounded-md px-2 py-1 text-gray-800"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* For cluster pays */}
                    {isClusterPays && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Symbol</th>
                              {CLUSTER_SIZES.map((size) => (
                                <th key={size} className="px-4 py-2 text-center text-sm font-medium text-gray-600 border-b">
                                  {size}+ Symbols
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(reels?.symbols?.list || []).map((symbol, index) => (
                              <tr key={symbol.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border-b border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
                                      {symbol.image ? (
                                        <img src={symbol.image} alt="" className="w-full h-full object-contain" />
                                      ) : config.theme?.generated?.symbols && config.theme.generated.symbols.length > 0 ? (
                                        <img 
                                          src={config.theme.generated.symbols[Math.min(index, config.theme.generated.symbols.length - 1)]} 
                                          alt="" 
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center 
                                          ${symbol.type === 'wild' ? 'bg-yellow-500' : 
                                            symbol.type === 'scatter' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                                          {symbol.type === 'wild' ? <Star className="w-5 h-5" /> : 
                                            symbol.type === 'scatter' ? <Sparkles className="w-5 h-5" /> : 
                                            symbol.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium text-gray-700">{symbol.name || `Symbol ${index + 1}`}</span>
                                  </div>
                                </td>
                                
                                {CLUSTER_SIZES.map((size) => (
                                  <td key={size} className="px-4 py-3 border-b border-gray-100">
                                    <input
                                      type="number"
                                      min="0"
                                      value={symbol.cluster?.payouts?.[size] || DEFAULT_CLUSTER_PAYOUTS[size]}
                                      onChange={(e) => {
                                        const newSymbol = {...symbol};
                                        if (!newSymbol.cluster) newSymbol.cluster = { payouts: {...DEFAULT_CLUSTER_PAYOUTS} };
                                        if (!newSymbol.cluster.payouts) newSymbol.cluster.payouts = {...DEFAULT_CLUSTER_PAYOUTS};
                                        newSymbol.cluster.payouts[size] = parseInt(e.target.value);
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-24 mx-auto block text-center border border-gray-300 rounded-md px-2 py-1 text-gray-800"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Symbol Configuration per Reel */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 mt-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-600" />
                        Symbol Weights per Reel
                      </h3>
                      <button
                        onClick={() => {
                          // Automatically distribute symbol weights per reel
                          // for optimal mathematical balance
                          const symbols = reels?.symbols?.list || [];
                          const reelCount = reels?.layout?.reels || 5;
                          
                          // Get distribution of symbol types and values
                          const wildSymbols = symbols.filter(s => s.type === 'wild');
                          const scatterSymbols = symbols.filter(s => s.type === 'scatter');
                          const regularSymbols = symbols.filter(s => s.type === 'regular');
                          
                          // Calculate payout rank for regular symbols
                          const regularWithRank = regularSymbols.map(symbol => {
                            let maxPayout = 0;
                            if (symbol.payouts) {
                              if (Array.isArray(symbol.payouts)) {
                                maxPayout = Math.max(...symbol.payouts.filter(v => typeof v === 'number'));
                              } else {
                                maxPayout = Math.max(...Object.values(symbol.payouts).filter(v => typeof v === 'number'));
                              }
                            } else if (symbol.cluster?.payouts) {
                              maxPayout = Math.max(...Object.values(symbol.cluster.payouts).filter(v => typeof v === 'number'));
                            }
                            return { ...symbol, maxPayout };
                          });
                          
                          // Sort by payout rank (higher payout = higher rank = lower frequency)
                          const sortedRegulars = [...regularWithRank].sort((a, b) => b.maxPayout - a.maxPayout);
                          
                          // Determine how many high paying vs low paying symbols
                          // Top 40% are high paying, rest are low paying
                          const highPayCount = Math.max(1, Math.ceil(sortedRegulars.length * 0.4));
                          const highPaySymbols = sortedRegulars.slice(0, highPayCount);
                          const lowPaySymbols = sortedRegulars.slice(highPayCount);
                          
                          // Get sets of symbol IDs by category for later lookup
                          const wildIds = new Set(wildSymbols.map(s => s.id));
                          const scatterIds = new Set(scatterSymbols.map(s => s.id));
                          const highPayIds = new Set(highPaySymbols.map(s => s.id));
                          const lowPayIds = new Set(lowPaySymbols.map(s => s.id));
                          
                          // Calculate the RTP distribution
                          // Based on game math model best practices for different symbol types
                          const updatedSymbols = symbols.map(symbol => {
                            const newSymbol = {...symbol};
                            
                            // Initialize weights object if not present
                            if (!newSymbol.weights) {
                              newSymbol.weights = {};
                            }
                            
                            // Configure per-reel weights based on symbol type and value
                            if (wildIds.has(symbol.id)) {
                              // Progressive wild distribution - much more common on later reels
                              // This creates suspense and near-miss effects
                              newSymbol.weights = {
                                1: 1,  // Very rare on first reel (1/10)
                                2: 2,  // Rare on second reel (2/10)
                                3: 4,  // Medium on middle reel (4/10)
                                4: 7,  // Common on fourth reel (7/10)
                                5: 10  // Most common on fifth reel (10/10)
                              };
                              
                              // For games with fewer reels, adjust accordingly
                              if (reelCount < 5) {
                                for (let i = 1; i <= reelCount; i++) {
                                  const scaledWeight = Math.round((i / reelCount) * 10);
                                  newSymbol.weights[i] = Math.max(1, scaledWeight);
                                }
                              }
                              
                            } else if (scatterIds.has(symbol.id)) {
                              // Scatters use a plateau distribution - rarer on first and last reels
                              // This encourages 2-scatter near misses that build excitement
                              if (reelCount === 5) {
                                newSymbol.weights = {
                                  1: 3,  // Uncommon on first reel
                                  2: 5,  // Medium on second reel
                                  3: 5,  // Medium on middle reel
                                  4: 5,  // Medium on fourth reel
                                  5: 3   // Uncommon on fifth reel
                                };
                              } else {
                                // For other reel counts, make middle reels have higher weights
                                for (let i = 1; i <= reelCount; i++) {
                                  // Create a bell curve distribution
                                  const middle = (reelCount + 1) / 2;
                                  const distance = Math.abs(i - middle);
                                  const maxDistance = (reelCount - 1) / 2;
                                  const weight = 5 - Math.round((distance / maxDistance) * 2);
                                  newSymbol.weights[i] = Math.max(2, weight);
                                }
                              }
                              
                            } else if (highPayIds.has(symbol.id)) {
                              // High-paying symbols get increasingly more common on later reels
                              // This creates exciting near-miss experiences
                              
                              // Find this symbol's rank within high paying symbols
                              const highPayIndex = highPaySymbols.findIndex(s => s.id === symbol.id);
                              const rank = highPayIndex / Math.max(1, highPaySymbols.length - 1); // 0 = highest, 1 = lowest
                              
                              // Customize for different reel counts
                              if (reelCount === 5) {
                                // Formula: Start with low values (1-3), increase by reel position, add rank adjustment
                                newSymbol.weights = {
                                  1: Math.max(1, Math.round(1 + rank * 2)),  // 1-3 for first reel
                                  2: Math.max(2, Math.round(2 + rank * 3)),  // 2-5 for second reel
                                  3: Math.max(3, Math.round(3 + rank * 3)),  // 3-6 for middle reel
                                  4: Math.max(4, Math.round(5 + rank * 3)),  // 5-8 for fourth reel
                                  5: Math.max(5, Math.round(6 + rank * 4))   // 6-10 for fifth reel
                                };
                              } else {
                                // Generic formula for any reel count
                                for (let i = 1; i <= reelCount; i++) {
                                  const baseWeight = Math.max(1, Math.round((i / reelCount) * 9)); // 1-9 based on position
                                  const rankAdjustment = Math.round(rank * (10 - baseWeight) * 0.5); // Lower ranks get more weight
                                  newSymbol.weights[i] = Math.min(10, baseWeight + rankAdjustment);
                                }
                              }
                              
                            } else if (lowPayIds.has(symbol.id)) {
                              // Low-paying symbols are distributed more evenly
                              // Find this symbol's rank within low paying symbols
                              const lowPayIndex = lowPaySymbols.findIndex(s => s.id === symbol.id);
                              const rank = lowPayIndex / Math.max(1, lowPaySymbols.length - 1); // 0 = highest, 1 = lowest
                              
                              // Lower rank (higher value) symbols slightly less common on early reels
                              const baseWeight = 7 + Math.round(rank * 3); // 7-10 range, higher for lower symbols
                              
                              for (let i = 1; i <= reelCount; i++) {
                                // Slight adjustment for early reels for higher-value low pays
                                const reelAdjust = (i < 3 && rank < 0.5) ? -2 : 0;
                                newSymbol.weights[i] = Math.max(1, baseWeight + reelAdjust);
                              }
                              
                            } else {
                              // Generic default distribution for any other symbols
                              for (let i = 1; i <= reelCount; i++) {
                                newSymbol.weights[i] = 5; // Medium weight everywhere
                              }
                            }
                            
                            return newSymbol;
                          });
                          
                          // Update all symbols at once
                          updateConfig({
                            reels: {
                              ...config.reels,
                              symbols: {
                                ...config.reels?.symbols,
                                list: updatedSymbols
                              }
                            }
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <Wand2 className="w-4 h-4" />
                        Auto-Balance Reels
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure how frequently each symbol appears on each reel for optimal mathematical balance
                    </p>
                  </div>
                  
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">Symbol</th>
                          {Array.from({ length: (reels?.layout?.reels || 5) }, (_, i) => i + 1).map((reelNum) => (
                            <th key={reelNum} className="px-4 py-2 text-center text-sm font-medium text-gray-600 border-b">
                              Reel {reelNum}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(reels?.symbols?.list || []).map((symbol, index) => (
                          <tr key={symbol.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
                                  {symbol.image ? (
                                    <img src={symbol.image} alt="" className="w-full h-full object-contain" />
                                  ) : config.theme?.generated?.symbols && config.theme.generated.symbols.length > 0 ? (
                                    <img 
                                      src={config.theme.generated.symbols[Math.min(index, config.theme.generated.symbols.length - 1)]} 
                                      alt="" 
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center 
                                      ${symbol.type === 'wild' ? 'bg-yellow-500' : 
                                        symbol.type === 'scatter' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                                      {symbol.type === 'wild' ? <Star className="w-5 h-5" /> : 
                                        symbol.type === 'scatter' ? <Sparkles className="w-5 h-5" /> : 
                                        symbol.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium text-gray-700">{symbol.name || `Symbol ${index + 1}`}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {symbol.type}
                                </span>
                              </div>
                            </td>
                            
                            {Array.from({ length: (reels?.layout?.reels || 5) }, (_, i) => i + 1).map((reelNum) => (
                              <td key={reelNum} className="px-4 py-3 border-b border-gray-100">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={symbol.weights?.[reelNum] || 5}
                                  onChange={(e) => {
                                    const newSymbol = {...symbol};
                                    if (!newSymbol.weights) newSymbol.weights = {};
                                    newSymbol.weights[reelNum] = parseInt(e.target.value);
                                    handleUpdateSymbol(newSymbol);
                                  }}
                                  className="w-20 mx-auto block text-center border border-gray-300 rounded-md px-2 py-1 text-gray-800"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-blue-50 p-3 border-t border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <HelpCircle className="w-4 h-4" />
                      <span className="font-medium">Weight ranges from 1-10, where 10 is most frequent and 1 is rare</span>
                    </div>
                  </div>
                </div>
                
                {/* Paytable tips */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Paytable Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Higher value symbols should have higher payouts but lower weights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Wild symbols typically don't have their own payouts (they substitute for other symbols)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Scatter symbols usually trigger bonus features rather than direct payouts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Configure weights per reel to control hit frequency and game volatility</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Symbol Weights Step */}
          {currentStep === 3 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <Coins className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Symbol Weights</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Adjust how frequently each symbol appears on the reels. The weights determine the likelihood of 
                  each symbol appearing, with all weights adding up to 100%.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">Symbol Weights</h3>
                    <button
                      onClick={handleOptimizeWeights}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Auto-Balance Weights
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {(reels?.symbols?.list || []).map((symbol, index) => (
                      <div key={symbol.id} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center">
                              {symbol.image ? (
                                <img src={symbol.image} alt="" className="w-full h-full object-contain" />
                              ) : config.theme?.generated?.symbols && config.theme.generated.symbols.length > 0 ? (
                                <img 
                                  src={config.theme.generated.symbols[Math.min(index, config.theme.generated.symbols.length - 1)]} 
                                  alt="" 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center 
                                  ${symbol.type === 'wild' ? 'bg-yellow-500' : 
                                    symbol.type === 'scatter' ? 'bg-purple-500' : 'bg-blue-500'} text-white`}>
                                  {symbol.type === 'wild' ? <Star className="w-5 h-5" /> : 
                                    symbol.type === 'scatter' ? <Sparkles className="w-5 h-5" /> : 
                                    symbol.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-gray-700">
                              {symbol.name || `Symbol ${index + 1}`}
                              <span className="ml-1 text-xs text-gray-500 font-normal">
                                ({symbol.type})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={symbol.weight}
                              onChange={(e) => {
                                const newSymbol = {...symbol, weight: parseInt(e.target.value)};
                                handleUpdateSymbol(newSymbol);
                              }}
                              className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                            />
                            <span className="text-gray-600">%</span>
                          </div>
                        </div>
                        
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full ${
                              symbol.type === 'wild' ? 'bg-yellow-500' : 
                              symbol.type === 'scatter' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${symbol.weight}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Weight distribution tips */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Weight Distribution Tips</h4>
                  <div className="text-sm text-blue-700">
                    <p className="mb-2">Symbol weights should balance game volatility and hit frequency:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Higher-paying symbols should have lower weights</li>
                      <li>• Wild and scatter symbols typically have the lowest weights (5% or less)</li>
                      <li>• Lower-paying symbols should have higher weights</li>
                      <li>• The total of all weights must equal 100%</li>
                    </ul>
                    
                    {validationWarnings.length > 0 && (
                      <div className="mt-3 p-2 bg-amber-100 rounded text-amber-800">
                        <span className="font-medium">Note:</span> {validationWarnings[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Special Symbols Step */}
          {currentStep === 4 && (
            <div className="animate-slide-in-right p-6">
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Special Symbols</h2>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                  Configure special behavior for wild and scatter symbols. These symbols add excitement 
                  and variety to your gameplay.
                </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                {/* Wild Symbols Section */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Wild Symbols</h3>
                        <p className="text-sm text-gray-600">Substitutes for other symbols to help form winning combinations</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Wild symbol configuration */}
                    {(reels?.symbols?.list || []).filter(s => s.type === 'wild').length > 0 ? (
                      <div className="space-y-4">
                        {(reels?.symbols?.list || []).filter(s => s.type === 'wild').map((wildSymbol, index) => (
                          <div key={wildSymbol.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                            <div className="flex gap-4 items-start">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-yellow-500">
                                {wildSymbol.image ? (
                                  <img src={wildSymbol.image} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Star className="w-10 h-10 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{wildSymbol.name || 'Wild Symbol'}</h4>
                                <p className="text-sm text-gray-600 mb-3">Customize wild symbol behavior</p>
                                
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isClusterPays 
                                        ? wildSymbol.cluster?.expandingWild || false
                                        : wildSymbol.behaviors?.includes('expanding') || false}
                                      onChange={(e) => {
                                        const newSymbol = {...wildSymbol};
                                        
                                        if (isClusterPays) {
                                          if (!newSymbol.cluster) newSymbol.cluster = {};
                                          newSymbol.cluster.expandingWild = e.target.checked;
                                        } else {
                                          if (!newSymbol.behaviors) newSymbol.behaviors = [];
                                          if (e.target.checked) {
                                            if (!newSymbol.behaviors.includes('expanding')) {
                                              newSymbol.behaviors.push('expanding');
                                            }
                                          } else {
                                            newSymbol.behaviors = newSymbol.behaviors.filter(b => b !== 'expanding');
                                          }
                                        }
                                        
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Expanding Wild (covers entire reel)</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isClusterPays 
                                        ? wildSymbol.cluster?.stickyWild || false
                                        : wildSymbol.behaviors?.includes('sticky') || false}
                                      onChange={(e) => {
                                        const newSymbol = {...wildSymbol};
                                        
                                        if (isClusterPays) {
                                          if (!newSymbol.cluster) newSymbol.cluster = {};
                                          newSymbol.cluster.stickyWild = e.target.checked;
                                        } else {
                                          if (!newSymbol.behaviors) newSymbol.behaviors = [];
                                          if (e.target.checked) {
                                            if (!newSymbol.behaviors.includes('sticky')) {
                                              newSymbol.behaviors.push('sticky');
                                            }
                                          } else {
                                            newSymbol.behaviors = newSymbol.behaviors.filter(b => b !== 'sticky');
                                          }
                                        }
                                        
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Sticky Wild (remains in place for multiple spins)</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isClusterPays 
                                        ? wildSymbol.cluster?.multiplierWild || false
                                        : wildSymbol.behaviors?.includes('multiplier') || false}
                                      onChange={(e) => {
                                        const newSymbol = {...wildSymbol};
                                        
                                        if (isClusterPays) {
                                          if (!newSymbol.cluster) newSymbol.cluster = {};
                                          newSymbol.cluster.multiplierWild = e.target.checked;
                                        } else {
                                          if (!newSymbol.behaviors) newSymbol.behaviors = [];
                                          if (e.target.checked) {
                                            if (!newSymbol.behaviors.includes('multiplier')) {
                                              newSymbol.behaviors.push('multiplier');
                                            }
                                          } else {
                                            newSymbol.behaviors = newSymbol.behaviors.filter(b => b !== 'multiplier');
                                          }
                                        }
                                        
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">Multiplier Wild (multiplies win values)</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No wild symbols in your game</p>
                        <button
                          onClick={() => {
                            setShowAddSymbol(true);
                            // Pre-select wild type in the add symbol dialog
                          }}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Wild Symbol
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scatter Symbols Section */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Scatter Symbols</h3>
                        <p className="text-sm text-gray-600">Triggers bonus features, usually pays anywhere on screen</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Scatter symbol configuration */}
                    {(reels?.symbols?.list || []).filter(s => s.type === 'scatter').length > 0 ? (
                      <div className="space-y-4">
                        {(reels?.symbols?.list || []).filter(s => s.type === 'scatter').map((scatterSymbol, index) => (
                          <div key={scatterSymbol.id} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                            <div className="flex gap-4 items-start">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center bg-purple-500">
                                {scatterSymbol.image ? (
                                  <img src={scatterSymbol.image} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Sparkles className="w-10 h-10 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800">{scatterSymbol.name || 'Scatter Symbol'}</h4>
                                <p className="text-sm text-gray-600 mb-3">Customize scatter behavior</p>
                                
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Trigger Requirement
                                    </label>
                                    <select
                                      value={scatterSymbol.triggerCount || 3}
                                      onChange={(e) => {
                                        const newSymbol = {...scatterSymbol, triggerCount: parseInt(e.target.value)};
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                                    >
                                      <option value="2">2 or more scatter symbols</option>
                                      <option value="3">3 or more scatter symbols</option>
                                      <option value="4">4 or more scatter symbols</option>
                                      <option value="5">5 or more scatter symbols</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Scatter Behavior
                                    </label>
                                    <select
                                      value={scatterSymbol.triggerFeature || 'freespins'}
                                      onChange={(e) => {
                                        const newSymbol = {...scatterSymbol, triggerFeature: e.target.value};
                                        handleUpdateSymbol(newSymbol);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800"
                                    >
                                      <option value="freespins">Trigger Free Spins</option>
                                      <option value="bonus">Trigger Bonus Game</option>
                                      <option value="payout">Pay Scatter Win Only</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No scatter symbols in your game</p>
                        <button
                          onClick={() => {
                            setShowAddSymbol(true);
                            // Pre-select scatter type in the add symbol dialog
                          }}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Scatter Symbol
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
              disabled={currentStep === steps.length - 1}
              className={clsx(
                "px-4 py-2 rounded-lg flex items-center gap-2",
                currentStep === steps.length - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
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
      
      {/* Add Symbol Modal */}
      {showAddSymbol && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Add New Symbol</h3>
              <button
                onClick={() => setShowAddSymbol(false)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol Information
                  </label>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-3">
                    <div className="font-medium text-blue-800 mb-1">Symbol Balance</div>
                    <p className="text-xs text-blue-700">
                      Your game already has:
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Wild Symbols:</span>
                        <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'wild').length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Scatter Symbols:</span>
                        <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'scatter').length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Regular Symbols:</span>
                        <span className="font-medium">{(reels?.symbols?.list || []).filter(s => s.type === 'regular').length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          High-Value Symbols
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={highValueSymbolCount}
                            onChange={(e) => setHighValueSymbolCount(parseInt(e.target.value))}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-800"
                          />
                          <button
                            onClick={() => {
                              const currentHighValueCount = (reels?.symbols?.list || []).filter(
                                s => s.type === 'regular' && s.name.includes('High Value')
                              ).length;
                              
                              const newSymbols = [];
                              for (let i = 0; i < highValueSymbolCount; i++) {
                                if (i < currentHighValueCount) continue; // Skip if we already have this many
                                
                                newSymbols.push({
                                  id: `symbol_${Date.now()}_${i}`,
                                  name: `High Value Symbol ${currentHighValueCount + i + 1}`,
                                  type: 'regular',
                                  weight: 6,
                                  weights: {},
                                  image: null,
                                  ...(isClusterPays ? {
                                    cluster: {
                                      payouts: { ...DEFAULT_CLUSTER_PAYOUTS }
                                    }
                                  } : {
                                    payouts: Array((reels?.layout?.reels || 5) - 1).fill(0)
                                  })
                                });
                              }
                              
                              if (newSymbols.length > 0) {
                                updateConfig({
                                  reels: {
                                    ...config.reels,
                                    symbols: {
                                      ...config.reels?.symbols,
                                      list: [...(reels?.symbols?.list || []), ...newSymbols]
                                    }
                                  }
                                });
                                
                                setTimeout(() => {
                                  handleOptimizeWeights();
                                }, 100);
                              }
                            }}
                            className="ml-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Low-Value Symbols
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="3"
                            max="8"
                            value={lowValueSymbolCount}
                            onChange={(e) => setLowValueSymbolCount(parseInt(e.target.value))}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-800"
                          />
                          <button
                            onClick={() => {
                              const currentLowValueCount = (reels?.symbols?.list || []).filter(
                                s => s.type === 'regular' && s.name.includes('Low Value')
                              ).length;
                              
                              const newSymbols = [];
                              for (let i = 0; i < lowValueSymbolCount; i++) {
                                if (i < currentLowValueCount) continue; // Skip if we already have this many
                                
                                newSymbols.push({
                                  id: `symbol_${Date.now()}_${i}`,
                                  name: `Low Value Symbol ${currentLowValueCount + i + 1}`,
                                  type: 'regular',
                                  weight: 12,
                                  weights: {},
                                  image: null,
                                  ...(isClusterPays ? {
                                    cluster: {
                                      payouts: { ...DEFAULT_CLUSTER_PAYOUTS }
                                    }
                                  } : {
                                    payouts: Array((reels?.layout?.reels || 5) - 1).fill(0)
                                  })
                                });
                              }
                              
                              if (newSymbols.length > 0) {
                                updateConfig({
                                  reels: {
                                    ...config.reels,
                                    symbols: {
                                      ...config.reels?.symbols,
                                      list: [...(reels?.symbols?.list || []), ...newSymbols]
                                    }
                                  }
                                });
                                
                                setTimeout(() => {
                                  handleOptimizeWeights();
                                }, 100);
                              }
                            }}
                            className="ml-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div 
                      onClick={handleAddSymbol}
                      className="p-3 bg-gradient-to-b from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs font-medium text-yellow-800 text-center">Wild Symbol</div>
                    </div>
                    
                    <div 
                      onClick={handleAddSymbol}
                      className="p-3 bg-gradient-to-b from-purple-50 to-indigo-50 rounded-lg border border-purple-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs font-medium text-purple-800 text-center">Scatter Symbol</div>
                    </div>
                    
                    <div 
                      onClick={handleAddSymbol}
                      className="p-3 bg-gradient-to-b from-blue-50 to-cyan-50 rounded-lg border border-blue-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                        <Dices className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xs font-medium text-blue-800 text-center">Regular Symbol</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    Click on the symbol type you want to add. The symbol will be added with optimal default settings.
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol Type Recommendations
                </label>
                
                <div className="p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Wild Symbol</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-6">
                    <li>• Substitutes for any regular symbol</li>
                    <li>• Typically has lower weight (5%)</li>
                    <li>• Usually limited to 1 type</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Scatter Symbol</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-6">
                    <li>• Triggers bonus features</li>
                    <li>• Very low weight (3%)</li>
                    <li>• Pays in any position</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Dices className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Regular Symbol</span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-6">
                    <li>• Standard paying symbols</li>
                    <li>• Creates main game payouts</li>
                    <li>• Needs 8-10 different symbols</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddSymbol(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};