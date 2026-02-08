import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { 
  Sparkles, 
  Zap, 
  Check, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Layers,
  SlidersHorizontal,
  Rocket
} from 'lucide-react';

// Import our components
import { PreviewReelController, PreviewReelConfig, WinResultType, DEFAULT_REEL_CONFIG } from './PreviewReelController';
import AnimationControls from './AnimationControls';
import AnimationPresets, { AnimationPreset } from './AnimationPresets';
import AdvancedAnimationControls from './AdvancedAnimationControls';
import LightningTestComponent from './LightningTestComponent';
import SymbolHighlightPreview from './SymbolHighlightPreview';

const UpdatedWinAnimationWorkshop: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  
  // State for error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'controls' | 'effects' | 'highlight'>('preview');
  
  // Mode for Win Animation Workshop: presets or advanced controls
  const [viewMode, setViewMode] = useState<'preset' | 'advanced'>('preset');
  
  // Selected animation preset
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | null>('classic');
  
  // Preview controller reference
  const previewControllerRef = useRef<PreviewReelController | null>(null);
  
  // GSAP timeline reference
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
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
        backgroundColor: 0x1A1A2E, // Darker background to match the theme
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
    
    // Cleanup on unmount
    return () => {
      try {
        // Clean up GSAP timeline
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
        
        // Clean up PIXI application
        if (pixiAppRef.current) {
          pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
          pixiAppRef.current = null;
        }
        
        // Clean up preview controller
        if (previewControllerRef.current) {
          previewControllerRef.current.destroy();
          previewControllerRef.current = null;
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, []);
  
  // Handle configuration changes
  const handleConfigChange = (newConfig: Partial<PreviewReelConfig>) => {
    setAnimationConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    
    // Update the preview controller with new config
    if (previewControllerRef.current) {
      // In a complete implementation, we would add a method to update the config
      // without recreating the entire controller
      try {
        previewControllerRef.current.updateConfig(newConfig);
      } catch (error) {
        console.warn("Preview controller doesn't support updateConfig yet:", error);
      }
    }
    
    // Save to game store
    updateConfig({ 
      winAnimation: {
        ...config.winAnimation,
        ...newConfig
      }
    });
  };
  
  // Handle preset selection
  const handleSelectPreset = (preset: AnimationPreset, presetConfig: Partial<PreviewReelConfig>) => {
    setSelectedPreset(preset);
    handleConfigChange(presetConfig);
  };
  
  // Handle preset preview
  const handlePreviewPreset = (preset: AnimationPreset) => {
    // First select the preset
    setSelectedPreset(preset);
    // Then play the animation
    playAnimation();
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
  
  // Reset the animation controller
  const resetAnimation = () => {
    if (previewControllerRef.current) {
      try {
        // In a complete implementation, we would add a reset method
        previewControllerRef.current.reset();
      } catch (error) {
        console.warn("Preview controller doesn't support reset yet:", error);
        
        // Fallback: Recreate the controller
        if (pixiAppRef.current) {
          const app = pixiAppRef.current;
          const baseContainer = new PIXI.Container();
          app.stage.removeChildren();
          app.stage.addChild(baseContainer);
          
          previewControllerRef.current = new PreviewReelController(
            baseContainer,
            animationConfig,
            canvasSize.width,
            canvasSize.height
          );
        }
      }
    }
    
    // Stop any ongoing animations
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    
    setIsPlaying(false);
  };
  
  // Play animation
  const playAnimation = () => {
    if (isPlaying || !previewControllerRef.current) return;
    
    setIsPlaying(true);
    
    // Clear any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    
    // Create new timeline
    const timeline = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false);
      }
    });
    timelineRef.current = timeline;
    
    // Use preview controller to play animation with GSAP timeline
    previewControllerRef.current.previewSpin(resultType, () => {
      // After spin completes, play win animation if it's not a "no-win"
      if (resultType !== 'no-win') {
        previewControllerRef.current?.playWinAnimation(resultType);
      }
    });
    
    // Add additional timeline animations based on win type
    const animationContainer = containerRef.current;
    if (animationContainer) {
      if (resultType === 'big-win' || resultType === 'mega-win') {
        // Add scale pulse for big wins
        timeline.to(animationContainer, {
          scale: 1.05,
          duration: 0.5,
          ease: 'power2.out'
        }).to(animationContainer, {
          scale: 1,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)'
        });
      }
      
      if (resultType === 'feature-trigger') {
        // Add flash effect for feature triggers
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        animationContainer.appendChild(overlay);
        
        timeline.to(overlay, {
          opacity: 1,
          duration: 0.1,
          ease: 'power1.in'
        }).to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: 'power1.out',
          onComplete: () => {
            animationContainer.removeChild(overlay);
          }
        });
      }
    }
  };
  
  // Stop animation
  const stopAnimation = () => {
    setIsPlaying(false);
    
    // Stop GSAP timeline
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
    
    // In a full implementation, we would add code to halt the animations
    // in the preview controller as well
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
    <div className="bg-gray-900 rounded-lg p-5 text-white border border-gray-800 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Sparkles className="mr-2 text-blue-400" size={24} />
          Win Animation Workshop
        </h2>
        <p className="text-gray-400">
          Design and preview professional animations for different win types and special features.
        </p>
        
        {errorMessage && (
          <div className="mt-4 bg-red-900 bg-opacity-30 border border-red-800 rounded p-3 flex items-start text-red-300">
            <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Mode selection toggle (Apple-style) */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 p-1 rounded-full flex">
          <button
            onClick={() => setViewMode('preset')}
            className={`
              px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${viewMode === 'preset' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            Presets
          </button>
          <button
            onClick={() => setViewMode('advanced')}
            className={`
              px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${viewMode === 'advanced' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            Advanced
          </button>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="flex mb-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'preview' ? 'bg-blue-900 text-blue-300' : 'hover:bg-gray-700 text-gray-400'}`}
          onClick={() => setActiveTab('preview')}
        >
          <Play className="mr-2" size={18} />
          Animation Preview
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'controls' ? 'bg-blue-900 text-blue-300' : 'hover:bg-gray-700 text-gray-400'}`}
          onClick={() => setActiveTab('controls')}
        >
          <Settings className="mr-2" size={18} />
          Animation Settings
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'effects' ? 'bg-blue-900 text-blue-300' : 'hover:bg-gray-700 text-gray-400'}`}
          onClick={() => setActiveTab('effects')}
        >
          <Layers className="mr-2" size={18} />
          Effect Examples
        </button>
        <button 
          className={`flex-1 py-3 px-4 flex items-center justify-center ${activeTab === 'highlight' ? 'bg-blue-900 text-blue-300' : 'hover:bg-gray-700 text-gray-400'}`}
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
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
              <div className="aspect-video relative" ref={containerRef}>
                <div className="absolute inset-0" ref={reelContainerRef}>
                  {/* PIXI app will be mounted here */}
                </div>
              </div>
              
              <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    onClick={playAnimation}
                    disabled={isPlaying}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                      isPlaying 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    Play Animation
                  </button>
                  
                  <button
                    onClick={stopAnimation}
                    disabled={!isPlaying}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                      !isPlaying 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    Stop
                  </button>
                  
                  <button
                    onClick={resetAnimation}
                    className="px-4 py-2 rounded-lg flex items-center gap-1 bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 rounded-lg flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'controls' && (
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center">
                <SlidersHorizontal className="mr-2 text-blue-400" size={20} />
                Animation Configuration
              </h3>
              
              {viewMode === 'preset' ? (
                /* Preset mode */
                <AnimationPresets 
                  onSelectPreset={handleSelectPreset}
                  onPreviewPreset={handlePreviewPreset}
                  selectedPreset={selectedPreset}
                  onResultTypeChange={handleResultTypeChange}
                  resultType={resultType}
                />
              ) : (
                /* Advanced mode */
                <AdvancedAnimationControls
                  config={animationConfig}
                  onConfigChange={handleConfigChange}
                  onResultTypeChange={handleResultTypeChange}
                  onApplyAnimation={playAnimation}
                  resultType={resultType}
                />
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 rounded-lg flex items-center gap-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'effects' && (
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center">
                <Layers className="mr-2 text-purple-400" size={20} />
                Effect Examples
              </h3>
              <p className="text-gray-400 mb-6">
                Browse through different effect examples. You can use these as inspiration for your own animations.
                Click on any example to preview the effect.
              </p>
              
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-3 flex items-center text-white">
                    <Zap className="mr-2 text-blue-400" size={18} />
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
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center">
                <Sparkles className="mr-2 text-yellow-400" size={20} />
                Symbol Highlight Effects
              </h3>
              <p className="text-gray-400 mb-6">
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
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-white">Win Types</h3>
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
              
              <h3 className="text-lg font-bold mb-3 text-white">Animation Tips</h3>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                <li>Use <span className="text-blue-400">multiple effects</span> to create more engaging animations</li>
                <li>Match <span className="text-blue-400">animation intensity</span> to the win size for better player experience</li>
                <li>Consider adding <span className="text-blue-400">sound effects</span> that sync with visual animations</li>
                <li>Create <span className="text-blue-400">anticipation</span> by delaying the reveal of big wins</li>
                <li>Test animations at different <span className="text-blue-400">screen sizes</span> to ensure they scale well</li>
              </ul>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3 text-white">Quick Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Animation Intensity</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={animationConfig.glowIntensity || 7} 
                      onChange={(e) => handleConfigChange({ glowIntensity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>Subtle</span>
                      <span>Balanced</span>
                      <span>Intense</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Animation Duration</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="5" 
                      step="0.5"
                      value={animationConfig.spinDuration || 2} 
                      onChange={(e) => handleConfigChange({ spinDuration: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                      <span>Fast</span>
                      <span>Medium</span>
                      <span>Slow</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center text-sm text-gray-300">
                      <input 
                        type="checkbox" 
                        checked={animationConfig.enableAnticipation} 
                        onChange={(e) => handleConfigChange({ enableAnticipation: e.target.checked })}
                        className="mr-2"
                      />
                      Enable Anticipation Effect
                    </label>
                    
                    <label className="flex items-center text-sm text-gray-300">
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
              
              <div className="mt-6 p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
                <h4 className="font-medium text-blue-300 mb-2 flex items-center">
                  <Rocket className="mr-2" size={16} />
                  Performance Tips
                </h4>
                <p className="text-sm text-blue-200">
                  For optimal performance, consider disabling some visual effects when targeting lower-end mobile 
                  devices. Limit simultaneous particle effects and keep anticipation animations under 3 seconds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
        <h3 className="text-lg font-bold mb-2 text-blue-300 flex items-center">
          <Check className="mr-2" size={18} />
          Professional Guidelines
        </h3>
        <p className="text-sm text-blue-200">
          The Win Animation Workshop allows you to create and test animations that meet industry standards.
          Our preset packs incorporate best practices from top-performing slot games, while the advanced
          mode includes professional parameter ranges to guide your customizations. All settings are
          automatically saved to your game configuration and exported with the final game data.
        </p>
      </div>
    </div>
  );
};

export default UpdatedWinAnimationWorkshop;