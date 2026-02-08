import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../store';
import { 
  Sliders, 
  ZoomIn, 
  Palette, 
  Clock, 
  Layers, 
  Save, 
  Rotate3d, 
  Sparkles
} from 'lucide-react';
import { PreviewReelConfig, DEFAULT_REEL_CONFIG, WinResultType } from './PreviewReelController';

interface AnimationControlsProps {
  config: Partial<PreviewReelConfig>;
  onConfigChange: (config: Partial<PreviewReelConfig>) => void;
  onResultTypeChange: (resultType: WinResultType) => void;
  onApplyAnimation: () => void;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  config,
  onConfigChange,
  onResultTypeChange,
  onApplyAnimation
}) => {
  // Combined configuration (defaults + custom settings)
  const [currentConfig, setCurrentConfig] = useState<PreviewReelConfig>({
    ...DEFAULT_REEL_CONFIG,
    ...config
  });
  
  // Selected win type
  const [resultType, setResultType] = useState<WinResultType>('medium-win');
  
  // UI state for sections
  const [activeSection, setActiveSection] = useState<string>('timing');
  
  // Update local state when props change
  useEffect(() => {
    setCurrentConfig({
      ...DEFAULT_REEL_CONFIG,
      ...config
    });
  }, [config]);
  
  // Handle numeric input changes
  const handleNumberChange = (key: keyof PreviewReelConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newConfig = { ...currentConfig, [key]: numValue };
      setCurrentConfig(newConfig);
      onConfigChange(newConfig);
    }
  };
  
  // Handle boolean input changes
  const handleBooleanChange = (key: keyof PreviewReelConfig, checked: boolean) => {
    const newConfig = { ...currentConfig, [key]: checked };
    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  // Handle color input changes
  const handleColorChange = (key: keyof PreviewReelConfig, value: string) => {
    const newConfig = { ...currentConfig, [key]: value };
    setCurrentConfig(newConfig);
    onConfigChange(newConfig);
  };
  
  // Handle win type selection
  const handleResultTypeChange = (type: WinResultType) => {
    setResultType(type);
    onResultTypeChange(type);
  };
  
  // Apply current animation settings
  const applyAnimation = () => {
    onApplyAnimation();
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white w-full">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Sliders className="mr-2" size={20} />
        Animation Controls
      </h3>
      
      {/* Section tabs */}
      <div className="flex mb-4 bg-gray-700 rounded overflow-hidden">
        <button 
          className={`flex-1 py-2 px-3 ${activeSection === 'timing' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
          onClick={() => setActiveSection('timing')}
        >
          <Clock className="inline mr-1" size={16} /> Timing
        </button>
        <button 
          className={`flex-1 py-2 px-3 ${activeSection === 'visual' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
          onClick={() => setActiveSection('visual')}
        >
          <Palette className="inline mr-1" size={16} /> Visual
        </button>
        <button 
          className={`flex-1 py-2 px-3 ${activeSection === 'effects' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
          onClick={() => setActiveSection('effects')}
        >
          <Sparkles className="inline mr-1" size={16} /> Effects
        </button>
        <button 
          className={`flex-1 py-2 px-3 ${activeSection === 'layout' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
          onClick={() => setActiveSection('layout')}
        >
          <Layers className="inline mr-1" size={16} /> Layout
        </button>
      </div>
      
      {/* Timing settings */}
      {activeSection === 'timing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Spin Duration (s)</label>
              <input 
                type="range" 
                min="0.5" 
                max="5" 
                step="0.1"
                value={currentConfig.spinDuration} 
                onChange={(e) => handleNumberChange('spinDuration', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0.5s</span>
                <span>{currentConfig.spinDuration}s</span>
                <span>5s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Reel Start Delay (s)</label>
              <input 
                type="range" 
                min="0" 
                max="0.5" 
                step="0.05"
                value={currentConfig.reelStartDelay} 
                onChange={(e) => handleNumberChange('reelStartDelay', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0s</span>
                <span>{currentConfig.reelStartDelay}s</span>
                <span>0.5s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bounce Duration (s)</label>
              <input 
                type="range" 
                min="0.1" 
                max="1.5" 
                step="0.1"
                value={currentConfig.bounceDuration} 
                onChange={(e) => handleNumberChange('bounceDuration', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0.1s</span>
                <span>{currentConfig.bounceDuration}s</span>
                <span>1.5s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ease In Duration (s)</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={currentConfig.easeInDuration} 
                onChange={(e) => handleNumberChange('easeInDuration', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0s</span>
                <span>{currentConfig.easeInDuration}s</span>
                <span>1s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ease Out Duration (s)</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={currentConfig.easeOutDuration} 
                onChange={(e) => handleNumberChange('easeOutDuration', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0s</span>
                <span>{currentConfig.easeOutDuration}s</span>
                <span>1s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Anticipation Duration (s)</label>
              <input 
                type="range" 
                min="0" 
                max="3" 
                step="0.1"
                value={currentConfig.anticipationDuration} 
                onChange={(e) => handleNumberChange('anticipationDuration', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0s</span>
                <span>{currentConfig.anticipationDuration}s</span>
                <span>3s</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Visual settings */}
      {activeSection === 'visual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Blur Amount</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={currentConfig.blurAmount} 
                onChange={(e) => handleNumberChange('blurAmount', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>{currentConfig.blurAmount}</span>
                <span>20</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bounce Distance (px)</label>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={currentConfig.bounceDistance} 
                onChange={(e) => handleNumberChange('bounceDistance', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0px</span>
                <span>{currentConfig.bounceDistance}px</span>
                <span>50px</span>
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Symbol Border Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={currentConfig.symbolBorderColor} 
                  onChange={(e) => handleColorChange('symbolBorderColor', e.target.value)}
                  className="h-8 w-8 rounded border border-gray-700"
                />
                <input 
                  type="text" 
                  value={currentConfig.symbolBorderColor} 
                  onChange={(e) => handleColorChange('symbolBorderColor', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24"
                />
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Symbol Background Color</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={currentConfig.symbolBackgroundColor} 
                  onChange={(e) => handleColorChange('symbolBackgroundColor', e.target.value)}
                  className="h-8 w-8 rounded border border-gray-700"
                />
                <input 
                  type="text" 
                  value={currentConfig.symbolBackgroundColor} 
                  onChange={(e) => handleColorChange('symbolBackgroundColor', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Effects settings */}
      {activeSection === 'effects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center text-sm font-medium mb-1">
                <input 
                  type="checkbox" 
                  checked={currentConfig.enableAnticipation} 
                  onChange={(e) => handleBooleanChange('enableAnticipation', e.target.checked)}
                  className="mr-2"
                />
                Enable Anticipation Effect
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Anticipation Shake Intensity</label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={currentConfig.anticipationShakeIntensity} 
                onChange={(e) => handleNumberChange('anticipationShakeIntensity', e.target.value)}
                className="w-full"
                disabled={!currentConfig.enableAnticipation}
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0</span>
                <span>{currentConfig.anticipationShakeIntensity}</span>
                <span>20</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Layout settings */}
      {activeSection === 'layout' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol Width (px)</label>
              <input 
                type="range" 
                min="50" 
                max="150" 
                step="5"
                value={currentConfig.symbolWidth} 
                onChange={(e) => handleNumberChange('symbolWidth', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>50px</span>
                <span>{currentConfig.symbolWidth}px</span>
                <span>150px</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Symbol Height (px)</label>
              <input 
                type="range" 
                min="50" 
                max="150" 
                step="5"
                value={currentConfig.symbolHeight} 
                onChange={(e) => handleNumberChange('symbolHeight', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>50px</span>
                <span>{currentConfig.symbolHeight}px</span>
                <span>150px</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Symbol Padding (px)</label>
              <input 
                type="range" 
                min="0" 
                max="30" 
                step="1"
                value={currentConfig.symbolPadding} 
                onChange={(e) => handleNumberChange('symbolPadding', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>0px</span>
                <span>{currentConfig.symbolPadding}px</span>
                <span>30px</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Win type and apply buttons */}
      <div className="mt-6 border-t border-gray-700 pt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Win Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['no-win', 'small-win', 'medium-win', 'big-win', 'mega-win', 'feature-trigger'] as WinResultType[]).map((type) => (
              <button
                key={type}
                className={`py-2 px-3 rounded text-sm ${
                  resultType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handleResultTypeChange(type)}
              >
                {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
        
        <button
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded flex items-center justify-center"
          onClick={applyAnimation}
        >
          <Rotate3d className="mr-2" size={18} />
          Apply Animation
        </button>
      </div>
    </div>
  );
};

export default AnimationControls;