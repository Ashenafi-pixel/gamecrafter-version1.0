import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';

// Types
type CanvasMode = 'edit' | 'play' | 'test' | 'debug';
type LayerType = 'background' | 'frame' | 'symbols' | 'ui' | 'effects';
type ElementType = 'background' | 'frame' | 'symbol' | 'button' | 'text' | 'particle';

interface CanvasElement {
  id: string;
  type: ElementType;
  layer: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  selected: boolean;
  data: any; // Additional properties specific to element type
}

interface CanvasCamera {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

interface InteractiveGameCanvasProps {
  className?: string;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onElementSelected?: (element: CanvasElement | null) => void;
  initialElements?: CanvasElement[];
  mode?: CanvasMode;
  showGrid?: boolean;
  showLayers?: boolean;
  width?: number;
  height?: number;
}

/**
 * InteractiveGameCanvas - A sophisticated canvas component for game creation
 * 
 * Features:
 * - Layered rendering system with z-index control
 * - Direct manipulation of game elements (drag, resize, rotate)
 * - Camera controls (zoom, pan, focus)
 * - Multiple view modes (edit, play, test, debug)
 * - Selection and multi-selection capabilities
 * - Snapping and alignment guides
 * - History tracking for undo/redo
 */
const InteractiveGameCanvas: React.FC<InteractiveGameCanvasProps> = ({
  className = '',
  fullscreen = false,
  onToggleFullscreen,
  onElementSelected,
  initialElements = [],
  mode = 'edit',
  showGrid = true,
  showLayers = true,
  width = 1080,
  height = 1920,
}) => {
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>(mode);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [camera, setCamera] = useState<CanvasCamera>({
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.2,
    maxZoom: 3
  });
  
  // History for undo/redo
  const [history, setHistory] = useState<CanvasElement[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Add to history when elements change
  useEffect(() => {
    if (JSON.stringify(elements) !== JSON.stringify(history[historyIndex])) {
      // Truncate future history if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...elements]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [elements]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Camera controls
  const zoomIn = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, prev.maxZoom)
    }));
  }, []);
  
  const zoomOut = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, prev.minZoom)
    }));
  }, []);
  
  const resetCamera = useCallback(() => {
    setCamera(prev => ({
      ...prev,
      x: 0,
      y: 0,
      zoom: 1
    }));
  }, []);

  // Handlers for element manipulation
  const handleElementClick = useCallback((element: CanvasElement, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Toggle selection if shift is held, otherwise select only this element
    if (event.shiftKey) {
      setSelectedElements(prev => 
        prev.includes(element.id) 
          ? prev.filter(id => id !== element.id)
          : [...prev, element.id]
      );
    } else {
      setSelectedElements([element.id]);
    }
    
    if (onElementSelected) {
      onElementSelected(element);
    }
  }, [onElementSelected]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Clear selection when clicking empty canvas
    setSelectedElements([]);
    if (onElementSelected) {
      onElementSelected(null);
    }
  }, [onElementSelected]);

  const handleElementDragStart = useCallback((element: CanvasElement, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDragging(true);
    setStartPoint({
      x: event.clientX,
      y: event.clientY
    });
  }, []);
  
  const handleElementDrag = useCallback((element: CanvasElement, event: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (event.clientX - startPoint.x) / camera.zoom;
    const dy = (event.clientY - startPoint.y) / camera.zoom;
    
    setElements(prev => prev.map(el => {
      if (selectedElements.includes(el.id)) {
        return {
          ...el,
          x: el.x + dx,
          y: el.y + dy
        };
      }
      return el;
    }));
    
    setStartPoint({
      x: event.clientX,
      y: event.clientY
    });
  }, [isDragging, startPoint, camera.zoom, selectedElements]);
  
  const handleElementDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Pan the canvas
  const handleCanvasPanStart = useCallback((event: React.MouseEvent) => {
    // Only pan with middle mouse or when holding space
    if (event.button === 1) {
      event.preventDefault();
      setIsPanning(true);
      setStartPoint({
        x: event.clientX,
        y: event.clientY
      });
    }
  }, []);
  
  const handleCanvasPan = useCallback((event: React.MouseEvent) => {
    if (!isPanning) return;
    
    const dx = event.clientX - startPoint.x;
    const dy = event.clientY - startPoint.y;
    
    setCamera(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setStartPoint({
      x: event.clientX,
      y: event.clientY
    });
  }, [isPanning, startPoint]);
  
  const handleCanvasPanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel for zooming
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    
    // Get mouse position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      camera.minZoom,
      Math.min(camera.maxZoom, camera.zoom * zoomFactor)
    );
    
    // Adjust camera position to zoom toward mouse position
    const newX = camera.x - (mouseX - camera.x) * (zoomFactor - 1);
    const newY = camera.y - (mouseY - camera.y) * (zoomFactor - 1);
    
    setCamera({
      ...camera,
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [camera]);

  // Add a new element to the canvas
  const addElement = useCallback((element: Omit<CanvasElement, 'id'>) => {
    const newElement: CanvasElement = {
      ...element,
      id: `element_${Date.now()}`,
      selected: false
    };
    
    setElements(prev => [...prev, newElement]);
    return newElement.id;
  }, []);

  // Remove selected elements
  const removeSelectedElements = useCallback(() => {
    setElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
    setSelectedElements([]);
    if (onElementSelected) {
      onElementSelected(null);
    }
  }, [selectedElements, onElementSelected]);

  // Update selected elements' properties
  const updateSelectedElements = useCallback((properties: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => {
      if (selectedElements.includes(el.id)) {
        return {
          ...el,
          ...properties
        };
      }
      return el;
    }));
  }, [selectedElements]);

  // Bring to front / Send to back
  const bringToFront = useCallback(() => {
    const maxZ = Math.max(...elements.map(el => el.zIndex), 0);
    updateSelectedElements({ zIndex: maxZ + 1 });
  }, [elements, updateSelectedElements]);
  
  const sendToBack = useCallback(() => {
    const minZ = Math.min(...elements.map(el => el.zIndex), 0);
    updateSelectedElements({ zIndex: minZ - 1 });
  }, [elements, updateSelectedElements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for specific keys
      if (['Delete', 'Backspace', 'z', 'y'].includes(event.key)) {
        event.preventDefault();
      }
      
      // Handle keyboard shortcuts
      if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelectedElements();
      } else if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (event.key === 'y' && (event.ctrlKey || event.metaKey)) {
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [removeSelectedElements, undo, redo]);

  // Get layer elements sorted by z-index
  const getLayerElements = useCallback((layer: LayerType) => {
    return elements
      .filter(el => el.layer === layer && el.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  // Layers to render
  const layers: LayerType[] = ['background', 'frame', 'symbols', 'ui', 'effects'];

  return (
    <div 
      ref={containerRef}
      className={`interactive-game-canvas-container relative ${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className}`}
      style={{ 
        width: fullscreen ? '100vw' : '100%',
        height: fullscreen ? '100vh' : '100%',
        overflow: 'hidden',
      }}
      onMouseDown={handleCanvasPanStart}
      onMouseMove={handleCanvasPan}
      onMouseUp={handleCanvasPanEnd}
      onMouseLeave={handleCanvasPanEnd}
      onWheel={handleWheel}
    >
      {/* Main canvas */}
      <div 
        ref={canvasRef}
        className="interactive-game-canvas relative"
        style={{
          width,
          height,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0',
          background: '#222',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid background */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 10 0 L 0 0 0 10" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="0.5"
                  />
                </pattern>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#smallGrid)" />
                  <path 
                    d="M 100 0 L 0 0 0 100" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        )}
        
        {/* Render each layer */}
        {layers.map(layer => (
          <div 
            key={layer}
            className={`layer layer-${layer}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: canvasMode === 'edit' ? 'auto' : 'none' }}
          >
            {getLayerElements(layer).map(element => (
              <motion.div
                key={element.id}
                className={`element element-${element.type} ${selectedElements.includes(element.id) ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                  opacity: element.opacity,
                  zIndex: element.zIndex,
                  backgroundColor: element.type === 'background' ? element.data?.color || 'transparent' : 'transparent',
                  backgroundImage: element.data?.src ? `url(${element.data.src})` : 'none',
                  backgroundSize: 'cover',
                  border: selectedElements.includes(element.id) ? '2px solid #00a0ff' : 'none',
                  boxShadow: selectedElements.includes(element.id) ? '0 0 10px rgba(0,160,255,0.5)' : 'none',
                  cursor: canvasMode === 'edit' ? 'move' : 'default',
                }}
                onClick={(e) => handleElementClick(element, e)}
                onMouseDown={(e) => handleElementDragStart(element, e)}
                onMouseMove={(e) => handleElementDrag(element, e)}
                onMouseUp={handleElementDragEnd}
                onMouseLeave={handleElementDragEnd}
                dragConstraints={canvasRef}
                whileTap={{ scale: 0.98 }}
              >
                {/* Render element content based on type */}
                {element.type === 'text' && (
                  <div 
                    className="text-content" 
                    style={{ 
                      fontSize: element.data?.fontSize || '16px',
                      color: element.data?.color || 'white',
                      textAlign: element.data?.textAlign || 'center',
                      fontFamily: element.data?.fontFamily || 'sans-serif',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {element.data?.text || 'Text Element'}
                  </div>
                )}
                
                {/* Resizing handles for selected elements */}
                {canvasMode === 'edit' && selectedElements.includes(element.id) && (
                  <>
                    <div className="resize-handle tl" style={resizeHandleStyle('tl')} />
                    <div className="resize-handle tr" style={resizeHandleStyle('tr')} />
                    <div className="resize-handle bl" style={resizeHandleStyle('bl')} />
                    <div className="resize-handle br" style={resizeHandleStyle('br')} />
                    <div className="rotate-handle" style={rotateHandleStyle} />
                  </>
                )}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Controls overlay */}
      <div className="controls-overlay absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-full px-4 py-2 flex items-center space-x-3">
        <button 
          onClick={zoomIn}
          className="text-white hover:text-blue-400 p-1"
          title="Zoom In"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button 
          onClick={zoomOut}
          className="text-white hover:text-blue-400 p-1"
          title="Zoom Out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button 
          onClick={resetCamera}
          className="text-white hover:text-blue-400 p-1"
          title="Reset View"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="zoom-level text-white text-xs min-w-[40px] text-center">
          {Math.round(camera.zoom * 100)}%
        </div>
        
        <div className="h-4 w-px bg-white/30"></div>
        
        {canvasMode === 'edit' && (
          <>
            <button 
              onClick={bringToFront}
              className="text-white hover:text-blue-400 p-1"
              title="Bring to Front"
              disabled={selectedElements.length === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 15L12 8L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button 
              onClick={sendToBack}
              className="text-white hover:text-blue-400 p-1"
              title="Send to Back"
              disabled={selectedElements.length === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 9L12 16L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <div className="h-4 w-px bg-white/30"></div>
          </>
        )}
        
        <button 
          onClick={() => setCanvasMode(canvasMode === 'edit' ? 'play' : 'edit')}
          className={`text-white p-1 ${canvasMode !== 'edit' ? 'text-green-400' : 'hover:text-blue-400'}`}
          title={canvasMode === 'edit' ? 'Switch to Play Mode' : 'Switch to Edit Mode'}
        >
          {canvasMode === 'edit' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H8V8H4V4Z" fill="currentColor"/>
              <path d="M10 4H14V8H10V4Z" fill="currentColor"/>
              <path d="M16 4H20V8H16V4Z" fill="currentColor"/>
              <path d="M4 10H8V14H4V10Z" fill="currentColor"/>
              <path d="M10 10H14V14H10V10Z" fill="currentColor"/>
              <path d="M16 10H20V14H16V10Z" fill="currentColor"/>
              <path d="M4 16H8V20H4V16Z" fill="currentColor"/>
              <path d="M10 16H14V20H10V16Z" fill="currentColor"/>
              <path d="M16 16H20V20H16V16Z" fill="currentColor"/>
            </svg>
          )}
        </button>
        
        {onToggleFullscreen && (
          <button 
            onClick={onToggleFullscreen}
            className="text-white hover:text-blue-400 p-1"
            title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V8H3M21 8H16V3M16 21V16H21M3 16H8V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8V3H8M16 3H21V8M21 16V21H16M8 21H3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Mode indicator */}
      <div className="mode-indicator absolute top-4 left-4 bg-black/70 text-white rounded-full px-3 py-1 text-xs font-medium">
        {canvasMode.charAt(0).toUpperCase() + canvasMode.slice(1)} Mode
      </div>
    </div>
  );
};

// Styles for the resize and rotate handles
const resizeHandleStyle = (position: string) => ({
  position: 'absolute',
  width: '10px',
  height: '10px',
  backgroundColor: '#00a0ff',
  borderRadius: '50%',
  top: position.includes('t') ? '-5px' : position.includes('b') ? 'calc(100% - 5px)' : 'calc(50% - 5px)',
  left: position.includes('l') ? '-5px' : position.includes('r') ? 'calc(100% - 5px)' : 'calc(50% - 5px)',
  cursor: position === 'tl' || position === 'br' ? 'nwse-resize' : position === 'tr' || position === 'bl' ? 'nesw-resize' : position.includes('t') || position.includes('b') ? 'ns-resize' : 'ew-resize',
  zIndex: 100,
} as React.CSSProperties);

const rotateHandleStyle = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  backgroundColor: '#00a0ff',
  borderRadius: '50%',
  top: '-25px',
  left: 'calc(50% - 6px)',
  cursor: 'grab',
  zIndex: 100,
} as React.CSSProperties;

export default InteractiveGameCanvas;