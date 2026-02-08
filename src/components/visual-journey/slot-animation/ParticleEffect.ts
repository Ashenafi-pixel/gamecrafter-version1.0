import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

// Particle system for win animations and effects
export class ParticleEffect {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private particles: PIXI.Sprite[] = [];
  private emitting: boolean = false;
  private maxParticles: number = 100;
  private emissionRate: number = 10; // particles per frame
  private duration: number = 2000; // ms
  private startTime: number = 0;
  private textures: PIXI.Texture[] = [];
  private animationFrame: number | null = null;

  constructor(app: PIXI.Application, textures?: string[]) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    // Create default texture if none provided
    if (!textures || textures.length === 0) {
      // Create a star shape
      const starGraphic = new PIXI.Graphics();
      starGraphic.beginFill(0xffcc00);
      
      // Draw a star
      const centerX = 10;
      const centerY = 10;
      const spikes = 5;
      const outerRadius = 10;
      const innerRadius = 5;
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          starGraphic.moveTo(x, y);
        } else {
          starGraphic.lineTo(x, y);
        }
      }
      
      starGraphic.closePath();
      starGraphic.endFill();
      
      const texture = this.app.renderer.generateTexture(starGraphic);
      this.textures.push(texture);
    } else {
      // Load provided textures
      textures.forEach(texturePath => {
        PIXI.Assets.load(texturePath).then(texture => {
          this.textures.push(texture);
        }).catch(err => {
          console.error("Failed to load particle texture:", err);
        });
      });
    }
  }

  // Start emitting particles from a specific point
  public emit(x: number, y: number, options: {
    count?: number,
    duration?: number,
    scale?: number,
    speed?: number,
    color?: number,
    gravity?: number,
    spread?: number
  } = {}) {
    const {
      count = 30,
      duration = 2000,
      scale = 0.5,
      speed = 3,
      color = 0xffcc00,
      gravity = 0.1,
      spread = 0.8
    } = options;
    
    this.maxParticles = count;
    this.duration = duration;
    this.startTime = Date.now();
    this.emitting = true;
    
    // Create all particles at once
    for (let i = 0; i < this.maxParticles; i++) {
      // Select random texture
      const textureIndex = Math.floor(Math.random() * this.textures.length);
      const texture = this.textures[textureIndex] || this.textures[0];
      
      const particle = new PIXI.Sprite(texture);
      
      // Set initial position
      particle.x = x;
      particle.y = y;
      
      // Randomize scale
      const particleScale = scale * (0.5 + Math.random() * 0.5);
      particle.scale.set(particleScale);
      
      // Set anchor point to center
      particle.anchor.set(0.5);
      
      // Apply color tint with variation
      const tint = color;
      particle.tint = tint;
      
      // Set initial alpha
      particle.alpha = 0.8 + Math.random() * 0.2;
      
      // Add to container
      this.container.addChild(particle);
      this.particles.push(particle);
      
      // Calculate random direction
      const angle = Math.random() * Math.PI * 2;
      const velocity = {
        x: Math.cos(angle) * speed * (0.5 + Math.random() * spread),
        y: Math.sin(angle) * speed * (0.5 + Math.random() * spread) - Math.random() * 2 // Initial upward boost
      };
      
      // Store velocity on the particle
      (particle as any).velocity = velocity;
      (particle as any).gravity = gravity * (0.5 + Math.random() * 0.5);
      (particle as any).rotationSpeed = (Math.random() - 0.5) * 0.2;
      
      // Animate particle with GSAP
      gsap.to(particle, {
        alpha: 0,
        duration: duration / 1000 * (0.5 + Math.random() * 0.5),
        ease: "power2.out"
      });
    }
    
    // Start update loop if not already running
    if (!this.animationFrame) {
      this.update();
    }
  }
  
  // Create a sparkle burst effect
  public sparkle(x: number, y: number, options: {
    count?: number,
    color?: number,
    scale?: number,
    duration?: number
  } = {}) {
    const {
      count = 20,
      color = 0xffcc00,
      scale = 0.7,
      duration = 1500
    } = options;
    
    // Create sparkle container
    const sparkleContainer = new PIXI.Container();
    sparkleContainer.x = x;
    sparkleContainer.y = y;
    this.app.stage.addChild(sparkleContainer);
    
    // Create multiple sparkle particles
    for (let i = 0; i < count; i++) {
      // Create a sparkle
      const sparkleGraphic = new PIXI.Graphics();
      sparkleGraphic.beginFill(color);
      
      // Draw a star shape
      const spikes = 4;
      const outerRadius = 8 * scale;
      const innerRadius = 3 * scale;
      
      for (let j = 0; j < spikes * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * j;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;
        
        if (j === 0) {
          sparkleGraphic.moveTo(sx, sy);
        } else {
          sparkleGraphic.lineTo(sx, sy);
        }
      }
      
      sparkleGraphic.closePath();
      sparkleGraphic.endFill();
      
      // Add to container
      sparkleContainer.addChild(sparkleGraphic);
      
      // Random position offset
      const distance = Math.random() * 40 * scale;
      const angle = Math.random() * Math.PI * 2;
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      // Random scale and rotation
      sparkleGraphic.x = sparkleX;
      sparkleGraphic.y = sparkleY;
      sparkleGraphic.scale.set(0.1 + Math.random() * 0.3);
      sparkleGraphic.rotation = Math.random() * Math.PI;
      sparkleGraphic.alpha = 0;
      
      // Animate appear
      gsap.to(sparkleGraphic, {
        alpha: 1,
        scale: 0.5 + Math.random() * 0.5,
        duration: 0.3,
        ease: "power1.out",
        onComplete: () => {
          // Then animate disappear
          gsap.to(sparkleGraphic, {
            alpha: 0,
            scale: 0.1 + Math.random() * 0.2,
            duration: 0.5 + Math.random() * 0.5,
            ease: "power2.in",
            delay: Math.random() * 0.5
          });
        }
      });
      
      // Add rotation animation
      gsap.to(sparkleGraphic, {
        rotation: Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
        duration: 1 + Math.random(),
        repeat: 1,
        ease: "sine.inOut"
      });
    }
    
    // Clean up after animation completes
    setTimeout(() => {
      this.app.stage.removeChild(sparkleContainer);
    }, duration);
  }
  
  // Create a glowing effect around a target object
  public addGlow(target: PIXI.DisplayObject, options: {
    color?: number,
    distance?: number,
    outerStrength?: number,
    innerStrength?: number,
    quality?: number
  } = {}) {
    const {
      color = 0xffcc00,
      distance = 15,
      outerStrength = 2,
      innerStrength = 0,
      quality = 0.5
    } = options;
    
    const glowFilter = new PIXI.filters.GlowFilter({
      distance,
      outerStrength,
      innerStrength,
      color,
      quality
    });
    
    // Add to existing filters or set as new filter array
    if (target.filters) {
      target.filters.push(glowFilter);
    } else {
      target.filters = [glowFilter];
    }
    
    // Return the filter for animation
    return glowFilter;
  }
  
  // Update particles each frame
  private update() {
    // Check if emission has ended
    if (this.emitting && Date.now() - this.startTime > this.duration) {
      this.emitting = false;
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const velocity = (particle as any).velocity;
      const gravity = (particle as any).gravity;
      
      // Apply velocity
      particle.x += velocity.x;
      particle.y += velocity.y;
      
      // Apply gravity
      velocity.y += gravity;
      
      // Apply rotation
      particle.rotation += (particle as any).rotationSpeed;
      
      // Remove particle if it's faded out
      if (particle.alpha <= 0.01) {
        this.container.removeChild(particle);
        this.particles.splice(i, 1);
      }
    }
    
    // Continue animation loop if particles remain or still emitting
    if (this.particles.length > 0 || this.emitting) {
      this.animationFrame = requestAnimationFrame(() => this.update());
    } else {
      this.animationFrame = null;
    }
  }
  
  // Clean up resources
  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.particles.forEach(particle => {
      this.container.removeChild(particle);
    });
    
    this.particles = [];
    this.app.stage.removeChild(this.container);
  }
}

export default ParticleEffect;