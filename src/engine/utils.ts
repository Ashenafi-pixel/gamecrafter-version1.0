/**
 * utils.ts
 * 
 * Shared utility functions for the slot engine.
 * Provides common functionality for easing, delays, randomization,
 * and other helper functions used throughout the engine modules.
 */

/**
 * Easing function type definition
 */
export type EasingFunction = (t: number) => number;

/**
 * Position interface for grid-based operations
 */
export interface Position {
  reel: number;
  row: number;
}

/**
 * Range interface for numeric operations
 */
export interface Range {
  min: number;
  max: number;
}

// === RANDOMIZATION UTILITIES ===

/**
 * Select a random element from an array
 */
export function randomFromArray<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Select multiple random elements from an array without replacement
 */
export function randomFromArrayMultiple<T>(array: T[], count: number): T[] {
  if (count > array.length) {
    throw new Error('Cannot select more elements than array contains');
  }
  
  const shuffled = [...array];
  const result: T[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * shuffled.length);
    result.push(shuffled.splice(randomIndex, 1)[0]);
  }
  
  return result;
}

/**
 * Generate random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min (inclusive) and max (exclusive)
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random boolean with optional probability
 */
export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Weighted random selection from array of items with weights
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must have same length');
  }
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

// === ARRAY UTILITIES ===

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Create array of specified length filled with values
 */
export function createArray<T>(length: number, fillValue: T | ((index: number) => T)): T[] {
  return Array.from({ length }, (_, index) => 
    typeof fillValue === 'function' ? (fillValue as (index: number) => T)(index) : fillValue
  );
}

/**
 * Chunk array into smaller arrays of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Remove duplicates from array
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// === TIMING UTILITIES ===

/**
 * Create a promise that resolves after specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// === EASING UTILITIES ===

/**
 * Built-in easing functions
 */
export const easingFunctions: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  
  easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number) => Math.sqrt(1 - (t - 1) * (t - 1)),
  easeInOutCirc: (t: number) => {
    if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
    return (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
  },
  
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    if (t < 0.5) {
      return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
    }
    return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) {
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    }
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  
  easeInBounce: (t: number) => 1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t: number) => {
    if (t < 0.5) {
      return (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2;
    }
    return (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2;
  }
};

/**
 * Resolve easing function from name or return custom function
 */
export function resolveEasing(easing: string | EasingFunction): EasingFunction {
  if (typeof easing === 'function') {
    return easing;
  }
  
  // Handle CSS cubic-bezier format
  if (typeof easing === 'string' && easing.startsWith('cubic-bezier(')) {
    // For production use, you might want to implement cubic-bezier parsing
    // For now, fall back to a similar easing
    const match = easing.match(/cubic-bezier\(([\d.-]+),\s*([\d.-]+),\s*([\d.-]+),\s*([\d.-]+)\)/);
    if (match) {
      // Simple approximation - in production, use a proper cubic-bezier implementation
      return easingFunctions.easeInOutCubic;
    }
  }
  
  // Handle CSS ease keywords
  const cssEasingMap: Record<string, string> = {
    'ease': 'easeInOutCubic',
    'ease-in': 'easeInCubic',
    'ease-out': 'easeOutCubic',
    'ease-in-out': 'easeInOutCubic',
    'linear': 'linear'
  };
  
  const mappedEasing = cssEasingMap[easing] || easing;
  const easingFunc = easingFunctions[mappedEasing];
  
  if (!easingFunc) {
    console.warn(`Unknown easing function: ${easing}, falling back to linear`);
    return easingFunctions.linear;
  }
  
  return easingFunc;
}

// === MATH UTILITIES ===

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const t = (value - fromMin) / (fromMax - fromMin);
  return lerp(toMin, toMax, t);
}

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Check if value is within range (inclusive)
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// === VALIDATION UTILITIES ===

/**
 * Check if value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if position is valid for given grid dimensions
 */
export function isValidPosition(position: Position, reels: number, rows: number): boolean {
  return position.reel >= 0 && 
         position.reel < reels && 
         position.row >= 0 && 
         position.row < rows;
}

/**
 * Validate range object
 */
export function isValidRange(range: Range): boolean {
  return isValidNumber(range.min) && 
         isValidNumber(range.max) && 
         range.min <= range.max;
}

// === STRING UTILITIES ===

/**
 * Generate random string of specified length
 */
export function randomString(length: number, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// === OBJECT UTILITIES ===

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone((obj as any)[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Merge objects deeply
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 */
function isObject(item: any): item is object {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// === PERFORMANCE UTILITIES ===

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Request animation frame wrapper
 */
export function nextFrame(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

export default {
  // Randomization
  randomFromArray,
  randomFromArrayMultiple,
  randomInt,
  randomFloat,
  randomBoolean,
  weightedRandom,
  
  // Arrays
  shuffleArray,
  createArray,
  chunkArray,
  uniqueArray,
  
  // Timing
  delay,
  debounce,
  throttle,
  
  // Easing
  easingFunctions,
  resolveEasing,
  
  // Math
  clamp,
  lerp,
  mapRange,
  roundTo,
  inRange,
  
  // Validation
  isValidNumber,
  isValidPosition,
  isValidRange,
  
  // Strings
  randomString,
  generateUUID,
  
  // Objects
  deepClone,
  deepMerge,
  
  // Performance
  measureTime,
  nextFrame
};