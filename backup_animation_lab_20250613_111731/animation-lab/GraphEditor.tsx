import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid, Move, RotateCcw, Zap, Settings, 
  TrendingUp, Activity, Target, Brain
} from 'lucide-react';
import { useAutomationStore } from '../../store/automationStore';
import { automatedPixiRenderer } from '../../utils/automatedPixiRenderer';

interface GraphPoint {
  id: string;
  time: number;
  value: number;
  handleInX: number;
  handleInY: number;
  handleOutX: number;
  handleOutY: number;
  selected: boolean;
  type: 'keyframe' | 'handle-in' | 'handle-out';
}

interface AnimationCurve {
  id: string;
  elementId: string;
  property: string;
  points: GraphPoint[];
  color: string;
  visible: boolean;
  aiGenerated: boolean;
  confidence: number;
}

const GraphEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [curves, setCurves] = useState<AnimationCurve[]>([]);
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewBounds, setViewBounds] = useState({ 
    minTime: 0, maxTime: 2, minValue: -1, maxValue: 2 
  });
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [curveAnalysis, setCurveAnalysis] = useState<any>(null);

  const {
    selectedPreset,
    animationState,
    updateAnimationState,
    automationLevel
  } = useAutomationStore();

  // Generate curves from animation preset
  useEffect(() => {
    if (selectedPreset) {
      generateCurvesFromPreset();
    }
  }, [selectedPreset]);

  const generateCurvesFromPreset = useCallback(() => {
    if (!selectedPreset) return;

    const newCurves: AnimationCurve[] = [];
    const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    let colorIndex = 0;

    selectedPreset.animations.forEach(animation => {
      // Create curves for each animated property
      const properties = new Set<string>();
      animation.keyframes.forEach(kf => {
        Object.keys(kf.properties).forEach(prop => properties.add(prop));
      });

      Array.from(properties).forEach(property => {
        const keyframes = animation.keyframes.filter(kf => 
          kf.properties[property] !== undefined
        );

        const points: GraphPoint[] = keyframes.map((kf, index) => ({
          id: `${animation.elementId}-${property}-${index}`,
          time: kf.time,
          value: kf.properties[property],
          handleInX: kf.time - 0.1,
          handleInY: kf.properties[property],
          handleOutX: kf.time + 0.1,
          handleOutY: kf.properties[property],
          selected: false,
          type: 'keyframe'
        }));

        // Apply AI-generated easing to handles
        points.forEach((point, index) => {
          const keyframe = keyframes[index];
          if (keyframe.easing !== 'linear' && index < points.length - 1) {
            const nextPoint = points[index + 1];
            const timeDiff = nextPoint.time - point.time;
            const valueDiff = nextPoint.value - point.value;

            switch (keyframe.easing) {
              case 'ease-in':
                point.handleOutX = point.time + timeDiff * 0.4;
                point.handleOutY = point.value + valueDiff * 0.1;
                nextPoint.handleInX = nextPoint.time - timeDiff * 0.1;
                nextPoint.handleInY = nextPoint.value - valueDiff * 0.4;
                break;
              case 'ease-out':
                point.handleOutX = point.time + timeDiff * 0.1;
                point.handleOutY = point.value + valueDiff * 0.4;
                nextPoint.handleInX = nextPoint.time - timeDiff * 0.4;
                nextPoint.handleInY = nextPoint.value - valueDiff * 0.1;
                break;
              case 'ease-in-out':
                point.handleOutX = point.time + timeDiff * 0.3;
                point.handleOutY = point.value + valueDiff * 0.2;
                nextPoint.handleInX = nextPoint.time - timeDiff * 0.3;
                nextPoint.handleInY = nextPoint.value - valueDiff * 0.2;
                break;
            }
          }
        });

        const curve: AnimationCurve = {
          id: `${animation.elementId}-${property}`,
          elementId: animation.elementId,
          property,
          points,
          color: colors[colorIndex % colors.length],
          visible: true,
          aiGenerated: true,
          confidence: selectedPreset.confidence
        };

        newCurves.push(curve);
        colorIndex++;
      });
    });

    setCurves(newCurves);
    if (newCurves.length > 0) {
      setSelectedCurve(newCurves[0].id);
      analyzeSelectedCurve(newCurves[0]);
    }
  }, [selectedPreset]);

  // AI-powered curve analysis
  const analyzeSelectedCurve = useCallback(async (curve: AnimationCurve) => {
    if (!curve || !showAIAssistant) return;

    // Simulate AI analysis of animation curve
    const analysis = {
      smoothness: Math.random() * 0.3 + 0.7, // 0.7-1.0
      organicQuality: Math.random() * 0.4 + 0.6,
      energyLevel: Math.random() * 0.5 + 0.5,
      suggestions: [
        "Consider adding slight overshoot for more organic feel",
        "Curve could benefit from ease-in-out for smoother motion",
        "Current timing feels natural for wing flutter"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      confidence: curve.confidence,
      improvements: {
        smoother: Math.random() > 0.5,
        moreOrganic: Math.random() > 0.3,
        betterTiming: Math.random() > 0.6
      }
    };

    setCurveAnalysis(analysis);
  }, [showAIAssistant]);

  // Draw graph editor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGraph(ctx);
  }, [curves, selectedCurve, selectedPoints, animationState.currentTime, viewBounds]);

  const drawGraph = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw curves
    curves.forEach(curve => {
      if (curve.visible) {
        drawCurve(ctx, curve, width, height);
      }
    });
    
    // Draw time indicator
    drawTimeIndicator(ctx, width, height);
    
    // Draw AI analysis overlay
    if (showAIAssistant && curveAnalysis) {
      drawAIAnalysis(ctx, width, height);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Vertical lines (time)
    const timeStep = 0.25;
    for (let time = viewBounds.minTime; time <= viewBounds.maxTime; time += timeStep) {
      const x = timeToPixel(time, width);
      if (x >= 0 && x <= width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Time labels
        if (time % 0.5 === 0) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px Arial';
          ctx.fillText(`${time.toFixed(1)}s`, x + 2, height - 5);
        }
      }
    }
    
    // Horizontal lines (value)
    const valueStep = 0.5;
    for (let value = viewBounds.minValue; value <= viewBounds.maxValue; value += valueStep) {
      const y = valueToPixel(value, height);
      if (y >= 0 && y <= height) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Value labels
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px Arial';
        ctx.fillText(value.toFixed(1), 5, y - 2);
      }
    }
    
    // Center axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    // Time axis (y = 0)
    const zeroY = valueToPixel(0, height);
    if (zeroY >= 0 && zeroY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();
    }
    
    // Value axis (x = 0)
    const zeroX = timeToPixel(0, width);
    if (zeroX >= 0 && zeroX <= width) {
      ctx.beginPath();
      ctx.moveTo(zeroX, 0);
      ctx.lineTo(zeroX, height);
      ctx.stroke();
    }
  };

  const drawCurve = (ctx: CanvasRenderingContext2D, curve: AnimationCurve, width: number, height: number) => {
    if (curve.points.length < 2) return;
    
    const isSelected = curve.id === selectedCurve;
    const alpha = isSelected ? 1.0 : 0.5;
    
    // Draw curve path
    ctx.strokeStyle = curve.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    
    const sortedPoints = [...curve.points].sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const current = sortedPoints[i];
      const next = sortedPoints[i + 1];
      
      const x1 = timeToPixel(current.time, width);
      const y1 = valueToPixel(current.value, height);
      const x2 = timeToPixel(next.time, width);
      const y2 = valueToPixel(next.value, height);
      
      const cp1x = timeToPixel(current.handleOutX, width);
      const cp1y = valueToPixel(current.handleOutY, height);
      const cp2x = timeToPixel(next.handleInX, width);
      const cp2y = valueToPixel(next.handleInY, height);
      
      if (i === 0) ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    }
    
    ctx.stroke();
    
    // Draw keyframes
    curve.points.forEach(point => {
      drawKeyframe(ctx, point, width, height, isSelected);
    });
    
    // Draw handles if selected
    if (isSelected) {
      curve.points.forEach(point => {
        drawHandles(ctx, point, width, height);
      });
    }
    
    // Draw AI confidence indicator
    if (curve.aiGenerated && isSelected) {
      drawAIConfidenceIndicator(ctx, curve, width);
    }
  };

  const drawKeyframe = (ctx: CanvasRenderingContext2D, point: GraphPoint, width: number, height: number, isSelected: boolean) => {
    const x = timeToPixel(point.time, width);
    const y = valueToPixel(point.value, height);
    const size = point.selected ? 8 : 6;
    
    ctx.fillStyle = point.selected ? '#fbbf24' : (isSelected ? '#ffffff' : '#9ca3af');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw value label for selected keyframes
    if (point.selected) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Arial';
      ctx.fillText(
        `${point.time.toFixed(2)}s, ${point.value.toFixed(2)}`,
        x + 10, y - 10
      );
    }
  };

  const drawHandles = (ctx: CanvasRenderingContext2D, point: GraphPoint, width: number, height: number) => {
    const x = timeToPixel(point.time, width);
    const y = valueToPixel(point.value, height);
    
    const inX = timeToPixel(point.handleInX, width);
    const inY = valueToPixel(point.handleInY, height);
    const outX = timeToPixel(point.handleOutX, width);
    const outY = valueToPixel(point.handleOutY, height);
    
    // Handle lines
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(inX, inY);
    ctx.moveTo(x, y);
    ctx.lineTo(outX, outY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Handle points
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(inX, inY, 4, 0, Math.PI * 2);
    ctx.arc(outX, outY, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawTimeIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const x = timeToPixel(animationState.currentTime, width);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Time value at top
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${animationState.currentTime.toFixed(2)}s`, x + 5, 15);
  };

  const drawAIAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!curveAnalysis) return;
    
    // AI analysis panel
    const panelX = width - 250;
    const panelY = 10;
    const panelWidth = 240;
    const panelHeight = 120;
    
    // Background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('🤖 AI Curve Analysis', panelX + 8, panelY + 18);
    
    // Metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    
    const metrics = [
      `Smoothness: ${Math.round(curveAnalysis.smoothness * 100)}%`,
      `Organic Quality: ${Math.round(curveAnalysis.organicQuality * 100)}%`,
      `Energy Level: ${Math.round(curveAnalysis.energyLevel * 100)}%`,
      `Confidence: ${Math.round(curveAnalysis.confidence * 100)}%`
    ];
    
    metrics.forEach((metric, index) => {
      ctx.fillText(metric, panelX + 8, panelY + 40 + index * 14);
    });
    
    // Suggestion
    if (curveAnalysis.suggestions.length > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px Arial';
      ctx.fillText('💡 ' + curveAnalysis.suggestions[0], panelX + 8, panelY + 110);
    }
  };

  const drawAIConfidenceIndicator = (ctx: CanvasRenderingContext2D, curve: AnimationCurve, width: number) => {
    const indicatorX = width - 30;
    const indicatorY = 30;
    
    // AI badge
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(indicatorX, indicatorY, 25, 15);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px Arial';
    ctx.fillText('AI', indicatorX + 6, indicatorY + 10);
    
    // Confidence bar
    ctx.fillStyle = '#374151';
    ctx.fillRect(indicatorX, indicatorY + 18, 25, 3);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(indicatorX, indicatorY + 18, 25 * curve.confidence, 3);
  };

  const timeToPixel = (time: number, width: number): number => {
    return ((time - viewBounds.minTime) / (viewBounds.maxTime - viewBounds.minTime)) * width;
  };

  const valueToPixel = (value: number, height: number): number => {
    return height - ((value - viewBounds.minValue) / (viewBounds.maxValue - viewBounds.minValue)) * height;
  };

  const pixelToTime = (pixel: number, width: number): number => {
    return (pixel / width) * (viewBounds.maxTime - viewBounds.minTime) + viewBounds.minTime;
  };

  const pixelToValue = (pixel: number, height: number): number => {
    return (1 - pixel / height) * (viewBounds.maxValue - viewBounds.minValue) + viewBounds.minValue;
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStart({ x, y });
    setIsDragging(true);
    
    // Find clicked keyframe
    // Implementation for keyframe selection would go here
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(animationState.duration, pixelToTime(x, canvas.width)));
    
    // Update current time or move keyframes
    updateAnimationState({ currentTime: time });
  }, [isDragging, animationState.duration, updateAnimationState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // AI-powered curve optimization
  const optimizeCurve = useCallback(async () => {
    if (!selectedCurve || !curveAnalysis) return;
    
    const curve = curves.find(c => c.id === selectedCurve);
    if (!curve) return;
    
    console.log('🤖 AI optimizing animation curve...');
    
    // Simulate AI optimization
    const optimizedPoints = curve.points.map(point => ({
      ...point,
      handleInY: point.handleInY + (Math.random() - 0.5) * 0.1,
      handleOutY: point.handleOutY + (Math.random() - 0.5) * 0.1
    }));
    
    const optimizedCurve = { ...curve, points: optimizedPoints };
    setCurves(prev => prev.map(c => c.id === selectedCurve ? optimizedCurve : c));
    
    // Update analysis
    analyzeSelectedCurve(optimizedCurve);
    
    console.log('✅ Curve optimized for more organic motion');
  }, [selectedCurve, curves, curveAnalysis, analyzeSelectedCurve]);

  if (!selectedPreset) {
    return (
      <div className="h-80 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select an animation preset to open Graph Editor</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-80 bg-gray-900 border border-gray-700 rounded-lg flex flex-col"
    >
      {/* Header */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Graph Editor</h3>
          <span className="text-xs bg-purple-600 px-2 py-1 rounded">AI ENHANCED</span>
        </div>

        <div className="flex-1" />

        {/* Curve Selection */}
        <select
          value={selectedCurve || ''}
          onChange={(e) => {
            setSelectedCurve(e.target.value);
            const curve = curves.find(c => c.id === e.target.value);
            if (curve) analyzeSelectedCurve(curve);
          }}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
        >
          {curves.map(curve => (
            <option key={curve.id} value={curve.id}>
              {curve.elementId} - {curve.property}
            </option>
          ))}
        </select>

        {/* AI Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`p-2 rounded ${showAIAssistant ? 'bg-green-600' : 'bg-gray-600'} hover:opacity-80`}
          >
            <Brain className="w-4 h-4" />
          </button>
          
          <button
            onClick={optimizeCurve}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center space-x-1"
          >
            <Zap className="w-3 h-3" />
            <span>AI Optimize</span>
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          width={800}
          height={300}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Footer Controls */}
      <div className="h-10 bg-gray-800 border-t border-gray-700 flex items-center px-4 space-x-4 text-xs">
        <span className="text-gray-400">
          Selected: {curves.find(c => c.id === selectedCurve)?.elementId || 'None'}
        </span>
        
        <div className="flex-1" />
        
        {curveAnalysis && (
          <div className="flex items-center space-x-3 text-green-400">
            <span>Quality: {Math.round(curveAnalysis.organicQuality * 100)}%</span>
            <span>Smoothness: {Math.round(curveAnalysis.smoothness * 100)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GraphEditor;