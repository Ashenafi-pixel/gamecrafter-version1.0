/**
 * Core interfaces for the SlotAI Game Engine
 * These interfaces define the contracts between different engine components
 */

import * as PIXI from 'pixi.js';

// ============================================
// Core Engine Interfaces
// ============================================

export interface IGameEngine {
  // Lifecycle
  initialize(config: GameConfig): Promise<void>;
  destroy(): void;

  // Game Control
  spin(): Promise<SpinResult>;
  stop(stopPositions?: number[]): Promise<void>;
  showWin(winData: WinResult): Promise<void>;

  // Configuration
  updateConfig(partial: Partial<GameConfig>): Promise<void>;
  getConfig(): GameConfig;
  validateConfig(config: GameConfig): ValidationResult;

  // State Management
  getState(): GameState;
  setState(state: Partial<GameState>): void;

  // Events
  on(event: GameEvent, handler: EventHandler): void;
  off(event: GameEvent, handler: EventHandler): void;
  emit(event: GameEvent, data?: any): void;
}

export interface IRenderer {
  // Initialization
  initialize(config: RendererConfig): Promise<void>;
  destroy(): void;

  // Grid Management
  createGrid(cols: number, rows: number): void;
  updateGridSize(cols: number, rows: number): Promise<void>;
  clearGrid(): void;

  // Symbol Management
  setSymbols(symbols: Symbol[][]): Promise<void>;
  updateSymbol(col: number, row: number, symbol: Symbol): Promise<void>;

  // Animation Triggers
  spinReel(reelIndex: number, duration: number): Promise<void>;
  stopReel(reelIndex: number, stopPosition: number, duration: number): Promise<void>;
  highlightWin(positions: Position[], type: WinType): Promise<void>;

  // Asset Management
  loadAssets(assets: GameAssets): Promise<void>;
  updateBackground(url: string): Promise<void>;
  updateFrame(url: string, config: FrameConfig): Promise<void>;

  // Screen Management
  resize(width: number, height: number): void;
  setQuality(quality: RenderQuality): void;
}

export interface IAssetManager {
  // Asset Loading
  loadTheme(themeName: string): Promise<ThemeAssets>;
  loadSymbols(symbols: SymbolConfig[]): Promise<SymbolAssets>;
  loadAudio(audioConfig: AudioConfig): Promise<AudioAssets>;
  loadUI(uiConfig: UIConfig): Promise<UIAssets>;

  // Asset Retrieval
  getSymbolTexture(symbolId: string): PIXI.Texture | null;
  getAudioBuffer(soundId: string): AudioBuffer | null;
  getUIElement(elementId: string): UIAsset | null;

  // Caching
  preloadAssets(manifest: AssetManifest): Promise<void>;
  clearCache(): void;
  getCacheSize(): number;
}

export interface IAnimationManager {
  // Reel Animations
  spinAnimation(config: SpinAnimationConfig): Promise<void>;
  stopAnimation(config: StopAnimationConfig): Promise<void>;

  // Win Animations
  symbolWinAnimation(symbols: WinSymbol[]): Promise<void>;
  paylineAnimation(payline: Payline): Promise<void>;
  bigWinAnimation(amount: number, multiplier: number): Promise<void>;

  // Transition Animations
  sceneTransition(from: Scene, to: Scene): Promise<void>;

  // Configuration
  setAnimationSpeed(speed: number): void;
  setQuality(quality: AnimationQuality): void;

  // Control
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
}

export interface IAudioManager {
  // Initialization
  initialize(): Promise<void>;
  destroy(): void;

  // Playback Control
  play(soundId: string, options?: PlayOptions): Promise<void>;
  stop(soundId: string): void;
  stopAll(): void;

  // Volume Control
  setMasterVolume(volume: number): void;
  setSoundVolume(soundId: string, volume: number): void;

  // Music Management
  playBackgroundMusic(trackId: string, loop: boolean): void;
  stopBackgroundMusic(): void;
  fadeMusic(duration: number): Promise<void>;

  // Sound Categories
  muteSounds(): void;
  muteMusic(): void;
  unmuteAll(): void;
  isMuted(): boolean;
}

export interface IStateManager {
  // State Access
  getState(): GameState;
  getStateValue<T>(path: string): T;

  // State Updates
  setState(updates: Partial<GameState>): void;
  updateState(path: string, value: any): void;

  // State Transitions
  transition(to: GameStatus): Promise<void>;
  canTransition(to: GameStatus): boolean;

  // Subscriptions
  subscribe(listener: StateListener): () => void;
  subscribeToPath(path: string, listener: StateListener): () => void;
}

export interface IRGSClient {
  // Session Management
  createSession(gameId: string, playerId: string): Promise<Session>;
  destroySession(sessionId: string): Promise<void>;

  // Spin Requests
  requestSpin(bet: number, lines: number): Promise<SpinResult>;

  // Feature Triggers
  triggerFeature(featureId: string, params?: any): Promise<FeatureResult>;

  // State Sync
  getGameState(): Promise<RGSGameState>;
  updateGameState(state: Partial<RGSGameState>): Promise<void>;

  // Math Model
  getMathModel(): Promise<MathModel>;
  validateMathModel(model: MathModel): Promise<ValidationResult>;
}

// ============================================
// Configuration Types
// ============================================

export interface GameConfig {
  // Metadata
  id: string;
  name: string;
  version: string;

  // Theme
  theme: ThemeConfig;

  // Grid
  grid: GridConfig;

  // Symbols
  symbols: SymbolConfig[];

  // Win Evaluation
  winEvaluation: WinEvaluationConfig;

  // Features
  features: FeatureConfig[];

  // Math
  math: MathConfig;

  // Audio
  audio: AudioConfig;

  // Animations
  animations: AnimationConfig;

  // UI
  ui: UIConfig;
}

export interface ThemeConfig {
  name: string;
  style: string;
  colors: ColorPalette;
  assets: ThemeAssets;
}

export interface GridConfig {
  reels: number;
  rows: number;
  symbolSize: number;
  symbolPadding: number;
  layout: 'standard' | 'hexagonal' | 'scattered';
  betlines?: number;
}

export interface SymbolConfig {
  id: string;
  name: string;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low' | 'bonus';
  url: string;
  payout: PayoutConfig;
  animation?: AnimationConfig;
}

export interface WinEvaluationConfig {
  type: 'paylines' | 'ways' | 'cluster' | 'scatter';
  paylines?: Payline[];
  minClusterSize?: number;
  scatterMinCount?: number;
  ways?: boolean; // Ensure 'ways' property exists if type is 'ways' or generically
}

export interface FeatureConfig {
  id: string;
  type: 'freespins' | 'pick' | 'wheel' | 'respin' | 'multiplier';
  trigger: TriggerConfig;
  config: any; // Feature-specific configuration
}

export interface MathConfig {
  rtp: number;
  volatility: 'low' | 'medium' | 'high' | 'very-high';
  hitFrequency: number;
  maxWin: number;
  minBet: number;
  maxBet: number;
}

// ============================================
// State Types
// ============================================

export interface GameState {
  // Configuration
  config: GameConfig;

  // Runtime State
  status: GameStatus;

  // Grid State
  currentSymbols: Symbol[][];
  reelPositions: number[];

  // Spin State
  isSpinning: boolean;
  currentSpinId: string | null;

  // Win State
  lastWin: WinResult | null;
  totalWin: number;
  consecutiveWins: number;

  // Player State
  balance: number;
  currentBet: number;

  // Feature State
  activeFeatures: ActiveFeature[];
  freeSpinsRemaining: number;
  currentMultiplier: number;
}

export type GameStatus =
  | 'initializing'
  | 'ready'
  | 'spinning'
  | 'stopping'
  | 'evaluating'
  | 'showing_win'
  | 'feature_active'
  | 'error';

export type EngineState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'spinning'
  | 'updating'
  | 'destroying'
  | 'destroyed'
  | 'error';

// ============================================
// Result Types
// ============================================

export interface SpinResult {
  spinId: string;
  reels: number[][];
  wins: WinResult[];
  totalWin: number;
  balance: number;
  triggeredFeatures: string[];
}

export interface WinResult {
  type: WinType;
  paylineId?: number;
  symbols: WinSymbol[];
  multiplier: number;
  amount: number;
}

export interface WinSymbol {
  symbolId: string;
  position: Position;
}

export interface Position {
  reel: number;
  row: number;
}

export type WinType = 'line' | 'scatter' | 'cluster' | 'bonus' | 'jackpot';

// ============================================
// Animation Types
// ============================================

export interface SpinAnimationConfig {
  duration: number;
  acceleration: number;
  deceleration: number;
  blur: boolean;
  sound: boolean;
}

export interface StopAnimationConfig {
  reelDelays: number[];
  bounceEffect: boolean;
  anticipation: boolean;
}

export interface AnimationConfig { // Added missing AnimationConfig
  idle?: any;
  win?: any;
}

export interface AnimationQuality {
  fps: number;
  particles: boolean;
  shadows: boolean;
  blur: boolean;
}

// ============================================
// Audio Types
// ============================================

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  delay?: number;
  fade?: number;
}

export interface AudioConfig { // Added AudioConfig
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface UIConfig { // Added UIConfig
  theme: string;
  scale: number;
}

export interface AudioAssets {
  sounds: Map<string, AudioBuffer>;
  music: Map<string, AudioBuffer>;
}

// ============================================
// Event Types
// ============================================

export type GameEvent =
  | 'initialized'
  | 'state:changed'
  | 'spin:start'
  | 'spin:complete'
  | 'reel:start'
  | 'reel:stop'
  | 'win:evaluate'
  | 'win:show'
  | 'feature:triggered'
  | 'balance:updated'
  | 'error';

export type EventHandler = (data?: any) => void;

export type StateListener = (state: GameState, previousState: GameState) => void;

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================
// Asset Types
// ============================================

export interface AssetManifest {
  symbols: AssetEntry[];
  backgrounds: AssetEntry[];
  frames: AssetEntry[];
  ui: AssetEntry[];
  audio: AssetEntry[];
}

export interface AssetEntry {
  id: string;
  url: string;
  type: string;
  preload: boolean;
}

export interface ThemeAssets {
  background: string;
  frame: string;
  symbols: Map<string, string>;
  ui: UIAssets;
}

export interface SymbolAssets {
  textures: Map<string, PIXI.Texture>;
  animations: Map<string, any>;
}

export interface UIAssets {
  buttons: Map<string, string>;
  panels: Map<string, string>;
  fonts: Map<string, string>;
}

export interface UIAsset {
  id: string;
  type: string;
  url: string;
  loaded: boolean;
}

// ============================================
// Renderer Types
// ============================================

export interface RendererConfig {
  width: number;
  height: number;
  quality: RenderQuality;
  antialias: boolean;
  backgroundColor: number;
}

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface FrameConfig {
  scale: number;
  position: { x: number; y: number };
  stretch: { x: number; y: number };
}

// ============================================
// RGS Types
// ============================================

export interface Session {
  sessionId: string;
  gameId: string;
  playerId: string;
  balance: number;
  currency: string;
}

export interface RGSGameState {
  balance: number;
  totalWin: number;
  freeSpins: number;
  features: ActiveFeature[];
}

export interface ActiveFeature {
  id: string;
  type: string;
  remaining: number;
  data: any;
}

export interface MathModel {
  rtp: number;
  volatility: string;
  reelStrips: ReelStrip[];
  payouts: Payout[];
}

export interface ReelStrip {
  reelIndex: number;
  symbols: string[];
  weights: number[];
}

export interface Payout {
  symbols: string[];
  multiplier: number;
}

export interface FeatureResult {
  featureId: string;
  wins: WinResult[];
  retriggered: boolean;
  data: any;
}

// ============================================
// Utility Types
// ============================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Scene {
  id: string;
  name: string;
  assets: string[];
}

export interface Payline {
  id: number;
  positions: Position[];
}

export interface PayoutConfig {
  count: number;
  multiplier: number;
}

export interface TriggerConfig {
  type: 'symbol' | 'combination' | 'random';
  probability?: number;
  symbols?: string[];
  count?: number;
}

// ============================================
// Runtime Types (Added for completeness)
// ============================================

export interface Symbol {
  id: string;
  url: string;
  type: 'wild' | 'scatter' | 'high' | 'medium' | 'low' | 'bonus';
}

export interface GameAssets {
  symbols: Symbol[];
  background?: string;
  frame?: string;
  ui?: any;
}