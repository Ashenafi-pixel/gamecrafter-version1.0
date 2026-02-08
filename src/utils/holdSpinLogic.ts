/**
 * Hold & Spin Bonus Feature Logic
 * Handles detection, triggering, and management of Hold & Spin bonus features
 */

export interface HoldSpinSymbol {
  reel: number;
  row: number;
  symbol: string;
  value: number;
}

export interface HoldSpinConfig {
  enabled: boolean;
  gridSize: [number, number];
  initialRespins: number;
  maxSymbolValue: number;
  resetRespins: boolean;
  collectAll: boolean;
}

export interface HoldSpinResult {
  triggered: boolean;
  lockedSymbols: HoldSpinSymbol[];
  totalWin: number;
  spinsRemaining: number;
}

/**
 * Check if a symbol is a Hold & Spin symbol
 */
export const isHoldSpinSymbol = (symbolType: string | undefined): boolean => {
  if (!symbolType || typeof symbolType !== 'string') {
    return false;
  }
  
  // Check for holdspin symbol type keyword
  return symbolType === 'holdspin' || 
         symbolType === 'holdSpin' ||
         symbolType.toLowerCase() === 'holdspin';
};

/**
 * Detect Hold & Spin symbols in the grid (grid contains symbol type keywords)
 */
export const detectHoldSpinSymbols = (
  grid: string[][] // Grid of symbol types like [['high1', 'scatter', 'holdspin'], ...]
): HoldSpinSymbol[] => {
  const holdSpinSymbols: HoldSpinSymbol[] = [];
  
  for (let reel = 0; reel < grid.length; reel++) {
    for (let row = 0; row < grid[reel].length; row++) {
      const symbolType = grid[reel][row];
      
      if (isHoldSpinSymbol(symbolType)) {
        // Generate a random value for the Hold & Spin symbol
        const value = Math.floor(Math.random() * 50) + 10; // 10-60 range
        
        holdSpinSymbols.push({
          reel: reel,
          row: row,
          symbol: symbolType,
          value: value
        });
      }
    }
  }
  
  return holdSpinSymbols;
};

/**
 * Check if Hold & Spin should be triggered (3+ symbols)
 */
export const shouldTriggerHoldSpin = (
  holdSpinSymbols: HoldSpinSymbol[],
  config: HoldSpinConfig
): boolean => {
  if (!config.enabled) return false;
  
  // Need at least 3 Hold & Spin symbols to trigger
  return holdSpinSymbols.length >= 3;
};

/**
 * Calculate Hold & Spin result
 */
export const calculateHoldSpinResult = (
  holdSpinSymbols: HoldSpinSymbol[],
  config: HoldSpinConfig
): HoldSpinResult => {
  const shouldTrigger = shouldTriggerHoldSpin(holdSpinSymbols, config);
  
  if (!shouldTrigger) {
    return {
      triggered: false,
      lockedSymbols: [],
      totalWin: 0,
      spinsRemaining: 0
    };
  }
  
  const totalWin = holdSpinSymbols.reduce((sum, symbol) => sum + symbol.value, 0);
  
  return {
    triggered: true,
    lockedSymbols: holdSpinSymbols,
    totalWin,
    spinsRemaining: config.initialRespins
  };
};

/**
 * Simulate Hold & Spin respin result
 */
export const simulateHoldSpinRespin = (
  currentLockedSymbols: HoldSpinSymbol[],
  config: HoldSpinConfig,
  gridSize: [number, number]
): {
  newLockedSymbols: HoldSpinSymbol[];
  additionalWin: number;
  hasNewSymbols: boolean;
} => {
  const [rows, cols] = gridSize;
  const newLockedSymbols: HoldSpinSymbol[] = [...currentLockedSymbols];
  let additionalWin = 0;
  let hasNewSymbols = false;
  
  // Simulate new Hold & Spin symbols appearing (20% chance per position)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Check if this position is already locked
      const isAlreadyLocked = currentLockedSymbols.some(
        locked => locked.reel === col && locked.row === row
      );
      
      if (!isAlreadyLocked && Math.random() < 0.2) {
        // New Hold & Spin symbol appears
        const value = Math.floor(Math.random() * config.maxSymbolValue) + 10;
        const newSymbol: HoldSpinSymbol = {
          reel: col,
          row: row,
          symbol: 'holdspin-symbol', // Placeholder
          value: value
        };
        
        newLockedSymbols.push(newSymbol);
        additionalWin += value;
        hasNewSymbols = true;
      }
    }
  }
  
  return {
    newLockedSymbols,
    additionalWin,
    hasNewSymbols
  };
};

/**
 * Check if Hold & Spin should end
 */
export const shouldEndHoldSpin = (
  spinsRemaining: number,
  hasNewSymbols: boolean,
  config: HoldSpinConfig
): boolean => {
  // End if no spins remaining
  if (spinsRemaining <= 0) return true;
  
  // End if no new symbols appeared and resetRespins is false
  if (!hasNewSymbols && !config.resetRespins) return true;
  
  return false;
};

/**
 * Get Hold & Spin symbol display value
 */
export const getHoldSpinSymbolValue = (symbol: HoldSpinSymbol): string => {
  return `${symbol.value}x`;
};

/**
 * Get Hold & Spin symbol color based on value
 */
export const getHoldSpinSymbolColor = (value: number, maxValue: number): string => {
  const ratio = value / maxValue;
  
  if (ratio < 0.3) return '#5C6BC0'; // Low value - blue
  if (ratio < 0.7) return '#EF5350'; // Medium value - red
  return '#FFD700'; // High value - gold
};
