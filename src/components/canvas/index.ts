/**
 * Canvas Module
 * 
 * This module exports all components related to the interactive game canvas system.
 */

export { default as InteractiveGameCanvas } from './InteractiveGameCanvas';
export { default as PropertyPanel } from './PropertyPanel';
export { default as GameCanvasContainer } from './GameCanvasContainer';

// Common types used across canvas components
export type CanvasMode = 'edit' | 'play' | 'test' | 'debug';
export type LayerType = 'background' | 'frame' | 'symbols' | 'ui' | 'effects';
export type ElementType = 'background' | 'frame' | 'symbol' | 'button' | 'text' | 'particle';
export type PanelPosition = 'left' | 'right';

export interface CanvasElement {
  id: string;
  type: ElementType;
  layer: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  selected: boolean;
  data: any; // Additional properties specific to element type
}

export interface CanvasCamera {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}