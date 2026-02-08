// Animation Lab - Professional Animation System for Slot Games
// Main exports for the Animation Lab module

// Core systems
export { AnimationEngine } from './core/AnimationEngine';
export { AssetManager } from './core/AssetManager';
export { UIController } from './core/UIController';

// Components
export { default as AnimationLab } from './AnimationLab';
export { default as CanvasWorkspace } from './components/CanvasWorkspace';
export { default as FileUploadSystem } from './components/FileUploadSystem';

// Types and interfaces
export type { AssetMetadata, SpriteSheetData } from './core/AssetManager';
export type { ViewportState, InteractionState } from './core/UIController';

// Version info
export const ANIMATION_LAB_VERSION = '1.0.0-alpha';
export const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const DEFAULT_CANVAS_SIZE = { width: 800, height: 600 };