import React, { useState } from 'react';
import { 
  Layout, 
  Monitor, 
  Smartphone, 
  Play, 
  Pause, 
  Volume2, 
  Menu, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  FastForward, 
  RotateCw,
  Palette,
  Frame,
  Type,
  Sparkles,
  DollarSign,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useGameStore } from '../store';

const UIPreview: React.FC<{ orientation: 'portrait' | 'landscape', deviceType: 'desktop' | 'mobile' }> = ({ orientation, deviceType }) => {
  const { config } = useGameStore();
  const { ui } = config;

  const isModern = ui?.layout === 'modern';
  const isClassic = ui?.layout === 'classic';
  const isMinimal = ui?.layout === 'minimal';
  const spinPosition = ui?.buttons?.spin?.position || 'right';
  const spinStyle = ui?.buttons?.spin?.style || 'round';
  const betPosition = ui?.betControls?.position || 'left';
  const betStyle = ui?.betControls?.style || 'expanded';
  const winPosition = ui?.winDisplay?.position || 'top';

  const getLayoutStyles = () => {
    if (isModern) {
      return {
        controls: 'bg-black/30 backdrop-blur-sm',
        buttons: 'bg-gradient-to-r from-blue-500 to-purple-500',
        text: 'font-medium',
      };
    }
    if (isClassic) {
      return {
        controls: 'bg-gradient-to-b from-slate-800 to-slate-900',
        buttons: 'bg-gradient-to-b from-yellow-500 to-orange-600',
        text: 'font-bold',
      };
    }
    // Minimal
    return {
      controls: 'bg-black/10',
      buttons: 'bg-white/10 backdrop-blur-sm',
      text: 'font-light',
    };
  };

  const styles = getLayoutStyles();
  const isMobile = deviceType === 'mobile';
  const isPortrait = orientation === 'portrait';

  return (
    <div 
      className={`relative bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden transition-all duration-300 ${
        isMobile 
          ? isPortrait 
            ? 'w-64 aspect-[9/16]' 
            : 'w-96 aspect-[16/9]'
          : 'w-full aspect-video'
      }`}
      style={{ background: ui?.theme?.background || '#0F172A' }}
    >
      {/* Win Display */}
      {winPosition === 'top' && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 ${styles.controls} rounded-lg border border-white/10`}>
          <div className={`${isMobile ? 'text-lg' : 'text-2xl'} ${styles.text} text-white text-center`}>
            WIN: 1,250.00
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${isMobile ? 'w-full m-2' : 'w-2/3'} aspect-square bg-black/20 rounded-lg border border-white/10`} />
        
        {winPosition === 'center' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`px-8 py-4 ${styles.controls} rounded-lg border border-white/10`}>
              <div className={`${isMobile ? 'text-xl' : 'text-3xl'} ${styles.text} text-white text-center`}>
                BIG WIN: 1,250.00
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`absolute ${isMobile && isPortrait ? 'bottom-0 inset-x-0' : 'inset-x-0 bottom-0'} p-4`}>
        <div className={`${styles.controls} rounded-lg border border-white/10 p-3`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left Side - Bet Controls */}
            {betPosition === 'left' && (
              <div className={`flex ${betStyle === 'compact' ? 'flex-col' : 'items-center'} gap-2`}>
                <button className={`px-3 py-1.5 ${styles.buttons} rounded-lg text-white ${styles.text} text-sm`}>
                  Bet: 1.00
                </button>
                {betStyle === 'expanded' && !isMobile && (
                  <>
                    <button className={`p-1.5 ${styles.buttons} rounded-lg`}>
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button className={`p-1.5 ${styles.buttons} rounded-lg`}>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Center */}
            <div className="flex items-center gap-2">
              {ui?.buttons?.menu && !isMobile && (
                <button className={`p-2 ${styles.buttons} rounded-lg`}>
                  <Menu className="w-4 h-4 text-white" />
                </button>
              )}
              
              {spinPosition === 'center' && (
                <button className={`${spinStyle === 'round' ? 'rounded-full' : 'rounded-lg'} ${
                  isMobile ? 'p-4' : 'p-6'
                } ${styles.buttons}`}>
                  <Play className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} fill="white" />
                </button>
              )}

              {ui?.buttons?.sound && !isMobile && (
                <button className={`p-2 ${styles.buttons} rounded-lg`}>
                  <Volume2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {ui?.buttons?.turbo && !isMobile && (
                <button className={`p-2 ${styles.buttons} rounded-lg`}>
                  <FastForward className="w-4 h-4 text-white" />
                </button>
              )}
              
              {ui?.buttons?.autoplay && !isMobile && (
                <button className={`px-3 py-1.5 ${styles.buttons} rounded-lg text-white ${styles.text} text-sm`}>
                  Auto
                </button>
              )}

              {spinPosition === 'right' && (
                <button className={`${spinStyle === 'round' ? 'rounded-full' : 'rounded-lg'} ${
                  isMobile ? 'p-4' : 'p-6'
                } ${styles.buttons}`}>
                  <Play className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} fill="white" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Bar */}
          {isMobile && (
            <div className="flex items-center justify-around mt-3 pt-3 border-t border-white/10">
              <button className={`p-2 ${styles.buttons} rounded-lg`}>
                <Menu className="w-4 h-4 text-white" />
              </button>
              <button className={`p-2 ${styles.buttons} rounded-lg`}>
                <Volume2 className="w-4 h-4 text-white" />
              </button>
              <button className={`p-2 ${styles.buttons} rounded-lg`}>
                <FastForward className="w-4 h-4 text-white" />
              </button>
              <button className={`p-2 ${styles.buttons} rounded-lg`}>
                <Settings className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UIDesign: React.FC = () => {
  const { config, updateConfig, setStep, currentStep } = useGameStore();
  const { ui } = config;
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [designStep, setDesignStep] = useState(0);
  
  // UI Design has multiple sub-steps
  const totalDesignSteps = 4;
  
  // Function to handle next design step
  const nextDesignStep = () => {
    if (designStep < totalDesignSteps - 1) {
      setDesignStep(designStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Complete the section and move to Audio
      completeUISection();
    }
  };
  
  // Function to handle previous design step
  const prevDesignStep = () => {
    if (designStep > 0) {
      setDesignStep(designStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Go back to Symbols section
      setStep(currentStep - 1);
    }
  };
  
  // Function to complete the UI section and move to Audio
  const completeUISection = () => {
    // Always use direct navigation to ensure it works
    setStep(6); // Go to audio section (index 6)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Helper function to render navigation controls
  const renderNavigation = () => {
    const isLastStep = designStep === totalDesignSteps - 1;
    
    return (
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevDesignStep}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        
        {isLastStep ? (
          <button
            onClick={completeUISection}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={nextDesignStep}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // Base UI components to render based on design step
  const renderUIStepContent = () => {
    switch(designStep) {
      case 0: // Mode Selection and Preview
        return (
          <>
            <section className="bg-white/50 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                <Layout className="mr-2 w-6 h-6 text-blue-600" />
                UI Mode
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    id: 'standard', 
                    label: 'Standard UI',
                    description: 'Consistent look and feel across all games'
                  },
                  { 
                    id: 'tailored', 
                    label: 'Tailored UI',
                    description: 'Theme-specific customized interface'
                  }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => updateConfig({
                      ui: {
                        ...config.ui,
                        mode: mode.id as 'standard' | 'tailored'
                      }
                    })}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      ui?.mode === mode.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="text-gray-800 font-medium mb-1">{mode.label}</div>
                    <div className="text-sm text-gray-600">{mode.description}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white/50 p-6 rounded-xl shadow-sm mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Monitor className="mr-2 w-6 h-6 text-blue-600" />
                  UI Preview
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setDeviceType('desktop')}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                        deviceType === 'desktop' 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="text-sm">Desktop</span>
                    </button>
                    <button
                      onClick={() => setDeviceType('mobile')}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                        deviceType === 'mobile' 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-sm">Mobile</span>
                    </button>
                  </div>

                  {deviceType === 'mobile' && (
                    <button
                      onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 border border-gray-200">
                <UIPreview deviceType={deviceType} orientation={orientation} />
              </div>
            </section>
          </>
        );
      case 1: // Layout Style
        return (
          <section className="bg-white/50 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
              <Layout className="mr-2 w-6 h-6 text-blue-600" />
              Layout Style
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { 
                  id: 'modern', 
                  label: 'Modern',
                  description: 'Clean, minimal with glass morphism effects'
                },
                { 
                  id: 'classic', 
                  label: 'Classic',
                  description: 'Traditional slot machine style with bold elements'
                },
                { 
                  id: 'minimal', 
                  label: 'Minimal',
                  description: 'Ultra-clean design with focus on gameplay'
                }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateConfig({
                    ui: {
                      ...config.ui,
                      layout: style.id
                    }
                  })}
                  className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                    ui?.layout === style.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="text-gray-800 font-medium mb-1">{style.label}</div>
                  <div className="text-sm text-gray-600">{style.description}</div>
                </button>
              ))}
            </div>
            
            {/* Tailored UI Options */}
            {ui?.mode === 'tailored' && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                  <Palette className="mr-2 w-6 h-6 text-blue-600" />
                  Theme Customization
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frame Style
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'none', label: 'No Frame' },
                        { id: 'metal', label: 'Metal Frame' },
                        { id: 'stone', label: 'Stone Frame' },
                        { id: 'wood', label: 'Wood Frame' },
                        { id: 'custom', label: 'Custom Frame' }
                      ].map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => updateConfig({
                            ui: {
                              ...config.ui,
                              tailored: {
                                ...config.ui?.tailored,
                                frameStyle: frame.id as any
                              }
                            }
                          })}
                          className={`p-4 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 ${
                            ui?.tailored?.frameStyle === frame.id
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          <Frame className={`w-6 h-6 ${ui?.tailored?.frameStyle === frame.id ? 'text-blue-600' : 'text-gray-600'}`} />
                          <span className={ui?.tailored?.frameStyle === frame.id ? 'text-blue-700' : 'text-gray-700'}>{frame.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Button Style
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'default', label: 'Default Buttons' },
                        { id: 'themed', label: 'Themed Buttons' }
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => updateConfig({
                            ui: {
                              ...config.ui,
                              tailored: {
                                ...config.ui?.tailored,
                                buttonStyle: style.id as any
                              }
                            }
                          })}
                          className={`p-4 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                            ui?.tailored?.buttonStyle === style.id
                              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-purple-500/50'
                              : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <Palette className="w-5 h-5" />
                          <span className="text-slate-200">{style.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'overlayEffects', label: 'Enable Overlay Effects', icon: Sparkles },
                      { key: 'customFonts', label: 'Use Custom Fonts', icon: Type },
                      { key: 'animatedBackground', label: 'Animated Background', icon: Play }
                    ].map(({ key, label, icon: Icon }) => (
                      <label key={key} className="flex items-center p-3 bg-slate-900/50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={ui?.tailored?.[key]}
                          onChange={(e) => updateConfig({
                            ui: {
                              ...config.ui,
                              tailored: {
                                ...config.ui?.tailored,
                                [key]: e.target.checked
                              }
                            }
                          })}
                          className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                        />
                        <Icon className="w-4 h-4 ml-3 mr-2 text-slate-400" />
                        <span className="ml-2 text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      case 2: // Button Configuration
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white/50 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <Settings className="mr-2 w-6 h-6 text-blue-600" />
                Button Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spin Button
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Position</label>
                      <select
                        value={ui?.buttons?.spin?.position}
                        onChange={(e) => updateConfig({
                          ui: {
                            ...config.ui,
                            buttons: {
                              ...config.ui?.buttons,
                              spin: {
                                ...config.ui?.buttons?.spin,
                                position: e.target.value
                              }
                            }
                          }
                        })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                      >
                        <option value="right">Right</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Style</label>
                      <select
                        value={ui?.buttons?.spin?.style}
                        onChange={(e) => updateConfig({
                          ui: {
                            ...config.ui,
                            buttons: {
                              ...config.ui?.buttons,
                              spin: {
                                ...config.ui?.buttons?.spin,
                                style: e.target.value
                              }
                            }
                          }
                        })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                      >
                        <option value="round">Round</option>
                        <option value="rectangular">Rectangular</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'autoplay', label: 'Auto Play Button' },
                    { key: 'turbo', label: 'Turbo Mode Button' },
                    { key: 'sound', label: 'Sound Toggle' },
                    { key: 'menu', label: 'Menu Button' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ui?.buttons?.[key]}
                        onChange={(e) => updateConfig({
                          ui: {
                            ...config.ui,
                            buttons: {
                              ...config.ui?.buttons,
                              [key]: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white/50 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <DollarSign className="mr-2 w-6 h-6 text-blue-600" />
                Bet Controls
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={ui?.betControls?.position}
                    onChange={(e) => updateConfig({
                      ui: {
                        ...config.ui,
                        betControls: {
                          ...config.ui?.betControls,
                          position: e.target.value
                        }
                      }
                    })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                  >
                    <option value="left">Left</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display Style
                  </label>
                  <select
                    value={ui?.betControls?.style}
                    onChange={(e) => updateConfig({
                      ui: {
                        ...config.ui,
                        betControls: {
                          ...config.ui?.betControls,
                          style: e.target.value
                        }
                      }
                    })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                  >
                    <option value="compact">Compact</option>
                    <option value="expanded">Expanded</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ui?.betControls?.quickBets}
                      onChange={(e) => updateConfig({
                        ui: {
                          ...config.ui,
                          betControls: {
                            ...config.ui?.betControls,
                            quickBets: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-300">Quick Bet Buttons</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        );
      case 3: // Win Display and Theme Colors
        return (
          <>
            <section className="bg-white/50 p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <DollarSign className="mr-2 w-6 h-6 text-blue-600" />
                Win Display
              </h2>
              
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Position
                  </label>
                  <select
                    value={ui?.winDisplay?.position}
                    onChange={(e) => updateConfig({
                      ui: {
                        ...config.ui,
                        winDisplay: {
                          ...config.ui?.winDisplay,
                          position: e.target.value
                        }
                      }
                    })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center h-full">
                    <input
                      type="checkbox"
                      checked={ui?.winDisplay?.animation}
                      onChange={(e) => updateConfig({
                        ui: {
                          ...config.ui,
                          winDisplay: {
                            ...config.ui?.winDisplay,
                            animation: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-300">Win Animation</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center h-full">
                    <input
                      type="checkbox"
                      checked={ui?.winDisplay?.counter}
                      onChange={(e) => updateConfig({
                        ui: {
                          ...config.ui,
                          winDisplay: {
                            ...config.ui?.winDisplay,
                            counter: e.target.checked
                          }
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-slate-300">Win Counter</span>
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white/50 p-6 rounded-xl shadow-sm mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <Palette className="mr-2 w-6 h-6 text-blue-600" />
                Theme Colors
              </h2>
              
              <div className="grid grid-cols-4 gap-6">
                {[
                  { key: 'primary', label: 'Primary' },
                  { key: 'secondary', label: 'Secondary' },
                  { key: 'accent', label: 'Accent' },
                  { key: 'background', label: 'Background' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {label}
                    </label>
                    <input
                      type="color"
                      value={ui?.theme?.[key] || '#000000'}
                      onChange={(e) => updateConfig({
                        ui: {
                          ...config.ui,
                          theme: {
                            ...config.ui?.theme,
                            [key]: e.target.value
                          }
                        }
                      })}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-6 bg-white/50 p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-700 font-medium">UI Design Progress</span>
          <span className="text-sm text-gray-500">{designStep + 1} of {totalDesignSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${((designStep + 1) / totalDesignSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Always show preview */}
      <div className="bg-white/50 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Monitor className="mr-2 w-6 h-6 text-blue-600" />
            UI Preview
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setDeviceType('desktop')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                  deviceType === 'desktop' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceType('mobile')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                  deviceType === 'mobile' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">Mobile</span>
              </button>
            </div>

            {deviceType === 'mobile' && (
              <button
                onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 border border-gray-200">
          <UIPreview deviceType={deviceType} orientation={orientation} />
        </div>
      </div>
      
      {/* UI step content */}
      {renderUIStepContent()}
      
      {/* Navigation buttons */}
      {renderNavigation()}
    </div>
  );
};

export default UIDesign;