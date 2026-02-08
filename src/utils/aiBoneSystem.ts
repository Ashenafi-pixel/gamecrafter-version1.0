import { AISymbolAnalysis } from './aiAnimationEngine';

export interface Bone {
  id: string;
  name: string;
  parent: string | null;
  children: string[];
  
  // Transform properties
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  
  // Original transform (for reset)
  originalX: number;
  originalY: number;
  originalRotation: number;
  originalScaleX: number;
  originalScaleY: number;
  
  // Bone properties
  length: number;
  thickness: number;
  
  // AI generated properties
  aiGenerated: boolean;
  confidence: number;
  anatomyType: 'wing-root' | 'wing-tip' | 'wing-mid' | 'body-center' | 'body-segment' | 'limb' | 'joint';
  flexibility: number; // 0-1, how much this bone can move
  importance: number; // 0-1, how important this bone is for animation
  
  // Animation constraints
  constraints: {
    rotationMin: number;
    rotationMax: number;
    scaleMin: number;
    scaleMax: number;
    allowTranslation: boolean;
  };
  
  // Physics properties for realistic motion
  physics: {
    mass: number;
    damping: number;
    elasticity: number;
    followParent: number; // 0-1, how much to follow parent motion
  };
}

export interface BoneAttachment {
  id: string;
  boneId: string;
  textureId: string;
  
  // Attachment transform relative to bone
  offsetX: number;
  offsetY: number;
  offsetRotation: number;
  offsetScaleX: number;
  offsetScaleY: number;
  
  // Deformation properties
  deformable: boolean;
  deformVertices: Array<{ x: number; y: number }>;
  
  // AI properties
  aiGenerated: boolean;
  attachmentType: 'skin' | 'feather' | 'wing-membrane' | 'body-shell' | 'decoration';
  renderOrder: number;
}

export interface IKConstraint {
  id: string;
  name: string;
  target: string;
  bones: string[];
  bendDirection: 1 | -1;
  mix: number; // 0-1, strength of IK
  
  // AI generated properties
  aiGenerated: boolean;
  naturalMotion: boolean; // Whether to apply organic motion patterns
  anatomicallyCorrect: boolean;
}

export interface Skeleton {
  id: string;
  name: string;
  bones: Map<string, Bone>;
  attachments: Map<string, BoneAttachment>;
  ikConstraints: Map<string, IKConstraint>;
  
  // Root bone
  rootBone: string;
  
  // Animation data
  defaultPose: Map<string, Bone>;
  
  // AI metadata
  aiGenerated: boolean;
  confidence: number;
  anatomyType: 'insect' | 'bird' | 'mammal' | 'mechanical' | 'magical' | 'abstract';
  complexity: 'simple' | 'medium' | 'complex';
}

class AIBoneSystem {
  private skeletons = new Map<string, Skeleton>();
  private activeAnimations = new Map<string, any>();
  
  // AI-powered skeleton generation
  async generateSkeletonFromAnalysis(
    analysis: AISymbolAnalysis, 
    imageWidth: number, 
    imageHeight: number
  ): Promise<Skeleton> {
    console.log('🦴 AI generating skeleton structure...');
    
    const skeleton: Skeleton = {
      id: `skeleton-${Date.now()}`,
      name: 'AI Generated Skeleton',
      bones: new Map(),
      attachments: new Map(),
      ikConstraints: new Map(),
      rootBone: '',
      defaultPose: new Map(),
      aiGenerated: true,
      confidence: analysis.confidence,
      anatomyType: this.classifyAnatomy(analysis),
      complexity: this.determineComplexity(analysis)
    };
    
    // Generate bones based on detected elements
    await this.generateBonesFromElements(skeleton, analysis.detectedElements, imageWidth, imageHeight);
    
    // Generate IK constraints for realistic motion
    await this.generateIKConstraints(skeleton, analysis);
    
    // Generate attachments (skin/textures)
    await this.generateAttachments(skeleton, analysis);
    
    // Apply AI-enhanced physics properties
    await this.applyRealisticPhysics(skeleton, analysis);
    
    // Store default pose
    skeleton.defaultPose = new Map(skeleton.bones);
    
    this.skeletons.set(skeleton.id, skeleton);
    
    console.log(`✅ Generated skeleton with ${skeleton.bones.size} bones, ${skeleton.ikConstraints.size} IK constraints`);
    return skeleton;
  }
  
  private classifyAnatomy(analysis: AISymbolAnalysis): Skeleton['anatomyType'] {
    const theme = analysis.themeClassification.primary.toLowerCase();
    const hasWings = analysis.detectedElements.some(e => e.type === 'wings');
    
    if (hasWings) {
      if (theme.includes('insect') || theme.includes('beetle') || theme.includes('scarab')) {
        return 'insect';
      } else if (theme.includes('bird') || theme.includes('phoenix') || theme.includes('eagle')) {
        return 'bird';
      } else if (theme.includes('dragon') || theme.includes('magical')) {
        return 'magical';
      }
    }
    
    if (theme.includes('mechanical') || theme.includes('robot')) return 'mechanical';
    if (theme.includes('mammal') || theme.includes('animal')) return 'mammal';
    
    return 'abstract';
  }
  
  private determineComplexity(analysis: AISymbolAnalysis): Skeleton['complexity'] {
    const elementCount = analysis.detectedElements.length;
    const hasWings = analysis.detectedElements.some(e => e.type === 'wings');
    const hasLimbs = analysis.detectedElements.some(e => e.type === 'limbs');
    
    if (elementCount <= 3 && !hasLimbs) return 'simple';
    if (elementCount <= 6 || (hasWings && !hasLimbs)) return 'medium';
    return 'complex';
  }
  
  private async generateBonesFromElements(
    skeleton: Skeleton, 
    elements: AISymbolAnalysis['detectedElements'],
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    
    // Create root bone (center of mass)
    const rootBone: Bone = {
      id: 'root',
      name: 'Root',
      parent: null,
      children: [],
      x: imageWidth * 0.5,
      y: imageHeight * 0.5,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originalX: imageWidth * 0.5,
      originalY: imageHeight * 0.5,
      originalRotation: 0,
      originalScaleX: 1,
      originalScaleY: 1,
      length: 0,
      thickness: 5,
      aiGenerated: true,
      confidence: 0.95,
      anatomyType: 'body-center',
      flexibility: 0.1,
      importance: 1.0,
      constraints: {
        rotationMin: -Math.PI / 6,
        rotationMax: Math.PI / 6,
        scaleMin: 0.8,
        scaleMax: 1.2,
        allowTranslation: false
      },
      physics: {
        mass: 1.0,
        damping: 0.8,
        elasticity: 0.2,
        followParent: 0
      }
    };
    
    skeleton.bones.set('root', rootBone);
    skeleton.rootBone = 'root';
    
    // Generate bones for each detected element
    for (const element of elements) {
      switch (element.type) {
        case 'wings':
          await this.generateWingBones(skeleton, element, imageWidth, imageHeight);
          break;
        case 'body':
          await this.generateBodyBones(skeleton, element, imageWidth, imageHeight);
          break;
        case 'limbs':
          await this.generateLimbBones(skeleton, element, imageWidth, imageHeight);
          break;
        case 'head':
          await this.generateHeadBones(skeleton, element, imageWidth, imageHeight);
          break;
      }
    }
  }
  
  private async generateWingBones(
    skeleton: Skeleton, 
    element: any,
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    const isLeftWing = element.id.includes('left');
    const wingSide = isLeftWing ? 'left' : 'right';
    const sideMultiplier = isLeftWing ? -1 : 1;
    
    const bbox = element.boundingBox;
    const wingCenterX = (bbox.x + bbox.width * 0.5) * imageWidth;
    const wingCenterY = (bbox.y + bbox.height * 0.5) * imageHeight;
    
    // Wing root (connected to body)
    const wingRootId = `wing-root-${wingSide}`;
    const wingRoot: Bone = {
      id: wingRootId,
      name: `${wingSide} Wing Root`,
      parent: 'root',
      children: [],
      x: wingCenterX * 0.7, // Closer to body
      y: wingCenterY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originalX: wingCenterX * 0.7,
      originalY: wingCenterY,
      originalRotation: 0,
      originalScaleX: 1,
      originalScaleY: 1,
      length: bbox.width * imageWidth * 0.3,
      thickness: 8,
      aiGenerated: true,
      confidence: element.confidence,
      anatomyType: 'wing-root',
      flexibility: 0.8,
      importance: 0.9,
      constraints: {
        rotationMin: -Math.PI / 3 * sideMultiplier,
        rotationMax: Math.PI / 3 * sideMultiplier,
        scaleMin: 0.7,
        scaleMax: 1.4,
        allowTranslation: true
      },
      physics: {
        mass: 0.3,
        damping: 0.6,
        elasticity: 0.4,
        followParent: 0.8
      }
    };
    
    // Wing middle
    const wingMidId = `wing-mid-${wingSide}`;
    const wingMid: Bone = {
      id: wingMidId,
      name: `${wingSide} Wing Mid`,
      parent: wingRootId,
      children: [],
      x: wingCenterX,
      y: wingCenterY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originalX: wingCenterX,
      originalY: wingCenterY,
      originalRotation: 0,
      originalScaleX: 1,
      originalScaleY: 1,
      length: bbox.width * imageWidth * 0.4,
      thickness: 6,
      aiGenerated: true,
      confidence: element.confidence,
      anatomyType: 'wing-mid',
      flexibility: 0.9,
      importance: 0.8,
      constraints: {
        rotationMin: -Math.PI / 4 * sideMultiplier,
        rotationMax: Math.PI / 4 * sideMultiplier,
        scaleMin: 0.8,
        scaleMax: 1.3,
        allowTranslation: true
      },
      physics: {
        mass: 0.2,
        damping: 0.5,
        elasticity: 0.6,
        followParent: 0.7
      }
    };
    
    // Wing tip
    const wingTipId = `wing-tip-${wingSide}`;
    const wingTip: Bone = {
      id: wingTipId,
      name: `${wingSide} Wing Tip`,
      parent: wingMidId,
      children: [],
      x: wingCenterX + bbox.width * imageWidth * 0.3 * sideMultiplier,
      y: wingCenterY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originalX: wingCenterX + bbox.width * imageWidth * 0.3 * sideMultiplier,
      originalY: wingCenterY,
      originalRotation: 0,
      originalScaleX: 1,
      originalScaleY: 1,
      length: bbox.width * imageWidth * 0.3,
      thickness: 4,
      aiGenerated: true,
      confidence: element.confidence,
      anatomyType: 'wing-tip',
      flexibility: 1.0,
      importance: 0.7,
      constraints: {
        rotationMin: -Math.PI / 2 * sideMultiplier,
        rotationMax: Math.PI / 2 * sideMultiplier,
        scaleMin: 0.6,
        scaleMax: 1.5,
        allowTranslation: true
      },
      physics: {
        mass: 0.1,
        damping: 0.4,
        elasticity: 0.8,
        followParent: 0.6
      }
    };
    
    // Add bones to skeleton
    skeleton.bones.set(wingRootId, wingRoot);
    skeleton.bones.set(wingMidId, wingMid);
    skeleton.bones.set(wingTipId, wingTip);
    
    // Update parent-child relationships
    const rootBone = skeleton.bones.get('root')!;
    rootBone.children.push(wingRootId);
    wingRoot.children.push(wingMidId);
    wingMid.children.push(wingTipId);
  }
  
  private async generateBodyBones(
    skeleton: Skeleton,
    element: any,
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    // Body bones for more detailed body animation
    const bbox = element.boundingBox;
    const segments = skeleton.anatomyType === 'insect' ? 3 : 2; // More segments for insects
    
    for (let i = 0; i < segments; i++) {
      const segmentId = `body-segment-${i}`;
      const segmentY = (bbox.y + (bbox.height / segments) * (i + 0.5)) * imageHeight;
      
      const bodySegment: Bone = {
        id: segmentId,
        name: `Body Segment ${i + 1}`,
        parent: i === 0 ? 'root' : `body-segment-${i - 1}`,
        children: [],
        x: (bbox.x + bbox.width * 0.5) * imageWidth,
        y: segmentY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        originalX: (bbox.x + bbox.width * 0.5) * imageWidth,
        originalY: segmentY,
        originalRotation: 0,
        originalScaleX: 1,
        originalScaleY: 1,
        length: bbox.height * imageHeight / segments,
        thickness: 6,
        aiGenerated: true,
        confidence: element.confidence,
        anatomyType: 'body-segment',
        flexibility: 0.3 + (i * 0.2), // More flexible towards the tail
        importance: 0.6,
        constraints: {
          rotationMin: -Math.PI / 8,
          rotationMax: Math.PI / 8,
          scaleMin: 0.9,
          scaleMax: 1.1,
          allowTranslation: false
        },
        physics: {
          mass: 0.5,
          damping: 0.7,
          elasticity: 0.3,
          followParent: 0.9
        }
      };
      
      skeleton.bones.set(segmentId, bodySegment);
      
      // Update parent relationship
      if (i === 0) {
        const rootBone = skeleton.bones.get('root')!;
        rootBone.children.push(segmentId);
      } else {
        const parentBone = skeleton.bones.get(`body-segment-${i - 1}`)!;
        parentBone.children.push(segmentId);
      }
    }
  }
  
  private async generateLimbBones(
    skeleton: Skeleton,
    element: any,
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    // Generate limb bones for legs/arms/antennae
    const limbCount = skeleton.anatomyType === 'insect' ? 6 : 4;
    
    for (let i = 0; i < limbCount; i++) {
      const limbId = `limb-${i}`;
      const side = i % 2 === 0 ? 'left' : 'right';
      const sideMultiplier = i % 2 === 0 ? -1 : 1;
      
      const limb: Bone = {
        id: limbId,
        name: `${side} Limb ${Math.floor(i / 2) + 1}`,
        parent: 'root',
        children: [],
        x: imageWidth * 0.5 + (imageWidth * 0.2 * sideMultiplier),
        y: imageHeight * 0.6 + (i * 20),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        originalX: imageWidth * 0.5 + (imageWidth * 0.2 * sideMultiplier),
        originalY: imageHeight * 0.6 + (i * 20),
        originalRotation: 0,
        originalScaleX: 1,
        originalScaleY: 1,
        length: 30,
        thickness: 3,
        aiGenerated: true,
        confidence: element.confidence,
        anatomyType: 'limb',
        flexibility: 0.8,
        importance: 0.4,
        constraints: {
          rotationMin: -Math.PI,
          rotationMax: Math.PI,
          scaleMin: 0.8,
          scaleMax: 1.2,
          allowTranslation: true
        },
        physics: {
          mass: 0.1,
          damping: 0.3,
          elasticity: 0.7,
          followParent: 0.5
        }
      };
      
      skeleton.bones.set(limbId, limb);
      
      const rootBone = skeleton.bones.get('root')!;
      rootBone.children.push(limbId);
    }
  }
  
  private async generateHeadBones(
    skeleton: Skeleton,
    element: any,
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    const bbox = element.boundingBox;
    
    const headBone: Bone = {
      id: 'head',
      name: 'Head',
      parent: 'root',
      children: [],
      x: (bbox.x + bbox.width * 0.5) * imageWidth,
      y: (bbox.y + bbox.height * 0.5) * imageHeight,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originalX: (bbox.x + bbox.width * 0.5) * imageWidth,
      originalY: (bbox.y + bbox.height * 0.5) * imageHeight,
      originalRotation: 0,
      originalScaleX: 1,
      originalScaleY: 1,
      length: bbox.width * imageWidth,
      thickness: 8,
      aiGenerated: true,
      confidence: element.confidence,
      anatomyType: 'body-center',
      flexibility: 0.4,
      importance: 0.8,
      constraints: {
        rotationMin: -Math.PI / 6,
        rotationMax: Math.PI / 6,
        scaleMin: 0.9,
        scaleMax: 1.1,
        allowTranslation: false
      },
      physics: {
        mass: 0.3,
        damping: 0.8,
        elasticity: 0.2,
        followParent: 0.9
      }
    };
    
    skeleton.bones.set('head', headBone);
    
    const rootBone = skeleton.bones.get('root')!;
    rootBone.children.push('head');
  }
  
  private async generateIKConstraints(skeleton: Skeleton, analysis: AISymbolAnalysis): Promise<void> {
    // Generate IK constraints for realistic motion
    
    // Wing IK for natural wing movement
    const leftWingBones = Array.from(skeleton.bones.keys()).filter(id => 
      id.includes('wing') && id.includes('left')
    );
    const rightWingBones = Array.from(skeleton.bones.keys()).filter(id => 
      id.includes('wing') && id.includes('right')
    );
    
    if (leftWingBones.length >= 2) {
      const leftWingIK: IKConstraint = {
        id: 'left-wing-ik',
        name: 'Left Wing IK',
        target: 'left-wing-target',
        bones: leftWingBones.slice(0, 2), // Root and mid
        bendDirection: 1,
        mix: 0.8,
        aiGenerated: true,
        naturalMotion: true,
        anatomicallyCorrect: true
      };
      
      skeleton.ikConstraints.set('left-wing-ik', leftWingIK);
    }
    
    if (rightWingBones.length >= 2) {
      const rightWingIK: IKConstraint = {
        id: 'right-wing-ik',
        name: 'Right Wing IK',
        target: 'right-wing-target',
        bones: rightWingBones.slice(0, 2),
        bendDirection: -1,
        mix: 0.8,
        aiGenerated: true,
        naturalMotion: true,
        anatomicallyCorrect: true
      };
      
      skeleton.ikConstraints.set('right-wing-ik', rightWingIK);
    }
  }
  
  private async generateAttachments(skeleton: Skeleton, analysis: AISymbolAnalysis): Promise<void> {
    // Generate texture attachments for each bone
    
    skeleton.bones.forEach(bone => {
      if (bone.anatomyType.includes('wing')) {
        const attachment: BoneAttachment = {
          id: `${bone.id}-attachment`,
          boneId: bone.id,
          textureId: 'wing-texture',
          offsetX: 0,
          offsetY: 0,
          offsetRotation: 0,
          offsetScaleX: 1,
          offsetScaleY: 1,
          deformable: true,
          deformVertices: this.generateWingVertices(bone),
          aiGenerated: true,
          attachmentType: 'wing-membrane',
          renderOrder: 1
        };
        
        skeleton.attachments.set(attachment.id, attachment);
      } else if (bone.anatomyType.includes('body')) {
        const attachment: BoneAttachment = {
          id: `${bone.id}-attachment`,
          boneId: bone.id,
          textureId: 'body-texture',
          offsetX: 0,
          offsetY: 0,
          offsetRotation: 0,
          offsetScaleX: 1,
          offsetScaleY: 1,
          deformable: false,
          deformVertices: [],
          aiGenerated: true,
          attachmentType: 'body-shell',
          renderOrder: 0
        };
        
        skeleton.attachments.set(attachment.id, attachment);
      }
    });
  }
  
  private generateWingVertices(bone: Bone): Array<{ x: number; y: number }> {
    // Generate wing mesh vertices for deformation
    const vertices = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Wing shape (elliptical)
      vertices.push({
        x: bone.length * t,
        y: Math.sin(t * Math.PI) * bone.length * 0.3
      });
      if (i > 0 && i < segments) {
        vertices.push({
          x: bone.length * t,
          y: -Math.sin(t * Math.PI) * bone.length * 0.3
        });
      }
    }
    
    return vertices;
  }
  
  private async applyRealisticPhysics(skeleton: Skeleton, analysis: AISymbolAnalysis): Promise<void> {
    // Apply AI-enhanced physics based on anatomy type
    const physicsProfile = this.getPhysicsProfile(skeleton.anatomyType);
    
    skeleton.bones.forEach(bone => {
      // Apply physics based on bone type and position in hierarchy
      const depthFromRoot = this.getBoneDepth(skeleton, bone.id);
      
      bone.physics.mass *= physicsProfile.massMultiplier;
      bone.physics.damping *= physicsProfile.dampingMultiplier;
      bone.physics.elasticity *= physicsProfile.elasticityMultiplier;
      
      // Bones further from root are more flexible
      bone.flexibility = Math.min(1.0, bone.flexibility + (depthFromRoot * 0.1));
      
      // Secondary motion based on anatomy
      if (bone.anatomyType.includes('wing')) {
        bone.physics.elasticity *= 1.5; // Wings are more elastic
        bone.physics.damping *= 0.8; // Less damping for flutter
      }
    });
  }
  
  private getPhysicsProfile(anatomyType: Skeleton['anatomyType']) {
    const profiles = {
      'insect': { massMultiplier: 0.8, dampingMultiplier: 0.7, elasticityMultiplier: 1.3 },
      'bird': { massMultiplier: 0.6, dampingMultiplier: 0.5, elasticityMultiplier: 1.5 },
      'magical': { massMultiplier: 0.4, dampingMultiplier: 0.3, elasticityMultiplier: 2.0 },
      'mechanical': { massMultiplier: 1.2, dampingMultiplier: 0.9, elasticityMultiplier: 0.8 },
      'mammal': { massMultiplier: 1.0, dampingMultiplier: 0.8, elasticityMultiplier: 1.0 },
      'abstract': { massMultiplier: 0.7, dampingMultiplier: 0.6, elasticityMultiplier: 1.2 }
    };
    
    return profiles[anatomyType] || profiles['abstract'];
  }
  
  private getBoneDepth(skeleton: Skeleton, boneId: string): number {
    const bone = skeleton.bones.get(boneId);
    if (!bone || !bone.parent) return 0;
    return 1 + this.getBoneDepth(skeleton, bone.parent);
  }
  
  // Animation methods
  async generateRealisticAnimation(
    skeletonId: string,
    animationType: 'idle' | 'win' | 'scatter' | 'custom',
    duration: number = 2.0
  ): Promise<any> {
    const skeleton = this.skeletons.get(skeletonId);
    if (!skeleton) throw new Error('Skeleton not found');
    
    console.log(`🎭 Generating ${animationType} animation for ${skeleton.anatomyType} skeleton...`);
    
    const animation = {
      id: `${skeletonId}-${animationType}-${Date.now()}`,
      name: `${animationType} Animation`,
      duration,
      tracks: new Map<string, any>()
    };
    
    // Generate animation tracks for each bone
    skeleton.bones.forEach(bone => {
      const track = this.generateBoneAnimation(bone, animationType, duration, skeleton);
      animation.tracks.set(bone.id, track);
    });
    
    // Apply IK constraints to tracks
    this.applyIKToAnimation(animation, skeleton);
    
    // Add secondary motion and physics
    this.addSecondaryMotion(animation, skeleton);
    
    this.activeAnimations.set(animation.id, animation);
    
    console.log(`✅ Generated ${animationType} animation with ${animation.tracks.size} bone tracks`);
    return animation;
  }
  
  private generateBoneAnimation(
    bone: Bone, 
    animationType: string, 
    duration: number,
    skeleton: Skeleton
  ) {
    const keyframes = [];
    const frameCount = Math.ceil(duration * 30); // 30 FPS
    
    for (let frame = 0; frame <= frameCount; frame++) {
      const time = (frame / frameCount) * duration;
      const normalizedTime = time / duration;
      
      const keyframe = {
        time,
        transform: this.calculateBoneTransform(bone, animationType, normalizedTime, skeleton)
      };
      
      keyframes.push(keyframe);
    }
    
    return { keyframes };
  }
  
  private calculateBoneTransform(
    bone: Bone,
    animationType: string,
    normalizedTime: number,
    skeleton: Skeleton
  ) {
    let rotation = bone.originalRotation;
    let scaleX = bone.originalScaleX;
    let scaleY = bone.originalScaleY;
    let x = bone.originalX;
    let y = bone.originalY;
    
    const t = normalizedTime;
    const flexibility = bone.flexibility;
    const importance = bone.importance;
    
    if (bone.anatomyType.includes('wing')) {
      // Wing-specific animation
      switch (animationType) {
        case 'idle':
          // Natural wing flutter
          const flutterSpeed = skeleton.anatomyType === 'insect' ? 8 : 4;
          const wingPhase = bone.id.includes('left') ? 0 : Math.PI;
          rotation += Math.sin(t * Math.PI * flutterSpeed + wingPhase) * flexibility * 0.5;
          scaleY += Math.sin(t * Math.PI * flutterSpeed * 2 + wingPhase) * flexibility * 0.2;
          break;
          
        case 'win':
          // Dramatic wing spread
          const spreadAmount = Math.sin(t * Math.PI * 2) * flexibility;
          rotation += spreadAmount * 0.8;
          scaleX += spreadAmount * 0.3;
          scaleY += spreadAmount * 0.2;
          break;
      }
    } else if (bone.anatomyType.includes('body')) {
      // Body animation
      switch (animationType) {
        case 'idle':
          // Gentle breathing
          const breathingRate = 2;
          scaleX += Math.sin(t * Math.PI * breathingRate) * flexibility * 0.05;
          scaleY += Math.sin(t * Math.PI * breathingRate) * flexibility * 0.05;
          break;
          
        case 'win':
          // Celebration pulse
          const pulseIntensity = Math.sin(t * Math.PI * 4) * importance;
          scaleX += pulseIntensity * 0.2;
          scaleY += pulseIntensity * 0.2;
          break;
      }
    }
    
    // Apply constraints
    rotation = Math.max(bone.constraints.rotationMin, 
               Math.min(bone.constraints.rotationMax, rotation));
    scaleX = Math.max(bone.constraints.scaleMin, 
             Math.min(bone.constraints.scaleMax, scaleX));
    scaleY = Math.max(bone.constraints.scaleMin, 
             Math.min(bone.constraints.scaleMax, scaleY));
    
    return { x, y, rotation, scaleX, scaleY };
  }
  
  private applyIKToAnimation(animation: any, skeleton: Skeleton): void {
    // Apply IK constraints to create more natural motion
    skeleton.ikConstraints.forEach(ikConstraint => {
      if (ikConstraint.naturalMotion) {
        // Implement IK solving for natural motion
        // This would be a complex IK solver implementation
        console.log(`🔗 Applying IK constraint: ${ikConstraint.name}`);
      }
    });
  }
  
  private addSecondaryMotion(animation: any, skeleton: Skeleton): void {
    // Add secondary motion based on physics properties
    skeleton.bones.forEach(bone => {
      const track = animation.tracks.get(bone.id);
      if (!track) return;
      
      // Add physics-based secondary motion
      track.keyframes.forEach((keyframe: any, index: number) => {
        if (index > 0) {
          const prevKeyframe = track.keyframes[index - 1];
          const deltaTime = keyframe.time - prevKeyframe.time;
          
          // Apply damping and elasticity
          const velocityX = (keyframe.transform.x - prevKeyframe.transform.x) / deltaTime;
          const velocityY = (keyframe.transform.y - prevKeyframe.transform.y) / deltaTime;
          
          // Add slight overshoot based on elasticity
          keyframe.transform.x += velocityX * bone.physics.elasticity * 0.1;
          keyframe.transform.y += velocityY * bone.physics.elasticity * 0.1;
          
          // Apply damping
          keyframe.transform.x *= (1 - bone.physics.damping * 0.1);
          keyframe.transform.y *= (1 - bone.physics.damping * 0.1);
        }
      });
    });
  }
  
  getSkeleton(skeletonId: string): Skeleton | undefined {
    return this.skeletons.get(skeletonId);
  }
  
  getAnimation(animationId: string): any {
    return this.activeAnimations.get(animationId);
  }
  
  // Export skeleton to Spine JSON format
  exportToSpineJSON(skeletonId: string): any {
    const skeleton = this.skeletons.get(skeletonId);
    if (!skeleton) throw new Error('Skeleton not found');
    
    console.log('📄 Exporting skeleton to Spine JSON format...');
    
    const spineData = {
      skeleton: {
        hash: skeleton.id,
        spine: "4.1.23",
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        fps: 30,
        images: "./images/",
        audio: "./audio/"
      },
      bones: Array.from(skeleton.bones.values()).map(bone => ({
        name: bone.name,
        parent: bone.parent,
        length: bone.length,
        x: bone.x,
        y: bone.y,
        rotation: bone.rotation * (180 / Math.PI), // Convert to degrees
        scaleX: bone.scaleX,
        scaleY: bone.scaleY
      })),
      slots: Array.from(skeleton.attachments.values()).map(attachment => ({
        name: attachment.id,
        bone: attachment.boneId,
        attachment: attachment.textureId
      })),
      ik: Array.from(skeleton.ikConstraints.values()).map(ik => ({
        name: ik.name,
        order: 0,
        bones: ik.bones,
        target: ik.target,
        bendPositive: ik.bendDirection > 0,
        mix: ik.mix
      })),
      skins: {
        default: {
          name: "default"
        }
      },
      animations: {}
    };
    
    console.log('✅ Spine JSON export complete');
    return spineData;
  }
}

export const aiBoneSystem = new AIBoneSystem();