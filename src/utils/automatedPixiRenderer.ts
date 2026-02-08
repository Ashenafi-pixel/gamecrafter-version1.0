import * as PIXI from 'pixi.js';
import { AutomatedAnimationPreset, AISymbolAnalysis } from './aiAnimationEngine';
import { aiWingSegmentation, SegmentationResult } from './aiWingSegmentation';

export interface PixiAnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

export interface AutomatedSprite {
  id: string;
  sprite: PIXI.Sprite;
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
}

class AutomatedPixiRenderer {
  private app: PIXI.Application | null = null;
  private sprites: Map<string, AutomatedSprite> = new Map();
  private effects: PIXI.Container[] = [];
  private animationState: PixiAnimationState = {
    isPlaying: false,
    currentTime: 0,
    duration: 2,
    speed: 1,
    loop: true
  };
  private ticker: PIXI.Ticker | null = null;
  private performanceMonitor = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0
  };

  async initializeRenderer(container: HTMLElement, width: number, height: number): Promise<PIXI.Application> {
    console.log('🎮 Initializing automated PIXI renderer...');

    // Clean up existing app
    if (this.app) {
      this.destroy();
    }

    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a1a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Add canvas to container
    container.appendChild(this.app.view as HTMLCanvasElement);

    // Setup animation ticker
    this.ticker = new PIXI.Ticker();
    this.ticker.add(this.updateAnimation.bind(this));
    
    // Don't auto-start ticker, wait for explicit play() call
    console.log('🎬 Animation ticker created (waiting for play command)');

    console.log('✅ PIXI renderer initialized');
    return this.app;
  }

  async loadSymbolWithAutomation(
    imageUrl: string, 
    analysis: AISymbolAnalysis, 
    preset: AutomatedAnimationPreset
  ): Promise<void> {
    if (!this.app) throw new Error('Renderer not initialized');

    console.log('📸 Loading symbol with automated setup...');

    try {
      // Clear existing content
      this.clearScene();

      // Load base texture
      const baseTexture = await PIXI.Texture.fromURL(imageUrl);
      
      // Perform AI wing segmentation for precise wing isolation
      console.log('🔍 Performing advanced AI wing segmentation...');
      let segmentation: SegmentationResult | null = null;
      
      try {
        segmentation = await aiWingSegmentation.segmentWings(imageUrl);
        console.log(`✅ Wing segmentation complete - Left: ${segmentation.leftWing.confidence.toFixed(2)}, Right: ${segmentation.rightWing.confidence.toFixed(2)}`);
      } catch (segError) {
        console.warn('⚠️ Wing segmentation failed, using fallback method:', segError);
      }
      
      // Always use GPT-4 Vision segmentation when available
      if (segmentation) {
        console.log('✅ FORCING GPT-4 Vision segmentation path - bypassing quality check');
        console.log(`🔹 Segmentation confidence: ${segmentation.confidence.toFixed(2)}`);
        console.log(`🔹 Left wing confidence: ${segmentation.leftWing.confidence.toFixed(2)}`);
        console.log(`🔹 Right wing confidence: ${segmentation.rightWing.confidence.toFixed(2)}`);
        await this.createSegmentedSprites(baseTexture, segmentation, analysis, preset);
      } else {
        console.log('⚠️ No segmentation available, using GPT-4 Vision analysis instead');
        await this.createVisionBasedSprites(baseTexture, analysis, preset);
      }

      // Setup effects
      await this.setupAutomatedEffects(preset);

      // Initialize animation timeline
      this.initializeAnimationTimeline(preset);

      // Start animation immediately for zero-click mode
      this.animationState.isPlaying = true;
      this.play();

      console.log('✅ Symbol loaded with enhanced wing animation system');

    } catch (error) {
      console.error('❌ Failed to load symbol:', error);
      throw error;
    }
  }

  private async createSegmentedSprites(
    baseTexture: PIXI.Texture,
    segmentation: SegmentationResult,
    analysis: AISymbolAnalysis,
    preset: AutomatedAnimationPreset
  ): Promise<void> {
    console.log('🦴 Creating segmented sprites with AI-precise wing isolation...');
    
    const scale = Math.min(400 / segmentation.originalWidth, 400 / segmentation.originalHeight);
    const centerX = this.app!.screen.width / 2;
    const centerY = this.app!.screen.height / 2;

    // Create body sprite (non-wing parts)
    const bodyTexture = await aiWingSegmentation.createMaskedTexture(
      baseTexture, 
      segmentation.bodyMask, 
      segmentation.originalWidth, 
      segmentation.originalHeight
    );
    
    const bodySprite = new PIXI.Sprite(bodyTexture);
    bodySprite.anchor.set(0.5);
    bodySprite.scale.set(scale);
    bodySprite.x = centerX;
    bodySprite.y = centerY;
    this.app!.stage.addChild(bodySprite);

    // Find body animation
    const bodyAnimation = preset.animations.find(anim => anim.elementId === 'body');
    this.sprites.set('body', {
      id: 'body',
      sprite: bodySprite,
      originalTransform: {
        x: bodySprite.x,
        y: bodySprite.y,
        scaleX: bodySprite.scale.x,
        scaleY: bodySprite.scale.y,
        rotation: bodySprite.rotation,
        alpha: bodySprite.alpha
      },
      animations: bodyAnimation?.keyframes || []
    });

    // Create left wing sprite with precise segmentation
    const leftWingTexture = await aiWingSegmentation.createMaskedTexture(
      baseTexture,
      segmentation.leftWing.maskData,
      segmentation.originalWidth,
      segmentation.originalHeight
    );
    
    const leftWingSprite = new PIXI.Sprite(leftWingTexture);
    // Set anchor point to wing connection point for realistic rotation
    leftWingSprite.anchor.set(
      segmentation.leftWing.anchorPoint.x / segmentation.originalWidth,
      segmentation.leftWing.anchorPoint.y / segmentation.originalHeight
    );
    leftWingSprite.scale.set(scale);
    leftWingSprite.x = centerX;
    leftWingSprite.y = centerY;
    this.app!.stage.addChild(leftWingSprite);

    // Create right wing sprite with precise segmentation
    const rightWingTexture = await aiWingSegmentation.createMaskedTexture(
      baseTexture,
      segmentation.rightWing.maskData,
      segmentation.originalWidth,
      segmentation.originalHeight
    );
    
    const rightWingSprite = new PIXI.Sprite(rightWingTexture);
    // Set anchor point to wing connection point for realistic rotation
    rightWingSprite.anchor.set(
      segmentation.rightWing.anchorPoint.x / segmentation.originalWidth,
      segmentation.rightWing.anchorPoint.y / segmentation.originalHeight
    );
    rightWingSprite.scale.set(scale);
    rightWingSprite.x = centerX;
    rightWingSprite.y = centerY;
    this.app!.stage.addChild(rightWingSprite);

    // Add wing sprites to animation system
    const leftWingAnimation = preset.animations.find(anim => anim.elementId === 'left-wing');
    const rightWingAnimation = preset.animations.find(anim => anim.elementId === 'right-wing');
    

    this.sprites.set('left-wing', {
      id: 'left-wing',
      sprite: leftWingSprite,
      originalTransform: {
        x: leftWingSprite.x,
        y: leftWingSprite.y,
        scaleX: leftWingSprite.scale.x,
        scaleY: leftWingSprite.scale.y,
        rotation: leftWingSprite.rotation,
        alpha: leftWingSprite.alpha
      },
      animations: leftWingAnimation?.keyframes || []
    });

    this.sprites.set('right-wing', {
      id: 'right-wing',
      sprite: rightWingSprite,
      originalTransform: {
        x: rightWingSprite.x,
        y: rightWingSprite.y,
        scaleX: rightWingSprite.scale.x,
        scaleY: rightWingSprite.scale.y,
        rotation: rightWingSprite.rotation,
        alpha: rightWingSprite.alpha
      },
      animations: rightWingAnimation?.keyframes || []
    });

    console.log(`✅ Created ${this.sprites.size} segmented sprites with precise wing boundaries`);
    console.log(`🔹 Left wing confidence: ${segmentation.leftWing.confidence.toFixed(2)}`);
    console.log(`🔹 Right wing confidence: ${segmentation.rightWing.confidence.toFixed(2)}`);
  }

  // NEW: Vision-based sprite creation using GPT-4 Vision analysis directly
  private async createVisionBasedSprites(
    baseTexture: PIXI.Texture, 
    analysis: AISymbolAnalysis, 
    preset: AutomatedAnimationPreset
  ): Promise<void> {
    console.log('🎭 Creating vision-based sprites using GPT-4 Vision analysis');
    
    const centerX = this.app!.screen.width / 2;
    const centerY = this.app!.screen.height / 2;
    
    // Calculate optimal scale
    const maxSize = Math.min(this.app!.screen.width, this.app!.screen.height) * 0.6;
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);

    // Use GPT-4 Vision to analyze and create proper masks
    const { analyzeSymbolWithGPTVision } = await import('./gptVisionClient');
    const visionResult = await analyzeSymbolWithGPTVision(baseTexture.baseTexture.resource.source.src);
    
    console.log('🔍 GPT-4 Vision result for sprite creation:', visionResult);
    
    // Create body sprite with proper mask
    const bodySprite = new PIXI.Sprite(baseTexture);
    bodySprite.anchor.set(0.5);
    bodySprite.scale.set(scale);
    bodySprite.x = centerX;
    bodySprite.y = centerY;
    
    // Create proper body mask using vision data
    const bodyMask = this.createVisionBodyMask(visionResult, baseTexture.width, baseTexture.height);
    bodySprite.addChild(bodyMask);
    bodySprite.mask = bodyMask;
    this.app!.stage.addChild(bodySprite);

    // Create left wing sprite with vision-based mask
    const leftWingSprite = new PIXI.Sprite(baseTexture);
    leftWingSprite.anchor.set(0.5);
    leftWingSprite.scale.set(scale);
    leftWingSprite.x = centerX;
    leftWingSprite.y = centerY;
    
    const leftWingMask = this.createVisionWingMask(visionResult, 'left', baseTexture.width, baseTexture.height);
    leftWingSprite.addChild(leftWingMask);
    leftWingSprite.mask = leftWingMask;
    this.app!.stage.addChild(leftWingSprite);

    // Create right wing sprite with vision-based mask
    const rightWingSprite = new PIXI.Sprite(baseTexture);
    rightWingSprite.anchor.set(0.5);
    rightWingSprite.scale.set(scale);
    rightWingSprite.x = centerX;
    rightWingSprite.y = centerY;
    
    const rightWingMask = this.createVisionWingMask(visionResult, 'right', baseTexture.width, baseTexture.height);
    rightWingSprite.addChild(rightWingMask);
    rightWingSprite.mask = rightWingMask;
    this.app!.stage.addChild(rightWingSprite);

    // Store sprites with animations
    const leftWingAnimation = preset.animations.find(anim => anim.elementId === 'left-wing');
    const rightWingAnimation = preset.animations.find(anim => anim.elementId === 'right-wing');
    const bodyAnimation = preset.animations.find(anim => anim.elementId === 'body');

    this.sprites.set('body', {
      id: 'body',
      sprite: bodySprite,
      originalTransform: {
        x: bodySprite.x,
        y: bodySprite.y,
        scaleX: bodySprite.scale.x,
        scaleY: bodySprite.scale.y,
        rotation: bodySprite.rotation,
        alpha: bodySprite.alpha
      },
      animations: bodyAnimation?.keyframes || []
    });

    this.sprites.set('left-wing', {
      id: 'left-wing',
      sprite: leftWingSprite,
      originalTransform: {
        x: leftWingSprite.x,
        y: leftWingSprite.y,
        scaleX: leftWingSprite.scale.x,
        scaleY: leftWingSprite.scale.y,
        rotation: leftWingSprite.rotation,
        alpha: leftWingSprite.alpha
      },
      animations: leftWingAnimation?.keyframes || []
    });

    this.sprites.set('right-wing', {
      id: 'right-wing',
      sprite: rightWingSprite,
      originalTransform: {
        x: rightWingSprite.x,
        y: rightWingSprite.y,
        scaleX: rightWingSprite.scale.x,
        scaleY: rightWingSprite.scale.y,
        rotation: rightWingSprite.rotation,
        alpha: rightWingSprite.alpha
      },
      animations: rightWingAnimation?.keyframes || []
    });

    console.log(`✅ Created ${this.sprites.size} vision-based sprites with GPT-4 masks`);
  }

  // Helper methods for creating PIXI masks from GPT-4 Vision data
  private createVisionBodyMask(visionResult: any, width: number, height: number): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    
    const bodyCenter = {
      x: (visionResult.bodyCenter.x / 100) * width,
      y: (visionResult.bodyCenter.y / 100) * height
    };
    
    // Create elliptical body mask - conservative size to avoid wings
    const bodyWidth = width * 0.25; // Smaller than before
    const bodyHeight = height * 0.4;
    
    mask.drawEllipse(bodyCenter.x - width/2, bodyCenter.y - height/2, bodyWidth, bodyHeight);
    mask.endFill();
    
    console.log('🎭 Created vision body mask:', { bodyCenter, bodyWidth, bodyHeight });
    return mask;
  }

  private createVisionWingMask(visionResult: any, side: 'left' | 'right', width: number, height: number): PIXI.Graphics {
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    
    const wing = side === 'left' ? visionResult.leftWing : visionResult.rightWing;
    const contourPoints = wing.contourPoints;
    
    if (contourPoints && contourPoints.length > 0) {
      // Use GPT-4 Vision contour points for precise wing shape
      const pixelPoints = contourPoints.map((point: any) => ({
        x: (point.x / 100) * width - width/2,
        y: (point.y / 100) * height - height/2
      }));
      
      mask.moveTo(pixelPoints[0].x, pixelPoints[0].y);
      for (let i = 1; i < pixelPoints.length; i++) {
        mask.lineTo(pixelPoints[i].x, pixelPoints[i].y);
      }
      mask.closePath();
      
      console.log(`🪶 Created vision ${side} wing mask with ${contourPoints.length} contour points`);
    } else {
      // Fallback to bounds-based wing shape
      const bounds = {
        x: (wing.bounds.x / 100) * width - width/2,
        y: (wing.bounds.y / 100) * height - height/2,
        width: (wing.bounds.width / 100) * width,
        height: (wing.bounds.height / 100) * height
      };
      
      // Create organic wing shape
      if (side === 'left') {
        mask.moveTo(bounds.x, bounds.y + bounds.height * 0.5);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.2, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height * 0.2);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.8, bounds.x + bounds.width, bounds.y + bounds.height);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.9, bounds.x, bounds.y + bounds.height * 0.5);
      } else {
        mask.moveTo(bounds.x + bounds.width, bounds.y + bounds.height * 0.5);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.8, bounds.y, bounds.x, bounds.y + bounds.height * 0.2);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.8, bounds.x, bounds.y + bounds.height);
        mask.quadraticCurveTo(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.9, bounds.x + bounds.width, bounds.y + bounds.height * 0.5);
      }
      mask.closePath();
      
      console.log(`🪶 Created vision ${side} wing mask with bounds fallback:`, bounds);
    }
    
    mask.endFill();
    return mask;
  }

  private async createAutomatedSprites(
    baseTexture: PIXI.Texture, 
    analysis: AISymbolAnalysis, 
    preset: AutomatedAnimationPreset
  ): Promise<void> {
    const centerX = this.app!.screen.width / 2;
    const centerY = this.app!.screen.height / 2;
    
    // Calculate optimal scale
    const maxSize = Math.min(this.app!.screen.width, this.app!.screen.height) * 0.6;
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);

    // Create container for the symbol
    const symbolContainer = new PIXI.Container();
    symbolContainer.x = centerX;
    symbolContainer.y = centerY;
    this.app!.stage.addChild(symbolContainer);

    // First create the full body sprite (base layer)
    const bodySprite = new PIXI.Sprite(baseTexture);
    bodySprite.anchor.set(0.5);
    bodySprite.scale.set(scale);
    bodySprite.x = 0;
    bodySprite.y = 0;
    
    // Create body mask to hide wing areas
    const bodyMask = new PIXI.Graphics();
    bodyMask.beginFill(0xffffff);
    // Body mask - central area excluding wing regions
    bodyMask.drawEllipse(0, 0, baseTexture.width * scale * 0.45, baseTexture.height * scale * 0.8);
    bodyMask.endFill();
    bodySprite.addChild(bodyMask);
    bodySprite.mask = bodyMask;
    
    symbolContainer.addChild(bodySprite);

    // Store body sprite
    const bodyAutomatedSprite: AutomatedSprite = {
      id: 'body',
      sprite: bodySprite,
      originalTransform: {
        x: bodySprite.x,
        y: bodySprite.y,
        scaleX: bodySprite.scale.x,
        scaleY: bodySprite.scale.y,
        rotation: bodySprite.rotation,
        alpha: bodySprite.alpha
      },
      animations: preset.animations.find(a => a.elementId === 'body')?.keyframes || []
    };
    this.sprites.set('body', bodyAutomatedSprite);

    // Create wing sprites only for wing elements
    for (const element of analysis.detectedElements) {
      if (element.type === 'wings' || element.name.toLowerCase().includes('wing')) {
        const wingSprite = new PIXI.Sprite(baseTexture);
        wingSprite.anchor.set(0.5);
        wingSprite.scale.set(scale);
        
        // Apply wing-specific masking and positioning
        this.applyWingMask(wingSprite, element, baseTexture, scale);
        
        // Position wings relative to body with proper offset
        const bbox = element.boundingBox;
        const isLeftWing = element.id.includes('left');
        
        // Adjust wing positioning for proper animation pivot
        wingSprite.x = (bbox.x + bbox.width * 0.5 - 0.5) * baseTexture.width * scale;
        wingSprite.y = (bbox.y + bbox.height * 0.3 - 0.5) * baseTexture.height * scale;
        
        // Set pivot point for realistic wing rotation
        if (isLeftWing) {
          wingSprite.pivot.x = baseTexture.width * 0.2; // Pivot near body connection
        } else {
          wingSprite.pivot.x = -baseTexture.width * 0.2; // Opposite for right wing
        }

        symbolContainer.addChild(wingSprite);

        // Store for animation with enhanced keyframes
        const wingAnimation = preset.animations.find(a => a.elementId === element.id);
        const automatedSprite: AutomatedSprite = {
          id: element.id,
          sprite: wingSprite,
          originalTransform: {
            x: wingSprite.x,
            y: wingSprite.y,
            scaleX: wingSprite.scale.x,
            scaleY: wingSprite.scale.y,
            rotation: wingSprite.rotation,
            alpha: wingSprite.alpha
          },
          animations: wingAnimation?.keyframes || []
        };

        this.sprites.set(element.id, automatedSprite);
        
        console.log(`🪶 Created ${isLeftWing ? 'LEFT' : 'RIGHT'} wing sprite with ${automatedSprite.animations.length} keyframes`);
      }
    }
    
    console.log(`✅ Created ${this.sprites.size} sprites: body + ${this.sprites.size - 1} wings`);
  }

  private applyWingMask(sprite: PIXI.Sprite, element: any, baseTexture: PIXI.Texture, scale: number): void {
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);

    const isLeftWing = element.name.toLowerCase().includes('left') || element.id.includes('left');
    const bbox = element.boundingBox;

    if (isLeftWing) {
      // Left wing mask - precise left wing area
      mask.drawEllipse(
        -baseTexture.width * 0.25 * scale,  // Position towards left
        -baseTexture.height * 0.1 * scale,   // Slightly above center
        baseTexture.width * 0.4 * scale,     // Wing width
        baseTexture.height * 0.35 * scale    // Wing height
      );
      
      // Add secondary feather details
      mask.drawEllipse(
        -baseTexture.width * 0.35 * scale,
        -baseTexture.height * 0.05 * scale,
        baseTexture.width * 0.25 * scale,
        baseTexture.height * 0.25 * scale
      );
    } else {
      // Right wing mask - precise right wing area  
      mask.drawEllipse(
        baseTexture.width * 0.25 * scale,    // Position towards right
        -baseTexture.height * 0.1 * scale,   // Slightly above center
        baseTexture.width * 0.4 * scale,     // Wing width
        baseTexture.height * 0.35 * scale    // Wing height
      );
      
      // Add secondary feather details
      mask.drawEllipse(
        baseTexture.width * 0.35 * scale,
        -baseTexture.height * 0.05 * scale,
        baseTexture.width * 0.25 * scale,
        baseTexture.height * 0.25 * scale
      );
    }

    mask.endFill();
    sprite.addChild(mask);
    sprite.mask = mask;
    
    console.log(`🎭 Applied ${isLeftWing ? 'LEFT' : 'RIGHT'} wing mask`);
  }

  private applyElementMask(sprite: PIXI.Sprite, element: any, baseTexture: PIXI.Texture, scale: number): void {
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);

    const bbox = element.boundingBox;
    
    switch (element.type) {
      case 'body':
        // Body mask - central area
        mask.drawEllipse(0, 0, bbox.width * baseTexture.width * scale * 0.8, bbox.height * baseTexture.height * scale);
        break;
      default:
        // Default rectangular mask
        mask.drawRect(
          -bbox.width * baseTexture.width * scale / 2,
          -bbox.height * baseTexture.height * scale / 2,
          bbox.width * baseTexture.width * scale,
          bbox.height * baseTexture.height * scale
        );
    }

    mask.endFill();
    sprite.addChild(mask);
    sprite.mask = mask;
  }

  private async setupAutomatedEffects(preset: AutomatedAnimationPreset): Promise<void> {
    if (!this.app) return;

    for (const effect of preset.effects) {
      switch (effect.type) {
        case 'glow':
          await this.createGlowEffect(effect);
          break;
        case 'particles':
          await this.createParticleEffect(effect);
          break;
      }
    }
  }

  private async createGlowEffect(effect: any): Promise<void> {
    // Create glow filter effect
    try {
      const glowFilter = new PIXI.filters.GlowFilter({
        distance: 15,
        outerStrength: effect.intensity * 2,
        innerStrength: effect.intensity,
        color: 0xffd700,
        quality: 0.5
      });

      // Apply to all sprites
      this.sprites.forEach(automatedSprite => {
        automatedSprite.sprite.filters = [glowFilter];
      });
    } catch (error) {
      console.warn('Glow filter not available, using fallback effect');
      // Fallback: create a simple outline effect
      this.createFallbackGlow(effect);
    }
  }

  private createFallbackGlow(effect: any): void {
    if (!this.app) return;

    this.sprites.forEach(automatedSprite => {
      const glow = new PIXI.Graphics();
      glow.lineStyle(3, 0xffd700, effect.intensity * 0.5);
      glow.drawRect(-2, -2, automatedSprite.sprite.width + 4, automatedSprite.sprite.height + 4);
      automatedSprite.sprite.addChild(glow);
    });
  }

  private async createParticleEffect(effect: any): Promise<void> {
    if (!this.app) return;

    const particleContainer = new PIXI.ParticleContainer(50, {
      scale: true,
      position: true,
      rotation: true,
      alpha: true
    });

    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;

    // Create magical sparkle particles around the scarab
    for (let i = 0; i < 25; i++) {
      const particle = new PIXI.Graphics();
      
      // Golden sparkle colors with variation
      const colors = [0xffd700, 0xffed4e, 0xffa500, 0xffff00];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.beginFill(color, effect.intensity * (0.6 + Math.random() * 0.4));
      
      // Create star-shaped particles
      const size = 1 + Math.random() * 3;
      this.drawStar(particle, 0, 0, 5, size, size * 0.5);
      particle.endFill();

      // Position particles in orbit around the scarab
      const angle = (i / 25) * Math.PI * 2;
      const radius = 80 + Math.random() * 40;
      particle.x = centerX + Math.cos(angle) * radius;
      particle.y = centerY + Math.sin(angle) * radius;
      
      // Store original position for animation
      (particle as any).originalAngle = angle;
      (particle as any).radius = radius;
      (particle as any).speed = 0.01 + Math.random() * 0.02;
      (particle as any).bobOffset = Math.random() * Math.PI * 2;
      
      particleContainer.addChild(particle);
    }

    this.app.stage.addChild(particleContainer);
    this.effects.push(particleContainer);
    
    // Animate particles
    this.animateParticles(particleContainer);
    
    console.log('✨ Created magical particle effect with 25 sparkles');
  }

  private drawStar(graphics: PIXI.Graphics, x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
    const step = Math.PI / points;
    graphics.moveTo(x + outerRadius, y);
    
    for (let i = 1; i <= points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step;
      graphics.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    graphics.closePath();
  }

  private animateParticles(particleContainer: PIXI.Container): void {
    if (!this.app) return;
    
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    
    this.app.ticker.add(() => {
      particleContainer.children.forEach((particle: any) => {
        // Orbital motion
        particle.originalAngle += particle.speed;
        
        // Add gentle bobbing motion
        const bob = Math.sin(Date.now() * 0.005 + particle.bobOffset) * 5;
        
        particle.x = centerX + Math.cos(particle.originalAngle) * particle.radius;
        particle.y = centerY + Math.sin(particle.originalAngle) * particle.radius + bob;
        
        // Gentle scale pulsing
        const pulse = 0.8 + Math.sin(Date.now() * 0.008 + particle.bobOffset) * 0.3;
        particle.scale.set(pulse);
        
        // Alpha sparkle
        particle.alpha = 0.4 + Math.sin(Date.now() * 0.01 + particle.bobOffset) * 0.4;
      });
    });
  }

  private initializeAnimationTimeline(preset: AutomatedAnimationPreset): void {
    // Calculate total duration from preset
    let maxTime = 0;
    preset.animations.forEach(anim => {
      anim.keyframes.forEach(keyframe => {
        maxTime = Math.max(maxTime, keyframe.time);
      });
    });

    this.animationState.duration = maxTime || 2;
  }

  private updateAnimation(deltaTime: number): void {
    if (!this.animationState.isPlaying) return;

    // Update time (convert deltaTime from frames to seconds)
    this.animationState.currentTime += deltaTime * 0.016 * this.animationState.speed;

    // Handle looping
    if (this.animationState.currentTime >= this.animationState.duration) {
      if (this.animationState.loop) {
        this.animationState.currentTime = 0;
      } else {
        this.animationState.isPlaying = false;
        console.log('🏁 Animation completed');
        return;
      }
    }

    // Debug animation state every few frames
    if (Math.floor(this.animationState.currentTime * 10) % 20 === 0) {
      console.log(`🎬 Animating: ${this.animationState.currentTime.toFixed(2)}s / ${this.animationState.duration}s | Sprites: ${this.sprites.size}`);
    }

    // Update sprites
    this.sprites.forEach((automatedSprite, id) => {
      this.updateSpriteAnimation(automatedSprite, this.animationState.currentTime);
    });

    // Update performance metrics
    this.updatePerformanceMetrics();
  }

  private updateSpriteAnimation(automatedSprite: AutomatedSprite, currentTime: number): void {
    const animations = automatedSprite.animations;
    if (animations.length === 0) return;

    // Find current keyframes with proper wrapping
    let prevKeyframe = animations[0];
    let nextKeyframe = animations[animations.length > 1 ? 1 : 0];

    // Find the appropriate keyframe pair
    for (let i = 0; i < animations.length; i++) {
      const currentKeyframe = animations[i];
      const nextIndex = (i + 1) % animations.length;
      const nextKf = animations[nextIndex];
      
      if (currentTime >= currentKeyframe.time && 
          (currentTime < nextKf.time || (i === animations.length - 1 && currentTime >= currentKeyframe.time))) {
        prevKeyframe = currentKeyframe;
        nextKeyframe = nextKf;
        break;
      }
    }

    // Calculate interpolation progress
    let timeDiff = nextKeyframe.time - prevKeyframe.time;
    
    // Handle wrap-around case (end of loop)
    if (timeDiff <= 0) {
      timeDiff = (this.animationState.duration - prevKeyframe.time) + nextKeyframe.time;
    }
    
    let progress = 0;
    if (timeDiff > 0) {
      if (currentTime >= prevKeyframe.time) {
        progress = (currentTime - prevKeyframe.time) / timeDiff;
      } else {
        // Wrap-around case
        progress = ((this.animationState.duration - prevKeyframe.time) + currentTime) / timeDiff;
      }
    }
    
    progress = Math.max(0, Math.min(1, progress));

    // Apply eased interpolation
    const easedProgress = this.applyEasing(progress, prevKeyframe.easing);

    // Update sprite properties with enhanced interpolation
    const allProps = new Set([...Object.keys(prevKeyframe.properties), ...Object.keys(nextKeyframe.properties)]);
    
    allProps.forEach(prop => {
      const startValue = prevKeyframe.properties[prop] ?? this.getDefaultPropertyValue(prop);
      const endValue = nextKeyframe.properties[prop] ?? startValue;
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      this.applySpriteProperty(automatedSprite.sprite, prop, currentValue);
    });

    // Debug log for wing animations (reduced frequency)
    if (automatedSprite.id.includes('wing') && Math.floor(currentTime * 10) % 100 === 0) {
      console.log(`🪶 Wing ${automatedSprite.id}: rotation=${prevKeyframe.properties.rotation?.toFixed(3)} → ${nextKeyframe.properties.rotation?.toFixed(3)} (${(easedProgress * 100).toFixed(1)}%)`);
    }
  }

  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress);
      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : 1 - 2 * (1 - progress) * (1 - progress);
      default:
        return progress;
    }
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
          sprite.scale.x = Math.max(0.1, value); // Prevent negative/zero scales
          break;
        case 'scaleY':
          sprite.scale.y = Math.max(0.1, value);
          break;
        case 'alpha':
          sprite.alpha = Math.max(0, Math.min(1, value)); // Clamp alpha
          break;
        case 'x':
          sprite.x = value;
          break;
        case 'y':
          sprite.y = value;
          break;
        default:
          console.warn(`Unknown animation property: ${property}`);
      }
    } catch (error) {
      console.error(`Failed to apply property ${property}=${value}:`, error);
    }
  }

  // Public control methods
  play(): void {
    console.log('▶️ Starting animation playback...');
    this.animationState.isPlaying = true;
    
    if (this.ticker) {
      if (!this.ticker.started) {
        this.ticker.start();
        console.log('✅ Animation ticker started');
      }
    } else {
      console.warn('⚠️ No ticker available, creating new one');
      this.ticker = new PIXI.Ticker();
      this.ticker.add(this.updateAnimation.bind(this));
      this.ticker.start();
    }
  }

  pause(): void {
    this.animationState.isPlaying = false;
  }

  stop(): void {
    this.animationState.isPlaying = false;
    this.animationState.currentTime = 0;
    this.resetSpritesToOriginal();
  }

  setSpeed(speed: number): void {
    this.animationState.speed = Math.max(0.1, Math.min(3, speed));
  }

  private resetSpritesToOriginal(): void {
    this.sprites.forEach(automatedSprite => {
      const orig = automatedSprite.originalTransform;
      automatedSprite.sprite.x = orig.x;
      automatedSprite.sprite.y = orig.y;
      automatedSprite.sprite.scale.set(orig.scaleX, orig.scaleY);
      automatedSprite.sprite.rotation = orig.rotation;
      automatedSprite.sprite.alpha = orig.alpha;
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.app) return;

    this.app.ticker.add(() => {
      this.performanceMonitor.fps = this.app!.ticker.FPS;
      this.performanceMonitor.frameTime = this.app!.ticker.elapsedMS;
    });
  }

  private updatePerformanceMetrics(): void {
    // Estimate memory usage
    this.performanceMonitor.memoryUsage = this.sprites.size * 0.5 + this.effects.length * 0.3;
  }

  getPerformanceMetrics() {
    return { ...this.performanceMonitor };
  }

  getAnimationState() {
    return { ...this.animationState };
  }

  private clearScene(): void {
    if (!this.app) return;

    // Remove all children
    this.app.stage.removeChildren();
    
    // Clear sprites and effects
    this.sprites.clear();
    this.effects.forEach(effect => effect.destroy());
    this.effects = [];
  }

  destroy(): void {
    if (this.ticker) {
      this.ticker.stop();
      this.ticker.destroy();
      this.ticker = null;
    }

    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      });
      this.app = null;
    }

    this.sprites.clear();
    this.effects = [];
  }
}

export const automatedPixiRenderer = new AutomatedPixiRenderer();