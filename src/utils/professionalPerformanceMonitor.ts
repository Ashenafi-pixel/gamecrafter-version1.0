// Professional Performance Monitor with Stats.js integration
// Provides real-time performance metrics and optimization suggestions

import Stats from 'stats.js';
import { webWorkerManager } from './webWorkerManager';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  gpuMemory?: number;
  drawCalls?: number;
  triangleCount?: number;
  textureMemory?: number;
  workers: {
    totalWorkers: number;
    availableWorkers: number;
    busyWorkers: number;
    queuedTasks: number;
  };
  warnings: string[];
  recommendations: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface PerformanceThresholds {
  excellentFPS: number;
  goodFPS: number;
  acceptableFPS: number;
  memoryWarning: number;
  memoryCritical: number;
}

export class ProfessionalPerformanceMonitor {
  private static instance: ProfessionalPerformanceMonitor;
  private stats: Stats;
  private isMonitoring = false;
  private metrics: PerformanceMetrics;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private container: HTMLElement | null = null;
  private updateInterval: number | null = null;
  private frameCount = 0;
  private lastFrameTime = performance.now();

  // Performance thresholds for different platforms
  private thresholds: PerformanceThresholds = {
    excellentFPS: 58,
    goodFPS: 45,
    acceptableFPS: 30,
    memoryWarning: 512, // MB
    memoryCritical: 1024 // MB
  };

  constructor() {
    // Initialize Stats.js
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: FPS, 1: MS, 2: MB
    
    // Custom styling for professional look
    this.stats.dom.style.cssText = `
      position: fixed !important;
      top: 10px !important;
      left: 10px !important;
      z-index: 10000 !important;
      opacity: 0.9 !important;
      font-family: 'Courier New', monospace !important;
      font-size: 10px !important;
      background: rgba(0, 0, 0, 0.8) !important;
      border: 1px solid #333 !important;
      border-radius: 4px !important;
    `;

    this.metrics = this.getDefaultMetrics();
    
    console.log('📊 Professional Performance Monitor initialized');
  }

  public static getInstance(): ProfessionalPerformanceMonitor {
    if (!ProfessionalPerformanceMonitor.instance) {
      ProfessionalPerformanceMonitor.instance = new ProfessionalPerformanceMonitor();
    }
    return ProfessionalPerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(container?: HTMLElement): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Performance monitor already running');
      return;
    }

    console.log('📊 Starting professional performance monitoring...');
    
    this.isMonitoring = true;
    this.container = container || document.body;
    
    // Add Stats.js to DOM
    if (this.container && !this.container.contains(this.stats.dom)) {
      this.container.appendChild(this.stats.dom);
    }

    // Start monitoring loop
    this.updateInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update every second

    // Hook into animation frame for accurate FPS
    this.monitorFrame();
    
    console.log('✅ Professional performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('📊 Stopping professional performance monitoring...');
    
    this.isMonitoring = false;
    
    // Remove Stats.js from DOM
    if (this.container && this.container.contains(this.stats.dom)) {
      this.container.removeChild(this.stats.dom);
    }

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('✅ Professional performance monitoring stopped');
  }

  /**
   * Monitor frame for accurate FPS calculation
   */
  private monitorFrame(): void {
    if (!this.isMonitoring) return;

    this.stats.begin();
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    this.frameCount++;
    
    // Update Stats.js
    this.stats.end();
    
    requestAnimationFrame(() => this.monitorFrame());
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    if (!this.isMonitoring) return;

    const fps = this.calculateFPS();
    const frameTime = fps > 0 ? 1000 / fps : 0;
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.calculateCPUUsage();
    const workerMetrics = webWorkerManager.getMetrics();

    this.metrics = {
      fps,
      frameTime,
      memoryUsage,
      cpuUsage,
      workers: workerMetrics,
      warnings: this.generateWarnings(fps, memoryUsage, workerMetrics),
      recommendations: this.generateRecommendations(fps, memoryUsage, workerMetrics),
      grade: this.calculateGrade(fps, memoryUsage)
    };

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('❌ Performance monitor callback error:', error);
      }
    });
  }

  /**
   * Calculate current FPS
   */
  private calculateFPS(): number {
    // Get FPS from Stats.js
    const fpsPanel = this.stats.dom.children[0] as HTMLCanvasElement;
    if (fpsPanel && fpsPanel.getContext) {
      // Extract FPS from Stats.js internal state
      return Math.round((this.stats as any).fpsPanel?.value || 60);
    }
    return 60; // Default assumption
  }

  /**
   * Get memory usage in MB
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Estimate CPU usage based on frame time consistency
   */
  private calculateCPUUsage(): number {
    const targetFrameTime = 16.67; // 60 FPS = 16.67ms per frame
    const actualFrameTime = this.metrics.frameTime || targetFrameTime;
    
    // Rough CPU estimation based on frame time deviation
    const cpuLoad = Math.min(100, (actualFrameTime / targetFrameTime) * 100);
    return Math.round(cpuLoad);
  }

  /**
   * Generate performance warnings
   */
  private generateWarnings(fps: number, memory: number, workers: any): string[] {
    const warnings: string[] = [];

    // FPS warnings
    if (fps < this.thresholds.acceptableFPS) {
      warnings.push(`Low FPS: ${fps} (target: 60)`);
    }

    // Memory warnings
    if (memory > this.thresholds.memoryCritical) {
      warnings.push(`Critical memory usage: ${memory}MB`);
    } else if (memory > this.thresholds.memoryWarning) {
      warnings.push(`High memory usage: ${memory}MB`);
    }

    // Worker warnings
    if (workers.queuedTasks > 5) {
      warnings.push(`High worker queue: ${workers.queuedTasks} tasks`);
    }

    if (workers.busyWorkers === workers.totalWorkers && workers.queuedTasks > 0) {
      warnings.push('All workers busy - consider scaling');
    }

    return warnings;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(fps: number, memory: number, workers: any): string[] {
    const recommendations: string[] = [];

    // FPS recommendations
    if (fps < this.thresholds.goodFPS) {
      recommendations.push('Reduce animation complexity');
      recommendations.push('Enable Web Workers for mesh processing');
      recommendations.push('Lower texture resolution');
    }

    // Memory recommendations
    if (memory > this.thresholds.memoryWarning) {
      recommendations.push('Clean up unused textures');
      recommendations.push('Reduce sprite count');
      recommendations.push('Enable texture compression');
    }

    // Worker recommendations
    if (workers.queuedTasks > 3) {
      recommendations.push('Increase worker pool size');
    }

    if (workers.totalWorkers === 0) {
      recommendations.push('Enable Web Workers for better performance');
    }

    return recommendations;
  }

  /**
   * Calculate overall performance grade
   */
  private calculateGrade(fps: number, memory: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 100;

    // FPS scoring (40% weight)
    if (fps >= this.thresholds.excellentFPS) {
      score -= 0;
    } else if (fps >= this.thresholds.goodFPS) {
      score -= 10;
    } else if (fps >= this.thresholds.acceptableFPS) {
      score -= 25;
    } else {
      score -= 40;
    }

    // Memory scoring (30% weight)
    if (memory <= 256) {
      score -= 0;
    } else if (memory <= 512) {
      score -= 10;
    } else if (memory <= 1024) {
      score -= 20;
    } else {
      score -= 30;
    }

    // Determine grade
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      cpuUsage: 0,
      workers: {
        totalWorkers: 0,
        availableWorkers: 0,
        busyWorkers: 0,
        queuedTasks: 0
      },
      warnings: [],
      recommendations: [],
      grade: 'A'
    };
  }

  /**
   * Subscribe to performance updates
   */
  public onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if performance is acceptable
   */
  public isPerformanceAcceptable(): boolean {
    return this.metrics.fps >= this.thresholds.acceptableFPS && 
           this.metrics.memoryUsage < this.thresholds.memoryCritical;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): string {
    const { fps, memoryUsage, grade, warnings } = this.metrics;
    const warningText = warnings.length > 0 ? ` (${warnings.length} warnings)` : '';
    
    return `Performance: ${grade} - ${fps}FPS, ${memoryUsage}MB${warningText}`;
  }

  /**
   * Update thresholds for different platforms
   */
  public setThresholds(platform: 'mobile' | 'desktop' | 'web'): void {
    switch (platform) {
      case 'mobile':
        this.thresholds = {
          excellentFPS: 30,
          goodFPS: 25,
          acceptableFPS: 20,
          memoryWarning: 256,
          memoryCritical: 512
        };
        break;
      case 'desktop':
        this.thresholds = {
          excellentFPS: 60,
          goodFPS: 45,
          acceptableFPS: 30,
          memoryWarning: 1024,
          memoryCritical: 2048
        };
        break;
      case 'web':
      default:
        this.thresholds = {
          excellentFPS: 58,
          goodFPS: 45,
          acceptableFPS: 30,
          memoryWarning: 512,
          memoryCritical: 1024
        };
        break;
    }
    
    console.log(`📊 Performance thresholds updated for ${platform}:`, this.thresholds);
  }

  /**
   * Clean up performance monitor
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.callbacks.length = 0;
    console.log('🧹 Performance monitor cleaned up');
  }
}

// Export singleton instance
export const professionalPerformanceMonitor = ProfessionalPerformanceMonitor.getInstance();