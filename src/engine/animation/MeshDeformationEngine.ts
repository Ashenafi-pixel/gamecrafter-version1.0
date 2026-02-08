// Advanced Mesh Deformation and Vertex Animation Engine
// Implements FFD, morph targets, lattice deformation, and complex shape modifications

import * as PIXI from 'pixi.js';
import { Matrix2D } from './AdvancedSkeletalSystem';

// Core deformation structures
export interface DeformationLattice {
  id: string;
  name: string;
  controlPoints: ControlPoint[][];
  resolution: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  influence: number;
  enabled: boolean;
}

export interface ControlPoint {
  originalPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  weight: number;
  locked: boolean;
}

export interface MorphTarget {
  id: string;
  name: string;
  vertices: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  weight: number;
  enabled: boolean;
}

export interface VertexGroup {
  id: string;
  name: string;
  vertices: number[]; // Vertex indices
  weight: number;
  deformationType: 'rigid' | 'soft' | 'fluid' | 'elastic';
}

export interface DeformationConstraint {
  type: 'preserve_volume' | 'preserve_length' | 'pin_vertex' | 'smooth_surface';
  vertices: number[];
  strength: number;
  enabled: boolean;
}

export interface FluidSimulationData {
  viscosity: number;
  density: number;
  pressure: number[];
  velocity: { x: number; y: number }[];
  forces: { x: number; y: number }[];
}

export interface ElasticProperties {
  stiffness: number;
  damping: number;
  restLength: number;
  maxStretch: number;
}

export class MeshDeformationEngine {
  private meshes: Map<string, DeformableMesh> = new Map();
  private lattices: Map<string, DeformationLattice> = new Map();
  private morphTargets: Map<string, MorphTarget[]> = new Map();
  private vertexGroups: Map<string, VertexGroup[]> = new Map();
  private constraints: Map<string, DeformationConstraint[]> = new Map();
  
  // Simulation data
  private fluidData: Map<string, FluidSimulationData> = new Map();
  private elasticData: Map<string, ElasticProperties[]> = new Map();
  
  // Performance optimization
  private dirtyMeshes: Set<string> = new Set();
  private updateQueue: string[] = [];
  
  constructor() {
    console.log('[MeshDeformation] Advanced mesh deformation engine initialized');
  }
  
  // Mesh management
  addMesh(mesh: DeformableMesh): void {
    this.meshes.set(mesh.id, mesh);
    this.morphTargets.set(mesh.id, []);
    this.vertexGroups.set(mesh.id, []);
    this.constraints.set(mesh.id, []);
    
    // Initialize original vertex data
    mesh.originalVertices = new Float32Array(mesh.vertices);
    mesh.deformedVertices = new Float32Array(mesh.vertices);
    
    console.log(`[MeshDeformation] Added mesh: ${mesh.id} with ${mesh.vertices.length / 2} vertices`);
  }
  
  getMesh(id: string): DeformableMesh | undefined {
    return this.meshes.get(id);
  }
  
  // FFD (Free Form Deformation) System
  createFFDLattice(
    meshId: string,
    bounds: { x: number; y: number; width: number; height: number },
    resolution: { x: number; y: number }
  ): string {
    const latticeId = `${meshId}_lattice_${Date.now()}`;
    
    // Create control point grid
    const controlPoints: ControlPoint[][] = [];
    for (let i = 0; i <= resolution.x; i++) {
      controlPoints[i] = [];
      for (let j = 0; j <= resolution.y; j++) {
        const x = bounds.x + (bounds.width * i) / resolution.x;
        const y = bounds.y + (bounds.height * j) / resolution.y;
        
        controlPoints[i][j] = {
          originalPosition: { x, y },
          currentPosition: { x, y },
          weight: 1.0,
          locked: false
        };
      }
    }
    
    const lattice: DeformationLattice = {
      id: latticeId,
      name: `FFD Lattice ${resolution.x}x${resolution.y}`,
      controlPoints,
      resolution,
      bounds,
      influence: 1.0,
      enabled: true
    };
    
    this.lattices.set(latticeId, lattice);
    this.markMeshDirty(meshId);
    
    console.log(`[MeshDeformation] Created FFD lattice ${latticeId} (${resolution.x}x${resolution.y})`);
    return latticeId;
  }
  
  moveControlPoint(latticeId: string, u: number, v: number, newPos: { x: number; y: number }): void {
    const lattice = this.lattices.get(latticeId);
    if (!lattice || u < 0 || u > lattice.resolution.x || v < 0 || v > lattice.resolution.y) return;
    
    const controlPoint = lattice.controlPoints[u][v];
    if (controlPoint.locked) return;
    
    controlPoint.currentPosition = { ...newPos };
    
    // Mark all affected meshes as dirty
    for (const meshId of this.meshes.keys()) {
      this.markMeshDirty(meshId);
    }
  }
  
  applyFFDDeformation(meshId: string, latticeId: string): void {
    const mesh = this.meshes.get(meshId);
    const lattice = this.lattices.get(latticeId);
    
    if (!mesh || !lattice || !lattice.enabled) return;
    
    const vertexCount = mesh.vertices.length / 2;
    
    for (let i = 0; i < vertexCount; i++) {
      const vertexIndex = i * 2;
      const x = mesh.originalVertices[vertexIndex];
      const y = mesh.originalVertices[vertexIndex + 1];
      
      // Check if vertex is within lattice bounds
      if (x < lattice.bounds.x || x > lattice.bounds.x + lattice.bounds.width ||
          y < lattice.bounds.y || y > lattice.bounds.y + lattice.bounds.height) {
        // Outside bounds - no deformation
        mesh.deformedVertices[vertexIndex] = x;
        mesh.deformedVertices[vertexIndex + 1] = y;
        continue;
      }
      
      // Calculate local coordinates within lattice (0-1 range)
      const localU = (x - lattice.bounds.x) / lattice.bounds.width;
      const localV = (y - lattice.bounds.y) / lattice.bounds.height;
      
      // Apply trivariate Bernstein polynomial interpolation
      const deformedPos = this.evaluateFFD(lattice, localU, localV);
      
      // Blend with original position based on influence
      mesh.deformedVertices[vertexIndex] = this.lerp(x, deformedPos.x, lattice.influence);
      mesh.deformedVertices[vertexIndex + 1] = this.lerp(y, deformedPos.y, lattice.influence);
    }
  }
  
  private evaluateFFD(lattice: DeformationLattice, u: number, v: number): { x: number; y: number } {
    const { resolution, controlPoints } = lattice;
    let x = 0, y = 0;
    
    for (let i = 0; i <= resolution.x; i++) {
      for (let j = 0; j <= resolution.y; j++) {
        const cp = controlPoints[i][j];
        
        // Bernstein basis functions
        const basisU = this.bernstein(resolution.x, i, u);
        const basisV = this.bernstein(resolution.y, j, v);
        const weight = basisU * basisV * cp.weight;
        
        x += cp.currentPosition.x * weight;
        y += cp.currentPosition.y * weight;
      }
    }
    
    return { x, y };
  }
  
  private bernstein(n: number, i: number, t: number): number {
    return this.binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
  }
  
  private binomialCoefficient(n: number, k: number): number {
    if (k === 0 || k === n) return 1;
    if (k === 1 || k === n - 1) return n;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return result;
  }
  
  // Morph Target System
  addMorphTarget(meshId: string, morphTarget: MorphTarget): void {
    const targets = this.morphTargets.get(meshId);
    if (!targets) return;
    
    targets.push(morphTarget);
    this.markMeshDirty(meshId);
    
    console.log(`[MeshDeformation] Added morph target: ${morphTarget.name} to mesh ${meshId}`);
  }
  
  setMorphTargetWeight(meshId: string, morphTargetId: string, weight: number): void {
    const targets = this.morphTargets.get(meshId);
    if (!targets) return;
    
    const target = targets.find(t => t.id === morphTargetId);
    if (!target) return;
    
    target.weight = Math.max(0, Math.min(1, weight));
    this.markMeshDirty(meshId);
  }
  
  applyMorphTargets(meshId: string): void {
    const mesh = this.meshes.get(meshId);
    const targets = this.morphTargets.get(meshId);
    
    if (!mesh || !targets) return;
    
    const vertexCount = mesh.vertices.length / 2;
    
    // Start with original vertices
    for (let i = 0; i < mesh.vertices.length; i++) {
      mesh.deformedVertices[i] = mesh.originalVertices[i];
    }
    
    // Apply each enabled morph target
    for (const target of targets) {
      if (!target.enabled || target.weight === 0) continue;
      
      for (let i = 0; i < vertexCount; i++) {
        const vertexIndex = i * 2;
        
        // Blend morph target with current deformed vertices
        const deltaX = target.vertices[vertexIndex] - mesh.originalVertices[vertexIndex];
        const deltaY = target.vertices[vertexIndex + 1] - mesh.originalVertices[vertexIndex + 1];
        
        mesh.deformedVertices[vertexIndex] += deltaX * target.weight;
        mesh.deformedVertices[vertexIndex + 1] += deltaY * target.weight;
      }
    }
  }
  
  // Soft Body Simulation
  initializeSoftBodySimulation(meshId: string, properties: ElasticProperties[]): void {
    this.elasticData.set(meshId, properties);
    this.markMeshDirty(meshId);
    
    console.log(`[MeshDeformation] Initialized soft body simulation for mesh ${meshId}`);
  }
  
  applySoftBodyDeformation(meshId: string, deltaTime: number): void {
    const mesh = this.meshes.get(meshId);
    const elasticProps = this.elasticData.get(meshId);
    
    if (!mesh || !elasticProps) return;
    
    const vertexCount = mesh.vertices.length / 2;
    
    // Initialize velocity if not exists
    if (!mesh.velocity) {
      mesh.velocity = new Float32Array(mesh.vertices.length);
    }
    
    // Apply spring forces
    for (let i = 0; i < vertexCount; i++) {
      const vertexIndex = i * 2;
      const props = elasticProps[i] || elasticProps[0]; // Use first property as default
      
      // Calculate restoring force toward original position
      const originalX = mesh.originalVertices[vertexIndex];
      const originalY = mesh.originalVertices[vertexIndex + 1];
      const currentX = mesh.deformedVertices[vertexIndex];
      const currentY = mesh.deformedVertices[vertexIndex + 1];
      
      const displacementX = currentX - originalX;
      const displacementY = currentY - originalY;
      
      // Hooke's law: F = -k * x
      const forceX = -props.stiffness * displacementX;
      const forceY = -props.stiffness * displacementY;
      
      // Apply damping
      mesh.velocity[vertexIndex] = mesh.velocity[vertexIndex] * props.damping + forceX * deltaTime;
      mesh.velocity[vertexIndex + 1] = mesh.velocity[vertexIndex + 1] * props.damping + forceY * deltaTime;
      
      // Update position
      mesh.deformedVertices[vertexIndex] += mesh.velocity[vertexIndex] * deltaTime;
      mesh.deformedVertices[vertexIndex + 1] += mesh.velocity[vertexIndex + 1] * deltaTime;
      
      // Check stretch limits
      const stretchX = Math.abs(displacementX) / props.restLength;
      const stretchY = Math.abs(displacementY) / props.restLength;
      
      if (stretchX > props.maxStretch || stretchY > props.maxStretch) {
        // Clamp to maximum stretch
        const clampedX = originalX + Math.sign(displacementX) * props.restLength * props.maxStretch;
        const clampedY = originalY + Math.sign(displacementY) * props.restLength * props.maxStretch;
        
        mesh.deformedVertices[vertexIndex] = clampedX;
        mesh.deformedVertices[vertexIndex + 1] = clampedY;
        mesh.velocity[vertexIndex] = 0;
        mesh.velocity[vertexIndex + 1] = 0;
      }
    }
  }
  
  // Fluid Simulation
  initializeFluidSimulation(meshId: string, viscosity: number, density: number): void {
    const mesh = this.meshes.get(meshId);
    if (!mesh) return;
    
    const vertexCount = mesh.vertices.length / 2;
    
    const fluidData: FluidSimulationData = {
      viscosity,
      density,
      pressure: new Array(vertexCount).fill(0),
      velocity: new Array(vertexCount).fill({ x: 0, y: 0 }),
      forces: new Array(vertexCount).fill({ x: 0, y: 0 })
    };
    
    this.fluidData.set(meshId, fluidData);
    console.log(`[MeshDeformation] Initialized fluid simulation for mesh ${meshId}`);
  }
  
  applyFluidDeformation(meshId: string, deltaTime: number): void {
    const mesh = this.meshes.get(meshId);
    const fluid = this.fluidData.get(meshId);
    
    if (!mesh || !fluid) return;
    
    const vertexCount = mesh.vertices.length / 2;
    
    // Calculate pressure gradients
    this.calculatePressureGradients(mesh, fluid);
    
    // Apply fluid forces
    for (let i = 0; i < vertexCount; i++) {
      const vertexIndex = i * 2;
      
      // Pressure force
      const pressureForceX = -fluid.pressure[i] * 0.1; // Simplified gradient
      const pressureForceY = -fluid.pressure[i] * 0.1;
      
      // Viscosity force (simplified)
      const viscosityForceX = fluid.viscosity * fluid.velocity[i].x * -0.1;
      const viscosityForceY = fluid.viscosity * fluid.velocity[i].y * -0.1;
      
      // Total force
      fluid.forces[i].x = pressureForceX + viscosityForceX;
      fluid.forces[i].y = pressureForceY + viscosityForceY;
      
      // Update velocity
      fluid.velocity[i].x += fluid.forces[i].x * deltaTime / fluid.density;
      fluid.velocity[i].y += fluid.forces[i].y * deltaTime / fluid.density;
      
      // Update position
      mesh.deformedVertices[vertexIndex] += fluid.velocity[i].x * deltaTime;
      mesh.deformedVertices[vertexIndex + 1] += fluid.velocity[i].y * deltaTime;
    }
  }
  
  private calculatePressureGradients(mesh: DeformableMesh, fluid: FluidSimulationData): void {
    const vertexCount = mesh.vertices.length / 2;
    
    for (let i = 0; i < vertexCount; i++) {
      // Simplified pressure calculation based on vertex density
      let neighborCount = 0;
      let totalDistance = 0;
      
      const currentX = mesh.deformedVertices[i * 2];
      const currentY = mesh.deformedVertices[i * 2 + 1];
      
      // Check neighboring vertices
      for (let j = 0; j < vertexCount; j++) {
        if (i === j) continue;
        
        const otherX = mesh.deformedVertices[j * 2];
        const otherY = mesh.deformedVertices[j * 2 + 1];
        
        const distance = Math.sqrt(
          (currentX - otherX) * (currentX - otherX) +
          (currentY - otherY) * (currentY - otherY)
        );
        
        if (distance < 50) { // Influence radius
          neighborCount++;
          totalDistance += distance;
        }
      }
      
      // Calculate pressure based on local density
      const avgDistance = neighborCount > 0 ? totalDistance / neighborCount : 50;
      fluid.pressure[i] = Math.max(0, (50 - avgDistance) / 50) * fluid.density;
    }
  }
  
  // Vertex Groups
  createVertexGroup(
    meshId: string,
    name: string,
    vertices: number[],
    deformationType: VertexGroup['deformationType']
  ): string {
    const groups = this.vertexGroups.get(meshId);
    if (!groups) return '';
    
    const groupId = `${meshId}_group_${Date.now()}`;
    
    const group: VertexGroup = {
      id: groupId,
      name,
      vertices,
      weight: 1.0,
      deformationType
    };
    
    groups.push(group);
    this.markMeshDirty(meshId);
    
    console.log(`[MeshDeformation] Created vertex group: ${name} with ${vertices.length} vertices`);
    return groupId;
  }
  
  // Constraints
  addConstraint(meshId: string, constraint: DeformationConstraint): void {
    const constraints = this.constraints.get(meshId);
    if (!constraints) return;
    
    constraints.push(constraint);
    this.markMeshDirty(meshId);
    
    console.log(`[MeshDeformation] Added constraint: ${constraint.type}`);
  }
  
  applyConstraints(meshId: string): void {
    const mesh = this.meshes.get(meshId);
    const constraints = this.constraints.get(meshId);
    
    if (!mesh || !constraints) return;
    
    for (const constraint of constraints) {
      if (!constraint.enabled) continue;
      
      switch (constraint.type) {
        case 'preserve_volume':
          this.applyVolumePreservation(mesh, constraint);
          break;
        case 'preserve_length':
          this.applyLengthPreservation(mesh, constraint);
          break;
        case 'pin_vertex':
          this.applyVertexPinning(mesh, constraint);
          break;
        case 'smooth_surface':
          this.applySurfaceSmoothing(mesh, constraint);
          break;
      }
    }
  }
  
  private applyVolumePreservation(mesh: DeformableMesh, constraint: DeformationConstraint): void {
    // Simplified volume preservation - maintains relative distances
    const vertices = constraint.vertices;
    
    // Calculate centroid
    let centroidX = 0, centroidY = 0;
    for (const vertexIndex of vertices) {
      centroidX += mesh.deformedVertices[vertexIndex * 2];
      centroidY += mesh.deformedVertices[vertexIndex * 2 + 1];
    }
    centroidX /= vertices.length;
    centroidY /= vertices.length;
    
    // Calculate original centroid
    let originalCentroidX = 0, originalCentroidY = 0;
    for (const vertexIndex of vertices) {
      originalCentroidX += mesh.originalVertices[vertexIndex * 2];
      originalCentroidY += mesh.originalVertices[vertexIndex * 2 + 1];
    }
    originalCentroidX /= vertices.length;
    originalCentroidY /= vertices.length;
    
    // Calculate scale to preserve area
    let originalArea = 0, currentArea = 0;
    for (const vertexIndex of vertices) {
      const origDx = mesh.originalVertices[vertexIndex * 2] - originalCentroidX;
      const origDy = mesh.originalVertices[vertexIndex * 2 + 1] - originalCentroidY;
      originalArea += origDx * origDx + origDy * origDy;
      
      const currDx = mesh.deformedVertices[vertexIndex * 2] - centroidX;
      const currDy = mesh.deformedVertices[vertexIndex * 2 + 1] - centroidY;
      currentArea += currDx * currDx + currDy * currDy;
    }
    
    if (currentArea > 0) {
      const preservationScale = Math.sqrt(originalArea / currentArea);
      const influence = constraint.strength;
      
      // Apply volume preservation
      for (const vertexIndex of vertices) {
        const currDx = mesh.deformedVertices[vertexIndex * 2] - centroidX;
        const currDy = mesh.deformedVertices[vertexIndex * 2 + 1] - centroidY;
        
        const preservedX = centroidX + currDx * preservationScale;
        const preservedY = centroidY + currDy * preservationScale;
        
        mesh.deformedVertices[vertexIndex * 2] = this.lerp(
          mesh.deformedVertices[vertexIndex * 2],
          preservedX,
          influence
        );
        mesh.deformedVertices[vertexIndex * 2 + 1] = this.lerp(
          mesh.deformedVertices[vertexIndex * 2 + 1],
          preservedY,
          influence
        );
      }
    }
  }
  
  private applyLengthPreservation(mesh: DeformableMesh, constraint: DeformationConstraint): void {
    // Preserve edge lengths between connected vertices
    const vertices = constraint.vertices;
    
    for (let i = 0; i < vertices.length - 1; i++) {
      const v1Index = vertices[i];
      const v2Index = vertices[i + 1];
      
      // Original edge length
      const origDx = mesh.originalVertices[v2Index * 2] - mesh.originalVertices[v1Index * 2];
      const origDy = mesh.originalVertices[v2Index * 2 + 1] - mesh.originalVertices[v1Index * 2 + 1];
      const originalLength = Math.sqrt(origDx * origDx + origDy * origDy);
      
      // Current edge
      const currDx = mesh.deformedVertices[v2Index * 2] - mesh.deformedVertices[v1Index * 2];
      const currDy = mesh.deformedVertices[v2Index * 2 + 1] - mesh.deformedVertices[v1Index * 2 + 1];
      const currentLength = Math.sqrt(currDx * currDx + currDy * currDy);
      
      if (currentLength > 0) {
        const scale = originalLength / currentLength;
        const influence = constraint.strength;
        
        // Adjust both vertices
        const midX = (mesh.deformedVertices[v1Index * 2] + mesh.deformedVertices[v2Index * 2]) / 2;
        const midY = (mesh.deformedVertices[v1Index * 2 + 1] + mesh.deformedVertices[v2Index * 2 + 1]) / 2;
        
        const preservedDx = currDx * scale;
        const preservedDy = currDy * scale;
        
        const newV1X = midX - preservedDx / 2;
        const newV1Y = midY - preservedDy / 2;
        const newV2X = midX + preservedDx / 2;
        const newV2Y = midY + preservedDy / 2;
        
        mesh.deformedVertices[v1Index * 2] = this.lerp(mesh.deformedVertices[v1Index * 2], newV1X, influence);
        mesh.deformedVertices[v1Index * 2 + 1] = this.lerp(mesh.deformedVertices[v1Index * 2 + 1], newV1Y, influence);
        mesh.deformedVertices[v2Index * 2] = this.lerp(mesh.deformedVertices[v2Index * 2], newV2X, influence);
        mesh.deformedVertices[v2Index * 2 + 1] = this.lerp(mesh.deformedVertices[v2Index * 2 + 1], newV2Y, influence);
      }
    }
  }
  
  private applyVertexPinning(mesh: DeformableMesh, constraint: DeformationConstraint): void {
    // Pin vertices to their original positions
    for (const vertexIndex of constraint.vertices) {
      const influence = constraint.strength;
      
      mesh.deformedVertices[vertexIndex * 2] = this.lerp(
        mesh.deformedVertices[vertexIndex * 2],
        mesh.originalVertices[vertexIndex * 2],
        influence
      );
      mesh.deformedVertices[vertexIndex * 2 + 1] = this.lerp(
        mesh.deformedVertices[vertexIndex * 2 + 1],
        mesh.originalVertices[vertexIndex * 2 + 1],
        influence
      );
    }
  }
  
  private applySurfaceSmoothing(mesh: DeformableMesh, constraint: DeformationConstraint): void {
    // Laplacian smoothing
    const vertices = constraint.vertices;
    const smoothedPositions: { x: number; y: number }[] = [];
    
    for (const vertexIndex of vertices) {
      let avgX = 0, avgY = 0, neighborCount = 0;
      
      // Find neighboring vertices (simplified - check all other vertices in constraint)
      for (const otherIndex of vertices) {
        if (vertexIndex === otherIndex) continue;
        
        const dx = mesh.deformedVertices[otherIndex * 2] - mesh.deformedVertices[vertexIndex * 2];
        const dy = mesh.deformedVertices[otherIndex * 2 + 1] - mesh.deformedVertices[vertexIndex * 2 + 1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) { // Neighbor threshold
          avgX += mesh.deformedVertices[otherIndex * 2];
          avgY += mesh.deformedVertices[otherIndex * 2 + 1];
          neighborCount++;
        }
      }
      
      if (neighborCount > 0) {
        smoothedPositions.push({
          x: avgX / neighborCount,
          y: avgY / neighborCount
        });
      } else {
        smoothedPositions.push({
          x: mesh.deformedVertices[vertexIndex * 2],
          y: mesh.deformedVertices[vertexIndex * 2 + 1]
        });
      }
    }
    
    // Apply smoothing
    for (let i = 0; i < vertices.length; i++) {
      const vertexIndex = vertices[i];
      const smoothed = smoothedPositions[i];
      const influence = constraint.strength;
      
      mesh.deformedVertices[vertexIndex * 2] = this.lerp(
        mesh.deformedVertices[vertexIndex * 2],
        smoothed.x,
        influence
      );
      mesh.deformedVertices[vertexIndex * 2 + 1] = this.lerp(
        mesh.deformedVertices[vertexIndex * 2 + 1],
        smoothed.y,
        influence
      );
    }
  }
  
  // Main update loop
  update(deltaTime: number): void {
    // Process dirty meshes
    for (const meshId of this.dirtyMeshes) {
      this.updateMesh(meshId, deltaTime);
    }
    
    this.dirtyMeshes.clear();
  }
  
  private updateMesh(meshId: string, deltaTime: number): void {
    const mesh = this.meshes.get(meshId);
    if (!mesh) return;
    
    // Apply morph targets first
    this.applyMorphTargets(meshId);
    
    // Apply FFD deformation
    for (const lattice of this.lattices.values()) {
      this.applyFFDDeformation(meshId, lattice.id);
    }
    
    // Apply physics simulations
    this.applySoftBodyDeformation(meshId, deltaTime);
    this.applyFluidDeformation(meshId, deltaTime);
    
    // Apply constraints last
    this.applyConstraints(meshId);
    
    // Update PIXI mesh if exists
    this.updatePixiMesh(meshId);
  }
  
  private updatePixiMesh(meshId: string): void {
    const mesh = this.meshes.get(meshId);
    if (!mesh || !mesh.pixiMesh) return;
    
    // Update vertex buffer
    mesh.pixiMesh.geometry.getBuffer('aVertexPosition').update(mesh.deformedVertices);
  }
  
  private markMeshDirty(meshId: string): void {
    this.dirtyMeshes.add(meshId);
  }
  
  // Utility functions
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  // Getters
  getLattice(id: string): DeformationLattice | undefined {
    return this.lattices.get(id);
  }
  
  getMorphTargets(meshId: string): MorphTarget[] {
    return this.morphTargets.get(meshId) || [];
  }
  
  getVertexGroups(meshId: string): VertexGroup[] {
    return this.vertexGroups.get(meshId) || [];
  }
  
  getConstraints(meshId: string): DeformationConstraint[] {
    return this.constraints.get(meshId) || [];
  }
}

export interface DeformableMesh {
  id: string;
  name: string;
  vertices: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  originalVertices: Float32Array;
  deformedVertices: Float32Array;
  velocity?: Float32Array;
  pixiMesh?: PIXI.SimpleMesh;
}

export const meshDeformationEngine = new MeshDeformationEngine();