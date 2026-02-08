import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Pause, Square, SkipBack, SkipForward,
  Plus, Minus, Eye, EyeOff, Settings, Zap
} from 'lucide-react';
import { useAutomationStore } from '../../store/automationStore';
import { AutomatedAnimationPreset } from '../../utils/aiAnimationEngine';

interface TimelineKeyframe {
  id: string;
  time: number;
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  selected: boolean;
}

interface TimelineTrack {
  id: string;
  name: string;
  property: string;
  elementId: string;
  keyframes: TimelineKeyframe[];
  visible: boolean;
  color: string;
  automated: boolean;
}

const AutomatedTimeline: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    selectedPreset,
    animationState,
    updateAnimationState,
    automationLevel
  } = useAutomationStore();

  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [zoom, setZoom] = useState(1.0);
  const [scrollX, setScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedKeyframes, setSelectedKeyframes] = useState<Set<string>>(new Set());

  // Generate tracks from selected preset
  useEffect(() => {
    if (selectedPreset) {
      generateTracksFromPreset(selectedPreset);
    }
  }, [selectedPreset]);

  const generateTracksFromPreset = useCallback((preset: AutomatedAnimationPreset) => {
    const newTracks: TimelineTrack[] = [];
    
    preset.animations.forEach((animation, animIndex) => {
      // Create tracks for each animated property
      const properties = new Set<string>();
      animation.keyframes.forEach(keyframe => {
        Object.keys(keyframe.properties).forEach(prop => properties.add(prop));
      });
      
      Array.from(properties).forEach((property, propIndex) => {
        const track: TimelineTrack = {
          id: `${animation.elementId}-${property}`,
          name: `${animation.elementId} ${property}`,
          property,
          elementId: animation.elementId,
          keyframes: animation.keyframes
            .filter(kf => kf.properties[property] !== undefined)
            .map((kf, kfIndex) => ({
              id: `kf-${animIndex}-${propIndex}-${kfIndex}`,
              time: kf.time,
              value: kf.properties[property],
              easing: kf.easing as any,
              selected: false
            })),
          visible: true,
          color: getPropertyColor(property),
          automated: true
        };
        
        newTracks.push(track);
      });
    });
    
    setTracks(newTracks);
  }, []);

  const getPropertyColor = (property: string): string => {
    const colors: Record<string, string> = {
      'rotation': '#ff6b6b',
      'scaleX': '#4ecdc4',
      'scaleY': '#45b7d1',
      'x': '#96ceb4',
      'y': '#ffeaa7',
      'alpha': '#dda0dd'
    };
    return colors[property] || '#95a5a6';
  };

  // Setup and draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // FIX BLUR: Setup proper DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory (scaled to account for DPI)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the canvas drawing context so everything will work at normal sizes
    ctx.scale(dpr, dpr);
    
    // Set display size (CSS pixels)
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    drawTimeline(ctx);
  }, [tracks, animationState, zoom, scrollX, selectedKeyframes]);

  const drawTimeline = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    // Use logical dimensions (not scaled canvas dimensions)
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw time ruler
    drawTimeRuler(ctx, width, 30);
    
    // Draw tracks
    let yOffset = 40;
    const trackHeight = 60;
    
    tracks.forEach(track => {
      if (track.visible) {
        drawTrack(ctx, track, yOffset, width, trackHeight);
        yOffset += trackHeight;
      }
    });
    
    // Draw playhead
    drawPlayhead(ctx, height);
    
    // Draw AI confidence indicators for automated tracks
    drawAIConfidenceIndicators(ctx);
  };

  const drawTimeRuler = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ccc';
    
    const timeStep = 0.5; // 0.5 second intervals
    const pixelStep = (timeStep / animationState.duration) * width * zoom;
    
    if (pixelStep > 30) { // Only draw if there's enough space
      for (let time = 0; time <= animationState.duration; time += timeStep) {
        const x = timeToPixel(time, width);
        if (x >= -scrollX && x <= width - scrollX) {
          const isSecond = time % 1 === 0;
          const lineHeight = isSecond ? height : height * 0.6;
          
          ctx.beginPath();
          ctx.moveTo(x, height - lineHeight);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          if (isSecond) {
            ctx.fillText(`${time.toFixed(1)}s`, x + 2, 15);
          }
        }
      }
    }
  };

  const drawTrack = (ctx: CanvasRenderingContext2D, track: TimelineTrack, y: number, width: number, height: number) => {
    // Track background
    ctx.fillStyle = track.automated ? '#1e3a8a20' : '#37415120';
    ctx.fillRect(0, y, width, height);
    
    // Track border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, width, height);
    
    // Track label
    ctx.fillStyle = track.automated ? '#3b82f6' : '#ccc';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(track.name, 8, y + 20);
    
    if (track.automated) {
      ctx.fillStyle = '#8b5cf6';
      ctx.font = '10px Arial';
      ctx.fillText('AI Generated', 8, y + 35);
    }
    
    // Draw keyframes
    track.keyframes.forEach(keyframe => {
      drawKeyframe(ctx, keyframe, y + height / 2, track.color, width);
    });
    
    // Draw animation curve
    if (track.keyframes.length > 1) {
      drawAnimationCurve(ctx, track, y, height, width);
    }
  };

  const drawKeyframe = (ctx: CanvasRenderingContext2D, keyframe: TimelineKeyframe, y: number, color: string, width: number) => {
    const x = timeToPixel(keyframe.time, width);
    const size = keyframe.selected ? 8 : 6;
    
    ctx.fillStyle = keyframe.selected ? '#fbbf24' : color;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    
    // Draw keyframe shape based on easing
    ctx.beginPath();
    switch (keyframe.easing) {
      case 'linear':
        // Diamond
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        break;
      case 'ease-in':
      case 'ease-out':
      case 'ease-in-out':
        // Circle
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.stroke();
  };

  const drawAnimationCurve = (ctx: CanvasRenderingContext2D, track: TimelineTrack, y: number, height: number, width: number) => {
    if (track.keyframes.length < 2) return;
    
    ctx.strokeStyle = track.color + '80'; // Semi-transparent
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const current = sortedKeyframes[i];
      const next = sortedKeyframes[i + 1];
      
      const x1 = timeToPixel(current.time, width);
      const x2 = timeToPixel(next.time, width);
      const y1 = y + height * 0.7 - (current.value * height * 0.4);
      const y2 = y + height * 0.7 - (next.value * height * 0.4);
      
      if (i === 0) ctx.moveTo(x1, y1);
      
      // Draw curve based on easing
      if (current.easing === 'linear') {
        ctx.lineTo(x2, y2);
      } else {
        // Bezier curve for eased animation
        const cp1x = x1 + (x2 - x1) * 0.4;
        const cp2x = x2 - (x2 - x1) * 0.4;
        let cp1y = y1;
        let cp2y = y2;
        
        if (current.easing === 'ease-in') {
          cp1y = y1;
          cp2y = y1 + (y2 - y1) * 0.6;
        } else if (current.easing === 'ease-out') {
          cp1y = y1 + (y2 - y1) * 0.4;
          cp2y = y2;
        }
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      }
    }
    
    ctx.stroke();
  };

  const drawPlayhead = (ctx: CanvasRenderingContext2D, height: number) => {
    const x = timeToPixel(animationState.currentTime, ctx.canvas.width);
    
    // Playhead line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Playhead handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x - 8, 0);
    ctx.lineTo(x + 8, 0);
    ctx.lineTo(x, 15);
    ctx.closePath();
    ctx.fill();
  };

  const drawAIConfidenceIndicators = (ctx: CanvasRenderingContext2D) => {
    if (!selectedPreset || automationLevel.level === 'zero-click') return;
    
    // Draw AI confidence meter in top-right
    const meterX = ctx.canvas.width - 120;
    const meterY = 10;
    const meterWidth = 100;
    const meterHeight = 15;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(meterX, meterY, meterWidth * selectedPreset.confidence, meterHeight);
    
    ctx.strokeStyle = '#444';
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    ctx.fillStyle = '#ccc';
    ctx.font = '10px Arial';
    ctx.fillText(`AI: ${Math.round(selectedPreset.confidence * 100)}%`, meterX, meterY - 2);
  };

  const timeToPixel = (time: number, width: number): number => {
    return (time / animationState.duration) * width * zoom - scrollX;
  };

  const pixelToTime = (pixel: number, width: number): number => {
    return ((pixel + scrollX) / (width * zoom)) * animationState.duration;
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on playhead
    const playheadX = timeToPixel(animationState.currentTime, canvas.width);
    if (Math.abs(x - playheadX) < 10 && y < 30) {
      setIsDragging(true);
      return;
    }
    
    // Check if clicking on keyframe
    const clickedTime = pixelToTime(x, canvas.width);
    // Keyframe selection logic would go here
    
  }, [animationState.currentTime, tracks]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(animationState.duration, pixelToTime(x, canvas.width)));
    
    updateAnimationState({ currentTime: time });
  }, [isDragging, animationState.duration, updateAnimationState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Playback controls
  const togglePlayback = () => {
    updateAnimationState({ isPlaying: !animationState.isPlaying });
  };

  const stopAnimation = () => {
    updateAnimationState({ isPlaying: false, currentTime: 0 });
  };

  const skipToStart = () => {
    updateAnimationState({ currentTime: 0 });
  };

  const skipToEnd = () => {
    updateAnimationState({ currentTime: animationState.duration });
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.2));
  const fitToWindow = () => { setZoom(1); setScrollX(0); };

  if (!selectedPreset) {
    return (
      <div className="h-48 bg-gray-800 border-t border-gray-700 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select an animation preset to view timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 bg-gray-800 border-t border-gray-700 flex flex-col">
      {/* Timeline Header */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 space-x-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-white text-sm">AI Animation Timeline</h3>
          <span className="text-xs bg-purple-600 px-2 py-1 rounded">AUTOMATED</span>
        </div>

        <div className="flex-1" />

        {/* Transport Controls */}
        <div className="flex items-center space-x-1 bg-gray-800 rounded p-1">
          <button onClick={skipToStart} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            <SkipBack size={14} />
          </button>
          <button onClick={togglePlayback} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            {animationState.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={stopAnimation} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            <Square size={14} />
          </button>
          <button onClick={skipToEnd} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            <SkipForward size={14} />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-gray-300 bg-gray-800 px-3 py-1 rounded">
          {animationState.currentTime.toFixed(2)}s / {animationState.duration.toFixed(2)}s
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button onClick={zoomOut} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            <Minus size={14} />
          </button>
          <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white">
            <Plus size={14} />
          </button>
          <button onClick={fitToWindow} className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300">
            Fit
          </button>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          width={800}
          height={200}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* AI Overlay Info */}
        {automationLevel.level !== 'zero-click' && (
          <div className="absolute bottom-2 left-2 bg-purple-600/20 backdrop-blur-sm rounded-lg p-2 text-xs">
            <div className="text-purple-300">🤖 AI Generated Timeline</div>
            <div className="text-gray-400">{tracks.length} automated tracks</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedTimeline;