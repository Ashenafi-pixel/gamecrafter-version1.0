import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader, Monitor, Smartphone, Timer, Volume2, VolumeX,
  Upload, Sparkles, CheckCircle, AlertCircle, Settings,
  RotateCcw, Play, Pause, ChevronRight, ChevronLeft
} from 'lucide-react';
import { PremiumSlotPreview } from '../../shared/PremiumSlotPreview';
import ProfessionalLoadingPreview from '../shared/ProfessionalLoadingPreview';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { saveImage } from '../../../utils/imageSaver';
import { useGameStore } from '../../../store';
import { useJourneyTransfer } from '../shared/LoadingJourneyStore';
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

interface AssetCategory {
  name: string;
  files: string[];
  loaded: number;
  total: number;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

interface LoadingConfig {
  // Studio Logo Configuration
  studioLogo: string | null;
  studioLogoSize: number;
  studioLogoPrompt: string;
  studioLogoGenerating: boolean;
  studioLogoPosition: { x: number; y: number };

  // Loading Configuration
  showProgress: boolean;
  progressStyle: 'bar' | 'circular';
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
  spriteSize: number;
  spritePosition: 'in-bar' | 'above-bar' | 'below-bar' | 'left-side' | 'right-side';
  hideProgressFill: boolean;
  showPercentage: boolean;
  percentagePosition: 'above' | 'below' | 'right' | 'center';
  progressBarPosition: { x: number; y: number };
  progressBarWidth: number;
  customMessage: string;
  customMessagePosition: { x: number; y: number };
  customMessageSize: number;
}

const Step9_LoadingExperience: React.FC = () => {
  const { config } = useGameStore();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Journey Transfer Integration
  const journeyTransfer = useJourneyTransfer();

  const [loadingConfig, setLoadingConfig] = useState<LoadingConfig>({
    // Studio Logo Configuration
    studioLogo: null,
    studioLogoSize: 80,
    studioLogoPrompt: 'Professional gaming studio logo, modern design, elegant typography, premium casino aesthetic',
    studioLogoGenerating: false,
    studioLogoPosition: { x: 50, y: 15 },

    // Loading Configuration
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
    showPercentage: true,
    percentagePosition: 'above',
    progressBarPosition: { x: 50, y: 65 },
    progressBarWidth: 60,
    customMessage: 'GameStudio™ - 2024',
    customMessagePosition: { x: 50, y: 90 },
    customMessageSize: 14
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
      duration: 4000
    },
    {
      id: 'audio',
      name: 'Loading Audio',
      description: 'Setting up sounds and music...',
      percentage: 0,
      color: '#10b981',
      icon: <Volume2 className="w-4 h-4" />,
      duration: 3500
    },
    {
      id: 'ui',
      name: 'Preparing Interface',
      description: 'Configuring user interface...',
      percentage: 0,
      color: '#f59e0b',
      icon: <Monitor className="w-4 h-4" />,
      duration: 3000
    },
    {
      id: 'engine',
      name: 'Starting Game Engine',
      description: 'Initializing game mechanics...',
      percentage: 0,
      color: '#ef4444',
      icon: <Sparkles className="w-4 h-4" />,
      duration: 2500
    }
  ];

  const updateLoadingConfig = (updates: Partial<LoadingConfig>) => {
    setLoadingConfig(prev => {
      const newConfig = { ...prev, ...updates };

      // Transfer loading config to journey store for Step 9 to access
      journeyTransfer.transferFromLoadingStep({
        studioLogo: newConfig.studioLogo,
        studioLogoSize: newConfig.studioLogoSize,
        studioLogoPosition: newConfig.studioLogoPosition,
        progressStyle: newConfig.progressStyle,
        backgroundColor: newConfig.backgroundColor,
        textColor: newConfig.textColor,
        accentColor: newConfig.accentColor,
        loadingSprite: newConfig.loadingSprite,
        spriteAnimation: newConfig.spriteAnimation,
        spriteSize: newConfig.spriteSize,
        spritePosition: newConfig.spritePosition,
        loadingTips: newConfig.loadingTips,
        audioEnabled: newConfig.audioEnabled,
        minimumDisplayTime: newConfig.minimumDisplayTime,
        showPercentage: newConfig.showPercentage,
        percentagePosition: newConfig.percentagePosition,
        progressBarPosition: newConfig.progressBarPosition,
        progressBarWidth: newConfig.progressBarWidth,
        customMessage: newConfig.customMessage,
        customMessagePosition: newConfig.customMessagePosition,
        customMessageSize: newConfig.customMessageSize
      });

      return newConfig;
    });
  };

  const startLoadingSequence = useCallback(() => {
    setIsLoading(true);
    setLoadingProgress(0);
    setCurrentPhase(0);

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
      const phaseDuration = loadingPhases[phaseIndex]?.duration || 1500;

      if (phaseIndex >= loadingPhases.length) {
        setIsLoading(false);
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
        }
        return;
      }

      const phaseProgress = Math.min(elapsed / phaseDuration, 1);
      const easedProgress = phaseProgress < 0.5
        ? 2 * phaseProgress * phaseProgress
        : 1 - Math.pow(-2 * phaseProgress + 2, 3) / 2;

      const targetProgress = (phaseIndex + easedProgress) * (100 / loadingPhases.length);
      currentProgress += (targetProgress - currentProgress) * 0.15;
      setLoadingProgress(currentProgress);

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

      if (phaseProgress >= 1) {
        phaseIndex++;
        setCurrentPhase(phaseIndex);
        startTime = Date.now();
      }
    };

    loadingIntervalRef.current = setInterval(simulateLoading, 33);
  }, []);

  const resetLoadingSequence = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    setIsLoading(false);
    setLoadingProgress(0);
    setCurrentPhase(0);

    setAssetCategories(cats => cats.map(cat => ({
      ...cat,
      loaded: 0,
      status: 'pending' as const
    })));
  }, []);

  const handleStudioLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateLoadingConfig({ studioLogo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStudioLogo = async () => {
    updateLoadingConfig({ studioLogoGenerating: true });

    try {
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: loadingConfig.studioLogoPrompt,
        targetSymbolId: `studio_logo_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];

        try {
          await saveImage(imageUrl, 'studio_logo', `studio_logo_${Date.now()}`, config?.gameId);
        } catch (saveError) {
          console.warn('Failed to save logo to server:', saveError);
        }

        updateLoadingConfig({
          studioLogo: imageUrl,
          studioLogoGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Studio logo generation failed:', error);
      alert('Failed to generate studio logo. Please check your internet connection and try again.');
      updateLoadingConfig({ studioLogoGenerating: false });
    }
  };

  const handleLoadingSpriteUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateLoadingConfig({ loadingSprite: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLoadingSprite = async () => {
    updateLoadingConfig({ spriteGenerating: true });

    try {
      const result = await enhancedOpenaiClient.generateImageWithConfig({
        prompt: loadingConfig.spritePrompt,
        targetSymbolId: `loading_sprite_${Date.now()}`,
        gameId: config?.gameId
      });

      if (result?.success && result?.images && result.images.length > 0) {
        const imageUrl = result.images[0];

        try {
          await saveImage(imageUrl, 'loading_sprite', `loading_sprite_${Date.now()}`, config?.gameId);
        } catch (saveError) {
          console.warn('Failed to save sprite to server:', saveError);
        }

        updateLoadingConfig({
          loadingSprite: imageUrl,
          spriteGenerating: false
        });
      } else {
        throw new Error('No images generated or API returned error');
      }
    } catch (error) {
      console.error('Loading sprite generation failed:', error);
      alert('Failed to generate loading sprite. Please check your internet connection and try again.');
      updateLoadingConfig({ spriteGenerating: false });
    }
  };

  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex">
      {/* Left Panel - Loading Experience Configuration (50%) */}
      <div className="w-1/2 overflow-y-auto ">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 border-l-4 border-l-red-500 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Loading Experience</h2>
            <p className="text-gray-600">Design professional loading screens and progress indicators</p>
          </div>
        </div>
        <div className='bg-white p-3 space-y-3 border-r border-gray-200'>
          {/* Device Mode Toggle */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center ">
              Preview Mode
            </h3>
            <div className="flex items-center justify-center space-x-1">
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
          {/* Studio Logo Configuration */}
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-1">
              Studio Logo
            </h3>

            <div className="space-y-2 ">
              <div className='border p-2 space-y-2 rounded-md'>
                <div>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                    Studio Logo Prompt
                  </label> */}
                  <textarea
                    value={loadingConfig.studioLogoPrompt}
                    onChange={(e) => updateLoadingConfig({ studioLogoPrompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={2}
                    placeholder="Professional gaming studio logo, modern design..."
                  />
                </div>
                <div className="flex space-x-2">
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
                    disabled={loadingConfig.studioLogoGenerating}
                    className='w-full py-2'
                  >
                    {loadingConfig.studioLogoGenerating ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{loadingConfig.studioLogoGenerating ? 'Generating...' : 'AI Generate'}</span>
                  </Button>
                  <label
                    htmlFor="studio-logo-upload"
                    className="flex items-center w-full  justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </label>
                </div>
                {loadingConfig.studioLogo && (
                  <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <img src={loadingConfig.studioLogo} alt="Studio Logo" className="w-20 h-20 object-contain" />
                  </div>
                )}
              </div>

              <div className=' space-y-2'>
                {/* logo size  */}
                <div className='p-2 border bg-white rounded-md'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo Size: {loadingConfig.studioLogoSize}px
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    step="10"
                    value={loadingConfig.studioLogoSize}
                    onChange={(e) => updateLoadingConfig({ studioLogoSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className=" gap-4 flex">
                  <div className='p-2 border bg-white rounded-md w-full'>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo Position - Horizontal: {loadingConfig.studioLogoPosition.x}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={loadingConfig.studioLogoPosition.x}
                      onChange={(e) => updateLoadingConfig({
                        studioLogoPosition: {
                          ...loadingConfig.studioLogoPosition,
                          x: parseInt(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>

                  <div className='p-2 border bg-white rounded-md w-full'>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo Position - Vertical: {loadingConfig.studioLogoPosition.y}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={loadingConfig.studioLogoPosition.y}
                      onChange={(e) => updateLoadingConfig({
                        studioLogoPosition: {
                          ...loadingConfig.studioLogoPosition,
                          y: parseInt(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Progress Style Configuration */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              Progress Style
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {['bar', 'circular'].map((style) => (
                <button
                  key={style}
                  onClick={() => updateLoadingConfig({ progressStyle: style as any })}
                  className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out
                   ${loadingConfig.progressStyle === style
                      ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                    }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-4  rounded-md">
              <div className='p-2 bg-white border rounded-md w-full'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <input
                  type="color"
                  value={loadingConfig.backgroundColor}
                  onChange={(e) => updateLoadingConfig({ backgroundColor: e.target.value })}
                  className="w-full cursor-pointer h-10 rounded border border-gray-300"
                />
              </div>

              <div className='p-2 bg-white border rounded-md w-full'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={loadingConfig.accentColor}
                  onChange={(e) => updateLoadingConfig({ accentColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer border border-gray-300"
                />
              </div>
            </div>
          </div>
          {/* Progress Bar Positioning */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
              Progress Bar Position
            </h3>

            <div className="space-y-4">
              <div className='border bg-white p-2 rounded-md'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Bar Width: {loadingConfig.progressBarWidth}%
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={loadingConfig.progressBarWidth}
                  onChange={(e) => updateLoadingConfig({ progressBarWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className='flex gap-4'>

                <div className='border bg-white p-2 rounded-md w-full'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horizontal Position: {loadingConfig.progressBarPosition.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={loadingConfig.progressBarPosition.x}
                    onChange={(e) => updateLoadingConfig({
                      progressBarPosition: {
                        ...loadingConfig.progressBarPosition,
                        x: parseInt(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                </div>

                <div className='border bg-white p-2 rounded-md w-full'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vertical Position: {loadingConfig.progressBarPosition.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={loadingConfig.progressBarPosition.y}
                    onChange={(e) => updateLoadingConfig({
                      progressBarPosition: {
                        ...loadingConfig.progressBarPosition,
                        y: parseInt(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                </div>

              </div>

            </div>
          </div>
          {/* Loading Sprite Configuration */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              Loading Sprite
            </h3>

            <div className="space-y-2">
              <div className='space-y-2 p-2 rounded-md border'>
                <div>
                  <textarea
                    value={loadingConfig.spritePrompt}
                    onChange={(e) => updateLoadingConfig({ spritePrompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={2}
                    placeholder="Golden nugget with metallic texture, 3D rendered..."
                  />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLoadingSpriteUpload}
                    className="hidden"
                    id="loading-sprite-upload"
                  />
                  <Button
                    variant='generate'
                    onClick={generateLoadingSprite}
                    disabled={loadingConfig.spriteGenerating}
                    className="w-full"
                  >
                    {loadingConfig.spriteGenerating ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{loadingConfig.spriteGenerating ? 'Generating...' : 'AI Generate'}</span>
                  </Button>
                  <label
                    htmlFor="loading-sprite-upload"
                    className="flex items-center w-full  justify-center gap-1 border border-gray-300 hover:bg-gray-100 py-2 px-1 bg-white rounded-md transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </label>
                </div>
                {loadingConfig.loadingSprite && (
                  <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <img src={loadingConfig.loadingSprite} alt="Loading Sprite" className="w-16 h-16 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animation
                    </label>
                    <select
                      value={loadingConfig.spriteAnimation}
                      onChange={(e) => updateLoadingConfig({ spriteAnimation: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="roll">Roll</option>
                      <option value="spin">Spin</option>
                      <option value="bounce">Bounce</option>
                      <option value="pulse">Pulse</option>
                      <option value="slide">Slide</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <select
                      value={loadingConfig.spritePosition}
                      onChange={(e) => updateLoadingConfig({ spritePosition: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="in-bar">Progress Indicator (Follows Progress)</option>
                      <option value="above-bar">Above Bar</option>
                      <option value="below-bar">Below Bar</option>
                      <option value="left-side">Left Side</option>
                      <option value="right-side">Right Side</option>
                    </select>
                  </div>
                </div>

                <div className='border bg-white rounded-md p-2'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sprite Size: {loadingConfig.spriteSize}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={loadingConfig.spriteSize}
                    onChange={(e) => updateLoadingConfig({ spriteSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Percentage Display Configuration */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              Percentage Display
            </h3>

            <div className="space-y-4">
              <div className="flex items-center border p-2 rounded-md bg-white justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Show Percentage</span>
                  <p className="text-xs text-gray-500">Display loading progress percentage</p>
                </div>
                <button
                  onClick={() => updateLoadingConfig({ showPercentage: !loadingConfig.showPercentage })}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${loadingConfig.showPercentage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {loadingConfig.showPercentage ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {loadingConfig.showPercentage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage Position
                  </label>
                  <div className={`grid gap-2 ${loadingConfig.progressStyle === 'circular' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {['above', 'below', 'right'].map((position) => (
                      <button
                        key={position}
                        onClick={() => updateLoadingConfig({ percentagePosition: position as any })}
                        className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out
                   ${loadingConfig.percentagePosition === position
                            ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                          }`}
                      >
                        {position.charAt(0).toUpperCase() + position.slice(1)}
                      </button>
                    ))}
                    {loadingConfig.progressStyle === 'circular' && (
                      <button
                        onClick={() => updateLoadingConfig({ percentagePosition: 'center' as any })}
                        className={`p-2 flex justify-center items-center rounded-lg border transition-all duration-200 ease-in-out
                   ${loadingConfig.percentagePosition === 'center'
                            ? ' border-blue-500 bg-gray-50 shadow-md font-semibold text-gray-900'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm text-gray-700'
                          }`}
                      >
                        Center
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Custom Message Configuration */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              Custom Message
            </h3>

            <div className="space-y-4">

              <div className='border p-2 rounded-md'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Text (e.g., "GameStudio™ - 2024")
                </label>
                <input
                  type="text"
                  value={loadingConfig.customMessage}
                  onChange={(e) => updateLoadingConfig({ customMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="GameStudio™ - 2024"
                />
              </div>
              <div className='border p-2 rounded-md bg-white'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size: {loadingConfig.customMessageSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={loadingConfig.customMessageSize}
                  onChange={(e) => updateLoadingConfig({ customMessageSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className='flex gap-4'>
                <div className='border p-2 rounded-md bg-white w-full'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horizontal Position: {loadingConfig.customMessagePosition.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={loadingConfig.customMessagePosition.x}
                    onChange={(e) => updateLoadingConfig({
                      customMessagePosition: {
                        ...loadingConfig.customMessagePosition,
                        x: parseInt(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                </div>
                <div className='border p-2 rounded-md bg-white w-full'>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vertical Position: {loadingConfig.customMessagePosition.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={loadingConfig.customMessagePosition.y}
                    onChange={(e) => updateLoadingConfig({
                      customMessagePosition: {
                        ...loadingConfig.customMessagePosition,
                        y: parseInt(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                </div>
              </div>

            </div>
          </div>
          {/* Test Controls */}
          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
              Test Loading Experience
            </h3>

            <div className="flex space-x-2">
              <Button
              variant='generate'
                onClick={startLoadingSequence}
                disabled={isLoading}
                className='w-full py-2'
              >
                <Play className="w-4 h-4" />
                <span>Start Loading Test</span>
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Loading simulation in progress... {Math.round(loadingProgress)}% complete
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Professional PIXI Preview (50%) */}
      <div className="w-1/2">
        <div className="h-full">
          <ProfessionalLoadingPreview
            loadingProgress={loadingProgress}
            currentPhase={currentPhase}
            assetCategories={assetCategories}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Step9_LoadingExperience;