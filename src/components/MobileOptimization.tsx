import React from 'react';
import { Smartphone, RotateCcw, Vibrate, Smartphone as TouchIcon, Smile, Monitor } from 'lucide-react';
import { useGameStore } from '../store';

const MobileOptimization: React.FC = () => {
  const { config, updateConfig, currentStep, setStep } = useGameStore();
  
  // Navigation helpers
  const goToNextStep = () => {
    setStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPreviousStep = () => {
    setStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const mobileConfig = config.mobile || {
    orientationMode: 'both',
    touchControls: {
      swipeToSpin: true,
      gestureControls: true,
      vibrateOnWin: true
    },
    screenAdaptation: {
      smallScreenLayout: true,
      largeButtonsForTouch: true
    }
  };

  const handleMobileChange = (key: string, value: any) => {
    updateConfig({
      mobile: {
        ...mobileConfig,
        [key]: value
      }
    });
  };

  const handleTouchControlChange = (key: string, value: boolean) => {
    updateConfig({
      mobile: {
        ...mobileConfig,
        touchControls: {
          ...mobileConfig.touchControls,
          [key]: value
        }
      }
    });
  };

  const handleScreenAdaptationChange = (key: string, value: boolean) => {
    updateConfig({
      mobile: {
        ...mobileConfig,
        screenAdaptation: {
          ...mobileConfig.screenAdaptation,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="bg-white/50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-[#172B4D] mb-2 flex items-center">
          <Smartphone className="mr-2 w-6 h-6 text-[#0052CC]" />
          Mobile Optimization
        </h2>
        <p className="text-[#5E6C84] mb-6">Configure how your slot game works on mobile devices</p>
        
        {/* Orientation Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Screen Orientation</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Select which orientations your slot game will support on mobile devices
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'portrait', name: 'Portrait Only', icon: Smartphone, description: 'Game will only work in portrait mode (vertical)' },
              { id: 'landscape', name: 'Landscape Only', icon: Monitor, description: 'Game will only work in landscape mode (horizontal)' },
              { id: 'both', name: 'Both Orientations', icon: RotateCcw, description: 'Game will adapt to both portrait and landscape modes' }
            ].map((orientation) => (
              <div
                key={orientation.id}
                onClick={() => handleMobileChange('orientationMode', orientation.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  mobileConfig.orientationMode === orientation.id
                    ? 'border-[#0052CC] bg-[#DEEBFF]'
                    : 'border-[#DFE1E6] hover:border-[#B3BAC5]'
                }`}
              >
                <div className="flex items-center mb-2">
                  <orientation.icon className={`mr-2 w-5 h-5 ${
                    mobileConfig.orientationMode === orientation.id
                      ? 'text-[#0052CC]'
                      : 'text-[#6B778C]'
                  }`} />
                  <span className="font-medium">{orientation.name}</span>
                </div>
                <p className="text-xs text-[#5E6C84]">{orientation.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Touch Controls */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Touch Controls</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Configure mobile-specific touch interactions
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-[#DFE1E6]">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="swipeToSpin"
                    checked={mobileConfig.touchControls.swipeToSpin}
                    onChange={(e) => handleTouchControlChange('swipeToSpin', e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="swipeToSpin" className="font-medium text-[#172B4D] flex items-center">
                    <TouchIcon className="w-4 h-4 mr-2" />
                    Swipe to Spin
                  </label>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Allow players to swipe up on the reels to trigger a spin
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-[#DFE1E6]">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="gestureControls"
                    checked={mobileConfig.touchControls.gestureControls}
                    onChange={(e) => handleTouchControlChange('gestureControls', e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="gestureControls" className="font-medium text-[#172B4D] flex items-center">
                    <TouchIcon className="w-4 h-4 mr-2" />
                    Enhanced Gesture Controls
                  </label>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Enable pinch-to-zoom for paytable, swipe for menu navigation, and other touch gestures
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-[#DFE1E6]">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="vibrateOnWin"
                    checked={mobileConfig.touchControls.vibrateOnWin}
                    onChange={(e) => handleTouchControlChange('vibrateOnWin', e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="vibrateOnWin" className="font-medium text-[#172B4D] flex items-center">
                    <Vibrate className="w-4 h-4 mr-2" />
                    Vibration Feedback
                  </label>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Provide haptic feedback on wins and special events (where supported)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Screen Adaptation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Screen Size Adaptation</h3>
          <p className="text-sm text-[#5E6C84] mb-4">
            Configure how your game adapts to different mobile screen sizes
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-[#DFE1E6]">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="smallScreenLayout"
                    checked={mobileConfig.screenAdaptation.smallScreenLayout}
                    onChange={(e) => handleScreenAdaptationChange('smallScreenLayout', e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="smallScreenLayout" className="font-medium text-[#172B4D] flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Small Screen Optimization
                  </label>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Automatically adapt layout for smaller screen sizes by rearranging UI elements
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white rounded-lg border border-[#DFE1E6]">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    id="largeButtonsForTouch"
                    checked={mobileConfig.screenAdaptation.largeButtonsForTouch}
                    onChange={(e) => handleScreenAdaptationChange('largeButtonsForTouch', e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="largeButtonsForTouch" className="font-medium text-[#172B4D] flex items-center">
                    <Smile className="w-4 h-4 mr-2" />
                    Touch-Friendly Controls
                  </label>
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Increase button sizes and spacing for better touch interaction on mobile devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Mobile Preview</h3>
          
          <div className="bg-[#F4F5F7] rounded-lg p-6 text-center">
            <div className="mx-auto relative mb-4" style={{ width: '220px', height: '440px' }}>
              <div className="absolute inset-0 border-8 border-[#172B4D] rounded-3xl bg-white overflow-hidden">
                <div className="absolute top-8 left-0 right-0 h-6 bg-[#172B4D] flex items-center justify-center">
                  <div className="w-16 h-4 bg-[#0F1A2E] rounded-full"></div>
                </div>
                
                <div className="absolute top-14 left-0 right-0 bottom-4 p-2">
                  <div className="bg-[#DEEBFF] rounded-lg w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Mobile Game Skeleton */}
                    <div className="text-[#0052CC] text-xl font-bold mb-2">SlotMaker AI</div>
                    
                    {/* Reels mockup */}
                    <div className="w-full px-2">
                      <div className={`grid ${mobileConfig.orientationMode === 'landscape' ? 'grid-cols-5 grid-rows-3' : 'grid-cols-3 grid-rows-5'} gap-1 mx-auto border-2 border-[#0052CC] rounded-lg bg-gradient-to-b from-[#2684FF] to-[#0052CC] p-1`}>
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div key={i} className="aspect-square bg-white rounded opacity-75"></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Controls mockup */}
                    <div className="w-full px-2 mt-2">
                      <div className="flex justify-between">
                        <div className="w-16 h-8 bg-[#0052CC] rounded-lg"></div>
                        <div className={`w-12 h-12 rounded-full bg-[#0052CC] ${mobileConfig.touchControls.swipeToSpin ? 'animate-pulse' : ''}`}></div>
                        <div className="w-16 h-8 bg-[#0052CC] rounded-lg"></div>
                      </div>
                    </div>
                    
                    {/* Gesture indicators */}
                    {mobileConfig.touchControls.gestureControls && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 border-2 border-[#0052CC] rounded-full animate-ping opacity-30"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[#5E6C84] text-sm">
              This preview shows a simplified representation of your mobile configuration
            </p>
          </div>
        </div>
        
        {/* Mobile-Specific Features */}
        <div>
          <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Additional Mobile Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F4F5F7] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Auto-Rotation Prompt
                </span>
                <div className="relative inline-block h-6 w-11">
                  <input 
                    type="checkbox" 
                    id="autoRotation"
                    className="peer h-0 w-0 opacity-0 absolute"
                    defaultChecked
                  />
                  <label 
                    htmlFor="autoRotation" 
                    className="absolute cursor-pointer inset-0 rounded-full bg-[#DFE1E6] transition-colors duration-300 peer-checked:bg-[#0052CC] before:content-[''] before:absolute before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-transform before:duration-300 peer-checked:before:translate-x-5"
                  ></label>
                </div>
              </div>
              <p className="text-xs text-[#5E6C84]">
                Suggest best orientation for optimal gameplay experience
              </p>
            </div>
            
            <div className="p-4 bg-[#F4F5F7] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center">
                  <Vibrate className="w-4 h-4 mr-2" />
                  Power-Saving Mode
                </span>
                <div className="relative inline-block h-6 w-11">
                  <input 
                    type="checkbox" 
                    id="powerSaving"
                    className="peer h-0 w-0 opacity-0 absolute"
                    defaultChecked
                  />
                  <label 
                    htmlFor="powerSaving" 
                    className="absolute cursor-pointer inset-0 rounded-full bg-[#DFE1E6] transition-colors duration-300 peer-checked:bg-[#0052CC] before:content-[''] before:absolute before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-transform before:duration-300 peer-checked:before:translate-x-5"
                  ></label>
                </div>
              </div>
              <p className="text-xs text-[#5E6C84]">
                Reduces animation complexity and effects to save battery
              </p>
            </div>
            
            <div className="p-4 bg-[#F4F5F7] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Offline Play Support
                </span>
                <div className="relative inline-block h-6 w-11">
                  <input 
                    type="checkbox" 
                    id="offlinePlay"
                    className="peer h-0 w-0 opacity-0 absolute"
                  />
                  <label 
                    htmlFor="offlinePlay" 
                    className="absolute cursor-pointer inset-0 rounded-full bg-[#DFE1E6] transition-colors duration-300 peer-checked:bg-[#0052CC] before:content-[''] before:absolute before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-transform before:duration-300 peer-checked:before:translate-x-5"
                  ></label>
                </div>
              </div>
              <p className="text-xs text-[#5E6C84]">
                Allow players to play in demo mode when offline
              </p>
            </div>
            
            <div className="p-4 bg-[#F4F5F7] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center">
                  <Monitor className="w-4 h-4 mr-2" />
                  Picture-in-Picture Mode
                </span>
                <div className="relative inline-block h-6 w-11">
                  <input 
                    type="checkbox" 
                    id="pipMode"
                    className="peer h-0 w-0 opacity-0 absolute"
                  />
                  <label 
                    htmlFor="pipMode" 
                    className="absolute cursor-pointer inset-0 rounded-full bg-[#DFE1E6] transition-colors duration-300 peer-checked:bg-[#0052CC] before:content-[''] before:absolute before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:rounded-full before:bg-white before:transition-transform before:duration-300 peer-checked:before:translate-x-5"
                  ></label>
                </div>
              </div>
              <p className="text-xs text-[#5E6C84]">
                Support for minimized gameplay while using other apps
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          onClick={goToNextStep}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MobileOptimization;