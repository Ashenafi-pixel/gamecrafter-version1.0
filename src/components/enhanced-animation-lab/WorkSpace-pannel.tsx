import React ,{useState,useRef, useCallback,useEffect } from 'react';
import { simpleAnimationEngine, type SpriteAnimation } from '../../utils/simpleAnimationEngine';
import { professionalSpriteAtlas, type SpriteElement } from '../../utils/professionalSpriteAtlas';
import { CanvasErrorBoundary } from '../visual-journey/steps-working/Step5_EnhancedAnimationLab';
interface SymbolConfig {
  id: string;
  name: string;
  symbolType: 'block' | 'contour';
  contentType: 'symbol-only' | 'symbol-wild' | 'symbol-scatter' | 'symbol-bonus' | 'symbol-free' | 'symbol-jackpot' | 'text-only';
  size: '1x1' | '1x3' | '2x2' | '3x3' | '4x4';
  prompt: string;
  animationComplexity: 'simple' | 'medium' | 'complex';
  imageUrl?: string;
  spriteElements?: SpriteElement[];
  animations?: SpriteAnimation[];
  atlasResult?: any;
  individualizedLetters?: any[];
  layoutTemplate?: 'text-top' | 'text-bottom' | 'text-overlay';
  animationTemplate?: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave';
  retryCount?: number; // Track retry attempts for missing letters
  visionAnalysis?: any; // Store GPT Vision results
  isVisionProcessed?: boolean; // Flag for GPT Vision processing
  isUniversalProcessed?: boolean; // Flag for universal detection
  letterSprites?: any[]; // Store individual letter sprites
  lastRefresh?: number; // Force dependency refresh
  // New preset system properties
  gameSymbolType?: 'wild' | 'wild 2' | 'scatter' | 'high 1' | 'high 2' | 'high 3' | 'high 4' | 'medium 1' | 'medium 2' | 'medium 3' | 'medium 4' | 'low 1' | 'low 2' | 'low 3' | 'low 4';
  importance?: number; // 1-5 scale
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  defaultDescription?: string;
}

const drawProfessionalOutlineSelection = (
  ctx: CanvasRenderingContext2D, 
  sprite: {x: number, y: number, width: number, height: number, src: string, id: string},
  imageCache: React.MutableRefObject<Map<string, HTMLImageElement>>
) => {
  console.log('🎯 Drawing professional outline for:', sprite.id);
  
  try {
    // Get the sprite image for outline creation
    const img = imageCache.current.get(sprite.src);
    
    if (img) {
      // METHOD 1: True sprite outline using compositing
      console.log('✨ Creating true sprite outline');
      
      ctx.save();
      
      // Create multiple offset copies to form outline
      const outlineWidth = 8;
      const outlineColor = '#e60012';
      
      // Draw outline copies in all directions
      const offsets = [
        [-outlineWidth, -outlineWidth], [0, -outlineWidth], [outlineWidth, -outlineWidth],
        [-outlineWidth, 0], [outlineWidth, 0],
        [-outlineWidth, outlineWidth], [0, outlineWidth], [outlineWidth, outlineWidth]
      ];
      
      // Set composite mode to draw outline behind original
      ctx.globalCompositeOperation = 'destination-over';
      
      // Draw outline by placing copies with blue tint
      offsets.forEach(([dx, dy]) => {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.filter = `hue-rotate(200deg) saturate(200%) brightness(0.8)`;
        ctx.drawImage(
          img,
          sprite.x + dx,
          sprite.y + dy,
          sprite.width,
          sprite.height
        );
        ctx.restore();
      });
      
      // Reset composite mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      
    } else {
      // METHOD 2: Enhanced rectangular outline fallback
      console.log('🔄 Using enhanced rectangular outline');
      
      ctx.save();
      const outlineWidth = 10;
      const x = sprite.x - outlineWidth;
      const y = sprite.y - outlineWidth;
      const w = sprite.width + (outlineWidth * 2);
      const h = sprite.height + (outlineWidth * 2);
      const radius = 12;
      
      // Create smooth rounded rectangle path
      const path = new Path2D();
      path.moveTo(x + radius, y);
      path.lineTo(x + w - radius, y);
      path.quadraticCurveTo(x + w, y, x + w, y + radius);
      path.lineTo(x + w, y + h - radius);
      path.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      path.lineTo(x + radius, y + h);
      path.quadraticCurveTo(x, y + h, x, y + h - radius);
      path.lineTo(x, y + radius);
      path.quadraticCurveTo(x, y, x + radius, y);
      path.closePath();
      
      // Draw multi-layer outline for depth
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 12;
      ctx.globalAlpha = 0.3;
      ctx.stroke(path);
      
      ctx.strokeStyle = '#e60012';
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.8;
      ctx.stroke(path);
      
      ctx.strokeStyle = '#dbeafe';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.stroke(path);
      
      ctx.restore();
    }
    
    // Draw modern resize handles
    ctx.save();
    const handleSize = 10;
    const halfHandle = handleSize / 2;
    
    // 8 handles: corners + edges
    const handles = [
      { x: sprite.x, y: sprite.y },
      { x: sprite.x + sprite.width, y: sprite.y },
      { x: sprite.x, y: sprite.y + sprite.height },
      { x: sprite.x + sprite.width, y: sprite.y + sprite.height },
      { x: sprite.x + sprite.width/2, y: sprite.y },
      { x: sprite.x + sprite.width/2, y: sprite.y + sprite.height },
      { x: sprite.x, y: sprite.y + sprite.height/2 },
      { x: sprite.x + sprite.width, y: sprite.y + sprite.height/2 }
    ];
    
    handles.forEach(handle => {
      // Handle shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(handle.x - halfHandle + 1, handle.y - halfHandle + 1, handleSize, handleSize);
      
      // Handle background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
      
      // Handle border
      ctx.strokeStyle = '#e60012';
      ctx.lineWidth = 2;
      ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
    });
    
    ctx.restore();
    
    console.log('✅ Professional outline completed for:', sprite.id);
    
  } catch (error) {
    console.error('Outline creation failed:', error);
  }
};

const drawProfessionalSelectionHandles = (
  ctx: CanvasRenderingContext2D, 
  sprite: {x: number, y: number, width: number, height: number, id: string}
) => {
  const handleSize = 8;
  const halfHandle = handleSize / 2;
  
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#e60012';
  ctx.lineWidth = 1;
  ctx.strokeRect(sprite.x - 1, sprite.y - 1, sprite.width + 2, sprite.height + 2);
  ctx.restore();
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e60012';
  ctx.lineWidth = 1;
  
  const left = sprite.x;
  const right = sprite.x + sprite.width;
  const top = sprite.y;
  const bottom = sprite.y + sprite.height;
  const centerX = sprite.x + sprite.width / 2;
  const centerY = sprite.y + sprite.height / 2;
  
  const handles = [
    { x: left, y: top }, { x: right, y: top },
    { x: left, y: bottom }, { x: right, y: bottom },
    { x: centerX, y: top }, { x: centerX, y: bottom },
    { x: left, y: centerY }, { x: right, y: centerY }
  ];
  
  handles.forEach(handle => {
    ctx.fillRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
    ctx.strokeRect(handle.x - halfHandle, handle.y - halfHandle, handleSize, handleSize);
  });
};

export const WorkspacePanel: React.FC<{
  selectedSymbol: SymbolConfig | null;
  onSymbolUpdate: (symbolId: string, updates: Partial<SymbolConfig>) => void;
  onImageUpload: (file: File) => void;
  sprites: Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: 'letter' | 'element'}>;
  setSprites: React.Dispatch<React.SetStateAction<Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: 'letter' | 'element'}>>>;
  onCanvasReady: (ready: boolean) => void;
  selectedLayerId: string | null;
  layerVisibility: Record<string, boolean>;
  layerLocks: Record<string, boolean>;
  onLayerSelect: (layerId: string) => void;
  isPlaying: boolean;
}> = ({ selectedSymbol, onSymbolUpdate, onImageUpload, sprites, setSprites, onCanvasReady, selectedLayerId, layerVisibility, layerLocks, onLayerSelect, isPlaying }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [draggedSprite, setDraggedSprite] = useState<{id: string, offsetX: number, offsetY: number, action: 'move' | 'scale', corner?: string} | null>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  const [cursorState, setCursorState] = useState<'default' | 'move' | 'scale-nw' | 'scale-ne' | 'scale-sw' | 'scale-se' | 'scale-n' | 'scale-s' | 'scale-e' | 'scale-w'>('default');

  // Canvas ref callback - stable reference to avoid re-initialization
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    console.log('🔧 Canvas ref callback triggered:', { hasCanvas: !!canvas });
    
    if (canvas) {
      console.log('🎨 Setting up canvas...');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Failed to get 2D context');
        return;
      }

      // Set canvas size with high-DPI support
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = 300;
      const displayHeight = 200;
      
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      // Scale context for high-DPI displays
      ctx.scale(dpr, dpr);

      console.log('✅ Canvas initialized successfully:', canvas.width, 'x', canvas.height);
      setCanvasContext(ctx);
      setIsCanvasReady(true);
      onCanvasReady(true); // Notify parent component
      console.log('🚀 Canvas ready state set to true - workspace should load!');
    } else {
      console.log('🧹 Canvas removed, cleaning up...');
      setIsCanvasReady(false);
      setCanvasContext(null);
      onCanvasReady(false); // Notify parent component
    }
  }, [onCanvasReady]); // Remove isCanvasReady dependency to prevent re-creation


  // Helper function to detect corner interactions
  const detectCornerInteraction = useCallback((sprite: any, x: number, y: number) => {
    const cornerSize = 25; // Even larger corner detection area
    
    // Define corners in order of priority (check from outside to inside)
    const cornersToCheck = [
      { name: 'top-left', x: sprite.x, y: sprite.y },
      { name: 'top-right', x: sprite.x + sprite.width, y: sprite.y },
      { name: 'bottom-left', x: sprite.x, y: sprite.y + sprite.height },
      { name: 'bottom-right', x: sprite.x + sprite.width, y: sprite.y + sprite.height }
    ];

    console.log('🔍 CORNER DETECTION DEBUG:');
    console.log('📍 Click position:', { x, y });
    console.log('📦 Sprite bounds:', { x: sprite.x, y: sprite.y, width: sprite.width, height: sprite.height });
    console.log('🎯 Corner positions:', cornersToCheck);

    // Check each corner
    for (const corner of cornersToCheck) {
      const isInRange = x >= corner.x - cornerSize && x <= corner.x + cornerSize &&
                        y >= corner.y - cornerSize && y <= corner.y + cornerSize;
      
      console.log(`🔍 ${corner.name}:`, {
        cornerPos: { x: corner.x, y: corner.y },
        clickPos: { x, y },
        xRange: `${corner.x - cornerSize} to ${corner.x + cornerSize}`,
        yRange: `${corner.y - cornerSize} to ${corner.y + cornerSize}`,
        xInRange: x >= corner.x - cornerSize && x <= corner.x + cornerSize,
        yInRange: y >= corner.y - cornerSize && y <= corner.y + cornerSize,
        RESULT: isInRange ? '✅ DETECTED' : 'NOT IN RANGE'
      });

      if (isInRange) {
        console.log('🎉 CORNER DETECTED:', corner.name);
        return corner.name;
      }
    }
    
    console.log('NO CORNER DETECTED - will default to move mode');
    return null;
  }, []);

  // Image cache for performance and proper loading
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const pendingRender = useRef<number | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Preload images utility
  const preloadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (imageCache.current.has(src)) {
        resolve(imageCache.current.get(src)!);
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${src.substring(0, 50)}`));
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }, []);

  // Render canvas with proper async image handling
  useEffect(() => {
    if (!canvasContext || !isCanvasReady) {
      console.log('⏸️ Canvas rendering skipped - no context or not ready');
      return;
    }
    
    console.log('🎨 Rendering canvas with', sprites.length, 'sprites');
    const canvas = canvasContext.canvas;
    const ctx = canvasContext;

    // Cancel any pending render
    if (pendingRender.current) {
      cancelAnimationFrame(pendingRender.current);
    }

    // Async rendering function
    const renderSprites = async () => {
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Show loading state
        const spritesWithImages = sprites.filter(sprite => sprite.src);
        if (spritesWithImages.length > 0) {
          setIsLoadingImages(true);
        }

        // Preload all images first
        const imagePromises = spritesWithImages
          .map(sprite => preloadImage(sprite.src).catch(err => {
            console.warn(`⚠️ Image preload failed for ${sprite.id}:`, err.message);
            return null;
          }));

        const loadedImages = await Promise.all(imagePromises);
        setIsLoadingImages(false);
        console.log(`✅ Preloaded ${loadedImages.filter(img => img).length}/${imagePromises.length} images`);

        // Draw subtle background grid first (use display dimensions)
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        const gridSize = 20;
        const displayWidth = 300;
        const displayHeight = 200;
        
        for (let x = 0; x <= displayWidth; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, displayHeight);
          ctx.stroke();
        }
        for (let y = 0; y <= displayHeight; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(displayWidth, y);
          ctx.stroke();
        }

        // Now render all sprites synchronously with preloaded images
        sprites.forEach((sprite, index) => {
          const isSelected = selectedLayerId === sprite.id;
          
          // Draw sprite border
          ctx.strokeStyle = isSelected ? '#e60012' : '#d1d5db';
          ctx.lineWidth = isSelected ? 3 : 1;
          ctx.strokeRect(sprite.x, sprite.y, sprite.width, sprite.height);
          
          // Draw semi-transparent background
          ctx.fillStyle = sprite.type === 'letter' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)';
          ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
          
          // Try to draw the actual sprite image
          const cachedImage = imageCache.current.get(sprite.src);
          if (cachedImage && sprite.src) {
            try {
              // Draw the preloaded image
              ctx.drawImage(cachedImage, sprite.x + 2, sprite.y + 2, sprite.width - 4, sprite.height - 4);
              console.log(`✅ Rendered ${sprite.type} sprite ${sprite.id} from cache`);
            } catch (error) {
              console.warn(`⚠️ Failed to draw cached image for ${sprite.id}:`, error);
              drawFallback();
            }
          } else {
            drawFallback();
          }

          function drawFallback() {
            // Draw fallback placeholder
            ctx.fillStyle = 'white';
            ctx.fillRect(sprite.x + 2, sprite.y + 2, sprite.width - 4, sprite.height - 4);
            ctx.fillStyle = '#374151';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
              sprite.type === 'letter' ? sprite.id.split('_')[1] || '?' : '🎨',
              sprite.x + sprite.width/2, 
              sprite.y + sprite.height/2 + 6
            );
          }
          
        });

        // SEPARATE PASS: Draw selection outlines ON TOP of all sprites
        sprites.forEach(sprite => {
          const isSelected = selectedLayerId === sprite.id;
          if (isSelected) {
            console.log('🚨 DRAWING OUTLINE ON TOP FOR:', sprite.id);
            
            // CRITICAL: Check if sprite has required properties
            if (sprite.src && sprite.id) {
              drawProfessionalOutlineSelection(ctx, sprite, imageCache);
            } else {
              console.error('SPRITE MISSING REQUIRED PROPERTIES:', {
                hasSrc: !!sprite.src,
                hasId: !!sprite.id,
                sprite
              });
              // Fallback to old selection if sprite is malformed
              drawProfessionalSelectionHandles(ctx, sprite);
            }
          }
        });

        console.log(`🎨 Canvas render complete: ${sprites.length} sprites displayed`);
        
      } catch (error) {
        console.error('Canvas rendering error:', error);
        // Draw error state (use display dimensions)
        const displayWidth = 300;
        const displayHeight = 200;
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.fillStyle = '#e60012';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Rendering Error', displayWidth/2, displayHeight/2);
      }
    };

    // Start async rendering (this replaces all the old synchronous rendering)
    renderSprites();
    
  }, [canvasContext, isCanvasReady, sprites, selectedLayerId, layerVisibility, preloadImage]);

  // Cleanup function for image cache and pending operations
  useEffect(() => {
    return () => {
      // Cancel any pending render
      if (pendingRender.current) {
        cancelAnimationFrame(pendingRender.current);
      }
      // Clear GSAP animations for this component only
      const spriteSelectors = sprites.map(sprite => `#${sprite.id}`).join(',');
      if (spriteSelectors) {
        gsap.killTweensOf(spriteSelectors);
      }
      // Clear image cache to prevent memory leaks
      imageCache.current.clear();
      console.log('🧹 WorkspacePanel component cleanup complete');
    };
  }, [sprites]);

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext) return;
    
    const canvas = canvasContext.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('🖱️ Mouse down at:', x, y);

    // Check for sprite body click first (Smart Contextual takes priority)
    const clickedSprite = sprites.find(sprite => 
      x >= sprite.x && x <= sprite.x + sprite.width &&
      y >= sprite.y && y <= sprite.y + sprite.height
    );

    if (clickedSprite) {
      console.log('✅ Clicked sprite body:', clickedSprite.id, 'bounds:', {
        x: clickedSprite.x, 
        y: clickedSprite.y, 
        width: clickedSprite.width, 
        height: clickedSprite.height
      });

      // Select the layer when clicked
      onLayerSelect(clickedSprite.id);

      // Check if sprite is locked
      if (!layerLocks[clickedSprite.id]) {
        // Smart Contextual Interaction - detect intent from cursor position
        const spriteCenter = {
          x: clickedSprite.x + clickedSprite.width / 2,
          y: clickedSprite.y + clickedSprite.height / 2
        };
        
        // Define center zone (60% of sprite size for move - larger for easier interaction)
        const centerZoneWidth = clickedSprite.width * 0.6;
        const centerZoneHeight = clickedSprite.height * 0.6;
        
        const isInCenterZone = 
          Math.abs(x - spriteCenter.x) <= centerZoneWidth / 2 &&
          Math.abs(y - spriteCenter.y) <= centerZoneHeight / 2;
        
        console.log('🎯 Smart Contextual Analysis:', {
          clickPos: { x, y },
          spriteCenter,
          centerZone: { width: centerZoneWidth, height: centerZoneHeight },
          isInCenterZone,
          spriteId: clickedSprite.id
        });
        
        if (isInCenterZone) {
          // Click in center zone = MOVE mode
          setDraggedSprite({
            id: clickedSprite.id,
            offsetX: x - clickedSprite.x,
            offsetY: y - clickedSprite.y,
            action: 'move'
          });
          console.log('✋ MOVE mode activated - clicked center zone');
        } else {
          // Click on edges/corners = SCALE mode
          setDraggedSprite({
            id: clickedSprite.id,
            offsetX: x,
            offsetY: y,
            action: 'scale',
            corner: 'center' // Will be refined with proper corner detection
          });
          console.log('↗️ SCALE mode activated - clicked edge/corner');
        }
      } else {
        console.log('🔒 Layer is locked, cannot move:', clickedSprite.id);
      }
    } else {
      console.log('No sprite or corner clicked at:', x, y);
      console.log('📍 Available sprites:', sprites.map(s => ({
        id: s.id,
        bounds: { x: s.x, y: s.y, width: s.width, height: s.height }
      })));
    }
  }, [sprites, onLayerSelect, layerLocks, canvasContext]);

  // Cursor state detection function
  const detectCursorState = useCallback((x: number, y: number) => {
    if (!canvasContext) return 'default';
    
    // Find sprite under cursor
    const hoveredSprite = sprites.find(sprite => 
      x >= sprite.x && x <= sprite.x + sprite.width &&
      y >= sprite.y && y <= sprite.y + sprite.height
    );
    
    if (!hoveredSprite) return 'default';
    
    const spriteCenter = {
      x: hoveredSprite.x + hoveredSprite.width / 2,
      y: hoveredSprite.y + hoveredSprite.height / 2
    };
    
    // Define center zone (60% of sprite size)
    const centerZoneWidth = hoveredSprite.width * 0.6;
    const centerZoneHeight = hoveredSprite.height * 0.6;
    
    const isInCenterZone = 
      Math.abs(x - spriteCenter.x) <= centerZoneWidth / 2 &&
      Math.abs(y - spriteCenter.y) <= centerZoneHeight / 2;
    
    if (isInCenterZone) {
      return 'move';
    }
    
    // Precise handle detection (8px handles)
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    const tolerance = 4; // Extra pixels for easier clicking
    
    const left = hoveredSprite.x;
    const right = hoveredSprite.x + hoveredSprite.width;
    const top = hoveredSprite.y;
    const bottom = hoveredSprite.y + hoveredSprite.height;
    const centerX = hoveredSprite.x + hoveredSprite.width / 2;
    const centerY = hoveredSprite.y + hoveredSprite.height / 2;
    
    // Check handle positions with tolerance
    const isNearHandle = (handleX: number, handleY: number) => 
      Math.abs(x - handleX) <= halfHandle + tolerance && 
      Math.abs(y - handleY) <= halfHandle + tolerance;
    
    // Corner handles (priority)
    if (isNearHandle(left, top)) return 'scale-nw';
    if (isNearHandle(right, top)) return 'scale-ne';
    if (isNearHandle(left, bottom)) return 'scale-sw';
    if (isNearHandle(right, bottom)) return 'scale-se';
    
    // Edge handles
    if (isNearHandle(centerX, top)) return 'scale-n';
    if (isNearHandle(centerX, bottom)) return 'scale-s';
    if (isNearHandle(left, centerY)) return 'scale-w';
    if (isNearHandle(right, centerY)) return 'scale-e';
    
    // If not on a handle but outside center zone, default to corner resize
    return 'scale-nw';
  }, [sprites, canvasContext]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext) return;
    
    const canvas = canvasContext.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update cursor state when not dragging
    if (!draggedSprite) {
      const newCursorState = detectCursorState(x, y);
      setCursorState(newCursorState);
      return;
    }

    if (draggedSprite.action === 'move') {
      // Move sprite with workspace boundary constraints
      const canvas = canvasContext.canvas;
      const workspaceWidth = canvas.width;
      const workspaceHeight = canvas.height;
      
      console.log('🚀 MOVE ACTION DETECTED:', {
        draggedSpriteId: draggedSprite.id,
        mousePos: { x, y },
        offset: { x: draggedSprite.offsetX, y: draggedSprite.offsetY }
      });
      
      setSprites(prev => prev.map(sprite => {
        if (sprite.id !== draggedSprite.id) return sprite;
        
        // Calculate new position
        let newX = x - draggedSprite.offsetX;
        let newY = y - draggedSprite.offsetY;
        
        // Apply workspace boundaries - keep sprite fully inside workspace
        newX = Math.max(0, Math.min(newX, workspaceWidth - sprite.width));
        newY = Math.max(0, Math.min(newY, workspaceHeight - sprite.height));
        
        console.log(`🔒 Moving sprite ${sprite.id}:`, {
          currentPos: { x: sprite.x, y: sprite.y },
          mousePos: { x, y },
          offset: { x: draggedSprite.offsetX, y: draggedSprite.offsetY },
          newPos: { x: newX, y: newY },
          workspace: { width: workspaceWidth, height: workspaceHeight }
        });
        
        return { ...sprite, x: newX, y: newY };
      }));
    } else if (draggedSprite.action === 'scale') {
      // Scale sprite from corner with PROPORTIONAL SCALING (maintain aspect ratio)
      setSprites(prev => prev.map(sprite => {
        if (sprite.id !== draggedSprite.id) return sprite;

        let newSprite = { ...sprite };
        
        // Calculate original aspect ratio
        const originalAspectRatio = sprite.width / sprite.height;
        
        // Calculate scale factor based on mouse distance from anchor
        let scaleFactor = 1;
        let anchorX, anchorY;
        
        console.log('🔧 SCALING DEBUG - Corner:', draggedSprite.corner, 'Mouse:', { x, y });
        
        // Simplified scaling logic - let's test if ALL corners can reach this point
        if (draggedSprite.corner === 'top-right') {
          // TR - Working case
          anchorX = sprite.x;
          anchorY = sprite.y + sprite.height;
          console.log('📍 TR: Anchor at bottom-left:', { anchorX, anchorY });
        } else if (draggedSprite.corner === 'bottom-right') {
          // BR - Test case  
          anchorX = sprite.x;
          anchorY = sprite.y;
          console.log('📍 BR: Anchor at top-left:', { anchorX, anchorY });
        } else if (draggedSprite.corner === 'bottom-left') {
          // BL - Test case
          anchorX = sprite.x + sprite.width;
          anchorY = sprite.y;
          console.log('📍 BL: Anchor at top-right:', { anchorX, anchorY });
        } else if (draggedSprite.corner === 'top-left') {
          // TL - Test case
          anchorX = sprite.x + sprite.width;
          anchorY = sprite.y + sprite.height;
          console.log('📍 TL: Anchor at bottom-right:', { anchorX, anchorY });
        } else if (draggedSprite.corner === 'center') {
          // Center scaling - scale from sprite center
          anchorX = sprite.x + sprite.width / 2;
          anchorY = sprite.y + sprite.height / 2;
          console.log('📍 CENTER: Scale from center:', { anchorX, anchorY });
        } else {
          console.log('UNKNOWN CORNER:', draggedSprite.corner);
          return sprite; // Don't modify if unknown corner
        }
        
        // Calculate distance and scale for all corners the same way
        const distanceX = Math.abs(x - anchorX);
        const distanceY = Math.abs(y - anchorY);
        const distance = Math.max(distanceX, distanceY);
        scaleFactor = Math.max(0.2, distance / Math.max(sprite.width, sprite.height));
        
        // Apply scaling with workspace boundaries
        const canvas = canvasContext.canvas;
        const workspaceWidth = canvas.width;
        const workspaceHeight = canvas.height;
        
        newSprite.width = Math.max(20, sprite.width * scaleFactor);
        newSprite.height = Math.max(20, sprite.height * scaleFactor);
        
        // Position adjustment based on corner
        if (draggedSprite.corner === 'top-right') {
          newSprite.y = anchorY - newSprite.height;
        } else if (draggedSprite.corner === 'bottom-right') {
          // Position stays the same (top-left anchor)
        } else if (draggedSprite.corner === 'bottom-left') {
          newSprite.x = anchorX - newSprite.width;
        } else if (draggedSprite.corner === 'top-left') {
          newSprite.x = anchorX - newSprite.width;
          newSprite.y = anchorY - newSprite.height;
        } else if (draggedSprite.corner === 'center') {
          // Center scaling - keep sprite centered on original center point
          newSprite.x = anchorX - newSprite.width / 2;
          newSprite.y = anchorY - newSprite.height / 2;
        }
        
        // Apply workspace boundary constraints after positioning
        newSprite.x = Math.max(0, Math.min(newSprite.x, workspaceWidth - newSprite.width));
        newSprite.y = Math.max(0, Math.min(newSprite.y, workspaceHeight - newSprite.height));
        
        // If sprite would exceed boundaries, limit the size instead
        if (newSprite.x + newSprite.width > workspaceWidth) {
          newSprite.width = workspaceWidth - newSprite.x;
          newSprite.height = newSprite.width / originalAspectRatio; // Maintain aspect ratio
        }
        if (newSprite.y + newSprite.height > workspaceHeight) {
          newSprite.height = workspaceHeight - newSprite.y;
          newSprite.width = newSprite.height * originalAspectRatio; // Maintain aspect ratio
        }
        
        console.log('🔧 Proportional scaling:', draggedSprite.corner, {
          scaleFactor: scaleFactor.toFixed(2),
          aspectRatio: originalAspectRatio.toFixed(2),
          from: { x: sprite.x, y: sprite.y, w: sprite.width, h: sprite.height },
          to: { x: newSprite.x, y: newSprite.y, w: newSprite.width, h: newSprite.height },
          anchor: { x: anchorX, y: anchorY },
          mousePos: { x, y }
        });
        
        return newSprite;
      }));
    }
  }, [draggedSprite, canvasContext, setSprites, detectCursorState]);

  const handleMouseUp = useCallback(() => {
    if (draggedSprite) {
      console.log('🖱️ Stopped dragging:', draggedSprite.id);
      setDraggedSprite(null);
    }
  }, [draggedSprite]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  return (
    <div style={{
      background: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '16px',
      height: '100%'
    }}>
      <h3 style={{
        margin: 0,
        color: '#e60012',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '12px'
      }}>
        Interactive Workspace
      </h3>
      
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          height: 'calc(100% - 40px)',
          background: '#fafafa',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CanvasErrorBoundary>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          style={{
            cursor: (() => {
              if (draggedSprite) {
                return draggedSprite.action === 'move' ? 'grabbing' : 'grabbing';
              }
              
              // Map cursor states to CSS cursor values
              switch (cursorState) {
                case 'move': return 'grab';
                case 'scale-nw': return 'nw-resize';
                case 'scale-ne': return 'ne-resize';
                case 'scale-sw': return 'sw-resize';
                case 'scale-se': return 'se-resize';
                case 'scale-n': return 'n-resize';
                case 'scale-s': return 's-resize';
                case 'scale-e': return 'e-resize';
                case 'scale-w': return 'w-resize';
                default: return 'default';
              }
            })(),
            display: isCanvasReady ? 'block' : 'none',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated'
          }}
        />
        </CanvasErrorBoundary>
        
        {/* Loading overlay for image preloading */}
        {isLoadingImages && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            zIndex: 1000
          }}>
            <div style={{
              textAlign: 'center' as const,
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <div>Loading sprites...</div>
            </div>
          </div>
        )}
        
        {/* DOM Sprites for GSAP Animation Overlay - Only visible during animations */}
        {isCanvasReady && isPlaying && sprites.map(sprite => (
          <div
            key={sprite.id}
            id={sprite.id}
            style={{
              position: 'absolute',
              left: `${sprite.x}px`,
              top: `${sprite.y}px`,
              width: `${sprite.width}px`,
              height: `${sprite.height}px`,
              backgroundImage: `url(${sprite.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none', // Don't interfere with canvas interactions
              zIndex: 10, // Above canvas
              opacity: 1.0, // Full opacity during animation
              borderRadius: '2px'
            }}
          />
        ))}
        
        {!isCanvasReady && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '14px',
            position: 'absolute',
            top: 0,
            left: 0
          }}>
            Initializing workspace...
          </div>
        )}

        {!selectedSymbol && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#6b7280',
              fontSize: '14px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📁</div>
            Select a symbol to start editing
            <br />
            <small>Or drag & drop an image</small>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};