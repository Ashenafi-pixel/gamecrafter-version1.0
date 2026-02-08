import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { useGameStore } from '../store';

const ReelAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const reelsRef = useRef<any[]>([]);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    // Create PixiJS application
    const app = new PIXI.Application({
      width: 600,
      height: 400,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    // Add canvas to DOM
    containerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    // Create decorative frame
    const frame = new PIXI.Graphics();
    frame.lineStyle(10, 0xd4af37, 1);
    frame.beginFill(0x000000, 0);
    frame.drawRoundedRect(30, 30, 540, 340, 10);
    frame.endFill();
    app.stage.addChild(frame);

    // Define symbol paths - using the theme images from public folder
    const symbolPaths = [
      '/public/themes/ancient-egypt.avif',
      '/public/themes/cosmic-adventure.avif',
      '/public/themes/deep-ocean.avif',
      '/public/themes/enchanted-forest.avif',
      '/public/themes/wild-west.avif',
      '/public/themes/base-style.avif'
    ];

    // Load textures
    const loadTextures = async () => {
      // Load textures
      const textures: PIXI.Texture[] = [];
      
      // Create colored rectangles as fallbacks
      const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
      
      for (let i = 0; i < colors.length; i++) {
        // Create colored fallback
        const g = new PIXI.Graphics();
        g.beginFill(colors[i]);
        g.drawRoundedRect(0, 0, 100, 100, 10);
        g.endFill();
        
        // Add symbol letter
        const text = new PIXI.Text(['W', 'S', 'H', 'M', 'L', 'B'][i], {
          fontFamily: 'Arial',
          fontSize: 48,
          fill: 0xffffff,
          align: 'center'
        });
        text.anchor.set(0.5);
        text.position.set(50, 50);
        g.addChild(text);
        
        const texture = app.renderer.generateTexture(g);
        textures.push(texture);
      }

      // Initialize reels
      initReels(textures);
    };

    // Reel class with advanced animation based on store config
    class Reel {
      container: PIXI.Container;
      symbols: PIXI.Sprite[];
      position: number;
      speed: number;
      stopPosition: number;
      spinning: boolean;
      
      constructor(x: number, textures: PIXI.Texture[]) {
        this.container = new PIXI.Container();
        this.container.x = x;
        this.symbols = [];
        this.position = 0;
        this.speed = 0;
        this.stopPosition = 0;
        this.spinning = false;
        
        // Create mask
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(0, 50, 120, 300);
        mask.endFill();
        this.container.mask = mask;
        app.stage.addChild(mask);
        
        // Create symbols
        for (let i = 0; i < 5; i++) {
          const symbol = new PIXI.Sprite(textures[Math.floor(Math.random() * textures.length)]);
          symbol.width = 100;
          symbol.height = 100;
          symbol.x = 10;
          symbol.y = i * 100;
          this.symbols.push(symbol);
          this.container.addChild(symbol);
        }
        
        app.stage.addChild(this.container);
      }
      
      spin() {
        // Reset position
        this.symbols.forEach((symbol, i) => {
          symbol.y = i * 100;
        });
        this.position = 0;
        this.spinning = true;

        // Load animation config from store
        const animation = useGameStore.getState().config.advanced?.animation || {};
        const maxSpeed = 40;
        const accDur = animation.accelerationDuration ?? 0.5;
        const csDur = animation.constantSpeedDuration ?? 1;
        const decDur = animation.decelerationDuration ?? 2;
        const easeFn = animation.easingFunction || 'power2.inOut';
        const anticPause = animation.anticipationPauseDuration ?? 0;
        const anticOffset = animation.anticipationOffset ?? 0;

        // Timeline for spin phases
        const tl = gsap.timeline();
        // Anticipation pull-back
        if (anticOffset !== 0) {
          tl.to(this.container, {
            y: this.container.y + anticOffset,
            duration: anticPause,
            ease: easeFn
          });
        }
        // Acceleration phase
        tl.to(this, {
          speed: maxSpeed,
          duration: accDur,
          ease: easeFn
        });
        // Constant-speed hold
        tl.to({}, { duration: csDur });
        // Deceleration phase
        tl.to(this, {
          speed: 0,
          duration: decDur,
          ease: easeFn
        });
        // On complete, trigger bounce
        tl.call(() => {
          this.spinning = false;
          this.bounce();
        });
      }
      
      bounce() {
        const animation = useGameStore.getState().config.advanced?.animation || {};
        const overshoot = animation.overshootPercentage ?? 10;
        const bounceCount = animation.bounceCount ?? 1;
        const bounceDamping = animation.bounceDamping ?? 0.4;
        const shakeAmp = animation.shakeAmplitude ?? 0;
        const shakeFreq = animation.shakeFrequency ?? 0;
        const symbolScale = animation.symbolScaleOnStop ?? 1;
        const flashAlpha = animation.flashAlpha ?? 0;

        // Overshoot & bounce timeline
        const tl = gsap.timeline();
        tl.to(this.container, {
          y: this.container.y + overshoot,
          duration: 0.2,
          ease: `elastic.out(1,${bounceDamping})`,
          yoyo: true,
          repeat: bounceCount
        });
        // Shake effect
        if (shakeAmp > 0 && shakeFreq > 0) {
          tl.to(this.container, {
            x: `+=${shakeAmp}`,
            duration: 0.05,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: shakeFreq
          }, 0);
        }
        // Symbol pop effect
        this.symbols.forEach((symbol) => {
          gsap.to(symbol.scale, {
            x: symbolScale,
            y: symbolScale,
            duration: 0.2,
            yoyo: true,
            repeat: 1
          });
        });
        // Flash/alpha highlight
        if (flashAlpha > 0) {
          tl.to(this.container, {
            alpha: flashAlpha,
            duration: 0.1,
            yoyo: true,
            repeat: 1
          }, '>' );
        }
      }
      
      update() {
        if (this.spinning) {
          this.position += this.speed;
          
          for (let i = 0; i < this.symbols.length; i++) {
            const symbol = this.symbols[i];
            symbol.y = ((i * 100) + this.position) % 500;
            
            // If symbol moves out of view from top, reposition it to bottom with new texture
            if (symbol.y > 450) {
              symbol.y -= 500;
              // Randomly change texture
              symbol.texture = this.symbols[0].texture.textureCacheIds.includes("EMPTY")
                ? this.symbols[0].texture // Use placeholder if proper textures aren't loaded
                : appRef.current!.renderer.generateTexture(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
          }
        }
      }
    }

    // Initialize reels
    const initReels = (textures: PIXI.Texture[]) => {
      const reels = [
        new Reel(90, textures),
        new Reel(240, textures),
        new Reel(390, textures)
      ];
      
      reelsRef.current = reels;
      
      // Animate
      app.ticker.add(() => {
        reels.forEach(reel => reel.update());
      });
      
      // Auto spin once on initialization
      spinAll();
    };
    
    // Function to spin all reels
    const spinAll = () => {
      // Sequential reel stagger with default 200ms delay
      reelsRef.current.forEach((reel, i) => {
        setTimeout(() => reel.spin(), i * 200);
      });
    };
    
    // Load textures and initialize
    loadTextures();
    
    // Clean up on unmount
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
      }
    };
  }, []);
  
  const handleSpin = () => {
    if (reelsRef.current.length && !reelsRef.current[0].spinning) {
      reelsRef.current.forEach((reel, i) => {
        setTimeout(() => reel.spin(), i * 200);
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-bold text-center mb-4">Slot Machine Animation Demo</h2>
      <div 
        ref={containerRef} 
        className="relative rounded-lg overflow-hidden shadow-xl mb-4"
      ></div>
      <button
        onClick={handleSpin}
        className="px-8 py-4 bg-gradient-to-r from-red-600 to-yellow-600 text-white font-bold rounded-full shadow-lg hover:from-red-700 hover:to-yellow-700 transition-all"
      >
        SPIN
      </button>
      <p className="text-gray-600 mt-4 text-center max-w-md">
        This is a visual mockup of a slot machine using PixiJS and GSAP for smooth animations.
        Click the button to trigger a spin with cascading effect and realistic physics.
      </p>
    </div>
  );
};

export default ReelAnimation;