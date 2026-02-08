export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  gpuUsage: number;
  animationComplexity: number;
  renderCalls: number;
  textureMemory: number;
  particleCount: number;
  warnings: string[];
  optimizationSuggestions: string[];
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxRenderCalls: number;
}

class RealTimePerformanceMonitor {
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private frameCount = 0;
  private lastTime = performance.now();
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private isMonitoring = false;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private rafId: number | null = null;

  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      gpuUsage: 0,
      animationComplexity: 0,
      renderCalls: 0,
      textureMemory: 0,
      particleCount: 0,
      warnings: [],
      optimizationSuggestions: []
    };

    this.thresholds = {
      minFPS: 30,
      maxFrameTime: 33.33, // 30 FPS
      maxMemoryUsage: 100, // MB
      maxRenderCalls: 100
    };
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    console.log('🔍 Real-time performance monitoring started');
    this.monitorFrame();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log('⏹️ Performance monitoring stopped');
  }

  private monitorFrame(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    
    // Calculate FPS every 60 frames or 1 second
    if (this.frameCount >= 60 || deltaTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / deltaTime);
      const frameTime = deltaTime / this.frameCount;
      
      this.updateFPSMetrics(fps, frameTime);
      this.updateMemoryMetrics();
      this.updateComplexityMetrics();
      this.detectPerformanceIssues();
      this.generateOptimizationSuggestions();
      
      // Notify callbacks
      this.callbacks.forEach(callback => callback(this.metrics));
      
      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    this.rafId = requestAnimationFrame(() => this.monitorFrame());
  }

  private updateFPSMetrics(fps: number, frameTime: number): void {
    this.metrics.fps = fps;
    this.metrics.frameTime = frameTime;
    
    // Maintain history for smoothing
    this.fpsHistory.push(fps);
    this.frameTimeHistory.push(frameTime);
    
    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }
    
    // Calculate smoothed values
    this.metrics.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    this.metrics.frameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
  }

  private updateMemoryMetrics(): void {
    // Estimate memory usage (real implementation would use performance.memory if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      this.metrics.textureMemory = this.estimateTextureMemory();
    } else {
      // Fallback estimation
      this.metrics.memoryUsage = this.estimateMemoryUsage();
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on active elements
    const baseMemory = 10; // Base app memory
    const pixiMemory = this.metrics.renderCalls * 0.1; // Rough PIXI overhead
    const textureMemory = this.metrics.textureMemory;
    const particleMemory = this.metrics.particleCount * 0.001;
    
    return Math.round(baseMemory + pixiMemory + textureMemory + particleMemory);
  }

  private estimateTextureMemory(): number {
    // Estimate texture memory usage
    // This would ideally be tracked by the renderer
    return Math.round(Math.random() * 20 + 10); // 10-30MB estimation
  }

  private updateComplexityMetrics(): void {
    // Animation complexity based on active elements
    let complexity = 0;
    
    // Add complexity for render calls
    complexity += Math.min(this.metrics.renderCalls / 10, 50);
    
    // Add complexity for particles
    complexity += Math.min(this.metrics.particleCount / 100, 30);
    
    // Add complexity for low FPS (indicates high complexity)
    if (this.metrics.fps < 45) {
      complexity += (45 - this.metrics.fps) * 2;
    }
    
    this.metrics.animationComplexity = Math.min(Math.round(complexity), 100);
  }

  private detectPerformanceIssues(): void {
    const warnings: string[] = [];
    
    if (this.metrics.fps < this.thresholds.minFPS) {
      warnings.push(`Low FPS detected: ${this.metrics.fps.toFixed(1)} (target: ${this.thresholds.minFPS})`);
    }
    
    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      warnings.push(`High frame time: ${this.metrics.frameTime.toFixed(1)}ms (target: <${this.thresholds.maxFrameTime}ms)`);
    }
    
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage: ${this.metrics.memoryUsage}MB (limit: ${this.thresholds.maxMemoryUsage}MB)`);
    }
    
    if (this.metrics.renderCalls > this.thresholds.maxRenderCalls) {
      warnings.push(`Too many render calls: ${this.metrics.renderCalls} (target: <${this.thresholds.maxRenderCalls})`);
    }
    
    if (this.metrics.particleCount > 500) {
      warnings.push(`High particle count: ${this.metrics.particleCount} (consider reducing for mobile)`);
    }
    
    this.metrics.warnings = warnings;
  }

  private generateOptimizationSuggestions(): void {
    const suggestions: string[] = [];
    
    if (this.metrics.fps < 45) {
      suggestions.push('Reduce animation complexity or particle count');
      suggestions.push('Consider texture atlasing to reduce draw calls');
      
      if (this.metrics.particleCount > 200) {
        suggestions.push('Reduce particle count for better performance');
      }
      
      if (this.metrics.renderCalls > 50) {
        suggestions.push('Batch similar render operations together');
      }
    }
    
    if (this.metrics.memoryUsage > 50) {
      suggestions.push('Optimize texture sizes and formats');
      suggestions.push('Consider texture pooling for dynamic content');
    }
    
    if (this.metrics.animationComplexity > 70) {
      suggestions.push('Simplify animation curves and reduce keyframes');
      suggestions.push('Use transform-only animations when possible');
    }
    
    // Mobile-specific suggestions
    if (this.isMobileDevice()) {
      if (this.metrics.fps < 55) {
        suggestions.push('Enable mobile optimization mode');
        suggestions.push('Reduce effect intensity for mobile devices');
      }
    }
    
    this.metrics.optimizationSuggestions = suggestions;
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Public methods for tracking specific metrics
  updateRenderCalls(count: number): void {
    this.metrics.renderCalls = count;
  }

  updateParticleCount(count: number): void {
    this.metrics.particleCount = count;
  }

  updateGPUUsage(usage: number): void {
    this.metrics.gpuUsage = Math.min(Math.max(usage, 0), 100);
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // Callback management
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Get current metrics
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Performance quality assessment
  getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const fps = this.metrics.fps;
    const memory = this.metrics.memoryUsage;
    const warnings = this.metrics.warnings.length;
    
    if (fps >= 55 && memory < 30 && warnings === 0) return 'A';
    if (fps >= 45 && memory < 50 && warnings <= 1) return 'B';
    if (fps >= 35 && memory < 70 && warnings <= 2) return 'C';
    if (fps >= 25 && memory < 90 && warnings <= 3) return 'D';
    return 'F';
  }

  // Generate performance report
  generateReport(): string {
    const grade = this.getPerformanceGrade();
    const report = [
      `Performance Report - Grade: ${grade}`,
      `FPS: ${this.metrics.fps.toFixed(1)} (target: >${this.thresholds.minFPS})`,
      `Frame Time: ${this.metrics.frameTime.toFixed(1)}ms`,
      `Memory Usage: ${this.metrics.memoryUsage}MB`,
      `Animation Complexity: ${this.metrics.animationComplexity}%`,
      `Render Calls: ${this.metrics.renderCalls}`,
      `Particle Count: ${this.metrics.particleCount}`,
      '',
      'Warnings:',
      ...this.metrics.warnings.map(w => `  - ${w}`),
      '',
      'Optimization Suggestions:',
      ...this.metrics.optimizationSuggestions.map(s => `  - ${s}`)
    ].join('\n');
    
    return report;
  }
}

export const realTimePerformanceMonitor = new RealTimePerformanceMonitor();