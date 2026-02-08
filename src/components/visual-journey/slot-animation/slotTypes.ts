import * as PIXI from 'pixi.js';

// Define interface for extracted symbols to pass between components
export interface ExtractedSymbol {
  texture: PIXI.Texture;
  rowIndex: number;
  colIndex: number;
  isBonus?: boolean;
  name?: string;
  animationData?: {
    scale?: number;
    rotation?: number;
    alpha?: number;
  } | null;
}

// Add other shared types here as needed