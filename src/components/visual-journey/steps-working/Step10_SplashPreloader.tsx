import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Settings, Monitor, Smartphone,
  Zap, Volume2, VolumeX, Eye, Download, Upload,
  Loader, CheckCircle, AlertCircle, Timer, Sparkles, ChevronRight, ChevronLeft, PlayCircle
} from 'lucide-react';
import GridPreviewWrapper from '../grid-preview/GridPreviewWrapper';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { saveImage } from '../../../utils/imageSaver';
import { useGameStore } from '../../../store';
import { CONFIG_DEFAULTS } from '../../../utils/configDefaults';
import { useJourneyTransfer, useLoadingJourneyStore } from '../shared/LoadingJourneyStore';
import ProfessionalLoadingPreview from '../shared/ProfessionalLoadingPreview';
import { Button } from '../../Button';

interface LoadingPhase {
  id: string;
  name: string;
  description: string;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  duration: number;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or image URL
  image: string | null; // Optional feature image
  position: { x: number; y: number };
  size: { width: number; height: number };
  backgroundColor: string;
  textColor: string;
}

interface SplashConfig {
  // Logo & Branding - Separated Studio vs Game Logos
  studioLogo: string | null;
  studioLogoSize: number;
  studioLogoPrompt: string;
  studioLogoGenerating: boolean;
  studioLogoPosition: { x: number; y: number };

  gameLogo: string | null;
  gameLogoSize: number;
  gameLogoPrompt: string;
  gameLogoGenerating: boolean;
  gameLogoPosition: { x: number; y: number };
  gameLogoAnimation: 'fade' | 'scale' | 'bounce' | 'spin';

  // Interactive positioning
  interactiveMode: boolean;

  // Loading Screen Configuration
  showProgress: boolean;
  progressStyle: 'bar' | 'circular' | 'dots' | 'symbols';
  backgroundType: 'gradient' | 'particles' | 'image' | 'solid';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  loadingTips: string[];
  audioEnabled: boolean;
  audioUrl: string;
  minimumDisplayTime: number;
  deviceOptimization: 'auto' | 'mobile' | 'desktop';

  // Loading sprite configuration
  loadingSprite: string | null;
  spriteGenerating: boolean;
  spritePrompt: string;
  spriteAnimation: 'roll' | 'spin' | 'bounce' | 'pulse' | 'slide';
  spriteSize: number; // 20-100px
  spritePosition: 'in-bar' | 'above-bar' | 'below-bar' | 'left-side' | 'right-side';
  hideProgressFill: boolean; // Hide the progress bar fill when sprite is doing the progress indication

  // Splash Screen (Game Explanation) Configuration
  splashEnabled: boolean;
  gameTitle: string;
  gameSubtitle: string;
  featureHighlights: FeatureCard[];
  splashDuration: number; // How long to show splash before loading
  splashBackground: string;
  splashBackgroundImage: string | null;
  splashBackgroundImageGenerating: boolean;
  splashBackgroundImagePrompt: string;
  splashTextColor: string;
  splashLayoutType: 'grid' | 'carousel';

  // Continue Button Configuration
  continueButton: string | null;
  continueButtonGenerating: boolean;
  continueButtonPrompt: string;
  continueButtonSize: number;
  continueButtonPosition: { x: number; y: number };
  continueButtonScale: number;
}

interface AssetCategory {
  name: string;
  files: string[];
  loaded: number;
  total: number;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

const Step10_SplashPreloader: React.FC = () => {
  const { config } = useGameStore();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(true); // Start with completed state to show slot preview
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSplash, setShowSplash] = useState(false); // Controls splash vs loading screen
  const [showGameExplanation, setShowGameExplanation] = useState(false); // Controls game explanation screen after loading
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0); // For carousel navigation
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Journey Transfer Integration
  const journeyTransfer = useJourneyTransfer();
  const journeyStore = useLoadingJourneyStore();
  const [showFullJourney, setShowFullJourney] = useState(false);
  const [journeyPhase, setJourneyPhase] = useState<'loading' | 'splash' | 'game'>('loading');

  // Accordion state management (like Step 7)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    logo: true,
    sprite: false,
    loading: false,
    splash: false,
    splashBackground: false,
    splashButton: false,
    splashLayout: false,
    testing: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [splashConfig, setSplashConfig] = useState<SplashConfig>(() => {
    // Initialize with defaults from CONFIG_DEFAULTS and fallback to hardcoded values
    const defaultSplash = CONFIG_DEFAULTS.splashScreen || {};

    // Ensure featureHighlights have proper position and size values
    const safeFeatureHighlights = (defaultSplash.featureHighlights || []).map((feature, index) => ({
      ...feature,
      position: feature.position || { x: 25 + (index % 2) * 50, y: 25 + Math.floor(index / 2) * 50 },
      size: feature.size || { width: 200, height: 120 },
      backgroundColor: feature.backgroundColor || 'rgba(255, 255, 255, 0.1)',
      textColor: feature.textColor || '#ffffff'
    }));

    return {
      // Logo & Branding - Separated Studio vs Game Logos
      studioLogo: null,
      studioLogoSize: 80,
      studioLogoPrompt: 'Professional gaming studio logo, modern design, elegant typography, premium casino aesthetic',
      studioLogoGenerating: false,
      studioLogoPosition: { x: 50, y: 85 }, // Top center percentage

      gameLogo: null,
      gameLogoSize: 120,
      gameLogoPrompt: 'Epic fantasy game logo with ornate design, mystical elements, premium slot game branding',
      gameLogoGenerating: false,
      gameLogoPosition: { x: 50, y: 40 }, // Center percentage
      gameLogoAnimation: 'scale',

      interactiveMode: false,

      // Loading Screen Configuration
      showProgress: true,
      progressStyle: 'bar',
      backgroundType: 'gradient',
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      accentColor: '#ffd700',
      loadingTips: [
        'Look for scatter symbols to trigger bonus rounds!',
        'Wild symbols substitute for all symbols except scatters',
        'Higher bets unlock bigger win potential',
        'Free spins can be retriggered during bonus rounds'
      ],
      audioEnabled: true,
      audioUrl: '/sounds/loading-ambient.mp3',
      minimumDisplayTime: 3000,
      deviceOptimization: 'auto',

      // Loading sprite defaults
      loadingSprite: null,
      spriteGenerating: false,
      spritePrompt: 'Golden nugget with metallic texture, 3D rendered, casino style, shiny gold finish',
      spriteAnimation: 'roll',
      spriteSize: 40,
      spritePosition: 'in-bar',
      hideProgressFill: true,

      // Splash Screen (Game Explanation) Configuration - Use defaults with safe fallbacks
      splashEnabled: defaultSplash.enabled ?? true,
      gameTitle: defaultSplash.gameTitle || 'Epic Slots Adventure',
      gameSubtitle: defaultSplash.gameSubtitle || 'The Ultimate Gaming Experience',
      featureHighlights: safeFeatureHighlights as FeatureCard[],
      splashDuration: defaultSplash.splashDuration || 3000,
      splashBackground: defaultSplash.splashBackground || '#2D1B69',
      splashBackgroundImage: null,
      splashBackgroundImageGenerating: false,
      splashBackgroundImagePrompt: 'Epic fantasy game background, mystical atmosphere, dark purple gradient, magical particles, premium slot game style',
      splashTextColor: defaultSplash.splashTextColor || '#ffffff',
      splashLayoutType: 'grid' as const,

      // Continue Button Configuration
      continueButton: null,
      continueButtonGenerating: false,
      continueButtonPrompt: 'Premium casino continue button, 600x200 pixels, golden ornate frame with glowing edges, elegant "CONTINUE" text in bold serif font, luxury game aesthetic, high resolution, transparent PNG background',
      continueButtonSize: 200,
      continueButtonPosition: { x: 50, y: 85 },
      continueButtonScale: 1.0
    };
  });

  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([
    {
      name: 'Core Symbols',
      files: ['wild.png', 'scatter.png', 'high_1.png', 'high_2.png', 'high_3.png'],
      loaded: 0,
      total: 5,
      status: 'pending'
    },
    {
      name: 'Audio Assets',
      files: ['ambient.mp3', 'spin.mp3', 'win.mp3', 'bonus.mp3'],
      loaded: 0,
      total: 4,
      status: 'pending'
    },
    {
      name: 'UI Elements',
      files: ['buttons.png', 'frame.png', 'background.jpg', 'particles.png'],
      loaded: 0,
      total: 4,
      status: 'pending'
    },
    {
      name: 'Animations',
      files: ['win_glow.json', 'symbol_pulse.json', 'reel_spin.json'],
      loaded: 0,
      total: 3,
      status: 'pending'
    }
  ]);

  const loadingPhases: LoadingPhase[] = [
    {
      id: 'symbols',
      name: 'Loading Symbols',
      description: 'Preparing game symbols and graphics...',
      percentage: 0,
      color: '#4f46e5',
      icon: <div className="w-4 h-4 bg-yellow-400 rounded-sm" />,
      duration: 4000 // 4 seconds for demo
    },
    {
      id: 'audio',
      name: 'Loading Audio',
      description: 'Setting up sounds and music...',
      percentage: 0,
      color: '#10b981',
      icon: <Volume2 className="w-4 h-4" />,
      duration: 3500 // 3.5 seconds for demo
    },
    {
      id: 'ui',
      name: 'Preparing Interface',
      description: 'Configuring user interface...',
      percentage: 0,
      color: '#f59e0b',
      icon: <Monitor className="w-4 h-4" />,
      duration: 3000 // 3 seconds for demo
    },
    {
      id: 'engine',
      name: 'Starting Game Engine',
      description: 'Initializing game mechanics...',
      percentage: 0,
      color: '#ef4444',
      icon: <Zap className="w-4 h-4" />,
      duration: 2500 // 2.5 seconds for demo
    }
  ];

  const startLoadingSequence = useCallback(() => {
    setIsLoading(true);
    setLoadingComplete(false);
    setLoadingProgress(0);
    setCurrentPhase(0);

    // Reset asset categories
    setAssetCategories(cats => cats.map(cat => ({
      ...cat,
      loaded: 0,
      status: 'pending' as const
    })));

    let currentProgress = 0;
    let phaseIndex = 0;
    let startTime = Date.now();

    const simulateLoading = () => {
      const elapsed = Date.now() - startTime;
      const phaseDuration = loadingPhases[phaseIndex]?.duration || 1500; // Longer phases for smoother animation

      if (phaseIndex >= loadingPhases.length) {
        setIsLoading(false);
        // Check if splash screen is enabled
        if (splashConfig.splashEnabled) {
          // Show game explanation screen after loading
          setTimeout(() => {
            setShowGameExplanation(true);
          }, 500);
        } else {
          // Skip splash and go directly to game
          setLoadingComplete(true);
        }
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
        }
        return;
      }

      // Smooth progressive loading with easing
      const phaseProgress = Math.min(elapsed / phaseDuration, 1);

      // Smoother easing function (ease-in-out)
      const easedProgress = phaseProgress < 0.5
        ? 2 * phaseProgress * phaseProgress
        : 1 - Math.pow(-2 * phaseProgress + 2, 3) / 2;

      const targetProgress = (phaseIndex + easedProgress) * (100 / loadingPhases.length);

      // Smoother interpolation to target progress
      currentProgress += (targetProgress - currentProgress) * 0.15;

      setLoadingProgress(currentProgress);

      // Update asset categories with smooth progression
      setAssetCategories(cats => {
        const updatedCats = [...cats];
        const categoryIndex = phaseIndex;

        if (updatedCats[categoryIndex]) {
          const category = updatedCats[categoryIndex];
          const targetLoaded = Math.floor(easedProgress * category.total);

          updatedCats[categoryIndex] = {
            ...category,
            loaded: Math.min(targetLoaded, category.total),
            status: easedProgress >= 0.99 ? 'complete' : easedProgress > 0 ? 'loading' : 'pending'
          };
        }

        return updatedCats;
      });

      // Move to next phase when current phase is complete
      if (phaseProgress >= 1) {
        phaseIndex++;
        setCurrentPhase(phaseIndex);
        startTime = Date.now(); // Reset timer for next phase
      }
    };

    loadingIntervalRef.current = setInterval(simulateLoading, 33); // Smooth 30fps updates
  }, []);

  const resetLoadingSequence = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    setIsLoading(false);
    setLoadingComplete(true);
    setShowGameExplanation(false);
    setLoadingProgress(0);
    setCurrentPhase(0);

    setAssetCategories(cats => cats.map(cat => ({
      ...cat,
      loaded: 0,
      status: 'pending' as const
    })));
  }, []);

  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  // Studio Logo upload/generation functions
  const handleStudioLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSplashConfig({ studioLogo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStudioLogo = async () => {
    updateSplashConfig({ studioLogoGenerating: true });

    try {
      console.log('Generating studio logo with custom prompt:', splashConfig.studioLogoPrompt);

      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: splashConfig.studioLogoPrompt,
        targetSymbolId: `studio_logo_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Studio Logo Generation] Generated image URL: ${imageUrl}`);

        try {
          const savedImage = await saveImage(imageUrl, 'studio_logo', `studio_logo_${Date.now()}`, config?.gameId);
          console.log('[Studio Logo Generation] Saved logo:', savedImage);
        } catch (saveError) {
          console.warn('[Studio Logo Generation] Failed to save logo to server:', saveError);
        }

        updateSplashConfig({
          studioLogo: imageUrl,
          studioLogoGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Studio logo generation failed:', error);
      alert('Failed to generate studio logo. Please check your internet connection and try again.');
      updateSplashConfig({ studioLogoGenerating: false });
    }
  };

  // Game Logo upload/generation functions
  const handleGameLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSplashConfig({ gameLogo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateGameLogo = async () => {
    updateSplashConfig({ gameLogoGenerating: true });

    try {
      console.log('Generating game logo with custom prompt:', splashConfig.gameLogoPrompt);

      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: splashConfig.gameLogoPrompt,
        targetSymbolId: `game_logo_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Game Logo Generation] Generated image URL: ${imageUrl}`);

        try {
          const savedImage = await saveImage(imageUrl, 'game_logo', `game_logo_${Date.now()}`, config?.gameId);
          console.log('[Game Logo Generation] Saved logo:', savedImage);
        } catch (saveError) {
          console.warn('[Game Logo Generation] Failed to save logo to server:', saveError);
        }

        updateSplashConfig({
          gameLogo: imageUrl,
          gameLogoGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Game logo generation failed:', error);
      alert('Failed to generate game logo. Please check your internet connection and try again.');
      updateSplashConfig({ gameLogoGenerating: false });
    }
  };

  // Splash Background upload/generation functions
  const handleSplashBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSplashConfig({ splashBackgroundImage: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSplashBackground = async () => {
    updateSplashConfig({ splashBackgroundImageGenerating: true });

    try {
      console.log('Generating splash background with custom prompt:', splashConfig.splashBackgroundImagePrompt);

      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: splashConfig.splashBackgroundImagePrompt,
        targetSymbolId: `splash_bg_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Splash Background Generation] Generated image URL: ${imageUrl}`);

        try {
          const savedImage = await saveImage(imageUrl, 'splash_background', `splash_bg_${Date.now()}`, config?.gameId);
          console.log('[Splash Background Generation] Saved background:', savedImage);
        } catch (saveError) {
          console.warn('[Splash Background Generation] Failed to save background to server:', saveError);
        }

        updateSplashConfig({
          splashBackgroundImage: imageUrl,
          splashBackgroundImageGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Splash background generation failed:', error);
      alert('Failed to generate splash background. Please check your internet connection and try again.');
      updateSplashConfig({ splashBackgroundImageGenerating: false });
    }
  };

  // Continue Button upload/generation functions
  const handleContinueButtonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('[Step8] Continue button file selected:', file.name, file.size);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('[Step8] Continue button upload result:', result ? 'SUCCESS - Data URL created' : 'FAILED - No data URL');
        console.log('[Step8] Data URL length:', result?.length || 0);
        updateSplashConfig({ continueButton: result });
        console.log('[Step8] Splash config updated with continue button');
      };
      reader.onerror = (error) => {
        console.error('[Step8] FileReader error:', error);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('[Step8] No file selected for continue button upload');
    }
  };

  const generateContinueButton = async () => {
    updateSplashConfig({ continueButtonGenerating: true });

    try {
      console.log('Generating continue button with custom prompt:', splashConfig.continueButtonPrompt);

      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: splashConfig.continueButtonPrompt,
        targetSymbolId: `continue_btn_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Continue Button Generation] Generated image URL: ${imageUrl}`);

        try {
          const savedImage = await saveImage(imageUrl, 'continue_button', `continue_btn_${Date.now()}`, config?.gameId);
          console.log('[Continue Button Generation] Saved button:', savedImage);
        } catch (saveError) {
          console.warn('[Continue Button Generation] Failed to save button to server:', saveError);
        }

        updateSplashConfig({
          continueButton: imageUrl,
          continueButtonGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Continue button generation failed:', error);
      alert('Failed to generate continue button. Please check your internet connection and try again.');
      updateSplashConfig({ continueButtonGenerating: false });
    }
  };

  // Sprite upload/generation functions
  const handleSpriteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSplashConfig({ loadingSprite: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSprite = async () => {
    updateSplashConfig({ spriteGenerating: true });

    try {
      console.log('Generating sprite with custom prompt:', splashConfig.spritePrompt);

      // Use the same pattern as Step 4 symbol generation
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: splashConfig.spritePrompt,
        targetSymbolId: `sprite_${Date.now()}`, // Unique ID for sprite
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];
        console.log(`[Sprite Generation] Generated image URL: ${imageUrl}`);

        // Save the sprite image
        try {
          const savedImage = await saveImage(imageUrl, 'loading_sprite', `sprite_${Date.now()}`, config?.gameId);
          console.log('[Sprite Generation] Saved sprite:', savedImage);
        } catch (saveError) {
          console.warn('[Sprite Generation] Failed to save sprite to server:', saveError);
        }

        updateSplashConfig({
          loadingSprite: imageUrl,
          spriteGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Sprite generation failed:', error);

      // Show user-friendly error message
      alert('Failed to generate loading sprite. Please check your internet connection and try again.');

      updateSplashConfig({ spriteGenerating: false });
    }
  };

  // Enhanced Interactive Logo Component with full canvas movement and scaling
  const InteractiveLogo = ({
    logoSrc,
    size,
    position,
    onPositionChange,
    onSizeChange,
    isInteractive = false,
    className = "",
    animation = 'scale'
  }: {
    logoSrc: string;
    size: number;
    position: { x: number; y: number };
    onPositionChange?: (position: { x: number; y: number }) => void;
    onSizeChange?: (size: number) => void;
    isInteractive?: boolean;
    className?: string;
    animation?: 'fade' | 'scale' | 'bounce' | 'spin';
  }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isResizing, setIsResizing] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = React.useState({ size: 0, mouseX: 0, mouseY: 0 });
    const logoRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Animation variants based on the animation type
    const getAnimationVariants = () => {
      switch (animation) {
        case 'fade':
          return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 1.5, delay: 0.5 }
          };
        case 'scale':
          return {
            initial: { opacity: 0, scale: 0.5 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 1.5, delay: 0.5, type: "spring" as const, stiffness: 100 }
          };
        case 'bounce':
          return {
            initial: { opacity: 0, y: -50 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 1.5, delay: 0.5, type: "spring" as const, stiffness: 200, damping: 10 }
          };
        case 'spin':
          return {
            initial: { opacity: 0, rotate: -180 },
            animate: { opacity: 1, rotate: 0 },
            transition: { duration: 1.5, delay: 0.5, type: "spring" as const, stiffness: 100 }
          };
        default:
          return {
            initial: { opacity: 0, scale: 0.5 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 1.5, delay: 0.5, type: "spring" as const, stiffness: 100 }
          };
      }
    };

    // Handle logo drag (move)
    const handleLogoMouseDown = (e: React.MouseEvent) => {
      if (!isInteractive || !onPositionChange) return;

      // Stop propagation to prevent conflicts with other components
      e.stopPropagation();
      e.preventDefault();

      console.log('[InteractiveLogo] Mouse down - starting drag');

      const container = containerRef.current;
      if (!container) {
        console.warn('[InteractiveLogo] No container found');
        return;
      }

      const rect = container.getBoundingClientRect();
      const currentX = (localPosition.x * rect.width) / 100;
      const currentY = (localPosition.y * rect.height) / 100;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - currentX,
        y: e.clientY - rect.top - currentY
      });

      // Add dragging class to body to prevent text selection
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    };

    // Handle corner resize
    const handleCornerMouseDown = (e: React.MouseEvent) => {
      if (!isInteractive || !onSizeChange) return;

      e.stopPropagation();
      e.preventDefault();

      console.log('[InteractiveLogo] Corner mouse down - starting resize');

      setIsResizing(true);
      setResizeStart({
        size: localSize,
        mouseX: e.clientX,
        mouseY: e.clientY
      });

      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    };

    // Local state for smooth dragging and resizing without triggering re-renders
    const [localPosition, setLocalPosition] = React.useState(position);
    const [localSize, setLocalSize] = React.useState(size);

    // Update local position immediately for full canvas movement
    const updatePosition = React.useCallback((clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      // Remove constraints - allow movement across entire canvas
      const newX = ((clientX - rect.left - dragStart.x) / rect.width) * 100;
      const newY = ((clientY - rect.top - dragStart.y) / rect.height) * 100;

      // Allow movement beyond container bounds
      setLocalPosition({ x: newX, y: newY });
    }, [dragStart]);

    // Update local size for smooth resizing
    const updateSize = React.useCallback((clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      const deltaX = clientX - resizeStart.mouseX;
      const deltaY = clientY - resizeStart.mouseY;
      const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const direction = deltaX + deltaY > 0 ? 1 : -1;

      // Calculate new size with minimum and maximum bounds
      const newSize = Math.max(20, Math.min(400, resizeStart.size + (delta * direction * 0.5)));
      setLocalSize(newSize);
    }, [resizeStart]);

    // Debounced update to actual config to prevent constant re-renders
    const debouncedUpdateConfig = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (isDragging || isResizing) return; // Don't update config while interacting

      // Clear any pending debounced update
      if (debouncedUpdateConfig.current) {
        clearTimeout(debouncedUpdateConfig.current);
      }

      // Update position if changed
      if (onPositionChange && (localPosition.x !== position.x || localPosition.y !== position.y)) {
        console.log('[InteractiveLogo] Final position update:', localPosition);
        console.log('[InteractiveLogo] Previous position:', position);
        onPositionChange(localPosition);
      }

      // Update size if changed
      if (onSizeChange && localSize !== size) {
        console.log('[InteractiveLogo] Final size update:', localSize);
        console.log('[InteractiveLogo] Previous size:', size);
        onSizeChange(localSize);
      }

      return () => {
        if (debouncedUpdateConfig.current) {
          clearTimeout(debouncedUpdateConfig.current);
        }
      };
    }, [isDragging, isResizing]);

    // Sync local state with prop changes
    React.useEffect(() => {
      if (!isDragging && !isResizing) {
        setLocalPosition(position);
        setLocalSize(size);
      }
    }, [position, size, isDragging, isResizing]);

    React.useEffect(() => {
      if (!isDragging && !isResizing) return;

      const handleGlobalMouseMove = (e: MouseEvent) => {
        e.preventDefault();

        if (isDragging) {
          updatePosition(e.clientX, e.clientY);
        } else if (isResizing) {
          updateSize(e.clientX, e.clientY);
        }
      };

      const handleGlobalMouseUp = (e: MouseEvent) => {
        e.preventDefault();

        if (isDragging) {
          console.log('[InteractiveLogo] Mouse up - ending drag');
          console.log('[InteractiveLogo] Final local position:', localPosition);

          // Set dragging to false with a small delay to ensure position update happens
          setTimeout(() => {
            setIsDragging(false);
          }, 10);
        } else if (isResizing) {
          console.log('[InteractiveLogo] Mouse up - ending resize');
          console.log('[InteractiveLogo] Final local size:', localSize);

          // Set resizing to false with a small delay
          setTimeout(() => {
            setIsResizing(false);
          }, 10);
        }

        // Restore text selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      };

      // Use capture phase to ensure we get events even if other components try to stop them
      document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });

        // Cleanup styles
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      };
    }, [isDragging, isResizing, updatePosition, updateSize, localPosition, localSize]);

    return (
      <div ref={containerRef} className="relative w-full h-full">
        <div
          ref={logoRef}
          className={`absolute transition-all duration-200 select-none ${isInteractive ? 'cursor-move hover:scale-105' : ''
            } ${(isDragging || isResizing) ? 'scale-110 z-50 shadow-lg' : ''} ${className}`}
          style={{
            left: `${localPosition.x}%`,
            top: `${localPosition.y}%`,
            width: `${localSize}px`,
            height: `${localSize}px`,
            transform: 'translate(-50%, -50%)',
            border: isInteractive ? '2px dashed rgba(59, 130, 246, 0.6)' : 'none',
            borderRadius: '8px',
            backgroundColor: isInteractive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            pointerEvents: isInteractive ? 'auto' : 'none',
            zIndex: (isDragging || isResizing) ? 9999 : (isInteractive ? 100 : 'auto')
          }}
          onMouseDown={handleLogoMouseDown}
        >
          <motion.img
            src={logoSrc}
            alt="Logo"
            className="w-full h-full object-contain rounded-lg select-none"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.7))'
            }}
            draggable={false}
            {...getAnimationVariants()}
          />

          {/* Interactive mode indicators */}
          {isInteractive && (
            <>
              {/* Corner resize handles */}
              <div
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full shadow-sm cursor-nw-resize hover:bg-blue-600 hover:scale-110 transition-all"
                onMouseDown={handleCornerMouseDown}
                title="Drag to resize"
              ></div>
              <div
                className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 rounded-full shadow-sm cursor-nw-resize hover:bg-blue-600 hover:scale-110 transition-all"
                onMouseDown={handleCornerMouseDown}
                title="Drag to resize"
              ></div>
              <div
                className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full shadow-sm cursor-ne-resize hover:bg-blue-600 hover:scale-110 transition-all"
                onMouseDown={handleCornerMouseDown}
                title="Drag to resize"
              ></div>
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full shadow-sm cursor-ne-resize hover:bg-blue-600 hover:scale-110 transition-all"
                onMouseDown={handleCornerMouseDown}
                title="Drag to resize"
              ></div>

              {/* Center move handle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-70"></div>

              {/* Position/Size indicator when interacting */}
              {(isDragging || isResizing) && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {isDragging && `Position: ${Math.round(localPosition.x)}%, ${Math.round(localPosition.y)}%`}
                  {isResizing && `Size: ${Math.round(localSize)}px`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Interactive Feature Card Component
  const InteractiveFeatureCard = ({
    card,
    onCardChange,
    isInteractive = false,
    index
  }: {
    card: FeatureCard;
    onCardChange?: (card: FeatureCard) => void;
    isInteractive?: boolean;
    index: number;
  }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [localPosition, setLocalPosition] = React.useState(card.position || { x: 50, y: 50 });
    const cardRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
      // Only allow dragging in interactive mode
      if (!isInteractive || !onCardChange || !localPosition) return;

      e.stopPropagation();
      e.preventDefault();

      const container = containerRef.current?.closest('.relative');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const safePosition = localPosition || { x: 50, y: 50 };
      const currentX = (safePosition.x * rect.width) / 100;
      const currentY = (safePosition.y * rect.height) / 100;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - currentX,
        y: e.clientY - rect.top - currentY
      });

      document.body.style.userSelect = 'none';
    };

    const updatePosition = React.useCallback((clientX: number, clientY: number) => {
      const container = containerRef.current?.closest('.relative');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newX = ((clientX - rect.left - dragStart.x) / rect.width) * 100;
      const newY = ((clientY - rect.top - dragStart.y) / rect.height) * 100;

      setLocalPosition({ x: newX, y: newY });
    }, [dragStart]);

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.userSelect = '';

        if (onCardChange && localPosition) {
          onCardChange({ ...card, position: localPosition });
        }
      };

      document.addEventListener('mousemove', handleMouseMove, { capture: true });
      document.addEventListener('mouseup', handleMouseUp, { capture: true });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        document.body.style.userSelect = '';
      };
    }, [isDragging, updatePosition, card, localPosition, onCardChange]);

    React.useEffect(() => {
      if (!isDragging && card.position) {
        // Only update if we have a valid position with x and y properties
        if (card.position.x !== undefined && card.position.y !== undefined) {
          setLocalPosition(card.position);
        }
      }
    }, [card.position, isDragging]);

    return (
      <div
        ref={containerRef}
        className={`relative transition-all duration-200 ${isInteractive ? 'cursor-move' : ''
          } ${isDragging ? 'z-50 scale-105 shadow-2xl' : ''}`}
        style={{
          width: '100%',
          height: '140px',
          backgroundColor: card.backgroundColor,
          border: isInteractive ? '2px dashed rgba(59, 130, 246, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          zIndex: isDragging ? 9999 : (isInteractive ? 50 + index : 'auto'),
          boxShadow: isInteractive ? '0 4px 20px rgba(59, 130, 246, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className={`h-full flex flex-col text-center ${isInteractive ? 'pointer-events-none' : ''}`}>
          {/* Full-width image */}
          {card.image ? (
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-3/4 object-cover rounded-t-lg select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-3/4 flex items-center justify-center text-6xl rounded-t-lg select-none" style={{ backgroundColor: card.backgroundColor + '40' }}>
              {card.icon}
            </div>
          )}

          {/* Single line description below */}
          <div className="flex-1 flex items-center justify-center p-2">
            <p
              className="text-xs font-medium leading-tight select-none"
              style={{ color: card.textColor }}
            >
              {card.description}
            </p>
          </div>

          {/* Drag overlay when interactive mode is enabled */}
          {isInteractive && (
            <div className="absolute inset-0 pointer-events-auto">
              {/* Drag handle area */}
              <div className="absolute inset-0 cursor-move" onMouseDown={handleMouseDown} />

              {/* Visual indicators */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse pointer-events-none"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse pointer-events-none"></div>
              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded opacity-75 pointer-events-none">
                Drag me!
              </div>

              {isDragging && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
                  {Math.round(localPosition.x)}%, {Math.round(localPosition.y)}%
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AnimatedSprite = ({ progress, position = 'in-bar' }: { progress: number; position?: string }) => {
    if (!splashConfig.loadingSprite) {
      console.log('[AnimatedSprite] No sprite available');
      return null;
    }

    console.log('[AnimatedSprite] Rendering sprite:', {
      position,
      progress,
      spriteSize: splashConfig.spriteSize,
      spriteUrl: splashConfig.loadingSprite.substring(0, 50) + '...'
    });

    // Calculate position-specific animations
    const getPositionAnimation = () => {
      const baseAnimation = {
        roll: `rotate(${progress * 720}deg)`,
        spin: `rotate(${progress * 360 * 3}deg)`,
        bounce: `translateY(${Math.sin(progress * Math.PI * 4) * 10}px)`,
        pulse: `scale(${1 + Math.sin(progress * Math.PI * 6) * 0.2})`,
        slide: '',
      };

      const progressPercent = Math.max(0, Math.min(100, progress * 100));

      switch (position) {
        case 'in-bar':
          // Move horizontally inside the progress bar
          return {
            transform: `translateX(${progressPercent}%) ${baseAnimation[splashConfig.spriteAnimation]}`,
            left: '0%',
            top: '50%',
            marginTop: `-${splashConfig.spriteSize / 2}px`,
          };
        case 'above-bar':
          // Move horizontally above the progress bar
          return {
            transform: `translateX(${progressPercent}%) ${baseAnimation[splashConfig.spriteAnimation]}`,
            left: '0%',
            top: '0%',
          };
        case 'below-bar':
          // Move horizontally below the progress bar
          return {
            transform: `translateX(${progressPercent}%) ${baseAnimation[splashConfig.spriteAnimation]}`,
            left: '0%',
            top: '0%',
          };
        case 'left-side':
          // Stay on left side with vertical bounce/animation
          return {
            transform: baseAnimation[splashConfig.spriteAnimation],
            left: `-${splashConfig.spriteSize + 16}px`,
            top: '50%',
            marginTop: `-${splashConfig.spriteSize / 2}px`,
          };
        case 'right-side':
          // Move to follow the progress on right side
          return {
            transform: `translateX(${progressPercent}%) ${baseAnimation[splashConfig.spriteAnimation]}`,
            left: `16px`,
            top: '50%',
            marginTop: `-${splashConfig.spriteSize / 2}px`,
          };
        default:
          return {
            transform: `translateX(${progressPercent}%) ${baseAnimation[splashConfig.spriteAnimation]}`,
            left: '0%',
            top: '50%',
            marginTop: `-${splashConfig.spriteSize / 2}px`,
          };
      }
    };

    const animationStyle = getPositionAnimation();

    return (
      <div
        className="absolute transition-transform duration-200 ease-out pointer-events-none"
        style={{
          ...animationStyle,
          width: `${splashConfig.spriteSize}px`,
          height: `${splashConfig.spriteSize}px`,
          zIndex: 15,
          border: '2px solid red', // Debug border
        }}
      >
        <img
          src={splashConfig.loadingSprite}
          alt="Loading sprite"
          className="w-full h-full object-contain filter drop-shadow-sm"
          onError={(e) => console.error('[AnimatedSprite] Image load error:', e)}
          onLoad={() => console.log('[AnimatedSprite] Image loaded successfully')}
        />
      </div>
    );
  };

  // Interactive Continue Button Component
  const InteractiveContinueButton = React.memo(({
    buttonSrc,
    position,
    scale,
    onPositionChange,
    isInteractive = false,
    onClick
  }: {
    buttonSrc: string;
    position: { x: number; y: number };
    scale: number;
    onPositionChange?: (position: { x: number; y: number }) => void;
    isInteractive?: boolean;
    onClick?: () => void;
  }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [localPosition, setLocalPosition] = React.useState(position || { x: 50, y: 85 });
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Update local position when props change
    React.useEffect(() => {
      if (position && (position.x !== localPosition.x || position.y !== localPosition.y)) {
        setLocalPosition(position);
      }
    }, [position]);

    // Update config when dragging ends (same pattern as logos)
    React.useEffect(() => {
      if (isDragging) return; // Don't update config while dragging

      // Update position if changed
      if (onPositionChange && (localPosition.x !== position.x || localPosition.y !== position.y)) {
        console.log('[InteractiveContinueButton] Final position update:', localPosition);
        console.log('[InteractiveContinueButton] Previous position:', position);
        onPositionChange(localPosition);
      }
    }, [isDragging, localPosition, position, onPositionChange]);

    // Smooth position update using same logic as logos
    const updatePosition = React.useCallback((clientX: number, clientY: number) => {
      if (!containerRef.current?.parentElement) return;

      const parentRect = containerRef.current.parentElement.getBoundingClientRect();
      // Use dragStart offset for smooth movement like logos
      const newX = ((clientX - parentRect.left - dragStart.x) / parentRect.width) * 100;
      const newY = ((clientY - parentRect.top - dragStart.y) / parentRect.height) * 100;

      // Allow full canvas movement (no constraints)
      const newPosition = { x: newX, y: newY };
      setLocalPosition(newPosition);
      return newPosition; // Return the new position for immediate use
    }, [dragStart]);

    const handleMouseDown = (e: React.MouseEvent) => {
      console.log('[InteractiveContinueButton] Mouse down triggered, isInteractive:', isInteractive);
      if (!isInteractive || !containerRef.current?.parentElement) {
        console.log('[InteractiveContinueButton] Not interactive or no container');
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      console.log('[InteractiveContinueButton] Starting drag...');

      const parentRect = containerRef.current.parentElement.getBoundingClientRect();
      const currentX = (localPosition.x * parentRect.width) / 100;
      const currentY = (localPosition.y * parentRect.height) / 100;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - parentRect.left - currentX,
        y: e.clientY - parentRect.top - currentY
      });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updatePosition(moveEvent.clientX, moveEvent.clientY);
      };

      const handleMouseUp = () => {
        console.log('[InteractiveContinueButton] Drag ended');
        setIsDragging(false); // This will trigger the useEffect to update config
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Reset user selection
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
      };

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <motion.div
        ref={containerRef}
        className={`absolute ${isInteractive ? 'cursor-move' : 'cursor-pointer'} ${isDragging ? 'z-50' : 'z-10'}`}
        style={{
          left: `${localPosition.x}%`,
          top: `${localPosition.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto'
        }}
        initial={{
          opacity: 0,
          scale: isDragging ? scale * 1.1 : scale
        }}
        animate={{
          opacity: 1,
          scale: isDragging ? scale * 1.1 : scale
        }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileHover={{
          scale: isInteractive ? scale * 1.05 : scale * 1.05,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}
        whileTap={{ scale: scale * 0.95 }}
        onMouseDown={handleMouseDown}
        onClick={isInteractive ? undefined : onClick}
      >
        {/* Interactive Border - Always visible when interactive */}
        {isInteractive && (
          <div
            className={`absolute inset-0 border-2 rounded-lg transition-all ${isDragging ? 'border-blue-400 shadow-lg' : 'border-blue-200 border-dashed'
              }`}
            style={{
              width: '600px',
              height: '200px',
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Debug info */}
        {isInteractive && (
          <div
            className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded"
            style={{ transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}
          >
            Drag me! {Math.round(localPosition.x)}%, {Math.round(localPosition.y)}%
          </div>
        )}

        {/* Button Image */}
        <img
          src={buttonSrc}
          alt="Continue Button"
          className="select-none"
          style={{
            width: '600px',
            height: '200px',
            objectFit: 'contain',
            filter: isDragging ? 'brightness(1.1)' : 'none'
          }}
          draggable={false}
          onLoad={() => console.log('[InteractiveContinueButton] Button image loaded')}
          onError={(e) => console.error('[InteractiveContinueButton] Button image failed:', e)}
        />

        {/* Click overlay for non-interactive mode */}
        {!isInteractive && (
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={onClick}
          />
        )}
      </motion.div>
    );
  });

  const GameExplanationScreen = () => (
    <div
      className={`relative w-full h-full overflow-y-auto overflow-x-hidden ${deviceMode === 'mobile' ? 'max-w-sm mx-auto' : ''
        }`}
      style={{
        background: splashConfig.splashBackgroundImage
          ? `url(${splashConfig.splashBackgroundImage})`
          : splashConfig.splashBackground,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: splashConfig.splashTextColor
      }}
    >
      <div className="flex flex-col items-center justify-start min-h-full py-8 px-4 space-y-6">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-white opacity-10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

        {/* Game Logo/Title */}
        <motion.div
          className="text-center w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
        {splashConfig.gameLogo ? (
          <div
            className={`${splashConfig.interactiveMode ? 'absolute inset-0' : 'relative w-full h-32'} mb-4`}
            style={{
              zIndex: splashConfig.interactiveMode ? 200 : 'auto',
              pointerEvents: splashConfig.interactiveMode ? 'auto' : 'none'
            }}
          >
            <InteractiveLogo
              logoSrc={splashConfig.gameLogo}
              size={splashConfig.gameLogoSize}
              position={splashConfig.gameLogoPosition}
              onPositionChange={(pos) => {
                console.log('[GameLogo] Position changed:', pos);
                updateSplashConfig({ gameLogoPosition: pos });
              }}
              onSizeChange={(size) => {
                console.log('[GameLogo] Size changed:', size);
                updateSplashConfig({ gameLogoSize: size });
              }}
              isInteractive={splashConfig.interactiveMode}
              className="mx-auto"
              animation={splashConfig.gameLogoAnimation}
            />
          </div>
        ) : (
          <motion.div
            className="w-32 h-32 mx-auto rounded-xl flex items-center justify-center text-6xl mb-4"
            style={{ backgroundColor: splashConfig.accentColor, color: splashConfig.splashBackground }}
            animate={{ rotateY: [0, 5, 0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🎰
          </motion.div>
        )}

        <motion.h1
          className="text-4xl font-bold mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {splashConfig.gameTitle}
        </motion.h1>

        <motion.p
          className="text-xl opacity-90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {splashConfig.gameSubtitle}
        </motion.p>
      </motion.div>

        {/* Game Features */}
        <motion.div
          className="w-full max-w-4xl relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <h3 className="text-xl md:text-2xl font-semibold mb-6 text-center">Game Features</h3>

          {splashConfig.splashLayoutType === 'grid' ? (
            // Grid Layout with 2 cards per row
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto px-4">
              {(splashConfig.featureHighlights || []).filter(feature => feature && feature.id).map((feature, index) => (
                <div key={feature.id} className="relative">
                  <InteractiveFeatureCard
                    card={feature}
                    onCardChange={(updatedCard) => {
                      const newFeatures = [...splashConfig.featureHighlights];
                      newFeatures[index] = updatedCard;
                      updateSplashConfig({ featureHighlights: newFeatures });
                    }}
                    isInteractive={splashConfig.interactiveMode}
                    index={index}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Carousel Layout with Navigation - One feature at a time
            <div className="relative w-full max-w-md mx-auto">
              <div className="overflow-hidden">
                {(splashConfig.featureHighlights || []).filter(feature => feature && feature.id).length > 0 && (
                  <motion.div
                    className="w-full px-4"
                    key={`feature-${currentFeatureIndex}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                  {(() => {
                    const validFeatures = (splashConfig.featureHighlights || []).filter(feature => feature && feature.id);
                    const feature = validFeatures[currentFeatureIndex];

                    if (!feature) return null;

                    return (
                      <motion.div
                        className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 text-center mx-auto max-w-sm"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        style={{
                          backgroundColor: feature.backgroundColor + '80',
                          color: feature.textColor
                        }}
                      >
                        {/* Full-width image */}
                        {feature.image ? (
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-48 object-cover rounded-t-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center text-6xl rounded-t-lg mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                            {feature.icon}
                          </div>
                        )}

                        {/* Single line description below */}
                        <p className="text-base font-medium opacity-90 px-4">{feature.description}</p>
                      </motion.div>
                    );
                  })()}
                </motion.div>
              )}
            </div>

            {/* Navigation Arrows */}
            {(splashConfig.featureHighlights || []).length > 1 && (
              <>
                <button
                  onClick={() => setCurrentFeatureIndex(Math.max(0, currentFeatureIndex - 1))}
                  disabled={currentFeatureIndex === 0}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 p-2 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentFeatureIndex(Math.min((splashConfig.featureHighlights || []).length - 1, currentFeatureIndex + 1))}
                  disabled={currentFeatureIndex === (splashConfig.featureHighlights || []).length - 1}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 p-2 rounded-full"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Pagination Dots */}
            {(splashConfig.featureHighlights || []).length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {(splashConfig.featureHighlights || []).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeatureIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentFeatureIndex
                      ? 'bg-white'
                      : 'bg-white bg-opacity-40'
                      }`}
                  />
                ))}
              </div>
            )}
            </div>
          )}
        </motion.div>

        {/* Continue Button - Interactive when enabled */}
        <div className="w-full flex justify-center">
          {splashConfig.continueButton ? (
            <div
              className={`${splashConfig.interactiveMode ? 'relative' : 'relative'}`}
              style={{
                zIndex: splashConfig.interactiveMode ? 200 : 'auto',
                pointerEvents: 'auto'
              }}
            >
              <InteractiveContinueButton
                buttonSrc={splashConfig.continueButton}
                position={splashConfig.continueButtonPosition}
                scale={splashConfig.continueButtonScale}
                onPositionChange={(pos) => {
                  console.log('[ContinueButton] Position changed:', pos);
                  updateSplashConfig({ continueButtonPosition: pos });
                }}
                isInteractive={splashConfig.interactiveMode}
                onClick={() => {
                  setShowGameExplanation(false);
                  setLoadingComplete(true);
                }}
              />
            </div>
          ) : (
            <motion.button
              className="px-8 md:px-12 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl shadow-2xl transform transition-all duration-200"
              style={{
                backgroundColor: splashConfig.accentColor,
                color: splashConfig.splashBackground
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowGameExplanation(false);
                setLoadingComplete(true);
              }}
            >
              Continue to Game
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );

  const SplashScreenPreview = React.memo(() => (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${deviceMode === 'mobile' ? 'max-w-sm mx-auto' : ''
        }`}
      style={{
        background: splashConfig.backgroundType === 'image' && splashConfig.splashBackgroundImage
          ? `url("${splashConfig.splashBackgroundImage}") center/cover no-repeat`
          : splashConfig.backgroundColor,
        color: splashConfig.textColor
      }}
    >
      {/* Background Effects */}
      {splashConfig.backgroundType === 'particles' && (
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white opacity-20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Logo Section - FORCE VISIBLE - Testing */}
      <div
        className="mb-8 relative"
        style={{
          zIndex: 9999,
          position: 'relative',
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          border: '3px solid red',
          padding: '20px'
        }}
      >
        <div style={{ color: 'white', fontSize: '12px', marginBottom: '10px' }}>
          DEBUG: Logo Section (studioLogo: {splashConfig.studioLogo ? 'YES' : 'NO'}, loadingSprite: {splashConfig.loadingSprite ? 'YES' : 'NO'})
        </div>

        {/* ALWAYS show something for testing */}
        <div
          className="w-24 h-24 rounded-lg flex items-center justify-center text-4xl font-bold mx-auto"
          style={{
            backgroundColor: 'yellow',
            color: 'black',
            border: '2px solid green'
          }}
        >
          {(splashConfig.studioLogo || splashConfig.loadingSprite) ? (
            <img
              src={splashConfig.studioLogo || splashConfig.loadingSprite}
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            '🎰'
          )}
        </div>
      </div>

      {/* Game Title */}
      <motion.h1
        className="text-3xl font-bold mb-2 relative"
        style={{ zIndex: 1000 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Epic Slots Adventure
      </motion.h1>

      <motion.p
        className="text-lg opacity-80 mb-8 relative"
        style={{ zIndex: 1000 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Prepare for the ultimate gaming experience
      </motion.p>

      {/* Loading Progress */}
      {splashConfig.showProgress && (
        <div className="w-full max-w-md px-8 relative" style={{ zIndex: 1000 }}>
          {splashConfig.progressStyle === 'bar' && (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Loading Game Assets</span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>

                {/* Progress Bar Container with Sprite Positioning */}
                <div className="relative" style={{ paddingTop: `${splashConfig.spriteSize + 16}px`, paddingBottom: `${splashConfig.spriteSize + 16}px` }}>
                  {/* Debug: Show sprite status */}
                  {console.log('[DEBUG] Sprite Status:', {
                    hasSprite: !!splashConfig.loadingSprite,
                    spritePosition: splashConfig.spritePosition,
                    progress: loadingProgress,
                    spriteUrl: splashConfig.loadingSprite?.substring(0, 50) + '...'
                  })}

                  {/* Sprites positioned above the bar */}
                  {splashConfig.loadingSprite && splashConfig.spritePosition === 'above-bar' && (
                    <div className="absolute w-full" style={{ top: `8px` }}>
                      <AnimatedSprite progress={loadingProgress / 100} position="above-bar" />
                    </div>
                  )}

                  {/* Sprite positioned on left side */}
                  {splashConfig.loadingSprite && splashConfig.spritePosition === 'left-side' && (
                    <AnimatedSprite progress={loadingProgress / 100} position="left-side" />
                  )}

                  {/* Main Progress Bar */}
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-4 relative overflow-visible">
                    {/* Progress Fill - Always show behind sprite when in-bar, conditional otherwise */}
                    {(!splashConfig.hideProgressFill || (splashConfig.loadingSprite && splashConfig.spritePosition === 'in-bar')) && (
                      <motion.div
                        className="h-4 rounded-full"
                        style={{ backgroundColor: splashConfig.accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    )}

                    {/* Sprite inside the progress bar */}
                    {splashConfig.loadingSprite && splashConfig.spritePosition === 'in-bar' && (
                      <AnimatedSprite progress={loadingProgress / 100} position="in-bar" />
                    )}

                    {/* Sprite on right side following progress */}
                    {splashConfig.loadingSprite && splashConfig.spritePosition === 'right-side' && (
                      <AnimatedSprite progress={loadingProgress / 100} position="right-side" />
                    )}
                  </div>

                  {/* Sprites positioned below the bar */}
                  {splashConfig.loadingSprite && splashConfig.spritePosition === 'below-bar' && (
                    <div className="absolute w-full" style={{ bottom: `8px` }}>
                      <AnimatedSprite progress={loadingProgress / 100} position="below-bar" />
                    </div>
                  )}

                  {/* Debug: Always show a test sprite if none exists */}
                  {!splashConfig.loadingSprite && (
                    <div className="absolute top-1/2 left-4 transform -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                      🏀
                    </div>
                  )}
                </div>
              </div>

              {/* Phase-specific Progress - Hide when loading is complete */}
              {loadingProgress < 100 && (
                <div className="space-y-2">
                  {loadingPhases.map((phase, index) => (
                    <motion.div
                      key={phase.id}
                      className={`flex items-center space-x-3 text-sm ${index === currentPhase ? 'opacity-100' : 'opacity-50'
                        }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: index <= currentPhase ? 1 : 0.3, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0" style={{ color: phase.color }}>
                        {phase.icon}
                      </div>
                      <span className="flex-1">{phase.name}</span>
                      {index < currentPhase && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {index === currentPhase && isLoading && (
                        <Loader className="w-4 h-4 animate-spin" style={{ color: phase.color }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {splashConfig.progressStyle === 'circular' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="opacity-20"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={splashConfig.accentColor}
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: loadingProgress / 100 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      strokeDasharray: `${2 * Math.PI * 45}`,
                      strokeDashoffset: `${2 * Math.PI * 45 * (1 - loadingProgress / 100)}`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{Math.round(loadingProgress)}%</span>
                </div>
              </div>

              {currentPhase < loadingPhases.length && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {loadingPhases[currentPhase].icon}
                    <span className="font-medium">{loadingPhases[currentPhase].name}</span>
                  </div>
                  <p className="text-sm opacity-80">{loadingPhases[currentPhase].description}</p>
                </div>
              )}
            </div>
          )}

          {splashConfig.progressStyle === 'dots' && (
            <div className="flex justify-center space-x-2">
              {loadingPhases.map((phase, index) => (
                <motion.div
                  key={phase.id}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: index <= currentPhase ? phase.color : 'rgba(255,255,255,0.3)'
                  }}
                  animate={{
                    scale: index === currentPhase && isLoading ? [1, 1.5, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: index === currentPhase && isLoading ? Infinity : 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading Tips */}
      {splashConfig.loadingTips.length > 0 && (
        <motion.div
          className="mt-8 text-center max-w-md px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-current rounded-full opacity-60" />
            <span className="text-sm font-medium opacity-80">Pro Tip</span>
            <div className="w-2 h-2 bg-current rounded-full opacity-60" />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPhase}
              className="text-sm opacity-70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {splashConfig.loadingTips[currentPhase % splashConfig.loadingTips.length]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Completion State */}
      {loadingComplete && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ backgroundColor: `${splashConfig.backgroundColor}dd` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle className="w-24 h-24 text-green-400 mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Ready to Play!</h2>
          <p className="text-sm opacity-80 mb-6">All assets loaded successfully</p>
          <motion.button
            className="px-8 py-3 rounded-lg font-bold"
            style={{
              backgroundColor: splashConfig.accentColor,
              color: splashConfig.backgroundColor
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPreviewMode(true)}
          >
            Start Game
          </motion.button>
        </motion.div>
      )}
    </div>
  ));

  const updateSplashConfig = (updates: Partial<SplashConfig>) => {
    console.log('[updateSplashConfig] Updating with:', updates);
    setSplashConfig(prev => {
      const newConfig = { ...prev, ...updates };
      console.log('[updateSplashConfig] New config:', newConfig);
      return newConfig;
    });
  };

  // Ref to track if we're currently updating to prevent infinite loops
  const isUpdatingRef = useRef(false);

  // Transfer splash config to journey store when splashConfig changes
  useEffect(() => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    // Use a timeout to prevent infinite loops
    const timeoutId = setTimeout(() => {
      try {
        journeyTransfer.transferFromSplashStep({
          gameLogo: splashConfig.gameLogo,
          gameLogoSize: splashConfig.gameLogoSize,
          gameLogoPosition: splashConfig.gameLogoPosition,
          gameLogoAnimation: splashConfig.gameLogoAnimation,
          gameTitle: splashConfig.gameTitle,
          gameSubtitle: splashConfig.gameSubtitle,
          splashBackground: splashConfig.splashBackground,
          splashBackgroundImage: splashConfig.splashBackgroundImage,
          splashTextColor: splashConfig.splashTextColor,
          splashDuration: splashConfig.splashDuration,
          continueButton: splashConfig.continueButton,
          continueButtonSize: splashConfig.continueButtonSize,
          continueButtonPosition: splashConfig.continueButtonPosition,
          featureHighlights: splashConfig.featureHighlights
        });
      } finally {
        isUpdatingRef.current = false;
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      isUpdatingRef.current = false;
    };
  }, [splashConfig]);

  // Get loading config from Step 8 on component mount
  useEffect(() => {
    const loadingConfig = journeyTransfer.getLoadingConfig();
    if (loadingConfig.loadingSprite || loadingConfig.studioLogo) {
      // Loading experience has been configured, integrate it
      console.log('[Step8] Loading config from Step 8:', loadingConfig);
    }
  }, []);

  return (
    <div className="w-full h-full flex">
      {/* Left Panel - Configuration Options */}
      <div className="w-1/2 overflow-y-auto ">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Splash & Preloader Studio</h2>
            <p className="text-gray-600">Design professional loading experiences</p>
          </div>
        </div>
        <div className='space-y-2 border p-2 bg-white'>
          {/* Full Journey Preview Toggle */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
              Journey Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Full Journey Preview</span>
                  <p className="text-xs text-gray-500">Loading → Splash → Game sequence</p>
                </div>
                <button
                  onClick={() => setShowFullJourney(!showFullJourney)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${showFullJourney ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {showFullJourney ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              {showFullJourney && (
                <div className="bg-white border  p-3 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Current Phase: {journeyPhase}</span>
                    {/* <div className="text-xs text-gray-600 capitalize">{journeyPhase}</div> */}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setJourneyPhase('loading')}
                      className={`px-2 py-1 text-xs border rounded ${journeyPhase === 'loading' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Loading
                    </button>
                    <button
                      onClick={() => setJourneyPhase('splash')}
                      className={`px-2 py-1 text-xs border rounded ${journeyPhase === 'splash' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Splash
                    </button>
                    <button
                      onClick={() => setJourneyPhase('game')}
                      className={`px-2 py-1 text-xs border rounded ${journeyPhase === 'game' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600'}`}
                    >
                      Game
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Device Mode Toggle */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
              Preview Mode
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-gray-200 p-1 gap-2 rounded-lg flex">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${deviceMode === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-all ${deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logo & Branding Configuration - Accordion */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Logo & Branding</h3>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden p-2"
              >
                <div className="p-2 pt-0 space-y-3">
                  {/* Interactive Mode Toggle */}
                  <div className=" p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className='flex items-center gap-2 '>
                      <input
                        type="checkbox"
                        id="interactive-mode"
                        checked={splashConfig.interactiveMode}
                        onChange={(e) => updateSplashConfig({ interactiveMode: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded "
                      />
                      <label htmlFor="interactive-mode" className="text-sm font-medium text-gray-800">
                        Interactive Positioning Mode
                      </label>
                    </div>
                    {splashConfig.interactiveMode && (
                      <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        💡 Drag logos in the preview to position them where you want!
                      </p>
                    )}
                  </div>

                  {/* Studio Logo Section */}
                  {/* <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <h4 className="font-medium text-gray-800 mb-3">Studio Logo (Loading Screen)</h4>

                    <div className="space-y-3">
                      <div className='space-y-3 border rounded-md p-2'>
                        <div>
                          <textarea
                            value={splashConfig.studioLogoPrompt}
                            onChange={(e) => updateSplashConfig({ studioLogoPrompt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={2}
                            placeholder="Professional gaming studio logo, modern design, elegant typography..."
                          />
                        </div>
                        <div className="flex gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStudioLogoUpload}
                            className="hidden"
                            id="studio-logo-upload"
                          />
                          <Button
                            variant='generate'
                            onClick={generateStudioLogo}
                            disabled={splashConfig.studioLogoGenerating}
                            className="w-full py-2"
                          >
                            {splashConfig.studioLogoGenerating ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span>{splashConfig.studioLogoGenerating ? 'Generating...' : 'AI Generate'}</span>
                          </Button>
                          <label
                            htmlFor="studio-logo-upload"
                            className="flex items-center w-full cursor-pointer justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {splashConfig.studioLogo && (
                          <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-white">
                            <img src={splashConfig.studioLogo} alt="Studio Logo" className="w-16 h-16 object-contain" />
                          </div>
                        )}
                      </div>


                      <div className='border p-2 bg-white rounded-md'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Studio Logo Size: {splashConfig.studioLogoSize}px
                        </label>
                        <input
                          type="range"
                          min="40"
                          max="200"
                          step="10"
                          value={splashConfig.studioLogoSize}
                          onChange={(e) => updateSplashConfig({ studioLogoSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div> */}

                  {/* Game Logo Section */}
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <h4 className="font-medium text-gray-800 mb-2">Game Logo (Splash Screen)</h4>

                    <div className="space-y-3">
                      <div className='border p-2 rounded-md '>
                        <div>
                          <textarea
                            value={splashConfig.gameLogoPrompt}
                            onChange={(e) => updateSplashConfig({ gameLogoPrompt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={2}
                            placeholder="Epic fantasy game logo with ornate design, mystical elements..."
                          />
                        </div>

                        <div className="flex gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleGameLogoUpload}
                            className="hidden"
                            id="game-logo-upload"
                          />
                          <Button
                            variant='generate'
                            onClick={generateGameLogo}
                            disabled={splashConfig.gameLogoGenerating}
                            className="w-full"
                          >
                            {splashConfig.gameLogoGenerating ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span>{splashConfig.gameLogoGenerating ? 'Generating...' : 'AI Generate'}</span>
                          </Button>
                          <label
                            htmlFor="game-logo-upload"
                            className="flex items-center w-full cursor-pointer justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </label>
                        </div>
                        {splashConfig.gameLogo && (
                          <div className="flex mt-2 items-center justify-center p-3 border border-gray-200 rounded-lg bg-white">
                            <img src={splashConfig.gameLogo} alt="Game Logo" className="w-16 h-16 object-contain" />
                          </div>
                        )}
                      </div>


                      <div className='p-2 border rounded-md bg-white'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Game Logo Size: {splashConfig.gameLogoSize}px
                        </label>
                        <input
                          type="range"
                          min="60"
                          max="300"
                          step="10"
                          value={splashConfig.gameLogoSize}
                          onChange={(e) => updateSplashConfig({ gameLogoSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Game Logo Animation</label>
                        <select
                          value={splashConfig.gameLogoAnimation}
                          onChange={(e) => updateSplashConfig({ gameLogoAnimation: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="fade">Smooth Fade In</option>
                          <option value="scale">Scale & Reveal</option>
                          <option value="bounce">Bounce Effect</option>
                          <option value="spin">Elegant Spin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Debug Panel for Interactive Mode */}
                  {/* {splashConfig.interactiveMode && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                        <div className="font-medium text-yellow-800 mb-2">🐛 Interactive Debug Info</div>
                        <div className="space-y-1 text-yellow-700">
                          <div>Studio Logo: {splashConfig.studioLogo ? '✅ Loaded' : 'Not loaded'}</div>
                          <div>Game Logo: {splashConfig.gameLogo ? '✅ Loaded' : 'Not loaded'}</div>
                          <div>Continue Button: {splashConfig.continueButton ? '✅ Loaded' : 'Not loaded'}</div>
                          <div>Studio Position: {Math.round(splashConfig.studioLogoPosition.x)}%, {Math.round(splashConfig.studioLogoPosition.y)}%</div>
                          <div>Game Position: {Math.round(splashConfig.gameLogoPosition.x)}%, {Math.round(splashConfig.gameLogoPosition.y)}%</div>
                          <div>Continue Position: {Math.round(splashConfig.continueButtonPosition.x)}%, {Math.round(splashConfig.continueButtonPosition.y)}%</div>
                          <div>Continue Scale: {Math.round(splashConfig.continueButtonScale * 100)}%</div>
                          <div className="text-yellow-600 mt-2">
                            💡 If dragging doesn't work, try clicking "Test Loading" first to show the splash screens.
                          </div>
                        </div>
                      </div>
                    )} */}

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2 border rounded-md ">
                    <div className='p-2 border bg-white rounded-md'>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={splashConfig.backgroundColor}
                          onChange={(e) => updateSplashConfig({ backgroundColor: e.target.value })}
                          className="w-40 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={splashConfig.backgroundColor}
                          onChange={(e) => updateSplashConfig({ backgroundColor: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="#1a1a2e"
                        />
                      </div>
                    </div>
                    <div className='p-2 border bg-white rounded-md'>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accent</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={splashConfig.accentColor}
                          onChange={(e) => updateSplashConfig({ accentColor: e.target.value })}
                          className="w-40 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={splashConfig.accentColor}
                          onChange={(e) => updateSplashConfig({ accentColor: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          placeholder="#ffd700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Loading Sprite Configuration - Accordion */}
          {/* <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200">
            <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 border-b  transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Loading Sprite</h3>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white pt-2 space-y-2">
                  <div className='p-2 border bg-gray-50 rounded-md '>
                    <div>
                      <textarea
                        value={splashConfig.spritePrompt}
                        onChange={(e) => updateSplashConfig({ spritePrompt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={2}
                        placeholder="Describe your loading sprite... e.g., Golden nugget with metallic texture, 3D rendered, casino style, shiny gold finish"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSpriteUpload}
                        className="hidden"
                        id="sprite-upload"
                      />
                      <Button
                        variant='generate'
                        onClick={generateSprite}
                        disabled={splashConfig.spriteGenerating}
                        className="w-full py-2"
                      >
                        {splashConfig.spriteGenerating ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{splashConfig.spriteGenerating ? 'Generating...' : 'AI Generate'}</span>
                      </Button>
                      <label
                        htmlFor="sprite-upload"
                        className="flex items-center w-full cursor-pointer justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </label>
                    </div>
                    {splashConfig.loadingSprite && (
                      <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <img src={splashConfig.loadingSprite} alt="Loading Sprite" className="w-12 h-12 object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className='p-2 border bg-gray-50 rounded-md'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Animation</label>
                        <select
                          value={splashConfig.spriteAnimation}
                          onChange={(e) => updateSplashConfig({ spriteAnimation: e.target.value as any })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="roll">Rolling</option>
                          <option value="spin">Spinning</option>
                          <option value="bounce">Bouncing</option>
                          <option value="pulse">Pulsing</option>
                          <option value="slide">Sliding</option>
                        </select>
                      </div>
                      <div className='p-2 border bg-gray-50 rounded-md'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size: {splashConfig.spriteSize}px
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          step="5"
                          value={splashConfig.spriteSize}
                          onChange={(e) => updateSplashConfig({ spriteSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className='p-2 border bg-gray-50 rounded-md'>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sprite Position</label>
                      <select
                        value={splashConfig.spritePosition}
                        onChange={(e) => {
                          const newPosition = e.target.value as any;
                          // Smart defaults: hide progress fill when sprite is in-bar, show it for other positions
                          const shouldHideFill = newPosition === 'in-bar';
                          updateSplashConfig({
                            spritePosition: newPosition,
                            hideProgressFill: shouldHideFill
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="in-bar">Inside Progress Bar</option>
                        <option value="above-bar">Above Progress Bar</option>
                        <option value="below-bar">Below Progress Bar</option>
                        <option value="left-side">Left Side of Bar</option>
                        <option value="right-side">Right Side of Bar</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose where the sprite appears relative to the progress bar
                      </p>
                    </div>

                    <div className=" space-y-2 p-2 border bg-gray-50 rounded-md">
                      <div className='flex items-center space-x-2 '>
                        <input
                          type="checkbox"
                          id="hide-progress-fill"
                          checked={splashConfig.hideProgressFill}
                          onChange={(e) => updateSplashConfig({ hideProgressFill: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="hide-progress-fill" className="text-sm font-medium text-gray-700">
                          Hide Progress Bar Fill
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        When enabled, only shows the empty progress bar container. Perfect when the sprite itself indicates progress.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div> */}

          {/* Progress & Loading Configuration - Accordion */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Loading Screen Settings</h3>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 flex gap-4 pt-2">
                  <div className='border p-2 rounded-md bg-gray-50 w-full'>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress Style</label>
                    <select
                      value={splashConfig.progressStyle}
                      onChange={(e) => updateSplashConfig({ progressStyle: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="bar">Progress Bar</option>
                      <option value="circular">Circular Progress</option>
                      <option value="dots">Phase Indicators</option>
                      <option value="symbols">Symbol-Based</option>
                    </select>
                  </div>

                  <div className='border p-2 rounded-md bg-gray-50 w-full'>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Effects</label>
                    <select
                      value={splashConfig.backgroundType}
                      onChange={(e) => updateSplashConfig({ backgroundType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="gradient">Smooth Gradient</option>
                      <option value="particles">Animated Particles</option>
                      <option value="solid">Solid Background</option>
                      <option value="image">Custom Image</option>
                    </select>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-2">Advanced Timing</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Time: {splashConfig.minimumDisplayTime}ms
                        </label>
                        <input
                          type="range"
                          min="1000"
                          max="10000"
                          step="500"
                          value={splashConfig.minimumDisplayTime}
                          onChange={(e) => updateSplashConfig({ minimumDisplayTime: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1s</span>
                          <span>10s</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="audio-enabled"
                          checked={splashConfig.audioEnabled}
                          onChange={(e) => updateSplashConfig({ audioEnabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="audio-enabled" className="text-sm font-medium text-gray-700">
                          Enable Loading Audio
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div> */}

          {/* Splash Screen (Game Explanation) - Accordion */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200">
            <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Splash Screen (Game Explanation)</h3>
              </div>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-2 space-y-2 bg-white">
                  <div className="flex items-center border rounded-md p-2 bg-gray-50 space-x-2">
                    <input
                      type="checkbox"
                      id="splash-enabled"
                      checked={splashConfig.splashEnabled}
                      onChange={(e) => updateSplashConfig({ splashEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="splash-enabled" className="text-sm font-medium text-gray-700">
                      Enable Game Explanation Screen
                    </label>
                  </div>

                  {splashConfig.splashEnabled && (
                    <>
                      <div className='flex border p-2 rounded-md bg-gray-50 gap-4'>
                        <div className='w-full'>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Game Title</label>
                          <input
                            type="text"
                            value={splashConfig.gameTitle}
                            onChange={(e) => updateSplashConfig({ gameTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Epic Slots Adventure"
                          />
                        </div>

                        <div className='w-full'>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Game Subtitle</label>
                          <input
                            type="text"
                            value={splashConfig.gameSubtitle}
                            onChange={(e) => updateSplashConfig({ gameSubtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="The Ultimate Gaming Experience"
                          />
                        </div>
                      </div>

                      <div className='border p-2 rounded-md bg-gray-50'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feature Highlights</label>
                        <div className=" grid grid-cols-2 gap-2">
                          {splashConfig.featureHighlights.map((feature, index) => (
                            <div key={index} className="flex items-center relative overflow-hidden">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [...splashConfig.featureHighlights];
                                  newFeatures[index] = e.target.value;
                                  updateSplashConfig({ featureHighlights: newFeatures });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder={`Feature ${index + 1}`}
                              />
                              {splashConfig.featureHighlights.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newFeatures = splashConfig.featureHighlights.filter((_, i) => i !== index);
                                    updateSplashConfig({ featureHighlights: newFeatures });
                                  }}
                                  className="px-2 py-2 text-red-600 hover:bg-red-50 rounded absolute right-0"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newFeatures = [...splashConfig.featureHighlights, ''];
                              updateSplashConfig({ featureHighlights: newFeatures });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Feature
                          </button>
                        </div>
                      </div>

                      <div className='border p-2 bg-gray-50 rounded-md'>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Splash Duration: {splashConfig.splashDuration}ms
                        </label>
                        <input
                          type="range"
                          min="1000"
                          max="8000"
                          step="500"
                          value={splashConfig.splashDuration}
                          onChange={(e) => updateSplashConfig({ splashDuration: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1s</span>
                          <span>8s</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Splash Background Configuration - Accordion */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200">
            <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Splash Background</h3>
              </div>
            </div>


            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-2 pt-2 bg-white">
                  {/* Background Image Prompt */}
                  <div className='border p-2 rounded-md bg-gray-50'>
                    <div>
                      <textarea
                        value={splashConfig.splashBackgroundImagePrompt}
                        onChange={(e) => updateSplashConfig({ splashBackgroundImagePrompt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        rows={3}
                        placeholder="Describe your splash background... e.g., Fantasy castle on floating island, magical aurora in sky, cinematic lighting, high detail"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSplashBackgroundUpload}
                        className="hidden"
                        id="splash-bg-upload"
                      />
                      <Button
                      variant='generate'
                        onClick={generateSplashBackground}
                        disabled={splashConfig.splashBackgroundImageGenerating}
                        className="w-full py-2"
                      >
                        {splashConfig.splashBackgroundImageGenerating ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{splashConfig.splashBackgroundImageGenerating ? 'Generating...' : 'AI Generate'}</span>
                      </Button>
                      <label
                        htmlFor="splash-bg-upload"
                        className="flex items-center w-full cursor-pointer justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </label>
                      {splashConfig.splashBackgroundImage && (
                        <button
                          onClick={() => updateSplashConfig({ splashBackgroundImage: null })}
                          // className="flex items-center space-x-1  px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                          className="flex items-center w-full cursor-pointer justify-center gap-1 text-white py-2 px-1 bg-red-600 rounded-md transition-colors"
                        >
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    {splashConfig.splashBackgroundImage && (
                      <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50">
                        <img
                          src={splashConfig.splashBackgroundImage}
                          alt="Splash Background"
                          className="w-24 h-16 object-cover rounded"
                        />
                      </div>
                    )}

                  </div>

                  {/* Background Upload/Generate */}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        {/* Continue Button Configuration - Accordion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Continue Button</h3>
              </div>
            </div>

          <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-2 space-y-4">
                  {/* Continue Button Prompt */}
                  <div className='border p-2 bg-gray-50 rounded-md'>

                  <div className=''>
                    <textarea
                      value={splashConfig.continueButtonPrompt}
                      onChange={(e) => updateSplashConfig({ continueButtonPrompt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows={3}
                      placeholder="e.g., Premium casino continue button, 600x200 pixels, golden ornate frame with glowing edges, elegant 'CONTINUE' text, luxury aesthetic, transparent PNG"
                    />
                  </div>
                      <div className="flex space-x-2 ">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleContinueButtonUpload}
                          className="hidden"
                          id="continue-btn-upload"
                        />
                        <Button
                        variant='generate'
                          onClick={generateContinueButton}
                          disabled={splashConfig.continueButtonGenerating}
                          className="w-full py-2"
                        >
                          {splashConfig.continueButtonGenerating ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>{splashConfig.continueButtonGenerating ? 'Generating...' : 'AI Generate'}</span>
                        </Button>
                        <label
                          htmlFor="continue-btn-upload"
                          className="flex items-center w-full cursor-pointer justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </label>
                        {splashConfig.continueButton && (
                          <button
                            onClick={() => updateSplashConfig({ continueButton: null })}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                          >
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                       {splashConfig.continueButton && (
                        <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50">
                          <img
                            src={splashConfig.continueButton}
                            alt="Continue Button"
                            className="w-20 h-8 object-contain"
                            onLoad={() => console.log('[Step8] Continue button preview image loaded successfully')}
                            onError={(e) => console.error('[Step8] Continue button preview image failed to load:', e)}
                          />
                        </div>
                      )}
                  </div>


                  {/* Button Scale Control */}
                  {splashConfig.continueButton && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Scale: {Math.round(splashConfig.continueButtonScale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="2.0"
                        step="0.05"
                        value={splashConfig.continueButtonScale}
                        onChange={(e) => updateSplashConfig({ continueButtonScale: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />

                      {/* Quick Scale Presets */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Quick Presets (Base: 600x200px)</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateSplashConfig({ continueButtonScale: 0.5 })}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Small (300x100)
                          </button>
                          <button
                            onClick={() => updateSplashConfig({ continueButtonScale: 0.8 })}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            Medium (480x160)
                          </button>
                          <button
                            onClick={() => updateSplashConfig({ continueButtonScale: 1.0 })}
                            className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300"
                          >
                            Native (600x200)
                          </button>
                          <button
                            onClick={() => updateSplashConfig({ continueButtonScale: 1.5 })}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                            XL (900x300)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
          </AnimatePresence>
        </div>

        {/* Splash Layout Configuration - Accordion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Layout & Features</h3>
              </div>
            </div>

          <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-2 space-y-4">
                  {/* Layout Type Selection */}
                  <div className="border p-3 rounded-md bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          updateSplashConfig({ splashLayoutType: 'grid' });
                          setCurrentFeatureIndex(0);
                        }}
                        className={`p-2 rounded-lg border transition-all ${splashConfig.splashLayoutType === 'grid'
                          ? 'border-red-500 bg-red-50 text-gray-900'
                          : 'bg-white'
                          }`}
                      >
                        <div className="text-sm font-medium">Grid Layout</div>
                        <div className="text-xs text-gray-500 mt-1">
                          All features positioned freely
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          updateSplashConfig({ splashLayoutType: 'carousel' });
                          setCurrentFeatureIndex(0);
                        }}
                        className={`p-2 rounded-lg border transition-all ${splashConfig.splashLayoutType === 'carousel'
                          ? 'border-red-500 bg-red-50 text-gray-900'
                          : 'bg-white'
                          }`}
                      >
                        <div className="text-sm font-medium">Carousel</div>
                        <div className="text-xs text-gray-500 mt-1">
                          One feature per screen with navigation
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Mode Toggle */}
                  <div className="flex border rounded-md p-3 bg-gray-50 items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">Interactive Mode</div>
                      <div className="text-xs text-gray-500">Enable drag & drop positioning</div>
                    </div>
                    <button
                      onClick={() => updateSplashConfig({ interactiveMode: !splashConfig.interactiveMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${splashConfig.interactiveMode ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${splashConfig.interactiveMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Feature Management */}
                  <div className="border p-3 rounded-md bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Feature Cards ({(splashConfig.featureHighlights || []).length})
                      </label>
                      <button
                        onClick={() => {
                          const currentFeatures = splashConfig.featureHighlights || [];
                          const newFeature: FeatureCard = {
                            id: `feature_${Date.now()}`,
                            title: 'New Feature',
                            description: 'Feature description',
                            icon: '⭐',
                            image: null,
                            position: { x: 20 + (currentFeatures.length * 15), y: 20 + (currentFeatures.length * 15) },
                            size: { width: 120, height: 80 },
                            backgroundColor: '#4F46E5',
                            textColor: '#FFFFFF'
                          };
                          updateSplashConfig({
                            featureHighlights: [...currentFeatures, newFeature]
                          });
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                      >
                        Add Feature
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {(splashConfig.featureHighlights || []).map((feature, index) => (
                        <div key={feature?.id || index} className="flex border p-2 bg-white items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="text-sm">
                            <div className="font-medium">{feature?.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500">{feature?.description || 'No description'}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                // Create a file input for this specific feature
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      const currentFeatures = splashConfig.featureHighlights || [];
                                      const newFeatures = [...currentFeatures];
                                      newFeatures[index] = {
                                        ...newFeatures[index],
                                        image: e.target?.result as string
                                      };
                                      updateSplashConfig({ featureHighlights: newFeatures });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                              Image
                            </button>
                            <button
                              onClick={() => {
                                const newTitle = prompt('Feature Title:', feature?.title || 'New Feature');
                                const newDescription = prompt('Feature Description:', feature?.description || 'Feature description');
                                if (newTitle !== null && newDescription !== null) {
                                  const currentFeatures = splashConfig.featureHighlights || [];
                                  const newFeatures = [...currentFeatures];
                                  newFeatures[index] = {
                                    ...newFeatures[index],
                                    title: newTitle,
                                    description: newDescription
                                  };
                                  updateSplashConfig({ featureHighlights: newFeatures });
                                }
                              }}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                const currentFeatures = splashConfig.featureHighlights || [];
                                const newFeatures = currentFeatures.filter((_, i) => i !== index);
                                updateSplashConfig({ featureHighlights: newFeatures });
                              }}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
          </AnimatePresence>
        </div>

        {/* Asset Status & Testing - Accordion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
              className="w-full bg-gray-50 border-l-4 border-l-red-500 p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">Asset Loading & Testing</h3>
              </div>
            </div>

          <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-2  space-y-4">
                  {/* Asset Categories */}
                  <div className="space-y-2 mb-4 bg-gray-50 p-2 border rounded-md">
                    <h4 className="font-medium text-gray-800 mb-2">Loading Categories</h4>
                    {assetCategories.map((category, index) => (
                      <div
                        key={category.name}
                        className="flex items-center bg-white justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${category.status === 'complete' ? 'bg-green-500' :
                            category.status === 'loading' ? 'bg-yellow-500' :
                              category.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {category.loaded}/{category.total}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Test Controls */}
                  <div className="space-y-3 p-3 bg-gray-50 border rounded-md">
                    <h4 className="font-medium text-gray-800">Test Controls</h4>
                    <div className="flex space-x-2">
                      <Button
                      variant='generate'
                        onClick={() => {
                          setLoadingComplete(false);
                          startLoadingSequence();
                        }}
                        disabled={isLoading}
                        className="w-full py-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Test Loading</span>
                      </Button>
                      <Button
                      variant='uploadImage'
                        onClick={resetLoadingSequence}
                        className="w-full py-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                      </Button>
                    </div>

                    {isLoading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Loader className="w-3 h-3 animate-spin" />
                        <span className="text-xs font-medium">Testing loading sequence...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
          </AnimatePresence>
        </div>

        {/* Professional Guidelines */}
        {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <h3 className="text-sm font-bold mb-2 flex items-center text-blue-800">
            <CheckCircle className="mr-1" size={16} />
            Professional Guidelines
          </h3>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• <strong>First Impression Excellence:</strong> AAA-quality loading experiences</p>
            <p>• <strong>Performance Optimized:</strong> Real asset loading simulation</p>
            <p>• <strong>Device Adaptive:</strong> Mobile vs desktop optimization</p>
            <p>• <strong>Brand Consistency:</strong> Theme-matched animations and colors</p>
            <p>• <strong>Industry Standards:</strong> Pragmatic Play / NetEnt patterns</p>
            <p>• <strong>Live Testing:</strong> Real-time preview with slot integration</p>
          </div>
        </div> */}
      </div>
    </div>

      {/* Right Panel - Live Preview */ }
  <div className="w-1/2 p-6"> 
    <div className="h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {showFullJourney ? `Journey Preview - ${journeyPhase.charAt(0).toUpperCase() + journeyPhase.slice(1)}` : 'Live Preview'}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {deviceMode === 'mobile' ? (
            <>
              <Smartphone className="w-4 h-4" />
              <span>Mobile View</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4" />
              <span>Desktop View</span>
            </>
          )}
          {isLoading && <Loader className="w-4 h-4 animate-spin text-blue-400" />}
        </div>
      </div>

      {/* Preview Container - Full Height */}
      <div className="relative bg-gray-900 rounded-lg  h-full">
        {showFullJourney ? (
          /* Full Journey Preview Mode */
          <>
            {journeyPhase === 'loading' && (
              <ProfessionalLoadingPreview
                loadingConfig={{
                  studioLogo: journeyTransfer.getLoadingConfig().studioLogo,
                  studioLogoSize: journeyTransfer.getLoadingConfig().studioLogoSize,
                  studioLogoPosition: journeyTransfer.getLoadingConfig().studioLogoPosition,
                  progressStyle: journeyTransfer.getLoadingConfig().progressStyle,
                  backgroundColor: journeyTransfer.getLoadingConfig().backgroundColor,
                  textColor: journeyTransfer.getLoadingConfig().textColor,
                  accentColor: journeyTransfer.getLoadingConfig().accentColor,
                  loadingSprite: journeyTransfer.getLoadingConfig().loadingSprite,
                  spriteAnimation: journeyTransfer.getLoadingConfig().spriteAnimation,
                  spriteSize: journeyTransfer.getLoadingConfig().spriteSize,
                  spritePosition: journeyTransfer.getLoadingConfig().spritePosition,
                  loadingTips: journeyTransfer.getLoadingConfig().loadingTips,
                  showPercentage: journeyTransfer.getLoadingConfig().showPercentage,
                  percentagePosition: journeyTransfer.getLoadingConfig().percentagePosition,
                  progressBarPosition: journeyTransfer.getLoadingConfig().progressBarPosition,
                  progressBarWidth: journeyTransfer.getLoadingConfig().progressBarWidth,
                  customMessage: journeyTransfer.getLoadingConfig().customMessage,
                  customMessagePosition: journeyTransfer.getLoadingConfig().customMessagePosition,
                  customMessageSize: journeyTransfer.getLoadingConfig().customMessageSize
                }}
                loadingProgress={loadingProgress}
                currentPhase={currentPhase}
                deviceMode={deviceMode}
                loadingPhases={loadingPhases}
                assetCategories={assetCategories}
                isLoading={isLoading}
              />
            )}

            {journeyPhase === 'splash' && (
              <div
                className="absolute inset-0 z-10 "
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: splashConfig.splashBackground || '#2D1B69'
                }}
              >
                <GameExplanationScreen />
              </div>
            )}

            {journeyPhase === 'game' && (
              <GridPreviewWrapper
                className="w-full h-full"
                viewMode="desktop"
                showControls={false}
              />
            )}

            {/* Journey Phase Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                <button
                  onClick={() => setJourneyPhase('loading')}
                  className={`px-3 py-1 text-xs rounded ${journeyPhase === 'loading' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
                >
                  Loading
                </button>
                <ChevronRight className="w-3 h-3 text-white" />
                <button
                  onClick={() => setJourneyPhase('splash')}
                  className={`px-3 py-1 text-xs rounded ${journeyPhase === 'splash' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
                >
                  Splash
                </button>
                <ChevronRight className="w-3 h-3 text-white" />
                <button
                  onClick={() => setJourneyPhase('game')}
                  className={`px-3 py-1 text-xs rounded ${journeyPhase === 'game' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}
                >
                  Game
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Standard Preview Mode */
          <>
            {/* Always show PixiJS Slot Preview as base */}
            <GridPreviewWrapper
              className="w-full h-full"
              viewMode="desktop"
              showControls={false}
            />

            {/* Splash Screen Overlay - shows during loading test */}
            {(isLoading || !loadingComplete) && (
              <div
                className="absolute inset-0 z-10"
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'rgba(0, 0, 0, 0.95)'
                }}
              >
                <SplashScreenPreview />
              </div>
            )}

            {/* Game Explanation Screen - shows after loading completes if splash is enabled */}
            {showGameExplanation && (
              <div
                className="absolute inset-0 z-10"
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: splashConfig.splashBackground || '#2D1B69'
                }}
              >
                <GameExplanationScreen />
              </div>
            )}

            {/* Loading complete and no active loading test - show "Test Splash" button */}
            {!isLoading && loadingComplete && !showGameExplanation && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => {
                    setLoadingComplete(false);
                    startLoadingSequence();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Test Loading</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
    </div >
  );
};

export default Step10_SplashPreloader;