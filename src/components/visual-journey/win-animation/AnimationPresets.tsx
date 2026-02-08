import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Flame, 
  Wind,
  Check,
  InfoIcon
} from 'lucide-react';
import { PreviewReelConfig, WinResultType } from './PreviewReelController';

// Type for animation presets
export type AnimationPreset = 'classic' | 'dynamic' | 'elegant' | 'dramatic' | 'playful';

// Preset configuration interface
export interface AnimationPresetConfig {
  name: string;
  description: string;
  icon: React.ReactNode;
  thumbnail: string;
  config: Partial<PreviewReelConfig>;
  gsapEase: string;
}

interface AnimationPresetsProps {
  onSelectPreset: (preset: AnimationPreset, config: Partial<PreviewReelConfig>) => void;
  onPreviewPreset: (preset: AnimationPreset) => void;
  selectedPreset: AnimationPreset | null;
  onResultTypeChange: (resultType: WinResultType) => void;
  resultType: WinResultType;
}

const AnimationPresets: React.FC<AnimationPresetsProps> = ({
  onSelectPreset,
  onPreviewPreset,
  selectedPreset,
  onResultTypeChange,
  resultType
}) => {
  const [hoverPreset, setHoverPreset] = useState<AnimationPreset | null>(null);
  
  // Define preset configurations
  const presets: Record<AnimationPreset, AnimationPresetConfig> = {
    classic: {
      name: 'Classic',
      description: 'Traditional Vegas-style with moderate speed and subtle bounce',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      thumbnail: '/assets/effects/lightning_particle1.png',
      gsapEase: 'power1.out',
      config: {
        spinDuration: 2.0,
        reelStartDelay: 0.2,
        bounceDistance: 15,
        bounceDuration: 0.5,
        easeInDuration: 0.4,
        easeOutDuration: 0.6,
        blurAmount: 8,
        symbolBorderColor: '#404040',
        symbolBackgroundColor: '#222222',
        enableAnticipation: false,
        anticipationDuration: 0,
        anticipationShakeIntensity: 0,
        symbolColors: ['#FFC107', '#F44336', '#2196F3', '#4CAF50', '#9C27B0']
      }
    },
    dynamic: {
      name: 'Dynamic',
      description: 'Fast-paced with quick reel stops and strong bounce effect',
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      thumbnail: '/assets/effects/lightning_particle2.png',
      gsapEase: 'back.out(1.7)',
      config: {
        spinDuration: 1.2,
        reelStartDelay: 0.1,
        bounceDistance: 30,
        bounceDuration: 0.7,
        easeInDuration: 0.2,
        easeOutDuration: 0.4,
        blurAmount: 15,
        symbolBorderColor: '#1976D2',
        symbolBackgroundColor: '#0D47A1',
        enableAnticipation: true,
        anticipationDuration: 0.8,
        anticipationShakeIntensity: 8,
        symbolColors: ['#29B6F6', '#2196F3', '#1976D2', '#0D47A1', '#01579B']
      }
    },
    elegant: {
      name: 'Elegant',
      description: 'Smooth and refined animations with gentle easing and subtle effects',
      icon: <Crown className="w-5 h-5 text-purple-500" />,
      thumbnail: '/assets/effects/lightning_particle3.png',
      gsapEase: 'sine.inOut',
      config: {
        spinDuration: 2.8,
        reelStartDelay: 0.15,
        bounceDistance: 5,
        bounceDuration: 0.8,
        easeInDuration: 0.6,
        easeOutDuration: 0.9,
        blurAmount: 5,
        symbolBorderColor: '#7B1FA2',
        symbolBackgroundColor: '#4A148C',
        enableAnticipation: false,
        anticipationDuration: 0,
        anticipationShakeIntensity: 0,
        symbolColors: ['#CE93D8', '#BA68C8', '#AB47BC', '#8E24AA', '#6A1B9A']
      }
    },
    dramatic: {
      name: 'Dramatic',
      description: 'Intense animations with anticipation and powerful effects',
      icon: <Flame className="w-5 h-5 text-red-500" />,
      thumbnail: '/assets/effects/lightning_particle4.png',
      gsapEase: 'power4.out',
      config: {
        spinDuration: 3.0,
        reelStartDelay: 0.25,
        bounceDistance: 25,
        bounceDuration: 0.6,
        easeInDuration: 0.3,
        easeOutDuration: 1.0,
        blurAmount: 20,
        symbolBorderColor: '#C62828',
        symbolBackgroundColor: '#B71C1C',
        enableAnticipation: true,
        anticipationDuration: 1.5,
        anticipationShakeIntensity: 15,
        symbolColors: ['#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336']
      }
    },
    playful: {
      name: 'Playful',
      description: 'Bouncy and fun animations with exaggerated effects',
      icon: <Wind className="w-5 h-5 text-green-500" />,
      thumbnail: '/assets/effects/lightning_particle1.png',
      gsapEase: 'elastic.out(1, 0.3)',
      config: {
        spinDuration: 2.2,
        reelStartDelay: 0.12,
        bounceDistance: 40,
        bounceDuration: 1.0,
        easeInDuration: 0.3,
        easeOutDuration: 0.5,
        blurAmount: 12,
        symbolBorderColor: '#2E7D32',
        symbolBackgroundColor: '#1B5E20',
        enableAnticipation: true,
        anticipationDuration: 0.6,
        anticipationShakeIntensity: 10,
        symbolColors: ['#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#388E3C']
      }
    }
  };
  
  // Handle preset selection
  const handleSelectPreset = (preset: AnimationPreset) => {
    onSelectPreset(preset, presets[preset].config);
  };
  
  // Handle preset preview
  const handlePreviewPreset = (preset: AnimationPreset) => {
    onPreviewPreset(preset);
  };
  
  // Define win types to display
  const winTypes: { value: WinResultType, label: string, color: string }[] = [
    { value: 'no-win', label: 'No Win', color: 'bg-gray-600' },
    { value: 'small-win', label: 'Small Win', color: 'bg-green-600' },
    { value: 'medium-win', label: 'Medium Win', color: 'bg-blue-600' },
    { value: 'big-win', label: 'Big Win', color: 'bg-purple-600' },
    { value: 'mega-win', label: 'Mega Win', color: 'bg-amber-600' },
    { value: 'feature-trigger', label: 'Feature', color: 'bg-pink-600' }
  ];
  
  return (
    <div className="space-y-8">
      {/* Preset carousel */}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white flex items-center">
          <Sparkles className="mr-2 text-blue-400" size={20} />
          Animation Presets
        </h3>
        
        <p className="text-gray-300 mb-6">
          Select a preset animation pack to instantly apply professionally designed animations to your game.
          Each preset includes optimized timing, effects, and colors for different game styles.
        </p>
        
        {/* Preset grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(presets).map(([key, preset]) => {
            const presetKey = key as AnimationPreset;
            const isSelected = selectedPreset === presetKey;
            const isHovered = hoverPreset === presetKey;
            
            return (
              <div 
                key={presetKey} 
                className={`
                  relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:shadow-md'}
                `}
                onClick={() => handleSelectPreset(presetKey)}
                onMouseEnter={() => setHoverPreset(presetKey)}
                onMouseLeave={() => setHoverPreset(null)}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 pointer-events-none"/>
                
                {/* Thumbnail (using preset icon as placeholder) */}
                <div className={`
                  aspect-square flex items-center justify-center bg-gray-800 
                  ${isSelected ? 'bg-opacity-80' : 'bg-opacity-50'}
                `}>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {preset.icon}
                  </div>
                </div>
                
                {/* Preset info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="font-bold text-white flex items-center">
                    {preset.icon && <span className="mr-1.5">{preset.icon}</span>}
                    {preset.name}
                  </h4>
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                
                {/* Preview button */}
                {(isSelected || isHovered) && (
                  <button
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-medium
                      shadow-lg transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewPreset(presetKey);
                    }}
                  >
                    Preview
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Selected preset details */}
        {selectedPreset && (
          <motion.div 
            className="mt-6 bg-gray-700 bg-opacity-50 rounded-lg p-4 border border-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {presets[selectedPreset].icon}
              </div>
              <div className="flex-grow">
                <h4 className="text-white font-bold text-lg">
                  {presets[selectedPreset].name} Preset
                </h4>
                <p className="text-gray-300 text-sm mt-1">
                  {presets[selectedPreset].description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Win type selector */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white flex items-center">
          <Zap className="mr-2 text-yellow-400" size={18} />
          Animation Preview Type
        </h3>
        
        <p className="text-gray-300 mb-4 text-sm">
          Select what type of win to preview when testing your animation settings.
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {winTypes.map(type => (
            <button
              key={type.value}
              className={`
                py-2 px-3 rounded text-sm 
                ${resultType === type.value 
                  ? `${type.color} text-white shadow-md` 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
              onClick={() => onResultTypeChange(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-800 text-sm flex items-start">
          <InfoIcon className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-blue-200">
            For best results, test your animations with different win types to ensure they scale 
            appropriately from small wins to mega wins.
          </p>
        </div>
      </div>
      
      {selectedPreset && (
        <div className="p-5 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
          <h4 className="font-bold text-white text-md mb-2">Professional Insight:</h4>
          <p className="text-blue-100 text-sm">
            The {presets[selectedPreset].name} preset uses {presets[selectedPreset].gsapEase} easing for smooth, 
            professional animations. This preset works particularly well for 
            {selectedPreset === 'classic' && " traditional slot games with a Vegas feel."}
            {selectedPreset === 'dynamic' && " high-energy, action-packed games with frequent wins."}
            {selectedPreset === 'elegant' && " premium, luxury-themed slots with sophisticated visuals."}
            {selectedPreset === 'dramatic' && " high-volatility games with big win potential."}
            {selectedPreset === 'playful' && " casual, lighthearted games targeting new players."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimationPresets;