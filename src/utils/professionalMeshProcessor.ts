import earcut from 'earcut';
import Matter from 'matter-js';
import simplify from 'simplify-js';
import * as polyclip from 'polygon-clipping';
import convexHull from 'convex-hull';
import chroma from 'chroma-js';
import { webWorkerManager } from './webWorkerManager';

// Types for mesh processing
export interface MeshPoint {
  x: number;
  y: number;
}

export interface ProcessedMesh {
  originalPoints: MeshPoint[];
  simplifiedPoints: MeshPoint[];
  triangles: number[];
  convexHull: MeshPoint[];
  physicsBody: Matter.Body | null;
  boundingBox: { x: number; y: number; width: number; height: number };
  area: number;
  perimeter: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface AnimationConstraints {
  maxRotation: number;
  naturalFrequency: number;
  stiffness: number;
  damping: number;
  elasticity: number;
  mass: number;
}

export class ProfessionalMeshProcessor {
  private static instance: ProfessionalMeshProcessor;
  private engine: Matter.Engine;
  private colorAnalyzer: any;

  constructor() {
    // Initialize Matter.js physics engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.1, scale: 0.001 }
    });
    
    // Initialize Web Worker pool for performance
    this.initializeWorkers();
    
    console.log('🎮 Professional Mesh Processor initialized');
    console.log('📊 Libraries loaded: Earcut, Matter.js, Simplify.js, Polygon-clipping, Convex-hull');
    console.log('⚡ WebWorkers enabled for performance optimization');
  }

  /**
   * Initialize Web Worker pool for heavy calculations
   */
  private async initializeWorkers(): Promise<void> {
    try {
      await webWorkerManager.initialize();
      console.log('✅ Mesh processing workers initialized');
    } catch (error) {
      console.warn('⚠️ WebWorkers not available, falling back to main thread:', error);
    }
  }

  public static getInstance(): ProfessionalMeshProcessor {
    if (!ProfessionalMeshProcessor.instance) {
      ProfessionalMeshProcessor.instance = new ProfessionalMeshProcessor();
    }
    return ProfessionalMeshProcessor.instance;
  }

  /**
   * Process a mesh from GPT-4 Vision contour points with surgical precision
   * Uses Web Workers for heavy calculations to maintain 60+ FPS
   */
  public async processElementMeshAsync(
    contourPoints: MeshPoint[],
    elementType: string,
    imageWidth: number = 400,
    imageHeight: number = 400
  ): Promise<ProcessedMesh> {
    console.log(`🔧 Processing mesh ASYNC for ${elementType} with ${contourPoints.length} points`);

    try {
      // 🚀 Use Web Workers for heavy processing if available
      if (webWorkerManager.isAvailable()) {
        console.log('⚡ Using WebWorkers for high-performance mesh processing...');
        console.log(`📊 Input data: elementType=${elementType}, points=${contourPoints.length}, size=${imageWidth}x${imageHeight}`);
        
        // Add timeout to Web Worker processing
        const workerPromise = webWorkerManager.processMesh(
          contourPoints,
          elementType,
          imageWidth,
          imageHeight
        );
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Web Worker timeout after 10 seconds')), 10000);
        });
        
        const workerResult = await Promise.race([workerPromise, timeoutPromise]);
        
        // Create physics body (must be done on main thread)
        const physicsBody = this.createPhysicsBody(workerResult.simplifiedPoints, elementType);
        
        const processedMesh: ProcessedMesh = {
          ...workerResult,
          physicsBody,
          convexHull: this.calculateConvexHull(workerResult.simplifiedPoints)
        };
        
        console.log(`✅ Async mesh processed: ${processedMesh.quality} quality, ${processedMesh.triangles.length/3} triangles`);
        return processedMesh;
      } else {
        // Fallback to synchronous processing
        console.log('🔄 WebWorkers not available, using main thread...');
        return this.processElementMesh(contourPoints, elementType, imageWidth, imageHeight);
      }
    } catch (error) {
      console.error('❌ Async mesh processing failed, falling back to sync:', error);
      console.error('Error details:', error.message);
      console.log('🔄 Falling back to main thread processing...');
      return this.processElementMesh(contourPoints, elementType, imageWidth, imageHeight);
    }
  }

  /**
   * Process a mesh from GPT-4 Vision contour points with surgical precision (synchronous)
   */
  public processElementMesh(
    contourPoints: MeshPoint[],
    elementType: string,
    imageWidth: number = 400,
    imageHeight: number = 400
  ): ProcessedMesh {
    console.log(`🔧 Processing mesh for ${elementType} with ${contourPoints.length} points`);

    // Step 1: Convert percentage coordinates to pixel coordinates
    const pixelPoints = contourPoints.map(point => ({
      x: (point.x / 100) * imageWidth,
      y: (point.y / 100) * imageHeight
    }));

    // Step 2: Optimize mesh density based on element type
    const targetPointCount = this.getOptimalPointCount(elementType, contourPoints.length);
    const simplifiedPoints = this.intelligentSimplification(pixelPoints, targetPointCount);

    console.log(`📐 Simplified from ${pixelPoints.length} to ${simplifiedPoints.length} points`);

    // Step 3: Generate triangulation for PIXI.js rendering
    const triangles = this.generateTriangulation(simplifiedPoints);

    // Step 4: Calculate convex hull for physics collision
    const convexHull = this.calculateConvexHull(simplifiedPoints);

    // Step 5: Create physics body with proper constraints
    const physicsBody = this.createPhysicsBody(convexHull, elementType);

    // Step 6: Calculate mesh properties
    const boundingBox = this.calculateBoundingBox(simplifiedPoints);
    const area = this.calculateArea(simplifiedPoints);
    const perimeter = this.calculatePerimeter(simplifiedPoints);
    const quality = this.assessMeshQuality(simplifiedPoints, triangles);

    const processedMesh: ProcessedMesh = {
      originalPoints: pixelPoints,
      simplifiedPoints,
      triangles,
      convexHull,
      physicsBody,
      boundingBox,
      area,
      perimeter,
      quality
    };

    console.log(`✅ Mesh processed: ${quality} quality, ${triangles.length/3} triangles, ${area.toFixed(0)}px² area`);
    return processedMesh;
  }

  /**
   * Intelligent mesh simplification based on element type and curve importance
   */
  private intelligentSimplification(points: MeshPoint[], targetCount: number): MeshPoint[] {
    if (points.length <= targetCount) {
      return points;
    }

    // Calculate tolerance based on desired point reduction
    const reductionRatio = targetCount / points.length;
    const boundingBox = this.calculateBoundingBox(points);
    const tolerance = Math.min(boundingBox.width, boundingBox.height) * (1 - reductionRatio) * 0.1;

    // Use simplify-js with high quality mode
    const simplified = simplify(points, tolerance, true);

    // Ensure minimum point count for valid mesh
    if (simplified.length < 3) {
      return points.slice(0, Math.max(3, targetCount));
    }

    return simplified;
  }

  /**
   * Generate optimal triangulation using Earcut
   */
  private generateTriangulation(points: MeshPoint[]): number[] {
    if (points.length < 3) {
      console.warn('⚠️ Not enough points for triangulation');
      return [];
    }

    try {
      // Flatten points for earcut: [x1, y1, x2, y2, ...]
      const flatCoords = points.flatMap(p => [p.x, p.y]);
      
      // Generate triangulation
      const triangles = earcut(flatCoords);
      
      console.log(`🔺 Generated ${triangles.length / 3} triangles`);
      return triangles;
    } catch (error) {
      console.error('❌ Triangulation failed:', error);
      return [];
    }
  }

  /**
   * Calculate convex hull for physics collision detection
   */
  private calculateConvexHull(points: MeshPoint[]): MeshPoint[] {
    if (points.length < 3) return points;

    try {
      // Convert to format expected by convex-hull library
      const hullPoints = points.map(p => [p.x, p.y]);
      const hullIndices = convexHull(hullPoints);
      
      // Convert back to MeshPoint format
      const hull = hullIndices.map(indices => ({
        x: hullPoints[indices[0]][0],
        y: hullPoints[indices[0]][1]
      }));

      console.log(`🛡️ Convex hull: ${hull.length} points`);
      return hull;
    } catch (error) {
      console.error('❌ Convex hull calculation failed:', error);
      return points;
    }
  }

  /**
   * Create Matter.js physics body with element-specific properties
   */
  private createPhysicsBody(hullPoints: MeshPoint[], elementType: string): Matter.Body | null {
    if (hullPoints.length < 3) return null;

    try {
      // Convert hull points to Matter.js format
      const vertices = hullPoints.map(p => ({ x: p.x, y: p.y }));
      
      // Get element-specific physics properties
      const constraints = this.getPhysicsConstraints(elementType);
      
      // Create physics body
      const body = Matter.Bodies.fromVertices(0, 0, [vertices], {
        density: constraints.mass,
        restitution: constraints.elasticity,
        friction: constraints.damping,
        frictionStatic: constraints.stiffness,
        render: {
          fillStyle: 'transparent',
          strokeStyle: '#00ff00',
          lineWidth: 1
        }
      });

      // Add to physics world
      Matter.World.add(this.engine.world, body);

      console.log(`⚛️ Physics body created for ${elementType}`);
      return body;
    } catch (error) {
      console.error('❌ Physics body creation failed:', error);
      return null;
    }
  }

  /**
   * Get optimal point count based on element type
   */
  private getOptimalPointCount(elementType: string, currentCount: number): number {
    const optimalCounts = {
      'wing': Math.min(currentCount, 25), // Wings need high detail for flutter
      'body': Math.min(currentCount, 15), // Body can be simpler
      'leg': Math.min(currentCount, 10),  // Legs are usually simple shapes
      'antenna': Math.min(currentCount, 8), // Antennae are thin
      'eye': Math.min(currentCount, 6),   // Eyes are usually circular
      'pattern': Math.min(currentCount, 12), // Decorative elements
      'tail': Math.min(currentCount, 18)  // Tails can be complex
    };

    return optimalCounts[elementType] || Math.min(currentCount, 12);
  }

  /**
   * Get physics constraints based on element type
   */
  private getPhysicsConstraints(elementType: string): AnimationConstraints {
    const constraints: Record<string, AnimationConstraints> = {
      'wing': {
        maxRotation: 0.5,       // 30 degrees max rotation
        naturalFrequency: 2.0,   // Fast flutter
        stiffness: 0.8,         // Moderate stiffness
        damping: 0.3,           // Light damping for smooth motion
        elasticity: 0.4,        // Some bounce
        mass: 0.1               // Light weight
      },
      'body': {
        maxRotation: 0.1,       // Minimal rotation
        naturalFrequency: 0.5,   // Slow breathing
        stiffness: 0.9,         // High stiffness (stable)
        damping: 0.7,           // High damping (stable)
        elasticity: 0.1,        // No bounce
        mass: 1.0               // Heavy (anchor point)
      },
      'leg': {
        maxRotation: 0.3,       // Moderate rotation
        naturalFrequency: 1.5,   // Walking speed
        stiffness: 0.6,         // Flexible
        damping: 0.4,           // Moderate damping
        elasticity: 0.2,        // Slight bounce
        mass: 0.3               // Medium weight
      },
      'antenna': {
        maxRotation: 0.8,       // High rotation (flexible)
        naturalFrequency: 3.0,   // Fast swaying
        stiffness: 0.3,         // Very flexible
        damping: 0.2,           // Low damping (keeps moving)
        elasticity: 0.6,        // Bouncy
        mass: 0.05              // Very light
      }
    };

    return constraints[elementType] || constraints['body'];
  }

  /**
   * Calculate bounding box of mesh
   */
  private calculateBoundingBox(points: MeshPoint[]): { x: number; y: number; width: number; height: number } {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate mesh area using shoelace formula
   */
  private calculateArea(points: MeshPoint[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Calculate mesh perimeter
   */
  private calculatePerimeter(points: MeshPoint[]): number {
    if (points.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  }

  /**
   * Assess mesh quality based on various factors
   */
  private assessMeshQuality(points: MeshPoint[], triangles: number[]): 'low' | 'medium' | 'high' | 'ultra' {
    const pointCount = points.length;
    const triangleCount = triangles.length / 3;
    const area = this.calculateArea(points);
    const perimeter = this.calculatePerimeter(points);
    
    // Quality score based on multiple factors
    let score = 0;
    
    // Point density score (0-25)
    if (pointCount >= 20) score += 25;
    else if (pointCount >= 15) score += 20;
    else if (pointCount >= 10) score += 15;
    else if (pointCount >= 6) score += 10;
    else score += 5;
    
    // Triangle quality score (0-25)
    const expectedTriangles = Math.max(1, (pointCount - 2));
    const triangleRatio = triangleCount / expectedTriangles;
    if (triangleRatio >= 0.8) score += 25;
    else if (triangleRatio >= 0.6) score += 20;
    else if (triangleRatio >= 0.4) score += 15;
    else score += 10;
    
    // Shape complexity score (0-25)
    if (area > 0 && perimeter > 0) {
      const complexity = perimeter * perimeter / (4 * Math.PI * area); // Isoperimetric ratio
      if (complexity <= 2) score += 25;      // Very good shape
      else if (complexity <= 4) score += 20; // Good shape
      else if (complexity <= 8) score += 15; // Moderate shape
      else score += 10;                      // Complex shape
    }
    
    // Consistency score (0-25)
    score += 15; // Base consistency score
    
    // Determine quality level
    if (score >= 85) return 'ultra';
    else if (score >= 70) return 'high';
    else if (score >= 50) return 'medium';
    else return 'low';
  }

  /**
   * Update physics simulation
   */
  public updatePhysics(deltaTime: number): void {
    Matter.Engine.update(this.engine, deltaTime);
  }

  /**
   * Get physics world for external access
   */
  public getPhysicsWorld(): Matter.World {
    return this.engine.world;
  }

  /**
   * Clean up physics bodies and Web Workers
   */
  public cleanup(): void {
    // Clean up physics world
    Matter.World.clear(this.engine.world, false);
    
    // Clean up Web Workers
    webWorkerManager.cleanup();
    
    console.log('🧹 Mesh processor and workers cleaned up');
  }
}

// Export singleton instance
export const professionalMeshProcessor = ProfessionalMeshProcessor.getInstance();