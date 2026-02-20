import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Monitor, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useLoadingJourneyStore, LoadingJourneyConfig } from './LoadingJourneyStore';

interface ProfessionalLoadingPreviewProps {
  loadingProgress: number;
  currentPhase: number;
  assetCategories: Array<{
    name: string;
    loaded: number;
    total: number;
    status: string;
  }>;
  isLoading: boolean;
  deviceMode?: 'desktop' | 'mobile';
  className?: string;
  customConfig?: LoadingJourneyConfig['loadingExperience'];
}

interface ProfessionalLoadingPreviewRef {
  setViewMode: (mode: 'desktop' | 'mobile') => void;
}

const ProfessionalLoadingPreview = React.forwardRef<ProfessionalLoadingPreviewRef, ProfessionalLoadingPreviewProps>(({
  loadingProgress,
  currentPhase,
  assetCategories,
  isLoading,
  deviceMode = 'desktop',
  className = '',
  customConfig
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  // Get loading config from store or use custom config
  const journeyStore = useLoadingJourneyStore();
  const loadingConfig = customConfig || journeyStore.config.loadingExperience;

  // Use store for device mode and orientation
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'mobile-landscape'>(deviceMode);
  const [isMuted, setIsMuted] = useState(false);

  // Sync viewMode with deviceMode prop
  useEffect(() => {
    setViewMode(deviceMode);
  }, [deviceMode]);

  // Expose setViewMode method through ref
  React.useImperativeHandle(ref, () => ({
    setViewMode: (mode: 'desktop' | 'mobile') => {
      setViewMode(mode);
    }
  }), []);

  // Determine target aspect ratio based on view mode
  const getAspectRatio = () => {
    if (viewMode === 'mobile') return 9 / 16;
    return 16 / 9; // Desktop and Mobile Landscape
  };

  // Helper to get display label
  const getDisplayLabel = () => {
    switch (viewMode) {
      case 'mobile': return 'Mobile Portrait (9:16)';
      case 'mobile-landscape': return 'Mobile Landscape (16:9)';
      default: return 'Desktop (16:9)';
    }
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !pixiContainerRef.current || !pixiAppRef.current) return;

      const parent = containerRef.current;
      const targetRatio = getAspectRatio();

      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      const parentRatio = parentWidth / parentHeight;

      let newWidth, newHeight;

      if (parentRatio > targetRatio) {
        // Parent is wider than target: constrain by height
        newHeight = parentHeight;
        newWidth = newHeight * targetRatio;
      } else {
        // Parent is taller than target: constrain by width
        newWidth = parentWidth;
        newHeight = newWidth / targetRatio;
      }

      // Update container dimensions
      pixiContainerRef.current.style.width = `${newWidth}px`;
      pixiContainerRef.current.style.height = `${newHeight}px`;

      // Resize PIXI renderer
      pixiAppRef.current.renderer.resize(newWidth, newHeight);

      // Re-setup elements to match new dimensions
      setupLoadingScreen(pixiAppRef.current);
    };

    // Initial resize
    handleResize();

    // Use ResizeObserver for robust resizing
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewMode, loadingConfig]); // Re-run when mode changes

  useEffect(() => {
    if (!pixiContainerRef.current) return;

    // Initialize PIXI Application using modern API
    const initPixiApp = async () => {
      try {
        const app = await PIXI.Application.init({
          width: 800,
          height: 450,
          backgroundColor: parseInt(loadingConfig.backgroundColor.replace('#', ''), 16),
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!app) {
          console.error('Failed to initialize PIXI Application');
          return;
        }

        pixiAppRef.current = app;

        // Ensure canvas plays nice using modern API
        const canvas = app.canvas;
        if (!canvas) {
          console.error('PIXI Application canvas is undefined');
          return;
        }
        
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        pixiContainerRef.current?.appendChild(canvas);

        // Initial setup
        setupLoadingScreen(app);
      } catch (error) {
        console.error('Error initializing PIXI Application:', error);
      }
    };

    initPixiApp();

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true
        });
        pixiAppRef.current = null;
      }
    };
  }, [loadingConfig.backgroundColor]); // Re-init if background changes significantly (optional, can just redraw)

  const setupLoadingScreen = (app: PIXI.Application) => {
    // Clear existing stage
    app.stage.removeChildren();

    const width = app.screen.width;
    const height = app.screen.height;

    // Background
    const background = new PIXI.Graphics();
    background.beginFill(parseInt(loadingConfig.backgroundColor.replace('#', ''), 16));
    background.drawRect(0, 0, width, height);
    background.endFill();
    app.stage.addChild(background);

    // Studio Logo
    if (loadingConfig.studioLogo) {
      addStudioLogo(app);
    }

    // Progress Bar
    addProgressBar(app);

    // Loading Text
    addLoadingText(app);
  };

  const addStudioLogo = async (app: PIXI.Application) => {
    if (!loadingConfig.studioLogo) return;

    try {
      const texture = await PIXI.Texture.fromURL(loadingConfig.studioLogo);
      const sprite = new PIXI.Sprite(texture);

      // Scale logo - Use relative sizing logic if needed, but keeping pixel size for now strictly as configured
      // However, we might want to ensure it doesn't overflow the screen
      const maxSize = Math.min(app.screen.width, app.screen.height) * 0.8; // Safety cap
      const targetSize = Math.min(loadingConfig.studioLogoSize, maxSize);

      const logoScale = targetSize / Math.max(texture.width, texture.height);
      sprite.scale.set(logoScale);

      // Calculate anchor to center
      sprite.anchor.set(0.5);

      // Position based on percentage
      sprite.x = (app.screen.width * loadingConfig.studioLogoPosition.x / 100);
      sprite.y = (app.screen.height * loadingConfig.studioLogoPosition.y / 100);

      app.stage.addChild(sprite);
    } catch (error) {
      console.warn('Failed to load studio logo texture:', error);
    }
  };

  const addProgressBar = (app: PIXI.Application) => {
    if (loadingConfig.progressStyle === 'circular') {
      addCircularProgress(app);
    } else {
      addBarProgress(app);
    }

    // Add loading sprite for all positions except 'in-bar' (which is handled within progress functions)
    if (loadingConfig.loadingSprite && loadingConfig.spritePosition !== 'in-bar') {
      addLoadingSpriteForPosition(app);
    }
  };

  const addBarProgress = (app: PIXI.Application) => {
    const barWidth = app.screen.width * (loadingConfig.progressBarWidth / 100);
    const barHeight = 8; // Fixed height 

    // Position is center-based
    const barX = (app.screen.width * loadingConfig.progressBarPosition.x / 100) - (barWidth / 2);
    const barY = (app.screen.height * loadingConfig.progressBarPosition.y / 100);

    // Progress bar background
    const progressBg = new PIXI.Graphics();
    progressBg.beginFill(0xffffff, 0.2);
    progressBg.drawRoundedRect(barX, barY, barWidth, barHeight, barHeight / 2);
    progressBg.endFill();
    app.stage.addChild(progressBg);

    // Progress bar fill
    const progressFill = new PIXI.Graphics();
    progressFill.beginFill(parseInt(loadingConfig.accentColor.replace('#', ''), 16));
    const progressFillWidth = barWidth * (loadingProgress / 100);
    progressFill.drawRoundedRect(barX, barY, progressFillWidth, barHeight, barHeight / 2);
    progressFill.endFill();
    app.stage.addChild(progressFill);

    // Loading sprite (if configured for progress indicator)
    if (loadingConfig.loadingSprite && loadingConfig.spritePosition === 'in-bar') {
      addLoadingSprite(app, barX, barY, barWidth);
    }
  };

  const addCircularProgress = (app: PIXI.Application) => {
    const centerX = app.screen.width * loadingConfig.progressBarPosition.x / 100;
    const centerY = app.screen.height * loadingConfig.progressBarPosition.y / 100;
    const radius = 50;
    const strokeWidth = 8;

    // Background circle
    const backgroundCircle = new PIXI.Graphics();
    backgroundCircle.lineStyle(strokeWidth, 0xffffff, 0.2);
    backgroundCircle.drawCircle(centerX, centerY, radius);
    app.stage.addChild(backgroundCircle);

    // Progress arc
    const progressArc = new PIXI.Graphics();
    const progressAngle = (loadingProgress / 100) * Math.PI * 2;

    if (loadingProgress > 0) {
      progressArc.lineStyle(strokeWidth, parseInt(loadingConfig.accentColor.replace('#', ''), 16));
      progressArc.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
    }
    app.stage.addChild(progressArc);

    if (loadingConfig.loadingSprite && loadingConfig.spritePosition === 'in-bar') {
      const spriteAngle = -Math.PI / 2 + progressAngle;
      const spriteX = centerX + Math.cos(spriteAngle) * radius;
      const spriteY = centerY + Math.sin(spriteAngle) * radius;
      addLoadingSpriteAtPosition(app, spriteX, spriteY);
    }
  };

  const addLoadingSprite = async (app: PIXI.Application, barX: number, barY: number, barWidth: number) => {
    if (!loadingConfig.loadingSprite) return;

    try {
      const texture = await PIXI.Texture.fromURL(loadingConfig.loadingSprite);
      const sprite = new PIXI.Sprite(texture);
      const spriteScale = loadingConfig.spriteSize / Math.max(texture.width, texture.height);
      sprite.scale.set(spriteScale);
      sprite.anchor.set(0.5); // Center anchor

      const progressEndX = barX + (barWidth * loadingProgress / 100);
      sprite.x = progressEndX;
      sprite.y = barY + 4; // Center of bar (8px height)

      addSpriteAnimation(app, sprite);
      app.stage.addChild(sprite);
    } catch (error) {
      console.warn('Failed to load sprite texture:', error);
    }
  };

  const addLoadingSpriteAtPosition = async (app: PIXI.Application, x: number, y: number) => {
    if (!loadingConfig.loadingSprite) return;

    try {
      const texture = await PIXI.Texture.fromURL(loadingConfig.loadingSprite);
      const sprite = new PIXI.Sprite(texture);
      const spriteScale = loadingConfig.spriteSize / Math.max(texture.width, texture.height);
      sprite.scale.set(spriteScale);
      sprite.anchor.set(0.5);

      sprite.x = x;
      sprite.y = y;

      addSpriteAnimation(app, sprite);
      app.stage.addChild(sprite);
    } catch (error) {
      console.warn('Failed to load sprite texture:', error);
    }
  };

  const addSpriteAnimation = (app: PIXI.Application, sprite: PIXI.Sprite) => {
    const initialScale = sprite.scale.x;
    const initialX = sprite.x;
    const initialY = sprite.y;
    let animationTime = 0;

    const animationTicker = () => {
      animationTime += 0.016;
      if (!sprite || sprite.destroyed) return;

      switch (loadingConfig.spriteAnimation) {
        case 'spin': sprite.rotation += 0.08; break;
        case 'roll': sprite.rotation += 0.12; break;
        case 'bounce': sprite.y = initialY + Math.sin(animationTime * 4) * 5; break;
        case 'pulse': sprite.scale.set(initialScale + Math.sin(animationTime * 3) * 0.1); break;
        case 'slide': sprite.x = initialX + Math.sin(animationTime * 2) * 3; break;
      }
    };
    app.ticker.add(animationTicker);
  };

  const addLoadingSpriteForPosition = async (app: PIXI.Application) => {
    if (!loadingConfig.loadingSprite) return;

    // Calculate positions relative to Progress Component...
    const centerX = app.screen.width * loadingConfig.progressBarPosition.x / 100;
    const centerY = app.screen.height * loadingConfig.progressBarPosition.y / 100;

    // For simplicity I'm using the center point logic primarily, but adapting to Bar/Circle
    // Bar also has width to consider for Left/Right

    let spriteX = centerX;
    let spriteY = centerY;
    const gap = 40;

    if (loadingConfig.progressStyle === 'circular') {
      const radius = 50;
      switch (loadingConfig.spritePosition) {
        case 'above-bar': spriteY = centerY - radius - gap; break;
        case 'below-bar': spriteY = centerY + radius + gap; break;
        // ...
      }
    } else {
      // Bar
      const barY = centerY; // Since centerY is derived from config %, and barY uses same config %
      switch (loadingConfig.spritePosition) {
        case 'above-bar': spriteY = barY - gap; break;
        case 'below-bar': spriteY = barY + gap; break;
      }
    }

    addLoadingSpriteAtPosition(app, spriteX, spriteY);
  };

  const addLoadingText = (app: PIXI.Application) => {
    if (loadingConfig.showPercentage) {
      const percentStyle = new PIXI.TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: loadingConfig.textColor,
        align: 'center'
      });

      const percent = new PIXI.Text(`${Math.round(loadingProgress)}%`, percentStyle);
      percent.anchor.set(0.5);

      const centerX = app.screen.width * loadingConfig.progressBarPosition.x / 100;
      const centerY = app.screen.height * loadingConfig.progressBarPosition.y / 100;

      // Default placements relative to center
      percent.x = centerX;
      percent.y = centerY;

      if (loadingConfig.progressStyle === 'bar') {
        // Adjust for bar
        switch (loadingConfig.percentagePosition) {
          case 'above': percent.y -= 30; break;
          case 'below': percent.y += 30; break;
          case 'right':
            const barWidth = app.screen.width * (loadingConfig.progressBarWidth / 100);
            percent.x += (barWidth / 2) + 40;
            break;
        }
      } else {
        // Circular
        switch (loadingConfig.percentagePosition) {
          case 'above': percent.y -= 80; break;
          case 'below': percent.y += 80; break;
          case 'right': percent.x += 80; break;
        }
      }

      app.stage.addChild(percent);
    }

    // Custom Message
    if (loadingConfig.customMessage && loadingConfig.customMessage.trim()) {
      const messageStyle = new PIXI.TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: loadingConfig.customMessageSize,
        fill: loadingConfig.textColor,
        align: 'center'
      });
      const messageText = new PIXI.Text(loadingConfig.customMessage, messageStyle);
      messageText.anchor.set(0.5);
      messageText.x = app.screen.width * loadingConfig.customMessagePosition.x / 100;
      messageText.y = app.screen.height * loadingConfig.customMessagePosition.y / 100;
      app.stage.addChild(messageText);
    }
  };

  // Update PIXI elements when state changes
  useEffect(() => {
    if (pixiAppRef.current) {
      setupLoadingScreen(pixiAppRef.current);
    }
  }, [loadingProgress, currentPhase, loadingConfig]);


  return (
    <div className={`w-full h-full flex flex-col bg-gray-100 rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>

      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-sm font-medium">Loading Experience Preview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-500 text-xs hidden sm:block">
            {getDisplayLabel()}
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile-landscape')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${viewMode === 'mobile-landscape'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
            >
              <Smartphone className="w-3 h-3 rotate-90" />
            </button>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1 rounded transition-all ${isMuted
              ? 'text-gray-500 hover:text-gray-300'
              : 'text-blue-400 hover:text-blue-300'
              }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center p-0 md:p-4">
        {/* Asset Loading Status - Only show when loading */}
        {isLoading && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-500">Assets</span>
              <div className="flex gap-4">
                {assetCategories.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <span className="text-gray-400">{category.name}</span>
                    <span className={`font-mono ${category.status === 'complete' ? 'text-green-600' :
                      category.status === 'loading' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                      {category.loaded}/{category.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-gray-900 to-black"
        >
          {/* PIXI container that will be resized */}
          <div
            ref={pixiContainerRef}
            className="shadow-2xl overflow-hidden bg-black"
            style={{
              transition: 'width 0.3s ease, height 0.3s ease', // Smooth transition between ratios
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </div>

    </div>
  );
});

ProfessionalLoadingPreview.displayName = 'ProfessionalLoadingPreview';

export default ProfessionalLoadingPreview;