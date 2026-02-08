# SlotAI Data Flow Specification

## Overview
This document describes how data flows through the SlotAI platform, from user configuration through to game execution.

## Data Flow Layers

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Configuration  │ ──► │   Game Engine   │ ──► │       RGS       │
│     Layer       │     │     Layer       │     │     Layer       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UI Platform   │     │   Renderer      │     │   Math Engine   │
│   (React/Redux) │     │   (PIXI.js)     │     │   (Game Logic)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Step-by-Step Data Flow

### Step 1: Theme Selection
```typescript
// User Action
SelectTheme('ancient-egypt')
         ↓
// Redux Action
dispatch(setTheme({ name: 'ancient-egypt', ... }))
         ↓
// State Update
state.gameConfig.theme = { name: 'ancient-egypt', ... }
         ↓
// Side Effect
updatePromptTemplates(theme) // For AI generation
```

### Step 2: Game Type Selection
```typescript
// User Action
SelectGameType('classic-reels')
         ↓
// Redux Action
dispatch(setGameType({ type: 'classic-reels', ... }))
         ↓
// State Update
state.gameConfig.gameType = 'classic-reels'
         ↓
// Side Effect
loadGameTypeDefaults(gameType)
```

### Step 3: Grid Configuration
```typescript
// User Action
ConfigureGrid({ reels: 5, rows: 3, paylines: 20 })
         ↓
// Redux Action
dispatch(updateGrid({ reels: 5, rows: 3 }))
dispatch(setPaylines(20))
         ↓
// Engine Update
gameEngine.updateGrid(5, 3)
         ↓
// Visual Update
renderer.rebuildGrid(5, 3)
         ↓
// RGS Notification
rgsClient.updateGameStructure({ reels: 5, rows: 3, paylines: 20 })
```

### Step 4: Symbol Configuration
```typescript
// User Action (Generate)
GenerateSymbols({ theme: 'ancient-egypt', count: 9 })
         ↓
// API Call
const symbols = await generateSymbolsAPI({ 
  theme: 'ancient-egypt',
  types: ['wild', 'scatter', 'high', 'medium', 'low']
})
         ↓
// Redux Update
dispatch(setSymbols(symbols))
         ↓
// Engine Update
gameEngine.loadSymbols(symbols)
         ↓
// Asset Loading
assetManager.preloadSymbols(symbols)
         ↓
// Renderer Update
renderer.updateSymbolTextures(symbols)
```

### Step 5: Visual Assets
```typescript
// User Action
ConfigureVisuals({
  background: backgroundUrl,
  frame: frameUrl,
  ui: uiConfig,
  grid: { position: { x, y }, scale: 100 }
})
         ↓
// Redux Updates
dispatch(setBackground(backgroundUrl))
dispatch(setFrame(frameUrl))
dispatch(setUIConfig(uiConfig))
dispatch(setGridAdjustments({ position, scale }))
         ↓
// Engine Updates
gameEngine.updateVisuals({
  background: backgroundUrl,
  frame: frameUrl,
  ui: uiConfig
})
         ↓
// Renderer Updates
renderer.setBackground(backgroundUrl)
renderer.setFrame(frameUrl, frameConfig)
renderer.updateGridPosition(position, scale)
```

### Step 6: Audio Configuration
```typescript
// User Action
ConfigureAudio({
  spinSound: 'spin.mp3',
  stopSound: 'stop.mp3',
  winSound: 'win.mp3',
  backgroundMusic: 'theme.mp3'
})
         ↓
// Redux Update
dispatch(setAudioConfig(audioConfig))
         ↓
// Audio Manager Update
audioManager.loadSounds(audioConfig)
         ↓
// Preload Audio
audioManager.preloadAll()
```

### Step 7: Animation Configuration
```typescript
// User Action
ConfigureAnimations({
  spinSpeed: 1.5,
  stopDelay: 0.3,
  winAnimationType: 'burst',
  particleEffects: true
})
         ↓
// Redux Update
dispatch(setAnimationConfig(animationConfig))
         ↓
// Animation Manager Update
animationManager.updateConfig(animationConfig)
         ↓
// Renderer Settings
renderer.setAnimationQuality(quality)
```

### Step 8: Feature Configuration
```typescript
// User Action
ConfigureFeatures({
  freeSpins: { enabled: true, count: 10, multiplier: 3 },
  wilds: { expanding: true, sticky: false },
  bonus: { type: 'pick', enabled: true }
})
         ↓
// Redux Update
dispatch(setFeatures(features))
         ↓
// RGS Update
rgsClient.updateFeatures(features)
         ↓
// Engine Registration
gameEngine.registerFeatures(features)
```

### Step 9: Math Configuration
```typescript
// User Action
ConfigureMath({
  rtp: 96.5,
  volatility: 'medium',
  hitFrequency: 25,
  payouts: paytable
})
         ↓
// Redux Update
dispatch(setMathModel(mathConfig))
         ↓
// RGS Configuration
rgsClient.configureMath({
  rtp: 96.5,
  volatility: 'medium',
  reelStrips: generatedReelStrips,
  payouts: paytable
})
```

### Step 10: Simulation
```typescript
// User Action
RunSimulation({ spins: 1000000, betLevel: 1 })
         ↓
// Simulation Engine
const results = await simulationEngine.run({
  config: gameEngine.getConfig(),
  math: rgsClient.getMathModel(),
  spins: 1000000
})
         ↓
// Results Display
displaySimulationResults(results)
```

## Runtime Data Flow (Game Play)

### Spin Cycle
```typescript
// 1. User clicks spin
onSpinClick()
    ↓
// 2. Validate bet
if (!validateBet(currentBet, balance)) return
    ↓
// 3. Update balance
updateBalance(balance - currentBet)
    ↓
// 4. Request spin from RGS
const spinResult = await rgsClient.requestSpin({
  bet: currentBet,
  lines: activePaylines
})
    ↓
// 5. Start animations
gameEngine.startSpin()
    ↓
// 6. Play sound
audioManager.play('spin')
    ↓
// 7. Animate reels
animationManager.spinReels()
    ↓
// 8. Stop reels with results
gameEngine.stopReels(spinResult.stopPositions)
    ↓
// 9. Evaluate wins
const wins = evaluateWins(spinResult)
    ↓
// 10. Display wins
if (wins.length > 0) {
  gameEngine.showWins(wins)
  audioManager.play('win')
  updateBalance(balance + wins.totalAmount)
}
    ↓
// 11. Update state
gameEngine.setState('idle')
```

## State Synchronization

### Platform → Engine
```typescript
// Redux state changes trigger engine updates
store.subscribe(() => {
  const state = store.getState()
  const config = selectGameConfig(state)
  
  if (configChanged(config)) {
    gameEngine.updateConfig(config)
  }
})
```

### Engine → Platform
```typescript
// Engine events update Redux state
gameEngine.on('stateChanged', (engineState) => {
  dispatch(updateEngineState(engineState))
})

gameEngine.on('win', (winData) => {
  dispatch(addWin(winData))
  dispatch(updateBalance(winData.amount))
})
```

### Engine ↔ RGS
```typescript
// Bidirectional communication
class RGSBridge {
  // Engine → RGS
  async requestSpin(params) {
    return await rgsClient.spin(params)
  }
  
  // RGS → Engine
  onFeatureTriggered(callback) {
    rgsClient.on('feature', callback)
  }
  
  // State sync
  async syncState() {
    const rgsState = await rgsClient.getState()
    gameEngine.syncWithRGS(rgsState)
  }
}
```

## Data Models

### Configuration Data Model
```typescript
interface GameConfigData {
  // Metadata
  id: string;
  version: string;
  created: Date;
  modified: Date;
  
  // Step 1-2
  theme: ThemeData;
  gameType: GameTypeData;
  
  // Step 3
  grid: GridData;
  
  // Step 4
  symbols: SymbolData[];
  
  // Step 5
  visuals: VisualsData;
  
  // Step 6
  audio: AudioData;
  
  // Step 7
  animations: AnimationData;
  
  // Step 8
  features: FeatureData[];
  
  // Step 9
  math: MathData;
}
```

### Runtime Data Model
```typescript
interface RuntimeData {
  // Session
  sessionId: string;
  playerId: string;
  
  // Game state
  currentState: GameState;
  
  // Spin data
  lastSpin: SpinData;
  spinHistory: SpinData[];
  
  // Win data
  currentWins: WinData[];
  totalWinnings: number;
  
  // Feature state
  activeFeatures: ActiveFeature[];
  
  // Balance
  balance: number;
  currentBet: number;
}
```

### Communication Protocol
```typescript
// Engine → RGS Protocol
interface EngineToRGS {
  // Commands
  SPIN_REQUEST: { bet: number; lines: number };
  FEATURE_TRIGGER: { featureId: string };
  STATE_SYNC: { state: Partial<GameState> };
  
  // Queries
  GET_MATH_MODEL: {};
  GET_REEL_STRIPS: {};
  VALIDATE_CONFIG: { config: GameConfig };
}

// RGS → Engine Protocol
interface RGSToEngine {
  // Responses
  SPIN_RESULT: SpinResult;
  FEATURE_RESULT: FeatureResult;
  
  // Events
  BALANCE_UPDATE: { balance: number };
  FEATURE_TRIGGERED: { feature: Feature };
  ERROR: { code: string; message: string };
}
```

## Performance Considerations

### Data Optimization
1. **Lazy Loading**: Load assets only when needed
2. **Caching**: Cache frequently used data
3. **Compression**: Compress large assets
4. **Batching**: Batch multiple updates

### State Management
1. **Immutability**: Use immutable updates
2. **Memoization**: Cache computed values
3. **Debouncing**: Debounce rapid updates
4. **Selective Updates**: Update only changed parts

## Error Handling

### Data Validation
```typescript
// Validate at each layer
class DataValidator {
  validateConfig(config: GameConfig): ValidationResult
  validateSymbols(symbols: Symbol[]): ValidationResult
  validateSpinResult(result: SpinResult): ValidationResult
}
```

### Error Recovery
```typescript
// Graceful fallbacks
class ErrorRecovery {
  onInvalidConfig(): GameConfig // Return default
  onMissingAsset(): Asset // Return placeholder
  onRGSError(): SpinResult // Return cached result
}
```