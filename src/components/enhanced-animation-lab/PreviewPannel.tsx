import React, { useEffect, useRef } from "react";
import * as PIXI from 'pixi.js';
import { SymbolConfig } from "../../types/EnhancedAnimationLabStep4";

export const PreviewPanel: React.FC<{
  selectedSymbol: SymbolConfig | null;
  isPlaying: boolean;
  onIndividualizeText: () => void;
  workspaceSprites: Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: 'letter' | 'element'}>;
  layerVisibility: Record<string, boolean>;
  selectedLayerId: string | null;
  isCanvasReady: boolean;
}> = ({ selectedSymbol, isPlaying, workspaceSprites, layerVisibility, selectedLayerId, isCanvasReady }) => {
  const pixiRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const slotContainerRef = useRef<PIXI.Container | null>(null);
  const reelSpritesRef = useRef<PIXI.Sprite[]>([]);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);

  // Initialize PIXI app for clean symbol preview
  useEffect(() => {
    if (!pixiRef.current) return;

    const app = new PIXI.Application({
      width: 300,
      height: 200,
      backgroundColor: 0x1a1a1a, // Clean dark background
      antialias: true
    });

    pixiRef.current.innerHTML = '';
    pixiRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create symbol container
    const slotContainer = new PIXI.Container();
    slotContainerRef.current = slotContainer;
    app.stage.addChild(slotContainer);

    console.log('🎨 Clean symbol preview initialized');

    return () => {
      if (animationTimeline.current) {
        animationTimeline.current.kill();
      }
      app.destroy(true);
      appRef.current = null;
      slotContainerRef.current = null;
      reelSpritesRef.current = [];
    };
  }, [selectedSymbol?.animationComplexity]);

  // Load workspace sprites into production preview (sync with Interactive Workspace)
  useEffect(() => {
    if (!appRef.current || !slotContainerRef.current) {
      return;
    }

    const slotContainer = slotContainerRef.current;
    slotContainer.removeChildren();
    reelSpritesRef.current = [];

    console.log('🔄 Production Preview syncing with workspace:', workspaceSprites.length, 'sprites');

    if (workspaceSprites.length === 0) {
      console.log('📭 No workspace sprites to display in preview');
      return;
    }

    // const containerWidth = 300;
    // const containerHeight = 200;
    
    // No scaling needed since both canvases are the same size (300x200)
    const scaleX = 1.0;
    const scaleY = 1.0;

    // Load workspace sprites into production preview (filter hidden layers)
    workspaceSprites.forEach((workspaceSprite, index) => {
      // Skip hidden layers
      if (layerVisibility[workspaceSprite.id] === false) {
        return;
      }
      
      try {
        const texture = PIXI.Texture.from(workspaceSprite.src);
        const sprite = new PIXI.Sprite(texture);
        
        // Convert workspace position to preview position
        sprite.x = workspaceSprite.x * scaleX;
        sprite.y = workspaceSprite.y * scaleY;
        sprite.width = workspaceSprite.width * scaleX;
        sprite.height = workspaceSprite.height * scaleY;
        
        console.log(`🔍 Coordinate transformation for ${workspaceSprite.id}:`);
        console.log(`   Workspace: (${workspaceSprite.x}, ${workspaceSprite.y}) ${workspaceSprite.width}x${workspaceSprite.height}`);
        console.log(`   Preview: (${sprite.x}, ${sprite.y}) ${sprite.width}x${sprite.height}`);
        console.log(`   Scale: ${scaleX}x${scaleY}`);
        
        // Add visual distinction for letter vs element sprites and selection
        if (selectedLayerId === workspaceSprite.id) {
          sprite.tint = 0xFF6B6B; // Red tint for selected layer
        } else if (workspaceSprite.type === 'letter') {
          sprite.tint = 0xFFE4B5; // Light golden tint for letters
        }
        
        slotContainer.addChild(sprite);
        reelSpritesRef.current.push(sprite);
        
        console.log(`✨ Workspace sprite ${workspaceSprite.id} synced to preview at (${sprite.x}, ${sprite.y})`);
      } catch (error) {
        console.error('Failed to load workspace sprite texture:', error);
      }
    });

    console.log('🎯 Production Preview synced with', workspaceSprites.length, 'workspace sprites');
  }, [workspaceSprites, layerVisibility, selectedLayerId]);

  // Handle animation playback
  useEffect(() => {
    if (!selectedSymbol || reelSpritesRef.current.length === 0) return;

    if (animationTimeline.current) {
      animationTimeline.current.kill();
    }

    if (isPlaying) {
      animationTimeline.current = gsap.timeline({ repeat: -1 });
      
      // Animate the single symbol
      const sprite = reelSpritesRef.current[0];
      if (sprite) {
        switch (selectedSymbol.animationComplexity) {
          case 'simple':
            animationTimeline.current.to(sprite.scale, {
              duration: 0.8,
              x: sprite.scale.x * 1.2,
              y: sprite.scale.y * 1.2,
              ease: "power2.inOut"
            }).to(sprite.scale, {
              duration: 0.8,
              x: sprite.scale.x,
              y: sprite.scale.y,
              ease: "power2.inOut"
            });
            break;
          
          case 'medium':
            animationTimeline.current.to(sprite, {
              duration: 0.6,
              rotation: Math.PI * 0.1,
              ease: "power2.inOut"
            }).to(sprite.scale, {
              duration: 0.4,
              x: sprite.scale.x * 1.15,
              y: sprite.scale.y * 1.15,
              ease: "back.out(1.7)"
            }, 0.2).to(sprite, {
              duration: 0.6,
              rotation: 0,
              ease: "power2.inOut"
            }).to(sprite.scale, {
              duration: 0.4,
              x: sprite.scale.x,
              y: sprite.scale.y,
              ease: "power2.inOut"
            });
            break;
          
          case 'complex':
            // Complex bouncing animation with color changes
            animationTimeline.current.to(sprite, {
              duration: 0.3,
              y: sprite.y - 20,
              ease: "power2.out"
            }).to(sprite.scale, {
              duration: 0.3,
              x: sprite.scale.x * 1.3,
              y: sprite.scale.y * 0.8,
              ease: "power2.out"
            }, 0).to(sprite, {
              duration: 0.4,
              y: sprite.y,
              ease: "bounce.out"
            }).to(sprite.scale, {
              duration: 0.4,
              x: sprite.scale.x,
              y: sprite.scale.y,
              ease: "back.out(1.7)"
            }, 0.3).to(sprite, {
              duration: 0.5,
              tint: 0xffd700,
              ease: "power2.inOut"
            }, 0.5).to(sprite, {
              duration: 0.5,
              tint: 0xffffff,
              ease: "power2.inOut"
            });
            break;
        }
      }

      console.log('🎬 Started', selectedSymbol.animationComplexity, 'animation preview');
    } else {
      console.log('⏸️ Animation paused');
    }
  }, [isPlaying, selectedSymbol]);

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
        Production Preview
      </h3>
      <div style={{
        width: '100%',
        height: 'calc(100% - 40px)',
        background: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {selectedSymbol ? (
          <div 
            ref={pixiRef} 
            style={{ 
              borderRadius: '8px',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: (isCanvasReady && isPlaying) ? 0.1 : 1.0,
              transition: 'opacity 0.3s ease'
            }} 
          />
        ) : (
          <div style={{
            color: '#9ca3af',
            fontSize: '14px',
            textAlign: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            Symbol Preview
            <br />
            <small>Select a symbol to see animation</small>
          </div>
        )}
        
        {/* DOM Overlay for Animations in Production Preview */}
        {isCanvasReady && isPlaying && workspaceSprites.map((sprite, index) => {
          console.log(`🎭 Rendering preview DOM element for ${sprite.id} at (${sprite.x}, ${sprite.y})`);
          return (
            <div
              key={`preview-${sprite.id}`}
              id={`preview-${sprite.id}`}
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
                pointerEvents: 'none',
                zIndex: 10,
                opacity: 1.0,
                borderRadius: '2px',
                transformOrigin: 'center center'
              }}
            />
          );
        })}
        
        {selectedSymbol && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            {selectedSymbol.animationComplexity.toUpperCase()} • {selectedSymbol.size}
          </div>
        )}
      </div>
    </div>
  );
};