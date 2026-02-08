/**
 * Premium Bonus Features System
 * Free spins, multipliers, cascading wins, bonus games
 */

export interface BonusFeature {
  type: 'freespins' | 'multiplier' | 'cascade' | 'bonus_game' | 'expanding_wild';
  triggered: boolean;
  data: any;
}

export interface FreeSpinsFeature {
  spinsRemaining: number;
  totalSpins: number;
  multiplier: number;
  retriggerCount: number;
  wildMultipliers: number[];
}

export interface CascadeFeature {
  cascadeCount: number;
  multiplierProgression: number[];
  maxCascades: number;
}

export class BonusFeatureManager {
  private activeFeatures: Map<string, BonusFeature> = new Map();
  
  // Check for bonus triggers after each spin
  checkBonusTriggers(winResult: any, grid: string[][]): BonusFeature[] {
    const triggeredFeatures: BonusFeature[] = [];

    // Free Spins Trigger (3+ scatters)
    const scatterCount = this.countScatters(grid);
    if (scatterCount >= 3) {
      const freeSpinsFeature = this.triggerFreeSpins(scatterCount);
      triggeredFeatures.push(freeSpinsFeature);
    }

    // Cascade Wins (winning symbols disappear, new ones fall)
    if (winResult.wins.length > 0) {
      const cascadeFeature = this.triggerCascade(winResult);
      triggeredFeatures.push(cascadeFeature);
    }

    // Expanding Wilds (wilds expand to fill reel)
    const expandingWilds = this.checkExpandingWilds(grid);
    if (expandingWilds.length > 0) {
      triggeredFeatures.push({
        type: 'expanding_wild',
        triggered: true,
        data: { reels: expandingWilds }
      });
    }

    // Random Multiplier Feature (1 in 50 chance)
    if (Math.random() < 0.02) {
      const multiplier = this.getRandomMultiplier();
      triggeredFeatures.push({
        type: 'multiplier',
        triggered: true,
        data: { multiplier, duration: 1 }
      });
    }

    return triggeredFeatures;
  }

  private triggerFreeSpins(scatterCount: number): BonusFeature {
    const spinsAwarded = scatterCount === 3 ? 10 : 
                        scatterCount === 4 ? 15 : 
                        scatterCount === 5 ? 25 : 10;

    const freeSpinsData: FreeSpinsFeature = {
      spinsRemaining: spinsAwarded,
      totalSpins: spinsAwarded,
      multiplier: scatterCount >= 4 ? 2 : 1,
      retriggerCount: 0,
      wildMultipliers: []
    };

    this.activeFeatures.set('freespins', {
      type: 'freespins',
      triggered: true,
      data: freeSpinsData
    });

    return {
      type: 'freespins',
      triggered: true,
      data: freeSpinsData
    };
  }

  private triggerCascade(winResult: any): BonusFeature {
    const cascadeData: CascadeFeature = {
      cascadeCount: 0,
      multiplierProgression: [1, 2, 3, 5, 8, 10], // Increasing multipliers
      maxCascades: 6
    };

    return {
      type: 'cascade',
      triggered: true,
      data: cascadeData
    };
  }

  // Process cascade wins (symbols fall down after wins)
  processCascade(grid: string[][], winPositions: Array<{reel: number, row: number}>): string[][] {
    const newGrid = grid.map(reel => [...reel]);

    // Remove winning symbols
    winPositions.forEach(pos => {
      newGrid[pos.reel][pos.row] = 'EMPTY';
    });

    // Drop symbols down
    for (let reel = 0; reel < newGrid.length; reel++) {
      const reelSymbols = newGrid[reel];
      const nonEmpty = reelSymbols.filter(symbol => symbol !== 'EMPTY');
      const emptyCount = reelSymbols.length - nonEmpty.length;
      
      // Add new random symbols at top
      const newSymbols = this.generateNewSymbols(emptyCount);
      newGrid[reel] = [...newSymbols, ...nonEmpty];
    }

    return newGrid;
  }

  // Free spins management
  processFreeSpinResult(winResult: any): { continueFreespins: boolean, retriggered: boolean } {
    const freeSpinsFeature = this.activeFeatures.get('freespins');
    if (!freeSpinsFeature) return { continueFreespins: false, retriggered: false };

    const data = freeSpinsFeature.data as FreeSpinsFeature;
    data.spinsRemaining--;

    // Check for retrigger
    let retriggered = false;
    const scatterCount = winResult.wins.filter((w: any) => w.symbol === 'scatter').length;
    if (scatterCount >= 3) {
      const additionalSpins = scatterCount === 3 ? 5 : scatterCount === 4 ? 10 : 15;
      data.spinsRemaining += additionalSpins;
      data.retriggerCount++;
      retriggered = true;
    }

    // Apply free spins multiplier to all wins
    winResult.wins.forEach((win: any) => {
      win.winAmount *= data.multiplier;
    });

    const continueFreespins = data.spinsRemaining > 0;
    if (!continueFreespins) {
      this.activeFeatures.delete('freespins');
    }

    return { continueFreespins, retriggered };
  }

  // Expanding wilds feature
  private checkExpandingWilds(grid: string[][]): number[] {
    const expandingReels: number[] = [];
    
    for (let reel = 0; reel < grid.length; reel++) {
      const hasWild = grid[reel].some(symbol => symbol === 'wild');
      if (hasWild && Math.random() < 0.3) { // 30% chance to expand
        expandingReels.push(reel);
      }
    }

    return expandingReels;
  }

  expandWildsOnReels(grid: string[][], reels: number[]): string[][] {
    const newGrid = grid.map(reel => [...reel]);
    
    reels.forEach(reelIndex => {
      for (let row = 0; row < newGrid[reelIndex].length; row++) {
        newGrid[reelIndex][row] = 'wild';
      }
    });

    return newGrid;
  }

  private countScatters(grid: string[][]): number {
    let count = 0;
    for (const reel of grid) {
      for (const symbol of reel) {
        if (symbol === 'scatter') count++;
      }
    }
    return count;
  }

  private getRandomMultiplier(): number {
    const multipliers = [2, 3, 5, 10];
    const weights = [50, 30, 15, 5]; // Higher chance for lower multipliers
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < multipliers.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return multipliers[i];
      }
    }
    
    return 2; // Fallback
  }

  private generateNewSymbols(count: number): string[] {
    const symbols = ['high_1', 'high_2', 'medium_1', 'medium_2', 'low_1', 'low_2'];
    return Array.from({ length: count }, () => 
      symbols[Math.floor(Math.random() * symbols.length)]
    );
  }

  // Get active features status
  getActiveFeatures(): Map<string, BonusFeature> {
    return new Map(this.activeFeatures);
  }

  // Clear all active features
  clearAllFeatures(): void {
    this.activeFeatures.clear();
  }
}