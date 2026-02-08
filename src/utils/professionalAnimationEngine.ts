// Professional Animation Engine - Realistic Physics & Movement
// Handles complex animations like hair physics, cloth simulation, secondary motion

import * as PIXI from 'pixi.js';
import { AnimationRig, RiggedComponent } from './autoRiggingEngine';
import { ComprehensiveAnalysis } from './multiVisionClient';

interface AnimationState {
  time: number;
  deltaTime: number;
  playing: boolean;
  loop: boolean;
  speed: number;
}

interface PhysicsBody {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  damping: number;
  forces: Array<{ x: number; y: number; type: string }>;
  constraints: Array<{
    type: 'distance' | 'angle' | 'pin';
    target?: string;
    restValue: number;
    stiffness: number;
  }>;
}

interface AnimationKeyframe {
  time: number;
  transforms: {
    [componentId: string]: {
      position: { x: number; y: number };
      rotation: number;
      scale: { x: number; y: number };
      skew: { x: number; y: number };
    };
  };
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
}

interface AnimationTrack {
  id: string;
  name: string;
  component: string;
  keyframes: AnimationKeyframe[];
  weight: number;
  blendMode: 'replace' | 'add' | 'multiply';
}

class ProfessionalAnimationEngine {
  private pixiApp: PIXI.Application | null = null;
  private animationState: AnimationState;
  private physicsBodies: Map<string, PhysicsBody> = new Map();
  private animationTracks: AnimationTrack[] = [];
  private sprites: Map<string, PIXI.Sprite> = new Map();
  private meshes: Map<string, PIXI.SimpleMesh> = new Map();
  private containers: Map<string, PIXI.Container> = new Map();

  constructor() {
    this.animationState = {
      time: 0,
      deltaTime: 0,
      playing: false,
      loop: true,
      speed: 1.0
    };
  }

  async initializeEngine(pixiApp: PIXI.Application): Promise<void> {
    this.pixiApp = pixiApp;
    console.log('[ProfessionalAnimation] Engine initialized');
  }

  async loadAnimationRig(
    rig: AnimationRig, 
    analysis: ComprehensiveAnalysis,
    imageBase64: string
  ): Promise<void> {
    if (!this.pixiApp) throw new Error('PIXI app not initialized');

    console.log('[ProfessionalAnimation] Loading animation rig...');

    // Clear existing
    this.sprites.clear();
    this.meshes.clear();
    this.physicsBodies.clear();
    this.containers.clear();

    // Create main container
    const mainContainer = new PIXI.Container();
    this.pixiApp.stage.addChild(mainContainer);
    this.containers.set('main', mainContainer);

    // Load base image
    const baseTexture = await PIXI.Texture.fromURL(imageBase64);

    // Create one main sprite for the entire symbol (simplified approach)
    await this.createMainSymbolSprite(baseTexture, mainContainer, rig);

    // Initialize physics bodies
    this.initializePhysics(rig);

    // Generate animation tracks
    this.generateAnimationTracks(rig, analysis);

    console.log('[ProfessionalAnimation] Rig loaded successfully');
  }

  private async createMainSymbolSprite(
    baseTexture: PIXI.Texture,
    parent: PIXI.Container,
    rig: AnimationRig
  ): Promise<void> {
    // Create separate sprites for different parts
    const maxSize = 300;
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);
    const centerX = this.pixiApp!.view.width / 2;
    const centerY = this.pixiApp!.view.height / 2;

    // Create main container for the symbol
    const symbolContainer = new PIXI.Container();
    symbolContainer.x = centerX;
    symbolContainer.y = centerY;
    parent.addChild(symbolContainer);

    // Body sprite (center portion)
    const bodySprite = new PIXI.Sprite(baseTexture);
    bodySprite.scale.set(scale);
    bodySprite.anchor.set(0.5, 0.5);
    bodySprite.x = 0;
    bodySprite.y = 0;
    
    // Create a mask for the body (center area only)
    const bodyMask = new PIXI.Graphics();
    bodyMask.beginFill(0xffffff);
    bodyMask.drawEllipse(0, 0, baseTexture.width * 0.3 * scale, baseTexture.height * 0.6 * scale);
    bodyMask.endFill();
    bodySprite.mask = bodyMask;
    
    symbolContainer.addChild(bodyMask);
    symbolContainer.addChild(bodySprite);

    // Left wing sprite  
    const leftWingSprite = new PIXI.Sprite(baseTexture);
    leftWingSprite.scale.set(scale);
    leftWingSprite.anchor.set(0.8, 0.5); // Rotate from attachment point
    leftWingSprite.x = -baseTexture.width * 0.15 * scale;
    leftWingSprite.y = 0;
    
    // Create mask for left wing
    const leftWingMask = new PIXI.Graphics();
    leftWingMask.beginFill(0xffffff);
    leftWingMask.drawRect(-baseTexture.width * 0.5 * scale, -baseTexture.height * 0.5 * scale, 
                         baseTexture.width * 0.35 * scale, baseTexture.height * scale);
    leftWingMask.endFill();
    leftWingMask.x = leftWingSprite.x;
    leftWingMask.y = leftWingSprite.y;
    leftWingSprite.mask = leftWingMask;
    
    symbolContainer.addChild(leftWingMask);
    symbolContainer.addChild(leftWingSprite);

    // Right wing sprite
    const rightWingSprite = new PIXI.Sprite(baseTexture);
    rightWingSprite.scale.set(scale);  
    rightWingSprite.anchor.set(0.2, 0.5); // Rotate from attachment point
    rightWingSprite.x = baseTexture.width * 0.15 * scale;
    rightWingSprite.y = 0;
    
    // Create mask for right wing
    const rightWingMask = new PIXI.Graphics();
    rightWingMask.beginFill(0xffffff);
    rightWingMask.drawRect(baseTexture.width * 0.15 * scale, -baseTexture.height * 0.5 * scale,
                          baseTexture.width * 0.35 * scale, baseTexture.height * scale);
    rightWingMask.endFill();
    rightWingMask.x = rightWingSprite.x;
    rightWingMask.y = rightWingSprite.y;
    rightWingSprite.mask = rightWingMask;
    
    symbolContainer.addChild(rightWingMask);
    symbolContainer.addChild(rightWingSprite);

    // Store sprites by component type
    this.sprites.set('body', bodySprite);
    this.sprites.set('leftWing', leftWingSprite);
    this.sprites.set('rightWing', rightWingSprite);
    
    // Map all components to appropriate sprites
    rig.components.forEach(component => {
      if (component.originalComponent.name.toLowerCase().includes('wing') && 
          component.originalComponent.name.toLowerCase().includes('left')) {
        this.sprites.set(component.id, leftWingSprite);
      } else if (component.originalComponent.name.toLowerCase().includes('wing') && 
                 component.originalComponent.name.toLowerCase().includes('right')) {
        this.sprites.set(component.id, rightWingSprite);
      } else {
        this.sprites.set(component.id, bodySprite);
      }
    });
    
    console.log(`[ProfessionalAnimation] Created separated body and wing sprites`);
  }

  private async createMeshComponent(
    component: RiggedComponent,
    baseTexture: PIXI.Texture,
    parent: PIXI.Container
  ): Promise<void> {
    const { mesh } = component;
    
    // Convert our mesh data to PIXI format
    const vertices = new Float32Array(mesh.vertices.length * 2);
    const uvs = new Float32Array(mesh.vertices.length * 2);
    const indices = new Uint16Array(mesh.triangles.length * 3);

    // Fill vertices and UVs
    mesh.vertices.forEach((vertex, i) => {
      vertices[i * 2] = vertex.x;
      vertices[i * 2 + 1] = vertex.y;
      uvs[i * 2] = vertex.u;
      uvs[i * 2 + 1] = vertex.v;
    });

    // Fill indices
    mesh.triangles.forEach((triangle, i) => {
      indices[i * 3] = triangle.a;
      indices[i * 3 + 1] = triangle.b;
      indices[i * 3 + 2] = triangle.c;
    });

    // Create PIXI mesh
    const geometry = new PIXI.Geometry()
      .addAttribute('aVertexPosition', vertices, 2)
      .addAttribute('aTextureCoord', uvs, 2)
      .addIndex(indices);

    const simpleMesh = new PIXI.SimpleMesh(baseTexture, vertices, uvs, indices);
    
    // Store original vertices for deformation
    (simpleMesh as any).originalVertices = vertices.slice();
    (simpleMesh as any).componentData = component;

    parent.addChild(simpleMesh);
    this.meshes.set(component.id, simpleMesh);

    console.log(`[ProfessionalAnimation] Created mesh for ${component.id}`);
  }

  private async createSpriteComponent(
    component: RiggedComponent,
    baseTexture: PIXI.Texture,
    parent: PIXI.Container
  ): Promise<void> {
    // Use the full base texture for now - we'll improve segmentation later
    const sprite = new PIXI.Sprite(baseTexture);
    
    // Scale to fit nicely in the viewport
    const maxSize = 300;
    const scale = Math.min(maxSize / baseTexture.width, maxSize / baseTexture.height);
    sprite.scale.set(scale);
    
    // Center the sprite in the viewport
    sprite.anchor.set(0.5, 0.5);
    sprite.x = this.pixiApp!.view.width / 2;
    sprite.y = this.pixiApp!.view.height / 2;

    // Store component data
    (sprite as any).componentData = component;
    (sprite as any).originalScale = scale;

    parent.addChild(sprite);
    this.sprites.set(component.id, sprite);

    console.log(`[ProfessionalAnimation] Created sprite for ${component.id} at scale ${scale}`);
  }

  private initializePhysics(rig: AnimationRig): void {
    console.log('[ProfessionalAnimation] Initializing physics simulation...');

    rig.components.forEach(component => {
      if (component.physics.enabled) {
        const physicsBody: PhysicsBody = {
          id: component.id,
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          acceleration: { x: 0, y: 0 },
          mass: component.physics.mass,
          damping: component.physics.damping,
          forces: [],
          constraints: []
        };

        // Add gravity
        physicsBody.forces.push({
          x: rig.physics.world.gravity.x,
          y: rig.physics.world.gravity.y,
          type: 'gravity'
        });

        // Add constraints from original component
        if (component.originalComponent.parent) {
          physicsBody.constraints.push({
            type: 'distance',
            target: component.originalComponent.parent,
            restValue: 0,
            stiffness: 1 - component.originalComponent.material.flexibility
          });
        }

        this.physicsBodies.set(component.id, physicsBody);
      }
    });
  }

  private generateAnimationTracks(rig: AnimationRig, analysis: ComprehensiveAnalysis): void {
    console.log('[ProfessionalAnimation] Generating animation tracks...');

    this.animationTracks = [];

    // Generate different types of animations based on style
    switch (analysis.style.animationStyle) {
      case 'bouncy':
        this.generateBouncyAnimations(rig, analysis);
        break;
      case 'flowing':
        this.generateFlowingAnimations(rig, analysis);
        break;
      case 'snappy':
        this.generateSnappyAnimations(rig, analysis);
        break;
      default:
        this.generateDefaultAnimations(rig, analysis);
    }
  }

  private generateBouncyAnimations(rig: AnimationRig, analysis: ComprehensiveAnalysis): void {
    // Bouncy cartoon-style animations
    rig.components.forEach(component => {
      if (component.originalComponent.type === 'hair') {
        // Hair sway with bounce
        this.animationTracks.push({
          id: `${component.id}_sway`,
          name: 'Hair Sway',
          component: component.id,
          keyframes: [
            {
              time: 0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: 0,
                  scale: { x: 1, y: 1 },
                  skew: { x: 0, y: 0 }
                }
              },
              easing: 'ease-out'
            },
            {
              time: 1.0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: 0.2,
                  scale: { x: 1, y: 1 },
                  skew: { x: 0.1, y: 0 }
                }
              },
              easing: 'bounce'
            },
            {
              time: 2.0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: -0.15,
                  scale: { x: 1, y: 1 },
                  skew: { x: -0.08, y: 0 }
                }
              },
              easing: 'bounce'
            },
            {
              time: 3.0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: 0,
                  scale: { x: 1, y: 1 },
                  skew: { x: 0, y: 0 }
                }
              },
              easing: 'ease-in'
            }
          ],
          weight: 1.0,
          blendMode: 'add'
        });
      }
    });
  }

  private generateFlowingAnimations(rig: AnimationRig, analysis: ComprehensiveAnalysis): void {
    // Smooth, flowing animations
    rig.components.forEach(component => {
      if (component.originalComponent.type === 'cloth') {
        // Cloth wave animation
        this.animationTracks.push({
          id: `${component.id}_wave`,
          name: 'Cloth Wave',
          component: component.id,
          keyframes: [
            {
              time: 0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: 0,
                  scale: { x: 1, y: 1 },
                  skew: { x: 0, y: 0 }
                }
              },
              easing: 'ease-in-out'
            },
            {
              time: 2.5,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 5 },
                  rotation: 0.1,
                  scale: { x: 1, y: 1.05 },
                  skew: { x: 0.05, y: 0 }
                }
              },
              easing: 'ease-in-out'
            },
            {
              time: 5.0,
              transforms: {
                [component.id]: {
                  position: { x: 0, y: 0 },
                  rotation: 0,
                  scale: { x: 1, y: 1 },
                  skew: { x: 0, y: 0 }
                }
              },
              easing: 'ease-in-out'
            }
          ],
          weight: 1.0,
          blendMode: 'add'
        });
      }
    });
  }

  private generateSnappyAnimations(rig: AnimationRig, analysis: ComprehensiveAnalysis): void {
    // Quick, snappy game-style animations
    rig.components.forEach(component => {
      this.animationTracks.push({
        id: `${component.id}_snap`,
        name: 'Snappy Motion',
        component: component.id,
        keyframes: [
          {
            time: 0,
            transforms: {
              [component.id]: {
                position: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 },
                skew: { x: 0, y: 0 }
              }
            },
            easing: 'linear'
          },
          {
            time: 0.1,
            transforms: {
              [component.id]: {
                position: { x: 0, y: -2 },
                rotation: 0.05,
                scale: { x: 1.02, y: 0.98 },
                skew: { x: 0, y: 0 }
              }
            },
            easing: 'ease-out'
          },
          {
            time: 0.3,
            transforms: {
              [component.id]: {
                position: { x: 0, y: 0 },
                rotation: 0,
                scale: { x: 1, y: 1 },
                skew: { x: 0, y: 0 }
              }
            },
            easing: 'ease-in'
          }
        ],
        weight: 1.0,
        blendMode: 'replace'
      });
    });
  }

  private generateDefaultAnimations(rig: AnimationRig, analysis: ComprehensiveAnalysis): void {
    console.log('[ProfessionalAnimation] Generating realistic wing flapping animations...');
    
    // Body floating animation
    this.animationTracks.push({
      id: 'body_float',
      name: 'Body Floating',
      component: 'body',
      keyframes: [
        {
          time: 0,
          transforms: {
            'body': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in-out'
        },
        {
          time: 2.0,
          transforms: {
            'body': {
              position: { x: 0, y: -5 },
              rotation: 0.02,
              scale: { x: 1.01, y: 1.01 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in-out'
        },
        {
          time: 4.0,
          transforms: {
            'body': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in-out'
        }
      ],
      weight: 1.0,
      blendMode: 'replace'
    });

    // Left wing flapping
    this.animationTracks.push({
      id: 'left_wing_flap',
      name: 'Left Wing Flapping',
      component: 'leftWing',
      keyframes: [
        {
          time: 0,
          transforms: {
            'leftWing': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-out'
        },
        {
          time: 0.3,
          transforms: {
            'leftWing': {
              position: { x: 0, y: 0 },
              rotation: -0.4, // 23 degrees up
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in'
        },
        {
          time: 0.6,
          transforms: {
            'leftWing': {
              position: { x: 0, y: 0 },
              rotation: 0.2, // 11 degrees down
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-out'
        },
        {
          time: 1.0,
          transforms: {
            'leftWing': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in-out'
        }
      ],
      weight: 1.0,
      blendMode: 'replace'
    });

    // Right wing flapping (mirrored)
    this.animationTracks.push({
      id: 'right_wing_flap',
      name: 'Right Wing Flapping',
      component: 'rightWing',
      keyframes: [
        {
          time: 0,
          transforms: {
            'rightWing': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-out'
        },
        {
          time: 0.3,
          transforms: {
            'rightWing': {
              position: { x: 0, y: 0 },
              rotation: 0.4, // 23 degrees up (opposite direction)
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in'
        },
        {
          time: 0.6,
          transforms: {
            'rightWing': {
              position: { x: 0, y: 0 },
              rotation: -0.2, // 11 degrees down (opposite direction)
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-out'
        },
        {
          time: 1.0,
          transforms: {
            'rightWing': {
              position: { x: 0, y: 0 },
              rotation: 0,
              scale: { x: 1, y: 1 },
              skew: { x: 0, y: 0 }
            }
          },
          easing: 'ease-in-out'
        }
      ],
      weight: 1.0,
      blendMode: 'replace'
    });
  }

  startAnimation(): void {
    if (!this.pixiApp) return;

    this.animationState.playing = true;
    this.animationState.time = 0;

    // Start PIXI ticker
    this.pixiApp.ticker.add(this.updateAnimation, this);
    console.log('[ProfessionalAnimation] Animation started');
  }

  stopAnimation(): void {
    if (!this.pixiApp) return;

    this.animationState.playing = false;
    this.pixiApp.ticker.remove(this.updateAnimation, this);
    console.log('[ProfessionalAnimation] Animation stopped');
  }

  private updateAnimation(deltaTime: number): void {
    if (!this.animationState.playing) return;

    this.animationState.deltaTime = deltaTime / 60; // Convert to seconds
    this.animationState.time += this.animationState.deltaTime * this.animationState.speed;

    // Update physics
    this.updatePhysics();

    // Update animations
    this.updateAnimationTracks();

    // Update renderables
    this.updateRenderables();

    // Handle looping
    if (this.animationState.loop && this.animationState.time > 5.0) {
      this.animationState.time = 0;
    }
  }

  private updatePhysics(): void {
    this.physicsBodies.forEach(body => {
      // Reset acceleration
      body.acceleration.x = 0;
      body.acceleration.y = 0;

      // Apply forces
      body.forces.forEach(force => {
        body.acceleration.x += force.x / body.mass;
        body.acceleration.y += force.y / body.mass;
      });

      // Apply constraints
      body.constraints.forEach(constraint => {
        if (constraint.type === 'distance' && constraint.target) {
          const targetBody = this.physicsBodies.get(constraint.target);
          if (targetBody) {
            const dx = targetBody.position.x - body.position.x;
            const dy = targetBody.position.y - body.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const difference = distance - constraint.restValue;
            
            const force = difference * constraint.stiffness;
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            body.acceleration.x += normalizedDx * force;
            body.acceleration.y += normalizedDy * force;
          }
        }
      });

      // Integrate motion
      body.velocity.x += body.acceleration.x * this.animationState.deltaTime;
      body.velocity.y += body.acceleration.y * this.animationState.deltaTime;

      // Apply damping
      body.velocity.x *= Math.pow(body.damping, this.animationState.deltaTime);
      body.velocity.y *= Math.pow(body.damping, this.animationState.deltaTime);

      // Update position
      body.position.x += body.velocity.x * this.animationState.deltaTime;
      body.position.y += body.velocity.y * this.animationState.deltaTime;
    });
  }

  private updateAnimationTracks(): void {
    this.animationTracks.forEach(track => {
      const sprite = this.sprites.get(track.component);
      const mesh = this.meshes.get(track.component);
      
      if (!sprite && !mesh) return;

      // Find current keyframes
      const currentTransform = this.interpolateKeyframes(track);
      if (!currentTransform) return;

      const transform = currentTransform[track.component];
      if (!transform) return;

      // Apply transform to sprite
      if (sprite) {
        sprite.x += transform.position.x;
        sprite.y += transform.position.y;
        sprite.rotation += transform.rotation;
        sprite.scale.x *= transform.scale.x;
        sprite.scale.y *= transform.scale.y;
        sprite.skew.x += transform.skew.x;
        sprite.skew.y += transform.skew.y;
      }

      // Apply transform to mesh (more complex deformation)
      if (mesh) {
        this.deformMesh(mesh, transform);
      }
    });
  }

  private interpolateKeyframes(track: AnimationTrack): any {
    const currentTime = this.animationState.time;
    
    // Find surrounding keyframes
    let beforeFrame = null;
    let afterFrame = null;

    for (let i = 0; i < track.keyframes.length; i++) {
      const frame = track.keyframes[i];
      if (frame.time <= currentTime) {
        beforeFrame = frame;
      }
      if (frame.time >= currentTime && !afterFrame) {
        afterFrame = frame;
        break;
      }
    }

    if (!beforeFrame && !afterFrame) return null;
    if (!afterFrame) return beforeFrame.transforms;
    if (!beforeFrame) return afterFrame.transforms;
    if (beforeFrame === afterFrame) return beforeFrame.transforms;

    // Interpolate between frames
    const t = (currentTime - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
    const easedT = this.applyEasing(t, beforeFrame.easing);

    const result: any = {};
    Object.keys(beforeFrame.transforms).forEach(componentId => {
      const before = beforeFrame.transforms[componentId];
      const after = afterFrame.transforms[componentId];

      result[componentId] = {
        position: {
          x: this.lerp(before.position.x, after.position.x, easedT),
          y: this.lerp(before.position.y, after.position.y, easedT)
        },
        rotation: this.lerp(before.rotation, after.rotation, easedT),
        scale: {
          x: this.lerp(before.scale.x, after.scale.x, easedT),
          y: this.lerp(before.scale.y, after.scale.y, easedT)
        },
        skew: {
          x: this.lerp(before.skew.x, after.skew.x, easedT),
          y: this.lerp(before.skew.y, after.skew.y, easedT)
        }
      };
    });

    return result;
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        if (t < 1/2.75) return 7.5625 * t * t;
        if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
        if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
      case 'elastic':
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      default:
        return t;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private deformMesh(mesh: PIXI.SimpleMesh, transform: any): void {
    // Apply sophisticated mesh deformation
    const componentData = (mesh as any).componentData as RiggedComponent;
    const originalVertices = (mesh as any).originalVertices as Float32Array;
    
    if (!componentData || !originalVertices) return;

    // Apply transform to each vertex based on bone weights
    const newVertices = new Float32Array(originalVertices.length);
    
    for (let i = 0; i < originalVertices.length; i += 2) {
      const vertexIndex = i / 2;
      const weights = componentData.mesh.weights[vertexIndex] || {};
      
      let transformedX = 0;
      let transformedY = 0;
      let totalWeight = 0;

      // Apply weighted bone transforms
      Object.keys(weights).forEach(boneId => {
        const weight = weights[boneId];
        totalWeight += weight;
        
        // Simple transform application (would be more complex with proper bone matrices)
        transformedX += (originalVertices[i] + transform.position.x) * weight;
        transformedY += (originalVertices[i + 1] + transform.position.y) * weight;
      });

      if (totalWeight > 0) {
        newVertices[i] = transformedX / totalWeight;
        newVertices[i + 1] = transformedY / totalWeight;
      } else {
        newVertices[i] = originalVertices[i];
        newVertices[i + 1] = originalVertices[i + 1];
      }
    }

    // Update mesh vertices
    mesh.geometry.getBuffer('aVertexPosition').update(newVertices);
  }

  private updateRenderables(): void {
    // Apply physics results to renderables
    this.physicsBodies.forEach((body, componentId) => {
      const sprite = this.sprites.get(componentId);
      if (sprite) {
        sprite.x += body.position.x;
        sprite.y += body.position.y;
      }

      const mesh = this.meshes.get(componentId);
      if (mesh) {
        mesh.x += body.position.x;
        mesh.y += body.position.y;
      }
    });
  }

  // Public API methods
  setAnimationSpeed(speed: number): void {
    this.animationState.speed = Math.max(0, speed);
  }

  setLooping(loop: boolean): void {
    this.animationState.loop = loop;
  }

  getCurrentTime(): number {
    return this.animationState.time;
  }

  isPlaying(): boolean {
    return this.animationState.playing;
  }
}

export const professionalAnimationEngine = new ProfessionalAnimationEngine();
export type { AnimationState, AnimationTrack, PhysicsBody };