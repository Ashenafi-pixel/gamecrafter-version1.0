import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { AnimationPreset, PerformanceMetrics } from '../../../types';
import { ChevronLeft, ChevronRight, Settings, Play, ChevronDown, ChevronUp, HelpCircle, Zap, Eye, Sparkles, Film, RotateCcw, CheckCircle, Cpu, Monitor, Brain } from 'lucide-react';

// Import our new shared components
import { AIAssistant } from '../../shared/AIAssistant';
import { PerformanceMonitor } from '../../shared/PerformanceMonitor';
import { ProfileManager, AnimationProfile } from '../../shared/ProfileManager';
import { UsabilityTracker } from '../../shared/UsabilityTracker';
import { animationEngine, DeviceOptimizer } from '../../../utils/animationEnhancements';
import { Button } from '../../Button';

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

interface FreespinTransition {
  style: 'fade' | 'slide' | 'zoom' | 'dissolve';
  duration: number;
}

interface Step6AnimationStudioProps {
  onMaskControlsChange: (controls: MaskControls) => void;
  onAnimationControlsChange: (controls: AnimationControls) => void;
  onVisualEffectsChange: (effects: VisualEffects) => void;
  onFreespinTransitionChange?: (transition: FreespinTransition) => void;
}

const PRESET_CONFIGURATIONS = {
  classic: { speed: 1.0, blurIntensity: 4, easing: 'power2.out' },
  dramatic: { speed: 0.7, blurIntensity: 12, easing: 'back.out' },
  smooth: { speed: 1.3, blurIntensity: 2, easing: 'power2.inOut' },
  'mobile-optimized': { speed: 1.1, blurIntensity: 6, easing: 'power2.out' }
};

export const Step6_AnimationStudio: React.FC<Step6AnimationStudioProps> = ({
  onMaskControlsChange,
  onAnimationControlsChange,
  onVisualEffectsChange,
  onFreespinTransitionChange
}) => {
  // Experience Level State
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'advanced' | 'expert'>('beginner');
  
  // Mask Controls State
  const [maskControls, setMaskControls] = useState<MaskControls>({
    enabled: true,
    debugVisible: false,
    perReelEnabled: [true, true, true, true, true]
  });

  // Animation Controls State
  const [animationControls, setAnimationControls] = useState<AnimationControls>({
    speed: 1.0,
    blurIntensity: 8,
    easing: 'back.out'
  });

  // Visual Effects State
  const [visualEffects, setVisualEffects] = useState<VisualEffects>({
    spinBlur: true,
    glowEffects: false,
    screenShake: false
  });

  // Freespin Transition State
  const [freespinTransition, setFreespinTransition] = useState<FreespinTransition>({
    style: 'fade',
    duration: 2.0
  });

  // Professional features state
  const { animationWorkspace, setAnimationPreset, setMaskPreviewMode, setPerformanceMode, toggleEasingCurve } = useGameStore();
  const [availablePresets, setAvailablePresets] = useState<AnimationPreset[]>([
    { name: 'classic', description: 'Standard casino feel' },
    { name: 'dramatic', description: 'Slow and impactful' },
    { name: 'smooth', description: 'Fast and fluid' },
    { name: 'mobile-optimized', description: 'Optimized for mobile devices' }
  ]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameCount: 0,
    lastTime: 0,
    memoryUsage: 45,
    animationComplexity: 35
  });
  const [easingCurvePoints, setEasingCurvePoints] = useState<Array<{ x: number; y: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Enhanced features state
  const [deviceOptimizations, setDeviceOptimizations] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [advancedMode, setAdvancedMode] = useState<'timeline' | 'nodes' | 'standard'>('standard');
  const [showDevicePreview, setShowDevicePreview] = useState(false);
  const deviceOptimizer = DeviceOptimizer.getInstance();

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState({
    masking: false,
    animation: false,
    visualEffects: false,
    freespinTransitions: false
  });

  // Tooltip states
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Update parent components when controls change
  useEffect(() => {
    onMaskControlsChange(maskControls);
    window.dispatchEvent(new CustomEvent('applyMaskControls', {
      detail: { controls: maskControls }
    }));
  }, [maskControls, onMaskControlsChange]);

  useEffect(() => {
    onAnimationControlsChange(animationControls);
  }, [animationControls, onAnimationControlsChange]);

  useEffect(() => {
    onVisualEffectsChange(visualEffects);
  }, [visualEffects, onVisualEffectsChange]);

  useEffect(() => {
    if (onFreespinTransitionChange) {
      onFreespinTransitionChange(freespinTransition);
    }
  }, [freespinTransition, onFreespinTransitionChange]);

  // Enhanced features integration
  useEffect(() => {
    // Get device optimizations and AI suggestions
    const currentSettings = {
      speed: animationControls.speed,
      blurIntensity: animationControls.blurIntensity,
      easing: animationControls.easing,
      visualEffects
    };

    const enhancements = animationEngine.getEnhancedSettings(currentSettings, {
      experienceLevel,
      device: deviceOptimizer.getDeviceSpecs().device
    });

    setDeviceOptimizations(enhancements.deviceOptimizations);
    setAiSuggestions(enhancements.suggestions);

    // Update performance metrics
    animationEngine.updatePerformance(performanceMetrics);
  }, [animationControls, visualEffects, experienceLevel, performanceMetrics]);

  // Quick Preset Application
  const applyPreset = (presetName: string) => {
    const config = PRESET_CONFIGURATIONS[presetName as keyof typeof PRESET_CONFIGURATIONS];
    if (config) {
      setAnimationControls(prev => ({ ...prev, ...config }));
      setAnimationPreset(presetName);
      
      // Show success feedback
      const element = document.getElementById(`preset-${presetName}`);
      if (element) {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 1000);
      }
    }
  };

  // Handlers
  const toggleMasking = () => {
    const newMaskControls = { ...maskControls, enabled: !maskControls.enabled };
    setMaskControls(newMaskControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('applyMaskControls', {
      detail: { controls: newMaskControls }
    }));
    console.log('🎭 Masking toggled:', newMaskControls.enabled);
  };

  const toggleDebugVisible = () => {
    const newMaskControls = { ...maskControls, debugVisible: !maskControls.debugVisible };
    setMaskControls(newMaskControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('applyMaskControls', {
      detail: { controls: newMaskControls }
    }));
    console.log('🎭 Debug visibility toggled:', newMaskControls.debugVisible);
  };

  const toggleReelMask = (reelIndex: number) => {
    const newMaskControls = {
      ...maskControls,
      perReelEnabled: maskControls.perReelEnabled.map((enabled, index) => 
        index === reelIndex ? !enabled : enabled
      )
    };
    setMaskControls(newMaskControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('applyMaskControls', {
      detail: { controls: newMaskControls }
    }));
    console.log(`🎭 Reel ${reelIndex} mask toggled:`, !maskControls.perReelEnabled[reelIndex]);
  };

  const updateAnimationSpeed = (speed: number) => {
    const newControls = { ...animationControls, speed };
    setAnimationControls(newControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: newControls }
    }));
  };

  const updateBlurIntensity = (blurIntensity: number) => {
    const newControls = { ...animationControls, blurIntensity };
    setAnimationControls(newControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: newControls }
    }));
  };

  const updateEasing = (easing: string) => {
    const newControls = { ...animationControls, easing };
    setAnimationControls(newControls);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: newControls }
    }));
  };

  const toggleVisualEffect = (effect: keyof VisualEffects) => {
    const newEffects = { ...visualEffects, [effect]: !visualEffects[effect] };
    setVisualEffects(newEffects);
    
    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: { visualEffects: newEffects } }
    }));
  };

  const updateTransitionStyle = (style: FreespinTransition['style']) => {
    setFreespinTransition(prev => ({ ...prev, style }));
  };

  const updateTransitionDuration = (duration: number) => {
    setFreespinTransition(prev => ({ ...prev, duration }));
  };

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced feature handlers
  const handleProfileApply = (profile: AnimationProfile) => {
    if (profile.settings.speed !== undefined) updateAnimationSpeed(profile.settings.speed);
    if (profile.settings.blurIntensity !== undefined) updateBlurIntensity(profile.settings.blurIntensity);
    if (profile.settings.easing !== undefined) updateEasing(profile.settings.easing);
    if (profile.settings.visualEffects) {
      setVisualEffects(profile.settings.visualEffects);
    }
    setAnimationPreset(profile.name);
  };

  const handleAISuggestionAction = (suggestionId: string, action: string) => {
    console.log('AI Suggestion Action:', suggestionId, action);
    // Implement auto-fix logic here based on suggestion type
  };

  const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
    setPerformanceMetrics(metrics);
    animationEngine.updatePerformance(metrics);
  };

  const handleAdvancedModeChange = (mode: 'timeline' | 'nodes' | 'standard') => {
    setAdvancedMode(mode);
    // In a full implementation, this would switch the UI to show timeline/node editors
  };

  // Tooltip Component
  const Tooltip: React.FC<{ id: string; children: React.ReactNode; content: string }> = ({ id, children, content }) => (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setActiveTooltip(id)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      {children}
      {activeTooltip === id && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );

  // Smart Performance Indicator
  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'bg-emerald-500';
    if (fps >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceAdvice = () => {
    if (performanceMetrics.fps < 45) return "Consider reducing blur intensity or visual effects";
    if (performanceMetrics.animationComplexity > 70) return "High complexity - monitor performance on mobile";
    return "Performance is optimal";
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header with Experience Level */}
      <div className="bg-white border-b rounded-md border-gray-200 shadow-sm">
        <div>
          {/* <div className="flex items-center justify-between mb-4"> */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-900">Animation Studio</h1>
                <p className="text-sm text-gray-600">Control how reels move and feel</p>
          </div>
          </div>

          {/* Experience Level & Advanced Mode Selector */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 p-2 gap-4"> */}
          <div className="flex flex-col p-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  Experience Level
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'advanced', 'expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setExperienceLevel(level as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      experienceLevel === level
                        ? 'bg-blue-600 text-white shadow-lg transform scale-102'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-600 m-2">
                {experienceLevel === 'beginner' && "Essential controls only"}
                {experienceLevel === 'advanced' && "Advanced parameters and presets"}
                {experienceLevel === 'expert' && "Full technical control and debugging"}
              </p>


            {experienceLevel === 'expert' && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    Advanced Mode
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {['standard', 'timeline', 'nodes'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleAdvancedModeChange(mode as any)}
                      // className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      //   advancedMode === mode
                      //     ? 'bg-purple-600 text-white shadow-lg'
                      //     : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                      // }`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      advancedMode === mode
                        ? 'bg-blue-600 text-white shadow-lg transform scale-102'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  {advancedMode === 'standard' && "Standard parameter controls"}
                  {advancedMode === 'timeline' && "Keyframe-based timeline editor"}
                  {advancedMode === 'nodes' && "Visual node-based programming"}
                </p>
              </div>
            )}
            </div>

            {/* Advanced Mode Selector - Only for Expert */}

            {/* Device Information */}
            {deviceOptimizations && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    Device Optimization
                  </h3>
                  <button
                    onClick={() => setShowDevicePreview(!showDevicePreview)}
                    className="text-xs bg-blue-600 border hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    {showDevicePreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-gray-700 font-medium">Device</div>
                    <div className="text-gray-600">{deviceOptimizations.device}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-700 font-medium">Max Blur</div>
                    <div className="text-gray-600">{deviceOptimizations.maxBlur}px</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-700 font-medium">Target FPS</div>
                    <div className="text-gray-600">{deviceOptimizations.targetFPS}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-700 font-medium">Memory Limit</div>
                    <div className="text-gray-600">{deviceOptimizations.memoryLimit}MB</div>
                  </div>
                </div>
              </div>
            )}
          {/* Quick Presets */}
          <div className=" bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                {/* <Zap className="w-4 h-4 mr-2" /> */}
                Quick Presets
              </h3>
              {experienceLevel !== 'beginner' && (
                <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                  Active: {animationWorkspace.selectedPreset || 'Custom'}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.name}
                  id={`preset-${preset.name}`}
                  onClick={() => applyPreset(preset.name)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border transform ${animationWorkspace.selectedPreset === preset.name
                          ? 'border-red-300 bg-red-50 '
                          : 'border-gray-200 bg-white hover:border-red-200'
                        }`}
                  title={preset.description}
                >
                  <div className="flex items-center justify-between">
                    <span>{preset.name.charAt(0).toUpperCase() + preset.name.slice(1)}</span>
                    {animationWorkspace.selectedPreset === preset.name && (
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xs opacity-75 mt-1 text-left">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>


          </div>

        </div>
      </div>

      {/* Shared Components Section */}
      <div className="bg-gray-50 py-4 space-y-4">
        {/* AI Assistant */}
        <AIAssistant
          stepType="animation"
          context={{
            speed: animationControls.speed,
            blurIntensity: animationControls.blurIntensity,
            easing: animationControls.easing,
            visualEffects,
            experienceLevel,
            device: deviceOptimizations?.device || 'desktop'
          }}
          experienceLevel={experienceLevel}
          onSuggestionAction={handleAISuggestionAction}
        />

        {/* Performance Monitor */}
        <PerformanceMonitor
          stepType="animation"
          enabled={true}
          realTime={true}
          showAdvice={true}
          onPerformanceChange={handlePerformanceUpdate}
        />

        {/* Profile Manager */}
        <ProfileManager
          stepType="animation"
          currentSettings={{
            speed: animationControls.speed,
            blurIntensity: animationControls.blurIntensity,
            easing: animationControls.easing,
            visualEffects
          }}
          onProfileApply={handleProfileApply}
        />

        {/* Analytics Tracker - Disabled temporarily to avoid PIXI conflicts */}
        {/* TODO: Implement server-side analytics in later phase */}
        {/* 
        {experienceLevel !== 'beginner' && (
          <UsabilityTracker
            stepType="animation"
            enabled={true}
            enableHeatmap={experienceLevel === 'expert'}
            showRealTimeMetrics={experienceLevel === 'expert'}
          />
        )}
        */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className=" space-y-6">
          
          {/* 🎬 Spin Behavior (Primary Section) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 ">
            <div
              className="w-full p-3 flex items-center justify-between border-l-4 border-l-red-500 text-left bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Spin Behavior</h3>
                  <p className="text-sm text-gray-600">Control how reels move and feel</p>
                </div>
              </div>
            </div>
              <div className="p-3 space-y-6">
                {/* Animation Speed */}
                <div className="p-3 space-y-3 border bg-gray-50 rounded-md ">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-800 flex items-center">
                      Speed: {animationControls.speed}x
                      
                    </label>
                    <div className="text-xs text-gray-500">
                      {animationControls.speed < 1 ? 'Slow & Dramatic' : 
                       animationControls.speed > 2 ? 'Fast & Energetic' : 'Balanced'}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={animationControls.speed}
                    onChange={(e) => updateAnimationSpeed(parseFloat(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-gray-200 via-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer slider-modern"
                    data-track="speed-slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.1x (Slow)</span>
                    <span>3.0x (Fast)</span>
                  </div>
                </div>

                {/* Motion Blur */}
                <div className="p-3 space-y-3 border bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-800 flex items-center">
                      Motion blur amount: {animationControls.blurIntensity}px
                      {/* <Tooltip id="blur-help" content="High blur may impact performance on mobile">
                        <HelpCircle className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                      </Tooltip> */}
                    </label>
                    {animationControls.blurIntensity > 15 && (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                        Performance Impact
                      </span>
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={animationControls.blurIntensity}
                    onChange={(e) => updateBlurIntensity(parseInt(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-gray-200 via-purple-200 to-purple-500 rounded-lg appearance-none cursor-pointer slider-modern"
                    data-track="blur-slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0px (Sharp)</span>
                    <span>20px (Intense)</span>
                  </div>
                </div>

                {/* Easing with Visual Picker */}
                <div className=" flex items-center text-center justify-between">
                  <label className="text-sm font-semibold text-gray-800">Easing Style:</label>
                  <select
                    value={animationControls.easing}
                    onChange={(e) => updateEasing(e.target.value)}
                    className="w-full max-w-[80%] bg-white border-2 border-gray-200 text-gray-800 rounded-lg px-2 py-2  transition-all"
                    data-track="easing-select"
                  >
                    <option value="back.out">🎯 Back Out (Overshoot)</option>
                    <option value="bounce.out">🏀 Bounce Out (Playful)</option>
                    <option value="elastic.out">🪀 Elastic Out (Stretchy)</option>
                    <option value="power2.out">⚡ Power2 Out (Smooth)</option>
                    <option value="power2.in">📈 Power2 In (Accelerate)</option>
                    <option value="power2.inOut">🌊 Power2 InOut (Balanced)</option>
                    <option value="none">📏 Linear (Constant)</option>
                  </select>
                </div>

                {/* Test Spin Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                  variant='generate'
                    onClick={() => {
                      console.log('🎰 Test spin triggered from Animation Studio');
                      window.dispatchEvent(new CustomEvent('slotSpin', {
                        detail: { 
                          source: 'animation-studio-test',
                          settings: animationControls 
                        }
                      }));
                    }}
                    className="w-full py-2"
                    // data-track="test-spin-button"
                  >
                    <Play className="w-5 h-5" />
                    <span>Test Spin Animation</span>
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    See how <strong>{animationControls.easing}</strong> easing feels in action
                  </p>
                </div>
              </div>

          </div>

          {/* 👁️ Reel Visibility */}
          {experienceLevel !== 'beginner' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div
                className="w-full p-3 flex items-center border-l-4 border-l-red-500 justify-between text-left transition-colors border-b border-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Reel Visibility</h3>
                    <p className="text-sm text-gray-600">Show/hide parts of the slot machine</p>
                  </div>
                </div>
              </div>
              

                <div className="p-3 space-y-3">
                  {/* Clip symbols toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={maskControls.enabled}
                        onChange={toggleMasking}
                        className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">Clip symbols</span>
                        <p className="text-sm text-gray-600">Hide symbols outside visible area</p>
                      </div>
                    </div>
                  </div>

                  {/* Show debug toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={maskControls.debugVisible}
                        onChange={toggleDebugVisible}
                        className="mr-3 w-5 h-5 text-gray-600 rounded focus:ring-gray-500"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">Show debug</span>
                        <p className="text-sm text-gray-600">Display masking boundaries</p>
                      </div>
                    </div>
                  </div>

                  {/* Per-reel control */}
                  <div className="space-y-3 border bg-gray-50 p-2 rounded-md">
                    <h4 className="text-sm font-semibold text-gray-800">Per-reel control:</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {maskControls.perReelEnabled.map((enabled, index) => (
                        <div key={index} className="text-center">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleReelMask(index)}
                            className="mb-2 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <div className="text-xs font-medium text-gray-700">Reel {index + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

            </div>
          )}

          {/* ✨ Visual Polish */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 ">
            <div
              className="w-full p-3 flex items-center justify-between border-l-4 border-l-red-500 bg-gray-50 text-left transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Visual Polish</h3>
                  <p className="text-sm text-gray-600">Add professional effects</p>
                </div>
              </div>
            </div>
            
              <div className="p-3 space-y-4">
                {/* Effect toggles with descriptions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visualEffects.spinBlur}
                        onChange={() => toggleVisualEffect('spinBlur')}
                        className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">Glow effects</span>
                        <p className="text-sm text-gray-600">Subtle glow around winning symbols</p>
                      </div>
                    </div>
                    {/* {visualEffects.spinBlur && <div className="text-blue-600">✓</div>} */}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visualEffects.glowEffects}
                        onChange={() => toggleVisualEffect('glowEffects')}
                        className="mr-3 w-5 h-5 text-gray-600 rounded focus:ring-yellow-500"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-800">Screen shake</span>
                        <p className="text-sm text-gray-600">Slight shake on big wins</p>
                      </div>
                    </div>
                    {/* {visualEffects.glowEffects && <div className="text-yellow-600">✓</div>} */}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={true}
                        className="mr-3 w-5 h-5 text-gray-400 rounded cursor-not-allowed"
                      />
                      <div>
                        <span className="text-base font-medium text-gray-500">Particles</span>
                        <p className="text-sm text-gray-400">Coming soon...</p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">Soon</span>
                  </div>
                </div>
              </div>
          </div>

          {/* 🌟 Freespin Transitions */}
          {experienceLevel === 'expert' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="w-full p-3 flex items-center justify-between text-left border-l-4 border-l-red-500 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Freespin Transitions</h3>
                    <p className="text-sm text-gray-600">Title assets integration</p>
                  </div>
                </div>
              </div>
              
              {!collapsedSections.freespinTransitions && (
                <div className="p-3 space-y-3">
                  {/* Transition Style */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-800">Transition Style:</label>
                    <select
                      value={freespinTransition.style}
                      onChange={(e) => updateTransitionStyle(e.target.value as FreespinTransition['style'])}
                      className="w-full bg-white border-2 border-gray-200 text-gray-800 rounded-lg px-4 py-3"
                    >
                      <option value="fade">🌅 Fade</option>
                      <option value="slide">➡️ Slide</option>
                      <option value="zoom">🔍 Zoom In</option>
                      <option value="dissolve">💫 Dissolve</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-800">
                      Duration: {freespinTransition.duration}s
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={freespinTransition.duration}
                      onChange={(e) => updateTransitionDuration(parseFloat(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-gray-200 via-orange-200 to-orange-500 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Preview Buttons */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('previewFreespinTransition', {
                          detail: { direction: 'to-freespin', ...freespinTransition }
                        }));
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105"
                    >
                      🎰 Preview → Freespin
                    </button>
                    
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('previewFreespinTransition', {
                          detail: { direction: 'to-regular', ...freespinTransition }
                        }));
                      }}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
                    >
                      🌟 Freespin → Regular
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Enhanced Styles */}
      <style jsx>{`
        .slider-modern::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
          border: 3px solid white;
        }
        
        .slider-modern::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        .slider-modern::-webkit-slider-track {
          height: 12px;
          border-radius: 6px;
        }
        
        .slider-modern::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          border: 3px solid white;
          cursor: pointer;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};