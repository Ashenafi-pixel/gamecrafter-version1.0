import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface InteractiveLogoPositionerProps {
  logoUrl: string;
  logoPosition: { x: number; y: number };
  logoScale: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  containerWidth?: number;
  containerHeight?: number;
  className?: string;
}

/**
 * Interactive Logo Positioner
 * 
 * Allows users to drag and drop the logo to position it within the game canvas.
 * Uses EXACT same dimensions as PixiJS canvas for perfect 1:1 positioning transfer.
 */
const InteractiveLogoPositioner: React.FC<InteractiveLogoPositionerProps> = ({
  logoUrl,
  logoPosition,
  logoScale,
  onPositionChange,
  onScaleChange,
  // MATCH PIXIJS CANVAS: Use exact same default dimensions as PixiJS Renderer
  containerWidth = 1200,  // matches PixiJS default canvas width
  containerHeight = 800,  // matches PixiJS default canvas height
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on logo
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setStartPosition({
      x: logoPosition.x,
      y: logoPosition.y
    });
    
    console.log('[InteractiveLogoPositioner] Drag started at:', {
      clientX: e.clientX,
      clientY: e.clientY,
      currentPosition: logoPosition
    });
  }, [logoPosition]);

  // Handle mouse move (dragging)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newPosition = {
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY
    };
    
    // Constrain to container bounds (with some padding)
    const padding = 50;
    newPosition.x = Math.max(-containerWidth/2 + padding, Math.min(containerWidth/2 - padding, newPosition.x));
    newPosition.y = Math.max(-containerHeight/2 + padding, Math.min(containerHeight/2 - padding, newPosition.y));
    
    onPositionChange(newPosition);
  }, [isDragging, dragStart, startPosition, onPositionChange, containerWidth, containerHeight]);

  // Handle mouse up (end dragging)
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      console.log('[InteractiveLogoPositioner] Drag ended at position:', logoPosition);
      setIsDragging(false);
    }
  }, [isDragging, logoPosition]);

  // Set up global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset position to center
  const resetPosition = () => {
    onPositionChange({ x: 0, y: -50 });
  };

  // Zoom functions
  const zoomIn = () => {
    const newScale = Math.min(150, logoScale + 10);
    onScaleChange(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(50, logoScale - 10);
    onScaleChange(newScale);
  };

  return (
    <div className={`interactive-logo-positioner ${className}`}>
      {/* Control bar */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded-md">
        <span className="text-sm font-medium text-gray-700">Logo Position:</span>
        <button
          onClick={resetPosition}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          title="Reset to center"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
        <button
          onClick={zoomOut}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          title="Zoom out"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-xs text-gray-600">{logoScale}%</span>
        <button
          onClick={zoomIn}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          title="Zoom in"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      {/* Positioning canvas */}
      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden border-2 border-gray-600"
        style={{
          width: containerWidth,
          height: containerHeight,
          margin: '0 auto'
        }}
      >
        {/* Grid overlay for positioning reference */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Center reference lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bg-blue-400 opacity-30"
            style={{
              left: '50%',
              top: '0',
              width: '1px',
              height: '100%',
              transform: 'translateX(-50%)'
            }}
          />
          <div
            className="absolute bg-blue-400 opacity-30"
            style={{
              left: '0',
              top: '50%',
              width: '100%',
              height: '1px',
              transform: 'translateY(-50%)'
            }}
          />
        </div>

        {/* Draggable logo */}
        <div
          className={`absolute cursor-move select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${logoPosition.x}px, ${logoPosition.y}px) scale(${logoScale / 100})`,
            maxWidth: '200px',
            maxHeight: '100px',
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            src={logoUrl}
            alt="Game Logo"
            className="w-auto h-auto max-w-full max-h-full object-contain"
            style={{
              filter: `drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5)) ${isDragging ? 'brightness(1.2)' : ''}`,
              borderRadius: '4px',
              border: isDragging ? '2px solid #3B82F6' : '2px solid transparent'
            }}
            draggable={false}
          />
          
          {/* Position indicator */}
          {isDragging && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                x: {logoPosition.x}, y: {logoPosition.y}
              </div>
            </div>
          )}
        </div>

        {/* Drag instruction overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-md inline-flex items-center gap-2">
            <Move className="w-3 h-3" />
            Click and drag the logo to position it
          </div>
        </div>
      </div>

      {/* Position coordinates display */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-4 text-sm text-gray-600">
          <span>X: {logoPosition.x}px</span>
          <span>Y: {logoPosition.y}px</span>
          <span>Scale: {logoScale}%</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLogoPositioner;