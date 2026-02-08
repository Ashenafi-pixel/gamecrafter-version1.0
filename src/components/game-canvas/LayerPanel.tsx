import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash, ChevronUp, ChevronDown } from 'lucide-react';
import { Layer } from './LayerSystem';

export interface LayerPanelProps {
  layers: Layer[];
  activeLayerId?: string;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
  onLayerDelete?: (layerId: string) => void;
  onLayerAdd?: () => void;
  onLayerOrderChange?: (layerId: string, direction: 'up' | 'down') => void;
  className?: string;
}

/**
 * Layer Panel Component
 * 
 * Displays and allows management of layers in the game canvas.
 * Users can toggle visibility, lock status, reorder, and select layers.
 */
const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerAdd,
  onLayerOrderChange,
  className = '',
}) => {
  // Sort layers by z-index (highest on top)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  
  // Get layer type icon
  const getLayerTypeIcon = (layerType: string) => {
    switch (layerType) {
      case 'background':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 8L21 8" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'symbols':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5H19V19H5V5Z" stroke="currentColor" strokeWidth="2" />
            <path d="M5 9H19" stroke="currentColor" strokeWidth="2" />
            <path d="M5 13H19" stroke="currentColor" strokeWidth="2" />
            <path d="M9 5V19" stroke="currentColor" strokeWidth="2" />
            <path d="M13 5V19" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'ui':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M17 7L17 7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'effects':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3V4M12 20V21M21 12H20M4 12H3M18.364 5.636L17.657 6.343M6.343 17.657L5.636 18.364M18.364 18.364L17.657 17.657M6.343 6.343L5.636 5.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      default:
        return <div className="w-4 h-4 rounded-sm border border-current"></div>;
    }
  };
  
  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-md overflow-hidden ${className}`}>
      {/* Panel header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 py-2 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">Layers</h3>
        {onLayerAdd && (
          <button 
            onClick={onLayerAdd}
            className="text-gray-400 hover:text-white transition-colors"
            title="Add new layer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-xs">
            No layers available
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {sortedLayers.map((layer) => (
              <li 
                key={layer.id}
                className={`px-2 py-1 hover:bg-gray-800 transition-colors ${activeLayerId === layer.id ? 'bg-gray-800' : ''}`}
              >
                <div className="flex items-center">
                  {/* Layer visibility toggle */}
                  <button
                    onClick={() => onLayerVisibilityToggle(layer.id)}
                    className={`p-1 rounded hover:bg-gray-700 ${layer.visible ? 'text-white' : 'text-gray-500'}`}
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  
                  {/* Layer lock toggle */}
                  <button
                    onClick={() => onLayerLockToggle(layer.id)}
                    className={`p-1 rounded hover:bg-gray-700 ${layer.locked ? 'text-gray-500' : 'text-white'}`}
                    title={layer.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  
                  {/* Layer name and type */}
                  <button
                    className="flex-1 flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-gray-700"
                    onClick={() => onLayerSelect(layer.id)}
                  >
                    <span className={`text-${layer.visible ? 'white' : 'gray-500'}`}>
                      {getLayerTypeIcon(layer.type)}
                    </span>
                    <span className={`text-xs font-medium ${activeLayerId === layer.id ? 'text-white' : 'text-gray-400'}`}>
                      {layer.name}
                    </span>
                  </button>
                  
                  {/* Layer order controls */}
                  {onLayerOrderChange && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => onLayerOrderChange(layer.id, 'up')}
                        className="p-0.5 text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed"
                        disabled={layer.zIndex === Math.max(...layers.map(l => l.zIndex))}
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onLayerOrderChange(layer.id, 'down')}
                        className="p-0.5 text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed"
                        disabled={layer.zIndex === Math.min(...layers.map(l => l.zIndex))}
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Layer delete */}
                  {onLayerDelete && (
                    <button
                      onClick={() => onLayerDelete(layer.id)}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-500"
                      title="Delete layer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;