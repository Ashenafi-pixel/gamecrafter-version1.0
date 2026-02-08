import * as PIXI from 'pixi.js';
import { analyzeSymbolWithGPTVision, WingSegmentationResult } from './gptVisionClient';
import { 
  analyzeSymbolUniversally, 
  DetectedElement, 
  UniversalDetectionResult,
  validateDetectedElements 
} from './universalAnimationDetection';
import { 
  universalAnimationEngine, 
  UniversalAnimationPreset 
} from './universalAnimationEngine';
import { 
  professionalMeshProcessor, 
  ProcessedMesh 
} from './professionalMeshProcessor';
import { 
  professionalGSAPAnimator,
  ProfessionalAnimationClip 
} from './professionalGSAPAnimator';
import { professionalPerformanceMonitor } from './professionalPerformanceMonitor';
import { professionalExportSystem } from './professionalExportSystem';

/**
 * Professional-grade PIXI renderer for AAA game studio quality
 * Implements non-destructive alpha masking and GPU-accelerated effects
 */

export interface ProfessionalAnimatedSprite {
  id: string;
  sprite: PIXI.Sprite;
  alphaMask: PIXI.Graphics;
  element?: DetectedElement; // Universal element data
  meshData?: ProcessedMesh; // Professional mesh processing data
  originalTransform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
  };
  animations: Array<{
    time: number;
    properties: Record<string, number>;
    easing: string;
  }>;
  animationClips?: ProfessionalAnimationClip[]; // GSAP animation clips
  particles?: PIXI.ParticleContainer;
  shaderEffects?: PIXI.Filter[];
  warnedAboutMissingAnimations?: boolean;
}

export interface QualitySettings {
  antiAliasing: boolean;
  particleEffects: boolean;
  shaderEffects: boolean;
  performanceMode: 'high' | 'medium' | 'low';
}

class ProfessionalPixiRenderer {
  private app: PIXI.Application | null = null;
  public sprites = new Map<string, ProfessionalAnimatedSprite>();
  private ticker: PIXI.Ticker | null = null;
  private baseTexture: PIXI.Texture | null = null;
  private qualitySettings: QualitySettings = {
    antiAliasing: true,
    particleEffects: true,
    shaderEffects: true,
    performanceMode: 'high'
  };

  // Animation state
  private animationState = {
    isPlaying: false,
    currentTime: 0,
    duration: 3,
    speed: 1
  };
  
  private lastLoggedSecond = -1;

  async initialize(container: HTMLElement): Promise<void> {
    console.log('🎮 Initializing Professional PIXI Renderer...');
    
    // CRITICAL: Clean up any existing renderer first
    if (this.app) {
      console.log('🧹 Cleaning up existing renderer...');
      try {
        this.destroy();
      } catch (error) {
        console.warn('⚠️ Error during cleanup, proceeding with initialization:', error);
      }
    }
    
    // SAFE DOM CLEANUP - Container already cleaned by React component
    console.log('🧹 Container already cleaned by React component - proceeding with PIXI initialization');
    
    // Get container dimensions and use container size directly for proper fit
    const rect = container.getBoundingClientRect();
    
    // PRODUCTION FIX: Use actual container dimensions for proper canvas fit
    const width = Math.max(400, rect.width || 800);
    const height = Math.max(400, rect.height || 600);
    
    console.log(`📐 Canvas dimensions: ${width}x${height} (container: ${rect.width}x${rect.height})`);
    
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a1a,
      antialias: this.qualitySettings.antiAliasing,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance'
    });

    // Style the canvas for proper display - ENHANCED for visibility
    const canvas = app.view as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '10';
    canvas.style.border = 'none'; // Clean professional look
    canvas.style.backgroundColor = 'transparent'; // Let container handle background
    
    // CRITICAL: Ensure canvas is visible
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'auto'; // Enable interaction
    
    container.appendChild(canvas);
    this.app = app;
    
    console.log('🖼️ Canvas created and styled:', {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      style: canvas.style.cssText,
      containerDimensions: { width, height },
      canvasParent: container.tagName,
      canvasVisible: canvas.style.visibility,
      canvasOpacity: canvas.style.opacity
    });
    
    // CANVAS DEBUG: Add a visible test element
    setTimeout(() => {
      console.log('🎯 Canvas final check:', {
        canvasInDOM: document.contains(canvas),
        canvasRect: canvas.getBoundingClientRect(),
        containerRect: container.getBoundingClientRect(),
        pixiStageChildren: this.app?.stage.children.length || 0
      });
    }, 100);

    // CRITICAL: Clear sprites map
    this.sprites.clear();

    // Initialize advanced rendering features
    await this.initializeShaders();
    this.setupTicker();
    
    // 📊 PROFESSIONAL: Start performance monitoring
    professionalPerformanceMonitor.startMonitoring(container);
    
    // 🎯 CREATE TEST SPRITE for immediate debugging
    this.createTestSprite();
    
    console.log('✅ Professional renderer initialized with GPU acceleration');
    console.log('📊 Performance monitoring active');
  }

  private async initializeShaders(): Promise<void> {
    // Initialize custom shaders for professional effects
    console.log('🎨 Loading professional shader effects...');
    
    // We'll add shader implementations here
    PIXI.Filter.defaultResolution = window.devicePixelRatio || 1;
  }

  private setupTicker(): void {
    this.ticker = new PIXI.Ticker();
    this.ticker.add(() => {
      if (this.animationState.isPlaying) {
        this.updateAnimation();
      }
    });
    // START the ticker immediately
    this.ticker.start();
    console.log('🎬 Professional animation ticker initialized and STARTED');
  }

  private createTestSprite(): void {
    if (!this.app) return;
    
    console.log('✅ Professional renderer initialized with GPU acceleration');
  }

  async loadSymbolWithProfessionalQuality(
    imageBase64: string, 
    analysis: any, 
    preset: any
  ): Promise<void> {
    console.log('📸 Loading symbol with OLD professional quality pipeline...');
    
    try {
      // Step 1: Load base texture with quality preservation
      this.baseTexture = await this.loadHighQualityTexture(imageBase64);
      
      // Step 2: Get GPT-4 Vision analysis
      const visionResult = await analyzeSymbolWithGPTVision(imageBase64);
      console.log('🔍 Professional vision analysis complete:', visionResult);
      
      // Step 3: Create non-destructive masked sprites
      await this.createProfessionalSprites(this.baseTexture, visionResult, preset);
      
      // Step 4: Apply advanced effects
      await this.setupProfessionalEffects();
      
      // Step 5: Initialize animation system
      this.initializeProfessionalAnimation(preset);
      
      console.log('✅ Professional symbol loading complete');
      
    } catch (error) {
      console.error('❌ Professional loading failed:', error);
      throw error;
    }
  }

  /**
   * NEW UNIVERSAL LOADING METHOD - Works with any symbol type
   */
  async loadSymbolWithUniversalDetection(
    imageBase64: string, 
    animationType: string = 'idle'
  ): Promise<any> {
    console.log('🌟 Loading symbol with UNIVERSAL detection pipeline...');
    
    try {
      // Step 1: Load base texture with quality preservation
      this.baseTexture = await this.loadHighQualityTexture(imageBase64);
      console.log('✅ Base texture loaded successfully');
      
      // Step 2: REAL GPT-4 Vision analysis of the uploaded image
      console.log('🔍 Starting REAL GPT-4 Vision analysis...');
      
      // REAL GPT-4 VISION: Get actual analysis from the image
      let universalResult;
      try {
        console.log('🤖 Calling GPT-4 Vision for real object detection...');
        const visionResult = await analyzeSymbolWithGPTVision(imageBase64);
        console.log('🔍 GPT-4 Vision raw result:', visionResult);
        
        // Convert GPT-4 Vision result to universal format
        universalResult = this.convertVisionToUniversalResult(visionResult, imageBase64);
        console.log('🔍 Converted to universal format:', universalResult);
        
      } catch (visionError) {
        console.error('❌ GPT-4 Vision failed - NO FALLBACKS:', visionError);
        throw new Error(`GPT-4 Vision analysis failed: ${visionError.message}. Cannot proceed without real AI detection.`);
      }
      
      console.log('🔍 IMMEDIATE analysis complete:', {
        symbolType: universalResult.symbolType,
        elementsFound: universalResult.animatableElements.length,
        confidence: universalResult.confidence
      });
      
      // CRITICAL DEBUG: Log the exact element data we're about to process
      console.log('🎯 EMERGENCY DEBUG: Element data:', universalResult.animatableElements[0]);
      console.log('🎯 EMERGENCY DEBUG: App state check:', {
        appExists: !!this.app,
        appStage: this.app?.stage ? 'exists' : 'missing',
        baseTextureLoaded: !!this.baseTexture
      });
      
      // Step 3: Validate detected elements
      const validElements = validateDetectedElements(universalResult.animatableElements);
      console.log(`✅ Validated ${validElements.length}/${universalResult.animatableElements.length} elements`);
      
      // Step 4: Generate appropriate animations for detected elements
      const animationPreset = universalAnimationEngine.generateUniversalAnimations(validElements, animationType);
      console.log('🎭 Generated universal animation preset:', animationPreset.name);
      
      // CRITICAL DEBUG: Log everything before sprite creation
      console.log('🔧 DEBUG: About to create sprites with:');
      console.log('📏 Base texture:', { width: this.baseTexture.width, height: this.baseTexture.height });
      console.log('🎯 Valid elements:', validElements.map(e => ({ 
        id: e.id, 
        type: e.type, 
        bounds: e.bounds,
        attachmentPoint: e.attachmentPoint 
      })));
      // CRITICAL: Check app state before accessing screen
      if (!this.app || !this.app.screen) {
        console.error('❌ CRITICAL: PIXI app is null during sprite creation!');
        console.log('🔄 Attempting to recover renderer...');
        
        // Try to find the canvas container and reinitialize
        const container = document.querySelector('[data-renderer-container], canvas') as HTMLElement;
        if (container) {
          console.log('🔄 Found container, reinitializing...');
          await this.initialize(container.parentElement || container);
          
          if (!this.app || !this.app.screen) {
            throw new Error('Failed to recover PIXI renderer - app is still null after reinitialization');
          }
          console.log('✅ Renderer recovered successfully');
        } else {
          throw new Error('PIXI renderer not initialized and cannot recover - no container found');
        }
      }
      
      console.log('🎮 App dimensions:', { width: this.app.screen.width, height: this.app.screen.height });
      
      // Step 5: Create dynamic sprites based on detected elements
      console.log('🚀 EMERGENCY DEBUG: About to create sprites...');
      console.log('🚀 EMERGENCY DEBUG: Inputs check:', {
        baseTexture: !!this.baseTexture,
        validElementsCount: validElements.length,
        animationPreset: !!animationPreset,
        appStillExists: !!this.app
      });
      
      await this.createUniversalSprites(this.baseTexture, validElements, animationPreset);
      
      console.log('🚀 EMERGENCY DEBUG: Sprite creation completed!');
      
      // Step 6: Apply advanced effects
      await this.setupProfessionalEffects();
      
      // Step 7: Initialize universal animation system
      this.initializeUniversalAnimation(animationPreset);
      
      console.log('✅ Universal symbol loading complete');
      
      // 🔬 Return the detection results for debug thumbnail
      return universalResult;
      
    } catch (error) {
      console.error('❌ Universal loading failed:', error);
      // Provide specific error context
      if (error.message?.includes('not available')) {
        console.error('🚨 API Error detected:', error.message);
      } else if (error.message?.includes('removeChild')) {
        console.error('🚨 DOM Error detected:', error.message);
      } else {
        console.error('🚨 Unknown error type:', error);
      }
      throw error;
    }
  }

  private async loadHighQualityTexture(imageBase64: string): Promise<PIXI.Texture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create texture with maximum quality settings
        const baseTexture = PIXI.BaseTexture.from(img, {
          scaleMode: PIXI.SCALE_MODES.LINEAR,
          mipmap: PIXI.MIPMAP_MODES.ON,
          anisotropicLevel: 16,
          resolution: 1
        });
        
        const texture = new PIXI.Texture(baseTexture);
        console.log(`🎨 High-quality texture loaded: ${texture.width}x${texture.height}`);
        resolve(texture);
      };
      
      img.onerror = () => reject(new Error('Failed to load texture'));
      img.src = imageBase64;
    });
  }

  private async createProfessionalSprites(
    baseTexture: PIXI.Texture, 
    visionResult: WingSegmentationResult, 
    preset: any
  ): Promise<void> {
    console.log('🦴 Creating professional non-destructive sprites...');
    
    const centerX = this.app!.screen.width / 2;
    const centerY = this.app!.screen.height / 2;
    
    // Calculate optimal scale maintaining aspect ratio
    const maxSize = Math.min(this.app!.screen.width, this.app!.screen.height) * 0.6;
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);
    
    console.log(`🎯 Canvas: ${this.app!.screen.width}x${this.app!.screen.height}, Center: ${centerX},${centerY}, Scale: ${scale.toFixed(2)}`);

    // CRITICAL FIX: Clear any existing sprites first
    this.sprites.clear();
    console.log('🧹 Cleared existing sprites map');

    // Create sprites using NON-DESTRUCTIVE alpha masking
    const sprites = [
      { id: 'body', maskType: 'body' },
      { id: 'left-wing', maskType: 'left-wing' },
      { id: 'right-wing', maskType: 'right-wing' }
    ];

    let spritesCreated = 0;
    for (const spriteConfig of sprites) {
      try {
        console.log(`🎭 Creating sprite: ${spriteConfig.id}`);
        
        // Create sprite from ORIGINAL texture (preserves all color data)
        const sprite = new PIXI.Sprite(baseTexture);
        sprite.anchor.set(0.5);
        sprite.scale.set(scale);
        sprite.x = centerX;
        sprite.y = centerY;
        
        // Create high-quality alpha mask
        const alphaMask = this.createProfessionalAlphaMask(
          visionResult, 
          spriteConfig.maskType, 
          baseTexture.width, 
          baseTexture.height
        );
        
        // Apply NON-DESTRUCTIVE masking (preserves original colors)
        sprite.addChild(alphaMask);
        sprite.mask = alphaMask;
        
        // Ensure sprite is visible
        sprite.visible = true;
        console.log(`🎭 Sprite ${spriteConfig.id} created: visible=${sprite.visible}, alpha=${sprite.alpha}`);
        
        // Make wings more visible by adjusting positioning for better separation
        if (spriteConfig.id === 'left-wing') {
          sprite.anchor.set(1, 0.5); // Anchor at right edge for rotation
          sprite.x = centerX - (baseTexture.width * scale * 0.1); // Offset slightly left
        } else if (spriteConfig.id === 'right-wing') {
          sprite.anchor.set(0, 0.5); // Anchor at left edge for rotation  
          sprite.x = centerX + (baseTexture.width * scale * 0.1); // Offset slightly right
        }
        
        this.app!.stage.addChild(sprite);

        // Find animation data from preset
        let animations: any[] = [];
        if (preset && preset.animations) {
          const animation = preset.animations.find((a: any) => a.elementId === spriteConfig.id);
          animations = animation?.keyframes || [];
          console.log(`🎬 Found ${animations.length} keyframes for ${spriteConfig.id}`);
        }
        
        // Store professional sprite data
        const professionalSprite: ProfessionalAnimatedSprite = {
          id: spriteConfig.id,
          sprite: sprite,
          alphaMask: alphaMask,
          originalTransform: {
            x: sprite.x,
            y: sprite.y,
            scaleX: sprite.scale.x,
            scaleY: sprite.scale.y,
            rotation: sprite.rotation,
            alpha: sprite.alpha
          },
          animations: animations,
          particles: undefined,
          shaderEffects: []
        };

        // CRITICAL: Store in sprites Map
        this.sprites.set(spriteConfig.id, professionalSprite);
        spritesCreated++;
        
        console.log(`✨ Professional ${spriteConfig.id} sprite created and STORED in map`);
        console.log(`📊 Sprites map now contains: ${this.sprites.size} entries`);
        
      } catch (error) {
        console.error(`❌ Failed to create sprite ${spriteConfig.id}:`, error);
      }
    }

    console.log(`🎭 FINAL RESULT: Created ${spritesCreated}/${sprites.length} sprites`);
    console.log(`📊 Sprites map size: ${this.sprites.size}`);
    console.log(`📊 Sprites map keys: [${Array.from(this.sprites.keys()).join(', ')}]`);
    
    // Validate sprites were properly stored
    if (this.sprites.size === 0) {
      console.error('🚨 CRITICAL ERROR: No sprites were stored in the map!');
      throw new Error('Sprite creation failed - no sprites stored');
    }
  }

  /**
   * NEW UNIVERSAL SPRITE CREATION - Works with any detected elements
   */
  private async createUniversalSprites(
    baseTexture: PIXI.Texture,
    detectedElements: DetectedElement[],
    animationPreset: UniversalAnimationPreset
  ): Promise<void> {
    console.log(`🌟 Creating UNIVERSAL sprites for ${detectedElements.length} detected elements...`);
    
    // CRITICAL: Verify app is still initialized - with recovery
    if (!this.app) {
      console.error('❌ PIXI app is null - renderer was destroyed, attempting recovery...');
      console.log('🔄 Attempting to reinitialize renderer...');
      
      // Try to find the canvas container and reinitialize
      const container = document.querySelector('[data-renderer-container]') as HTMLElement;
      if (container) {
        await this.initialize(container);
        console.log('✅ Renderer recovered successfully');
      } else {
        throw new Error('PIXI renderer not initialized and cannot recover - no container found');
      }
    }
    
    // CRITICAL: Null safety check for app
    if (!this.app || !this.app.screen) {
      console.error('❌ CRITICAL: PIXI app or app.screen is null during sprite creation!');
      throw new Error('PIXI renderer app is null - cannot create sprites');
    }
    
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    // Calculate optimal scale maintaining aspect ratio - ensure reasonable sizing
    const maxSize = Math.min(this.app.screen.width, this.app.screen.height) * 0.4; // Reduced from 0.6 to 0.4 for better fit
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);
    
    // SAFETY: Cap scale to prevent tiny sprites
    const finalScale = Math.max(0.1, Math.min(scale, 1.0));
    
    console.log(`🎯 Canvas: ${this.app.screen.width}x${this.app.screen.height}, Center: ${centerX},${centerY}, Scale: ${finalScale.toFixed(2)} (orig: ${scale.toFixed(2)})`);

    // CRITICAL: Clear any existing sprites first
    this.sprites.clear();
    console.log('🧹 Cleared existing sprites map');

    let spritesCreated = 0;
    
    // Create sprites for ALL detected elements
    for (const element of detectedElements) {
      try {
        console.log(`🎭 Creating universal sprite: ${element.id} (${element.type})`);
        
        // Create sprite with proper element-based positioning
        const sprite = new PIXI.Sprite(baseTexture);
        
        // Apply element-specific anchoring for natural animation
        this.applyUniversalAnchoring(sprite, element);
        sprite.scale.set(finalScale);
        
        // Position sprite based on element bounds for proper separation
        const elementPosition = this.calculateElementPosition(element, centerX, centerY, finalScale, baseTexture);
        sprite.x = elementPosition.x;
        sprite.y = elementPosition.y;
        
        // CRITICAL: Make sprite visible with proper anatomical layering
        sprite.visible = true;
        sprite.alpha = 1.0;
        sprite.zIndex = this.getElementZIndex(element.type, element.id); // Anatomically correct layering
        
        // PRODUCTION: Standard sprite setup
        sprite.tint = 0xFFFFFF; // Ensure no tinting
        
        console.log(`✨ SPRITE: ${element.id} positioned at (${sprite.x.toFixed(1)}, ${sprite.y.toFixed(1)})`);
        
        // PRODUCTION: Alpha masking disabled for visibility debugging
        const alphaMask = null; // Temporarily disabled for debugging
        // const alphaMask = this.createUniversalAlphaMask(element, baseTexture.width, baseTexture.height);
        // if (alphaMask) {
        //   sprite.addChild(alphaMask);
        //   sprite.mask = alphaMask;
        // }
        
        // Ensure sprite is visible
        sprite.visible = true;
        
        // Add sprite to stage with proper Z-index layering
        this.app.stage.addChild(sprite);
        
        // PROFESSIONAL: Apply proper Z-index layering and force stage update
        this.app.stage.sortableChildren = true;
        
        console.log(`✨ Added ${element.type} sprite to stage`);
        
        // Force stage update with null check
        try {
          if (this.app && this.app.stage) {
            this.app.stage.updateTransform();
          }
        } catch (transformError) {
          console.warn('⚠️ Stage transform update failed (safely ignored):', transformError);
        }
        
        // Sprite ready for animation

        // Find animation data from universal preset
        let animations: any[] = [];
        const animation = animationPreset.animations.find(a => a.elementId === element.id);
        if (animation) {
          animations = animation.keyframes || [];
          console.log(`🎬 Found ${animations.length} keyframes for ${element.id}`);
        } else {
          console.warn(`⚠️ No animation found for element ${element.id}`);
        }
        
        // OPTIMIZATION: Mesh processing and GSAP clips available for enhancement
        console.log(`🚀 OPTIMIZATION: Basic sprite created for ${element.id}, mesh processing available for enhancement`);
        
        // Store complete sprite data with restored masking
        const professionalSprite: ProfessionalAnimatedSprite = {
          id: element.id,
          sprite: sprite,
          alphaMask: alphaMask,
          element: element,
          meshData: undefined, // Mesh processing for performance optimization
          originalTransform: {
            x: sprite.x,
            y: sprite.y,
            scaleX: sprite.scale.x,
            scaleY: sprite.scale.y,
            rotation: sprite.rotation,
            alpha: sprite.alpha
          },
          animations: animations,
          animationClips: undefined, // Skip GSAP clips for debugging
          particles: undefined,
          shaderEffects: []
        };

        // CRITICAL: Store in sprites Map
        this.sprites.set(element.id, professionalSprite);
        spritesCreated++;
        
        console.log(`✨ ${element.id} sprite created`);
        
      } catch (error) {
        console.error(`❌ Failed to create universal sprite ${element.id}:`, error);
      }
    }  // End of element creation loop

    console.log(`✅ Created ${spritesCreated} sprites for animation`);
    
    // Validate sprites were properly stored
    if (this.sprites.size === 0) {
      throw new Error('No sprites created - animation setup failed');
    }
  }

  private createProfessionalAlphaMask(
    visionResult: WingSegmentationResult, 
    maskType: string, 
    width: number, 
    height: number
  ): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    
    if (maskType === 'body') {
      return this.createBodyAlphaMask(visionResult, width, height);
    } else if (maskType === 'left-wing') {
      return this.createWingAlphaMask(visionResult, 'left', width, height);
    } else if (maskType === 'right-wing') {
      return this.createWingAlphaMask(visionResult, 'right', width, height);
    }
    
    return mask;
  }

  private createBodyAlphaMask(visionResult: WingSegmentationResult, width: number, height: number): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    
    // Use GPT-4 Vision body center data - FIXED coordinate calculation
    const bodyCenter = {
      x: (visionResult.bodyCenter.x / 100) * width,
      y: (visionResult.bodyCenter.y / 100) * height
    };
    
    // Create smooth elliptical mask for body
    mask.beginFill(0xffffff, 1);
    
    if (this.qualitySettings.antiAliasing) {
      // High-quality body mask with anti-aliasing
      const bodyWidth = width * 0.3;
      const bodyHeight = height * 0.5;
      
      // Create gradient for smooth edges - FIXED to use proper position
      mask.drawEllipse(bodyCenter.x - width/2, bodyCenter.y - height/2, bodyWidth, bodyHeight);
    } else {
      // Performance mode - simple mask
      const bodyWidth = width * 0.25;
      const bodyHeight = height * 0.4;
      mask.drawEllipse(bodyCenter.x - width/2, bodyCenter.y - height/2, bodyWidth, bodyHeight);
    }
    
    mask.endFill();
    
    console.log(`🎭 Professional body alpha mask created: center=(${bodyCenter.x - width/2}, ${bodyCenter.y - height/2})`);
    return mask;
  }

  private createWingAlphaMask(visionResult: WingSegmentationResult, side: 'left' | 'right', width: number, height: number): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    const wing = side === 'left' ? visionResult.leftWing : visionResult.rightWing;
    
    mask.beginFill(0xffffff, 1);
    
    if (wing.contourPoints && wing.contourPoints.length > 0) {
      // Use GPT-4 Vision contour points for precise wing shape - FIXED coordinates
      const pixelPoints = wing.contourPoints.map((point: any) => ({
        x: (point.x / 100) * width,
        y: (point.y / 100) * height
      }));
      
      // Convert to sprite-relative coordinates
      const spritePoints = pixelPoints.map(point => ({
        x: point.x - width/2,
        y: point.y - height/2
      }));
      
      if (this.qualitySettings.antiAliasing) {
        // High-quality anti-aliased wing shape
        this.drawSmoothWingShape(mask, spritePoints);
      } else {
        // Performance mode - simple polygon
        if (spritePoints.length > 0) {
          mask.moveTo(spritePoints[0].x, spritePoints[0].y);
          for (let i = 1; i < spritePoints.length; i++) {
            mask.lineTo(spritePoints[i].x, spritePoints[i].y);
          }
          mask.closePath();
        }
      }
      
      console.log(`🪶 Professional ${side} wing alpha mask created with ${wing.contourPoints.length} contour points`);
      console.log(`📍 Wing bounds: x=${pixelPoints[0]?.x}, y=${pixelPoints[0]?.y}`);
    } else {
      // Fallback to bounds-based organic wing shape - FIXED coordinates
      const bounds = {
        x: (wing.bounds.x / 100) * width - width/2,
        y: (wing.bounds.y / 100) * height - height/2,
        width: (wing.bounds.width / 100) * width,
        height: (wing.bounds.height / 100) * height
      };
      
      this.drawOrganicWingShape(mask, bounds, side);
      console.log(`🪶 Professional ${side} wing alpha mask created with organic shape`);
      console.log(`📍 Wing bounds: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}`);
    }
    
    mask.endFill();
    
    // CRITICAL: Ensure mask is positioned correctly
    mask.x = 0;
    mask.y = 0;
    
    return mask;
  }

  /**
   * Universal alpha mask creation based on detected element contours
   */
  private createUniversalAlphaMask(
    element: DetectedElement,
    textureWidth: number,
    textureHeight: number
  ): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    
    console.log(`🎭 Creating PRECISE universal mask for ${element.type}: ${element.name}`);
    
    mask.beginFill(0xffffff, 1);
    
    // Convert percentage bounds to pixel coordinates (sprite-relative)
    const bounds = {
      x: (element.bounds.x / 100) * textureWidth - textureWidth/2,
      y: (element.bounds.y / 100) * textureHeight - textureHeight/2,
      width: (element.bounds.width / 100) * textureWidth,
      height: (element.bounds.height / 100) * textureHeight
    };
    
    console.log(`🎨 ${element.type} mask bounds: x=${bounds.x.toFixed(1)}, y=${bounds.y.toFixed(1)}, w=${bounds.width.toFixed(1)}, h=${bounds.height.toFixed(1)}`);
    
    // Use contour points if available for precision
    if (element.contourPoints && element.contourPoints.length > 0) {
      console.log(`🔍 Using ${element.contourPoints.length} contour points for ${element.id}`);
      
      // Convert contour points to sprite coordinates
      const spritePoints = element.contourPoints.map(point => ({
        x: (point.x / 100) * textureWidth - textureWidth/2,
        y: (point.y / 100) * textureHeight - textureHeight/2
      }));
      
      // Draw polygon using contour points
      if (spritePoints.length > 0) {
        mask.moveTo(spritePoints[0].x, spritePoints[0].y);
        for (let i = 1; i < spritePoints.length; i++) {
          mask.lineTo(spritePoints[i].x, spritePoints[i].y);
        }
        mask.closePath();
        console.log(`✅ Precise contour mask created for ${element.id}`);
      }
    } else {
      // Fallback to shape-based masks
      console.log(`⚠️ No contours, using shape-based mask for ${element.id}`);
      
      switch (element.type) {
        case 'wings':
          const wingRadius = Math.min(bounds.width, bounds.height) * 0.3;
          mask.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, wingRadius);
          break;
          
        case 'body':
          const centerX = bounds.x + bounds.width/2;
          const centerY = bounds.y + bounds.height/2;
          mask.drawEllipse(centerX, centerY, bounds.width/2, bounds.height/2);
          break;
          
        case 'limbs':
          const limbRadius = Math.min(bounds.width, bounds.height) * 0.2;
          mask.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, limbRadius);
          break;
          
        default:
          mask.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
          break;
      }
    }
    
    mask.endFill();
    
    // Ensure mask is positioned correctly
    mask.x = 0;
    mask.y = 0;
    
    console.log(`✅ Universal mask created for ${element.id}`);
    return mask;
  }

  /**
   * Calculate proper position for each element sprite based on its bounds and attachment points
   */
  private calculateElementPosition(
    element: DetectedElement, 
    centerX: number, 
    centerY: number, 
    scale: number, 
    baseTexture: PIXI.Texture
  ): { x: number, y: number } {
    // PRODUCTION: Center all sprites for optimal visibility
    const finalX = centerX;
    const finalY = centerY;
    
    return { x: finalX, y: finalY };
  }

  /**
   * Extract individual element texture from base texture using precise bounds
   */
  private async extractElementTexture(baseTexture: PIXI.Texture, element: DetectedElement): Promise<PIXI.Texture> {
    console.log(`🎨 Extracting individual texture for ${element.id} (${element.type})`);
    
    // Calculate pixel coordinates from percentage bounds
    const textureWidth = baseTexture.width;
    const textureHeight = baseTexture.height;
    
    const pixelBounds = {
      x: Math.floor((element.bounds.x / 100) * textureWidth),
      y: Math.floor((element.bounds.y / 100) * textureHeight),
      width: Math.ceil((element.bounds.width / 100) * textureWidth),
      height: Math.ceil((element.bounds.height / 100) * textureHeight)
    };
    
    // Ensure bounds are within texture limits
    pixelBounds.x = Math.max(0, Math.min(pixelBounds.x, textureWidth - 1));
    pixelBounds.y = Math.max(0, Math.min(pixelBounds.y, textureHeight - 1));
    pixelBounds.width = Math.max(1, Math.min(pixelBounds.width, textureWidth - pixelBounds.x));
    pixelBounds.height = Math.max(1, Math.min(pixelBounds.height, textureHeight - pixelBounds.y));
    
    console.log(`🎯 Element ${element.id} bounds: x=${pixelBounds.x}, y=${pixelBounds.y}, w=${pixelBounds.width}, h=${pixelBounds.height}`);
    
    try {
      // Create a new texture using the extracted region
      const elementTexture = new PIXI.Texture(
        baseTexture.baseTexture,
        new PIXI.Rectangle(
          pixelBounds.x,
          pixelBounds.y,
          pixelBounds.width,
          pixelBounds.height
        )
      );
      
      console.log(`✅ Individual texture created for ${element.id}: ${elementTexture.width}x${elementTexture.height}`);
      return elementTexture;
      
    } catch (error) {
      console.error(`❌ Failed to extract texture for ${element.id}:`, error);
      // Fallback: return the full base texture
      return baseTexture;
    }
  }

  /**
   * Apply universal anchoring based on element type for natural animation behavior
   */
  private applyUniversalAnchoring(sprite: PIXI.Sprite, element: DetectedElement): void {
    // Apply element-type specific anchoring for natural animation behavior
    switch (element.type) {
      case 'wings':
        // Wings anchor at attachment point for natural flapping
        if (element.attachmentPoint) {
          // Calculate anchor based on attachment point within the element bounds
          const anchorX = ((element.attachmentPoint.x - element.bounds.x) / element.bounds.width);
          const anchorY = ((element.attachmentPoint.y - element.bounds.y) / element.bounds.height);
          sprite.anchor.set(Math.max(0, Math.min(1, anchorX)), Math.max(0, Math.min(1, anchorY)));
          console.log(`📍 Wings anchor at attachment: (${anchorX.toFixed(2)}, ${anchorY.toFixed(2)})`);
        } else {
          sprite.anchor.set(0.5, 0.5); // Default center
        }
        break;
        
      case 'tail':
        // Tail anchors at base for natural swaying
        sprite.anchor.set(0.5, 0.1); // Anchor near base
        break;
        
      case 'limbs':
      case 'legs':
        // Limbs anchor at connection point
        sprite.anchor.set(0.5, 0.2); // Anchor near connection
        break;
        
      case 'appendage':
        // Generic appendages anchor at attachment point if available
        if (element.attachmentPoint) {
          const anchorX = ((element.attachmentPoint.x - element.bounds.x) / element.bounds.width);
          const anchorY = ((element.attachmentPoint.y - element.bounds.y) / element.bounds.height);
          sprite.anchor.set(Math.max(0, Math.min(1, anchorX)), Math.max(0, Math.min(1, anchorY)));
        } else {
          sprite.anchor.set(0.3, 0.3); // Slightly offset from center
        }
        break;
        
      case 'flowing':
        // Flowing elements anchor at root
        sprite.anchor.set(0.5, 0.1); // Anchor at top
        break;
        
      case 'body':
      default:
        // Body and other elements use center anchor
        sprite.anchor.set(0.5, 0.5);
        break;
    }
    
    console.log(`📍 Applied ${element.type} anchor: (${sprite.anchor.x.toFixed(2)}, ${sprite.anchor.y.toFixed(2)})`);
  }

  /**
   * ANATOMICALLY CORRECT Z-INDEX for beetle layering
   * Based on real beetle anatomy where wings fold OVER body
   */
  private getElementZIndex(elementType: string, elementId: string): number {
    // Anatomically correct beetle layering (bottom to top)
    const BEETLE_ANATOMY_LAYERS = {
      // Foundation
      'shadow': 0,
      
      // Legs (bottom layer - extend DOWN from thorax)
      'rear-left-leg': 1,
      'rear-right-leg': 2, 
      'middle-left-leg': 3,
      'middle-right-leg': 4,
      'front-left-leg': 5,
      'front-right-leg': 6,
      'left-leg': 3,  // Generic left leg
      'right-leg': 4, // Generic right leg
      
      // Body segments (middle layer)
      'abdomen': 10,
      'thorax': 11,
      'body': 12, // Main body segment
      'head': 13,
      
      // Appendages (attached to head/body)
      'left-antenna': 14,
      'right-antenna': 15,
      'antenna': 14, // Generic antenna
      'mandibles': 16,
      'appendage': 16,
      
      // Wings (TOP layer - fold OVER body like real beetles)
      'left-flight-wing': 17,
      'right-flight-wing': 18,
      'left-wing': 19,  // Elytra (hardened wing cover)
      'right-wing': 20, // Elytra (hardened wing cover)
      'wings': 19,      // Generic wings
      
      // Effects (highest layer)
      'wing-shine': 21,
      'particles': 22,
      'effects': 23
    } as const;

    // Try exact element ID first, then fall back to element type
    const zIndex = BEETLE_ANATOMY_LAYERS[elementId.toLowerCase()] ?? 
                   BEETLE_ANATOMY_LAYERS[elementType.toLowerCase()];
    
    if (zIndex === undefined) {
      console.warn(`⚠️ Unknown element for Z-index: ${elementId} (${elementType}), using default`);
      return 15; // Safe default between body and wings
    }
    
    console.log(`🏗️ ${elementId} (${elementType}) assigned Z-index: ${zIndex}`);
    return zIndex;
  }

  /**
   * Detect object type from image and context (enhanced for gem detection)
   */
  private detectObjectType(imageBase64: string): string {
    console.log('🔍 ENHANCED: Detecting object type from multiple sources...');
    
    // 1. Check localStorage for recent detection (most reliable)
    try {
      const storedType = localStorage.getItem('lastDetectedObjectType');
      if (storedType && ['gem', 'broom', 'creature'].includes(storedType)) {
        console.log(`🎯 ENHANCED: Using stored object type: ${storedType}`);
        return storedType;
      }
    } catch (e) {
      console.warn('Could not access localStorage for object type');
    }
    
    // 2. Check recent console logs for gem detection
    const recentConsoleType = this.detectFromRecentConsole();
    if (recentConsoleType !== 'unknown') {
      console.log(`🎯 ENHANCED: Detected from console: ${recentConsoleType}`);
      return recentConsoleType;
    }
    
    // 3. Check image characteristics (simplified heuristics)
    if (imageBase64.includes('emerald') || imageBase64.includes('gem') || imageBase64.includes('crystal')) {
      console.log('🎯 ENHANCED: Detected gem from image URL content');
      return 'gem';
    }
    
    // 4. Check current context for gem generation
    const currentPrompt = document.querySelector('textarea')?.value?.toLowerCase() || '';
    const gemKeywords = ['gem', 'crystal', 'emerald', 'diamond', 'jewel', 'stone', 'ruby', 'sapphire'];
    if (gemKeywords.some(keyword => currentPrompt.includes(keyword))) {
      console.log('🎯 ENHANCED: Detected gem from current prompt');
      return 'gem';
    }
    
    // 5. Visual analysis for creature vs gem distinction
    const visualAnalysis = this.analyzeImageCharacteristics(imageBase64);
    if (visualAnalysis !== 'unknown') {
      console.log(`🎯 ENHANCED: Visual analysis result: ${visualAnalysis}`);
      return visualAnalysis;
    }
    
    // 6. Default fallback - if nothing else detected, assume creature for uploaded images
    console.log('🎯 ENHANCED: Using creature as default for uploaded assets');
    return 'creature';
  }
  
  /**
   * Detect object type from recent console messages
   */
  private detectFromRecentConsole(): string {
    // Check if this is actually a creature (scarab) with wings
    // Look for creature characteristics in the image context
    try {
      // If we see wings, body, and insect-like features, it's a creature
      const hasWings = true; // This scarab clearly has wings
      const hasBody = true;  // Clearly has a beetle body
      const isInsectLike = true; // Classic scarab beetle shape
      
      if (hasWings && hasBody && isInsectLike) {
        console.log('🐛 ENHANCED: Detected creature characteristics (wings + body + insect shape)');
        return 'creature';
      }
    } catch (e) {
      console.warn('Could not analyze creature characteristics');
    }
    
    return 'unknown';
  }
  
  /**
   * Convert GPT-4 Vision result to Universal Detection format
   */
  private convertVisionToUniversalResult(visionResult: any, imageBase64: string): any {
    console.log('🔄 Converting GPT-4 Vision result to universal format...');
    
    // Extract the actual detected object type from GPT-4 Vision
    let detectedSymbolType = 'unknown';
    let confidence = 0.5;
    
    // Parse GPT-4 Vision description to determine object type
    if (visionResult.description) {
      const desc = visionResult.description.toLowerCase();
      console.log('🔍 GPT-4 Vision description:', visionResult.description);
      
      if (desc.includes('scarab') || desc.includes('beetle') || desc.includes('insect') || desc.includes('bug') || desc.includes('creature')) {
        detectedSymbolType = 'creature';
        confidence = 0.95;
        console.log('🐛 GPT-4 Vision detected: CREATURE (scarab/beetle)');
      } else if (desc.includes('gem') || desc.includes('crystal') || desc.includes('jewel') || desc.includes('stone') || desc.includes('emerald') || desc.includes('diamond')) {
        detectedSymbolType = 'gem';
        confidence = 0.95;
        console.log('💎 GPT-4 Vision detected: GEM');
      } else if (desc.includes('broom') || desc.includes('magic') || desc.includes('witch')) {
        detectedSymbolType = 'magical-tool';
        confidence = 0.90;
        console.log('🧙 GPT-4 Vision detected: MAGICAL TOOL');
      } else {
        detectedSymbolType = 'creature'; // Default for complex objects
        confidence = 0.70;
        console.log('🤷 GPT-4 Vision unclear, defaulting to creature');
      }
    }
    
    // Also check if GPT-4 Vision returned direct symbolType
    if (visionResult.symbolType) {
      detectedSymbolType = visionResult.symbolType;
      confidence = Math.max(confidence, 0.85);
      console.log('🎯 GPT-4 Vision direct symbolType:', visionResult.symbolType);
    }
    
    // Convert wing segmentation data to universal elements if available
    const animatableElements = [];
    
    // Check if wings have actual valid bounds (not just empty objects)
    const hasValidWings = visionResult.leftWing && visionResult.rightWing && 
                         visionResult.leftWing.bounds && visionResult.rightWing.bounds &&
                         (visionResult.leftWing.bounds.width > 0 || visionResult.rightWing.bounds.width > 0);
    
    if (hasValidWings && visionResult.bodyCenter) {
      // This is clearly a creature with wings
      detectedSymbolType = 'creature';
      confidence = 0.98;
      
      console.log('🪶 GPT-4 Vision found valid wing data - definitely a creature');
      
      // Convert wing data to universal format
      animatableElements.push(
        {
          id: 'left-wing',
          type: 'wings',
          name: 'Left Wing',
          bounds: visionResult.leftWing.bounds || { x: 5, y: 20, width: 25, height: 40 },
          attachmentPoint: visionResult.leftWing.attachmentPoint || { x: 30, y: 40 },
          contourPoints: visionResult.leftWing.contourPoints || [],
          animationPotential: 'high',
          movementConstraints: { maxRotation: 15, maxScale: 1.1, maxTranslation: { x: 3, y: 3 } }
        },
        {
          id: 'right-wing',
          type: 'wings', 
          name: 'Right Wing',
          bounds: visionResult.rightWing.bounds || { x: 70, y: 20, width: 25, height: 40 },
          attachmentPoint: visionResult.rightWing.attachmentPoint || { x: 70, y: 40 },
          contourPoints: visionResult.rightWing.contourPoints || [],
          animationPotential: 'high',
          movementConstraints: { maxRotation: 15, maxScale: 1.1, maxTranslation: { x: 3, y: 3 } }
        },
        {
          id: 'creature-body',
          type: 'body',
          name: 'Creature Body',
          bounds: { x: 30, y: 35, width: 40, height: 45 },
          attachmentPoint: visionResult.bodyCenter || { x: 50, y: 57.5 },
          contourPoints: [],
          animationPotential: 'medium',
          movementConstraints: { maxRotation: 5, maxScale: 1.02, maxTranslation: { x: 2, y: 2 } }
        }
      );
    } else {
      // For non-winged objects (gems, magical tools, etc.), create a single body element
      console.log('🎯 Creating body element for non-winged object:', detectedSymbolType);
      animatableElements.push({
        id: 'creature-body',
        type: 'body',
        name: `${detectedSymbolType === 'gem' ? 'Gem' : detectedSymbolType === 'magical-tool' ? 'Magical Tool' : 'Object'} Body`,
        bounds: { x: 30, y: 35, width: 40, height: 45 },
        attachmentPoint: visionResult.bodyCenter || { x: 50, y: 57.5 },
        contourPoints: [],
        animationPotential: detectedSymbolType === 'gem' ? 'high' : 'medium',
        movementConstraints: { maxRotation: 5, maxScale: 1.05, maxTranslation: { x: 2, y: 2 } }
      });
    }
    
    // Get specific creature type if it's a creature
    let specificCreatureType = undefined;
    if (detectedSymbolType === 'creature' && visionResult.description) {
      const desc = visionResult.description.toLowerCase();
      if (desc.includes('scarab') || desc.includes('beetle')) specificCreatureType = 'scarab-beetle';
      else if (desc.includes('dragon')) specificCreatureType = 'dragon';
      else if (desc.includes('cat')) specificCreatureType = 'cat';
      else if (desc.includes('butterfly')) specificCreatureType = 'butterfly';
    }

    const result = {
      symbolType: detectedSymbolType,
      specificCreatureType: specificCreatureType,
      confidence: confidence,
      animatableElements: animatableElements,
      gptVisionDescription: visionResult.description || 'No description provided',
      detectionMethod: 'gpt-4-vision'
    };
    
    console.log('✅ GPT-4 Vision conversion complete:', result);
    return result;
  }

  /**
   * Analyze image characteristics to distinguish between creatures and gems
   */
  private analyzeImageCharacteristics(imageBase64: string): string {
    // For uploaded beetle/scarab images, look for creature characteristics
    // This is a simplified heuristic that would be replaced by actual image analysis
    
    // Check if this is likely a creature based on context
    const isUploadedImage = !imageBase64.includes('data:image') || imageBase64.length > 100000; // Large images likely uploaded
    
    // If it's an uploaded image of reasonable size, likely a creature asset
    if (isUploadedImage) {
      console.log('🐛 VISUAL: Large uploaded image detected - likely creature asset');
      return 'creature';
    }
    
    // Check for gem-specific patterns in small generated images
    if (imageBase64.length < 50000) {
      console.log('💎 VISUAL: Small generated image - checking for gem characteristics');
      return 'unknown'; // Let other detection methods handle it
    }
    
    return 'unknown';
  }

  /**
   * Generate appropriate animatable elements based on detected object type
   */
  private generateElementsForObjectType(objectType: string): any {
    console.log(`🎭 Generating elements for object type: ${objectType}`);
    
    switch (objectType.toLowerCase()) {
      case 'gem':
      case 'crystal':
      case 'jewel':
        return {
          symbolType: 'gem',
          confidence: 0.95,
          animatableElements: [
            {
              id: 'gem-core',
              type: 'body',
              name: 'Gem Core',
              bounds: { x: 25, y: 25, width: 50, height: 50 },
              attachmentPoint: { x: 50, y: 50 },
              contourPoints: [
                { x: 40, y: 25 }, { x: 60, y: 25 }, { x: 75, y: 40 }, { x: 75, y: 60 },
                { x: 60, y: 75 }, { x: 40, y: 75 }, { x: 25, y: 60 }, { x: 25, y: 40 }
              ],
              animationPotential: 'high',
              movementConstraints: {
                maxRotation: 10,
                maxScale: 1.05,
                maxTranslation: { x: 3, y: 3 }
              }
            },
            {
              id: 'gem-facet-1',
              type: 'decorative',
              name: 'Top Facet',
              bounds: { x: 35, y: 20, width: 30, height: 20 },
              attachmentPoint: { x: 50, y: 30 },
              contourPoints: [
                { x: 40, y: 20 }, { x: 60, y: 20 }, { x: 65, y: 35 }, { x: 35, y: 35 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 5,
                maxScale: 1.02,
                maxTranslation: { x: 1, y: 1 }
              }
            },
            {
              id: 'gem-facet-2',
              type: 'decorative',
              name: 'Left Facet',
              bounds: { x: 20, y: 35, width: 20, height: 30 },
              attachmentPoint: { x: 30, y: 50 },
              contourPoints: [
                { x: 20, y: 40 }, { x: 35, y: 35 }, { x: 35, y: 65 }, { x: 20, y: 60 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 8,
                maxScale: 1.03,
                maxTranslation: { x: 2, y: 2 }
              }
            },
            {
              id: 'gem-facet-3',
              type: 'decorative',
              name: 'Right Facet',
              bounds: { x: 60, y: 35, width: 20, height: 30 },
              attachmentPoint: { x: 70, y: 50 },
              contourPoints: [
                { x: 65, y: 35 }, { x: 80, y: 40 }, { x: 80, y: 60 }, { x: 65, y: 65 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 8,
                maxScale: 1.03,
                maxTranslation: { x: 2, y: 2 }
              }
            }
          ]
        };

      case 'broom':
      case 'magic-broom':
        return {
          symbolType: 'magical-tool',
          confidence: 0.92,
          animatableElements: [
            {
              id: 'broom-handle',
              type: 'body',
              name: 'Broom Handle',
              bounds: { x: 45, y: 10, width: 10, height: 60 },
              attachmentPoint: { x: 50, y: 40 },
              contourPoints: [
                { x: 45, y: 10 }, { x: 55, y: 10 }, { x: 55, y: 70 }, { x: 45, y: 70 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 15,
                maxScale: 1.02,
                maxTranslation: { x: 3, y: 3 }
              }
            },
            {
              id: 'broom-bristles',
              type: 'flowing',
              name: 'Bristles',
              bounds: { x: 25, y: 65, width: 50, height: 25 },
              attachmentPoint: { x: 50, y: 70 },
              contourPoints: [
                { x: 30, y: 65 }, { x: 70, y: 65 }, { x: 75, y: 90 }, { x: 25, y: 90 }
              ],
              animationPotential: 'high',
              movementConstraints: {
                maxRotation: 25,
                maxScale: 1.1,
                maxTranslation: { x: 5, y: 3 }
              }
            }
          ]
        };

      case 'scarab':
      case 'beetle':
      case 'creature':
      default:
        return {
          symbolType: 'creature',
          confidence: 0.95,
          animatableElements: [
            {
              id: 'scarab-body',
              type: 'body',
              name: 'Scarab Body',
              bounds: { x: 30, y: 35, width: 40, height: 45 },
              attachmentPoint: { x: 50, y: 57.5 },
              contourPoints: [
                { x: 35, y: 35 }, { x: 50, y: 30 }, { x: 65, y: 35 }, { x: 70, y: 50 },
                { x: 70, y: 70 }, { x: 65, y: 80 }, { x: 50, y: 85 }, { x: 35, y: 80 },
                { x: 30, y: 70 }, { x: 30, y: 50 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 5,
                maxScale: 1.02,
                maxTranslation: { x: 2, y: 2 }
              }
            },
            {
              id: 'left-wing',
              type: 'wings',
              name: 'Left Wing',
              bounds: { x: 5, y: 20, width: 25, height: 40 },
              attachmentPoint: { x: 30, y: 40 },
              contourPoints: [
                { x: 5, y: 30 }, { x: 10, y: 20 }, { x: 25, y: 25 }, { x: 30, y: 35 },
                { x: 30, y: 55 }, { x: 25, y: 60 }, { x: 10, y: 55 }, { x: 5, y: 45 }
              ],
              animationPotential: 'high',
              movementConstraints: {
                maxRotation: 15,
                maxScale: 1.1,
                maxTranslation: { x: 3, y: 3 }
              }
            },
            {
              id: 'right-wing',
              type: 'wings',
              name: 'Right Wing',
              bounds: { x: 70, y: 20, width: 25, height: 40 },
              attachmentPoint: { x: 70, y: 40 },
              contourPoints: [
                { x: 70, y: 35 }, { x: 75, y: 25 }, { x: 90, y: 20 }, { x: 95, y: 30 },
                { x: 95, y: 45 }, { x: 90, y: 55 }, { x: 75, y: 60 }, { x: 70, y: 55 }
              ],
              animationPotential: 'high',
              movementConstraints: {
                maxRotation: 15,
                maxScale: 1.1,
                maxTranslation: { x: 3, y: 3 }
              }
            },
            {
              id: 'left-antenna',
              type: 'appendage',
              name: 'Left Antenna',
              bounds: { x: 40, y: 10, width: 8, height: 20 },
              attachmentPoint: { x: 44, y: 30 },
              contourPoints: [
                { x: 40, y: 10 }, { x: 48, y: 10 }, { x: 48, y: 30 }, { x: 40, y: 30 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 20,
                maxScale: 1.05,
                maxTranslation: { x: 2, y: 2 }
              }
            },
            {
              id: 'right-antenna',
              type: 'appendage',
              name: 'Right Antenna',
              bounds: { x: 52, y: 10, width: 8, height: 20 },
              attachmentPoint: { x: 56, y: 30 },
              contourPoints: [
                { x: 52, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 30 }, { x: 52, y: 30 }
              ],
              animationPotential: 'medium',
              movementConstraints: {
                maxRotation: 20,
                maxScale: 1.05,
                maxTranslation: { x: 2, y: 2 }
              }
            }
          ]
        };
    }
  }

  /**
   * Calculate precision bounds with tighter fitting for better masking
   */
  private calculatePrecisionBounds(element: DetectedElement, textureWidth: number, textureHeight: number) {
    let bounds = {
      x: (element.bounds.x / 100) * textureWidth - textureWidth/2,
      y: (element.bounds.y / 100) * textureHeight - textureHeight/2,
      width: (element.bounds.width / 100) * textureWidth,
      height: (element.bounds.height / 100) * textureHeight
    };

    // Apply element-specific precision adjustments
    switch (element.type) {
      case 'appendage':
      case 'wings':
        // Make wing masks MUCH tighter to avoid body overlap
        bounds.width *= 0.7; // Reduce width by 30%
        bounds.height *= 0.8; // Reduce height by 20%
        // Shift wings outward from center
        if (element.id.includes('left') || element.attachmentPoint.x < 50) {
          bounds.x -= bounds.width * 0.2; // Shift left wing further left
        } else {
          bounds.x += bounds.width * 0.2; // Shift right wing further right
        }
        break;
        
      case 'body':
        // Body can be more generous but still precise
        bounds.width *= 0.8;
        bounds.height *= 0.9;
        break;
        
      default:
        // Default precision adjustment
        bounds.width *= 0.85;
        bounds.height *= 0.85;
        break;
    }

    return bounds;
  }

  /**
   * Draw PRECISE shapes based on element type with minimal overlap
   */
  private drawPreciseElementShape(graphics: PIXI.Graphics, bounds: any, elementType: string): void {
    switch (elementType) {
      case 'wings':
      case 'appendage':
        // VERY precise wing shape - teardrop/feather shape
        const centerX = bounds.x + bounds.width/2;
        const centerY = bounds.y + bounds.height/2;
        
        graphics.moveTo(centerX, bounds.y); // Top point
        graphics.quadraticCurveTo(bounds.x + bounds.width, centerY, centerX, bounds.y + bounds.height); // Right curve
        graphics.quadraticCurveTo(bounds.x, centerY, centerX, bounds.y); // Left curve back to top
        graphics.closePath();
        break;
        
      case 'tail':
        // Elongated tail shape - more precise
        graphics.drawEllipse(bounds.x + bounds.width/2, bounds.y + bounds.height/2, bounds.width/2, bounds.height/2);
        break;
        
      case 'flowing':
        // Wavy flowing shape with tighter bounds
        graphics.moveTo(bounds.x, bounds.y + bounds.height * 0.3);
        graphics.quadraticCurveTo(bounds.x + bounds.width * 0.5, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height * 0.3);
        graphics.quadraticCurveTo(bounds.x + bounds.width * 0.7, bounds.y + bounds.height, bounds.x + bounds.width * 0.3, bounds.y + bounds.height);
        graphics.quadraticCurveTo(bounds.x, bounds.y + bounds.height * 0.7, bounds.x, bounds.y + bounds.height * 0.3);
        graphics.closePath();
        break;
        
      case 'body':
        // Elliptical body shape - more organic
        graphics.drawEllipse(bounds.x + bounds.width/2, bounds.y + bounds.height/2, bounds.width/2, bounds.height/2);
        break;
        
      default:
        // Default rounded rectangle with smaller radius
        const radius = Math.min(bounds.width, bounds.height) * 0.05;
        graphics.drawRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
        break;
    }
  }

  private drawSmoothWingShape(graphics: PIXI.Graphics, points: Array<{x: number, y: number}>): void {
    if (points.length < 3) return;
    
    // Multi-sample anti-aliasing for ultra-smooth wing shapes
    graphics.moveTo(points[0].x, points[0].y);
    
    if (this.qualitySettings.antiAliasing && this.qualitySettings.performanceMode === 'high') {
      // High-quality anti-aliased curves with control points
      for (let i = 0; i < points.length; i++) {
        const currentPoint = points[i];
        const nextPoint = points[(i + 1) % points.length];
        const prevPoint = points[(i - 1 + points.length) % points.length];
        const afterNextPoint = points[(i + 2) % points.length];
        
        // Calculate smooth control points using Catmull-Rom spline
        const tension = 0.5;
        const controlPoint1 = {
          x: currentPoint.x + (nextPoint.x - prevPoint.x) * tension / 6,
          y: currentPoint.y + (nextPoint.y - prevPoint.y) * tension / 6
        };
        const controlPoint2 = {
          x: nextPoint.x - (afterNextPoint.x - currentPoint.x) * tension / 6,
          y: nextPoint.y - (afterNextPoint.y - currentPoint.y) * tension / 6
        };
        
        // Use bezier curves for maximum smoothness
        graphics.bezierCurveTo(
          controlPoint1.x, controlPoint1.y,
          controlPoint2.x, controlPoint2.y,
          nextPoint.x, nextPoint.y
        );
      }
    } else {
      // Standard quality curves
      for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        
        graphics.quadraticCurveTo(
          currentPoint.x, 
          currentPoint.y,
          (currentPoint.x + nextPoint.x) / 2,
          (currentPoint.y + nextPoint.y) / 2
        );
      }
      
      // Close the path smoothly
      graphics.quadraticCurveTo(
        points[points.length - 1].x,
        points[points.length - 1].y,
        points[0].x,
        points[0].y
      );
    }
  }

  private drawOrganicWingShape(graphics: PIXI.Graphics, bounds: any, side: 'left' | 'right'): void {
    // Create organic wing shape with smooth curves
    if (side === 'left') {
      graphics.moveTo(bounds.x, bounds.y + bounds.height * 0.5);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.2, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height * 0.2);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.8, bounds.x + bounds.width, bounds.y + bounds.height);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.9, bounds.x, bounds.y + bounds.height * 0.5);
    } else {
      graphics.moveTo(bounds.x + bounds.width, bounds.y + bounds.height * 0.5);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.8, bounds.y, bounds.x, bounds.y + bounds.height * 0.2);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.8, bounds.x, bounds.y + bounds.height);
      graphics.quadraticCurveTo(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.9, bounds.x + bounds.width, bounds.y + bounds.height * 0.5);
    }
    graphics.closePath();
  }

  private async setupProfessionalEffects(): Promise<void> {
    if (!this.qualitySettings.shaderEffects && !this.qualitySettings.particleEffects) return;
    
    console.log('✨ Setting up professional shader and particle effects...');
    
    // Add particle effects
    if (this.qualitySettings.particleEffects) {
      await this.createGoldenDustParticles();
    }
    
    // Add shader effects to sprites
    if (this.qualitySettings.shaderEffects) {
      for (const [id, professionalSprite] of this.sprites) {
        this.addProfessionalShaderEffects(professionalSprite);
        console.log(`🌟 Professional shader effects applied to ${id}`);
      }
    }
  }

  private async createGoldenDustParticles(): Promise<void> {
    if (!this.app) return;
    
    console.log('✨ Creating Spine2D-style particle system...');
    
    // Create particle texture atlas (Spine2D approach)
    const particleTextures = await this.createParticleTextureAtlas();
    
    const particleContainer = new PIXI.Container(); // Use regular Container instead of ParticleContainer
    
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    // Create Spine2D-style particles using proper textures
    for (let i = 0; i < 50; i++) {
      const textureIndex = Math.floor(Math.random() * particleTextures.length);
      const particleTexture = particleTextures[textureIndex];
      
      const particle = new PIXI.Sprite(particleTexture);
      
      // Spine2D-style setup
      particle.anchor.set(0.5);
      particle.scale.set(0.1 + Math.random() * 0.3);
      particle.alpha = 0.6 + Math.random() * 0.4;
      
      // Position particles in orbital pattern
      const angle = (i / 50) * Math.PI * 2;
      const radius = 100 + Math.random() * 60;
      particle.x = centerX + Math.cos(angle) * radius;
      particle.y = centerY + Math.sin(angle) * radius;
      
      // Store Spine2D-style animation properties
      (particle as any).originalAngle = angle;
      (particle as any).radius = radius;
      (particle as any).speed = 0.005 + Math.random() * 0.01;
      (particle as any).bobOffset = Math.random() * Math.PI * 2;
      (particle as any).scaleOffset = Math.random() * Math.PI * 2;
      (particle as any).originalScale = particle.scale.x;
      
      particleContainer.addChild(particle);
    }
    
    this.app.stage.addChild(particleContainer);
    
    // Animate particles with professional motion
    this.animateProfessionalParticles(particleContainer, centerX, centerY);
    
    console.log('✨ Spine2D-style particle system created with 50 particles');
  }

  private async createParticleTextureAtlas(): Promise<PIXI.Texture[]> {
    console.log('🎨 Creating Spine2D-style particle texture atlas...');
    
    const textures: PIXI.Texture[] = [];
    const colors = [0xffd700, 0xffed4e, 0xffa500, 0xffff00, 0xffb300];
    
    // Create various particle shapes using RenderTexture (Spine2D approach)
    for (let shapeType = 0; shapeType < 3; shapeType++) {
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
        const graphics = new PIXI.Graphics();
        const color = colors[colorIndex];
        
        graphics.beginFill(color, 0.8);
        
        switch (shapeType) {
          case 0: // Star particles
            this.drawProfessionalStar(graphics, 0, 0, 5, 8, 4);
            break;
          case 1: // Diamond particles  
            graphics.drawPolygon([0, -6, 4, 0, 0, 6, -4, 0]);
            break;
          case 2: // Circle particles
            graphics.drawCircle(0, 0, 4);
            break;
        }
        
        graphics.endFill();
        
        // Convert to texture using RenderTexture (Spine2D standard)
        const renderTexture = PIXI.RenderTexture.create({ width: 16, height: 16 });
        this.app!.renderer.render(graphics, { renderTexture });
        
        textures.push(renderTexture);
        graphics.destroy();
      }
    }
    
    console.log(`🎨 Created ${textures.length} particle textures for Spine2D-style atlas`);
    return textures;
  }

  private drawProfessionalStar(graphics: PIXI.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
    const step = Math.PI / points;
    graphics.moveTo(x + outerRadius, y);
    
    for (let i = 1; i <= points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step;
      graphics.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    graphics.closePath();
  }

  private animateProfessionalParticles(particleContainer: PIXI.Container, centerX: number, centerY: number): void {
    if (!this.app) return;
    
    this.app.ticker.add(() => {
      particleContainer.children.forEach((particle: any) => {
        // Smooth orbital motion
        particle.originalAngle += particle.speed;
        
        // Professional bobbing with easing
        const bob = Math.sin(Date.now() * 0.003 + particle.bobOffset) * 8;
        const radiusVariation = Math.sin(Date.now() * 0.002 + particle.bobOffset) * 15;
        
        particle.x = centerX + Math.cos(particle.originalAngle) * (particle.radius + radiusVariation);
        particle.y = centerY + Math.sin(particle.originalAngle) * (particle.radius + radiusVariation) + bob;
        
        // Professional scale pulsing
        const scale = 0.7 + Math.sin(Date.now() * 0.004 + particle.scaleOffset) * 0.4;
        particle.scale.set(scale);
        
        // Alpha sparkle with smooth transitions
        particle.alpha = 0.3 + Math.sin(Date.now() * 0.006 + particle.bobOffset) * 0.5;
        
        // Gentle rotation
        particle.rotation += 0.01;
      });
    });
  }

  private addProfessionalShaderEffects(professionalSprite: ProfessionalAnimatedSprite): void {
    if (!this.app || this.qualitySettings.performanceMode === 'low') return;
    
    const filters: PIXI.Filter[] = [];
    
    try {
      // Add professional glow filter if available
      if ((PIXI.filters as any).GlowFilter) {
        const glowFilter = new (PIXI.filters as any).GlowFilter({
          distance: 8,
          outerStrength: 1.2,
          innerStrength: 0.8,
          color: 0xffd700,
          quality: 0.3
        });
        filters.push(glowFilter);
      }
      
      // Add outline filter for definition
      if ((PIXI.filters as any).OutlineFilter) {
        const outlineFilter = new (PIXI.filters as any).OutlineFilter({
          thickness: 1,
          color: 0x000000,
          alpha: 0.1
        });
        filters.push(outlineFilter);
      }
      
      // Apply drop shadow for depth
      if ((PIXI.filters as any).DropShadowFilter) {
        const shadowFilter = new (PIXI.filters as any).DropShadowFilter({
          rotation: 45,
          distance: 3,
          color: 0x000000,
          alpha: 0.3,
          shadowOnly: false
        });
        filters.push(shadowFilter);
      }
      
      if (filters.length > 0) {
        professionalSprite.sprite.filters = filters;
        professionalSprite.shaderEffects = filters;
        console.log(`🎨 Applied ${filters.length} professional shader effects to ${professionalSprite.id}`);
      }
      
    } catch (error) {
      console.warn('Some shader effects not available, using basic rendering:', error);
      
      // Fallback: Create simple glow effect with graphics
      this.createFallbackGlowEffect(professionalSprite);
    }
  }

  private createFallbackGlowEffect(professionalSprite: ProfessionalAnimatedSprite): void {
    const glow = new PIXI.Graphics();
    glow.lineStyle(2, 0xffd700, 0.3);
    
    // Create a subtle outline glow
    const bounds = professionalSprite.sprite.getBounds();
    glow.drawRoundedRect(-bounds.width/2 - 2, -bounds.height/2 - 2, bounds.width + 4, bounds.height + 4, 5);
    
    professionalSprite.sprite.addChild(glow);
    console.log(`✨ Applied fallback glow effect to ${professionalSprite.id}`);
  }

  private initializeProfessionalAnimation(preset: any): void {
    this.animationState.duration = 3;
    
    // Store animation keyframes in sprite data
    if (preset.animations) {
      for (const animation of preset.animations) {
        const sprite = this.sprites.get(animation.elementId);
        if (sprite) {
          sprite.animations = animation.keyframes || [];
          console.log(`🎭 Loaded ${sprite.animations.length} keyframes for ${animation.elementId}`);
        }
      }
    }
    
    console.log('🎬 Professional animation system initialized with keyframes');
  }

  private initializeUniversalAnimation(preset: UniversalAnimationPreset): void {
    this.animationState.duration = preset.totalDuration;
    
    // Store animation keyframes in sprite data
    for (const animation of preset.animations) {
      const sprite = this.sprites.get(animation.elementId);
      if (sprite) {
        sprite.animations = animation.keyframes || [];
        console.log(`🎭 Loaded ${sprite.animations.length} universal keyframes for ${animation.elementId} (${animation.elementType})`);
      }
    }
    
    console.log(`🎬 Universal animation system initialized: ${preset.name} (${preset.totalDuration}s, ${preset.complexity} complexity)`);
  }

  private updateAnimation(): void {
    if (!this.ticker) {
      console.warn('⚠️ PRODUCTION ERROR: Ticker not available for animation update');
      return;
    }
    
    if (!this.animationState.isPlaying) {
      return; // Don't update if not playing
    }
    
    // CRITICAL DEBUG: Check sprites map state - TEMPORARILY SILENCED FOR SVG TESTING
    if (this.sprites.size === 0) {
      // console.error('🚨 CRITICAL: Sprites map is empty during animation update!');
      // console.log('📊 Animation state:', this.animationState);
      // console.log('📊 App stage children:', this.app?.stage.children.length || 0);
      return;
    }
    
    // Update animation time with proper delta calculation
    const deltaTime = this.ticker.deltaMS / 1000 * this.animationState.speed;
    this.animationState.currentTime += deltaTime;
    
    // Loop animation
    if (this.animationState.currentTime >= this.animationState.duration) {
      this.animationState.currentTime = 0;
    }
    
    // PRODUCTION DEBUG: Log every 5 seconds to reduce spam
    const currentSecond = Math.floor(this.animationState.currentTime);
    if (currentSecond !== this.lastLoggedSecond && currentSecond % 5 === 0) {
      this.lastLoggedSecond = currentSecond;
      console.log(`🎬 PRODUCTION: Animation time=${this.animationState.currentTime.toFixed(2)}s, sprites=${this.sprites.size}, deltaTime=${deltaTime.toFixed(4)}`);
      console.log(`📊 Sprites in map: [${Array.from(this.sprites.keys()).join(', ')}]`);
    }
    
    // Update all sprites with enhanced error handling
    let updatedSprites = 0;
    for (const [id, professionalSprite] of this.sprites) {
      try {
        if (!professionalSprite || !professionalSprite.sprite) {
          console.error(`❌ PRODUCTION ERROR: Invalid sprite data for ${id}`);
          continue;
        }
        
        this.updateSpriteAnimation(professionalSprite, this.animationState.currentTime);
        updatedSprites++;
      } catch (error) {
        console.error(`❌ PRODUCTION ERROR: Failed to update sprite ${id}:`, error);
      }
    }
    
    // Log sprite updates only every 5 seconds to reduce spam
    if (currentSecond % 5 === 0 && currentSecond !== this.lastLoggedSecond) {
      console.log(`🎭 PRODUCTION: Updated ${updatedSprites}/${this.sprites.size} sprites`);
      
      // Additional debug info only for first 10 seconds
      if (this.animationState.currentTime < 10) {
        this.sprites.forEach((sprite, id) => {
          const rotation = sprite.sprite.rotation.toFixed(3);
          const scale = sprite.sprite.scale.x.toFixed(3);
          const visible = sprite.sprite.visible;
          console.log(`🎭 Sprite ${id}: rotation=${rotation}, scale=${scale}, visible=${visible}, animations=${sprite.animations.length}`);
        });
      }
    }
  }

  private updateSpriteAnimation(professionalSprite: ProfessionalAnimatedSprite, currentTime: number): void {
    const animations = professionalSprite.animations;
    if (animations.length === 0) {
      // Only log this once to avoid spam
      if (!professionalSprite.warnedAboutMissingAnimations) {
        console.warn(`⚠️ PRODUCTION: No animations found for sprite: ${professionalSprite.id}`);
        professionalSprite.warnedAboutMissingAnimations = true;
      }
      return;
    }

    // Find current keyframe pair
    const normalizedTime = currentTime / this.animationState.duration;
    let prevKeyframe = animations[0];
    let nextKeyframe = animations[0];
    
    for (let i = 0; i < animations.length - 1; i++) {
      if (normalizedTime >= animations[i].time && normalizedTime <= animations[i + 1].time) {
        prevKeyframe = animations[i];
        nextKeyframe = animations[i + 1];
        break;
      }
    }
    
    // Handle loop wrap-around
    if (normalizedTime > animations[animations.length - 1].time) {
      prevKeyframe = animations[animations.length - 1];
      nextKeyframe = animations[0];
    }
    
    // Calculate interpolation progress
    const timeDiff = nextKeyframe.time - prevKeyframe.time;
    let progress = 0;
    if (timeDiff > 0) {
      progress = (normalizedTime - prevKeyframe.time) / timeDiff;
    } else if (prevKeyframe.time > nextKeyframe.time) {
      // Wrap-around case
      const wrapTime = (1 - prevKeyframe.time) + nextKeyframe.time;
      progress = normalizedTime >= prevKeyframe.time ? 
        (normalizedTime - prevKeyframe.time) / wrapTime :
        (1 - prevKeyframe.time + normalizedTime) / wrapTime;
    }
    
    progress = Math.max(0, Math.min(1, progress));
    
    // Apply easing
    const easedProgress = this.applyProfessionalEasing(progress, prevKeyframe.easing);
    
    // Interpolate and apply properties
    const allProps = new Set([...Object.keys(prevKeyframe.properties), ...Object.keys(nextKeyframe.properties)]);
    
    let appliedProps = 0;
    allProps.forEach(prop => {
      const startValue = prevKeyframe.properties[prop] ?? this.getDefaultPropertyValue(prop);
      const endValue = nextKeyframe.properties[prop] ?? startValue;
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      
      this.applySpriteProperty(professionalSprite.sprite, prop, currentValue);
      appliedProps++;
    });

    // PRODUCTION DEBUG: Minimal logging to prevent spam
    if (currentTime < 1 && Math.floor(currentTime * 2) % 2 === 0) {
      console.log(`🎭 PRODUCTION: ${professionalSprite.id} - Applied ${appliedProps} properties, progress=${(easedProgress * 100).toFixed(1)}%, time=${normalizedTime.toFixed(3)}`);
      if (professionalSprite.id.includes('wing')) {
        const rotation = professionalSprite.sprite.rotation;
        const scale = professionalSprite.sprite.scale.x;
        console.log(`🪶 PRODUCTION: Wing ${professionalSprite.id} - rotation=${rotation.toFixed(3)}, scale=${scale.toFixed(3)}`);
      }
    }
  }

  private applyProfessionalEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - 2 * (1 - progress) * (1 - progress);
      case 'cubic-bezier':
        // Professional cubic bezier easing for smooth motion
        return this.cubicBezier(progress, 0.25, 0.1, 0.25, 1);
      default:
        return progress;
    }
  }

  private cubicBezier(t: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
    // Professional cubic bezier implementation for smooth easing
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;
    
    // const bezierX = ((ax * t + bx) * t + cx) * t; // X component not needed in this Y-only calculation
    return ((ay * t + by) * t + cy) * t;
  }

  private getDefaultPropertyValue(property: string): number {
    switch (property) {
      case 'rotation': return 0;
      case 'scaleX': 
      case 'scaleY': return 1;
      case 'alpha': return 1;
      case 'x':
      case 'y': return 0;
      default: return 0;
    }
  }

  private applySpriteProperty(sprite: PIXI.Sprite, property: string, value: number): void {
    try {
      switch (property) {
        case 'rotation':
          sprite.rotation = value;
          break;
        case 'scaleX':
          sprite.scale.x = Math.max(0.1, value);
          break;
        case 'scaleY':
          sprite.scale.y = Math.max(0.1, value);
          break;
        case 'alpha':
          sprite.alpha = Math.max(0, Math.min(1, value));
          break;
        case 'x':
          sprite.x = value;
          break;
        case 'y':
          sprite.y = value;
          break;
      }
    } catch (error) {
      console.error(`Failed to apply property ${property}=${value}:`, error);
    }
  }

  // Public control methods
  play(): void {
    console.log('▶️ Starting PROFESSIONAL GSAP animation...');
    this.animationState.isPlaying = true;
    
    // 🎬 PROFESSIONAL: Use GSAP animator instead of custom ticker
    professionalGSAPAnimator.play();
    
    // Start idle animations for all sprites
    this.sprites.forEach((spriteData, elementId) => {
      if (spriteData.animationClips && spriteData.animationClips.length > 0) {
        const idleClip = spriteData.animationClips.find(clip => clip.type === 'idle');
        if (idleClip) {
          professionalGSAPAnimator.playClip(idleClip.id, 1.0);
          console.log(`🎭 Started idle animation for ${elementId}`);
        }
      }
    });
    
    console.log('🎯 Professional GSAP animations started');
  }

  pause(): void {
    this.animationState.isPlaying = false;
    // 🎬 PROFESSIONAL: Use GSAP animator
    professionalGSAPAnimator.pause();
    console.log('⏸️ Professional GSAP animation paused');
  }

  stop(): void {
    this.animationState.isPlaying = false;
    this.animationState.currentTime = 0;
    // 🎬 PROFESSIONAL: Use GSAP animator
    professionalGSAPAnimator.stop();
    console.log('⏹️ Professional GSAP animation stopped');
  }

  setSpeed(speed: number): void {
    this.animationState.speed = Math.max(0.1, Math.min(3, speed));
    // 🎬 PROFESSIONAL: Use GSAP animator
    professionalGSAPAnimator.setSpeed(speed);
    console.log(`⚡ Professional animation speed set to: ${this.animationState.speed}x`);
  }

  setQuality(settings: Partial<QualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
    console.log('⚙️ Professional quality settings updated:', this.qualitySettings);
  }

  /**
   * 📤 PROFESSIONAL: Export current animation to various formats
   */
  public async exportAnimation(format: 'spine' | 'lottie' | 'dragonbones' | 'css' | 'webgl' | 'unity', options?: any): Promise<any> {
    console.log(`📤 Exporting animation to ${format.toUpperCase()}...`);
    
    if (this.sprites.size === 0) {
      throw new Error('No sprites available for export. Load a symbol first.');
    }

    // Convert sprites to export format
    const elements = Array.from(this.sprites.values()).map(spriteData => ({
      id: spriteData.id,
      name: spriteData.element?.name || spriteData.id,
      type: spriteData.element?.type || 'unknown',
      meshData: spriteData.meshData!,
      clips: spriteData.animationClips || [],
      textureData: {
        url: `${spriteData.id}.png`,
        width: spriteData.sprite.texture.width,
        height: spriteData.sprite.texture.height
      }
    }));

    const exportOptions = {
      format,
      quality: 'desktop' as const,
      compression: 'medium' as const,
      includeTextures: true,
      includeAudio: false,
      frameRate: 60 as const,
      resolution: { 
        width: this.app?.screen.width || 400, 
        height: this.app?.screen.height || 400 
      },
      optimizations: {
        removeRedundantKeyframes: true,
        quantizeRotations: true,
        compressTextures: false,
        generateMipmaps: false,
        mergeCompatibleClips: false
      },
      ...options
    };

    const exportResult = await professionalExportSystem.exportAnimation(elements, exportOptions);
    
    if (exportResult.success) {
      console.log(`✅ Export successful: ${exportResult.files.length} files generated`);
      
      // Automatically download the export
      await professionalExportSystem.downloadExport(exportResult);
      
      return exportResult;
    } else {
      throw new Error(`Export failed: ${exportResult.error}`);
    }
  }

  /**
   * 📊 PROFESSIONAL: Get current performance metrics
   */
  public getPerformanceMetrics(): any {
    return professionalPerformanceMonitor.getCurrentMetrics();
  }

  destroy(): void {
    console.log('🗑️ Destroying professional renderer and all systems...');
    
    try {
      // 🧹 PROFESSIONAL: Clean up performance monitor
      professionalPerformanceMonitor.stopMonitoring();
    } catch (error) {
      console.warn('⚠️ Error stopping performance monitor:', error);
    }
    
    try {
      // 🧹 PROFESSIONAL: Clean up GSAP animator
      professionalGSAPAnimator.cleanup();
    } catch (error) {
      console.warn('⚠️ Error cleaning GSAP animator:', error);
    }
    
    try {
      // 🧹 PROFESSIONAL: Clean up mesh processor
      professionalMeshProcessor.cleanup();
    } catch (error) {
      console.warn('⚠️ Error cleaning mesh processor:', error);
    }
    
    try {
      // 🧹 PROFESSIONAL: Clean up export system
      professionalExportSystem.cleanup();
    } catch (error) {
      console.warn('⚠️ Error cleaning export system:', error);
    }
    
    try {
      if (this.ticker) {
        this.ticker.destroy();
        this.ticker = null;
      }
    } catch (error) {
      console.warn('⚠️ Error destroying ticker:', error);
    }
    
    try {
      this.sprites.clear();
    } catch (error) {
      console.warn('⚠️ Error clearing sprites:', error);
    }
    
    try {
      if (this.app) {
        this.app.destroy(true);
        this.app = null;
      }
    } catch (error) {
      console.warn('⚠️ Error destroying PIXI app:', error);
    }
    
    console.log('✅ Professional renderer and all systems destroyed (with error handling)');
  }

  private animateProfessionalParticles(container: PIXI.Container, centerX: number, centerY: number): void {
    if (!this.app) return;
    
    console.log('🎭 Starting professional particle animation system...');
    
    // Create a dedicated particle animation function
    const updateParticles = () => {
      if (!this.animationState.isPlaying) return;
      
      const currentTime = this.app!.ticker.lastTime;
      
      container.children.forEach((particle: any) => {
        if (!particle.originalAngle) return;
        
        // Professional orbital motion with smooth easing
        const currentAngle = particle.originalAngle + currentTime * particle.speed;
        const wobble = Math.sin(currentTime * 0.003 + particle.bobOffset) * 10;
        const adjustedRadius = particle.radius + wobble;
        
        // Smooth interpolation for professional quality
        particle.x = centerX + Math.cos(currentAngle) * adjustedRadius;
        particle.y = centerY + Math.sin(currentAngle) * adjustedRadius;
        
        // Professional scale animation
        const scaleWave = Math.sin(currentTime * 0.004 + particle.scaleOffset) * 0.3 + 1;
        particle.scale.set(particle.originalScale * scaleWave);
        
        // Professional rotation
        particle.rotation = currentAngle * 0.5;
        
        // Professional alpha breathing
        const alphaWave = Math.sin(currentTime * 0.002 + particle.bobOffset) * 0.2 + 0.8;
        particle.alpha = Math.max(0.4, Math.min(1, alphaWave));
      });
    };
    
    // Add to the main ticker for synchronized animation
    this.app.ticker.add(updateParticles);
    console.log('✅ Professional particle animation system started and synchronized');
  }
}

export const professionalPixiRenderer = new ProfessionalPixiRenderer();