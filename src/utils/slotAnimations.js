import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(PixiPlugin, CustomEase);

// === 1. Reel Spin Animation ===

export function createReelSpinTimeline(reelContainer, spinDistance = -1200, duration = 2.5, delay = 0, availableSymbols = []) {
  const tl = gsap.timeline({ delay });

  // Add blur effect during spin
  const blurFilter = new PIXI.filters.BlurFilter();
  reelContainer.filters = [blurFilter];

  // Animate the reel movement with symbol changes
  tl.to(reelContainer, {
    y: spinDistance,
    duration,
    ease: "power2.out",
    onUpdate: function() {
      // Change symbols during spin for realistic effect
      if (availableSymbols.length > 0 && Math.random() < 0.1) { // 10% chance per frame
        reelContainer.children.forEach(child => {
          if (child instanceof PIXI.Sprite && availableSymbols.length > 0) {
            const randomSymbolUrl = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
            try {
              child.texture = PIXI.Texture.from(randomSymbolUrl);
            } catch (error) {
              console.warn('Failed to update symbol texture during spin:', error);
            }
          }
        });
      }
    }
  })
  .to(blurFilter, {
    blur: 8,
    duration: 0.3
  }, 0)
  .to(blurFilter, {
    blur: 0,
    duration: 0.5
  }, "-=0.5")
  .call(() => {
    // Clear filters after animation
    reelContainer.filters = [];
  });

  return tl;
}

// === 2. Filter Effect Utilities ===

export function applyBlur(reelContainer, intensity = 8) {
  const blur = new PIXI.filters.BlurFilter();
  blur.blur = intensity;
  reelContainer.filters = [blur];
}

export function applyColorMatrixWinEffect(stage) {
  const colorMatrix = new PIXI.filters.ColorMatrixFilter();
  colorMatrix.brightness(1.3, false);
  colorMatrix.contrast(1.5, true);
  stage.filters = [colorMatrix];
}

export function applyGlowFilter(target, options = {}) {
  const { distance = 15, outerStrength = 2, innerStrength = 1, color = 0xffff00 } = options;
  
  // Use DropShadowFilter as a glow alternative since GlowFilter isn't in core PixiJS
  const glow = new PIXI.filters.DropShadowFilter({
    distance: 0,
    blur: distance,
    alpha: outerStrength * 0.3,
    color: color,
    quality: 3
  });
  
  target.filters = [glow];
}

export function applyDisplacementFilter(stage, displacementSprite) {
  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
  stage.filters = [displacementFilter];
}

// === 3. Master Timeline + Custom Easing ===

CustomEase.create("slotEase", "M0,0 C0.5,0 0.5,1 1,1");

export function spinAllReels(reels, availableSymbols = []) {
  const masterTimeline = gsap.timeline();

  reels.forEach((reel, i) => {
    const delay = i * 0.2 + Math.random() * 0.1;
    const reelTimeline = createReelSpinTimeline(reel, -1200, 2.5, delay, availableSymbols);
    masterTimeline.add(reelTimeline, 0);
  });

  return masterTimeline;
}

// === 4. Win-Specific Animation Effects ===

export function createSmallWinEffect(symbolContainer) {
  const tl = gsap.timeline();
  
  // Gentle green glow
  applyGlowFilter(symbolContainer, {
    distance: 10,
    outerStrength: 1.5,
    color: 0x22c55e, // Green
    quality: 0.3
  });

  tl.to(symbolContainer.scale, {
    x: 1.05,
    y: 1.05,
    duration: 0.3,
    ease: "power2.out"
  })
  .to(symbolContainer.scale, {
    x: 1,
    y: 1,
    duration: 0.3,
    ease: "power2.out"
  });

  return tl;
}

export function createBigWinEffect(symbolContainer) {
  const tl = gsap.timeline();
  
  // Golden glow
  applyGlowFilter(symbolContainer, {
    distance: 15,
    outerStrength: 2.5,
    color: 0xfbbf24, // Gold
    quality: 0.4
  });

  tl.to(symbolContainer.scale, {
    x: 1.15,
    y: 1.15,
    duration: 0.2,
    ease: "back.out(1.7)"
  })
  .to(symbolContainer, {
    pixi: { brightness: 1.3 },
    duration: 0.5
  }, 0)
  .to(symbolContainer.scale, {
    x: 1,
    y: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.3)"
  })
  .to(symbolContainer, {
    pixi: { brightness: 1 },
    duration: 0.5
  }, "-=0.2");

  return tl;
}

export function createMegaWinEffect(symbolContainer) {
  const tl = gsap.timeline();
  
  // Explosive red/gold glow
  applyGlowFilter(symbolContainer, {
    distance: 25,
    outerStrength: 4,
    color: 0xef4444, // Red
    quality: 0.6
  });

  tl.to(symbolContainer.scale, {
    x: 1.3,
    y: 1.3,
    duration: 0.15,
    ease: "power3.out"
  })
  .to(symbolContainer, {
    pixi: { brightness: 1.5, saturate: 1.4 },
    duration: 0.3
  }, 0)
  .to(symbolContainer.scale, {
    x: 1.1,
    y: 1.1,
    duration: 0.3,
    ease: "elastic.out(1, 0.5)"
  })
  .to(symbolContainer, {
    rotation: "+=0.1",
    duration: 0.2,
    yoyo: true,
    repeat: 3
  }, 0.2)
  .to(symbolContainer.scale, {
    x: 1,
    y: 1,
    duration: 0.5,
    ease: "back.out(1.2)"
  })
  .to(symbolContainer, {
    pixi: { brightness: 1, saturate: 1 },
    rotation: 0,
    duration: 0.5
  }, "-=0.3");

  return tl;
}

export function createFreespinsEffect(symbolContainer) {
  const tl = gsap.timeline();
  
  // Magical purple glow
  applyGlowFilter(symbolContainer, {
    distance: 20,
    outerStrength: 3,
    color: 0xa855f7, // Purple
    quality: 0.5
  });

  tl.to(symbolContainer.scale, {
    x: 1.1,
    y: 1.1,
    duration: 0.4,
    ease: "sine.inOut"
  })
  .to(symbolContainer, {
    pixi: { hue: 30 },
    duration: 0.6
  }, 0)
  .to(symbolContainer, {
    y: "-=10",
    duration: 0.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 1
  }, 0.2)
  .to(symbolContainer.scale, {
    x: 1,
    y: 1,
    duration: 0.4,
    ease: "sine.inOut"
  })
  .to(symbolContainer, {
    pixi: { hue: 0 },
    duration: 0.4
  }, "-=0.4");

  return tl;
}

// === 5. Performance Optimization ===

export class SpritePool {
  constructor(baseTexture, frameNames) {
    this.baseTexture = baseTexture;
    this.frameNames = frameNames;
    this.pool = [];
  }

  getSprite() {
    let sprite = this.pool.pop();
    if (!sprite) {
      const frame = this.frameNames[Math.floor(Math.random() * this.frameNames.length)];
      sprite = new PIXI.Sprite(new PIXI.Texture(this.baseTexture, frame));
    }
    sprite.visible = true;
    return sprite;
  }

  release(sprite) {
    sprite.visible = false;
    this.pool.push(sprite);
  }
}

// === 6. Master Animation Controller ===

export class SlotAnimationController {
  constructor(app, reelContainers, availableSymbols = []) {
    this.app = app;
    this.reelContainers = reelContainers;
    this.availableSymbols = availableSymbols;
    this.activeTimelines = [];
  }

  playSpinAnimation(winType = null, callback = null) {
    // Clear any existing animations
    this.clearAnimations();

    // Create master spin timeline with symbol changes
    const masterSpin = spinAllReels(this.reelContainers, this.availableSymbols);
    this.activeTimelines.push(masterSpin);

    // Add win-specific effects
    if (winType && callback) {
      masterSpin.eventCallback("onComplete", () => {
        this.playWinCelebration(winType);
        if (callback) callback();
      });
    }

    return masterSpin;
  }

  // Method to update available symbols
  updateSymbols(newSymbols) {
    this.availableSymbols = newSymbols;
  }

  playWinCelebration(winType) {
    const symbolContainers = this.getAllSymbolContainers();
    
    symbolContainers.forEach((symbolContainer, index) => {
      let effectTimeline;
      
      switch (winType) {
        case 'small-win':
          effectTimeline = createSmallWinEffect(symbolContainer);
          break;
        case 'big-win':
          effectTimeline = createBigWinEffect(symbolContainer);
          break;
        case 'mega-win':
          effectTimeline = createMegaWinEffect(symbolContainer);
          break;
        case 'freespins':
          effectTimeline = createFreespinsEffect(symbolContainer);
          break;
        default:
          return;
      }

      // Stagger the symbol effects
      effectTimeline.delay(index * 0.05);
      this.activeTimelines.push(effectTimeline);
    });
  }

  getAllSymbolContainers() {
    const symbolContainers = [];
    this.reelContainers.forEach(reelContainer => {
      reelContainer.children.forEach(child => {
        if (child.isSprite || child instanceof PIXI.Container) {
          symbolContainers.push(child);
        }
      });
    });
    return symbolContainers;
  }

  clearAnimations() {
    this.activeTimelines.forEach(timeline => {
      timeline.kill();
    });
    this.activeTimelines = [];

    // Clear all filters
    this.reelContainers.forEach(container => {
      container.filters = null;
      container.children.forEach(child => {
        if (child.filters) child.filters = null;
      });
    });
  }

  destroy() {
    this.clearAnimations();
    this.reelContainers = null;
    this.app = null;
  }
}