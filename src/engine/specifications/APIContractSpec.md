# SlotAI API Contract Specification

## Overview
This document defines the API contracts between the SlotAI Game Engine and the Remote Game Server (RGS), as well as internal engine APIs.

## API Endpoints

### 1. Game Configuration API

#### Create Game
```typescript
POST /api/games
Request:
{
  "name": string,
  "theme": string,
  "config": GameConfig
}

Response:
{
  "gameId": string,
  "status": "created",
  "timestamp": ISO8601
}
```

#### Update Game Configuration
```typescript
PUT /api/games/{gameId}/config
Request:
{
  "config": Partial<GameConfig>
}

Response:
{
  "gameId": string,
  "status": "updated",
  "version": number
}
```

#### Get Game Configuration
```typescript
GET /api/games/{gameId}/config

Response:
{
  "gameId": string,
  "config": GameConfig,
  "version": number,
  "lastModified": ISO8601
}
```

### 2. Asset Management API

#### Upload Symbol
```typescript
POST /api/games/{gameId}/symbols
Request: multipart/form-data
{
  "symbolType": "wild" | "scatter" | "high" | "medium" | "low",
  "symbolId": string,
  "image": File
}

Response:
{
  "symbolId": string,
  "url": string,
  "type": string
}
```

#### Generate Symbols (AI)
```typescript
POST /api/games/{gameId}/symbols/generate
Request:
{
  "theme": string,
  "count": number,
  "types": string[],
  "style": string,
  "prompt": string
}

Response:
{
  "symbols": [
    {
      "id": string,
      "type": string,
      "url": string,
      "metadata": object
    }
  ],
  "generationId": string
}
```

#### Upload Background/Frame
```typescript
POST /api/games/{gameId}/assets
Request: multipart/form-data
{
  "assetType": "background" | "frame" | "ui",
  "file": File
}

Response:
{
  "assetId": string,
  "url": string,
  "type": string
}
```

### 3. RGS Integration API

#### Initialize Game Session
```typescript
POST /api/rgs/sessions
Request:
{
  "gameId": string,
  "playerId": string,
  "mode": "real" | "demo",
  "currency": string
}

Response:
{
  "sessionId": string,
  "balance": number,
  "config": {
    "minBet": number,
    "maxBet": number,
    "defaultBet": number,
    "availableLines": number[]
  }
}
```

#### Request Spin
```typescript
POST /api/rgs/sessions/{sessionId}/spin
Request:
{
  "bet": number,
  "lines": number,
  "features": string[]
}

Response:
{
  "spinId": string,
  "result": {
    "reels": number[][],  // Symbol IDs per position
    "wins": [
      {
        "type": "line" | "scatter" | "bonus",
        "lineId": number,
        "symbols": number[],
        "multiplier": number,
        "amount": number
      }
    ],
    "totalWin": number,
    "balance": number,
    "triggeredFeatures": string[]
  }
}
```

#### Get Reel Strips
```typescript
GET /api/rgs/games/{gameId}/reelstrips

Response:
{
  "reelStrips": [
    {
      "reelIndex": number,
      "symbols": number[],
      "weights": number[]
    }
  ],
  "version": string
}
```

#### Update Math Model
```typescript
PUT /api/rgs/games/{gameId}/math
Request:
{
  "rtp": number,
  "volatility": "low" | "medium" | "high",
  "hitFrequency": number,
  "payouts": [
    {
      "symbolCombination": number[],
      "payout": number
    }
  ],
  "reelStrips": ReelStrip[]
}

Response:
{
  "status": "updated",
  "validation": {
    "actualRTP": number,
    "valid": boolean,
    "warnings": string[]
  }
}
```

### 4. Simulation API

#### Run Simulation
```typescript
POST /api/rgs/games/{gameId}/simulate
Request:
{
  "rounds": number,
  "betLevel": number,
  "lines": number,
  "fastMode": boolean
}

Response:
{
  "simulationId": string,
  "status": "running" | "completed",
  "progress": number,
  "estimatedTime": number
}
```

#### Get Simulation Results
```typescript
GET /api/rgs/simulations/{simulationId}

Response:
{
  "simulationId": string,
  "status": "completed",
  "results": {
    "totalSpins": number,
    "totalWagered": number,
    "totalWon": number,
    "actualRTP": number,
    "hitFrequency": number,
    "biggestWin": number,
    "featureHits": {
      [featureId: string]: number
    },
    "symbolDistribution": {
      [symbolId: string]: number
    },
    "winDistribution": [
      {
        "range": string,
        "count": number,
        "percentage": number
      }
    ]
  }
}
```

### 5. WebSocket Events

#### Client → Server Events
```typescript
// Connection
{
  "event": "connect",
  "data": {
    "sessionId": string,
    "gameId": string
  }
}

// Spin Request
{
  "event": "spin",
  "data": {
    "bet": number,
    "lines": number
  }
}

// Feature Trigger
{
  "event": "feature:trigger",
  "data": {
    "featureId": string,
    "selection": any
  }
}

// State Sync
{
  "event": "state:sync",
  "data": {
    "clientState": GameState
  }
}
```

#### Server → Client Events
```typescript
// Spin Result
{
  "event": "spin:result",
  "data": SpinResult
}

// Balance Update
{
  "event": "balance:update",
  "data": {
    "balance": number,
    "change": number
  }
}

// Feature Triggered
{
  "event": "feature:triggered",
  "data": {
    "featureId": string,
    "config": FeatureConfig
  }
}

// Error
{
  "event": "error",
  "data": {
    "code": string,
    "message": string,
    "details": any
  }
}
```

## Internal Engine APIs

### 1. Renderer API
```typescript
interface IRendererAPI {
  // Initialization
  init(config: RendererConfig): Promise<void>;
  
  // Grid Management
  createGrid(cols: number, rows: number): void;
  destroyGrid(): void;
  updateGridSize(cols: number, rows: number): Promise<void>;
  
  // Symbol Management
  addSymbol(col: number, row: number, symbol: Symbol): void;
  removeSymbol(col: number, row: number): void;
  updateSymbol(col: number, row: number, symbol: Symbol): void;
  clearSymbols(): void;
  
  // Animation API
  animate(animationId: string, params: any): Promise<void>;
  stopAnimation(animationId: string): void;
  stopAllAnimations(): void;
  
  // Asset Loading
  loadTexture(id: string, url: string): Promise<PIXI.Texture>;
  loadSpine(id: string, url: string): Promise<any>;
  
  // Effects
  addEffect(effectId: string, config: EffectConfig): void;
  removeEffect(effectId: string): void;
  
  // Cleanup
  destroy(): void;
}
```

### 2. Audio Engine API
```typescript
interface IAudioEngineAPI {
  // Initialization
  init(config: AudioConfig): Promise<void>;
  
  // Sound Management
  loadSound(id: string, url: string): Promise<void>;
  playSound(id: string, options?: PlayOptions): void;
  stopSound(id: string): void;
  
  // Music Management
  loadMusic(id: string, url: string): Promise<void>;
  playMusic(id: string, loop?: boolean): void;
  stopMusic(): void;
  fadeMusic(duration: number): void;
  
  // Volume Control
  setMasterVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  
  // Mute Control
  mute(): void;
  unmute(): void;
  toggleMute(): void;
}
```

### 3. State Manager API
```typescript
interface IStateManagerAPI {
  // State Access
  getState(): GameState;
  getStateValue<T>(path: string): T;
  
  // State Updates
  setState(updates: Partial<GameState>): void;
  updateState(path: string, value: any): void;
  
  // State Transitions
  transition(from: State, to: State): Promise<void>;
  canTransition(from: State, to: State): boolean;
  
  // History
  undo(): void;
  redo(): void;
  clearHistory(): void;
  
  // Persistence
  save(): string;
  load(state: string): void;
  
  // Subscriptions
  subscribe(listener: StateListener): () => void;
  subscribeToPath(path: string, listener: StateListener): () => void;
}
```

### 4. Feature Manager API
```typescript
interface IFeatureManagerAPI {
  // Feature Registration
  registerFeature(id: string, feature: IFeature): void;
  unregisterFeature(id: string): void;
  
  // Feature Control
  enableFeature(id: string): void;
  disableFeature(id: string): void;
  isFeatureEnabled(id: string): boolean;
  
  // Feature Execution
  triggerFeature(id: string, params?: any): Promise<FeatureResult>;
  stopFeature(id: string): void;
  
  // Feature State
  getFeatureState(id: string): any;
  setFeatureState(id: string, state: any): void;
  
  // Feature Events
  onFeatureComplete(id: string, callback: Function): void;
  onFeatureError(id: string, callback: Function): void;
}
```

## Error Codes

### Client Errors (4xx)
```typescript
enum ClientErrorCode {
  INVALID_BET = "ERR_INVALID_BET",
  INSUFFICIENT_BALANCE = "ERR_INSUFFICIENT_BALANCE",
  INVALID_CONFIGURATION = "ERR_INVALID_CONFIG",
  SESSION_EXPIRED = "ERR_SESSION_EXPIRED",
  INVALID_GAME_STATE = "ERR_INVALID_STATE"
}
```

### Server Errors (5xx)
```typescript
enum ServerErrorCode {
  RGS_UNAVAILABLE = "ERR_RGS_UNAVAILABLE",
  INTERNAL_ERROR = "ERR_INTERNAL",
  DATABASE_ERROR = "ERR_DATABASE",
  CALCULATION_ERROR = "ERR_CALCULATION"
}
```

## Rate Limiting

### API Rate Limits
```typescript
interface RateLimits {
  // Spins
  spinsPerMinute: 60,
  spinsPerHour: 1000,
  
  // API Calls
  apiCallsPerMinute: 120,
  apiCallsPerHour: 3000,
  
  // Asset Uploads
  uploadsPerHour: 100,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  
  // Simulations
  simulationsPerDay: 10,
  maxSimulationRounds: 10000000
}
```

## Security

### Authentication
```typescript
// JWT Token Structure
interface AuthToken {
  sub: string;        // User ID
  gid: string;        // Game ID
  sid: string;        // Session ID
  iat: number;        // Issued at
  exp: number;        // Expiration
  scope: string[];    // Permissions
}
```

### Request Signing
```typescript
// HMAC Signature for sensitive operations
interface SignedRequest {
  data: any;
  timestamp: number;
  nonce: string;
  signature: string; // HMAC-SHA256(secret, data + timestamp + nonce)
}
```

## Versioning

### API Version Header
```
X-API-Version: 1.0.0
```

### Backward Compatibility
- Major version changes may break compatibility
- Minor version changes add functionality
- Patch version changes are bug fixes

### Deprecation Policy
- 6 month deprecation notice
- Deprecated endpoints return warning headers
- Migration guides provided