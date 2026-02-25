// Web Worker for offloading heavy mesh processing calculations
// This runs in a separate thread to keep the main UI thread responsive

import earcut from 'earcut';
import simplify from 'simplify-js';

// Types for worker communication
interface WorkerMessage {
  id: string;
  type: 'PROCESS_MESH' | 'TRIANGULATE' | 'SIMPLIFY' | 'CALCULATE_PROPERTIES';
  data: any;
}

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR';
  data?: any;
  error?: string;
}

interface MeshPoint {
  x: number;
  y: number;
}

interface MeshProcessingRequest {
  contourPoints: MeshPoint[];
  elementType: string;
  targetPointCount?: number;
  imageWidth?: number;
  imageHeight?: number;
}

interface MeshProcessingResult {
  originalPoints: MeshPoint[];
  simplifiedPoints: MeshPoint[];
  triangles: number[];
  boundingBox: { x: number; y: number; width: number; height: number };
  area: number;
  perimeter: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  processingTime: number;
}

// Listen for messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = event.data;
  
  console.log(`🔧 Worker received message: ${type} (ID: ${id})`);
  console.log(`📊 Worker data received:`, data);
  const startTime = performance.now();
  
  try {
    let result: any;
    
    switch (type) {
      case 'PROCESS_MESH':
        result = processMeshInWorker(data);
        break;
        
      case 'TRIANGULATE':
        result = triangulateInWorker(data);
        break;
        
      case 'SIMPLIFY':
        result = simplifyInWorker(data);
        break;
        
      case 'CALCULATE_PROPERTIES':
        result = calculatePropertiesInWorker(data);
        break;
        
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }
    
    const processingTime = performance.now() - startTime;
    console.log(`✅ Worker completed ${type} in ${processingTime.toFixed(2)}ms`);
    
    // Send success response back to main thread
    const response: WorkerResponse = {
      id,
      type: 'SUCCESS',
      data: { ...result, processingTime }
    };
    
    self.postMessage(response);
    
  } catch (error) {
    console.error(`Worker error in ${type}:`, error);
    
    // Send error response back to main thread
    const response: WorkerResponse = {
      id,
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    };
    
    self.postMessage(response);
  }
});

/**
 * Complete mesh processing in worker thread
 */
function processMeshInWorker(request: MeshProcessingRequest): MeshProcessingResult {
  const { contourPoints, elementType, targetPointCount, imageWidth = 400, imageHeight = 400 } = request;
  
  console.log(`🔧 Worker processing mesh: ${elementType}, ${contourPoints.length} points`);
  console.log(`📐 Image dimensions: ${imageWidth}x${imageHeight}`);
  console.log(`📊 Contour points:`, contourPoints);
  
  // Step 1: Convert percentage coordinates to pixel coordinates
  console.log(`🔄 Converting percentage to pixel coordinates...`);
  const pixelPoints = contourPoints.map(point => ({
    x: (point.x / 100) * imageWidth,
    y: (point.y / 100) * imageHeight
  }));
  console.log(`✅ Converted to pixel points:`, pixelPoints);
  
  // Step 2: Intelligent simplification
  const optimalCount = getOptimalPointCount(elementType, contourPoints.length);
  const finalTargetCount = targetPointCount || optimalCount;
  const simplifiedPoints = intelligentSimplification(pixelPoints, finalTargetCount);
  
  // Step 3: Triangulation
  const triangles = generateTriangulation(simplifiedPoints);
  
  // Step 4: Calculate properties
  const boundingBox = calculateBoundingBox(simplifiedPoints);
  const area = calculateArea(simplifiedPoints);
  const perimeter = calculatePerimeter(simplifiedPoints);
  const quality = assessMeshQuality(simplifiedPoints, triangles);
  
  return {
    originalPoints: pixelPoints,
    simplifiedPoints,
    triangles,
    boundingBox,
    area,
    perimeter,
    quality,
    processingTime: 0 // Will be set by caller
  };
}

/**
 * Fast triangulation using Earcut
 */
function triangulateInWorker(points: MeshPoint[]): number[] {
  if (points.length < 3) {
    console.warn('⚠️ Worker: Not enough points for triangulation');
    return [];
  }

  try {
    const flatCoords = points.flatMap(p => [p.x, p.y]);
    const triangles = earcut(flatCoords);
    console.log(`🔺 Worker: Generated ${triangles.length / 3} triangles`);
    return triangles;
  } catch (error) {
    console.error('Worker triangulation failed:', error);
    return [];
  }
}

/**
 * Intelligent mesh simplification
 */
function simplifyInWorker(data: { points: MeshPoint[]; targetCount: number }): MeshPoint[] {
  const { points, targetCount } = data;
  
  if (points.length <= targetCount) {
    return points;
  }

  // Calculate tolerance based on desired point reduction
  const reductionRatio = targetCount / points.length;
  const boundingBox = calculateBoundingBox(points);
  const tolerance = Math.min(boundingBox.width, boundingBox.height) * (1 - reductionRatio) * 0.1;

  // Use simplify-js with high quality mode
  const simplified = simplify(points, tolerance, true);

  // Ensure minimum point count for valid mesh
  if (simplified.length < 3) {
    return points.slice(0, Math.max(3, targetCount));
  }

  console.log(`📐 Worker: Simplified from ${points.length} to ${simplified.length} points`);
  return simplified;
}

/**
 * Calculate mesh properties
 */
function calculatePropertiesInWorker(points: MeshPoint[]) {
  return {
    boundingBox: calculateBoundingBox(points),
    area: calculateArea(points),
    perimeter: calculatePerimeter(points),
    pointCount: points.length
  };
}

/**
 * Helper functions (duplicated from main thread for worker isolation)
 */

function getOptimalPointCount(elementType: string, currentCount: number): number {
  const optimalCounts = {
    'wing': Math.min(currentCount, 25),
    'body': Math.min(currentCount, 15),
    'leg': Math.min(currentCount, 10),
    'antenna': Math.min(currentCount, 8),
    'eye': Math.min(currentCount, 6),
    'pattern': Math.min(currentCount, 12),
    'tail': Math.min(currentCount, 18)
  };

  return optimalCounts[elementType as keyof typeof optimalCounts] || Math.min(currentCount, 12);
}

function intelligentSimplification(points: MeshPoint[], targetCount: number): MeshPoint[] {
  if (points.length <= targetCount) {
    return points;
  }

  const reductionRatio = targetCount / points.length;
  const boundingBox = calculateBoundingBox(points);
  const tolerance = Math.min(boundingBox.width, boundingBox.height) * (1 - reductionRatio) * 0.1;

  const simplified = simplify(points, tolerance, true);

  if (simplified.length < 3) {
    return points.slice(0, Math.max(3, targetCount));
  }

  return simplified;
}

function generateTriangulation(points: MeshPoint[]): number[] {
  if (points.length < 3) return [];

  try {
    const flatCoords = points.flatMap(p => [p.x, p.y]);
    return earcut(flatCoords);
  } catch (error) {
    console.error('Worker triangulation failed:', error);
    return [];
  }
}

function calculateBoundingBox(points: MeshPoint[]): { x: number; y: number; width: number; height: number } {
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

function calculateArea(points: MeshPoint[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function calculatePerimeter(points: MeshPoint[]): number {
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

function assessMeshQuality(points: MeshPoint[], triangles: number[]): 'low' | 'medium' | 'high' | 'ultra' {
  const pointCount = points.length;
  const triangleCount = triangles.length / 3;
  const area = calculateArea(points);
  const perimeter = calculatePerimeter(points);
  
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
    const complexity = perimeter * perimeter / (4 * Math.PI * area);
    if (complexity <= 2) score += 25;
    else if (complexity <= 4) score += 20;
    else if (complexity <= 8) score += 15;
    else score += 10;
  }
  
  // Consistency score (0-25)
  score += 15;
  
  if (score >= 85) return 'ultra';
  else if (score >= 70) return 'high';
  else if (score >= 50) return 'medium';
  else return 'low';
}

console.log('🔧 Mesh Processing Worker initialized and ready');