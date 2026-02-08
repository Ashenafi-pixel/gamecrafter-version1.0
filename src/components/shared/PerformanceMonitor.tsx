import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, CheckCircle, Cpu, HardDrive, Zap, TrendingUp, TrendingDown } from 'lucide-react';

export interface PerformanceMetrics {
  fps: number;
  frameCount: number;
  lastTime: number;
  memoryUsage: number;
  animationComplexity: number;
  gpuUsage?: number;
  renderTime?: number;
  jsHeapSize?: number;
}

export interface PerformanceThresholds {
  fps: { good: number; warning: number; critical: number };
  memory: { good: number; warning: number; critical: number };
  complexity: { good: number; warning: number; critical: number };
}

export interface PerformanceMonitorProps {
  stepType: 'animation' | 'grid' | 'assets' | 'win-animation' | 'general';
  enabled?: boolean;
  realTime?: boolean;
  showAdvice?: boolean;
  onPerformanceChange?: (metrics: PerformanceMetrics) => void;
  thresholds?: Partial<PerformanceThresholds>;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { good: 55, warning: 45, critical: 30 },
  memory: { good: 50, warning: 100, critical: 150 },
  complexity: { good: 50, warning: 75, critical: 90 }
};

// Step-specific performance advice
const PERFORMANCE_ADVICE = {
  animation: {
    high_complexity: "Consider reducing blur intensity or visual effects for better performance",
    low_fps: "Animation speed and effects are impacting frame rate - try 'Mobile Optimized' preset",
    high_memory: "Complex animations are using significant memory - reduce concurrent effects",
    optimal: "Animation performance is excellent across all devices",
    gpu_intensive: "GPU-heavy effects detected - monitor performance on older devices"
  },
  grid: {
    high_complexity: "Large grid sizes require more processing power",
    low_fps: "Grid rendering is impacting performance - consider smaller grid size",
    high_memory: "Symbol count is affecting memory usage",
    optimal: "Grid performance is optimal",
    gpu_intensive: "Complex grid effects may impact older GPUs"
  },
  assets: {
    high_complexity: "Large assets are impacting performance",
    low_fps: "Asset loading/rendering affecting frame rate",
    high_memory: "High-resolution assets using significant memory",
    optimal: "Asset performance is well optimized",
    gpu_intensive: "High-quality textures may impact older devices"
  },
  'win-animation': {
    high_complexity: "Win animation effects are complex - consider simplifying",
    low_fps: "Win animations are impacting frame rate during gameplay",
    high_memory: "Particle systems using significant memory",
    optimal: "Win animation performance is excellent",
    gpu_intensive: "Particle effects are GPU-intensive"
  },
  general: {
    high_complexity: "Overall complexity is high",
    low_fps: "Performance is below optimal levels",
    high_memory: "Memory usage is high",
    optimal: "Performance is optimal",
    gpu_intensive: "GPU usage is high"
  }
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  stepType,
  enabled = true,
  realTime = true,
  showAdvice = true,
  onPerformanceChange,
  thresholds = {}
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameCount: 0,
    lastTime: performance.now(),
    memoryUsage: 45,
    animationComplexity: 35,
    gpuUsage: 25,
    renderTime: 8.5,
    jsHeapSize: 12.3
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Real-time performance monitoring
  useEffect(() => {
    if (!enabled || !realTime) return;

    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      if (deltaTime >= 1000) { // Update every second
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Simulate realistic metrics (in production, these would come from actual measurements)
        const newMetrics: PerformanceMetrics = {
          fps: Math.max(15, fps + (Math.random() - 0.5) * 10),
          frameCount: frameCountRef.current,
          lastTime: now,
          memoryUsage: Math.max(20, metrics.memoryUsage + (Math.random() - 0.5) * 5),
          animationComplexity: calculateComplexity(stepType),
          gpuUsage: Math.max(10, metrics.gpuUsage! + (Math.random() - 0.5) * 8),
          renderTime: Math.max(2, metrics.renderTime! + (Math.random() - 0.5) * 2),
          jsHeapSize: Math.max(5, metrics.jsHeapSize! + (Math.random() - 0.5) * 3)
        };

        setMetrics(newMetrics);
        setPerformanceHistory(prev => [...prev.slice(-29), newMetrics.fps]); // Keep last 30 readings
        
        if (onPerformanceChange) {
          onPerformanceChange(newMetrics);
        }
      }
      
      frameCountRef.current++;
    };

    const interval = setInterval(updateMetrics, 16); // ~60fps monitoring
    return () => clearInterval(interval);
  }, [enabled, realTime, stepType, onPerformanceChange, metrics.memoryUsage, metrics.gpuUsage, metrics.renderTime, metrics.jsHeapSize]);

  // Calculate step-specific complexity
  const calculateComplexity = (step: string): number => {
    // This would be calculated based on actual step complexity in production
    const baseComplexity = {
      animation: 40,
      grid: 25,
      assets: 30,
      'win-animation': 60,
      general: 35
    };
    
    return Math.max(10, baseComplexity[step as keyof typeof baseComplexity] + (Math.random() - 0.5) * 20);
  };

  // Get performance status
  const getPerformanceStatus = (): 'optimal' | 'warning' | 'critical' => {
    if (metrics.fps < mergedThresholds.fps.critical || 
        metrics.memoryUsage > mergedThresholds.memory.critical ||
        metrics.animationComplexity > mergedThresholds.complexity.critical) {
      return 'critical';
    }
    
    if (metrics.fps < mergedThresholds.fps.warning || 
        metrics.memoryUsage > mergedThresholds.memory.warning ||
        metrics.animationComplexity > mergedThresholds.complexity.warning) {
      return 'warning';
    }
    
    return 'optimal';
  };

  // Get performance advice
  const getAdvice = (): string => {
    const advice = PERFORMANCE_ADVICE[stepType];
    const status = getPerformanceStatus();
    
    if (status === 'critical') {
      if (metrics.fps < mergedThresholds.fps.critical) return advice.low_fps;
      if (metrics.memoryUsage > mergedThresholds.memory.critical) return advice.high_memory;
      return advice.high_complexity;
    }
    
    if (status === 'warning') {
      if (metrics.fps < mergedThresholds.fps.warning) return advice.low_fps;
      if (metrics.memoryUsage > mergedThresholds.memory.warning) return advice.high_memory;
      if (metrics.animationComplexity > mergedThresholds.complexity.warning) return advice.high_complexity;
      return advice.gpu_intensive;
    }
    
    return advice.optimal;
  };

  // Get status color
  const getStatusColor = () => {
    const status = getPerformanceStatus();
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    const status = getPerformanceStatus();
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  // Draw performance chart
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || performanceHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS line
    ctx.strokeStyle = getPerformanceStatus() === 'optimal' ? '#10b981' : 
                     getPerformanceStatus() === 'warning' ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    performanceHistory.forEach((fps, index) => {
      const x = (index / (performanceHistory.length - 1)) * width;
      const y = height - ((fps / 60) * height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  useEffect(() => {
    drawChart();
  }, [performanceHistory]);

  if (!enabled) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg ${getStatusColor()}`}>
            <Activity className="w-4 h-4 uw:w-8 uw:h-8" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="text-sm uw:text-3xl font-medium text-gray-900">Performance</span>
              {getStatusIcon()}
            </div>
            <div className="flex items-center space-x-4 text-xs uw:text-2xl text-gray-600">
              <span>{metrics.fps} FPS</span>
              <span>{metrics.memoryUsage.toFixed(0)}MB</span>
              <span>{metrics.animationComplexity.toFixed(0)}% complexity</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 uw:space-x-4">
          {getPerformanceStatus() === 'optimal' ? (
            <TrendingUp className="w-4 h-4 uw:h-8 uw:w-8 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 uw:h-8 uw:w-8 text-red-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 uw:p-6 uw:space-y-4 border-t border-gray-200 space-y-4">
          {/* Performance Chart */}
          <div className="bg-gray-50 rounded-lg p-3 uw:p-6">
            <div className="flex items-center justify-between mb-2 uw:mb-4">
              <span className="text-sm font-medium text-gray-700 uw:text-2xl">FPS History</span>
              <span className="text-xs text-gray-500 uw:text-xl">{performanceHistory.length}/30 samples</span>
            </div>
            <canvas
              ref={canvasRef}
              width={280}
              height={60}
              className="w-full h-15 uw:h-28 bg-white rounded border"
            />
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-3 uw:gap-6">
            <div className="space-y-2 uw:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 uw:space-x-4">
                  <Cpu className="w-4 h-4 uw:w-8 uw:h-8 text-blue-500" />
                  <span className="text-sm uw:text-2xl text-gray-700">GPU Usage</span>
                </div>
                <span className="text-sm uw:text-2xl font-medium">{metrics.gpuUsage?.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 uw:space-x-4">
                  <Zap className="w-4 h-4 uw:w-8 uw:h-8 text-yellow-500" />
                  <span className="text-sm uw:text-2xl text-gray-700">Render Time</span>
                </div>
                <span className="text-sm uw:text-2xl font-medium">{metrics.renderTime?.toFixed(1)}ms</span>
              </div>
            </div>

            <div className="space-y-2 uw:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 uw:space-x-4">
                  <HardDrive className="w-4 h-4 uw:w-8 uw:h-8 text-purple-500" />
                  <span className="text-sm uw:text-2xl text-gray-700">JS Heap</span>
                </div>
                <span className="text-sm uw:text-2xl font-medium">{metrics.jsHeapSize?.toFixed(1)}MB</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 uw:space-x-4">
                  <Activity className="w-4 h-4 uw:w-8 uw:h-8 text-green-500" />
                  <span className="text-sm uw:text-2xl text-gray-700">Complexity</span>
                </div>
                <span className="text-sm uw:text-2xl font-medium">{metrics.animationComplexity.toFixed(0)}%</span>  
              </div>
            </div>
          </div>

          {/* Performance Advice */}
          {showAdvice && (
            <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-start space-x-2 uw:space-x-4">
                {getStatusIcon()}
                <div>
                  <p className="text-sm font-medium mb-1 uw:text-2xl">Performance Advice</p>
                  <p className="text-xs opacity-90 uw:text-2xl">{getAdvice()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step-specific optimizations */}
          <div className="text-xs uw:text-2xl text-gray-500 space-y-1">
            <p className="font-medium uw:text-2xl">Optimization tips for {stepType}:</p>
            {stepType === 'animation' && (
              <ul className="list-disc list-inside space-y-1 ml-2 uw:space-y-2">
                <li className="uw:text-2xl">Reduce blur intensity for better mobile performance</li>
                <li className="uw:text-2xl">Use 'Mobile Optimized' preset for older devices</li>
                <li className="uw:text-2xl">Limit concurrent visual effects</li>
              </ul>
            )}
            {stepType === 'grid' && (
              <ul className="list-disc list-inside space-y-1 ml-2 uw:space-y-2">
                <li className="uw:text-2xl">Smaller grid sizes improve performance</li>
                <li className="uw:text-2xl">Reduce symbol complexity for better rendering</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};