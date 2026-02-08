/**
 * API Configuration for external services
 */
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  enabled?: boolean;
  useLocalMock?: boolean;
}

/**
 * API Response wrapper format
 */
export interface ApiResponse {
  id: string;
  newGameId?: string;
  version?: string;
  status?: string;
  config: GameConfiguration;
}

/**
 * Game Configuration used for API communication
 */
export interface GameConfiguration {
  gameId: string;
  gameType?: string;
  theme: {
    mainTheme: string;
    artStyle: string;
    colorScheme: string;
    mood: string;
    description: string;
    name?: string;
    primaryColor?: string;
    secondaryColor?: string;
    gradientType?: string;
    includeCardSymbols?: boolean;
    includeWild?: boolean;
    includeScatter?: boolean;
    selectedSymbols?: string[];
    references?: string[];
    generated?: {
      background: string | null;
      symbols: string[];
      frame: string | null;
    };
  };
  bet: {
    min: number;
    max: number;
    increment: number;
    quickOptions?: number[];
    defaultBet?: number;
    maxLines?: number;
  };
  rtp?: {
    baseRTP: number;
    bonusRTP: number;
    featureRTP: number;
    targetRTP?: number;
    volatilityScale?: number;
    variants?: {
      low: number;
      medium: number;
      high: number;
    };
  };
  volatility?: {
    level: 'low' | 'medium' | 'high';
    hitRate: number;
    maxWinPotential: number;
    variance?: number;
    precisionValue?: number;
    hitFrequency?: number;
  };
  reels?: {
    payMechanism?: 'betlines' | 'ways' | 'cluster';
    layout?: {
      shape?: 'rectangle' | 'square' | 'diamond' | 'hexagon';
      reels?: number;
      rows?: number;
    };
    betlines?: number;
    spinDirection?: 'vertical' | 'horizontal';
    cluster?: {
      minSymbols?: number;
      diagonalAllowed?: boolean;
      payouts?: Record<string, number>;
    };
    symbols?: {
      total?: number;
      wilds?: number;
      scatters?: number;
      list?: Array<{
        id: string;
        name: string;
        image: string;
        weight: number;
        isWild?: boolean;
        isScatter?: boolean;
        payouts?: Record<string, number>;
      }>;
    };
  };
  bonus?: {
    freeSpins?: {
      enabled?: boolean;
      count?: number;
      triggers?: number[];
      multipliers?: number[];
      retriggers?: boolean;
    };
    pickAndClick?: {
      enabled?: boolean;
      gridSize?: [number, number];
      picks?: number;
      maxPrize?: number;
      extraPicks?: boolean;
      multipliers?: boolean;
    };
    wheel?: {
      enabled?: boolean;
      segments?: number;
      maxMultiplier?: number;
      levelUp?: boolean;
      respin?: boolean;
    };
    holdAndSpin?: {
      enabled?: boolean;
      gridSize?: [number, number];
      initialRespins?: number;
      maxSymbolValue?: number;
      resetRespins?: boolean;
      collectAll?: boolean;
    };
    jackpots?: {
      enabled?: boolean;
      type?: 'fixed' | 'progressive';
      levels?: string[];
      trigger?: 'random' | 'symbol' | 'bonus';
      values?: Record<string, number>;
    };
    specialFeatures?: {
      expandingWilds?: boolean;
      stickyWilds?: boolean;
      cascadingReels?: boolean;
      bonusWheel?: boolean;
    };
  };
  audio?: {
    backgroundMusic?: string;
    spinSound?: string;
    winSounds?: {
      small?: string;
      medium?: string;
      big?: string;
      mega?: string;
    };
    featureSounds?: Record<string, string>;
    soundIntensity?: 'low' | 'medium' | 'high';
    enableVoiceover?: boolean;
  };
  playerExperience?: {
    spinSpeed?: 'slow' | 'normal' | 'fast' | 'turbo';
    autospinOptions?: number[];
    defaultAutospin?: number;
    skipAnimations?: boolean;
    bigWinThreshold?: number;
    megaWinThreshold?: number;
  };
  mobile?: {
    orientationMode?: 'portrait' | 'landscape' | 'both';
    touchControls?: {
      swipeToSpin?: boolean;
      gestureControls?: boolean;
      vibrateOnWin?: boolean;
    };
    screenAdaptation?: {
      smallScreenLayout?: boolean;
      largeButtonsForTouch?: boolean;
    };
  };
  analytics?: {
    trackEvents?: boolean;
    metricsToTrack?: string[];
    abTestingEnabled?: boolean;
    abTestVariants?: string[];
  };
  certification?: {
    targetMarkets?: string[];
    complianceChecklist?: Record<string, boolean>;
    testingResults?: {
      rtpVerification?: boolean;
      functionalTest?: boolean;
      securityAudit?: boolean;
    };
    regulatoryDocs?: string[];
  };
  distribution?: {
    marketplaceListings?: string[];
    revenueModel?: 'revenue-share' | 'flat-fee' | 'hybrid';
    integrationPlatforms?: string[];
    exclusivity?: boolean;
  };
  gameRules?: {
    helpScreens?: string[];
    paytableConfig?: Record<string, unknown>;
  };
  localization?: {
    supportedLanguages?: string[];
    defaultLanguage?: string;
    supportedCurrencies?: string[];
    defaultCurrency?: string;
    regionalRestrictions?: string[];
  };
  scratch?: ScratchConfig;
}

// Scratch Card Specific Types
export interface ScratchConfig {
  layout: {
    rows: number;
    columns: number;
    shape: 'rectangle' | 'square' | 'circle' | 'custom';
  };
  mechanic: {
    type: 'match_3' | 'match_2' | 'find_symbol' | 'lucky_number';
    winningSymbol?: string; // ID of the symbol to find
  };
  brush: {
    size: number;
    tipType?: 'coin' | 'finger' | 'wand' | 'custom';
    customTipImage?: string;
  };
  overlay: {
    image: string; // URL to overlay image (or color/gradient string)
    texture?: string; // ID of texture preset
    color?: string; // Fallback color
    opacity?: number;
    blendMode?: string;
    shape?: 'square' | 'circle' | 'symbol-shape' | 'custom';
    customShapeImage?: string; // Mask image for custom shapes
  };
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string; // Hex, URL, or Gradient String
    pattern?: string; // Optional pattern overlay
  };
  symbols: {
    style: 'theme' | 'custom' | 'emojis' | 'gems' | 'fruits';
    customSet?: string[]; // URLs if custom
  };
  mascot: {
    enabled: boolean;
    source: 'none' | 'robot' | 'wizard' | 'cat' | 'dog' | 'custom';
    customImage?: string;
    position: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
    scale: number;
  };
  prizes: ScratchPrizeTier[];
}

export type WinCondition =
  | { type: 'match_n'; count: number; symbolId: string }
  | { type: 'find_target'; targetSource: 'fixed' | 'dynamic'; symbolId: string }
  | { type: 'instant_win'; trigger: 'symbol' | 'amount'; value: string };

export interface ScratchPrizeTier {
  id: string;
  name: string;
  condition: WinCondition;
  payout: number; // Multiplier of bet
  weight: number; // Frequency weight
}

/**
 * Options for cloning an existing configuration
 */
export interface CloneOptions {
  newGameId: string;
  overrides?: Partial<GameConfiguration>;
}