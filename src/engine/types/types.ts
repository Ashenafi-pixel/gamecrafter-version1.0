/**
 * SlotEngine Types
 * TypeScript interfaces for the modular slot engine
 */

export interface SymbolAsset {
  id: string;
  type: 'regular' | 'wild' | 'scatter';
  texture: string;
  audioOnWin?: string;
  animationPreset?: string;
  payoutMultiplier?: number;
}

export interface GridConfig {
  reels: number;
  rows: number;
}

export interface AnimationConfig {
  spinSpeed: number; // Duration in ms
  easing: string; // GSAP easing
  reelStartFX: string;
  reelStopFX: string;
  symbolLandFX: string;
  winFX: string;
  anticipationEnabled: boolean;
  reelStagger: number; // ms between reel starts
  reelStopStagger: number; // ms between reel stops
}

export interface GameConfig {
  grid: GridConfig;
  symbols: SymbolAsset[];
  paylines?: number[][];
  animation: AnimationConfig;
  rtp?: number;
  volatility?: 'low' | 'medium' | 'high';
}

// Extended configuration interface used by the engine
export interface IGameConfiguration {
  reels: number;
  rows: number;
  symbols: Array<{
    id: string;
    name: string;
    image: string;
    payout: number[];
  }>;
  paylines: Array<{
    id: number;
    positions: Array<[number, number]>;
  }>;
  betLevels: number[];
  coinValues: number[];
  defaultBet: number;
  defaultCoinValue: number;
  rtp: number;
  volatility: 'low' | 'medium' | 'high';
  // Optional RGS configuration
  rgsEndpoint?: string;
  gameId?: string;
  playerId?: string;
  // Optional graphics settings
  graphics?: {
    quality?: 'low' | 'medium' | 'high' | 'ultra';
  };
  // Optional audio settings
  audio?: {
    masterVolume?: number;
    sfxVolume?: number;
    musicVolume?: number;
  };
}

export interface SpinResult {
  matrix: string[][]; // Symbol IDs in grid format
  wins: WinResult[];
  totalWin: number;
  isBonus: boolean;
}

export interface WinResult {
  payline?: number;
  symbols: string[];
  positions: Array<{reel: number, row: number}>;
  multiplier: number;
  payout: number;
}

export interface ReelState {
  index: number;
  isSpinning: boolean;
  currentSymbols: string[];
  targetSymbols: string[];
  spinProgress: number; // 0-1
}