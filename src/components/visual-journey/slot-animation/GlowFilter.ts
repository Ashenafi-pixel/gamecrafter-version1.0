// Import our GlowFilter implementation
import GlowFilter from './filters/GlowFilter';
import * as PIXI from 'pixi.js';

// Function to register the GlowFilter to PIXI.filters namespace
// This will be called when PIXI is properly initialized
export function registerGlowFilter() {
  if (PIXI.filters && !('GlowFilter' in PIXI.filters)) {
    (PIXI.filters as any).GlowFilter = GlowFilter;
  }
}

export default GlowFilter;