import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { 
  Sparkles, 
  Zap, 
  Check, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  LayoutGrid,
  Rocket,
  Clock,
  Hourglass,
  Trophy,
  Palette
} from 'lucide-react';

// Import animation components
import { PreviewReelController, PreviewReelConfig, WinResultType, DEFAULT_REEL_CONFIG } from './PreviewReelController';
import AnimationControls from './AnimationControls';
import AnimationPresets, { AnimationPreset } from './AnimationPresets';
import ThemeAnimationPresets, { ThemeAnimationPreset } from './ThemeAnimationPresets';
import AdvancedAnimationControls from './AdvancedAnimationControls';
import AdvancedAnimationWorkshop, { UnifiedAnimationConfig } from './AdvancedAnimationWorkshop';
import PremiumSlotMachine from '../../slot-visualization/PremiumSlotMachine';

enum AnimationCategory {
  REEL_SPIN = 'reel-spin',
  ANTICIPATION = 'anticipation',
  CELEBRATION = 'celebration'
}

interface EnhancedWinAnimationWorkshopProps {
  themeId?: string;
  themeName?: string;
}

const EnhancedWinAnimationWorkshop: React.FC<EnhancedWinAnimationWorkshopProps> = ({
  themeId,
  themeName
}) => {
  const { config, updateConfig } = useGameStore();
  
  // General state
  const [viewMode, setViewMode] = useState<'preset' | 'theme-preset' | 'advanced'>('theme-preset');
  const [activeCategory, setActiveCategory] = useState<AnimationCategory>(AnimationCategory.REEL_SPIN);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  
  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | ThemeAnimationPreset | null>(
    themeId?.includes('egypt') ? 'egypt-gold' : 
    themeId?.includes('cosmic') ? 'cosmic-nebula' :
    themeId?.includes('forest') ? 'forest-fairy' :
    themeId?.includes('ocean') ? 'ocean-treasure' :
    themeId?.includes('west') ? 'western-gold' :
    themeId?.includes('dynasty') ? 'dynasty-dragon' :
    themeId?.includes('candy') ? 'candy-sugar' :
    themeId?.includes('tropical') ? 'tropical-paradise' :
    themeId?.includes('aztec') ? 'aztec-temple' :
    'classic'
  );
  
  // Win animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [resultType, setResultType] = useState<WinResultType>('medium-win');
  const [forceWinType, setForceWinType] = useState<'' | 'small' | 'big' | 'mega'>('');
  
  // Animation configurations by category
  const [reelSpinConfig, setReelSpinConfig] = useState<Partial<PreviewReelConfig>>({
    ...DEFAULT_REEL_CONFIG,
    ...(config.reelAnimation || {})
  });
  
  const [anticipationConfig, setAnticipationConfig] = useState({
    duration: 1.5,
    intensity: 8,
    enabled: true,
    shakeEnabled: true,
    shakeIntensity: 5,
    flashEnabled: true,
    flashIntensity: 0.7,
    slowmoFactor: 0.5
  });
  
  const [celebrationConfig, setCelebrationConfig] = useState({
    duration: 3.0,
    intensity: 8,
    particles: 100,
    soundEnabled: true,
    screenFlashEnabled: true,
    symbolZoomEnabled: true,
    symbolZoomScale: 1.2,
    symbolRotationEnabled: true,
    symbolRotationAmount: 15,
    glowEnabled: true,
    glowColor: '#ffcc00',
    glowIntensity: 3
  });
  
  // Resolve preview asset URLs, giving priority to explicit store fields
  const bgUrl = config.background?.backgroundImage
    || config.backgroundImage
    || config.theme.generated?.background;
  const frUrl = config.theme.generated?.frame
    || config.frame?.frameImage;
  const symList = config.theme.generated?.symbols || [];
  
  // Build spin configuration for PremiumSlotMachine based on current settings
  const [currentSpinConfig, setCurrentSpinConfig] = useState({
    baseDuration: 2.0,
    staggerDelay: 0.2,
    anticipationPauseDuration: 0.0,
    overshoot: 0.2,
    bounceDuration: 0.5,
    bounceEase: "elastic.out(1, 0.3)",
    symbolScaleOnStop: 1.0, 
    flashAlpha: 0.5
  });
  
  // Update the spin config when animations change
  useEffect(() => {
    // Map our animation configs to PremiumSlotMachine config
    const newSpinConfig = {
      baseDuration: reelSpinConfig.spinDuration || 2.0,
      staggerDelay: reelSpinConfig.reelStartDelay || 0.2,
      anticipationPauseDuration: anticipationConfig.enabled ? anticipationConfig.duration : 0,
      overshoot: reelSpinConfig.bounceDistance ? reelSpinConfig.bounceDistance / 100 : 0.2,
      bounceDuration: reelSpinConfig.bounceDuration || 0.5,
      bounceEase: "elastic.out(1, 0.3)",
      symbolScaleOnStop: celebrationConfig.symbolZoomEnabled ? celebrationConfig.symbolZoomScale : 1.0,
      flashAlpha: celebrationConfig.screenFlashEnabled ? (celebrationConfig.intensity / 10) : 0
    };
    
    setCurrentSpinConfig(newSpinConfig);
  }, [reelSpinConfig, anticipationConfig, celebrationConfig]);
  
  // Handle preset selection
  const handleSelectPreset = (preset: AnimationPreset | ThemeAnimationPreset, presetConfig: Partial<PreviewReelConfig>) => {
    setSelectedPreset(preset);
    
    // Distribute preset configurations across our three categories
    const spinConfig = {
      spinDuration: presetConfig.spinDuration,
      reelStartDelay: presetConfig.reelStartDelay,
      bounceDistance: presetConfig.bounceDistance,
      bounceDuration: presetConfig.bounceDuration,
      easeInDuration: presetConfig.easeInDuration,
      easeOutDuration: presetConfig.easeOutDuration
    };
    
    const anticipConfig = {
      duration: presetConfig.anticipationDuration || 1.5,
      intensity: presetConfig.anticipationShakeIntensity || 8,
      enabled: presetConfig.enableAnticipation || false,
      shakeEnabled: true,
      shakeIntensity: presetConfig.anticipationShakeIntensity || 5,
      flashEnabled: true,
      flashIntensity: 0.7,
      slowmoFactor: 0.5
    };
    
    // Different celebration styles based on preset
    let celebConfig;
    
    // Handle standard presets
    if (preset === 'classic' || preset === 'dynamic' || preset === 'elegant' || 
        preset === 'dramatic' || preset === 'playful') {
      switch(preset) {
        case 'classic':
          celebConfig = { 
            ...celebrationConfig, 
            intensity: 6, 
            particles: 80, 
            glowColor: '#ffcc00',
            symbolZoomScale: 1.1
          };
          break;
        case 'dynamic':
          celebConfig = { 
            ...celebrationConfig, 
            intensity: 9, 
            particles: 120, 
            glowColor: '#29B6F6',
            symbolZoomScale: 1.3,
            symbolRotationAmount: 25
          };
          break;
        case 'elegant':
          celebConfig = { 
            ...celebrationConfig, 
            intensity: 5,
            particles: 60,
            glowColor: '#BA68C8',
            symbolZoomScale: 1.15,
            symbolRotationAmount: 8
          };
          break;
        case 'dramatic':
          celebConfig = { 
            ...celebrationConfig, 
            intensity: 10,
            particles: 150,
            glowColor: '#F44336',
            symbolZoomScale: 1.4,
            symbolRotationAmount: 35
          };
          break;
        case 'playful':
          celebConfig = { 
            ...celebrationConfig, 
            intensity: 8,
            particles: 100,
            glowColor: '#66BB6A',
            symbolZoomScale: 1.25,
            symbolRotationAmount: 45
          };
          break;
        default:
          celebConfig = celebrationConfig;
      }
    } 
    // Handle theme-specific presets
    else {
      // Process theme-specific presets with custom celebration effects
      const presetName = preset as string;
      
      if (presetName.includes('egypt')) {
        const isGold = presetName.includes('gold');
        celebConfig = {
          ...celebrationConfig,
          intensity: isGold ? 8 : 7,
          particles: isGold ? 100 : 80,
          glowColor: isGold ? '#FFD700' : '#B8860B',
          symbolZoomScale: isGold ? 1.25 : 1.2,
          symbolRotationAmount: isGold ? 20 : 15
        };
      }
      else if (presetName.includes('cosmic')) {
        const isNebula = presetName.includes('nebula');
        celebConfig = {
          ...celebrationConfig,
          intensity: isNebula ? 9 : 10,
          particles: isNebula ? 150 : 130,
          glowColor: isNebula ? '#9370DB' : '#00FF00',
          symbolZoomScale: isNebula ? 1.3 : 1.4,
          symbolRotationAmount: isNebula ? 25 : 35
        };
      }
      else if (presetName.includes('forest')) {
        const isFairy = presetName.includes('fairy');
        celebConfig = {
          ...celebrationConfig,
          intensity: isFairy ? 6 : 7,
          particles: isFairy ? 120 : 90,
          glowColor: isFairy ? '#90EE90' : '#9370DB',
          symbolZoomScale: isFairy ? 1.15 : 1.2,
          symbolRotationAmount: isFairy ? 10 : 15
        };
      }
      else if (presetName.includes('ocean')) {
        const isTreasure = presetName.includes('treasure');
        celebConfig = {
          ...celebrationConfig,
          intensity: isTreasure ? 7 : 6,
          particles: isTreasure ? 110 : 80,
          glowColor: isTreasure ? '#87CEEB' : '#4682B4',
          symbolZoomScale: isTreasure ? 1.2 : 1.1,
          symbolRotationAmount: isTreasure ? 15 : 10
        };
      }
      else if (presetName.includes('western')) {
        const isGold = presetName.includes('gold');
        celebConfig = {
          ...celebrationConfig,
          intensity: isGold ? 8 : 9,
          particles: isGold ? 90 : 70,
          glowColor: isGold ? '#FFD700' : '#A52A2A',
          symbolZoomScale: isGold ? 1.25 : 1.3,
          symbolRotationAmount: isGold ? 20 : 25
        };
      }
      else if (presetName.includes('dynasty')) {
        const isDragon = presetName.includes('dragon');
        celebConfig = {
          ...celebrationConfig,
          intensity: isDragon ? 9 : 7,
          particles: isDragon ? 130 : 100,
          glowColor: isDragon ? '#FF0000' : '#FFD700',
          symbolZoomScale: isDragon ? 1.35 : 1.2,
          symbolRotationAmount: isDragon ? 30 : 15
        };
      }
      else if (presetName.includes('candy')) {
        const isSugar = presetName.includes('sugar');
        celebConfig = {
          ...celebrationConfig,
          intensity: isSugar ? 7 : 8,
          particles: isSugar ? 150 : 180,
          glowColor: isSugar ? '#FF69B4' : '#9400D3',
          symbolZoomScale: isSugar ? 1.3 : 1.35,
          symbolRotationAmount: isSugar ? 40 : 45
        };
      }
      else if (presetName.includes('tropical')) {
        const isParadise = presetName.includes('paradise');
        celebConfig = {
          ...celebrationConfig,
          intensity: isParadise ? 6 : 7,
          particles: isParadise ? 100 : 120,
          glowColor: isParadise ? '#20B2AA' : '#FF4500',
          symbolZoomScale: isParadise ? 1.15 : 1.2,
          symbolRotationAmount: isParadise ? 15 : 20
        };
      }
      else if (presetName.includes('aztec')) {
        const isTemple = presetName.includes('temple');
        celebConfig = {
          ...celebrationConfig,
          intensity: isTemple ? 8 : 9,
          particles: isTemple ? 90 : 110,
          glowColor: isTemple ? '#FFD700' : '#8B0000',
          symbolZoomScale: isTemple ? 1.25 : 1.3,
          symbolRotationAmount: isTemple ? 20 : 25
        };
      }
      else {
        celebConfig = celebrationConfig;
      }
    }
    
    setReelSpinConfig({...reelSpinConfig, ...spinConfig});
    setAnticipationConfig({...anticipationConfig, ...anticipConfig});
    setCelebrationConfig({...celebrationConfig, ...celebConfig});
    
    // Save to game store for persistence
    updateConfig({
      reelAnimation: {...spinConfig},
      anticipationAnimation: {...anticipConfig},
      celebrationAnimation: {...celebConfig}
    });
  };
  
  // Handle reel spin config changes
  const handleReelSpinConfigChange = (newConfig: Partial<PreviewReelConfig>) => {
    setReelSpinConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    
    // Save to game store
    updateConfig({ 
      reelAnimation: {
        ...config.reelAnimation,
        ...newConfig
      }
    });
  };
  
  // Handle anticipation config changes
  const handleAnticipationConfigChange = (newConfig: Partial<typeof anticipationConfig>) => {
    setAnticipationConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    
    // Save to game store
    updateConfig({ 
      anticipationAnimation: {
        ...config.anticipationAnimation,
        ...newConfig
      }
    });
  };
  
  // Handle celebration config changes
  const handleCelebrationConfigChange = (newConfig: Partial<typeof celebrationConfig>) => {
    setCelebrationConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
    
    // Save to game store
    updateConfig({ 
      celebrationAnimation: {
        ...config.celebrationAnimation,
        ...newConfig
      }
    });
  };
  
  // Handle result type changes
  const handleResultTypeChange = (type: WinResultType) => {
    setResultType(type);
    
    // Map WinResultType to forceWinType for PremiumSlotMachine
    switch(type) {
      case 'small-win':
        setForceWinType('small');
        break;
      case 'medium-win':
      case 'big-win':
        setForceWinType('big');
        break;
      case 'mega-win':
        setForceWinType('mega');
        break;
      default:
        setForceWinType('');
    }
  };
  
  // Play animation
  const playAnimation = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Trigger the appropriate animation based on active category
    if (activeCategory === AnimationCategory.REEL_SPIN) {
      console.log("Playing reel spin animation");
      
      // Instead of triggering the actual spin button (which tries to play audio),
      // let's animate the existing symbols in the game preview
      const gamePreview = document.querySelector('.aspect-video');
      if (gamePreview) {
        console.log("Creating visual spin animation using actual game symbols");
        
        // Find existing symbols in the game preview
        const existingSymbols = gamePreview.querySelectorAll('.pixi-container canvas');
        if (existingSymbols.length === 0) {
          console.log("No canvas found, creating a simulated spin animation");
          
          // Backup approach - create an overlay with a simulated spin
          const overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.inset = '0';
          overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
          overlay.style.zIndex = '30';
          overlay.style.display = 'flex';
          overlay.style.justifyContent = 'center';
          overlay.style.alignItems = 'center';
          
          const text = document.createElement('div');
          text.textContent = 'SPINNING...';
          text.style.color = 'white';
          text.style.fontWeight = 'bold';
          text.style.fontSize = '28px';
          text.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
          
          overlay.appendChild(text);
          gamePreview.appendChild(overlay);
          
          // Animate the text
          gsap.to(text, {
            scale: 1.2,
            duration: 0.5,
            yoyo: true,
            repeat: 5,
            ease: 'power1.inOut'
          });
          
          // Clean up after animation
          setTimeout(() => {
            overlay.remove();
          }, reelSpinConfig.spinDuration * 1000 + 500);
          
          return;
        }
        
        // Create a visual overlay for our spin animation
        const spinContainer = document.createElement('div');
        spinContainer.className = 'spin-animation-container';
        spinContainer.style.position = 'absolute';
        spinContainer.style.inset = '0';
        spinContainer.style.zIndex = '20';
        spinContainer.style.pointerEvents = 'none';
        gamePreview.appendChild(spinContainer);
        
        // Capture screenshots of existing symbols for our animation
        // We'll find the actual symbols in the PIXI canvas
        const symbolElements = Array.from(gamePreview.querySelectorAll('.pixi-container canvas'));
        
        // Analyze the layout to find symbol positions
        // Common layouts are 5x3 or 3x5 grid
        // For now, assuming a 5x3 layout (5 reels, 3 rows)
        const numReels = 5;
        const numRows = 3;
        
        // Get the dimensions of the game preview
        const previewRect = gamePreview.getBoundingClientRect();
        const previewWidth = previewRect.width;
        const previewHeight = previewRect.height;
        
        // Calculate where symbols would be in the canvas
        // This is approximate since we don't have direct access to PIXI objects
        const symbolWidth = previewWidth / numReels;
        const symbolHeight = previewHeight / numRows;
        
        // Create reels containers
        const reels = [];
        for (let i = 0; i < numReels; i++) {
          const reel = document.createElement('div');
          reel.style.position = 'absolute';
          reel.style.top = '0';
          reel.style.bottom = '0';
          reel.style.width = `${100/numReels}%`;
          reel.style.left = `${i * (100/numReels)}%`;
          reel.style.overflow = 'hidden';
          spinContainer.appendChild(reel);
          reels.push(reel);
        }
        
        // Create a temporary canvas to capture the original state
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = previewWidth;
        tempCanvas.height = previewHeight;
        const ctx = tempCanvas.getContext('2d');
        
        // Try to capture the current state
        if (symbolElements.length > 0 && ctx) {
          // Draw the first canvas (which should contain the entire view)
          ctx.drawImage(symbolElements[0], 0, 0, previewWidth, previewHeight);
          
          // Create symbol elements for each reel
          for (let reelIndex = 0; reelIndex < numReels; reelIndex++) {
            const reel = reels[reelIndex];
            
            // Calculate the source area for this reel
            const srcX = reelIndex * symbolWidth;
            const srcWidth = symbolWidth;
            
            // Create multiple symbols for the spin effect
            const symbolCount = 15; // More symbols for smoother scrolling
            for (let j = 0; j < symbolCount; j++) {
              // For each symbol position, extract segments from the original state
              const rowIndex = j % numRows;
              const srcY = rowIndex * symbolHeight;
              
              // Create symbols using the captured image data
              const symbol = document.createElement('div');
              symbol.style.position = 'absolute';
              symbol.style.width = '100%';
              symbol.style.height = `${100/numRows}%`;
              symbol.style.top = `${j * (100/numRows)}%`;
              symbol.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
              symbol.style.backgroundPosition = `-${srcX}px -${srcY}px`;
              symbol.style.backgroundSize = `${previewWidth}px ${previewHeight}px`;
              
              // Add a subtle effect to differentiate from static symbols
              symbol.style.boxShadow = 'inset 0 0 5px rgba(255,255,255,0.3)';
              symbol.style.filter = 'brightness(1.1)';
              
              reel.appendChild(symbol);
            }
            
            // Prepare to animate this reel
            const symbols = Array.from(reel.children);
            const delay = reelIndex * (reelSpinConfig.reelStartDelay || 0.2) * 1000;
            const duration = (reelSpinConfig.spinDuration || 2) * 1000;
            
            // Animate with staggered timing
            setTimeout(() => {
              // Start all symbols from their original positions
              symbols.forEach(symbol => {
                // @ts-ignore
                symbol.style.transform = 'translateY(0)';
              });
              
              // Animate the whole reel with proper easing
              gsap.to(symbols, {
                y: `+=${numRows * 100}%`, // Move several rows worth
                duration: duration / 1000,
                ease: "power1.out",
                stagger: {
                  each: 0.05,
                  from: "start"
                },
                onComplete: () => {
                  if (reelIndex === numReels - 1) {
                    // Last reel finished, add bounce effect
                    const bounceDistance = reelSpinConfig.bounceDistance || 20;
                    const normalizedBounce = bounceDistance / symbolHeight * 100;
                    
                    gsap.to(spinContainer, {
                      y: `-=${normalizedBounce}%`,
                      duration: 0.1,
                      yoyo: true,
                      repeat: 1,
                      onComplete: () => {
                        // Clean up after all animations complete
                        setTimeout(() => {
                          spinContainer.remove();
                        }, 500);
                      }
                    });
                  }
                }
              });
            }, delay);
          }
        } else {
          // If we couldn't capture symbols from canvas, default to colored blocks
          console.log("Could not access canvas content, using fallback symbols");
          
          // Create a row of spinning symbols with colors
          for (let i = 0; i < numReels; i++) {
            const reel = reels[i];
            
            // Create symbols in each reel
            const symbolCount = 10;
            for (let j = 0; j < symbolCount; j++) {
              const symbol = document.createElement('div');
              symbol.style.position = 'absolute';
              symbol.style.width = '80%';
              symbol.style.height = `${100/numRows}%`;
              symbol.style.left = '10%';
              symbol.style.top = `${j * (100/numRows)}%`;
              
              // Use better-looking default colors that match slot symbols
              const symbolColors = [
                'linear-gradient(to bottom, #ff5252, #d32f2f)', 
                'linear-gradient(to bottom, #ffeb3b, #fbc02d)', 
                'linear-gradient(to bottom, #4caf50, #388e3c)', 
                'linear-gradient(to bottom, #2196f3, #1976d2)', 
                'linear-gradient(to bottom, #9c27b0, #7b1fa2)'
              ];
              
              symbol.style.background = symbolColors[Math.floor(Math.random() * symbolColors.length)];
              symbol.style.borderRadius = '10%';
              symbol.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
              reel.appendChild(symbol);
            }
            
            // Animate each reel with staggered timing
            const delay = i * (reelSpinConfig.reelStartDelay || 0.2) * 1000;
            const duration = (reelSpinConfig.spinDuration || 2) * 1000;
            
            setTimeout(() => {
              // Move the symbols from top to bottom
              gsap.to(reel.children, {
                y: `+=${numRows * 100}%`,
                duration: duration / 1000,
                ease: "power1.in", 
                stagger: 0.1,
                onComplete: () => {
                  if (i === numReels - 1) {
                    // Last reel finished spinning, add bounce effect
                    gsap.to(spinContainer, {
                      y: `-=5%`,
                      duration: 0.1,
                      yoyo: true,
                      repeat: 1,
                      onComplete: () => {
                        // Clean up after animation completes
                        setTimeout(() => {
                          spinContainer.remove();
                        }, 500);
                      }
                    });
                  }
                }
              });
            }, delay);
          }
        }
      } else {
        console.log("Reel container not found");
        
        // As a fallback, create a visual indicator that we're trying to spin
        if (document.querySelector('.aspect-video')) {
          // Add a visual overlay to indicate we're trying to spin
          const overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.background = 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0))';
          overlay.style.zIndex = '10';
          overlay.style.pointerEvents = 'none';
          overlay.style.display = 'flex';
          overlay.style.justifyContent = 'center';
          overlay.style.alignItems = 'center';
          
          const text = document.createElement('div');
          text.textContent = 'SPINNING...';
          text.style.color = 'white';
          text.style.fontWeight = 'bold';
          text.style.fontSize = '24px';
          text.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
          
          overlay.appendChild(text);
          reelContainer.appendChild(overlay);
          
          // Animate the text
          gsap.to(text, {
            scale: 1.2,
            duration: 0.5,
            yoyo: true,
            repeat: 3,
            ease: 'power1.inOut'
          });
          
          // Clean up
          setTimeout(() => {
            overlay.remove();
          }, 3000);
        }
      }
    } 
    else if (activeCategory === AnimationCategory.ANTICIPATION) {
      console.log("Playing anticipation animation");
      
      // Apply visible anticipation effects
      const reelContainer = document.querySelector('.aspect-video');
      if (reelContainer) {
        // Add visual anticipation effects
        
        // 1. Create a main container for all effects
        const effectsContainer = document.createElement('div');
        effectsContainer.style.position = 'absolute';
        effectsContainer.style.inset = '0';
        effectsContainer.style.overflow = 'hidden';
        effectsContainer.style.zIndex = '30';
        effectsContainer.style.pointerEvents = 'none';
        reelContainer.appendChild(effectsContainer);
        
        // 2. Add flashing effect if enabled
        if (anticipationConfig.enabled && anticipationConfig.shakeEnabled) {
          // Add shake effect with GSAP
          gsap.to(reelContainer, {
            x: 5,
            duration: 0.05,
            repeat: 10,
            yoyo: true,
            ease: 'none'
          });
        }
        
        // 3. Add flashing effect if enabled 
        if (anticipationConfig.enabled) {
          // Create flash overlay
          const flashOverlay = document.createElement('div');
          flashOverlay.style.position = 'absolute';
          flashOverlay.style.inset = '0';
          flashOverlay.style.backgroundColor = 'white';
          flashOverlay.style.opacity = '0';
          effectsContainer.appendChild(flashOverlay);
          
          // Create dramatic vignette effect
          const vignette = document.createElement('div');
          vignette.style.position = 'absolute';
          vignette.style.inset = '0';
          vignette.style.background = 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 100%)';
          vignette.style.opacity = '0';
          effectsContainer.appendChild(vignette);
          
          // Sequence of effects
          const tl = gsap.timeline();
          
          // Fade in vignette
          tl.to(vignette, {
            opacity: 0.7,
            duration: 0.5
          });
          
          // Flash sequence
          const flashCount = parseInt(anticipationConfig.intensity.toString()) || 3;
          for (let i = 0; i < flashCount; i++) {
            tl.to(flashOverlay, {
              opacity: 0.7,
              duration: 0.1,
              yoyo: true,
              repeat: 1,
              delay: 0.1
            });
          }
          
          // Fade out vignette at the end
          tl.to(vignette, {
            opacity: 0,
            duration: 0.5,
            delay: 0.2
          });
          
          // Clean up after animation completes
          setTimeout(() => {
            effectsContainer.remove();
            // Ensure reel container is back to normal position
            gsap.to(reelContainer, {
              x: 0,
              duration: 0.1
            });
          }, anticipationConfig.duration * 1000);
        }
      }
    } 
    else if (activeCategory === AnimationCategory.CELEBRATION) {
      console.log("Playing celebration animation");
      
      // For celebration, we'll first set the appropriate win type
      const winType = getWinTypeForCategory();
      console.log(`Setting win type for celebration: ${winType}`);
      setForceWinType(winType);
      
      // Add visible celebration effects
      const reelContainer = document.querySelector('.aspect-video');
      if (reelContainer) {
        // Create container for all celebration effects
        const celebrationContainer = document.createElement('div');
        celebrationContainer.style.position = 'absolute';
        celebrationContainer.style.inset = '0';
        celebrationContainer.style.overflow = 'hidden';
        celebrationContainer.style.zIndex = '25';
        celebrationContainer.style.pointerEvents = 'none';
        reelContainer.appendChild(celebrationContainer);
        
        // 1. Add particle effects
        if (celebrationConfig.particles > 0) {
          // Create celebration animation with more advanced effects
          const numParticles = Math.min(200, celebrationConfig.particles);
          
          // Define particle colors based on theme
          const colors = [
            '#FFD700', // Gold
            '#FFC107', // Amber
            '#FF5722', // Deep Orange
            '#E91E63', // Pink
            '#2196F3', // Blue
            '#8BC34A'  // Light Green
          ];
          
          // Create particles with staggered animation
          for (let i = 0; i < numParticles; i++) {
            setTimeout(() => {
              const particle = document.createElement('div');
              
              // Randomize particle properties
              const size = (Math.random() * 6 + 5) * (celebrationConfig.intensity / 8);
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              // Style the particle
              particle.style.position = 'absolute';
              particle.style.width = `${size}px`;
              particle.style.height = `${size}px`;
              particle.style.backgroundColor = color;
              particle.style.borderRadius = '50%';
              particle.style.boxShadow = `0 0 ${size/2}px ${color}`;
              
              // Position at center
              particle.style.top = '50%';
              particle.style.left = '50%';
              particle.style.transform = 'translate(-50%, -50%)';
              
              celebrationContainer.appendChild(particle);
              
              // Animate with physics-based motion
              const angle = Math.random() * Math.PI * 2;
              const distance = 40 + Math.random() * 300;
              const duration = 1 + Math.random() * 2;
              
              gsap.to(particle, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: 0,
                opacity: 0,
                duration: duration,
                ease: 'power2.out',
                onComplete: () => particle.remove()
              });
            }, i * (1000 / numParticles) * 0.5); // Stagger creation
          }
        }
        
        // 2. Add screen flash if enabled
        if (celebrationConfig.screenFlashEnabled) {
          const flash = document.createElement('div');
          flash.style.position = 'absolute';
          flash.style.inset = '0';
          flash.style.backgroundColor = 'white';
          flash.style.opacity = '0';
          flash.style.zIndex = '10';
          celebrationContainer.appendChild(flash);
          
          // Flash animation
          gsap.to(flash, {
            opacity: 0.8,
            duration: 0.2,
            yoyo: true,
            repeat: 1
          });
        }
        
        // 3. Add text celebration based on win size if it's a big or mega win
        if (resultType === 'big-win' || resultType === 'mega-win') {
          const textOverlay = document.createElement('div');
          textOverlay.style.position = 'absolute';
          textOverlay.style.inset = '0';
          textOverlay.style.display = 'flex';
          textOverlay.style.flexDirection = 'column';
          textOverlay.style.justifyContent = 'center';
          textOverlay.style.alignItems = 'center';
          textOverlay.style.zIndex = '15';
          
          const winText = document.createElement('div');
          winText.textContent = resultType === 'mega-win' ? 'MEGA WIN!' : 'BIG WIN!';
          winText.style.color = resultType === 'mega-win' ? '#FFD700' : '#FFC107';
          winText.style.fontSize = resultType === 'mega-win' ? '48px' : '40px';
          winText.style.fontWeight = 'bold';
          winText.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
          winText.style.opacity = '0';
          winText.style.transform = 'scale(0.5)';
          
          textOverlay.appendChild(winText);
          celebrationContainer.appendChild(textOverlay);
          
          // Animate the text
          gsap.to(winText, {
            opacity: 1,
            scale: 1.2,
            duration: 0.5, 
            ease: 'back.out',
            onComplete: () => {
              gsap.to(winText, {
                y: -10,
                duration: 0.5,
                repeat: 4,
                yoyo: true,
                ease: 'sine.inOut'
              });
            }
          });
        }
        
        // Clean up after duration
        setTimeout(() => {
          // Fade out and remove
          gsap.to(celebrationContainer, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => celebrationContainer.remove()
          });
        }, celebrationConfig.duration * 1000);
      }
    }
    
    // After a delay, reset playing state
    setTimeout(() => {
      console.log("Animation complete, resetting state");
      setIsPlaying(false);
      setForceWinType('');
    }, getCategoryDuration());
  };
  
  // Get appropriate win type for current category
  const getWinTypeForCategory = (): '' | 'small' | 'big' | 'mega' => {
    switch(activeCategory) {
      case AnimationCategory.REEL_SPIN:
        return '';  // No win during reel spin
      case AnimationCategory.ANTICIPATION:
        return ''; // Start anticipation but don't show win yet
      case AnimationCategory.CELEBRATION:
        // Return different win types based on resultType
        switch(resultType) {
          case 'small-win':
            return 'small';
          case 'medium-win':
          case 'big-win':
            return 'big';
          case 'mega-win':
            return 'mega';
          default:
            return '';
        }
    }
  };
  
  // Get animation duration based on category
  const getCategoryDuration = (): number => {
    switch(activeCategory) {
      case AnimationCategory.REEL_SPIN:
        return (reelSpinConfig.spinDuration || 2.0) * 1000 + 1000; // Add 1s buffer
      case AnimationCategory.ANTICIPATION:
        return (anticipationConfig.duration || 1.5) * 1000 + 1000;
      case AnimationCategory.CELEBRATION:
        return (celebrationConfig.duration || 3.0) * 1000 + 1000;
      default:
        return 3000;
    }
  };
  
  // Handle win event from slot machine
  const handleWin = (amount: number, type: string) => {
    console.log(`Win: ${amount}, Type: ${type}`);
    // Use this to sync with other UI if needed
  };
  
  // Save all animation configurations
  const saveConfigurations = () => {
    // Combined update to game store
    updateConfig({ 
      reelAnimation: {...reelSpinConfig},
      anticipationAnimation: {...anticipationConfig},
      celebrationAnimation: {...celebrationConfig}
    });
    
    // Visual feedback
    const element = document.createElement('div');
    element.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50';
    element.innerHTML = 'Animation configurations saved!';
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  };
  
  return (
    <div className="bg-white rounded-lg p-5 text-gray-900 border border-red-200 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Sparkles className="mr-2 text-red-500" size={24} />
          Win Animation Workshop
        </h2>
        <p className="text-gray-600">
          Design and preview professional animations for different win types and special features.
        </p>
        
        {errorMessage && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 flex items-start text-red-700">
            <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Mode selection toggle (Apple-style) */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-gray-100 p-1 rounded-full flex">
            <button
              onClick={() => setViewMode('theme-preset')}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${viewMode === 'theme-preset' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <Palette className="w-4 h-4 mr-1 inline-block" />
              Theme Presets
            </button>
            <button
              onClick={() => setViewMode('preset')}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${viewMode === 'preset' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <Sparkles className="w-4 h-4 mr-1 inline-block" />
              Classic Presets
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${viewMode === 'advanced' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <Settings className="w-4 h-4 mr-1 inline-block" />
              Advanced
            </button>
          </div>
          
          {viewMode === 'advanced' && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Professional Mode</span>
              <div 
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  expertMode ? 'bg-red-600' : 'bg-gray-300'
                }`}
                onClick={() => setExpertMode(!expertMode)}
              >
                <span 
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    expertMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-gray-700 font-medium">{expertMode ? 'Expert' : 'Standard'}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Game Preview Area (left side) */}
        <div className="lg:col-span-8">
          {/* Game Preview */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-red-200 mb-4">
            <div className="aspect-video relative">
              <PremiumSlotMachine
                themeCategory={config.theme.mainTheme}
                initialBalance={config.bet?.defaultBet ?? 1000}
                onWin={handleWin}
                forceWinType={forceWinType}
                backgroundUrl={bgUrl}
                frameUrl={frUrl}
                symbolList={symList}
                spinConfig={currentSpinConfig}
                width={800}
                height={450} 
              />
            </div>
            
            <div className="p-4 bg-white border-t border-red-200 flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={playAnimation}
                  disabled={isPlaying}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                    isPlaying 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Play {activeCategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
                
                <button
                  onClick={() => setIsPlaying(false)}
                  disabled={!isPlaying}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
                    !isPlaying 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  Stop
                </button>
                
                <button
                  onClick={() => setForceWinType('')}
                  className="px-4 py-2 rounded-lg flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              
              <button
                onClick={saveConfigurations}
                className="px-4 py-2 rounded-lg flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
              >
                <Check className="w-4 h-4" />
                Save All
              </button>
            </div>
          </div>
          
          {/* Animation Category Tabs */}
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Animation Categories</h3>
            
            <div className="flex mb-6 bg-gray-100 rounded-lg overflow-hidden">
              <button 
                className={`flex-1 py-3 px-4 flex items-center justify-center ${
                  activeCategory === AnimationCategory.REEL_SPIN 
                    ? 'bg-red-600 text-white' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                onClick={() => setActiveCategory(AnimationCategory.REEL_SPIN)}
              >
                <Clock className="mr-2" size={18} />
                Reel Spin
              </button>
              <button 
                className={`flex-1 py-3 px-4 flex items-center justify-center ${
                  activeCategory === AnimationCategory.ANTICIPATION 
                    ? 'bg-red-600 text-white' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                onClick={() => setActiveCategory(AnimationCategory.ANTICIPATION)}
              >
                <Hourglass className="mr-2" size={18} />
                Anticipation
              </button>
              <button 
                className={`flex-1 py-3 px-4 flex items-center justify-center ${
                  activeCategory === AnimationCategory.CELEBRATION 
                    ? 'bg-red-600 text-white' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                onClick={() => setActiveCategory(AnimationCategory.CELEBRATION)}
              >
                <Trophy className="mr-2" size={18} />
                Celebration
              </button>
            </div>
            
            {/* Category-specific controls */}
            {activeCategory === AnimationCategory.REEL_SPIN && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-bold mb-2 text-red-600 flex items-center">
                  <Clock className="mr-2" size={16} />
                  Reel Spin Animation
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Configure how the reels spin, including speed, bounce effects, and motion dynamics.
                </p>
                
                {viewMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Spin Duration (s)</label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="5" 
                        step="0.1"
                        value={reelSpinConfig.spinDuration || 2.0} 
                        onChange={(e) => handleReelSpinConfigChange({ spinDuration: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0.5s</span>
                        <span>{reelSpinConfig.spinDuration || 2.0}s</span>
                        <span>5s</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Reel Start Delay (s)</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.5" 
                        step="0.05"
                        value={reelSpinConfig.reelStartDelay || 0.2} 
                        onChange={(e) => handleReelSpinConfigChange({ reelStartDelay: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0s</span>
                        <span>{reelSpinConfig.reelStartDelay || 0.2}s</span>
                        <span>0.5s</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Bounce Distance</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="1"
                        value={reelSpinConfig.bounceDistance || 15} 
                        onChange={(e) => handleReelSpinConfigChange({ bounceDistance: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>None</span>
                        <span>{reelSpinConfig.bounceDistance || 15}</span>
                        <span>Maximum</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Bounce Duration (s)</label>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1.5" 
                        step="0.1"
                        value={reelSpinConfig.bounceDuration || 0.5} 
                        onChange={(e) => handleReelSpinConfigChange({ bounceDuration: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0.1s</span>
                        <span>{reelSpinConfig.bounceDuration || 0.5}s</span>
                        <span>1.5s</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* In the actual implementation, this would have more advanced options */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Advanced mode provides detailed control over all spin parameters including
                        acceleration curves, motion blur, and precision timing for each reel.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeCategory === AnimationCategory.ANTICIPATION && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-bold mb-2 text-red-600 flex items-center">
                  <Hourglass className="mr-2" size={16} />
                  Anticipation Animation
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create tension and excitement with anticipation effects before revealing wins.
                </p>
                
                {viewMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={anticipationConfig.enabled} 
                          onChange={(e) => handleAnticipationConfigChange({ enabled: e.target.checked })}
                          className="mr-2"
                        />
                        Enable Anticipation Effect
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Duration (s)</label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.1"
                        value={anticipationConfig.duration} 
                        onChange={(e) => handleAnticipationConfigChange({ duration: parseFloat(e.target.value) })}
                        disabled={!anticipationConfig.enabled}
                        className={`w-full ${!anticipationConfig.enabled ? 'opacity-50' : ''}`}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0.5s</span>
                        <span>{anticipationConfig.duration}s</span>
                        <span>3s</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Intensity</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={anticipationConfig.intensity} 
                        onChange={(e) => handleAnticipationConfigChange({ intensity: parseFloat(e.target.value) })}
                        disabled={!anticipationConfig.enabled}
                        className={`w-full ${!anticipationConfig.enabled ? 'opacity-50' : ''}`}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>Subtle</span>
                        <span>{anticipationConfig.intensity}</span>
                        <span>Extreme</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={anticipationConfig.shakeEnabled} 
                          onChange={(e) => handleAnticipationConfigChange({ shakeEnabled: e.target.checked })}
                          disabled={!anticipationConfig.enabled}
                          className="mr-2"
                        />
                        Enable Screen Shake
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={anticipationConfig.flashEnabled} 
                          onChange={(e) => handleAnticipationConfigChange({ flashEnabled: e.target.checked })}
                          disabled={!anticipationConfig.enabled}
                          className="mr-2"
                        />
                        Enable Flash Effect
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* In the actual implementation, this would have more advanced options */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Advanced mode provides detailed control over anticipation effects including
                        custom shake patterns, pulse frequencies, and audio synchronization.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeCategory === AnimationCategory.CELEBRATION && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-bold mb-2 text-red-600 flex items-center">
                  <Trophy className="mr-2" size={16} />
                  Celebration Animation
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create exciting win celebrations with particles, flashes, and symbol enhancements.
                </p>
                
                {viewMode === 'preset' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Duration (s)</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="6" 
                        step="0.5"
                        value={celebrationConfig.duration} 
                        onChange={(e) => handleCelebrationConfigChange({ duration: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>1s</span>
                        <span>{celebrationConfig.duration}s</span>
                        <span>6s</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Intensity</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={celebrationConfig.intensity} 
                        onChange={(e) => handleCelebrationConfigChange({ intensity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>Subtle</span>
                        <span>{celebrationConfig.intensity}</span>
                        <span>Extreme</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={celebrationConfig.symbolZoomEnabled} 
                          onChange={(e) => handleCelebrationConfigChange({ symbolZoomEnabled: e.target.checked })}
                          className="mr-2"
                        />
                        Symbol Zoom Effect
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={celebrationConfig.symbolRotationEnabled} 
                          onChange={(e) => handleCelebrationConfigChange({ symbolRotationEnabled: e.target.checked })}
                          className="mr-2"
                        />
                        Symbol Rotation Effect
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={celebrationConfig.glowEnabled} 
                          onChange={(e) => handleCelebrationConfigChange({ glowEnabled: e.target.checked })}
                          className="mr-2"
                        />
                        Glow Effect
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium mb-1 text-gray-700">
                        <input 
                          type="checkbox" 
                          checked={celebrationConfig.screenFlashEnabled} 
                          onChange={(e) => handleCelebrationConfigChange({ screenFlashEnabled: e.target.checked })}
                          className="mr-2"
                        />
                        Screen Flash Effect
                      </label>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Particles</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="10"
                        value={celebrationConfig.particles} 
                        onChange={(e) => handleCelebrationConfigChange({ particles: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>None</span>
                        <span>{celebrationConfig.particles}</span>
                        <span>Maximum</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* In the actual implementation, this would have more advanced options */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Advanced mode provides detailed control over celebration effects including
                        particle physics, custom flight paths, color gradients, and sequenced animations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Settings Panel (right side) */}
        <div className="lg:col-span-4">
          {viewMode === 'theme-preset' ? (
            /* Theme Preset Panel */
            <div>
              <ThemeAnimationPresets 
                onSelectPreset={handleSelectPreset}
                onPreviewPreset={() => playAnimation()}
                selectedPreset={selectedPreset as ThemeAnimationPreset}
                onResultTypeChange={handleResultTypeChange}
                resultType={resultType}
                themeId={themeId}
                themeName={themeName}
              />
            </div>
          ) : viewMode === 'preset' ? (
            /* Classic Preset Panel */
            <div>
              <AnimationPresets 
                onSelectPreset={handleSelectPreset}
                onPreviewPreset={() => playAnimation()}
                selectedPreset={selectedPreset as AnimationPreset}
                onResultTypeChange={handleResultTypeChange}
                resultType={resultType}
              />
            </div>
          ) : (
            /* Advanced Panel */
            <AdvancedAnimationWorkshop
              onConfigChange={(newConfig) => {
                // Update both the category-specific config and the related state
                if (activeCategory === AnimationCategory.REEL_SPIN) {
                  const reelConfig: Partial<PreviewReelConfig> = {};
                  
                  // Extract relevant properties for reel spin
                  if (newConfig.spinDuration !== undefined) reelConfig.spinDuration = newConfig.spinDuration;
                  if (newConfig.reelStartDelay !== undefined) reelConfig.reelStartDelay = newConfig.reelStartDelay;
                  if (newConfig.bounceDistance !== undefined) reelConfig.bounceDistance = newConfig.bounceDistance;
                  if (newConfig.bounceDuration !== undefined) reelConfig.bounceDuration = newConfig.bounceDuration;
                  if (newConfig.easeInDuration !== undefined) reelConfig.easeInDuration = newConfig.easeInDuration;
                  if (newConfig.easeOutDuration !== undefined) reelConfig.easeOutDuration = newConfig.easeOutDuration;
                  if (newConfig.blurAmount !== undefined) reelConfig.blurAmount = newConfig.blurAmount;
                  if (newConfig.easeType !== undefined) reelConfig.easeType = newConfig.easeType;

                  // Update the reel spin configuration
                  handleReelSpinConfigChange(reelConfig);
                } 
                else if (activeCategory === AnimationCategory.ANTICIPATION) {
                  // Extract relevant properties for anticipation
                  const anticipConfig: Partial<typeof anticipationConfig> = {};
                  
                  if (newConfig.anticipationEnabled !== undefined) anticipConfig.enabled = newConfig.anticipationEnabled;
                  if (newConfig.anticipationDuration !== undefined) anticipConfig.duration = newConfig.anticipationDuration;
                  if (newConfig.anticipationIntensity !== undefined) anticipConfig.intensity = newConfig.anticipationIntensity;
                  if (newConfig.anticipationShakeEnabled !== undefined) anticipConfig.shakeEnabled = newConfig.anticipationShakeEnabled;
                  if (newConfig.anticipationShakeAmount !== undefined) anticipConfig.shakeIntensity = newConfig.anticipationShakeAmount;
                  if (newConfig.anticipationFlashEnabled !== undefined) anticipConfig.flashEnabled = newConfig.anticipationFlashEnabled;
                  if (newConfig.anticipationFlashSpeed !== undefined) anticipConfig.flashIntensity = newConfig.anticipationFlashSpeed;
                  if (newConfig.anticipationSlowmoEnabled !== undefined) anticipConfig.enabled = newConfig.anticipationSlowmoEnabled;
                  if (newConfig.anticipationSlowmoFactor !== undefined) anticipConfig.slowmoFactor = newConfig.anticipationSlowmoFactor;
                  
                  // Update the anticipation configuration
                  handleAnticipationConfigChange(anticipConfig);
                }
                else if (activeCategory === AnimationCategory.CELEBRATION) {
                  // Extract relevant properties for celebration
                  const celebConfig: Partial<typeof celebrationConfig> = {};
                  
                  if (newConfig.celebrationEnabled !== undefined) celebConfig.enabled = newConfig.celebrationEnabled;
                  if (newConfig.celebrationDuration !== undefined) celebConfig.duration = newConfig.celebrationDuration;
                  if (newConfig.celebrationIntensity !== undefined) celebConfig.intensity = newConfig.celebrationIntensity;
                  if (newConfig.celebrationParticles !== undefined) celebConfig.particles = newConfig.celebrationParticles;
                  if (newConfig.celebrationSymbolZoomEnabled !== undefined) celebConfig.symbolZoomEnabled = newConfig.celebrationSymbolZoomEnabled;
                  if (newConfig.celebrationSymbolZoomScale !== undefined) celebConfig.symbolZoomScale = newConfig.celebrationSymbolZoomScale;
                  if (newConfig.celebrationSymbolRotationEnabled !== undefined) celebConfig.symbolRotationEnabled = newConfig.celebrationSymbolRotationEnabled;
                  if (newConfig.celebrationSymbolRotationAmount !== undefined) celebConfig.symbolRotationAmount = newConfig.celebrationSymbolRotationAmount;
                  if (newConfig.celebrationScreenFlashEnabled !== undefined) celebConfig.screenFlashEnabled = newConfig.celebrationScreenFlashEnabled;
                  if (newConfig.celebrationGlowEnabled !== undefined) celebConfig.glowEnabled = newConfig.celebrationGlowEnabled;
                  if (newConfig.celebrationGlowColor !== undefined) celebConfig.glowColor = newConfig.celebrationGlowColor;
                  if (newConfig.celebrationGlowIntensity !== undefined) celebConfig.glowIntensity = newConfig.celebrationGlowIntensity;
                  
                  // Update the celebration configuration
                  handleCelebrationConfigChange(celebConfig);
                }
              }}
              config={{
                // Reel Spin Configuration
                spinDuration: reelSpinConfig.spinDuration,
                reelStartDelay: reelSpinConfig.reelStartDelay,
                bounceDistance: reelSpinConfig.bounceDistance,
                bounceDuration: reelSpinConfig.bounceDuration,
                easeInDuration: reelSpinConfig.easeInDuration,
                easeOutDuration: reelSpinConfig.easeOutDuration,
                blurAmount: reelSpinConfig.blurAmount,
                easeType: reelSpinConfig.easeType || 'power1.out',
                
                // Anticipation Configuration
                anticipationEnabled: anticipationConfig.enabled,
                anticipationDuration: anticipationConfig.duration,
                anticipationIntensity: anticipationConfig.intensity,
                anticipationShakeEnabled: anticipationConfig.shakeEnabled,
                anticipationShakeAmount: anticipationConfig.shakeIntensity,
                anticipationFlashEnabled: anticipationConfig.flashEnabled,
                anticipationFlashCount: 3, // Default
                anticipationFlashSpeed: anticipationConfig.flashIntensity,
                anticipationSlowmoEnabled: true, // Default
                anticipationSlowmoFactor: anticipationConfig.slowmoFactor,
                
                // Celebration Configuration
                celebrationEnabled: celebrationConfig.enabled !== false,
                celebrationDuration: celebrationConfig.duration,
                celebrationIntensity: celebrationConfig.intensity,
                celebrationParticles: celebrationConfig.particles,
                celebrationParticleSize: 7, // Default
                celebrationParticleSpeed: 200, // Default
                celebrationSymbolZoomEnabled: celebrationConfig.symbolZoomEnabled,
                celebrationSymbolZoomScale: celebrationConfig.symbolZoomScale,
                celebrationSymbolRotationEnabled: celebrationConfig.symbolRotationEnabled,
                celebrationSymbolRotationAmount: celebrationConfig.symbolRotationAmount,
                celebrationScreenFlashEnabled: celebrationConfig.screenFlashEnabled,
                celebrationFlashAlpha: 0.5, // Default
                celebrationCameraShakeEnabled: true, // Default
                celebrationShakeAmount: 5, // Default
                celebrationCameraZoomEnabled: true, // Default
                celebrationCameraZoom: 1.1, // Default
                celebrationGlowEnabled: celebrationConfig.glowEnabled,
                celebrationGlowColor: celebrationConfig.glowColor,
                celebrationGlowIntensity: celebrationConfig.glowIntensity,
                celebrationColorPalette: 'vibrant', // Default
              }}
              activeCategory={activeCategory}
              onPlay={playAnimation}
              expertMode={expertMode}
              resultType={resultType}
              onResultTypeChange={handleResultTypeChange}
            />
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-blue-900 bg-opacity-20 rounded-lg p-4 border border-blue-800">
        <h3 className="text-lg font-bold mb-2 text-blue-300 flex items-center">
          <Check className="mr-2" size={18} />
          Professional Guidelines
        </h3>
        <p className="text-sm text-blue-200">
          The Win Animation Workshop allows you to create and test animations that meet industry standards.
          Our preset packs incorporate best practices from top-performing slot games, while the advanced
          mode includes professional parameter ranges to guide your customizations. All settings are
          automatically saved to your game configuration and exported with the final game data.
        </p>
      </div>
    </div>
  );
};

export default EnhancedWinAnimationWorkshop;