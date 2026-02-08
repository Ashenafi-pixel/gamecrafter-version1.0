/**
 * Memory Optimization Module for SlotAI
 * 
 * This module provides functions to detect and fix memory leaks
 * and optimize performance to prevent browser crashes.
 */

// Global performance monitoring
let memoryWarningIssued = false;
let lastMemoryUsage = 0;
let renderCount = 0;
const MAX_RENDER_COUNT = 100; // Maximum renders before forced GC recommendation
const MEMORY_GROWTH_THRESHOLD = 10000000; // 10MB growth between checks is suspicious

/**
 * Monitors memory usage and detects potential leaks
 * Automatically throttles animations when memory pressure is high
 */
export function startMemoryMonitoring() {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return;
  
  // Only run in development mode to avoid performance impact in production
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('🔍 Starting memory leak detection');
  
  // Check memory usage every 5 seconds
  const memoryInterval = setInterval(() => {
    if (typeof performance.memory !== 'undefined') {
      const currentMemory = performance.memory.usedJSHeapSize;
      const memoryDiff = currentMemory - lastMemoryUsage;
      
      // Check for suspicious memory growth
      if (memoryDiff > MEMORY_GROWTH_THRESHOLD && !memoryWarningIssued) {
        console.warn(`⚠️ Memory usage growing rapidly: +${(memoryDiff / 1000000).toFixed(2)}MB`);
        console.warn('🧹 Auto-triggering garbage collection to prevent crash');
        
        // Automatically trigger cleanup
        forceGarbageCollection();
        memoryWarningIssued = true;
        
        // Throttle animations automatically
        if (window.PIXI_ANIMATIONS_ACTIVE) {
          throttleAnimations();
        }
        
        // Reset warning after cleanup
        setTimeout(() => {
          memoryWarningIssued = false;
        }, 30000); // Reset after 30 seconds
      }
      
      lastMemoryUsage = currentMemory;
    }
  }, 5000);
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(memoryInterval);
    forceGarbageCollection();
  });
}

/**
 * Tracks component renders to detect infinite render loops
 * @param {string} componentName - Name of the component being rendered
 */
export function trackRender(componentName) {
  renderCount++;
  
  if (renderCount > MAX_RENDER_COUNT) {
    console.error(`⚠️ Excessive rendering detected: ${renderCount} renders`);
    console.error(`🔍 Component ${componentName} may be in an infinite render loop`);
    // Reset counter to avoid console spam
    renderCount = 0;
  }
}

/**
 * Forces a garbage collection recommendation and cleans up PIXI resources
 */
export function forceGarbageCollection() {
  console.log('🧹 Attempting to clean up memory...');
  
  // Clean up PIXI resources if available
  if (window.PIXI) {
    try {
      // Force PIXI texture clear
      PIXI.utils.clearTextureCache();
      console.log('🧹 PIXI texture cache cleared');
      
      // Reset animation state
      if (window.PIXI_ANIMATION_TICKER) {
        window.PIXI_ANIMATION_TICKER.stop();
        window.PIXI_ANIMATION_TICKER = null;
        console.log('🧹 PIXI animation ticker stopped');
      }
    } catch (e) {
      console.error('Error cleaning PIXI resources:', e);
    }
  }
  
  // Clear any excess state objects
  try {
    // Recommend garbage collection
    if (window.gc) {
      window.gc();
      console.log('🧹 Manual garbage collection called');
    } else {
      console.log('🧹 To force garbage collection, run Chrome with --js-flags="--expose-gc"');
      console.log('🧹 Fallback: assigning large objects to null');
      
      // Create memory pressure to trigger GC
      let largeObj = new Array(10000000).fill(0);
      largeObj = null;
    }
  } catch (e) {
    console.error('Error during manual garbage collection:', e);
  }
  
  memoryWarningIssued = false;
}

/**
 * Throttles animations to reduce memory and CPU usage
 */
export function throttleAnimations() {
  console.log('🐢 Throttling animations to reduce memory pressure');
  
  if (window.PIXI_ANIMATION_TICKER) {
    try {
      // Reduce frame rate
      window.PIXI_ANIMATION_TICKER.maxFPS = 30;
      console.log('🐢 PIXI animations throttled to 30fps');
    } catch (e) {
      console.error('Error throttling PIXI animations:', e);
    }
  }
  
  // Throttle any requestAnimationFrame based animations
  if (!window._originalRAF) {
    window._originalRAF = window.requestAnimationFrame;
    let lastRAFTime = 0;
    
    window.requestAnimationFrame = (callback) => {
      const currentTime = Date.now();
      if (currentTime - lastRAFTime < 33) { // ~30fps
        return setTimeout(() => callback(currentTime), 33);
      }
      
      lastRAFTime = currentTime;
      return window._originalRAF(callback);
    };
    
    console.log('🐢 RequestAnimationFrame throttled to ~30fps');
  }
}

/**
 * Restores normal animation performance
 */
export function restoreAnimations() {
  // Restore requestAnimationFrame if it was throttled
  if (window._originalRAF) {
    window.requestAnimationFrame = window._originalRAF;
    window._originalRAF = null;
    console.log('⚡ RequestAnimationFrame restored to full speed');
  }
  
  // Restore PIXI ticker if throttled
  if (window.PIXI_ANIMATION_TICKER) {
    try {
      window.PIXI_ANIMATION_TICKER.maxFPS = 60;
      console.log('⚡ PIXI animations restored to 60fps');
    } catch (e) {
      console.error('Error restoring PIXI animations:', e);
    }
  }
}

/**
 * Hook to safely use PIXI.js in React components
 * @param {Function} setup - Function to set up PIXI application
 * @param {Function} cleanup - Function to clean up PIXI resources
 */
export function useSafePIXI(setup, cleanup) {
  const pixiAppRef = React.useRef(null);
  
  React.useEffect(() => {
    if (typeof setup === 'function') {
      pixiAppRef.current = setup();
      
      // Register the app with window for emergency cleanup
      if (!window.PIXI_APPS) {
        window.PIXI_APPS = [];
      }
      window.PIXI_APPS.push(pixiAppRef.current);
    }
    
    // Cleanup function
    return () => {
      // Call custom cleanup if provided
      if (typeof cleanup === 'function') {
        cleanup(pixiAppRef.current);
      }
      
      // Always destroy the app to prevent memory leaks
      if (pixiAppRef.current) {
        try {
          // Remove from global registry
          if (window.PIXI_APPS) {
            const index = window.PIXI_APPS.indexOf(pixiAppRef.current);
            if (index !== -1) {
              window.PIXI_APPS.splice(index, 1);
            }
          }
          
          // Destroy the app
          pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiAppRef.current = null;
          
          // Suggest garbage collection
          setTimeout(forceGarbageCollection, 1000);
        } catch (e) {
          console.error('Error destroying PIXI application:', e);
        }
      }
    };
  }, []);
  
  return pixiAppRef;
}

// Start monitoring when this module is imported
startMemoryMonitoring();