import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { AnimationPreset, PerformanceMetrics } from '../../../types';
import { Play, CheckCircle } from 'lucide-react';
import { AIAssistant } from '../../shared/AIAssistant';
import { PerformanceMonitor } from '../../shared/PerformanceMonitor';
import { ProfileManager, AnimationProfile } from '../../shared/ProfileManager';
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

interface Step6AnimationStudioProps {
  onMaskControlsChange: (controls: MaskControls) => void;
  onAnimationControlsChange: (controls: AnimationControls) => void;
  onVisualEffectsChange: (effects: VisualEffects) => void;
}

const PRESET_CONFIGURATIONS = {
  classic: {
    speed: 1.0,
    blurIntensity: 4,
    easing: 'power2.out',
    visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
  },
  dramatic: {
    speed: 0.7,
    blurIntensity: 12,
    easing: 'back.out',
    visualEffects: { spinBlur: true, glowEffects: true, screenShake: false }
  },
  smooth: {
    speed: 1.3,
    blurIntensity: 2,
    easing: 'power2.inOut',
    visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
  },
  'mobile-optimized': {
    speed: 1.1,
    blurIntensity: 6,
    easing: 'power2.out',
    visualEffects: { spinBlur: true, glowEffects: false, screenShake: false }
  }
};

export const Step6_AnimationStudio: React.FC<Step6AnimationStudioProps> = ({
  onMaskControlsChange,
  onAnimationControlsChange,
  onVisualEffectsChange
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

  // Professional features state
  const { animationWorkspace, setAnimationPreset } = useGameStore();
  const [availablePresets, setAvailablePresets] = useState<AnimationPreset[]>([
    { name: 'classic', description: 'Balanced speed with moderate blur' },
    { name: 'dramatic', description: 'Slow motion with heavy blur & glow' },
    { name: 'smooth', description: 'Fast & crisp with minimal blur' },
    { name: 'mobile-optimized', description: 'Performance-friendly settings' }
  ]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameCount: 0,
    lastTime: 0,
    memoryUsage: 45,
    animationComplexity: 35
  });

  // Enhanced features state
  const [deviceOptimizations, setDeviceOptimizations] = useState<any>(null);
  const [showDevicePreview, setShowDevicePreview] = useState(false);
  const deviceOptimizer = DeviceOptimizer.getInstance();


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

    // Update performance metrics
    animationEngine.updatePerformance(performanceMetrics);
  }, [animationControls, visualEffects, experienceLevel, performanceMetrics]);

  // Quick Preset Application
  const applyPreset = (presetName: string) => {
    const config = PRESET_CONFIGURATIONS[presetName as keyof typeof PRESET_CONFIGURATIONS];
    if (config) {
      // Extract visual effects from config
      const { visualEffects: presetVisualEffects, ...animationConfig } = config;

      // Update animation controls
      const newControls = { ...animationControls, ...animationConfig };
      setAnimationControls(newControls);

      // Update visual effects if provided
      if (presetVisualEffects) {
        setVisualEffects(presetVisualEffects);
      }

      // Update store preset selection
      setAnimationPreset(presetName);

      // Dispatch real-time updates to PIXI
      window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
        detail: { settings: newControls }
      }));

      if (presetVisualEffects) {
        window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
          detail: { settings: { visualEffects: presetVisualEffects } }
        }));
      }

      console.log('🎯 Preset applied:', presetName, { newControls, visualEffects: presetVisualEffects });

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
    console.log('🎭 Easing changed to:', easing);
    const newControls = { ...animationControls, easing };
    setAnimationControls(newControls);

    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: newControls }
    }));

    console.log('🎭 Dispatched easing change:', newControls);
  };

  const toggleVisualEffect = (effect: keyof VisualEffects) => {
    const newEffects = { ...visualEffects, [effect]: !visualEffects[effect] };
    setVisualEffects(newEffects);

    console.log('✨ Visual effect toggled:', effect, 'to:', newEffects[effect]);

    // Dispatch real-time update to PIXI
    window.dispatchEvent(new CustomEvent('animationSettingsChanged', {
      detail: { settings: { visualEffects: newEffects } }
    }));

    console.log('✨ Dispatched visual effects change:', newEffects);
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

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col uw:w-full uw:h-full">
      {/* Header with Experience Level */}
      <div className="bg-white border-b rounded-md border-gray-200 shadow-sm">
        <div className='uw:w-full'>
          {/* <div className="flex items-center justify-between mb-4"> */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
            <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
              <h1 className="text-2xl uw:text-4xl font-bold text-gray-900">Animation Studio</h1>
              <p className="text-sm uw:text-2xl text-gray-600">Control how reels move and feel</p>
            </div>
          </div>
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 p-2 gap-4"> */}
          <div className="flex flex-col p-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm uw:text-3xl font-semibold text-gray-800 flex items-center">
                  Experience Level
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'advanced', 'expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setExperienceLevel(level as any)}
                    className={`px-4 py-2 rounded-lg uw:text-2xl text-sm font-medium transition-all duration-200 ${experienceLevel === level
                      ? 'bg-blue-600 text-white shadow-lg transform scale-102'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>

              <p className="text-xs uw:text-2xl text-gray-600 m-2">
                {experienceLevel === 'beginner' && "Essential controls only"}
                {experienceLevel === 'advanced' && "Advanced parameters and presets"}
                {experienceLevel === 'expert' && "Full technical control and debugging"}
              </p>
            </div>
            {/* Device Information */}
            {deviceOptimizations && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uw:text-3xl text-gray-800 flex items-center">
                    Device Optimization
                  </h3>
                  <button
                    onClick={() => setShowDevicePreview(!showDevicePreview)}
                    className="text-xs uw:text-2xl bg-blue-600 border hover:bg-blue-700 text-white px-2 py-1 uw:px-4 uw:py-2 rounded transition-colors"
                  >
                    {showDevicePreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs uw:text-2xl uw:gap-6">
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
                <h3 className="text-sm uw:text-3xl font-semibold text-gray-800 flex items-center">
                  {/* <Zap className="w-4 h-4 mr-2" /> */}
                  Quick Presets
                </h3>
                {experienceLevel !== 'beginner' && (
                  <span className="text-xs uw:text-2xl text-gray-600 bg-gray-200 px-2 py-1 uw:px-4 uw:py-2 rounded-full">
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
                    className={`p-3 rounded-lg text-sm uw:text-2xl font-medium transition-all duration-200 border transform ${animationWorkspace.selectedPreset === preset.name
                      ? 'border-red-300 bg-red-50 '
                      : 'border-gray-200 bg-white hover:border-red-200'
                      }`}
                    title={preset.description}
                  >
                    <div className="flex items-center justify-between">
                      <span>{preset.name.charAt(0).toUpperCase() + preset.name.slice(1)}</span>
                      {animationWorkspace.selectedPreset === preset.name && (
                        <CheckCircle className="w-4 h-4 uw:h-8 uw:w-8 text-red-600" />
                      )}
                    </div>
                    <div className="text-xs uw:text-xl opacity-75 mt-1 text-left">{preset.description}</div>
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
                  <h3 className="text-lg font-bold text-gray-900 uw:text-3xl">Spin Behavior</h3>
                  <p className="text-sm uw:text-xl text-gray-600">Control how reels move and feel</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-6">
              {/* Animation Speed */}
              <div className="p-3 space-y-3 border bg-gray-50 rounded-md ">
                <div className="flex items-center justify-between">
                  <label className="text-sm uw:text-2xl font-semibold text-gray-800 flex items-center">
                    Speed: {animationControls.speed}x

                  </label>
                  <div className="text-xs uw:text-2xl text-gray-500">
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
                  className="w-full  h-3 bg-gradient-to-r from-gray-200 via-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer slider-modern"
                  data-track="speed-slider"
                />
                <div className="flex uw:text-2xl justify-between text-xs text-gray-500">
                  <span>0.1x (Slow)</span>
                  <span>3.0x (Fast)</span>
                </div>
              </div>

              {/* Motion Blur */}
              <div className="p-3 space-y-3 border bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <label className="text-sm uw:text-2xl font-semibold text-gray-800 flex items-center">
                    Motion blur amount: {animationControls.blurIntensity}px
                  </label>
                  {animationControls.blurIntensity > 15 && (
                    <span className="text-xs uw:text-2xl text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
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
                <div className="flex justify-between uw:text-2xl text-xs text-gray-500">
                  <span>0px (Sharp)</span>
                  <span>20px (Intense)</span>
                </div>
              </div>

              {/* Easing with Visual Picker */}
              <div className="p-3 space-y-3 border bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <label className="text-sm uw:text-2xl position-relative font-semibold text-gray-800">Easing Style:</label>
                  <select
                    value={animationControls.easing}
                    onChange={(e) => updateEasing(e.target.value)}
                    className="w-52 overflow-hidden uw:w-80 bg-white border-2 uw:text-xl position-absoute border-gray-200 text-gray-800 rounded-lg px-3 py-2 transition-all option-w-120"
                  >
                    <option value="back.out">🎯 Back Out (Overshoot)</option>
                    <option value="bounce.out">🏀 Bounce Out (Playful)</option>
                    <option value="elastic.out">🪀 Elastic Out (Stretchy)</option>
                    <option value="power2.out">⚡ Power2 Out (Smooth)</option>
                    <option value="power2.in">📈 Power2 In (Accelerate)</option>
                    <option value="power2.inOut">🌊 Power2 InOut (Balanced)</option>
                    <option value="linear">📏 Linear (Constant)</option>
                  </select>
                  <div className="text-xs uw:text-2xl text-gray-500">
                    Current: <strong>{animationControls.easing}</strong>
                  </div>

                </div>



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
                <p className="text-xs text-gray-600 uw:text-2xl mt-2 text-center">
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
                    <h3 className="text-lg font-bold uw:text-2xl text-gray-900">Reel Visibility</h3>
                    <p className="text-sm uw:text-2xl text-gray-600">Show/hide parts of the slot machine</p>
                  </div>
                </div>
                <div className="text-xs uw:text-xl text-gray-500">
                  Masked: {maskControls.perReelEnabled.filter(enabled => enabled).length} / 5 reels
                </div>
              </div>


              <div className="p-3 space-y-3 ">
                {/* Clip symbols toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${maskControls.enabled
                  ? 'bg-green-50 border-green-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maskControls.enabled}
                      onChange={toggleMasking}
                      className="mr-3 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <span className="text-base font-medium uw:text-2xl text-gray-800">Enable reel visibility</span>
                      <p className="text-sm uw:text-2xl text-gray-600">Control which reels are visible during spinning</p>
                    </div>
                  </div>
                  {maskControls.enabled && (
                    <div className="text-green-600 text-sm uw:text-2xl font-medium">✓ Active</div>
                  )}
                </div>

                {/* Show debug toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${maskControls.debugVisible
                  ? 'bg-purple-50 border-purple-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maskControls.debugVisible}
                      onChange={toggleDebugVisible}
                      className="mr-3 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-base uw:text-2xl font-medium text-gray-800">Show debug</span>
                      <p className="text-sm uw:text-2xl text-gray-600">Highlight hidden reel areas with red overlay</p>
                    </div>
                  </div>
                  {maskControls.debugVisible && (
                    <div className="text-purple-600 uw:text-2xl text-sm font-medium">✓ Active</div>
                  )}
                </div>

                {/* Per-reel control */}
                <div className="space-y-3 border bg-gray-50 p-2 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-800 uw:text-2xl">Per-reel control:</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {maskControls.perReelEnabled.map((enabled, index) => (
                      <div key={index} className="text-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleReelMask(index)}
                          className="mb-2 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="text-xs uw:text-2xl font-medium text-gray-700">Reel {index + 1}</div>
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
                  <h3 className="text-lg font-bold uw:text-2xl text-gray-900">Visual Polish</h3>
                  <p className="text-sm text-gray-600 uw:text-2xl">Add professional effects</p>
                </div>
              </div>
              <div className="text-xs uw:text-2xl text-gray-500">
                Active: {Object.entries(visualEffects).filter(([_, enabled]) => enabled).length} / 3
              </div>
            </div>

            <div className="p-3 space-y-4">
              {/* Effect toggles with descriptions */}
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${visualEffects.spinBlur
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={visualEffects.spinBlur}
                      onChange={() => toggleVisualEffect('spinBlur')}
                      className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-base uw:text-2xl font-medium text-gray-800">Motion blur</span>
                      <p className="text-sm uw:text-xl text-gray-600">Blur effect during spinning</p>
                    </div>
                  </div>
                  {visualEffects.spinBlur && (
                    <div className="text-blue-600 uw:text-2xl text-sm font-medium">✓ Active</div>
                  )}
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${visualEffects.glowEffects
                  ? 'bg-yellow-50 border-yellow-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={visualEffects.glowEffects}
                      onChange={() => toggleVisualEffect('glowEffects')}
                      className="mr-3 w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <div>
                      <span className="text-base font-medium uw:text-2xl text-gray-800">Glow effects</span>
                      <p className="text-sm text-gray-600 uw:text-2xl">Enhanced brightness during spinning</p>
                    </div>
                  </div>
                  {visualEffects.glowEffects && (
                    <div className="text-yellow-600 uw:text-2xl text-sm font-medium">✓ Active</div>
                  )}
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${visualEffects.screenShake
                  ? 'bg-red-50 border-red-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={visualEffects.screenShake}
                      onChange={() => toggleVisualEffect('screenShake')}
                      className="mr-3 w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <div>
                      <span className="text-base font-medium uw:text-2xl text-gray-800">Screen shake</span>
                      <p className="text-sm text-gray-600">Subtle camera shake during spinning</p>
                    </div>
                  </div>
                  {visualEffects.screenShake && (
                    <div className="text-red-600 uw:text-2xl text-sm font-medium">✓ Active</div>
                  )}
                </div>

                <div className="flex uw:text-2xl items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled={true}
                      className="mr-3 w-5 h-5 text-gray-400 rounded cursor-not-allowed"
                    />
                    <div>
                      <span className="text-base font-medium text-gray-500 uw:text-2xl">Particles</span>
                      <p className="text-sm text-gray-400 uw:text-2xl">Coming soon...</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-500 px-2 uw:text-2xl py-1 rounded-full">Soon</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Enhanced Styles */}
      <style>{`
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