import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import * as PIXI from 'pixi.js';
import { 
  Zap, 
  Sparkles, 
  Flame, 
  Check, 
  AlertTriangle,
  Play,
  Pause,
  Rewind,
  RotateCcw,
  Download,
  Settings,
  Layers,
  LayoutGrid
} from 'lucide-react';

// Import our new components
import { PreviewReelController, PreviewReelConfig, WinResultType, DEFAULT_REEL_CONFIG } from './PreviewReelController';
import AnimationControls from './AnimationControls';
import LightningTestComponent from './LightningTestComponent';
import SymbolHighlightPreview from './SymbolHighlightPreview';

const WinAnimationWorkshop: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  
  // State for error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'controls' | 'effects' | 'highlight'>('preview');
  
  // Preview controller reference
  const previewControllerRef = useRef<PreviewReelController | null>(null);
  
  // PIXI app reference
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  
  // Animation configuration state
  const [animationConfig, setAnimationConfig] = useState<Partial<PreviewReelConfig>>({
    ...DEFAULT_REEL_CONFIG,
    ...(config.winAnimation || {})
  });
  
  // Selected win result type
  const [resultType, setResultType] = useState<WinResultType>('medium-win');
  
  // Canvas dimensions
  const [canvasSize] = useState({ width: 800, height: 480 });
  
  // Initialize PIXI application when component mounts
  useEffect(() => {
    if (!reelContainerRef.current) return;
    
    try {
      console.log("Initializing PIXI.js for reel animations");
      
      // Create PIXI application
      const app = new PIXI.Application({
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: 0xF5F5F5, // Light gray background to match the light theme
        antialias: true,
        resolution: window.devicePixelRatio || 1
      });
      
      // Add canvas to container
      reelContainerRef.current.appendChild(app.view as unknown as Node);
      pixiAppRef.current = app;
      
      // Create base container for all elements
      const baseContainer = new PIXI.Container();
      app.stage.addChild(baseContainer);
      
      // Initialize preview controller
      previewControllerRef.current = new PreviewReelController(
        baseContainer,
        animationConfig,
        canvasSize.width,
        canvasSize.height
      );
      
      // Clear any error message
      setErrorMessage(null);
    } catch (error) {
      console.error("Error initializing PIXI.js:", error);
      setErrorMessage("Failed to initialize animation system. Please try again.");
    }
    
    // Enhanced cleanup on unmount with comprehensive resource management
    return () => {
      try {
        // First, stop all animations in progress
        setIsPlaying(false);
        
        // Kill all GSAP animations
        if (previewControllerRef.current && previewControllerRef.current.container) {
          const container = previewControllerRef.current.container;
          
          // Recursively kill all GSAP animations on all children
          const killGsapAnimations = (container) => {
            if (!container) return;
            
            // Kill animations on this container
            gsap.killTweensOf(container);
            
            // Recursively process all children
            if (container.children && container.children.length) {
              container.children.forEach(child => {
                killGsapAnimations(child);
                
                // Also kill animations on common properties
                if (child.scale) gsap.killTweensOf(child.scale);
                if (child.position) gsap.killTweensOf(child.position);
                if (child.filters) {
                  child.filters.forEach(filter => {
                    gsap.killTweensOf(filter);
                  });
                }
              });
            }
          };
          
          // Start recursive cleanup
          killGsapAnimations(container);
        }
        
        // Clear all timers in preview controller if available
        if (previewControllerRef.current && previewControllerRef.current.clearAllTimers) {
          previewControllerRef.current.clearAllTimers();
        }
        
        // Stop ticker animations if using PIXI ticker
        if (pixiAppRef.current && pixiAppRef.current.ticker) {
          pixiAppRef.current.ticker.stop();
        }
        
        // Force texture garbage collection
        PIXI.utils.clearTextureCache();
        
        // Destroy all textures manually if accessible
        if (previewControllerRef.current && previewControllerRef.current.textures) {
          Object.values(previewControllerRef.current.textures).forEach(texture => {
            if (texture && texture.destroy) {
              texture.destroy(true);
            }
          });
        }
        
        // Clean up preview controller
        if (previewControllerRef.current) {
          previewControllerRef.current.destroy();
          previewControllerRef.current = null;
        }
        
        // Clean up PIXI application last (after all resources are cleaned)
        if (pixiAppRef.current) {
          pixiAppRef.current.destroy(true, { 
            children: true, 
            texture: true, 
            baseTexture: true 
          });
          pixiAppRef.current = null;
        }
        
        // Clear HTML container
        if (reelContainerRef.current) {
          reelContainerRef.current.innerHTML = '';
        }
      } catch (error) {
        console.error("Error during enhanced cleanup:", error);
      }
    };
  }, []);
  
  // Handle configuration changes
  const handleConfigChange = (newConfig: Partial<PreviewReelConfig>) => {
    setAnimationConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    
    // Save to game store
    updateConfig({ 
      winAnimation: {
        ...config.winAnimation,
        ...newConfig
      }
    });
  };
  
  // Handle symbol highlight config
  const handleHighlightConfigSave = (highlightConfig: any) => {
    // Save to game store
    updateConfig({
      symbolHighlight: {
        ...config.symbolHighlight,
        ...highlightConfig
      }
    });
  };
  
  // Handle result type changes
  const handleResultTypeChange = (type: WinResultType) => {
    setResultType(type);
  };
  
  // Play animation
  const playAnimation = () => {
    if (isPlaying || !previewControllerRef.current) return;
    
    setIsPlaying(true);
    
    // Use preview controller to play animation
    previewControllerRef.current.previewSpin(resultType, () => {
      // After spin completes, play win animation if it's not a "no-win"
      if (resultType !== 'no-win') {
        previewControllerRef.current?.playWinAnimation(resultType);
      }
      
      // Set timeout to stop playing
      setTimeout(() => {
        setIsPlaying(false);
      }, getAnimationDuration());
    });
  };
  
  // Get appropriate duration for each animation type
  const getAnimationDuration = (): number => {
    switch (resultType) {
      case 'small-win':
        return 2000;
      case 'medium-win':
        return 3000;
      case 'big-win':
        return 4000;
      case 'mega-win':
        return 5000;
      case 'feature-trigger':
        return 6000;
      default:
        return 1500;
    }
  };
  
  // Stop animation with proper cleanup
  const stopAnimation = () => {
    setIsPlaying(false);
    
    // Stop all animations in progress
    if (previewControllerRef.current) {
      // Reset the controller to stop all animations
      if (previewControllerRef.current.reset) {
        previewControllerRef.current.reset();
      }
      
      // Clear any internal timers in the controller
      if (previewControllerRef.current.clearAllTimers) {
        previewControllerRef.current.clearAllTimers();
      }
      
      // Stop all GSAP animations associated with the preview controller
      if (previewControllerRef.current.container) {
        gsap.killTweensOf(previewControllerRef.current.container.children);
      }
    }
    
    // Stop any PIXI ticker animations
    if (pixiAppRef.current && pixiAppRef.current.ticker) {
      pixiAppRef.current.ticker.stop();
      // Restart ticker at low speed for basic UI updates
      pixiAppRef.current.ticker.start();
      pixiAppRef.current.ticker.speed = 0.2;
    }
  };
  
  // Save animation configuration
  const saveConfiguration = () => {
    // Save to game store
    updateConfig({ 
      winAnimation: {
        ...animationConfig
      }
    });
    
    // Show success message via toast
    console.log("Animation configuration saved successfully");
    
    // Visual feedback
    const element = document.createElement('div');
    element.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50';
    element.innerHTML = 'Animation configuration saved!';
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  };
  
  return (
    <div className="bg-white rounded-lg p-5 text-gray-800 border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center text-gray-800">
          <Sparkles className="mr-2 text-blue-600" size={24} />
          Win Animation Workshop
        </h2>
        <p className="text-gray-600">
          Design and preview animations for different win types and special features.
        </p>
        
        {errorMessage && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 flex items-start text-red-600">
            <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs navigation */}
      <div className="flex mb-6 bg-gray-100 rounded overflow-hidden">
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('preview')}
        >
          <Play className="mr-2" size={18} />
          Animation Preview
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'controls' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('controls')}
        >
          <Settings className="mr-2" size={18} />
          Animation Settings
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'effects' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('effects')}
        >
          <Layers className="mr-2" size={18} />
          Effect Examples
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'highlight' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('highlight')}
        >
          <Zap className="mr-2" size={18} />
          Symbol Highlights
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content area */}
        <div className={`${activeTab === 'preview' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {activeTab === 'preview' && (
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <div className="aspect-video relative" ref={reelContainerRef}>
                {/* PIXI app will be mounted here */}
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={playAnimation}
                    disabled={isPlaying}
                    className={`px-4 py-2 rounded flex items-center gap-1 ${
                      isPlaying 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Play Animation
                  </button>
                  
                  <button
                    onClick={stopAnimation}
                    disabled={!isPlaying}
                    className={`px-4 py-2 rounded flex items-center gap-1 ${
                      !isPlaying 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    Stop
                  </button>
                  
                  <button
                    onClick={() => {
                      if (previewControllerRef.current) {
                        // In a complete implementation, we would add a reset method
                        // that repositions all symbols
                        setIsPlaying(false);
                      }
                    }}
                    className="px-4 py-2 rounded flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 rounded flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'controls' && (
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Animation Configuration</h3>
              <p className="text-gray-600 mb-4">
                Adjust the settings below to customize the animation behavior. Changes will be applied when you play the animation.
              </p>
              
              {/* Render Animation Controls component */}
              <AnimationControls 
                config={animationConfig}
                onConfigChange={handleConfigChange}
                onResultTypeChange={handleResultTypeChange}
                onApplyAnimation={playAnimation}
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 rounded flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'effects' && (
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Effect Examples</h3>
              <p className="text-gray-600 mb-6">
                Browse through different effect examples. You can use these as inspiration for your own animations.
              </p>
              
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3 flex items-center text-gray-800">
                    <Zap className="mr-2 text-blue-600" size={18} />
                    Lightning Effects
                  </h4>
                  <LightningTestComponent 
                    canvasWidth={canvasSize.width}
                    canvasHeight={300}
                    intensity={animationConfig.glowIntensity || 7}
                    color={animationConfig.symbolColors?.[0] || '#4FC3F7'}
                    secondaryColor={animationConfig.symbolColors?.[1] || '#039BE5'}
                    glowEnabled={true}
                    shakeEnabled={true}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'highlight' && (
            <div className="bg-gray-900 rounded-lg p-5">
              <h3 className="text-xl font-bold mb-4">Symbol Highlight Effects</h3>
              <p className="text-gray-300 mb-6">
                Design custom highlight effects for winning symbols, similar to those seen in games like Wolf Gold. 
                Upload your own particle images and configure the animation parameters.
              </p>
              
              <SymbolHighlightPreview
                canvasWidth={canvasSize.width}
                canvasHeight={360}
                onConfigSave={handleHighlightConfigSave}
              />
            </div>
          )}
        </div>
        
        {/* Side panel (only visible in preview tab) */}
        {activeTab === 'preview' && (
          <div className="lg:col-span-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Win Types</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {(['no-win', 'small-win', 'medium-win', 'big-win', 'mega-win', 'feature-trigger'] as WinResultType[]).map((type) => (
                  <button
                    key={type}
                    className={`py-2 px-3 rounded text-sm ${
                      resultType === type 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setResultType(type)}
                  >
                    {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
              
              <h3 className="text-lg font-bold mb-3">Animation Tips</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                <li>Use <span className="text-blue-400">multiple effects</span> to create more engaging animations</li>
                <li>Match <span className="text-blue-400">animation intensity</span> to the win size for better player experience</li>
                <li>Consider adding <span className="text-blue-400">sound effects</span> that sync with visual animations</li>
                <li>Create <span className="text-blue-400">anticipation</span> by delaying the reveal of big wins</li>
                <li>Test animations at different <span className="text-blue-400">screen sizes</span> to ensure they scale well</li>
              </ul>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">Quick Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Animation Intensity</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={animationConfig.glowIntensity || 7} 
                      onChange={(e) => handleConfigChange({ glowIntensity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>Subtle</span>
                      <span>Balanced</span>
                      <span>Intense</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Animation Duration</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="5" 
                      step="0.5"
                      value={animationConfig.spinDuration || 2} 
                      onChange={(e) => handleConfigChange({ spinDuration: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>Fast</span>
                      <span>Medium</span>
                      <span>Slow</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={animationConfig.enableAnticipation} 
                        onChange={(e) => handleConfigChange({ enableAnticipation: e.target.checked })}
                        className="mr-2"
                      />
                      Enable Anticipation Effect
                    </label>
                    
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={animationConfig.shakeEnabled} 
                        onChange={(e) => handleConfigChange({ shakeEnabled: e.target.checked })}
                        className="mr-2"
                      />
                      Enable Screen Shake
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-gray-700 bg-opacity-50 rounded p-4">
        <h3 className="text-lg font-bold mb-2">Developer Notes</h3>
        <p className="text-sm text-gray-300">
          The Win Animation Workshop allows you to create and test animations for different win scenarios in your slot game.
          Configure parameters like timing, effects, and visual elements, then preview how they will appear in the final game.
          All settings are saved to the game configuration and will be exported with the final game data.
        </p>
      </div>
    </div>
  );
};

export default WinAnimationWorkshop;