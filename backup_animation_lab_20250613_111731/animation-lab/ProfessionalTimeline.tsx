import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  Plus, Minus, Eye, EyeOff, Lock, Unlock,
  ChevronDown, ChevronRight, Scissors, Copy
} from 'lucide-react';

interface TimelineKeyframe {
  id: string;
  time: number;
  value: number;
  selected: boolean;
  tangentIn: number;
  tangentOut: number;
  interpolation: 'linear' | 'bezier' | 'constant';
}

interface TimelineTrack {
  id: string;
  name: string;
  property: string; // 'position.x', 'rotation', 'scale.y', etc.
  componentId: string;
  keyframes: TimelineKeyframe[];
  visible: boolean;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  color: string;
  height: number;
  expanded: boolean;
}

interface TimelineLayer {
  id: string;
  name: string;
  tracks: TimelineTrack[];
  visible: boolean;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  color: string;
  expanded: boolean;
  weight: number;
  blendMode: 'override' | 'additive' | 'multiply';
}

interface TimelineState {
  currentTime: number;
  duration: number;
  frameRate: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
  selectedKeyframes: Set<string>;
  playbackRange: { start: number; end: number };
  isPlaying: boolean;
  loop: boolean;
  snapToFrames: boolean;
}

interface ProfessionalTimelineProps {
  layers: TimelineLayer[];
  onLayersChange: (layers: TimelineLayer[]) => void;
  onTimeChange: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  layers,
  onLayersChange,
  onTimeChange,
  onPlayStateChange
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<TimelineState>({
    currentTime: 0,
    duration: 5.0,
    frameRate: 60,
    zoom: 1.0,
    scrollX: 0,
    scrollY: 0,
    selectedKeyframes: new Set(),
    playbackRange: { start: 0, end: 5.0 },
    isPlaying: false,
    loop: true,
    snapToFrames: true
  });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: 'playhead' | 'keyframe' | 'selection' | null;
    startX: number;
    startY: number;
    startTime: number;
  }>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startTime: 0
  });

  const TRACK_HEIGHT = 40;
  const HEADER_WIDTH = 200;
  const RULER_HEIGHT = 30;

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number): number => {
    return (time / state.duration) * 800 * state.zoom - state.scrollX;
  }, [state.duration, state.zoom, state.scrollX]);

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number): number => {
    const time = ((pixel + state.scrollX) / (800 * state.zoom)) * state.duration;
    return state.snapToFrames ? Math.round(time * state.frameRate) / state.frameRate : time;
  }, [state.duration, state.zoom, state.scrollX, state.snapToFrames, state.frameRate]);

  // Draw timeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw time ruler
    drawTimeRuler(ctx, rect.width);

    // Draw tracks
    let yOffset = RULER_HEIGHT;
    layers.forEach(layer => {
      if (layer.expanded) {
        layer.tracks.forEach(track => {
          if (track.visible) {
            drawTrack(ctx, track, yOffset, rect.width);
            yOffset += TRACK_HEIGHT;
          }
        });
      } else {
        // Draw collapsed layer
        drawLayerHeader(ctx, layer, yOffset, rect.width);
        yOffset += TRACK_HEIGHT;
      }
    });

    // Draw playhead
    drawPlayhead(ctx, rect.height);

    // Draw selection rectangle if dragging
    if (dragState.isDragging && dragState.dragType === 'selection') {
      drawSelectionRectangle(ctx);
    }

  }, [layers, state, dragState]);

  const drawTimeRuler = (ctx: CanvasRenderingContext2D, width: number) => {
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#d1d5db';

    const stepSize = Math.max(0.1, 1 / state.frameRate);
    const pixelStep = timeToPixel(stepSize) - timeToPixel(0);

    if (pixelStep > 10) {
      for (let time = 0; time <= state.duration; time += stepSize) {
        const x = timeToPixel(time);
        if (x >= 0 && x <= width) {
          const isSecond = time % 1 === 0;
          const height = isSecond ? RULER_HEIGHT : RULER_HEIGHT * 0.5;

          ctx.beginPath();
          ctx.moveTo(x, RULER_HEIGHT - height);
          ctx.lineTo(x, RULER_HEIGHT);
          ctx.stroke();

          if (isSecond) {
            ctx.fillText(`${time.toFixed(1)}s`, x + 2, 12);
          }
        }
      }
    }

    // Draw playback range
    const rangeStart = timeToPixel(state.playbackRange.start);
    const rangeEnd = timeToPixel(state.playbackRange.end);
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fillRect(rangeStart, 0, rangeEnd - rangeStart, RULER_HEIGHT);
  };

  const drawTrack = (ctx: CanvasRenderingContext2D, track: TimelineTrack, yOffset: number, width: number) => {
    // Track background
    ctx.fillStyle = track.muted ? '#1f2937' : '#374151';
    ctx.fillRect(0, yOffset, width, TRACK_HEIGHT);

    // Track border
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, yOffset, width, TRACK_HEIGHT);

    // Draw keyframes
    track.keyframes.forEach(keyframe => {
      const x = timeToPixel(keyframe.time);
      if (x >= 0 && x <= width) {
        drawKeyframe(ctx, keyframe, x, yOffset + TRACK_HEIGHT / 2, track.color);
      }
    });

    // Draw curve between keyframes
    if (track.keyframes.length > 1) {
      drawCurve(ctx, track, yOffset, width);
    }
  };

  const drawLayerHeader = (ctx: CanvasRenderingContext2D, layer: TimelineLayer, yOffset: number, width: number) => {
    // Layer background
    ctx.fillStyle = layer.muted ? '#1f2937' : '#4b5563';
    ctx.fillRect(0, yOffset, width, TRACK_HEIGHT);

    // Layer border
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, yOffset, width, TRACK_HEIGHT);
  };

  const drawKeyframe = (ctx: CanvasRenderingContext2D, keyframe: TimelineKeyframe, x: number, y: number, color: string) => {
    const size = keyframe.selected ? 8 : 6;
    
    ctx.fillStyle = keyframe.selected ? '#fbbf24' : color;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;

    switch (keyframe.interpolation) {
      case 'linear':
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'bezier':
        // Circle shape
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'constant':
        // Square shape
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        break;
    }
  };

  const drawCurve = (ctx: CanvasRenderingContext2D, track: TimelineTrack, yOffset: number, width: number) => {
    if (track.keyframes.length < 2) return;

    ctx.strokeStyle = track.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
    
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const current = sortedKeyframes[i];
      const next = sortedKeyframes[i + 1];
      
      const x1 = timeToPixel(current.time);
      const x2 = timeToPixel(next.time);
      const y1 = yOffset + TRACK_HEIGHT / 2 - (current.value * 20);
      const y2 = yOffset + TRACK_HEIGHT / 2 - (next.value * 20);

      if (current.interpolation === 'bezier') {
        // Bezier curve
        const cp1x = x1 + (x2 - x1) * 0.33;
        const cp1y = y1 + current.tangentOut * 20;
        const cp2x = x2 - (x2 - x1) * 0.33;
        const cp2y = y2 - next.tangentIn * 20;

        if (i === 0) ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      } else if (current.interpolation === 'constant') {
        // Step curve
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y2);
      } else {
        // Linear
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }

    ctx.stroke();
  };

  const drawPlayhead = (ctx: CanvasRenderingContext2D, height: number) => {
    const x = timeToPixel(state.currentTime);
    
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

  const drawSelectionRectangle = (ctx: CanvasRenderingContext2D) => {
    // Implementation for selection rectangle
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    // Draw rectangle based on drag state
    ctx.strokeRect(dragState.startX, dragState.startY, 100, 50); // Placeholder
    ctx.setLineDash([]);
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = pixelToTime(x);

    // Check if clicking on playhead
    const playheadX = timeToPixel(state.currentTime);
    if (Math.abs(x - playheadX) < 10 && y < RULER_HEIGHT) {
      setDragState({
        isDragging: true,
        dragType: 'playhead',
        startX: x,
        startY: y,
        startTime: time
      });
      return;
    }

    // Check if clicking on keyframe
    // ... keyframe detection logic

    // Otherwise start selection
    setDragState({
      isDragging: true,
      dragType: 'selection',
      startX: x,
      startY: y,
      startTime: time
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const time = pixelToTime(x);

    if (dragState.dragType === 'playhead') {
      setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(prev.duration, time)) }));
      onTimeChange(time);
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
      startTime: 0
    });
  };

  // Playback control
  const togglePlayback = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    onPlayStateChange(!state.isPlaying);
  };

  const skipToStart = () => {
    setState(prev => ({ ...prev, currentTime: prev.playbackRange.start }));
    onTimeChange(state.playbackRange.start);
  };

  const skipToEnd = () => {
    setState(prev => ({ ...prev, currentTime: prev.playbackRange.end }));
    onTimeChange(state.playbackRange.end);
  };

  // Zoom controls
  const zoomIn = () => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 10) }));
  };

  const zoomOut = () => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  };

  const fitToWindow = () => {
    setState(prev => ({ ...prev, zoom: 1.0, scrollX: 0 }));
  };

  return (
    <div className="h-80 bg-gray-800 border-t border-gray-700 flex flex-col">
      {/* Timeline Header */}
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 space-x-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-white">Timeline</h3>
          <span className="text-xs bg-blue-600 px-2 py-1 rounded">PROFESSIONAL</span>
        </div>

        <div className="flex-1" />

        {/* Transport Controls */}
        <div className="flex items-center space-x-1 bg-gray-800 rounded p-1">
          <button 
            onClick={skipToStart}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            <SkipBack size={14} />
          </button>
          
          <button 
            onClick={togglePlayback}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            {state.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          
          <button 
            onClick={() => setState(prev => ({ ...prev, currentTime: 0, isPlaying: false }))}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            <Square size={14} />
          </button>
          
          <button 
            onClick={skipToEnd}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Time Display */}
        <div className="text-sm font-mono text-gray-300 bg-gray-800 px-3 py-1 rounded">
          {state.currentTime.toFixed(2)}s / {state.duration.toFixed(2)}s
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={zoomOut}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            <Minus size={14} />
          </button>
          
          <span className="text-xs text-gray-400 w-12 text-center">
            {Math.round(state.zoom * 100)}%
          </span>
          
          <button 
            onClick={zoomIn}
            className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
          >
            <Plus size={14} />
          </button>
          
          <button 
            onClick={fitToWindow}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
          >
            Fit
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-xs text-gray-400">
            <input 
              type="checkbox" 
              checked={state.loop}
              onChange={(e) => setState(prev => ({ ...prev, loop: e.target.checked }))}
              className="mr-1" 
            />
            Loop
          </label>
          
          <label className="flex items-center text-xs text-gray-400">
            <input 
              type="checkbox" 
              checked={state.snapToFrames}
              onChange={(e) => setState(prev => ({ ...prev, snapToFrames: e.target.checked }))}
              className="mr-1" 
            />
            Snap
          </label>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex">
        {/* Track Headers */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="h-8 bg-gray-900 border-b border-gray-700" /> {/* Spacer for ruler */}
          
          {layers.map(layer => (
            <div key={layer.id}>
              {/* Layer Header */}
              <div className="h-10 flex items-center px-2 bg-gray-750 border-b border-gray-700">
                <button 
                  onClick={() => {
                    const updatedLayers = layers.map(l => 
                      l.id === layer.id ? { ...l, expanded: !l.expanded } : l
                    );
                    onLayersChange(updatedLayers);
                  }}
                  className="mr-2"
                >
                  {layer.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                
                <div className={`w-3 h-3 rounded mr-2`} style={{ backgroundColor: layer.color }} />
                
                <span className="flex-1 text-sm truncate">{layer.name}</span>
                
                <div className="flex space-x-1">
                  <button 
                    onClick={() => {
                      const updatedLayers = layers.map(l => 
                        l.id === layer.id ? { ...l, visible: !l.visible } : l
                      );
                      onLayersChange(updatedLayers);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    {layer.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                  </button>
                  
                  <button 
                    onClick={() => {
                      const updatedLayers = layers.map(l => 
                        l.id === layer.id ? { ...l, locked: !l.locked } : l
                      );
                      onLayersChange(updatedLayers);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    {layer.locked ? <Lock size={10} /> : <Unlock size={10} />}
                  </button>
                </div>
              </div>
              
              {/* Track Headers */}
              {layer.expanded && layer.tracks.map(track => (
                <div key={track.id} className="h-10 flex items-center px-4 bg-gray-800 border-b border-gray-700">
                  <div className={`w-2 h-2 rounded mr-2`} style={{ backgroundColor: track.color }} />
                  <span className="flex-1 text-xs truncate">{track.name}</span>
                  
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        const updatedLayers = layers.map(l => ({
                          ...l,
                          tracks: l.tracks.map(t => 
                            t.id === track.id ? { ...t, visible: !t.visible } : t
                          )
                        }));
                        onLayersChange(updatedLayers);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      {track.visible ? <Eye size={8} /> : <EyeOff size={8} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTimeline;