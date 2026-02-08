import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveGameCanvas from './InteractiveGameCanvas';
import PropertyPanel from './PropertyPanel';

// Types
type CanvasMode = 'edit' | 'play' | 'test' | 'debug';
type LayerType = 'background' | 'frame' | 'symbols' | 'ui' | 'effects';
type ElementType = 'background' | 'frame' | 'symbol' | 'button' | 'text' | 'particle';
type PanelPosition = 'left' | 'right';

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

interface GameCanvasContainerProps {
  className?: string;
  initialElements?: CanvasElement[];
  canvasWidth?: number;
  canvasHeight?: number;
  sidebarPosition?: PanelPosition;
  showToolbar?: boolean;
  showPropertyPanel?: boolean;
  showLayersPanel?: boolean;
  onSave?: (elements: CanvasElement[]) => void;
}

/**
 * GameCanvasContainer - Main container for the interactive game canvas
 * 
 * Features:
 * - Layout system with resizable panels
 * - Integration of canvas, property panel, and toolbar
 * - Responsive design with collapsible panels
 * - Support for different workspace configurations
 */
const GameCanvasContainer: React.FC<GameCanvasContainerProps> = ({
  className = '',
  initialElements = [],
  canvasWidth = 1080,
  canvasHeight = 1920,
  sidebarPosition = 'right',
  showToolbar = true,
  showPropertyPanel = true,
  showLayersPanel = true,
  onSave
}) => {
  // State
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [isDraggingSeparator, setIsDraggingSeparator] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  
  // Handle element selection from canvas
  const handleElementSelected = useCallback((element: CanvasElement | null) => {
    setSelectedElement(element);
  }, []);
  
  // Handle property updates from property panel
  const handlePropertyUpdate = useCallback((properties: Partial<CanvasElement>) => {
    if (!selectedElement) return;
    
    setElements(prev => prev.map(el => {
      if (el.id === selectedElement.id) {
        const updated = { ...el, ...properties };
        // Also update our selected element reference
        setSelectedElement(updated);
        return updated;
      }
      return el;
    }));
  }, [selectedElement]);
  
  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsCanvasFullscreen(prev => !prev);
  }, []);
  
  // Handle separator drag to resize panels
  const handleSeparatorMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSeparator(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxWidth = containerRect.width * 0.5; // Max 50% of container width
      const minWidth = 200; // Minimum sidebar width
      
      let newWidth;
      if (sidebarPosition === 'right') {
        newWidth = containerRect.right - e.clientX;
      } else {
        newWidth = e.clientX - containerRect.left;
      }
      
      // Clamp width between min and max
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingSeparator(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarPosition]);
  
  // Add a new element to the canvas
  const addElement = useCallback((type: ElementType) => {
    const newElement: CanvasElement = {
      id: `element_${Date.now()}`,
      type,
      layer: getDefaultLayerForType(type),
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: elements.length + 1,
      visible: true,
      selected: false,
      data: getDefaultDataForType(type)
    };
    
    setElements(prev => [...prev, newElement]);
  }, [elements.length, canvasWidth, canvasHeight]);
  
  // Toggle panel collapse
  const togglePanelCollapse = useCallback(() => {
    setIsPanelCollapsed(prev => !prev);
  }, []);
  
  // Save elements
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(elements);
    }
  }, [elements, onSave]);
  
  return (
    <div 
      ref={containerRef}
      className={`game-canvas-container relative flex ${sidebarPosition === 'right' ? 'flex-row' : 'flex-row-reverse'} h-full w-full overflow-hidden ${className}`}
    >
      {/* Canvas Area */}
      <div className="canvas-area flex-1 relative flex flex-col">
        {/* Toolbar */}
        {showToolbar && !isCanvasFullscreen && (
          <div className="canvas-toolbar h-12 flex items-center justify-between px-4 bg-gray-800 border-b border-gray-700">
            <div className="left-tools flex items-center space-x-2">
              <div className="tool-section flex items-center">
                <button
                  className="tool-button flex items-center justify-center w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full"
                  title="Save Canvas"
                  onClick={handleSave}
                >
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H17M12 12V19M12 19L15 16M12 19L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              
              <div className="tool-divider w-px h-6 bg-gray-700 mx-2"></div>
              
              <div className="add-element-tools flex items-center space-x-1">
                <button
                  className="element-add-btn text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => addElement('background')}
                >
                  Background
                </button>
                <button
                  className="element-add-btn text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => addElement('frame')}
                >
                  Frame
                </button>
                <button
                  className="element-add-btn text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => addElement('symbol')}
                >
                  Symbol
                </button>
                <button
                  className="element-add-btn text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => addElement('text')}
                >
                  Text
                </button>
                <button
                  className="element-add-btn text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => addElement('button')}
                >
                  Button
                </button>
              </div>
            </div>
            
            <div className="right-tools">
              <div className="view-mode flex items-center bg-gray-700 rounded-full p-1">
                <button
                  className={`view-mode-btn text-xs px-3 py-1 rounded-full ${selectedElement ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
                  disabled={!selectedElement}
                >
                  Element
                </button>
                <button
                  className="view-mode-btn text-xs px-3 py-1 rounded-full text-gray-300"
                >
                  Canvas
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Canvas */}
        <div className="canvas-wrapper flex-1 relative overflow-hidden">
          <InteractiveGameCanvas
            initialElements={elements}
            onElementSelected={handleElementSelected}
            fullscreen={isCanvasFullscreen}
            onToggleFullscreen={toggleFullscreen}
            width={canvasWidth}
            height={canvasHeight}
            className="h-full w-full"
          />
        </div>
      </div>
      
      {/* Panel Separator */}
      {!isCanvasFullscreen && (
        <div
          ref={separatorRef}
          className={`separator-handle w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors z-10 ${isDraggingSeparator ? 'bg-blue-500' : ''}`}
          onMouseDown={handleSeparatorMouseDown}
        ></div>
      )}
      
      {/* Sidebar Panels */}
      <AnimatePresence>
        {!isCanvasFullscreen && !isPanelCollapsed && (
          <motion.div
            className="sidebar-panels h-full bg-gray-800 border-gray-700 flex flex-col"
            style={{ width: sidebarWidth }}
            initial={{ width: 0 }}
            animate={{ width: sidebarWidth }}
            exit={{ width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="panels-header h-12 flex items-center justify-between px-4 border-b border-gray-700">
              <h2 className="text-sm font-medium">Properties</h2>
              <button
                className="collapse-panel-btn p-1 hover:bg-gray-700 rounded"
                onClick={togglePanelCollapse}
                title="Collapse Panel"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="panels-content flex-1 overflow-y-auto p-2">
              {/* Property Panel */}
              {showPropertyPanel && (
                <PropertyPanel
                  element={selectedElement}
                  onUpdate={handlePropertyUpdate}
                  className="mb-4"
                />
              )}
              
              {/* Layers Panel - Simplified version */}
              {showLayersPanel && (
                <div className="layers-panel bg-gray-800 rounded-lg p-3">
                  <div className="panel-header flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Layers</h3>
                    <button
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                      onClick={() => {/* Toggle layer visibility */}}
                    >
                      Show All
                    </button>
                  </div>
                  
                  <div className="layers-list">
                    {['background', 'frame', 'symbols', 'ui', 'effects'].map(layer => (
                      <div 
                        key={layer}
                        className={`layer-item flex items-center justify-between py-2 px-3 rounded ${layer === selectedElement?.layer ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                      >
                        <div className="layer-info flex items-center">
                          <div className={`layer-color w-2 h-2 rounded-full mr-2 bg-${getLayerColor(layer as LayerType)}-500`}></div>
                          <span className="text-xs">{formatLayerName(layer as LayerType)}</span>
                        </div>
                        <div className="layer-actions flex items-center">
                          <button
                            className="visibility-toggle mr-1 text-gray-400 hover:text-white"
                            title="Toggle Layer Visibility"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button
                            className="lock-toggle text-gray-400 hover:text-white"
                            title="Lock Layer"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M17 11V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Collapsed Panel Toggle */}
      {!isCanvasFullscreen && isPanelCollapsed && (
        <button
          className="expand-panel-btn absolute right-4 top-16 w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg"
          onClick={togglePanelCollapse}
          title="Expand Panel"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

// Helper functions
const getDefaultLayerForType = (type: ElementType): LayerType => {
  switch (type) {
    case 'background': return 'background';
    case 'frame': return 'frame';
    case 'symbol': return 'symbols';
    case 'button': case 'text': return 'ui';
    case 'particle': return 'effects';
    default: return 'ui';
  }
};

const getDefaultDataForType = (type: ElementType) => {
  switch (type) {
    case 'background':
      return { color: '#333333', src: '', fillMode: 'cover' };
    case 'text':
      return { text: 'New Text', fontSize: '24px', color: '#ffffff', fontFamily: 'sans-serif', textAlign: 'center' };
    case 'symbol':
      return { symbolId: 'symbol_1', symbolType: 'regular', animation: 'none' };
    case 'button':
      return { text: 'Button', color: '#4CAF50', borderRadius: '4px', action: '' };
    case 'particle':
      return { effect: 'sparkle', color: '#ffcc00', size: 5, count: 50 };
    default:
      return {};
  }
};

const getLayerColor = (layer: LayerType): string => {
  switch (layer) {
    case 'background': return 'blue';
    case 'frame': return 'purple';
    case 'symbols': return 'yellow';
    case 'ui': return 'green';
    case 'effects': return 'orange';
    default: return 'gray';
  }
};

const formatLayerName = (layer: LayerType): string => {
  return layer.charAt(0).toUpperCase() + layer.slice(1);
};

export default GameCanvasContainer;