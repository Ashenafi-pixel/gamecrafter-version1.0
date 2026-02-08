// Advanced Physics Engine - Professional Grade
// Implements soft body, rigid body, fluid simulation, and particle systems

import * as PIXI from 'pixi.js';

// Core physics interfaces
export interface PhysicsWorld {
  gravity: { x: number; y: number };
  airResistance: number;
  timeStep: number;
  substeps: number;
  bounds: { x: number; y: number; width: number; height: number };
  enabled: boolean;
}

export interface RigidBody {
  id: string;
  type: 'static' | 'kinematic' | 'dynamic';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  rotation: number;
  angularVelocity: number;
  angularAcceleration: number;
  
  // Physical properties
  mass: number;
  inertia: number;
  restitution: number; // Bounciness
  friction: number;
  linearDamping: number;
  angularDamping: number;
  
  // Shape and collision
  shape: CollisionShape;
  material: PhysicsMaterial;
  
  // Forces
  forces: Force[];
  torques: number[];
  
  // State
  isAwake: boolean;
  isSleeping: boolean;
  sleepThreshold: number;
  
  // User data
  userData?: any;
}

export interface SoftBody {
  id: string;
  particles: SoftBodyParticle[];
  springs: Spring[];
  constraints: SoftBodyConstraint[];
  
  // Physical properties
  pressure: number;
  damping: number;
  stiffness: number;
  
  // Simulation parameters
  iterations: number;
  volumePreservation: boolean;
  selfCollision: boolean;
  
  // Rendering
  mesh?: Float32Array;
  indices?: Uint16Array;
}

export interface SoftBodyParticle {
  id: string;
  position: { x: number; y: number };
  oldPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  invMass: number;
  radius: number;
  pinned: boolean;
  forces: Force[];
}

export interface Spring {
  id: string;
  particle1: string;
  particle2: string;
  restLength: number;
  stiffness: number;
  damping: number;
  enabled: boolean;
}

export interface SoftBodyConstraint {
  type: 'distance' | 'angle' | 'volume' | 'pressure';
  particles: string[];
  targetValue: number;
  stiffness: number;
  enabled: boolean;
}

export interface FluidSystem {
  id: string;
  particles: FluidParticle[];
  density: number;
  viscosity: number;
  pressure: number;
  surfaceTension: number;
  cohesion: number;
  adhesion: number;
  
  // SPH parameters
  smoothingRadius: number;
  gasConstant: number;
  restDensity: number;
  
  // Grid optimization
  spatialGrid: SpatialGrid;
}

export interface FluidParticle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  density: number;
  pressure: number;
  mass: number;
  color: number;
  
  // SPH data
  neighbors: string[];
  forces: { x: number; y: number };
}

export interface ParticleSystem {
  id: string;
  emitter: ParticleEmitter;
  particles: Particle[];
  maxParticles: number;
  
  // Simulation
  forces: GlobalForce[];
  colliders: Collider[];
  
  // Rendering
  texture?: PIXI.Texture;
  blendMode: PIXI.BLEND_MODES;
  
  // State
  isActive: boolean;
  totalTime: number;
}

export interface ParticleEmitter {
  position: { x: number; y: number };
  emissionRate: number; // particles per second
  emissionArea: { width: number; height: number };
  
  // Particle properties
  lifetime: { min: number; max: number };
  speed: { min: number; max: number };
  direction: { min: number; max: number }; // radians
  size: { start: number; end: number };
  color: { start: number; end: number };
  alpha: { start: number; end: number };
  
  // Emission pattern
  pattern: 'point' | 'circle' | 'rectangle' | 'burst';
  burstCount?: number;
}

export interface Particle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  
  // Visual properties
  size: number;
  rotation: number;
  angularVelocity: number;
  color: number;
  alpha: number;
  
  // Lifecycle
  age: number;
  lifetime: number;
  isAlive: boolean;
  
  // Physics
  mass: number;
  drag: number;
  
  // User data
  userData?: any;
}

export interface CollisionShape {
  type: 'circle' | 'rectangle' | 'polygon' | 'line';
  data: any; // Shape-specific data
}

export interface PhysicsMaterial {
  density: number;
  friction: number;
  restitution: number;
  name: string;
}

export interface Force {
  type: 'constant' | 'spring' | 'damping' | 'magnetic' | 'wind' | 'gravity';
  vector: { x: number; y: number };
  strength: number;
  enabled: boolean;
  falloff?: 'none' | 'linear' | 'quadratic';
  range?: number;
}

export interface GlobalForce extends Force {
  affectsMask: number; // Bitmask for what this force affects
}

export interface Collider {
  type: 'plane' | 'circle' | 'rectangle';
  position: { x: number; y: number };
  rotation: number;
  restitution: number;
  friction: number;
  enabled: boolean;
}

export interface SpatialGrid {
  cellSize: number;
  cells: Map<string, string[]>; // Cell key -> particle IDs
  bounds: { x: number; y: number; width: number; height: number };
}

export interface CollisionManifold {
  bodyA: string;
  bodyB: string;
  contactPoints: ContactPoint[];
  normal: { x: number; y: number };
  penetration: number;
}

export interface ContactPoint {
  position: { x: number; y: number };
  impulse: number;
}

export class AdvancedPhysicsEngine {
  private world: PhysicsWorld;
  private rigidBodies: Map<string, RigidBody> = new Map();
  private softBodies: Map<string, SoftBody> = new Map();
  private fluidSystems: Map<string, FluidSystem> = new Map();
  private particleSystems: Map<string, ParticleSystem> = new Map();
  
  // Collision detection
  private collisionPairs: CollisionManifold[] = [];
  private broadphaseGrid: SpatialGrid;
  
  // Performance tracking
  private frameTime: number = 0;
  private updateCount: number = 0;
  
  constructor(worldConfig?: Partial<PhysicsWorld>) {
    this.world = {
      gravity: { x: 0, y: 980 }, // 980 pixels/s² (Earth gravity)
      airResistance: 0.01,
      timeStep: 1/60,
      substeps: 4,
      bounds: { x: 0, y: 0, width: 2000, height: 2000 },
      enabled: true,
      ...worldConfig
    };
    
    this.broadphaseGrid = {
      cellSize: 100,
      cells: new Map(),
      bounds: this.world.bounds
    };
    
    console.log('[AdvancedPhysics] Professional physics engine initialized');
  }
  
  // Rigid Body System
  addRigidBody(body: RigidBody): void {
    this.rigidBodies.set(body.id, body);
    console.log(`[AdvancedPhysics] Added rigid body: ${body.id} (${body.type})`);
  }
  
  removeRigidBody(id: string): void {
    this.rigidBodies.delete(id);
  }
  
  createRigidBody(config: {
    id: string;
    type: RigidBody['type'];
    position: { x: number; y: number };
    shape: CollisionShape;
    material?: PhysicsMaterial;
    mass?: number;
  }): RigidBody {
    const body: RigidBody = {
      id: config.id,
      type: config.type,
      position: { ...config.position },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
      angularVelocity: 0,
      angularAcceleration: 0,
      
      mass: config.mass || 1.0,
      inertia: this.calculateInertia(config.shape, config.mass || 1.0),
      restitution: config.material?.restitution || 0.5,
      friction: config.material?.friction || 0.3,
      linearDamping: 0.01,
      angularDamping: 0.01,
      
      shape: config.shape,
      material: config.material || {
        density: 1.0,
        friction: 0.3,
        restitution: 0.5,
        name: 'default'
      },
      
      forces: [],
      torques: [],
      
      isAwake: true,
      isSleeping: false,
      sleepThreshold: 0.1
    };
    
    this.addRigidBody(body);
    return body;
  }
  
  private calculateInertia(shape: CollisionShape, mass: number): number {
    switch (shape.type) {
      case 'circle':
        const radius = shape.data.radius;
        return 0.5 * mass * radius * radius;
      
      case 'rectangle':
        const { width, height } = shape.data;
        return mass * (width * width + height * height) / 12;
      
      case 'polygon':
        // Simplified calculation for polygon
        return mass * 100; // Placeholder
      
      default:
        return mass;
    }
  }
  
  applyForce(bodyId: string, force: { x: number; y: number }, point?: { x: number; y: number }): void {
    const body = this.rigidBodies.get(bodyId);
    if (!body || body.type === 'static') return;
    
    if (point) {
      // Apply force at specific point (creates torque)
      const relativePoint = {
        x: point.x - body.position.x,
        y: point.y - body.position.y
      };
      
      const torque = relativePoint.x * force.y - relativePoint.y * force.x;
      body.torques.push(torque);
    }
    
    body.forces.push({
      type: 'constant',
      vector: force,
      strength: 1.0,
      enabled: true
    });
  }
  
  applyImpulse(bodyId: string, impulse: { x: number; y: number }, point?: { x: number; y: number }): void {
    const body = this.rigidBodies.get(bodyId);
    if (!body || body.type === 'static') return;
    
    // Impulse = change in momentum
    body.velocity.x += impulse.x / body.mass;
    body.velocity.y += impulse.y / body.mass;
    
    if (point) {
      const relativePoint = {
        x: point.x - body.position.x,
        y: point.y - body.position.y
      };
      
      const angularImpulse = relativePoint.x * impulse.y - relativePoint.y * impulse.x;
      body.angularVelocity += angularImpulse / body.inertia;
    }
  }
  
  // Soft Body System
  addSoftBody(softBody: SoftBody): void {
    this.softBodies.set(softBody.id, softBody);
    console.log(`[AdvancedPhysics] Added soft body: ${softBody.id} with ${softBody.particles.length} particles`);
  }
  
  createSoftBody(config: {
    id: string;
    vertices: { x: number; y: number }[];
    springStiffness?: number;
    damping?: number;
    pressure?: number;
  }): SoftBody {
    const particles: SoftBodyParticle[] = [];
    const springs: Spring[] = [];
    
    // Create particles
    config.vertices.forEach((vertex, index) => {
      const particle: SoftBodyParticle = {
        id: `${config.id}_particle_${index}`,
        position: { ...vertex },
        oldPosition: { ...vertex },
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
        mass: 1.0,
        invMass: 1.0,
        radius: 5,
        pinned: false,
        forces: []
      };
      particles.push(particle);
    });
    
    // Create springs between adjacent particles
    for (let i = 0; i < particles.length; i++) {
      const nextIndex = (i + 1) % particles.length;
      const p1 = particles[i];
      const p2 = particles[nextIndex];
      
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const restLength = Math.sqrt(dx * dx + dy * dy);
      
      const spring: Spring = {
        id: `${config.id}_spring_${i}`,
        particle1: p1.id,
        particle2: p2.id,
        restLength,
        stiffness: config.springStiffness || 0.8,
        damping: config.damping || 0.1,
        enabled: true
      };
      springs.push(spring);
    }
    
    // Create diagonal springs for structural integrity
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 2; j < particles.length && j < i + particles.length - 1; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        
        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const restLength = Math.sqrt(dx * dx + dy * dy);
        
        const spring: Spring = {
          id: `${config.id}_diag_spring_${i}_${j}`,
          particle1: p1.id,
          particle2: p2.id,
          restLength,
          stiffness: (config.springStiffness || 0.8) * 0.5, // Weaker diagonal springs
          damping: config.damping || 0.1,
          enabled: true
        };
        springs.push(spring);
      }
    }
    
    const softBody: SoftBody = {
      id: config.id,
      particles,
      springs,
      constraints: [],
      pressure: config.pressure || 0.0,
      damping: config.damping || 0.99,
      stiffness: config.springStiffness || 0.8,
      iterations: 3,
      volumePreservation: true,
      selfCollision: false
    };
    
    this.addSoftBody(softBody);
    return softBody;
  }
  
  // Fluid System (SPH - Smoothed Particle Hydrodynamics)
  addFluidSystem(fluidSystem: FluidSystem): void {
    this.fluidSystems.set(fluidSystem.id, fluidSystem);
    console.log(`[AdvancedPhysics] Added fluid system: ${fluidSystem.id} with ${fluidSystem.particles.length} particles`);
  }
  
  createFluidSystem(config: {
    id: string;
    particles: { x: number; y: number }[];
    density?: number;
    viscosity?: number;
    pressure?: number;
  }): FluidSystem {
    const particles: FluidParticle[] = config.particles.map((pos, index) => ({
      id: `${config.id}_fluid_${index}`,
      position: { ...pos },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      density: config.density || 1000,
      pressure: config.pressure || 0,
      mass: 1.0,
      color: 0x4A90E2,
      neighbors: [],
      forces: { x: 0, y: 0 }
    }));
    
    const fluidSystem: FluidSystem = {
      id: config.id,
      particles,
      density: config.density || 1000,
      viscosity: config.viscosity || 0.1,
      pressure: config.pressure || 0,
      surfaceTension: 0.1,
      cohesion: 0.1,
      adhesion: 0.1,
      
      smoothingRadius: 30,
      gasConstant: 2000,
      restDensity: config.density || 1000,
      
      spatialGrid: {
        cellSize: 30,
        cells: new Map(),
        bounds: this.world.bounds
      }
    };
    
    this.addFluidSystem(fluidSystem);
    return fluidSystem;
  }
  
  // Particle System
  addParticleSystem(particleSystem: ParticleSystem): void {
    this.particleSystems.set(particleSystem.id, particleSystem);
    console.log(`[AdvancedPhysics] Added particle system: ${particleSystem.id}`);
  }
  
  createParticleSystem(config: {
    id: string;
    emitter: Partial<ParticleEmitter>;
    maxParticles?: number;
    forces?: GlobalForce[];
  }): ParticleSystem {
    const emitter: ParticleEmitter = {
      position: { x: 0, y: 0 },
      emissionRate: 50,
      emissionArea: { width: 10, height: 10 },
      lifetime: { min: 1, max: 3 },
      speed: { min: 50, max: 150 },
      direction: { min: 0, max: Math.PI * 2 },
      size: { start: 5, end: 1 },
      color: { start: 0xFFFFFF, end: 0x888888 },
      alpha: { start: 1, end: 0 },
      pattern: 'point',
      ...config.emitter
    };
    
    const particleSystem: ParticleSystem = {
      id: config.id,
      emitter,
      particles: [],
      maxParticles: config.maxParticles || 1000,
      forces: config.forces || [],
      colliders: [],
      blendMode: PIXI.BLEND_MODES.NORMAL,
      isActive: true,
      totalTime: 0
    };
    
    this.addParticleSystem(particleSystem);
    return particleSystem;
  }
  
  emitParticles(systemId: string, count: number): void {
    const system = this.particleSystems.get(systemId);
    if (!system || !system.isActive) return;
    
    for (let i = 0; i < count && system.particles.length < system.maxParticles; i++) {
      const particle = this.createParticle(system.emitter);
      system.particles.push(particle);
    }
  }
  
  private createParticle(emitter: ParticleEmitter): Particle {
    const position = this.getEmissionPosition(emitter);
    const direction = this.random(emitter.direction.min, emitter.direction.max);
    const speed = this.random(emitter.speed.min, emitter.speed.max);
    
    return {
      id: `particle_${Date.now()}_${Math.random()}`,
      position,
      velocity: {
        x: Math.cos(direction) * speed,
        y: Math.sin(direction) * speed
      },
      acceleration: { x: 0, y: 0 },
      
      size: emitter.size.start,
      rotation: 0,
      angularVelocity: this.random(-1, 1),
      color: emitter.color.start,
      alpha: emitter.alpha.start,
      
      age: 0,
      lifetime: this.random(emitter.lifetime.min, emitter.lifetime.max),
      isAlive: true,
      
      mass: 1.0,
      drag: 0.01
    };
  }
  
  private getEmissionPosition(emitter: ParticleEmitter): { x: number; y: number } {
    switch (emitter.pattern) {
      case 'circle':
        const angle = this.random(0, Math.PI * 2);
        const radius = this.random(0, emitter.emissionArea.width / 2);
        return {
          x: emitter.position.x + Math.cos(angle) * radius,
          y: emitter.position.y + Math.sin(angle) * radius
        };
      
      case 'rectangle':
        return {
          x: emitter.position.x + this.random(-emitter.emissionArea.width / 2, emitter.emissionArea.width / 2),
          y: emitter.position.y + this.random(-emitter.emissionArea.height / 2, emitter.emissionArea.height / 2)
        };
      
      default: // 'point'
        return { ...emitter.position };
    }
  }
  
  // Main Physics Update Loop
  update(deltaTime: number): void {
    if (!this.world.enabled) return;
    
    const startTime = performance.now();
    const timeStep = this.world.timeStep;
    const substeps = this.world.substeps;
    const substepTime = timeStep / substeps;
    
    // Clear collision data
    this.collisionPairs = [];
    
    // Update physics in substeps for better stability
    for (let step = 0; step < substeps; step++) {
      // Update rigid bodies
      this.updateRigidBodies(substepTime);
      
      // Update soft bodies
      this.updateSoftBodies(substepTime);
      
      // Update fluid systems
      this.updateFluidSystems(substepTime);
      
      // Collision detection and response
      this.performCollisionDetection();
      this.resolveCollisions();
    }
    
    // Update particle systems (once per frame)
    this.updateParticleSystems(deltaTime);
    
    // Performance tracking
    this.frameTime = performance.now() - startTime;
    this.updateCount++;
  }
  
  private updateRigidBodies(deltaTime: number): void {
    for (const body of this.rigidBodies.values()) {
      if (body.type === 'static' || body.isSleeping) continue;
      
      // Clear acceleration
      body.acceleration.x = 0;
      body.acceleration.y = 0;
      body.angularAcceleration = 0;
      
      // Apply gravity
      if (body.type === 'dynamic') {
        body.acceleration.x += this.world.gravity.x;
        body.acceleration.y += this.world.gravity.y;
      }
      
      // Apply forces
      for (const force of body.forces) {
        if (!force.enabled) continue;
        
        body.acceleration.x += force.vector.x * force.strength / body.mass;
        body.acceleration.y += force.vector.y * force.strength / body.mass;
      }
      
      // Apply torques
      for (const torque of body.torques) {
        body.angularAcceleration += torque / body.inertia;
      }
      
      // Air resistance
      const airResistance = this.world.airResistance;
      body.velocity.x *= (1 - airResistance * deltaTime);
      body.velocity.y *= (1 - airResistance * deltaTime);
      body.angularVelocity *= (1 - airResistance * deltaTime);
      
      // Linear damping
      body.velocity.x *= Math.pow(1 - body.linearDamping, deltaTime);
      body.velocity.y *= Math.pow(1 - body.linearDamping, deltaTime);
      
      // Angular damping
      body.angularVelocity *= Math.pow(1 - body.angularDamping, deltaTime);
      
      // Integrate velocity
      body.velocity.x += body.acceleration.x * deltaTime;
      body.velocity.y += body.acceleration.y * deltaTime;
      body.angularVelocity += body.angularAcceleration * deltaTime;
      
      // Integrate position
      body.position.x += body.velocity.x * deltaTime;
      body.position.y += body.velocity.y * deltaTime;
      body.rotation += body.angularVelocity * deltaTime;
      
      // Check sleep conditions
      const velocityMagnitude = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y);
      if (velocityMagnitude < body.sleepThreshold && Math.abs(body.angularVelocity) < body.sleepThreshold) {
        body.isSleeping = true;
        body.isAwake = false;
      }
      
      // Clear forces for next frame
      body.forces = [];
      body.torques = [];
    }
  }
  
  private updateSoftBodies(deltaTime: number): void {
    for (const softBody of this.softBodies.values()) {
      // Update particles
      for (const particle of softBody.particles) {
        if (particle.pinned) continue;
        
        // Verlet integration
        const tempX = particle.position.x;
        const tempY = particle.position.y;
        
        particle.position.x += (particle.position.x - particle.oldPosition.x) * softBody.damping + 
                               particle.acceleration.x * deltaTime * deltaTime;
        particle.position.y += (particle.position.y - particle.oldPosition.y) * softBody.damping + 
                               particle.acceleration.y * deltaTime * deltaTime;
        
        particle.oldPosition.x = tempX;
        particle.oldPosition.y = tempY;
        
        // Apply gravity
        particle.acceleration.x = this.world.gravity.x;
        particle.acceleration.y = this.world.gravity.y;
        
        // Apply forces
        for (const force of particle.forces) {
          if (!force.enabled) continue;
          particle.acceleration.x += force.vector.x * force.strength / particle.mass;
          particle.acceleration.y += force.vector.y * force.strength / particle.mass;
        }
      }
      
      // Constraint solving iterations
      for (let iter = 0; iter < softBody.iterations; iter++) {
        // Solve spring constraints
        this.solveSprings(softBody);
        
        // Solve other constraints
        this.solveSoftBodyConstraints(softBody);
      }
      
      // Update velocities
      for (const particle of softBody.particles) {
        particle.velocity.x = (particle.position.x - particle.oldPosition.x) / deltaTime;
        particle.velocity.y = (particle.position.y - particle.oldPosition.y) / deltaTime;
        
        // Clear forces
        particle.forces = [];
      }
      
      // Update mesh if exists
      if (softBody.mesh) {
        this.updateSoftBodyMesh(softBody);
      }
    }
  }
  
  private solveSprings(softBody: SoftBody): void {
    for (const spring of softBody.springs) {
      if (!spring.enabled) continue;
      
      const p1 = softBody.particles.find(p => p.id === spring.particle1);
      const p2 = softBody.particles.find(p => p.id === spring.particle2);
      
      if (!p1 || !p2) continue;
      
      const dx = p2.position.x - p1.position.x;
      const dy = p2.position.y - p1.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) continue;
      
      const difference = (spring.restLength - distance) / distance;
      const translate = difference * spring.stiffness * 0.5;
      
      const offsetX = dx * translate;
      const offsetY = dy * translate;
      
      if (!p1.pinned) {
        p1.position.x -= offsetX;
        p1.position.y -= offsetY;
      }
      
      if (!p2.pinned) {
        p2.position.x += offsetX;
        p2.position.y += offsetY;
      }
    }
  }
  
  private solveSoftBodyConstraints(softBody: SoftBody): void {
    for (const constraint of softBody.constraints) {
      if (!constraint.enabled) continue;
      
      switch (constraint.type) {
        case 'distance':
          this.solveDistanceConstraint(softBody, constraint);
          break;
        case 'volume':
          this.solveVolumeConstraint(softBody, constraint);
          break;
        case 'pressure':
          this.solvePressureConstraint(softBody, constraint);
          break;
      }
    }
  }
  
  private solveDistanceConstraint(softBody: SoftBody, constraint: SoftBodyConstraint): void {
    if (constraint.particles.length < 2) return;
    
    const p1Id = constraint.particles[0];
    const p2Id = constraint.particles[1];
    
    const p1 = softBody.particles.find(p => p.id === p1Id);
    const p2 = softBody.particles.find(p => p.id === p2Id);
    
    if (!p1 || !p2) return;
    
    const dx = p2.position.x - p1.position.x;
    const dy = p2.position.y - p1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const difference = (constraint.targetValue - distance) / distance;
    const translate = difference * constraint.stiffness * 0.5;
    
    const offsetX = dx * translate;
    const offsetY = dy * translate;
    
    if (!p1.pinned) {
      p1.position.x -= offsetX;
      p1.position.y -= offsetY;
    }
    
    if (!p2.pinned) {
      p2.position.x += offsetX;
      p2.position.y += offsetY;
    }
  }
  
  private solveVolumeConstraint(softBody: SoftBody, constraint: SoftBodyConstraint): void {
    // Calculate current area/volume
    const particles = constraint.particles.map(id => 
      softBody.particles.find(p => p.id === id)
    ).filter(Boolean) as SoftBodyParticle[];
    
    if (particles.length < 3) return;
    
    let area = 0;
    let centroidX = 0;
    let centroidY = 0;
    
    // Calculate centroid
    for (const particle of particles) {
      centroidX += particle.position.x;
      centroidY += particle.position.y;
    }
    centroidX /= particles.length;
    centroidY /= particles.length;
    
    // Calculate area using shoelace formula
    for (let i = 0; i < particles.length; i++) {
      const j = (i + 1) % particles.length;
      area += particles[i].position.x * particles[j].position.y;
      area -= particles[j].position.x * particles[i].position.y;
    }
    area = Math.abs(area) / 2;
    
    // Apply volume preservation
    if (area > 0) {
      const scale = Math.sqrt(constraint.targetValue / area);
      const influence = constraint.stiffness;
      
      for (const particle of particles) {
        if (particle.pinned) continue;
        
        const dx = particle.position.x - centroidX;
        const dy = particle.position.y - centroidY;
        
        const targetX = centroidX + dx * scale;
        const targetY = centroidY + dy * scale;
        
        particle.position.x = this.lerp(particle.position.x, targetX, influence);
        particle.position.y = this.lerp(particle.position.y, targetY, influence);
      }
    }
  }
  
  private solvePressureConstraint(softBody: SoftBody, constraint: SoftBodyConstraint): void {
    const particles = constraint.particles.map(id => 
      softBody.particles.find(p => p.id === id)
    ).filter(Boolean) as SoftBodyParticle[];
    
    if (particles.length < 3) return;
    
    // Calculate centroid
    let centroidX = 0;
    let centroidY = 0;
    for (const particle of particles) {
      centroidX += particle.position.x;
      centroidY += particle.position.y;
    }
    centroidX /= particles.length;
    centroidY /= particles.length;
    
    // Apply outward pressure
    const pressure = constraint.targetValue * constraint.stiffness;
    
    for (const particle of particles) {
      if (particle.pinned) continue;
      
      const dx = particle.position.x - centroidX;
      const dy = particle.position.y - centroidY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        particle.position.x += normalX * pressure;
        particle.position.y += normalY * pressure;
      }
    }
  }
  
  private updateSoftBodyMesh(softBody: SoftBody): void {
    if (!softBody.mesh || !softBody.indices) return;
    
    // Update vertex positions in mesh
    for (let i = 0; i < softBody.particles.length; i++) {
      const particle = softBody.particles[i];
      softBody.mesh[i * 2] = particle.position.x;
      softBody.mesh[i * 2 + 1] = particle.position.y;
    }
  }
  
  private updateFluidSystems(deltaTime: number): void {
    for (const fluidSystem of this.fluidSystems.values()) {
      // Update spatial grid
      this.updateFluidSpatialGrid(fluidSystem);
      
      // Calculate densities and pressures
      this.calculateFluidDensities(fluidSystem);
      this.calculateFluidPressures(fluidSystem);
      
      // Calculate forces
      this.calculateFluidForces(fluidSystem);
      
      // Integrate particles
      for (const particle of fluidSystem.particles) {
        // Apply gravity
        particle.acceleration.x = this.world.gravity.x + particle.forces.x;
        particle.acceleration.y = this.world.gravity.y + particle.forces.y;
        
        // Integrate velocity
        particle.velocity.x += particle.acceleration.x * deltaTime;
        particle.velocity.y += particle.acceleration.y * deltaTime;
        
        // Integrate position
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        
        // Boundary conditions
        this.applyFluidBoundaryConditions(particle, fluidSystem);
        
        // Clear forces
        particle.forces.x = 0;
        particle.forces.y = 0;
      }
    }
  }
  
  private updateFluidSpatialGrid(fluidSystem: FluidSystem): void {
    const grid = fluidSystem.spatialGrid;
    grid.cells.clear();
    
    for (const particle of fluidSystem.particles) {
      const cellX = Math.floor(particle.position.x / grid.cellSize);
      const cellY = Math.floor(particle.position.y / grid.cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!grid.cells.has(cellKey)) {
        grid.cells.set(cellKey, []);
      }
      grid.cells.get(cellKey)!.push(particle.id);
    }
  }
  
  private calculateFluidDensities(fluidSystem: FluidSystem): void {
    for (const particle of fluidSystem.particles) {
      particle.density = 0;
      particle.neighbors = [];
      
      // Find neighbors using spatial grid
      const cellX = Math.floor(particle.position.x / fluidSystem.spatialGrid.cellSize);
      const cellY = Math.floor(particle.position.y / fluidSystem.spatialGrid.cellSize);
      
      // Check surrounding cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborCellKey = `${cellX + dx},${cellY + dy}`;
          const neighbors = fluidSystem.spatialGrid.cells.get(neighborCellKey);
          
          if (!neighbors) continue;
          
          for (const neighborId of neighbors) {
            const neighbor = fluidSystem.particles.find(p => p.id === neighborId);
            if (!neighbor) continue;
            
            const dx = neighbor.position.x - particle.position.x;
            const dy = neighbor.position.y - particle.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < fluidSystem.smoothingRadius) {
              const kernelValue = this.smoothingKernel(distance, fluidSystem.smoothingRadius);
              particle.density += neighbor.mass * kernelValue;
              
              if (neighbor.id !== particle.id) {
                particle.neighbors.push(neighbor.id);
              }
            }
          }
        }
      }
    }
  }
  
  private calculateFluidPressures(fluidSystem: FluidSystem): void {
    for (const particle of fluidSystem.particles) {
      // Equation of state: P = k * (ρ - ρ₀)
      particle.pressure = fluidSystem.gasConstant * (particle.density - fluidSystem.restDensity);
    }
  }
  
  private calculateFluidForces(fluidSystem: FluidSystem): void {
    for (const particle of fluidSystem.particles) {
      let pressureForceX = 0;
      let pressureForceY = 0;
      let viscosityForceX = 0;
      let viscosityForceY = 0;
      
      for (const neighborId of particle.neighbors) {
        const neighbor = fluidSystem.particles.find(p => p.id === neighborId);
        if (!neighbor) continue;
        
        const dx = neighbor.position.x - particle.position.x;
        const dy = neighbor.position.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const normalX = dx / distance;
          const normalY = dy / distance;
          
          // Pressure force
          const pressureGradient = this.pressureKernel(distance, fluidSystem.smoothingRadius);
          const pressureTerm = (particle.pressure + neighbor.pressure) / (2 * neighbor.density);
          
          pressureForceX -= neighbor.mass * pressureTerm * pressureGradient * normalX;
          pressureForceY -= neighbor.mass * pressureTerm * pressureGradient * normalY;
          
          // Viscosity force
          const viscosityLaplacian = this.viscosityKernel(distance, fluidSystem.smoothingRadius);
          const velocityDiffX = neighbor.velocity.x - particle.velocity.x;
          const velocityDiffY = neighbor.velocity.y - particle.velocity.y;
          
          viscosityForceX += fluidSystem.viscosity * neighbor.mass * 
                            velocityDiffX / neighbor.density * viscosityLaplacian;
          viscosityForceY += fluidSystem.viscosity * neighbor.mass * 
                            velocityDiffY / neighbor.density * viscosityLaplacian;
        }
      }
      
      particle.forces.x = pressureForceX + viscosityForceX;
      particle.forces.y = pressureForceY + viscosityForceY;
    }
  }
  
  private smoothingKernel(distance: number, radius: number): number {
    if (distance >= radius) return 0;
    
    const q = distance / radius;
    const factor = 315 / (64 * Math.PI * Math.pow(radius, 9));
    return factor * Math.pow(radius * radius - distance * distance, 3);
  }
  
  private pressureKernel(distance: number, radius: number): number {
    if (distance >= radius) return 0;
    
    const q = distance / radius;
    const factor = -45 / (Math.PI * Math.pow(radius, 6));
    return factor * Math.pow(radius - distance, 2);
  }
  
  private viscosityKernel(distance: number, radius: number): number {
    if (distance >= radius) return 0;
    
    const factor = 45 / (Math.PI * Math.pow(radius, 6));
    return factor * (radius - distance);
  }
  
  private applyFluidBoundaryConditions(particle: FluidParticle, fluidSystem: FluidSystem): void {
    const bounds = this.world.bounds;
    const restitution = 0.5;
    
    // Left and right boundaries
    if (particle.position.x < bounds.x) {
      particle.position.x = bounds.x;
      particle.velocity.x = -particle.velocity.x * restitution;
    } else if (particle.position.x > bounds.x + bounds.width) {
      particle.position.x = bounds.x + bounds.width;
      particle.velocity.x = -particle.velocity.x * restitution;
    }
    
    // Top and bottom boundaries
    if (particle.position.y < bounds.y) {
      particle.position.y = bounds.y;
      particle.velocity.y = -particle.velocity.y * restitution;
    } else if (particle.position.y > bounds.y + bounds.height) {
      particle.position.y = bounds.y + bounds.height;
      particle.velocity.y = -particle.velocity.y * restitution;
    }
  }
  
  private updateParticleSystems(deltaTime: number): void {
    for (const system of this.particleSystems.values()) {
      if (!system.isActive) continue;
      
      system.totalTime += deltaTime;
      
      // Emit new particles
      const emissionCount = Math.floor(system.emitter.emissionRate * deltaTime);
      this.emitParticles(system.id, emissionCount);
      
      // Update existing particles
      for (let i = system.particles.length - 1; i >= 0; i--) {
        const particle = system.particles[i];
        
        // Update age
        particle.age += deltaTime;
        
        // Check if particle should die
        if (particle.age >= particle.lifetime) {
          particle.isAlive = false;
          system.particles.splice(i, 1);
          continue;
        }
        
        // Clear acceleration
        particle.acceleration.x = 0;
        particle.acceleration.y = 0;
        
        // Apply global forces
        for (const force of system.forces) {
          if (!force.enabled) continue;
          
          particle.acceleration.x += force.vector.x * force.strength / particle.mass;
          particle.acceleration.y += force.vector.y * force.strength / particle.mass;
        }
        
        // Apply gravity
        particle.acceleration.x += this.world.gravity.x;
        particle.acceleration.y += this.world.gravity.y;
        
        // Apply drag
        particle.velocity.x *= (1 - particle.drag * deltaTime);
        particle.velocity.y *= (1 - particle.drag * deltaTime);
        
        // Integrate velocity
        particle.velocity.x += particle.acceleration.x * deltaTime;
        particle.velocity.y += particle.acceleration.y * deltaTime;
        
        // Integrate position
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        
        // Update rotation
        particle.rotation += particle.angularVelocity * deltaTime;
        
        // Update visual properties based on age
        const ageRatio = particle.age / particle.lifetime;
        const emitter = system.emitter;
        
        particle.size = this.lerp(emitter.size.start, emitter.size.end, ageRatio);
        particle.alpha = this.lerp(emitter.alpha.start, emitter.alpha.end, ageRatio);
        
        // Color interpolation (simplified)
        particle.color = this.lerpColor(emitter.color.start, emitter.color.end, ageRatio);
        
        // Check colliders
        this.checkParticleCollisions(particle, system);
      }
    }
  }
  
  private checkParticleCollisions(particle: Particle, system: ParticleSystem): void {
    for (const collider of system.colliders) {
      if (!collider.enabled) continue;
      
      switch (collider.type) {
        case 'plane':
          this.checkParticlePlaneCollision(particle, collider);
          break;
        case 'circle':
          this.checkParticleCircleCollision(particle, collider);
          break;
        case 'rectangle':
          this.checkParticleRectangleCollision(particle, collider);
          break;
      }
    }
    
    // World boundaries
    const bounds = this.world.bounds;
    if (particle.position.x < bounds.x || particle.position.x > bounds.x + bounds.width ||
        particle.position.y < bounds.y || particle.position.y > bounds.y + bounds.height) {
      particle.isAlive = false;
    }
  }
  
  private checkParticlePlaneCollision(particle: Particle, collider: Collider): void {
    // Simplified plane collision (assumes horizontal plane)
    if (particle.position.y > collider.position.y) {
      particle.position.y = collider.position.y;
      particle.velocity.y = -particle.velocity.y * collider.restitution;
      particle.velocity.x *= (1 - collider.friction);
    }
  }
  
  private checkParticleCircleCollision(particle: Particle, collider: Collider): void {
    // Implementation would depend on collider data structure
    // Placeholder for circle collision
  }
  
  private checkParticleRectangleCollision(particle: Particle, collider: Collider): void {
    // Implementation would depend on collider data structure
    // Placeholder for rectangle collision
  }
  
  // Collision Detection and Resolution
  private performCollisionDetection(): void {
    this.collisionPairs = [];
    
    // Broad phase - update spatial grid for rigid bodies
    this.updateBroadphaseGrid();
    
    // Narrow phase - check potential collision pairs
    const bodies = Array.from(this.rigidBodies.values());
    
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bodyA = bodies[i];
        const bodyB = bodies[j];
        
        // Skip if both are static
        if (bodyA.type === 'static' && bodyB.type === 'static') continue;
        
        // Check if bodies are close enough for detailed collision check
        if (this.broadphaseCheck(bodyA, bodyB)) {
          const manifold = this.narrowphaseCheck(bodyA, bodyB);
          if (manifold) {
            this.collisionPairs.push(manifold);
          }
        }
      }
    }
  }
  
  private updateBroadphaseGrid(): void {
    this.broadphaseGrid.cells.clear();
    
    for (const body of this.rigidBodies.values()) {
      const cellX = Math.floor(body.position.x / this.broadphaseGrid.cellSize);
      const cellY = Math.floor(body.position.y / this.broadphaseGrid.cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!this.broadphaseGrid.cells.has(cellKey)) {
        this.broadphaseGrid.cells.set(cellKey, []);
      }
      this.broadphaseGrid.cells.get(cellKey)!.push(body.id);
    }
  }
  
  private broadphaseCheck(bodyA: RigidBody, bodyB: RigidBody): boolean {
    // Simple AABB check
    const radiusA = this.getBodyRadius(bodyA);
    const radiusB = this.getBodyRadius(bodyB);
    
    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (radiusA + radiusB);
  }
  
  private getBodyRadius(body: RigidBody): number {
    switch (body.shape.type) {
      case 'circle':
        return body.shape.data.radius;
      case 'rectangle':
        const { width, height } = body.shape.data;
        return Math.sqrt(width * width + height * height) / 2;
      default:
        return 50; // Default radius
    }
  }
  
  private narrowphaseCheck(bodyA: RigidBody, bodyB: RigidBody): CollisionManifold | null {
    // Detailed collision detection based on shape types
    if (bodyA.shape.type === 'circle' && bodyB.shape.type === 'circle') {
      return this.checkCircleCircleCollision(bodyA, bodyB);
    }
    
    // Add more shape combination checks as needed
    return null;
  }
  
  private checkCircleCircleCollision(bodyA: RigidBody, bodyB: RigidBody): CollisionManifold | null {
    const radiusA = bodyA.shape.data.radius;
    const radiusB = bodyB.shape.data.radius;
    
    const dx = bodyB.position.x - bodyA.position.x;
    const dy = bodyB.position.y - bodyA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = radiusA + radiusB;
    
    if (distance >= minDistance) return null;
    
    const penetration = minDistance - distance;
    const normalX = distance > 0 ? dx / distance : 1;
    const normalY = distance > 0 ? dy / distance : 0;
    
    const contactPoint = {
      x: bodyA.position.x + normalX * radiusA,
      y: bodyA.position.y + normalY * radiusA
    };
    
    return {
      bodyA: bodyA.id,
      bodyB: bodyB.id,
      contactPoints: [{ position: contactPoint, impulse: 0 }],
      normal: { x: normalX, y: normalY },
      penetration
    };
  }
  
  private resolveCollisions(): void {
    for (const manifold of this.collisionPairs) {
      const bodyA = this.rigidBodies.get(manifold.bodyA);
      const bodyB = this.rigidBodies.get(manifold.bodyB);
      
      if (!bodyA || !bodyB) continue;
      
      // Position correction
      this.resolvePositionCorrection(bodyA, bodyB, manifold);
      
      // Velocity resolution
      this.resolveVelocityCorrection(bodyA, bodyB, manifold);
    }
  }
  
  private resolvePositionCorrection(bodyA: RigidBody, bodyB: RigidBody, manifold: CollisionManifold): void {
    const percent = 0.8; // Percentage of penetration to correct
    const slop = 0.01; // Penetration allowance
    
    const correction = Math.max(manifold.penetration - slop, 0) * percent;
    
    if (bodyA.type === 'dynamic' && bodyB.type === 'dynamic') {
      const totalInvMass = 1 / bodyA.mass + 1 / bodyB.mass;
      
      bodyA.position.x -= manifold.normal.x * correction * (1 / bodyA.mass) / totalInvMass;
      bodyA.position.y -= manifold.normal.y * correction * (1 / bodyA.mass) / totalInvMass;
      
      bodyB.position.x += manifold.normal.x * correction * (1 / bodyB.mass) / totalInvMass;
      bodyB.position.y += manifold.normal.y * correction * (1 / bodyB.mass) / totalInvMass;
    } else if (bodyA.type === 'dynamic') {
      bodyA.position.x -= manifold.normal.x * correction;
      bodyA.position.y -= manifold.normal.y * correction;
    } else if (bodyB.type === 'dynamic') {
      bodyB.position.x += manifold.normal.x * correction;
      bodyB.position.y += manifold.normal.y * correction;
    }
  }
  
  private resolveVelocityCorrection(bodyA: RigidBody, bodyB: RigidBody, manifold: CollisionManifold): void {
    // Calculate relative velocity
    const relativeVelocityX = bodyB.velocity.x - bodyA.velocity.x;
    const relativeVelocityY = bodyB.velocity.y - bodyA.velocity.y;
    
    // Calculate relative velocity in collision normal direction
    const velAlongNormal = relativeVelocityX * manifold.normal.x + relativeVelocityY * manifold.normal.y;
    
    // Do not resolve if velocities are separating
    if (velAlongNormal > 0) return;
    
    // Calculate restitution
    const e = Math.min(bodyA.restitution, bodyB.restitution);
    
    // Calculate impulse scalar
    let j = -(1 + e) * velAlongNormal;
    
    if (bodyA.type === 'dynamic' && bodyB.type === 'dynamic') {
      j /= 1 / bodyA.mass + 1 / bodyB.mass;
    } else if (bodyA.type === 'dynamic') {
      j /= 1 / bodyA.mass;
    } else if (bodyB.type === 'dynamic') {
      j /= 1 / bodyB.mass;
    }
    
    // Apply impulse
    const impulseX = j * manifold.normal.x;
    const impulseY = j * manifold.normal.y;
    
    if (bodyA.type === 'dynamic') {
      bodyA.velocity.x -= impulseX / bodyA.mass;
      bodyA.velocity.y -= impulseY / bodyA.mass;
    }
    
    if (bodyB.type === 'dynamic') {
      bodyB.velocity.x += impulseX / bodyB.mass;
      bodyB.velocity.y += impulseY / bodyB.mass;
    }
    
    // Friction
    this.applyFriction(bodyA, bodyB, manifold, j);
  }
  
  private applyFriction(bodyA: RigidBody, bodyB: RigidBody, manifold: CollisionManifold, normalImpulse: number): void {
    // Recalculate relative velocity after normal impulse
    const relativeVelocityX = bodyB.velocity.x - bodyA.velocity.x;
    const relativeVelocityY = bodyB.velocity.y - bodyA.velocity.y;
    
    // Calculate tangent vector
    let tangentX = relativeVelocityX - (relativeVelocityX * manifold.normal.x + relativeVelocityY * manifold.normal.y) * manifold.normal.x;
    let tangentY = relativeVelocityY - (relativeVelocityX * manifold.normal.x + relativeVelocityY * manifold.normal.y) * manifold.normal.y;
    
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLength < 0.001) return;
    
    tangentX /= tangentLength;
    tangentY /= tangentLength;
    
    // Calculate friction impulse
    let jt = -(relativeVelocityX * tangentX + relativeVelocityY * tangentY);
    
    if (bodyA.type === 'dynamic' && bodyB.type === 'dynamic') {
      jt /= 1 / bodyA.mass + 1 / bodyB.mass;
    } else if (bodyA.type === 'dynamic') {
      jt /= 1 / bodyA.mass;
    } else if (bodyB.type === 'dynamic') {
      jt /= 1 / bodyB.mass;
    }
    
    // Coulomb friction
    const mu = Math.sqrt(bodyA.friction * bodyA.friction + bodyB.friction * bodyB.friction);
    
    let frictionImpulseX: number, frictionImpulseY: number;
    
    if (Math.abs(jt) < normalImpulse * mu) {
      frictionImpulseX = jt * tangentX;
      frictionImpulseY = jt * tangentY;
    } else {
      frictionImpulseX = -normalImpulse * tangentX * mu;
      frictionImpulseY = -normalImpulse * tangentY * mu;
    }
    
    // Apply friction impulse
    if (bodyA.type === 'dynamic') {
      bodyA.velocity.x -= frictionImpulseX / bodyA.mass;
      bodyA.velocity.y -= frictionImpulseY / bodyA.mass;
    }
    
    if (bodyB.type === 'dynamic') {
      bodyB.velocity.x += frictionImpulseX / bodyB.mass;
      bodyB.velocity.y += frictionImpulseY / bodyB.mass;
    }
  }
  
  // Utility functions
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  private lerpColor(colorA: number, colorB: number, t: number): number {
    const rA = (colorA >> 16) & 0xFF;
    const gA = (colorA >> 8) & 0xFF;
    const bA = colorA & 0xFF;
    
    const rB = (colorB >> 16) & 0xFF;
    const gB = (colorB >> 8) & 0xFF;
    const bB = colorB & 0xFF;
    
    const r = Math.floor(this.lerp(rA, rB, t));
    const g = Math.floor(this.lerp(gA, gB, t));
    const b = Math.floor(this.lerp(bA, bB, t));
    
    return (r << 16) | (g << 8) | b;
  }
  
  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  // Getters and setters
  getWorld(): PhysicsWorld {
    return this.world;
  }
  
  setGravity(gravity: { x: number; y: number }): void {
    this.world.gravity = gravity;
  }
  
  getRigidBody(id: string): RigidBody | undefined {
    return this.rigidBodies.get(id);
  }
  
  getSoftBody(id: string): SoftBody | undefined {
    return this.softBodies.get(id);
  }
  
  getFluidSystem(id: string): FluidSystem | undefined {
    return this.fluidSystems.get(id);
  }
  
  getParticleSystem(id: string): ParticleSystem | undefined {
    return this.particleSystems.get(id);
  }
  
  getPerformanceStats(): { frameTime: number; updateCount: number } {
    return {
      frameTime: this.frameTime,
      updateCount: this.updateCount
    };
  }
  
  // Enable/disable physics
  setEnabled(enabled: boolean): void {
    this.world.enabled = enabled;
  }
  
  isEnabled(): boolean {
    return this.world.enabled;
  }
}

export const advancedPhysicsEngine = new AdvancedPhysicsEngine();