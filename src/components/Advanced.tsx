import React from 'react';
import { useGameStore } from '../store';
import { Shield, Globe, Trophy, Clock, Palette, Sliders, Eye } from 'lucide-react';

export const Advanced: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const { advanced } = config;

  return (
    <div className="space-y-8">
      {/* UI Customization Section */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
          <Palette className="w-6 h-6 mr-2 text-purple-400" />
          UI Customization
        </h3>
        
        <div className="space-y-6">
          {/* Standard Button Colors */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4 flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-blue-400" />
              Standard Button Styling
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Primary Button Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Primary Button Color (Spin)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.uiCustomization?.primaryButtonColor || '#FFC107'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        primaryButtonColor: e.target.value
                      }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.uiCustomization?.primaryButtonColor || '#FFC107'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        primaryButtonColor: e.target.value
                      }
                    })}
                    className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              {/* Secondary Button Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Secondary Button Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.uiCustomization?.secondaryButtonColor || '#2196F3'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        secondaryButtonColor: e.target.value
                      }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.uiCustomization?.secondaryButtonColor || '#2196F3'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        secondaryButtonColor: e.target.value
                      }
                    })}
                    className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              {/* Button Style */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Button Style
                </label>
                <select
                  value={config.uiCustomization?.buttonStyle || 'rounded'}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      buttonStyle: e.target.value
                    }
                  })}
                  className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="rounded">Rounded</option>
                  <option value="circular">Circular</option>
                  <option value="square">Square</option>
                  <option value="hexagon">Hexagon</option>
                </select>
              </div>
              
              {/* Button Size */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Button Size
                </label>
                <select
                  value={config.uiCustomization?.buttonSize || 'medium'}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      buttonSize: e.target.value
                    }
                  })}
                  className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* UI Bar Customization */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-400" />
              UI Bar Appearance
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Bar Background Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  UI Bar Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.uiCustomization?.barBackgroundColor || '#000000'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        barBackgroundColor: e.target.value
                      }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.uiCustomization?.barBackgroundColor || '#000000'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        barBackgroundColor: e.target.value
                      }
                    })}
                    className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              {/* Bar Opacity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  UI Bar Opacity
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.uiCustomization?.barOpacity || 90}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        barOpacity: parseInt(e.target.value)
                      }
                    })}
                    className="flex-1"
                  />
                  <span className="text-slate-300 w-12 text-right">
                    {config.uiCustomization?.barOpacity || 90}%
                  </span>
                </div>
              </div>
              
              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.uiCustomization?.textColor || '#FFFFFF'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        textColor: e.target.value
                      }
                    })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.uiCustomization?.textColor || '#FFFFFF'}
                    onChange={(e) => updateConfig({
                      uiCustomization: {
                        ...config.uiCustomization,
                        textColor: e.target.value
                      }
                    })}
                    className="flex-1 bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              {/* Bar Height */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  UI Bar Height
                </label>
                <select
                  value={config.uiCustomization?.barHeight || 'standard'}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      barHeight: e.target.value
                    }
                  })}
                  className="w-full bg-slate-700 text-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="compact">Compact (60px)</option>
                  <option value="standard">Standard (80px)</option>
                  <option value="large">Large (100px)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Enable/Disable UI Elements */}
          <div>
            <h4 className="text-lg font-medium text-slate-300 mb-4">UI Elements Visibility</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.uiCustomization?.showBalance !== false}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      showBalance: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Show Balance</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.uiCustomization?.showWin !== false}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      showWin: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Show Win Amount</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.uiCustomization?.showBet !== false}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      showBet: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Show Bet Amount</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.uiCustomization?.showAutoplay !== false}
                  onChange={(e) => updateConfig({
                    uiCustomization: {
                      ...config.uiCustomization,
                      showAutoplay: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2 text-slate-300">Show Autoplay Button</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Social Features</h3>
        
        <div className="space-y-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={advanced?.social?.tournaments?.enabled}
                onChange={(e) => updateConfig({
                  advanced: {
                    ...config.advanced,
                    social: {
                      ...config.advanced?.social,
                      tournaments: {
                        ...config.advanced?.social?.tournaments,
                        enabled: e.target.checked
                      }
                    }
                  }
                })}
                className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="ml-2 text-slate-300">Enable Tournaments</span>
            </label>

            {advanced?.social?.tournaments?.enabled && (
              <div className="mt-4 pl-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tournament Types
                  </label>
                  <div className="space-y-2">
                    {['daily', 'weekly', 'monthly'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advanced?.social?.tournaments?.types?.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...(advanced?.social?.tournaments?.types || []), type]
                              : (advanced?.social?.tournaments?.types || []).filter(t => t !== type);
                            updateConfig({
                              advanced: {
                                ...config.advanced,
                                social: {
                                  ...config.advanced?.social,
                                  tournaments: {
                                    ...config.advanced?.social?.tournaments,
                                    types: newTypes
                                  }
                                }
                              }
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-slate-300 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Responsible Gaming</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bet Limits
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['daily', 'weekly', 'monthly'].map((period) => (
                <div key={period}>
                  <label className="block text-xs text-slate-400 mb-1 capitalize">
                    {period} Limit
                  </label>
                  <input
                    type="number"
                    value={advanced?.responsible?.betLimits?.[period] || 0}
                    onChange={(e) => updateConfig({
                      advanced: {
                        ...config.advanced,
                        responsible: {
                          ...config.advanced?.responsible,
                          betLimits: {
                            ...config.advanced?.responsible?.betLimits,
                            [period]: parseInt(e.target.value)
                          }
                        }
                      }
                    })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Limits
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={advanced?.responsible?.sessionLimits?.duration || 0}
                  onChange={(e) => updateConfig({
                    advanced: {
                      ...config.advanced,
                      responsible: {
                        ...config.advanced?.responsible,
                        sessionLimits: {
                          ...config.advanced?.responsible?.sessionLimits,
                          duration: parseInt(e.target.value)
                        }
                      }
                    }
                  })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Warning Interval (minutes)
                </label>
                <input
                  type="number"
                  value={advanced?.responsible?.sessionLimits?.warningInterval || 0}
                  onChange={(e) => updateConfig({
                    advanced: {
                      ...config.advanced,
                      responsible: {
                        ...config.advanced?.responsible,
                        sessionLimits: {
                          ...config.advanced?.responsible?.sessionLimits,
                          warningInterval: parseInt(e.target.value)
                        }
                      }
                    }
                  })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Localization</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Languages
            </label>
            <select
              multiple
              value={advanced?.localization?.languages || []}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                updateConfig({
                  advanced: {
                    ...config.advanced,
                    localization: {
                      ...config.advanced?.localization,
                      languages: options
                    }
                  }
                });
              }}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              size={5}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="it">Italian</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Currencies
            </label>
            <select
              multiple
              value={advanced?.localization?.currencies || []}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                updateConfig({
                  advanced: {
                    ...config.advanced,
                    localization: {
                      ...config.advanced?.localization,
                      currencies: options
                    }
                  }
                });
              }}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
              size={5}
            >
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="GBP">British Pound (GBP)</option>
              <option value="CAD">Canadian Dollar (CAD)</option>
              <option value="AUD">Australian Dollar (AUD)</option>
            </select>
          </div>
        </div>
      </div>
      {/* Reel Animation Settings */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold text-slate-200 mb-4">Reel Animation</h3>
        <div className="space-y-4">
          {/* Acceleration Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Acceleration Duration (s)
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={advanced?.animation?.accelerationDuration || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    accelerationDuration: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.accelerationDuration ?? 0}s
            </span>
          </div>
          {/* Constant-Speed Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Constant-Speed Duration (s)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={advanced?.animation?.constantSpeedDuration || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    constantSpeedDuration: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.constantSpeedDuration ?? 0}s
            </span>
          </div>
          {/* Deceleration Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Deceleration Duration (s)
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={advanced?.animation?.decelerationDuration || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    decelerationDuration: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.decelerationDuration ?? 0}s
            </span>
          </div>
          {/* Anticipation Pause & Offset */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Anticipation Pause (s)
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={advanced?.animation?.anticipationPauseDuration || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    anticipationPauseDuration: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.anticipationPauseDuration ?? 0}s
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Anticipation Offset (px)
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={advanced?.animation?.anticipationOffset || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    anticipationOffset: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.anticipationOffset ?? 0}px
            </span>
          </div>
          {/* Shake Amplitude & Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Shake Amplitude (px)
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={advanced?.animation?.shakeAmplitude || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    shakeAmplitude: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.shakeAmplitude ?? 0}px
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Shake Frequency
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={advanced?.animation?.shakeFrequency || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    shakeFrequency: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.shakeFrequency ?? 0}
            </span>
          </div>
          {/* Overshoot & Bounce */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Overshoot (px)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={advanced?.animation?.overshootPercentage || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    overshootPercentage: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.overshootPercentage ?? 0}px
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bounce Count
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={advanced?.animation?.bounceCount || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    bounceCount: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.bounceCount ?? 0}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Bounce Damping
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={advanced?.animation?.bounceDamping || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    bounceDamping: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.bounceDamping ?? 0}
            </span>
          </div>
          {/* Motion Blur */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Motion Blur Strength
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={advanced?.animation?.motionBlurStrength || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    motionBlurStrength: parseInt(e.target.value, 10)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.motionBlurStrength ?? 0}px
            </span>
          </div>
          {/* Easing Functions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Easing Function
            </label>
            <select
              value={advanced?.animation?.easingFunction || 'power2.inOut'}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    easingFunction: e.target.value
                  }
                }
              })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
            >
              {['linear','power1.in','power1.out','power1.inOut','power2.in','power2.out','power2.inOut','elastic.out(1,0.3)','back.out(1.7)','sine.inOut'].map(fn => (
                <option key={fn} value={fn}>{fn}</option>
              ))}
            </select>
          </div>
          {/* Symbol Scale & Flash */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Symbol Scale on Stop
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={advanced?.animation?.symbolScaleOnStop || 1}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    symbolScaleOnStop: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.symbolScaleOnStop ?? 1}x
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Flash Alpha on Stop
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={advanced?.animation?.flashAlpha || 0}
              onChange={(e) => updateConfig({
                advanced: {
                  ...config.advanced,
                  animation: {
                    ...config.advanced?.animation,
                    flashAlpha: parseFloat(e.target.value)
                  }
                }
              })}
              className="w-full"
            />
            <span className="text-slate-300">
              {advanced?.animation?.flashAlpha ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};