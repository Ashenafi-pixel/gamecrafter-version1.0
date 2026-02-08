import { GameConfig } from '../types';

/**
 * Default configuration values for the game
 * Extracted from store.ts to improve maintainability
 */
export const CONFIG_DEFAULTS: Partial<GameConfig> = {
  api: {
    baseUrl: 'local',
    apiKey: '',
    enabled: true,
    useLocalMock: true  // Use local placeholder images
  },
  gemini: {
    apiKey: '',
    modelName: 'imagen-3.0-generate-002',
    enabled: false
  },
  openai: {
    apiKey: '',
    modelName: 'dall-e-3',
    quality: 'standard',
    size: '1024x1024',
    style: 'vivid',
    enabled: false
  },
  leonardo: {
    apiKey: '',
    modelId: 'aa77f04e-3eec-4034-9c07-d0f619684628', // Leonardo Kino XL (Transparency Support)
    width: 768,
    height: 768,
    promptMagic: true,
    alchemy: true,
    contrastRatio: 0.5,
    guidanceScale: 7,
    enabled: false
  },
  theme: {
    mainTheme: '',
    artStyle: 'cartoon',
    colorScheme: 'warm-vibrant',
    mood: 'playful',
    description: '',
    references: [],
    includeCardSymbols: true,
    includeWild: true,
    includeScatter: true,
    generated: {
      background: null,
      symbols: [],
      frame: null
    },
    presetSymbol: {}
  },
  rtp: {
    baseRTP: 96.0,
    bonusRTP: 0,
    featureRTP: 0,
    variants: {
      low: 94.0,
      medium: 96.0,
      high: 98.0
    },
    targetRTP: 96.0,
    volatilityScale: 5 // Medium on a 1-10 scale
  },
  volatility: {
    level: 'medium',
    variance: 10,
    hitRate: 20,
    maxWinPotential: 5000,
    precisionValue: 5, // Medium on a 1-10 scale
    hitFrequency: 25 // 25% hit rate
  },
  bet: {
    min: 0.20,
    max: 100,
    increment: 0.20,
    quickOptions: [1, 2, 5, 10, 20, 50],
    defaultBet: 1.00,
    maxLines: 20
  },
  reels: {
    payMechanism: 'betlines',
    layout: {
      shape: 'rectangle',
      reels: 5,
      rows: 3
    },
    betlines: 20,
    spinDirection: 'vertical',
    cluster: {
      minSymbols: 5,
      diagonalAllowed: false,
      payouts: {
        5: 5,
        8: 20,
        12: 100
      }
    },
    symbols: {
      total: 10,
      wilds: 1,
      scatters: 1,
      list: []
    }
  },
  bonus: {
    freeSpins: {
      enabled: false,
      count: 10,
      triggers: [3],
      multipliers: [1],
      retriggers: false
    },
    pickAndClick: {
      enabled: false,
      gridSize: [3, 3],
      picks: 3,
      maxPrize: 100,
      extraPicks: false,
      multipliers: false
    },
    wheel: {
      enabled: false,
      segments: 8,
      maxMultiplier: 50,
      levelUp: false,
      respin: false
    },
    holdAndSpin: {
      enabled: false,
      gridSize: [3, 3],
      initialRespins: 3,
      maxSymbolValue: 100,
      resetRespins: false,
      collectAll: false
    },
    jackpots: {
      enabled: false,
      type: 'fixed',
      levels: ['Minor', 'Major'],
      trigger: 'random'
    },
    specialFeatures: {
      expandingWilds: false,
      stickyWilds: false,
      cascadingReels: false,
      bonusWheel: false
    }
  },
  audio: {
    backgroundMusic: {
      MusicBed: null,
      AlternateLoop: null
    },
    spinSound: '',
    winSounds: {
      small: '',
      medium: '',
      big: '',
      mega: ''
    },
    featureSounds: {},
    soundIntensity: 'medium',
    enableVoiceover: false
  },
  playerExperience: {
    spinSpeed: 'normal',
    autospinOptions: [10, 25, 50, 100],
    defaultAutospin: 25,
    skipAnimations: false,
    bigWinThreshold: 30, // 30x bet
    megaWinThreshold: 100 // 100x bet
  },
  localization: {
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    defaultCurrency: 'USD',
    regionalRestrictions: []
  },
  mobile: {
    orientationMode: 'both',
    touchControls: {
      swipeToSpin: true,
      gestureControls: true,
      vibrateOnWin: true
    },
    screenAdaptation: {
      smallScreenLayout: true,
      largeButtonsForTouch: true
    }
  },
  analytics: {
    trackEvents: true,
    metricsToTrack: ['spins', 'wins', 'features-triggered', 'time-played'],
    abTestingEnabled: false
  },
  certification: {
    targetMarkets: ['global'],
    complianceChecklist: {},
    testingResults: {
      rtpVerification: false,
      functionalTest: false,
      securityAudit: false
    },
    regulatoryDocs: []
  },
  distribution: {
    marketplaceListings: [],
    revenueModel: 'revenue-share',
    integrationPlatforms: [],
    exclusivity: false
  },
  // Splash screen and preloader configuration
  splashScreen: {
    enabled: true,
    gameTitle: 'Epic Slots Adventure',
    gameSubtitle: 'The Ultimate Gaming Experience',
    featureHighlights: [
      {
        id: 'feature-1',
        title: '5 Reels, 25 Paylines',
        description: 'Multiple ways to win on every spin',
        icon: '🎰',
        image: null,
        position: { x: 25, y: 25 },
        size: { width: 200, height: 120 },
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff'
      },
      {
        id: 'feature-2',
        title: 'Wild & Scatter Symbols',
        description: 'Special symbols for bigger wins',
        icon: '💎',
        image: null,
        position: { x: 75, y: 25 },
        size: { width: 200, height: 120 },
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff'
      },
      {
        id: 'feature-3',
        title: 'Free Spins Bonus',
        description: 'Trigger bonus rounds for extra chances',
        icon: '🎁',
        image: null,
        position: { x: 25, y: 75 },
        size: { width: 200, height: 120 },
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff'
      },
      {
        id: 'feature-4',
        title: 'Up to 1000x Multiplier',
        description: 'Massive win potential with every spin',
        icon: '⚡',
        image: null,
        position: { x: 75, y: 75 },
        size: { width: 200, height: 120 },
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#ffffff'
      }
    ],
    splashDuration: 3000,
    splashBackground: '#2D1B69',
    splashTextColor: '#ffffff'
  },
  gameRules: {
    helpScreens: [],
    paytableConfig: {}
  },
  // Advanced animation configuration for reel spins
  advanced: {
    animation: {
      accelerationDuration: 0.5,
      constantSpeedDuration: 2,
      decelerationDuration: 2,
      anticipationPauseDuration: 0.2,
      anticipationOffset: -20,
      shakeAmplitude: 10,
      shakeFrequency: 5,
      overshootPercentage: 10,
      bounceCount: 1,
      bounceDamping: 0.4,
      motionBlurStrength: 0,
      easingFunction: 'power2.inOut',
      symbolScaleOnStop: 1.2,
      flashAlpha: 0.5
    }
  },
  // Grid positioning and scaling defaults
  gridPosition: { x: 0, y: 0 },
  gridScale: 120,
  gridStretch: { x: 100, y: 100 },
  showSymbolBackgrounds: true,
  // Game state
  state: {
    mode: "normal"
  },
  scratch: {
    layout: {
      rows: 3,
      columns: 3,
      shape: 'square'
    },
    mechanic: {
      type: 'match_3'
    },
    brush: {
      size: 40,
      tipType: 'coin',
      customBrushes: []
    },
    symbols: {
      style: 'gems',
      numberStyle: 'gold', // Default commercial numbers
      customAssets: []
    },
    logo: {
      type: 'none',
      scale: 1,
      position: 'top',
      layout: 'docked-header'
    },
    background: {
      type: 'color',
      value: '#1a1a1a'
    },
    overlay: {
      image: '',
      color: '#ffffff',
      opacity: 0
    },
    effects: {
      particles: true,
      confetti: true,
      parallax: true
    },
    audio: {
      isGenerating: false
    },
    mascot: {
      enabled: false,
      source: 'none',
      position: 'bottom-right',
      scale: 1
    },
    prizes: []
  }
};