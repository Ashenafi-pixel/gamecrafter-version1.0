import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Settings, Monitor, CheckCircle, Eye, Gauge, Wand2,
  Image as ImageIcon, Loader2, X
} from 'lucide-react';
import { useGameStore } from '../../../store';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import type { WinMultiplierThresholds, WinTierCalculation } from '../../../types';
import { Button } from '../../Button';
// Extend window interface for PIXI instances (same as Step 6)
declare global {
  interface Window {
    PIXI_RENDERER_INSTANCE?: any;
    PIXI_GAME_ENGINE?: any;
    PIXI_APPS?: any[];
  }
}

// Win tier definitions following industry standards
type WinTier = 'small' | 'big' | 'mega' | 'super';

// Asset generation types
interface WinTitleAsset {
  id: string;
  type: WinTier | 'freeSpins' | 'bonusGame' | 'pickAndClick';
  text: string;
  customText?: string; // User can override default text
  customPrompt?: string; // Custom AI generation prompt
  style: 'elegant' | 'bold' | 'explosive' | 'minimal';
  fontFamily?: string;
  fontSize?: number;
  generated: boolean;
  generatedUrl?: string;
  isGenerating?: boolean;
  isEditing?: boolean;
  // Win title display configuration
  titleImageSize?: number; // 50-500% size multiplier for the generated title image
}

interface ParticleAsset {
  id: string;
  name: string;
  type: 'coins' | 'gems' | 'stars' | 'lightning' | 'confetti' | 'custom';
  customPrompt?: string; // Custom AI generation prompt
  size: 'small' | 'medium' | 'large';
  generated: boolean;
  generatedUrl?: string;
  isGenerating?: boolean;
  isEditing?: boolean;
  themeColor: string;
  winTiers?: WinTier[]; // Which win tiers this particle is assigned to (can be multiple)
  // Celebration configuration
  celebrationSize?: number; // 10-500% size multiplier for fountain
  fountainSpread?: number; // 10-400% how wide the fountain spreads
  particleSpeed?: number; // 20-500% speed multiplier
  particleDensity?: number; // 10-1000% density multiplier
  // Advanced fountain patterns
  fountainPattern?: 'classic-3' | 'fan-5' | 'wide-7' | 'single-vertical' | 'dual-side' | 'random-burst' | 'cascading';
  leftAngle?: number; // -90 to 0 degrees
  rightAngle?: number; // 0 to 90 degrees
  centerWeight?: number; // 0-100% how many particles go center vs sides
  fountainHeight?: number; // 50-200% how high particles shoot
  windEffect?: number; // 0-100% horizontal drift during flight
}

interface AssetGenerationState {
  winTitles: WinTitleAsset[];
  particles: ParticleAsset[];
  isGenerating: boolean;
  lastGenerated: Date | null;
}

interface WinTierConfig {
  multiplier: string;
  description: string;
  color: string;
  bgColor: string;
  effects: WinEffects;
}

interface WinEffects {
  particles: number;
  duration: number;
  intensity: number;
  screenShake: boolean;
  screenFlash: boolean;
  symbolZoom: number;
  glowEnabled: boolean;
  soundEnabled: boolean;
  // Betline celebration settings
  betlineEnabled: boolean;
  betlineStyle: 'glowing' | 'dashed' | 'solid' | 'pulsing';
  betlineWidth: number;
  betlineSpeed: number;
  betlineSequential: boolean; // Show lines one by one or all at once
}

// Betline configuration interface
interface BetlineConfig {
  enabled: boolean;
  style: 'glowing' | 'dashed' | 'solid' | 'pulsing';
  width: number; // 1-10px
  speed: number; // 0.5-3.0 seconds per line
  colors: string[]; // Different colors for different paylines
  sequential: boolean; // Show lines one by one
  pauseBetweenLines: number; // 0-2 seconds pause between sequential lines
  symbolHighlight: boolean; // Highlight symbols when line appears
  symbolHighlightDuration: number; // How long symbols stay highlighted
}

interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'premium' | 'mobile';
  effects: Record<WinTier, WinEffects>;
}

// Professional win tier configurations following industry standards
const WIN_TIERS: Record<WinTier, WinTierConfig> = {
  small: {
    multiplier: '1-5x',
    description: 'Small Win',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    effects: {
      particles: 30,
      duration: 1.5,
      intensity: 3,
      screenShake: false,
      screenFlash: false,
      symbolZoom: 1.1,
      glowEnabled: true,
      soundEnabled: true,
      betlineEnabled: true,
      betlineStyle: 'glowing',
      betlineWidth: 2,
      betlineSpeed: 1.2,
      betlineSequential: false
    }
  },
  big: {
    multiplier: '5-25x',
    description: 'Big Win',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    effects: {
      particles: 80,
      duration: 2.5,
      intensity: 6,
      screenShake: true,
      screenFlash: true,
      symbolZoom: 1.25,
      glowEnabled: true,
      soundEnabled: true,
      betlineEnabled: true,
      betlineStyle: 'solid',
      betlineWidth: 3,
      betlineSpeed: 1.0,
      betlineSequential: true
    }
  },
  mega: {
    multiplier: '25-100x',
    description: 'Mega Win',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    effects: {
      particles: 150,
      duration: 4.0,
      intensity: 8,
      screenShake: true,
      screenFlash: true,
      symbolZoom: 1.4,
      glowEnabled: true,
      soundEnabled: true,
      betlineEnabled: true,
      betlineStyle: 'glowing',
      betlineWidth: 4,
      betlineSpeed: 0.8,
      betlineSequential: true
    }
  },
  super: {
    multiplier: '100x+',
    description: 'Super Win',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    effects: {
      particles: 250,
      duration: 6.0,
      intensity: 10,
      screenShake: true,
      screenFlash: true,
      symbolZoom: 1.6,
      glowEnabled: true,
      soundEnabled: true,
      betlineEnabled: true,
      betlineStyle: 'pulsing',
      betlineWidth: 5,
      betlineSpeed: 0.6,
      betlineSequential: true
    }
  }
};

// Default betline configuration
const DEFAULT_BETLINE_CONFIG: BetlineConfig = {
  enabled: true,
  style: 'glowing',
  width: 1,
  speed: 1.0,
  colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
  sequential: true,
  pauseBetweenLines: 0.3,
  symbolHighlight: true,
  symbolHighlightDuration: 1.5
};

// Multiplier preset configurations for different casino strategies
interface MultiplierPreset {
  id: string;
  name: string;
  description: string;
  category: 'player-friendly' | 'balanced' | 'conservative' | 'premium';
  thresholds: WinMultiplierThresholds;
  useCases: string[];
}

const MULTIPLIER_PRESETS: MultiplierPreset[] = [
  {
    id: 'player-friendly',
    name: 'Player-Friendly',
    description: 'Frequent celebrations to keep players engaged',
    category: 'player-friendly',
    thresholds: { smallWin: 1, bigWin: 3, megaWin: 12, superWin: 50 },
    useCases: ['Casual games', 'Mobile slots', 'High retention focus']
  },
  {
    id: 'industry-standard',
    name: 'Industry Standard',
    description: 'Widely adopted industry standard thresholds',
    category: 'balanced',
    thresholds: { smallWin: 1, bigWin: 5, megaWin: 25, superWin: 100 },
    useCases: ['Most casino games', 'Balanced volatility', 'Proven performance']
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Rare but impactful win celebrations',
    category: 'conservative',
    thresholds: { smallWin: 1, bigWin: 10, megaWin: 50, superWin: 250 },
    useCases: ['High volatility games', 'Experienced players', 'Premium slots']
  },
  {
    id: 'high-roller',
    name: 'High Roller',
    description: 'Designed for big bet players and VIP rooms',
    category: 'premium',
    thresholds: { smallWin: 1, bigWin: 15, megaWin: 75, superWin: 500 },
    useCases: ['VIP games', 'High limit tables', 'Whale retention']
  },
  {
    id: 'mobile-optimized',
    name: 'Mobile Optimized',
    description: 'Quick celebrations for mobile gaming sessions',
    category: 'player-friendly',
    thresholds: { smallWin: 1, bigWin: 4, megaWin: 20, superWin: 80 },
    useCases: ['Mobile-first design', 'Short sessions', 'Quick dopamine hits']
  }
];

// Default industry standard win multiplier thresholds
const DEFAULT_WIN_THRESHOLDS: WinMultiplierThresholds = MULTIPLIER_PRESETS.find(p => p.id === 'industry-standard')!.thresholds;

// Professional animation presets
const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'classic-casino',
    name: 'Classic Casino',
    description: 'Traditional casino feel with elegant animations',
    category: 'classic',
    effects: {
      small: { ...WIN_TIERS.small.effects, intensity: 3 },
      big: { ...WIN_TIERS.big.effects, intensity: 5 },
      mega: { ...WIN_TIERS.mega.effects, intensity: 7 },
      super: { ...WIN_TIERS.super.effects, intensity: 9 }
    }
  },
  {
    id: 'modern-sparkle',
    name: 'Modern Sparkle',
    description: 'Contemporary style with particle effects',
    category: 'modern',
    effects: {
      small: { ...WIN_TIERS.small.effects, particles: 50 },
      big: { ...WIN_TIERS.big.effects, particles: 120 },
      mega: { ...WIN_TIERS.mega.effects, particles: 200 },
      super: { ...WIN_TIERS.super.effects, particles: 300 }
    }
  },
  {
    id: 'intense-action',
    name: 'Intense Action',
    description: 'High-energy animations for maximum impact',
    category: 'premium',
    effects: {
      small: { ...WIN_TIERS.small.effects, intensity: 5, screenShake: true },
      big: { ...WIN_TIERS.big.effects, intensity: 8, duration: 3.0 },
      mega: { ...WIN_TIERS.mega.effects, intensity: 10, duration: 5.0 },
      super: { ...WIN_TIERS.super.effects, intensity: 10, duration: 8.0 }
    }
  },
  {
    id: 'mobile-optimized',
    name: 'Mobile Optimized',
    description: 'Performance-optimized for mobile devices',
    category: 'mobile',
    effects: {
      small: { ...WIN_TIERS.small.effects, particles: 20, duration: 1.0 },
      big: { ...WIN_TIERS.big.effects, particles: 50, duration: 2.0 },
      mega: { ...WIN_TIERS.mega.effects, particles: 80, duration: 3.0 },
      super: { ...WIN_TIERS.super.effects, particles: 120, duration: 4.0 }
    }
  }
];

// Font options for title generation
const FONT_OPTIONS = [
  { id: 'impact', name: 'Impact', family: 'impact, sans-serif', description: 'Bold and powerful' },
  { id: 'arial-black', name: 'Arial Black', family: 'arial black, sans-serif', description: 'Strong and clean' },
  { id: 'times-bold', name: 'Times Bold', family: 'times new roman, serif', description: 'Classic and elegant' },
  { id: 'helvetica-bold', name: 'Helvetica Bold', family: 'helvetica neue, sans-serif', description: 'Modern and crisp' },
  { id: 'bebas', name: 'Bebas Neue', family: 'bebas neue, sans-serif', description: 'Tall and dramatic' },
  { id: 'oswald', name: 'Oswald', family: 'oswald, sans-serif', description: 'Industrial strength' }
];

// Style configurations with more detail
const TITLE_STYLES = {
  elegant: {
    name: 'Elegant',
    description: 'Sophisticated with gradients and subtle shadows',
    defaultFont: 'times-bold',
    defaultSize: 48,
    canvasWidth: 400,
    canvasHeight: 100
  },
  bold: {
    name: 'Bold',
    description: 'Strong and impactful design',
    defaultFont: 'arial-black',
    defaultSize: 56,
    canvasWidth: 500,
    canvasHeight: 120
  },
  explosive: {
    name: 'Explosive',
    description: 'Maximum impact with dramatic effects',
    defaultFont: 'impact',
    defaultSize: 64,
    canvasWidth: 600,
    canvasHeight: 150
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean and modern appearance',
    defaultFont: 'helvetica-bold',
    defaultSize: 42,
    canvasWidth: 350,
    canvasHeight: 80
  }
};

// Default win title assets to generate
const DEFAULT_WIN_TITLES: Omit<WinTitleAsset, 'generated' | 'generatedUrl' | 'isGenerating' | 'isEditing'>[] = [
  { id: 'big_win', type: 'big', text: 'BIG WIN!', style: 'bold', fontFamily: 'arial-black', fontSize: 56, titleImageSize: 120 },
  { id: 'mega_win', type: 'mega', text: 'MEGA WIN!!', style: 'explosive', fontFamily: 'impact', fontSize: 64, titleImageSize: 150 },
  { id: 'super_win', type: 'super', text: 'SUPER WIN!!!', style: 'explosive', fontFamily: 'impact', fontSize: 64, titleImageSize: 200 },
  { id: 'free_spins', type: 'freeSpins', text: 'FREE SPINS', style: 'bold', fontFamily: 'arial-black', fontSize: 56, titleImageSize: 120 },
  { id: 'bonus_game', type: 'bonusGame', text: 'BONUS GAME', style: 'bold', fontFamily: 'arial-black', fontSize: 56, titleImageSize: 120 },
  { id: 'pick_click', type: 'pickAndClick', text: 'PICK & CLICK', style: 'minimal', fontFamily: 'helvetica-bold', fontSize: 42, titleImageSize: 100 }
];

// Default particle assets to generate (only 3 by default, users can add more)
const DEFAULT_PARTICLES: Omit<ParticleAsset, 'generated' | 'generatedUrl' | 'isGenerating'>[] = [
  { id: 'gold_coin_small', name: 'Gold Coin', type: 'coins', size: 'small', themeColor: '#FFD700', winTiers: ['big', 'mega', 'super'] },
  { id: 'star_small', name: 'Star', type: 'stars', size: 'small', themeColor: '#FFFF00', winTiers: ['big', 'mega', 'super'] },
  { id: 'confetti_small', name: 'Confetti', type: 'confetti', size: 'small', themeColor: '#FF69B4', winTiers: ['big', 'mega', 'super'] }
];

// Asset generation utilities using GPT-Image-1
const generateTitlePrompt = (title: WinTitleAsset, themeColors: any): string => {
  // Get style configuration
  const styleConfig = TITLE_STYLES[title.style];
  const fontConfig = FONT_OPTIONS.find(f => f.id === title.fontFamily) || FONT_OPTIONS[0];

  // Get theme-appropriate colors
  const primaryColor = themeColors?.primary || '#FFD700';
  const secondaryColor = themeColors?.secondary || '#FF6B35';

  // Get text to display (custom text overrides default)
  const displayText = title.customText || title.text;

  // detailed prompt
  const basePrompt = `Create a professional slot machine win title text image with COMPLETELY TRANSPARENT BACKGROUND. The text should read "${displayText}" in ${fontConfig.name} font style.`;

  let styleDetails = '';
  switch (title.style) {
    case 'elegant':
      styleDetails = `Style: Elegant and sophisticated with gradient effects from ${primaryColor} to ${secondaryColor}. Add subtle shadows and refined typography. The text should have a luxurious, high-class casino appearance with smooth gradients and gentle glows.`;
      break;
    case 'bold':
      styleDetails = `Style: Bold and impactful design with strong ${primaryColor} coloring and ${secondaryColor} outline. The text should be powerful and attention-grabbing with heavy shadows and thick strokes. Make it look like a big casino win announcement.`;
      break;
    case 'explosive':
      styleDetails = `Style: Explosive and dramatic with maximum visual impact. Use radial gradients from white center to ${primaryColor} to ${secondaryColor}. Add multiple shadow layers, dramatic lighting effects, and make it look like the text is bursting with energy. This should convey maximum excitement and celebration.`;
      break;
    case 'minimal':
      styleDetails = `Style: Clean and modern minimal design with ${primaryColor} coloring. Use crisp edges, subtle shadows, and clean typography. The text should be elegant but not overwhelming, perfect for sophisticated gaming interfaces.`;
      break;
  }

  return `${basePrompt}

${styleDetails}

IMPORTANT REQUIREMENTS:
- The background must be fully transparent (alpha channel)
- Text should be centered and properly sized for a slot machine interface
- Use professional casino typography standards
- Ensure high contrast and readability
- The image should be suitable for overlay on slot machine reels
- Size should be optimized for ${styleConfig.canvasWidth}x${styleConfig.canvasHeight} display
- Font style should match ${fontConfig.description} characteristics`;
};

const generateParticlePrompt = (particle: ParticleAsset, themeColors: any): string => {
  const primaryColor = themeColors?.primary || '#FFD700';

  let particleDescription = '';
  switch (particle.type) {
    case 'coins':
      particleDescription = `a golden casino coin with detailed metallic finish and the color scheme incorporating ${particle.themeColor}. The coin should have traditional casino styling with circular shape, raised edges, and golden reflective surface.`;
      break;
    case 'gems':
      particleDescription = `a sparkling diamond gem with faceted surfaces reflecting light in ${particle.themeColor} hues. The gem should have realistic crystal facets, brilliant sparkles, and professional jewelry rendering.`;
      break;
    case 'stars':
      particleDescription = `a five-pointed star with golden ${particle.themeColor} coloring and magical sparkle effects. The star should have sharp points, gradient shading, and celestial glow.`;
      break;
    case 'lightning':
      particleDescription = `an electric lightning bolt in ${particle.themeColor} with bright energy effects and electrical crackling appearance. The lightning should have jagged edges, electric blue glow, and dynamic energy.`;
      break;
    case 'confetti':
      particleDescription = `colorful confetti pieces in ${particle.themeColor} with celebratory party effects. The confetti should include various shapes, bright colors, and festive appearance.`;
      break;
    default:
      particleDescription = `a casino particle effect in ${particle.themeColor} with ${particle.type} styling`;
  }

  const sizeSpecs = {
    small: '32x32 pixels',
    medium: '64x64 pixels',
    large: '128x128 pixels'
  };

  return `Create a professional slot machine particle effect asset with COMPLETELY TRANSPARENT BACKGROUND featuring ${particleDescription}

SPECIFICATIONS:
- Size: ${sizeSpecs[particle.size]} (${particle.size} particle)
- Background: Fully transparent (alpha channel)
- Style: High-quality casino game asset suitable for win animations
- Theme integration: Should complement ${primaryColor} color scheme
- Professional finish: Sharp details, proper lighting, and premium appearance
- Usage: Designed for slot machine win celebration particle systems

IMPORTANT: The asset should be perfect for overlay on slot machine interfaces with no background artifacts. Make it look like a premium casino game particle effect that would appear in professional slot games.`;
};

// Utility function to calculate win tier based on bet and win amounts
const calculateWinTier = (betAmount: number, winAmount: number, thresholds?: WinMultiplierThresholds): WinTierCalculation => {
  const multiplier = winAmount / betAmount;
  const currentThresholds = thresholds || DEFAULT_WIN_THRESHOLDS;

  let tier: 'small' | 'big' | 'mega' | 'super' = 'small';

  if (multiplier >= currentThresholds.superWin) {
    tier = 'super';
  } else if (multiplier >= currentThresholds.megaWin) {
    tier = 'mega';
  } else if (multiplier >= currentThresholds.bigWin) {
    tier = 'big';
  } else {
    tier = 'small';
  }

  return {
    betAmount,
    winAmount,
    multiplier,
    tier
  };
};

// Utility function to get multiplier range for a win tier
const getMultiplierRange = (tier: WinTier, thresholds?: WinMultiplierThresholds): string => {
  const currentThresholds = thresholds || DEFAULT_WIN_THRESHOLDS;

  switch (tier) {
    case 'small':
      return `${currentThresholds.smallWin}x - ${(currentThresholds.bigWin - 0.1).toFixed(1)}x`;
    case 'big':
      return `${currentThresholds.bigWin}x - ${(currentThresholds.megaWin - 0.1).toFixed(1)}x`;
    case 'mega':
      return `${currentThresholds.megaWin}x - ${(currentThresholds.superWin - 0.1).toFixed(1)}x`;
    case 'super':
      return `${currentThresholds.superWin}x+`;
    default:
      return '1x+';
  }
};

const Step8_WinAnimationWorkshop: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  // Asset generation state
  const [assetState, setAssetState] = useState<AssetGenerationState>({
    winTitles: DEFAULT_WIN_TITLES.map(title => ({ ...title, generated: false, isEditing: false })),
    particles: DEFAULT_PARTICLES.map(particle => ({ ...particle, generated: false })),
    isGenerating: false,
    lastGenerated: null
  });

  // Number images state
  const [numberImageStyle, setNumberImageStyle] = useState<string>('stone');
  const [manualPrompt, setManualPrompt] = useState<string>('');
  const [numberImagesState, setNumberImagesState] = useState<{
    isGenerating: boolean;
    images: Record<number | string, string>;
  }>({
    isGenerating: false,
    images: {}
  });

  // Betline configuration state
  const [betlineConfig, setBetlineConfig] = useState<BetlineConfig>({
    ...DEFAULT_BETLINE_CONFIG,
    ...(config.betlineConfig || {})
  });

  // Debug particles initialization
  React.useEffect(() => {
    console.log('[Step7] Particles initialized:', assetState.particles.map(p => ({
      id: p.id,
      name: p.name,
      winTiers: p.winTiers,
      hasWinTiers: !!p.winTiers
    })));
  }, []); // Run once on mount

  // Add new particle
  const addParticle = () => {
    console.log('[Step8] Adding new particle...');
    const newParticle: ParticleAsset = {
      id: `particle_${Date.now()}`,
      name: 'New Particle',
      type: 'custom',
      size: 'medium',
      themeColor: '#FFD700',
      generated: false,
      isGenerating: false,
      isEditing: false,
      winTiers: [], // Initialize with empty array
      // Default celebration settings
      celebrationSize: 100, // 100% normal size
      fountainSpread: 100, // 100% normal spread
      particleSpeed: 100, // 100% normal speed
      particleDensity: 100, // 100% normal density
      // Advanced fountain defaults
      fountainPattern: 'classic-3',
      leftAngle: -45,
      rightAngle: 45,
      centerWeight: 50,
      fountainHeight: 100,
      windEffect: 0
    };

    setAssetState(prev => {
      const updatedParticles = [...prev.particles, newParticle];
      console.log('[Step8] New particle added. Total particles:', updatedParticles.length);

      // Save new particle config to store
      updateConfig({
        particleConfigs: {
          ...config.particleConfigs,
          [newParticle.id]: newParticle
        }
      });

      return {
        ...prev,
        particles: updatedParticles
      };
    });
  };

  // Remove particle
  const removeParticle = (particleId: string) => {
    setAssetState(prev => ({
      ...prev,
      particles: prev.particles.filter(p => p.id !== particleId)
    }));

    // Remove from store
    const updatedParticleUrls = { ...config.generatedAssets?.particles };
    delete updatedParticleUrls[particleId];

    const updatedParticleConfigs = { ...config.particleConfigs };
    delete updatedParticleConfigs[particleId];

    updateConfig({
      generatedAssets: {
        ...config.generatedAssets,
        particles: updatedParticleUrls
      },
      particleConfigs: updatedParticleConfigs
    });
  };

  // Update particle properties
  const updateParticle = (particleId: string, updates: Partial<ParticleAsset>) => {
    setAssetState(prev => {
      const updatedParticles = prev.particles.map(p =>
        p.id === particleId ? { ...p, ...updates } : p
      );

      // Save updated particle config to store
      const updatedParticle = updatedParticles.find(p => p.id === particleId);
      if (updatedParticle) {
        updateConfig({
          particleConfigs: {
            ...config.particleConfigs,
            [particleId]: updatedParticle
          }
        });
      }

      return {
        ...prev,
        particles: updatedParticles
      };
    });
  };

  // Upload win title image
  const uploadWinTitle = (titleId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const updatedTitles = assetState.winTitles.map(t =>
            t.id === titleId ? {
              ...t,
              generated: true,
              generatedUrl: imageUrl,
              isGenerating: false
            } : t
          );

          setAssetState(prev => ({
            ...prev,
            winTitles: updatedTitles
          }));

          // Save to store
          const updatedTitle = updatedTitles.find(t => t.id === titleId);
          if (updatedTitle) {
            console.log('[Step8] Saving uploaded win title to config:', {
              titleId,
              hasImageUrl: !!imageUrl,
              imageUrlPreview: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'null',
              titleConfig: updatedTitle
            });

            updateConfig({
              generatedAssets: {
                ...config.generatedAssets,
                winTitles: {
                  ...config.generatedAssets?.winTitles,
                  [titleId]: imageUrl
                }
              },
              winTitleConfigs: {
                ...config.winTitleConfigs,
                [titleId]: updatedTitle
              }
            });

            console.log('[Step8] Win title saved successfully. Config updated.');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Delete win title (reset to not generated)
  const deleteWinTitle = (titleId: string) => {
    const updatedTitles = assetState.winTitles.map(t =>
      t.id === titleId ? {
        ...t,
        generated: false,
        generatedUrl: undefined,
        isGenerating: false
      } : t
    );

    setAssetState(prev => ({
      ...prev,
      winTitles: updatedTitles
    }));

    // Remove from store
    const updatedTitleUrls = { ...config.generatedAssets?.winTitles };
    delete updatedTitleUrls[titleId];

    const updatedTitleConfigs = { ...config.winTitleConfigs };
    delete updatedTitleConfigs[titleId];

    updateConfig({
      generatedAssets: {
        ...config.generatedAssets,
        winTitles: updatedTitleUrls
      },
      winTitleConfigs: updatedTitleConfigs
    });
  };

  // Win multiplier configuration state
  const [winThresholds, setWinThresholds] = useState<WinMultiplierThresholds>(
    config.winMultiplierThresholds || DEFAULT_WIN_THRESHOLDS
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>('industry-standard');
  const [isCustomThresholds, setIsCustomThresholds] = useState<boolean>(false);

  // Live calculator state
  const [calculatorBet, setCalculatorBet] = useState<number>(1);
  const [calculatorWin, setCalculatorWin] = useState<number>(10);

  // Animation state
  const [selectedTier, setSelectedTier] = useState<WinTier>('big');
  const [selectedPreset, setSelectedPreset] = useState<string>('classic-casino');
  const [isPlaying, setIsPlaying] = useState(false);

  // Win type selection for preview
  const [selectedWinType, setSelectedWinType] = useState<WinTier | 'freeSpins' | 'bonusGame' | 'pickAndClick'>('mega');
  const [customEffects, setCustomEffects] = useState<Record<WinTier, WinEffects>>(
    Object.fromEntries(
      Object.entries(WIN_TIERS).map(([tier, config]) => [tier, { ...config.effects }])
    ) as Record<WinTier, WinEffects>
  );

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    assetGeneration: true,
    presets: true,
    tierConfig: true,  // Win Multiplier Configuration should be open by default
    betlines: true,    // Betline Configuration should be open by default
    advanced: false,
    performance: false
  });
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [performanceMode, setPerformanceMode] = useState<'balanced' | 'performance' | 'quality'>('balanced');

  // Win title preview state
  const [previewingWinTitle, setPreviewingWinTitle] = useState<WinTitleAsset | null>(null);

  // Initialize from stored config
  useEffect(() => {
    if (config.winAnimations) {
      setCustomEffects(config.winAnimations);
    }
    if (config.betlineConfig) {
      setBetlineConfig(config.betlineConfig);
    }

    // Initialize multiplier preset selection
    if (config.winMultiplierThresholds) {
      // Check if current thresholds match any preset
      const matchingPreset = MULTIPLIER_PRESETS.find(preset =>
        preset.thresholds.smallWin === config.winMultiplierThresholds?.smallWin &&
        preset.thresholds.bigWin === config.winMultiplierThresholds?.bigWin &&
        preset.thresholds.megaWin === config.winMultiplierThresholds?.megaWin &&
        preset.thresholds.superWin === config.winMultiplierThresholds?.superWin
      );

      if (matchingPreset) {
        setSelectedPresetId(matchingPreset.id);
        setIsCustomThresholds(false);
      } else {
        setSelectedPresetId('custom');
        setIsCustomThresholds(true);
      }
    }

    // Load previously generated win titles from game store
    const winTitleConfigs = config.winTitleConfigs || {};
    const storedTitleUrls = config.generatedAssets?.winTitles || {};

    console.log('[Step7] Loading previously generated win titles from game store:', {
      titleUrls: storedTitleUrls,
      titleConfigs: Object.keys(winTitleConfigs)
    });

    setAssetState(prev => {
      // Restore default win titles with their stored data
      const restoredDefaultTitles = prev.winTitles.map(title => {
        const storedConfig = winTitleConfigs[title.id];
        const storedUrl = storedTitleUrls[title.id];

        if (storedConfig) {
          // Use full stored config if available
          return {
            ...title,
            ...storedConfig,
            generated: !!storedUrl,
            generatedUrl: storedUrl || storedConfig.generatedUrl,
            isGenerating: false,
            isEditing: false // Reset editing state
          };
        } else if (storedUrl) {
          // Fallback to just URL if no full config
          return {
            ...title,
            generated: true,
            generatedUrl: storedUrl,
            isGenerating: false
          };
        }
        return title;
      });

      // Add any custom win titles that aren't in defaults
      const defaultTitleIds = new Set(prev.winTitles.map(t => t.id));
      const customTitles: WinTitleAsset[] = [];

      Object.entries(winTitleConfigs).forEach(([titleId, storedConfig]: [string, any]) => {
        if (!defaultTitleIds.has(titleId) && storedConfig) {
          // This is a custom title that was added
          customTitles.push({
            ...storedConfig,
            generated: !!storedTitleUrls[titleId],
            generatedUrl: storedTitleUrls[titleId] || storedConfig.generatedUrl,
            isGenerating: false,
            isEditing: false
          });
        }
      });

      return {
        ...prev,
        winTitles: [...restoredDefaultTitles, ...customTitles]
      };
    });

    // Load previously generated particles from game store
    const particleConfigs = config.particleConfigs || {};
    const storedParticleUrls = config.generatedAssets?.particles || {};

    console.log('[Step7] Loading previously generated particles from game store:', {
      particleUrls: storedParticleUrls,
      particleConfigs: Object.keys(particleConfigs)
    });

    setAssetState(prev => {
      // First, restore default particles with their stored data
      const restoredDefaultParticles = prev.particles.map(particle => {
        const storedConfig = particleConfigs[particle.id];
        const storedUrl = storedParticleUrls[particle.id];

        if (storedConfig) {
          // Use full stored config if available
          return {
            ...particle,
            ...storedConfig,
            generated: !!storedUrl,
            generatedUrl: storedUrl || storedConfig.generatedUrl,
            isGenerating: false,
            isEditing: false // Reset editing state
          };
        } else if (storedUrl) {
          // Fallback to just URL if no full config
          return {
            ...particle,
            generated: true,
            generatedUrl: storedUrl,
            isGenerating: false
          };
        }
        return particle;
      });

      // Then, add any custom particles that aren't in defaults
      const defaultParticleIds = new Set(prev.particles.map(p => p.id));
      const customParticles: ParticleAsset[] = [];

      Object.entries(particleConfigs).forEach(([particleId, storedConfig]: [string, any]) => {
        if (!defaultParticleIds.has(particleId) && storedConfig) {
          // This is a custom particle that was added
          customParticles.push({
            ...storedConfig,
            generated: !!storedParticleUrls[particleId],
            generatedUrl: storedParticleUrls[particleId] || storedConfig.generatedUrl,
            isGenerating: false,
            isEditing: false
          });
        }
      });

      return {
        ...prev,
        particles: [...restoredDefaultParticles, ...customParticles]
      };
    });

    // Load previously generated number images from game store
    if (config.generatedAssets?.numberImages) {
      console.log('[Step8] Loading previously generated number images from game store:', config.generatedAssets.numberImages);
      setNumberImagesState(prev => ({
        ...prev,
        images: config.generatedAssets.numberImages || {}
      }));
    } else {
      // Clear images if no generated assets exist
      setNumberImagesState(prev => ({
        ...prev,
        images: {}
      }));
    }
  }, [config.winAnimations, config.betlineConfig, config.generatedAssets]);

  // Handle betline configuration changes
  const handleBetlineConfigChange = (newConfig: Partial<BetlineConfig>) => {
    const updatedConfig = { ...betlineConfig, ...newConfig };
    setBetlineConfig(updatedConfig);

    // Save to game store
    updateConfig({
      betlineConfig: updatedConfig
    });
  };

  // Clean up any existing animation overlays when Step 7 loads
  useEffect(() => {
    // Remove any leftover animation overlays from previous steps
    const existingOverlays = document.querySelectorAll('.win-animation-overlay');
    existingOverlays.forEach(overlay => {
      try {
        overlay.remove();
        console.log('[Step7] Cleaned up leftover animation overlay');
      } catch (error) {
        console.warn('[Step7] Error cleaning up overlay:', error);
      }
    });

    // Try to hide potential CSS logo elements
    setTimeout(() => {
      const rightPanel = document.querySelector('[data-testid="right-panel-step-6"]');
      if (rightPanel) {
        // Hide elements that might contain logos via CSS
        const potentialLogoElements = rightPanel.querySelectorAll(
          '[class*="logo"], [class*="Logo"], [id*="logo"], [id*="Logo"], .logo-positioner, .interactive-logo'
        );
        potentialLogoElements.forEach(el => {
          console.log('[Step7] Hiding potential CSS logo element:', el.className);
          (el as HTMLElement).style.display = 'none';
        });
      }
    }, 500);

    // Debug: Check for any logo elements and config
    setTimeout(() => {
      console.log('[Step7] Current game config logo data:', {
        logoUrl: config.theme?.generated?.logo,
        logoPosition: config.logoPosition,
        frameConfig: config.frame,
        titleAssets: config.titleAssets
      });

      const rightPanel = document.querySelector('[data-testid="right-panel-step-6"]');
      if (rightPanel) {
        // Check for any visible images that might be logos
        const allImages = rightPanel.querySelectorAll('img');
        console.log('[Step7] All images in right panel:', allImages.length);
        allImages.forEach((img, index) => {
          const rect = img.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) { // Only visible images
            console.log(`[Step7] Visible image ${index}:`, {
              src: img.src?.substring(0, 100) + '...', // Truncate long data URLs
              className: img.className,
              width: rect.width,
              height: rect.height,
              position: { x: rect.x, y: rect.y },
              isAboveReel3: rect.x > 400 && rect.x < 600 && rect.y < 300 // Rough estimate for "above reel 3"
            });
          }
        });

        // Also check for canvas elements that might contain logos
        const canvases = rightPanel.querySelectorAll('canvas');
        console.log('[Step7] Canvas elements in right panel:', canvases.length);

        // Check for CSS background images and pseudo-elements
        const allElements = rightPanel.querySelectorAll('*');
        console.log('[Step7] Checking for CSS background images...');
        allElements.forEach((el, index) => {
          const computedStyle = window.getComputedStyle(el);
          const backgroundImage = computedStyle.backgroundImage;

          if (backgroundImage && backgroundImage !== 'none') {
            const rect = el.getBoundingClientRect();
            console.log(`[Step7] Element with CSS background image:`, {
              tagName: el.tagName,
              className: el.className,
              backgroundImage: backgroundImage.substring(0, 100) + '...',
              position: { x: rect.x, y: rect.y },
              size: { width: rect.width, height: rect.height },
              isAboveReel3: rect.x > 400 && rect.x < 600 && rect.y < 300
            });
          }

          // Check pseudo-elements
          try {
            const beforeStyle = window.getComputedStyle(el, '::before');
            const afterStyle = window.getComputedStyle(el, '::after');

            if (beforeStyle.content && beforeStyle.content !== 'none' && beforeStyle.content !== '""') {
              console.log(`[Step7] ::before pseudo-element found:`, {
                tagName: el.tagName,
                className: el.className,
                content: beforeStyle.content,
                backgroundImage: beforeStyle.backgroundImage
              });
            }

            if (afterStyle.content && afterStyle.content !== 'none' && afterStyle.content !== '""') {
              console.log(`[Step7] ::after pseudo-element found:`, {
                tagName: el.tagName,
                className: el.className,
                content: afterStyle.content,
                backgroundImage: afterStyle.backgroundImage
              });
            }
          } catch (e) {
            // Pseudo-element checks can sometimes fail
          }
        });
      }
    }, 2000);
  }, []);

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = ANIMATION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setCustomEffects(preset.effects);

      // Save to store
      updateConfig({
        winAnimations: preset.effects,
        selectedWinAnimationPreset: presetId
      });

      // Dispatch CustomEvent for PixiJS integration (same pattern as Step 6)
      window.dispatchEvent(new CustomEvent('applyWinAnimationSettings', {
        detail: {
          preset: presetId,
          effects: preset.effects
        }
      }));
    }
  };


  // Update win thresholds
  const updateWinThresholds = (newThresholds: Partial<WinMultiplierThresholds>) => {
    const updatedThresholds = { ...winThresholds, ...newThresholds };
    setWinThresholds(updatedThresholds);
    setIsCustomThresholds(true); // Mark as custom when manually adjusted
    setSelectedPresetId('custom');

    // Save to store
    updateConfig({
      winMultiplierThresholds: updatedThresholds
    });

    // Dispatch CustomEvent for PixiJS integration (same pattern as Step 6)
    window.dispatchEvent(new CustomEvent('applyWinThresholds', {
      detail: {
        thresholds: updatedThresholds
      }
    }));
  };

  // Apply multiplier preset
  const applyMultiplierPreset = (presetId: string) => {
    if (presetId === 'custom') {
      // Handle custom preset selection
      setSelectedPresetId('custom');
      setIsCustomThresholds(true);

      // Save current thresholds as custom
      updateConfig({
        winMultiplierThresholds: winThresholds
      });

      // Dispatch CustomEvent for PixiJS integration
      window.dispatchEvent(new CustomEvent('applyWinThresholds', {
        detail: {
          preset: 'custom',
          thresholds: winThresholds
        }
      }));
    } else {
      const preset = MULTIPLIER_PRESETS.find(p => p.id === presetId);
      if (preset) {
        setWinThresholds(preset.thresholds);
        setSelectedPresetId(presetId);
        setIsCustomThresholds(false);

        // Save to store
        updateConfig({
          winMultiplierThresholds: preset.thresholds
        });

        // Dispatch CustomEvent for PixiJS integration (same pattern as Step 6)
        window.dispatchEvent(new CustomEvent('applyWinThresholds', {
          detail: {
            preset: presetId,
            thresholds: preset.thresholds
          }
        }));
      }
    }
  };

  // Generate win title asset using GPT-Image-1
  const generateWinTitle = async (titleId: string) => {
    const title = assetState.winTitles.find(t => t.id === titleId);
    if (!title || title.isGenerating) return;

    // Mark as generating
    setAssetState(prev => ({
      ...prev,
      winTitles: prev.winTitles.map(t =>
        t.id === titleId ? { ...t, isGenerating: true } : t
      )
    }));

    try {
      // Get theme colors from Step 1
      const themeColors = config.theme?.colors || { primary: '#FFD700', secondary: '#FF6B35' };

      // Generate GPT-Image-1 prompt - use custom prompt if provided, otherwise generate default
      const prompt = title.customPrompt && title.customPrompt.trim()
        ? title.customPrompt
        : generateTitlePrompt(title, themeColors);

      console.log(`[Step7] Generating win title with GPT-Image-1: ${title.customText || title.text}`);
      console.log(`[Step7] Prompt: ${prompt.substring(0, 200)}...`);

      // Use GPT-Image-1 to generate the title image
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt,
        targetSymbolId: `win_title_${titleId}`,
        gameId: config.gameId,
        onProgress: (progress) => {
          console.log(`[Step7] Title generation progress: ${progress}%`);
        }
      });

      if (!result.success || !result.images || result.images.length === 0) {
        throw new Error(result.error || 'Failed to generate title image');
      }

      const imageData = result.images[0];
      // For now, use the image data directly instead of saving to backend
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;

      console.log(`[Step7] Using generated image data directly (backend service not available)`);

      // Update state with generated asset and save to store
      setAssetState(prev => {
        const updatedTitles = prev.winTitles.map(t =>
          t.id === titleId ? {
            ...t,
            generated: true,
            generatedUrl: imageUrl,
            isGenerating: false
          } : t
        );

        const updatedTitle = updatedTitles.find(t => t.id === titleId);

        // Save to store - save both URL and full title config
        if (updatedTitle) {
          updateConfig({
            generatedAssets: {
              ...config.generatedAssets,
              winTitles: {
                ...config.generatedAssets?.winTitles,
                [titleId]: imageUrl
              }
            },
            winTitleConfigs: {
              ...config.winTitleConfigs,
              [titleId]: updatedTitle
            }
          });
        }

        return {
          ...prev,
          winTitles: updatedTitles,
          lastGenerated: new Date()
        };
      });

      console.log(`[Step7] Successfully generated win title: ${titleId}`);

    } catch (error) {
      console.error('Error generating win title:', error);

      // Reset generating state
      setAssetState(prev => ({
        ...prev,
        winTitles: prev.winTitles.map(t =>
          t.id === titleId ? { ...t, isGenerating: false } : t
        )
      }));
    }
  };

  // Generate particle asset using GPT-Image-1
  const generateParticle = async (particleId: string) => {
    const particle = assetState.particles.find(p => p.id === particleId);
    if (!particle || particle.isGenerating) return;

    // Mark as generating
    setAssetState(prev => ({
      ...prev,
      particles: prev.particles.map(p =>
        p.id === particleId ? { ...p, isGenerating: true } : p
      )
    }));

    try {
      // Get theme colors from Step 1
      const themeColors = config.theme?.colors || { primary: '#FFD700', secondary: '#FF6B35' };

      // Generate GPT-Image-1 prompt - use custom prompt if provided, otherwise generate default
      const prompt = particle.customPrompt && particle.customPrompt.trim()
        ? particle.customPrompt
        : generateParticlePrompt(particle, themeColors);

      console.log(`[Step7] Generating particle with GPT-Image-1: ${particle.name} (${particle.size})`);
      console.log(`[Step7] Prompt: ${prompt.substring(0, 200)}...`);

      // Use GPT-Image-1 to generate the particle image
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt,
        targetSymbolId: `particle_${particleId}`,
        gameId: config.gameId,
        onProgress: (progress) => {
          console.log(`[Step7] Particle generation progress: ${progress}%`);
        }
      });

      if (!result.success || !result.images || result.images.length === 0) {
        throw new Error(result.error || 'Failed to generate particle image');
      }

      const imageData = result.images[0];

      // For now, use the image data directly instead of saving to backend
      const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;

      console.log(`[Step7] Using generated particle data directly (backend service not available)`);

      // Update state with generated asset and save to store
      setAssetState(prev => {
        const updatedParticles = prev.particles.map(p =>
          p.id === particleId ? {
            ...p,
            generated: true,
            generatedUrl: imageUrl,
            isGenerating: false
          } : p
        );

        const updatedParticle = updatedParticles.find(p => p.id === particleId);

        // Save to store - save both URL and full particle config
        if (updatedParticle) {
          updateConfig({
            generatedAssets: {
              ...config.generatedAssets,
              particles: {
                ...config.generatedAssets?.particles,
                [particleId]: imageUrl
              }
            },
            particleConfigs: {
              ...config.particleConfigs,
              [particleId]: updatedParticle
            }
          });
        }

        return {
          ...prev,
          particles: updatedParticles,
          lastGenerated: new Date()
        };
      });

      console.log(`[Step7] Successfully generated particle: ${particleId}`);

    } catch (error) {
      console.error('Error generating particle:', error);

      // Reset generating state
      setAssetState(prev => ({
        ...prev,
        particles: prev.particles.map(p =>
          p.id === particleId ? { ...p, isGenerating: false } : p
        )
      }));
    }
  };

  // Upload particle from file
  const uploadParticle = (particleId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const updatedParticles = assetState.particles.map(p =>
            p.id === particleId ? {
              ...p,
              generated: true,
              generatedUrl: imageUrl,
              isGenerating: false
            } : p
          );

          setAssetState(prev => ({
            ...prev,
            particles: updatedParticles
          }));

          // Save to store
          updateConfig({
            generatedAssets: {
              ...config.generatedAssets,
              particles: {
                ...config.generatedAssets?.particles,
                [particleId]: imageUrl
              }
            },
            particleConfigs: {
              ...config.particleConfigs,
              [particleId]: updatedParticles.find(p => p.id === particleId)
            }
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Delete generated particle
  const deleteParticle = (particleId: string) => {
    const updatedParticles = assetState.particles.map(p =>
      p.id === particleId ? {
        ...p,
        generated: false,
        generatedUrl: undefined,
        isGenerating: false
      } : p
    );

    setAssetState(prev => ({
      ...prev,
      particles: updatedParticles
    }));

    // Remove from store
    const updatedParticleUrls = { ...config.generatedAssets?.particles };
    delete updatedParticleUrls[particleId];

    const updatedParticleConfigs = { ...config.particleConfigs };
    delete updatedParticleConfigs[particleId];

    updateConfig({
      generatedAssets: {
        ...config.generatedAssets,
        particles: updatedParticleUrls
      },
      particleConfigs: updatedParticleConfigs
    });
  };

  // Generate number images using GPT-4
  const generateNumberImages = async () => {
    // Validate manual prompt if manual mode is selected
    if (numberImageStyle === 'mannual' && !manualPrompt.trim()) {
      alert('Please enter a custom prompt for manual generation');
      return;
    }

    setNumberImagesState(prev => ({ ...prev, isGenerating: true }));

    try {
      const themeColors = config.theme?.colors || { primary: '#FFD700', secondary: '#FF6B35' };

      // Style descriptions for different number image styles
      const styleDescriptions = {
        stone: 'Carved stone typography style.C Flat stone surface with subtle carved depth,weathered texture, light edge wear,matte finish, readable silhouette,inspired by stone engravings, not heavy blocks.',
        wood: 'Carved wooden typography style.Natural wood grain, warm brown tones,light engraved depth, soft highlights,organic but clean, readable at small sizes.',
        crystal: 'Crystal-inspired typography style.Translucent glass-like material,soft internal refraction,cool highlights, clean edges,no excessive glow or sparkle.',
        runes: 'Mystical engraved typography style.Arcane carved glyph look,subtle inner glow only within the character,no outer aura, no particles,clean readable rune-like engraving.',
        neon: 'Neon-styled typography.Bright luminous edges,solid inner fill,controlled glow that stays tight to the glyph,cyber arcade feel without background haze.',
        gold: 'Luxury gold typography style.Polished metallic gold surface,subtle bevel and reflections,engraved edges,premium casino finish,no coin or medallion shapes.'
      };

      // For manual mode, use the user's custom prompt; otherwise use predefined style
      const styleDesc = numberImageStyle === 'mannual'
        ? manualPrompt.trim()
        : (styleDescriptions[numberImageStyle as keyof typeof styleDescriptions] || styleDescriptions.stone);

      // Generate all numbers 0-9 and decimal point
      const numberPromises = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'dot'].map(async (item) => {
        const isDecimal = item === 'dot';
        const displayChar = isDecimal ? '.' : item;
        const charType = isDecimal ? 'decimal point' : 'number';

        // Base backend prompt that ensures technical requirements are met
        const baseBackendPrompt = `Create a professional slot machine ${charType} image with COMPLETELY TRANSPARENT BACKGROUND (PNG with alpha channel).

TECHNICAL REQUIREMENTS:
- Background: Fully transparent (alpha channel), no artifacts, no background elements
- Size: Optimized for 64x64 pixels display, high resolution for sharp scaling
- Theme colors: Primary ${themeColors.primary}, Secondary ${themeColors.secondary}
- Professional casino game quality with clear, readable typography
- Suitable for overlay on slot machine interfaces
- The ${charType} should be centered and properly sized for slot machine UI elements

${isDecimal ? `DECIMAL POINT SPECIFICS:
- The image must contain ONLY the typographic decimal point character "." (not a circle, button, or disc)
- It should look like a small filled dot from a font, not a full circle, coin, or button
- Maintain MINIMUM 50% transparent padding on all sides so the dot is not oversized
- Dot style: simple filled glyph consistent with the style (no glow, no outer glow, no sparkles, no drop shadow)` : `NUMBER SPECIFICS:
- The ${charType} "${displayChar}" should be clearly visible and stylized
- Maintain proper spacing and padding for readability`}`;

        // For manual mode, combine user prompt with base backend prompt
        // For other modes, use the predefined style description
        const userStyleDescription = numberImageStyle === 'mannual'
          ? `CUSTOM STYLE: ${styleDesc}`
          : `STYLE: ${styleDesc}`;

        const decimalPrompt = `${baseBackendPrompt}

${userStyleDescription}

IMPORTANT: Apply the custom style description while maintaining all technical requirements above.`;

        const numberPrompt = `${baseBackendPrompt}

${userStyleDescription}

IMPORTANT: Apply the custom style description while maintaining all technical requirements above.`;

        console.log(`[Step8] Generating ${item === 'dot' ? 'decimal point' : `number ${item}`} with style: ${numberImageStyle}${numberImageStyle === 'mannual' ? ' (manual)' : ''}`);
        const prompt = `${isDecimal ? decimalPrompt : numberPrompt}`;
        const result = await enhancedOpenaiClient.generateImageWithConfig({
          prompt,
          targetSymbolId: `${item === 'dot' ? 'decimal' : 'number'}_${item}_${numberImageStyle}`,
          gameId: config.gameId,
          onProgress: (progress) => {
            console.log(`[Step8] ${item === 'dot' ? 'Decimal point' : `Number ${item}`} generation progress: ${progress}%`);
          }
        });

        if (!result.success || !result.images || result.images.length === 0) {
          throw new Error(result.error || `Failed to generate ${item === 'dot' ? 'decimal point' : `number ${item}`}`);
        }

        const imageData = result.images[0];
        const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;

        return { item, imageUrl };
      });

      // Wait for all numbers to be generated
      const results = await Promise.all(numberPromises);

      // Update state with all generated images (replace existing for this style)
      const newImages: Record<number | string, string> = {};
      results.forEach(({ item, imageUrl }) => {
        newImages[item] = imageUrl;
      });

      setNumberImagesState(prev => ({
        ...prev,
        images: newImages, // Replace all images for current style
        isGenerating: false
      }));

      // Save to game store (replace all existing number images)
      updateConfig({
        generatedAssets: {
          ...config.generatedAssets,
          numberImages: newImages // Replace all number images directly
        }
      });

      console.log(`[Step8] Successfully generated all number images with style: ${numberImageStyle}`);

    } catch (error) {
      console.error('Error generating number images:', error);
      setNumberImagesState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Generate all assets
  const generateAllAssets = async () => {
    setAssetState(prev => ({ ...prev, isGenerating: true }));

    try {
      // Generate all win titles
      const titlePromises = assetState.winTitles
        .filter(t => !t.generated)
        .map(t => generateWinTitle(t.id));

      // Generate all particles  
      const particlePromises = assetState.particles
        .filter(p => !p.generated)
        .map(p => generateParticle(p.id));

      await Promise.all([...titlePromises, ...particlePromises]);

    } catch (error) {
      console.error('Error generating all assets:', error);
    } finally {
      setAssetState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Toggle title editing mode
  const toggleTitleEditing = (titleId: string) => {
    setAssetState(prev => ({
      ...prev,
      winTitles: prev.winTitles.map(t =>
        t.id === titleId ? { ...t, isEditing: !t.isEditing } : t
      )
    }));
  };

  // Update title properties
  const updateTitleProperty = (titleId: string, property: keyof WinTitleAsset, value: any) => {
    // Properties that require regeneration vs display-only properties
    const regenerationRequired = ['customText', 'customPrompt', 'style', 'fontFamily', 'fontSize'];
    const shouldRegenerate = regenerationRequired.includes(property as string);

    setAssetState(prev => {
      const updatedTitles = prev.winTitles.map(t =>
        t.id === titleId ? {
          ...t,
          [property]: value,
          ...(shouldRegenerate ? { generated: false } : {}) // Only reset generated flag if regeneration is needed
        } : t
      );

      // Save updated title config to store
      const updatedTitle = updatedTitles.find(t => t.id === titleId);
      if (updatedTitle) {
        updateConfig({
          winTitleConfigs: {
            ...config.winTitleConfigs,
            [titleId]: updatedTitle
          }
        });
      }

      return {
        ...prev,
        winTitles: updatedTitles
      };
    });
  };

  // Reset title to defaults
  const resetTitleToDefault = (titleId: string) => {
    const defaultTitle = DEFAULT_WIN_TITLES.find(t => t.id === titleId);
    if (defaultTitle) {
      const resetTitle = {
        ...defaultTitle,
        generated: false,
        isEditing: false,
        generatedUrl: undefined
      };

      setAssetState(prev => ({
        ...prev,
        winTitles: prev.winTitles.map(t =>
          t.id === titleId ? resetTitle : t
        )
      }));

      // Remove from store when resetting to default
      const updatedTitleUrls = { ...config.generatedAssets?.winTitles };
      delete updatedTitleUrls[titleId];

      const updatedTitleConfigs = { ...config.winTitleConfigs };
      delete updatedTitleConfigs[titleId];

      updateConfig({
        generatedAssets: {
          ...config.generatedAssets,
          winTitles: updatedTitleUrls
        },
        winTitleConfigs: updatedTitleConfigs
      });
    }
  };

  // Helper function to clean up malformed data URLs
  const cleanDataUrl = (url: string): string => {
    if (!url) return url;

    // Remove duplicate data URL prefixes (handles various formats)
    let cleanedUrl = url;

    // Remove duplicate data:image/png;base64, prefixes
    cleanedUrl = cleanedUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');

    // Remove duplicate data:image/jpeg;base64, prefixes
    cleanedUrl = cleanedUrl.replace(/^data:image\/jpeg;base64,data:image\/jpeg;base64,/, 'data:image/jpeg;base64,');

    // Remove any other duplicate data: prefixes
    cleanedUrl = cleanedUrl.replace(/^data:([^,]+),data:([^,]+),/, 'data:$1,');

    return cleanedUrl;
  };

  // Preview win title in Premium Slot Preview
  const previewWinTitle = (title: WinTitleAsset) => {
    if (!title.generated || !title.generatedUrl) {
      console.warn('[Step7] Cannot preview win title - not generated yet');
      return;
    }

    console.log(`[Step7] Previewing win title: ${title.customText || title.text}`);
    setPreviewingWinTitle(title);

    // Find the preview container
    const previewContainer = document.querySelector(`[data-testid="right-panel-step-7"]`) ||
      document.querySelector(`[data-testid="right-panel-step-6"]`) ||
      document.querySelector('.grid-preview-wrapper') ||
      document.querySelector('.game-container');

    if (!previewContainer) {
      console.warn('[Step7] Preview container not found');
      return;
    }

    // Remove any existing win title preview
    const existingPreview = previewContainer.querySelector('.win-title-preview');
    if (existingPreview) {
      existingPreview.remove();
    }

    // Create win title preview overlay
    const overlay = document.createElement('div');
    overlay.className = 'win-title-preview';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create the title image
    const titleImg = document.createElement('img');
    // Clean the URL before using it to fix malformed data URLs
    titleImg.src = cleanDataUrl(title.generatedUrl);

    // Apply Title Display Size from config (same logic as game preview)
    const titleImageSize = title.titleImageSize || 100;
    const titleSizeMultiplier = titleImageSize / 100;
    const baseWidth = 400;
    const baseHeight = 150;
    const finalWidth = Math.round(baseWidth * titleSizeMultiplier);
    const finalHeight = Math.round(baseHeight * titleSizeMultiplier);

    // Cap within viewport-like bounds of the preview container
    const containerRect = previewContainer.getBoundingClientRect();
    const maxWidth = Math.min(finalWidth, containerRect.width * 0.8);
    const maxHeight = Math.min(finalHeight, containerRect.height * 0.4);

    titleImg.style.cssText = `
      object-fit: contain;
      width: ${finalWidth}px;
      height: ${finalHeight}px;
      max-width: ${maxWidth}px;
      max-height: ${maxHeight}px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
      animation: winTitleFadeIn 0.5s ease-out;
    `;

    // Add CSS animation for fade in
    if (!document.getElementById('win-title-preview-styles')) {
      const style = document.createElement('style');
      style.id = 'win-title-preview-styles';
      style.textContent = `
        @keyframes winTitleFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    overlay.appendChild(titleImg);
    previewContainer.appendChild(overlay);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
        setPreviewingWinTitle(null);
      }
    }, 3000);
  };

  // Get fallback emoji for custom particles based on name
  const getCustomParticleFallback = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('coin') || lowerName.includes('gold')) return '💰';
    if (lowerName.includes('silver') || lowerName.includes('bar')) return '🥈';
    if (lowerName.includes('diamond') || lowerName.includes('gem')) return '💎';
    if (lowerName.includes('star')) return '⭐';
    if (lowerName.includes('lightning') || lowerName.includes('bolt')) return '⚡';
    if (lowerName.includes('confetti') || lowerName.includes('party')) return '🎊';
    if (lowerName.includes('fire') || lowerName.includes('flame')) return '🔥';
    if (lowerName.includes('crystal')) return '🔮';
    if (lowerName.includes('ruby') || lowerName.includes('red')) return '🔴';
    if (lowerName.includes('emerald') || lowerName.includes('green')) return '🟢';
    if (lowerName.includes('sapphire') || lowerName.includes('blue')) return '🔵';
    return '✨'; // Default for custom particles
  };

  // Get particle types for each win tier
  const getParticleTypesForTier = (tier: WinTier): Array<{ url?: string, fallback: string, config?: ParticleAsset }> => {
    // Get particles assigned to this tier (whether generated or not)
    const tierParticles = assetState.particles.filter(p =>
      p.winTiers?.includes(tier as any)
    );

    console.log(`[getParticleTypesForTier] Looking for ${tier} particles:`, {
      totalParticles: assetState.particles.length,
      tierParticles: tierParticles.length,
      assignedParticles: tierParticles.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        generated: p.generated,
        hasUrl: !!p.generatedUrl,
        winTiers: p.winTiers,
        fallback: p.type === 'custom' ? getCustomParticleFallback(p.name) : (
          p.type === 'coins' ? '💰' :
            p.type === 'gems' ? '💎' :
              p.type === 'stars' ? '⭐' :
                p.type === 'lightning' ? '⚡' :
                  p.type === 'confetti' ? '🎊' : '💰'
        )
      }))
    });

    // If we have particles assigned to this tier, use them
    if (tierParticles.length > 0) {
      return tierParticles.map(p => ({
        url: p.generated && p.generatedUrl ? cleanDataUrl(p.generatedUrl) : undefined,
        fallback: p.type === 'coins' ? '💰' :
          p.type === 'gems' ? '💎' :
            p.type === 'stars' ? '⭐' :
              p.type === 'lightning' ? '⚡' :
                p.type === 'confetti' ? '🎊' :
                  p.type === 'custom' ? getCustomParticleFallback(p.name) : '💰',
        config: p // Include the full particle config for celebration settings
      }));
    }

    // If no particles are assigned to this tier, fall back to default emoji icons
    switch (tier) {
      case 'small':
        return [{ fallback: '💰' }]; // Coins only
      case 'big':
        return [{ fallback: '💰' }]; // Coins only
      case 'mega':
        return [{ fallback: '💰' }, { fallback: '⭐' }]; // Coins + Stars
      case 'super':
        return [{ fallback: '💰' }, { fallback: '⭐' }, { fallback: '💎' }]; // Coins + Stars + Diamonds
      default:
        return [{ fallback: '💰' }];
    }
  };

  // Create fountain particle with realistic physics
  const createFountainParticle = (overlay: HTMLElement, tier: WinTier, particleTypes: Array<{ url?: string, fallback: string, config?: ParticleAsset }>, duration: number) => {
    const particle = document.createElement('div');
    const selectedParticle = particleTypes[Math.floor(Math.random() * particleTypes.length)];

    // Get particle configuration for celebration effects
    const particleConfig = selectedParticle.config;
    const sizeMultiplier = (particleConfig?.celebrationSize || 100) / 100;
    const spreadMultiplier = (particleConfig?.fountainSpread || 100) / 100;
    const speedMultiplier = (particleConfig?.particleSpeed || 100) / 100;
    const heightMultiplier = (particleConfig?.fountainHeight || 100) / 100;
    const windEffect = (particleConfig?.windEffect || 0) / 100;

    // Advanced fountain pattern logic
    const pattern = particleConfig?.fountainPattern || 'classic-3';
    const leftAngle = particleConfig?.leftAngle || -45;
    const rightAngle = particleConfig?.rightAngle || 45;
    const centerWeight = (particleConfig?.centerWeight || 50) / 100;

    let horizontalVelocity: number;
    let baseVerticalVelocity: number;

    // Determine direction based on fountain pattern
    switch (pattern) {
      case 'classic-3':
        // Original 3-stream: left, center, right
        const direction3 = [-1, 0, 1][Math.floor(Math.random() * 3)];
        horizontalVelocity = direction3 * (50 + Math.random() * 50) * spreadMultiplier;
        break;

      case 'fan-5':
        // 5-stream fan: far-left, left, center, right, far-right
        const directions5 = [-2, -1, 0, 1, 2];
        const direction5 = directions5[Math.floor(Math.random() * 5)];
        horizontalVelocity = direction5 * (40 + Math.random() * 30) * spreadMultiplier;
        break;

      case 'wide-7':
        // 7-stream wide: maximum spread
        const directions7 = [-3, -2, -1, 0, 1, 2, 3];
        const direction7 = directions7[Math.floor(Math.random() * 7)];
        horizontalVelocity = direction7 * (35 + Math.random() * 25) * spreadMultiplier;
        break;

      case 'single-vertical':
        // Single straight up
        horizontalVelocity = 0;
        break;

      case 'dual-side':
        // Only left and right, no center
        const sideDirs = [-1, 1];
        const sideDir = sideDirs[Math.floor(Math.random() * 2)];
        horizontalVelocity = sideDir * (60 + Math.random() * 40) * spreadMultiplier;
        break;

      case 'random-burst':
        // 360° random directions
        const randomAngle = Math.random() * 360 * (Math.PI / 180); // Convert to radians
        const randomSpeed = 30 + Math.random() * 70;
        horizontalVelocity = Math.cos(randomAngle) * randomSpeed * spreadMultiplier;
        baseVerticalVelocity = -Math.abs(Math.sin(randomAngle)) * randomSpeed * heightMultiplier * speedMultiplier;
        break;

      case 'cascading':
        // Curved cascading paths with center weight
        if (Math.random() < centerWeight) {
          // Center stream
          horizontalVelocity = (Math.random() - 0.5) * 20 * spreadMultiplier;
        } else {
          // Side streams with custom angles
          const useLeft = Math.random() < 0.5;
          const angle = useLeft ? leftAngle : rightAngle;
          const angleRad = angle * (Math.PI / 180);
          const speed = 50 + Math.random() * 50;
          horizontalVelocity = Math.sin(angleRad) * speed * spreadMultiplier;
        }
        break;

      default:
        // Fallback to classic
        const directionDefault = [-1, 0, 1][Math.floor(Math.random() * 3)];
        horizontalVelocity = directionDefault * (50 + Math.random() * 50) * spreadMultiplier;
    }

    // Set vertical velocity if not already set by pattern
    if (baseVerticalVelocity === undefined) {
      baseVerticalVelocity = -(120 + Math.random() * 80) * heightMultiplier;
    }

    const verticalVelocity = baseVerticalVelocity * speedMultiplier;
    const gravity = 300 * speedMultiplier;

    // Create particle content - use generated image if available, otherwise fallback to emoji
    const finalSize = Math.round(32 * sizeMultiplier);

    if (selectedParticle.url) {
      const img = document.createElement('img');
      img.src = selectedParticle.url;
      img.style.cssText = `
        width: ${finalSize}px;
        height: ${finalSize}px;
        object-fit: contain;
        display: block;
      `;
      img.onerror = () => {
        // If image fails to load, fallback to emoji
        particle.innerHTML = '';
        particle.textContent = selectedParticle.fallback;
        particle.style.fontSize = `${finalSize}px`;
      };
      particle.appendChild(img);
    } else {
      particle.textContent = selectedParticle.fallback;
      particle.style.fontSize = `${finalSize}px`;
    }
    particle.style.cssText = `
      position: absolute;
      top: 60%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 98;
      user-select: none;
    `;

    overlay.appendChild(particle);

    // Physics-based animation
    const animationDuration = duration * 0.8; // Slightly shorter than total effect
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000; // Convert to seconds
      const progress = elapsed / (animationDuration / 1000);

      if (progress >= 1) {
        particle.remove();
        return;
      }

      // Calculate position using physics with wind effect
      const windDrift = windEffect * elapsed * 30; // Wind creates horizontal drift over time
      const x = horizontalVelocity * elapsed + windDrift;
      const y = verticalVelocity * elapsed + 0.5 * gravity * elapsed * elapsed;

      // Apply position and fade out over time
      const opacity = Math.max(0, 1 - progress);
      particle.style.transform = `translate(${x - particle.offsetWidth / 2}px, ${y}px)`;
      particle.style.opacity = opacity.toString();

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  // Create betline celebration animation
  const createBetlineCelebration = (overlay: HTMLElement, tier: WinTier, config: BetlineConfig) => {
    const effects = customEffects[tier];
    if (!effects.betlineEnabled) return;

    // Mock paylines for demo - in real implementation, this would come from the game engine
    const mockPaylines = [
      { id: 1, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] }, // Middle line
      { id: 2, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] }, // Top line
      { id: 3, positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] }, // Bottom line
      { id: 4, positions: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] }, // Zigzag
    ];

    // Get container dimensions for positioning
    const containerRect = overlay.getBoundingClientRect();
    const gridWidth = containerRect.width * 0.8; // 80% of container width
    const gridHeight = containerRect.height * 0.6; // 60% of container height
    const symbolWidth = gridWidth / 5; // 5 reels
    const symbolHeight = gridHeight / 3; // 3 rows

    // Starting position (centered in container)
    const startX = (containerRect.width - gridWidth) / 2;
    const startY = (containerRect.height - gridHeight) / 2;

    // Function to draw a single betline
    const drawBetline = (payline: typeof mockPaylines[0], lineIndex: number, delay: number = 0) => {
      setTimeout(() => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        line.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
        `;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        // Calculate path coordinates
        const pathData = payline.positions.map((pos, index) => {
          const x = startX + (pos[0] * symbolWidth) + (symbolWidth / 2);
          const y = startY + (pos[1] * symbolHeight) + (symbolHeight / 2);
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(' ');

        // Style the path based on configuration
        const color = config.colors[lineIndex % config.colors.length];
        console.log(`[Step7] Using betline color for line ${lineIndex}:`, color, 'from colors:', config.colors);
        let strokeDasharray = '';
        let strokeWidth = config.width;
        let filter = '';
        let animationClass = '';

        console.log(`[Step7] Applying betline style: ${config.style} for line ${lineIndex}, width: ${strokeWidth}px, speed: ${config.speed}s (${config.speed * 1000}ms duration)`);
        switch (config.style) {
          case 'dashed':
            strokeDasharray = '10,5';
            break;
          case 'glowing':
            strokeWidth *= 1.2;
            filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}40)`;
            break;
          case 'pulsing':
            strokeWidth *= 1.1;
            animationClass = 'betline-pulse';
            break;
        }

        path.setAttribute('d', pathData);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth.toString());
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');

        if (strokeDasharray) {
          path.setAttribute('stroke-dasharray', strokeDasharray);
        }

        // Apply visual effects
        if (filter) {
          path.style.filter = filter;
        }

        if (animationClass) {
          path.classList.add(animationClass);
          // Set CSS custom property for base width
          path.style.setProperty('--base-width', strokeWidth.toString());
        }

        line.appendChild(path);
        overlay.appendChild(line);

        // Handle line drawing animation with speed control
        const pathLength = path.getTotalLength();

        if (config.style === 'dashed') {
          // For dashed lines, create a custom animation that preserves dash pattern
          console.log(`[Step7] Animating dashed line with pattern: ${strokeDasharray}, speed: ${config.speed}s`);

          // Start with the line hidden using a large dash offset
          const totalDashLength = pathLength + 20; // Add some buffer
          path.style.strokeDasharray = `10 5`; // Keep the dash pattern
          path.style.strokeDashoffset = totalDashLength.toString();

          // Animate the dash offset to reveal the dashed line
          path.animate([
            { strokeDashoffset: totalDashLength.toString() },
            { strokeDashoffset: '0' }
          ], {
            duration: config.speed * 1000,
            easing: 'ease-out',
            fill: 'forwards'
          });
        } else {
          // For other styles, use the standard line drawing animation
          path.style.strokeDasharray = `${pathLength} ${pathLength}`;
          path.style.strokeDashoffset = pathLength.toString();

          // Animate line drawing
          path.animate([
            { strokeDashoffset: pathLength.toString() },
            { strokeDashoffset: '0' }
          ], {
            duration: config.speed * 1000,
            easing: 'ease-out',
            fill: 'forwards'
          });
        }

        // Add pulsing animation for pulsing style
        if (config.style === 'pulsing') {
          path.animate([
            { opacity: '1', strokeWidth: strokeWidth.toString() },
            { opacity: '0.6', strokeWidth: (strokeWidth * 1.5).toString() },
            { opacity: '1', strokeWidth: strokeWidth.toString() }
          ], {
            duration: config.speed * 1000, // Use the speed setting for pulsing too
            iterations: Infinity,
            easing: 'ease-in-out'
          });
        }

        // Highlight symbols on this payline
        if (config.symbolHighlight) {
          payline.positions.forEach((pos, symbolIndex) => {
            setTimeout(() => {
              highlightSymbol(pos[0], pos[1], color, config.symbolHighlightDuration);
            }, symbolIndex * 200); // Stagger symbol highlights
          });
        }

        // Remove line after duration
        setTimeout(() => {
          if (line.parentNode) {
            line.remove();
          }
        }, effects.duration * 1000);

      }, delay);
    };

    // Function to highlight a symbol at grid position
    const highlightSymbol = (reelIndex: number, rowIndex: number, color: string, duration: number) => {
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: absolute;
        left: ${startX + (reelIndex * symbolWidth)}px;
        top: ${startY + (rowIndex * symbolHeight)}px;
        width: ${symbolWidth}px;
        height: ${symbolHeight}px;
        border: 3px solid ${color};
        border-radius: 8px;
        box-shadow: 0 0 20px ${color};
        pointer-events: none;
        z-index: 99;
        animation: symbolPulse 0.5s ease-in-out;
      `;

      // Add CSS animations for symbols and betlines
      if (!document.getElementById('betline-animations')) {
        const style = document.createElement('style');
        style.id = 'betline-animations';
        style.textContent = `
          @keyframes symbolPulse {
            0% { transform: scale(1); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
          
          @keyframes betlinePulse {
            0% { 
              stroke-width: var(--base-width, 3);
              opacity: 0.7;
            }
            50% { 
              stroke-width: calc(var(--base-width, 3) * 1.8);
              opacity: 1;
            }
            100% { 
              stroke-width: var(--base-width, 3);
              opacity: 0.7;
            }
          }
          
          .betline-pulse {
            animation: betlinePulse 1.5s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }

      overlay.appendChild(highlight);

      // Remove highlight after duration
      setTimeout(() => {
        if (highlight.parentNode) {
          highlight.remove();
        }
      }, duration * 1000);
    };

    // Draw betlines sequentially or all at once
    if (config.sequential) {
      mockPaylines.forEach((payline, index) => {
        const delay = index * (config.pauseBetweenLines * 1000);
        drawBetline(payline, index, delay);
      });
    } else {
      mockPaylines.forEach((payline, index) => {
        drawBetline(payline, index, 0);
      });
    }
  };

  // Trigger animation test - identical to Step 6 integration
  const triggerAnimation = useCallback((tier: WinTier | 'freeSpins' | 'bonusGame' | 'pickAndClick') => {
    if (isPlaying) return;

    setIsPlaying(true);
    // Only set selectedTier if it's a WinTier, otherwise keep current value
    if (['big', 'mega', 'super'].includes(tier as string)) {
      setSelectedTier(tier as WinTier);
    }

    // Find the preview canvas/container - use Step 7 specific selector first
    const previewContainer = document.querySelector(`[data-testid="right-panel-step-7"]`) ||
      document.querySelector(`[data-testid="right-panel-step-6"]`) ||
      document.querySelector('.grid-preview-wrapper') ||
      document.querySelector('.game-container');

    // Debug logging for container targeting
    if (previewContainer) {
      const rect = previewContainer.getBoundingClientRect();
      console.log(`[Step7] Found preview container:`, {
        selector: previewContainer.getAttribute('data-testid') || previewContainer.className,
        dimensions: { width: rect.width, height: rect.height },
        position: { x: rect.x, y: rect.y }
      });
    } else {
      console.warn('[Step7] No preview container found for win animation overlay');
    }

    // Connect to PixiJS renderer using the same method as Step 6 Animation Studio
    let pixiRenderer = null;
    try {
      // Method 1: Check global PIXI renderer instance (same as Step 6)
      if (window.PIXI_RENDERER_INSTANCE) {
        pixiRenderer = window.PIXI_RENDERER_INSTANCE;
        console.log('[Step7] Connected to shared PixiJS renderer for enhanced animations');
      }
      // Method 2: Check global PIXI apps (same as Step 6)
      else if (window.PIXI_APPS && window.PIXI_APPS.length > 0) {
        pixiRenderer = window.PIXI_APPS[0].renderer;
        console.log('[Step7] Connected to shared PixiJS app renderer for enhanced animations');
      }
    } catch (error) {
      console.warn('[Step7] Could not connect to PixiJS renderer, using DOM fallback:', error);
    }

    if (previewContainer) {
      // Create animation overlay contained within the canvas area
      const overlay = document.createElement('div');
      overlay.className = 'win-animation-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 100;
        overflow: hidden;
        border-radius: inherit;
      `;

      console.log('[Step7] Creating win animation overlay within canvas bounds');

      previewContainer.appendChild(overlay);

      // For bonus features, use mega win effects as fallback
      const effectsTier = ['big', 'mega', 'super'].includes(tier as string) ? tier as WinTier : 'mega';
      const effects = customEffects[effectsTier];

      // Step 1: Betline celebration (if enabled) - shows first to explain the win
      if (effects.betlineEnabled) {
        console.log(`[Step7] Starting betline celebration for ${tier} tier`);
        createBetlineCelebration(overlay, effectsTier, betlineConfig);
      }

      // Create fountain particle system with independent particle contributions
      // Use effectsTier (converted to WinTier) for particles since particles only support WinTier types
      const particleTypes = getParticleTypesForTier(effectsTier);
      const fountainDuration = effects.duration * 1000;

      // Calculate independent contributions from each particle type
      const particleContributions: Array<{ type: typeof particleTypes[0], count: number }> = [];
      let totalParticleCount = 0;

      if (particleTypes.length > 0 && particleTypes[0].config) {
        // Generated particles with individual density settings
        particleTypes.forEach(particleType => {
          const baseDensity = effects.particles / particleTypes.length; // Split base count evenly
          const densityMultiplier = (particleType.config?.particleDensity || 100) / 100;
          const individualCount = Math.round(baseDensity * densityMultiplier);

          particleContributions.push({
            type: particleType,
            count: individualCount
          });
          totalParticleCount += individualCount;
        });
      } else {
        // Fallback emoji particles - use base count
        particleContributions.push({
          type: particleTypes[0],
          count: effects.particles
        });
        totalParticleCount = effects.particles;
      }

      // Cap total particles for performance (max 1000)
      const maxParticles = 1000;
      if (totalParticleCount > maxParticles) {
        const scaleFactor = maxParticles / totalParticleCount;
        particleContributions.forEach(contribution => {
          contribution.count = Math.round(contribution.count * scaleFactor);
        });
        totalParticleCount = particleContributions.reduce((sum, contrib) => sum + contrib.count, 0);
      }

      console.log(`[Step7] Creating ${totalParticleCount} particles with independent contributions:`,
        particleContributions.map(c => `${c.type.config?.name || 'emoji'}: ${c.count}`).join(', '));

      // Create particles with individual timing - pass ALL particle types so each particle can randomly select
      let particleIndex = 0;
      particleContributions.forEach(contribution => {
        for (let i = 0; i < contribution.count; i++) {
          setTimeout(() => {
            createFountainParticle(overlay, effectsTier, particleTypes, fountainDuration); // Pass ALL particle types, not just one
          }, particleIndex * 100); // Stagger all particles evenly
          particleIndex++;
        }
      });

      // Removed white screen flash - replaced with elegant fountain effect

      // Screen shake effect - enhanced for PixiJS integration
      if (effects.screenShake) {
        const shakeIntensity = effects.intensity * 2;

        // Apply shake to both DOM container and PixiJS renderer if available
        previewContainer.animate([
          { transform: 'translateX(0)' },
          { transform: `translateX(${shakeIntensity}px)` },
          { transform: `translateX(-${shakeIntensity}px)` },
          { transform: 'translateX(0)' }
        ], {
          duration: 100,
          iterations: 5
        });

        // If PixiJS renderer is available, apply shake to the stage
        // Enhanced PixiJS integration - use same method as Step 6
        if (pixiRenderer && pixiRenderer.stage) {
          const originalX = pixiRenderer.stage.x || 0;
          let shakeFrame = 0;
          const shakeAnimation = () => {
            if (shakeFrame < 10) {
              const offset = Math.sin(shakeFrame * 0.5) * shakeIntensity;
              pixiRenderer.stage.x = originalX + offset;
              shakeFrame++;
              requestAnimationFrame(shakeAnimation);
            } else {
              pixiRenderer.stage.x = originalX;
            }
          };
          shakeAnimation();
        }

        // Also dispatch CustomEvent for any listeners (same as Step 6 pattern)
        window.dispatchEvent(new CustomEvent('triggerWinAnimation', {
          detail: {
            tier,
            effects: customEffects[effectsTier],
            duration: effects.duration * 1000
          }
        }));
      }

      // Win text display - use generated asset if available
      const generatedTitle = assetState.winTitles.find(t => t.type === tier && t.generated && t.generatedUrl);

      console.log(`[Step7] Looking for generated title for tier "${tier}":`, {
        searchingFor: tier,
        availableTitles: assetState.winTitles.map(t => ({
          id: t.id,
          type: t.type,
          generated: t.generated,
          hasUrl: !!t.generatedUrl,
          url: t.generatedUrl?.substring(0, 50) + '...' || 'none'
        })),
        foundTitle: !!generatedTitle,
        exactMatch: assetState.winTitles.filter(t => t.type === tier),
        generatedOnes: assetState.winTitles.filter(t => t.generated && t.generatedUrl)
      });

      if (generatedTitle && generatedTitle.generatedUrl) {
        // Use generated title image with custom size
        const titleSizeMultiplier = (generatedTitle.titleImageSize || 100) / 100;
        const baseWidth = 400;
        const baseHeight = 150;
        const finalWidth = Math.round(baseWidth * titleSizeMultiplier);
        const finalHeight = Math.round(baseHeight * titleSizeMultiplier);

        const titleImg = document.createElement('img');
        titleImg.src = cleanDataUrl(generatedTitle.generatedUrl);
        titleImg.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: ${finalWidth}px;
          max-height: ${finalHeight}px;
          pointer-events: none;
          z-index: 102;
        `;
        overlay.appendChild(titleImg);

        titleImg.animate([
          { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.3 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.8 },
          { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
        ], { duration: effects.duration * 1000 });
      } else {
        // Fallback to text-based title with custom size
        const titleAsset = assetState.winTitles.find(t => t.type === tier);
        const titleSizeMultiplier = (titleAsset?.titleImageSize || 100) / 100;
        const baseFontSize = tier === 'super' ? 48 : tier === 'mega' ? 36 : 24;
        const finalFontSize = Math.round(baseFontSize * titleSizeMultiplier);

        const winText = document.createElement('div');
        // Get text based on tier type
        const getWinTextContent = (tierType: typeof tier): string => {
          if (['big', 'mega', 'super'].includes(tierType as string)) {
            return WIN_TIERS[tierType as WinTier].description.toUpperCase() + '!';
          }
          switch (tierType) {
            case 'freeSpins': return 'FREE SPINS!';
            case 'bonusGame': return 'BONUS GAME!';
            case 'pickAndClick': return 'PICK & CLICK!';
            default: return 'WIN!';
          }
        };

        winText.textContent = getWinTextContent(tier);
        winText.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: ${finalFontSize}px;
          font-weight: bold;
          color: ${getWinTextColor(effectsTier)};
          text-shadow: 0 0 10px rgba(0,0,0,0.8);
          pointer-events: none;
          z-index: 102;
        `;

        overlay.appendChild(winText);

        winText.animate([
          { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.3 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.8 },
          { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
        ], { duration: effects.duration * 1000 });
      }

      // Cleanup
      setTimeout(() => {
        try {
          overlay.remove();
          console.log('[Step7] Win animation overlay cleaned up successfully - contained within canvas');
        } catch (error) {
          console.warn('[Step7] Error during overlay cleanup:', error);
        }
        setIsPlaying(false);
      }, effects.duration * 1000);
    } else {
      console.warn('[Step7] No preview container found for animation testing');
      console.log('[Step7] Available containers:', {
        step6Panel: !!document.querySelector('[data-testid="right-panel-step-6"]'),
        step7Panel: !!document.querySelector('[data-testid="right-panel-step-7"]'),
        gridWrapper: !!document.querySelector('.grid-preview-wrapper'),
        aspectVideo: !!document.querySelector('.aspect-video')
      });
      setIsPlaying(false);
    }
  }, [isPlaying, customEffects, assetState.winTitles, betlineConfig]);

  // Helper functions
  const getParticleColor = (tier: WinTier): string => {
    const colors = {
      small: '#3B82F6',
      big: '#F97316',
      mega: '#9333EA',
      super: '#EAB308'
    };
    return colors[tier];
  };

  const getWinTextColor = (tier: WinTier): string => {
    const colors = {
      small: '#3B82F6',
      big: '#F97316',
      mega: '#9333EA',
      super: '#EAB308'
    };
    return colors[tier];
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Win Animation Type Selection */}
      <div className="bg-white border rounded-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
          <div className="p-3 border-b border-gray-200 border-l-4 border-l-blue-500 bg-gray-50">
            <h2 className="font-semibold text-gray-900 text-lg uw:text-3xl">Win Animation</h2>
            <p className="text-gray-600 uw:text-2xl">Choose which win animations to display</p>
          </div>
        </div>

        <div className="p-3 uw:mt-5">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 uw:text-3xl">Animation Type:</label>
            <select
              value={(config as any).winAnimationType || 'both'}
              onChange={(e) => updateConfig({ winAnimationType: e.target.value as 'lines' | 'squares' | 'both' | 'curvedLines' } as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 uw:text-3xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="squares">Glowing Squares</option>
              <option value="both">Both Lines & Squares</option>
              <option value="lines">Curved Lines</option>
            </select>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 uw:gap-5">
              <div className="p-2 bg-gray-50 rounded border">
                <div className="font-medium text-gray-800 uw:text-3xl">Squares Only</div>
                <div className="text-xs text-gray-600 uw:text-2xl">Shows glowing squares around winning symbols</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <div className="font-medium text-gray-800 uw:text-3xl">Both</div>
                <div className="text-xs text-gray-600 uw:text-2xl">Shows both lines and squares for maximum impact</div>
              </div>
              <div className="p-2 bg-gray-50 rounded border">
                <div className="font-medium text-gray-800 uw:text-3xl">Curved Lines</div>
                <div className="text-xs text-gray-600 uw:text-3xl">Shows smooth curved paylines with wave-like movement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className=" mb-8 bg-white border rounded-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
          <div className="p-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50 uw:mt-5">
            <h1 className="font-semibold text-gray-900 text-lg uw:text-3xl">Win Animation Workshop</h1>
            <p className="text-gray-600 uw:text-2xl">Design professional win celebrations that keep players engaged</p>
          </div>
        </div>

        <div className='p-3'>
          {/* Betline Celebration Configuration - UPDATED FOR VISIBILITY */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="w-full p-2 flex  bg-gray-50 items-center justify-between transition-colors"
            >
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 uw:text-3xl">Betline Celebrations</h3>
                <p className="text-gray-600 uw:text-2xl">Configure payline animations and symbol highlighting</p>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="p-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* General Settings */}
                    <div className="space-y-2 p-2">
                      <div className='pb-2 border-b'>
                        <h4 className="font-semibold text-gray-800 uw:text-3xl">General Settings</h4>
                      </div>

                      {/* Enable/Disable */}
                      <div className="flex items-center space-x-2 rounded-md bg-gray-50 p-2 border">
                        <input
                          type="checkbox"
                          id="betline-enabled"
                          checked={betlineConfig.enabled}
                          onChange={(e) => handleBetlineConfigChange({ enabled: e.target.checked })}
                          className="w-4 h-4 uw:h-6 uw:w-6"
                        />
                        <label htmlFor="betline-enabled" className="font-medium text-gray-700 uw:text-3xl">
                          Enable Betline Celebrations
                        </label>
                      </div>

                      {/* Line Style */}
                      <div className='border rounded-md bg-gray-50 flex items-center justify-between p-2'>
                        <label className="block text-sm font-medium text-gray-700 uw:text-3xl">
                          Line Style :
                        </label>
                        {/* <select
                          value={betlineConfig.style}
                          onChange={(e) => handleBetlineConfigChange({ style: e.target.value as any })}
                          className="w-[70%] border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uw:text-2xl"
                          disabled={!betlineConfig.enabled}
                        >
                          {/* <option value="solid">Solid Lines</option> */}
                        {/* <option value="dashed">Dashed Lines</option> */}
                        {/* <option value="glowing">Glowing Lines</option> */}
                        {/* <option value="pulsing">Pulsing Lines</option> */}
                        {/* </select> */}
                        <div className="block text-l font-medium text-red-600 uw:text-3xl">
                          Glowing Lines
                        </div>
                      </div>

                      {/* Line Width */}
                      <div className='border rounded-md bg-gray-50 p-2'>
                        <label className="block text-sm font-medium text-gray-700 mb-1 uw:text-2xl">
                          Line Width: {betlineConfig.width}px
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={betlineConfig.width}
                          onChange={(e) => handleBetlineConfigChange({ width: parseInt(e.target.value) })}
                          className="w-full"
                          disabled={!betlineConfig.enabled}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt- uw:text-2xl">
                          <span>Thin</span>
                          <span>Thick</span>
                        </div>
                      </div>

                      {/* Animation Speed */}
                      <div className='border rounded-md bg-gray-50 p-2'>
                        <label className="block text-sm font-medium text-gray-700 mb-1 uw:text-2xl">
                          Animation Speed: {betlineConfig.speed}s
                        </label>
                        <input
                          type="range"
                          min="0.3"
                          max="3"
                          step="0.1"
                          value={betlineConfig.speed}
                          onChange={(e) => handleBetlineConfigChange({ speed: parseFloat(e.target.value) })}
                          className="w-full"
                          disabled={!betlineConfig.enabled}
                        />
                        <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                          <span>Fast</span>
                          <span>Slow</span>
                        </div>
                      </div>

                      {/* Win Type Selection */}
                      <div className='border rounded-md bg-gray-50 flex items-center justify-between p-2'>
                        <label className="block text-sm font-medium text-gray-700 uw:text-2xl">
                          Win Type
                        </label>
                        <select
                          value={selectedWinType}
                          onChange={(e) => setSelectedWinType(e.target.value as any)}
                          className="w-[70%] border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uw:text-2xl"
                          disabled={!betlineConfig.enabled}
                        >
                          <option value="big">Big Win</option>
                          <option value="mega">Mega Win</option>
                          <option value="super">Super Win</option>
                          <option value="freeSpins">Free Spins</option>
                          <option value="bonusGame">Bonus Game</option>
                          <option value="pickAndClick">Pick & Click</option>
                        </select>
                      </div>
                    </div>

                    {/* Timing & Effects */}
                    <div className="space-y-2 p-2">
                      <div className='pb-2 border-b'>
                        <h4 className="font-semibold text-gray-800 uw:text-3xl">Timing & Effects</h4>
                      </div>

                      {/* Sequential Display */}
                      <div className="flex border p-2 bg-gray-50 rounded-md flex-col">
                        <div className='flex items-center space-x-3'>
                          <input
                            type="checkbox"
                            id="betline-sequential"
                            checked={betlineConfig.sequential}
                            onChange={(e) => handleBetlineConfigChange({ sequential: e.target.checked })}
                            className="w-4 h-4 uw:h-6 uw:w-6"
                            disabled={!betlineConfig.enabled}
                          />
                          <label htmlFor="betline-sequential" className="font-medium text-gray-700 uw:text-2xl">
                            Show Lines Sequentially
                          </label>
                        </div>
                        {/* Pause Between Lines */}
                        {betlineConfig.sequential && (
                          <div className='pt-2'>
                            <label className="block text-sm font-medium text-gray-700 mb- uw:text-2xl">
                              Pause Between Lines: {betlineConfig.pauseBetweenLines}s
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.1"
                              value={betlineConfig.pauseBetweenLines}
                              onChange={(e) => handleBetlineConfigChange({ pauseBetweenLines: parseFloat(e.target.value) })}
                              className="w-full"
                              disabled={!betlineConfig.enabled}
                            />
                            <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                              <span>No Pause</span>
                              <span>2s Pause</span>
                            </div>
                          </div>
                        )}
                      </div>


                      {/* Symbol Highlighting */}
                      <div className="flex flex-col p-2 border rounded-md bg-gray-50">
                        <div className='flex items-center space-x-3'>
                          <input
                            type="checkbox"
                            id="symbol-highlight"
                            checked={betlineConfig.symbolHighlight}
                            onChange={(e) => handleBetlineConfigChange({ symbolHighlight: e.target.checked })}
                            className="w-4 h-4 uw:h-6 uw:w-6"
                            disabled={!betlineConfig.enabled}
                          />
                          <label htmlFor="symbol-highlight" className="font-medium text-gray-700 uw:text-3xl">
                            Highlight Winning Symbols
                          </label>
                        </div>
                        {/* Symbol Highlight Duration */}
                        {betlineConfig.symbolHighlight && (
                          <div className='pt-2'>
                            <label className="block text-sm font-medium text-gray-700 mb-1 uw:text-2xl">
                              Symbol Highlight Duration: {betlineConfig.symbolHighlightDuration}s
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="3"
                              step="0.1"
                              value={betlineConfig.symbolHighlightDuration}
                              onChange={(e) => handleBetlineConfigChange({ symbolHighlightDuration: parseFloat(e.target.value) })}
                              className="w-full"
                              disabled={!betlineConfig.enabled}
                            />
                            <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                              <span>Brief</span>
                              <span>Long</span>
                            </div>
                          </div>
                        )}
                      </div>


                      {/* Payline Colors with Color Picker */}
                      <div className='p-3 bg-gray-50 border rounded-md'>
                        <label className="block text-sm font-medium text-gray-700 mb-2 uw:text-3xl">
                          Payline Colors
                        </label>
                        <div className="space-y-3">
                          {/* Color Grid */}
                          <div className="grid grid-cols-4">
                            {betlineConfig.colors.map((color, index) => (
                              <div key={index} className="flex flex-col items-center space-y-1">
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => {
                                      const newColors = [...betlineConfig.colors];
                                      newColors[index] = e.target.value;
                                      handleBetlineConfigChange({ colors: newColors });
                                    }}
                                    className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                                    title={`Click to change color for Line ${index + 1}`}
                                    disabled={!betlineConfig.enabled}
                                  />
                                  {/* Color preview overlay */}
                                  <div
                                    className="absolute inset-0 rounded pointer-events-none border-2 border-gray-300"
                                    style={{ backgroundColor: color }}
                                  />
                                </div>
                                {/* <span className="text-xs text-gray-600">L{index + 1}</span> */}
                              </div>
                            ))}
                          </div>

                          {/* Add/Remove Color Buttons */}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <button
                              onClick={() => {
                                const newColors = [...betlineConfig.colors, '#FF6B6B'];
                                handleBetlineConfigChange({ colors: newColors });
                              }}
                              disabled={!betlineConfig.enabled || betlineConfig.colors.length >= 12}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed uw:text-2xl"
                            >
                              + Add Color
                            </button>
                            <span className="text-xs text-gray-500 uw:text-2xl">
                              {betlineConfig.colors.length} colors
                            </span>
                            <button
                              onClick={() => {
                                if (betlineConfig.colors.length > 1) {
                                  const newColors = betlineConfig.colors.slice(0, -1);
                                  handleBetlineConfigChange({ colors: newColors });
                                }
                              }}
                              disabled={!betlineConfig.enabled || betlineConfig.colors.length <= 1}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed uw:text-2xl"
                            >
                              - Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Betlines Button */}
                  <div className="mt-2 flex justify-center">
                    <Button
                      variant='generate'
                      onClick={() => triggerAnimation(selectedWinType)}
                      disabled={isPlaying || !betlineConfig.enabled}
                      className={` p-2 ${isPlaying || !betlineConfig.enabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                      {isPlaying ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 uw:h-8 uw:w-8 mr-2 uw:mr-1 inline" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 uw:h-8 uw:w-8 mr-2 uw:mr-0 inline" />
                          Test Betline Animation
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Information Box */}
                  {/* <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-bold text-blue-800 mb-2 flex items-center">
                    <Info className="mr-2" size={18} />
                    How Betline Celebrations Work
                  </h5>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>• <strong>Sequential Mode:</strong> Lines appear one by one with configurable pauses</p>
                    <p>• <strong>Symbol Highlighting:</strong> Winning symbols glow when their payline activates</p>
                    <p>• <strong>Multiple Styles:</strong> Choose from solid, dashed, glowing, or pulsing line effects</p>
                    <p>• <strong>Professional Timing:</strong> Betlines show first, then particles and win titles follow</p>
                    <p>• <strong>Future Ready:</strong> Will automatically switch to cluster highlighting for cluster pay games</p>
                  </div>
                </div> */}
                </div>
              </motion.div>

            </AnimatePresence>
          </motion.div>
        </div>

      </div>

      {/* Asset Generation Panel */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
          <div className="p-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h1 className="font-semibold text-gray-900 text-lg uw:text-3xl">Win Celebration Assets</h1>
            <p className="text-gray-600 uw:text-2xl">Generate win titles and particle effects for your game</p>
          </div>
        </div>
        {/* Number Images Section */}
        <div className='p-3'>
          <div className="p-3 border rounded-md bg-gray-50">
            <h4 className="text-lg font-bold text-gray-900 mb-3 uw:text-3xl">Number Images (0-9)</h4>
            <p className="text-sm text-gray-600 mb-3 uw:text-2xl">Generate stylized number images for win multipliers and counters</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 uw:text-2xl">
                <select
                  value={numberImageStyle}
                  onChange={(e) => {
                    setNumberImageStyle(e.target.value);
                    // Clear manual prompt when switching away from manual mode
                    if (e.target.value !== 'mannual') {
                      setManualPrompt('');
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stone">Castle Stone</option>
                  <option value="wood">Wood Carved</option>
                  <option value="crystal">Ice Crystal</option>
                  <option value="runes">Glowing Runes</option>
                  <option value="neon">Neon Glow</option>
                  <option value="gold">Golden Metal</option>
                  <option value="mannual">Manual</option>
                </select>

                <Button
                  variant="generate"
                  onClick={generateNumberImages}
                  disabled={numberImagesState.isGenerating || (numberImageStyle === 'mannual' && !manualPrompt.trim())}
                  className="px-4 py-2 uw:px-2 uw:py-2"
                >
                  {numberImagesState.isGenerating ? (
                    <Loader2 className="w-4 h-4 uw:h-8 uw:w-8 mr-2 uw:mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 uw:h-8 uw:w-8 mr-2 uw:mr-0" />
                  )}
                  {numberImagesState.isGenerating ? 'Generating...' : 'Generate All Numbers'}
                </Button>
              </div>

              {/* Manual Prompt Input - Only show when Manual is selected */}
              {numberImageStyle === 'mannual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border rounded-md bg-gray-50 p-3"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2 uw:text-3xl">
                    Custom Style Prompt
                  </label>
                  <textarea
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="Enter your custom style description... e.g., 'vintage steampunk brass with gears and rivets', 'glowing neon cyberpunk with electric blue outlines', 'ancient Egyptian hieroglyphic style with gold accents'"
                    className="w-full text-sm uw:text-2xl border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2 uw:text-2xl">
                    Describe the style you want for your number images. This will be combined with technical requirements to generate professional slot machine number images.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Number Images Grid */}
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'dot'].map((item) => (
                <div key={item} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                  <div className="w-16 h-16 uw:h-12 uw:w-12 mx-auto mb-2 bg-gray-100 rounded border flex items-center justify-center">
                    {numberImagesState.images[item] ? (
                      <img
                        src={numberImagesState.images[item]}
                        alt={item === 'dot' ? 'Decimal Point' : `Number ${item}`}
                        className="w-full h-full object-contain rounded"
                      />
                    ) : (
                      <span className="text-2xl  font-bold text-gray-400 uw:text-2xl">{item === 'dot' ? '.' : item}</span>
                    )}
                  </div>
                  <span className="text-xs  text-gray-600 uw:text-xl">{item === 'dot' ? '.' : item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="p-3 space-y-3">
              {/* Asset Generation Controls */}
              <div className='p-2 border rounded-md bg-gray-50'>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 uw:text-3xl">Asset Generator</h4>
                    <p className="text-sm text-gray-600 uw:text-2xl">Create professional win titles and particle effects</p>
                  </div>
                  <Button
                    variant='generate'
                    onClick={generateAllAssets}
                    disabled={assetState.isGenerating}
                    className="p-2"
                  >
                    {assetState.isGenerating ? (
                      <Loader2 className="w-4 h-4 uw:h-8 uw:w-8 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 uw:h-8 uw:w-8" />
                    )}
                    <span>{assetState.isGenerating ? 'Generating...' : 'Generate All Assets'}</span>
                  </Button>
                </div>
                {/* Win Titles Section */}
                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                  <h5 className="font-bold text-gray-800 mb-2 flex items-center uw:text-3xl">
                    Win Title Assets
                    <span className="ml-2 text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded uw:text-2xl">
                      Customizable Text & Fonts
                    </span>
                  </h5>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {assetState.winTitles.slice(0, 3).map((title) => (
                      <div key={title.id} className="bg-gray-50 rounded-lg p-1 border border-gray-200">
                        {/* Title Header */}

                        <div className="flex items-center  justify-between">
                          <div className="flex flex-col w-[60%]">
                            <span className="font-medium text-gray-900 uw:text-2xl">
                              {title.customText || title.text}
                            </span>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2 uw:text-xl">
                              <span>{title.type.toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="flex flex-col w-[40%] items-end  gap-1">
                            <button
                              onClick={() => toggleTitleEditing(title.id)}
                              className={`text-xs px-2 py-1 rounded transition-all uw:text-3xl uw:mb-4 uw:mt-0 ${title.isEditing
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                              {title.isEditing ? 'Done' : 'Edit'}
                            </button>

                            {/* Upload Button */}
                            <button
                              onClick={() => uploadWinTitle(title.id)}
                              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-all uw:text-3xl uw:mb-4"
                              title="Upload custom title image"
                            >
                              Upload
                            </button>

                            {/* Delete Button - only show if generated */}
                            {title.generated && (
                              <button
                                onClick={() => deleteWinTitle(title.id)}
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-all uw:text-2xl uw:mb-4"
                                title="Delete generated title"
                              >
                                Delete
                              </button>
                            )}

                            {title.generated ? (
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4 uw:h-8 uw:w-8 text-green-500" />
                                  <span className="text-xs uw:text-3xl uw:mb-4 text-green-600">Generated</span>
                                </div>
                                <Button
                                  variant='generate'
                                  onClick={() => previewWinTitle(title)}
                                  disabled={previewingWinTitle?.id === title.id}
                                  className="px-2 py-1 text-xs  bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  {previewingWinTitle?.id === title.id ? (
                                    <>
                                      <Eye className="w-3 h-3 uw:h-8 uw:w-8 mr-1" />
                                      Previewing...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 uw:h-8 uw:w-8 mr-1" />
                                      Preview
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant='generate'
                                onClick={() => generateWinTitle(title.id)}
                                disabled={title.isGenerating}
                                className="px-1 text-xs uw:mb-5"
                              >
                                {title.isGenerating ? (
                                  <Loader2 className="w-3 h-3 uw:h-8 uw:w-8 animate-spin" />
                                ) : (
                                  'Generate'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>


                        {/* Editing Interface */}
                        {title.isEditing && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 mt-2 p-2 bg-white rounded-lg border"
                          >
                            {/* Custom Text Input */}
                            <div className='border p-1 bg-gray-50 rounded-md'>
                              <label className="block text-xs uw:text-3xl font-medium text-gray-700 mb-1">
                                Custom Text (leave empty to use default)
                              </label>
                              <input
                                type="text"
                                value={title.customText || ''}
                                onChange={(e) => updateTitleProperty(title.id, 'customText', e.target.value)}
                                placeholder={title.text}
                                className="w-full text-sm uw:text-2xl border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {/* Custom AI Prompt Input */}
                            <div className='border p-1 bg-gray-50 rounded-md'>
                              <label className="block text-xs uw:text-3xl font-medium text-gray-700 mb-1">
                                Custom AI Prompt (optional)
                              </label>
                              <textarea
                                value={title.customPrompt || ''}
                                onChange={(e) => updateTitleProperty(title.id, 'customPrompt', e.target.value)}
                                placeholder="Describe how you want this title to look... e.g., 'Golden glowing text with medieval style ornaments'"
                                className="w-full text-sm uw:text-xl border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                              />
                              <p className="text-xs uw:text-xl text-gray-500 mt-1">
                                If provided, this will override the default style settings and generate a completely custom title image.
                              </p>
                            </div>


                            {/* Title Image Size - Controls display size of generated titles */}
                            <div className='border p-1 bg-gray-50 rounded-md'>
                              <label className="block text-xs uw:text-3xl font-medium text-gray-700 mb-1">
                                Title Display Size: {title.titleImageSize || 100}%
                              </label>
                              <input
                                type="range"
                                min="50"
                                max="500"
                                step="10"
                                value={title.titleImageSize || 100}
                                onChange={(e) => updateTitleProperty(title.id, 'titleImageSize', parseInt(e.target.value))}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                <span>50%</span>
                                <span>{title.titleImageSize || 100}%</span>
                                <span>500%</span>
                              </div>
                              <p className="text-xs uw:text-2xl text-gray-500 mt-1">
                                Controls how large the title appears in celebrations
                              </p>
                            </div>

                            {/* Reset Button */}
                            <button
                              onClick={() => resetTitleToDefault(title.id)}
                              className="text-xs uw:text-2xl px-2 py-1 border text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-all"
                            >
                              Reset to Default
                            </button>
                          </motion.div>
                        )}

                        {/* Generated Asset Preview */}
                        {/* {title.generatedUrl && (
                          <div className="mt-2 bg-gray-100 rounded p-2">
                            <img
                              src={title.generatedUrl}
                              alt={title.customText || title.text}
                              className="w-full h-auto rounded border bg-white"
                              style={{ maxHeight: '60px', objectFit: 'contain' }}
                            />
                          </div>
                        )} */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Particles Section */}
              <div className="border rounded-lg p-2 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-gray-800 flex items-center uw:text-3xl">
                    Particle Assets
                  </h5>
                  <Button
                    variant='generate'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addParticle();
                    }}
                    className="text-sm px-3 py-1"
                  >
                    + Add Particle
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 border p-2 rounded-md bg-white gap-3">
                  {assetState.particles.map((particle) => (
                    <div key={particle.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="text-cente mb-2">
                        <div className="flex items-center relative justify-between">
                          <div className=' '>
                            <div className="text-sm font-medium text-gray-900 uw:text-3xl">{particle.name}</div>
                            <div className="text-xs text-gray-600 uw:text-3xl">{particle.size}</div>
                            {/* Win Tier Indicators */}
                            {particle.winTiers && particle.winTiers.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {particle.winTiers.map(tier => (
                                  <span
                                    key={tier}
                                    className={`text-xs px-1 py-0.5 rounded text-white uw:text-2xl uw:mt-2 uw:mr-2 ${tier === 'small' ? 'bg-blue-500' :
                                      tier === 'big' ? 'bg-orange-500' :
                                        tier === 'mega' ? 'bg-purple-500' :
                                          tier === 'super' ? 'bg-yellow-500' :
                                            'bg-gray-500'
                                      }`}
                                  >
                                    {tier.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex absolute top-0 right-0 items-center space-x-1 uw:space-x-3">
                            <button
                              onClick={() => setAssetState(prev => ({
                                ...prev,
                                particles: prev.particles.map(p =>
                                  p.id === particle.id ? { ...p, isEditing: !p.isEditing } : p
                                )
                              }))}
                              className="text-purple-600 hover:text-purple-800 uw:text-3xl"
                              title="Edit particle settings"
                            >
                              <Settings className="w-4 h-4 uw:w-7 uw:h-7" />
                            </button>
                            <button
                              onClick={() => removeParticle(particle.id)}
                              className="text-red-500 hover:text-red-700 transition-colors uw:text-3xl"
                              title="Remove particle"
                            >
                              <X className="w-4 h-4 uw:w-8 uw:h-8" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Particle Editing Interface */}
                      {particle.isEditing && (
                        <div className="space-y-2 mb-3 p-1 bg-white rounded-lg border">
                          {/* Basic Properties */}
                          <div className="border p-1 bg-gray-50 rounded-md gap-2">
                            <div>
                              <label className="block text-xs uw:text-3xl font-medium text-gray-700 mb-1">
                                Particle Name
                              </label>
                              <input
                                type="text"
                                value={particle.name}
                                onChange={(e) => updateParticle(particle.id, { name: e.target.value })}
                                className="w-full text-sm uw:text-2xl border border-gray-300 rounded px-2 py-1"
                                placeholder="Particle name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs uw:text-2xl font-medium text-gray-700 mb-1">
                                Size
                              </label>
                              <select
                                value={particle.size}
                                onChange={(e) => updateParticle(particle.id, { size: e.target.value as 'small' | 'medium' | 'large' })}
                                className="w-full text-sm uw:text-2xl border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                              </select>
                            </div>
                          </div>

                          {/* Custom AI Prompt Input */}
                          <div className='p-1 border rounded-md bg-gray-50'>
                            <label className="block text-xs uw:text-3xl font-medium text-gray-700 mb-1">
                              Custom AI Prompt (optional)
                            </label>
                            <textarea
                              value={particle.customPrompt || ''}
                              onChange={(e) => updateParticle(particle.id, { customPrompt: e.target.value })}
                              placeholder="Describe your custom particles... e.g., 'Golden treasure chests', 'Magical floating crystals', 'Ancient Roman coins'"
                              className="w-full text-sm uw:text-xl border border-gray-300 rounded px-2 py-1"
                              rows={3}
                            />
                            <p className="text-xs uw:text-2xl text-gray-500 mt-1">
                              Custom prompts will create unique particles instead of standard icons.
                            </p>
                          </div>

                          {/* Win Tier Assignment */}
                          <div className='p-1 border rounded-md bg-gray-50'>
                            <label className="block text-xs  uw:text-3xl font-medium text-gray-700 mb-1">
                              Assign to Win Tiers
                            </label>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { key: 'big', label: 'Big Win' },
                                { key: 'mega', label: 'Mega Win' },
                                { key: 'super', label: 'Super Win' }
                              ].map((tier) => (
                                <label key={tier.key} className="flex border p-0.5 rounded-md bg-white items-center text-xs uw:text-2xl">
                                  <input
                                    type="checkbox"
                                    checked={particle.winTiers?.includes(tier.key as any) || false}
                                    onChange={(e) => {
                                      const currentWinTiers = particle.winTiers || [];
                                      const newWinTiers = e.target.checked
                                        ? [...currentWinTiers, tier.key as any]
                                        : currentWinTiers.filter(t => t !== tier.key);
                                      updateParticle(particle.id, { winTiers: newWinTiers });
                                    }}
                                    className="mr-0.5 uw:h-6 uw:w-6"
                                  />
                                  {tier.label}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Celebration Effects Configuration */}
                          <div className="border border-gray-200 bg-gray-50 rounded-md p-1 ">
                            <h6 className="text-xs uw:text-3xl font-semibold text-gray-800 mb-1 flex items-center">
                              Celebration Effects
                            </h6>

                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {/* Particle Size Control */}
                              <div className='p-2 border bg-white rounded-md'>
                                <label className="block text-xs uw:text-2xl font-normal text-gray-700 ">
                                  Particle Size
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="500"
                                  step="10"
                                  value={particle.celebrationSize || 100}
                                  onChange={(e) => updateParticle(particle.id, { celebrationSize: parseInt(e.target.value) })}
                                  className="w-full h-1.5"
                                />
                                <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                  <span>10%</span>
                                  <span>{particle.celebrationSize || 100}%</span>
                                  <span>500%</span>
                                </div>
                              </div>

                              {/* Fountain Spread Control */}
                              <div className='p-2 border bg-white rounded-md'>
                                <label className="block text-xsuw:text-2xl font-normal text-gray-700">
                                  Fountain Spread
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="400"
                                  step="10"
                                  value={particle.fountainSpread || 100}
                                  onChange={(e) => updateParticle(particle.id, { fountainSpread: parseInt(e.target.value) })}
                                  className="w-full h-1.5"
                                />
                                <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                  <span>10%</span>
                                  <span>{particle.fountainSpread || 100}%</span>
                                  <span>400%</span>
                                </div>
                              </div>

                              {/* Particle Speed Control */}
                              <div className='p-2 border bg-white rounded-md'>
                                <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                  Animation Speed
                                </label>
                                <input
                                  type="range"
                                  min="20"
                                  max="500"
                                  step="10"
                                  value={particle.particleSpeed || 100}
                                  onChange={(e) => updateParticle(particle.id, { particleSpeed: parseInt(e.target.value) })}
                                  className="w-full h-1.5"
                                />
                                <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                  <span>20%</span>
                                  <span>{particle.particleSpeed || 100}%</span>
                                  <span>500%</span>
                                </div>
                              </div>

                              {/* Particle Density Control */}
                              <div className='p-2 border bg-white rounded-md'>
                                <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                  Particle Density
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="1000"
                                  step="10"
                                  value={particle.particleDensity || 100}
                                  onChange={(e) => updateParticle(particle.id, { particleDensity: parseInt(e.target.value) })}
                                  className="w-full h-1.5"
                                />
                                <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                  <span>10%</span>
                                  <span>{particle.particleDensity || 100}%</span>
                                  <span>1000%</span>
                                </div>
                              </div>
                            </div>

                            {/* Advanced Fountain Pattern Controls */}
                            <div className="border border-gray-200 bg-gray-50 rounded-md p-1 mt-2">
                              <h6 className="text-xs uw:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                                Fountain Patterns
                              </h6>

                              {/* Pattern Selector */}
                              <div className="mb-2">
                                <select
                                  value={particle.fountainPattern || 'classic-3'}
                                  onChange={(e) => updateParticle(particle.id, {
                                    fountainPattern: e.target.value as 'classic-3' | 'fan-5' | 'wide-7' | 'single-vertical' | 'dual-side' | 'random-burst' | 'cascading'
                                  })}
                                  className="w-full text-xs uw:text-2xl border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                  <option value="classic-3">🏛️ Classic 3-Stream</option>
                                  <option value="fan-5">🎭 Fan 5-Stream</option>
                                  <option value="wide-7">🌊 Wide 7-Stream</option>
                                  <option value="single-vertical">⬆️ Single Vertical</option>
                                  <option value="dual-side">↔️ Dual Side</option>
                                  <option value="random-burst">🎆 Random Burst</option>
                                  <option value="cascading">🌋 Cascading</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {/* Left Angle Control */}
                                <div className='border p-1 bg-white rounded-md'>
                                  <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                    Left Angle
                                  </label>
                                  <input
                                    type="range"
                                    min="-90"
                                    max="0"
                                    step="5"
                                    value={particle.leftAngle || -45}
                                    onChange={(e) => updateParticle(particle.id, { leftAngle: parseInt(e.target.value) })}
                                    className="w-full h-1.5"
                                  />
                                  <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                    <span>-90°</span>
                                    <span>{particle.leftAngle || -45}°</span>
                                    <span>0°</span>
                                  </div>
                                </div>

                                {/* Right Angle Control */}
                                <div className='border p-1 bg-white rounded-md'>
                                  <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                    Right Angle
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="90"
                                    step="5"
                                    value={particle.rightAngle || 45}
                                    onChange={(e) => updateParticle(particle.id, { rightAngle: parseInt(e.target.value) })}
                                    className="w-full h-1.5"
                                  />
                                  <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                    <span>0°</span>
                                    <span>{particle.rightAngle || 45}°</span>
                                    <span>90°</span>
                                  </div>
                                </div>

                                {/* Center Weight Control */}
                                <div className='border p-1 bg-white rounded-md'>
                                  <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                    Center Weight
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="10"
                                    value={particle.centerWeight || 50}
                                    onChange={(e) => updateParticle(particle.id, { centerWeight: parseInt(e.target.value) })}
                                    className="w-full h-1.5"
                                  />
                                  <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                    <span>Sides</span>
                                    <span>{particle.centerWeight || 50}%</span>
                                    <span>Center</span>
                                  </div>
                                </div>

                                {/* Fountain Height Control */}
                                <div className='border p-1 bg-white rounded-md'>
                                  <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                    Fountain Height
                                  </label>
                                  <input
                                    type="range"
                                    min="50"
                                    max="300"
                                    step="10"
                                    value={particle.fountainHeight || 100}
                                    onChange={(e) => updateParticle(particle.id, { fountainHeight: parseInt(e.target.value) })}
                                    className="w-full h-1.5"
                                  />
                                  <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                    <span>50%</span>
                                    <span>{particle.fountainHeight || 100}%</span>
                                    <span>300%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Wind Effect Control */}
                              <div className="mt-2 border p-1 rounded-md bg-white">
                                <label className="block text-xs uw:text-2xl font-normal text-gray-700">
                                  Wind Effect
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={particle.windEffect || 0}
                                  onChange={(e) => updateParticle(particle.id, { windEffect: parseInt(e.target.value) })}
                                  className="w-full h-1.5"
                                />
                                <div className="flex justify-between text-xs uw:text-2xl text-gray-500">
                                  <span>None</span>
                                  <span>{particle.windEffect || 0}%</span>
                                  <span>Strong</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs uw:text-2xl text-gray-500 mt-2 text-center">
                              Create custom fountain patterns and directional effects
                            </p>
                          </div>
                        </div>
                      )}

                      {particle.generatedUrl ? (
                        <div className="flex flex-col items-center space-y-2">
                          <img
                            src={cleanDataUrl(particle.generatedUrl)}
                            alt={particle.name}
                            className="w-8 h-8 uw:h-20 uw:w-20 rounded"
                          />
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 uw:h-8 uw:w-8 text-green-500" />
                            <span className="text-xs uw:text-2xl text-green-600">Ready</span>
                          </div>
                          <div className="flex space-x-1 uw:gap-3">
                            <button
                              onClick={() => uploadParticle(particle.id)}
                              className="text-xs px-1 py-0.5 uw:px-3 uw:py-3 uw:mt-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-all uw:text-3xl"
                              title="Upload custom particle"
                            >
                              Upload
                            </button>
                            <button
                              onClick={() => deleteParticle(particle.id)}
                              className="text-xs uw:text-3xl px-1 py-0.5 uw:mr-10 uw:mt-4 uw:px-4  rounded bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                              title="Delete generated particle"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <div
                            className="w-8 h-8 uw:mt-8 uw:h-18 uw:w-18  rounded border-2 border-dashed border-gray-300 flex items-center justify-center"
                            style={{ backgroundColor: particle.themeColor + '20' }}
                          >
                            <ImageIcon className="w-4 h-4  text-gray-400 uw:w-18 uw:h-18" />
                          </div>

                          <div className="flex flex-col space-y-1">
                            <Button
                              variant='generate'
                              onClick={() => generateParticle(particle.id)}
                              disabled={particle.isGenerating}
                              // className={`text-xs px-2 py-1 rounded transition-all ${particle.isGenerating
                              //   ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              //   : 'bg-purple-600 text-white hover:bg-purple-700'
                              //   }`}
                              className='text-xs uw:text-2xl px-2 uw:mb-2 py-1 rounded '
                            >
                              {particle.isGenerating ? (
                                <Loader2 className="w-3 h-3 uw:h-8 uw:w-8  animate-spin" />
                              ) : (
                                'Generate'
                              )}
                            </Button>
                            <button
                              onClick={() => uploadParticle(particle.id)}
                              className="text-xs  px-2 py-1 uw:py-2 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-all uw:text-3xl"
                              title="Upload custom particle"
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Asset Summary */}
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center uw:text-3xl">
                  Asset Summary
                </h5>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-1 text-sm">
                  <div className="justify-center border p-1 gap-2 rounded-md bg-white flex flex-co items-center">
                    <div className="text-lg font-semibold text-blue-600 uw:text-2xl">
                      {assetState.winTitles.filter(t => t.generated).length}/{assetState.winTitles.length}
                    </div>
                    <div className="text-gray-600 uw:text-2xl">Win Titles</div>
                  </div>

                  <div className="justify-center border p-1 gap-2 rounded-md bg-white flex flex-co items-center">
                    <div className="text-lg font-semibold text-purple-600 uw:text-2xl">
                      {assetState.particles.filter(p => p.generated).length}/{assetState.particles.length}
                    </div>
                    <div className="text-gray-600 uw:text-2xl">Particles</div>
                  </div>

                  <div className="justify-center border p-1 gap-2 rounded-md bg-white flex flex-co items-center">
                    <div className="text-lg font-semibold text-green-600 uw:text-3xl">
                      {assetState.winTitles.filter(t => t.generated).length + assetState.particles.filter(p => p.generated).length}
                    </div>
                    <div className="text-gray-600 uw:text-2xl">Total Generated</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Quick Test Panel */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >

        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-lg uw:text-3xl">Quick Win Testing</h3>
        </div>
        <div className='p-3'>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(WIN_TIERS).map(([tier, config]) => (
              <button
                key={tier}
                onClick={() => triggerAnimation(tier as WinTier)}
                disabled={isPlaying}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${config.bgColor
                  } ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
              >
                <div className="text-center">
                  <div className={`text-2xl uw:text-2xl  font-bold ${config.color}`}>
                    {getMultiplierRange(tier as WinTier, winThresholds)}
                  </div>
                  <div className="text-sm text-gray-600 uw:text-xl">{config.description}</div>
                  {/* <div className="mt-2 text-xs text-gray-500">
                    {customEffects[tier as WinTier].particles} particles
                  </div> */}
                </div>
              </button>
            ))}
          </div>

          {/* Debug Particles Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                console.log('=== PARTICLE DEBUG ===');
                (['small', 'big', 'mega', 'super'] as WinTier[]).forEach(tier => {
                  const particles = getParticleTypesForTier(tier);
                  console.log(`${tier.toUpperCase()} tier particles:`, particles);
                });
                console.log('All particles state:', assetState.particles.map(p => ({
                  id: p.id,
                  name: p.name,
                  type: p.type,
                  winTiers: p.winTiers,
                  generated: p.generated,
                  fallback: p.type === 'custom' ? getCustomParticleFallback(p.name) : p.type
                })));
              }}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs uw:text-3xl hover:bg-yellow-200"
            >
              🐛 Debug Particles
            </button>
          </div>

          <div className="mt-2 border rounded-md p-2 bg-gray-50 gap-4 flex items-center justify-between">
            <div className="flex items-center border p-2 w-full bg-white rounded-md">
              <div className="flex items-center space-x-2 ">
                <Monitor className="w-4 h-4 text-gray-500 uw:w-6 uw:h-6" />
                <span className="text-sm text-gray-600 uw:text-2xl">Preview on:</span>
                <select
                  value={devicePreview}
                  onChange={(e) => setDevicePreview(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 uw:text-2xl"
                >
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
            </div>

            <div className="flex items-center border p-2 w-full bg-white rounded-md space-x-2">
              <Gauge className="w-4 h-4 text-gray-500 uw:w-6 uw:h-6" />
              <span className="text-sm text-gray-600 uw:text-2xl">Performance:</span>
              <select
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 uw:text-2xl"
              >
                <option value="quality">Quality</option>
                <option value="balanced">Balanced</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
        </div>


      </motion.div>

      {/* Win Multiplier Configuration */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-lg uw:text-3xl">Win Multiplier Configuration</h3>
          <p className="text-gray-600 uw:text-2xl">Set thresholds for Small, Big, Mega, and Super wins based on bet multipliers</p>
        </div>

        <AnimatePresence>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-3 space-y-3">
              {/* Industry Standards Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center uw:text-3xl">
                  Industry Standards
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center border bg-white p-2 rounded-md">
                    <div className="font-semibold text-blue-700 uw:text-2xl">Small Win</div>
                    <div className="text-blue-600 uw:text-2xl">1x - 5x bet</div>
                  </div>
                  <div className="text-center  border bg-white p-2 rounded-md">
                    <div className="font-semibold text-orange-700 uw:text-2xl">Big Win</div>
                    <div className="text-orange-600 uw:text-2xl">5x - 25x bet</div>
                  </div>
                  <div className="text-center border bg-white p-2 rounded-md">
                    <div className="font-semibold text-purple-700 uw:text-2xl">Mega Win</div>
                    <div className="text-purple-600 uw:text-2xl">25x - 100x bet</div>
                  </div>
                  <div className="text-center border bg-white p-2 rounded-md">
                    <div className="font-semibold text-yellow-700 uw:text-2xl">Super Win</div>
                    <div className="text-yellow-600 uw:text-2xl">100x+ bet</div>
                  </div>
                </div>
              </div>

              {/* Preset Selection */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center uw:text-3xl">
                  Multiplier Presets
                  {isCustomThresholds && (
                    <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded uw:text-2xl">
                      Custom
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 uw:gap-5">
                  {MULTIPLIER_PRESETS.map((preset) => (
                    <motion.div
                      key={preset.id}
                      className={`p-3 rounded-lg border-2 relative cursor-pointer transition-all ${selectedPresetId === preset.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      onClick={() => applyMultiplierPreset(preset.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`font-bold text-sm uw:text-3xl ${preset.category === 'player-friendly' ? 'text-blue-700' :
                        preset.category === 'balanced' ? 'text-green-700' :
                          preset.category === 'conservative' ? 'text-purple-700' :
                            'text-orange-700'
                        }`}>
                        {preset.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 uw:text-2xl">{preset.description}</div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1 uw:text-2xl">
                        <div className="flex justify-between">
                          <span>Big:</span><span>{preset.thresholds.bigWin}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mega:</span><span>{preset.thresholds.megaWin}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Super:</span><span>{preset.thresholds.superWin}x</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Custom Settings - Only visible when thresholds are manually modified */}

                  <motion.div
                    className={`p-3 rounded-lg border-2 relative cursor-pointer transition-all ${selectedPresetId === 'custom'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    onClick={() => {
                      setSelectedPresetId('custom');
                      setIsCustomThresholds(true);
                      // Don't change the actual thresholds, just mark as custom
                      updateConfig({
                        winMultiplierThresholds: winThresholds
                      });
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedPresetId === 'custom' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                    <div className="font-bold text-sm text-orange-700 uw:text-3xl">Custom Settings</div>
                    <div className="text-xs text-orange-600 mt-1 uw:text-2xl">Manually configured thresholds</div>
                    <div className="text-xs text-orange-500 mt-2 space-y-1 uw:text-2xl">
                      <div className="flex justify-between">
                        <span>Big:</span><span>{winThresholds.bigWin}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mega:</span><span>{winThresholds.megaWin}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Super:</span><span>{winThresholds.superWin}x</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Threshold Configuration */}
              {selectedPresetId === "custom" && (
                <div className="grid grid-cols-1 border p-2 rounded-md bg-gray-50 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className=" mb-4">
                      <h4 className="font-bold text-gray-800 uw:text-3xl">Fine-Tune Thresholds</h4>
                      <p className='text-sm text-gray-600 uw:text-2xl'>Adjust individual thresholds for precise control. Changes will create a custom configuration.</p>
                    </div>

                    {/* Big Win Threshold */}
                    <div className='border rounded-md bg-white p-2'>
                      <label className="block text-sm font-normal text-gray-700 mb- uw:text-2xl">
                        Big Win Threshold: {winThresholds.bigWin}x
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="0.1"
                        value={winThresholds.bigWin}
                        onChange={(e) => updateWinThresholds({ bigWin: parseFloat(e.target.value) })}
                        className="w-full h-1.5 uw:h-1.8"
                      />
                      <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                        <span>1x</span>
                        <span>50x</span>
                      </div>
                    </div>

                    {/* Mega Win Threshold */}
                    <div className='border rounded-md bg-white p-2'>
                      <label className="block text-sm font-normal text-gray-700 uw:text-2xl">
                        Mega Win Threshold: {winThresholds.megaWin}x
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="200"
                        step="0.5"
                        value={winThresholds.megaWin}
                        onChange={(e) => updateWinThresholds({ megaWin: parseFloat(e.target.value) })}
                        className="w-full h-1.5 uw:h-1.8"
                      />
                      <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                        <span>5x</span>
                        <span>200x</span>
                      </div>
                    </div>

                    {/* Super Win Threshold */}
                    <div className='border rounded-md bg-white p-2'>
                      <label className="block text-sm font-normal text-gray-700 uw:text-2xl">
                        Super Win Threshold: {winThresholds.superWin}x
                      </label>
                      <input
                        type="range"
                        min="25"
                        max="2000"
                        step="5"
                        value={winThresholds.superWin}
                        onChange={(e) => updateWinThresholds({ superWin: parseFloat(e.target.value) })}
                        className="w-full h-1.5 uw:h-1.8"
                      />
                      <div className="flex justify-between text-xs text-gray-500 uw:text-2xl">
                        <span>25x</span>
                        <span>2000x</span>
                      </div>
                    </div>

                    {/* Reset Options */}
                    <div className="flex space-x-2 border p-2 rounded-md bg-white">
                      <button
                        onClick={() => applyMultiplierPreset('industry-standard')}
                        className="text-sm px-3 py-1 border text-blue-600 hover:text-blue-700 hover: bg-blue-50 rounded transition-all uw:text-2xl"
                      >
                        Reset to Industry Standard
                      </button>
                      <button
                        onClick={() => applyMultiplierPreset('player-friendly')}
                        className="text-sm px-3 py-1 border text-green-600 hover:text-green-700 hover: bg-green-50 rounded transition-all uw:text-2xl"
                      >
                        Player-Friendly
                      </button>
                    </div>
                  </div>

                  {/* Live Win Calculator */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800 uw:text-3xl">Live Win Calculator</h4>

                    <div className="bg-white p-2 rounded-lg border">
                      <div className="space-y-2">
                        {/* Bet Amount Input */}
                        <div className='border p-1 rounded-md bg-gray-50'>
                          <label className="block text-sm font-medium text-gray-700 mb-1 uw:text-2xl">
                            Bet Amount ($)
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            max="1000"
                            step="0.1"
                            value={calculatorBet}
                            onChange={(e) => setCalculatorBet(parseFloat(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 uw:text-2xl"
                          />
                        </div>

                        {/* Win Amount Input */}
                        <div className='border p-1 rounded-md bg-gray-50'>
                          <label className="block text-sm font-medium text-gray-700 mb-1 uw:text-2xl">
                            Win Amount ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100000"
                            step="0.1"
                            value={calculatorWin}
                            onChange={(e) => setCalculatorWin(parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 uw:text-2xl"
                          />
                        </div>

                        {/* Calculation Result */}
                        {(() => {
                          const calculation = calculateWinTier(calculatorBet, calculatorWin, winThresholds);
                          const tierConfig = WIN_TIERS[calculation.tier];

                          return (
                            <div className="mt-4 p-3 bg-white rounded border-2 border-dashed border-gray-300">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 uw:text-3xl">
                                  {calculation.multiplier.toFixed(1)}x
                                </div>
                                <div className={`text-lg font-semibold ${tierConfig.color} mt-1 uw:text-2xl`}>
                                  {tierConfig.description.toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 uw:text-2xl">
                                  ${calculatorWin} ÷ ${calculatorBet} = {calculation.multiplier.toFixed(1)}x multiplier
                                </div>

                                {/* Dynamic Examples Based on Current Thresholds */}
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <div className="text-xs text-gray-600 uw:text-3xl">Examples with Current Thresholds:</div>
                                  <div className="text-xs text-gray-500 space-y-1 mt-1 uw:text-2xl">
                                    <div>Bet $1 → Win ${winThresholds.bigWin} = {winThresholds.bigWin}x = BIG WIN</div>
                                    <div>Bet $1 → Win ${winThresholds.megaWin} = {winThresholds.megaWin}x = MEGA WIN</div>
                                    <div>Bet $1 → Win ${winThresholds.superWin} = {winThresholds.superWin}x = SUPER WIN</div>
                                  </div>

                                  {/* Show current preset info */}
                                  <div className="mt-2 pt-1 border-t border-gray-100">
                                    <div className="text-xs font-medium text-gray-600 uw:text-2xl">
                                      {isCustomThresholds ? (
                                        <span className="text-orange-600">Custom Configuration</span>
                                      ) : (
                                        <span className="text-green-600 uw:text-2xl">
                                          {MULTIPLIER_PRESETS.find(p => p.id === selectedPresetId)?.name} Preset
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Current Ranges Display */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h5 className="font-bold text-gray-800 mb-3 uw:text-3xl">Current Win Tier Ranges</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(WIN_TIERS).map(([tier, tierConfig]) => (
                    <div key={tier} className={`text-center p-3 rounded-lg border-2 ${tierConfig.bgColor}`}>
                      <div className={`font-bold uw:text-2xl ${tierConfig.color}`}>
                        {tierConfig.description}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 uw:text-2xl">
                        {getMultiplierRange(tier as WinTier, winThresholds)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </AnimatePresence>
      </motion.div>

      {/* Animation Presets */}
      <motion.div
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-lg uw:text-3xl">Animation Presets</h3>
          <p className="text-gray-600 uw:text-2xl">Industry-standard animation packages</p>
        </div>
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ANIMATION_PRESETS.map((preset) => (
                  <motion.div
                    key={preset.id}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${selectedPreset === preset.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 '
                      }`}
                    onClick={() => applyPreset(preset.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 uw:text-3xl">{preset.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 uw:text-2xl">{preset.description}</p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 text-xs uw:text-2xl rounded-full uw:px-4 uw:py-4 ${preset.category === 'classic' ? 'bg-blue-100 text-blue-800' :
                            preset.category === 'modern' ? 'bg-green-100 text-green-800' :
                              preset.category === 'premium' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                            }`}>
                            {preset.category}
                          </span>
                        </div>
                      </div>
                      {selectedPreset === preset.id && (
                        <CheckCircle className="text-red-500 uw:h-7 uw:w-7" size={20} />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Advanced Configuration - Only show for advanced/expert users */}
      <div className='mt-2 h-1'></div>
    </div>
  );
};

export default Step8_WinAnimationWorkshop;