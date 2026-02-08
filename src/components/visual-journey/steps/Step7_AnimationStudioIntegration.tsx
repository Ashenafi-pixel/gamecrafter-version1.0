import React, { useEffect, useRef } from 'react';
import { Step6_AnimationStudio } from './Step6_AnimationStudio';

// Extend window interface for PIXI instances
declare global {
  interface Window {
    PIXI_RENDERER_INSTANCE?: any;
    PIXI_GAME_ENGINE?: any;
    PIXI_APPS?: any[];
  }
}

interface MaskControls {
  enabled: boolean;
  debugVisible: boolean;
  perReelEnabled: boolean[];
}

interface AnimationControls {
  speed: number;
  blurIntensity: number;
  easing: string;
}

interface VisualEffects {
  spinBlur: boolean;
  glowEffects: boolean;
  screenShake: boolean;
}

interface Step6AnimationStudioIntegrationProps {
  // Access to the PixiJS renderer instance
  gameEngine?: any;
}

export const Step7_AnimationStudioIntegration: React.FC<Step6AnimationStudioIntegrationProps> = ({
  gameEngine
}) => {
  const rendererRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = React.useState({
    gameEngine: false,
    renderer: false
  });

  // Enhanced renderer detection with real-time status updates
  useEffect(() => {
    const checkForRenderer = () => {
      let foundRenderer = null;
      let foundEngine = null;

      // Method 1: Check passed gameEngine prop
      if (gameEngine?.renderer) {
        foundRenderer = gameEngine.renderer;
        foundEngine = gameEngine;
        console.log('🎨 Animation Studio connected via gameEngine prop');
      }
      // Method 2: Check global PIXI renderer instance
      else if (window.PIXI_RENDERER_INSTANCE) {
        foundRenderer = window.PIXI_RENDERER_INSTANCE;
        foundEngine = window.PIXI_GAME_ENGINE || foundRenderer;
        console.log('🎨 Animation Studio connected to global PixiJS renderer');
      }
      // Method 3: Check global PIXI apps
      else if (window.PIXI_APPS && window.PIXI_APPS.length > 0) {
        const app = window.PIXI_APPS[0];
        foundRenderer = app.renderer || app;
        foundEngine = app;
        console.log('🎨 Animation Studio connected to PIXI app renderer');
      }
      // Method 4: Try to find renderer by DOM elements
      else {
        const canvasElements = document.querySelectorAll('canvas');
        if (canvasElements.length === 0) {
          console.log(`🔍 Found ${canvasElements.length} canvas elements, checking for PIXI...`);
        }
        
        // Log what's available globally
        console.log('🔍 Available global objects:', {
          PIXI_RENDERER_INSTANCE: !!window.PIXI_RENDERER_INSTANCE,
          PIXI_GAME_ENGINE: !!(window as any).PIXI_GAME_ENGINE,
          PIXI_APPS: window.PIXI_APPS?.length || 0
        });
      }

      // Update renderer reference and status
      const rendererChanged = rendererRef.current !== foundRenderer;
      rendererRef.current = foundRenderer;
      
      const newStatus = {
        gameEngine: !!foundEngine,
        renderer: !!foundRenderer
      };
      
      // Only update state if status actually changed
      setConnectionStatus(prev => {
        if (prev.gameEngine !== newStatus.gameEngine || prev.renderer !== newStatus.renderer) {
          console.log('🔄 Connection status updated:', newStatus);
          
          // If renderer just became available, apply initial mask controls
          if (foundRenderer && !prev.renderer) {
            console.log('🎭 Renderer just connected - applying initial mask controls');
            
            // Multiple attempts with increasing delays to ensure renderer is ready
            const tryApplyMaskControls = (attempt: number = 1) => {
              if (rendererRef.current && typeof rendererRef.current.applyMaskControls === 'function') {
                console.log(`🎭 Applying initial mask controls (attempt ${attempt})`);
                rendererRef.current.applyMaskControls({
                  enabled: true,
                  debugVisible: false,
                  perReelEnabled: [true, true, true, true, true]
                });
              } else if (attempt < 5) {
                console.log(`⚠️ Mask controls not ready yet, retrying in ${attempt * 500}ms (attempt ${attempt + 1})`);
                setTimeout(() => tryApplyMaskControls(attempt + 1), attempt * 500);
              } else {
                console.error('❌ Failed to apply initial mask controls after 5 attempts');
              }
            };
            
            // Start with a small initial delay
            setTimeout(() => tryApplyMaskControls(), 200);
          }
          
          return newStatus;
        }
        return prev;
      });

      return !!foundRenderer;
    };

    // Check immediately
    checkForRenderer();

    // Listen for slot engine initialization events
    const handleEngineInitialized = (event: CustomEvent) => {
      console.log('🔄 Animation Studio received engine initialization event:', event.detail);
      checkForRenderer();
    };

    window.addEventListener('slotEngineInitialized', handleEngineInitialized as EventListener);

    // Check periodically every 3 seconds (less frequent to reduce console spam)
    const interval = setInterval(checkForRenderer, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('slotEngineInitialized', handleEngineInitialized as EventListener);
    };
  }, [gameEngine]);

  // Handle mask controls changes
  const handleMaskControlsChange = (controls: MaskControls) => {
    console.log('🎭 Mask controls changed:', controls);
    console.log('🔍 Current renderer:', rendererRef.current);
    console.log('🔍 Renderer methods:', rendererRef.current ? Object.getOwnPropertyNames(rendererRef.current) : 'No renderer');
    
    if (rendererRef.current) {
      if (typeof rendererRef.current.applyMaskControls === 'function') {
        console.log('✅ Calling applyMaskControls on renderer');
        rendererRef.current.applyMaskControls(controls);
      } else {
        console.warn('⚠️ Renderer exists but applyMaskControls method not found. Available methods:', 
          Object.getOwnPropertyNames(rendererRef.current).filter(name => typeof rendererRef.current[name] === 'function'));
      }
    } else {
      console.warn('⚠️ No renderer available for mask controls');
    }
  };

  // Handle animation controls changes  
  const handleAnimationControlsChange = (controls: AnimationControls) => {
    console.log('🎬 Animation controls changed:', controls);
    
    if (rendererRef.current) {
      if (typeof rendererRef.current.applyAnimationControls === 'function') {
        console.log('✅ Calling applyAnimationControls on renderer');
        rendererRef.current.applyAnimationControls(controls);
      } else {
        console.warn('⚠️ Renderer exists but applyAnimationControls method not found');
      }
    } else {
      console.warn('⚠️ No renderer available for animation controls');
    }
  };

  // Handle visual effects changes
  const handleVisualEffectsChange = (effects: VisualEffects) => {
    console.log('✨ Visual effects changed:', effects);
    
    if (rendererRef.current) {
      if (typeof rendererRef.current.applyVisualEffects === 'function') {
        console.log('✅ Calling applyVisualEffects on renderer');
        rendererRef.current.applyVisualEffects(effects);
      } else {
        console.warn('⚠️ Renderer exists but applyVisualEffects method not found');
      }
    } else {
      console.warn('⚠️ No renderer available for visual effects');
    }
  };

  return (
    <div className="min-h-screen bg-white p-">
      <div className="max-w-7xl mx-auto">
        
        {/* Animation Studio Interface */}
        <Step6_AnimationStudio
          onMaskControlsChange={handleMaskControlsChange}
          onAnimationControlsChange={handleAnimationControlsChange}
          onVisualEffectsChange={handleVisualEffectsChange}
        />

        {/* Status Display */}
        <div className="mt-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">🔧 Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                connectionStatus.gameEngine ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-gray-300">
                Game Engine: {connectionStatus.gameEngine ? 'Connected' : 'Not Available'}
              </span>
            </div>

            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                connectionStatus.renderer ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-gray-300">
                PixiJS Renderer: {connectionStatus.renderer ? 'Connected' : 'Not Available'}
              </span>
            </div>

            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-blue-400 animate-pulse"></div>
              <span className="text-gray-300">
                Real-time Updates: Active
              </span>
            </div>

          </div>
        </div>

        {/* Instructions */}
        {/* <div className="mt-6 bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 How to Use</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• <strong>Enable Masking:</strong> Turn masking on/off for all reels</li>
            <li>• <strong>Show Debug Outlines:</strong> See red rectangles showing mask boundaries</li>
            <li>• <strong>Per Reel Control:</strong> Enable/disable masking for individual reels</li>
            <li>• <strong>Animation Speed:</strong> Control spinning animation speed (0.1x - 3.0x)</li>
            <li>• <strong>Blur Intensity:</strong> Adjust blur effect during spinning</li>
            <li>• <strong>Visual Effects:</strong> Toggle various animation effects</li>
          </ul>
        </div> */}

      </div>
    </div>
  );
};