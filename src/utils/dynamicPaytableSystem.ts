import { getDefaultPaytable } from './paytableDefaults';

export interface DynamicPaytable {
  symbol: string;
  payouts: number[]; // [0, 0, pay3, pay4, pay5, pay6, pay7] format
  frequency: number;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low';
}

export class DynamicPaytableSystem {
  private paytables: Map<string, DynamicPaytable> = new Map();
  private reelCount: number = 5;

  constructor(reelCount: number = 5) {
    this.reelCount = reelCount;
    this.initializeDefaultPaytables();
  }

  private initializeDefaultPaytables(): void {
    const defaultSymbols = [
      { key: 'wild', type: 'wild' as const, frequency: 2 },
      { key: 'wild2', type: 'wild' as const, frequency: 1 },
      { key: 'scatter', type: 'scatter' as const, frequency: 3 },
      { key: 'high_1', type: 'high' as const, frequency: 4 },
      { key: 'high_2', type: 'high' as const, frequency: 5 },
      { key: 'high_3', type: 'high' as const, frequency: 6 },
      { key: 'high_4', type: 'high' as const, frequency: 7 },
      { key: 'medium_1', type: 'medium' as const, frequency: 8 },
      { key: 'medium_2', type: 'medium' as const, frequency: 9 },
      { key: 'medium_3', type: 'medium' as const, frequency: 10 },
      { key: 'medium_4', type: 'medium' as const, frequency: 11 },
      { key: 'low_1', type: 'low' as const, frequency: 12 },
      { key: 'low_2', type: 'low' as const, frequency: 13 },
      { key: 'low_3', type: 'low' as const, frequency: 14 },
      { key: 'low_4', type: 'low' as const, frequency: 15 },
      { key: 'ace', type: 'low' as const, frequency: 16 },
      { key: 'king', type: 'low' as const, frequency: 17 },
      { key: 'queen', type: 'low' as const, frequency: 18 },
      { key: 'jack', type: 'low' as const, frequency: 19 },
      { key: 'ten', type: 'low' as const, frequency: 20 },
      { key: 'nine', type: 'low' as const, frequency: 21 }
    ];

    defaultSymbols.forEach(({ key, type, frequency }) => {
      const defaultPays = getDefaultPaytable(key, undefined, this.reelCount);
      const payouts = this.convertToPayoutArray(defaultPays);

      this.paytables.set(key, {
        symbol: key,
        payouts,
        frequency,
        type
      });
    });
  }

  /**
   * Convert paytable object to payout array format
   */
  private convertToPayoutArray(pays: Record<string, number>): number[] {
    return [
      0, // 0-of-a-kind (impossible)
      0, // 1-of-a-kind (no win)
      0, // 2-of-a-kind (no win)
      pays.pay3 || 0,
      pays.pay4 || 0,
      pays.pay5 || 0,
      pays.pay6 || 0,
      pays.pay7 || 0
    ];
  }

  updateFromConfig(symbolPaytables: Record<string, Record<string, number>>): void {
    Object.entries(symbolPaytables).forEach(([symbolKey, pays]) => {
      const existing = this.paytables.get(symbolKey);
      if (existing) {
        const payouts = this.convertToPayoutArray(pays);
        this.paytables.set(symbolKey, {
          ...existing,
          payouts
        });
      } else {
        // Create new paytable entry
        const payouts = this.convertToPayoutArray(pays);
        this.paytables.set(symbolKey, {
          symbol: symbolKey,
          payouts,
          frequency: 10, // Default frequency
          type: this.determineSymbolType(symbolKey)
        });
      }
    });
  }

  /**
   * Determine symbol type based on key name
   */
  private determineSymbolType(symbolKey: string): 'wild' | 'scatter' | 'high' | 'medium' | 'low' {
    const key = symbolKey.toLowerCase();
    if (key.includes('wild')) return 'wild';
    if (key.includes('scatter')) return 'scatter';
    if (key.includes('high')) return 'high';
    if (key.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Get payout for specific symbol and match count
   */
  getPayout(symbol: string, matchCount: number): number {
    const paytable = this.paytables.get(symbol);
    if (!paytable || matchCount < 3 || matchCount >= paytable.payouts.length) {
      return 0;
    }
    return paytable.payouts[matchCount] || 0;
  }

  /**
   * Get all payouts for a symbol
   */
  getSymbolPayouts(symbol: string): number[] {
    const paytable = this.paytables.get(symbol);
    return paytable ? paytable.payouts : [0, 0, 0, 0, 0, 0, 0, 0];
  }

  /**
   * Get symbol frequency
   */
  getSymbolFrequency(symbol: string): number {
    const paytable = this.paytables.get(symbol);
    return paytable ? paytable.frequency : 0;
  }

  /**
   * Get all symbols by type
   */
  getSymbolsByType(type: 'wild' | 'scatter' | 'high' | 'medium' | 'low'): string[] {
    const symbols: string[] = [];
    this.paytables.forEach((paytable, symbol) => {
      if (paytable.type === type) {
        symbols.push(symbol);
      }
    });
    return symbols;
  }

  /**
   * Calculate total RTP contribution from all symbols
   */
  calculateRTPContribution(): number {
    let totalRTP = 0;
    this.paytables.forEach((paytable) => {
      // Simplified RTP calculation based on frequency and payouts
      const frequencyWeight = paytable.frequency / 100; // Convert to decimal
      const avgPayout = paytable.payouts.reduce((sum, payout) => sum + payout, 0) / paytable.payouts.length;
      totalRTP += frequencyWeight * avgPayout;
    });
    return totalRTP;
  }

  /**
   * Get all paytables for debugging/display
   */
  getAllPaytables(): Map<string, DynamicPaytable> {
    return new Map(this.paytables);
  }

  /**
   * Update reel count and regenerate paytables
   */
  updateReelCount(newReelCount: number): void {
    this.reelCount = newReelCount;
    this.initializeDefaultPaytables();
  }
}

/**
 * Create a dynamic paytable system instance
 */
export function createDynamicPaytableSystem(reelCount: number = 5): DynamicPaytableSystem {
  return new DynamicPaytableSystem(reelCount);
}

/**
 * Convert legacy paytable format to dynamic format
 */
export function convertLegacyPaytable(legacyPaytable: Map<string, number[]>): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  legacyPaytable.forEach((payouts, symbol) => {
    const pays: Record<string, number> = {};
    if (payouts[3] !== undefined) pays.pay3 = payouts[3];
    if (payouts[4] !== undefined) pays.pay4 = payouts[4];
    if (payouts[5] !== undefined) pays.pay5 = payouts[5];
    if (payouts[6] !== undefined) pays.pay6 = payouts[6];
    if (payouts[7] !== undefined) pays.pay7 = payouts[7];

    result[symbol] = pays;
  });

  return result;
}
