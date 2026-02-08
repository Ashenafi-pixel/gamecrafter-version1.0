// ML-Powered Segmentation and Component Detection Engine
// Implements semantic segmentation, edge detection, and automatic component identification

export interface MLSegmentationConfig {
  modelType: 'sam' | 'clip' | 'yolo' | 'maskrcnn' | 'custom';
  confidenceThreshold: number;
  overlapThreshold: number;
  enableEdgeRefinement: boolean;
  enableDepthEstimation: boolean;
  enableMaterialDetection: boolean;
}

export interface DetectedComponent {
  id: string;
  name: string;
  type: ComponentType;
  confidence: number;
  
  // Geometric data
  boundingBox: BoundingBox;
  mask: ImageMask;
  contour: Point[];
  
  // Semantic properties
  material: MaterialProperties;
  motion: MotionProperties;
  depth: DepthProperties;
  
  // Relationships
  parent?: string;
  children: string[];
  connections: ComponentConnection[];
  
  // Animation hints
  animationHints: AnimationHint[];
  rigPoints: RigPoint[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface ImageMask {
  width: number;
  height: number;
  data: Uint8Array; // Binary mask data
  smooth: boolean;
  antialiased: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface MaterialProperties {
  type: 'organic' | 'metallic' | 'cloth' | 'hair' | 'liquid' | 'gas' | 'rigid' | 'unknown';
  flexibility: number; // 0.0 = rigid, 1.0 = very flexible
  density: number;
  roughness: number;
  metallic: number;
  transparency: number;
  subsurfaceScattering: number;
  confidence: number;
}

export interface MotionProperties {
  primaryMotion: MotionType;
  secondaryMotion: MotionType[];
  frequency: number; // Expected animation frequency
  amplitude: number; // Expected movement range
  damping: number;
  elasticity: number;
  attachmentStrength: number;
}

export interface DepthProperties {
  relativeDepth: number; // 0.0 = background, 1.0 = foreground
  layerIndex: number;
  occluders: string[]; // Component IDs that occlude this component
  occluded: string[]; // Component IDs that this component occludes
}

export interface ComponentConnection {
  targetId: string;
  connectionType: 'attachment' | 'overlap' | 'proximity' | 'semantic';
  strength: number;
  offset: Point;
}

export interface AnimationHint {
  type: 'pivot_point' | 'deformation_area' | 'motion_path' | 'constraint_zone';
  position: Point;
  direction?: Point;
  radius?: number;
  confidence: number;
}

export interface RigPoint {
  type: 'bone_start' | 'bone_end' | 'joint' | 'control_point';
  position: Point;
  influence: number;
  connections: string[]; // Connected rig point IDs
}

export type ComponentType = 
  | 'body' | 'head' | 'limb' | 'wing' | 'tail' | 'appendage'
  | 'clothing' | 'armor' | 'accessory' | 'weapon' | 'tool'
  | 'hair' | 'fur' | 'feathers' | 'scales'
  | 'eyes' | 'mouth' | 'face_feature'
  | 'decoration' | 'pattern' | 'texture'
  | 'background' | 'foreground' | 'effect'
  | 'unknown';

export type MotionType = 
  | 'none' | 'linear' | 'rotational' | 'oscillation' | 'wave'
  | 'flutter' | 'bounce' | 'sway' | 'pulse' | 'shimmer'
  | 'flow' | 'ripple' | 'morph' | 'scale';

export interface SegmentationResult {
  success: boolean;
  processingTime: number;
  components: DetectedComponent[];
  metadata: SegmentationMetadata;
  
  // Quality metrics
  overallConfidence: number;
  completeness: number; // How much of the image was segmented
  consistency: number; // How consistent the segmentation is
}

export interface SegmentationMetadata {
  imageWidth: number;
  imageHeight: number;
  modelUsed: string;
  processingSteps: ProcessingStep[];
  warnings: string[];
  suggestions: string[];
}

export interface ProcessingStep {
  name: string;
  duration: number;
  success: boolean;
  details?: any;
}

// Mock ML Models (in production, these would interface with actual ML services)
class MockSAMModel {
  async segmentEverything(imageData: ImageData): Promise<DetectedComponent[]> {
    // Simulate SAM (Segment Anything Model) processing
    await this.simulateProcessingDelay(1500);
    
    const components: DetectedComponent[] = [];
    const { width, height } = imageData;
    
    // Simulate finding multiple components
    const numComponents = Math.floor(Math.random() * 5) + 3; // 3-7 components
    
    for (let i = 0; i < numComponents; i++) {
      const component = this.generateMockComponent(i, width, height);
      components.push(component);
    }
    
    return components;
  }
  
  private generateMockComponent(index: number, imageWidth: number, imageHeight: number): DetectedComponent {
    const x = Math.random() * (imageWidth * 0.6);
    const y = Math.random() * (imageHeight * 0.6);
    const width = Math.random() * (imageWidth * 0.4) + 50;
    const height = Math.random() * (imageHeight * 0.4) + 50;
    
    const componentTypes: ComponentType[] = ['body', 'wing', 'head', 'limb', 'accessory'];
    const type = componentTypes[index % componentTypes.length];
    
    return {
      id: `sam_component_${index}`,
      name: `${type}_${index}`,
      type,
      confidence: 0.7 + Math.random() * 0.3,
      
      boundingBox: { x, y, width, height, confidence: 0.85 },
      mask: this.generateMockMask(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height)),
      contour: this.generateMockContour(x, y, width, height),
      
      material: this.generateMockMaterial(type),
      motion: this.generateMockMotion(type),
      depth: { relativeDepth: Math.random(), layerIndex: index, occluders: [], occluded: [] },
      
      children: [],
      connections: [],
      animationHints: this.generateAnimationHints(type, x + width/2, y + height/2),
      rigPoints: this.generateRigPoints(type, x, y, width, height)
    };
  }
  
  private generateMockMask(x: number, y: number, width: number, height: number): ImageMask {
    const maskData = new Uint8Array(width * height);
    
    // Create elliptical mask
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.4;
    const radiusY = height * 0.4;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const dx = (px - centerX) / radiusX;
        const dy = (py - centerY) / radiusY;
        const distance = dx * dx + dy * dy;
        
        if (distance <= 1.0) {
          maskData[py * width + px] = 255;
        }
      }
    }
    
    return {
      width,
      height,
      data: maskData,
      smooth: true,
      antialiased: true
    };
  }
  
  private generateMockContour(x: number, y: number, width: number, height: number): Point[] {
    const contour: Point[] = [];
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width * 0.4;
    const radiusY = height * 0.4;
    const points = 32;
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const px = centerX + Math.cos(angle) * radiusX;
      const py = centerY + Math.sin(angle) * radiusY;
      contour.push({ x: px, y: py });
    }
    
    return contour;
  }
  
  private generateMockMaterial(type: ComponentType): MaterialProperties {
    const materialMap: { [key in ComponentType]?: Partial<MaterialProperties> } = {
      body: { type: 'organic', flexibility: 0.3, density: 1.0, roughness: 0.7 },
      wing: { type: 'organic', flexibility: 0.8, density: 0.3, roughness: 0.4 },
      head: { type: 'organic', flexibility: 0.1, density: 1.0, roughness: 0.6 },
      clothing: { type: 'cloth', flexibility: 0.9, density: 0.2, roughness: 0.8 },
      armor: { type: 'metallic', flexibility: 0.1, density: 2.0, roughness: 0.2 },
      hair: { type: 'hair', flexibility: 1.0, density: 0.1, roughness: 0.9 }
    };
    
    const defaults: MaterialProperties = {
      type: 'organic',
      flexibility: 0.5,
      density: 1.0,
      roughness: 0.5,
      metallic: 0.0,
      transparency: 0.0,
      subsurfaceScattering: 0.1,
      confidence: 0.8
    };
    
    return { ...defaults, ...materialMap[type] };
  }
  
  private generateMockMotion(type: ComponentType): MotionProperties {
    const motionMap: { [key in ComponentType]?: Partial<MotionProperties> } = {
      wing: { primaryMotion: 'flutter', frequency: 10, amplitude: 0.8, elasticity: 0.3 },
      hair: { primaryMotion: 'sway', frequency: 2, amplitude: 0.6, elasticity: 0.8 },
      clothing: { primaryMotion: 'wave', frequency: 1, amplitude: 0.4, elasticity: 0.7 },
      tail: { primaryMotion: 'sway', frequency: 1.5, amplitude: 0.7, elasticity: 0.5 },
      body: { primaryMotion: 'pulse', frequency: 0.5, amplitude: 0.1, elasticity: 0.1 }
    };
    
    const defaults: MotionProperties = {
      primaryMotion: 'none',
      secondaryMotion: [],
      frequency: 1.0,
      amplitude: 0.2,
      damping: 0.1,
      elasticity: 0.5,
      attachmentStrength: 1.0
    };
    
    return { ...defaults, ...motionMap[type] };
  }
  
  private generateAnimationHints(type: ComponentType, centerX: number, centerY: number): AnimationHint[] {
    const hints: AnimationHint[] = [];
    
    switch (type) {
      case 'wing':
        hints.push({
          type: 'pivot_point',
          position: { x: centerX - 20, y: centerY },
          confidence: 0.9
        });
        break;
      
      case 'head':
        hints.push({
          type: 'pivot_point',
          position: { x: centerX, y: centerY + 10 },
          confidence: 0.8
        });
        break;
      
      case 'limb':
        hints.push({
          type: 'pivot_point',
          position: { x: centerX, y: centerY - 15 },
          confidence: 0.85
        });
        hints.push({
          type: 'pivot_point',
          position: { x: centerX, y: centerY + 15 },
          confidence: 0.85
        });
        break;
    }
    
    return hints;
  }
  
  private generateRigPoints(type: ComponentType, x: number, y: number, width: number, height: number): RigPoint[] {
    const rigPoints: RigPoint[] = [];
    
    switch (type) {
      case 'wing':
        rigPoints.push(
          { type: 'bone_start', position: { x: x + width * 0.2, y: y + height * 0.5 }, influence: 1.0, connections: [] },
          { type: 'bone_end', position: { x: x + width * 0.8, y: y + height * 0.3 }, influence: 0.8, connections: [] },
          { type: 'bone_end', position: { x: x + width * 0.8, y: y + height * 0.7 }, influence: 0.8, connections: [] }
        );
        break;
      
      case 'limb':
        rigPoints.push(
          { type: 'joint', position: { x: x + width * 0.5, y: y + height * 0.2 }, influence: 1.0, connections: [] },
          { type: 'joint', position: { x: x + width * 0.5, y: y + height * 0.8 }, influence: 1.0, connections: [] }
        );
        break;
      
      case 'body':
        rigPoints.push(
          { type: 'control_point', position: { x: x + width * 0.5, y: y + height * 0.5 }, influence: 0.9, connections: [] }
        );
        break;
    }
    
    return rigPoints;
  }
  
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MockCLIPModel {
  async classifyComponents(imageData: ImageData, components: DetectedComponent[]): Promise<DetectedComponent[]> {
    // Simulate CLIP (Contrastive Language-Image Pre-training) processing
    await this.simulateProcessingDelay(800);
    
    const enhancedComponents = components.map(component => {
      const semanticInfo = this.generateSemanticClassification(component);
      return {
        ...component,
        ...semanticInfo
      };
    });
    
    return enhancedComponents;
  }
  
  private generateSemanticClassification(component: DetectedComponent): Partial<DetectedComponent> {
    // Enhanced semantic understanding based on visual features
    const enhancedName = this.generateSemanticName(component.type);
    const enhancedMotion = this.enhanceMotionProperties(component.motion, component.type);
    
    return {
      name: enhancedName,
      motion: enhancedMotion,
      confidence: Math.min(component.confidence + 0.1, 1.0)
    };
  }
  
  private generateSemanticName(type: ComponentType): string {
    const nameMap: { [key in ComponentType]?: string[] } = {
      wing: ['left_wing', 'right_wing', 'main_wing', 'secondary_wing'],
      body: ['torso', 'abdomen', 'main_body', 'core'],
      head: ['head', 'face', 'skull'],
      limb: ['arm', 'leg', 'tentacle', 'appendage'],
      accessory: ['ornament', 'decoration', 'jewelry', 'emblem']
    };
    
    const names = nameMap[type] || [type];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  private enhanceMotionProperties(motion: MotionProperties, type: ComponentType): MotionProperties {
    const enhanced = { ...motion };
    
    // Add secondary motion based on type
    switch (type) {
      case 'wing':
        enhanced.secondaryMotion = ['shimmer', 'wave'];
        break;
      case 'hair':
        enhanced.secondaryMotion = ['flow', 'ripple'];
        break;
      case 'clothing':
        enhanced.secondaryMotion = ['flutter', 'wave'];
        break;
    }
    
    return enhanced;
  }
  
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MockYOLOModel {
  async detectObjects(imageData: ImageData): Promise<DetectedComponent[]> {
    // Simulate YOLO (You Only Look Once) object detection
    await this.simulateProcessingDelay(600);
    
    const components: DetectedComponent[] = [];
    
    // Simulate detecting common slot game elements
    const slotElements = [
      { type: 'body' as ComponentType, probability: 0.9 },
      { type: 'wing' as ComponentType, probability: 0.8 },
      { type: 'head' as ComponentType, probability: 0.7 },
      { type: 'accessory' as ComponentType, probability: 0.6 }
    ];
    
    for (const element of slotElements) {
      if (Math.random() < element.probability) {
        const component = this.generateYOLOComponent(element.type, imageData.width, imageData.height);
        components.push(component);
      }
    }
    
    return components;
  }
  
  private generateYOLOComponent(type: ComponentType, imageWidth: number, imageHeight: number): DetectedComponent {
    const x = Math.random() * (imageWidth * 0.5);
    const y = Math.random() * (imageHeight * 0.5);
    const width = Math.random() * (imageWidth * 0.3) + 100;
    const height = Math.random() * (imageHeight * 0.3) + 100;
    
    return {
      id: `yolo_${type}_${Date.now()}`,
      name: `detected_${type}`,
      type,
      confidence: 0.6 + Math.random() * 0.3,
      
      boundingBox: { x, y, width, height, confidence: 0.8 },
      mask: this.createRectangularMask(Math.floor(width), Math.floor(height)),
      contour: this.createRectangularContour(x, y, width, height),
      
      material: { type: 'organic', flexibility: 0.5, density: 1.0, roughness: 0.5, metallic: 0, transparency: 0, subsurfaceScattering: 0.1, confidence: 0.7 },
      motion: { primaryMotion: 'none', secondaryMotion: [], frequency: 1, amplitude: 0.2, damping: 0.1, elasticity: 0.5, attachmentStrength: 1.0 },
      depth: { relativeDepth: Math.random(), layerIndex: 0, occluders: [], occluded: [] },
      
      children: [],
      connections: [],
      animationHints: [],
      rigPoints: []
    };
  }
  
  private createRectangularMask(width: number, height: number): ImageMask {
    const maskData = new Uint8Array(width * height);
    maskData.fill(255); // Solid rectangular mask
    
    return {
      width,
      height,
      data: maskData,
      smooth: false,
      antialiased: false
    };
  }
  
  private createRectangularContour(x: number, y: number, width: number, height: number): Point[] {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ];
  }
  
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class EdgeDetectionProcessor {
  async detectEdges(imageData: ImageData, components: DetectedComponent[]): Promise<DetectedComponent[]> {
    await this.simulateProcessingDelay(400);
    
    return components.map(component => {
      const refinedContour = this.refineContourWithEdgeDetection(component.contour);
      const refinedMask = this.refineMaskWithEdgeDetection(component.mask);
      
      return {
        ...component,
        contour: refinedContour,
        mask: refinedMask
      };
    });
  }
  
  private refineContourWithEdgeDetection(contour: Point[]): Point[] {
    // Simulate edge refinement - add more detail points
    const refinedContour: Point[] = [];
    
    for (let i = 0; i < contour.length; i++) {
      const current = contour[i];
      const next = contour[(i + 1) % contour.length];
      
      refinedContour.push(current);
      
      // Add intermediate point with slight variation
      const midX = (current.x + next.x) / 2 + (Math.random() - 0.5) * 2;
      const midY = (current.y + next.y) / 2 + (Math.random() - 0.5) * 2;
      refinedContour.push({ x: midX, y: midY });
    }
    
    return refinedContour;
  }
  
  private refineMaskWithEdgeDetection(mask: ImageMask): ImageMask {
    // Simulate mask refinement - apply anti-aliasing
    return {
      ...mask,
      smooth: true,
      antialiased: true
    };
  }
  
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class DepthEstimationProcessor {
  async estimateDepth(imageData: ImageData, components: DetectedComponent[]): Promise<DetectedComponent[]> {
    await this.simulateProcessingDelay(700);
    
    // Sort components by size (larger = closer)
    const sortedComponents = [...components].sort((a, b) => {
      const areaA = a.boundingBox.width * a.boundingBox.height;
      const areaB = b.boundingBox.width * b.boundingBox.height;
      return areaB - areaA;
    });
    
    return sortedComponents.map((component, index) => {
      const layerIndex = index;
      const relativeDepth = 1.0 - (index / sortedComponents.length);
      
      // Calculate occlusion relationships
      const occluders: string[] = [];
      const occluded: string[] = [];
      
      for (let i = 0; i < index; i++) {
        if (this.componentsOverlap(component, sortedComponents[i])) {
          occluders.push(sortedComponents[i].id);
        }
      }
      
      for (let i = index + 1; i < sortedComponents.length; i++) {
        if (this.componentsOverlap(component, sortedComponents[i])) {
          occluded.push(sortedComponents[i].id);
        }
      }
      
      return {
        ...component,
        depth: {
          relativeDepth,
          layerIndex,
          occluders,
          occluded
        }
      };
    });
  }
  
  private componentsOverlap(a: DetectedComponent, b: DetectedComponent): boolean {
    const aBox = a.boundingBox;
    const bBox = b.boundingBox;
    
    return !(aBox.x + aBox.width < bBox.x ||
             bBox.x + bBox.width < aBox.x ||
             aBox.y + aBox.height < bBox.y ||
             bBox.y + bBox.height < aBox.y);
  }
  
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ComponentRelationshipAnalyzer {
  analyzeRelationships(components: DetectedComponent[]): DetectedComponent[] {
    const enhancedComponents = components.map(component => ({ ...component }));
    
    // Analyze spatial relationships
    for (let i = 0; i < enhancedComponents.length; i++) {
      for (let j = i + 1; j < enhancedComponents.length; j++) {
        const compA = enhancedComponents[i];
        const compB = enhancedComponents[j];
        
        const relationship = this.analyzeComponentRelationship(compA, compB);
        if (relationship) {
          compA.connections.push({
            targetId: compB.id,
            connectionType: relationship.type,
            strength: relationship.strength,
            offset: relationship.offset
          });
          
          compB.connections.push({
            targetId: compA.id,
            connectionType: relationship.type,
            strength: relationship.strength,
            offset: { x: -relationship.offset.x, y: -relationship.offset.y }
          });
        }
        
        // Determine parent-child relationships
        const parentChild = this.determineParentChild(compA, compB);
        if (parentChild) {
          parentChild.parent.children.push(parentChild.child.id);
          parentChild.child.parent = parentChild.parent.id;
        }
      }
    }
    
    return enhancedComponents;
  }
  
  private analyzeComponentRelationship(compA: DetectedComponent, compB: DetectedComponent): {
    type: ComponentConnection['connectionType'];
    strength: number;
    offset: Point;
  } | null {
    const distance = this.calculateDistance(
      this.getBoundingBoxCenter(compA.boundingBox),
      this.getBoundingBoxCenter(compB.boundingBox)
    );
    
    const maxDimension = Math.max(
      compA.boundingBox.width + compA.boundingBox.height,
      compB.boundingBox.width + compB.boundingBox.height
    );
    
    if (distance < maxDimension * 0.3) {
      // Components are very close - likely attached
      return {
        type: 'attachment',
        strength: 1.0 - (distance / (maxDimension * 0.3)),
        offset: {
          x: compB.boundingBox.x - compA.boundingBox.x,
          y: compB.boundingBox.y - compA.boundingBox.y
        }
      };
    } else if (distance < maxDimension * 0.6) {
      // Components are nearby - proximity relationship
      return {
        type: 'proximity',
        strength: 0.5,
        offset: {
          x: compB.boundingBox.x - compA.boundingBox.x,
          y: compB.boundingBox.y - compA.boundingBox.y
        }
      };
    }
    
    return null;
  }
  
  private determineParentChild(compA: DetectedComponent, compB: DetectedComponent): {
    parent: DetectedComponent;
    child: DetectedComponent;
  } | null {
    // Larger, more central components are typically parents
    const aArea = compA.boundingBox.width * compA.boundingBox.height;
    const bArea = compB.boundingBox.width * compB.boundingBox.height;
    
    const aCentrality = this.calculateCentrality(compA.boundingBox);
    const bCentrality = this.calculateCentrality(compB.boundingBox);
    
    const aScore = aArea * 0.7 + aCentrality * 0.3;
    const bScore = bArea * 0.7 + bCentrality * 0.3;
    
    const scoreDifference = Math.abs(aScore - bScore) / Math.max(aScore, bScore);
    
    if (scoreDifference > 0.3) {
      return aScore > bScore 
        ? { parent: compA, child: compB }
        : { parent: compB, child: compA };
    }
    
    return null;
  }
  
  private calculateDistance(pointA: Point, pointB: Point): number {
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private getBoundingBoxCenter(box: BoundingBox): Point {
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
  }
  
  private calculateCentrality(box: BoundingBox): number {
    // Assume image center is (400, 400) for simplicity
    const imageCenter = { x: 400, y: 400 };
    const boxCenter = this.getBoundingBoxCenter(box);
    const distance = this.calculateDistance(boxCenter, imageCenter);
    
    // Normalize by diagonal distance
    const maxDistance = Math.sqrt(400 * 400 + 400 * 400);
    return 1.0 - (distance / maxDistance);
  }
}

export class MLSegmentationEngine {
  private samModel: MockSAMModel;
  private clipModel: MockCLIPModel;
  private yoloModel: MockYOLOModel;
  private edgeProcessor: EdgeDetectionProcessor;
  private depthProcessor: DepthEstimationProcessor;
  private relationshipAnalyzer: ComponentRelationshipAnalyzer;
  
  constructor() {
    this.samModel = new MockSAMModel();
    this.clipModel = new MockCLIPModel();
    this.yoloModel = new MockYOLOModel();
    this.edgeProcessor = new EdgeDetectionProcessor();
    this.depthProcessor = new DepthEstimationProcessor();
    this.relationshipAnalyzer = new ComponentRelationshipAnalyzer();
    
    console.log('[MLSegmentation] ML-powered segmentation engine initialized');
  }
  
  async segmentImage(
    imageDataUrl: string, 
    config: Partial<MLSegmentationConfig> = {}
  ): Promise<SegmentationResult> {
    const startTime = performance.now();
    const fullConfig: MLSegmentationConfig = {
      modelType: 'sam',
      confidenceThreshold: 0.5,
      overlapThreshold: 0.3,
      enableEdgeRefinement: true,
      enableDepthEstimation: true,
      enableMaterialDetection: true,
      ...config
    };
    
    console.log(`[MLSegmentation] Starting segmentation with ${fullConfig.modelType} model`);
    
    try {
      // Convert image data URL to ImageData
      const imageData = await this.loadImageData(imageDataUrl);
      
      const processingSteps: ProcessingStep[] = [];
      let components: DetectedComponent[] = [];
      
      // Step 1: Primary segmentation
      const segmentationStart = performance.now();
      switch (fullConfig.modelType) {
        case 'sam':
          components = await this.samModel.segmentEverything(imageData);
          break;
        case 'yolo':
          components = await this.yoloModel.detectObjects(imageData);
          break;
        default:
          components = await this.samModel.segmentEverything(imageData);
      }
      
      processingSteps.push({
        name: `${fullConfig.modelType.toUpperCase()} Segmentation`,
        duration: performance.now() - segmentationStart,
        success: true,
        details: { componentsFound: components.length }
      });
      
      // Step 2: Semantic classification with CLIP
      if (fullConfig.modelType !== 'clip') {
        const clipStart = performance.now();
        components = await this.clipModel.classifyComponents(imageData, components);
        processingSteps.push({
          name: 'CLIP Classification',
          duration: performance.now() - clipStart,
          success: true,
          details: { componentsClassified: components.length }
        });
      }
      
      // Step 3: Edge refinement
      if (fullConfig.enableEdgeRefinement) {
        const edgeStart = performance.now();
        components = await this.edgeProcessor.detectEdges(imageData, components);
        processingSteps.push({
          name: 'Edge Refinement',
          duration: performance.now() - edgeStart,
          success: true,
          details: { componentsRefined: components.length }
        });
      }
      
      // Step 4: Depth estimation
      if (fullConfig.enableDepthEstimation) {
        const depthStart = performance.now();
        components = await this.depthProcessor.estimateDepth(imageData, components);
        processingSteps.push({
          name: 'Depth Estimation',
          duration: performance.now() - depthStart,
          success: true,
          details: { layersCreated: components.length }
        });
      }
      
      // Step 5: Relationship analysis
      const relationshipStart = performance.now();
      components = this.relationshipAnalyzer.analyzeRelationships(components);
      processingSteps.push({
        name: 'Relationship Analysis',
        duration: performance.now() - relationshipStart,
        success: true,
        details: { relationshipsFound: components.reduce((sum, c) => sum + c.connections.length, 0) }
      });
      
      // Step 6: Quality filtering
      const filteredComponents = this.filterByConfidence(components, fullConfig.confidenceThreshold);
      const finalComponents = this.resolveOverlaps(filteredComponents, fullConfig.overlapThreshold);
      
      const totalTime = performance.now() - startTime;
      
      const result: SegmentationResult = {
        success: true,
        processingTime: totalTime,
        components: finalComponents,
        metadata: {
          imageWidth: imageData.width,
          imageHeight: imageData.height,
          modelUsed: fullConfig.modelType,
          processingSteps,
          warnings: this.generateWarnings(finalComponents),
          suggestions: this.generateSuggestions(finalComponents)
        },
        overallConfidence: this.calculateOverallConfidence(finalComponents),
        completeness: this.calculateCompleteness(finalComponents, imageData),
        consistency: this.calculateConsistency(finalComponents)
      };
      
      console.log(`[MLSegmentation] Segmentation completed in ${totalTime.toFixed(2)}ms`);
      console.log(`[MLSegmentation] Found ${finalComponents.length} components with ${result.overallConfidence.toFixed(2)} confidence`);
      
      return result;
      
    } catch (error) {
      console.error('[MLSegmentation] Segmentation failed:', error);
      
      return {
        success: false,
        processingTime: performance.now() - startTime,
        components: [],
        metadata: {
          imageWidth: 0,
          imageHeight: 0,
          modelUsed: fullConfig.modelType,
          processingSteps: [{
            name: 'Error',
            duration: 0,
            success: false,
            details: { error: error.message }
          }],
          warnings: [`Segmentation failed: ${error.message}`],
          suggestions: ['Try a different model or adjust confidence thresholds']
        },
        overallConfidence: 0,
        completeness: 0,
        consistency: 0
      };
    }
  }
  
  private async loadImageData(imageDataUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  }
  
  private filterByConfidence(components: DetectedComponent[], threshold: number): DetectedComponent[] {
    return components.filter(component => component.confidence >= threshold);
  }
  
  private resolveOverlaps(components: DetectedComponent[], overlapThreshold: number): DetectedComponent[] {
    const resolved: DetectedComponent[] = [];
    
    for (const component of components) {
      let shouldAdd = true;
      
      for (const existing of resolved) {
        const overlap = this.calculateOverlap(component.boundingBox, existing.boundingBox);
        if (overlap > overlapThreshold) {
          // Keep the component with higher confidence
          if (component.confidence > existing.confidence) {
            const index = resolved.indexOf(existing);
            resolved[index] = component;
          }
          shouldAdd = false;
          break;
        }
      }
      
      if (shouldAdd) {
        resolved.push(component);
      }
    }
    
    return resolved;
  }
  
  private calculateOverlap(boxA: BoundingBox, boxB: BoundingBox): number {
    const xOverlap = Math.max(0, Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x));
    const yOverlap = Math.max(0, Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y));
    const overlapArea = xOverlap * yOverlap;
    
    const areaA = boxA.width * boxA.height;
    const areaB = boxB.width * boxB.height;
    const unionArea = areaA + areaB - overlapArea;
    
    return unionArea > 0 ? overlapArea / unionArea : 0;
  }
  
  private calculateOverallConfidence(components: DetectedComponent[]): number {
    if (components.length === 0) return 0;
    
    const totalConfidence = components.reduce((sum, component) => sum + component.confidence, 0);
    return totalConfidence / components.length;
  }
  
  private calculateCompleteness(components: DetectedComponent[], imageData: ImageData): number {
    // Estimate how much of the image is covered by segmented components
    const totalImageArea = imageData.width * imageData.height;
    const segmentedArea = components.reduce((sum, component) => {
      return sum + (component.boundingBox.width * component.boundingBox.height);
    }, 0);
    
    return Math.min(segmentedArea / totalImageArea, 1.0);
  }
  
  private calculateConsistency(components: DetectedComponent[]): number {
    // Calculate how consistent the segmentation is based on overlap and gaps
    if (components.length < 2) return 1.0;
    
    let overlapPenalty = 0;
    let gapBonus = 0;
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const overlap = this.calculateOverlap(components[i].boundingBox, components[j].boundingBox);
        if (overlap > 0.1) {
          overlapPenalty += overlap;
        } else if (overlap === 0) {
          gapBonus += 0.1;
        }
      }
    }
    
    const maxPairs = (components.length * (components.length - 1)) / 2;
    const consistencyScore = 1.0 - (overlapPenalty / maxPairs) + (gapBonus / maxPairs);
    
    return Math.max(0, Math.min(1, consistencyScore));
  }
  
  private generateWarnings(components: DetectedComponent[]): string[] {
    const warnings: string[] = [];
    
    if (components.length === 0) {
      warnings.push('No components detected in the image');
    } else if (components.length > 20) {
      warnings.push('Very high number of components detected - consider adjusting confidence threshold');
    }
    
    const lowConfidenceComponents = components.filter(c => c.confidence < 0.6);
    if (lowConfidenceComponents.length > 0) {
      warnings.push(`${lowConfidenceComponents.length} components have low confidence scores`);
    }
    
    const unclassifiedComponents = components.filter(c => c.type === 'unknown');
    if (unclassifiedComponents.length > 0) {
      warnings.push(`${unclassifiedComponents.length} components could not be classified`);
    }
    
    return warnings;
  }
  
  private generateSuggestions(components: DetectedComponent[]): string[] {
    const suggestions: string[] = [];
    
    if (components.length < 3) {
      suggestions.push('Consider lowering confidence threshold to detect more components');
    }
    
    const wingComponents = components.filter(c => c.type === 'wing');
    if (wingComponents.length === 1) {
      suggestions.push('Only one wing detected - consider symmetric duplication for animation');
    }
    
    const bodyComponents = components.filter(c => c.type === 'body');
    if (bodyComponents.length === 0) {
      suggestions.push('No body component detected - manual identification may be needed');
    }
    
    const hasAnimationHints = components.some(c => c.animationHints.length > 0);
    if (!hasAnimationHints) {
      suggestions.push('No animation hints detected - manual pivot points may be needed');
    }
    
    return suggestions;
  }
  
  // Public utility methods
  exportSegmentationData(result: SegmentationResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  importSegmentationData(jsonData: string): SegmentationResult {
    return JSON.parse(jsonData);
  }
  
  visualizeComponents(components: DetectedComponent[], canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each component
    components.forEach((component, index) => {
      const color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        component.boundingBox.x,
        component.boundingBox.y,
        component.boundingBox.width,
        component.boundingBox.height
      );
      
      // Draw contour
      if (component.contour.length > 0) {
        ctx.beginPath();
        ctx.moveTo(component.contour[0].x, component.contour[0].y);
        for (let i = 1; i < component.contour.length; i++) {
          ctx.lineTo(component.contour[i].x, component.contour[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      
      // Draw label
      ctx.fillStyle = color;
      ctx.font = '12px Arial';
      ctx.fillText(
        `${component.name} (${(component.confidence * 100).toFixed(0)}%)`,
        component.boundingBox.x,
        component.boundingBox.y - 5
      );
      
      // Draw animation hints
      component.animationHints.forEach(hint => {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(hint.position.x, hint.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw rig points
      component.rigPoints.forEach(rigPoint => {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(rigPoint.position.x, rigPoint.position.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
}

export const mlSegmentationEngine = new MLSegmentationEngine();