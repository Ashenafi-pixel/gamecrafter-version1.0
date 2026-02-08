import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Layers, 
  Play, 
  Pause, 
  Maximize, 
  Minimize,
  Home,
  Settings,
  PlusCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2
} from 'lucide-react';
import { 
  GameCanvas, 
  CanvasControls, 
  LayerPanel, 
  PropertyPanel, 
  GameCanvasWorkspace,
  useGameCanvasStore
} from './game-canvas';

/**
 * Game Canvas Demo Component
 * 
 * This is a demonstration and playground component for the unified game canvas
 * system. It allows testing and experimenting with all the canvas features.
 */
const GameCanvasDemo: React.FC = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  
  // Get canvas state from the store
  const canvasStore = useGameCanvasStore();
  const { 
    zoom, 
    editMode, 
    isPlaying, 
    layers, 
    activeLayerId, 
    selectedElementId,
    toggleEditMode,
    togglePlayMode,
    setActiveLayer,
    setSelectedElement,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    addElement,
    deleteElement,
    updateElement,
    resetCanvas
  } = canvasStore;
  
  // Active layer details
  const activeLayer = layers.find(layer => layer.id === activeLayerId);
  
  // Selected element details
  const selectedElement = layers
    .flatMap(layer => layer.elements)
    .find(el => el.id === selectedElementId);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // Handle selecting an element on the canvas
  const handleElementSelect = (elementId: string, elementType: string) => {
    setSelectedElement(elementId);
  };
  
  // Handle property changes for the selected element
  const handlePropertyChange = (propertyPath: string, value: any) => {
    if (selectedElementId) {
      // For demo purposes, directly update the element
      updateElement(selectedElementId, {
        [propertyPath]: value
      });
    }
  };
  
  // Generate example properties for the selected element
  const getElementProperties = () => {
    if (!selectedElement) return [];
    
    // Generate properties based on element type
    return [
      {
        name: 'Appearance',
        properties: [
          {
            id: 'width',
            label: 'Width',
            type: 'range',
            min: 1,
            max: 100,
            value: selectedElement.width,
            onChange: (value: number) => handlePropertyChange('width', value)
          },
          {
            id: 'height',
            label: 'Height',
            type: 'range',
            min: 1,
            max: 100,
            value: selectedElement.height,
            onChange: (value: number) => handlePropertyChange('height', value)
          },
          {
            id: 'opacity',
            label: 'Opacity',
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: selectedElement.opacity,
            onChange: (value: number) => handlePropertyChange('opacity', value)
          }
        ]
      },
      {
        name: 'Position',
        properties: [
          {
            id: 'x',
            label: 'X Position',
            type: 'range',
            min: 0,
            max: 100,
            value: selectedElement.x,
            onChange: (value: number) => handlePropertyChange('x', value)
          },
          {
            id: 'y',
            label: 'Y Position',
            type: 'range',
            min: 0,
            max: 100,
            value: selectedElement.y,
            onChange: (value: number) => handlePropertyChange('y', value)
          },
          {
            id: 'rotation',
            label: 'Rotation',
            type: 'range',
            min: 0,
            max: 360,
            value: selectedElement.rotation,
            onChange: (value: number) => handlePropertyChange('rotation', value)
          }
        ]
      }
    ];
  };
  
  return (
    <div className={`canvas-demo ${fullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white border-b border-gray-700">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-700">
            <Home size={16} />
            <span>Home</span>
          </a>
          <h1 className="text-xl font-bold">Game Canvas Demo</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleEditMode}
            className={`px-3 py-1 rounded flex items-center gap-2 
                      ${editMode ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <Settings size={16} />
            <span>{editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}</span>
          </button>
          
          <button 
            onClick={togglePlayMode}
            className={`px-3 py-1 rounded flex items-center gap-2 
                      ${isPlaying ? 'bg-red-600' : 'bg-gray-700'}`}
          >
            {isPlaying ? (
              <>
                <Pause size={16} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Play</span>
              </>
            )}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="px-3 py-1 rounded bg-gray-700 flex items-center gap-2"
          >
            {fullscreen ? (
              <>
                <Minimize size={16} />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize size={16} />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Info panel (collapsible) */}
      {showInfo && !fullscreen && (
        <div className="p-6 bg-white rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Game Canvas Demo</h1>
            <button 
              onClick={() => setShowInfo(false)}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              Hide Info
            </button>
          </div>
          
          <p className="text-gray-700 mb-6">
            This is a demonstration of the unified game canvas that will be used 
            throughout the slot creation process. The canvas provides a consistent
            interface for visualizing and editing the game at each step.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Key Features</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Unified canvas that persists across all creation steps</li>
                <li>Layer-based editing system for different game elements</li>
                <li>Direct manipulation of game elements</li>
                <li>Real-time preview of changes</li>
                <li>Property editing for fine-tuning elements</li>
                <li>Support for various game component types</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Toggle between <b>Edit</b> and <b>View</b> modes</li>
                <li>Select layers from the left panel</li>
                <li>Click elements in the canvas to select them</li>
                <li>Edit properties in the right panel</li>
                <li>Use zoom controls to focus on details</li>
                <li>Toggle fullscreen for a larger canvas</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className={`flex ${fullscreen ? 'h-[calc(100vh-60px)]' : 'min-h-[700px]'}`}>
        {/* Layers panel */}
        {showLayers && (
          <div className="w-64 border-r border-gray-700 bg-gray-800 text-white p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex justify-between items-center">
              <span>Layers</span>
              <button 
                onClick={() => addLayer('symbols')}
                className="p-1 rounded hover:bg-gray-700"
                title="Add Layer"
              >
                <PlusCircle size={16} />
              </button>
            </h2>
            
            <div className="flex-grow overflow-y-auto">
              <LayerPanel 
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={setActiveLayer}
                onLayerVisibilityToggle={toggleLayerVisibility}
                onLayerLockToggle={toggleLayerLock}
                onLayerDelete={deleteLayer}
                onLayerAdd={() => addLayer('symbols')} 
                onLayerOrderChange={(layerId, direction) => reorderLayer(layerId, direction)}
              />
            </div>
            
            {/* Layer actions */}
            <div className="mt-4 border-t border-gray-700 pt-4">
              <button 
                onClick={resetCanvas}
                className="w-full px-3 py-2 bg-red-600 text-white rounded flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Reset Canvas
              </button>
            </div>
          </div>
        )}
        
        {/* Main canvas area */}
        <div className="flex-grow flex flex-col bg-gray-900">
          {/* Canvas toolbar */}
          <div className="p-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowLayers(!showLayers)}
                className={`p-2 rounded ${showLayers ? 'bg-blue-600' : 'bg-gray-700'}`}
                title={showLayers ? 'Hide Layers Panel' : 'Show Layers Panel'}
              >
                <Layers size={16} />
              </button>
              
              <button 
                onClick={() => setShowProperties(!showProperties)}
                className={`p-2 rounded ${showProperties ? 'bg-blue-600' : 'bg-gray-700'}`}
                title={showProperties ? 'Hide Properties Panel' : 'Show Properties Panel'}
              >
                <Settings size={16} />
              </button>
              
              {!showInfo && !fullscreen && (
                <button 
                  onClick={() => setShowInfo(true)}
                  className="p-2 rounded bg-gray-700"
                  title="Show Info"
                >
                  <Eye size={16} />
                </button>
              )}
            </div>
            
            <CanvasControls 
              onToggleFullscreen={toggleFullscreen} 
              showLayerControls={true}
            />
            
            <div className="text-sm text-gray-400">
              {activeLayer ? activeLayer.name : 'No layer selected'}
            </div>
          </div>
          
          {/* Canvas workspace */}
          <div className="flex-grow p-4 flex items-center justify-center">
            <GameCanvasWorkspace
              width={fullscreen ? window.innerWidth - (showLayers ? 64 : 0) - (showProperties ? 320 : 0) - 40 : 800}
              height={fullscreen ? window.innerHeight - 120 : 600}
              onElementSelect={handleElementSelect}
            />
          </div>
        </div>
        
        {/* Properties panel */}
        {showProperties && (
          <div className="w-80 border-l border-gray-700 bg-gray-800 text-white p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Properties</h2>
            
            {selectedElement ? (
              <PropertyPanel 
                properties={getElementProperties()} 
                title={`${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Properties`}
              />
            ) : (
              <div className="text-gray-400 text-center p-4">
                No element selected. Click on an element in the canvas to view and edit its properties.
              </div>
            )}
            
            {activeLayer && !selectedElement && (
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">Layer Settings</h3>
                <button 
                  onClick={() => addElement(activeLayerId || 'symbols-layer', {
                    type: activeLayer.type === 'background' ? 'background' :
                          activeLayer.type === 'symbols' ? 'symbol' :
                          activeLayer.type === 'ui' ? 'button' : 'effect',
                    x: 50,
                    y: 50,
                    width: 20,
                    height: 20
                  })}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded flex items-center justify-center gap-2 mb-2"
                  disabled={!activeLayerId}
                >
                  <PlusCircle size={16} />
                  Add Element to Layer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCanvasDemo;