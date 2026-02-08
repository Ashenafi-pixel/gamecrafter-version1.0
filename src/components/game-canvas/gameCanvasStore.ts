import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Layer, LayerElement } from './LayerSystem';

// Default layers structure
const defaultLayers: Layer[] = [
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
        data: { src: '' }
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
    elements: []
  },
  {
    id: 'ui-layer',
    name: 'UI Elements',
    type: 'ui',
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 20,
    elements: []
  },
  {
    id: 'effects-layer',
    name: 'Effects',
    type: 'effects',
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 30,
    elements: []
  }
];

// Types for the game canvas store
interface GameCanvasState {
  // Canvas settings
  zoom: number;
  editMode: boolean;
  isPlaying: boolean;
  fullscreen: boolean;
  
  // Layer and element state
  layers: Layer[];
  activeLayerId: string | null;
  selectedElementId: string | null;
  
  // Canvas history for undo/redo
  history: {
    past: Layer[][];
    future: Layer[][];
  };
  
  // Actions for canvas settings
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  toggleEditMode: () => void;
  togglePlayMode: () => void;
  toggleFullscreen: () => void;
  
  // Actions for layer management
  addLayer: (type: 'background' | 'symbols' | 'ui' | 'effects', name?: string) => void;
  deleteLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setActiveLayer: (layerId: string | null) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  
  // Actions for element management
  addElement: (layerId: string, element: Partial<LayerElement>) => string;
  deleteElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<LayerElement>) => void;
  setSelectedElement: (elementId: string | null) => void;
  
  // History management
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Reset the canvas
  resetCanvas: () => void;
}

/**
 * Game Canvas Store
 * 
 * Central state management for the game canvas and its components.
 * Handles layers, elements, editing state, and history.
 */
export const useGameCanvasStore = create<GameCanvasState>()(
  persist(
    (set, get) => ({
      // Initial state
      zoom: 1,
      editMode: false,
      isPlaying: false,
      fullscreen: false,
      layers: [...defaultLayers],
      activeLayerId: 'symbols-layer',
      selectedElementId: null,
      history: {
        past: [],
        future: []
      },
      
      // Canvas setting actions
      setZoom: (zoom) => set({ zoom }),
      resetZoom: () => set({ zoom: 1 }),
      toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
      togglePlayMode: () => set((state) => ({ isPlaying: !state.isPlaying })),
      toggleFullscreen: () => set((state) => ({ fullscreen: !state.fullscreen })),
      
      // Layer management actions
      addLayer: (type, name) => {
        // Generate a unique ID and name
        const id = `${type}-layer-${Date.now()}`;
        const layerName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`;
        
        // Determine the highest z-index and add 10 to it
        const highestZIndex = Math.max(...get().layers.map(layer => layer.zIndex), 0);
        
        // Create the new layer
        const newLayer: Layer = {
          id,
          name: layerName,
          type,
          visible: true,
          locked: false,
          opacity: 1,
          zIndex: highestZIndex + 10,
          elements: []
        };
        
        // Save current state to history and add the new layer
        get().saveHistory();
        set((state) => ({
          layers: [...state.layers, newLayer],
          activeLayerId: id
        }));
      },
      
      deleteLayer: (layerId) => {
        const { layers, activeLayerId, selectedElementId } = get();
        
        // Don't delete if it's the only layer
        if (layers.length <= 1) return;
        
        // Save current state to history
        get().saveHistory();
        
        // Remove the layer
        const updatedLayers = layers.filter(layer => layer.id !== layerId);
        
        // Update active layer if deleted
        let newActiveLayerId = activeLayerId;
        if (activeLayerId === layerId) {
          newActiveLayerId = updatedLayers[0]?.id || null;
        }
        
        // Update selected element if it was in the deleted layer
        let newSelectedElementId = selectedElementId;
        const deletedLayer = layers.find(layer => layer.id === layerId);
        if (deletedLayer && selectedElementId && deletedLayer.elements.some(el => el.id === selectedElementId)) {
          newSelectedElementId = null;
        }
        
        set({
          layers: updatedLayers,
          activeLayerId: newActiveLayerId,
          selectedElementId: newSelectedElementId
        });
      },
      
      toggleLayerVisibility: (layerId) => {
        get().saveHistory();
        set((state) => ({
          layers: state.layers.map(layer => 
            layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
          )
        }));
      },
      
      toggleLayerLock: (layerId) => {
        get().saveHistory();
        set((state) => ({
          layers: state.layers.map(layer => 
            layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
          )
        }));
      },
      
      setLayerOpacity: (layerId, opacity) => {
        get().saveHistory();
        set((state) => ({
          layers: state.layers.map(layer => 
            layer.id === layerId ? { ...layer, opacity } : layer
          )
        }));
      },
      
      setActiveLayer: (layerId) => {
        set({ activeLayerId: layerId });
      },
      
      reorderLayer: (layerId, direction) => {
        const { layers } = get();
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return;
        
        // Sort layers by z-index
        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedLayers.findIndex(l => l.id === layerId);
        
        if (direction === 'up' && currentIndex < sortedLayers.length - 1) {
          const targetLayer = sortedLayers[currentIndex + 1];
          get().saveHistory();
          set((state) => ({
            layers: state.layers.map(l => {
              if (l.id === layerId) return { ...l, zIndex: targetLayer.zIndex };
              if (l.id === targetLayer.id) return { ...l, zIndex: layer.zIndex };
              return l;
            })
          }));
        } else if (direction === 'down' && currentIndex > 0) {
          const targetLayer = sortedLayers[currentIndex - 1];
          get().saveHistory();
          set((state) => ({
            layers: state.layers.map(l => {
              if (l.id === layerId) return { ...l, zIndex: targetLayer.zIndex };
              if (l.id === targetLayer.id) return { ...l, zIndex: layer.zIndex };
              return l;
            })
          }));
        }
      },
      
      // Element management actions
      addElement: (layerId, elementData) => {
        const { layers } = get();
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return '';
        
        // Create a new element with defaults based on layer type
        const newElement: LayerElement = {
          id: `element-${Date.now()}`,
          type: layer.type === 'background' ? 'background' :
                layer.type === 'symbols' ? 'symbol' :
                layer.type === 'ui' ? 'button' : 'particle',
          x: 50,
          y: 50,
          width: 10,
          height: 10,
          rotation: 0,
          scale: 1,
          opacity: 1,
          data: {},
          ...elementData
        };
        
        // Save current state to history and add the element
        get().saveHistory();
        set((state) => ({
          layers: state.layers.map(l => {
            if (l.id !== layerId) return l;
            return {
              ...l,
              elements: [...l.elements, newElement]
            };
          }),
          selectedElementId: newElement.id
        }));
        
        return newElement.id;
      },
      
      deleteElement: (elementId) => {
        const { layers, selectedElementId } = get();
        
        // Find which layer contains the element
        let layerWithElement = null;
        for (const layer of layers) {
          if (layer.elements.some(el => el.id === elementId)) {
            layerWithElement = layer;
            break;
          }
        }
        
        if (!layerWithElement) return;
        
        // Save current state to history
        get().saveHistory();
        
        // Remove the element
        set((state) => ({
          layers: state.layers.map(layer => {
            if (layer.id !== layerWithElement!.id) return layer;
            return {
              ...layer,
              elements: layer.elements.filter(el => el.id !== elementId)
            };
          }),
          selectedElementId: selectedElementId === elementId ? null : selectedElementId
        }));
      },
      
      updateElement: (elementId, updates) => {
        const { layers } = get();
        
        // Find which layer contains the element
        let layerWithElement = null;
        let elementToUpdate = null;
        
        for (const layer of layers) {
          const element = layer.elements.find(el => el.id === elementId);
          if (element) {
            layerWithElement = layer;
            elementToUpdate = element;
            break;
          }
        }
        
        if (!layerWithElement || !elementToUpdate) return;
        
        // Save current state to history
        get().saveHistory();
        
        // Update the element
        set((state) => ({
          layers: state.layers.map(layer => {
            if (layer.id !== layerWithElement!.id) return layer;
            return {
              ...layer,
              elements: layer.elements.map(el => {
                if (el.id !== elementId) return el;
                return { ...el, ...updates };
              })
            };
          })
        }));
      },
      
      setSelectedElement: (elementId) => {
        set({ selectedElementId: elementId });
        
        // If an element is selected, also activate its layer
        if (elementId) {
          const { layers } = get();
          for (const layer of layers) {
            if (layer.elements.some(el => el.id === elementId)) {
              get().setActiveLayer(layer.id);
              break;
            }
          }
        }
      },
      
      // History management
      saveHistory: () => {
        const { layers, history } = get();
        set({
          history: {
            past: [...history.past, JSON.parse(JSON.stringify(layers))],
            future: []
          }
        });
      },
      
      undo: () => {
        const { history } = get();
        if (history.past.length === 0) return;
        
        const newPast = [...history.past];
        const lastState = newPast.pop();
        
        set((state) => ({
          layers: lastState || defaultLayers,
          history: {
            past: newPast,
            future: [JSON.parse(JSON.stringify(state.layers)), ...history.future]
          }
        }));
      },
      
      redo: () => {
        const { history } = get();
        if (history.future.length === 0) return;
        
        const newFuture = [...history.future];
        const nextState = newFuture.shift();
        
        set((state) => ({
          layers: nextState || defaultLayers,
          history: {
            past: [...history.past, JSON.parse(JSON.stringify(state.layers))],
            future: newFuture
          }
        }));
      },
      
      // Reset to default state
      resetCanvas: () => {
        get().saveHistory();
        set({
          layers: [...defaultLayers],
          activeLayerId: 'symbols-layer',
          selectedElementId: null
        });
      }
    }),
    {
      name: 'game-canvas-storage',
      partialize: (state) => ({
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        editMode: state.editMode,
        zoom: state.zoom,
        selectedElementId: state.selectedElementId,
        fullscreen: state.fullscreen,
        // Do not persist isPlaying state - should always start paused
      })
    }
  )
);