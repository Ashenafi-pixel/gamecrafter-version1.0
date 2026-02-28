import React, { useState, useEffect, useCallback, useRef } from 'react';

import {

  Loader, Monitor, Smartphone, Timer, Volume2, VolumeX,

  Upload, Sparkles, CheckCircle, AlertCircle, Settings,

  RotateCcw, Play, Pause, ChevronRight, ChevronLeft

} from 'lucide-react';

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

  const {

    config,

    setStudioLogo,

    setLoadingSprite,

    updateStudioLogoPosition,

    updateStudioLogoSize,

    updateLoadingSpriteConfig,

    updateProgressBarConfig,

    updateCustomMessageConfig,

    updatePercentagePosition

  } = useGameStore();

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const [loadingProgress, setLoadingProgress] = useState(0);

  const [currentPhase, setCurrentPhase] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const previewRef = useRef<{ setViewMode: (mode: 'desktop' | 'mobile') => void } | null>(null);



  // Journey Transfer Integration

  const journeyTransfer = useJourneyTransfer();

  const defaultStudioLogoPrompt = `Create a PROFESSIONAL GAME STUDIO LOGO.



WHAT THIS IMAGE IS:

- A clean studio logo shown during loading screens

- Designed for quick recognition



WHAT THIS IMAGE IS NOT:

- Not a detailed illustration

- Not a scene

- Not a UI mockup



STYLE:

- Modern, elegant, premium gaming aesthetic

- Strong typography or symbol

- Balanced composition

- Works on dark and light backgrounds



DESIGN RULES:

- High contrast

- Bold shapes

- Minimal but distinctive

- No excessive textures or noise



TECHNICAL:

- PNG with transparent background

- Centered logo

- Scales cleanly to small sizes



Goal: a confident, premium studio logo suitable for casino and game loading screens.`

  // Default configuration template

  const getDefaultConfig = (): LoadingConfig => ({

    // Studio Logo Configuration

    studioLogo: null,

    studioLogoSize: 80,

    userPrompt: '',

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



    loadingSprite: null,

    spriteGenerating: false,

    spritePrompt: `Create a SINGLE game sprite asset: a golden nugget.



WHAT THIS IMAGE IS:

- A collectible-style sprite used in slot animations or effects

- Designed to be layered over backgrounds



WHAT THIS IMAGE IS NOT:

- Not a background

- Not a scene

- Not a logo

- Not a UI panel



STYLE:

- Metallic gold material

- Natural nugget shape (irregular, organic)

- Subtle surface imperfections

- Clean 3D-rendered look

- Premium casino polish



COMPOSITION:

- Single object only

- Centered with clean padding

- Strong silhouette



TECHNICAL:

- PNG with transparent background

- Clean alpha edges (no glow halos)

- High resolution, suitable for scaling



QUALITY RAILS:

- No text

- No symbols

- No environment elements



Goal: a clean, premium gold nugget sprite suitable for slot game animations.`,

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



  const [desktopConfig, setDesktopConfig] = useState<LoadingConfig>(getDefaultConfig());

  const [mobileConfig, setMobileConfig] = useState<LoadingConfig>(() => {

    const mobileDefaults = getDefaultConfig();

    return {

      ...mobileDefaults,

      studioLogoSize: 60, // Smaller logo for mobile

      progressBarWidth: 80, // Wider progress bar for mobile

      progressBarPosition: { x: 50, y: 70 }, // Lower position for mobile

      customMessageSize: 12, // Smaller text for mobile

      customMessagePosition: { x: 50, y: 85 }, // Adjusted position for mobile

      spriteSize: 35, // Smaller sprite for mobile

    };

  });



  const [savedLogos, setSavedLogos] = useState<Array<{ name: string; url: string }>>([]);

  const [studioLogoOriginal, setStudioLogoOriginal] = useState<string | null>(null);

  const [savedConfigs, setSavedConfigs] = useState<Array<{ name: string; config: LoadingConfig }>>([]);

  const [configName, setConfigName] = useState('');

  const [showSaveDialog, setShowSaveDialog] = useState(false);



  const getCurrentConfig = (): LoadingConfig => {

    return deviceMode === 'desktop' ? desktopConfig : mobileConfig;

  };



  const loadingConfig = getCurrentConfig();



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

    if (typeof updates.percentagePosition !== 'undefined') {

      updatePercentagePosition({ percentagePosition: updates.percentagePosition });

    }

    if (deviceMode === 'desktop') {

      setDesktopConfig(prev => {

        const newConfig = { ...prev, ...updates };

        transferConfigToJourney(newConfig);

        return newConfig;

      });

    } else {

      setMobileConfig(prev => {

        const newConfig = { ...prev, ...updates };

        transferConfigToJourney(newConfig);

        return newConfig;

      });

    }

  };



  const transferConfigToJourney = (config: LoadingConfig) => {

    journeyTransfer.transferFromLoadingStep({

      studioLogo: config.studioLogo,

      studioLogoSize: config.studioLogoSize,

      studioLogoPosition: config.studioLogoPosition,

      progressStyle: config.progressStyle,

      backgroundColor: config.backgroundColor,

      textColor: config.textColor,

      accentColor: config.accentColor,

      loadingSprite: config.loadingSprite,

      spriteAnimation: config.spriteAnimation,

      spriteSize: config.spriteSize,

      spritePosition: config.spritePosition,

      loadingTips: config.loadingTips,

      audioEnabled: config.audioEnabled,

      minimumDisplayTime: config.minimumDisplayTime,

      showPercentage: config.showPercentage,

      percentagePosition: config.percentagePosition,

      progressBarPosition: config.progressBarPosition,

      progressBarWidth: config.progressBarWidth,

      customMessage: config.customMessage,

      customMessagePosition: config.customMessagePosition,

      customMessageSize: config.customMessageSize

    });

  };



  const handleDeviceModeChange = (newMode: 'desktop' | 'mobile') => {

    setDeviceMode(newMode);



    if (previewRef.current) {

      previewRef.current.setViewMode(newMode);

    }



    const configToTransfer = newMode === 'desktop' ? desktopConfig : mobileConfig;

    transferConfigToJourney(configToTransfer);

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

        const imageUrl = e.target?.result as string;

        updateLoadingConfig({ studioLogo: imageUrl });

        setStudioLogoOriginal(imageUrl);

        setStudioLogo(imageUrl);

      };

      reader.readAsDataURL(file);

    }

  };



  const generateStudioLogo = async () => {

    updateLoadingConfig({ studioLogoGenerating: true });



    try {

      const result = await enhancedOpenaiClient.generateImageWithConfig({

        prompt: `${defaultStudioLogoPrompt}\n\nUser specifications: ${loadingConfig.studioLogoPrompt}`,

        targetSymbolId: `studio_logo_${Date.now()}`,

        gameId: config?.gameId

      });



      if (result?.success && result?.images && result.images.length > 0) {

        const imageUrl = result.images[0];

        // Keep a copy of the original image URL returned by the API so we can download it exactly later

        setStudioLogoOriginal(imageUrl);



        try {

          await saveImage(imageUrl, 'studio_logo', `studio_logo_${Date.now()}`, config?.gameId);

        } catch (saveError) {

          console.warn('Failed to save logo to server:', saveError);

        }



        updateLoadingConfig({

          studioLogo: imageUrl,

          studioLogoGenerating: false

        });



        // Save to main store

        setStudioLogo(imageUrl);



        // Add to saved logos collection

        const logoName = `Logo ${savedLogos.length + 1}`;

        setSavedLogos(prev => [...prev, { name: logoName, url: imageUrl }]);

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

        const imageUrl = e.target?.result as string;

        updateLoadingConfig({ loadingSprite: imageUrl });

        setLoadingSprite(imageUrl);

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



        // Save to main store

        setLoadingSprite(imageUrl);

      } else {

        throw new Error('No images generated or API returned error');

      }

    } catch (error) {

      console.error('Loading sprite generation failed:', error);

      alert('Failed to generate loading sprite. Please check your internet connection and try again.');

      updateLoadingConfig({ spriteGenerating: false });

    }

  };



  // Initial sync with preview component

  useEffect(() => {

    if (previewRef.current) {

      previewRef.current.setViewMode(deviceMode);

    }

    // Transfer initial config to journey store

    const initialConfig = deviceMode === 'desktop' ? desktopConfig : mobileConfig;

    transferConfigToJourney(initialConfig);

  }, []);



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

            <h2 className="text-lg uw:text-3xl font-semibold text-gray-900">Loading Experience</h2>

            <p className="text-gray-600 uw:text-2xl">Design professional loading screens and progress indicators</p>

          </div>

        </div>



        {/* Saved Configs Carousel */}

        {savedConfigs.length > 0 && (

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">

            <div className="flex items-center justify-between bg-gray-50 rounded-t-lg border-b border-gray-200">

              <div className="px-4 py-3 flex items-center gap-2 border-l-4 border-l-blue-500">

                <h3 className="text-lg uw:text-2xl font-semibold text-gray-800">Saved Configurations</h3>

                <div className="text-sm uw:text-xl text-gray-600">

                  <span className="font-medium">{savedConfigs.length}</span> saved

                </div>

              </div>

              <div className="text-sm uw:text-2xl bg-gray-50 text-gray-500 mr-4">

                Click to load configuration

              </div>

            </div>



            <div className="p-4">

              <div className="flex items-center gap-2">

                <button

                  className="flex-shrink-0 p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"

                >

                  <ChevronLeft className="w-4 h-4 uw:w-6 uw:h-6" />

                </button>



                <div className="flex-1 overflow-hidden">

                  <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">

                    {savedConfigs.map((savedConfig, index) => (

                      <div

                        key={index}

                        onClick={() => {

                          if (deviceMode === 'desktop') {

                            setDesktopConfig(savedConfig.config);

                          } else {

                            setMobileConfig(savedConfig.config);

                          }

                          transferConfigToJourney(savedConfig.config);

                        }}

                        className="w-[120px] h-[120px] bg-white rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-300 hover:border-blue-300 flex-shrink-0"

                      >

                        {/* Config Preview Area */}

                        <div className="relative w-full h-[90px] bg-gray-50 rounded-t-lg flex items-center justify-center overflow-hidden">

                          {savedConfig.config.studioLogo ? (

                            <img

                              src={savedConfig.config.studioLogo}

                              alt={savedConfig.name}

                              className="w-full h-full object-contain p-3 uw:w-40 uw:h-40"

                            />

                          ) : (

                            <div className="flex flex-col items-center text-gray-400">

                              <Settings className="w-8 h-8 mb-1" />

                              <span className="text-xs uw:text-xl">Config</span>

                            </div>

                          )}

                        </div>



                        {/* Config Info */}

                        <div className="h-[30px] py-1 flex items-center justify-center">

                          <span className="text-xs uw:text-xl font-medium text-gray-700 truncate">

                            {savedConfig.name}

                          </span>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>



                <button

                  className="flex-shrink-0 p-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"

                >

                  <ChevronRight className="w-4 h-4 uw:w-6 uw:h-6" />

                </button>

              </div>

            </div>

          </div>

        )}

        <div className='bg-white p-3 space-y-3 border-r border-gray-200'>

          {/* Device Mode Toggle */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-2xl font-bold text-gray-900 flex items-center ">

              Preview Mode

            </h3>

            <div className="flex items-center justify-center space-x-1">

              <div className="bg-gray-200 p-1 gap-2 uw:gap-2 rounded-lg flex">

                <button

                  onClick={() => handleDeviceModeChange('desktop')}

                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm uw:text-xl  font-medium transition-all ${deviceMode === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'

                    }`}

                >

                  <Monitor className="w-4 h-4 uw:w-6 uw:h-6 uw:mr-3" />

                  <span>Desktop</span>

                </button>

                <button

                  onClick={() => handleDeviceModeChange('mobile')}

                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm uw:text-xl font-medium transition-all ${deviceMode === 'mobile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-800'

                    }`}

                >

                  <Smartphone className="w-4 h-4 uw:w-6 uw:h-6" />

                  <span>Mobile</span>

                </button>

              </div>

            </div>

            {/* Debug info */}

            <div className="mt-2 p-2 flex justify-center items-center gap-4 bg-blue-50 rounded text-xs uw:text-xl text-blue-700">

              {/* <div>Current Mode: <strong>{deviceMode}</strong></div> */}

              <div>Logo Size: <strong>{loadingConfig.studioLogoSize}px</strong></div>

              <div>Progress Width: <strong>{loadingConfig.progressBarWidth}%</strong></div>

              <div>Sprite Size: <strong>{loadingConfig.spriteSize}px</strong></div>

            </div>

          </div>

          {/* Studio Logo Configuration */}

          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-2xl font-bold text-gray-900 flex items-center mb-1">

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

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-xl"

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

                    <div className="relative group">

                      <img

                        src={loadingConfig.studioLogo}

                        alt="Studio Logo"

                        className="w-20 h-20 uw:w-40 uw:h-40  object-contain"

                      />



                      {/* Hover overlay for download */}

                      <button

                        title="Download original / full HD fallback"

                        onClick={async () => {

                          // Prefer downloading the original image if we have it

                          const original = studioLogoOriginal || (loadingConfig.studioLogo as string);

                          if (!original) return;



                          const tryDownloadBlob = async (url: string) => {

                            // try to fetch the original bytes and save them directly

                            try {

                              const resp = await fetch(url, { mode: 'cors' });

                              if (!resp.ok) throw new Error('Network response not ok');

                              const blob = await resp.blob();



                              // determine extension from blob type

                              const ext = blob.type && blob.type.split('/')[1] ? blob.type.split('/')[1] : 'png';

                              const a = document.createElement('a');

                              const downloadUrl = URL.createObjectURL(blob);

                              a.href = downloadUrl;

                              a.download = `studio_logo_${Date.now()}_original.${ext}`;

                              document.body.appendChild(a);

                              a.click();

                              a.remove();

                              URL.revokeObjectURL(downloadUrl);

                              return true;

                            } catch (e) {

                              console.warn('Direct download failed, will fallback to canvas export', e);

                              return false;

                            }

                          };



                          // If original is a data URL, we can directly trigger download without fetch

                          if (original.startsWith('data:')) {

                            const a = document.createElement('a');

                            a.href = original;

                            a.download = `studio_logo_${Date.now()}_original.png`;

                            document.body.appendChild(a);

                            a.click();

                            a.remove();

                            return;

                          }



                          const directOk = await tryDownloadBlob(original);

                          if (directOk) return;



                          // Fallback: perform canvas export to full HD (1920x1080)

                          try {

                            const resp = await fetch(loadingConfig.studioLogo as string);

                            const blob = await resp.blob();

                            const img = await new Promise<HTMLImageElement>((resolve, reject) => {

                              const i = new Image();

                              i.crossOrigin = 'anonymous';

                              i.onload = () => resolve(i);

                              i.onerror = (e) => reject(e);

                              i.src = URL.createObjectURL(blob);

                            });



                            const targetW = 1920;

                            const targetH = 1080;

                            const canvas = document.createElement('canvas');

                            canvas.width = targetW;

                            canvas.height = targetH;

                            const ctx = canvas.getContext('2d');

                            if (!ctx) throw new Error('Canvas not supported');

                            ctx.clearRect(0, 0, targetW, targetH);

                            const ratio = Math.min(targetW / img.width, targetH / img.height);

                            const drawW = Math.round(img.width * ratio);

                            const drawH = Math.round(img.height * ratio);

                            const offsetX = Math.round((targetW - drawW) / 2);

                            const offsetY = Math.round((targetH - drawH) / 2);

                            ctx.imageSmoothingEnabled = true;

                            ctx.imageSmoothingQuality = 'high';

                            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

                            const outBlob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve as any, 'image/png', 1));

                            if (!outBlob) throw new Error('Failed to export image');

                            const downloadUrl = URL.createObjectURL(outBlob);

                            const a = document.createElement('a');

                            a.href = downloadUrl;

                            a.download = `studio_logo_${Date.now()}_1920x1080.png`;

                            document.body.appendChild(a);

                            a.click();

                            a.remove();

                            URL.revokeObjectURL(downloadUrl);

                          } catch (err) {

                            console.error('Download failed', err);

                            alert('Could not download image. If it is hosted on a remote server, CORS may prevent exporting. Try uploading the file first.');

                          }

                        }}

                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black bg-opacity-40 text-white rounded-lg transition-opacity"

                      >

                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4M21 21H3" />

                        </svg>

                      </button>

                    </div>

                  </div>

                )}

              </div>



              <div className=' space-y-2'>

                {/* logo size  */}

                <div className='p-2 border bg-white rounded-md'>

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-1">

                    Logo Size: {loadingConfig.studioLogoSize}px

                  </label>

                  <input

                    type="range"

                    min="40"

                    max="200"

                    step="10"

                    value={loadingConfig.studioLogoSize}

                    onChange={(e) => {

                      const size = parseInt(e.target.value);

                      updateLoadingConfig({ studioLogoSize: size });

                      updateStudioLogoSize(size);

                    }}

                    className="w-full"

                  />

                </div>

                <div className=" gap-4 flex">

                  <div className='p-2 border bg-white rounded-md w-full'>

                    <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-1">

                      Logo Position - Horizontal: {loadingConfig.studioLogoPosition.x}%

                    </label>

                    <input

                      type="range"

                      min="0"

                      max="100"

                      step="1"

                      value={loadingConfig.studioLogoPosition.x}

                      onChange={(e) => {

                        const x = parseInt(e.target.value);

                        updateLoadingConfig({

                          studioLogoPosition: {

                            ...loadingConfig.studioLogoPosition,

                            x

                          }

                        });

                        updateStudioLogoPosition(x, loadingConfig.studioLogoPosition.y);

                      }}

                      className="w-full"

                    />

                  </div>



                  <div className='p-2 border bg-white rounded-md w-full'>

                    <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-1">

                      Logo Position - Vertical: {loadingConfig.studioLogoPosition.y}%

                    </label>

                    <input

                      type="range"

                      min="0"

                      max="100"

                      step="1"

                      value={loadingConfig.studioLogoPosition.y}

                      onChange={(e) => {

                        const y = parseInt(e.target.value);

                        updateLoadingConfig({

                          studioLogoPosition: {

                            ...loadingConfig.studioLogoPosition,

                            y

                          }

                        });

                        updateStudioLogoPosition(loadingConfig.studioLogoPosition.x, y);

                      }}

                      className="w-full"

                    />

                  </div>

                </div>

              </div>



            </div>

          </div>

          {/* Progress Style Configuration */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center mb-4">

              Progress Style

            </h3>



            <div className="grid grid-cols-2 gap-3 mb-4">

              {['bar', 'circular'].map((style) => (

                <button

                  key={style}

                  onClick={() => {

                    updateLoadingConfig({ progressStyle: style as any });

                    // Update the store with the display value

                    updateProgressBarConfig({ display: style });

                  }}

                  className={`p-2 flex justify-center items-center uw:text-2xl rounded-lg border transition-all duration-200 ease-in-out

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

                <label className="block text-sm uw:text-2xl font-medium text-gray-700 mb-2">

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

                <label className="block text-sm uw:text-2xl font-medium text-gray-700 mb-2">

                  Accent Color

                </label>

                <input

                  type="color"

                  value={loadingConfig.accentColor}

                  onChange={(e) => {

                    updateLoadingConfig({ accentColor: e.target.value });

                    updateProgressBarConfig({ color: e.target.value })

                  }}

                  className="w-full h-10 rounded cursor-pointer border border-gray-300"

                />

              </div>

            </div>

          </div>

          {/* Progress Bar Positioning */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <div className="flex items-center justify-between mb-2">

              <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center">

                Progress Bar Position

              </h3>

              <button

                onClick={() => {

                  const defaultPosition = { x: 50, y: 65 };

                  const defaultWidth = 60;

                  updateLoadingConfig({

                    progressBarPosition: defaultPosition,

                    progressBarWidth: defaultWidth

                  });

                  updateProgressBarConfig({

                    x: defaultPosition.x,

                    y: defaultPosition.y,

                    width: defaultWidth

                  });

                }}

                className="flex items-center gap-1 px-2 py-1 text-xs uw:text-xl text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"

                title="Reset to default values"

              >

                <RotateCcw className="w-3 h-3 uw:w-5 uw:h-5" />

                <span>Default</span>

              </button>

            </div>



            <div className="space-y-4">

              <div className='border bg-white p-2 rounded-md'>

                <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-1">

                  Progress Bar Width: {loadingConfig.progressBarWidth}%

                </label>

                <input

                  type="range"

                  min="20"

                  max="80"

                  step="5"

                  value={loadingConfig.progressBarWidth}

                  onChange={(e) => {

                    const width = parseInt(e.target.value);

                    updateLoadingConfig({ progressBarWidth: width });

                    updateProgressBarConfig({ width });

                  }}

                  className="w-full"

                />

              </div>



              <div className='flex gap-4'>



                <div className='border bg-white p-2 rounded-md w-full'>

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-2">

                    Horizontal Position: {loadingConfig.progressBarPosition.x}%

                  </label>

                  <input

                    type="range"

                    min="0"

                    max="100"

                    step="1"

                    value={loadingConfig.progressBarPosition.x}

                    onChange={(e) => {

                      const x = parseInt(e.target.value);

                      updateLoadingConfig({

                        progressBarPosition: {

                          ...loadingConfig.progressBarPosition,

                          x

                        }

                      });

                      updateProgressBarConfig({ x });

                    }}

                    className="w-full"

                  />

                </div>



                <div className='border bg-white p-2 rounded-md w-full'>

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-2">

                    Vertical Position: {loadingConfig.progressBarPosition.y}%

                  </label>

                  <input

                    type="range"

                    min="0"

                    max="100"

                    step="1"

                    value={loadingConfig.progressBarPosition.y}

                    onChange={(e) => {

                      const y = parseInt(e.target.value);

                      updateLoadingConfig({

                        progressBarPosition: {

                          ...loadingConfig.progressBarPosition,

                          y

                        }

                      });

                      updateProgressBarConfig({ y });

                    }}

                    className="w-full"

                  />

                </div>



              </div>



            </div>

          </div>

          {/* Loading Sprite Configuration */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center mb-4">

              Loading Sprite

            </h3>



            <div className="space-y-2">

              <div className='space-y-2 p-2 rounded-md border'>

                <div>

                  <textarea

                    value={loadingConfig.spritePrompt}

                    onChange={(e) => updateLoadingConfig({ spritePrompt: e.target.value })}

                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-xl"

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

                    <img src={loadingConfig.loadingSprite} alt="Loading Sprite" className="w-16 h-16 uw:w-40 uw:h-40 object-contain" />

                  </div>

                )}

              </div>



              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-3 p-1">

                  <div>

                    <label className="block text-sm uw:text-3xl font-medium text-gray-700 mb-2">

                      Animation

                    </label>

                    <select

                      value={loadingConfig.spriteAnimation}

                      onChange={(e) => {

                        const animation = e.target.value;

                        updateLoadingConfig({ spriteAnimation: animation as any });

                        updateLoadingSpriteConfig({ animation });

                      }}

                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-2xl"

                    >

                      <option value="roll">Roll</option>

                      <option value="spin">Spin</option>

                      <option value="bounce">Bounce</option>

                      <option value="pulse">Pulse</option>

                      <option value="slide">Slide</option>

                    </select>

                  </div>



                  <div>

                    <label className="block text-sm uw:text-3xl font-medium text-gray-700 mb-2">

                      Position

                    </label>

                    <select

                      value={loadingConfig.spritePosition}

                      onChange={(e) => {

                        const position = e.target.value;

                        updateLoadingConfig({ spritePosition: position as any });

                        updateLoadingSpriteConfig({ position });

                      }}

                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-2xl"

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

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-1">

                    Sprite Size: {loadingConfig.spriteSize}px

                  </label>

                  <input

                    type="range"

                    min="20"

                    max="100"

                    step="5"

                    value={loadingConfig.spriteSize}

                    onChange={(e) => {

                      const size = parseInt(e.target.value);

                      updateLoadingConfig({ spriteSize: size });

                      updateLoadingSpriteConfig({ size });

                    }}

                    className="w-full"

                  />

                </div>

              </div>

            </div>

          </div>

          {/* Percentage Display Configuration */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center mb-4">

              Percentage Display

            </h3>



            <div className="space-y-4">

              <div className="flex items-center border p-2 rounded-md bg-white justify-between">

                <div>

                  <span className="text-sm uw:text-xl font-medium text-gray-700">Show Percentage</span>

                  <p className="text-xs uw:text-xl text-gray-500">Display loading progress percentage</p>

                </div>

                <button

                  onClick={() => updateLoadingConfig({ showPercentage: !loadingConfig.showPercentage })}

                  className={`px-3 py-1 rounded text-xs uw:text-3xl font-medium transition-all ${loadingConfig.showPercentage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

                    }`}

                >

                  {loadingConfig.showPercentage ? 'Enabled' : 'Disabled'}

                </button>

              </div>



              {loadingConfig.showPercentage && (

                <div>

                  <label className="block text-sm uw:text-3xl font-medium text-gray-700 mb-2">

                    Percentage Position

                  </label>

                  <div className={`grid gap-2 uw:text-2xl ${loadingConfig.progressStyle === 'circular' ? 'grid-cols-4' : 'grid-cols-3'}`}>

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

                        className={`p-2 flex justify-center items-center uw:text-xl rounded-lg border transition-all duration-200 ease-in-out

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

            <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center mb-4">

              Custom Message

            </h3>



            <div className="space-y-4">



              <div className='border p-2 rounded-md'>

                <label className="block text-sm uw:text-2xl font-medium text-gray-700 mb-2">

                  Message Text (e.g., "GameStudio™ - 2024")

                </label>

                <input

                  type="text"

                  value={loadingConfig.customMessage}

                  onChange={(e) => {

                    const text = e.target.value;

                    updateLoadingConfig({ customMessage: text });

                    updateCustomMessageConfig({ text });

                  }}

                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-xl"

                  placeholder="GameStudio™ - 2024"

                />

              </div>

              <div className='border p-2 rounded-md bg-white'>

                <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-2">

                  Font Size: {loadingConfig.customMessageSize}px

                </label>

                <input

                  type="range"

                  min="10"

                  max="24"

                  step="1"

                  value={loadingConfig.customMessageSize}

                  onChange={(e) => {

                    const size = parseInt(e.target.value);

                    updateLoadingConfig({ customMessageSize: size });

                    updateCustomMessageConfig({ size });

                  }}

                  className="w-full"

                />

              </div>



              <div className='flex gap-4'>

                <div className='border p-2 rounded-md bg-white w-full'>

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-2">

                    Horizontal Position: {loadingConfig.customMessagePosition.x}%

                  </label>

                  <input

                    type="range"

                    min="0"

                    max="100"

                    step="1"

                    value={loadingConfig.customMessagePosition.x}

                    onChange={(e) => {

                      const x = parseInt(e.target.value);

                      updateLoadingConfig({

                        customMessagePosition: {

                          ...loadingConfig.customMessagePosition,

                          x

                        }

                      });

                      updateCustomMessageConfig({ x });

                    }}

                    className="w-full"

                  />

                </div>

                <div className='border p-2 rounded-md bg-white w-full'>

                  <label className="block text-sm uw:text-xl font-medium text-gray-700 mb-2">

                    Vertical Position: {loadingConfig.customMessagePosition.y}%

                  </label>

                  <input

                    type="range"

                    min="0"

                    max="100"

                    step="1"

                    value={loadingConfig.customMessagePosition.y}

                    onChange={(e) => {

                      const y = parseInt(e.target.value);

                      updateLoadingConfig({

                        customMessagePosition: {

                          ...loadingConfig.customMessagePosition,

                          y

                        }

                      });

                      updateCustomMessageConfig({ y });

                    }}

                    className="w-full"

                  />

                </div>

              </div>



            </div>

          </div>

          {/* Save Config */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <div className="flex items-center justify-between mb-2">

              <h3 className="text-lg uw:text-3xl font-bold text-gray-900">Save Configuration</h3>

            </div>



            {!showSaveDialog ? (

              <Button

                variant='generate'

                onClick={() => setShowSaveDialog(true)}

                className='w-full py-2'

              >

                <Settings className="w-4 h-4 uw:w-6 uw:h-6 uw:mr-1" />

                <span>Save Config</span>

              </Button>

            ) : (

              <div className="space-y-2">

                <input

                  type="text"

                  value={configName}

                  onChange={(e) => setConfigName(e.target.value)}

                  placeholder="Enter configuration name..."

                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uw:text-xl"

                />

                <div className="flex space-x-2">

                  <Button

                    variant='generate'

                    onClick={() => {

                      if (configName.trim()) {

                        setSavedConfigs(prev => [...prev, { name: configName.trim(), config: loadingConfig }]);

                        setConfigName('');

                        setShowSaveDialog(false);

                      }

                    }}

                    disabled={!configName.trim()}

                    className='w-full py-2'

                  >

                    <CheckCircle className="w-4 h-4 uw:w-6 uw:h-6 uw:mr-1" />

                    <span>Save</span>

                  </Button>

                  <Button

                    variant='uploadImage'

                    onClick={() => {

                      setShowSaveDialog(false);

                      setConfigName('');

                    }}

                    className='w-full py-2 uw:text-3xl'

                  >

                    <span>Cancel</span>

                  </Button>

                </div>

              </div>

            )}

          </div>



          {/* Test Controls */}

          <div className="bg-gray-50 rounded-md shadow-sm border border-gray-200 p-2">

            <h3 className="text-lg uw:text-3xl font-bold text-gray-900 flex items-center mb-4">

              Test Loading Experience

            </h3>



            <div className="flex space-x-2">

              <Button

                variant='generate'

                onClick={startLoadingSequence}

                disabled={isLoading}

                className='w-full py-2'

              >

                <Play className="w-4 h-4 uw:w-6 uw:h-6 uw:mr-1" />

                <span>Start Loading Test</span>

              </Button>



              <Button

                variant='uploadImage'

                onClick={resetLoadingSequence}

                className="w-full py-2 uw:text-3xl"

              >

                <RotateCcw className="w-4 h-4 uw:w-6 uw:h-6 uw:mr-1" />

                <span>Reset</span>

              </Button>

            </div>



            {isLoading && (

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">

                <p className="text-sm uw:text-xl text-blue-700">

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

            ref={previewRef}

            loadingProgress={loadingProgress}

            currentPhase={currentPhase}

            assetCategories={assetCategories}

            isLoading={isLoading}

            deviceMode={deviceMode}

          />

        </div>

      </div>

    </div>

  );

};



export default Step9_LoadingExperience;