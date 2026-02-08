import React from 'react';

// Layer-related types
export interface Layer {
  id: string;
  name: string;
  type: 'background' | 'symbols' | 'ui' | 'effects';
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  elements: LayerElement[];
}

export interface LayerElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  data: any; // Element-specific data
}

export interface LayerSystemProps {
  layers: Layer[];
  activeLayerId?: string;
  selectedElementId?: string;
  editMode?: boolean;
  onLayerToggle: (layerId: string) => void;
  onLayerSelect: (layerId: string) => void;
  onElementSelect: (elementId: string, layerId: string) => void;
  className?: string;
}

/**
 * Layer System Component
 * 
 * Manages the rendering and interaction with different visual layers in the game canvas.
 * Each layer represents a specific aspect of the game (background, symbols, UI, effects).
 */
const LayerSystem: React.FC<LayerSystemProps> = ({
  layers,
  activeLayerId,
  selectedElementId,
  editMode = false,
  onLayerToggle,
  onLayerSelect,
  onElementSelect,
  className = '',
}) => {
  // Sort layers by z-index
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  
  // Render a specific layer
  const renderLayer = (layer: Layer) => {
    if (!layer.visible) return null;
    
    // The actual layer rendering will depend on the layer type
    switch (layer.type) {
      case 'background':
        return (
          <div 
            key={layer.id}
            className="absolute inset-0"
            style={{ opacity: layer.opacity }}
          >
            {/* Background elements rendering */}
            {layer.elements.map(element => (
              <div
                key={element.id}
                className={`absolute ${editMode && activeLayerId === layer.id ? 'cursor-move' : ''} ${selectedElementId === element.id ? 'ring-2 ring-red-500' : ''}`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                  opacity: element.opacity,
                  pointerEvents: layer.locked ? 'none' : 'auto',
                }}
                onClick={() => !layer.locked && editMode && onElementSelect(element.id, layer.id)}
              >
                {/* Placeholder for background element, replace with actual rendering */}
                <div className="w-full h-full bg-gray-800 bg-opacity-50 flex items-center justify-center">
                  <span className="text-white text-opacity-60">{element.type}</span>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'symbols':
        return (
          <div 
            key={layer.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: layer.opacity }}
          >
            {/* Symbol grid or reel rendering */}
            <div className="grid grid-cols-5 gap-1 p-4">
              {layer.elements.map(element => (
                <div
                  key={element.id}
                  className={`w-16 h-16 ${editMode && activeLayerId === layer.id ? 'cursor-move' : ''} ${selectedElementId === element.id ? 'ring-2 ring-red-500' : ''}`}
                  style={{
                    transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                    opacity: element.opacity,
                    pointerEvents: layer.locked ? 'none' : 'auto',
                  }}
                  onClick={() => !layer.locked && editMode && onElementSelect(element.id, layer.id)}
                >
                  {/* Placeholder for symbol element, replace with actual rendering */}
                  <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center">
                    <span className="text-white text-opacity-80 text-sm">{element.data?.symbol || 'Symbol'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'ui':
        return (
          <div 
            key={layer.id}
            className="absolute inset-0"
            style={{ opacity: layer.opacity }}
          >
            {/* UI elements rendering */}
            {layer.elements.map(element => (
              <div
                key={element.id}
                className={`absolute ${editMode && activeLayerId === layer.id ? 'cursor-move' : ''} ${selectedElementId === element.id ? 'ring-2 ring-red-500' : ''}`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                  opacity: element.opacity,
                  pointerEvents: layer.locked ? 'none' : 'auto',
                }}
                onClick={() => !layer.locked && editMode && onElementSelect(element.id, layer.id)}
              >
                {/* Placeholder for UI element, replace with actual rendering */}
                <div className="w-full h-full bg-gray-600 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">{element.data?.label || 'UI Element'}</span>
                </div>
              </div>
            ))}
          </div>
        );
        
      case 'effects':
        return (
          <div 
            key={layer.id}
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: layer.opacity }}
          >
            {/* Effects rendering - typically animated */}
            {layer.elements.map(element => (
              <div
                key={element.id}
                className={`absolute ${selectedElementId === element.id ? 'ring-2 ring-red-500' : ''}`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                  opacity: element.opacity,
                  pointerEvents: editMode && !layer.locked ? 'auto' : 'none',
                }}
                onClick={() => !layer.locked && editMode && onElementSelect(element.id, layer.id)}
              >
                {/* Placeholder for effect element, replace with actual rendering */}
                <div className="w-full h-full rounded-full bg-yellow-500 bg-opacity-30 animate-pulse flex items-center justify-center">
                  <span className="text-white text-sm">{element.data?.effect || 'Effect'}</span>
                </div>
              </div>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Render all visible layers */}
      {sortedLayers.map(layer => renderLayer(layer))}
    </div>
  );
};

export default LayerSystem;