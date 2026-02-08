import React, { useState } from 'react';
import { Settings, Zap, FastForward, Gauge, SkipForward, ChevronLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useGameStore } from '../store';

const PlayerExperience: React.FC = () => {
  const { config, updateConfig, setStep, currentStep } = useGameStore();
  const [experienceStep, setExperienceStep] = useState(0);
  const totalExperienceSteps = 3;
  
  const playerConfig = config.playerExperience || {
    spinSpeed: 'normal',
    autospinOptions: [10, 25, 50, 100],
    defaultAutospin: 25,
    skipAnimations: false,
    bigWinThreshold: 30,
    megaWinThreshold: 100
  };

  const handlePlayerConfigChange = (key: string, value: any) => {
    updateConfig({
      playerExperience: {
        ...playerConfig,
        [key]: value
      }
    });
  };
  
  // Function to handle next experience step
  const nextExperienceStep = () => {
    if (experienceStep < totalExperienceSteps - 1) {
      setExperienceStep(experienceStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Complete the section and move to Localization
      completeExperienceSection();
    }
  };
  
  // Function to handle previous experience step
  const prevExperienceStep = () => {
    if (experienceStep > 0) {
      setExperienceStep(experienceStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Go back to Audio section
      setStep(currentStep - 1);
    }
  };
  
  // Function to complete the Player Experience section and move to Localization
  const completeExperienceSection = () => {
    // Always use direct navigation to ensure it works
    setStep(8); // Go to localization section (index 8)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Helper function to render navigation controls
  const renderNavigation = () => {
    const isLastStep = experienceStep === totalExperienceSteps - 1;
    
    return (
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevExperienceStep}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        
        {isLastStep ? (
          <button
            onClick={completeExperienceSection}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={nextExperienceStep}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };
  
  // Render different player experience configuration sections based on step
  const renderExperienceStepContent = () => {
    switch(experienceStep) {
      case 0: // Spin Speed and Animation Settings
        return (
          <section className="bg-white/50 p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#172B4D] mb-2 flex items-center">
              <Settings className="mr-2 w-6 h-6 text-[#0052CC]" />
              Game Speed Settings
            </h2>
            <p className="text-[#5E6C84] mb-6">Configure the pace and animation settings for gameplay</p>
            
            {/* Spin Speed Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Spin Speed</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'slow', name: 'Slow', icon: Gauge, description: 'Relaxed pace with full animations' },
                  { id: 'normal', name: 'Normal', icon: Gauge, description: 'Standard casino-style timing' },
                  { id: 'fast', name: 'Fast', icon: FastForward, description: 'Rapid spins with condensed animations' },
                  { id: 'turbo', name: 'Turbo', icon: Zap, description: 'Ultrafast with minimal animations' }
                ].map((speed) => (
                  <div
                    key={speed.id}
                    onClick={() => handlePlayerConfigChange('spinSpeed', speed.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      playerConfig.spinSpeed === speed.id
                        ? 'border-[#0052CC] bg-[#DEEBFF]'
                        : 'border-[#DFE1E6] hover:border-[#B3BAC5]'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <speed.icon className={`mr-2 w-5 h-5 ${
                        playerConfig.spinSpeed === speed.id
                          ? 'text-[#0052CC]'
                          : 'text-[#6B778C]'
                      }`} />
                      <span className="font-medium">{speed.name}</span>
                    </div>
                    <p className="text-xs text-[#5E6C84]">{speed.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Animation Skip Option */}
            <div className="mb-8">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="skipAnimations"
                  checked={playerConfig.skipAnimations}
                  onChange={(e) => handlePlayerConfigChange('skipAnimations', e.target.checked)}
                  className="w-4 h-4 text-[#0052CC] rounded focus:ring-[#0052CC]"
                />
                <label htmlFor="skipAnimations" className="font-medium flex items-center">
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Animations Option
                </label>
              </div>
              <p className="text-[#5E6C84] text-sm mt-1 ml-6">
                Gives players the option to skip win animations and special effects
              </p>
            </div>
            
            {/* Win Thresholds */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Win Celebration Thresholds</h3>
              <p className="text-sm text-[#5E6C84] mb-6">
                Configure when Big Win and Mega Win celebrations are triggered (multiplier of bet)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#172B4D] mb-2">Big Win Threshold (× bet)</h4>
                  <input
                    type="number"
                    value={playerConfig.bigWinThreshold}
                    onChange={(e) => handlePlayerConfigChange('bigWinThreshold', parseInt(e.target.value))}
                    min={10}
                    max={90}
                    className="w-full p-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Recommended: 20-50× bet
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#172B4D] mb-2">Mega Win Threshold (× bet)</h4>
                  <input
                    type="number"
                    value={playerConfig.megaWinThreshold}
                    onChange={(e) => handlePlayerConfigChange('megaWinThreshold', parseInt(e.target.value))}
                    min={50}
                    max={1000}
                    className="w-full p-3 border border-[#DFE1E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                  <p className="text-xs text-[#5E6C84] mt-1">
                    Recommended: 75-200× bet
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      case 1: // Autoplay Configuration
        return (
          <section className="bg-white/50 p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#172B4D] mb-2 flex items-center">
              <Settings className="mr-2 w-6 h-6 text-[#0052CC]" />
              Autoplay Configuration
            </h2>
            <p className="text-[#5E6C84] mb-6">Customize autoplay functionality for players</p>
            
            {/* Autoplay Configuration */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Autoplay Settings</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-[#172B4D] mb-2">Autoplay Options</h4>
                <p className="text-sm text-[#5E6C84] mb-4">Select which autoplay spin amounts to offer players</p>
                
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 20, 25, 50, 75, 100, 250, 500, 1000].map((amount) => {
                    const isSelected = playerConfig.autospinOptions.includes(amount);
                    
                    return (
                      <button
                        key={amount}
                        onClick={() => {
                          if (isSelected) {
                            // Remove from options
                            handlePlayerConfigChange(
                              'autospinOptions', 
                              playerConfig.autospinOptions.filter(a => a !== amount)
                            );
                          } else {
                            // Add to options
                            handlePlayerConfigChange(
                              'autospinOptions',
                              [...playerConfig.autospinOptions, amount].sort((a, b) => a - b)
                            );
                          }
                        }}
                        className={`px-3 py-1 rounded-lg ${
                          isSelected
                            ? 'bg-[#0052CC] text-white'
                            : 'bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6]'
                        }`}
                        disabled={isSelected && playerConfig.autospinOptions.length <= 1}
                      >
                        {amount}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-[#172B4D] mb-2">Default Autoplay Amount</h4>
                <p className="text-sm text-[#5E6C84] mb-4">
                  Select which amount should be pre-selected when a player opens autoplay
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {playerConfig.autospinOptions.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handlePlayerConfigChange('defaultAutospin', amount)}
                      className={`px-4 py-2 rounded-lg ${
                        playerConfig.defaultAutospin === amount
                          ? 'bg-[#0052CC] text-white'
                          : 'bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6]'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      case 2: // Bet Range Settings
        return (
          <section className="bg-white/50 p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-[#172B4D] mb-2 flex items-center">
              <Settings className="mr-2 w-6 h-6 text-[#0052CC]" />
              Bet Range Configuration
            </h2>
            <p className="text-[#5E6C84] mb-6">Configure betting options and denominations</p>
            
            {/* Bet Denominations */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#172B4D] mb-4">Bet Range Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-[#172B4D] mb-2">Minimum Bet</h4>
                  <div className="flex">
                    <span className="bg-[#F4F5F7] border border-r-0 border-[#DFE1E6] rounded-l-lg p-3">$</span>
                    <input
                      type="number"
                      value={config.bet?.min || 0.20}
                      onChange={(e) => updateConfig({
                        bet: {
                          ...config.bet,
                          min: parseFloat(e.target.value)
                        }
                      })}
                      step={0.05}
                      min={0.05}
                      className="w-full p-3 border border-[#DFE1E6] rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#172B4D] mb-2">Maximum Bet</h4>
                  <div className="flex">
                    <span className="bg-[#F4F5F7] border border-r-0 border-[#DFE1E6] rounded-l-lg p-3">$</span>
                    <input
                      type="number"
                      value={config.bet?.max || 100}
                      onChange={(e) => updateConfig({
                        bet: {
                          ...config.bet,
                          max: parseFloat(e.target.value)
                        }
                      })}
                      step={5}
                      min={5}
                      className="w-full p-3 border border-[#DFE1E6] rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-[#172B4D] mb-2">Bet Increment</h4>
                  <div className="flex">
                    <span className="bg-[#F4F5F7] border border-r-0 border-[#DFE1E6] rounded-l-lg p-3">$</span>
                    <input
                      type="number"
                      value={config.bet?.increment || 0.20}
                      onChange={(e) => updateConfig({
                        bet: {
                          ...config.bet,
                          increment: parseFloat(e.target.value)
                        }
                      })}
                      step={0.05}
                      min={0.05}
                      className="w-full p-3 border border-[#DFE1E6] rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>
                </div>
              </div>
              
              <h4 className="font-medium text-[#172B4D] mt-6 mb-2">Quick Bet Options</h4>
              <p className="text-sm text-[#5E6C84] mb-4">Select preset bet amounts to appear in quick selection menu</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[0.20, 0.50, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map((amount) => {
                  const betAmount = parseFloat(amount.toString());
                  const isSelected = config.bet?.quickOptions?.includes(betAmount);
                  
                  return (
                    <button
                      key={amount}
                      onClick={() => {
                        const currentOptions = config.bet?.quickOptions || [];
                        
                        if (isSelected) {
                          // Remove from options
                          updateConfig({
                            bet: {
                              ...config.bet,
                              quickOptions: currentOptions.filter(a => a !== betAmount)
                            }
                          });
                        } else {
                          // Add to options
                          updateConfig({
                            bet: {
                              ...config.bet,
                              quickOptions: [...currentOptions, betAmount].sort((a, b) => a - b)
                            }
                          });
                        }
                      }}
                      className={`px-3 py-2 rounded-lg ${
                        isSelected
                          ? 'bg-[#0052CC] text-white'
                          : 'bg-[#F4F5F7] text-[#172B4D] hover:bg-[#DFE1E6]'
                      }`}
                      disabled={isSelected && (config.bet?.quickOptions?.length || 0) <= 1}
                    >
                      ${amount}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="mb-6 bg-white/50 p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-700 font-medium">Player Experience Progress</span>
          <span className="text-sm text-gray-500">{experienceStep + 1} of {totalExperienceSteps}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${((experienceStep + 1) / totalExperienceSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Experience step content */}
      {renderExperienceStepContent()}
      
      {/* Navigation buttons */}
      {renderNavigation()}
    </div>
  );
};

export default PlayerExperience;