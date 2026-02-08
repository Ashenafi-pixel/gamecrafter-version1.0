import * as PIXI from 'pixi.js';
import { AnimationEngine } from './AnimationEngine';
import { AssetManager } from './AssetManager';

/**
 * UI Controller for managing canvas interactions and viewport controls
 * Handles zoom, pan, selection, and user interface events
 */
export interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;
}

export interface InteractionState {
  isDragging: boolean;
  isSelecting: boolean;
  lastPointerX: number;
  lastPointerY: number;
  selectedSprites: Set<PIXI.DisplayObject>;
}

export class UIController {
  private animationEngine: AnimationEngine;
  private assetManager: AssetManager;
  private canvas: HTMLCanvasElement;
  private viewport: ViewportState;
  private interaction: InteractionState;
  private eventListeners: Map<string, (event: any) => void>;

  constructor(animationEngine: AnimationEngine, assetManager: AssetManager) {
    this.animationEngine = animationEngine;
    this.assetManager = assetManager;
    this.canvas = animationEngine.getApp().view as HTMLCanvasElement;
    
    this.viewport = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      minScale: 0.1,
      maxScale: 5.0
    };
    
    this.interaction = {
      isDragging: false,
      isSelecting: false,
      lastPointerX: 0,
      lastPointerY: 0,
      selectedSprites: new Set()
    };
    
    this.eventListeners = new Map();
  }

  /**
   * Initialize UI controls and setup canvas interactions
   */
  initialize(): void {
    this.setupCanvasInteraction();
    this.setupKeyboardShortcuts();
    this.updateViewport();
  }

  /**
   * Set up canvas interaction handlers
   */
  private setupCanvasInteraction(): void {
    const stage = this.animationEngine.getStage();
    
    // Enable PIXI interaction (v7.2+ compatible)
    stage.eventMode = 'static';
    stage.hitArea = new PIXI.Rectangle(0, 0, this.canvas.width, this.canvas.height);
    
    // Mouse/touch event handlers
    this.addEventListener('wheel', this.onWheel.bind(this));
    this.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.addEventListener('contextmenu', this.onContextMenu.bind(this));
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.addEventListener('keydown', this.onKeyDown.bind(this), document);
    this.addEventListener('keyup', this.onKeyUp.bind(this), document);
  }

  /**
   * Handle mouse wheel for zooming
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
      this.viewport.minScale,
      Math.min(this.viewport.maxScale, this.viewport.scale * scaleFactor)
    );
    
    if (newScale !== this.viewport.scale) {
      // Zoom towards mouse position
      const worldPos = this.screenToWorld(mouseX, mouseY);
      this.viewport.scale = newScale;
      const newWorldPos = this.screenToWorld(mouseX, mouseY);
      
      this.viewport.offsetX += (worldPos.x - newWorldPos.x) * this.viewport.scale;
      this.viewport.offsetY += (worldPos.y - newWorldPos.y) * this.viewport.scale;
      
      this.updateViewport();
    }
  }

  /**
   * Handle pointer down events
   */
  private onPointerDown(event: PointerEvent): void {
    this.interaction.lastPointerX = event.clientX;
    this.interaction.lastPointerY = event.clientY;
    
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
      // Middle mouse or Ctrl+Left for panning
      this.interaction.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    } else if (event.button === 0) {
      // Left mouse for selection
      this.interaction.isSelecting = true;
      this.handleSelection(event);
    }
  }

  /**
   * Handle pointer move events
   */
  private onPointerMove(event: PointerEvent): void {
    const deltaX = event.clientX - this.interaction.lastPointerX;
    const deltaY = event.clientY - this.interaction.lastPointerY;
    
    if (this.interaction.isDragging) {
      // Pan viewport
      this.viewport.offsetX += deltaX;
      this.viewport.offsetY += deltaY;
      this.updateViewport();
    }
    
    this.interaction.lastPointerX = event.clientX;
    this.interaction.lastPointerY = event.clientY;
  }

  /**
   * Handle pointer up events
   */
  private onPointerUp(event: PointerEvent): void {
    this.interaction.isDragging = false;
    this.interaction.isSelecting = false;
    this.canvas.style.cursor = 'default';
  }

  /**
   * Handle context menu
   */
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    // Context menu logic will be implemented later
  }

  /**
   * Handle keyboard shortcuts
   */
  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        // Spacebar for temporary pan mode
        break;
      case 'KeyZ':
        if (event.ctrlKey) {
          event.preventDefault();
          // Undo functionality
        }
        break;
      case 'KeyY':
        if (event.ctrlKey) {
          event.preventDefault();
          // Redo functionality
        }
        break;
      case 'Delete':
        // Delete selected sprites
        this.deleteSelected();
        break;
      case 'KeyA':
        if (event.ctrlKey) {
          event.preventDefault();
          this.selectAll();
        }
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    // Handle key release events
  }

  /**
   * Handle sprite selection
   */
  private handleSelection(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const worldPos = this.screenToWorld(localX, localY);
    
    // Get sprite at position
    const sprite = this.getSpriteAtPosition(worldPos.x, worldPos.y);
    
    if (!event.shiftKey) {
      this.clearSelection();
    }
    
    if (sprite) {
      this.addToSelection(sprite);
    }
  }

  /**
   * Get sprite at world position
   */
  private getSpriteAtPosition(x: number, y: number): PIXI.DisplayObject | null {
    const stage = this.animationEngine.getStage();
    
    // Simple hit testing - in a real implementation, you'd use PIXI's interaction system
    for (let i = stage.children.length - 1; i >= 0; i--) {
      const child = stage.children[i];
      if (child.getBounds().contains(x, y)) {
        return child;
      }
    }
    
    return null;
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewport.offsetX) / this.viewport.scale,
      y: (screenY - this.viewport.offsetY) / this.viewport.scale
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  private worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.viewport.scale + this.viewport.offsetX,
      y: worldY * this.viewport.scale + this.viewport.offsetY
    };
  }

  /**
   * Update viewport transformation
   */
  private updateViewport(): void {
    const stage = this.animationEngine.getStage();
    stage.scale.set(this.viewport.scale);
    stage.position.set(this.viewport.offsetX, this.viewport.offsetY);
  }

  /**
   * Zoom to fit all content
   */
  zoomToFit(): void {
    const stage = this.animationEngine.getStage();
    if (stage.children.length === 0) return;
    
    const bounds = stage.getBounds();
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    const scaleX = canvasWidth / bounds.width;
    const scaleY = canvasHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of available space
    
    this.viewport.scale = Math.max(this.viewport.minScale, Math.min(this.viewport.maxScale, scale));
    this.viewport.offsetX = (canvasWidth - bounds.width * this.viewport.scale) / 2 - bounds.x * this.viewport.scale;
    this.viewport.offsetY = (canvasHeight - bounds.height * this.viewport.scale) / 2 - bounds.y * this.viewport.scale;
    
    this.updateViewport();
  }

  /**
   * Reset viewport to default
   */
  resetViewport(): void {
    this.viewport.scale = 1.0;
    this.viewport.offsetX = 0;
    this.viewport.offsetY = 0;
    this.updateViewport();
  }

  /**
   * Add sprite to selection
   */
  addToSelection(sprite: PIXI.DisplayObject): void {
    this.interaction.selectedSprites.add(sprite);
    // Visual feedback for selection would be added here
  }

  /**
   * Remove sprite from selection
   */
  removeFromSelection(sprite: PIXI.DisplayObject): void {
    this.interaction.selectedSprites.delete(sprite);
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.interaction.selectedSprites.clear();
  }

  /**
   * Select all sprites
   */
  selectAll(): void {
    const stage = this.animationEngine.getStage();
    stage.children.forEach(child => this.addToSelection(child));
  }

  /**
   * Delete selected sprites
   */
  deleteSelected(): void {
    this.interaction.selectedSprites.forEach(sprite => {
      this.animationEngine.removeFromStage(sprite);
      sprite.destroy();
    });
    this.clearSelection();
  }

  /**
   * Get current viewport state
   */
  getViewportState(): ViewportState {
    return { ...this.viewport };
  }

  /**
   * Get selected sprites
   */
  getSelectedSprites(): PIXI.DisplayObject[] {
    return Array.from(this.interaction.selectedSprites);
  }

  /**
   * Add event listener with cleanup tracking
   */
  private addEventListener(
    event: string, 
    handler: (event: any) => void, 
    target: EventTarget = this.canvas
  ): void {
    const key = `${event}_${target.constructor.name}`;
    if (this.eventListeners.has(key)) {
      target.removeEventListener(event, this.eventListeners.get(key)!);
    }
    
    target.addEventListener(event, handler);
    this.eventListeners.set(key, handler);
  }

  /**
   * Clean up and destroy UI controller
   */
  destroy(): void {
    // Remove all event listeners
    this.eventListeners.forEach((handler, key) => {
      const [event, targetType] = key.split('_');
      const target = targetType === 'HTMLCanvasElement' ? this.canvas : document;
      target.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
    
    // Clear selections
    this.clearSelection();
  }
}