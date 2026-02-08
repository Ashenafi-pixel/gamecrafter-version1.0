// Main engine export
export { GameEngine } from './GameEngine';

// Core exports
export { StateManager } from './core/StateManager';
export * from './core/interfaces';

// Manager exports
export { AnimationManager } from './managers/AnimationManager';
export { AudioManager } from './managers/AudioManager';
export { AssetManager } from './managers/AssetManager';

// Renderer exports
export { Renderer } from './rendering/Renderer';

// RGS exports
export { RGSClient } from './rgs/RGSClient';

// Re-export key types for convenience
export type {
  IGameEngine,
  GameConfig,
  GameState,
  SpinRequest,
  SpinResponse,
  EngineState,
  Symbol,
  Position,
  WinLine,
  AssetDefinition,
  AnimationType,
  SoundType
} from './core/interfaces';