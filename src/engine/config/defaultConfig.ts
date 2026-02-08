/**
 * defaultConfig.ts
 * 
 * Default configuration for the slot engine.
 * Provides sensible defaults for a standard 5x3 slot machine
 * with common symbols and balanced gameplay parameters.
 */

import { GameConfig } from '../types/GameConfig';

/**
 * Default game configuration for a standard 5x3 slot machine
 * 
 * Features:
 * - 5 reels, 3 rows (classic slot layout)
 * - 8 symbols including wild and scatter
 * - 20 paylines (traditional setup)
 * - Balanced RTP around 96%
 * - Smooth animation timings
 * - Standard volatility settings
 */
export const defaultConfig: GameConfig = {
  // Grid Layout Configuration
  layout: {
    reels: 5,
    rows: 3,
    orientation: 'landscape'
  },

  // Symbol Configuration
  symbols: {
    count: 8,
    types: [
      {
        id: 'wild',
        name: 'Wild',
        type: 'wild',
        weight: 2,
        payout: [0, 0, 50, 200, 1000],
        imageUrl: '/assets/symbols/wild.png'
      },
      {
        id: 'scatter',
        name: 'Scatter', 
        type: 'scatter',
        weight: 1,
        payout: [0, 0, 5, 20, 100],
        imageUrl: '/assets/symbols/scatter.png'
      },
      {
        id: 'high_1',
        name: 'Diamond',
        type: 'high',
        weight: 3,
        payout: [0, 0, 25, 100, 500],
        imageUrl: '/assets/symbols/high_1.png'
      },
      {
        id: 'high_2', 
        name: 'Gold Bar',
        type: 'high',
        weight: 4,
        payout: [0, 0, 20, 75, 300],
        imageUrl: '/assets/symbols/high_2.png'
      },
      {
        id: 'medium_1',
        name: 'Crown',
        type: 'medium',
        weight: 6,
        payout: [0, 0, 15, 50, 150],
        imageUrl: '/assets/symbols/medium_1.png'
      },
      {
        id: 'medium_2',
        name: 'Ring',
        type: 'medium', 
        weight: 8,
        payout: [0, 0, 10, 30, 100],
        imageUrl: '/assets/symbols/medium_2.png'
      },
      {
        id: 'low_1',
        name: 'Ace',
        type: 'low',
        weight: 12,
        payout: [0, 0, 5, 15, 50],
        imageUrl: '/assets/symbols/low_1.png'
      },
      {
        id: 'low_2',
        name: 'King', 
        type: 'low',
        weight: 15,
        payout: [0, 0, 5, 10, 25],
        imageUrl: '/assets/symbols/low_2.png'
      }
    ]
  },

  // Payline Configuration
  paylines: {
    count: 20,
    patterns: [
      // Standard 20-line payline patterns for 5x3 grid
      [1, 1, 1, 1, 1], // Line 1: Middle row
      [0, 0, 0, 0, 0], // Line 2: Top row  
      [2, 2, 2, 2, 2], // Line 3: Bottom row
      [0, 1, 2, 1, 0], // Line 4: V shape
      [2, 1, 0, 1, 2], // Line 5: Inverted V
      [1, 0, 0, 0, 1], // Line 6: 
      [1, 2, 2, 2, 1], // Line 7:
      [0, 0, 1, 2, 2], // Line 8:
      [2, 2, 1, 0, 0], // Line 9:
      [1, 2, 1, 0, 1], // Line 10:
      [1, 0, 1, 2, 1], // Line 11:
      [0, 1, 0, 1, 0], // Line 12:
      [2, 1, 2, 1, 2], // Line 13:
      [0, 1, 1, 1, 0], // Line 14:
      [2, 1, 1, 1, 2], // Line 15:
      [1, 1, 0, 1, 1], // Line 16:
      [1, 1, 2, 1, 1], // Line 17:
      [0, 0, 2, 0, 0], // Line 18:
      [2, 2, 0, 2, 2], // Line 19:
      [0, 2, 2, 2, 0]  // Line 20:
    ]
  },

  // Spin Configuration
  spin: {
    speed: 1000,
    acceleration: 2000,
    deceleration: 1500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    reelDelay: 100,
    anticipationDelay: 500,
    stopPattern: 'sequential'
  },

  // RTP and Volatility
  rtp: {
    target: 96.0,
    variance: 'medium',
    hitFrequency: 25.5
  },

  // Betting Configuration  
  betting: {
    minBet: 0.20,
    maxBet: 100.00,
    defaultBet: 1.00,
    betLevels: [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00],
    coinValues: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00],
    linesAdjustable: true,
    maxLines: 20
  },

  // Audio Configuration
  audio: {
    enabled: true,
    volume: 0.7,
    effects: {
      spin: '/assets/audio/spin.mp3',
      reelStop: '/assets/audio/reel_stop.mp3', 
      win: '/assets/audio/win.mp3',
      bigWin: '/assets/audio/big_win.mp3',
      backgroundMusic: '/assets/audio/background.mp3'
    },
    backgroundMusicLoop: true,
    effectsVolume: 0.8,
    musicVolume: 0.4
  },

  // Animation Configuration
  animations: {
    enabled: true,
    quality: 'high',
    spinEffects: ['blur', 'speed'],
    winEffects: ['highlight', 'glow', 'bounce'],
    symbolAnimations: true,
    backgroundAnimations: true,
    particleEffects: true,
    presets: {
      spinStart: 'blurIn',
      reelStop: 'bounce',
      smallWin: 'highlight',
      bigWin: 'coinBurst',
      megaWin: 'explosion'
    }
  },

  // UI Configuration
  ui: {
    theme: 'dark',
    layout: 'standard',
    showPaytable: true,
    showRules: true,
    showRTP: false,
    autoplayOptions: [10, 25, 50, 100, 'infinite'],
    quickSpinEnabled: true,
    spacebar: true
  },

  // Game Features
  features: {
    autoplay: {
      enabled: true,
      maxSpins: 1000,
      stopOnWin: false,
      stopOnFeature: true,
      stopOnLoss: false
    },
    freespins: {
      enabled: true,
      triggerSymbols: ['scatter'],
      minTriggerCount: 3,
      spinsAwarded: [10, 15, 20],
      multiplier: 1,
      retrigger: true
    },
    gamble: {
      enabled: false,
      maxGambles: 5,
      maxWinMultiplier: 16
    },
    turbo: {
      enabled: true,
      speedMultiplier: 2.0,
      skipAnimations: false
    }
  },

  // Math Model
  math: {
    reel1: [15, 12, 8, 6, 4, 3, 2, 1], // Symbol weights for reel 1
    reel2: [15, 12, 8, 6, 4, 3, 2, 1], // Symbol weights for reel 2  
    reel3: [15, 12, 8, 6, 4, 3, 2, 1], // Symbol weights for reel 3
    reel4: [15, 12, 8, 6, 4, 3, 2, 1], // Symbol weights for reel 4
    reel5: [15, 12, 8, 6, 4, 3, 2, 1], // Symbol weights for reel 5
    stopPositions: 64,
    cycles: 1000000
  },

  // Performance Configuration
  performance: {
    enableRAF: true,
    targetFPS: 60,
    enableWorkers: false,
    preloadAssets: true,
    lazyLoadSymbols: false,
    maxConcurrentAnimations: 10
  },

  // Debug Configuration
  debug: {
    enabled: false,
    showFPS: false,
    showGrid: false,
    logEvents: false,
    forceWins: false,
    simulationMode: false
  },

  // Engine Configuration
  engine: {
    version: '1.0.0',
    mode: 'production',
    locale: 'en-US',
    currency: 'USD',
    timezone: 'UTC',
    saveState: true,
    restoreState: true
  }
};

/**
 * Lightweight configuration for testing or minimal setups
 */
export const minimalConfig: Partial<GameConfig> = {
  layout: {
    reels: 3,
    rows: 3,
    orientation: 'portrait'
  },
  symbols: {
    count: 5,
    types: [
      {
        id: 'wild',
        name: 'Wild',
        type: 'wild', 
        weight: 2,
        payout: [0, 0, 10, 50, 200],
        imageUrl: '/assets/symbols/wild.png'
      },
      {
        id: 'high_1',
        name: 'Diamond',
        type: 'high',
        weight: 3,
        payout: [0, 0, 5, 25, 100],
        imageUrl: '/assets/symbols/high_1.png'
      },
      {
        id: 'medium_1',
        name: 'Crown', 
        type: 'medium',
        weight: 6,
        payout: [0, 0, 3, 15, 50],
        imageUrl: '/assets/symbols/medium_1.png'
      },
      {
        id: 'low_1',
        name: 'Cherry',
        type: 'low',
        weight: 10,
        payout: [0, 0, 2, 10, 25],
        imageUrl: '/assets/symbols/low_1.png'
      },
      {
        id: 'low_2',
        name: 'Lemon',
        type: 'low', 
        weight: 12,
        payout: [0, 0, 1, 5, 15],
        imageUrl: '/assets/symbols/low_2.png'
      }
    ]
  },
  paylines: {
    count: 5,
    patterns: [
      [1, 1, 1], // Middle row
      [0, 0, 0], // Top row
      [2, 2, 2], // Bottom row
      [0, 1, 2], // Diagonal down
      [2, 1, 0]  // Diagonal up
    ]
  },
  betting: {
    minBet: 0.25,
    maxBet: 25.00,
    defaultBet: 1.00
  }
};

export default defaultConfig;