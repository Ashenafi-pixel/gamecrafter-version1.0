/**
 * WinEvaluator - Evaluates wins and calculates payouts
 * Handles payline evaluation, win detection, and payout calculation
 */

import { SymbolAsset, WinResult, SpinResult } from '../types/types';

export class WinEvaluator {
  private symbols: SymbolAsset[] = [];
  private paylines: number[][] = [];
  private debugMode: boolean = false;

  constructor(symbols: SymbolAsset[], paylines: number[][] = [], debugMode: boolean = false) {
    this.symbols = symbols;
    this.paylines = paylines.length > 0 ? paylines : this.generateDefaultPaylines();
    this.debugMode = debugMode;
  }

  /**
   * Generate default paylines for a 5x3 grid
   */
  private generateDefaultPaylines(): number[][] {
    return [
      [1, 1, 1, 1, 1], // Top row
      [2, 2, 2, 2, 2], // Middle row
      [3, 3, 3, 3, 3], // Bottom row
      [1, 2, 3, 2, 1], // V shape
      [3, 2, 1, 2, 3], // Inverted V
      [1, 1, 2, 2, 2], // Step up
      [3, 3, 2, 2, 2], // Step down
      [2, 1, 1, 1, 2], // M shape
      [2, 3, 3, 3, 2], // W shape
      [1, 2, 1, 2, 1], // Zigzag up
    ];
  }

  /**
   * Evaluate a spin result for wins
   */
  evaluateWins(matrix: string[][], bet: number): SpinResult {
    const wins: WinResult[] = [];
    let totalWin = 0;

    if (this.debugMode) {
      console.log('🎰 WinEvaluator: Evaluating matrix:', matrix);
    }

    // Check each payline
    this.paylines.forEach((payline, paylineIndex) => {
      const win = this.evaluatePayline(matrix, payline, paylineIndex, bet);
      if (win) {
        wins.push(win);
        totalWin += win.payout;
      }
    });

    // Check for scatter wins (not on paylines)
    const scatterWin = this.evaluateScatterWin(matrix, bet);
    if (scatterWin) {
      wins.push(scatterWin);
      totalWin += scatterWin.payout;
    }

    const result: SpinResult = {
      matrix,
      wins,
      totalWin,
      isBonus: this.checkForBonus(matrix)
    };

    if (this.debugMode && wins.length > 0) {
      console.log('🎰 WinEvaluator: Found wins:', wins);
      console.log('🎰 WinEvaluator: Total win:', totalWin);
    }

    return result;
  }

  /**
   * Evaluate a specific payline for wins
   */
  private evaluatePayline(matrix: string[][], payline: number[], paylineIndex: number, bet: number): WinResult | null {
    if (matrix.length === 0 || payline.length !== matrix.length) {
      return null;
    }

    const symbols: string[] = [];
    const positions: Array<{reel: number, row: number}> = [];

    // Extract symbols from payline
    payline.forEach((row, reel) => {
      const rowIndex = row - 1; // Convert to 0-based index
      if (matrix[reel] && matrix[reel][rowIndex]) {
        symbols.push(matrix[reel][rowIndex]);
        positions.push({ reel, row: rowIndex });
      }
    });

    // Check for winning combinations
    return this.checkWinningCombination(symbols, positions, paylineIndex, bet);
  }

  /**
   * Check if symbols form a winning combination
   */
  private checkWinningCombination(
    symbols: string[], 
    positions: Array<{reel: number, row: number}>, 
    paylineIndex: number, 
    bet: number
  ): WinResult | null {
    if (symbols.length < 3) return null;

    let winLength = 0;
    let winSymbol = symbols[0];
    let isWild = false;

    // Check for consecutive matching symbols from left to right
    for (let i = 0; i < symbols.length; i++) {
      const currentSymbol = symbols[i];
      const symbolData = this.getSymbolData(currentSymbol);
      
      if (i === 0) {
        winSymbol = currentSymbol;
        winLength = 1;
        isWild = symbolData?.type === 'wild';
      } else {
        // Check if current symbol matches or is wild
        if (currentSymbol === winSymbol || 
            symbolData?.type === 'wild' || 
            this.getSymbolData(winSymbol)?.type === 'wild') {
          winLength++;
          // Update win symbol if current is not wild but win symbol is
          if (this.getSymbolData(winSymbol)?.type === 'wild' && symbolData?.type !== 'wild') {
            winSymbol = currentSymbol;
          }
        } else {
          break;
        }
      }
    }

    // Check if win length meets minimum requirement (usually 3)
    if (winLength >= 3) {
      const symbolData = this.getSymbolData(winSymbol);
      const multiplier = this.calculateMultiplier(winSymbol, winLength);
      const payout = bet * multiplier;

      return {
        payline: paylineIndex,
        symbols: symbols.slice(0, winLength),
        positions: positions.slice(0, winLength),
        multiplier,
        payout
      };
    }

    return null;
  }

  /**
   * Calculate multiplier for a winning combination
   */
  private calculateMultiplier(symbolId: string, length: number): number {
    const symbol = this.getSymbolData(symbolId);
    if (!symbol) return 0;

    const baseMultiplier = symbol.payoutMultiplier || 1;
    
    // Increase multiplier based on combination length
    const lengthMultipliers: Record<number, number> = {
      3: 1,
      4: 3,
      5: 10
    };

    return baseMultiplier * (lengthMultipliers[length] || 1);
  }

  /**
   * Evaluate scatter wins (symbols anywhere on reels)
   */
  private evaluateScatterWin(matrix: string[][], bet: number): WinResult | null {
    const scatterSymbols = this.symbols.filter(s => s.type === 'scatter');
    
    for (const scatterSymbol of scatterSymbols) {
      const positions = this.findSymbolPositions(matrix, scatterSymbol.id);
      
      if (positions.length >= 3) {
        const multiplier = this.calculateScatterMultiplier(scatterSymbol.id, positions.length);
        const payout = bet * multiplier;

        return {
          symbols: new Array(positions.length).fill(scatterSymbol.id),
          positions,
          multiplier,
          payout
        };
      }
    }

    return null;
  }

  /**
   * Find all positions of a specific symbol in the matrix
   */
  private findSymbolPositions(matrix: string[][], symbolId: string): Array<{reel: number, row: number}> {
    const positions: Array<{reel: number, row: number}> = [];

    matrix.forEach((reel, reelIndex) => {
      reel.forEach((symbol, rowIndex) => {
        if (symbol === symbolId) {
          positions.push({ reel: reelIndex, row: rowIndex });
        }
      });
    });

    return positions;
  }

  /**
   * Calculate scatter multiplier
   */
  private calculateScatterMultiplier(symbolId: string, count: number): number {
    const scatterMultipliers: Record<number, number> = {
      3: 2,
      4: 10,
      5: 50
    };

    return scatterMultipliers[count] || 0;
  }

  /**
   * Check if the spin triggers a bonus round
   */
  private checkForBonus(matrix: string[][]): boolean {
    // Check for 3 or more scatter symbols
    const scatterSymbols = this.symbols.filter(s => s.type === 'scatter');
    
    for (const scatterSymbol of scatterSymbols) {
      const count = this.countSymbolInMatrix(matrix, scatterSymbol.id);
      if (count >= 3) {
        return true;
      }
    }

    return false;
  }

  /**
   * Count occurrences of a symbol in the matrix
   */
  private countSymbolInMatrix(matrix: string[][], symbolId: string): number {
    let count = 0;
    matrix.forEach(reel => {
      reel.forEach(symbol => {
        if (symbol === symbolId) count++;
      });
    });
    return count;
  }

  /**
   * Get symbol data by ID
   */
  private getSymbolData(symbolId: string): SymbolAsset | undefined {
    return this.symbols.find(s => s.id === symbolId);
  }

  /**
   * Update symbols and paylines
   */
  updateConfiguration(symbols: SymbolAsset[], paylines?: number[][]): void {
    this.symbols = symbols;
    if (paylines) {
      this.paylines = paylines;
    }
    
    if (this.debugMode) {
      console.log('🎰 WinEvaluator: Updated configuration');
      console.log('Symbols:', symbols.map(s => s.id));
      console.log('Paylines:', this.paylines.length);
    }
  }

  /**
   * Get payline data
   */
  getPaylines(): number[][] {
    return [...this.paylines];
  }

  /**
   * Get win frequency statistics (for testing)
   */
  simulateWinFrequency(iterations: number = 1000): Record<string, any> {
    // This would be used for RTP calculations in a full implementation
    // For now, return basic stats
    return {
      iterations,
      implemented: false,
      note: 'Win frequency simulation not implemented in this version'
    };
  }
}