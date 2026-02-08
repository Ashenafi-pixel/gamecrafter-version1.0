# SlotAI Game Engine Specification

## Overview
The SlotAI Game Engine is the core runtime that handles all game logic, rendering, and state management for slot games created through the SlotAI platform.

## Architecture Principles

### 1. Single Source of Truth
- One engine instance per game
- Centralized state management
- No duplicate rendering logic

### 2. Separation of Concerns
- **Engine**: Handles rendering, animations, and immediate game logic
- **RGS (Remote Game Server)**: Handles math, RTP, win evaluation, and regulatory requirements
- **Configuration**: Defines game parameters and assets

### 3. Lifecycle Management
```
INITIALIZE → CONFIGURE → READY → SPIN → EVALUATE → DISPLAY → READY
                           ↑                                    ↓
                           ←────────────────────────────────────
```

## Core Components

### 1. SlotEngine (Main Controller)
```typescript
class SlotEngine implements ISlotEngine {
  private state: GameState;
  private renderer: IRenderer;
  private assetManager: IAssetManager;
  private animationManager: IAnimationManager;
  private audioManager: IAudioManager;
  private configValidator: IConfigValidator;
  
  constructor(container: HTMLElement, config?: GameConfig);
  
  // Lifecycle methods
  async initialize(config: GameConfig): Promise<void>;
  async destroy(): void;
  
  // Game control
  async spin(): Promise<SpinResult>;
  async stop(stopPositions?: number[]): Promise<void>;
  async showWin(winData: WinResult): Promise<void>;
  
  // Configuration
  async updateConfig(partial: Partial<GameConfig>): Promise<void>;
  getConfig(): GameConfig;
  
  // State management
  getState(): GameState;
  setState(state: Partial<GameState>): void;
  
  // Events
  on(event: GameEvent, handler: EventHandler): void;
  off(event: GameEvent, handler: EventHandler): void;
}
```

### 2. Renderer (PIXI.js Abstraction)
```typescript
interface IRenderer {
  initialize(container: HTMLElement, config: RenderConfig): Promise<void>;
  
  // Grid management
  createGrid(cols: number, rows: number): void;
  updateGridSize(cols: number, rows: number): Promise<void>;
  
  // Symbol management
  setSymbols(symbols: Symbol[][]): Promise<void>;
  updateSymbol(col: number, row: number, symbol: Symbol): Promise<void>;
  
  // Animation triggers
  spinReel(reelIndex: number, duration: number): Promise<void>;
  stopReel(reelIndex: number, stopPosition: number, duration: number): Promise<void>;
  highlightWin(positions: Position[]): Promise<void>;
  
  // Asset management
  loadAssets(assets: GameAssets): Promise<void>;
  updateBackground(url: string): Promise<void>;
  updateFrame(url: string, config: FrameConfig): Promise<void>;
  
  // Cleanup
  destroy(): void;
}
```

### 3. Asset Manager
```typescript
interface IAssetManager {
  // Asset loading
  loadTheme(themeName: string): Promise<ThemeAssets>;
  loadSymbols(symbols: SymbolConfig[]): Promise<SymbolAssets>;
  loadAudio(audioConfig: AudioConfig): Promise<AudioAssets>;
  loadUI(uiConfig: UIConfig): Promise<UIAssets>;
  
  // Asset retrieval
  getSymbolTexture(symbolId: string): PIXI.Texture;
  getAudioBuffer(soundId: string): AudioBuffer;
  getUIElement(elementId: string): UIAsset;
  
  // Caching
  preloadAssets(manifest: AssetManifest): Promise<void>;
  clearCache(): void;
}
```

### 4. Animation Manager
```typescript
interface IAnimationManager {
  // Reel animations
  spinAnimation(config: SpinAnimationConfig): Promise<void>;
  stopAnimation(config: StopAnimationConfig): Promise<void>;
  
  // Win animations
  symbolWinAnimation(symbols: WinSymbol[]): Promise<void>;
  paylineAnimation(payline: Payline): Promise<void>;
  bigWinAnimation(amount: number): Promise<void>;
  
  // Transition animations
  sceneTransition(from: Scene, to: Scene): Promise<void>;
  
  // Configuration
  setAnimationSpeed(speed: number): void;
  setQuality(quality: 'low' | 'medium' | 'high'): void;
}
```

### 5. Audio Manager
```typescript
interface IAudioManager {
  // Playback control
  play(soundId: string, options?: PlayOptions): Promise<void>;
  stop(soundId: string): void;
  stopAll(): void;
  
  // Volume control
  setMasterVolume(volume: number): void;
  setSoundVolume(soundId: string, volume: number): void;
  
  // Music management
  playBackgroundMusic(trackId: string, loop: boolean): void;
  fadeMusic(duration: number): Promise<void>;
  
  // Sound categories
  muteSounds(): void;
  muteMusic(): void;
  unmuteAll(): void;
}
```

## State Management

### GameState Structure
```typescript
interface GameState {
  // Configuration
  config: GameConfig;
  
  // Runtime state
  status: 'idle' | 'spinning' | 'stopping' | 'evaluating' | 'showing_win';
  
  // Grid state
  currentSymbols: Symbol[][];
  reelPositions: number[];
  
  // Spin state
  isSpinning: boolean;
  currentSpinId: string;
  
  // Win state
  lastWin: WinResult | null;
  totalWin: number;
  
  // Player state
  balance: number;
  currentBet: number;
  
  // Feature state
  freeSpinsRemaining: number;
  currentMultiplier: number;
  activeFeatures: string[];
}
```

### State Transitions
```
IDLE → SPIN_START → SPINNING → STOPPING → EVALUATING → WIN_DISPLAY → IDLE
                                    ↓
                                NO_WIN → IDLE
```

## Configuration Schema

### GameConfig Structure
```typescript
interface GameConfig {
  // Basic settings
  id: string;
  name: string;
  theme: ThemeConfig;
  
  // Grid configuration
  grid: {
    reels: number;
    rows: number;
    symbolSize: number;
    symbolPadding: number;
  };
  
  // Symbols
  symbols: SymbolConfig[];
  
  // Paylines or ways
  winEvaluation: {
    type: 'paylines' | 'ways' | 'cluster';
    paylines?: Payline[];
    minClusterSize?: number;
  };
  
  // Features
  features: FeatureConfig[];
  
  // Math model (from RGS)
  math: {
    rtp: number;
    volatility: 'low' | 'medium' | 'high';
    hitFrequency: number;
    maxWin: number;
  };
  
  // Audio configuration
  audio: AudioConfig;
  
  // Animation settings
  animations: AnimationConfig;
  
  // UI configuration
  ui: UIConfig;
}
```

## Integration Points

### 1. Platform Integration
- Configuration updates from the SlotAI platform steps
- Real-time preview updates
- Asset hot-reloading during development

### 2. RGS Integration
```typescript
interface IRGSClient {
  // Spin request
  requestSpin(bet: number, lines: number): Promise<SpinResult>;
  
  // Feature triggers
  triggerFeature(featureId: string): Promise<FeatureResult>;
  
  // State sync
  getGameState(): Promise<RGSGameState>;
  updateGameState(state: Partial<RGSGameState>): Promise<void>;
}
```

### 3. External Events
```typescript
enum GameEvent {
  // State events
  STATE_CHANGED = 'state:changed',
  
  // Spin events
  SPIN_START = 'spin:start',
  SPIN_COMPLETE = 'spin:complete',
  
  // Win events
  WIN_SHOWN = 'win:shown',
  BIG_WIN = 'win:big',
  
  // Error events
  ERROR = 'error',
  
  // User events
  USER_ACTION = 'user:action'
}
```

## Performance Requirements

### Target Metrics
- 60 FPS during normal gameplay
- 30 FPS minimum during complex animations
- < 100ms response time for user actions
- < 2 second initial load time
- < 50MB memory footprint

### Optimization Strategies
1. Object pooling for symbols
2. Texture atlasing for assets
3. LOD (Level of Detail) for animations
4. Lazy loading of features
5. WebGL batch rendering

## Error Handling

### Error Categories
1. **Configuration Errors**: Invalid game configuration
2. **Asset Errors**: Missing or failed asset loads
3. **Runtime Errors**: Animation or state failures
4. **Network Errors**: RGS communication issues

### Recovery Strategies
```typescript
interface IErrorRecovery {
  onConfigError(error: ConfigError): GameConfig;
  onAssetError(error: AssetError): FallbackAsset;
  onRuntimeError(error: RuntimeError): void;
  onNetworkError(error: NetworkError): void;
}
```

## Testing Requirements

### Unit Tests
- State machine transitions
- Win evaluation logic
- Configuration validation

### Integration Tests
- Platform → Engine communication
- Engine → RGS communication
- Asset loading pipeline

### Performance Tests
- Frame rate under load
- Memory usage over time
- Asset loading times

## Future Considerations

### Planned Features
1. Portrait/Landscape responsive switching
2. Multi-language support
3. Replay system
4. Demo mode
5. Tournament mode support

### Extensibility Points
1. Custom animation plugins
2. Third-party asset providers
3. Alternative renderers (Canvas2D fallback)
4. Custom feature modules