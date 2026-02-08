import { AnimationProfile } from '../components/shared/ProfileManager';
import { AISuggestion } from '../components/shared/AIAssistant';
import { PerformanceMetrics } from '../components/shared/PerformanceMonitor';
import { UsabilityEvent } from '../components/shared/UsabilityTracker';

// Advanced Animation Configuration Types
export interface NodeBasedAnimation {
  id: string;
  type: 'speed' | 'easing' | 'blur' | 'effect' | 'trigger';
  x: number;
  y: number;
  inputs: NodeConnection[];
  outputs: NodeConnection[];
  parameters: Record<string, any>;
}

export interface NodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
}

export interface TimelineKeyframe {
  time: number; // 0-1 representing animation progress
  property: string;
  value: any;
  easing?: string;
}

export interface DeviceOptimization {
  device: 'mobile' | 'tablet' | 'desktop' | 'low-end';
  maxBlur: number;
  maxEffects: number;
  targetFPS: number;
  memoryLimit: number;
  adaptiveQuality: boolean;
}

export interface AnimationTemplate {
  profile: AnimationProfile;
  nodeGraph?: NodeBasedAnimation[];
  timeline?: TimelineKeyframe[];
  deviceOptimizations: Record<string, DeviceOptimization>;
  previewSettings: {
    showGrid: boolean;
    showDebugInfo: boolean;
    realTimeUpdates: boolean;
  };
}

// Device Detection and Optimization
export class DeviceOptimizer {
  private static instance: DeviceOptimizer;
  private deviceSpecs: DeviceOptimization;

  constructor() {
    this.deviceSpecs = this.detectDeviceCapabilities();
  }

  static getInstance(): DeviceOptimizer {
    if (!DeviceOptimizer.instance) {
      DeviceOptimizer.instance = new DeviceOptimizer();
    }
    return DeviceOptimizer.instance;
  }

  private detectDeviceCapabilities(): DeviceOptimization {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(navigator.userAgent);
    
    // Estimate device performance based on available info
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4; // GB
    const connection = (navigator as any).connection;
    
    let device: DeviceOptimization['device'] = 'desktop';
    let maxBlur = 20;
    let maxEffects = 5;
    let targetFPS = 60;
    let memoryLimit = 100;

    if (isMobile) {
      device = 'mobile';
      if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
        device = 'low-end';
        maxBlur = 4;
        maxEffects = 2;
        targetFPS = 30;
        memoryLimit = 50;
      } else {
        maxBlur = 8;
        maxEffects = 3;
        targetFPS = 60;
        memoryLimit = 75;
      }
    } else if (isTablet) {
      device = 'tablet';
      maxBlur = 12;
      maxEffects = 4;
      targetFPS = 60;
      memoryLimit = 85;
    }

    return {
      device,
      maxBlur,
      maxEffects,
      targetFPS,
      memoryLimit,
      adaptiveQuality: true
    };
  }

  getOptimizedSettings(baseSettings: any): any {
    const optimized = { ...baseSettings };
    
    // Apply device-specific optimizations
    if (optimized.blurIntensity > this.deviceSpecs.maxBlur) {
      optimized.blurIntensity = this.deviceSpecs.maxBlur;
    }

    // Adjust speed for mobile
    if (this.deviceSpecs.device === 'mobile' && optimized.speed > 2.0) {
      optimized.speed = Math.min(optimized.speed, 1.5);
    }

    // Disable heavy effects on low-end devices
    if (this.deviceSpecs.device === 'low-end') {
      if (optimized.visualEffects) {
        optimized.visualEffects.screenShake = false;
        optimized.visualEffects.glowEffects = false;
      }
    }

    return optimized;
  }

  getDeviceSpecs(): DeviceOptimization {
    return { ...this.deviceSpecs };
  }

  shouldReduceQuality(currentFPS: number): boolean {
    return currentFPS < this.deviceSpecs.targetFPS * 0.8;
  }
}

// AI-Powered Suggestion Engine
export class AnimationAI {
  private static suggestionRules = [
    {
      id: 'mobile-blur-warning',
      condition: (settings: any, context: any) => 
        context.device === 'mobile' && settings.blurIntensity > 10,
      suggestion: {
        type: 'performance' as const,
        severity: 'warning' as const,
        message: 'High blur intensity detected on mobile device',
        recommendation: 'Reduce blur to 6-8px for better performance',
        autoFix: (settings: any) => ({ ...settings, blurIntensity: 6 })
      }
    },
    {
      id: 'speed-easing-mismatch',
      condition: (settings: any) => 
        settings.speed > 2.0 && settings.easing?.includes('elastic'),
      suggestion: {
        type: 'ux' as const,
        severity: 'info' as const,
        message: 'Fast speed with elastic easing may feel jarring',
        recommendation: 'Try "power2.out" for smoother fast animations',
        autoFix: (settings: any) => ({ ...settings, easing: 'power2.out' })
      }
    },
    {
      id: 'accessibility-concern',
      condition: (settings: any) => 
        settings.visualEffects?.screenShake && settings.speed < 1.0,
      suggestion: {
        type: 'accessibility' as const,
        severity: 'warning' as const,
        message: 'Slow screen shake may trigger vestibular sensitivity',
        recommendation: 'Disable screen shake for slow animations',
        autoFix: (settings: any) => ({
          ...settings,
          visualEffects: { ...settings.visualEffects, screenShake: false }
        })
      }
    }
  ];

  static generateSuggestions(settings: any, context: any): Array<AISuggestion & { autoFix?: (settings: any) => any }> {
    return this.suggestionRules
      .filter(rule => rule.condition(settings, context))
      .map(rule => ({
        id: rule.id,
        type: rule.suggestion.type,
        severity: rule.suggestion.severity,
        message: rule.suggestion.message,
        action: rule.suggestion.recommendation,
        autoFix: rule.suggestion.autoFix
      }));
  }

  static autoOptimize(settings: any, context: any): { settings: any; appliedFixes: string[] } {
    const suggestions = this.generateSuggestions(settings, context);
    let optimizedSettings = { ...settings };
    const appliedFixes: string[] = [];

    suggestions.forEach(suggestion => {
      if (suggestion.autoFix && suggestion.severity === 'warning') {
        optimizedSettings = suggestion.autoFix(optimizedSettings);
        appliedFixes.push(suggestion.id);
      }
    });

    return { settings: optimizedSettings, appliedFixes };
  }
}

// Node-Based Animation System (Simplified)
export class NodeAnimationEngine {
  private nodes: Map<string, NodeBasedAnimation> = new Map();
  private connections: NodeConnection[] = [];

  addNode(node: NodeBasedAnimation): void {
    this.nodes.set(node.id, node);
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.connections = this.connections.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    );
  }

  addConnection(connection: NodeConnection): void {
    this.connections.push(connection);
  }

  // Execute the node graph to generate final animation settings
  execute(): any {
    const result: any = {};
    const processed = new Set<string>();

    // Simple execution order - in a real implementation, this would use topological sorting
    const executeNode = (nodeId: string): any => {
      if (processed.has(nodeId)) return;
      
      const node = this.nodes.get(nodeId);
      if (!node) return;

      // Process inputs first
      node.inputs.forEach(input => {
        executeNode(input.sourceNodeId);
      });

      // Execute node logic based on type
      switch (node.type) {
        case 'speed':
          result.speed = node.parameters.value || 1.0;
          break;
        case 'easing':
          result.easing = node.parameters.type || 'power2.out';
          break;
        case 'blur':
          result.blurIntensity = node.parameters.intensity || 0;
          break;
        case 'effect':
          if (!result.visualEffects) result.visualEffects = {};
          result.visualEffects[node.parameters.effectType] = node.parameters.enabled;
          break;
      }

      processed.add(nodeId);
    };

    // Execute all nodes
    this.nodes.forEach((node, nodeId) => executeNode(nodeId));

    return result;
  }

  exportGraph(): { nodes: NodeBasedAnimation[]; connections: NodeConnection[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      connections: [...this.connections]
    };
  }

  importGraph(data: { nodes: NodeBasedAnimation[]; connections: NodeConnection[] }): void {
    this.nodes.clear();
    this.connections = [];
    
    data.nodes.forEach(node => this.addNode(node));
    data.connections.forEach(conn => this.addConnection(conn));
  }
}

// Timeline Animation System
export class TimelineAnimationEngine {
  private keyframes: TimelineKeyframe[] = [];
  private duration: number = 1.0; // seconds

  addKeyframe(keyframe: TimelineKeyframe): void {
    this.keyframes.push(keyframe);
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  removeKeyframe(index: number): void {
    this.keyframes.splice(index, 1);
  }

  // Get interpolated value at specific time (0-1)
  getValueAtTime(property: string, time: number): any {
    const propertyKeyframes = this.keyframes.filter(kf => kf.property === property);
    if (propertyKeyframes.length === 0) return null;

    // Find surrounding keyframes
    let beforeFrame = propertyKeyframes[0];
    let afterFrame = propertyKeyframes[propertyKeyframes.length - 1];

    for (let i = 0; i < propertyKeyframes.length - 1; i++) {
      if (propertyKeyframes[i].time <= time && propertyKeyframes[i + 1].time >= time) {
        beforeFrame = propertyKeyframes[i];
        afterFrame = propertyKeyframes[i + 1];
        break;
      }
    }

    // Simple linear interpolation (could be enhanced with easing)
    if (beforeFrame === afterFrame) return beforeFrame.value;

    const t = (time - beforeFrame.time) / (afterFrame.time - beforeFrame.time);
    
    if (typeof beforeFrame.value === 'number' && typeof afterFrame.value === 'number') {
      return beforeFrame.value + (afterFrame.value - beforeFrame.value) * t;
    }

    return t < 0.5 ? beforeFrame.value : afterFrame.value;
  }

  exportTimeline(): TimelineKeyframe[] {
    return [...this.keyframes];
  }

  importTimeline(keyframes: TimelineKeyframe[]): void {
    this.keyframes = [...keyframes];
    this.keyframes.sort((a, b) => a.time - b.time);
  }
}

// Performance Analytics
export class PerformanceAnalyzer {
  private metrics: PerformanceMetrics[] = [];
  private maxSamples = 100;

  addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    } as any);
    
    if (this.metrics.length > this.maxSamples) {
      this.metrics.shift();
    }
  }

  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        fps: 0,
        frameCount: 0,
        lastTime: 0,
        memoryUsage: 0,
        animationComplexity: 0
      };
    }

    const avg = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      frameCount: acc.frameCount + metric.frameCount,
      lastTime: acc.lastTime + metric.lastTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      animationComplexity: acc.animationComplexity + metric.animationComplexity
    }), {
      fps: 0,
      frameCount: 0,
      lastTime: 0,
      memoryUsage: 0,
      animationComplexity: 0
    });

    const count = this.metrics.length;
    return {
      fps: avg.fps / count,
      frameCount: avg.frameCount / count,
      lastTime: avg.lastTime / count,
      memoryUsage: avg.memoryUsage / count,
      animationComplexity: avg.animationComplexity / count
    };
  }

  getPerformanceTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.metrics.length < 10) return 'stable';

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    const recentAvgFps = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length;
    const olderAvgFps = older.reduce((sum, m) => sum + m.fps, 0) / older.length;

    const fpsChange = recentAvgFps - olderAvgFps;
    
    if (fpsChange > 2) return 'improving';
    if (fpsChange < -2) return 'degrading';
    return 'stable';
  }

  getOptimizationRecommendations(): string[] {
    const current = this.getAverageMetrics();
    const recommendations: string[] = [];

    if (current.fps < 45) {
      recommendations.push('Reduce animation complexity or blur intensity');
    }
    
    if (current.memoryUsage > 100) {
      recommendations.push('Optimize memory usage by reducing concurrent effects');
    }
    
    if (current.animationComplexity > 80) {
      recommendations.push('Simplify animation parameters for better performance');
    }

    return recommendations;
  }
}

// Template System
export class AnimationTemplateManager {
  private static readonly STORAGE_KEY = 'animation_templates';

  static saveTemplate(template: AnimationTemplate): void {
    const templates = this.loadTemplates();
    templates.push(template);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  static loadTemplates(): AnimationTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  static deleteTemplate(templateId: string): void {
    const templates = this.loadTemplates();
    const filtered = templates.filter(t => t.profile.id !== templateId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static exportTemplate(template: AnimationTemplate): string {
    return JSON.stringify(template, null, 2);
  }

  static importTemplate(jsonString: string): AnimationTemplate {
    return JSON.parse(jsonString);
  }
}

// Main Enhancement Coordinator
export class AnimationEnhancementEngine {
  private deviceOptimizer: DeviceOptimizer;
  private nodeEngine: NodeAnimationEngine;
  private timelineEngine: TimelineAnimationEngine;
  private performanceAnalyzer: PerformanceAnalyzer;

  constructor() {
    this.deviceOptimizer = DeviceOptimizer.getInstance();
    this.nodeEngine = new NodeAnimationEngine();
    this.timelineEngine = new TimelineAnimationEngine();
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  // Get enhanced settings with all optimizations applied
  getEnhancedSettings(baseSettings: any, context: any = {}): {
    settings: any;
    suggestions: AISuggestion[];
    deviceOptimizations: any;
    performanceRecommendations: string[];
  } {
    // Apply device optimizations
    const deviceOptimized = this.deviceOptimizer.getOptimizedSettings(baseSettings);
    
    // Get AI suggestions
    const suggestions = AnimationAI.generateSuggestions(deviceOptimized, {
      device: this.deviceOptimizer.getDeviceSpecs().device,
      ...context
    });

    // Get performance recommendations
    const performanceRecommendations = this.performanceAnalyzer.getOptimizationRecommendations();

    return {
      settings: deviceOptimized,
      suggestions,
      deviceOptimizations: this.deviceOptimizer.getDeviceSpecs(),
      performanceRecommendations
    };
  }

  // Update performance metrics
  updatePerformance(metrics: PerformanceMetrics): void {
    this.performanceAnalyzer.addMetrics(metrics);
  }

  // Get all engines for advanced usage
  getEngines() {
    return {
      device: this.deviceOptimizer,
      nodes: this.nodeEngine,
      timeline: this.timelineEngine,
      performance: this.performanceAnalyzer
    };
  }
}

// Export singleton instance
export const animationEngine = new AnimationEnhancementEngine();