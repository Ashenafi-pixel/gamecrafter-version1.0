import { SpriteElement } from "../utils/professionalSpriteAtlas";
import { SpriteAnimation } from "../utils/simpleAnimationEngine";
import type { SymbolSpineAsset } from "../types";

export interface SymbolConfig {
  id: string;
  name: string;
  symbolType: 'block' | 'contour';
  contentType: 'symbol-only' | 'symbol-wild' | 'symbol-scatter' | 'text-only' | 'custom-text';

  size: '1x1' | '1x3' | '2x2' | '3x3' | '4x4';
  prompt: string;
  animationComplexity: 'simple' | 'medium' | 'complex';
  imageUrl?: string | undefined;
  /** When set, this symbol is displayed as Spine (animated) instead of image. */
  spineAsset?: SymbolSpineAsset;
  src?:string ;
  templateExtracted?:any;
  spriteElements?: SpriteElement[];
  animations?: SpriteAnimation[];
  atlasResult?: any;
  individualizedLetters?: any[];
  layoutTemplate?: 'text-top' | 'text-bottom' | 'text-overlay';
  animationTemplate?: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave';
  retryCount?: number; // Track retry attempts for missing letters
  visionAnalysis?: any; // Store GPT Vision results
  isVisionProcessed?: boolean; // Flag for GPT Vision processing
  isUniversalProcessed?: boolean; // Flag for universal detection
  letterSprites?: any[]; // Store individual letter sprites
  lastRefresh?: number; // Force dependency refresh
  // New preset system properties
  gameSymbolType?: 'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4' | 'bonus' | 'jackpot';
  importance?: number; // 1-5 scale
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  defaultDescription?: string;
}

export interface PresetConfig {
  name: string;
  description: string;
  recommendedFor: string;
  estimatedRTP: string;
  suggestedFeatures: string[];
  symbols: Array<{ 
    type: 'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4' | 'bonus' | 'jackpot'; 
    count: number;
    importance: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}