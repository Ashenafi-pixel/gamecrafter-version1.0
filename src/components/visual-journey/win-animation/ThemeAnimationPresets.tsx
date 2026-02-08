import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Flame, 
  Wind,
  Pyramid,
  Rocket,
  Leaf,
  Waves,
  MapPin,
  Coins,
  Candy,
  Palmtree,
  Skull,
  InfoIcon,
  Check
} from 'lucide-react';
import { PreviewReelConfig, WinResultType } from './PreviewReelController';
import { AnimationPreset, AnimationPresetConfig } from './AnimationPresets';

// Extend animation presets with theme-specific presets
export type ThemeAnimationPreset = AnimationPreset | 
  'egypt-gold' | 'egypt-pharaoh' | 
  'cosmic-nebula' | 'cosmic-alien' | 
  'forest-fairy' | 'forest-mystic' | 
  'ocean-treasure' | 'ocean-depths' | 
  'western-gold' | 'western-showdown' | 
  'dynasty-dragon' | 'dynasty-emperor' | 
  'candy-sugar' | 'candy-rainbow' | 
  'tropical-paradise' | 'tropical-sunset' | 
  'aztec-temple' | 'aztec-sacrifice';

// Interface for theme-specific animation presets
interface ThemeAnimationPresetsProps {
  onSelectPreset: (preset: ThemeAnimationPreset, config: Partial<PreviewReelConfig>) => void;
  onPreviewPreset: (preset: ThemeAnimationPreset) => void;
  selectedPreset: ThemeAnimationPreset | null;
  onResultTypeChange: (resultType: WinResultType) => void;
  resultType: WinResultType;
  themeId?: string;
  themeName?: string;
}

// Theme detection function
const getThemeCategory = (themeId?: string, themeName?: string): string | null => {
  if (!themeId && !themeName) return null;
  
  const themeText = (themeId || '') + ' ' + (themeName || '');
  const lowerText = themeText.toLowerCase();
  
  if (lowerText.includes('egypt')) return 'egypt';
  if (lowerText.includes('cosmic') || lowerText.includes('space')) return 'cosmic';
  if (lowerText.includes('forest') || lowerText.includes('enchant')) return 'forest';
  if (lowerText.includes('ocean') || lowerText.includes('sea')) return 'ocean';
  if (lowerText.includes('west')) return 'western';
  if (lowerText.includes('asian') || lowerText.includes('dynasty') || lowerText.includes('china')) return 'dynasty';
  if (lowerText.includes('candy')) return 'candy';
  if (lowerText.includes('tropical') || lowerText.includes('paradise')) return 'tropical';
  if (lowerText.includes('aztec')) return 'aztec';
  
  return null;
};

const ThemeAnimationPresets: React.FC<ThemeAnimationPresetsProps> = ({
  onSelectPreset,
  onPreviewPreset,
  selectedPreset,
  onResultTypeChange,
  resultType,
  themeId,
  themeName
}) => {
  const [hoverPreset, setHoverPreset] = useState<ThemeAnimationPreset | null>(null);
  
  // Get theme category
  const themeCategory = getThemeCategory(themeId, themeName);
  
  // Define win types to display
  const winTypes: { value: WinResultType, label: string, color: string }[] = [
    { value: 'no-win', label: 'No Win', color: 'bg-gray-600' },
    { value: 'small-win', label: 'Small Win', color: 'bg-green-600' },
    { value: 'medium-win', label: 'Medium Win', color: 'bg-blue-600' },
    { value: 'big-win', label: 'Big Win', color: 'bg-purple-600' },
    { value: 'mega-win', label: 'Mega Win', color: 'bg-amber-600' },
    { value: 'feature-trigger', label: 'Feature', color: 'bg-pink-600' }
  ];

  // Define base presets (common to all themes)
  const basePresets: Record<AnimationPreset, AnimationPresetConfig> = {
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
  
  // Theme-specific preset configurations
  const themePresets: Record<string, Record<string, AnimationPresetConfig>> = {
    // Ancient Egypt theme presets
    egypt: {
      'egypt-gold': {
        name: 'Pharaoh\'s Gold',
        description: 'Gleaming golden effects with hieroglyphic particles',
        icon: <Pyramid className="w-5 h-5 text-yellow-500" />,
        thumbnail: '/assets/effects/lightning_particle1.png',
        gsapEase: 'power2.out',
        config: {
          spinDuration: 2.5,
          reelStartDelay: 0.18,
          bounceDistance: 20,
          bounceDuration: 0.6,
          easeInDuration: 0.4,
          easeOutDuration: 0.7,
          blurAmount: 10,
          symbolBorderColor: '#D4AF37',
          symbolBackgroundColor: '#8B7D39',
          enableAnticipation: true,
          anticipationDuration: 1.0,
          anticipationShakeIntensity: 7,
          symbolColors: ['#FFD700', '#DAA520', '#B8860B', '#CD853F', '#A67C00']
        }
      },
      'egypt-pharaoh': {
        name: 'Eternal Pharaoh',
        description: 'Majestic animation style with royal elements and scarab motifs',
        icon: <Crown className="w-5 h-5 text-amber-700" />,
        thumbnail: '/assets/effects/lightning_particle3.png',
        gsapEase: 'power3.inOut',
        config: {
          spinDuration: 3.0,
          reelStartDelay: 0.22,
          bounceDistance: 18,
          bounceDuration: 0.8,
          easeInDuration: 0.5,
          easeOutDuration: 0.9,
          blurAmount: 12,
          symbolBorderColor: '#B8860B',
          symbolBackgroundColor: '#614700',
          enableAnticipation: true,
          anticipationDuration: 1.2,
          anticipationShakeIntensity: 9,
          symbolColors: ['#E6C200', '#CDA434', '#A67C00', '#8A6642', '#614700']
        }
      }
    },
    
    // Cosmic theme presets
    cosmic: {
      'cosmic-nebula': {
        name: 'Nebula Burst',
        description: 'Vibrant cosmic effects with expansive star bursts',
        icon: <Rocket className="w-5 h-5 text-purple-500" />,
        thumbnail: '/assets/effects/lightning_particle2.png',
        gsapEase: 'expo.out',
        config: {
          spinDuration: 1.8,
          reelStartDelay: 0.12,
          bounceDistance: 25,
          bounceDuration: 0.5,
          easeInDuration: 0.3,
          easeOutDuration: 0.6,
          blurAmount: 18,
          symbolBorderColor: '#6A0DAD',
          symbolBackgroundColor: '#4B0082',
          enableAnticipation: true,
          anticipationDuration: 0.9,
          anticipationShakeIntensity: 12,
          symbolColors: ['#9370DB', '#8A2BE2', '#9932CC', '#BA55D3', '#DA70D6']
        }
      },
      'cosmic-alien': {
        name: 'Alien Technology',
        description: 'Futuristic alien-tech style with digital glitches and energy pulses',
        icon: <Zap className="w-5 h-5 text-green-400" />,
        thumbnail: '/assets/effects/lightning_particle4.png',
        gsapEase: 'elastic.out(1.2, 0.4)',
        config: {
          spinDuration: 1.5,
          reelStartDelay: 0.08,
          bounceDistance: 35,
          bounceDuration: 0.4,
          easeInDuration: 0.2,
          easeOutDuration: 0.4,
          blurAmount: 25,
          symbolBorderColor: '#00FF00',
          symbolBackgroundColor: '#003300',
          enableAnticipation: true,
          anticipationDuration: 1.1,
          anticipationShakeIntensity: 18,
          symbolColors: ['#39FF14', '#00FF00', '#32CD32', '#00FA9A', '#00CED1']
        }
      }
    },
    
    // Enchanted Forest theme presets
    forest: {
      'forest-fairy': {
        name: 'Fairy Dust',
        description: 'Magical forest animation with sparkling dust and gentle movement',
        icon: <Leaf className="w-5 h-5 text-green-400" />,
        thumbnail: '/assets/effects/lightning_particle1.png',
        gsapEase: 'sine.inOut',
        config: {
          spinDuration: 2.4,
          reelStartDelay: 0.15,
          bounceDistance: 12,
          bounceDuration: 0.9,
          easeInDuration: 0.5,
          easeOutDuration: 0.8,
          blurAmount: 7,
          symbolBorderColor: '#228B22',
          symbolBackgroundColor: '#006400',
          enableAnticipation: false,
          anticipationDuration: 0,
          anticipationShakeIntensity: 0,
          symbolColors: ['#98FB98', '#90EE90', '#3CB371', '#2E8B57', '#006400']
        }
      },
      'forest-mystic': {
        name: 'Mystic Woods',
        description: 'Enchanted animation with magical runes and forest spirit elements',
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        thumbnail: '/assets/effects/lightning_particle3.png',
        gsapEase: 'circ.out',
        config: {
          spinDuration: 2.7,
          reelStartDelay: 0.17,
          bounceDistance: 10,
          bounceDuration: 1.0,
          easeInDuration: 0.6,
          easeOutDuration: 1.1,
          blurAmount: 9,
          symbolBorderColor: '#4B0082',
          symbolBackgroundColor: '#228B22',
          enableAnticipation: true,
          anticipationDuration: 0.7,
          anticipationShakeIntensity: 5,
          symbolColors: ['#DDA0DD', '#9370DB', '#8A2BE2', '#9932CC', '#4B0082']
        }
      }
    },
    
    // Ocean theme presets
    ocean: {
      'ocean-treasure': {
        name: 'Sunken Treasure',
        description: 'Underwater treasure discovery with bubble effects and golden glow',
        icon: <Coins className="w-5 h-5 text-yellow-500" />,
        thumbnail: '/assets/effects/lightning_particle2.png',
        gsapEase: 'back.out(1.2)',
        config: {
          spinDuration: 2.2,
          reelStartDelay: 0.14,
          bounceDistance: 20,
          bounceDuration: 0.7,
          easeInDuration: 0.4,
          easeOutDuration: 0.7,
          blurAmount: 10,
          symbolBorderColor: '#4682B4',
          symbolBackgroundColor: '#104E8B',
          enableAnticipation: true,
          anticipationDuration: 0.8,
          anticipationShakeIntensity: 6,
          symbolColors: ['#B0E0E6', '#ADD8E6', '#87CEEB', '#4682B4', '#104E8B']
        }
      },
      'ocean-depths': {
        name: 'Deep Ocean',
        description: 'Mysterious deep-sea animation with bioluminescent effects',
        icon: <Waves className="w-5 h-5 text-blue-400" />,
        thumbnail: '/assets/effects/lightning_particle4.png',
        gsapEase: 'sine.out',
        config: {
          spinDuration: 2.6,
          reelStartDelay: 0.16,
          bounceDistance: 15,
          bounceDuration: 0.9,
          easeInDuration: 0.5,
          easeOutDuration: 0.8,
          blurAmount: 12,
          symbolBorderColor: '#00008B',
          symbolBackgroundColor: '#000080',
          enableAnticipation: false,
          anticipationDuration: 0,
          anticipationShakeIntensity: 0,
          symbolColors: ['#6495ED', '#4169E1', '#0000CD', '#00008B', '#191970']
        }
      }
    },
    
    // Western theme presets
    western: {
      'western-gold': {
        name: 'Gold Rush',
        description: 'Wild west gold panning with dusty effects and nugget highlights',
        icon: <Coins className="w-5 h-5 text-yellow-600" />,
        thumbnail: '/assets/effects/lightning_particle1.png',
        gsapEase: 'power1.out',
        config: {
          spinDuration: 1.9,
          reelStartDelay: 0.13,
          bounceDistance: 22,
          bounceDuration: 0.5,
          easeInDuration: 0.3,
          easeOutDuration: 0.5,
          blurAmount: 14,
          symbolBorderColor: '#CD853F',
          symbolBackgroundColor: '#8B4513',
          enableAnticipation: true,
          anticipationDuration: 0.7,
          anticipationShakeIntensity: 10,
          symbolColors: ['#FFD700', '#DAA520', '#CD853F', '#A0522D', '#8B4513']
        }
      },
      'western-showdown': {
        name: 'Showdown at Noon',
        description: 'Dramatic western duel with tumbleweed and sunset effects',
        icon: <MapPin className="w-5 h-5 text-red-600" />,
        thumbnail: '/assets/effects/lightning_particle3.png',
        gsapEase: 'power3.inOut',
        config: {
          spinDuration: 2.3,
          reelStartDelay: 0.2,
          bounceDistance: 18,
          bounceDuration: 0.6,
          easeInDuration: 0.4,
          easeOutDuration: 0.7,
          blurAmount: 16,
          symbolBorderColor: '#A52A2A',
          symbolBackgroundColor: '#800000',
          enableAnticipation: true,
          anticipationDuration: 1.3,
          anticipationShakeIntensity: 12,
          symbolColors: ['#FF7F50', '#FF4500', '#A52A2A', '#8B0000', '#800000']
        }
      }
    },
    
    // Asian Dynasty theme presets
    dynasty: {
      'dynasty-dragon': {
        name: 'Dragon Dance',
        description: 'Vibrant dragon-themed animation with festive elements and coins',
        icon: <Flame className="w-5 h-5 text-red-500" />,
        thumbnail: '/assets/effects/lightning_particle2.png',
        gsapEase: 'back.out(1.5)',
        config: {
          spinDuration: 2.1,
          reelStartDelay: 0.12,
          bounceDistance: 25,
          bounceDuration: 0.6,
          easeInDuration: 0.3,
          easeOutDuration: 0.6,
          blurAmount: 15,
          symbolBorderColor: '#DC143C',
          symbolBackgroundColor: '#8B0000',
          enableAnticipation: true,
          anticipationDuration: 0.9,
          anticipationShakeIntensity: 11,
          symbolColors: ['#FF4500', '#FF0000', '#DC143C', '#B22222', '#8B0000']
        }
      },
      'dynasty-emperor': {
        name: 'Emperor\'s Fortune',
        description: 'Elegant imperial style with silk, jade and golden elements',
        icon: <Crown className="w-5 h-5 text-yellow-600" />,
        thumbnail: '/assets/effects/lightning_particle4.png',
        gsapEase: 'circ.out',
        config: {
          spinDuration: 2.5,
          reelStartDelay: 0.15,
          bounceDistance: 15,
          bounceDuration: 0.8,
          easeInDuration: 0.4,
          easeOutDuration: 0.7,
          blurAmount: 10,
          symbolBorderColor: '#FFD700',
          symbolBackgroundColor: '#006400',
          enableAnticipation: false,
          anticipationDuration: 0,
          anticipationShakeIntensity: 0,
          symbolColors: ['#FFD700', '#DAA520', '#006400', '#228B22', '#2E8B57']
        }
      }
    },
    
    // Candy Land theme presets
    candy: {
      'candy-sugar': {
        name: 'Sugar Rush',
        description: 'Sweet candy animation with bouncy movements and colorful effects',
        icon: <Candy className="w-5 h-5 text-pink-500" />,
        thumbnail: '/assets/effects/lightning_particle1.png',
        gsapEase: 'elastic.out(1, 0.3)',
        config: {
          spinDuration: 1.7,
          reelStartDelay: 0.1,
          bounceDistance: 35,
          bounceDuration: 0.8,
          easeInDuration: 0.2,
          easeOutDuration: 0.5,
          blurAmount: 14,
          symbolBorderColor: '#FF69B4',
          symbolBackgroundColor: '#FF1493',
          enableAnticipation: true,
          anticipationDuration: 0.6,
          anticipationShakeIntensity: 14,
          symbolColors: ['#FF69B4', '#FF1493', '#C71585', '#DB7093', '#FFB6C1']
        }
      },
      'candy-rainbow': {
        name: 'Rainbow Swirl',
        description: 'Colorful rainbow animation with swirling candy effects',
        icon: <Wind className="w-5 h-5 text-indigo-400" />,
        thumbnail: '/assets/effects/lightning_particle3.png',
        gsapEase: 'bounce.out',
        config: {
          spinDuration: 2.0,
          reelStartDelay: 0.11,
          bounceDistance: 40,
          bounceDuration: 1.0,
          easeInDuration: 0.3,
          easeOutDuration: 0.6,
          blurAmount: 16,
          symbolBorderColor: '#9400D3',
          symbolBackgroundColor: '#4B0082',
          enableAnticipation: true,
          anticipationDuration: 0.7,
          anticipationShakeIntensity: 12,
          symbolColors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
        }
      }
    },
    
    // Tropical Paradise theme presets
    tropical: {
      'tropical-paradise': {
        name: 'Island Paradise',
        description: 'Relaxing tropical animation with gentle waves and palm effects',
        icon: <Palmtree className="w-5 h-5 text-green-500" />,
        thumbnail: '/assets/effects/lightning_particle2.png',
        gsapEase: 'sine.inOut',
        config: {
          spinDuration: 2.3,
          reelStartDelay: 0.14,
          bounceDistance: 15,
          bounceDuration: 0.7,
          easeInDuration: 0.4,
          easeOutDuration: 0.7,
          blurAmount: 8,
          symbolBorderColor: '#20B2AA',
          symbolBackgroundColor: '#008080',
          enableAnticipation: false,
          anticipationDuration: 0,
          anticipationShakeIntensity: 0,
          symbolColors: ['#00FFFF', '#40E0D0', '#20B2AA', '#008B8B', '#008080']
        }
      },
      'tropical-sunset': {
        name: 'Sunset Beach',
        description: 'Vibrant sunset-themed animation with golden hour lighting',
        icon: <Flame className="w-5 h-5 text-orange-500" />,
        thumbnail: '/assets/effects/lightning_particle4.png',
        gsapEase: 'power2.out',
        config: {
          spinDuration: 2.1,
          reelStartDelay: 0.15,
          bounceDistance: 20,
          bounceDuration: 0.6,
          easeInDuration: 0.4,
          easeOutDuration: 0.6,
          blurAmount: 12,
          symbolBorderColor: '#FF4500',
          symbolBackgroundColor: '#FF8C00',
          enableAnticipation: true,
          anticipationDuration: 0.8,
          anticipationShakeIntensity: 7,
          symbolColors: ['#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#FAFAD2']
        }
      }
    },
    
    // Ancient Aztec theme presets
    aztec: {
      'aztec-temple': {
        name: 'Temple of Gold',
        description: 'Mysterious temple animation with ancient gold and stone effects',
        icon: <Pyramid className="w-5 h-5 text-yellow-600" />,
        thumbnail: '/assets/effects/lightning_particle1.png',
        gsapEase: 'power3.out',
        config: {
          spinDuration: 2.4,
          reelStartDelay: 0.16,
          bounceDistance: 18,
          bounceDuration: 0.7,
          easeInDuration: 0.4,
          easeOutDuration: 0.8,
          blurAmount: 14,
          symbolBorderColor: '#B8860B',
          symbolBackgroundColor: '#704214',
          enableAnticipation: true,
          anticipationDuration: 1.1,
          anticipationShakeIntensity: 9,
          symbolColors: ['#FFD700', '#DAA520', '#B8860B', '#8B4513', '#704214']
        }
      },
      'aztec-sacrifice': {
        name: 'Sacred Ritual',
        description: 'Dramatic ritual-themed animation with flame and smoke effects',
        icon: <Skull className="w-5 h-5 text-red-600" />,
        thumbnail: '/assets/effects/lightning_particle3.png',
        gsapEase: 'power4.inOut',
        config: {
          spinDuration: 2.8,
          reelStartDelay: 0.2,
          bounceDistance: 22,
          bounceDuration: 0.6,
          easeInDuration: 0.5,
          easeOutDuration: 0.9,
          blurAmount: 18,
          symbolBorderColor: '#8B0000',
          symbolBackgroundColor: '#800000',
          enableAnticipation: true,
          anticipationDuration: 1.4,
          anticipationShakeIntensity: 14,
          symbolColors: ['#FF4500', '#FF0000', '#DC143C', '#8B0000', '#800000']
        }
      }
    }
  };
  
  // Create a combined presets object
  const allPresets: Record<ThemeAnimationPreset, AnimationPresetConfig> = {
    ...basePresets,
    ...Object.values(themePresets).reduce((acc, categoryPresets) => ({
      ...acc,
      ...categoryPresets
    }), {})
  };
  
  // Filter presets based on theme
  const getFilteredPresets = (): Record<ThemeAnimationPreset, AnimationPresetConfig> => {
    // Always include base presets
    const filtered: Record<string, AnimationPresetConfig> = { ...basePresets };
    
    // Add theme-specific presets if we have a matching theme
    if (themeCategory && themePresets[themeCategory]) {
      Object.assign(filtered, themePresets[themeCategory]);
    }
    
    return filtered as Record<ThemeAnimationPreset, AnimationPresetConfig>;
  };
  
  const filteredPresets = getFilteredPresets();
  
  // Handle preset selection
  const handleSelectPreset = (preset: ThemeAnimationPreset) => {
    onSelectPreset(preset, allPresets[preset].config);
  };
  
  // Handle preset preview
  const handlePreviewPreset = (preset: ThemeAnimationPreset) => {
    onPreviewPreset(preset);
  };
  
  return (
    <div className="space-y-8">
      {/* Header with theme detection */}
      {themeCategory && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex items-center">
            <div className="bg-blue-500 bg-opacity-20 p-2 rounded-lg mr-3">
              {themeCategory === 'egypt' && <Pyramid className="text-yellow-500" size={24} />}
              {themeCategory === 'cosmic' && <Rocket className="text-purple-500" size={24} />}
              {themeCategory === 'forest' && <Leaf className="text-green-500" size={24} />}
              {themeCategory === 'ocean' && <Waves className="text-blue-500" size={24} />}
              {themeCategory === 'western' && <MapPin className="text-red-600" size={24} />}
              {themeCategory === 'dynasty' && <Crown className="text-yellow-600" size={24} />}
              {themeCategory === 'candy' && <Candy className="text-pink-500" size={24} />}
              {themeCategory === 'tropical' && <Palmtree className="text-green-500" size={24} />}
              {themeCategory === 'aztec' && <Pyramid className="text-yellow-600" size={24} />}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                {themeName || themeId?.replace(/-/g, ' ')}
              </h2>
              <p className="text-gray-400 text-sm">
                Specialized animations available for this theme
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Preset carousel */}
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white flex items-center">
          <Sparkles className="mr-2 text-blue-400" size={20} />
          Win Animation Presets
        </h3>
        
        <p className="text-gray-300 mb-6">
          Select a preset animation pack to instantly apply professionally designed win animations to your game.
          {themeCategory && " Theme-specific presets are highlighted for enhanced visual harmony."}
        </p>
        
        {/* Preset grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(filteredPresets).map(([key, preset]) => {
            const presetKey = key as ThemeAnimationPreset;
            const isSelected = selectedPreset === presetKey;
            const isHovered = hoverPreset === presetKey;
            const isThemeSpecific = key.includes(themeCategory || '');
            
            return (
              <div 
                key={presetKey} 
                className={`
                  relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : 'hover:shadow-md'}
                  ${isThemeSpecific ? 'border-2 border-yellow-500 border-opacity-40' : ''}
                `}
                onClick={() => handleSelectPreset(presetKey)}
                onMouseEnter={() => setHoverPreset(presetKey)}
                onMouseLeave={() => setHoverPreset(null)}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 pointer-events-none"/>
                
                {/* Theme-specific indicator */}
                {isThemeSpecific && (
                  <div className="absolute top-2 left-2 bg-yellow-500 rounded-full p-1">
                    <Sparkles size={10} className="text-black" />
                  </div>
                )}
                
                {/* Thumbnail (using preset icon as placeholder) */}
                <div className={`
                  aspect-square flex items-center justify-center bg-gray-800 
                  ${isSelected ? 'bg-opacity-80' : 'bg-opacity-50'}
                  ${isThemeSpecific ? 'bg-yellow-900 bg-opacity-20' : ''}
                `}>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {preset.icon}
                  </div>
                </div>
                
                {/* Preset info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="font-bold text-white flex items-center text-sm">
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
        {selectedPreset && allPresets[selectedPreset] && (
          <motion.div 
            className="mt-6 bg-gray-700 bg-opacity-50 rounded-lg p-4 border border-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {allPresets[selectedPreset].icon}
              </div>
              <div className="flex-grow">
                <h4 className="text-white font-bold text-lg">
                  {allPresets[selectedPreset].name} Preset
                </h4>
                <p className="text-gray-300 text-sm mt-1">
                  {allPresets[selectedPreset].description}
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
      
      {/* Professional insight for selected preset */}
      {selectedPreset && allPresets[selectedPreset] && (
        <div className="p-5 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg">
          <h4 className="font-bold text-white text-md mb-2">Professional Insight:</h4>
          <p className="text-blue-100 text-sm">
            The {allPresets[selectedPreset].name} preset uses {allPresets[selectedPreset].gsapEase} easing for smooth, 
            professional animations. 
            {selectedPreset.includes(themeCategory || '') && 
              " This preset is specifically designed to complement your selected theme, enhancing the overall coherence of your game."
            }
            {!selectedPreset.includes(themeCategory || '') && 
              " While this is a general preset, it can work well with your current theme with minor adjustments."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ThemeAnimationPresets;