// Advanced Skeletal Animation System - Professional Grade
// Implements IK/FK chains, bone constraints, and hierarchical animation

import * as PIXI from 'pixi.js';

// Core skeletal structures
export interface Bone {
  id: string;
  name: string;
  parent: string | null;
  children: string[];
  
  // Transform data
  localPosition: { x: number; y: number };
  worldPosition: { x: number; y: number };
  localRotation: number;
  worldRotation: number;
  localScale: { x: number; y: number };
  worldScale: { x: number; y: number };
  
  // Animation data
  length: number;
  restPose: {
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
  };
  
  // Constraints
  constraints: BoneConstraint[];
  
  // Physics properties
  mass: number;
  damping: number;
  stiffness: number;
  isKinematic: boolean;
}

export interface BoneConstraint {
  type: 'rotation' | 'position' | 'scale' | 'ik' | 'lookAt' | 'copyTransform';
  target?: string; // Target bone ID
  influence: number; // 0.0 to 1.0
  
  // Constraint-specific data
  rotationLimits?: { min: number; max: number };
  positionLimits?: {
    minX: number; maxX: number;
    minY: number; maxY: number;
  };
  scaleLimits?: {
    minX: number; maxX: number;
    minY: number; maxY: number;
  };
  
  // IK specific
  ikChainLength?: number;
  ikTarget?: { x: number; y: number };
  ikPoleTarget?: { x: number; y: number };
  ikIterations?: number;
  ikTolerance?: number;
}

export interface IKChain {
  id: string;
  name: string;
  bones: string[]; // Ordered from root to effector
  target: { x: number; y: number };
  poleTarget?: { x: number; y: number };
  iterations: number;
  tolerance: number;
  enabled: boolean;
  influence: number;
}

export interface VertexWeight {
  boneId: string;
  weight: number;
}

export interface SkeletalMesh {
  vertices: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  weights: VertexWeight[][]; // Per vertex weights
  bindPoses: { [boneId: string]: Matrix2D };
  
  // Animation state
  currentPose: { [boneId: string]: Matrix2D };
  deformedVertices: Float32Array;
  
  // Morph targets
  morphTargets: { [name: string]: Float32Array };
  morphWeights: { [name: string]: number };
}

class Matrix2D {
  private matrix: Float32Array;
  
  constructor() {
    this.matrix = new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }
  
  static identity(): Matrix2D {
    return new Matrix2D();
  }
  
  static translation(x: number, y: number): Matrix2D {
    const m = new Matrix2D();
    m.matrix[6] = x;
    m.matrix[7] = y;
    return m;
  }
  
  static rotation(angle: number): Matrix2D {
    const m = new Matrix2D();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    m.matrix[0] = cos;
    m.matrix[1] = -sin;
    m.matrix[3] = sin;
    m.matrix[4] = cos;
    return m;
  }
  
  static scale(x: number, y: number): Matrix2D {
    const m = new Matrix2D();
    m.matrix[0] = x;
    m.matrix[4] = y;
    return m;
  }
  
  multiply(other: Matrix2D): Matrix2D {
    const result = new Matrix2D();
    const a = this.matrix;
    const b = other.matrix;
    const r = result.matrix;
    
    r[0] = a[0] * b[0] + a[1] * b[3] + a[2] * b[6];
    r[1] = a[0] * b[1] + a[1] * b[4] + a[2] * b[7];
    r[2] = a[0] * b[2] + a[1] * b[5] + a[2] * b[8];
    r[3] = a[3] * b[0] + a[4] * b[3] + a[5] * b[6];
    r[4] = a[3] * b[1] + a[4] * b[4] + a[5] * b[7];
    r[5] = a[3] * b[2] + a[4] * b[5] + a[5] * b[8];
    r[6] = a[6] * b[0] + a[7] * b[3] + a[8] * b[6];
    r[7] = a[6] * b[1] + a[7] * b[4] + a[8] * b[7];
    r[8] = a[6] * b[2] + a[7] * b[5] + a[8] * b[8];
    
    return result;
  }
  
  inverse(): Matrix2D {
    const m = this.matrix;
    const det = m[0] * (m[4] * m[8] - m[7] * m[5]) -
                m[1] * (m[3] * m[8] - m[5] * m[6]) +
                m[2] * (m[3] * m[7] - m[4] * m[6]);
    
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }
    
    const result = new Matrix2D();
    const inv = result.matrix;
    const invDet = 1.0 / det;
    
    inv[0] = (m[4] * m[8] - m[7] * m[5]) * invDet;
    inv[1] = (m[2] * m[7] - m[1] * m[8]) * invDet;
    inv[2] = (m[1] * m[5] - m[2] * m[4]) * invDet;
    inv[3] = (m[5] * m[6] - m[3] * m[8]) * invDet;
    inv[4] = (m[0] * m[8] - m[2] * m[6]) * invDet;
    inv[5] = (m[2] * m[3] - m[0] * m[5]) * invDet;
    inv[6] = (m[3] * m[7] - m[4] * m[6]) * invDet;
    inv[7] = (m[1] * m[6] - m[0] * m[7]) * invDet;
    inv[8] = (m[0] * m[4] - m[1] * m[3]) * invDet;
    
    return result;
  }
  
  transformPoint(x: number, y: number): { x: number; y: number } {
    const m = this.matrix;
    return {
      x: m[0] * x + m[3] * y + m[6],
      y: m[1] * x + m[4] * y + m[7]
    };
  }
  
  getTranslation(): { x: number; y: number } {
    return { x: this.matrix[6], y: this.matrix[7] };
  }
  
  getRotation(): number {
    return Math.atan2(this.matrix[1], this.matrix[0]);
  }
  
  getScale(): { x: number; y: number } {
    const scaleX = Math.sqrt(this.matrix[0] * this.matrix[0] + this.matrix[1] * this.matrix[1]);
    const scaleY = Math.sqrt(this.matrix[3] * this.matrix[3] + this.matrix[4] * this.matrix[4]);
    return { x: scaleX, y: scaleY };
  }
}

export class AdvancedSkeletalSystem {
  private bones: Map<string, Bone> = new Map();
  private ikChains: Map<string, IKChain> = new Map();
  private meshes: Map<string, SkeletalMesh> = new Map();
  private rootBones: string[] = [];
  
  // Animation state
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  
  constructor() {
    console.log('[AdvancedSkeletal] Professional skeletal system initialized');
  }
  
  // Bone management
  addBone(bone: Bone): void {
    this.bones.set(bone.id, bone);
    
    if (!bone.parent) {
      this.rootBones.push(bone.id);
    } else {
      const parent = this.bones.get(bone.parent);
      if (parent && !parent.children.includes(bone.id)) {
        parent.children.push(bone.id);
      }
    }
    
    console.log(`[AdvancedSkeletal] Added bone: ${bone.name} (${bone.id})`);
  }
  
  createBoneHierarchy(boneData: any[]): void {
    // Clear existing hierarchy
    this.bones.clear();
    this.rootBones = [];
    
    // First pass: create all bones
    for (const data of boneData) {
      const bone: Bone = {
        id: data.id,
        name: data.name,
        parent: data.parent || null,
        children: [],
        localPosition: data.position || { x: 0, y: 0 },
        worldPosition: { x: 0, y: 0 },
        localRotation: data.rotation || 0,
        worldRotation: 0,
        localScale: data.scale || { x: 1, y: 1 },
        worldScale: { x: 1, y: 1 },
        length: data.length || 100,
        restPose: {
          position: data.position || { x: 0, y: 0 },
          rotation: data.rotation || 0,
          scale: data.scale || { x: 1, y: 1 }
        },
        constraints: data.constraints || [],
        mass: data.mass || 1.0,
        damping: data.damping || 0.9,
        stiffness: data.stiffness || 1.0,
        isKinematic: data.isKinematic || false
      };
      
      this.addBone(bone);
    }
    
    // Second pass: update world transforms
    this.updateWorldTransforms();
  }
  
  // IK System
  addIKChain(chain: IKChain): void {
    this.ikChains.set(chain.id, chain);
    console.log(`[AdvancedSkeletal] Added IK chain: ${chain.name} with ${chain.bones.length} bones`);
  }
  
  solveIK(chainId: string): void {
    const chain = this.ikChains.get(chainId);
    if (!chain || !chain.enabled) return;
    
    // FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm
    this.solveFABRIK(chain);
  }
  
  private solveFABRIK(chain: IKChain): void {
    const bones = chain.bones.map(id => this.bones.get(id)!).filter(Boolean);
    if (bones.length < 2) return;
    
    const target = chain.target;
    const tolerance = chain.tolerance;
    let iterations = chain.iterations;
    
    // Calculate bone lengths
    const boneLengths = bones.slice(0, -1).map(bone => bone.length);
    const totalLength = boneLengths.reduce((sum, len) => sum + len, 0);
    
    // Check if target is reachable
    const rootPos = bones[0].worldPosition;
    const distToTarget = Math.sqrt(
      Math.pow(target.x - rootPos.x, 2) + Math.pow(target.y - rootPos.y, 2)
    );
    
    if (distToTarget > totalLength) {
      // Target unreachable - stretch toward target
      let currentPos = { ...rootPos };
      const direction = {
        x: (target.x - rootPos.x) / distToTarget,
        y: (target.y - rootPos.y) / distToTarget
      };
      
      for (let i = 0; i < bones.length - 1; i++) {
        const nextPos = {
          x: currentPos.x + direction.x * boneLengths[i],
          y: currentPos.y + direction.y * boneLengths[i]
        };
        
        bones[i + 1].worldPosition = nextPos;
        currentPos = nextPos;
      }
      return;
    }
    
    // FABRIK iterations
    const originalRoot = { ...bones[0].worldPosition };
    
    while (iterations > 0) {
      // Forward pass - start from end effector
      bones[bones.length - 1].worldPosition = { ...target };
      
      for (let i = bones.length - 2; i >= 0; i--) {
        const currentBone = bones[i];
        const nextBone = bones[i + 1];
        
        const direction = {
          x: currentBone.worldPosition.x - nextBone.worldPosition.x,
          y: currentBone.worldPosition.y - nextBone.worldPosition.y
        };
        
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (distance > 0) {
          const normalizedDir = {
            x: direction.x / distance,
            y: direction.y / distance
          };
          
          currentBone.worldPosition = {
            x: nextBone.worldPosition.x + normalizedDir.x * boneLengths[i],
            y: nextBone.worldPosition.y + normalizedDir.y * boneLengths[i]
          };
        }
      }
      
      // Backward pass - start from root
      bones[0].worldPosition = originalRoot;
      
      for (let i = 1; i < bones.length; i++) {
        const prevBone = bones[i - 1];
        const currentBone = bones[i];
        
        const direction = {
          x: currentBone.worldPosition.x - prevBone.worldPosition.x,
          y: currentBone.worldPosition.y - prevBone.worldPosition.y
        };
        
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (distance > 0) {
          const normalizedDir = {
            x: direction.x / distance,
            y: direction.y / distance
          };
          
          currentBone.worldPosition = {
            x: prevBone.worldPosition.x + normalizedDir.x * boneLengths[i - 1],
            y: prevBone.worldPosition.y + normalizedDir.y * boneLengths[i - 1]
          };
        }
      }
      
      // Check convergence
      const endEffector = bones[bones.length - 1];
      const distanceToTarget = Math.sqrt(
        Math.pow(endEffector.worldPosition.x - target.x, 2) +
        Math.pow(endEffector.worldPosition.y - target.y, 2)
      );
      
      if (distanceToTarget < tolerance) {
        break;
      }
      
      iterations--;
    }
    
    // Update bone rotations based on new positions
    this.updateBoneRotationsFromPositions(bones);
  }
  
  private updateBoneRotationsFromPositions(bones: Bone[]): void {
    for (let i = 0; i < bones.length - 1; i++) {
      const currentBone = bones[i];
      const nextBone = bones[i + 1];
      
      const direction = {
        x: nextBone.worldPosition.x - currentBone.worldPosition.x,
        y: nextBone.worldPosition.y - currentBone.worldPosition.y
      };
      
      currentBone.worldRotation = Math.atan2(direction.y, direction.x);
      
      // Convert to local rotation
      if (currentBone.parent) {
        const parent = this.bones.get(currentBone.parent)!;
        currentBone.localRotation = currentBone.worldRotation - parent.worldRotation;
      } else {
        currentBone.localRotation = currentBone.worldRotation;
      }
    }
  }
  
  // Transform updates
  updateWorldTransforms(): void {
    // Update root bones first
    for (const rootId of this.rootBones) {
      this.updateBoneWorldTransform(rootId);
    }
  }
  
  private updateBoneWorldTransform(boneId: string): void {
    const bone = this.bones.get(boneId);
    if (!bone) return;
    
    if (bone.parent) {
      const parent = this.bones.get(bone.parent)!;
      
      // Calculate world transform from parent
      const parentMatrix = this.getBoneWorldMatrix(parent);
      const localMatrix = this.getBoneLocalMatrix(bone);
      const worldMatrix = parentMatrix.multiply(localMatrix);
      
      const worldPos = worldMatrix.getTranslation();
      bone.worldPosition = worldPos;
      bone.worldRotation = worldMatrix.getRotation();
      bone.worldScale = worldMatrix.getScale();
      
    } else {
      // Root bone - world transform equals local transform
      bone.worldPosition = { ...bone.localPosition };
      bone.worldRotation = bone.localRotation;
      bone.worldScale = { ...bone.localScale };
    }
    
    // Update children recursively
    for (const childId of bone.children) {
      this.updateBoneWorldTransform(childId);
    }
  }
  
  private getBoneLocalMatrix(bone: Bone): Matrix2D {
    const translation = Matrix2D.translation(bone.localPosition.x, bone.localPosition.y);
    const rotation = Matrix2D.rotation(bone.localRotation);
    const scale = Matrix2D.scale(bone.localScale.x, bone.localScale.y);
    
    return translation.multiply(rotation).multiply(scale);
  }
  
  private getBoneWorldMatrix(bone: Bone): Matrix2D {
    const translation = Matrix2D.translation(bone.worldPosition.x, bone.worldPosition.y);
    const rotation = Matrix2D.rotation(bone.worldRotation);
    const scale = Matrix2D.scale(bone.worldScale.x, bone.worldScale.y);
    
    return translation.multiply(rotation).multiply(scale);
  }
  
  // Constraint system
  applyConstraints(): void {
    for (const bone of this.bones.values()) {
      for (const constraint of bone.constraints) {
        this.applyConstraint(bone, constraint);
      }
    }
  }
  
  private applyConstraint(bone: Bone, constraint: BoneConstraint): void {
    switch (constraint.type) {
      case 'rotation':
        this.applyRotationConstraint(bone, constraint);
        break;
      case 'position':
        this.applyPositionConstraint(bone, constraint);
        break;
      case 'scale':
        this.applyScaleConstraint(bone, constraint);
        break;
      case 'ik':
        // IK constraints are handled separately
        break;
      case 'lookAt':
        this.applyLookAtConstraint(bone, constraint);
        break;
      case 'copyTransform':
        this.applyCopyTransformConstraint(bone, constraint);
        break;
    }
  }
  
  private applyRotationConstraint(bone: Bone, constraint: BoneConstraint): void {
    if (!constraint.rotationLimits) return;
    
    const { min, max } = constraint.rotationLimits;
    const influence = constraint.influence;
    
    let constrainedRotation = bone.localRotation;
    
    // Normalize angle to [-π, π]
    while (constrainedRotation > Math.PI) constrainedRotation -= 2 * Math.PI;
    while (constrainedRotation < -Math.PI) constrainedRotation += 2 * Math.PI;
    
    // Apply limits
    constrainedRotation = Math.max(min, Math.min(max, constrainedRotation));
    
    // Blend with influence
    bone.localRotation = this.lerp(bone.localRotation, constrainedRotation, influence);
  }
  
  private applyPositionConstraint(bone: Bone, constraint: BoneConstraint): void {
    if (!constraint.positionLimits) return;
    
    const { minX, maxX, minY, maxY } = constraint.positionLimits;
    const influence = constraint.influence;
    
    const constrainedPos = {
      x: Math.max(minX, Math.min(maxX, bone.localPosition.x)),
      y: Math.max(minY, Math.min(maxY, bone.localPosition.y))
    };
    
    bone.localPosition.x = this.lerp(bone.localPosition.x, constrainedPos.x, influence);
    bone.localPosition.y = this.lerp(bone.localPosition.y, constrainedPos.y, influence);
  }
  
  private applyScaleConstraint(bone: Bone, constraint: BoneConstraint): void {
    if (!constraint.scaleLimits) return;
    
    const { minX, maxX, minY, maxY } = constraint.scaleLimits;
    const influence = constraint.influence;
    
    const constrainedScale = {
      x: Math.max(minX, Math.min(maxX, bone.localScale.x)),
      y: Math.max(minY, Math.min(maxY, bone.localScale.y))
    };
    
    bone.localScale.x = this.lerp(bone.localScale.x, constrainedScale.x, influence);
    bone.localScale.y = this.lerp(bone.localScale.y, constrainedScale.y, influence);
  }
  
  private applyLookAtConstraint(bone: Bone, constraint: BoneConstraint): void {
    if (!constraint.target) return;
    
    const targetBone = this.bones.get(constraint.target);
    if (!targetBone) return;
    
    const direction = {
      x: targetBone.worldPosition.x - bone.worldPosition.x,
      y: targetBone.worldPosition.y - bone.worldPosition.y
    };
    
    const targetRotation = Math.atan2(direction.y, direction.x);
    const influence = constraint.influence;
    
    // Convert to local rotation
    let localTargetRotation = targetRotation;
    if (bone.parent) {
      const parent = this.bones.get(bone.parent)!;
      localTargetRotation = targetRotation - parent.worldRotation;
    }
    
    bone.localRotation = this.lerpAngle(bone.localRotation, localTargetRotation, influence);
  }
  
  private applyCopyTransformConstraint(bone: Bone, constraint: BoneConstraint): void {
    if (!constraint.target) return;
    
    const targetBone = this.bones.get(constraint.target);
    if (!targetBone) return;
    
    const influence = constraint.influence;
    
    // Copy transform with influence
    bone.localPosition.x = this.lerp(bone.localPosition.x, targetBone.localPosition.x, influence);
    bone.localPosition.y = this.lerp(bone.localPosition.y, targetBone.localPosition.y, influence);
    bone.localRotation = this.lerpAngle(bone.localRotation, targetBone.localRotation, influence);
    bone.localScale.x = this.lerp(bone.localScale.x, targetBone.localScale.x, influence);
    bone.localScale.y = this.lerp(bone.localScale.y, targetBone.localScale.y, influence);
  }
  
  // Utility functions
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
  }
  
  // Mesh deformation
  addMesh(id: string, mesh: SkeletalMesh): void {
    this.meshes.set(id, mesh);
    console.log(`[AdvancedSkeletal] Added skeletal mesh: ${id}`);
  }
  
  deformMesh(meshId: string): void {
    const mesh = this.meshes.get(meshId);
    if (!mesh) return;
    
    const vertexCount = mesh.vertices.length / 2;
    mesh.deformedVertices = new Float32Array(mesh.vertices.length);
    
    // Apply skeletal deformation
    for (let i = 0; i < vertexCount; i++) {
      const vertexIndex = i * 2;
      const originalX = mesh.vertices[vertexIndex];
      const originalY = mesh.vertices[vertexIndex + 1];
      
      let deformedX = 0;
      let deformedY = 0;
      let totalWeight = 0;
      
      const weights = mesh.weights[i] || [];
      
      for (const weight of weights) {
        const bone = this.bones.get(weight.boneId);
        if (!bone) continue;
        
        // Get bind pose matrix (inverse of bone's rest pose)
        const bindPose = mesh.bindPoses[weight.boneId];
        if (!bindPose) continue;
        
        // Get current bone matrix
        const currentPose = this.getBoneWorldMatrix(bone);
        
        // Apply transformation: bindPose^-1 * currentPose
        const transformMatrix = bindPose.inverse().multiply(currentPose);
        const transformed = transformMatrix.transformPoint(originalX, originalY);
        
        deformedX += transformed.x * weight.weight;
        deformedY += transformed.y * weight.weight;
        totalWeight += weight.weight;
      }
      
      if (totalWeight > 0) {
        mesh.deformedVertices[vertexIndex] = deformedX / totalWeight;
        mesh.deformedVertices[vertexIndex + 1] = deformedY / totalWeight;
      } else {
        // No weights - use original position
        mesh.deformedVertices[vertexIndex] = originalX;
        mesh.deformedVertices[vertexIndex + 1] = originalY;
      }
    }
    
    // Apply morph targets
    this.applyMorphTargets(mesh);
  }
  
  private applyMorphTargets(mesh: SkeletalMesh): void {
    const vertexCount = mesh.vertices.length / 2;
    
    for (const [morphName, morphTarget] of Object.entries(mesh.morphTargets)) {
      const weight = mesh.morphWeights[morphName] || 0;
      if (weight === 0) continue;
      
      for (let i = 0; i < vertexCount; i++) {
        const vertexIndex = i * 2;
        
        mesh.deformedVertices[vertexIndex] += (morphTarget[vertexIndex] - mesh.vertices[vertexIndex]) * weight;
        mesh.deformedVertices[vertexIndex + 1] += (morphTarget[vertexIndex + 1] - mesh.vertices[vertexIndex + 1]) * weight;
      }
    }
  }
  
  // Animation control
  update(deltaTime: number): void {
    if (!this.isPlaying) return;
    
    this.currentTime += deltaTime;
    
    // Update world transforms
    this.updateWorldTransforms();
    
    // Apply constraints
    this.applyConstraints();
    
    // Solve IK chains
    for (const chain of this.ikChains.values()) {
      if (chain.enabled) {
        this.solveIK(chain.id);
      }
    }
    
    // Deform meshes
    for (const meshId of this.meshes.keys()) {
      this.deformMesh(meshId);
    }
  }
  
  play(): void {
    this.isPlaying = true;
    console.log('[AdvancedSkeletal] Animation playing');
  }
  
  pause(): void {
    this.isPlaying = false;
    console.log('[AdvancedSkeletal] Animation paused');
  }
  
  reset(): void {
    this.currentTime = 0;
    this.isPlaying = false;
    
    // Reset all bones to rest pose
    for (const bone of this.bones.values()) {
      bone.localPosition = { ...bone.restPose.position };
      bone.localRotation = bone.restPose.rotation;
      bone.localScale = { ...bone.restPose.scale };
    }
    
    this.updateWorldTransforms();
    console.log('[AdvancedSkeletal] Animation reset');
  }
  
  // Getters
  getBone(id: string): Bone | undefined {
    return this.bones.get(id);
  }
  
  getAllBones(): Bone[] {
    return Array.from(this.bones.values());
  }
  
  getIKChain(id: string): IKChain | undefined {
    return this.ikChains.get(id);
  }
  
  getMesh(id: string): SkeletalMesh | undefined {
    return this.meshes.get(id);
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }
}

export { Matrix2D };
export const advancedSkeletalSystem = new AdvancedSkeletalSystem();