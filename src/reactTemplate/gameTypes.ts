export interface GameConfig {
  gameId?: string;
  name?: string;
  background?: string;
  logo?: string;
  frame?: string;
  symbols?: string[] | Record<string, string>;
  uiElements?: {
    menuButton?: string;
    spinButton?: string;
    autoplayButton?: string;
    soundButton?: string;
    settingsButton?: string;
    quickButton?: string;
  };
  loadingAssets?: {
    studioLogo?: {
      url: string | null;
      size: number;
      x: number;
      y: number;
    };
    loadingSprite?: {
      url: string | null;
      size: number;
      animation: string;
      position: string;
    };
    progressBar?: {
      x: number;
      y: number;
      width: number;
      display: string;
      color: string;
    };
    customMessage?: {
      text: string;
      x: number;
      y: number;
      size: number;
    };
    percentagePosition?: string;
  };
  [key: string]: any;
  crash?: {
    growthRate: number;
    houseEdge: number;
    minMultiplier: number;
    maxMultiplier: number;
    visuals: {
      lineColor: string;
      gridColor: string;
      textColor: string;
      objectType: 'rocket' | 'plane' | 'dot' | 'comet';
    };
  };
}

export const typesofGames = () =>
  `// Game Configuration Types
export interface GameConfig {
  name: string;
  background: string;
  logo: string;
  frame: string;
  studioLogo: string;
  loadingSprite: string;
  derivedBackgrounds: {
    freespin: string;
    night: string;
    day: string;
    bonus: string;
  };
  numberImages: Record<string, string>;
  bonusNumberImages: Record<string, string>;
  symbols: string[];
  symbolTypes: string[];
  extendedSymbols: Record<string, string>;
  uiElements: Record<string, string>;
  reels: number;
  rows: number;
  payMechanism: string;
  betlines: number;
  betlinePatterns: number[][];
  symbolPaytable: Record<string, Record<string, number>>;
  initialBalance: number;
  minBet: number;
  maxBet: number;
  defaultBet: number;
  loadingAssets: LoadingAssets;
  loadingExperience: LoadingExperience;
  animation: AnimationConfig;
  masks: MaskConfig;
  winAnimationType: string;
  bonus: BonusConfig;
}

export interface LoadingAssets {
  studioLogo: { x: number; y: number; size: number };
  loadingSprite: { position: string; animation: string; size: number };
  progressBar: { x: number; y: number; width: number; display: string; color: string };
  customMessage: { text: string; x: number; y: number; size: number };
  percentagePosition: string;
}

export interface LoadingExperience {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  customMessage: string;
  showPercentage: boolean;
  percentagePosition: string;
  studioLogoSize: number;
  spriteSize: number;
  progressBarWidth: number;
  progressStyle: string;
}

export interface AnimationConfig {
  speed: number;
  blurIntensity: number;
  easing: string;
  visualEffects: {
    spinBlur: boolean;
    glowEffects: boolean;
    screenShake: boolean;
  };
}

export interface MaskConfig {
  enabled: boolean;
  debugVisible: boolean;
  perReelEnabled: boolean[];
}

export interface BonusConfig {
  freeSpins: FreeSpinsConfig;
  pickAndClick: PickAndClickConfig;
  wheel: WheelConfig;
  holdAndSpin: HoldAndSpinConfig;
}

export interface FreeSpinsConfig {
  enabled: boolean;
  count: number;
  triggers: number[];
  multipliers: number[];
  retriggers: boolean;
  scatterSymbolsRequired: number;
}

export interface PickAndClickConfig {
  enabled: boolean;
  gridSize: [number, number];
  picks: number;
  maxPrize: number;
  extraPicks: boolean;
  multipliers: boolean;
}

export interface WheelConfig {
  enabled: boolean;
  segments: number;
  maxMultiplier: number;
  levelUp: boolean;
  respin: boolean;
  bonusSymbolsRequired: number;
}

export interface HoldAndSpinConfig {
  enabled: boolean;
  gridSize: [number, number];
  initialRespins: number;
  maxSymbolValue: number;
  resetRespins: boolean;
  collectAll: boolean;
}

// Modal Types
export type TabType = 'account' | 'history' | 'help' | 'logout';

export interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export interface GridCell {
  type: 'prize' | 'extraPick' | 'multiplier';
  value: number;
  revealed: boolean;
}

// Safe color constants
export const SAFE_COLORS = {
  gold: '#FFD700',
  blue: '#4A90E2',
  green: '#5CB85C',
  red: '#D9534F',
  purple: '#9C27B0',
  orange: '#FF6B35'
} as const;

export type SafeColor = keyof typeof SAFE_COLORS;
export type ThemeType = 'normal' | 'day' | 'night';
`
export const typeofGame = () => `
// Game Configuration Types
export interface GameConfig {
  name: string;
  gameId?: string;
  background: string;
  logo: string;
  frame: string;
  studioLogo: string;
  loadingSprite: string;
  derivedBackgrounds: {
    freespin: string;
    night: string;
    day: string;
    bonus: string;
  };
  numberImages: Record<string, string>;
  bonusNumberImages: Record<string, string>;
  symbols: string[];
  symbolTypes: string[];
  extendedSymbols: Record<string, string>;
  uiElements: Record<string, string>;
  reels: number;
  rows: number;
  payMechanism: string;
  betlines: number;
  betlinePatterns: number[][];
  symbolPaytable: Record<SymbolType, Record<string, number>>;
  initialBalance: number;
  minBet: number;
  maxBet: number;
  defaultBet: number;
  loadingAssets: LoadingAssets;
  loadingExperience: LoadingExperience;
  animation: AnimationConfig;
  masks: MaskConfig;
  winAnimationType: string;
  bonus: BonusConfig;
  crash?: CrashConfig;
}

export interface CrashConfig {
  growthRate: number;
  houseEdge: number;
  minMultiplier: number;
  maxMultiplier: number;
  visuals: {
    lineColor: string;
    gridColor: string;
    textColor: string;
    objectType: 'rocket' | 'plane' | 'dot' | 'comet';
    background?: any;
  };
}

export interface LoadingAssets {
  studioLogo: { x: number; y: number; size: number };
  loadingSprite: { position: LoadingSpritePosition; animation: LoadingSpriteAnimation; size: number };
  progressBar: { x: number; y: number; width: number; display: ProgressBarDisplay; color: string };
  customMessage: { text: string; x: number; y: number; size: number };
  percentagePosition: PercentagePosition;
}

export interface LoadingExperience {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  customMessage: string;
  showPercentage: boolean;
  percentagePosition: PercentagePosition;
  studioLogoSize: number;
  spriteSize: number;
  progressBarWidth: number;
  progressStyle: ProgressStyle;
}

export interface AnimationConfig {
  speed: number;
  blurIntensity: number;
  easing: EasingType;
  visualEffects: {
    spinBlur: boolean;
    glowEffects: boolean;
    screenShake: boolean;
  };
}

export interface MaskConfig {
  enabled: boolean;
  debugVisible: boolean;
  perReelEnabled: boolean[];
}

export interface BonusConfig {
  freeSpins: FreeSpinsConfig;
  pickAndClick: PickAndClickConfig;
  wheel: WheelConfig;
  holdAndSpin: HoldAndSpinConfig;
}

export interface FreeSpinsConfig {
  enabled: boolean;
  count: number;
  triggers: number[];
  multipliers: number[];
  retriggers: boolean;
  scatterSymbolsRequired: number;
}

export interface PickAndClickConfig {
  enabled: boolean;
  gridSize: [number, number];
  picks: number;
  maxPrize: number;
  extraPicks: boolean;
  multipliers: boolean;
}

export interface WheelConfig {
  enabled: boolean;
  segments: number;
  maxMultiplier: number;
  levelUp: boolean;
  respin: boolean;
  bonusSymbolsRequired: number;
}

export interface HoldAndSpinConfig {
  enabled: boolean;
  gridSize: [number, number];
  initialRespins: number;
  maxSymbolValue: number;
  resetRespins: boolean;
  collectAll: boolean;
}

// Modal Types
export type TabType = 'account' | 'history' | 'help' | 'logout';

export interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export interface GridCell {
  type: 'prize' | 'extraPick' | 'multiplier';
  value: number;
  revealed: boolean;
}

// Safe color constants
export const SAFE_COLORS = {
  gold: '#FFD700',
  blue: '#4A90E2',
  green: '#5CB85C',
  red: '#D9534F',
  purple: '#9C27B0',
  orange: '#FF6B35'
} as const;

export type SafeColor = keyof typeof SAFE_COLORS;

// Theme Types
export type ThemeType = 'normal' | 'day' | 'night';

// Symbol and Game Types
export type SymbolType = 'wild' | 'high1' | 'high2' | 'high3' | 'medium1' | 'medium2' | 'low1' | 'low2' | 'scatter' | 'bonus' | 'holdspin';
export type PayMechanism = 'betlines' | 'ways' | 'cluster';
export type WinAnimationType = 'squares' | 'lines' | 'both' | 'none';
export type EasingType = 'back.out' | 'bounce.out' | 'elastic.out' | 'power2.out' | 'power1.inOut' | 'none';

// UI Element Types
export type UIElementKey = 'menuButton' | 'spinButton' | 'autoplayButton' | 'soundButton' | 'settingsButton' | 'quickButton';

// Loading Types
export type LoadingSpritePosition = 'in-bar' | 'above-bar' | 'below-bar' | 'center';
export type LoadingSpriteAnimation = 'roll' | 'spin' | 'bounce' | 'pulse';
export type ProgressBarDisplay = 'bar' | 'circular';
export type ProgressStyle = 'bar' | 'circular';
export type PercentagePosition = 'above' | 'below' | 'center' | 'right';

// Game State Types
export interface GameState {
  balance: number;
  bet: number;
  isSpinning: boolean;
  isWinAnimationPlaying: boolean;
  winAmount: number;
  displayedWinAmount: number;
  isAutoPlay: boolean;
  autoSpinCount: number;
  freeSpinsRemaining: number;
  isInFreeSpinMode: boolean;
  isInHoldSpinMode: boolean;
  holdSpinSpinsRemaining: number;
}

// Animation Settings Types
export interface AnimationSettings {
  speed: number;
  blurIntensity: number;
  easing: EasingType;
}

// Win Detail Types
export interface WinDetail {
  line: number;
  symbols: string[];
  positions: Position[];
  count: number;
  symbol: SymbolType;
  amount: number;
  pattern: number[];
  color: number;
}

export interface Position {
  reel: number;
  row: number;
}

// Locked Symbol Types
export interface LockedSymbol extends Position {
  value?: number;
}

// Hold Spin State Types
export interface HoldSpinState {
  lockedSymbols: LockedSymbol[];
  spinsRemaining: number;
  isActive: boolean;
}

// Wheel Prize Types
export interface WheelPrize {
  type: 'prize' | 'levelup' | 'respin';
  value: number;
}

// Event Types
export interface WinCalculatedEvent {
  winDetails: WinDetail[];
  finalWin: number;
  animationType: string;
}

export interface AnimationSettingsChangedEvent {
  settings: Partial<AnimationSettings>;
}

export interface SlotSpinEvent {
  source: string;
}

export interface LoadingScreenProps {
  progress: number;
  message: string;
  config: GameConfig;
}

export interface InfoPageProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export interface PickAndClickModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onWin: (amount: number) => void;
}

// Utility Function Types
export interface GameInitialization {
  simulateLoadingPhases: (
    setLoadingMessage: (message: string) => void,
    setLoadingProgress: (progress: number) => void,
    isMounted: boolean
  ) => Promise<void>;
  createPixiApp: () => PixiApplication;
  collectAssets: (config: GameConfig) => string[];
  loadAssets: (
    assetsToLoad: string[],
    setLoadingProgress: (progress: number) => void,
    isMounted: boolean
  ) => Promise<Map<string, PixiTexture>>;
}

export interface AutoPlaySystem {
  stopAutoPlay: (
    setIsAutoPlay: (value: boolean) => void,
    setAutoSpinCount: (value: number) => void,
    autoSpinTimeoutRef: React.MutableRefObject<number | null>
  ) => void;
  startAutoPlay: (
    spins: number,
    isSpinning: boolean,
    isAutoPlay: boolean,
    setIsAutoPlay: (value: boolean) => void,
    setAutoSpinCount: (value: number) => void,
    handleSpin: () => void
  ) => void;
  handleAutoPlay: (
    isAutoPlay: boolean,
    stopAutoPlayFn: () => void,
    setShowAutoPlaySettings: (value: boolean) => void
  ) => void;
}

export interface SoundSystem {
  handleClickOutside: (
    event: MouseEvent,
    soundControlRef: React.RefObject<HTMLDivElement>,
    setShowSoundBar: (value: boolean) => void
  ) => void;
  toggleSoundBar: (
    showSoundBar: boolean,
    setShowSoundBar: (value: boolean) => void
  ) => void;
  updateVolume: (
    value: string,
    setSoundVolume: (value: number) => void
  ) => void;
}

// React import for types
import React from 'react';

// PIXI.js related types (basic definitions)
export interface PixiApplication {
  screen: { width: number; height: number };
  stage: PixiContainer;
  view: HTMLCanvasElement;
  destroyed: boolean;
  destroy(removeView?: boolean): void;
}

export interface PixiContainer {
  addChild(child: PixiDisplayObject): PixiDisplayObject;
  removeChild(child: PixiDisplayObject): PixiDisplayObject;
  children: PixiDisplayObject[];
}

export interface PixiDisplayObject {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  visible: boolean;
  parent: PixiContainer | null;
  destroy(): void;
}

export interface PixiTexture {
  width: number;
  height: number;
}

// Window extensions for game functions
export interface WindowWithGameFunctions extends Window {
  updateGameBackground?: (backgroundUrl: string) => void;
  performSpin?: () => void;
  triggerWheelBonus?: () => void;
  triggerPickAndClickBonus?: () => void;
  triggerHoldSpinBonus?: (positions: Array<{reel: number, row: number}>) => void;
  performHoldSpinRespin?: () => void;
  performHoldSpinSpin?: () => void;
  clearExtendedWildSymbols?: () => void;
}
`