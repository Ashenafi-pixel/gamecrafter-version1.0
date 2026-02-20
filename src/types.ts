export type SymbolSpineAsset = {
  atlasUrl: string;
  skelUrl: string;
  textureUrl: string;
  textureName: string;
};

export type ThemeConfig = {
  name?: string;
  mainTheme: string;
  artStyle?: 'cartoon' | 'realistic' | 'pixel' | 'hand-drawn';
  appliedAt?: string;
  colorScheme: string;
  colors?: {
    newColors?: string;
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
  };
  mood: string;
  description: string;
  logo?: string; // [FIX] Added logo property for persistence
  references: string[];
  includeCardSymbols?: boolean;
  includeWild?: boolean;
  includeScatter?: boolean;
  selectedSymbols?: string[];
  selectedThemeId?: string
  generated?: {
    background?: string | null;
    /** Single source: each key is either image URL (string) or Spine zip asset (SymbolSpineAsset). Replaces separate symbolSpineAssets. */
    symbols?: string[] | Record<string, string | SymbolSpineAsset>;
    frame?: string | null;
    /** @deprecated Prefer symbols[key] for Spine assets. Kept for backward compat read-only. */
    symbolSpineAssets?: Record<string, SymbolSpineAsset>;
    symbolPaytables?: Record<string, { pay3: number; pay4?: number; pay5?: number; pay6?: number; pay7?: number }>;
    bonusSymbols?: unknown;
  };
  presetSymbol?: Record<string, string>; // {symbolType}_extended -> base64 (e.g., wild_extended, high1_extended)
};

export type ColorSet = {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  newColors?: string;
};

export type BetConfig = {
  min: number;
  max: number;
  increment: number;
  quickOptions?: number[];
  defaultBet?: number;
  maxLines?: number;
};

export type RTPConfig = {
  baseRTP: number;
  bonusRTP: number;
  featureRTP: number;
  variants: {
    low: number;
    medium: number;
    high: number;
  };
  targetRTP?: number;
  volatilityScale?: number; // 1-10 scale
};

export type VolatilityConfig = {
  level: 'low' | 'medium' | 'high';
  variance: number;
  hitRate: number;
  maxWinPotential: number;
  precisionValue?: number; // 1-10 scale
  hitFrequency?: number; // percentage
};

export type ReelsConfig = {
  payMechanism: 'betlines' | 'ways' | 'cluster';
  layout: {
    shape: 'rectangle' | 'square' | 'diamond' | 'hexagon';
    reels: number;
    rows: number;
  };
  betlines: number;
  spinDirection: 'vertical' | 'horizontal';
  cluster?: {
    minSymbols: number;
    diagonalAllowed: boolean;
    payouts: Record<number, number>; // symbolCount -> payout
  };
  symbols: {
    total: number;
    wilds: number;
    scatters: number;
    list: SymbolConfig[];
  };
};

export type SymbolConfig = {
  id: string;
  name: string;
  image: string;
  weight: number;
  isWild?: boolean;
  isScatter?: boolean;
  payouts: Record<number, number>; // symbolCount -> payout
};

export type AudioFile = {
  url: string;
  duration: string;
};

export type AudioConfig = {
  backgroundMusic: {
    MusicBed: AudioFile | null;
    AlternateLoop: AudioFile | null;
  };
  spinSound: string;
  winSounds: {
    small: string;
    medium: string;
    big: string;
    mega: string;
  };
  featureSounds: Record<string, string>;
  soundIntensity: 'low' | 'medium' | 'high';
  enableVoiceover: boolean;
};

export type PlayerExperienceConfig = {
  spinSpeed: 'slow' | 'normal' | 'fast' | 'turbo';
  autospinOptions: number[];
  defaultAutospin: number;
  skipAnimations: boolean;
  bigWinThreshold: number; // multiplier of bet
  megaWinThreshold: number; // multiplier of bet
};

export type LocalizationConfig = {
  supportedLanguages: string[];
  defaultLanguage: string;
  supportedCurrencies: string[];
  defaultCurrency: string;
  regionalRestrictions: string[];
};

export type MobileConfig = {
  orientationMode: 'portrait' | 'landscape' | 'both';
  touchControls: {
    swipeToSpin: boolean;
    gestureControls: boolean;
    vibrateOnWin: boolean;
  };
  screenAdaptation: {
    smallScreenLayout: boolean;
    largeButtonsForTouch: boolean;
  };
};

export type AnalyticsConfig = {
  trackEvents: boolean;
  metricsToTrack: string[];
  abTestingEnabled: boolean;
  abTestVariants?: string[];
};

export type CertificationConfig = {
  targetMarkets: string[];
  selectedLab?: string;
  complianceChecklist: Record<string, boolean>;
  testingResults: {
    rtpVerification: boolean;
    functionalTest: boolean;
    securityAudit: boolean;
  };
  regulatoryDocs: string[];
};

export type DistributionConfig = {
  marketplaceListings: string[];
  revenueModel: 'revenue-share' | 'flat-fee' | 'hybrid';
  integrationPlatforms: string[];
  exclusivity: boolean;
};

export type BonusConfig = {
  hasBuyFeature?: boolean;
  hasAnteBet?: boolean;
  hasFreeSpins?: boolean;
  freeSpins?: {
    enabled: boolean;
    count: number;
    triggers?: number[];
    multipliers?: number[];
    retriggers?: boolean;
  };
  pickAndClick?: {
    enabled: boolean;
    gridSize: [number, number];
    picks: number;
    maxPrize: number;
    extraPicks?: boolean;
    multipliers?: boolean;
  };
  wheel?: {
    enabled: boolean;
    segments: number;
    maxMultiplier: number;
    levelUp?: boolean;
    respin?: boolean;
  };
  holdAndSpin?: {
    enabled: boolean;
    gridSize: [number, number];
    initialRespins: number;
    maxSymbolValue: number;
    resetRespins?: boolean;
    collectAll?: boolean;
  };
  jackpots?: {
    enabled: boolean;
    type: 'fixed' | 'progressive';
    levels: string[];
    trigger: 'random' | 'symbol' | 'bonus';
    values?: Record<string, number>;
  };
  specialFeatures?: {
    expandingWilds?: boolean;
    stickyWilds?: boolean;
    cascadingReels?: boolean;
    bonusWheel?: boolean;
  };
};

export type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  lastConnected?: string;
  useLocalMock?: boolean;
};

export type GeminiConfig = {
  apiKey: string;
  modelName: string;
  enabled?: boolean;
  lastConnected?: string;
};

export type OpenAIConfig = {
  apiKey: string;
  modelName: string;
  enabled?: boolean;
  lastConnected?: string;
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  style?: 'vivid' | 'natural';
  background?: 'transparent' | 'solid';
};

export type LeonardoConfig = {
  apiKey: string;
  modelId?: string;
  enabled?: boolean;
  lastConnected?: string;
  width?: number;
  height?: number;
  presetStyle?: string;
  promptMagic?: boolean;
  alchemy?: boolean;
  contrastRatio?: number;
  guidanceScale?: number;
  seed?: number;
};

export type FrameConfig = {
  style: 'modern' | 'classic' | 'ornate' | 'minimal' | 'custom';
  borderWidth: number;
  borderRadius: number;
  borderColor: string;
  backgroundColor: string;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  frameImage?: string;
  buttons: {
    style: 'round' | 'square' | 'pill';
    color: string;
    textColor: string;
    position: 'bottom' | 'side';
    size: 'small' | 'medium' | 'large';
  };
  customStyles?: Record<string, any>;
};

export type BackgroundConfig = {
  type: 'static' | 'animated';
  style: 'nature' | 'space' | 'abstract' | 'fantasy' | 'urban' | 'custom';
  color: string;
  secondaryColor?: string;
  gradientType?: 'linear' | 'radial';
  gradientDirection?: 'top-to-bottom' | 'left-to-right' | 'diagonal';
  backgroundImage?: string;
  effects?: {
    particles?: boolean;
    particleColor?: string;
    particleCount?: number;
    particleSpeed?: number;
    lightning?: boolean;
    lightningFrequency?: number;
    rain?: boolean;
    rainIntensity?: number;
    snow?: boolean;
    snowIntensity?: number;
    stars?: boolean;
    starCount?: number;
    clouds?: boolean;
    cloudCount?: number;
    dayNightCycle?: boolean;
    cycleLength?: number;
  };
  customSettings?: Record<string, any>;
};

export type WinAnimationConfig = {
  type: 'lightning' | 'sparkle' | 'glow' | 'fire' | 'confetti' | 'coins' | 'custom';
  intensity: number;
  duration: number;
  color: string;
  secondaryColor?: string;
  soundEnabled: boolean;
  particleCount: number;
  particleSize: number;
  particleSpeed: number;
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
  shakeEnabled: boolean;
  shakeIntensity: number;
  flashEnabled: boolean;
  flashColor: string;
  flashCount: number;
  zoomEnabled: boolean;
  zoomScale: number;
  pathHighlight: boolean;
  highlightColor: string;
  highlightWidth: number;
  customScript?: string;
};

export type WinMultiplierThresholds = {
  smallWin: number;
  bigWin: number;
  megaWin: number;
  superWin: number;
};

export type WinTierCalculation = {
  betAmount: number;
  winAmount: number;
  multiplier: number;
  tier: 'small' | 'big' | 'mega' | 'super';
};

export type GameConfig = {
  api?: ApiConfig;
  gemini?: GeminiConfig;
  openai?: OpenAIConfig;
  leonardo?: LeonardoConfig;
  theme?: Partial<ThemeConfig>;
  bet: BetConfig;
  rtp: RTPConfig;
  volatility: VolatilityConfig;
  reels: ReelsConfig;
  bonus?: BonusConfig;
  audio?: AudioConfig;
  playerExperience?: PlayerExperienceConfig;
  localization?: LocalizationConfig;
  mobile?: MobileConfig;
  analytics?: AnalyticsConfig;
  certification?: CertificationConfig;
  distribution?: DistributionConfig;
  gameRules?: {
    helpScreens: string[];
    paytableConfig: Record<string, any>;
    generalRulesText?: string;
    paytableText?: string;
    // New Hacksaw-style fields
    howToPlayText?: string;
    paytableRows?: { symbol: string; value: string }[];
    rulesText?: string;
    generalText?: string;
    additionalInfoText?: string;
    interruptedGameText?: string;
    gameHistoryText?: string;
    termsText?: string;
  };
  marketing?: {
    thumbnailUrl?: string; // Landscape 4:3 or 16:9
    posterUrl?: string;    // Portrait 3:4 for Lobby
    description?: string;
    aiPrompt?: string;
    assets?: string[];
  };
  persistSelection?: boolean;
  instantGameType?: string; // [NEW] Plinko, Mines, Coin Flip
  instantGameConfig?: {
    plinko?: {
      rows: number;
      risk: string;
      visuals?: {
        ballColor: string;
        ballTexture?: string; // URL
        pegColor: string;
        pegGlow: boolean;
        bucketColor: string;
        backgroundColor?: string;
        backgroundImage?: string;
        backgroundTexture?: string; // [NEW] Texture URL from UnifiedAssetControl
        particleTrail?: boolean;
      }
    };
    mines?: {
      gridSize: number;
      mineCount: number;
      visuals?: {
        mineIcon?: string; // URL or preset ID
        gemIcon?: string; // URL or preset ID
        tileColor: string;
        tileCoverColor: string;
        explodeEffect: 'fire' | 'sparkle' | 'smoke' | 'none';
      }
    };
    coin?: {
      theme: string;
      side: 'heads' | 'tails';
      visuals?: {
        headsImage?: string; // URL
        tailsImage?: string; // URL
        edgeColor: string;
        coinMaterial: 'gold' | 'silver' | 'bronze' | 'custom';
      }
    };
  };
  gameTypeInfo?: {
    id: string;
    title: string;
    description: string;
    features: string;
    selectedAt: string;
  };
  frame?: FrameConfig;
  background?: BackgroundConfig;
  backgroundFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  backgroundScale?: number;
  derivedBackgrounds?: {
    freespin?: string;
    night?: string;
    day?: string;
    bonus?: string;
  };
  backgroundResponseId?: string;
  backgroundPosition?: { x: number; y: number };
  frameStyle?: 'outer' | 'reel' | 'both';
  framePosition?: { x: number; y: number };
  frameScale?: number;
  frameStretch?: { x: number; y: number };
  winAnimation?: WinAnimationConfig;
  winAnimations?: Record<string, any>;
  winMultiplierThresholds?: WinMultiplierThresholds;
  selectedWinAnimationPreset?: string;
  generatedAssets?: {
    winTitles?: Record<string, string>;
    particles?: Record<string, string>;
    numberImages?: Record<string, string>;
    bonusNumberImage?: Record<string, string>;
  };
  particleConfigs?: Record<string, any>; // Full particle asset configurations for persistence
  winTitleConfigs?: Record<string, any>; // Full win title asset configurations for persistence
  titleAssets?: {
    freeSpins?: string;
    bonusGame?: string;
    pickAndClick?: string;
    smallWin?: string;
    bigWin?: string;
    megaWin?: string;
    superWin?: string;
    gameOver?: string;
    congratulations?: string;
  };
  titleAssetsStyle?: string;
  visualJourney?: {
    currentStep: number;
    totalSteps: number;
    progress: number;
    completedSteps: Record<string, boolean>;
  };
  gameId?: string;
  loadedFromApi?: boolean;
  lastLoaded?: string;
  selectedGameType?: string;
  isClone?: boolean;
  clonedFrom?: string;
  clonedAt?: string;
  displayName?: string;
  gameTheme?: string;
  splashScreen?: {
    enabled?: boolean;
    gameTitle?: string;
    gameSubtitle?: string;
    featureHighlights?: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      image: string | null;
      position: { x: number; y: number };
      size: { width: number; height: number };
      backgroundColor: string;
      textColor: string;
    }>;
    splashDuration?: number;
    splashBackground?: string;
    splashTextColor?: string;
  };
  // Reel divider properties
  reelGap?: number;
  reelDividerPosition?: { x: number; y: number };
  reelDividerStretch?: { x: number; y: number };
  aiReelImage?: string | null;
  winDisplayImage?: string;
  winDisplayPositions?: {
    desktop: { x: number; y: number };
    mobilePortrait: { x: number; y: number };
    mobileLandscape: { x: number; y: number };
  };
  winDisplayScales?: {
    desktop: number;
    mobilePortrait: number;
    mobileLandscape: number;
  };
  // Game state
  state?: {
    mode?: "normal" | "free-spin";
  };
  scratch?: ScratchConfig;
  crash?: CrashConfig;
};

// Scratch Card Specific Types

export interface LayerConfig {
  zIndex: number;
  visible: boolean;
}

export interface SceneLayer extends LayerConfig {
  type: 'color' | 'image' | 'gradient'; // L0
  value: string;
  filter?: string; // blur, sepia, etc.
}

export interface CardBodyLayer extends LayerConfig {
  type: 'color' | 'image' | 'gradient' | 'texture'; // L1
  value: string;
  texture?: string; // paper, foil, metallic
  cornerRadius?: number;
  shadow?: boolean;
}

export interface CardShapeLayer extends LayerConfig {
  shape: 'rectangle' | 'rounded' | 'circle' | 'pentagon' | 'hexagon' | 'triangle' | 'star' | 'custom'; // L2
  maskUrl?: string;
  padding: number; // Safe area padding
  aspectRatio?: number;
}

export interface FoilLayer extends LayerConfig {
  texture: string; // L5
  color?: string;
  image?: string; // Custom image (texture override)
  pattern?: string;
  finish?: 'matte' | 'glossy' | 'metal'; // [NEW] Surface Finish
  enableParallax?: boolean; // [NEW] Parallax Effect
  opacity: number;
  revealMode: 'brush' | 'click' | 'auto';
  autoRevealDelay?: number;
}

export interface OverlayLayer extends LayerConfig {
  color?: string;
  image?: string;
  mascots: {
    id: string;
    source: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    scale: number;
    anchor: 'card' | 'screen';
  }[];
  logos: {
    id: string;
    type: 'text' | 'image';
    content: string; // text or url
    position: { x: number, y: number };
    scale: number;
    style?: any; // font, color, etc.
  }[];
}

export interface SymbolHuntRules {
  ruleMode: 'COLLECT_X' | 'TIERED_COUNT' | 'LIMITED_PICKS';
  targetSymbolId: string | null;
  requiredHits?: number;
  maxPicks?: number;
  minHitsToWin?: number;
  revealStyle: 'MANUAL' | 'AUTO';
  grid: {
    rows: number;
    cols: number;
  };
  failSymbolProbability?: number;
}

export type ParticleConfig = {
  enabled: boolean;
  color: string;
  size: number;
  speed: number;
  count: number;
  lifespan: number;
  texture?: string;
};

export interface CrashConfig {
  growthRate: number;
  houseEdge: number;
  minMultiplier: number;
  maxMultiplier: number;
  // New Core Mechanics
  algorithm: 'linear' | 'exponential' | 'logistic';
  direction: 'up' | 'right' | 'diagonal'; // [NEW] Movement direction
  physics: 'standard' | 'gravity' | 'bounce'; // [NEW] Physics mode
  betting: {
    maxBets: number; // 1 or 2
    autoCashoutEnabled: boolean;
    minAutoCashout: number;
    maxAutoCashout: number;
  };
  behaviors: {
    crashThresholds: {
      instaCrashChance: number; // 0-1, usually derived from houseEdge
    };
  };
  visuals: {
    lineColor: string;
    gridColor: string;
    textColor: string;
    objectType: 'rocket' | 'plane' | 'dot' | 'comet' | 'custom';
    customObjectUrl?: string; // For uploaded runner
    background?: any;
    showGrid?: boolean;
    showAxis?: boolean;
    graphStyle?: 'solid' | 'neon' | 'dashed' | 'gradient';
    environment?: {
      backgroundType: 'static' | 'scrolling';
      scrollSpeed: number;
    };
    assets?: {
      runnerStates: {
        idle: string;
        run: string;
        crash: string;
      };
    };
    particles?: {
      trail: ParticleConfig;
      explosion: ParticleConfig;
    };
    skinId?: string; // [NEW] For skin system
  };

  audio?: {
    enabled: boolean;
    volume: number;
    tracks: {
      music?: string;
      launch?: string;
      engine?: string;
      crash?: string;
      win?: string;
    };
  };
  social?: {
    liveFeedEnabled: boolean;
    chatEnabled: boolean;
    leaderboardEnabled: boolean;
    fakePlayers: number;
  };
  // Ultimate Features
  camera?: {
    shakeEnabled: boolean;
    shakeStrength: number;
    zoomEnabled: boolean;
    zoomLevel: number;
  };
  economy?: {
    rainEnabled: boolean;
    rainfrequency?: number; // minutes
    tournamentActive: boolean;
    tournamentTitle?: string;
  };
}

export interface ScratchConfig {
  // --- NEW LAYER ARCHITECTURE (Tier-1) ---
  layers?: {
    scene: SceneLayer;       // L0
    card: CardBodyLayer;     // L1
    shape: CardShapeLayer;   // L2
    foil: FoilLayer;         // L5
    overlay: OverlayLayer;   // L6
  };

  rulesGrid?: SymbolHuntRules; // [NEW] Extended rules config for Symbol Hunt

  // --- LEGACY (To be deprecated/mapped) ---
  layout: {
    rows: number;
    columns: number; // L3
    shape: 'rectangle' | 'square' | 'circle' | 'custom' | 'landscape';
    transform?: {
      scale: number; // Uniform scale (legacy/locked)
      scaleX?: number; // Independent X scale
      scaleY?: number; // Independent Y scale
      maintainAspectRatio?: boolean; // Toggle for UI
      x: number;
      y: number; // percents or pixels
    };
    gridBackgroundColor?: string; // Background behind foil
    gridBackgroundImage?: string; // [NEW] Image behind foil
    cellStyle?: 'boxed' | 'transparent'; // [NEW] Control cell appearance
    // Independent Transform for the internal Grid Logic (vs Card Frame)
    grid?: {
      x: number;
      y: number;
      scale: number;
      scaleX?: number;
      scaleY?: number;
      maintainAspectRatio?: boolean;
    };
  };
  mechanic: {
    type: 'match_3' | 'match_2' | 'match_4' | 'find_symbol' | 'lucky_number' | 'instant_win' | 'golden_path' | 'wheel' | 'pick_one' | 'journey' | 'mines';
    winningSymbol?: string;
  };
  brush: {
    size: number;
    tipType?: 'coin' | 'finger' | 'wand' | 'eraser' | 'custom';
    customTipImage?: string;
    customBrushes?: { id: string; url: string; label?: string }[];
    revealThreshold?: number; // 0.0 to 1.0 (Auto-reveal percentage)
  };
  logo?: {
    type: 'text' | 'image' | 'none';
    text?: string;
    font?: string;
    color?: string;
    strokeColor?: string;
    autoStroke?: boolean; // [NEW] Use Frame Color for stroke
    image?: string;
    scale: number;
    position: 'top' | 'top-left' | 'top-right' | 'center' | 'center-left' | 'center-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 'custom';
    layout?: 'docked-header' | 'floating' | 'integrated' | 'pop-out'; // NEW: Pop-out Layout
    customPosition?: { x: number; y: number };
    offsetX?: number;
    offsetY?: number;
  };
  mascot?: {
    type: 'image' | 'spine' | 'none';
    image?: string;
    spineUrl?: string; // For future animation
    animation?: 'idle' | 'bounce' | 'wave' | 'float' | 'pulse';
    scale: number;
    position: 'left' | 'right' | 'custom';
    customPosition?: { x: number; y: number };
  };
  cardFrame?: {
    shape: 'rectangle' | 'rounded' | 'circle' | 'pentagon' | 'hexagon' | 'triangle' | 'star' | 'custom';
    maskUrl?: string; // URL for the shape mask (black/white or alpha)
    frameUrl?: string; // URL for the decorative frame overlay
    padding?: number; // Inner padding for the grid relative to the frame
    borderColor?: string;
    borderWidth?: number;
    effect?: 'none' | 'glow' | 'shadow' | 'metallic';
  };
  presentation?: {
    style: 'SINGLE_ZONE' | 'MULTI_ZONE' | 'GRID_NxM' | 'PATH' | 'REEL' | 'STORY' | 'COUNTDOWN' | 'PICK_A_BOX' | 'STAGES';
    zones?: number;
    pathNodes?: number;
    transform?: {
      scale?: number;
      scaleX?: number;
      scaleY?: number;
      x: number;
      y: number;
    };
  };
  features?: {
    multipliers?: { enabled: boolean; values: number[] };
    bonusZones?: { enabled: boolean; count: number };
    secondChance?: { enabled: boolean; probability: number };
    nearMiss?: { enabled: boolean; intensity: 'low' | 'high' };
  };

  overlay: { // Backwards compat
    image: string; // URL to overlay image (or color/gradient string)
    texture?: string; // ID of texture preset
    color?: string; // Fallback color
    opacity?: number;
    blendMode?: string;
    shape?: 'square' | 'circle' | 'symbol-shape' | 'custom';
    customShapeImage?: string; // Mask image for custom shapes
  };
  effects: {
    particles: boolean; // "Scratch Dust"
    confetti: boolean;  // Win celebration
    parallax: boolean;  // Holographic shimmer
  };
  audio: {
    scratch?: string;
    win?: string;
    bgm?: string;
    isGenerating?: boolean;
    theme?: string;
  };
  audioVolumes?: Record<string, number>;
  background: { // Backwards compat
    type: 'color' | 'image' | 'gradient';
    value: string; // Hex, URL, or Gradient String
    pattern?: string; // Optional pattern overlay
  };
  symbols: {
    style: string;
    numberStyle?: string; // commercial numbers style (gold, silver, etc.)
    customAssets?: { id: string; url: string; label?: string }[]; // User uploaded/AI generated symbols
    loseVariants?: string[]; // [NEW] Selected IDs/URLs for losing/decoy symbols (excluded from win set)
  };

  prizes: ScratchPrizeTier[];
  math?: {
    mathMode?: 'POOL' | 'UNLIMITED'; // v2 Math Mode
    winLogic?: 'SINGLE_WIN' | 'MULTI_WIN'; // [NEW] Single vs Multi Win Logic
    rtp?: number; // [NEW] Target RTP (0-1)
    targetHitFrequency?: number; // Deprecated
    totalTickets?: number; // Deck Size (POOL only)
    ticketPrice?: number; // Base price for calculations (default 1)
  };
}

export type WinCondition =
  | { type: 'match_n'; count: number; symbolId: string }
  | { type: 'find_target'; targetSource: 'fixed' | 'dynamic'; symbolId: string } // fixed = find specific symbol, dynamic = match values in header row
  | { type: 'instant_win'; trigger: 'symbol' | 'amount'; value: string }; // Reveal "Instant $50" symbol

export interface ScratchPrizeTier {
  id: string;
  name: string;
  condition: WinCondition;
  payout: number; // Multiplier of bet
  weight: number; // Frequency weight (POOL: tickets)
  probability?: number; // UNLIMITED: % chance (0-100)
  image?: string; // Optional: Override image for this prize symbol on the grid
  symbolId?: string; // [NEW] Explicit symbol mapping (URL or Asset ID) from Prize Table UI
}

export type ScratchFeatureKey = 'multipliers' | 'bonusZones' | 'secondChance' | 'nearMiss';

// Professional Animation Studio Types
export interface AnimationPreset {
  name: string;
  settings?: {
    speed: number;
    blurIntensity: number;
    easing: string;
  };
  description: string;
}

export interface PerformanceMetrics {
  fps: number;
  frameCount: number;
  lastTime: number;
  memoryUsage: number;
  animationComplexity: number;
}

export interface MaskBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DeviceProfile = 'mobile' | 'desktop' | 'tablet';
export type MaskPreviewMode = 'normal' | 'overlay' | 'mask-only' | 'before-after';
export type UiDesigns = "modern" | "ultimate" | "normal" | "simple";

export interface AnimationWorkspace {
  selectedPreset: string;
  maskEditMode: boolean;
  previewMode: MaskPreviewMode;
  performanceMode: DeviceProfile;
  showEasingCurve: boolean;
}

// Enhanced Animation Studio Types
export interface AISuggestion {
  id: string;
  type: 'performance' | 'ux' | 'accessibility' | 'best-practice';
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: string;
  condition?: string;
  stepSpecific?: boolean;
}

export interface AnimationProfile {
  id: string;
  name: string;
  description: string;
  stepType: 'animation' | 'grid' | 'assets' | 'win-animation' | 'theme' | 'general';
  settings: Record<string, any>;
  isDefault?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount?: number;
  author?: string;
  version?: string;
}

export interface UsabilityEvent {
  id: string;
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'error' | 'completion' | 'abandonment';
  element: string;
  stepType: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export interface UsabilityMetrics {
  totalInteractions: number;
  averageTaskTime: number;
  errorRate: number;
  completionRate: number;
  mostUsedFeatures: Array<{ element: string; usage: number }>;
  problemAreas: Array<{ element: string; issues: number }>;
  sessionDuration: number;
  bounceRate: number;
}

export interface DeviceOptimization {
  device: 'mobile' | 'tablet' | 'desktop' | 'low-end';
  maxBlur: number;
  maxEffects: number;
  targetFPS: number;
  memoryLimit: number;
  adaptiveQuality: boolean;
}

export interface NodeBasedAnimation {
  id: string;
  type: 'speed' | 'easing' | 'blur' | 'effect' | 'trigger';
  x: number;
  y: number;
  inputs: NodeConnection[];
  outputs: NodeConnection[];
  parameters: Record<string, any>;
}

export interface NodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
}

export interface TimelineKeyframe {
  time: number; // 0-1 representing animation progress
  property: string;
  value: any;
  easing?: string;
}

export interface AnimationTemplate {
  profile: AnimationProfile;
  nodeGraph?: NodeBasedAnimation[];
  timeline?: TimelineKeyframe[];
  deviceOptimizations: Record<string, DeviceOptimization>;
  previewSettings: {
    showGrid: boolean;
    showDebugInfo: boolean;
    realTimeUpdates: boolean;
  };
}