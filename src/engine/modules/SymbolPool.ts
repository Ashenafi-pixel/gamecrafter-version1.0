/**
 * SymbolPool - Manages symbol assets and generation
 * Handles symbol weights, distribution, and selection
 */

import { SymbolAsset } from '../types/types';

export class SymbolPool {
  private symbols: SymbolAsset[] = [];
  private weights: Map<string, number> = new Map();
  private debugMode: boolean = false;

  constructor(symbols: SymbolAsset[], debugMode: boolean = false) {
    this.symbols = symbols;
    this.debugMode = debugMode;
    this.initializeWeights();
  }

  /**
   * Initialize symbol weights based on type
   */
  private initializeWeights(): void {
    this.symbols.forEach(symbol => {
      let weight: number;
      
      switch (symbol.type) {
        case 'wild':
          weight = 0.05; // 5% - very rare
          break;
        case 'scatter':
          weight = 0.08; // 8% - rare
          break;
        case 'regular':
        default:
          weight = 0.15; // 15% - common
          break;
      }
      
      this.weights.set(symbol.id, weight);
    });

    if (this.debugMode) {
      console.log('🎰 SymbolPool: Initialized weights', Object.fromEntries(this.weights));
    }
  }

  /**
   * Get a random symbol based on weights
   */
  getRandomSymbol(): SymbolAsset {
    const totalWeight = Array.from(this.weights.values()).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of this.symbols) {
      const weight = this.weights.get(symbol.id) || 0;
      random -= weight;
      if (random <= 0) {
        return symbol;
      }
    }

    // Fallback to first symbol
    return this.symbols[0];
  }

  /**
   * Generate a reel strip (sequence of symbols)
   */
  generateReelStrip(length: number): string[] {
    const strip: string[] = [];
    
    for (let i = 0; i < length; i++) {
      const symbol = this.getRandomSymbol();
      strip.push(symbol.id);
    }

    if (this.debugMode) {
      console.log(`🎰 SymbolPool: Generated reel strip (${length}):`, strip);
    }

    return strip;
  }

  /**
   * Generate a complete spin result matrix
   */
  generateSpinMatrix(reels: number, rows: number): string[][] {
    const matrix: string[][] = [];

    for (let reel = 0; reel < reels; reel++) {
      const reelSymbols: string[] = [];
      for (let row = 0; row < rows; row++) {
        const symbol = this.getRandomSymbol();
        reelSymbols.push(symbol.id);
      }
      matrix.push(reelSymbols);
    }

    if (this.debugMode) {
      console.log(`🎰 SymbolPool: Generated ${reels}x${rows} matrix:`, matrix);
    }

    return matrix;
  }

  /**
   * Get symbol by ID
   */
  getSymbol(id: string): SymbolAsset | undefined {
    return this.symbols.find(symbol => symbol.id === id);
  }

  /**
   * Get all symbols of a specific type
   */
  getSymbolsByType(type: 'regular' | 'wild' | 'scatter'): SymbolAsset[] {
    return this.symbols.filter(symbol => symbol.type === type);
  }

  /**
   * Update symbol weight
   */
  setSymbolWeight(symbolId: string, weight: number): void {
    if (this.weights.has(symbolId)) {
      this.weights.set(symbolId, weight);
      if (this.debugMode) {
        console.log(`🎰 SymbolPool: Updated weight for ${symbolId}: ${weight}`);
      }
    }
  }

  /**
   * Get symbol weight
   */
  getSymbolWeight(symbolId: string): number {
    return this.weights.get(symbolId) || 0;
  }

  /**
   * Get all symbols
   */
  getAllSymbols(): SymbolAsset[] {
    return [...this.symbols];
  }

  /**
   * Update symbol pool with new symbols
   */
  updateSymbols(symbols: SymbolAsset[]): void {
    this.symbols = symbols;
    this.weights.clear();
    this.initializeWeights();
    
    if (this.debugMode) {
      console.log('🎰 SymbolPool: Updated symbol pool', symbols.map(s => s.id));
    }
  }

  /**
   * Get distribution stats
   */
  getDistributionStats(): Record<string, { weight: number; percentage: string }> {
    const totalWeight = Array.from(this.weights.values()).reduce((sum, weight) => sum + weight, 0);
    const stats: Record<string, { weight: number; percentage: string }> = {};

    this.weights.forEach((weight, symbolId) => {
      const percentage = ((weight / totalWeight) * 100).toFixed(2);
      stats[symbolId] = { weight, percentage: `${percentage}%` };
    });

    return stats;
  }
}