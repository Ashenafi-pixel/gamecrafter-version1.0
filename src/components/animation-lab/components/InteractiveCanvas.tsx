/**
 * Interactive Canvas Component
 * Professional canvas with click-to-select, transform controls, and direct manipulation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasSprite {
  id: string;
  name: string;
  imageUrl: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    alpha: number;
  };
  selected: boolean;
  type?: string;
}

interface TransformHandle {
  type: 'move' | 'scale-nw' | 'scale-ne' | 'scale-sw' | 'scale-se' | 'rotate';
  x: number;
  y: number;
  cursor: string;
}

interface InteractiveCanvasProps {
  sprites: CanvasSprite[];
  onSpritesChange: (sprites: CanvasSprite[]) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  canvasSize: { width: number; height: number };
  backgroundImage?: string;
}

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  sprites,
  onSpritesChange,
  onSelectionChange,
  canvasSize,
  backgroundImage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragSprite, setDragSprite] = useState<string | null>(null);
  const [dragHandle, setDragHandle] = useState<TransformHandle | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [hoveredSprite, setHoveredSprite] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Load and cache images
  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current.has(url)) {
        resolve(imageCache.current.get(url)!);
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.current.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }, []);

  // Get transform handles for selected sprites
  const getTransformHandles = useCallback((sprite: CanvasSprite): TransformHandle[] => {
    if (!sprite.selected) return [];

    const { bounds, transform } = sprite;
    const x = transform.x;
    const y = transform.y;
    const width = bounds.width * transform.scaleX;
    const height = bounds.height * transform.scaleY;

    return [
      // Corner scale handles
      { type: 'scale-nw', x: x - 4, y: y - 4, cursor: 'nw-resize' },
      { type: 'scale-ne', x: x + width - 4, y: y - 4, cursor: 'ne-resize' },
      { type: 'scale-sw', x: x - 4, y: y + height - 4, cursor: 'sw-resize' },
      { type: 'scale-se', x: x + width - 4, y: y + height - 4, cursor: 'se-resize' },
      
      // Rotate handle
      { type: 'rotate', x: x + width / 2, y: y - 20, cursor: 'grab' }
    ];
  }, []);

  // Check if point is inside sprite bounds
  const isPointInSprite = useCallback((x: number, y: number, sprite: CanvasSprite): boolean => {
    const { transform, bounds } = sprite;
    return (
      x >= transform.x &&
      x <= transform.x + bounds.width * transform.scaleX &&
      y >= transform.y &&
      y <= transform.y + bounds.height * transform.scaleY
    );
  }, []);

  // Check if point is on transform handle
  const getHandleAtPoint = useCallback((x: number, y: number, sprite: CanvasSprite): TransformHandle | null => {
    const handles = getTransformHandles(sprite);
    for (const handle of handles) {
      if (
        x >= handle.x &&
        x <= handle.x + 8 &&
        y >= handle.y &&
        y <= handle.y + 8
      ) {
        return handle;
      }
    }
    return null;
  }, [getTransformHandles]);

  // Get sprite at point (topmost)
  const getSpriteAtPoint = useCallback((x: number, y: number): CanvasSprite | null => {
    // Check from top to bottom (reverse order)
    for (let i = sprites.length - 1; i >= 0; i--) {
      const sprite = sprites[i];
      if (isPointInSprite(x, y, sprite)) {
        return sprite;
      }
    }
    return null;
  }, [sprites, isPointInSprite]);

  // Draw grid background
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    
    // Vertical lines
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  }, [showGrid, canvasSize]);

  // Draw sprite with transforms
  const drawSprite = useCallback(async (
    ctx: CanvasRenderingContext2D,
    sprite: CanvasSprite
  ) => {
    try {
      const img = await loadImage(sprite.imageUrl);
      const { bounds, transform } = sprite;

      ctx.save();
      
      // Apply transforms
      ctx.globalAlpha = transform.alpha;
      ctx.translate(transform.x + bounds.width * transform.scaleX / 2, transform.y + bounds.height * transform.scaleY / 2);
      ctx.rotate(transform.rotation * Math.PI / 180);
      ctx.scale(transform.scaleX, transform.scaleY);
      
      // Draw sprite
      ctx.drawImage(
        img,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        -bounds.width / 2,
        -bounds.height / 2,
        bounds.width,
        bounds.height
      );
      
      ctx.restore();

      // Draw selection indicator
      if (sprite.selected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(
          transform.x - 2,
          transform.y - 2,
          bounds.width * transform.scaleX + 4,
          bounds.height * transform.scaleY + 4
        );
        ctx.setLineDash([]);

        // Draw sprite name
        ctx.fillStyle = '#3b82f6';
        ctx.font = '12px system-ui';
        ctx.fillText(
          sprite.name,
          transform.x,
          transform.y - 8
        );
      }

      // Draw hover indicator
      if (hoveredSprite === sprite.id && !sprite.selected) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(
          transform.x - 1,
          transform.y - 1,
          bounds.width * transform.scaleX + 2,
          bounds.height * transform.scaleY + 2
        );
        ctx.setLineDash([]);
      }

    } catch (error) {
      console.error('Failed to draw sprite:', sprite.name, error);
    }
  }, [loadImage, hoveredSprite]);

  // Draw transform handles
  const drawTransformHandles = useCallback((ctx: CanvasRenderingContext2D, sprite: CanvasSprite) => {
    if (!sprite.selected) return;

    const handles = getTransformHandles(sprite);
    
    handles.forEach(handle => {
      ctx.fillStyle = handle.type === 'rotate' ? '#f59e0b' : '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      if (handle.type === 'rotate') {
        // Draw rotate handle as circle
        ctx.beginPath();
        ctx.arc(handle.x + 4, handle.y + 4, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        // Draw scale handles as squares
        ctx.fillRect(handle.x, handle.y, 8, 8);
        ctx.strokeRect(handle.x, handle.y, 8, 8);
      }
    });
  }, [getTransformHandles]);

  // Draw selection box
  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectionBox) return;

    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    
    ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    ctx.setLineDash([]);
  }, [selectionBox]);

  // Main render function
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx);

    // Draw background image if provided
    if (backgroundImage) {
      try {
        const img = await loadImage(backgroundImage);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      } catch (error) {
        console.error('Failed to draw background image:', error);
      }
    }

    // Draw sprites
    for (const sprite of sprites) {
      await drawSprite(ctx, sprite);
    }

    // Draw transform handles for selected sprites
    sprites.forEach(sprite => {
      if (sprite.selected) {
        drawTransformHandles(ctx, sprite);
      }
    });

    // Draw selection box
    drawSelectionBox(ctx);

  }, [sprites, drawGrid, drawSprite, drawTransformHandles, drawSelectionBox, backgroundImage, loadImage]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setDragStart({ x, y });

    // Check for transform handles first
    const selectedSprites = sprites.filter(s => s.selected);
    for (const sprite of selectedSprites) {
      const handle = getHandleAtPoint(x, y, sprite);
      if (handle) {
        setDragHandle(handle);
        setDragSprite(sprite.id);
        setIsDragging(true);
        return;
      }
    }

    // Check for sprite selection
    const sprite = getSpriteAtPoint(x, y);
    if (sprite) {
      setDragSprite(sprite.id);
      setIsDragging(true);

      // Handle selection logic
      if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        const newSprites = sprites.map(s =>
          s.id === sprite.id ? { ...s, selected: !s.selected } : s
        );
        onSpritesChange(newSprites);
      } else if (!sprite.selected) {
        // Single selection
        const newSprites = sprites.map(s => ({
          ...s,
          selected: s.id === sprite.id
        }));
        onSpritesChange(newSprites);
      }
    } else {
      // Start selection box
      if (!e.ctrlKey && !e.metaKey) {
        // Clear selection
        const newSprites = sprites.map(s => ({ ...s, selected: false }));
        onSpritesChange(newSprites);
      }
      
      setSelectionBox({ x, y, width: 0, height: 0 });
      setIsDragging(true);
    }
  }, [sprites, onSpritesChange, getSpriteAtPoint, getHandleAtPoint, zoom]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      if (dragHandle && dragSprite) {
        // Handle transform
        const newSprites = sprites.map(sprite => {
          if (sprite.id === dragSprite) {
            const newTransform = { ...sprite.transform };
            
            switch (dragHandle.type) {
              case 'move':
                newTransform.x = sprite.transform.x + deltaX;
                newTransform.y = sprite.transform.y + deltaY;
                break;
              case 'scale-se':
                const scaleFactorX = Math.max(0.1, (sprite.bounds.width * sprite.transform.scaleX + deltaX) / sprite.bounds.width);
                const scaleFactorY = Math.max(0.1, (sprite.bounds.height * sprite.transform.scaleY + deltaY) / sprite.bounds.height);
                newTransform.scaleX = scaleFactorX;
                newTransform.scaleY = scaleFactorY;
                break;
              case 'rotate':
                const centerX = sprite.transform.x + sprite.bounds.width * sprite.transform.scaleX / 2;
                const centerY = sprite.transform.y + sprite.bounds.height * sprite.transform.scaleY / 2;
                const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
                newTransform.rotation = angle;
                break;
            }
            
            return { ...sprite, transform: newTransform };
          }
          return sprite;
        });
        onSpritesChange(newSprites);
      } else if (dragSprite) {
        // Move selected sprites
        const newSprites = sprites.map(sprite => {
          if (sprite.selected) {
            return {
              ...sprite,
              transform: {
                ...sprite.transform,
                x: sprite.transform.x + deltaX,
                y: sprite.transform.y + deltaY
              }
            };
          }
          return sprite;
        });
        onSpritesChange(newSprites);
        setDragStart({ x, y });
      } else if (selectionBox) {
        // Update selection box
        setSelectionBox({
          x: Math.min(dragStart.x, x),
          y: Math.min(dragStart.y, y),
          width: Math.abs(x - dragStart.x),
          height: Math.abs(y - dragStart.y)
        });
      }
    } else {
      // Update hover state
      const sprite = getSpriteAtPoint(x, y);
      setHoveredSprite(sprite?.id || null);
      
      // Update cursor
      if (canvas) {
        let cursor = 'default';
        
        if (sprite) {
          const selectedSprites = sprites.filter(s => s.selected);
          for (const selectedSprite of selectedSprites) {
            const handle = getHandleAtPoint(x, y, selectedSprite);
            if (handle) {
              cursor = handle.cursor;
              break;
            }
          }
          
          if (cursor === 'default') {
            cursor = 'move';
          }
        }
        
        canvas.style.cursor = cursor;
      }
    }
  }, [isDragging, dragStart, dragHandle, dragSprite, selectionBox, sprites, onSpritesChange, getSpriteAtPoint, getHandleAtPoint, zoom]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (selectionBox) {
      // Select sprites in selection box
      const newSprites = sprites.map(sprite => {
        const spriteInBox = (
          sprite.transform.x < selectionBox.x + selectionBox.width &&
          sprite.transform.x + sprite.bounds.width * sprite.transform.scaleX > selectionBox.x &&
          sprite.transform.y < selectionBox.y + selectionBox.height &&
          sprite.transform.y + sprite.bounds.height * sprite.transform.scaleY > selectionBox.y
        );
        
        return { ...sprite, selected: spriteInBox };
      });
      onSpritesChange(newSprites);
      setSelectionBox(null);
    }

    setIsDragging(false);
    setDragSprite(null);
    setDragHandle(null);
  }, [selectionBox, sprites, onSpritesChange]);

  // Update selection change callback
  useEffect(() => {
    const selectedIds = sprites.filter(s => s.selected).map(s => s.id);
    onSelectionChange(selectedIds);
  }, [sprites, onSelectionChange]);

  // Render loop
  useEffect(() => {
    render();
  }, [render]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    setIsLoaded(true);
  }, [canvasSize]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* Canvas Controls */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            padding: '6px 8px',
            background: showGrid ? '#3b82f6' : '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
          title="Toggle grid"
        >
          📐
        </button>
        
        <select
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{
            padding: '4px 6px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        >
          <option value={0.5}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1}>100%</option>
          <option value={1.25}>125%</option>
          <option value={1.5}>150%</option>
          <option value={2}>200%</option>
        </select>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />

      {/* Canvas Info */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace'
      }}>
        {sprites.filter(s => s.selected).length} selected • {sprites.length} total • {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default InteractiveCanvas;