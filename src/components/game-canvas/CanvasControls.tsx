import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  Layers,
  MousePointer,
  Hand,
  RotateCcw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash
} from 'lucide-react';

export interface CanvasControlsProps {
  editMode: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleEditMode: () => void;
  onPlayPreview?: () => void;
  isPlaying?: boolean;
  onAddElement?: () => void;
  onDeleteSelected?: () => void;
  hasSelectedElement?: boolean;
  className?: string;
}

/**
 * Canvas Controls Component
 * 
 * Provides a toolbar for controlling the game canvas view and edit modes.
 * Includes zoom controls, edit/view toggle, play/pause, and more.
 */
const CanvasControls: React.FC<CanvasControlsProps> = ({
  editMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleEditMode,
  onPlayPreview,
  isPlaying = false,
  onAddElement,
  onDeleteSelected,
  hasSelectedElement = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 p-1 rounded-md bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-10 ${className}`}>
      {/* View controls group */}
      <div className="flex items-center p-0.5 border-r border-white border-opacity-10">
        <button
          className={`rounded p-1.5 ${!editMode ? 'bg-red-500 bg-opacity-20 text-white' : 'text-gray-300 hover:bg-white hover:bg-opacity-10'} transition-colors`}
          onClick={onToggleEditMode}
          title="View mode"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          className={`rounded p-1.5 ${editMode ? 'bg-red-500 bg-opacity-20 text-white' : 'text-gray-300 hover:bg-white hover:bg-opacity-10'} transition-colors`}
          onClick={onToggleEditMode}
          title="Edit mode"
        >
          <MousePointer className="w-4 h-4" />
        </button>
      </div>
      
      {/* Zoom controls group */}
      <div className="flex items-center p-0.5 border-r border-white border-opacity-10">
        <button
          className="rounded p-1.5 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-colors"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-2 text-xs text-gray-300 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          className="rounded p-1.5 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-colors"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          className="rounded p-1.5 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-colors"
          onClick={onZoomReset}
          title="Reset zoom"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
      
      {/* Playback controls group */}
      {onPlayPreview && (
        <div className="flex items-center p-0.5 border-r border-white border-opacity-10">
          <button
            className="rounded p-1.5 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-colors"
            onClick={onPlayPreview}
            title={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      )}
      
      {/* Edit tools group - only shown in edit mode */}
      {editMode && (
        <>
          <div className="flex items-center p-0.5 border-r border-white border-opacity-10">
            <button
              className="rounded p-1.5 text-gray-300 hover:bg-white hover:bg-opacity-10 transition-colors"
              onClick={onAddElement}
              title="Add element"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className={`rounded p-1.5 ${hasSelectedElement ? 'text-gray-300 hover:bg-white hover:bg-opacity-10' : 'text-gray-500 cursor-not-allowed'} transition-colors`}
              onClick={hasSelectedElement ? onDeleteSelected : undefined}
              title="Delete selected"
              disabled={!hasSelectedElement}
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasControls;