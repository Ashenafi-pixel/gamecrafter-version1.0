import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { adaptiveButtonDetector } from '../../../utils/adaptiveButtonDetection';
import {
  Frame,
  Image,
  Paintbrush,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  Sparkles,
  Upload,
  Settings,
  Move,
  ArrowUpDown,
  ArrowLeftRight,
  ZoomIn,
  Volume2,
  Info,
  Play,
  FastForward,
  Menu,
  Cog,
  Layout,
  Grid3X3,
  Eye,
  EyeOff,
  Crown,
  Maximize,
  Copy,
  Sun,
  Moon,
  Star,
  Zap,
  RotateCcw
} from 'lucide-react';
import GridPreviewWrapper from '../grid-preview/GridPreviewWrapper';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { detectDeviceType, onDeviceTypeChange, getDefaultLogoPosition, getDefaultLogoScale, DeviceType } from '../../../utils/deviceDetection';
import { saveTitleAsset } from '../../../utils/imageSaver';
import { Button } from '../../Button';

// Type definitions
interface AssetConfig {
  // Background properties
  backgroundPath: string | null;
  backgroundStyle: string;
  backgroundPrompt: string;
  isGeneratingBackground: boolean;

  // Derived backgrounds for different game modes
  derivedBackgrounds: {
    night?: string;
    day?: string;
    bonus?: string;
    freespin?: string;
  };
  isDeriving: boolean;
  derivePrompt: string;
  backgroundResponseId?: string;
  backgroundPosition: { x: number; y: number };
  backgroundScale: number;
  backgroundFit: 'cover' | 'contain' | 'fill' | 'scale-down';

  // Frame properties
  framePath: string | null;
  frameStyle: 'outer' | 'reel' | 'both';
  framePrompt: string;
  isGeneratingFrame: boolean;
  framePosition: { x: number; y: number };
  frameScale: number;
  frameStretch: { x: number; y: number };

  // UI Button properties
  uiButtonsPath: string | null;
  uiButtonsStyle: string;
  uiButtonsPrompt: string;
  isGeneratingUIButtons: boolean;
  uiElements: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  }
  uiElementsPressed?: {
    spinButton?: string;
    autoplayButton?: string;
    menuButton?: string;
    soundButton?: string;
    settingsButton?: string;
  }
  buttonLayoutStyle?: 'horizontal' | 'corner';
  extractedUIButtons?: { [key: string]: string };
  uiButtonsPosition: { x: number; y: number };
  uiButtonsScale: number;
  uiButtonsVisibility: boolean;

  // Title Assets properties
  titleAssets: {
    freeSpins?: string;
    bonusGame?: string;
    pickAndClick?: string;
    bigWin?: string;
    megaWin?: string;
    jackpot?: string;
    gameOver?: string;
    congratulations?: string;
  };
  titleAssetsStyle: string;
  titleAssetsPrompt: string;
  isGeneratingTitleAssets: boolean;
  currentTitleType: string;
  buttonScale?: number;
  buttonSpacing?: number;

  // Logo properties
  logoPath: string | null;
  logoPrompt: string;
  isGeneratingLogo: boolean;
  logoPositions: {
    desktop: { x: number; y: number };
    mobilePortrait: { x: number; y: number };
    mobileLandscape: { x: number; y: number };
  };
  logoScales: {
    desktop: number;
    mobilePortrait: number;
    mobileLandscape: number;
  };
  currentDevice: 'desktop' | 'mobilePortrait' | 'mobileLandscape';

  // Advanced Grid & Symbol positioning
  showSymbolGrid: boolean;
  gridPosition: { x: number; y: number };
  gridScale: number;
  gridStretch: { x: number; y: number };
}

// Main component
const Step6_GameAssets: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const [activeTab, setActiveTab] = useState<'preset' | 'advanced'>('preset');
  const [backgroundPreviewDevice, setBackgroundPreviewDevice] = useState<'desktop' | 'mobile-portrait' | 'mobile-landscape'>('desktop');
  const [gridOptimize, setGridOptimize] = useState<String>('minimal');

  // File upload references
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const freespinBackgroundFileInputRef = useRef<HTMLInputElement>(null);
  const frameFileInputRef = useRef<HTMLInputElement>(null);
  const uiButtonsFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize asset config from store
  const [assetConfig, setAssetConfig] = useState<AssetConfig>({
    backgroundPath: config.background?.backgroundImage || null,
    backgroundStyle: config.background?.style || 'nature',
    backgroundPrompt: '',
    isGeneratingBackground: false,

    derivedBackgrounds: config.derivedBackgrounds || {},
    isDeriving: false,
    derivePrompt: '',
    backgroundResponseId: config.backgroundResponseId,
    backgroundPosition: config.backgroundPosition || { x: 0, y: 0 },
    backgroundScale: config.backgroundScale || 100,
    backgroundFit: config.backgroundFit || 'cover',

    framePath: config.frame || null,
    frameStyle: config.frameStyle || 'outer',
    framePrompt: '',
    isGeneratingFrame: false,
    framePosition: config.framePosition || { x: 0, y: 0 },
    frameScale: config.frameScale || 100,
    frameStretch: config.frameStretch || { x: 100, y: 100 },

    uiButtonsPath: config.uiButtonsPath || null,
    uiButtonsStyle: config.uiButtonsStyle || 'Modern',
    uiButtonsPrompt: '',
    isGeneratingUIButtons: false,
    uiElements: config.uiElements || {
      spinButton: null,
      autoplayButton: null,
      menuButton: null,
      soundButton: null,
      settingsButton: null
    },
    uiElementsPressed: config.uiElementsPressed || {},
    buttonLayoutStyle: config.buttonLayoutStyle || 'horizontal',
    extractedUIButtons: (config as any).extractedUIButtons || {},
    uiButtonsPosition: (config as any).uiButtonsPosition || { x: 0, y: 0 },
    uiButtonsScale: (config as any).uiButtonsScale || 100,
    uiButtonsVisibility: (config as any).uiButtonsVisibility !== undefined ? (config as any).uiButtonsVisibility : true,
    buttonScale: config.buttonScale || 100,
    buttonSpacing: config.buttonSpacing || 20,

    // Title Assets
    titleAssets: config.titleAssets || {},
    titleAssetsStyle: config.titleAssetsStyle || 'Golden Elegant',
    titleAssetsPrompt: '',
    isGeneratingTitleAssets: false,
    currentTitleType: 'freeSpins',

    logoPath: config.logo || null,
    logoPrompt: '',
    isGeneratingLogo: false,
    logoPositions: config.logoPositions || {
      desktop: getDefaultLogoPosition('desktop'),
      mobilePortrait: getDefaultLogoPosition('mobilePortrait'),
      mobileLandscape: getDefaultLogoPosition('mobileLandscape')
    },
    logoScales: config.logoScales || {
      desktop: getDefaultLogoScale('desktop'),
      mobilePortrait: getDefaultLogoScale('mobilePortrait'),
      mobileLandscape: getDefaultLogoScale('mobileLandscape')
    },
    currentDevice: detectDeviceType(),

    // Advanced settings
    showSymbolGrid: config.showSymbolBackgrounds !== false,
    gridPosition: config.gridPosition || { x: 0, y: 0 },
    gridScale: config.gridScale || 100,
    gridStretch: config.gridStretch || { x: 100, y: 100 }
  });

  // Debug logging for symbols and logo
  useEffect(() => {
    console.log('[Step5_GameAssets] Current config:', config);
    console.log('[Step5_GameAssets] Theme symbols:', config?.theme?.generated?.symbols);
    console.log('[Step5_GameAssets] Symbol count:', config?.theme?.generated?.symbols?.length || 0);
    console.log('[Step5_GameAssets] Logo data:', {
      logoPath: assetConfig.logoPath,
      logoPositions: assetConfig.logoPositions,
      logoScales: assetConfig.logoScales,
      currentDevice: assetConfig.currentDevice,
      currentPosition: assetConfig.logoPositions[assetConfig.currentDevice],
      currentScale: assetConfig.logoScales[assetConfig.currentDevice],
      configLogo: config.logo,
      configLogoPositions: config.logoPositions,
      configLogoScales: config.logoScales
    });
  }, [config, assetConfig.logoPath, assetConfig.logoPositions, assetConfig.logoScales]);

  // Device detection and orientation change handling
  useEffect(() => {
    const cleanup = onDeviceTypeChange((newDeviceType: DeviceType) => {
      console.log('[Step5] Device type changed to:', newDeviceType);
      updateAssetConfig('currentDevice', newDeviceType);
    });

    return cleanup;
  }, []);

  // No automatic mockup loading - users must explicitly generate or upload assets

  // Update store when asset config changes
  useEffect(() => {
    updateConfig({
      frame: assetConfig.framePath,
      frameStyle: assetConfig.frameStyle,
      framePosition: assetConfig.framePosition,
      frameScale: assetConfig.frameScale,
      frameStretch: assetConfig.frameStretch,
      background: {
        ...config.background,
        backgroundImage: assetConfig.backgroundPath,
        style: assetConfig.backgroundStyle
      },
      derivedBackgrounds: assetConfig.derivedBackgrounds,
      backgroundResponseId: assetConfig.backgroundResponseId,
      uiButtonsPath: assetConfig.uiButtonsPath,
      uiButtonsStyle: assetConfig.uiButtonsStyle,
      uiElements: assetConfig.uiElements,
      logo: assetConfig.logoPath,
      logoPositions: assetConfig.logoPositions,
      logoScales: assetConfig.logoScales,
      currentDevice: assetConfig.currentDevice,
      // Legacy compatibility
      logoPosition: assetConfig.logoPositions[assetConfig.currentDevice],
      logoScale: assetConfig.logoScales[assetConfig.currentDevice],
      showSymbolBackgrounds: assetConfig.showSymbolGrid,
      gridPosition: assetConfig.gridPosition,
      gridScale: assetConfig.gridScale,
      gridStretch: assetConfig.gridStretch
    });

    // If we have a background, emit event for preview
    if (assetConfig.backgroundPath) {
      window.dispatchEvent(new CustomEvent('backgroundUpdated', {
        detail: {
          backgroundUrl: assetConfig.backgroundPath,
          position: assetConfig.backgroundPosition,
          scale: assetConfig.backgroundScale,
          fit: assetConfig.backgroundFit
        }
      }));
      console.log('Background update event dispatched on config change with adjustments');
    }
  }, [assetConfig]);

  // Listen for logo position changes from preview
  useEffect(() => {
    const handleLogoPositionChange = (event: CustomEvent) => {
      const { position, device } = event.detail;
      console.log(`[Step5] Logo position changed from preview for ${device}:`, position);

      // Update position for the specific device
      const newPositions = {
        ...assetConfig.logoPositions,
        [device]: position
      };
      updateAssetConfig('logoPositions', newPositions);
    };

    const handleLogoScaleChange = (event: CustomEvent) => {
      const { scale, device } = event.detail;
      console.log(`[Step5] Logo scale changed from preview for ${device}:`, scale);

      // Update scale for the specific device
      const newScales = {
        ...assetConfig.logoScales,
        [device]: scale
      };
      updateAssetConfig('logoScales', newScales);
    };

    window.addEventListener('logoPositionChanged', handleLogoPositionChange as EventListener);
    window.addEventListener('logoScaleChanged', handleLogoScaleChange as EventListener);
    return () => {
      window.removeEventListener('logoPositionChanged', handleLogoPositionChange as EventListener);
      window.removeEventListener('logoScaleChanged', handleLogoScaleChange as EventListener);
    };
  }, [assetConfig.logoPositions, assetConfig.logoScales]);

  // Dispatch initial grid adjustments on mount and when grid values change
  useEffect(() => {
    const gridAdjustments = {
      position: assetConfig.gridPosition,
      scale: assetConfig.gridScale,
      stretch: assetConfig.gridStretch
    };

    window.dispatchEvent(new CustomEvent('gridAdjustmentsUpdated', {
      detail: gridAdjustments
    }));
    console.log('Initial grid adjustments dispatched:', gridAdjustments);
  }, [assetConfig.gridPosition, assetConfig.gridScale, assetConfig.gridStretch]);

  // Dispatch initial frame adjustments on mount and when frame values change
  useEffect(() => {
    const frameAdjustments = {
      position: assetConfig.framePosition,
      scale: assetConfig.frameScale,
      stretch: assetConfig.frameStretch
    };

    window.dispatchEvent(new CustomEvent('frameAdjustmentsUpdated', {
      detail: frameAdjustments
    }));
    console.log('Initial frame adjustments dispatched:', frameAdjustments);
  }, [assetConfig.framePosition, assetConfig.frameScale, assetConfig.frameStretch]);

  // Dispatch initial background adjustments on mount and when background values change
  useEffect(() => {
    const backgroundAdjustments = {
      position: assetConfig.backgroundPosition,
      scale: assetConfig.backgroundScale,
      fit: assetConfig.backgroundFit,
      backgroundUrl: assetConfig.backgroundPath
    };

    window.dispatchEvent(new CustomEvent('backgroundAdjustmentsUpdated', {
      detail: backgroundAdjustments
    }));
    console.log('Initial background adjustments dispatched:', backgroundAdjustments);
  }, [assetConfig.backgroundPosition, assetConfig.backgroundScale, assetConfig.backgroundFit, assetConfig.backgroundPath]);

  // Dispatch initial UI button adjustments on mount and when UI button values change
  useEffect(() => {
    const uiButtonAdjustments = {
      position: assetConfig.uiButtonsPosition,
      scale: assetConfig.uiButtonsScale,
      visibility: assetConfig.uiButtonsVisibility
    };

    window.dispatchEvent(new CustomEvent('uiButtonAdjustmentsUpdated', {
      detail: uiButtonAdjustments
    }));
    console.log('Initial UI button adjustments dispatched:', uiButtonAdjustments);
  }, [assetConfig.uiButtonsPosition, assetConfig.uiButtonsScale, assetConfig.uiButtonsVisibility]);

  // Update a specific asset config property
  const updateAssetConfig = (property: keyof AssetConfig, value: any) => {
    console.log('🔧 [Step6] updateAssetConfig called:', { property, value });

    setAssetConfig(prev => ({
      ...prev,
      [property]: value
    }));

    // Dispatch events for PixiJS integration when asset paths are updated
    if (value && typeof value === 'string') {
      switch (property) {
        case 'framePath':
          window.dispatchEvent(new CustomEvent('frameUpdated', {
            detail: { frameUrl: value }
          }));
          console.log('Frame update event dispatched:', value);
          break;
        case 'logoPath':
          window.dispatchEvent(new CustomEvent('logoUpdated', {
            detail: { logoUrl: value }
          }));
          console.log('Logo update event dispatched:', value);
          break;
        case 'uiButtonsPath':
          window.dispatchEvent(new CustomEvent('uiButtonsUpdated', {
            detail: { uiButtonsUrl: value }
          }));
          console.log('UI Buttons update event dispatched:', value);
          break;
      }
    }

    // Dispatch grid adjustment events for PixiPreviewWrapper
    if (property === 'gridPosition' || property === 'gridScale' || property === 'gridStretch') {
      // Get the current state to build the complete grid adjustments object
      const currentConfig = assetConfig;
      const gridAdjustments = {
        position: property === 'gridPosition' ? value : currentConfig.gridPosition,
        scale: property === 'gridScale' ? value : currentConfig.gridScale,
        stretch: property === 'gridStretch' ? value : currentConfig.gridStretch
      };

      window.dispatchEvent(new CustomEvent('gridAdjustmentsUpdated', {
        detail: gridAdjustments
      }));
      console.log('Grid adjustments event dispatched:', gridAdjustments);
    }

    // Dispatch frame adjustment events for PixiPreviewWrapper
    if (property === 'framePosition' || property === 'frameScale' || property === 'frameStretch') {
      // Get the current state to build the complete frame adjustments object
      const currentConfig = assetConfig;
      const frameAdjustments = {
        position: property === 'framePosition' ? value : currentConfig.framePosition,
        scale: property === 'frameScale' ? value : currentConfig.frameScale,
        stretch: property === 'frameStretch' ? value : currentConfig.frameStretch
      };

      window.dispatchEvent(new CustomEvent('frameAdjustmentsUpdated', {
        detail: frameAdjustments
      }));
      console.log('Frame adjustments event dispatched:', frameAdjustments);
    }

    // Dispatch UI button adjustment events for PixiPreviewWrapper
    if (property === 'uiButtonsPosition' || property === 'uiButtonsScale' || property === 'uiButtonsVisibility') {
      // Get the current state to build the complete UI button adjustments object
      const currentConfig = assetConfig;
      const uiButtonAdjustments = {
        position: property === 'uiButtonsPosition' ? value : currentConfig.uiButtonsPosition,
        scale: property === 'uiButtonsScale' ? value : currentConfig.uiButtonsScale,
        visibility: property === 'uiButtonsVisibility' ? value : currentConfig.uiButtonsVisibility
      };

      window.dispatchEvent(new CustomEvent('uiButtonAdjustmentsUpdated', {
        detail: uiButtonAdjustments
      }));
      console.log('UI button adjustments event dispatched:', uiButtonAdjustments);
    }

    // Also dispatch for individual button paths
    if (property === 'extractedButtons' && value) {
      window.dispatchEvent(new CustomEvent('individualButtonsUpdated', {
        detail: { buttons: value }
      }));
      console.log('Individual buttons update event dispatched:', value);
    }

    // Dispatch background positioning events for PixiJS integration
    if (property === 'backgroundPosition' || property === 'backgroundScale' || property === 'backgroundFit') {
      const currentConfig = assetConfig;
      const backgroundAdjustments = {
        position: property === 'backgroundPosition' ? value : currentConfig.backgroundPosition,
        scale: property === 'backgroundScale' ? value : currentConfig.backgroundScale,
        fit: property === 'backgroundFit' ? value : currentConfig.backgroundFit,
        backgroundUrl: currentConfig.backgroundPath
      };

      console.log('🎯 [Step6] Dispatching background adjustments:', {
        property,
        value,
        backgroundAdjustments,
        hasBackgroundUrl: !!currentConfig.backgroundPath
      });

      window.dispatchEvent(new CustomEvent('backgroundAdjustmentsUpdated', {
        detail: backgroundAdjustments
      }));

      // Also update the game store for persistence
      updateConfig({
        backgroundPosition: backgroundAdjustments.position,
        backgroundScale: backgroundAdjustments.scale,
        backgroundFit: backgroundAdjustments.fit
      });
    }
  };

  // Generate background using AI
  const generateBackground = async () => {
    // Set generating state
    updateAssetConfig('isGeneratingBackground', true);

    try {
      // Get current grid and device info
      const reels = config.reels?.layout?.reels || 5;
      const rows = config.reels?.layout?.rows || 3;

      // Get theme name - handle both string and object formats
      const themeName = typeof config.theme === 'string'
        ? config.theme
        : (config.theme?.mainTheme || config.theme?.name || 'casino');

      const basePrompt = assetConfig.backgroundPrompt.trim() ||
        `A beautiful slot machine background for a ${themeName} theme`;

      // Enhanced prompt with size specifications
      const enhancedPrompt = `Create a breathtaking slot machine game background for a ${themeName} themed casino game.
        
        THEME & ATMOSPHERE:
        ${basePrompt}
        - Capture the essence of ${themeName} with rich environmental details
        - Create immersive atmosphere with appropriate lighting and mood
        - Include subtle animated elements suggestions (particles, glows, ambient effects)
        
        VISUAL COMPOSITION:
        - Optimized for a ${reels}x${rows} slot grid in the center
        - Darker or softly blurred areas where the slot grid will be placed
        - More detailed and vibrant elements around the edges
        - Depth and layering to create visual interest
        - Balanced composition that draws focus to center
        
        TECHNICAL REQUIREMENTS:
        - Ultra high quality, ${themeName.includes('cartoon') || themeName.includes('candy') ? 'stylized art style' : 'photorealistic rendering'}
        - Rich color palette appropriate for ${themeName} theme
        - Professional casino game aesthetic
        - 1024x1024 resolution (will be scaled for different devices)
        - Suitable for both landscape (16:9) and portrait (9:16) cropping
        
        IMPORTANT DETAILS:
        - No UI elements, buttons, or text
        - No slot reels or symbols (just background)
        - Subtle vignetting to frame the composition
        - High contrast between background and where symbols will appear
        - Premium, polished look that enhances player experience
        
        Create a stunning background that transports players into the ${themeName} world!`;

      // Generate background using GPT-image-1 with proper response ID tracking
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: enhancedPrompt,
        targetSymbolId: 'background_main', // Store response ID under this identifier
        gameId: config.gameId,
        count: 1
      });

      // Update the background path with the generated image
      if (result && result.success && result.images && result.images.length > 0) {
        const imageUrl = result.images[0];

        // Save the background to the game assets folder
        const gameId = config.gameId || `${config.theme?.name || 'slot'}_${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

        let finalBackgroundUrl = imageUrl;

        if (gameId) {
          try {
            const saveEndpoint = window.location.hostname === 'localhost'
              ? 'http://localhost:8080/save-image'
              : '/.netlify/functions/save-image';

            const response = await fetch(saveEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-id': gameId
              },
              body: JSON.stringify({
                image: imageUrl,
                gameId: gameId,
                symbolName: 'main_background',
                symbolId: 'background_main'
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Main background saved to:', data.filePath);
              finalBackgroundUrl = data.filePath;
            }
          } catch (error) {
            console.error('Failed to save main background:', error);
          }
        }

        updateAssetConfig('backgroundPath', finalBackgroundUrl);

        // Store the response ID for multi-turn derivations
        if (result.responseId) {
          console.log('Storing REAL background response ID for derivations:', result.responseId);
          updateAssetConfig('backgroundResponseId', result.responseId);
        } else {
          console.warn('No response ID found in main background generation result');
          // The response ID should be automatically stored by generateImageWithConfig under 'background_main'
        }

        // Emit event for UnifiedSlotPreview
        window.dispatchEvent(new CustomEvent('backgroundUpdated', {
          detail: {
            backgroundUrl: finalBackgroundUrl,
            position: assetConfig.backgroundPosition,
            scale: assetConfig.backgroundScale,
            fit: assetConfig.backgroundFit
          }
        }));
        console.log('Background update event dispatched for generated background with adjustments');
      }
    } catch (error) {
      console.error('Error generating background:', error);
      alert('Failed to generate background. Please try again or upload an image.');
    } finally {
      updateAssetConfig('isGeneratingBackground', false);
    }
  };

  // Set background variation in PixiJS preview
  const setBackgroundInPreview = (backgroundUrl: string, variationType: string) => {
    // Update the main background path to the selected variation
    updateAssetConfig('backgroundPath', backgroundUrl);

    // Dispatch event to update PixiJS preview
    const event = new CustomEvent('backgroundUpdated', {
      detail: {
        backgroundUrl: backgroundUrl,
        variationType: variationType
      }
    });
    window.dispatchEvent(event);

    console.log(`[Step6] Set ${variationType} background in PixiJS preview:`, backgroundUrl);

    // Show success message
    const variationName = variationType.charAt(0).toUpperCase() + variationType.slice(1);
  };

  // Derive background variations for different game modes
  const deriveBackground = async (variationType: 'night' | 'day' | 'bonus' | 'freespin') => {
    if (!assetConfig.backgroundPath) {
      alert('Please generate or upload a base background first before creating variations.');
      return;
    }

    updateAssetConfig('isDeriving', true);

    try {
      // Get theme name
      const themeName = typeof config.theme === 'string'
        ? config.theme
        : (config.theme?.mainTheme || config.theme?.name || 'casino');

      // Custom derive prompt or auto-generate based on variation type
      const customPrompt = assetConfig.derivePrompt.trim();

      // Create variation-specific prompts
      const variationPrompts = {
        night: 'Transform this into a nighttime version with darker atmosphere, moonlight, stars, glowing elements, and mysterious ambiance. Keep the same composition and theme but shift to nocturnal mood.',
        day: 'Transform this into a bright daytime version with sunlight, clear skies, vibrant colors, and energetic atmosphere. Keep the same composition and theme but shift to bright, cheerful mood.',
        bonus: 'Transform this into an exciting bonus round version with enhanced magical effects, golden particles, energy bursts, dramatic lighting, and celebratory atmosphere. Keep the same composition but make it more spectacular.',
        freespin: 'Transform this into a special free spins version with mystical enhancements, ethereal glowing effects, special particle systems, enchanted atmosphere, and premium feel. Keep the same composition but add magical elements.'
      };

      const basePrompt = customPrompt || variationPrompts[variationType];

      // Enhanced prompt for background variation emphasizing composition preservation
      const enhancedPrompt = `Transform the provided source image into a ${variationType} variation. Use the exact same scene composition with only lighting and atmospheric changes.
        
        CRITICAL: This is an IMAGE-TO-IMAGE transformation of the provided source background image.
        
        PRESERVE EXACTLY FROM SOURCE IMAGE:
        - All building/structure positions and shapes
        - Castle placement and architecture 
        - Tree positions and forest layout
        - Horizon line and perspective angle
        - Foreground and background element placement
        - All architectural and landscape details
        - Overall composition and spatial relationships
        - Center area clear space for slot grid
        
        TRANSFORMATION FOR ${variationType.toUpperCase()}:
        ${basePrompt}
        
        LIGHTING AND ATMOSPHERE CHANGES ONLY:
        ${variationType === 'night' ? `
        - TIME: Nighttime with moonlight as primary light source
        - SKY: Dark night sky with stars, moon, or aurora
        - LIGHTING: Cool moonlight, glowing windows/lanterns
        - COLORS: Deep blues, purples, silvers, cool tones
        - MOOD: Mysterious, peaceful, enchanting nighttime` : ''}
        ${variationType === 'day' ? `
        - TIME: Bright daytime with sunlight as primary light source
        - SKY: Bright blue sky with white fluffy clouds
        - LIGHTING: Natural daylight, no artificial lights needed
        - COLORS: Warm golds, yellows, vibrant bright colors
        - MOOD: Energetic, cheerful, inviting daytime` : ''}
        ${variationType === 'bonus' ? `
        - ENHANCEMENT: Magical bonus effects overlay
        - LIGHTING: Dramatic golden spotlights and energy beams
        - EFFECTS: Floating gold particles, sparkles, gem glints
        - COLORS: Rich golds, oranges, jewel tones
        - MOOD: Celebratory, rewarding, spectacular` : ''}
        ${variationType === 'freespin' ? `
        - ENHANCEMENT: Mystical supernatural effects overlay
        - LIGHTING: Ethereal glows and magical illumination
        - EFFECTS: Floating particles, energy wisps, halos
        - COLORS: Mystical purples, silvers, magical blues
        - MOOD: Enchanted, otherworldly, mystical` : ''}
        
        STRICT PRESERVATION RULES:
        - Same architectural elements in exact same positions
        - Same perspective and viewpoint angle
        - Same composition and spatial relationships
        - Same level of detail and visual complexity
        - Same ${themeName} theme visual identity
        - Same center area optimization for slot grid
        - Only change: time of day, lighting, and atmospheric effects
        
        Create a ${variationType} version that looks like the exact same location photographed under different conditions!`;

      console.log(`Generating ${variationType} background variation for theme:`, themeName);
      console.log(`Using base background: ${assetConfig.backgroundPath}`);

      // Generate background variation using the enhanced prompt
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: enhancedPrompt,
        sourceImage: assetConfig.backgroundPath,
        sourceDescription: `${themeName} themed slot machine background`,
        sourceSymbolId: 'background_main', // Look up response ID for main background
        targetSymbolId: `background_${variationType}`, // Store new response ID for this variation
        gameId: config.gameId,
        count: 1
      });

      if (result && result.success && result.images && result.images.length > 0) {
        const imageUrl = result.images[0];

        // Update the derived backgrounds
        const newDerivedBackgrounds = {
          ...assetConfig.derivedBackgrounds,
          [variationType]: imageUrl
        };
        updateAssetConfig('derivedBackgrounds', newDerivedBackgrounds);

        // Save the variation to the game assets folder
        const gameId = config.gameId || `${themeName || 'slot'}_${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (gameId) {
          try {
            const saveEndpoint = window.location.hostname === 'localhost'
              ? 'http://localhost:8080/save-image'
              : '/.netlify/functions/save-image';

            const response = await fetch(saveEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-id': gameId
              },
              body: JSON.stringify({
                image: imageUrl,
                gameId: gameId,
                symbolName: `${variationType}_background`,
                symbolId: `background_${variationType}`
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`${variationType} background saved to:`, data.filePath);

              // Update with server path
              const updatedDerivedBackgrounds = {
                ...newDerivedBackgrounds,
                [variationType]: data.filePath
              };
              updateAssetConfig('derivedBackgrounds', updatedDerivedBackgrounds);
            }
          } catch (error) {
            console.error(`Failed to save ${variationType} background:`, error);
          }
        }

        alert(`${variationType.charAt(0).toUpperCase() + variationType.slice(1)} background variation generated successfully!`);
      }
    } catch (error) {
      console.error(`Error generating ${variationType} background:`, error);
      alert(`Failed to generate ${variationType} background variation. Please try again.`);
    } finally {
      updateAssetConfig('isDeriving', false);
    }
  };

  // Generate frame using AI
  const generateFrame = async () => {
    // Generate frame for slot game
    updateAssetConfig('isGeneratingFrame', true);

    try {
      // Get theme name - handle both string and object formats
      const themeName = typeof config.theme === 'string'
        ? config.theme
        : (config.theme?.mainTheme || config.theme?.name || 'casino');

      // Get user's style input (just the theme/style part)
      const userFrameStyle = assetConfig.framePrompt.trim() || themeName || 'casino';

      // Get current grid dimensions
      const reels = config.reels?.layout?.reels || 5;
      const rows = config.reels?.layout?.rows || 3;

      // Calculate appropriate frame thickness based on grid size - make frames much smaller
      const isSmallGrid = reels <= 3 && rows <= 3;
      const frameThickness = isSmallGrid ? 'very thin and delicate (maximum 20-25 pixels thick)' : 'thin and elegant (maximum 30-35 pixels thick)';

      // Different prompts based on frame style - reel dividers will be added programmatically
      let styleSpecific = '';
      switch (assetConfig.frameStyle) {
        case 'outer':
          styleSpecific = 'outer border only - no internal dividers';
          break;
        case 'reel':
          styleSpecific = 'no outer border - just a transparent frame (reel dividers will be added programmatically)';
          break;
        case 'both':
          styleSpecific = 'outer border only (reel dividers will be added programmatically for perfect alignment)';
          break;
      }

      // Build the complete prompt with user input embedded
      const enhancedPrompt = `Create a delicate decorative FRAME ONLY for a ${userFrameStyle} themed slot machine game.

        GRID LAYOUT SPECIFICATIONS:
        - This frame is for a ${reels} columns × ${rows} rows slot machine grid
        - Total grid dimensions: ${reels}x${rows} (${reels} reels, ${rows} symbols per reel)
        - ${styleSpecific}

        ESSENTIAL REQUIREMENTS:
        - This is a THIN decorative BORDER/FRAME with a COMPLETELY TRANSPARENT center area
        - The transparent center must occupy 85-90% of the total image area
        - Frame thickness: ${frameThickness} - perfect for a ${reels}x${rows} slot grid
        - Style: Elegant casino quality with ${userFrameStyle} theme decorations
        - IMPORTANT: Keep the frame THIN and DELICATE - it should not dominate the screen

        VISUAL STYLE:
        - Subtle, refined decorative elements matching the ${userFrameStyle} theme
        - Delicate details and textures that don't overwhelm
        - Soft lighting with gentle shadows and highlights
        - Metallic or material-appropriate finishes (gold, wood, crystal, etc.)
        - Symmetrical design for visual balance
        - Minimalist approach - less is more

        TECHNICAL SPECIFICATIONS:
        - Format: PNG with FULL ALPHA TRANSPARENCY in center
        - Resolution: 1024x1024 pixels
        - Color depth: Full color with subtle gradients
        - Anti-aliased edges for smooth appearance
        - NO text, logos, watermarks, or symbols inside the frame
        - Frame should be THIN and ELEGANT, not thick or bulky

        COMPOSITION:
        - Frame elements should be subtle and refined
        - Corner decorations should be small and tasteful
        - Consistent theme throughout all frame elements
        - The frame should complement and enhance, not overpower the slot content
        - Think "elegant border" not "thick frame"

        IMPORTANT NOTE:
        - Reel dividers will be added programmatically for perfect alignment
        - Focus on creating a beautiful ${styleSpecific.includes('border') ? 'border frame' : 'transparent background'}
        - The frame should complement the ${reels}x${rows} grid layout
        - Ensure the transparent center area is perfectly clear for game content

        Create a refined, delicate frame that subtly enhances the slot game experience!`;

      // Generate frame using GPT-image-1
      const result = await enhancedOpenaiClient.generateImage(
        enhancedPrompt,
        {
          size: '1024x1024',
          quality: 'high'
        }
      );

      if (result && result.imageUrl) {
        updateAssetConfig('framePath', result.imageUrl);
      }
    } catch (error) {
      console.error('Error generating frame:', error);
      alert('Failed to generate frame. Please try again or upload an image.');
    } finally {
      updateAssetConfig('isGeneratingFrame', false);
    }
  };

  // Generate individual UI buttons one by one for better quality
  const generateIndividualUIButtons = async () => {
    console.log('🎮 [Individual Button Generation] Starting individual button generation...');
    updateAssetConfig('isGeneratingUIButtons', true);

    const buttonDefinitions = [
      {
        name: 'spinButton',
        displayName: 'SPIN',
        description: 'Large circular spin button with golden gradient',
        size: '1024x1024',
        targetSize: 120,
        prompt: `Create a premium casino SPIN button for slot machine games.

DESIGN REQUIREMENTS:
- Medium circular button centered on 1024x1024 canvas
- Golden/yellow metallic gradient background with shine effects
- Bold "SPIN" text in white with dramatic drop shadow
- 3D beveled edges with realistic lighting from top-left
- Glossy metallic finish with light reflections and highlights
- Subtle outer glow effect around the button edges
- Professional casino game aesthetic with premium feel
- High contrast colors for mobile visibility
- Transparent/black background outside the button
- Button should look highly pressable and interactive
- Size: approximately 200-250px diameter on the canvas (medium size)

STYLE: Modern casino game UI, premium quality, 3D rendered appearance like real slot machines`
      },
      {
        name: 'autoplayButton',
        displayName: 'AUTO',
        description: 'Auto-play button with blue gradient',
        size: '1024x1024',
        targetSize: 80,
        prompt: `Create a premium casino AUTO button for slot machine games.

DESIGN REQUIREMENTS:
- Rounded rectangle button centered on 1024x1024 canvas
- Electric blue/cyan metallic gradient with silver accents
- "AUTO" text in bold white with subtle shadow
- Small play/pause icons or arrow indicators
- 3D beveled edges with realistic lighting from top-left
- Glossy finish with light reflections and highlights
- Professional casino game aesthetic
- Transparent/black background outside the button
- Button should look modern and interactive
- Size: approximately 150-180px width on the canvas (small-medium size)

STYLE: Modern casino game UI, premium quality, 3D rendered appearance like real slot machines`
      },
      {
        name: 'menuButton',
        displayName: 'MENU',
        description: 'Menu button with orange/red gradient',
        size: '1024x1024',
        targetSize: 80,
        prompt: `Create a premium casino MENU button for slot machine games.

DESIGN REQUIREMENTS:
- Square/rounded rectangle button centered on 1024x1024 canvas
- Orange/red metallic gradient with copper highlights
- "MENU" text or hamburger menu icon in bold white
- 3D beveled edges with realistic lighting from top-left
- Glossy metallic finish with light reflections
- Professional casino game aesthetic
- Transparent/black background outside the button
- Button should look clickable and modern
- Size: approximately 150-180px width on the canvas (small-medium size)

STYLE: Modern casino game UI, premium quality, 3D rendered appearance like real slot machines`
      },
      {
        name: 'soundButton',
        displayName: 'SOUND',
        description: 'Sound toggle button with speaker icon',
        size: '1024x1024',
        targetSize: 80,
        prompt: `Create a premium casino SOUND button for slot machine games.

DESIGN REQUIREMENTS:
- Circular button centered on 1024x1024 canvas
- Yellow/gold metallic gradient with bronze accents
- Speaker/sound wave icon in white (no text needed)
- Volume indicator waves or sound symbols around speaker
- 3D beveled edges with realistic lighting from top-left
- Glossy metallic finish with light reflections
- Professional casino game aesthetic
- Transparent/black background outside the button
- Button should look like a toggle control
- Size: approximately 150-180px diameter on the canvas (small-medium size)

STYLE: Modern casino game UI, premium quality, 3D rendered appearance like real slot machines`
      },
      {
        name: 'settingsButton',
        displayName: 'SETTINGS',
        description: 'Settings button with gear icon',
        size: '1024x1024',
        targetSize: 80,
        prompt: `Create a premium casino SETTINGS button for slot machine games.

DESIGN REQUIREMENTS:
- Circular button centered on 1024x1024 canvas
- Silver/platinum metallic gradient with chrome highlights
- Gear/cog icon in dark gray or white
- 3D beveled edges with realistic lighting from top-left
- Glossy metallic finish with light reflections
- Professional casino game aesthetic
- Transparent/black background outside the button
- Button should look professional and subtle
- Size: approximately 150-180px diameter on the canvas (small-medium size)

STYLE: Modern casino game UI, premium quality, 3D rendered appearance like real slot machines`
      }
    ];

    const generatedButtons: Record<string, string> = {};
    let successCount = 0;

    // Helper function to crop and resize button from 1024x1024 to target size
    const cropButtonFromImage = async (imageUrl: string, targetSize: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set canvas to target size
          canvas.width = targetSize;
          canvas.height = targetSize;

          // Calculate crop area (center of the 1024x1024 image)
          const sourceSize = 1024;
          const cropSize = Math.min(sourceSize * 0.8, 800); // Use 80% of the image or max 800px
          const cropX = (sourceSize - cropSize) / 2;
          const cropY = (sourceSize - cropSize) / 2;

          // Draw the cropped and resized image
          ctx.drawImage(
            img,
            cropX, cropY, cropSize, cropSize, // Source crop area
            0, 0, targetSize, targetSize       // Destination size
          );

          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
    };

    try {
      // Import the enhancedOpenaiClient dynamically
      const enhancedOpenaiClient = (await import('../../../utils/enhancedOpenaiClient')).default;

      for (const buttonDef of buttonDefinitions) {
        try {
          console.log(`🎮 [Individual Button] Generating ${buttonDef.displayName} button...`);

          const result = await enhancedOpenaiClient.generateImage(buttonDef.prompt, {
            size: buttonDef.size as any,
            quality: 'high'
          });

          if (result?.imageUrl) {
            // Crop the 1024x1024 image to the target size
            console.log(`🎮 [Individual Button] Cropping ${buttonDef.displayName} to ${buttonDef.targetSize}x${buttonDef.targetSize}...`);
            const croppedButton = await cropButtonFromImage(result.imageUrl, buttonDef.targetSize);

            generatedButtons[buttonDef.name] = croppedButton;
            successCount++;
            console.log(`✅ [Individual Button] ${buttonDef.displayName} generated and cropped successfully`);
          } else {
            console.error(`[Individual Button] Failed to generate ${buttonDef.displayName}: No image URL`);
          }
        } catch (buttonError) {
          console.error(`[Individual Button] Error generating ${buttonDef.displayName}:`, buttonError);
        }
      }

      if (successCount > 0) {
        // Update the UI elements with generated buttons
        updateAssetConfig('uiElements', generatedButtons);
        updateAssetConfig('extractedUIButtons', generatedButtons);

        // Also update the global config
        updateConfig({
          ...(config as any),
          uiElements: generatedButtons,
          extractedUIButtons: generatedButtons
        } as any);

        console.log(`🎉 [Individual Button] Successfully generated ${successCount}/${buttonDefinitions.length} buttons`);

        // Dispatch event to update PixiSlotMockup
        window.dispatchEvent(new CustomEvent('individualButtonsUpdated', {
          detail: { buttons: generatedButtons }
        }));
      } else {
        throw new Error('Failed to generate any buttons');
      }

    } catch (error) {
      console.error('🎮 [Individual Button] Error in individual button generation:', error);

      let errorMessage = 'Failed to generate individual UI buttons. ';

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          errorMessage += 'The generation took too long. Please try again.';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
        } else {
          errorMessage += error.message;
        }
      }

      alert(errorMessage);
    } finally {
      updateAssetConfig('isGeneratingUIButtons', false);
    }
  };

  // Original batch generation function (kept as fallback)
  const generateUIButtons = async (retryCount = 0) => {
    console.log('🎮 [UI Generation] Starting UI button generation...');
    updateAssetConfig('isGeneratingUIButtons', true);

    try {
      // Import the enhancedOpenaiClient dynamically to ensure it's available
      const enhancedOpenaiClient = (await import('../../../utils/enhancedOpenaiClient')).default;

      const themeName = typeof config.theme === 'string'
        ? config.theme
        : (config.theme?.mainTheme || 'casino');

      console.log('🎮 [UI Generation] Theme:', themeName);
      console.log('🎮 [UI Generation] Custom prompt:', assetConfig.uiButtonsPrompt);

      const basePrompt = assetConfig.uiButtonsPrompt.trim() ||
        `UI button set for a ${themeName} slot machine`;

      // Add retry enhancement to prompt if this is a retry
      const retryEnhancement = retryCount > 0 ? `

IMPORTANT: Previous attempt generated gray/monochrome buttons. THIS TIME:
- Use BRIGHT, VIBRANT COLORS for each button
- Make each button VISUALLY DISTINCT with different colors
- Add GLOSSY/METALLIC effects and gradients
- Ensure HIGH CONTRAST between buttons
- NO GRAY OR MONOCHROME BUTTONS!` : '';

      // Generate individual buttons in a grid layout for better extraction
      const enhancedPrompt = `Create 5 individual slot machine UI buttons for ${themeName} theme, arranged in a precise grid for easy extraction.

${basePrompt}

CRITICAL LAYOUT REQUIREMENTS:
- Create a 2x3 grid layout on 1024x1024 canvas
- Top row: MENU (left), SPIN (center), AUTO (right)
- Bottom row: SOUND (left), SETTINGS (right)
- Each button in its own clearly defined 300x300px area
- 100px padding between buttons and from canvas edges
- Pure white background between buttons for clean separation

BUTTON DESIGN SPECIFICATIONS:
1. SPIN button (center-top, 250x250px):
   - Bright gold/green metallic gradient with glow
   - Bold "SPIN" text in white with drop shadow
   - Circular shape with 3D beveled edges
   - Most prominent and eye-catching

2. AUTO button (top-right, 200x200px):
   - Electric blue gradient with silver accents
   - "AUTO" text in white
   - Rounded rectangle with play/pause indicators

3. MENU button (top-left, 200x200px):
   - Orange/red gradient with copper highlights
   - "MENU" text or hamburger icon in white
   - Square with rounded corners

4. SOUND button (bottom-left, 180x180px):
   - Yellow/gold gradient with bronze accents
   - Speaker/sound wave icon in white
   - Circular with volume indicators

5. SETTINGS button (bottom-right, 180x180px):
   - Silver/platinum gradient with chrome finish
   - Gear/cog icon in dark gray
   - Hexagonal or circular shape

STYLE REQUIREMENTS:
- Use ${assetConfig.uiButtonsStyle.toLowerCase()} casino aesthetic
- 3D beveled edges with realistic drop shadows
- Glossy metallic finish with light reflections
- High contrast colors for maximum visibility
- Each button should look pressable and interactive
- Consistent lighting from top-left direction
- NO flat or monochrome designs

${retryEnhancement}`;

      console.log('🎮 [UI Generation] Enhanced prompt:', enhancedPrompt);
      console.log('🎮 [UI Generation] Starting generation... This may take 1-3 minutes for complex UI designs.');

      // Call the enhanced OpenAI client with progress tracking
      const result = await enhancedOpenaiClient.generateImage(enhancedPrompt, {
        size: '1024x1024',
        quality: 'high'
      });

      console.log('🎮 [UI Generation] Generation result:', result);

      if (!result.imageUrl) {
        throw new Error('No image URL returned from generation');
      }

      console.log('🎮 [UI Generation] Image generated successfully, extracting buttons...');

      // Update the UI buttons path
      updateAssetConfig('uiButtonsPath', result.imageUrl);

      // Ensure we have a gameId
      const gameId = config.gameId || `${(config.theme as any)?.name || 'slot'}_${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Save the full button sheet
      if (gameId) {
        try {
          const saveEndpoint = '/.netlify/functions/save-asset';

          const response = await fetch(saveEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-game-id': gameId || ''
            },
            body: JSON.stringify({
              assetType: 'ui-buttons',
              imageUrl: result.imageUrl,
              metadata: {
                theme: themeName,
                style: assetConfig.uiButtonsStyle,
                prompt: enhancedPrompt
              }
            })
          });

          if (response.ok) {
            console.log('✅ UI buttons saved successfully');
          } else {
            console.warn('⚠️ Failed to save UI buttons to server');
          }
        } catch (saveError) {
          console.error('Error saving UI buttons:', saveError);
        }
      }

      // Extract individual buttons from the generated sheet
      try {
        console.log('🎮 [UI Generation] Extracting individual buttons...');
        await extractButtonsFromSheet(result.imageUrl);

        // Check if extraction was successful by looking at the updated config
        // Wait a moment for the config to be updated
        setTimeout(() => {
          const currentConfig = useGameStore.getState().config;
          const extractedButtons = (currentConfig as any).uiElements;

          if (extractedButtons && Object.keys(extractedButtons).length > 0) {
            console.log('✅ UI buttons extracted successfully:', Object.keys(extractedButtons));
            // Store the extracted buttons in our local config for the adjustment system
            updateAssetConfig('extractedUIButtons', extractedButtons);
          } else {
            console.warn('⚠️ No buttons were extracted from the sheet');
          }
        }, 500);

      } catch (extractError) {
        console.error('Button extraction error:', extractError);

        // If extraction failed due to color issues, retry generation
        if (extractError instanceof Error && (extractError.message.includes('grayscale') || extractError.message.includes('vibrant colors')) && retryCount < 2) {
          console.log(`Retrying button generation (attempt ${retryCount + 2}/3) due to lack of color...`);
          updateAssetConfig('isGeneratingUIButtons', false);
          return generateUIButtons(retryCount + 1);
        }
      }

    } catch (error) {
      console.error('🎮 [UI Generation] Error generating UI buttons:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to generate UI buttons. ';

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
          errorMessage += 'The generation took too long and timed out. This can happen with complex prompts. Please try again with a simpler description or try again later.';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += 'Network connection issue. Please check your internet connection and try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }

      // Add helpful suggestions
      errorMessage += '\n\nSuggestions:\n• Try a simpler prompt\n• Check your internet connection\n• Wait a moment and try again\n• Upload custom UI button images instead';

      alert(errorMessage);
    } finally {
      updateAssetConfig('isGeneratingUIButtons', false);
    }
  };

  // Generate title assets function
  const generateTitleAssets = async (titleType: string) => {
    try {
      updateAssetConfig('isGeneratingTitleAssets', true);
      updateAssetConfig('currentTitleType', titleType);

      const titleLabels = {
        freeSpins: 'FREE SPINS',
        bonusGame: 'BONUS GAME',
        pickAndClick: 'PICK & CLICK',
        bigWin: 'BIG WIN',
        megaWin: 'MEGA WIN',
        jackpot: 'JACKPOT',
        gameOver: 'GAME OVER',
        congratulations: 'CONGRATULATIONS'
      };

      const titleLabel = titleLabels[titleType] || titleType.toUpperCase();

      // Create enhanced prompt for title assets
      const enhancedPrompt = `${assetConfig.titleAssetsPrompt || ''} Create a professional slot machine title graphic that says "${titleLabel}". Style: ${assetConfig.titleAssetsStyle}. Make it bold, eye-catching, with dramatic lighting effects, golden gradients, and casino-style typography. Should look premium and exciting like a real Las Vegas slot machine. High quality, 3D rendered appearance, with glow effects and shadows. The text should be the main focus, very readable and impactful. IMPORTANT: Use transparent background so the text can be overlaid on game backgrounds. Theme: ${config.selectedTheme?.name || 'fantasy'}`.trim();

      console.log('Generating title asset:', titleLabel);
      console.log('Prompt:', enhancedPrompt);

      const result = await enhancedOpenaiClient.generateImage(
        enhancedPrompt,
        {
          size: '1024x1024',
          quality: 'high'
        }
      );

      if (result?.imageUrl) {
        // Save title asset to file system
        try {
          const saveResult = await saveTitleAsset(result.imageUrl, titleType, config.gameId);
          console.log(`✅ Title asset saved to file: ${saveResult.filePath}`);

          // Update the specific title asset with the file path
          updateAssetConfig('titleAssets', {
            ...assetConfig.titleAssets,
            [titleType]: saveResult.filePath
          });

          // Save to store with file path
          updateConfig({
            titleAssets: {
              ...config.titleAssets,
              [titleType]: saveResult.filePath
            },
            titleAssetsStyle: assetConfig.titleAssetsStyle
          });

          alert(`${titleLabel} title generated and saved successfully!`);
        } catch (saveError) {
          console.warn('Failed to save title asset to file, using base64 fallback:', saveError);

          // Fallback to base64 storage
          updateAssetConfig('titleAssets', {
            ...assetConfig.titleAssets,
            [titleType]: result.imageUrl
          });

          updateConfig({
            titleAssets: {
              ...config.titleAssets,
              [titleType]: result.imageUrl
            },
            titleAssetsStyle: assetConfig.titleAssetsStyle
          });

          alert(`${titleLabel} title generated successfully! (Note: File saving failed, using temporary storage)`);
        }
      } else {
        throw new Error('Failed to generate title asset');
      }
    } catch (error) {
      console.error('Error generating title asset:', error);
      alert('Failed to generate title asset. Please try again.');
    } finally {
      updateAssetConfig('isGeneratingTitleAssets', false);
    }
  };



  // Generate logo using AI
  const generateLogo = async () => {
    updateAssetConfig('isGeneratingLogo', true);

    try {
      // Get theme name - handle both string and object formats
      const themeName = typeof config.theme === 'string'
        ? config.theme
        : (config.theme?.mainTheme || config.theme?.name || 'casino');

      const basePrompt = assetConfig.logoPrompt.trim() ||
        `${themeName} themed slot game logo`;

      // Enhanced prompt for logo generation
      const enhancedPrompt = `Create a professional gaming logo for a ${themeName} themed slot machine game.

        LOGO CONCEPT:
        ${basePrompt}
        - Capture the essence of ${themeName} theme with appropriate symbols and motifs
        - Professional casino/gaming industry aesthetic
        - Memorable and distinctive brand identity
        - Clean, bold design that works at multiple sizes

        VISUAL REQUIREMENTS:
        - High contrast text/symbols that remain readable when scaled down
        - Rich colors appropriate for ${themeName} theme
        - Premium, polished appearance suitable for slot game branding
        - Incorporate relevant thematic elements (crowns, gems, mystical symbols, etc.)
        - Strong visual impact with balanced composition
        - Design should fill most of the canvas area efficiently

        TECHNICAL SPECIFICATIONS:
        - PNG format with transparent background where appropriate
        - Logo should use the full canvas space effectively
        - Bold, clear design elements that are easily readable at small sizes
        - Suitable for use on game interface (top/center positioning)
        - Works well on both dark and light backgrounds
        - Compact, efficient design without wasted space
        - Text should be large and bold if included

        STYLE GUIDELINES:
        - ${themeName.includes('cartoon') || themeName.includes('candy') ? 'Stylized, vibrant art style' : 'Realistic, premium aesthetic'}
        - Typography should be bold and gaming-appropriate
        - Avoid overly complex details that won't scale well
        - Focus on iconic, recognizable elements
        - Make efficient use of the canvas space

        Create a logo that establishes strong brand identity for this ${themeName} slot game!`;

      // Generate logo with GPT-image-1 at a smaller size directly
      const result = await enhancedOpenaiClient.generateImage(
        enhancedPrompt,
        {
          size: '1024x1024', // OpenAI only supports this size, but we'll use it directly without cropping
          quality: 'high'
        }
      );

      if (result && result.imageUrl) {
        // Use the generated logo directly without cropping
        updateAssetConfig('logoPath', result.imageUrl);

        // Save the logo to the game assets folder
        const gameId = config.gameId || `${config.theme?.name || 'slot'}_${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (gameId) {
          try {
            const saveEndpoint = window.location.hostname === 'localhost'
              ? 'http://localhost:8080/save-image'
              : '/.netlify/functions/save-image';

            const response = await fetch(saveEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-id': gameId
              },
              body: JSON.stringify({
                image: result.imageUrl, // Use the generated logo directly
                gameId: gameId,
                symbolName: 'game_logo',
                symbolId: 'logo'
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log('Logo saved to:', data.filePath);
              updateAssetConfig('logoPath', data.filePath);
            }
          } catch (error) {
            console.error('Failed to save logo:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      alert('Failed to generate logo. Please try again or upload an image.');
    } finally {
      updateAssetConfig('isGeneratingLogo', false);
    }
  };

  // Handle logo image upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Logo upload triggered');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('File selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('Logo image loaded, updating config');
        updateAssetConfig('logoPath', event.target.result);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read the image file');
    };

    reader.readAsDataURL(file);
  };

  // Handle background image upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Background upload triggered');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('File selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('Background image loaded, updating config');
        updateAssetConfig('backgroundPath', event.target.result);

        // Emit event for UnifiedSlotPreview with current adjustments
        window.dispatchEvent(new CustomEvent('backgroundUpdated', {
          detail: {
            backgroundUrl: event.target.result,
            position: assetConfig.backgroundPosition,
            scale: assetConfig.backgroundScale,
            fit: assetConfig.backgroundFit
          }
        }));
        console.log('Background update event dispatched with adjustments:', {
          position: assetConfig.backgroundPosition,
          scale: assetConfig.backgroundScale,
          fit: assetConfig.backgroundFit
        });
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read the image file');
    };

    reader.readAsDataURL(file);
  };

  // Handle freespin background image upload
  const handleFreespinBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Freespin background upload triggered');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('Freespin background file selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('Freespin background image loaded, updating config');

        // Update the derivedBackgrounds.freespin field
        const updatedDerived = {
          ...assetConfig.derivedBackgrounds,
          freespin: event.target.result
        };
        updateAssetConfig('derivedBackgrounds', updatedDerived);

        // Emit event for UnifiedSlotPreview
        window.dispatchEvent(new CustomEvent('freespinBackgroundUpdated', {
          detail: { freespinBackgroundUrl: event.target.result }
        }));
        console.log('Freespin background update event dispatched');
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading freespin background file:', error);
      alert('Failed to read the freespin background image file');
    };

    reader.readAsDataURL(file);
  };

  // Handle frame image upload
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Frame upload triggered');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('File selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('Frame image loaded, updating config');
        updateAssetConfig('framePath', event.target.result);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read the image file');
    };

    reader.readAsDataURL(file);
  };

  // Handle UI buttons image upload
  const handleUIButtonsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('UI buttons upload triggered');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    const file = files[0];
    console.log('File selected:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        console.log('UI buttons image loaded, updating config');
        updateAssetConfig('uiButtonsPath', event.target.result);

        // Extract individual buttons from the uploaded image
        extractButtonsFromSheet(event.target.result);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read the image file');
    };

    reader.readAsDataURL(file);
  };

  // Extract individual buttons from a button sheet image using adaptive detection
  const extractButtonsFromSheet = async (imageUrl: string) => {
    console.log('Starting adaptive button extraction from:', imageUrl);

    // Get theme name for consistent gameId
    const themeName = typeof config.theme === 'object' ? (config.theme?.name || config.theme?.mainTheme || 'slot') : (config.theme || 'slot');
    const gameId = (config as any).gameId || `${themeName}_${new Date().toISOString().split('T')[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '_');

    try {
      // Use adaptive detection to find buttons
      const detectedButtons = await adaptiveButtonDetector.detectButtons(imageUrl);
      console.log('Detected buttons:', detectedButtons);

      // Create a canvas for extraction
      const img = new window.Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Validate that the image has actual content (not just gray)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let hasVibrantColor = false;
      let totalR = 0, totalG = 0, totalB = 0;
      let pixelCount = 0;
      let colorfulPixels = 0;

      // Sample pixels to check for color variation
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a > 128) { // Only count non-transparent pixels
          totalR += r;
          totalG += g;
          totalB += b;
          pixelCount++;

          // Check if this pixel has vibrant color (not gray)
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;

          // Count pixels with good saturation (colorful)
          if (saturation > 0.3) {
            colorfulPixels++;
            hasVibrantColor = true;
          }
        }
      }

      // Calculate percentage of colorful pixels
      const colorfulPercentage = pixelCount > 0 ? (colorfulPixels / pixelCount) * 100 : 0;

      if (pixelCount > 0) {
        const avgR = totalR / pixelCount;
        const avgG = totalG / pixelCount;
        const avgB = totalB / pixelCount;
        console.log('Image color analysis:', {
          avgR: Math.round(avgR),
          avgG: Math.round(avgG),
          avgB: Math.round(avgB),
          colorfulPercentage: colorfulPercentage.toFixed(1) + '%'
        });

        // Reject if not enough colorful pixels (less than 20% of the image)
        if (colorfulPercentage < 20) {
          console.warn('Image lacks vibrant colors. Only', colorfulPercentage.toFixed(1) + '% colorful pixels');
          throw new Error('Generated image lacks vibrant colors. Retrying with enhanced prompt.');
        }

        // Also check for grayscale average
        if (Math.abs(avgR - avgG) < 15 && Math.abs(avgG - avgB) < 15 && Math.abs(avgB - avgR) < 15) {
          console.warn('Image average color is grayscale');
          throw new Error('Generated image is grayscale. Retrying with enhanced prompt.');
        }
      }

      // Extract buttons with both states
      const extractedButtons: Record<string, string> = {};
      const extractedButtonsPressed: Record<string, string> = {};
      let uiBarImage: string | null = null;

      console.log(`Extracting UI elements from ${img.width}x${img.height} image`);

      // Detect regions for normal buttons, pressed buttons, and UI bar
      // Expected layout: 
      // - Top third: normal buttons
      // - Middle third: pressed buttons  
      // - Bottom: UI bar

      const topSectionHeight = img.height * 0.4;
      const middleSectionHeight = img.height * 0.4;
      const bottomSectionStart = img.height * 0.8;

      // Extract UI bar first
      const uiBarCanvas = document.createElement('canvas');
      const uiBarCtx = uiBarCanvas.getContext('2d');
      if (uiBarCtx) {
        uiBarCanvas.width = img.width;
        uiBarCanvas.height = 120; // Standard UI bar height

        uiBarCtx.drawImage(
          canvas,
          0, bottomSectionStart,    // Source position
          img.width, 120,           // Source dimensions
          0, 0,                     // Destination position
          img.width, 120            // Destination dimensions
        );

        uiBarImage = uiBarCanvas.toDataURL('image/png');
        console.log('Extracted UI bar');
      }

      // Extract buttons from 2x3 grid layout as specified in the prompt
      // Grid layout: MENU, SPIN, AUTO (top row) | SOUND, SETTINGS (bottom row)
      const buttonLayout = [
        // Top row
        { name: 'menuButton', x: 100, y: 100, size: 200 },      // Top-left
        { name: 'spinButton', x: 400, y: 100, size: 250 },      // Top-center (larger)
        { name: 'autoplayButton', x: 700, y: 100, size: 200 },  // Top-right
        // Bottom row
        { name: 'soundButton', x: 200, y: 500, size: 180 },     // Bottom-left
        { name: 'settingsButton', x: 600, y: 500, size: 180 }   // Bottom-right
      ];

      // Extract each button from its grid position
      for (const button of buttonLayout) {
        const { name, x, y, size } = button;

        console.log(`Extracting ${name} from position (${x}, ${y}) with size ${size}x${size}`);

        // Extract normal state
        const normalCanvas = document.createElement('canvas');
        const normalCtx = normalCanvas.getContext('2d');
        if (normalCtx) {
          normalCanvas.width = size;
          normalCanvas.height = size;

          normalCtx.drawImage(
            canvas,
            x, y,           // Source position (exact grid coordinates)
            size, size,     // Source size
            0, 0,           // Dest position
            size, size      // Dest size
          );

          extractedButtons[name] = normalCanvas.toDataURL('image/png');
          console.log(`✅ Extracted ${name} successfully`);
        }

        // For now, use the same image for pressed state (can be enhanced later)
        extractedButtonsPressed[name] = extractedButtons[name];

        // Save button to server (skip for now to avoid memory issues)
        if (false && gameId) {
          try {
            // Save normal state
            const saveEndpoint = window.location.hostname === 'localhost'
              ? 'http://localhost:8080/save-image'
              : '/.netlify/functions/save-image';

            const normalResponse = await fetch(saveEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-id': gameId
              },
              body: JSON.stringify({
                image: extractedButtons[name],
                gameId: gameId,
                symbolName: `${name}_normal`,
                symbolId: `ui_${name}_normal`
              })
            });

            if (normalResponse.ok) {
              const data = await normalResponse.json();
              console.log(`Saved ${name} normal state to:`, data.filePath);
              extractedButtons[name] = data.filePath;
            }

            // Save pressed state
            const pressedResponse = await fetch(saveEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-game-id': gameId
              },
              body: JSON.stringify({
                image: extractedButtonsPressed[name],
                gameId: gameId,
                symbolName: `${name}_pressed`,
                symbolId: `ui_${name}_pressed`
              })
            });

            if (pressedResponse.ok) {
              const data = await pressedResponse.json();
              console.log(`Saved ${name} pressed state to:`, data.filePath);
              extractedButtonsPressed[name] = data.filePath;
            }
          } catch (error) {
            console.error(`Failed to save ${name}:`, error);
          }
        }
      }

      // Save UI bar if we have one (skip for now to avoid memory issues)
      if (false && uiBarImage && gameId) {
        try {
          const saveEndpoint = window.location.hostname === 'localhost'
            ? 'http://localhost:8080/save-image'
            : '/.netlify/functions/save-image';

          const response = await fetch(saveEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-game-id': gameId
            },
            body: JSON.stringify({
              image: uiBarImage,
              gameId: gameId,
              symbolName: 'ui_bar',
              symbolId: 'ui_bar'
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Saved UI bar to:', data.filePath);
            uiBarImage = data.filePath;
          }
        } catch (error) {
          console.error('Failed to save UI bar:', error);
        }
      }

      // Create button metadata for the extracted buttons
      const buttonMetadata = buttonLayout.reduce((acc, button) => {
        acc[button.name] = {
          shape: button.name === 'spinButton' ? 'circle' : 'rounded',
          width: button.size,
          height: button.size,
          aspectRatio: 1,
          visualWeight: button.name === 'spinButton' ? 0.9 : 0.7,
          position: { x: button.x, y: button.y }
        };
        return acc;
      }, {} as Record<string, any>);

      // Calculate optimal layout for UI
      const layoutConstraints = {
        containerWidth: window.innerWidth > 768 ? Math.min(window.innerWidth, 1200) : window.innerWidth,
        containerHeight: 100, // Increased UI bar height
        minButtonSize: 70,
        maxButtonSize: 120, // Increased max size
        minSpacing: 20,
        spinButtonRatio: 1.4 // Spin button 40% larger than others
      };

      // Create button info for layout calculation using the new button layout
      const buttonInfos = buttonLayout.map((button) => ({
        name: button.name,
        x: button.x,
        y: button.y,
        width: button.size,
        height: button.size,
        shape: button.name === 'spinButton' ? 'circle' as const : 'rounded' as const,
        centerX: button.x + button.size / 2,
        centerY: button.y + button.size / 2,
        aspectRatio: 1,
        visualWeight: button.name === 'spinButton' ? 0.9 : 0.7,
        boundingBox: {
          x: button.x,
          y: button.y,
          width: button.size,
          height: button.size
        }
      }));

      const optimalLayout = adaptiveButtonDetector.calculateOptimalLayout(
        buttonInfos,
        layoutConstraints
      );

      // Update UI elements with extracted buttons and layout info
      console.log('Extracted buttons:', Object.keys(extractedButtons));
      console.log('Extracted pressed buttons:', Object.keys(extractedButtonsPressed));
      console.log('UI Bar extracted:', !!uiBarImage);
      console.log('Button metadata:', buttonMetadata);
      console.log('Optimal layout:', optimalLayout);

      updateAssetConfig('uiElements', extractedButtons);
      updateAssetConfig('uiElementsPressed', extractedButtonsPressed);
      // Skip updating non-existent properties to avoid type errors
      // updateAssetConfig('uiBar', uiBarImage);
      // updateAssetConfig('uiButtonMetadata', buttonMetadata);
      // updateAssetConfig('uiButtonLayout', optimalLayout);

      // Force update the global config immediately
      updateConfig({
        ...(config as any),
        uiElements: extractedButtons,
        uiElementsPressed: extractedButtonsPressed,
        uiBar: uiBarImage,
        uiButtonMetadata: buttonMetadata,
        uiButtonLayout: optimalLayout
      } as any);

      // Log to verify the update and force a re-render
      setTimeout(() => {
        const currentConfig = useGameStore.getState().config;
        console.log('[Step5] Config after update:', {
          uiElements: (currentConfig as any).uiElements,
          uiButtonMetadata: (currentConfig as any).uiButtonMetadata,
          uiButtonLayout: (currentConfig as any).uiButtonLayout
        });

        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('uiButtonsUpdated', {
          detail: {
            buttons: extractedButtons,
            buttonsPressed: extractedButtonsPressed,
            uiBar: uiBarImage,
            metadata: buttonMetadata,
            layout: optimalLayout
          }
        }));
      }, 100);

    } catch (error) {
      console.error('Error extracting buttons:', error);
      console.error('Error details:', (error as Error).message, (error as Error).stack);

      // Fallback: use the full image for all buttons
      const fallbackButtons = {
        spinButton: imageUrl,
        autoplayButton: imageUrl,
        menuButton: imageUrl,
        soundButton: imageUrl,
        settingsButton: imageUrl
      };

      updateAssetConfig('uiElements', fallbackButtons);
    }
  };

  // Auto-adjust frame based on grid layout
  const autoAdjustFrame = () => {
    const reels = config.reels?.layout?.reels || 5;
    const rows = config.reels?.layout?.rows || 3;

    const gridDensity = reels * rows;
    const aspectRatio = reels / rows;
    const isWideGrid = aspectRatio > 1.8;
    const isTallGrid = aspectRatio < 1.2;
    const isSquareGrid = reels === rows;

    let newScale = 100;
    let newPosition = { x: 0, y: 0 };
    let newStretch = { x: 100, y: 100 };

    // Apply appropriate adjustments based on grid type
    if (gridDensity <= 12) {
      if (isSquareGrid) {
        // 3x3 square grid
        newScale = 115;
        newPosition = { x: 0, y: -5 };
      } else if (isWideGrid) {
        // 4x3 grid
        newScale = 110;
        newStretch = { x: 102, y: 100 };
      }
    } else if (gridDensity <= 20) {
      if (isWideGrid) {
        // 5x3, 6x3, 7x3 grids
        newScale = 105;
        newStretch = { x: Math.min(105, 100 + (reels - 5) * 2), y: 100 };
      } else if (isTallGrid) {
        // 3x5, 3x6 grids
        newScale = 105;
        newStretch = { x: 100, y: Math.min(105, 100 + (rows - 3) * 2) };
      } else {
        // Standard 5x3 grid
        newScale = 100;
        newStretch = { x: 100, y: 100 };
      }
    } else {
      // Large grids
      newScale = Math.max(90, 100 - Math.floor(gridDensity / 10) * 2);
      newStretch = {
        x: Math.min(115, 100 + (reels - 5) * 3),
        y: Math.min(115, 100 + (rows - 3) * 3)
      };
    }

    updateAssetConfig('frameScale', newScale);
    updateAssetConfig('framePosition', newPosition);
    updateAssetConfig('frameStretch', newStretch);

    console.log(`Auto-adjusted frame for ${reels}x${rows} grid:`, {
      scale: newScale,
      position: newPosition,
      stretch: newStretch
    });
  };

  // Apply frame template based on grid type
  const applyFrameTemplate = async (templateType: 'minimal' | 'ornate' | 'reels' | 'adaptive') => {
    setGridOptimize(templateType);
    const reels = config.reels?.layout?.reels;
    const rows = config.reels?.layout?.rows;
    const themeName = typeof config.theme === 'string'
      ? config.theme
      : (config.theme?.mainTheme || config.theme?.name || 'casino');

    let templatePrompt = '';
    let frameStyle: 'outer' | 'reel' | 'both' = 'outer';

    switch (templateType) {
      case 'minimal':
        frameStyle = 'outer';
        templatePrompt = `Minimal, clean frame for ${themeName} slot machine. Simple elegant border with subtle ${themeName} theme elements. Very thin frame (30-40 pixels) perfect for ${reels}x${rows} grid.`;
        break;

      case 'ornate':
        frameStyle = 'outer';
        templatePrompt = `Highly decorative, ornate frame for premium ${themeName} slot machine. Rich detailed borders with intricate ${themeName} themed ornaments, corners, and embellishments. Luxurious casino-quality frame for ${reels}x${rows} grid.`;
        break;

      case 'reels':
        frameStyle = 'reel';
        templatePrompt = `Reel separator frame for ${themeName} slot machine. Vertical dividers between reels with ${themeName} themed decorative elements. Perfect reel separation for ${reels}x${rows} grid layout.`;
        break;

      case 'adaptive':
        frameStyle = 'both';
        templatePrompt = `Smart adaptive frame for ${themeName} slot machine. Automatically optimized design for ${reels}x${rows} grid with perfect proportions. Includes both outer border and reel dividers with balanced ${themeName} themed styling.`;
        autoAdjustFrame(); // Auto-adjust positioning
        break;

      default:
        frameStyle = 'outer';
        templatePrompt = `Minimal, clean frame for ${themeName} slot machine. Simple elegant border with subtle ${themeName} theme elements. Very thin frame (30-40 pixels) perfect for ${reels}x${rows} grid.`;
        break;
    }


    // Update frame configuration
    updateAssetConfig('frameStyle', frameStyle);
    updateAssetConfig('framePrompt', templatePrompt);

    // Apply template-specific positioning
    switch (templateType) {
      case 'minimal':
        updateAssetConfig('frameScale', 105);
        updateAssetConfig('framePosition', { x: 0, y: 0 });
        updateAssetConfig('frameStretch', { x: 100, y: 100 });
        break;

      case 'ornate':
        updateAssetConfig('frameScale', 110);
        updateAssetConfig('framePosition', { x: 0, y: -2 });
        updateAssetConfig('frameStretch', { x: 102, y: 102 });
        break;

      case 'reels':
        updateAssetConfig('frameScale', 100);
        updateAssetConfig('framePosition', { x: 0, y: 0 });
        updateAssetConfig('frameStretch', { x: 98, y: 100 });
        break;
    }

    console.log(`Applied ${templateType} frame template for ${reels}x${rows} grid`);
  };

  // Validate frame quality and transparency
  const validateFrame = async (frameUrl: string) => {
    try {
      console.log('Validating frame quality and transparency...');

      // Create image element to analyze
      const img = new Image();
      img.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Create canvas for analysis
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not create canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Analyze transparency in center area
          const centerX = img.width / 2;
          const centerY = img.height / 2;
          const centerWidth = img.width * 0.6; // Check 60% of center area
          const centerHeight = img.height * 0.6;

          const imageData = ctx.getImageData(
            centerX - centerWidth / 2,
            centerY - centerHeight / 2,
            centerWidth,
            centerHeight
          );

          let transparentPixels = 0;
          let totalPixels = imageData.data.length / 4;

          // Check alpha channel
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] < 50) { // Alpha < 50 is considered transparent
              transparentPixels++;
            }
          }

          const transparencyPercentage = (transparentPixels / totalPixels) * 100;

          // Validation results
          const validation = {
            isValid: transparencyPercentage > 60, // At least 60% transparent center
            transparencyPercentage: Math.round(transparencyPercentage),
            dimensions: { width: img.width, height: img.height },
            gridCompatibility: true, // Always true for generated frames
            recommendations: []
          };

          if (validation.transparencyPercentage < 60) {
            validation.recommendations.push('Frame center should be more transparent for better symbol visibility');
          }
          if (img.width !== img.height) {
            validation.recommendations.push('Square aspect ratio (1:1) recommended for optimal grid alignment');
          }
          if (img.width < 512) {
            validation.recommendations.push('Higher resolution (1024x1024) recommended for crisp details');
          }

          console.log('Frame validation results:', validation);

          // Show validation results to user
          const statusMessage = validation.isValid
            ? `✅ Frame validated! ${validation.transparencyPercentage}% center transparency`
            : `⚠️ Frame needs improvement: ${validation.recommendations.join(', ')}`;

          alert(statusMessage);
          resolve(validation);
        };

        img.onerror = () => {
          reject(new Error('Failed to load frame image for validation'));
        };

        img.src = frameUrl;
      });

    } catch (error) {
      console.error('Frame validation error:', error);
      alert('Failed to validate frame. Please try again.');
    }
  };

  // Generate device-specific background versions
  const generateDeviceSpecificBackgrounds = async () => {
    if (!assetConfig.backgroundPath) {
      alert('Please generate or upload a main background first');
      return;
    }

    try {
      updateAssetConfig('isDeriving', true);

      const devices = [
        { name: 'desktop', ratio: '16:9', description: 'Desktop widescreen' },
        { name: 'mobile-portrait', ratio: '9:16', description: 'Mobile portrait' },
        { name: 'mobile-landscape', ratio: '16:9', description: 'Mobile landscape' }
      ];

      for (const device of devices) {
        console.log(`Generating ${device.name} optimized background...`);

        const enhancedOpenaiClient = (await import('../../../utils/enhancedOpenaiClient')).default;

        const result = await enhancedOpenaiClient.generateImageWithConfig({
          sourceImage: assetConfig.backgroundPath,
          sourceDescription: `Slot machine background`,
          sourceSymbolId: 'background_main',
          targetSymbolId: `background_${device.name}`,
          gameId: config.gameId,
          count: 1,
          additionalPrompt: `Optimize this background for ${device.description} (${device.ratio} aspect ratio). Ensure all important visual elements are visible and properly composed for ${device.name} viewing.`
        });

        if (result && result.success && result.images && result.images.length > 0) {
          // Save to derived backgrounds
          const newDerivedBackgrounds = {
            ...assetConfig.derivedBackgrounds,
            [device.name]: result.images[0]
          };
          updateAssetConfig('derivedBackgrounds', newDerivedBackgrounds);
        }
      }

      alert('Device-specific backgrounds generated successfully!');
    } catch (error) {
      console.error('Error generating device-specific backgrounds:', error);
      alert('Failed to generate device-specific backgrounds. Please try again.');
    } finally {
      updateAssetConfig('isDeriving', false);
    }
  };

  // Regenerate missing button states (disabled, hover, etc.)
  const regenerateButtonStates = async () => {
    try {
      console.log('Generating missing button states...');

      const buttonNames = ['spinButton', 'autoplayButton', 'menuButton', 'soundButton', 'settingsButton'];
      const missingStates = [];

      // Check which buttons need disabled states
      for (const buttonName of buttonNames) {
        if (assetConfig.uiElements[buttonName] && !assetConfig.uiElementsPressed?.[buttonName]) {
          missingStates.push({ button: buttonName, state: 'pressed' });
        }
      }

      if (missingStates.length === 0) {
        alert('All button states are already generated!');
        return;
      }

      updateAssetConfig('isGeneratingUIButtons', true);

      const enhancedOpenaiClient = (await import('../../../utils/enhancedOpenaiClient')).default;
      const newPressedButtons = { ...assetConfig.uiElementsPressed };

      // Generate pressed states for missing buttons
      for (const { button, state } of missingStates) {
        console.log(`Generating ${state} state for ${button}...`);

        const result = await enhancedOpenaiClient.generateImageWithConfig({
          sourceImage: assetConfig.uiElements[button],
          sourceDescription: `${button.replace('Button', '')} slot machine UI button`,
          sourceSymbolId: `ui_${button}_normal`,
          targetSymbolId: `ui_${button}_${state}`,
          gameId: config.gameId,
          count: 1,
          additionalPrompt: `Create a ${state} state version of this button. For pressed: make it appear depressed/clicked with subtle shadow and slightly darker colors. Maintain the same style and theme.`
        });

        if (result && result.success && result.images && result.images.length > 0) {
          newPressedButtons[button] = result.images[0];
        }
      }

      updateAssetConfig('uiElementsPressed', newPressedButtons);
      alert(`Generated ${missingStates.length} missing button states!`);

    } catch (error) {
      console.error('Error generating button states:', error);
      alert('Failed to generate button states. Please try again.');
    } finally {
      updateAssetConfig('isGeneratingUIButtons', false);
    }
  };

  // Render the preset tab
  const renderPresetTab = () => {
    return (
      <div className="space-y-8">
        {/* Background section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {/* <Image className="w-5 h-5 mr-2 text-blue-600" /> */}
              Background (Desktop & Mobile)
            </h3>
          </div>

          <div className="p-4">
            <div className="flex w-full flex-col gap-1">
              <div className="w-full">
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="Describe the background you want for your slot game..."
                  value={assetConfig.backgroundPrompt}
                  onChange={(e) => updateAssetConfig('backgroundPrompt', e.target.value)}
                />
                <p className="text-xs text-gray-500 mb-1">
                  AI will generate backgrounds optimized for both desktop (16:9) and mobile portrait (9:16)
                </p>
              </div>

              <div className="flex flex-co w-full gap-2">
                <Button
                  variant="generate"
                  onClick={generateBackground}
                  className='py-2 w-[50%]'
                  disabled={assetConfig.isGeneratingBackground}
                >
                  {assetConfig.isGeneratingBackground ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  variant="uploadImage"
                  className='py-2 w-[50%]'
                  onClick={() => backgroundFileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={backgroundFileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleBackgroundUpload}
                  key="background-upload"
                />
              </div>
            </div>


            {/* Preview current background */}
            {assetConfig.backgroundPath && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Background</h4>
                <div className="aspect-video bg-gray-200 rounded-md overflow-hidden">
                  <img
                    src={assetConfig.backgroundPath}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Freespin Background Upload Section */}
            <div className="mt-6 p-4  bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Freespin Background (Optional)
              </h4>
              <p className="text-xs text-gray-700 mb-4">
                Upload a different background for freespin mode. This will be used in the transition animation.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="uploadImage"
                  className="flex-1"
                  onClick={() => freespinBackgroundFileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Freespin Background
                </Button>
                <input
                  type="file"
                  ref={freespinBackgroundFileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFreespinBackgroundUpload}
                  key="freespin-background-upload"
                />

                {/* Clear freespin background button */}
                {assetConfig.derivedBackgrounds.freespin && (
                  <button
                    className="flex items-center justify-center gap-2 border border-amber-300 hover:bg-amber-100 py-2 px-4 rounded-md transition-colors text-amber-700"
                    onClick={() => {
                      const updatedDerived = {
                        ...assetConfig.derivedBackgrounds,
                        freespin: undefined
                      };
                      updateAssetConfig('derivedBackgrounds', updatedDerived);
                      window.dispatchEvent(new CustomEvent('freespinBackgroundUpdated', {
                        detail: { freespinBackgroundUrl: null }
                      }));
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Preview freespin background */}
              {assetConfig.derivedBackgrounds.freespin && (
                <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
                  <h5 className="text-sm font-medium text-amber-700 mb-2">Freespin Background Preview</h5>
                  <div className="aspect-video bg-amber-100 rounded-md overflow-hidden">
                    <img
                      src={assetConfig.derivedBackgrounds.freespin}
                      alt="Freespin Background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Background Control Panel */}
            {assetConfig.backgroundPath && (
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-md border border-indigo-200">
                <h4 className="text-sm font-semibold text-indigo-800 mb-4 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Background Controls
                </h4>

                {/* Device Preview Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    className={`px-3 py-2 text-xs rounded-md border transition-colors ${backgroundPreviewDevice === 'desktop'
                      ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      setBackgroundPreviewDevice('desktop');
                      // Dispatch device mode change event for PixiJS preview
                      window.dispatchEvent(new CustomEvent('deviceModeChanged', {
                        detail: { mode: 'desktop' }
                      }));
                      console.log('🖥️ [Step6] Device mode changed to desktop');
                    }}
                  >
                    🖥️ Desktop
                  </button>
                  <button
                    className={`px-3 py-2 text-xs rounded-md border transition-colors ${backgroundPreviewDevice === 'mobile-portrait'
                      ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      setBackgroundPreviewDevice('mobile-portrait');
                      // Dispatch device mode change event for PixiJS preview
                      window.dispatchEvent(new CustomEvent('deviceModeChanged', {
                        detail: { mode: 'mobile', orientation: 'portrait' }
                      }));
                      console.log('📱 [Step6] Device mode changed to mobile portrait');
                    }}
                  >
                    📱 Mobile Portrait
                  </button>
                  <button
                    className={`px-3 py-2 text-xs rounded-md border transition-colors ${backgroundPreviewDevice === 'mobile-landscape'
                      ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      setBackgroundPreviewDevice('mobile-landscape');
                      // Dispatch device mode change event for PixiJS preview
                      window.dispatchEvent(new CustomEvent('deviceModeChanged', {
                        detail: { mode: 'mobile', orientation: 'landscape' }
                      }));
                      console.log('📱 [Step6] Device mode changed to mobile landscape');
                    }}
                  >
                    📱 Mobile Landscape
                  </button>
                </div>

                {/* Background Positioning Controls */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-indigo-700 flex items-center">
                        <Move className="w-3 h-3 mr-1" />
                        X Position
                      </label>
                      <span className="text-xs text-indigo-600">{assetConfig.backgroundPosition?.x || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={assetConfig.backgroundPosition?.x || 0}
                      onChange={(e) => updateAssetConfig('backgroundPosition', {
                        ...assetConfig.backgroundPosition,
                        x: parseInt(e.target.value)
                      })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-indigo-700 flex items-center">
                        <Move className="w-3 h-3 mr-1" />
                        Y Position
                      </label>
                      <span className="text-xs text-indigo-600">{assetConfig.backgroundPosition?.y || 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={assetConfig.backgroundPosition?.y || 0}
                      onChange={(e) => updateAssetConfig('backgroundPosition', {
                        ...assetConfig.backgroundPosition,
                        y: parseInt(e.target.value)
                      })}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-indigo-700 flex items-center">
                        <ZoomIn className="w-3 h-3 mr-1" />
                        Scale
                      </label>
                      <span className="text-xs text-indigo-600">{assetConfig.backgroundScale || 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={assetConfig.backgroundScale || 100}
                      onChange={(e) => updateAssetConfig('backgroundScale', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Background Fit Options */}
                <div className="mt-4">
                  <label className="text-xs text-indigo-700 mb-2 block">Background Fit</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['cover', 'contain', 'fill', 'scale-down'].map((fitMode) => (
                      <button
                        key={fitMode}
                        className={`p-2 text-xs rounded-md border transition-colors ${assetConfig.backgroundFit === fitMode
                          ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                          : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        onClick={() => updateAssetConfig('backgroundFit', fitMode)}
                      >
                        {fitMode.charAt(0).toUpperCase() + fitMode.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device-Specific Background Generation */}
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-800">Device-Optimized Versions</span>
                    <button
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      onClick={() => generateDeviceSpecificBackgrounds()}
                    >
                      Generate All
                    </button>
                  </div>
                  <div className="text-xs text-indigo-600">
                    Auto-generate optimized backgrounds for different screen sizes and orientations
                  </div>
                </div>
              </div>
            )}

            {/* Background Variations - Derive Function */}
            {assetConfig.backgroundPath && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center">
                    <Copy className="w-4 h-4 mr-1" />
                    Background Variations (Game Modes)
                  </h4>
                </div>

                {/* Custom derive prompt */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Custom Variation Description (Optional)
                  </label>
                  <textarea
                    className="w-full h-16 p-2 border border-blue-300 rounded text-xs resize-none"
                    placeholder="Describe how you want to transform the background (e.g., 'Add golden magical effects and floating particles')"
                    value={assetConfig.derivePrompt}
                    onChange={(e) => updateAssetConfig('derivePrompt', e.target.value)}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Leave empty to use automatic transformation for each variation type
                  </p>
                </div>

                {/* Derive buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    onClick={() => deriveBackground('night')}
                    disabled={assetConfig.isDeriving}
                  >
                    {assetConfig.isDeriving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    Night Version
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    onClick={() => deriveBackground('day')}
                    disabled={assetConfig.isDeriving}
                  >
                    {assetConfig.isDeriving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                    Day Version
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    onClick={() => deriveBackground('bonus')}
                    disabled={assetConfig.isDeriving}
                  >
                    {assetConfig.isDeriving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                    Bonus Round
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    onClick={() => deriveBackground('freespin')}
                    disabled={assetConfig.isDeriving}
                  >
                    {assetConfig.isDeriving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Free Spins
                  </button>
                </div>

                {/* Preview derived backgrounds */}
                {Object.keys(assetConfig.derivedBackgrounds).length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-blue-700 mb-2">Generated Variations</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(assetConfig.derivedBackgrounds).map(([type, url]) => (
                        <div key={type} className="relative">
                          <div
                            className="aspect-video bg-gray-200 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 group"
                            onClick={() => setBackgroundInPreview(url, type)}
                            title={`Click to set ${type} background in PixiJS preview`}
                          >
                            <img
                              src={url}
                              alt={`${type} background`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Set as Background
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-blue-600">
                  <p><strong>Usage:</strong> Each variation can be used for different game modes:</p>
                  <p>• <strong>Night/Day:</strong> Time-based themes or dual game modes</p>
                  <p>• <strong>Bonus:</strong> Special bonus round backgrounds with enhanced effects</p>
                  <p>• <strong>Free Spins:</strong> Mystical free spin mode backgrounds</p>
                  <p className="mt-2 font-medium">💡 <strong>Tip:</strong> Click any generated background to set it in the PixiJS preview!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frame section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              {/* <Frame className="w-5 h-5 mr-2 text-amber-600" /> */}
              Frame (Transparent PNG)
            </h3>
          </div>

          <div className="p-6">
            {/* Grid-Aware Frame Templates */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                {/* <Frame className="w-4 h-4 mr-2" /> */}
                Grid-Optimized Templates
                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {config.reels?.layout?.reels}×{config.reels?.layout?.rows}
                </span>
              </h4>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  className={`${gridOptimize === "minimal" && 'bg-red-50 border-red-500'} p-3 text-xs rounded-md border border-blue-200 transition-colors flex flex-col items-center`}
                  onClick={() => applyFrameTemplate('minimal')}
                >
                  <div className={`${gridOptimize === "minimal" && 'bg-red-200 border-red-400'} w-8 h-8 mb-1 bg-blue-200 rounded border-2 border-blue-400 relative`}>
                    {/* <div className="absolute inset-1 bg-transparent border border-red-300 rounded"></div> */}
                    <div className={`${gridOptimize === "minimal" && ' border-red-400'} absolute inset-1 bg-transparent border border-blue-300 rounded`}></div>
                  </div>
                  Minimal
                </button>

                <button
                  className={`${gridOptimize === "ornate" && 'bg-red-50 border-red-500'} p-3 text-xs rounded-md border border-blue-200 transition-colors flex flex-col items-center`}
                  onClick={() => applyFrameTemplate('ornate')}
                >
                  <div className={`${gridOptimize === "ornate" && 'bg-red-200 border-red-400'} w-8 h-8 mb-1 bg-blue-200 rounded border-4 border-blue-400 relative`}>
                    <div className={`${gridOptimize === "ornate" && ' border-red-400'} absolute inset-2 bg-transparent border border-blue-400 rounded`}></div>
                    <div className={`${gridOptimize === "ornate" && ' bg-red-500'} absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full`}></div>
                    <div className={`${gridOptimize === "ornate" && ' bg-red-500'} absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full`}></div>
                  </div>
                  Ornate
                </button>

                <button
                  className={`${gridOptimize === "reels" && 'bg-red-50 border-red-500'} p-3 text-xs rounded-md border border-blue-200 transition-colors flex flex-col items-center`}
                  onClick={() => applyFrameTemplate('reels')}
                >
                  <div className={`${gridOptimize === "reels" && 'bg-red-200 border-red-400'} w-8 h-8 mb-1 bg-blue-200 rounded border-2 border-blue-400 relative flex`}>
                    <div className={`${gridOptimize === "reels" && ' border-red-400'} flex-1 border-r border-blue-300`}></div>
                    <div className={`${gridOptimize === "reels" && ' border-red-400'}  flex-1 border-r border-blue-300`}></div>
                    <div className="flex-1"></div>
                  </div>
                  Reel Dividers
                </button>

                <button
                  className={`${gridOptimize === "adaptive" && 'bg-red-50 border-red-500'} p-3 text-xs rounded-md border border-blue-200 transition-colors flex flex-col items-center`}
                  onClick={() => applyFrameTemplate('adaptive')}
                >
                  <div className={`${gridOptimize === "adaptive" && 'bg-red-200 border-red-400'} w-8 h-8 mb-1 bg-blue-200 rounded border-2 border-blue-400 relative`}>
                    <div className={`${gridOptimize === "adaptive" && ' border-red-400'} absolute inset-1 bg-transparent border border-blue-400 rounded`}></div>
                  </div>
                  Auto-Fit
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                <strong>Smart Templates:</strong> Optimized for your {config.reels?.layout?.reels || 5}×{config.reels?.layout?.rows || 3} grid layout
              </div>
            </div>

            {/* Frame style selector */}
            <div className="mb-4 border p-4 rounded-md bg-gray-50">
              <label className="text-sm font-medium text-gray-800 mb-2 block">Frame Style</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out ${assetConfig.frameStyle === 'outer'
                    ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                  onClick={() => updateAssetConfig('frameStyle', 'outer')}
                >
                  Outer Frame
                </button>
                <button
                  className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out ${assetConfig.frameStyle === 'reel'
                    ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                  onClick={() => updateAssetConfig('frameStyle', 'reel')}
                >
                  Reel Frame
                </button>
                <button
                  className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out ${assetConfig.frameStyle === 'both'
                    ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                  onClick={() => updateAssetConfig('frameStyle', 'both')}
                >
                  Both
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="col-span-2">
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="Enter frame style (e.g., aztec temple, forest roots, candy canes, golden ornate)"
                  value={assetConfig.framePrompt}
                  onChange={(e) => {
                    updateAssetConfig('framePrompt', e.target.value);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Frame will be transparent PNG that surrounds the symbols grid
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant='generate'
                  className='py-2 w-[50%]'
                  onClick={generateFrame}
                  disabled={assetConfig.isGeneratingFrame}
                >
                  {assetConfig.isGeneratingFrame ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </Button>

                <Button
                  variant='uploadImage'
                  className='py-2 w-[50%]'
                  onClick={() => frameFileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={frameFileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFrameUpload}
                  key="frame-upload"
                />
              </div>
            </div>

            {/* Frame validation indicator */}
            {assetConfig.framePath && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-blue-800">Frame Validation</span>
                  </div>
                  <button
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    onClick={() => validateFrame(assetConfig.framePath!)}
                  >
                    Check Quality
                  </button>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  • Grid compatibility: {config.reels?.layout?.reels || 5}×{config.reels?.layout?.rows || 3} ✓
                  • Transparency check: Automated validation available
                  • Professional quality: AI-optimized for slot games
                </div>
              </div>
            )}

            {/* Frame adjustment controls */}
            <div className="mt-4 p-4 bg-gray-50 border rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-800">Frame Adjustments</h4>
                <button
                  className="flex items-center gap-1 text-[0.8rem] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  onClick={autoAdjustFrame}
                >
                  <CheckCircle className="w-3 h-3" />
                  Auto-Adjust
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Scale adjustment */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-600 flex items-center">
                      <ZoomIn className="w-3 h-3 mr-1" />
                      Scale
                    </label>
                    <span className="text-xs text-gray-600">{assetConfig.frameScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="120"
                    value={assetConfig.frameScale}
                    onChange={(e) => updateAssetConfig('frameScale', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* X Position adjustment */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-600 flex items-center">
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      Horizontal Position
                    </label>
                    <span className="text-xs text-gray-600">{assetConfig.framePosition.x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={assetConfig.framePosition.x}
                    onChange={(e) => updateAssetConfig('framePosition', { ...assetConfig.framePosition, x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Y Position adjustment */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-600 flex items-center">
                      <ArrowUpDown className="w-3 h-3 mr-1" />
                      Vertical Position
                    </label>
                    <span className="text-xs text-gray-600">{assetConfig.framePosition.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={assetConfig.framePosition.y}
                    onChange={(e) => updateAssetConfig('framePosition', { ...assetConfig.framePosition, y: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* X Stretch adjustment */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-gray-600">Horizontal Stretch</label>
                    <span className="text-xs text-gray-600">{assetConfig.frameStretch.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="120"
                    value={assetConfig.frameStretch.x}
                    onChange={(e) => updateAssetConfig('frameStretch', { ...assetConfig.frameStretch, x: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Preview current frame */}
            {assetConfig.framePath && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Frame</h4>
                <div className="bg-gray-200 rounded-md overflow-hidden h-32 flex items-center justify-center">
                  <img
                    src={assetConfig.framePath}
                    alt="Frame"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* UI Elements section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              UI Elements (Transparent Icons)
            </h3>
          </div>

          <div className="p-6">
            {/* UI Style selector */}
            <div className="mb-4 w-full gap-2 flex items-center justify-center">
              <label className="text-sm w-[10%] font-medium text-gray-700  block">UI Style:</label>
              <select
                className="w-[90%] p-2 border border-gray-300 rounded-md "
                value={assetConfig.uiButtonsStyle}
                onChange={(e) => updateAssetConfig('uiButtonsStyle', e.target.value)}
              >
                <option value="Modern">Modern</option>
                <option value="Classic">Classic</option>
                <option value="Minimal">Minimal</option>
                <option value="Ornate">Ornate</option>
                <option value="Futuristic">Futuristic</option>
                <option value="Retro">Retro</option>
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <div className="col-span-2">
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="Describe the UI button style you want..."
                  value={assetConfig.uiButtonsPrompt}
                  onChange={(e) => updateAssetConfig('uiButtonsPrompt', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will generate individual casino-style buttons: SPIN, AUTO, MENU, SOUND, and SETTINGS
                </p>
                {assetConfig.isGeneratingUIButtons && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ⏳ Generating individual buttons... This creates 5 separate high-quality casino buttons (2-5 minutes).
                  </p>
                )}
              </div>

              <div className="flex w-full gap-2">
                <Button
                  variant='generate'
                  className='py-2 w-[50%]'
                  onClick={() => generateIndividualUIButtons()}
                  disabled={assetConfig.isGeneratingUIButtons}
                >
                  {assetConfig.isGeneratingUIButtons ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating Individual Buttons...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Individual Buttons
                    </>
                  )}
                </Button>

                <Button
                  variant='uploadImage'
                  className='py-2 w-[50%]'
                  onClick={() => uiButtonsFileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={uiButtonsFileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleUIButtonsUpload}
                  key="ui-buttons-upload"
                />
              </div>

              {/* Alternative generation methods */}
              <div className="flex w-full gap-2 mt-2">
                <Button
                  variant='uploadImage'
                  className='py-2 w-[50%] text-xs'
                  onClick={() => generateUIButtons()}
                  disabled={assetConfig.isGeneratingUIButtons}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Generate Button Sheet (Fallback)
                </Button>

                <Button
                  variant='uploadImage'
                  className='py-2 w-[50%] text-xs'
                  onClick={() => {
                    updateAssetConfig('uiElements', {});
                    updateAssetConfig('extractedUIButtons', {});
                    updateAssetConfig('uiButtonsPath', null);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear All Buttons
                </Button>
              </div>
            </div>

            {/* Layout guide */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Button Layout Guide
              </h4>
              <div className="flex items-center justify-center">
                <div className="flex bg-white border-2 border-gray-300 rounded-md overflow-hidden items-center gap-2 p-2">
                  <div className="w-14 h-14 border-2 border-blue-400 rounded-full flex items-center justify-center bg-blue-50">
                    <span className="text-xs font-bold text-blue-700">SPIN</span>
                  </div>
                  <div className="w-14 h-14 border-2 border-green-300 rounded-full flex items-center justify-center bg-green-50">
                    <span className="text-xs font-medium text-green-700">AUTO</span>
                  </div>
                  <div className="w-14 h-14 border-2 border-purple-300 rounded-full flex items-center justify-center bg-purple-50">
                    <span className="text-xs font-medium text-purple-700">MENU</span>
                  </div>
                  <div className="w-14 h-14 border-2 border-orange-300 rounded-full flex items-center justify-center bg-orange-50">
                    <span className="text-xs font-medium text-orange-700">SOUND</span>
                  </div>
                  <div className="w-14 h-14 border-2 border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                    <span className="text-[10px] font-medium text-gray-700">SETTINGS</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                AI will generate colorful themed buttons in a 2-row layout
              </p>
            </div>

            {/* UI elements preview */}
            {(assetConfig.uiButtonsPath || assetConfig.uiElements.spinButton) && (
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">UI Elements Preview</h4>

                {/* Interactive button preview */}
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { name: 'spinButton', label: 'Spin', size: 'w-20 h-20', icon: Play },
                      { name: 'autoplayButton', label: 'Autoplay', size: 'w-14 h-14', icon: RefreshCw },
                      { name: 'menuButton', label: 'Menu', size: 'w-14 h-14', icon: Menu },
                      { name: 'soundButton', label: 'Sound', size: 'w-14 h-14', icon: Volume2 },
                      { name: 'settingsButton', label: 'Settings', size: 'w-14 h-14', icon: Settings }
                    ].map(({ name, label, size, icon: Icon }) => {
                      const normalImage = (assetConfig.uiElements as any)[name];
                      const pressedImage = (assetConfig.uiElementsPressed as any)?.[name];

                      return (
                        <div key={name} className="flex flex-col items-center">
                          <div
                            className={`${size} relative cursor-pointer`}
                          >
                            {normalImage ? (
                              <img
                                src={normalImage}
                                alt={label}
                                className="w-full h-full object-contain"
                                style={{
                                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                <Icon className={name === 'spinButton' ? 'w-10 h-10' : 'w-6 h-6'} />
                              </div>
                            )}
                          </div>
                          <span className={`text-xs text-gray-600 mt-1 ${name === 'spinButton' ? 'font-bold' : ''}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* UI Bar Preview */}
                  {assetConfig.uiBar && (
                    <div className="mt-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">UI Bar</h5>
                      <div className="w-full h-16 rounded overflow-hidden">
                        <img
                          src={assetConfig.uiBar}
                          alt="UI Bar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Button State Management */}
                {assetConfig.uiElements.spinButton && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
                    <h4 className="text-sm font-semibold text-green-800 mb-4 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Button Controls
                    </h4>

                    {/* Button State Manager */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-3">Button States</h5>
                        <div className="space-y-3">
                          {['spinButton', 'autoplayButton', 'menuButton', 'soundButton', 'settingsButton'].map((buttonName) => (
                            <div key={buttonName} className="p-3 bg-white rounded border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-green-800 capitalize">
                                  {buttonName.replace('Button', '')}
                                </span>
                                <div className="flex gap-1">
                                  <span className={`w-2 h-2 rounded-full ${assetConfig.uiElements[buttonName] ? 'bg-green-500' : 'bg-gray-300'}`} title="Normal"></span>
                                  <span className={`w-2 h-2 rounded-full ${assetConfig.uiElementsPressed?.[buttonName] ? 'bg-blue-500' : 'bg-gray-300'}`} title="Pressed"></span>
                                  <span className="w-2 h-2 rounded-full bg-gray-300" title="Disabled"></span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-1 border rounded overflow-hidden">
                                    {assetConfig.uiElements[buttonName] ? (
                                      <img src={assetConfig.uiElements[buttonName]} alt="Normal" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100"></div>
                                    )}
                                  </div>
                                  <span className="text-green-600">Normal</span>
                                </div>

                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-1 border rounded overflow-hidden">
                                    {assetConfig.uiElementsPressed?.[buttonName] ? (
                                      <img src={assetConfig.uiElementsPressed[buttonName]} alt="Pressed" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100"></div>
                                    )}
                                  </div>
                                  <span className="text-blue-600">Pressed</span>
                                </div>

                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-1 border rounded overflow-hidden bg-gray-100">
                                    <div className="w-full h-full bg-gray-200 opacity-50"></div>
                                  </div>
                                  <span className="text-gray-500">Disabled</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-3">Button Layout & Positioning</h5>
                        <div className="p-3 bg-white rounded border border-green-200">
                          <div className="mb-4">
                            <label className="text-xs text-green-700 mb-2 block">Layout Style</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                className={`p-2 text-xs rounded border transition-colors ${assetConfig.buttonLayoutStyle === 'horizontal'
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                onClick={() => updateAssetConfig('buttonLayoutStyle', 'horizontal')}
                              >
                                Horizontal Bar
                              </button>
                              <button
                                className={`p-2 text-xs rounded border transition-colors ${assetConfig.buttonLayoutStyle === 'corner'
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                onClick={() => updateAssetConfig('buttonLayoutStyle', 'corner')}
                              >
                                Corner Placement
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-green-700 mb-1 block">Button Scale</label>
                              <input
                                type="range"
                                min="50"
                                max="150"
                                value={assetConfig.buttonScale || 100}
                                onChange={(e) => updateAssetConfig('buttonScale', parseInt(e.target.value))}
                                className="w-full accent-green-500"
                              />
                              <div className="flex justify-between text-xs text-green-600">
                                <span>50%</span>
                                <span>{assetConfig.buttonScale || 100}%</span>
                                <span>150%</span>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs text-green-700 mb-1 block">Button Spacing</label>
                              <input
                                type="range"
                                min="5"
                                max="50"
                                value={assetConfig.buttonSpacing || 20}
                                onChange={(e) => updateAssetConfig('buttonSpacing', parseInt(e.target.value))}
                                className="w-full accent-green-500"
                              />
                              <div className="flex justify-between text-xs text-green-600">
                                <span>Tight</span>
                                <span>{assetConfig.buttonSpacing || 20}px</span>
                                <span>Wide</span>
                              </div>
                            </div>

                            <button
                              className="w-full text-xs bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700 transition-colors"
                              onClick={() => regenerateButtonStates()}
                            >
                              Generate Missing States
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UI Button Positioning & Visibility Controls */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                        <Move className="w-4 h-4 mr-2" />
                        UI Button Adjustments
                      </h5>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Position Controls */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-medium text-blue-600">Position</h6>
                          <div>
                            <label className="text-xs text-blue-700 mb-1 block">Horizontal Offset</label>
                            <input
                              type="range"
                              min="-200"
                              max="200"
                              value={assetConfig.uiButtonsPosition.x}
                              onChange={(e) => updateAssetConfig('uiButtonsPosition', {
                                ...assetConfig.uiButtonsPosition,
                                x: parseInt(e.target.value)
                              })}
                              className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-blue-600">
                              <span>Left</span>
                              <span>{assetConfig.uiButtonsPosition.x}px</span>
                              <span>Right</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-blue-700 mb-1 block">Vertical Offset</label>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={assetConfig.uiButtonsPosition.y}
                              onChange={(e) => updateAssetConfig('uiButtonsPosition', {
                                ...assetConfig.uiButtonsPosition,
                                y: parseInt(e.target.value)
                              })}
                              className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-blue-600">
                              <span>Up</span>
                              <span>{assetConfig.uiButtonsPosition.y}px</span>
                              <span>Down</span>
                            </div>
                          </div>
                        </div>

                        {/* Scale Control */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-medium text-blue-600">Scale</h6>
                          <div>
                            <label className="text-xs text-blue-700 mb-1 block">Button Size</label>
                            <input
                              type="range"
                              min="50"
                              max="200"
                              value={assetConfig.uiButtonsScale}
                              onChange={(e) => updateAssetConfig('uiButtonsScale', parseInt(e.target.value))}
                              className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs text-blue-600">
                              <span>50%</span>
                              <span>{assetConfig.uiButtonsScale}%</span>
                              <span>200%</span>
                            </div>
                          </div>
                        </div>

                        {/* Visibility Control */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-medium text-blue-600">Visibility</h6>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={assetConfig.uiButtonsVisibility}
                                onChange={(e) => updateAssetConfig('uiButtonsVisibility', e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`relative w-10 h-6 rounded-full transition-colors ${assetConfig.uiButtonsVisibility ? 'bg-blue-500' : 'bg-gray-300'
                                }`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${assetConfig.uiButtonsVisibility ? 'translate-x-4' : 'translate-x-0'
                                  }`}></div>
                              </div>
                              <span className="ml-2 text-xs text-blue-700">
                                {assetConfig.uiButtonsVisibility ? 'Visible' : 'Hidden'}
                              </span>
                            </label>
                          </div>

                          <button
                            className="w-full text-xs bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              updateAssetConfig('uiButtonsPosition', { x: 0, y: 0 });
                              updateAssetConfig('uiButtonsScale', 100);
                              updateAssetConfig('uiButtonsVisibility', true);
                            }}
                          >
                            Reset to Default
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title Assets section for step-7 */}
        {/* <div className="bg-white rounded-lg shadow-md overflow-hidden"> */}
        {/* <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
            <h3 className="text-lg font-semibold text-purple-800 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              Title Assets (Feature Titles)
            </h3>
            <p className="text-sm text-purple-600 mt-1">Generate title graphics for freespins, bonus games, and special features</p>
          </div> */}

        {/* <div className="p-6"> */}
        {/* <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2">
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="Describe the style for your title graphics (e.g., 'Golden metallic text with glowing edges and sparkle effects')"
                  value={assetConfig.titleAssetsPrompt}
                  onChange={(e) => updateAssetConfig('titleAssetsPrompt', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will generate professional slot machine title graphics with casino-style typography
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Style Preset</label>
                  <select
                    value={assetConfig.titleAssetsStyle}
                    onChange={(e) => updateAssetConfig('titleAssetsStyle', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="Golden Elegant">Golden Elegant</option>
                    <option value="Neon Glow">Neon Glow</option>
                    <option value="Metallic Chrome">Metallic Chrome</option>
                    <option value="Fire & Lightning">Fire & Lightning</option>
                    <option value="Crystal Diamond">Crystal Diamond</option>
                    <option value="Ancient Stone">Ancient Stone</option>
                  </select>
                </div>
              </div>
            </div> */}

        {/* Title Types Grid */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'freeSpins', label: 'FREE SPINS', icon: '🎰', color: 'from-amber-400 to-orange-500' },
                { key: 'bonusGame', label: 'BONUS GAME', icon: '🎮', color: 'from-blue-400 to-purple-500' },
                { key: 'pickAndClick', label: 'PICK & CLICK', icon: '👆', color: 'from-green-400 to-blue-500' },
                { key: 'bigWin', label: 'BIG WIN', icon: '💰', color: 'from-yellow-400 to-red-500' },
                { key: 'megaWin', label: 'MEGA WIN', icon: '💎', color: 'from-purple-400 to-pink-500' },
                { key: 'jackpot', label: 'JACKPOT', icon: '👑', color: 'from-yellow-300 to-yellow-600' },
                { key: 'gameOver', label: 'GAME OVER', icon: '🏁', color: 'from-gray-400 to-gray-600' },
                { key: 'congratulations', label: 'CONGRATULATIONS', icon: '🎉', color: 'from-green-400 to-teal-500' }
              ].map(({ key, label, icon, color }) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-center mb-3">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${color} text-white text-lg mb-2`}>
                      {icon}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-800">{label}</h4>
                  </div>
                  
                  {assetConfig.titleAssets[key] ? (
                    <div className="mb-2">
                      <div className="aspect-video bg-gray-200 rounded overflow-hidden border">
                        <img
                          src={assetConfig.titleAssets[key]}
                          alt={label}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">Not Generated</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    className={`w-full text-xs py-2 px-3 rounded transition-colors ${
                      assetConfig.isGeneratingTitleAssets && assetConfig.currentTitleType === key
                        ? 'bg-purple-400 text-white cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                    onClick={() => generateTitleAssets(key)}
                    disabled={assetConfig.isGeneratingTitleAssets}
                  >
                    {assetConfig.isGeneratingTitleAssets && assetConfig.currentTitleType === key ? (
                      <>
                        <Loader className="w-3 h-3 animate-spin inline mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div> */}

        {/* Usage Instructions */}
        {/* <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                How to Use Title Assets
              </h4>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Generated titles will be used in the Animation Studio for freespin transitions</li>
                <li>• Each title is optimized for overlay display during game features</li>
                <li>• Titles automatically match your game's theme and color scheme</li>
                <li>• Generate only the titles you need for your specific game features</li>
              </ul>
            </div> */}
        {/* </div> */}
        {/* </div> */}

        {/* Logo section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              Game Logo (Brand Identity)
            </h3>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="col-span-2">
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none"
                  placeholder="Describe your game logo (e.g., 'Ancient Egyptian pharaoh crown with golden hieroglyphs')"
                  value={assetConfig.logoPrompt}
                  onChange={(e) => updateAssetConfig('logoPrompt', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI will generate a professional game logo that matches your theme
                </p>
              </div>

              <div className="flex w-full gap-2">
                <Button
                  variant='generate'
                  className='py-2 w-[50%]'
                  onClick={generateLogo}
                  disabled={assetConfig.isGeneratingLogo}
                >
                  {assetConfig.isGeneratingLogo ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </Button>

                <Button
                  variant='uploadImage'
                  className='py-2 w-[50%]'
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Upload Logo
                </Button>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleLogoUpload}
                  key="logo-upload"
                />
              </div>
            </div>

            {/* Logo Positioning Controls */}
            {assetConfig.logoPath && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                  <Move className="w-4 h-4 mr-2" />
                  Interactive Logo Positioning
                </h4>

                <div className="bg-blue-100 p-3 rounded-md mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-blue-800 font-medium">🎯 Position your logo in the preview!</p>
                    <div className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                      {assetConfig.currentDevice === 'desktop' && '🖥️ Desktop'}
                      {assetConfig.currentDevice === 'mobilePortrait' && '📱 Mobile Portrait'}
                      {assetConfig.currentDevice === 'mobileLandscape' && '📱 Mobile Landscape'}
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">
                    Look at the slot game preview on the right → The logo should now be draggable!<br />
                    • <strong>Device-specific positioning</strong> - each orientation saves separately<br />
                    • <strong>Blue grid lines</strong> will appear to help with alignment<br />
                    • <strong>Drag the logo</strong> to position it exactly where you want<br />
                    • <strong>Resize your window</strong> to test different orientations
                  </p>
                </div>

                {/* Manual controls as backup */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 flex items-center mb-1">
                      <ZoomIn className="w-3 h-3 mr-1" />
                      Size: {assetConfig.logoScales[assetConfig.currentDevice]}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={assetConfig.logoScales[assetConfig.currentDevice]}
                      onChange={(e) => {
                        const newScales = {
                          ...assetConfig.logoScales,
                          [assetConfig.currentDevice]: parseInt(e.target.value)
                        };
                        updateAssetConfig('logoScales', newScales);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 flex items-center mb-1">
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      X: {assetConfig.logoPositions[assetConfig.currentDevice].x}px
                    </label>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={assetConfig.logoPositions[assetConfig.currentDevice].x}
                      onChange={(e) => {
                        const newPositions = {
                          ...assetConfig.logoPositions,
                          [assetConfig.currentDevice]: {
                            ...assetConfig.logoPositions[assetConfig.currentDevice],
                            x: parseInt(e.target.value)
                          }
                        };
                        updateAssetConfig('logoPositions', newPositions);
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 flex items-center mb-1">
                      <ArrowUpDown className="w-3 h-3 mr-1" />
                      Y: {assetConfig.logoPositions[assetConfig.currentDevice].y}px
                    </label>
                    <input
                      type="range"
                      min="-250"
                      max="250"
                      value={assetConfig.logoPositions[assetConfig.currentDevice].y}
                      onChange={(e) => {
                        const newPositions = {
                          ...assetConfig.logoPositions,
                          [assetConfig.currentDevice]: {
                            ...assetConfig.logoPositions[assetConfig.currentDevice],
                            y: parseInt(e.target.value)
                          }
                        };
                        updateAssetConfig('logoPositions', newPositions);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {assetConfig.currentDevice}: x:{assetConfig.logoPositions[assetConfig.currentDevice].x}, y:{assetConfig.logoPositions[assetConfig.currentDevice].y}
                  </span>
                  <button
                    onClick={() => {
                      const defaultPos = getDefaultLogoPosition(assetConfig.currentDevice);
                      const newPositions = {
                        ...assetConfig.logoPositions,
                        [assetConfig.currentDevice]: defaultPos
                      };
                      updateAssetConfig('logoPositions', newPositions);
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset {assetConfig.currentDevice}
                  </button>
                </div>
              </div>
            )}

            {/* Preview current logo */}
            {assetConfig.logoPath && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Logo</h4>
                <div className="bg-gray-200 rounded-md overflow-hidden h-32 flex items-center justify-center">
                  <img
                    src={assetConfig.logoPath}
                    alt="Game Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Logo usage guide */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gay-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Logo Usage Guide
              </h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p>• Logo will appear at the top center of your game interface</p>
                <p>• Recommended size: 200-400px width for optimal readability</p>
                <p>• Use transparent background logos for best integration</p>
                <p>• Consider brand consistency across all game assets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the advanced tab
  const renderAdvancedTab = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
          <h3 className="font-semibold text-gray-900">
            Grid & Symbol Positioning
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Symbol Square Grid Toggle */}
          <div className="flex items-center border justify-between p-4 bg-gray-50 rounded-md">
            <div>
              <h4 className="font-medium text-gray-800 flex items-center">
                <Grid3X3 className="w-4 h-4 mr-2" />
                Symbol Square Grid
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Show or hide the square backgrounds behind each symbol
              </p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${assetConfig.showSymbolGrid ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              onClick={() => updateAssetConfig('showSymbolGrid', !assetConfig.showSymbolGrid)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${assetConfig.showSymbolGrid ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
              <span className="sr-only">Toggle symbol grid</span>
            </button>
          </div>

          {/* Grid Position Controls */}
          <div className="space-y-4 border p-2 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Move className="w-4 h-4 mr-2" />
              Grid Position
            </h4>
            <p className="text-sm text-gray-600">
              Adjust the position of the entire symbol grid.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Horizontal Position */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600 flex items-center">
                    <ArrowLeftRight className="w-3 h-3 mr-1" />
                    Horizontal Offset
                  </label>
                  <span className="text-sm text-gray-600">{assetConfig.gridPosition.x}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={assetConfig.gridPosition.x}
                  onChange={(e) => updateAssetConfig('gridPosition', { ...assetConfig.gridPosition, x: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Move grid left (negative) or right (positive)
                </p>
              </div>

              {/* Vertical Position */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600 flex items-center">
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    Vertical Offset
                  </label>
                  <span className="text-sm text-gray-600">{assetConfig.gridPosition.y}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={assetConfig.gridPosition.y}
                  onChange={(e) => updateAssetConfig('gridPosition', { ...assetConfig.gridPosition, y: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Move grid up (negative) or down (positive)
                </p>
              </div>
            </div>
          </div>

          {/* Grid Scale Control */}
          <div className="space-y-4 border p-2 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800 flex items-center">
              <ZoomIn className="w-4 h-4 mr-2" />
              Grid Scale
            </h4>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600">Overall Grid Size</label>
                <span className="text-sm text-gray-600">{assetConfig.gridScale}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={assetConfig.gridScale}
                onChange={(e) => updateAssetConfig('gridScale', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Scale the entire grid up or down while maintaining position
              </p>
            </div>
          </div>

          {/* Grid Stretch Control */}
          <div className="space-y-4 border p-2 rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Maximize className="w-4 h-4 mr-2" />
              Grid Stretch
            </h4>
            <div className='flex justify-center gap-4'>

              {/* Horizontal stretch */}
              <div className='w-full'>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600">Horizontal Stretch</label>
                  <span className="text-sm text-gray-600">{assetConfig.gridStretch.x}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={assetConfig.gridStretch.x}
                  onChange={(e) => updateAssetConfig('gridStretch', { ...assetConfig.gridStretch, x: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Vertical stretch */}
              <div className='w-full'>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600">Vertical Stretch</label>
                  <span className="text-sm text-gray-600">{assetConfig.gridStretch.y}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={assetConfig.gridStretch.y}
                  onChange={(e) => updateAssetConfig('gridStretch', { ...assetConfig.gridStretch, y: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Stretch the grid independently in horizontal or vertical direction
            </p>
          </div>



          {/* Example use case */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Example Use Case</h5>
                <p className="text-sm text-gray-700">
                  If you want to add a meter on the left side of your slot game, you can:
                  <br />• Move the grid right by setting Horizontal Offset to +100px
                  <br />• Scale down the grid to 85% to make room
                  <br />• Hide the symbol grid backgrounds for a cleaner look
                </p>
              </div>
            </div>
          </div>
          {/* Reset button */}
          <div className="flex justify-end">
            <Button
              variant='uploadImage'
              className='py-1 px-2'
              onClick={() => {
                updateAssetConfig('showSymbolGrid', true);
                updateAssetConfig('gridPosition', { x: 0, y: 0 });
                updateAssetConfig('gridScale', 100);
                updateAssetConfig('gridStretch', { x: 100, y: 100 });
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="step-container p-4 sm:p-6 lg:p-0">
      <div className="max-w-7xl mx-auto">
        {/* <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Game Assets</h1>
        </div> */}

        {/* Tab selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 gap-2 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-md transition-colors ${activeTab === 'preset'
                ? 'text-white bg-blue-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setActiveTab('preset')}
            >
              <Wand2 className="w-4 h-4 inline mr-1" />
              Preset
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-md transition-colors ${activeTab === 'advanced'
                ? 'text-white bg-blue-500 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
              onClick={() => setActiveTab('advanced')}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Advanced
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="w-full">
          {/* Asset controls */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'preset' ? renderPresetTab() : renderAdvancedTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6_GameAssets;