/**
 * Premium Symbol Weighting System
 * Controls RTP, volatility, and symbol distribution
 */

export interface SymbolWeight {
  symbol: string;
  weight: number;
  reelWeights: number[]; // Different weights per reel
}

export interface RTConfig {
  targetRTP: number; // 85-98%
  volatility: 'low' | 'medium' | 'high';
  bonusFrequency: number; // 1 in X spins
  jackpotFrequency: number; // 1 in X spins
}

export class SymbolWeightingSystem {
  private reelStrips: string[][] = [];
  
  // Premium symbol weighting - different per reel for better control
  private symbolWeights: SymbolWeight[] = [
    { symbol: 'wild', weight: 1, reelWeights: [2, 2, 1, 2, 2] }, // Less on reel 3
    { symbol: 'scatter', weight: 2, reelWeights: [3, 3, 3, 3, 3] }, // Equal on all reels
    { symbol: 'high_1', weight: 8, reelWeights: [10, 8, 6, 8, 10] },
    { symbol: 'high_2', weight: 10, reelWeights: [12, 10, 8, 10, 12] },
    { symbol: 'high_3', weight: 12, reelWeights: [14, 12, 10, 12, 14] },
    { symbol: 'high_4', weight: 15, reelWeights: [16, 15, 12, 15, 16] },
    { symbol: 'medium_1', weight: 20, reelWeights: [22, 20, 18, 20, 22] },
    { symbol: 'medium_2', weight: 25, reelWeights: [26, 25, 22, 25, 26] },
    { symbol: 'medium_3', weight: 30, reelWeights: [32, 30, 28, 30, 32] },
    { symbol: 'medium_4', weight: 35, reelWeights: [36, 35, 32, 35, 36] },
    { symbol: 'low_1', weight: 40, reelWeights: [42, 40, 38, 40, 42] },
    { symbol: 'low_2', weight: 45, reelWeights: [46, 45, 42, 45, 46] },
    { symbol: 'low_3', weight: 50, reelWeights: [52, 50, 48, 50, 52] },
    { symbol: 'low_4', weight: 55, reelWeights: [56, 55, 52, 55, 56] }
  ];

  generateWeightedSpin(reels: number, rows: number, config: RTConfig): string[][] {
    const result: string[][] = [];
    
    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      const reelStrip = this.getReelStrip(reel, config);
      
      // Generate random starting position
      const startPos = Math.floor(Math.random() * reelStrip.length);
      
      for (let row = 0; row < rows; row++) {
        const position = (startPos + row) % reelStrip.length;
        reelSymbols.push(reelStrip[position]);
      }
      
      result.push(reelSymbols);
    }

    // Apply bonus forcing if needed
    return this.applyBonusLogic(result, config);
  }

  private getReelStrip(reelIndex: number, config: RTConfig): string[] {
    if (!this.reelStrips[reelIndex]) {
      this.reelStrips[reelIndex] = this.buildReelStrip(reelIndex, config);
    }
    return this.reelStrips[reelIndex];
  }

  private buildReelStrip(reelIndex: number, config: RTConfig): string[] {
    const strip: string[] = [];
    const volatilityMultiplier = config.volatility === 'high' ? 0.8 : 
                                config.volatility === 'medium' ? 1.0 : 1.2;

    for (const symbolWeight of this.symbolWeights) {
      const weight = Math.round(symbolWeight.reelWeights[reelIndex] * volatilityMultiplier);
      
      for (let i = 0; i < weight; i++) {
        strip.push(symbolWeight.symbol);
      }
    }

    // Shuffle for randomness
    return this.shuffleArray(strip);
  }

  private applyBonusLogic(result: string[][], config: RTConfig): string[][] {
    // Force bonus features based on frequency
    const shouldTriggerBonus = Math.random() < (1 / config.bonusFrequency);
    const shouldTriggerJackpot = Math.random() < (1 / config.jackpotFrequency);

    if (shouldTriggerJackpot) {
      // Force jackpot pattern (5 wilds on middle line)
      const middleRow = Math.floor(result[0].length / 2);
      for (let reel = 0; reel < result.length; reel++) {
        result[reel][middleRow] = 'wild';
      }
    } else if (shouldTriggerBonus) {
      // Force scatter bonus (3+ scatters)
      const scatterPositions = this.getRandomPositions(result.length, result[0].length, 3);
      scatterPositions.forEach(pos => {
        result[pos.reel][pos.row] = 'scatter';
      });
    }

    return result;
  }

  private getRandomPositions(reels: number, rows: number, count: number): Array<{reel: number, row: number}> {
    const positions: Array<{reel: number, row: number}> = [];
    const used = new Set<string>();

    while (positions.length < count) {
      const reel = Math.floor(Math.random() * reels);
      const row = Math.floor(Math.random() * rows);
      const key = `${reel}-${row}`;

      if (!used.has(key)) {
        positions.push({ reel, row });
        used.add(key);
      }
    }

    return positions;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Calculate theoretical RTP
  calculateRTP(config: RTConfig): number {
    // Simplified RTP calculation
    const baseRTP = 0.92; // 92% base
    const volatilityAdjustment = config.volatility === 'high' ? -0.02 : 
                                config.volatility === 'low' ? 0.02 : 0;
    
    return Math.min(0.98, Math.max(0.85, baseRTP + volatilityAdjustment));
  }
}