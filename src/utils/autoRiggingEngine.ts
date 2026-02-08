// Automatic Rigging Engine for Professional Animation
// Converts comprehensive analysis into animation-ready rigs

import { ComponentAnalysis, ComprehensiveAnalysis } from './multiVisionClient';

interface RiggedComponent {
  id: string;
  originalComponent: ComponentAnalysis;
  mesh: {
    vertices: Array<{ x: number; y: number; u: number; v: number }>;
    triangles: Array<{ a: number; b: number; c: number }>;
    weights: Array<{ [boneId: string]: number }>; // Vertex weights for bone influence
  };
  bones: Array<{
    id: string;
    position: { x: number; y: number };
    rotation: number;
    length: number;
    parent?: string;
    constraints: {
      rotationMin: number;
      rotationMax: number;
      translationRadius: number;
    };
  }>;
  physics: {
    enabled: boolean;
    mass: number;
    damping: number;
    elasticity: number;
    collisionRadius: number;
  };
  animationControllers: {
    primary: 'bone' | 'physics' | 'mesh';
    secondary: boolean;
    followParent: boolean;
    inheritRotation: boolean;
    inheritScale: boolean;
  };
}

interface AnimationRig {
  components: RiggedComponent[];
  globalSkeleton: {
    rootBone: string;
    boneHierarchy: { [parentId: string]: string[] };
    inverseBindMatrices: { [boneId: string]: number[] }; // 2x3 transform matrices
  };
  physics: {
    world: {
      gravity: { x: number; y: number };
      airResistance: number;
      timeStep: number;
    };
    constraints: Array<{
      type: 'distance' | 'angle' | 'collision';
      componentA: string;
      componentB?: string;
      parameters: any;
    }>;
  };
  animationSystem: {
    timeline: {
      fps: number;
      duration: number;
      looping: boolean;
    };
    layers: Array<{
      id: string;
      name: string;
      weight: number;
      blendMode: 'add' | 'multiply' | 'overlay';
      components: string[];
    }>;
  };
}

class AutoRiggingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateRigFromAnalysis(
    imageBase64: string, 
    analysis: ComprehensiveAnalysis
  ): Promise<AnimationRig> {
    console.log('[AutoRigging] Starting automatic rigging process...');

    // Load image for mesh generation
    const image = await this.loadImage(imageBase64);
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);

    // Generate rigged components
    const riggedComponents = await Promise.all(
      analysis.components.map(component => 
        this.rigComponent(component, image, analysis)
      )
    );

    // Build global skeleton
    const globalSkeleton = this.buildGlobalSkeleton(riggedComponents, analysis);

    // Generate physics system
    const physics = this.generatePhysicsSystem(analysis, riggedComponents);

    // Create animation system
    const animationSystem = this.createAnimationSystem(analysis, riggedComponents);

    const rig: AnimationRig = {
      components: riggedComponents,
      globalSkeleton,
      physics,
      animationSystem
    };

    console.log('[AutoRigging] Rig generation complete:', rig);
    return rig;
  }

  private async loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  private async rigComponent(
    component: ComponentAnalysis,
    image: HTMLImageElement,
    analysis: ComprehensiveAnalysis
  ): Promise<RiggedComponent> {
    console.log(`[AutoRigging] Rigging component: ${component.name}`);

    // Generate mesh based on component type
    const mesh = await this.generateMesh(component, image);

    // Generate bones for this component
    const bones = this.generateComponentBones(component, analysis);

    // Calculate vertex weights
    this.calculateVertexWeights(mesh, bones);

    // Set up physics
    const physics = this.generateComponentPhysics(component);

    // Configure animation controllers
    const animationControllers = this.configureAnimationControllers(component);

    return {
      id: component.id,
      originalComponent: component,
      mesh,
      bones,
      physics,
      animationControllers
    };
  }

  private async generateMesh(
    component: ComponentAnalysis, 
    image: HTMLImageElement
  ) {
    const { bounds } = component;

    // Extract component pixels
    const imageData = this.ctx.getImageData(
      bounds.x, bounds.y, bounds.width, bounds.height
    );

    // Generate vertices based on component type
    let vertices, triangles;

    switch (component.type) {
      case 'hair':
        ({ vertices, triangles } = this.generateHairMesh(component, imageData));
        break;
      case 'cloth':
        ({ vertices, triangles } = this.generateClothMesh(component, imageData));
        break;
      case 'rigid':
        ({ vertices, triangles } = this.generateRigidMesh(component, imageData));
        break;
      default:
        ({ vertices, triangles } = this.generateDefaultMesh(component, imageData));
    }

    // Calculate UV coordinates
    vertices.forEach(vertex => {
      vertex.u = (vertex.x - bounds.x) / bounds.width;
      vertex.v = (vertex.y - bounds.y) / bounds.height;
    });

    return {
      vertices,
      triangles,
      weights: vertices.map(() => ({})) // Will be filled by calculateVertexWeights
    };
  }

  private generateHairMesh(component: ComponentAnalysis, imageData: ImageData) {
    // Hair needs high-density mesh for realistic movement
    const vertices: Array<{ x: number; y: number; u: number; v: number }> = [];
    const triangles: Array<{ a: number; b: number; c: number }> = [];

    const { bounds } = component;
    const resolution = 8; // High resolution for hair

    // Generate grid vertices
    for (let y = 0; y <= bounds.height; y += resolution) {
      for (let x = 0; x <= bounds.width; x += resolution) {
        // Check if this pixel has alpha (is part of the hair)
        const pixelIndex = ((y * bounds.width) + x) * 4;
        const alpha = imageData.data[pixelIndex + 3];

        if (alpha > 50) { // Only add vertices where hair exists
          vertices.push({
            x: bounds.x + x,
            y: bounds.y + y,
            u: 0, v: 0 // Will be calculated later
          });
        }
      }
    }

    // Generate triangles using Delaunay triangulation (simplified)
    for (let i = 0; i < vertices.length - 3; i += 3) {
      triangles.push({ a: i, b: i + 1, c: i + 2 });
    }

    return { vertices, triangles };
  }

  private generateClothMesh(component: ComponentAnalysis, imageData: ImageData) {
    // Cloth needs medium-density mesh for flowing movement
    const vertices: Array<{ x: number; y: number; u: number; v: number }> = [];
    const triangles: Array<{ a: number; b: number; c: number }> = [];

    const { bounds } = component;
    const resolution = 16; // Medium resolution for cloth

    // Generate regular grid
    let vertexIndex = 0;
    for (let y = 0; y <= bounds.height; y += resolution) {
      for (let x = 0; x <= bounds.width; x += resolution) {
        vertices.push({
          x: bounds.x + x,
          y: bounds.y + y,
          u: 0, v: 0
        });

        // Create triangles for grid
        if (x < bounds.width && y < bounds.height) {
          const cols = Math.ceil(bounds.width / resolution) + 1;
          const topLeft = vertexIndex;
          const topRight = vertexIndex + 1;
          const bottomLeft = vertexIndex + cols;
          const bottomRight = vertexIndex + cols + 1;

          // Two triangles per grid square
          triangles.push({ a: topLeft, b: topRight, c: bottomLeft });
          triangles.push({ a: topRight, b: bottomRight, c: bottomLeft });
        }

        vertexIndex++;
      }
    }

    return { vertices, triangles };
  }

  private generateRigidMesh(component: ComponentAnalysis, imageData: ImageData) {
    // Rigid components need minimal mesh - just corners
    const { bounds } = component;
    
    const vertices = [
      { x: bounds.x, y: bounds.y, u: 0, v: 0 },
      { x: bounds.x + bounds.width, y: bounds.y, u: 0, v: 0 },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, u: 0, v: 0 },
      { x: bounds.x, y: bounds.y + bounds.height, u: 0, v: 0 }
    ];

    const triangles = [
      { a: 0, b: 1, c: 2 },
      { a: 0, b: 2, c: 3 }
    ];

    return { vertices, triangles };
  }

  private generateDefaultMesh(component: ComponentAnalysis, imageData: ImageData) {
    // Default mesh for unknown types
    return this.generateRigidMesh(component, imageData);
  }

  private generateComponentBones(
    component: ComponentAnalysis,
    analysis: ComprehensiveAnalysis
  ) {
    const bones = [];

    // Find matching bones from skeleton analysis
    const matchingBones = analysis.skeleton.bones.filter(bone => 
      bone.name.toLowerCase().includes(component.name.toLowerCase())
    );

    if (matchingBones.length > 0) {
      // Use skeleton bones
      bones.push(...matchingBones.map(bone => ({
        id: bone.id,
        position: bone.position,
        rotation: bone.rotation,
        length: bone.length,
        parent: bone.parent,
        constraints: this.generateBoneConstraints(component)
      })));
    } else {
      // Generate bones based on component type
      switch (component.type) {
        case 'hair':
          bones.push(...this.generateHairBones(component));
          break;
        case 'cloth':
          bones.push(...this.generateClothBones(component));
          break;
        default:
          bones.push(this.generateDefaultBone(component));
      }
    }

    return bones;
  }

  private generateHairBones(component: ComponentAnalysis) {
    // Hair needs multiple bones for strand simulation
    const bones = [];
    const strandCount = 3; // Simplified - would be more based on analysis
    const segmentsPerStrand = 4;

    for (let strand = 0; strand < strandCount; strand++) {
      for (let segment = 0; segment < segmentsPerStrand; segment++) {
        const boneId = `${component.id}_strand${strand}_seg${segment}`;
        const progress = segment / (segmentsPerStrand - 1);
        
        bones.push({
          id: boneId,
          position: {
            x: component.bounds.x + (component.bounds.width * strand / strandCount),
            y: component.bounds.y + (component.bounds.height * progress)
          },
          rotation: 0,
          length: component.bounds.height / segmentsPerStrand,
          parent: segment > 0 ? `${component.id}_strand${strand}_seg${segment-1}` : component.parent,
          constraints: {
            rotationMin: -60,
            rotationMax: 60,
            translationRadius: 10
          }
        });
      }
    }

    return bones;
  }

  private generateClothBones(component: ComponentAnalysis) {
    // Cloth needs bones for major fold lines
    const bones = [];
    
    // Main cloth bone
    bones.push({
      id: `${component.id}_main`,
      position: {
        x: component.bounds.x + component.bounds.width / 2,
        y: component.bounds.y + component.bounds.height / 2
      },
      rotation: 0,
      length: Math.max(component.bounds.width, component.bounds.height),
      parent: component.parent,
      constraints: {
        rotationMin: -30,
        rotationMax: 30,
        translationRadius: 20
      }
    });

    return bones;
  }

  private generateDefaultBone(component: ComponentAnalysis) {
    return {
      id: `${component.id}_bone`,
      position: {
        x: component.bounds.x + component.bounds.width / 2,
        y: component.bounds.y + component.bounds.height / 2
      },
      rotation: 0,
      length: Math.max(component.bounds.width, component.bounds.height),
      parent: component.parent,
      constraints: this.generateBoneConstraints(component)
    };
  }

  private generateBoneConstraints(component: ComponentAnalysis) {
    const flexibilityFactor = component.material.flexibility;
    
    return {
      rotationMin: -90 * flexibilityFactor,
      rotationMax: 90 * flexibilityFactor,
      translationRadius: 50 * flexibilityFactor
    };
  }

  private calculateVertexWeights(mesh: any, bones: any[]) {
    // Calculate how much each bone influences each vertex
    mesh.vertices.forEach((vertex: any, vertexIndex: number) => {
      const weights: { [boneId: string]: number } = {};
      let totalWeight = 0;

      bones.forEach(bone => {
        // Calculate distance from vertex to bone
        const distance = Math.sqrt(
          Math.pow(vertex.x - bone.position.x, 2) + 
          Math.pow(vertex.y - bone.position.y, 2)
        );

        // Weight based on inverse distance
        const weight = Math.max(0, 1 - (distance / bone.length));
        if (weight > 0.01) { // Only store significant weights
          weights[bone.id] = weight;
          totalWeight += weight;
        }
      });

      // Normalize weights
      Object.keys(weights).forEach(boneId => {
        weights[boneId] /= totalWeight || 1;
      });

      mesh.weights[vertexIndex] = weights;
    });
  }

  private generateComponentPhysics(component: ComponentAnalysis) {
    return {
      enabled: component.animationProperties.primaryMotion === 'physics',
      mass: component.material.weight,
      damping: component.material.damping,
      elasticity: component.material.elasticity,
      collisionRadius: Math.min(component.bounds.width, component.bounds.height) / 4
    };
  }

  private configureAnimationControllers(component: ComponentAnalysis) {
    return {
      primary: component.animationProperties.primaryMotion === 'physics' ? 'physics' : 
               component.material.flexibility > 0.5 ? 'mesh' : 'bone',
      secondary: component.animationProperties.secondaryMotion,
      followParent: !!component.parent,
      inheritRotation: component.material.flexibility < 0.3,
      inheritScale: true
    };
  }

  private buildGlobalSkeleton(riggedComponents: RiggedComponent[], analysis: ComprehensiveAnalysis) {
    const allBones: { [id: string]: any } = {};
    const boneHierarchy: { [parentId: string]: string[] } = {};

    // Collect all bones
    riggedComponents.forEach(component => {
      component.bones.forEach(bone => {
        allBones[bone.id] = bone;
        
        if (bone.parent) {
          if (!boneHierarchy[bone.parent]) {
            boneHierarchy[bone.parent] = [];
          }
          boneHierarchy[bone.parent].push(bone.id);
        }
      });
    });

    // Find root bone (bone with no parent)
    const rootBone = Object.values(allBones).find(bone => !bone.parent)?.id || 'root';

    // Generate inverse bind matrices for GPU skinning
    const inverseBindMatrices: { [boneId: string]: number[] } = {};
    Object.keys(allBones).forEach(boneId => {
      const bone = allBones[boneId];
      // Simplified 2x3 matrix [scaleX, skewX, translateX, skewY, scaleY, translateY]
      inverseBindMatrices[boneId] = [
        1, 0, -bone.position.x,
        0, 1, -bone.position.y
      ];
    });

    return {
      rootBone,
      boneHierarchy,
      inverseBindMatrices
    };
  }

  private generatePhysicsSystem(analysis: ComprehensiveAnalysis, riggedComponents: RiggedComponent[]) {
    const constraints = [];

    // Generate distance constraints for connected components
    riggedComponents.forEach(component => {
      if (component.originalComponent.parent) {
        constraints.push({
          type: 'distance' as const,
          componentA: component.id,
          componentB: component.originalComponent.parent,
          parameters: {
            restDistance: 0,
            stiffness: 1 - component.originalComponent.material.flexibility
          }
        });
      }
    });

    return {
      world: analysis.physics,
      constraints
    };
  }

  private createAnimationSystem(analysis: ComprehensiveAnalysis, riggedComponents: RiggedComponent[]) {
    // Create animation layers based on component types
    const layers = [
      {
        id: 'base',
        name: 'Base Animation',
        weight: 1.0,
        blendMode: 'add' as const,
        components: riggedComponents.filter(c => c.originalComponent.type === 'rigid').map(c => c.id)
      },
      {
        id: 'secondary',
        name: 'Secondary Motion',
        weight: 0.8,
        blendMode: 'add' as const,
        components: riggedComponents.filter(c => c.originalComponent.animationProperties.secondaryMotion).map(c => c.id)
      },
      {
        id: 'physics',
        name: 'Physics Simulation',
        weight: 1.0,
        blendMode: 'overlay' as const,
        components: riggedComponents.filter(c => c.physics.enabled).map(c => c.id)
      }
    ];

    return {
      timeline: {
        fps: analysis.style.animationStyle === 'snappy' ? 24 : 60,
        duration: 5.0, // Default 5 second loop
        looping: true
      },
      layers
    };
  }
}

export const autoRiggingEngine = new AutoRiggingEngine();
export type { AnimationRig, RiggedComponent };