/**
 * Professional Atlas Preview Component
 * Interactive sprite atlas preview with bounding boxes
 * Industry-standard format compatible with PIXI.js, Unity, Spine
 */

import React, { useRef, useEffect, useState } from 'react';
import type { ProfessionalAtlasResult } from '../../../utils/professionalSpriteAtlas';
import { gsap } from 'gsap';
import { pixelPerfectBoundingBox } from '../../../utils/pixelPerfectBoundingBox';
import SymbolCompositionStudio from './SymbolCompositionStudio';

interface ProfessionalAtlasPreviewProps {
  atlasResult: ProfessionalAtlasResult;
  onExport?: (format: 'texturepacker' | 'pixijs' | 'spine') => void;
  onUsePixelPerfectBounds?: () => void;
}

interface SpriteAnimationObject {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  spriteName: string;
  frameData: any;
}

const ProfessionalAtlasPreview: React.FC<ProfessionalAtlasPreviewProps> = ({ 
  atlasResult, 
  onExport,
  onUsePixelPerfectBounds
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSprite, setHoveredSprite] = useState<string | null>(null);
  const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [loadedAtlasImage, setLoadedAtlasImage] = useState<HTMLImageElement | null>(null);
  const [animationObjects, setAnimationObjects] = useState<SpriteAnimationObject[]>([]);
  const [isProcessingPixelPerfect, setIsProcessingPixelPerfect] = useState(false);
  const [showCompositionStudio, setShowCompositionStudio] = useState(false);
  const animationFrameRef = useRef<number>();
  const currentSpritesRef = useRef<SpriteAnimationObject[]>([]); // Direct reference for rendering
  
  // Draw atlas with interactive bounding boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !atlasResult.success) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw atlas image
      ctx.drawImage(img, 0, 0);
      
      // Draw bounding boxes
      drawBoundingBoxes(ctx, atlasResult, hoveredSprite, selectedSprite);
      
      // Store loaded image for animation canvas
      setLoadedAtlasImage(img);
    };
    
    img.src = atlasResult.atlasImageUrl;
  }, [atlasResult, hoveredSprite, selectedSprite]);
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      stopAnimationRenderLoop();
      if (currentSpritesRef.current.length > 0) {
        gsap.killTweensOf(currentSpritesRef.current);
      }
      currentSpritesRef.current = [];
    };
  }, []);
  
  // Draw professional bounding boxes
  const drawBoundingBoxes = (
    ctx: CanvasRenderingContext2D,
    atlas: ProfessionalAtlasResult,
    hovered: string | null,
    selected: string | null
  ) => {
    for (const [spriteName, frameData] of Object.entries(atlas.atlasMetadata.frames)) {
      const frame = frameData.frame;
      
      // Determine box color based on state
      let strokeColor = '#00ff00'; // Default green
      let fillColor = 'rgba(0, 255, 0, 0.1)';
      let lineWidth = 2;
      
      if (selected === spriteName) {
        strokeColor = '#ff0000'; // Red for selected
        fillColor = 'rgba(255, 0, 0, 0.2)';
        lineWidth = 3;
      } else if (hovered === spriteName) {
        strokeColor = '#ffff00'; // Yellow for hovered
        fillColor = 'rgba(255, 255, 0, 0.15)';
        lineWidth = 2;
      }
      
      // Draw bounding box
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = lineWidth;
      
      ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);
      
      // Draw sprite label
      ctx.fillStyle = strokeColor;
      ctx.font = '12px Arial';
      ctx.fontWeight = 'bold';
      
      // Position label above or below box
      const labelY = frame.y > 20 ? frame.y - 5 : frame.y + frame.h + 15;
      ctx.fillText(spriteName, frame.x, labelY);
    }
  };
  
  // Handle canvas mouse events
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Find clicked sprite
    const clickedSprite = findSpriteAtPosition(x, y, atlasResult.atlasMetadata.frames);
    setSelectedSprite(clickedSprite);
  };
  
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Find hovered sprite
    const hoveredSprite = findSpriteAtPosition(x, y, atlasResult.atlasMetadata.frames);
    setHoveredSprite(hoveredSprite);
  };
  
  // Find sprite at mouse position
  const findSpriteAtPosition = (x: number, y: number, frames: any): string | null => {
    for (const [spriteName, frameData] of Object.entries(frames)) {
      const frame = (frameData as any).frame;
      if (x >= frame.x && x <= frame.x + frame.w && 
          y >= frame.y && y <= frame.y + frame.h) {
        return spriteName;
      }
    }
    return null;
  };
  
  // Export atlas in different formats
  const handleExport = async (format: 'texturepacker' | 'pixijs' | 'spine') => {
    try {
      const { professionalSpriteAtlas } = await import('../../../utils/professionalSpriteAtlas');
      const exportData = await professionalSpriteAtlas.exportAtlas(atlasResult, format);
      
      // Create download
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atlas.${format === 'spine' ? 'atlas' : 'json'}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Also download atlas image
      const imageLink = document.createElement('a');
      imageLink.href = atlasResult.atlasImageUrl;
      imageLink.download = 'atlas.png';
      imageLink.style.display = 'none';
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      
      if (onExport) onExport(format);
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  // Apply pixel-perfect bounding box detection
  const applyPixelPerfectBounds = async () => {
    if (!atlasResult.atlasImageUrl) return;
    
    setIsProcessingPixelPerfect(true);
    
    try {
      console.log('🎯 Applying pixel-perfect bounding box detection...');
      
      const pixelAnalysis = await pixelPerfectBoundingBox.analyzeSpriteBoundaries(
        atlasResult.atlasImageUrl,
        {
          alphaThreshold: 50,
          minSpriteSize: 100,
          maxSprites: 15,
          mergeDistance: 3
        }
      );
      
      if (pixelAnalysis.success) {
        console.log(`✅ Pixel-perfect analysis complete: ${pixelAnalysis.totalSprites} sprites detected`);
        
        // Trigger parent component to update with pixel-perfect bounds
        if (onUsePixelPerfectBounds) {
          onUsePixelPerfectBounds();
        }
      } else {
        console.error('Pixel-perfect analysis failed:', pixelAnalysis.error);
      }
      
    } catch (error) {
      console.error('Pixel-perfect detection failed:', error);
    } finally {
      setIsProcessingPixelPerfect(false);
    }
  };
  
  // Create and start animation render loop
  const startAnimationRenderLoop = () => {
    console.log('🎬 startAnimationRenderLoop called');
    
    const renderFrame = () => {
      if (animationCanvasRef.current && currentSpritesRef.current.length > 0) {
        drawAnimationFrame();
      } else {
        // Always draw at least the debug canvas
        if (animationCanvasRef.current) {
          drawAnimationFrame();
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    console.log('🎬 Animation frame requested:', animationFrameRef.current);
  };

  // Stop animation render loop
  const stopAnimationRenderLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  };

  // Improved animation function for bouncy wave text
  const playBouncyWaveAnimation = () => {
    if (!loadedAtlasImage || !animationCanvasRef.current) {
      console.error('Animation requirements not met:', {
        atlasImage: !!loadedAtlasImage,
        canvas: !!animationCanvasRef.current
      });
      return;
    }
    
    console.log('🎬 Starting Bouncy Wave animation...');
    setIsAnimating(true);
    setCurrentAnimation('Bouncy Wave Text');
    
    const canvas = animationCanvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
    
    console.log('🎯 Canvas configured:', {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight
    });
    
    // Get letter sprites and create animation objects
    // Handle duplicate letters properly (e.g., SCATTER has two T's: t and t_2)
    const letterSprites = Object.entries(atlasResult.atlasMetadata.frames).filter(([name]) => {
      const lowerName = name.toLowerCase();
      return (
        name.length === 1 || 
        ['s', 'c', 'a', 't', 'e', 'r', 'w', 'i', 'l', 'd'].includes(lowerName) ||
        // Handle duplicate letters like t_2, t_3, etc.
        /^[a-z]_\d+$/i.test(name) ||
        lowerName.includes('letter') ||
        /^[a-z]$/i.test(name) // Single letter regex
      );
    });
    
    console.log(`🎬 Found ${letterSprites.length} letter sprites for animation:`, letterSprites.map(([name]) => name));
    console.log(`🎯 Animation canvas dimensions: ${canvas.width}x${canvas.height}`);
    console.log(`🖼️ Atlas image loaded:`, !!loadedAtlasImage);
    
    if (letterSprites.length === 0) {
      console.warn('⚠️ No letter sprites found for animation!');
      return;
    }
    
    // Create sprite animation objects
    const sprites: SpriteAnimationObject[] = letterSprites.map(([spriteName, frameData], index) => ({
      x: 30 + (index * 50),
      y: canvas.height / 2 + 80, // Start below
      rotation: -20,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      spriteName,
      frameData: frameData.frame
    }));
    
    console.log(`🎭 Created ${sprites.length} animation objects:`, sprites.map(s => s.spriteName));
    console.log(`🎯 First sprite frame data:`, sprites[0]?.frameData);
    
    // Set objects first, then start render loop
    setAnimationObjects(sprites);
    currentSpritesRef.current = sprites; // Set direct reference for immediate rendering
    
    console.log(`🎬 Starting animation render loop with ${sprites.length} sprites...`);
    startAnimationRenderLoop();
    
    console.log(`🎭 Animation state before starting:`, { isAnimating, currentAnimation });
    
    // Animate each sprite object (not DOM elements)
    sprites.forEach((spriteObj, index) => {
      // Entrance animation
      gsap.fromTo(spriteObj, {
        y: canvas.height / 2 + 80,
        rotation: -20,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0
      }, {
        y: canvas.height / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 0.8,
        delay: index * 0.1,
        ease: "back.out(1.7)"
      });
      
      // Continuous bounce
      gsap.to(spriteObj, {
        y: canvas.height / 2 - 20,
        duration: 0.6,
        delay: (index * 0.1) + 0.8,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    });
    
    setTimeout(() => {
      setIsAnimating(false);
      gsap.killTweensOf(sprites);
      stopAnimationRenderLoop();
      setAnimationObjects([]);
      currentSpritesRef.current = []; // Clear direct reference too
    }, 5000);
  };
  
  const playBoneMovementAnimation = () => {
    if (!loadedAtlasImage || !animationCanvasRef.current) return;
    
    setIsAnimating(true);
    setCurrentAnimation('Bone Movement');
    
    const canvas = animationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 600;
    canvas.height = 400;
    
    // Get bone and dog sprites
    const frames = atlasResult.atlasMetadata?.frames || {};
    const boneSprite = Object.entries(frames).find(([name]) => 
      name.includes('bone') || name.includes('paw')
    );
    const dogSprite = Object.entries(frames).find(([name]) => 
      name.includes('dog') || name.includes('character')
    );
    
    if (boneSprite && dogSprite) {
      // Animate bone flying to dog
      gsap.fromTo('.bone-sprite', {
        x: canvas.width + 100,
        y: 50,
        rotation: 0
      }, {
        x: canvas.width / 2,
        y: canvas.height / 2,
        rotation: 720,
        duration: 2,
        ease: "power2.out",
        onUpdate: () => {
          drawBoneAnimation(ctx, boneSprite, dogSprite, canvas);
        }
      });
    }
    
    setTimeout(() => setIsAnimating(false), 3000);
  };
  
  const playSymbolComposition = () => {
    if (!loadedAtlasImage || !animationCanvasRef.current) return;
    
    setIsAnimating(true);
    setCurrentAnimation('Symbol Composition');
    
    const canvas = animationCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 600;
    canvas.height = 400;
    
    // Get all sprites
    const allSprites = Object.entries(atlasResult.atlasMetadata?.frames || {});
    
    // Create a complete symbol composition animation
    allSprites.forEach(([spriteName, frameData], index) => {
      const delay = index * 0.15;
      
      gsap.fromTo(`#sprite-${index}`, {
        scale: 0,
        rotation: 180,
        alpha: 0
      }, {
        scale: 1,
        rotation: 0,
        alpha: 1,
        duration: 1,
        delay: delay,
        ease: "back.out(1.7)",
        onUpdate: () => {
          drawCompositionFrame(ctx, allSprites, canvas);
        }
      });
    });
    
    setTimeout(() => setIsAnimating(false), 4000);
  };
  
  // Main animation render function
  const drawAnimationFrame = () => {
    const canvas = animationCanvasRef.current;
    if (!canvas || !loadedAtlasImage) {
      console.log('🚫 drawAnimationFrame: missing canvas or atlas image', { 
        canvas: !!canvas, 
        image: !!loadedAtlasImage 
      });
      return;
    }
    
    console.log('🎨 drawAnimationFrame called - rendering sprites...', {
      canvasSize: `${canvas.width}x${canvas.height}`,
      spriteCount: currentSpritesRef.current.length
    });
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('drawAnimationFrame: could not get canvas context');
      return;
    }
    
    // Enable smooth high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clear canvas with dark background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add debugging border to ensure canvas is rendering
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Draw debug info
    ctx.fillStyle = '#888888';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Objects: ${currentSpritesRef.current.length}`, 10, 20);
    ctx.fillText(`Atlas: ${loadedAtlasImage ? 'Loaded' : 'Missing'}`, 10, 35);
    
    // Draw each animated sprite
    currentSpritesRef.current.forEach((spriteObj, index) => {
      try {
        ctx.save();
        
        // Apply transforms
        ctx.globalAlpha = spriteObj.alpha;
        ctx.translate(spriteObj.x, spriteObj.y);
        ctx.rotate(spriteObj.rotation * Math.PI / 180);
        ctx.scale(spriteObj.scaleX, spriteObj.scaleY);
        
        // Draw sprite from atlas
        const frame = spriteObj.frameData;
        if (frame && frame.x !== undefined && frame.y !== undefined) {
          ctx.drawImage(
            loadedAtlasImage,
            frame.x, frame.y, frame.w, frame.h,
            -frame.w / 2, -frame.h / 2, frame.w, frame.h
          );
        } else {
          console.warn(`Invalid frame data for sprite ${index}:`, frame);
        }
        
        ctx.restore();
      } catch (error) {
        console.error(`Error drawing sprite ${index}:`, error);
      }
    });
  };
  
  const drawBoneAnimation = (ctx: CanvasRenderingContext2D, boneSprite: any, dogSprite: any, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw dog
    if (loadedAtlasImage && dogSprite) {
      const dogFrame = dogSprite[1].frame;
      ctx.drawImage(
        loadedAtlasImage,
        dogFrame.x, dogFrame.y, dogFrame.w, dogFrame.h,
        canvas.width / 2 - 100, canvas.height / 2, dogFrame.w, dogFrame.h
      );
    }
    
    // Draw bone (animated position handled by GSAP)
    if (loadedAtlasImage && boneSprite) {
      const boneFrame = boneSprite[1].frame;
      ctx.drawImage(
        loadedAtlasImage,
        boneFrame.x, boneFrame.y, boneFrame.w, boneFrame.h,
        canvas.width + 100, 50, boneFrame.w, boneFrame.h
      );
    }
  };
  
  const drawCompositionFrame = (ctx: CanvasRenderingContext2D, sprites: any[], canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all sprites in composition
    sprites.forEach(([spriteName, frameData], index) => {
      if (loadedAtlasImage) {
        const frame = frameData.frame;
        const x = (canvas.width / 2) + (index % 3 - 1) * 150;
        const y = (canvas.height / 2) + Math.floor(index / 3) * 100;
        
        ctx.drawImage(
          loadedAtlasImage,
          frame.x, frame.y, frame.w, frame.h,
          x - frame.w/2, y - frame.h/2, frame.w, frame.h
        );
      }
    });
  };
  
  if (!atlasResult.success) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        Atlas creation failed: {atlasResult.error}
      </div>
    );
  }
  
  const spriteCount = Object.keys(atlasResult.atlasMetadata?.frames || {}).length;
  const atlasSize = atlasResult.atlasMetadata?.meta?.size || { w: 512, h: 512 };
  
  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            🏭 Professional Sprite Atlas & Animation Studio
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
            {spriteCount} sprites • {atlasSize.w}×{atlasSize.h}px • Industry Standard Format
          </p>
        </div>
        
        {/* Export Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCompositionStudio(!showCompositionStudio)}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: showCompositionStudio ? '#059669' : '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Open Symbol Composition Studio"
          >
            🎭 <span>{showCompositionStudio ? 'Hide Studio' : 'Composition Studio'}</span>
          </button>
          
          <button
            onClick={applyPixelPerfectBounds}
            disabled={isProcessingPixelPerfect}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: isProcessingPixelPerfect ? '#9ca3af' : '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: isProcessingPixelPerfect ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Apply pixel-perfect bounding box detection"
          >
            {isProcessingPixelPerfect ? '⏳' : '🎯'}
            <span>Fix Bounds</span>
          </button>
          
          <button
            onClick={() => handleExport('texturepacker')}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Export as TexturePacker JSON (Universal)"
          >
            📦 TexturePacker
          </button>
          
          <button
            onClick={() => handleExport('pixijs')}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Export as PixiJS Spritesheet"
          >
            🎮 PixiJS
          </button>
          
          <button
            onClick={() => handleExport('spine')}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Export as Spine Atlas"
          >
            🦴 Spine
          </button>
        </div>
      </div>
      
      {/* Two-Column Layout: Atlas + Animation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
        
        {/* Left Column: Interactive Atlas Canvas */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            📋 Sprite Atlas
          </h4>
          <div style={{ 
            border: '2px solid #d1d5db', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: '#f9fafb',
            position: 'relative'
          }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredSprite(null)}
              style={{
                maxWidth: '100%',
                height: 'auto',
                cursor: 'crosshair',
                display: 'block'
              }}
            />
            
            {/* Sprite Info Overlay */}
            {(hoveredSprite || selectedSprite) && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {hoveredSprite || selectedSprite}
                {selectedSprite && (
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    Click to inspect • ESC to deselect
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Animation Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              🎬 Animation Preview
            </h4>
            {currentAnimation && (
              <span style={{ 
                fontSize: '12px', 
                color: '#059669', 
                fontWeight: '600',
                backgroundColor: '#d1fae5',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {currentAnimation}
              </span>
            )}
          </div>
          
          <div style={{ 
            border: '2px solid #d1d5db', 
            borderRadius: '8px', 
            overflow: 'hidden',
            backgroundColor: '#1a1a1a',
            position: 'relative',
            minHeight: '300px'
          }}>
            <canvas
              ref={animationCanvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                imageRendering: 'auto'
              }}
            />
            
            {!isAnimating && !currentAnimation && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#9ca3af',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎭</div>
                <div>Select an animation below to preview</div>
              </div>
            )}
          </div>
          
          {/* Animation Control Buttons */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={playBouncyWaveAnimation}
              disabled={isAnimating}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: isAnimating ? '#9ca3af' : '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🌊</span>
              <span>Bouncy Wave Text</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>(SCATTER animation)</span>
            </button>
            
            <button
              onClick={playBoneMovementAnimation}
              disabled={isAnimating}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: isAnimating ? '#9ca3af' : '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🦴</span>
              <span>Bone Movement</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>(Flying bone to dog)</span>
            </button>
            
            <button
              onClick={playSymbolComposition}
              disabled={isAnimating}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: isAnimating ? '#9ca3af' : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🎯</span>
              <span>Symbol Composition</span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>(Complete symbol assembly)</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Sprite List */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
          Sprite Definitions ({spriteCount})
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px'
        }}>
          {Object.entries(atlasResult.atlasMetadata.frames).map(([name, frame]) => (
            <div
              key={name}
              style={{
                padding: '8px',
                backgroundColor: selectedSprite === name ? '#dbeafe' : '#ffffff',
                border: `1px solid ${selectedSprite === name ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseEnter={() => setHoveredSprite(name)}
              onMouseLeave={() => setHoveredSprite(null)}
              onClick={() => setSelectedSprite(selectedSprite === name ? null : name)}
            >
              <div style={{ fontWeight: '600', color: '#1f2937' }}>{name}</div>
              <div style={{ color: '#6b7280', fontSize: '10px' }}>
                {frame.frame.w}×{frame.frame.h}px at ({frame.frame.x},{frame.frame.y})
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Usage Instructions */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '6px',
        border: '1px solid #0ea5e9'
      }}>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
          💡 Professional Usage
        </h5>
        <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '12px', color: '#0369a1' }}>
          <li>Load atlas.png + atlas.json in PIXI.js, Unity, or Spine</li>
          <li>Use bounding box coordinates for sprite rendering</li>
          <li>Animations can reference sprite names from metadata</li>
          <li>Single texture load = optimal GPU performance</li>
        </ul>
      </div>

      {/* Symbol Composition Studio */}
      {showCompositionStudio && (
        <div style={{ marginTop: '24px' }}>
          <SymbolCompositionStudio 
            atlasResult={atlasResult}
            onSaveComposition={(composition) => {
              console.log('💾 Composition saved:', composition);
              // Could integrate with parent component's save functionality
            }}
            onExportAnimation={(composition) => {
              console.log('🎬 Animation exported:', composition);
              // Could integrate with animation export functionality
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProfessionalAtlasPreview;