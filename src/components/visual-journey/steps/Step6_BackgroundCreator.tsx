import React, { useState, useEffect, useRef, Suspense, lazy, ChangeEvent } from 'react';
import { useGameStore } from '../../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import FileUploadButton from '../shared/FileUploadButton';
import { DirectSpinController } from '../slot-animation/DirectSpinController'; // Import the direct spin controller

// Lazy load the advanced PIXI.js slot machine components for better performance
// This ensures we don't load heavy PIXI.js until needed
const EndlessReelPreview = lazy(() => import('../slot-animation/EndlessReelPreview'));
const SlotBottomBar = lazy(() => import('../slot-animation/SlotBottomBar'));
// Use our simple version to avoid the hook error
const SlotMachineIntegration = lazy(() => import('../slot-animation/SimpleSlotMachineIntegration'));
// Remove direct import of BlackBarUI since it's now included in SimpleSlotMachineIntegration
import { 
  Image,
  Sparkles,
  Palette,
  Wand2,
  ToggleLeft,
  ToggleRight,
  Upload,
  SunMoon,
  Layers,
  Repeat,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader,
  ImageIcon,
  Moon,
  Sun,
  Smile,
  FileQuestion,
  CloudRain,
  Heart,
  Leaf,
  FileImage,
  Repeat2,
  Delete,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Settings,
  Frame,
  Smartphone,
  Maximize,
  Info,
  Eye
} from 'lucide-react';
import { detectThemeCategory, getMockupAsset } from '../../../utils/mockupService';
import { enhancedOpenaiClient } from '../../../utils/enhancedOpenaiClient';
import { saveImage } from '../../../utils/imageSaver';

// Define types for background configuration
interface BackgroundConfig {
  path: string | null;
  theme: string;
  style: BackgroundStyle;
  mood: BackgroundMood;
  decoration: BackgroundDecoration;
  animated: boolean;
  generationPrompt?: string;
  isGenerating?: boolean;
  progress?: number;
  savedImageUrl?: string | null; // URL to the saved image on the server
  glassPanel?: {
    enabled: boolean;
    opacity: number;
    blur: number;
  };
  leverDecoration?: {
    enabled: boolean;
    opacity: number;
  };
  spinAnimation?: {
    enabled: boolean;
    isSpinning: boolean;
    useAdvancedAnimation?: boolean;
  };
  timestamp?: number; // For forcing re-renders
}

type BackgroundStyle = 
  | 'Same as Symbols' 
  | 'Realistic' 
  | 'Cartoon' 
  | 'Mysterious' 
  | 'Abstract' 
  | 'Futuristic';

type BackgroundMood =
  | 'Happy'
  | 'Mysterious'
  | 'Dark'
  | 'Relaxing'
  | 'Epic'
  | 'Playful';

type BackgroundDecoration =
  | 'Minimal'
  | 'Detailed';

// We'll use the shared SymbolGrid component now, which is much more advanced and game-like

// Component for the Step 6: Background Creator
const Step6_BackgroundCreator: React.FC = () => {
  const { config, updateConfig } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameFileInputRef = useRef<HTMLInputElement>(null);
  const spriteFileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const symbolsRef = useRef<HTMLImageElement[]>([]);
  const symbolGridRef = useRef<HTMLDivElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // State to store symbols from previous steps
  const [symbols, setSymbols] = useState<string[]>([]);
  const [framePath, setFramePath] = useState<string | null>(null);
  const [framePrompt, setFramePrompt] = useState<string>('');
  const [isGeneratingFrame, setIsGeneratingFrame] = useState<boolean>(false);
  const [spritePrompt, setSpritePrompt] = useState<string>('');
  const [isGeneratingSprite, setIsGeneratingSprite] = useState<boolean>(false);
  const [spritePath, setSpritePath] = useState<string | null>(null);
  
  // Grid controls from Step 5
  const [framePosition, setFramePosition] = useState(
    config.framePosition || { x: 0, y: 0 }
  );
  const [frameScale, setFrameScale] = useState(
    config.frameScale || 100
  );
  const [frameStretch, setFrameStretch] = useState(
    config.frameStretch || { x: 100, y: 100 }
  );
  
  // Separate controls for the grid - this is crucial for independent control
  const [gridPosition, setGridPosition] = useState(
    config.gridPosition || { x: 0, y: 0 }
  );
  
  // Add UI position controls - for the black bar UI
  const [uiPosition, setUiPosition] = useState(
    config.uiPosition || { x: 0, y: 0 }
  );
  
  // Transparent area controls the grid sizing
  const [frameTransparentArea, setFrameTransparentArea] = useState(
    config.frameTransparentArea || {
      top: 15,    // 15% margin from top - smaller value means more space for symbols
      bottom: 15, // 15% margin from bottom
      left: 15,   // 15% margin from left
      right: 15   // 15% margin from right
    }
  );
  const [isDragging, setIsDragging] = useState(false);

  // Active section tab
  const [activeSection, setActiveSection] = useState('frame');

  // Initialize background config from store or set defaults
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(() => {
    // Check if background image exists in the store
    const storedBackground = config.background?.backgroundImage || config.backgroundImage;

    console.log("Initializing backgroundConfig, stored background:",
      storedBackground ? "exists" : "not found",
      "config.background:", config.background ? "exists" : "null");

    return {
      // Use existing config or default values
      path: storedBackground || null,
      theme: config.theme?.mainTheme || 'Ancient Egypt',
      style: (config.background?.style === 'nature' || config.background?.style === 'abstract')
        ? 'Same as Symbols'
        : 'Realistic',
      mood: 'Happy',
      decoration: 'Minimal',
      animated: config.background?.type === 'animated',
      generationPrompt: '',
      isGenerating: false,
      glassPanel: config.background?.glassPanel || {
        enabled: true,
        opacity: 40,  // Reduced opacity by default
        blur: 3       // Less blur by default
      },
      // leverDecoration removed as requested
      spinAnimation: {
        enabled: true, // Always enable spin animation
        isSpinning: false,
        useAdvancedAnimation: true, // Industry-standard endless reel animation enabled by default
        immersivePreview: false // Always false by default
      },
      timestamp: Date.now() // Add timestamp for re-render forcing
    };
  });

  // Initialize config settings
  useEffect(() => {
    // Initialize symbolBackground if it doesn't exist
    if (!config.symbolBackground) {
      updateConfig({
        symbolBackground: {
          enabled: false,
          opacity: 50,
          color: 'black'
        }
      });
    }

    // Initialize gridCellsVisible if it doesn't exist (default: true)
    if (config.gridCellsVisible === undefined) {
      updateConfig({
        gridCellsVisible: true
      });
    }
  }, []);
  
  // Note: Frame state is already declared above
  
  // Handle form changes
  const handleInputChange = (field: keyof BackgroundConfig, value: any) => {
    setBackgroundConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Toggle animation flag
  const toggleAnimation = () => {
    setBackgroundConfig(prev => ({
      ...prev,
      animated: !prev.animated
    }));
  };
  
  // Handle frame generation using OpenAI GPT-image-1
  const handleFrameGeneration = async () => {
    if (!framePrompt) {
      alert('Please enter a description for your frame');
      return;
    }
    
    try {
      setIsGeneratingFrame(true);
      
      // Use OpenAI GPT-image-1 for frame generation
      const result = await enhancedOpenaiClient.generateImage(
        framePrompt,
        {
          size: '1024x1024',
          quality: 'high'
        }
      );
      
      // Update the frame path
      setFramePath(result.imageUrl);
      
      // Save to config
      updateConfig({ frame: result.imageUrl });
      
      console.log(`Generated frame: ${result.imageUrl}`);
      setIsGeneratingFrame(false);
    } catch (error) {
      console.error('Error generating frame:', error);
      setIsGeneratingFrame(false);
      alert('Error generating frame. Please try again.');
    }
  };

  // Load active section from localStorage if available
  useEffect(() => {
    const savedSection = localStorage.getItem('step6_active_section');
    if (savedSection && ['frame', 'grid', 'background', 'ui'].includes(savedSection)) {
      setActiveSection(savedSection);
    }
  }, []);

  // Save active section to localStorage
  useEffect(() => {
    localStorage.setItem('step6_active_section', activeSection);
  }, [activeSection]);

  // Load symbols from store with guaranteed fallback
  useEffect(() => {
    // GUARANTEED SYMBOLS - Always provide default symbols if none are in the store
    const defaultSymbols = [
      '/assets/symbols/wild.png',
      '/assets/symbols/scatter.png',
      '/assets/symbols/high_1.png',
      '/assets/symbols/high_2.png',
      '/assets/symbols/high_3.png',
      '/assets/symbols/mid_1.png',
      '/assets/symbols/mid_2.png',
      '/assets/symbols/low_1.png',
      '/assets/symbols/low_2.png',
      '/assets/symbols/low_3.png'
    ];
    
    // First try loading from store
    if (config?.theme?.generated?.symbols && config.theme.generated.symbols.length > 0) {
      console.log('Loading symbols from store:', config.theme.generated.symbols.length);
      // Log every symbol path
      config.theme.generated.symbols.forEach((path, index) => {
        console.log(`Symbol ${index} from store:`, path);
      });
      setSymbols(config.theme.generated.symbols);
    } else {
      console.log('No symbols found in store - using default symbols');
      // If theme is available, try loading mockup symbols first
      if (config?.theme && typeof config.theme === 'string') {
        const themeCategory = detectThemeCategory(config.theme);
        console.log(`Attempting to load mockup symbols for ${themeCategory} theme`);
        
        try {
          // Direct path to theme mockups - bypassing helper functions
          const themeMockupSymbols = [
            `/assets/mockups/${themeCategory}/symbols/wild.png`,
            `/assets/mockups/${themeCategory}/symbols/scatter.png`,
            `/assets/mockups/${themeCategory}/symbols/high_1.png`,
            `/assets/mockups/${themeCategory}/symbols/high_2.png`,
            `/assets/mockups/${themeCategory}/symbols/high_3.png`,
            `/assets/mockups/${themeCategory}/symbols/mid_1.png`,
            `/assets/mockups/${themeCategory}/symbols/mid_2.png`,
            `/assets/mockups/${themeCategory}/symbols/low_1.png`,
            `/assets/mockups/${themeCategory}/symbols/low_2.png`,
            `/assets/mockups/${themeCategory}/symbols/low_3.png`
          ];
          
          console.log(`Setting ${themeMockupSymbols.length} mockup symbols`);
          setSymbols(themeMockupSymbols);
        } catch (error) {
          console.log('Error loading mockup symbols, falling back to defaults');
          setSymbols(defaultSymbols);
        }
      } else {
        // No theme information, use default symbols
        console.log('No theme information, using default symbols');
        setSymbols(defaultSymbols);
      }
    }
    
    // Load frame only if explicitly provided from Step 5
    if (config?.frame) {
      console.log('Loading frame from store:', config.frame);
      setFramePath(config.frame);
    } else {
      // No default fallback frame - start with null
      console.log('No frame found in store, starting with empty frame');
      setFramePath(null);
    }
    
    // IMPORTANT: Force background to be null to prevent any default western/cowboy background
    setBackgroundConfig(prev => ({
      ...prev,
      path: null // Explicitly clear any background path
    }));
    console.log('Cleared any default background image to prevent unwanted cowboy images');
  }, [config?.theme, config?.theme?.generated?.symbols, config?.frame]);
  
  // Debug hook to monitor backgroundConfig.path changes
  useEffect(() => {
    console.log("backgroundConfig.path changed:", 
      backgroundConfig.path ? backgroundConfig.path.substring(0, 50) + "..." : "null");
  }, [backgroundConfig.path]);
  
  // Simplified hook to force only one UI element at the bottom of the container
  useEffect(() => {
    // Function focusing only on the single black bar container in the game preview
    const fixUIPosition = () => {
      if (containerRef.current) {
        // Find the black bar container
        const blackBarContainers = containerRef.current.querySelectorAll('.black-bar-container');

        // Get opacity from config or use default value
        const opacity = config.uiBarOpacity !== undefined ? config.uiBarOpacity : 0.95;

        blackBarContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            // STANDARD SLOT GAME UI POSITIONING
            container.style.position = 'absolute';
            container.style.bottom = '0';
            container.style.left = '0';
            container.style.right = '0';
            container.style.width = '100%';
            container.style.height = '4.375rem'; // 70px → 4.375rem
            container.style.zIndex = '99';
            container.style.overflow = 'visible'; // Must be visible for spin button
            container.style.margin = '0';
            container.style.padding = '0';
            // Set background color with the configured opacity
            container.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;

            // Target the inner black bar
            const blackBar = container.querySelector('div');
            if (blackBar instanceof HTMLElement) {
              blackBar.style.position = 'absolute';
              blackBar.style.bottom = '0';
              blackBar.style.left = '0';
              blackBar.style.right = '0';
              blackBar.style.backgroundColor = 'transparent'; // Transparent background since container has the color
              blackBar.style.height = '4.375rem'; // 70px → 4.375rem
              blackBar.style.width = '100%';
              blackBar.style.margin = '0';
              blackBar.style.padding = '0';
              blackBar.style.border = '0';
              blackBar.style.overflow = 'visible'; // Must be visible for spin button

              // Make sure this is the only visible UI
              blackBar.style.display = 'block';
            }
            
            // Find the spin button container and ensure it's properly positioned
            const spinButtonContainer = container.querySelector('div[style*="top: -30px"]');
            if (spinButtonContainer instanceof HTMLElement) {
              // Make sure it has high z-index to be above everything
              spinButtonContainer.style.zIndex = '10000'; 
              spinButtonContainer.style.position = 'absolute';
              spinButtonContainer.style.top = '-1.875rem'; // -30px → -1.875rem // Adjusted to be higher
              
              // Make sure the button itself is properly positioned
              const spinButton = spinButtonContainer.querySelector('button');
              if (spinButton instanceof HTMLElement) {
                spinButton.style.zIndex = '10000';
                spinButton.style.width = '5rem'; // 80px → 5rem
                spinButton.style.height = '5rem'; // 80px → 5rem
                spinButton.style.position = 'relative';
                spinButton.style.boxShadow = '0 0 1.25rem rgba(0,0,0,0.5), 0 0 2.5rem rgba(0,0,0,0.3)'; // 20px 40px → 1.25rem 2.5rem
                spinButton.style.border = '0.3125rem solid rgba(255,255,255,0.25)'; // 5px → 0.3125rem
              }
            }
          }
        });
        
        // Make sure the container can handle the absolute positioning
        if (containerRef.current) {
          // Don't modify overflow or border radius - keep exactly as it was
          containerRef.current.style.position = 'relative';
        }
      }
    };
    
    // Run immediately
    fixUIPosition();
    
    // Also run with some delay to catch after initial render
    const timers = [
      setTimeout(fixUIPosition, 100),
      setTimeout(fixUIPosition, 500)
    ];
    
    // Also run on window resize
    window.addEventListener('resize', fixUIPosition);
    
    // Cleanup
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('resize', fixUIPosition);
    };
  }, []);
  
  // Update store when background config changes
  useEffect(() => {
    console.log("Running update store effect, backgroundConfig.path:", 
      backgroundConfig.path ? "exists" : "null");
      
    // Always update the store, regardless of whether path exists
    updateConfig({
      background: {
        ...config.background,
        type: backgroundConfig.animated ? 'animated' : 'static',
        style: getStyleValue(backgroundConfig.style),
        backgroundImage: backgroundConfig.path,
        path: backgroundConfig.path, // Add direct path for consistency
        spinAnimation: backgroundConfig.spinAnimation,
        glassPanel: backgroundConfig.glassPanel,
      },
      // Add grid position to global config for persistence
      gridPosition: gridPosition,
      // Add UI position to global config
      uiPosition: uiPosition,
      // Add direct path to root config as well
      backgroundImage: backgroundConfig.path
    });
  }, [
    backgroundConfig.path, 
    backgroundConfig.timestamp, // Include timestamp to ensure re-runs when forced
    backgroundConfig.animated, 
    backgroundConfig.style, 
    backgroundConfig.spinAnimation?.isSpinning, 
    backgroundConfig.spinAnimation?.enabled,
    backgroundConfig.glassPanel?.enabled,
    backgroundConfig.glassPanel?.opacity,
    backgroundConfig.glassPanel?.blur,
    // Add grid position to dependency array
    gridPosition.x,
    gridPosition.y
  ]);
  
  // Initialize audio for spin effect
  useEffect(() => {
    // Create an audio element for spin sound
    spinAudioRef.current = new Audio('/sounds/tick.mp3');
    spinAudioRef.current.volume = 0.5;
    
    // Cleanup on unmount
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current = null;
      }
    };
  }, []);

  // Log when frame and symbols are loaded
  useEffect(() => {
    if (symbols.length > 0) {
      console.log(`Loaded ${symbols.length} symbols for display`);
    }
    
    if (framePath) {
      console.log(`Loaded frame: ${framePath.substring(0, 50)}...`);
    }
  }, [symbols, framePath]);
  
  // Load frame and related settings from previous step if available
  useEffect(() => {
    // Load frame only if provided
    if (config.frame) {
      console.log('Loading frame from store:', config.frame);
      setFramePath(config.frame);
    } else {
      // Start with no frame
      console.log('No frame available, starting with empty frame');
      setFramePath(null);
    }
    
    // Log and check all frame configuration for debugging and correct rendering
    if (config.frameScale) {
      console.log('Frame scale from store:', config.frameScale);
    }
    
    if (config.framePosition) {
      console.log('Frame position from store:', config.framePosition);
    }
    
    if (config.frameStretch) {
      console.log('Frame stretch from store:', config.frameStretch);
    }
    
    if (config.frameTransparentArea) {
      console.log('Frame transparent area from store:', config.frameTransparentArea);
    }
    
    // Print the complete frame configuration from step 5
    console.log('Full frame configuration from Step 5:', {
      frame: config.frame,
      frameScale: config.frameScale,
      framePosition: config.framePosition,
      frameStretch: config.frameStretch,
      frameTransparentArea: config.frameTransparentArea,
      reelConfig: config.reels
    });
    
  }, [config.frame, config.frameScale, config.framePosition, config.frameStretch, config.frameTransparentArea, backgroundConfig.theme]);
  
  // Map background style to the API style value
  const getStyleValue = (style: BackgroundStyle): 'nature' | 'space' | 'abstract' | 'fantasy' | 'urban' | 'custom' => {
    switch (style) {
      case 'Realistic':
        return 'nature';
      case 'Cartoon':
        return 'fantasy';
      case 'Mysterious':
        return 'urban';
      case 'Abstract':
        return 'abstract';
      case 'Futuristic':
        return 'space';
      default:
        return 'nature';
    }
  };
  
  // Function to generate AI background based on settings - refactored to use enhancedOpenaiClient like Step4
  const generateBackground = async () => {
    setBackgroundConfig(prev => ({ ...prev, isGenerating: true }));
    
    // Create a toast notification to inform the user
    const createToast = (type: 'success' | 'error' | 'info', message: string) => {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.zIndex = '9999';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '8px';
      toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      
      // Set color based on type
      if (type === 'success') {
        toast.style.backgroundColor = 'rgba(34, 197, 94, 0.95)';
        toast.style.color = 'white';
      } else if (type === 'error') {
        toast.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
        toast.style.color = 'white';
      } else {
        toast.style.backgroundColor = 'rgba(59, 130, 246, 0.95)';
        toast.style.color = 'white';
      }
      
      toast.innerHTML = `
        <div style="margin-right: 12px;">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </div>
        <div>${message}</div>
      `;
      
      document.body.appendChild(toast);
      
      // Animate in
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }, 10);
      
      // Remove after delay
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 5000);
    };
    
    // Set initial progress
    setBackgroundConfig(prev => ({ ...prev, progress: 10 }));
    
    // Construct the prompt based on current settings and stored theme data
    // Get theme information from store to ensure visual consistency
    const selectedThemeId = config.theme?.selectedThemeId || '';
    const generatedSymbolStyle = config.theme?.generated?.style || '';
    
    // Default to user-selected theme or fallback to store theme
    const themePrompt = backgroundConfig.theme || selectedThemeId || 'slot machine';
    
    // For style, prioritize theme consistency when 'Same as Symbols' is selected
    const styleDesc = backgroundConfig.style === 'Same as Symbols' 
      ? (generatedSymbolStyle ? `${generatedSymbolStyle} style, ` : '') // Use symbol style if available
      : `${backgroundConfig.style} style, `;
    
    const decorationDesc = backgroundConfig.decoration === 'Minimal' 
      ? 'clean, minimal, simple background' 
      : 'detailed, rich, ornate background';
    const moodDesc = getMoodDescription(backgroundConfig.mood);
    const animationDesc = backgroundConfig.animated ? ', slightly animated,' : '';
    
    // Add visual consistency with symbols if using same theme
    const visualConsistencyPrompt = backgroundConfig.style === 'Same as Symbols' && selectedThemeId
      ? ` Make sure the background visually matches and complements the ${selectedThemeId} themed symbols with ${generatedSymbolStyle || 'consistent'} styling.`
      : '';
    
    // Combined prompt with enhanced theme consistency
    let prompt = backgroundConfig.generationPrompt || 
      `Create a beautiful ${styleDesc}background for a ${themePrompt} themed slot machine game. The background should be ${decorationDesc} with a ${moodDesc} mood${animationDesc}. Make it visually appealing but not distracting from the game elements.${visualConsistencyPrompt}`;
    
    // Show a toast that we're generating the background
    createToast('info', 'Generating background image...');
    
    try {
      // Update progress
      setBackgroundConfig(prev => ({ ...prev, progress: 30 }));
      
      console.log('Generating background with prompt:', prompt);
      
      // Use enhancedOpenaiClient which is now imported at the top of the file
      
      // Call OpenAI API with GPT-image-1 model via enhancedOpenaiClient
      const result = await enhancedOpenaiClient.generateImage(prompt, {
        size: '1024x1024',
        quality: 'high',
        background: 'solid'  // Solid background for backgrounds
      });
      
      // Update progress to almost complete
      setBackgroundConfig(prev => ({ ...prev, progress: 90 }));
      
      // Complete the generation with the resulting image
      if (result && result.imageUrl) {
        try {
          // Save the image to the server in a gameId-specific folder
          setBackgroundConfig(prev => ({ ...prev, progress: 95 }));
          console.log(`Saving generated background image...`);
          
          // Only attempt to save the image if it's not a fallback image (starts with http or data:)
          if (config.gameId && (result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:'))) {
            // Use the saveImage utility imported at the top of the file
            
            // Attempt to save the image - this will still work even if the server save fails
            const savedImage = await saveImage(
              result.imageUrl, 
              'main_background', 
              `background_${Date.now()}`
            );
            
            // Use the saved image path if available, otherwise use the original URL
            const finalImageUrl = savedImage?.filePath || result.imageUrl;
            
            // Check if the URL is a saved URL from the server (should start with "/saved-images/")
            const isSavedUrl = typeof finalImageUrl === 'string' && finalImageUrl.includes('/saved-images/');
            
            // Log the URL status for debugging
            console.log(`Image URL status for background:`, { 
              finalImageUrl, 
              isSavedUrl,
              urlType: typeof finalImageUrl 
            });
            
            // Update the background config with the generated image
            setBackgroundConfig(prev => ({
              ...prev,
              path: finalImageUrl,
              savedImageUrl: isSavedUrl ? finalImageUrl : null,
              isGenerating: false,
              progress: 100
            }));
            
            // Update the store
            updateConfig({
              background: {
                ...config.background,
                type: backgroundConfig.animated ? 'animated' : 'static',
                style: getStyleValue(backgroundConfig.style),
                backgroundImage: finalImageUrl,
                savedImageUrl: isSavedUrl ? finalImageUrl : null
              },
              backgroundImage: finalImageUrl
            });
            
            // Dispatch a backgroundChanged event to notify the preview components
            window.dispatchEvent(new CustomEvent('backgroundChanged', {
              detail: { 
                backgroundPath: finalImageUrl,
                type: backgroundConfig.animated ? 'animated' : 'static'
              }
            }));
            
            // Show success toast
            createToast('success', 'Background generated and saved successfully!');
          } else {
            // No gameId or not a saveable URL, just update with the image URL
            setBackgroundConfig(prev => ({
              ...prev,
              path: result.imageUrl,
              isGenerating: false,
              progress: 100
            }));
            
            // Update the store
            updateConfig({
              background: {
                ...config.background,
                type: backgroundConfig.animated ? 'animated' : 'static',
                style: getStyleValue(backgroundConfig.style),
                backgroundImage: result.imageUrl
              },
              backgroundImage: result.imageUrl
            });
            
            // Show success toast
            createToast('success', 'Background generated successfully!');
          }
        } catch (saveError) {
          console.error('Error saving background image:', saveError);
          
          // Continue with the original image URL if saving fails
          setBackgroundConfig(prev => ({
            ...prev,
            path: result.imageUrl,
            isGenerating: false,
            progress: 100
          }));
          
          // Update the store
          updateConfig({
            background: {
              ...config.background,
              type: backgroundConfig.animated ? 'animated' : 'static',
              style: getStyleValue(backgroundConfig.style),
              backgroundImage: result.imageUrl
            },
            backgroundImage: result.imageUrl
          });
          
          // Show partial success toast
          createToast('info', 'Background generated but could not be saved to server');
        }
      } else {
        throw new Error('No image URL in the response');
      }
    } catch (error) {
      console.error('Error generating background with GPT-image-1:', error);
      setBackgroundConfig(prev => ({ ...prev, isGenerating: false, progress: 0 }));
      
      // Check for organization verification error
      if (error.message && error.message.includes('organization must be verified')) {
        createToast('error', "Organization verification required for GPT-image-1");
      } else if (error.message && error.message.includes('Demo mode')) {
        createToast('info', 'Using demo image - connect OpenAI API for custom backgrounds');
        
        // Fall back to the mockup service
        const themeCategory = detectThemeCategory(backgroundConfig.theme || 'fantasy');
        
        // Get a themed background from mockupService
        const fallbackImageUrl = getMockupAsset('background', themeCategory);
        
        // Update the background config with the fallback image
        setBackgroundConfig(prev => ({
          ...prev,
          path: fallbackImageUrl,
          isGenerating: false,
          progress: 100
        }));
        
        // Update the store
        updateConfig({
          background: {
            ...config.background,
            type: backgroundConfig.animated ? 'animated' : 'static',
            style: getStyleValue(backgroundConfig.style),
            backgroundImage: fallbackImageUrl
          },
          backgroundImage: fallbackImageUrl
        });
      } else {
        // Some other error occurred
        createToast('error', `Error generating background: ${error.message || 'Unknown error'}`);
      }
    }
  };
  
  // Get mood description for prompt
  const getMoodDescription = (mood: BackgroundMood): string => {
    switch (mood) {
      case 'Happy':
        return 'bright, cheerful, vibrant';
      case 'Mysterious':
        return 'enigmatic, intriguing, mystical';
      case 'Dark':
        return 'dark, moody, shadowy';
      case 'Relaxing':
        return 'calm, serene, peaceful';
      case 'Epic':
        return 'grand, majestic, impressive';
      case 'Playful':
        return 'fun, whimsical, light-hearted';
      default:
        return 'balanced, neutral';
    }
  };
  
  // Get mood icon
  const getMoodIcon = (mood: BackgroundMood) => {
    switch (mood) {
      case 'Happy':
        return <Smile className="w-4 h-4" />;
      case 'Mysterious':
        return <FileQuestion className="w-4 h-4" />;
      case 'Dark':
        return <Moon className="w-4 h-4" />;
      case 'Relaxing':
        return <Leaf className="w-4 h-4" />;
      case 'Epic':
        return <Sparkles className="w-4 h-4" />;
      case 'Playful':
        return <Heart className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };
  
  // COMPLETELY REWRITTEN file upload handler with ultra direct approach
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload initiated");
    
    try {
      // Clear input value to ensure we can select the same file again if needed
      const input = e.target;
      const files = input.files;
      
      if (!files || files.length === 0) {
        console.log("No files selected");
        return;
      }
      
      const file = files[0];
      console.log(`File selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Only accept most basic image types for absolute compatibility
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG or PNG)');
        return;
      }
      
      // Limit file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image file is too large. Please select an image under 5MB.');
        return;
      }
      
      // Use the most basic approach possible: create a local object URL instead of data URL
      const objectUrl = URL.createObjectURL(file);
      console.log("Created direct object URL:", objectUrl);
      
      // Create a static test image to verify URL works
      const testImg = document.createElement('img');
      testImg.onload = () => {
        console.log(`Image pre-validation successful: ${testImg.width}x${testImg.height}`);
        
        // Display the image directly in the DOM to verify it appears
        const directDisplay = document.createElement('div');
        directDisplay.style.position = 'fixed';
        directDisplay.style.bottom = '0.625rem'; // 10px → 0.625rem
        directDisplay.style.right = '0.625rem'; // 10px → 0.625rem
        directDisplay.style.width = '6.25rem'; // 100px → 6.25rem
        directDisplay.style.height = '6.25rem'; // 100px → 6.25rem
        directDisplay.style.backgroundImage = `url(${objectUrl})`;
        directDisplay.style.backgroundSize = 'cover';
        directDisplay.style.border = '0.125rem solid white'; // 2px → 0.125rem
        directDisplay.style.zIndex = '9999';
        directDisplay.style.opacity = '0.8';
        
        document.body.appendChild(directDisplay);
        
        // Remove after 2 seconds
        setTimeout(() => {
          document.body.removeChild(directDisplay);
        }, 2000);
        
        // Set path directly in config
        const newConfig = {
          ...backgroundConfig,
          path: objectUrl,
          timestamp: Date.now(),
          fileType: file.type,
          fileName: file.name
        };
        
        // Bypass React for direct DOM update before React re-renders
        if (containerRef.current) {
          const bgElement = document.createElement('div');
          bgElement.style.position = 'absolute';
          bgElement.style.inset = '0';
          bgElement.style.backgroundImage = `url(${objectUrl})`;
          bgElement.style.backgroundSize = 'cover';
          bgElement.style.backgroundPosition = 'center';
          bgElement.style.zIndex = '1';
          
          // Find and replace existing background or add new one
          const existingBg = containerRef.current.querySelector('[data-bg="true"]');
          if (existingBg) {
            existingBg.parentNode?.replaceChild(bgElement, existingBg);
          } else {
            const insertBefore = containerRef.current.firstChild;
            if (insertBefore) {
              containerRef.current.insertBefore(bgElement, insertBefore);
            } else {
              containerRef.current.appendChild(bgElement);
            }
          }
          bgElement.setAttribute('data-bg', 'true');
        }
        
        // Now update React state
        console.log("Setting backgroundConfig with direct object URL");
        setBackgroundConfig(newConfig);
        
        // Update global store as well
        updateConfig({
          background: {
            ...config.background,
            type: 'static',
            style: 'custom',
            backgroundImage: objectUrl,
            path: objectUrl
          },
          backgroundImage: objectUrl
        });
        
        // Add to global window for debugging
        // @ts-ignore
        window.__debug_background = {
          url: objectUrl,
          time: new Date().toISOString()
        };
        
        // Force multiple state updates as a fallback
        setTimeout(() => {
          setBackgroundConfig(prev => ({
            ...prev,
            timestamp: Date.now() + 1
          }));
          
          // Force React to re-render the entire component
          if (containerRef.current) {
            const display = containerRef.current.style.display;
            containerRef.current.style.display = 'none';
            containerRef.current.offsetHeight; // Force reflow
            containerRef.current.style.display = display;
          }
          
          // Alert UI update
          console.log("Background image applied with direct object URL!");
          
          // Second force update
          setTimeout(() => {
            setBackgroundConfig(prev => ({
              ...prev, 
              timestamp: Date.now() + 2
            }));
          }, 200);
        }, 100);
      };
      
      testImg.onerror = () => {
        console.error("Image validation failed with object URL");
        alert("Unable to load the selected image. Please try another image.");
        
        // Clean up the object URL
        URL.revokeObjectURL(objectUrl);
      };
      
      // Start loading the test image
      testImg.src = objectUrl;
      
    } catch (error) {
      console.error("Critical error in file upload handler:", error);
      alert("An error occurred while processing the image. Please try a different image.");
    } finally {
      // Reset the file input to allow selecting the same file again
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  // Trigger file input click with enhanced error handling and feedback
  const triggerFileUpload = () => {
    console.log('Triggering background file upload, ref exists:', !!fileInputRef.current);
    
    try {
      // Create a small toast to confirm the button was clicked
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
      toast.style.color = 'white';
      toast.style.padding = '10px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '9999';
      toast.innerHTML = 'Opening file selector...';
      document.body.appendChild(toast);
      
      // Remove toast after 1.5 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 1500);
      
      // Ensure the ref exists and trigger the click
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        // If ref doesn't exist, create a temporary file input and use it
        console.log('File input ref not found, creating temporary input');
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = 'image/*';
        tempInput.style.display = 'none';
        tempInput.addEventListener('change', (e) => {
          // @ts-ignore
          handleFileUpload(e);
          document.body.removeChild(tempInput);
        });
        document.body.appendChild(tempInput);
        tempInput.click();
      }
    } catch (error) {
      console.error('Error triggering file upload:', error);
      alert('Unable to open file selector. Please try again.');
    }
  };

  // Trigger frame file upload
  const triggerFrameUpload = () => {
    if (frameFileInputRef.current) {
      frameFileInputRef.current.click();
    }
  };
  
  // Trigger sprite file upload
  const triggerSpriteUpload = () => {
    if (spriteFileInputRef.current) {
      spriteFileInputRef.current.click();
    }
  };
  
  // Handle sprite file upload
  const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Sprite file upload initiated");

    try {
      const input = e.target;
      const files = input.files;

      if (!files || files.length === 0) {
        console.log("No files selected");
        return;
      }

      const file = files[0];
      console.log(`Sprite file selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

      // Only accept image types
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG or PNG)');
        return;
      }

      // Limit file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image file is too large. Please select an image under 5MB.');
        return;
      }
      
      // Create a small preview toast notification
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
      toast.style.color = 'white';
      toast.style.padding = '10px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '9999';
      toast.innerHTML = 'Sprite image uploaded! Adding to game...';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);

      // Create an object URL for immediate use
      const objectUrl = URL.createObjectURL(file);
      
      // Update spritePath state
      setSpritePath(objectUrl);
      
      // Add sprite to config
      updateConfig({
        sprites: [
          ...(config.sprites || []),
          {
            path: objectUrl,
            id: `sprite_${Date.now()}`,
            type: 'decoration',
            position: { x: 0, y: 0 },
            scale: 1
          }
        ]
      });
      
      // Also use FileReader for backup compatibility
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const imageDataUrl = event.target.result;
          console.log("Sprite image loaded successfully with data URL");

          // Force a refresh of components
          if (containerRef.current) {
            // Force React to re-render the entire component
            const display = containerRef.current.style.display;
            containerRef.current.style.display = 'none';
            containerRef.current.offsetHeight; // Force reflow
            containerRef.current.style.display = display;
          }
        }
      };

      reader.onerror = () => {
        console.error("Error reading the sprite file");
        alert("Error reading the file. Please try another image.");
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Error in sprite file upload handler:", error);
      alert("An error occurred while processing the image. Please try a different image.");
    } finally {
      // Reset the file input to allow selecting the same file again
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  // Handle sprite generation using AI
  const handleSpriteGeneration = async () => {
    if (!spritePrompt) {
      alert('Please enter a description for your sprite or UI element');
      return;
    }
    
    try {
      setIsGeneratingSprite(true);
      
      // Create a small preview toast notification
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
      toast.style.color = 'white';
      toast.style.padding = '10px';
      toast.style.borderRadius = '5px';
      toast.style.zIndex = '9999';
      toast.innerHTML = 'Generating sprite with AI...';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
      
      // Use OpenAI GPT-image-1 for sprite generation with transparency
      const result = await enhancedOpenaiClient.generateImage(
        spritePrompt,
        {
          size: '1024x1024',
          quality: 'high'
        }
      );
      
      // Update the sprite path
      setSpritePath(result.imageUrl);
      
      // Add sprite to config
      updateConfig({
        sprites: [
          ...(config.sprites || []),
          {
            path: result.imageUrl,
            id: `sprite_${Date.now()}`,
            type: 'decoration',
            position: { x: 0, y: 0 },
            scale: 1
          }
        ]
      });
      
      console.log(`Generated sprite: ${result.imageUrl}`);
      setIsGeneratingSprite(false);
    } catch (error) {
      console.error('Error generating sprite:', error);
      setIsGeneratingSprite(false);
      alert('Error generating sprite. Please try again.');
    }
  };

  // Handle frame file upload
  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Frame file upload initiated");

    try {
      const input = e.target;
      const files = input.files;

      if (!files || files.length === 0) {
        console.log("No files selected");
        return;
      }

      const file = files[0];
      console.log(`Frame file selected: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

      // Only accept image types
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG or PNG)');
        return;
      }

      // Limit file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image file is too large. Please select an image under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const imageDataUrl = event.target.result;
          console.log("Frame image loaded successfully");

          // Update framePath state
          setFramePath(imageDataUrl);

          // Save to store
          updateConfig({
            frame: imageDataUrl,
            theme: {
              ...config.theme,
              generated: {
                ...config.theme?.generated,
                frame: imageDataUrl
              }
            }
          });

          // Show success notification
          alert("Frame uploaded successfully!");
        }
      };

      reader.onerror = () => {
        console.error("Error reading the frame file");
        alert("Error reading the file. Please try another image.");
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Error in frame file upload handler:", error);
      alert("An error occurred while processing the image. Please try a different image.");
    }
  };
  
  // Helper functions for UI positioning presets
  const setUiPositionPreset = (preset: 'default' | 'top' | 'bottom' | 'left' | 'right' | 'centered') => {
    let newPosition = { x: 0, y: 0 };
    
    switch(preset) {
      case 'top':
        newPosition = { x: 0, y: -350 }; // Position at top
        break;
      case 'bottom':
        newPosition = { x: 0, y: 0 }; // Default bottom position
        break;
      case 'left':
        newPosition = { x: -100, y: 0 }; // Shifted left
        break;
      case 'right':
        newPosition = { x: 100, y: 0 }; // Shifted right
        break;
      case 'centered':
        newPosition = { x: 0, y: -175 }; // Centered vertically
        break;
      case 'default':
      default:
        newPosition = { x: 0, y: 0 }; // Reset to default
    }
    
    console.log(`Setting UI position preset: ${preset}`, newPosition);
    setUiPosition(newPosition);
    updateConfig({ uiPosition: newPosition });
  };
  
  // ULTRA SIMPLIFIED spin handler with no re-renders
  const handleSpin = () => {
    // Only call the controller and nothing else
    try {
      // Simple, direct call to the controller - it handles everything
      DirectSpinController.startSpin();
      
      // No state updates that could trigger re-renders
      // No DOM manipulation that could cause layout thrashing
      // No timeout or debouncing - just one direct call
      
      // Play sound for immediate user feedback (not state-dependent)
      if (spinAudioRef.current) {
        spinAudioRef.current.currentTime = 0;
        spinAudioRef.current.play().catch(() => {});
      }
    } catch (err) {
      // Silent error handling - no console logs
    }
  };
  
  // Add viewMode state
  const [viewMode, setViewMode] = useState<'preset' | 'advanced'>('preset');

  return (
    <div className="container mx-auto px-4 py-6">
      {/* No UI outside of game preview */}
      
      <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
        <Image className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-2 text-blue-500" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Game Assets</h1>
      </div>

      {/* Centered Preset/Advanced toggle */}
      <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 md:mb-6">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-center">Background & Frame Creator</h2>
        
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
          <span className={`text-sm sm:text-base ${viewMode === 'preset' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
            Preset
          </span>
          <div 
            className="relative inline-block w-10 sm:w-12 h-5 sm:h-6 bg-gray-200 rounded-full cursor-pointer"
            onClick={() => setViewMode(viewMode === 'preset' ? 'advanced' : 'preset')}
          >
            <div 
              className={`absolute w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 top-0.5 ${
                viewMode === 'advanced' ? 'translate-x-5 sm:translate-x-6 bg-blue-600' : 'translate-x-0.5'
              }`}
            ></div>
            <div className={`absolute inset-0 rounded-full transition-colors duration-300 ${
              viewMode === 'advanced' ? 'bg-blue-400' : ''
            }`}></div>
          </div>
          <span className={`text-sm sm:text-base ${viewMode === 'advanced' ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
            Advanced
          </span>
        </div>
      </div>
      
      {/* Preset Mode UI - Only shown when in Preset mode */}
      {viewMode === 'preset' && (
        <div className="flex flex-col gap-6 mb-6">
          {/* Background Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Image className="w-5 h-5 text-blue-500" />
                Background
              </h3>
              <div className="flex gap-3">
                <textarea 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" 
                  rows={3}
                  placeholder="Describe the background you want (e.g. Ancient Egyptian temple interior with golden hieroglyphics and warm lighting)"
                  value={backgroundConfig.generationPrompt || ''}
                  onChange={(e) => handleInputChange('generationPrompt', e.target.value)}
                />
                <div className="flex flex-col gap-2 w-36">
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={generateBackground}
                    disabled={backgroundConfig.isGenerating}
                  >
                    {backgroundConfig.isGenerating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <strong>Generating...</strong>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        <strong>Generate</strong>
                      </>
                    )}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={() => {
                      console.log('Background Upload button clicked');
                      triggerFileUpload();
                    }}
                    aria-label="Upload background image"
                    id="background-upload-button"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <strong>Upload</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Frame Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 bg-orange-50 border-b border-orange-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Frame className="w-5 h-5 text-orange-500" />
                Frame
              </h3>
              <div className="flex gap-3">
                <textarea 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" 
                  rows={3}
                  placeholder="Describe the frame style you want (e.g. wooden ornate frame with golden decorations matching the Ancient Egypt theme)"
                  value={framePrompt}
                  onChange={(e) => setFramePrompt(e.target.value)}
                />
                <div className="flex flex-col gap-2 w-36">
                  <button
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={handleFrameGeneration}
                    disabled={isGeneratingFrame || !framePrompt}
                  >
                    {isGeneratingFrame ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <strong>Generating...</strong>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        <strong>Generate</strong>
                      </>
                    )}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={triggerFrameUpload}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <strong>Upload</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sprite/UI Elements Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-4 bg-green-50 border-b border-green-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-green-500" />
                Sprite/UI Elements
              </h3>
              <div className="flex gap-3">
                <textarea 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" 
                  rows={3}
                  placeholder="Describe any UI elements or decorative sprites you want added to your game (e.g. golden scarab decorations in the corners)"
                  value={spritePrompt}
                  onChange={(e) => setSpritePrompt(e.target.value)}
                />
                <div className="flex flex-col gap-2 w-36">
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={handleSpriteGeneration}
                    disabled={isGeneratingSprite || !spritePrompt}
                  >
                    {isGeneratingSprite ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <strong>Generating...</strong>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        <strong>Generate</strong>
                      </>
                    )}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md h-10"
                    onClick={triggerSpriteUpload}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <strong>Upload</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Only show advanced controls when in Advanced mode */}
      {viewMode === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
        {/* Top section - Background Preview */}
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-blue-500" />
                Background & Frame Creator
              </h2>

              {/* Tab navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  id="tab-frame"
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeSection === 'frame'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSection('frame')}
                >
                  <Frame className="w-4 h-4 inline mr-1" />
                  Frame
                </button>
                <button
                  id="tab-grid"
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeSection === 'grid'
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSection('grid')}
                >
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  Symbol & Grid
                </button>
                <button
                  id="tab-background"
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeSection === 'background'
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSection('background')}
                >
                  <Image className="w-4 h-4 inline mr-1" />
                  Background
                </button>
                <button
                  id="tab-ui"
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeSection === 'ui'
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveSection('ui')}
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  UI Controls
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {/* Entire preview frame with 'Enable Drag' button has been removed */}
              
              {/* Position Controls Panels - Moved below the preview */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                {/* Frame Section */}
                {/* Frame Controls Section */}
                <div id="section-frame" style={{ display: activeSection === 'frame' ? 'block' : 'none' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* AI Frame Generation */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 md:col-span-2">
                    <h3 className="text-sm font-medium text-orange-800 mb-3 flex items-center">
                      <Wand2 className="w-4 h-4 mr-1.5 text-orange-600" />
                      AI Frame Generation
                    </h3>

                    <p className="text-xs text-orange-700 mb-3">
                      Describe the frame style you want and the AI will generate it for you
                    </p>

                    {/* Frame Generation Prompt */}
                    <div className="mb-3">
                      <textarea
                        className="w-full px-3 py-2 border border-orange-200 rounded-md text-sm"
                        placeholder="Describe your frame style (e.g. wooden ornate frame with golden decorations matching the Ancient Egypt theme)"
                        rows={3}
                        value={framePrompt}
                        onChange={(e) => setFramePrompt(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md"
                        onClick={handleFrameGeneration}
                        disabled={isGeneratingFrame || !framePrompt}
                      >
                        {isGeneratingFrame ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            <strong>Generating...</strong>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            <strong>Generate Frame</strong>
                          </>
                        )}
                      </button>

                      <button
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md"
                        onClick={triggerFrameUpload}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <strong>Upload Frame</strong>
                      </button>
                    </div>
                  </div>
                  {/* Frame Position Controls */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Frame className="w-4 h-4 mr-1.5 text-blue-500" />
                      Frame Position Controls
                    </h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Position controls */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Horizontal Position</label>
                          <span className="text-xs text-blue-600">{framePosition.x}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={framePosition.x}
                          onChange={(e) => {
                            const x = parseInt(e.target.value);
                            setFramePosition(prev => ({ ...prev, x }));
                            updateConfig({ framePosition: { ...framePosition, x } });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Vertical Position</label>
                          <span className="text-xs text-blue-600">{framePosition.y}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={framePosition.y}
                          onChange={(e) => {
                            const y = parseInt(e.target.value);
                            setFramePosition(prev => ({ ...prev, y }));
                            updateConfig({ framePosition: { ...framePosition, y } });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Scale control */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Frame Scale</label>
                          <span className="text-xs text-blue-600">{frameScale}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={frameScale}
                          onChange={(e) => {
                            const scale = parseInt(e.target.value);
                            setFrameScale(scale);
                            updateConfig({ frameScale: scale });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Reset & Auto-Adjust buttons */}
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={() => {
                            // Reset to defaults
                            setFramePosition({ x: 0, y: 0 });
                            setFrameScale(100);
                            setFrameStretch({ x: 100, y: 100 });

                            // Update store
                            updateConfig({
                              framePosition: { x: 0, y: 0 },
                              frameScale: 100,
                              frameStretch: { x: 100, y: 100 }
                            });
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs flex items-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset Frame
                        </button>

                        <button
                          onClick={() => {
                            // Enhanced auto-adjust frame based on grid size
                            const reels = config.reels?.layout?.reels || 5;
                            const rows = config.reels?.layout?.rows || 3;
                            
                            // Calculate optimal scale and stretch based on grid dimensions
                            // Core principle: Smaller grids need larger frames, larger grids need smaller frames
                            let newScale = 100; // Default scale (100%)
                            let newPosition = { x: 0, y: 0 }; // Default position (centered)
                            let newStretch = { x: 100, y: 100 }; // Default stretch (no stretch)
                            
                            // Calculate grid density (total cells)
                            const gridDensity = reels * rows;
                            
                            // Calculate aspect ratio to determine if the grid is wide, tall, or balanced
                            const aspectRatio = reels / rows;
                            const isWideGrid = aspectRatio > 1.8; // Wide grid (e.g., 6x3, 7x3)
                            const isTallGrid = aspectRatio < 1.2; // Tall grid (e.g., 3x4, 4x4)
                            const isSquareGrid = reels === rows; // Perfect square grid (e.g., 3x3, 4x4)
                            
                            // --- Precise frame adjustment by grid configuration ---
                            
                            // Small grid configurations (3x3, 3x4, 4x3)
                            if (gridDensity <= 12) {
                              if (isSquareGrid) {
                                // 3x3 square grid - larger frame with slight position adjustments
                                newScale = 115;
                                newPosition = { x: 0, y: -5 }; // Slight upward shift
                              } else if (isWideGrid) {
                                // 4x3 grid - slightly larger frame
                                newScale = 110;
                                newStretch = { x: 102, y: 100 }; // Slight horizontal stretch
                              } else if (isTallGrid) {
                                // 3x4 grid - slightly larger frame with vertical stretch
                                newScale = 110;
                                newStretch = { x: 100, y: 105 }; // Vertical stretch
                              }
                            }
                            // Medium grid configurations (4x4, 5x3, 5x4)
                            else if (gridDensity <= 20) {
                              if (isSquareGrid) {
                                // 4x4 square grid
                                newScale = 105;
                                newStretch = { x: 102, y: 102 }; // Slight overall stretch
                              } else if (reels === 5 && rows === 3) {
                                // Standard 5x3 grid - baseline configuration
                                newScale = 100;
                                newStretch = { x: 100, y: 100 };
                              } else if (reels === 5 && rows === 4) {
                                // 5x4 grid - taller
                                newScale = 100;
                                newStretch = { x: 100, y: 108 }; // Vertical stretch
                              }
                            }
                            // Larger grid configurations (6x3, 6x4, 7x3, etc.)
                            else if (gridDensity <= 30) {
                              if (reels === 6 && rows === 3) {
                                // 6x3 grid - slightly wider
                                newScale = 97;
                                newStretch = { x: 112, y: 100 }; // Horizontal stretch
                              } else if (reels === 6 && rows === 4) {
                                // 6x4 grid - wide and tall
                                newScale = 95;
                                newStretch = { x: 110, y: 105 }; // Both dimensions stretched
                              } else if (reels === 7 && rows === 3) {
                                // 7x3 grid - very wide
                                newScale = 95;
                                newStretch = { x: 115, y: 100 }; // Strong horizontal stretch
                              } else if (reels === 7 && rows === 4) {
                                // 7x4 grid - very wide and tall
                                newScale = 92;
                                newStretch = { x: 118, y: 105 }; // Strong horizontal stretch + vertical
                              }
                            }
                            // Very large grid configurations (7x5, 8x4, 9x3, etc.)
                            else {
                              // Base scale reduction for very large grids
                              newScale = 90;
                              
                              // Apply stretching based on aspect ratio
                              if (aspectRatio >= 2.0) {
                                // Extra wide grids (8x3, 9x3)
                                newStretch = { x: 125, y: 100 }; // Maximum horizontal stretch
                              } else if (aspectRatio <= 1.0) {
                                // Extra tall grids (3x6, 4x8)
                                newStretch = { x: 100, y: 125 }; // Maximum vertical stretch
                              } else {
                                // Large in both dimensions
                                newStretch = { x: 120, y: 115 }; // Stretch both ways
                              }
                            }
                            
                            // Log the adjustments for debugging
                            console.log(`Auto-adjusted frame for ${reels}x${rows} grid:`, {
                              scale: newScale,
                              position: newPosition,
                              stretch: newStretch,
                              gridDensity,
                              aspectRatio
                            });
                            
                            // Update state and store
                            setFramePosition(newPosition);
                            setFrameScale(newScale);
                            setFrameStretch(newStretch);
                            
                            // Update config store
                            updateConfig({
                              framePosition: newPosition,
                              frameScale: newScale,
                              frameStretch: newStretch
                            });
                          }}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs flex items-center"
                        >
                          <Maximize className="w-3 h-3 mr-1" />
                          Auto-Adjust Frame
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stretch Controls */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Maximize className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Stretch Controls
                    </h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Horizontal Stretch</label>
                          <span className="text-xs text-indigo-600">{frameStretch.x}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={frameStretch.x}
                          onChange={(e) => {
                            const x = parseInt(e.target.value);
                            setFrameStretch(prev => ({ ...prev, x }));
                            updateConfig({ frameStretch: { ...frameStretch, x } });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Vertical Stretch</label>
                          <span className="text-xs text-indigo-600">{frameStretch.y}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={frameStretch.y}
                          onChange={(e) => {
                            const y = parseInt(e.target.value);
                            setFrameStretch(prev => ({ ...prev, y }));
                            updateConfig({ frameStretch: { ...frameStretch, y } });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Master Reset button */}
                      <div className="col-span-2 mt-1">
                        <button
                          onClick={() => {
                            // Reset to defaults - reset everything
                            setFramePosition({ x: 0, y: 0 });
                            setFrameScale(100);
                            setFrameStretch({ x: 100, y: 100 });

                            // Update store
                            updateConfig({
                              framePosition: { x: 0, y: 0 },
                              frameScale: 100,
                              frameStretch: { x: 100, y: 100 }
                            });
                          }}
                          className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs flex items-center justify-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset All Frame Controls
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Frame Upload Section */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="text-sm font-medium text-orange-800 mb-3 flex items-center">
                      <Frame className="w-4 h-4 mr-1.5 text-orange-600" />
                      Frame Upload
                    </h3>

                    <p className="text-xs text-orange-700 mb-3">
                      Upload your own frame directly without going to Step 5
                    </p>

                    <button
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md"
                      onClick={triggerFrameUpload}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      <strong>Upload Custom Frame</strong> (JPEG/PNG)
                    </button>

                    <p className="mt-2 text-xs text-orange-600">
                      The frame is the decorative border that surrounds your slot machine reels
                    </p>
                  </div>

                  {/* Help Text */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1.5 text-blue-500" />
                      About Frame Controls
                    </h3>

                    <ul className="text-xs text-blue-800 space-y-2 ml-1">
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Frame Position:</strong> Adjust the position of the wooden frame image</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Frame Scale:</strong> Increase or decrease the size of the frame</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Stretch Controls:</strong> Distort the aspect ratio of the frame only</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Auto-Adjust:</strong> Automatically size and position the frame to fit your current grid layout (3x3, 5x3, etc.)</span>
                      </li>
                    </ul>
                  </div>
                </div>
                </div>

                {/* Symbol & Grid Controls Section */}
                <div id="section-grid" style={{ display: activeSection === 'grid' ? 'block' : 'none' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Symbol Grid Size Controls */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Smartphone className="w-4 h-4 mr-1.5 text-green-500" />
                      Symbol Grid Size
                    </h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Transparent Area Controls - control grid SIZE */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Top Margin</label>
                          <span className="text-xs text-green-600">{frameTransparentArea.top}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={frameTransparentArea.top}
                          onChange={(e) => {
                            const top = parseInt(e.target.value);
                            setFrameTransparentArea(prev => ({ ...prev, top }));
                            updateConfig({
                              frameTransparentArea: {
                                ...frameTransparentArea,
                                top
                              }
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Bottom Margin</label>
                          <span className="text-xs text-green-600">{frameTransparentArea.bottom}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={frameTransparentArea.bottom}
                          onChange={(e) => {
                            const bottom = parseInt(e.target.value);
                            setFrameTransparentArea(prev => ({ ...prev, bottom }));
                            updateConfig({
                              frameTransparentArea: {
                                ...frameTransparentArea,
                                bottom
                              }
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Left Margin</label>
                          <span className="text-xs text-green-600">{frameTransparentArea.left}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={frameTransparentArea.left}
                          onChange={(e) => {
                            const left = parseInt(e.target.value);
                            setFrameTransparentArea(prev => ({ ...prev, left }));
                            updateConfig({
                              frameTransparentArea: {
                                ...frameTransparentArea,
                                left
                              }
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-gray-700">Right Margin</label>
                          <span className="text-xs text-green-600">{frameTransparentArea.right}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={frameTransparentArea.right}
                          onChange={(e) => {
                            const right = parseInt(e.target.value);
                            setFrameTransparentArea(prev => ({ ...prev, right }));
                            updateConfig({
                              frameTransparentArea: {
                                ...frameTransparentArea,
                                right
                              }
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Symbol Grid Position Controls */}
                  <div className="p-3 bg-white rounded-lg border border-green-200 bg-green-50">
                    <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                      <Maximize className="w-4 h-4 mr-1.5 text-green-600" />
                      Symbol Grid Position
                    </h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Grid Position Controls - independent from frame */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-green-700">Horizontal Position</label>
                          <span className="text-xs text-green-600">{gridPosition.x}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={gridPosition.x}
                          onChange={(e) => {
                            const x = parseInt(e.target.value);
                            setGridPosition(prev => ({ ...prev, x }));
                            updateConfig({ gridPosition: { ...gridPosition, x } });
                          }}
                          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-green-700">Vertical Position</label>
                          <span className="text-xs text-green-600">{gridPosition.y}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={gridPosition.y}
                          onChange={(e) => {
                            const y = parseInt(e.target.value);
                            setGridPosition(prev => ({ ...prev, y }));
                            updateConfig({ gridPosition: { ...gridPosition, y } });
                          }}
                          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Reset Grid Position button */}
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            // Reset grid position to center
                            setGridPosition({ x: 0, y: 0 });
                            updateConfig({ gridPosition: { x: 0, y: 0 } });
                          }}
                          className="w-full px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs flex items-center justify-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset Grid Position
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Grid Reset Button */}
                  <div className="p-3 bg-white rounded-lg border border-green-200 col-span-1 md:col-span-2">
                    <button
                      onClick={() => {
                        // Reset all grid-related controls
                        setFrameTransparentArea({
                          top: 15,
                          bottom: 15,
                          left: 15,
                          right: 15
                        });
                        setGridPosition({ x: 0, y: 0 });

                        // Update store
                        updateConfig({
                          frameTransparentArea: {
                            top: 15,
                            bottom: 15,
                            left: 15,
                            right: 15
                          },
                          gridPosition: { x: 0, y: 0 }
                        });
                      }}
                      className="w-full px-3 py-2 bg-green-200 hover:bg-green-300 text-green-700 rounded text-sm flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset All Grid & Symbol Controls
                    </button>
                  </div>

                  {/* Help Text */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1.5 text-green-500" />
                      About Symbol & Grid Controls
                    </h3>

                    <ul className="text-xs text-green-800 space-y-2 ml-1">
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Symbol Grid Size:</strong> Adjust the sizing of the 5x3 symbol grid using margin controls</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Symbol Grid Position:</strong> Independently position the 5x3 symbol grid within the frame</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Blue Symbol Backgrounds:</strong> Toggle the blue/dark backgrounds behind symbols. Turn off for transparent cells, which can look better with certain frames and backgrounds</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span>Smaller margins (lower percentages) will make the symbol grid larger</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span>Position controls move the entire grid without changing its size</span>
                      </li>
                    </ul>
                  </div>

                  {/* Symbol Display Controls */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1.5 text-green-500" />
                      Symbol Display Options
                    </h3>

                    <div className="space-y-4">
                      {/* Blue Symbol Backgrounds Toggle - MOVED TO TOP FOR VISIBILITY */}
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <label className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700">Blue Symbol Backgrounds</span>
                          <span className="text-xs text-blue-600 ml-1">(Toggle symbol cell transparency)</span>
                          <button
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={() => {
                              // Initialize showSymbolBackgrounds if it doesn't exist
                              const showSymbolBackgrounds = config.showSymbolBackgrounds !== undefined ? config.showSymbolBackgrounds : true;

                              // Toggle state
                              updateConfig({
                                showSymbolBackgrounds: !showSymbolBackgrounds
                              });
                            }}
                          >
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              config.showSymbolBackgrounds !== false ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                                config.showSymbolBackgrounds !== false ? 'translate-x-5' : 'translate-x-1'
                              }`}></div>
                            </div>
                          </button>
                        </label>

                        <p className="text-sm text-blue-700 font-medium mb-1">
                          Toggle the blue background behind symbols
                        </p>
                        <p className="text-xs text-blue-600">
                          When disabled, symbol cells will be transparent, showing only the symbols without the blue square backgrounds. This creates a cleaner look with certain frames and backgrounds. This setting affects all preview displays (desktop, mobile landscape, and mobile portrait).
                        </p>
                      </div>

                      {/* Translucent Cell Backgrounds Toggle */}
                      <div>
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">Translucent Cell Backgrounds</span>
                          <button
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={() => {
                              // Initialize gridCellsVisible if it doesn't exist
                              const gridCellsVisible = config.gridCellsVisible !== undefined ? config.gridCellsVisible : true;

                              // Toggle state
                              updateConfig({
                                gridCellsVisible: !gridCellsVisible
                              });
                            }}
                          >
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              config.gridCellsVisible !== false ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                                config.gridCellsVisible !== false ? 'translate-x-5' : 'translate-x-1'
                              }`}></div>
                            </div>
                          </button>
                        </label>

                        <p className="mt-1 text-xs text-green-600">
                          Show/hide the translucent square backgrounds behind each individual symbol
                        </p>
                      </div>

                      {/* Background Panel Toggle */}
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700">Custom Background Panel</span>
                          <button
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={() => {
                              // Initialize symbolBackground if it doesn't exist
                              const symbolBackground = config.symbolBackground || { enabled: false, opacity: 50, color: 'black' };

                              // Toggle enabled state
                              updateConfig({
                                symbolBackground: {
                                  ...symbolBackground,
                                  enabled: !symbolBackground.enabled
                                }
                              });
                            }}
                          >
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              config.symbolBackground?.enabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                                config.symbolBackground?.enabled ? 'translate-x-5' : 'translate-x-1'
                              }`}></div>
                            </div>
                          </button>
                        </label>

                        <p className="mt-1 text-xs text-green-600">
                          Add a custom background panel behind the entire symbol grid
                        </p>
                      </div>

                      {/* Only show these controls when background panel is enabled */}
                      {config.symbolBackground?.enabled && (
                        <div className="mt-2">
                          {/* Opacity Control */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="text-xs font-medium text-green-700">Background Opacity</label>
                              <span className="text-xs text-green-600">
                                {config.symbolBackground?.opacity || 50}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="90"
                              value={config.symbolBackground?.opacity || 50}
                              onChange={(e) => {
                                const opacity = parseInt(e.target.value);

                                // Update config
                                updateConfig({
                                  symbolBackground: {
                                    ...config.symbolBackground,
                                    opacity
                                  }
                                });
                              }}
                              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Background Color Options */}
                          <div>
                            <label className="text-xs font-medium text-green-700 block mb-1 mt-3">Background Color</label>
                            <div className="grid grid-cols-4 gap-2 mt-1">
                              {['black', 'white', 'gray', 'transparent'].map(color => (
                                <button
                                  key={color}
                                  className={`w-full h-8 rounded border ${
                                    (config.symbolBackground?.color || 'black') === color
                                      ? 'border-green-600 ring-2 ring-green-400'
                                      : 'border-gray-300'
                                  }`}
                                  style={{
                                    backgroundColor: color === 'transparent' ? 'rgba(0,0,0,0)' : color,
                                    backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : undefined,
                                    backgroundSize: color === 'transparent' ? '10px 10px, 10px 10px' : undefined,
                                    backgroundPosition: color === 'transparent' ? '0 0, 5px 5px' : undefined
                                  }}
                                  onClick={() => {
                                    updateConfig({
                                      symbolBackground: {
                                        ...config.symbolBackground,
                                        color
                                      }
                                    });
                                  }}
                                />
                              ))}
                            </div>
                            <p className="mt-1 text-xs text-green-600 italic">
                              Select a color for the background panel behind the symbols
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Background Settings Section */}
                <div id="section-background" style={{ display: activeSection === 'background' ? 'block' : 'none' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Theme and Style */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Palette className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Background Theme & Style
                    </h3>

                    <div className="space-y-4">
                      {/* Theme selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                        <input
                          type="text"
                          value={backgroundConfig.theme}
                          onChange={(e) => handleInputChange('theme', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Theme name (e.g. Western, Ancient Egypt)"
                        />
                        <p className="mt-1 text-xs text-gray-500">Defaults to your theme from Step 1</p>
                      </div>

                      {/* Style selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Same as Symbols', 'Realistic', 'Cartoon', 'Mysterious', 'Abstract', 'Futuristic'] as BackgroundStyle[]).map((style) => (
                            <button
                              key={style}
                              className={`px-3 py-2 text-sm text-center rounded border ${
                                backgroundConfig.style === style
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleInputChange('style', style)}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mood and Decoration */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <SunMoon className="w-4 h-4 mr-1.5 text-indigo-500" />
                      Background Mood & Details
                    </h3>

                    <div className="space-y-4">
                      {/* Mood selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Happy', 'Mysterious', 'Dark', 'Relaxing', 'Epic', 'Playful'] as BackgroundMood[]).map((mood) => (
                            <button
                              key={mood}
                              className={`px-3 py-2 text-sm text-center rounded border ${
                                backgroundConfig.mood === mood
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleInputChange('mood', mood)}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {getMoodIcon(mood)}
                                <span>{mood}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Decoration Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Decoration Level</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Minimal', 'Detailed'] as BackgroundDecoration[]).map((decoration) => (
                            <button
                              key={decoration}
                              className={`px-3 py-2 text-sm text-center rounded border ${
                                backgroundConfig.decoration === decoration
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleInputChange('decoration', decoration)}
                            >
                              {decoration}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Animation toggle */}
                      <div>
                        <label className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Animated Background</span>
                          <button
                            className="relative inline-flex items-center cursor-pointer"
                            onClick={toggleAnimation}
                          >
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              backgroundConfig.animated ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                                backgroundConfig.animated ? 'translate-x-5' : 'translate-x-1'
                              }`}></div>
                            </div>
                          </button>
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          Animated backgrounds may impact performance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Glass Panel Options */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="text-base font-medium text-blue-700 mb-3 flex items-center gap-1.5">
                      <Settings className="w-4 h-4" />
                      Visual Effects
                    </h3>

                    {/* Glass Panel Controls */}
                    <div className="mb-3">
                      <label className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Glass Panel Effect</span>
                        <button
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={() => {
                            const glassPanel = backgroundConfig.glassPanel || { enabled: false, opacity: 60, blur: 5 };
                            setBackgroundConfig(prev => ({
                              ...prev,
                              glassPanel: {
                                ...glassPanel,
                                enabled: !glassPanel.enabled
                              }
                            }));

                            // Save to store
                            updateConfig({
                              background: {
                                ...config.background,
                                glassPanel: {
                                  ...glassPanel,
                                  enabled: !glassPanel.enabled
                                }
                              }
                            });
                          }}
                        >
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            backgroundConfig.glassPanel?.enabled ? 'bg-blue-500' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                              backgroundConfig.glassPanel?.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </button>
                      </label>

                      {/* Glass Panel Opacity */}
                      {backgroundConfig.glassPanel?.enabled && (
                        <div className="mb-2">
                          <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-700">Glass Opacity</label>
                            <span className="text-xs text-blue-500">{backgroundConfig.glassPanel.opacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={backgroundConfig.glassPanel.opacity}
                            onChange={(e) => {
                              const opacity = parseInt(e.target.value);
                              setBackgroundConfig(prev => ({
                                ...prev,
                                glassPanel: {
                                  ...prev.glassPanel!,
                                  opacity
                                }
                              }));

                              // Save to store
                              updateConfig({
                                background: {
                                  ...config.background,
                                  glassPanel: {
                                    ...backgroundConfig.glassPanel!,
                                    opacity
                                  }
                                }
                              });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Glass Panel Blur */}
                      {backgroundConfig.glassPanel?.enabled && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-xs font-medium text-gray-700">Blur Strength</label>
                            <span className="text-xs text-blue-500">{backgroundConfig.glassPanel.blur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={backgroundConfig.glassPanel.blur}
                            onChange={(e) => {
                              const blur = parseInt(e.target.value);
                              setBackgroundConfig(prev => ({
                                ...prev,
                                glassPanel: {
                                  ...prev.glassPanel!,
                                  blur
                                }
                              }));

                              // Save to store
                              updateConfig({
                                background: {
                                  ...config.background,
                                  glassPanel: {
                                    ...backgroundConfig.glassPanel!,
                                    blur
                                  }
                                }
                              });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Prompt */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center">
                      <Wand2 className="w-4 h-4 mr-1.5 text-purple-500" />
                      Custom Generation Prompt
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom Prompt (Optional)</label>
                      <textarea
                        value={backgroundConfig.generationPrompt}
                        onChange={(e) => handleInputChange('generationPrompt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Describe the background you want in detail..."
                        rows={3}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Leave blank to use the automatic prompt based on theme, style, and mood
                      </p>
                    </div>
                  </div>

                  {/* Background Actions */}
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 bg-indigo-50 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-indigo-800 mb-3 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Background Actions
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md relative overflow-hidden"
                        onClick={generateBackground}
                        disabled={backgroundConfig.isGenerating}
                      >
                        {/* Generation Progress Overlay */}
                        {backgroundConfig.isGenerating && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-800 bg-opacity-90 z-10">
                            <Loader className="w-4 h-4 text-white animate-spin mb-1" />
                            <div className="w-4/5 h-1 bg-indigo-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white transition-all duration-300 ease-out"
                                style={{ width: `${backgroundConfig.progress || 0}%` }}
                              />
                            </div>
                            <p className="text-white text-xs mt-1">{backgroundConfig.progress || 0}%</p>
                          </div>
                        )}
                        
                        {backgroundConfig.isGenerating ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Background
                          </>
                        )}
                      </button>

                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center justify-center transition-colors shadow-md"
                        onClick={triggerFileUpload}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <strong>Upload Background</strong>
                      </button>
                    </div>
                  </div>

                  {/* Help Text */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1.5 text-indigo-500" />
                      About Background Settings
                    </h3>

                    <ul className="text-xs text-indigo-800 space-y-2 ml-1">
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Theme & Style:</strong> Control the overall look and aesthetic of your background</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Mood & Details:</strong> Fine-tune the emotional tone and level of detail</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Animation:</strong> Toggle whether the background should have subtle animated elements</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Glass Panel:</strong> Add a translucent overlay with customizable opacity and blur</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Custom Prompt:</strong> Write your own detailed prompt for background generation</span>
                      </li>
                    </ul>
                  </div>
                </div>
                </div>

                {/* UI Controls Section */}
                <div id="section-ui" style={{ display: activeSection === 'ui' ? 'block' : 'none' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UI Bar Position Controls */}
                  <div className="p-3 bg-white rounded-lg border border-purple-200 bg-purple-50">
                    <h3 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-1.5 text-purple-600" />
                      UI Bar Controls
                    </h3>

                    <p className="text-xs text-purple-600 mb-3 italic">
                      Control the black UI bar appearance and position for your slot machine game
                    </p>

                    {/* UI Transparency Control */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-purple-700 mb-1.5">
                        UI Bar Transparency
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">Opaque</span>
                        <div className="flex-1 relative">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            defaultValue={config.uiBarOpacity !== undefined ? Math.round(config.uiBarOpacity * 100) : 95}
                            onChange={(e) => {
                              const opacity = parseInt(e.target.value) / 100;
                              // Find and update all black bar containers in the preview
                              if (containerRef.current) {
                                const blackBarContainers = containerRef.current.querySelectorAll('.black-bar-container');
                                blackBarContainers.forEach(container => {
                                  if (container instanceof HTMLElement) {
                                    container.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
                                  }
                                });
                              }
                              // Save value to config for persistence
                              updateConfig({
                                uiBarOpacity: opacity
                              });

                              // Update the value indicator
                              const valueIndicator = e.target.nextElementSibling;
                              if (valueIndicator) {
                                valueIndicator.textContent = `${Math.round(opacity * 100)}%`;
                                // Set the position of the value indicator
                                const percent = (parseInt(e.target.value) - parseInt(e.target.min)) / (parseInt(e.target.max) - parseInt(e.target.min));
                                const thumbOffset = percent * (e.target.offsetWidth - 20); // 20px for thumb width
                                valueIndicator.style.left = `${thumbOffset}px`;
                              }
                            }}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span
                            className="absolute text-xs font-medium text-purple-700 top-6 transform -translate-x-1/2"
                            style={{ left: '50%' }}
                          >
                            {config.uiBarOpacity !== undefined ? Math.round(config.uiBarOpacity * 100) : 95}%
                          </span>
                        </div>
                        <span className="text-xs text-purple-600">Transparent</span>
                      </div>
                      <p className="mt-1 text-xs text-purple-500">
                        Adjust the transparency of the black UI bar at the bottom
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* UI Position Controls */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-purple-700">Horizontal Position</label>
                          <span className="text-xs text-purple-600">{uiPosition.x}px</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={uiPosition.x}
                          onChange={(e) => {
                            const x = parseInt(e.target.value);
                            setUiPosition(prev => ({ ...prev, x }));
                            updateConfig({ uiPosition: { ...uiPosition, x } });
                          }}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs font-medium text-purple-700">Vertical Position</label>
                          <span className="text-xs text-purple-600">{uiPosition.y}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={uiPosition.y}
                          onChange={(e) => {
                            const y = parseInt(e.target.value);
                            setUiPosition(prev => ({ ...prev, y }));
                            updateConfig({ uiPosition: { ...uiPosition, y } });
                          }}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* UI Position Preset buttons */}
                      <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
                        <button
                          onClick={() => setUiPositionPreset('default')}
                          className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs flex items-center justify-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </button>

                        <button
                          onClick={() => setUiPositionPreset('top')}
                          className="px-3 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded text-xs flex items-center justify-center"
                        >
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Top UI
                        </button>

                        <button
                          onClick={() => setUiPositionPreset('bottom')}
                          className="px-3 py-2 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded text-xs flex items-center justify-center"
                        >
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Bottom UI
                        </button>
                      </div>

                      {/* Additional UI Position Presets */}
                      <div className="col-span-2 grid grid-cols-3 gap-2 mt-1">
                        <button
                          onClick={() => setUiPositionPreset('left')}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs flex items-center justify-center"
                        >
                          <ChevronLeft className="w-3 h-3 mr-1" />
                          Left
                        </button>

                        <button
                          onClick={() => setUiPositionPreset('centered')}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs flex items-center justify-center"
                        >
                          <Maximize className="w-3 h-3 mr-1" />
                          Centered
                        </button>

                        <button
                          onClick={() => setUiPositionPreset('right')}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs flex items-center justify-center"
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          Right
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Spin Animation Controls */}
                  <div className="p-3 bg-white rounded-lg border border-purple-200 bg-purple-50">
                    <h3 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
                      <Repeat className="w-4 h-4 mr-1.5 text-purple-600" />
                      Spin Animation Settings
                    </h3>

                    <div className="mb-3">
                      <label className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-700">Spin Animation</span>
                        <button
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={() => {
                            const spinAnimation = backgroundConfig.spinAnimation || { enabled: true, isSpinning: false, useAdvancedAnimation: true };
                            setBackgroundConfig(prev => ({
                              ...prev,
                              spinAnimation: {
                                ...spinAnimation,
                                enabled: !spinAnimation.enabled
                              }
                            }));

                            // Save to store
                            updateConfig({
                              background: {
                                ...config.background,
                                spinAnimation: {
                                  ...spinAnimation,
                                  enabled: !spinAnimation.enabled
                                }
                              }
                            });
                          }}
                        >
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            backgroundConfig.spinAnimation?.enabled ? 'bg-purple-500' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute w-5 h-5 bg-white rounded-full transition-transform transform ${
                              backgroundConfig.spinAnimation?.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`}></div>
                          </div>
                        </button>
                      </label>
                      <p className="text-xs text-purple-600 mb-2">
                        Enable interactive spin animation when clicking the play button
                      </p>

                      {/* Animation quality hint */}
                      {backgroundConfig.spinAnimation?.enabled && (
                        <div className="mt-2">
                          <div className="flex items-center p-2 bg-purple-100 border border-purple-200 rounded text-purple-700">
                            <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                            <div className="text-sm">
                              <strong>Premium Animation</strong>: Professional-grade endless reel animations using WebGL and GSAP
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Test Spin Button */}
                    <button
                      onClick={handleSpin}
                      className="w-full px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center justify-center transition-colors mt-4"
                      disabled={!backgroundConfig.spinAnimation?.enabled}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <strong>Test Spin Animation</strong>
                    </button>
                  </div>

                  {/* Master Reset Button */}
                  <div className="p-3 bg-white rounded-lg border border-purple-200 col-span-1 md:col-span-2">
                    <button
                      onClick={() => {
                        // Reset all position-related controls
                        setFramePosition({ x: 0, y: 0 });
                        setFrameScale(100);
                        setFrameStretch({ x: 100, y: 100 });
                        setFrameTransparentArea({
                          top: 15,
                          bottom: 15,
                          left: 15,
                          right: 15
                        });
                        setGridPosition({ x: 0, y: 0 });
                        setUiPosition({ x: 0, y: 0 });

                        // Update store
                        updateConfig({
                          framePosition: { x: 0, y: 0 },
                          frameScale: 100,
                          frameStretch: { x: 100, y: 100 },
                          frameTransparentArea: {
                            top: 15,
                            bottom: 15,
                            left: 15,
                            right: 15
                          },
                          gridPosition: { x: 0, y: 0 },
                          uiPosition: { x: 0, y: 0 }
                        });
                      }}
                      className="w-full px-3 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <strong>Reset All Position & Scaling Controls</strong>
                    </button>
                  </div>

                  {/* Help Text */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1.5 text-purple-500" />
                      About UI Controls
                    </h3>

                    <ul className="text-xs text-purple-800 space-y-2 ml-1">
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>UI Bar Position:</strong> Adjust where the black UI bar and spin button appear</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Position Presets:</strong> Quickly place the UI at commonly used positions</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span><strong>Spin Animation:</strong> Enable/disable the premium spin animation effect</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-1 mt-0.5">•</div>
                        <span>Click <strong>Test Spin Animation</strong> to see how the animation looks in your game</span>
                      </li>
                    </ul>
                  </div>
                </div>
                </div>
              </div>
              
              {/* Hidden file inputs - no action buttons here since they're in tabs */}
              <div className="hidden">
                
                {/* Hidden file input with simplified accept types for maximum compatibility */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".jpg,.jpeg,.png" // Simplified to most compatible formats
                  onChange={(e) => {
                    console.log('Background file input change detected');
                    // Force invoke the handler to ensure it gets called
                    handleFileUpload(e);

                    // Clear the input value to allow selecting the same file again
                    e.target.value = '';
                  }}
                  id="background-file-input"
                />

                {/* Hidden frame file input */}
                <input
                  type="file"
                  ref={frameFileInputRef}
                  className="hidden"
                  accept=".jpg,.jpeg,.png" // Simplified to most compatible formats
                  onChange={(e) => {
                    // Force invoke the handler to ensure it gets called
                    handleFrameUpload(e);

                    // Clear the input value to allow selecting the same file again
                    e.target.value = '';
                  }}
                />

                {/* Hidden sprite file input */}
                <input
                  type="file"
                  ref={spriteFileInputRef}
                  className="hidden"
                  accept=".jpg,.jpeg,.png" // Simplified to most compatible formats
                  onChange={(e) => {
                    // Force invoke the handler to ensure it gets called
                    handleSpriteUpload(e);

                    // Clear the input value to allow selecting the same file again
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden file inputs container - maintained for functionality */}
        <div className="hidden">
          {/* This empty div replaces the redundant AI Frame Generation panel
               since we moved that functionality into the Frame tab */}
        </div>
      </motion.div>
      )}
    </div>
  );
};

export default Step6_BackgroundCreator;