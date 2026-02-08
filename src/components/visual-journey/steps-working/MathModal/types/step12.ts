export interface GameGrid {
  width: number;
  height: number;
  label: string; // "3×3", "5×3", etc.
}

export interface FeatureConfig {
  id: string;
  name: string;
  type: 'free_spins' | 'pick_bonus' | 'wheel' | 'hold_win' | 'respin';
  enabled: boolean;
  // Configuration from Step 12 (read-only in Step 13)
  mechanics: {
    // Free Spins
    spins?: number;
    triggerSymbols?: string[];
    triggerCount?: number;
    retrigger?: boolean;

    // Pick Bonus
    picks?: number;
    revealType?: 'credits' | 'multipliers' | 'mixed';

    // Wheel
    segments?: number;
    wheelType?: 'credit' | 'multiplier' | 'mixed';

    // Hold & Win
    holdSymbols?: string[];
    respins?: number;

    // Respins
    respinTrigger?: string;
    maxRespins?: number;
  };
}

export interface Step12Configuration {
  gameTitle: string;
  grid: GameGrid;
  theme: string;
  features: FeatureConfig[];
  maxWin: number;
  targetMarkets: string[];
  createdAt: string;
  version: string;
}

export interface ReelSymbol {
  id: string;
  name: string;
  icon: string;
  type: 'regular' | 'wild' | 'scatter' | 'bonus' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ReelStrip {
  reelIndex: number;
  symbols: string[]; // Array of symbol IDs in order
  length: number;
}
