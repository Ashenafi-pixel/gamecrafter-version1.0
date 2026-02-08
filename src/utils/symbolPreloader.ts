import * as PIXI from 'pixi.js';
import { PREDEFINED_SYMBOLS } from './predefinedSymbols';
import { useGameStore } from '../store';

class SymbolPreloader {
  private static cache = new Map<string, PIXI.Texture>();
  private static loadingPromises = new Map<string, Promise<PIXI.Texture>>();
  private static isInitialized = false;
  private static storeUnsubscribe: (() => void) | null = null;

  // Initialize at app start - loads predefined symbols
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    
    // 1. Load predefined symbols (static - bundled by Vite)
    await this.loadPredefinedSymbols();
    
    // 2. Load any existing generated symbols from store
    await this.loadGeneratedSymbols();
    
    // 3. Watch for store changes (uploads, generation, preset switches)
    this.watchStoreChanges();
    
    this.isInitialized = true;
  }

  // Load predefined symbols (static - from predefinedSymbols.ts)
  private static async loadPredefinedSymbols(): Promise<void> {
    const symbolsToLoad = Object.entries(PREDEFINED_SYMBOLS);
    
    const loadPromises = symbolsToLoad.map(async ([key, url]) => {
      try {
        const texture = await PIXI.Assets.load(url);
        this.cache.set(key, texture);
        this.cache.set(url, texture); // Also cache by URL
      } catch (error) {
        console.warn(`⚠️ Failed to preload predefined ${key}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
  }

  // Load generated symbols from store (dynamic)
  private static async loadGeneratedSymbols(): Promise<void> {
    const store = useGameStore.getState();
    const generated = store.config?.theme?.generated?.symbols;
    
    if (!generated) return;
    
    const symbolsToLoad: Array<{key: string, url: string}> = [];
    
    // Handle both array and object formats
    if (Array.isArray(generated)) {
      generated.forEach((url, index) => {
        if (url && url !== '') {
          symbolsToLoad.push({ key: `generated_${index}`, url });
        }
      });
    } else if (typeof generated === 'object') {
      Object.entries(generated).forEach(([key, url]) => {
        if (url && url !== '') {
          symbolsToLoad.push({ key: `generated_${key}`, url: url as string });
        }
      });
    }
    
    // Load all in parallel
    const loadPromises = symbolsToLoad.map(async ({ key, url }) => {
      // Skip if already loading
      if (this.loadingPromises.has(url)) {
        return this.loadingPromises.get(url)!;
      }
      
      // Skip if already cached
      if (this.cache.has(url)) {
        return this.cache.get(url)!;
      }
      
      // Start loading
      const promise = this.loadSingleSymbol(key, url);
      this.loadingPromises.set(url, promise);
      
      try {
        const texture = await promise;
        this.loadingPromises.delete(url);
        return texture;
      } catch (error) {
        this.loadingPromises.delete(url);
        throw error;
      }
    });
    
    await Promise.all(loadPromises);
  }

  // Load a single symbol (handles base64, URLs, etc.)
  private static async loadSingleSymbol(key: string, url: string): Promise<PIXI.Texture> {
    try {
      let texture: PIXI.Texture;
      
      // Handle base64 data URLs
      if (url.startsWith('data:')) {
        texture = PIXI.Texture.from(url);
        // Wait for base texture to be ready
        if (!texture.baseTexture.valid) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
            texture.baseTexture.once('loaded', () => {
              clearTimeout(timeout);
              resolve(true);
            });
            texture.baseTexture.once('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
        }
      } else {
        // Regular URL
        texture = await PIXI.Assets.load(url);
      }
      
      // Cache it
      this.cache.set(key, texture);
      this.cache.set(url, texture);
      
      return texture;
    } catch (error) {
      console.warn(`⚠️ Failed to load symbol ${key}:`, error);
      throw error;
    }
  }

  // Watch for store changes (uploads, generation, preset switches)
  private static watchStoreChanges(): void {
    let previousSymbols: any = null;
    
    // Subscribe to store changes using Zustand's subscribe
    this.storeUnsubscribe = useGameStore.subscribe((state) => {
      const currentSymbols = state.config?.theme?.generated?.symbols;
      
      // Check if symbols actually changed
      const symbolsChanged = JSON.stringify(currentSymbols) !== JSON.stringify(previousSymbols);
      
      if (symbolsChanged && previousSymbols !== null) {
        // Symbols changed, reload them
        this.loadGeneratedSymbols().catch(console.error);
      }
      
      previousSymbols = currentSymbols ? JSON.parse(JSON.stringify(currentSymbols)) : null;
    });
  }

  // Get texture (instant - from cache)
  static getTexture(keyOrUrl: string): PIXI.Texture | null {
    return this.cache.get(keyOrUrl) || null;
  }

  // Wait for a specific symbol to load (useful for newly uploaded/generated)
  static async waitForSymbol(url: string, timeout = 5000): Promise<PIXI.Texture | null> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(url)) {
      try {
        return await this.loadingPromises.get(url)!;
      } catch {
        return null;
      }
    }
    
    // Start loading
    const key = `dynamic_${Date.now()}`;
    const promise = this.loadSingleSymbol(key, url);
    this.loadingPromises.set(url, promise);
    
    try {
      const texture = await Promise.race([
        promise,
        new Promise<PIXI.Texture>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      this.loadingPromises.delete(url);
      return texture;
    } catch (error) {
      this.loadingPromises.delete(url);
      return null;
    }
  }

  // Wait for initialization
  static async waitForReady(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Clear cache (useful for preset switches)
  static clearGeneratedSymbols(): void {
    // Only clear generated symbols, keep predefined
    const keysToRemove: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith('generated_') || key.startsWith('dynamic_')) {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  // Cleanup
  static destroy(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    this.cache.clear();
    this.loadingPromises.clear();
    this.isInitialized = false;
  }
}

export default SymbolPreloader;

