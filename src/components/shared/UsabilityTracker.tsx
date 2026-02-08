import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Clock, MousePointer, Eye, TrendingUp, AlertCircle } from 'lucide-react';

export interface UsabilityEvent {
  id: string;
  type: 'click' | 'hover' | 'focus' | 'scroll' | 'error' | 'completion' | 'abandonment';
  element: string;
  stepType: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export interface UsabilityMetrics {
  totalInteractions: number;
  averageTaskTime: number;
  errorRate: number;
  completionRate: number;
  mostUsedFeatures: Array<{ element: string; usage: number }>;
  problemAreas: Array<{ element: string; issues: number }>;
  sessionDuration: number;
  bounceRate: number;
}

export interface UsabilityTrackerProps {
  stepType: 'animation' | 'grid' | 'assets' | 'win-animation' | 'theme' | 'general';
  enabled?: boolean;
  enableHeatmap?: boolean;
  showRealTimeMetrics?: boolean;
  onMetricsUpdate?: (metrics: UsabilityMetrics) => void;
  onEventCapture?: (event: UsabilityEvent) => void;
}

// Track user behavior patterns
const BEHAVIOR_PATTERNS = {
  animation: {
    expectedFlow: ['speed-control', 'easing-select', 'test-button', 'apply-changes'],
    criticalElements: ['test-spin-button', 'preset-buttons', 'speed-slider'],
    errorProne: ['advanced-settings', 'custom-easing']
  },
  grid: {
    expectedFlow: ['grid-size-select', 'preview-update', 'confirm-changes'],
    criticalElements: ['grid-selector', 'preview-area'],
    errorProne: ['custom-grid-input']
  },
  // Placeholders for other steps
  assets: { expectedFlow: [], criticalElements: [], errorProne: [] },
  'win-animation': { expectedFlow: [], criticalElements: [], errorProne: [] },
  theme: { expectedFlow: [], criticalElements: [], errorProne: [] },
  general: { expectedFlow: [], criticalElements: [], errorProne: [] }
};

export const UsabilityTracker: React.FC<UsabilityTrackerProps> = ({
  stepType,
  enabled = true,
  enableHeatmap = false,
  showRealTimeMetrics = false,
  onMetricsUpdate,
  onEventCapture
}) => {
  const [events, setEvents] = useState<UsabilityEvent[]>([]);
  const [metrics, setMetrics] = useState<UsabilityMetrics>({
    totalInteractions: 0,
    averageTaskTime: 0,
    errorRate: 0,
    completionRate: 0,
    mostUsedFeatures: [],
    problemAreas: [],
    sessionDuration: 0,
    bounceRate: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Array<{ x: number; y: number; intensity: number }>>([]);
  
  const sessionStartRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Capture user interactions
  useEffect(() => {
    if (!enabled) return;

    const captureEvent = (type: UsabilityEvent['type'], element: string, metadata?: Record<string, any>) => {
      const event: UsabilityEvent = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        element,
        stepType,
        timestamp: new Date(),
        metadata,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
      
      if (onEventCapture) {
        onEventCapture(event);
      }
    };

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const element = target.closest('[data-track]')?.getAttribute('data-track') ||
                     target.tagName.toLowerCase() + (target.className ? `.${target.className.split(' ')[0]}` : '');
      
      captureEvent('click', element, {
        x: e.clientX,
        y: e.clientY,
        button: e.button
      });

      // Update heatmap data
      if (enableHeatmap) {
        setHeatmapData(prev => [...prev.slice(-49), { 
          x: e.clientX, 
          y: e.clientY, 
          intensity: 1 
        }]);
      }
    };

    // Hover tracking for important elements
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-track-hover]')) {
        const element = target.getAttribute('data-track-hover') || target.tagName.toLowerCase();
        captureEvent('hover', element);
      }
    };

    // Error tracking
    const handleError = (e: ErrorEvent) => {
      captureEvent('error', 'javascript-error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno
      });
    };

    // Focus tracking for form elements
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        captureEvent('focus', target.name || target.id || target.tagName.toLowerCase());
      }
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('focus', handleFocus, true);
    window.addEventListener('error', handleError);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('error', handleError);
    };
  }, [enabled, stepType, enableHeatmap, onEventCapture]);

  // Calculate metrics
  useEffect(() => {
    if (events.length === 0) return;

    const now = Date.now();
    const sessionDuration = (now - sessionStartRef.current) / 1000;

    // Count interactions by element
    const elementCounts = events.reduce((acc, event) => {
      acc[event.element] = (acc[event.element] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most used features
    const mostUsedFeatures = Object.entries(elementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([element, usage]) => ({ element, usage }));

    // Calculate error rate
    const errorEvents = events.filter(e => e.type === 'error').length;
    const errorRate = events.length > 0 ? (errorEvents / events.length) * 100 : 0;

    // Identify problem areas (elements with high error rates or abandonment)
    const problemElements = events
      .filter(e => e.type === 'error' || e.type === 'abandonment')
      .reduce((acc, event) => {
        acc[event.element] = (acc[event.element] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const problemAreas = Object.entries(problemElements)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([element, issues]) => ({ element, issues }));

    // Calculate completion rate based on expected flow
    const expectedFlow = BEHAVIOR_PATTERNS[stepType]?.expectedFlow || [];
    const completedSteps = expectedFlow.filter(step => 
      events.some(e => e.element.includes(step))
    ).length;
    const completionRate = expectedFlow.length > 0 ? (completedSteps / expectedFlow.length) * 100 : 0;

    // Calculate average task time (time between first and last interaction)
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const averageTaskTime = firstEvent && lastEvent ? 
      (lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / 1000 : 0;

    const newMetrics: UsabilityMetrics = {
      totalInteractions: events.length,
      averageTaskTime,
      errorRate,
      completionRate,
      mostUsedFeatures,
      problemAreas,
      sessionDuration,
      bounceRate: events.length < 3 ? 100 : 0 // Simple bounce detection
    };

    setMetrics(newMetrics);

    if (onMetricsUpdate) {
      onMetricsUpdate(newMetrics);
    }
  }, [events, stepType, onMetricsUpdate]);

  // Get insight based on metrics
  const getUsabilityInsight = (): string => {
    if (metrics.errorRate > 10) return "High error rate detected - users struggling with interface";
    if (metrics.completionRate < 50) return "Low completion rate - consider simplifying workflow";
    if (metrics.bounceRate > 50) return "High bounce rate - users not engaging with features";
    if (metrics.averageTaskTime > 60) return "Tasks taking longer than expected - consider UX improvements";
    return "Usability metrics are within normal ranges";
  };

  // Get color for metrics
  const getMetricColor = (value: number, type: 'error' | 'completion' | 'time') => {
    switch (type) {
      case 'error':
        return value > 10 ? 'text-red-600' : value > 5 ? 'text-yellow-600' : 'text-green-600';
      case 'completion':
        return value < 50 ? 'text-red-600' : value < 80 ? 'text-yellow-600' : 'text-green-600';
      case 'time':
        return value > 60 ? 'text-red-600' : value > 30 ? 'text-yellow-600' : 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Heatmap Overlay */}
      {enableHeatmap && heatmapData.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {heatmapData.map((point, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 bg-red-500 rounded-full opacity-30 animate-pulse"
              style={{
                left: point.x - 8,
                top: point.y - 8,
                transform: 'scale(0.5)'
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">
              {metrics.totalInteractions} interactions • {metrics.sessionDuration.toFixed(0)}s session
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {showRealTimeMetrics && (
            <div className="flex items-center space-x-3 text-xs">
              <span className={`font-medium ${getMetricColor(metrics.errorRate, 'error')}`}>
                {metrics.errorRate.toFixed(1)}% errors
              </span>
              <span className={`font-medium ${getMetricColor(metrics.completionRate, 'completion')}`}>
                {metrics.completionRate.toFixed(0)}% completion
              </span>
            </div>
          )}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live tracking active" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MousePointer className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Interactions</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalInteractions}</div>
              <div className="text-xs text-gray-600">Total clicks & actions</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Task Time</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.averageTaskTime, 'time')}`}>
                {metrics.averageTaskTime.toFixed(1)}s
              </div>
              <div className="text-xs text-gray-600">Average completion time</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, 'error')}`}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Errors per interaction</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Completion</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.completionRate, 'completion')}`}>
                {metrics.completionRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">Workflow completion rate</div>
            </div>
          </div>

          {/* Most Used Features */}
          {metrics.mostUsedFeatures.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Most Used Features
              </h4>
              <div className="space-y-1">
                {metrics.mostUsedFeatures.map((feature, index) => (
                  <div key={feature.element} className="flex justify-between text-sm">
                    <span className="text-blue-700">{feature.element}</span>
                    <span className="text-blue-600 font-medium">{feature.usage} uses</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Problem Areas */}
          {metrics.problemAreas.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Problem Areas
              </h4>
              <div className="space-y-1">
                {metrics.problemAreas.map((area) => (
                  <div key={area.element} className="flex justify-between text-sm">
                    <span className="text-red-700">{area.element}</span>
                    <span className="text-red-600 font-medium">{area.issues} issues</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usability Insight */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">Usability Insight</span>
            </div>
            <p className="text-sm text-orange-700">{getUsabilityInsight()}</p>
          </div>

          {/* Recent Events (for debugging) */}
          <details className="text-xs">
            <summary className="text-gray-600 cursor-pointer hover:text-gray-800">
              Recent Events ({events.slice(-5).length})
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {events.slice(-5).reverse().map((event) => (
                <div key={event.id} className="text-gray-500 font-mono">
                  {event.timestamp.toLocaleTimeString()} - {event.type}: {event.element}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};