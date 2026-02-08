// Professional Animation Curves and Timing System
// Implements Bezier curves, custom timing, animation layers, and graph editor functionality

export interface AnimationCurve {
  id: string;
  name: string;
  keyframes: Keyframe[];
  interpolationType: InterpolationType;
  preInfinity: InfinityType;
  postInfinity: InfinityType;
  
  // Curve properties
  tangentMode: TangentMode;
  weightedMode: boolean;
  
  // Metadata
  property: string; // e.g., 'position.x', 'rotation', 'scale.y'
  target: string; // Target object ID
  valueRange: { min: number; max: number };
  
  // Performance
  isDirty: boolean;
  lastEvaluatedTime: number;
  cachedValue: number;
}

export interface Keyframe {
  time: number;
  value: number;
  
  // Tangent data for smooth interpolation
  inTangent: number;
  outTangent: number;
  inWeight: number;
  outWeight: number;
  
  // Tangent modes
  tangentMode: KeyframeTangentMode;
  
  // Selection and editing
  selected: boolean;
  locked: boolean;
  
  // Custom data
  userData?: any;
}

export interface BezierCurve {
  p0: { x: number; y: number }; // Start point
  p1: { x: number; y: number }; // Control point 1
  p2: { x: number; y: number }; // Control point 2
  p3: { x: number; y: number }; // End point
}

export interface TimingFunction {
  type: 'bezier' | 'steps' | 'frames';
  
  // Bezier timing
  bezier?: {
    x1: number; y1: number;
    x2: number; y2: number;
  };
  
  // Step timing
  steps?: {
    count: number;
    direction: 'start' | 'end';
  };
  
  // Frame timing
  frames?: {
    count: number;
  };
}

export type InterpolationType = 
  | 'linear' 
  | 'constant' 
  | 'cubic' 
  | 'hermite' 
  | 'bezier'
  | 'spline'
  | 'elastic'
  | 'bounce'
  | 'back';

export type InfinityType = 
  | 'constant'    // Hold first/last value
  | 'linear'      // Linear extrapolation
  | 'cycle'       // Repeat the curve
  | 'cycle_offset' // Repeat with offset
  | 'oscillate';   // Ping-pong

export type TangentMode = 'free' | 'auto' | 'linear' | 'constant' | 'smooth';

export type KeyframeTangentMode = 
  | 'auto'      // Automatic smooth tangents
  | 'free'      // Manual tangent control
  | 'linear'    // Linear interpolation
  | 'constant'  // Constant value
  | 'smooth'    // Smooth tangents
  | 'flat'      // Flat tangents
  | 'broken';   // Independent in/out tangents

export interface AnimationLayer {
  id: string;
  name: string;
  curves: string[]; // Animation curve IDs
  
  // Blending
  weight: number;
  blendMode: BlendMode;
  enabled: boolean;
  solo: boolean;
  muted: boolean;
  
  // Timing
  timeOffset: number;
  timeScale: number;
  
  // Layer organization
  parentLayer?: string;
  childLayers: string[];
  
  // Visual
  color: number;
  collapsed: boolean;
  height: number;
}

export type BlendMode = 
  | 'override'    // Replace lower layers
  | 'additive'    // Add to lower layers
  | 'subtractive' // Subtract from lower layers
  | 'multiply'    // Multiply with lower layers
  | 'screen'      // Screen blend
  | 'overlay'     // Overlay blend
  | 'difference'  // Difference blend
  | 'mix';        // Linear mix based on weight

export interface AnimationClip {
  id: string;
  name: string;
  layers: string[]; // Animation layer IDs
  
  // Timing
  duration: number;
  startTime: number;
  endTime: number;
  frameRate: number;
  
  // Playback
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  speed: number;
  
  // Events
  events: AnimationEvent[];
  
  // Metadata
  tags: string[];
  description: string;
}

export interface AnimationEvent {
  time: number;
  type: string;
  data: any;
  enabled: boolean;
}

export interface CurvePreset {
  name: string;
  description: string;
  keyframes: Omit<Keyframe, 'selected' | 'locked'>[];
  interpolationType: InterpolationType;
  category: 'easing' | 'bounce' | 'elastic' | 'spring' | 'custom';
}

// Pre-defined easing curves
export const EASING_PRESETS: CurvePreset[] = [
  {
    name: 'Linear',
    description: 'Constant rate of change',
    keyframes: [
      { time: 0, value: 0, inTangent: 1, outTangent: 1, inWeight: 0.33, outWeight: 0.33, tangentMode: 'linear' },
      { time: 1, value: 1, inTangent: 1, outTangent: 1, inWeight: 0.33, outWeight: 0.33, tangentMode: 'linear' }
    ],
    interpolationType: 'linear',
    category: 'easing'
  },
  {
    name: 'Ease In',
    description: 'Slow start, fast end',
    keyframes: [
      { time: 0, value: 0, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 2, outTangent: 2, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'easing'
  },
  {
    name: 'Ease Out',
    description: 'Fast start, slow end',
    keyframes: [
      { time: 0, value: 0, inTangent: 2, outTangent: 2, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'easing'
  },
  {
    name: 'Ease In Out',
    description: 'Slow start and end, fast middle',
    keyframes: [
      { time: 0, value: 0, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'easing'
  },
  {
    name: 'Bounce',
    description: 'Bouncing effect at the end',
    keyframes: [
      { time: 0, value: 0, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.7, value: 1.1, inTangent: 3, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.85, value: 0.95, inTangent: -2, outTangent: 1, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'bounce'
  },
  {
    name: 'Elastic',
    description: 'Elastic spring effect',
    keyframes: [
      { time: 0, value: 0, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.6, value: 1.2, inTangent: 4, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.8, value: 0.9, inTangent: -3, outTangent: 2, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.9, value: 1.05, inTangent: 1, outTangent: -1, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 0, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'elastic'
  },
  {
    name: 'Back',
    description: 'Overshoots target then returns',
    keyframes: [
      { time: 0, value: 0, inTangent: 0, outTangent: -0.5, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 0.7, value: -0.1, inTangent: 0, outTangent: 3, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' },
      { time: 1, value: 1, inTangent: 1, outTangent: 0, inWeight: 0.33, outWeight: 0.33, tangentMode: 'smooth' }
    ],
    interpolationType: 'cubic',
    category: 'easing'
  }
];

export class ProfessionalAnimationCurves {
  private curves: Map<string, AnimationCurve> = new Map();
  private layers: Map<string, AnimationLayer> = new Map();
  private clips: Map<string, AnimationClip> = new Map();
  
  // Evaluation cache for performance
  private evaluationCache: Map<string, { time: number; value: number }> = new Map();
  
  // Time management
  private currentTime: number = 0;
  private timeScale: number = 1.0;
  
  // Selection and editing
  private selectedCurves: Set<string> = new Set();
  private selectedKeyframes: Map<string, Set<number>> = new Map(); // curve ID -> keyframe indices
  
  constructor() {
    console.log('[ProfessionalCurves] Professional animation curves system initialized');
  }
  
  // Curve Management
  createCurve(config: {
    id: string;
    name: string;
    property: string;
    target: string;
    interpolationType?: InterpolationType;
    valueRange?: { min: number; max: number };
  }): AnimationCurve {
    const curve: AnimationCurve = {
      id: config.id,
      name: config.name,
      keyframes: [],
      interpolationType: config.interpolationType || 'cubic',
      preInfinity: 'constant',
      postInfinity: 'constant',
      tangentMode: 'auto',
      weightedMode: false,
      property: config.property,
      target: config.target,
      valueRange: config.valueRange || { min: -Infinity, max: Infinity },
      isDirty: true,
      lastEvaluatedTime: -1,
      cachedValue: 0
    };
    
    this.curves.set(curve.id, curve);
    console.log(`[ProfessionalCurves] Created curve: ${curve.name} (${curve.id})`);
    return curve;
  }
  
  createCurveFromPreset(presetName: string, config: {
    id: string;
    name: string;
    property: string;
    target: string;
    duration?: number;
  }): AnimationCurve | null {
    const preset = EASING_PRESETS.find(p => p.name === presetName);
    if (!preset) {
      console.error(`[ProfessionalCurves] Preset not found: ${presetName}`);
      return null;
    }
    
    const curve = this.createCurve({
      id: config.id,
      name: config.name,
      property: config.property,
      target: config.target,
      interpolationType: preset.interpolationType
    });
    
    const duration = config.duration || 1.0;
    
    // Add keyframes from preset, scaling time by duration
    for (const keyframeData of preset.keyframes) {
      this.addKeyframe(curve.id, {
        ...keyframeData,
        time: keyframeData.time * duration,
        selected: false,
        locked: false
      });
    }
    
    return curve;
  }
  
  getCurve(id: string): AnimationCurve | undefined {
    return this.curves.get(id);
  }
  
  deleteCurve(id: string): void {
    this.curves.delete(id);
    this.evaluationCache.delete(id);
    this.selectedCurves.delete(id);
    this.selectedKeyframes.delete(id);
  }
  
  // Keyframe Management
  addKeyframe(curveId: string, keyframe: Keyframe): void {
    const curve = this.curves.get(curveId);
    if (!curve) return;
    
    // Insert keyframe in time-sorted order
    let insertIndex = curve.keyframes.length;
    for (let i = 0; i < curve.keyframes.length; i++) {
      if (curve.keyframes[i].time > keyframe.time) {
        insertIndex = i;
        break;
      }
    }
    
    curve.keyframes.splice(insertIndex, 0, keyframe);
    curve.isDirty = true;
    
    // Auto-calculate tangents if needed
    if (keyframe.tangentMode === 'auto') {
      this.calculateAutoTangents(curveId, insertIndex);
    }
  }
  
  removeKeyframe(curveId: string, keyframeIndex: number): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    curve.keyframes.splice(keyframeIndex, 1);
    curve.isDirty = true;
    
    // Update auto tangents for neighboring keyframes
    if (keyframeIndex > 0) {
      this.calculateAutoTangents(curveId, keyframeIndex - 1);
    }
    if (keyframeIndex < curve.keyframes.length) {
      this.calculateAutoTangents(curveId, keyframeIndex);
    }
  }
  
  moveKeyframe(curveId: string, keyframeIndex: number, newTime: number, newValue: number): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    const keyframe = curve.keyframes[keyframeIndex];
    keyframe.time = newTime;
    keyframe.value = Math.max(curve.valueRange.min, Math.min(curve.valueRange.max, newValue));
    
    // Re-sort keyframes by time
    curve.keyframes.sort((a, b) => a.time - b.time);
    curve.isDirty = true;
    
    // Recalculate auto tangents
    if (keyframe.tangentMode === 'auto') {
      const newIndex = curve.keyframes.indexOf(keyframe);
      this.calculateAutoTangents(curveId, newIndex);
    }
  }
  
  setKeyframeTangents(curveId: string, keyframeIndex: number, inTangent: number, outTangent: number): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    const keyframe = curve.keyframes[keyframeIndex];
    keyframe.inTangent = inTangent;
    keyframe.outTangent = outTangent;
    keyframe.tangentMode = 'free';
    curve.isDirty = true;
  }
  
  setKeyframeTangentMode(curveId: string, keyframeIndex: number, mode: KeyframeTangentMode): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    const keyframe = curve.keyframes[keyframeIndex];
    keyframe.tangentMode = mode;
    curve.isDirty = true;
    
    // Recalculate tangents based on mode
    this.calculateTangentsForMode(curveId, keyframeIndex, mode);
  }
  
  private calculateAutoTangents(curveId: string, keyframeIndex: number): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    const keyframes = curve.keyframes;
    const current = keyframes[keyframeIndex];
    
    if (current.tangentMode !== 'auto') return;
    
    const prev = keyframeIndex > 0 ? keyframes[keyframeIndex - 1] : null;
    const next = keyframeIndex < keyframes.length - 1 ? keyframes[keyframeIndex + 1] : null;
    
    if (prev && next) {
      // Calculate smooth tangent through three points
      const deltaTime1 = current.time - prev.time;
      const deltaTime2 = next.time - current.time;
      const deltaValue1 = current.value - prev.value;
      const deltaValue2 = next.value - current.value;
      
      const totalTime = deltaTime1 + deltaTime2;
      const avgSlope = (deltaValue1 + deltaValue2) / totalTime;
      
      current.inTangent = avgSlope;
      current.outTangent = avgSlope;
    } else if (prev) {
      // Only previous keyframe exists
      const slope = (current.value - prev.value) / (current.time - prev.time);
      current.inTangent = slope;
      current.outTangent = slope;
    } else if (next) {
      // Only next keyframe exists
      const slope = (next.value - current.value) / (next.time - current.time);
      current.inTangent = slope;
      current.outTangent = slope;
    } else {
      // Only keyframe - flat tangents
      current.inTangent = 0;
      current.outTangent = 0;
    }
  }
  
  private calculateTangentsForMode(curveId: string, keyframeIndex: number, mode: KeyframeTangentMode): void {
    const curve = this.curves.get(curveId);
    if (!curve || keyframeIndex < 0 || keyframeIndex >= curve.keyframes.length) return;
    
    const keyframe = curve.keyframes[keyframeIndex];
    
    switch (mode) {
      case 'auto':
        this.calculateAutoTangents(curveId, keyframeIndex);
        break;
      
      case 'linear':
        const keyframes = curve.keyframes;
        const prev = keyframeIndex > 0 ? keyframes[keyframeIndex - 1] : null;
        const next = keyframeIndex < keyframes.length - 1 ? keyframes[keyframeIndex + 1] : null;
        
        if (prev) {
          keyframe.inTangent = (keyframe.value - prev.value) / (keyframe.time - prev.time);
        }
        if (next) {
          keyframe.outTangent = (next.value - keyframe.value) / (next.time - keyframe.time);
        }
        break;
      
      case 'constant':
        keyframe.inTangent = 0;
        keyframe.outTangent = Infinity; // Creates step
        break;
      
      case 'flat':
        keyframe.inTangent = 0;
        keyframe.outTangent = 0;
        break;
      
      case 'smooth':
        this.calculateAutoTangents(curveId, keyframeIndex);
        break;
      
      case 'broken':
        // Keep existing tangents but allow independent editing
        break;
    }
  }
  
  // Curve Evaluation
  evaluateCurve(curveId: string, time: number): number {
    const curve = this.curves.get(curveId);
    if (!curve) return 0;
    
    // Check cache first
    const cacheKey = `${curveId}_${time}`;
    const cached = this.evaluationCache.get(cacheKey);
    if (cached && cached.time === time && !curve.isDirty) {
      return cached.value;
    }
    
    const value = this.evaluateCurveUncached(curve, time);
    
    // Cache the result
    this.evaluationCache.set(cacheKey, { time, value });
    curve.lastEvaluatedTime = time;
    curve.cachedValue = value;
    curve.isDirty = false;
    
    return value;
  }
  
  private evaluateCurveUncached(curve: AnimationCurve, time: number): number {
    if (curve.keyframes.length === 0) return 0;
    if (curve.keyframes.length === 1) return curve.keyframes[0].value;
    
    const firstKeyframe = curve.keyframes[0];
    const lastKeyframe = curve.keyframes[curve.keyframes.length - 1];
    
    // Handle time before first keyframe
    if (time <= firstKeyframe.time) {
      return this.handlePreInfinity(curve, time);
    }
    
    // Handle time after last keyframe
    if (time >= lastKeyframe.time) {
      return this.handlePostInfinity(curve, time);
    }
    
    // Find surrounding keyframes
    let leftIndex = 0;
    let rightIndex = 1;
    
    for (let i = 1; i < curve.keyframes.length; i++) {
      if (curve.keyframes[i].time >= time) {
        rightIndex = i;
        leftIndex = i - 1;
        break;
      }
    }
    
    const leftKeyframe = curve.keyframes[leftIndex];
    const rightKeyframe = curve.keyframes[rightIndex];
    
    // Interpolate between keyframes
    return this.interpolateBetweenKeyframes(
      curve, 
      leftKeyframe, 
      rightKeyframe, 
      time
    );
  }
  
  private handlePreInfinity(curve: AnimationCurve, time: number): number {
    const firstKeyframe = curve.keyframes[0];
    
    switch (curve.preInfinity) {
      case 'constant':
        return firstKeyframe.value;
      
      case 'linear':
        if (curve.keyframes.length > 1) {
          const secondKeyframe = curve.keyframes[1];
          const slope = (secondKeyframe.value - firstKeyframe.value) / (secondKeyframe.time - firstKeyframe.time);
          return firstKeyframe.value + slope * (time - firstKeyframe.time);
        }
        return firstKeyframe.value;
      
      case 'cycle':
        const duration = curve.keyframes[curve.keyframes.length - 1].time - firstKeyframe.time;
        const cycles = Math.floor((firstKeyframe.time - time) / duration);
        const cyclicTime = time + cycles * duration;
        return this.evaluateCurveUncached(curve, cyclicTime);
      
      case 'cycle_offset':
        const totalDuration = curve.keyframes[curve.keyframes.length - 1].time - firstKeyframe.time;
        const totalChange = curve.keyframes[curve.keyframes.length - 1].value - firstKeyframe.value;
        const numCycles = Math.floor((firstKeyframe.time - time) / totalDuration);
        const cyclicTimeOffset = time + numCycles * totalDuration;
        const baseValue = this.evaluateCurveUncached(curve, cyclicTimeOffset);
        return baseValue - numCycles * totalChange;
      
      case 'oscillate':
        const oscDuration = curve.keyframes[curve.keyframes.length - 1].time - firstKeyframe.time;
        const oscCycles = Math.floor((firstKeyframe.time - time) / oscDuration);
        const oscTime = time + oscCycles * oscDuration;
        
        if (oscCycles % 2 === 0) {
          return this.evaluateCurveUncached(curve, oscTime);
        } else {
          // Reverse the curve
          const reversedTime = firstKeyframe.time + (curve.keyframes[curve.keyframes.length - 1].time - oscTime);
          return this.evaluateCurveUncached(curve, reversedTime);
        }
      
      default:
        return firstKeyframe.value;
    }
  }
  
  private handlePostInfinity(curve: AnimationCurve, time: number): number {
    const lastKeyframe = curve.keyframes[curve.keyframes.length - 1];
    
    switch (curve.postInfinity) {
      case 'constant':
        return lastKeyframe.value;
      
      case 'linear':
        if (curve.keyframes.length > 1) {
          const secondLastKeyframe = curve.keyframes[curve.keyframes.length - 2];
          const slope = (lastKeyframe.value - secondLastKeyframe.value) / (lastKeyframe.time - secondLastKeyframe.time);
          return lastKeyframe.value + slope * (time - lastKeyframe.time);
        }
        return lastKeyframe.value;
      
      case 'cycle':
        const firstKeyframe = curve.keyframes[0];
        const duration = lastKeyframe.time - firstKeyframe.time;
        const cycles = Math.floor((time - firstKeyframe.time) / duration);
        const cyclicTime = time - cycles * duration;
        return this.evaluateCurveUncached(curve, cyclicTime);
      
      case 'cycle_offset':
        const firstKey = curve.keyframes[0];
        const totalDuration = lastKeyframe.time - firstKey.time;
        const totalChange = lastKeyframe.value - firstKey.value;
        const numCycles = Math.floor((time - firstKey.time) / totalDuration);
        const cyclicTimeOffset = time - numCycles * totalDuration;
        const baseValue = this.evaluateCurveUncached(curve, cyclicTimeOffset);
        return baseValue + numCycles * totalChange;
      
      case 'oscillate':
        const firstOscKey = curve.keyframes[0];
        const oscDuration = lastKeyframe.time - firstOscKey.time;
        const oscCycles = Math.floor((time - firstOscKey.time) / oscDuration);
        const oscTime = time - oscCycles * oscDuration;
        
        if (oscCycles % 2 === 0) {
          return this.evaluateCurveUncached(curve, oscTime);
        } else {
          // Reverse the curve
          const reversedTime = firstOscKey.time + (lastKeyframe.time - oscTime);
          return this.evaluateCurveUncached(curve, reversedTime);
        }
      
      default:
        return lastKeyframe.value;
    }
  }
  
  private interpolateBetweenKeyframes(
    curve: AnimationCurve,
    leftKeyframe: Keyframe,
    rightKeyframe: Keyframe,
    time: number
  ): number {
    const t = (time - leftKeyframe.time) / (rightKeyframe.time - leftKeyframe.time);
    
    switch (curve.interpolationType) {
      case 'constant':
        return leftKeyframe.value;
      
      case 'linear':
        return this.lerp(leftKeyframe.value, rightKeyframe.value, t);
      
      case 'cubic':
      case 'hermite':
        return this.hermiteInterpolation(leftKeyframe, rightKeyframe, t);
      
      case 'bezier':
        return this.bezierInterpolation(leftKeyframe, rightKeyframe, t);
      
      case 'spline':
        return this.splineInterpolation(curve, leftKeyframe, rightKeyframe, t);
      
      case 'elastic':
        return this.elasticInterpolation(leftKeyframe.value, rightKeyframe.value, t);
      
      case 'bounce':
        return this.bounceInterpolation(leftKeyframe.value, rightKeyframe.value, t);
      
      case 'back':
        return this.backInterpolation(leftKeyframe.value, rightKeyframe.value, t);
      
      default:
        return this.lerp(leftKeyframe.value, rightKeyframe.value, t);
    }
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  private hermiteInterpolation(leftKeyframe: Keyframe, rightKeyframe: Keyframe, t: number): number {
    const p0 = leftKeyframe.value;
    const p1 = rightKeyframe.value;
    const m0 = leftKeyframe.outTangent * (rightKeyframe.time - leftKeyframe.time);
    const m1 = rightKeyframe.inTangent * (rightKeyframe.time - leftKeyframe.time);
    
    const t2 = t * t;
    const t3 = t2 * t;
    
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    
    return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
  }
  
  private bezierInterpolation(leftKeyframe: Keyframe, rightKeyframe: Keyframe, t: number): number {
    // Convert tangents to control points
    const duration = rightKeyframe.time - leftKeyframe.time;
    const outWeight = curve.weightedMode ? leftKeyframe.outWeight : 0.33;
    const inWeight = curve.weightedMode ? rightKeyframe.inWeight : 0.33;
    
    const p0 = leftKeyframe.value;
    const p1 = leftKeyframe.value + leftKeyframe.outTangent * duration * outWeight;
    const p2 = rightKeyframe.value - rightKeyframe.inTangent * duration * inWeight;
    const p3 = rightKeyframe.value;
    
    // Cubic Bezier interpolation
    const u = 1 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return u3 * p0 + 3 * u2 * t * p1 + 3 * u * t2 * p2 + t3 * p3;
  }
  
  private splineInterpolation(curve: AnimationCurve, leftKeyframe: Keyframe, rightKeyframe: Keyframe, t: number): number {
    // Catmull-Rom spline interpolation
    const keyframes = curve.keyframes;
    const leftIndex = keyframes.indexOf(leftKeyframe);
    const rightIndex = keyframes.indexOf(rightKeyframe);
    
    const p0 = leftIndex > 0 ? keyframes[leftIndex - 1].value : leftKeyframe.value;
    const p1 = leftKeyframe.value;
    const p2 = rightKeyframe.value;
    const p3 = rightIndex < keyframes.length - 1 ? keyframes[rightIndex + 1].value : rightKeyframe.value;
    
    const t2 = t * t;
    const t3 = t2 * t;
    
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }
  
  private elasticInterpolation(start: number, end: number, t: number): number {
    if (t === 0) return start;
    if (t === 1) return end;
    
    const p = 0.3;
    const a = end - start;
    const s = p / 4;
    
    return start + a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + a;
  }
  
  private bounceInterpolation(start: number, end: number, t: number): number {
    const diff = end - start;
    
    if (t < 1 / 2.75) {
      return start + diff * (7.5625 * t * t);
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return start + diff * (7.5625 * t * t + 0.75);
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return start + diff * (7.5625 * t * t + 0.9375);
    } else {
      t -= 2.625 / 2.75;
      return start + diff * (7.5625 * t * t + 0.984375);
    }
  }
  
  private backInterpolation(start: number, end: number, t: number): number {
    const s = 1.70158;
    const diff = end - start;
    return start + diff * t * t * ((s + 1) * t - s);
  }
  
  // Bezier Curve Utilities
  createBezierCurve(p0: { x: number; y: number }, p1: { x: number; y: number }, 
                   p2: { x: number; y: number }, p3: { x: number; y: number }): BezierCurve {
    return { p0, p1, p2, p3 };
  }
  
  evaluateBezierCurve(curve: BezierCurve, t: number): { x: number; y: number } {
    const u = 1 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: u3 * curve.p0.x + 3 * u2 * t * curve.p1.x + 3 * u * t2 * curve.p2.x + t3 * curve.p3.x,
      y: u3 * curve.p0.y + 3 * u2 * t * curve.p1.y + 3 * u * t2 * curve.p2.y + t3 * curve.p3.y
    };
  }
  
  getBezierCurveLength(curve: BezierCurve, subdivisions: number = 100): number {
    let length = 0;
    let prevPoint = curve.p0;
    
    for (let i = 1; i <= subdivisions; i++) {
      const t = i / subdivisions;
      const currentPoint = this.evaluateBezierCurve(curve, t);
      
      const dx = currentPoint.x - prevPoint.x;
      const dy = currentPoint.y - prevPoint.y;
      length += Math.sqrt(dx * dx + dy * dy);
      
      prevPoint = currentPoint;
    }
    
    return length;
  }
  
  // Animation Layers
  createLayer(config: {
    id: string;
    name: string;
    weight?: number;
    blendMode?: BlendMode;
  }): AnimationLayer {
    const layer: AnimationLayer = {
      id: config.id,
      name: config.name,
      curves: [],
      weight: config.weight || 1.0,
      blendMode: config.blendMode || 'override',
      enabled: true,
      solo: false,
      muted: false,
      timeOffset: 0,
      timeScale: 1.0,
      childLayers: [],
      color: 0x4A90E2,
      collapsed: false,
      height: 100
    };
    
    this.layers.set(layer.id, layer);
    console.log(`[ProfessionalCurves] Created animation layer: ${layer.name}`);
    return layer;
  }
  
  addCurveToLayer(layerId: string, curveId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer || !this.curves.has(curveId)) return;
    
    if (!layer.curves.includes(curveId)) {
      layer.curves.push(curveId);
    }
  }
  
  removeCurveFromLayer(layerId: string, curveId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    
    const index = layer.curves.indexOf(curveId);
    if (index !== -1) {
      layer.curves.splice(index, 1);
    }
  }
  
  evaluateLayerBlending(layerIds: string[], time: number): Map<string, number> {
    const results = new Map<string, number>();
    
    // Group curves by target and property
    const curveGroups = new Map<string, { curveId: string; layerId: string; weight: number }[]>();
    
    for (const layerId of layerIds) {
      const layer = this.layers.get(layerId);
      if (!layer || !layer.enabled || layer.muted) continue;
      
      for (const curveId of layer.curves) {
        const curve = this.curves.get(curveId);
        if (!curve) continue;
        
        const key = `${curve.target}_${curve.property}`;
        if (!curveGroups.has(key)) {
          curveGroups.set(key, []);
        }
        
        curveGroups.get(key)!.push({
          curveId,
          layerId,
          weight: layer.weight
        });
      }
    }
    
    // Evaluate and blend each curve group
    for (const [key, curves] of curveGroups) {
      let finalValue = 0;
      let totalWeight = 0;
      let hasOverride = false;
      
      for (const { curveId, layerId, weight } of curves) {
        const layer = this.layers.get(layerId)!;
        const adjustedTime = (time - layer.timeOffset) * layer.timeScale;
        const curveValue = this.evaluateCurve(curveId, adjustedTime);
        
        switch (layer.blendMode) {
          case 'override':
            if (!hasOverride) {
              finalValue = curveValue * weight;
              totalWeight = weight;
              hasOverride = true;
            }
            break;
          
          case 'additive':
            finalValue += curveValue * weight;
            break;
          
          case 'subtractive':
            finalValue -= curveValue * weight;
            break;
          
          case 'multiply':
            finalValue *= curveValue * weight;
            break;
          
          case 'mix':
            finalValue = this.lerp(finalValue, curveValue, weight);
            break;
        }
      }
      
      results.set(key, finalValue);
    }
    
    return results;
  }
  
  // Animation Clips
  createClip(config: {
    id: string;
    name: string;
    duration: number;
    frameRate?: number;
  }): AnimationClip {
    const clip: AnimationClip = {
      id: config.id,
      name: config.name,
      layers: [],
      duration: config.duration,
      startTime: 0,
      endTime: config.duration,
      frameRate: config.frameRate || 60,
      loop: false,
      loopStart: 0,
      loopEnd: config.duration,
      speed: 1.0,
      events: [],
      tags: [],
      description: ''
    };
    
    this.clips.set(clip.id, clip);
    console.log(`[ProfessionalCurves] Created animation clip: ${clip.name}`);
    return clip;
  }
  
  addLayerToClip(clipId: string, layerId: string): void {
    const clip = this.clips.get(clipId);
    if (!clip || !this.layers.has(layerId)) return;
    
    if (!clip.layers.includes(layerId)) {
      clip.layers.push(layerId);
    }
  }
  
  // Selection and Editing
  selectCurve(curveId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selectedCurves.clear();
    }
    this.selectedCurves.add(curveId);
  }
  
  selectKeyframe(curveId: string, keyframeIndex: number, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selectedKeyframes.clear();
    }
    
    if (!this.selectedKeyframes.has(curveId)) {
      this.selectedKeyframes.set(curveId, new Set());
    }
    
    this.selectedKeyframes.get(curveId)!.add(keyframeIndex);
    
    // Mark keyframe as selected
    const curve = this.curves.get(curveId);
    if (curve && curve.keyframes[keyframeIndex]) {
      curve.keyframes[keyframeIndex].selected = true;
    }
  }
  
  clearSelection(): void {
    // Clear curve selection
    this.selectedCurves.clear();
    
    // Clear keyframe selection and update keyframe selected state
    for (const [curveId, keyframeIndices] of this.selectedKeyframes) {
      const curve = this.curves.get(curveId);
      if (curve) {
        for (const index of keyframeIndices) {
          if (curve.keyframes[index]) {
            curve.keyframes[index].selected = false;
          }
        }
      }
    }
    this.selectedKeyframes.clear();
  }
  
  // Utility Functions
  setCurrentTime(time: number): void {
    this.currentTime = time;
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.001, scale);
  }
  
  getTimeScale(): number {
    return this.timeScale;
  }
  
  clearCache(): void {
    this.evaluationCache.clear();
    for (const curve of this.curves.values()) {
      curve.isDirty = true;
    }
  }
  
  // Getters
  getAllCurves(): AnimationCurve[] {
    return Array.from(this.curves.values());
  }
  
  getAllLayers(): AnimationLayer[] {
    return Array.from(this.layers.values());
  }
  
  getAllClips(): AnimationClip[] {
    return Array.from(this.clips.values());
  }
  
  getSelectedCurves(): string[] {
    return Array.from(this.selectedCurves);
  }
  
  getSelectedKeyframes(): Map<string, Set<number>> {
    return new Map(this.selectedKeyframes);
  }
  
  getPresets(): CurvePreset[] {
    return EASING_PRESETS;
  }
}

export const professionalAnimationCurves = new ProfessionalAnimationCurves();