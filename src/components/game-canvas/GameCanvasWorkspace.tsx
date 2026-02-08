import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store';
import GameCanvas from './GameCanvas';
import CanvasControls from './CanvasControls';
import PropertyPanel from './PropertyPanel';
import LayerPanel from './LayerPanel';
import { Layer } from './LayerSystem';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface GameCanvasWorkspaceProps {
  /** Whether to show in fullscreen mode */
  fullscreen?: boolean;
  /** Whether to toggle fullscreen mode */
  onToggleFullscreen?: () => void;
  /** Whether to show property panel */
  showPropertyPanel?: boolean;
  /** Whether to show layer panel */
  showLayerPanel?: boolean;
  /** Class name for additional styling */
  className?: string;
}

/**
 * Game Canvas Workspace Component
 * 
 * A complete workspace for editing and previewing the game, combining
 * the GameCanvas with controls, property panel, and layer panel.
 */
const GameCanvasWorkspace: React.FC<GameCanvasWorkspaceProps> = ({
  fullscreen = false,
  onToggleFullscreen,
  showPropertyPanel = true,
  showLayerPanel = true,
  className = '',
}) => {
  // State for the canvas
  const [editMode, setEditMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeLayer, setActiveLayer] = useState<string | undefined>(undefined);
  const [selectedElement, setSelectedElement] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mock layers for demonstration
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'background-layer',
      name: 'Background',
      type: 'background',
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 0,
      elements: [
        {
          id: 'bg-1',
          type: 'background',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          scale: 1,
          opacity: 1,
          data: { src: '/path/to/background.jpg' }
        }
      ]
    },
    {
      id: 'symbols-layer',
      name: 'Symbols',
      type: 'symbols',
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 10,
      elements: Array(15).fill(0).map((_, i) => ({
        id: `symbol-${i}`,
        type: 'symbol',
        x: 10 + (i % 5) * 20,
        y: 20 + Math.floor(i / 5) * 20,
        width: 15,
        height: 15,
        rotation: 0,
        scale: 1,
        opacity: 1,
        data: { symbol: `Symbol ${i+1}` }
      }))
    },
    {
      id: 'ui-layer',
      name: 'UI Elements',
      type: 'ui',
      visible: true,
      locked: false,
      opacity: 1,
      zIndex: 20,
      elements: [
        {
          id: 'ui-spin',
          type: 'button',
          x: 50,
          y: 80,
          width: 10,
          height: 10,
          rotation: 0,
          scale: 1,
          opacity: 1,
          data: { label: 'Spin' }
        },
        {
          id: 'ui-bet',
          type: 'button',
          x: 65,
          y: 80,
          width: 10,
          height: 10,
          rotation: 0,
          scale: 1,
          opacity: 1,
          data: { label: 'Bet' }
        }
      ]
    },
    {
      id: 'effects-layer',
      name: 'Effects',
      type: 'effects',
      visible: true,
      locked: false,
      opacity: 0.8,
      zIndex: 30,
      elements: [
        {
          id: 'effect-1',
          type: 'particle',
          x: 50,
          y: 50,
          width: 20,
          height: 20,
          rotation: 0,
          scale: 1,
          opacity: 0.7,
          data: { effect: 'Glow' }
        }
      ]
    }
  ]);
  
  // Handle element selection
  const handleElementSelect = (elementId: string, layerId: string) => {
    setSelectedElement(elementId);
    setActiveLayer(layerId);
  };
  
  // Handle layer selection
  const handleLayerSelect = (layerId: string) => {
    setActiveLayer(layerId);
  };
  
  // Handle layer visibility toggle
  const handleLayerVisibilityToggle = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  
  // Handle layer lock toggle
  const handleLayerLockToggle = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  };
  
  // Handle layer order change
  const handleLayerOrderChange = (layerId: string, direction: 'up' | 'down') => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    // Find the adjacent layer to swap z-index with
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = sortedLayers.findIndex(l => l.id === layerId);
    
    if (direction === 'up' && currentIndex < sortedLayers.length - 1) {
      const targetLayer = sortedLayers[currentIndex + 1];
      setLayers(layers.map(l => {
        if (l.id === layerId) return { ...l, zIndex: targetLayer.zIndex };
        if (l.id === targetLayer.id) return { ...l, zIndex: layer.zIndex };
        return l;
      }));
    } else if (direction === 'down' && currentIndex > 0) {
      const targetLayer = sortedLayers[currentIndex - 1];
      setLayers(layers.map(l => {
        if (l.id === layerId) return { ...l, zIndex: targetLayer.zIndex };
        if (l.id === targetLayer.id) return { ...l, zIndex: layer.zIndex };
        return l;
      }));
    }
  };
  
  // Generate demo property groups for the selected element
  const getPropertyGroups = () => {
    if (!selectedElement) return [];
    
    // Find the selected element across all layers
    let selectedElementObj: any;
    let selectedLayerObj: any;
    
    layers.forEach(layer => {
      const element = layer.elements.find(e => e.id === selectedElement);
      if (element) {
        selectedElementObj = element;
        selectedLayerObj = layer;
      }
    });
    
    if (!selectedElementObj || !selectedLayerObj) return [];
    
    // Common properties for all element types
    const commonGroup = {
      id: 'common',
      title: 'Common Properties',
      properties: [
        {
          type: 'text' as const,
          id: 'id',
          label: 'ID',
          value: selectedElementObj.id,
          onChange: (value: string) => console.log('ID changed:', value)
        },
        {
          type: 'number' as const,
          id: 'x',
          label: 'X Position (%)',
          value: selectedElementObj.x,
          min: 0,
          max: 100,
          step: 0.1,
          onChange: (value: number) => {
            // Update the element's x position
            setLayers(layers.map(layer => {
              if (layer.id !== selectedLayerObj.id) return layer;
              return {
                ...layer,
                elements: layer.elements.map(element => {
                  if (element.id !== selectedElement) return element;
                  return { ...element, x: value };
                })
              };
            }));
          }
        },
        {
          type: 'number' as const,
          id: 'y',
          label: 'Y Position (%)',
          value: selectedElementObj.y,
          min: 0,
          max: 100,
          step: 0.1,
          onChange: (value: number) => {
            // Update the element's y position
            setLayers(layers.map(layer => {
              if (layer.id !== selectedLayerObj.id) return layer;
              return {
                ...layer,
                elements: layer.elements.map(element => {
                  if (element.id !== selectedElement) return element;
                  return { ...element, y: value };
                })
              };
            }));
          }
        },
        {
          type: 'number' as const,
          id: 'width',
          label: 'Width (%)',
          value: selectedElementObj.width,
          min: 1,
          max: 100,
          step: 0.1,
          onChange: (value: number) => console.log('Width changed:', value)
        },
        {
          type: 'number' as const,
          id: 'height',
          label: 'Height (%)',
          value: selectedElementObj.height,
          min: 1,
          max: 100,
          step: 0.1,
          onChange: (value: number) => console.log('Height changed:', value)
        },
        {
          type: 'spacer' as const,
          id: 'spacer1'
        },
        {
          type: 'number' as const,
          id: 'rotation',
          label: 'Rotation (deg)',
          value: selectedElementObj.rotation,
          min: -180,
          max: 180,
          step: 1,
          onChange: (value: number) => console.log('Rotation changed:', value)
        },
        {
          type: 'number' as const,
          id: 'scale',
          label: 'Scale',
          value: selectedElementObj.scale,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: (value: number) => console.log('Scale changed:', value)
        },
        {
          type: 'number' as const,
          id: 'opacity',
          label: 'Opacity',
          value: selectedElementObj.opacity,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (value: number) => console.log('Opacity changed:', value)
        }
      ]
    };
    
    // Type-specific properties
    let specificGroup;
    
    switch (selectedElementObj.type) {
      case 'background':
        specificGroup = {
          id: 'background',
          title: 'Background Properties',
          properties: [
            {
              type: 'select' as const,
              id: 'bgType',
              label: 'Background Type',
              value: 'image',
              options: [
                { value: 'image', label: 'Image' },
                { value: 'color', label: 'Solid Color' },
                { value: 'gradient', label: 'Gradient' }
              ],
              onChange: (value: string) => console.log('Background type changed:', value)
            },
            {
              type: 'color' as const,
              id: 'bgColor',
              label: 'Color',
              value: '#1a1a2e',
              onChange: (value: string) => console.log('Background color changed:', value)
            }
          ]
        };
        break;
        
      case 'symbol':
        specificGroup = {
          id: 'symbol',
          title: 'Symbol Properties',
          properties: [
            {
              type: 'select' as const,
              id: 'symbolType',
              label: 'Symbol Type',
              value: 'regular',
              options: [
                { value: 'regular', label: 'Regular' },
                { value: 'wild', label: 'Wild' },
                { value: 'scatter', label: 'Scatter' },
                { value: 'bonus', label: 'Bonus' }
              ],
              onChange: (value: string) => console.log('Symbol type changed:', value)
            },
            {
              type: 'number' as const,
              id: 'value',
              label: 'Payout Value',
              value: 10,
              min: 0,
              max: 1000,
              step: 1,
              onChange: (value: number) => console.log('Symbol value changed:', value)
            }
          ]
        };
        break;
        
      case 'button':
        specificGroup = {
          id: 'button',
          title: 'Button Properties',
          properties: [
            {
              type: 'text' as const,
              id: 'label',
              label: 'Button Label',
              value: selectedElementObj.data?.label || 'Button',
              onChange: (value: string) => console.log('Button label changed:', value)
            },
            {
              type: 'select' as const,
              id: 'buttonType',
              label: 'Button Type',
              value: 'primary',
              options: [
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' },
                { value: 'tertiary', label: 'Tertiary' }
              ],
              onChange: (value: string) => console.log('Button type changed:', value)
            },
            {
              type: 'color' as const,
              id: 'buttonColor',
              label: 'Button Color',
              value: '#ff2e63',
              onChange: (value: string) => console.log('Button color changed:', value)
            }
          ]
        };
        break;
        
      case 'particle':
        specificGroup = {
          id: 'effect',
          title: 'Effect Properties',
          properties: [
            {
              type: 'select' as const,
              id: 'effectType',
              label: 'Effect Type',
              value: 'glow',
              options: [
                { value: 'glow', label: 'Glow' },
                { value: 'particles', label: 'Particles' },
                { value: 'confetti', label: 'Confetti' },
                { value: 'shine', label: 'Shine' }
              ],
              onChange: (value: string) => console.log('Effect type changed:', value)
            },
            {
              type: 'color' as const,
              id: 'effectColor',
              label: 'Effect Color',
              value: '#ffbd69',
              onChange: (value: string) => console.log('Effect color changed:', value)
            },
            {
              type: 'number' as const,
              id: 'intensity',
              label: 'Intensity',
              value: 0.7,
              min: 0,
              max: 1,
              step: 0.01,
              onChange: (value: number) => console.log('Effect intensity changed:', value)
            },
            {
              type: 'number' as const,
              id: 'duration',
              label: 'Duration (s)',
              value: 2,
              min: 0.1,
              max: 10,
              step: 0.1,
              onChange: (value: number) => console.log('Effect duration changed:', value)
            }
          ]
        };
        break;
        
      default:
        specificGroup = {
          id: 'specific',
          title: 'Properties',
          properties: []
        };
    }
    
    return [commonGroup, specificGroup];
  };
  
  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setZoom(1);
  
  // Handle play/pause toggle
  const handlePlayPreview = () => setIsPlaying(!isPlaying);
  
  // Handle edit mode toggle
  const handleToggleEditMode = () => setEditMode(!editMode);
  
  // Handle adding a new element
  const handleAddElement = () => {
    if (!activeLayer) return;
    
    // Find the active layer
    const layer = layers.find(l => l.id === activeLayer);
    if (!layer) return;
    
    // Create a new element based on layer type
    const newElement = {
      id: `new-element-${Date.now()}`,
      type: layer.type === 'background' ? 'background' :
            layer.type === 'symbols' ? 'symbol' :
            layer.type === 'ui' ? 'button' : 'particle',
      x: 50,
      y: 50,
      width: layer.type === 'symbols' ? 15 : 20,
      height: layer.type === 'symbols' ? 15 : 20,
      rotation: 0,
      scale: 1,
      opacity: 1,
      data: {}
    };
    
    // Add the new element to the layer
    setLayers(layers.map(l => {
      if (l.id !== activeLayer) return l;
      return {
        ...l,
        elements: [...l.elements, newElement]
      };
    }));
    
    // Select the new element
    setSelectedElement(newElement.id);
  };
  
  // Handle deleting the selected element
  const handleDeleteSelected = () => {
    if (!selectedElement || !activeLayer) return;
    
    // Remove the selected element from its layer
    setLayers(layers.map(layer => {
      if (layer.id !== activeLayer) return layer;
      return {
        ...layer,
        elements: layer.elements.filter(element => element.id !== selectedElement)
      };
    }));
    
    // Clear selection
    setSelectedElement(undefined);
  };
  
  return (
    <div className={`flex flex-col bg-gray-950 rounded-lg overflow-hidden ${className}`}>
      {/* Top toolbar */}
      <div className="flex justify-between items-center p-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Game Canvas</span>
          <div className="w-px h-6 bg-gray-700"></div>
          <CanvasControls
            editMode={editMode}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onToggleEditMode={handleToggleEditMode}
            onPlayPreview={handlePlayPreview}
            isPlaying={isPlaying}
            onAddElement={editMode ? handleAddElement : undefined}
            onDeleteSelected={editMode ? handleDeleteSelected : undefined}
            hasSelectedElement={!!selectedElement}
          />
        </div>
        
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Layers */}
        {showLayerPanel && (
          <div className="w-48 border-r border-gray-800 flex-shrink-0">
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayer}
              onLayerSelect={handleLayerSelect}
              onLayerVisibilityToggle={handleLayerVisibilityToggle}
              onLayerLockToggle={handleLayerLockToggle}
              onLayerOrderChange={handleLayerOrderChange}
              onLayerDelete={(layerId) => {
                setLayers(layers.filter(layer => layer.id !== layerId));
                if (activeLayer === layerId) setActiveLayer(undefined);
              }}
              className="h-full"
            />
          </div>
        )}
        
        {/* Center - Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-950">
          <GameCanvas
            editMode={editMode}
            activeLayer={activeLayer ? layers.find(l => l.id === activeLayer)?.type : 'all'}
            zoom={zoom}
            width={800}
            height={600}
            onElementSelect={handleElementSelect}
            className="border border-gray-800 shadow-lg"
          />
        </div>
        
        {/* Right panel - Properties */}
        {showPropertyPanel && selectedElement && (
          <div className="w-64 border-l border-gray-800 flex-shrink-0">
            <PropertyPanel
              title="Element Properties"
              groups={getPropertyGroups()}
              onClose={() => setSelectedElement(undefined)}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCanvasWorkspace;