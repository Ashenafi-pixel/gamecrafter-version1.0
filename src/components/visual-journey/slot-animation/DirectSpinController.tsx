import React, { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Enhanced controller to trigger spins with maximum reliability
export const DirectSpinController = {
  isSpinning: false,
  lastSpinTime: 0,
  _spinCount: 0, // Track number of spins for debugging
  _debug: false, // Disable verbose logging
  _timestamp: () => new Date().toISOString().split('T')[1].replace('Z', ''),
  
  // Log with timestamp if debug is enabled
  _log: (message: string, ...args: any[]) => {
    if (DirectSpinController._debug) {
      console.log(`[${DirectSpinController._timestamp()}] 🎮 SPIN CONTROLLER: ${message}`, ...args);
    }
  },
  
  // Direct handlers that can be called from anywhere
  startSpin: () => {
    DirectSpinController._spinCount++;
    DirectSpinController._log(`Starting spin #${DirectSpinController._spinCount}`);
    
    // Update internal state
    DirectSpinController.isSpinning = true;
    DirectSpinController.lastSpinTime = Date.now();
    
    // MAXIMUM RELIABILITY: Use 3 different methods to broadcast the spin command
    
    // METHOD 1: Custom Event - primary communication channel
    try {
      const spinEventDetail = { 
        timestamp: DirectSpinController.lastSpinTime,
        spinId: DirectSpinController._spinCount
      };
      
      // Create and dispatch a custom event for spin start
      const spinEvent = new CustomEvent('directSpinStart', { 
        detail: spinEventDetail
      });
      document.dispatchEvent(spinEvent);
      DirectSpinController._log("Dispatched directSpinStart event", spinEventDetail);
    } catch (e) {
      console.error("Failed to dispatch custom event", e);
    }
    
    // METHOD 2: Global variables - backup communication channel
    try {
      // @ts-ignore
      window.__SLOT_MACHINE_SPINNING = true;
      // @ts-ignore
      window.__SPIN_TIMESTAMP = DirectSpinController.lastSpinTime;
      // @ts-ignore
      window.__SPIN_ID = DirectSpinController._spinCount;
      DirectSpinController._log("Set global variables");
    } catch (e) {
      console.error("Failed to set global variables", e);
    }
    
    // METHOD 3: DOM attributes - for component detection via query selectors
    try {
      // Find spin-related elements and update their data attributes
      const spinButtons = document.querySelectorAll('button[data-action="spin"], #main-spin-button, #internal-spin-btn');
      spinButtons.forEach(btn => {
        if (btn instanceof HTMLElement) {
          btn.setAttribute('data-spinning', 'true');
          btn.setAttribute('data-spin-id', DirectSpinController._spinCount.toString());
        }
      });
      
      // Also mark the document body for global state tracking
      document.body.setAttribute('data-slot-spinning', 'true');
      document.body.setAttribute('data-spin-timestamp', DirectSpinController.lastSpinTime.toString());
      DirectSpinController._log("Updated DOM attributes");
    } catch (e) {
      console.error("Failed to update DOM attributes", e);
    }
    
    // Audio feedback for user - critical for UX
    try {
      const audio = new Audio('/sounds/tick.mp3');
      audio.volume = 0.6; // Slightly louder
      audio.play().catch(e => console.log("Sound play error:", e));
    } catch (e) {
      console.error("Failed to play sound", e);
    }
    
    // Schedule safety cleanup
    setTimeout(() => {
      if (DirectSpinController.isSpinning) {
        DirectSpinController._log(`Safety check: Spin #${DirectSpinController._spinCount} still active after 5s`);
      }
    }, 5000);
    
    return {
      success: true,
      spinId: DirectSpinController._spinCount,
      timestamp: DirectSpinController.lastSpinTime
    };
  },
  
  stopSpin: () => {
    DirectSpinController._log(`Stopping spin #${DirectSpinController._spinCount}`);
    DirectSpinController.isSpinning = false;
    
    // METHOD 1: Custom Event
    try {
      // Create and dispatch a custom event for spin stop
      const spinEvent = new CustomEvent('directSpinStop', { 
        detail: { 
          timestamp: Date.now(),
          spinId: DirectSpinController._spinCount
        } 
      });
      document.dispatchEvent(spinEvent);
      DirectSpinController._log("Dispatched directSpinStop event");
    } catch (e) {
      console.error("Failed to dispatch stop event", e);
    }
    
    // METHOD 2: Global variables
    try {
      // @ts-ignore
      window.__SLOT_MACHINE_SPINNING = false;
      DirectSpinController._log("Cleared global variables");
    } catch (e) {
      console.error("Failed to clear global variables", e);
    }
    
    // METHOD 3: DOM attributes
    try {
      // Find spin-related elements and update their data attributes
      const spinButtons = document.querySelectorAll('button[data-action="spin"], #main-spin-button, #internal-spin-btn');
      spinButtons.forEach(btn => {
        if (btn instanceof HTMLElement) {
          btn.setAttribute('data-spinning', 'false');
        }
      });
      
      // Also update the document body
      document.body.setAttribute('data-slot-spinning', 'false');
      DirectSpinController._log("Updated DOM attributes for spin stop");
    } catch (e) {
      console.error("Failed to update DOM attributes for stop", e);
    }
    
    return {
      success: true,
      spinId: DirectSpinController._spinCount
    };
  },
  
  // Helper to check if spinning is in progress
  isActive: () => {
    return DirectSpinController.isSpinning;
  },
  
  // Force reset everything (emergency use only)
  reset: () => {
    DirectSpinController._log("Emergency reset triggered");
    DirectSpinController.isSpinning = false;
    
    // Clear everything
    try {
      // @ts-ignore
      window.__SLOT_MACHINE_SPINNING = false;
      document.body.removeAttribute('data-slot-spinning');
      
      // Dispatch stop event
      document.dispatchEvent(new CustomEvent('directSpinStop', { 
        detail: { timestamp: Date.now(), emergency: true } 
      }));
    } catch (e) {
      console.error("Error during emergency reset", e);
    }
    
    return true;
  }
};

// Hook to connect to the direct controller
export function useDirectSpin(onSpinStart?: () => void, onSpinStop?: () => void) {
  const [isSpinning, setIsSpinning] = useState(DirectSpinController.isSpinning);
  const lastSpinTimeRef = useRef(DirectSpinController.lastSpinTime);
  
  // Listen for direct spin events
  useEffect(() => {
    const handleSpinStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("Received directSpinStart event", customEvent.detail);
      
      // Only process if it's a new spin
      if (customEvent.detail.timestamp > lastSpinTimeRef.current) {
        lastSpinTimeRef.current = customEvent.detail.timestamp;
        setIsSpinning(true);
        if (onSpinStart) onSpinStart();
      }
    };
    
    const handleSpinStop = () => {
      console.log("Received directSpinStop event");
      setIsSpinning(false);
      if (onSpinStop) onSpinStop();
    };
    
    // Also check global vars on regular intervals
    const intervalCheck = setInterval(() => {
      try {
        // @ts-ignore
        if (window.__SLOT_MACHINE_SPINNING === true) {
          // @ts-ignore
          const timestamp = window.__SPIN_TIMESTAMP || 0;
          if (timestamp > lastSpinTimeRef.current && !isSpinning) {
            console.log("Global spin detected", timestamp);
            lastSpinTimeRef.current = timestamp;
            setIsSpinning(true);
            if (onSpinStart) onSpinStart();
          }
        }
      } catch (e) {
        // Ignore errors checking window vars
      }
    }, 100);
    
    // Register event listeners
    document.addEventListener('directSpinStart', handleSpinStart);
    document.addEventListener('directSpinStop', handleSpinStop);
    
    // Cleanup
    return () => {
      document.removeEventListener('directSpinStart', handleSpinStart);
      document.removeEventListener('directSpinStop', handleSpinStop);
      clearInterval(intervalCheck);
    };
  }, [isSpinning, onSpinStart, onSpinStop]);
  
  return { isSpinning };
}