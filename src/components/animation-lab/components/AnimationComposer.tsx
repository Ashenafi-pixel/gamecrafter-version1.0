import React, { useState, useRef, useEffect, useCallback } from 'react';

interface KeptSprite {
  name: string;
  imageUrl: string;
  element: any;
  keptAt: number;
}

interface SpriteAnimation {
  scale: number;
  rotation: number;
  opacity: number;
  x: number;
  y: number;
  bounceY: number;
  glowIntensity: number;
}

interface AnimationComposerProps {
  keptSprites: KeptSprite[];
  onClose: () => void;
  visionPositioning?: {
    canvasSize: { width: number; height: number };
    spritePositions: Array<{
      name: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      scale: number;
      zIndex: number;
    }>;
  };
}

export const AnimationComposer: React.FC<AnimationComposerProps> = ({
  keptSprites,
  onClose,
  visionPositioning
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Animation presets library
  const animationPresets = {
    bouncy_letters: {
      name: '🎈 Bouncy Letters',
      description: 'Letters bounce in sequence with elastic effect',
      preview: '⬆️⬇️⬆️⬇️',
      apply: () => {
        setAnimationTime(0);
        console.log('🎈 Applied Bouncy Letters preset');
      }
    },
    sword_combat: {
      name: '⚔️ Sword Combat',
      description: 'Aggressive sword swinging with screen shake',
      preview: '↗️↙️⚡',
      apply: () => {
        setSpriteAnimations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (key.includes('sword')) {
              updated[key] = { ...updated[key], scale: 1.2 };
            }
          });
          return updated;
        });
        setAnimationTime(0);
        console.log('⚔️ Applied Sword Combat preset');
      }
    },
    magical_glow: {
      name: '✨ Magical Aura',
      description: 'Mystical glowing and floating effect',
      preview: '🌟💫✨',
      apply: () => {
        setSpriteAnimations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (key.includes('glow') || key.includes('magical')) {
              updated[key] = { ...updated[key], glowIntensity: 1.0 };
            }
          });
          return updated;
        });
        setAnimationTime(0);
        console.log('✨ Applied Magical Aura preset');
      }
    },
    epic_entrance: {
      name: '🎭 Epic Entrance',
      description: 'Grand entrance with scale and rotation',
      preview: '📈🔄💥',
      apply: () => {
        setSpriteAnimations(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = { 
              ...updated[key], 
              scale: 0.1, // Start small
              opacity: 0 // Start invisible
            };
          });
          return updated;
        });
        setAnimationTime(0);
        console.log('🎭 Applied Epic Entrance preset');
      }
    },
    idle_breathing: {
      name: '😴 Idle Breathing',
      description: 'Subtle breathing and floating animation',
      preview: '🔄😌💨',
      apply: () => {
        setAnimationTime(0);
        console.log('😴 Applied Idle Breathing preset');
      }
    }
  };
  
  // Animation states for each sprite
  const [spriteAnimations, setSpriteAnimations] = useState<Record<string, SpriteAnimation>>(() => {
    const initial: Record<string, SpriteAnimation> = {};
    keptSprites.forEach(sprite => {
      initial[sprite.name] = {
        scale: 1,
        rotation: 0,
        opacity: 1,
        x: 250, // Center of canvas
        y: 250,
        bounceY: 0,
        glowIntensity: 0
      };
    });
    return initial;
  });

  // Load sprite images
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Load all sprite images
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      
      for (const sprite of keptSprites) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = sprite.imageUrl;
        });
        images[sprite.name] = img;
      }
      
      setLoadedImages(images);
      console.log(`🎨 Loaded ${Object.keys(images).length} sprite images for animation`);
    };

    loadImages();
  }, [keptSprites]);

  // Auto-position sprites using vision positioning or fallback to type-based positioning
  useEffect(() => {
    if (Object.keys(loadedImages).length === keptSprites.length) {
      setSpriteAnimations(prev => {
        const updated = { ...prev };
        
        keptSprites.forEach(sprite => {
          // First try to use vision positioning if available
          if (visionPositioning) {
            const visionPos = visionPositioning.spritePositions.find(
              pos => pos.name === sprite.name || pos.name === sprite.name.replace('letter_', '').toLowerCase()
            );
            
            if (visionPos) {
              console.log(`🎯 Using vision positioning for ${sprite.name}:`, visionPos);
              updated[sprite.name] = {
                ...updated[sprite.name],
                x: visionPos.position.x,
                y: visionPos.position.y,
                scale: Math.max(visionPos.scale, 0.5) // Ensure minimum scale
              };
              return;
            }
          }
          
          // Fallback to smart positioning based on sprite type
          if (sprite.name.includes('letter')) {
            // Position letters in a row
            const letterIndex = ['W', 'I', 'L', 'D'].indexOf(sprite.name.replace('letter_', ''));
            if (letterIndex !== -1) {
              updated[sprite.name] = {
                ...updated[sprite.name],
                x: 150 + (letterIndex * 80), // Spread letters across
                y: 350 // Bottom of canvas
              };
            }
          } else if (sprite.name.includes('sword')) {
            updated[sprite.name] = {
              ...updated[sprite.name],
              x: 200,
              y: 150 // Upper area
            };
          } else if (sprite.name.includes('stone')) {
            updated[sprite.name] = {
              ...updated[sprite.name],
              x: 250,
              y: 280 // Lower center
            };
          } else if (sprite.name.includes('glow') || sprite.name.includes('magical')) {
            updated[sprite.name] = {
              ...updated[sprite.name],
              x: 250,
              y: 200, // Behind other elements
              glowIntensity: 0.5
            };
          }
        });
        
        return updated;
      });
    }
  }, [loadedImages, keptSprites, visionPositioning]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isPlaying) return;
    
    setAnimationTime(prev => prev + 0.016); // ~60fps
    
    setSpriteAnimations(prev => {
      const updated = { ...prev };
      
      keptSprites.forEach(sprite => {
        const anim = updated[sprite.name];
        
        // Apply preset-specific animations
        if (selectedPreset === 'bouncy_letters' && sprite.name.includes('letter')) {
          const letterIndex = ['W', 'I', 'L', 'D'].indexOf(sprite.name.replace('letter_', ''));
          const delay = letterIndex * 0.3; // Longer stagger
          const bounceTime = Math.max(0, animationTime - delay);
          anim.bounceY = Math.sin(bounceTime * 6) * 30 * Math.exp(-bounceTime * 1.5);
          anim.scale = 1 + Math.sin(bounceTime * 8) * 0.3 * Math.exp(-bounceTime * 1.2);
        } else if (selectedPreset === 'sword_combat' && sprite.name.includes('sword')) {
          anim.rotation = Math.sin(animationTime * 6) * 45; // Aggressive swing
          anim.scale = 1.2 + Math.sin(animationTime * 8) * 0.2; // Combat scale
        } else if (selectedPreset === 'magical_glow') {
          anim.glowIntensity = 0.8 + Math.sin(animationTime * 4) * 0.4; // Strong glow
          anim.bounceY = Math.sin(animationTime * 2) * 10; // Float effect
          anim.scale = 1 + Math.sin(animationTime * 3) * 0.2;
        } else if (selectedPreset === 'epic_entrance') {
          // Epic entrance: scale up and fade in
          const progress = Math.min(animationTime / 2, 1); // 2 second entrance
          anim.scale = 0.1 + progress * 1.4; // Scale from 0.1 to 1.5
          anim.opacity = progress; // Fade from 0 to 1
          anim.rotation = (1 - progress) * 360; // Spin while entering
        } else if (selectedPreset === 'idle_breathing') {
          // Gentle breathing
          anim.scale = 1 + Math.sin(animationTime * 1.5) * 0.05;
          anim.bounceY = Math.sin(animationTime * 2) * 3;
        } else {
          // Default/custom animations
          if (sprite.name.includes('letter')) {
            const letterIndex = ['W', 'I', 'L', 'D'].indexOf(sprite.name.replace('letter_', ''));
            const delay = letterIndex * 0.2; // Stagger letters
            const bounceTime = Math.max(0, animationTime - delay);
            anim.bounceY = Math.sin(bounceTime * 8) * 20 * Math.exp(-bounceTime * 2);
            anim.scale = 1 + Math.sin(bounceTime * 6) * 0.2 * Math.exp(-bounceTime * 1.5);
          }
          
          if (sprite.name.includes('sword')) {
            anim.rotation = Math.sin(animationTime * 2) * 15; // Gentle swing
          }
          
          if (sprite.name.includes('stone')) {
            anim.scale = 1 + Math.sin(animationTime * 4) * 0.1; // Gentle pulse
          }
          
          if (sprite.name.includes('glow') || sprite.name.includes('magical')) {
            anim.glowIntensity = 0.3 + Math.sin(animationTime * 3) * 0.3; // Pulsing glow
            anim.scale = 1 + Math.sin(animationTime * 2.5) * 0.15;
          }
        }
      });
      
      return updated;
    });
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, animationTime, keptSprites, selectedPreset]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Render animation to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw sprites in order (background to foreground)
    const sortedSprites = [...keptSprites].sort((a, b) => {
      // Draw magical effects first (background)
      if (a.name.includes('glow')) return -1;
      if (b.name.includes('glow')) return 1;
      // Then stone
      if (a.name.includes('stone')) return -1;
      if (b.name.includes('stone')) return 1;
      // Then sword
      if (a.name.includes('sword')) return -1;
      if (b.name.includes('sword')) return 1;
      // Letters last (foreground)
      return 0;
    });
    
    sortedSprites.forEach(sprite => {
      const img = loadedImages[sprite.name];
      const anim = spriteAnimations[sprite.name];
      
      if (!img || !anim) return;
      
      ctx.save();
      
      // Apply glow effect
      if (anim.glowIntensity > 0) {
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = anim.glowIntensity * 30;
      }
      
      // Move to sprite position
      ctx.translate(anim.x, anim.y + anim.bounceY);
      
      // Apply transformations
      ctx.scale(anim.scale, anim.scale);
      ctx.rotate((anim.rotation * Math.PI) / 180);
      ctx.globalAlpha = anim.opacity;
      
      // Draw sprite centered
      const drawWidth = 80;
      const drawHeight = 80;
      ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
      
      // Draw selection indicator
      if (selectedSprite === sprite.name) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-drawWidth/2 - 5, -drawHeight/2 - 5, drawWidth + 10, drawHeight + 10);
      }
      
      ctx.restore();
    });
    
  }, [loadedImages, spriteAnimations, selectedSprite, keptSprites]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked sprite
    let clickedSprite: string | null = null;
    for (const sprite of keptSprites) {
      const anim = spriteAnimations[sprite.name];
      if (!anim) continue;
      
      const spriteX = anim.x;
      const spriteY = anim.y + anim.bounceY;
      const size = 80 * anim.scale;
      
      if (Math.abs(x - spriteX) < size/2 && Math.abs(y - spriteY) < size/2) {
        clickedSprite = sprite.name;
        break;
      }
    }
    
    setSelectedSprite(clickedSprite);
    if (clickedSprite) {
      console.log(`🎯 Selected sprite: ${clickedSprite}`);
    }
  };

  // Export animation as WebP with JSON metadata
  const exportAnimation = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not available for export');
      return;
    }

    try {
      console.log('📦 Starting animation export...');
      
      // Capture current frame as WebP
      const webpBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/webp', 0.9);
      });

      // Create animation metadata
      const animationData = {
        timestamp: Date.now(),
        preset: selectedPreset,
        canvasSize: { width: canvas.width, height: canvas.height },
        sprites: keptSprites.map(sprite => ({
          name: sprite.name,
          animation: spriteAnimations[sprite.name] || {},
          originalElement: sprite.element
        })),
        visionPositioning: visionPositioning || null,
        exportSettings: {
          format: 'webp',
          quality: 0.9,
          animationTime: animationTime,
          isPlaying: isPlaying
        }
      };

      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `slotai-animation-${selectedPreset}-${timestamp}`;

      // Download WebP image
      const webpUrl = URL.createObjectURL(webpBlob);
      const webpLink = document.createElement('a');
      webpLink.href = webpUrl;
      webpLink.download = `${filename}.webp`;
      webpLink.style.display = 'none';
      document.body.appendChild(webpLink);
      webpLink.click();
      document.body.removeChild(webpLink);
      URL.revokeObjectURL(webpUrl);

      // Download JSON metadata
      const jsonBlob = new Blob([JSON.stringify(animationData, null, 2)], { 
        type: 'application/json' 
      });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `${filename}.json`;
      jsonLink.style.display = 'none';
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      console.log(`✅ Animation exported successfully: ${filename}.webp + ${filename}.json`);
      
      // Show success feedback
      const originalText = 'Export WebP';
      const button = document.querySelector('button:contains("📦 Export WebP")') as HTMLButtonElement;
      if (button) {
        button.textContent = '✅ Exported!';
        setTimeout(() => {
          button.textContent = '📦 Export WebP';
        }, 2000);
      }

    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [spriteAnimations, keptSprites, selectedPreset, visionPositioning, animationTime, isPlaying]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>
            🎭 Animation Composer {visionPositioning ? '🎯' : ''}
          </h2>
          {visionPositioning && (
            <div style={{
              fontSize: '12px',
              color: '#00ff00',
              marginTop: '4px'
            }}>
              ✨ Vision-Powered Auto-Positioning Active
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Animation Canvas */}
          <div style={{ flex: 1 }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={400}
              onClick={handleCanvasClick}
              style={{
                border: '2px solid #555',
                borderRadius: '8px',
                cursor: 'crosshair',
                backgroundColor: '#1a1a1a'
              }}
            />
            
            {/* Playback Controls */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (!isPlaying) {
                    setAnimationTime(0); // Reset animation
                  }
                }}
                style={{
                  backgroundColor: isPlaying ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {isPlaying ? '⏹️ Stop' : '▶️ Play'}
              </button>
              
              <button
                onClick={() => {
                  setAnimationTime(0);
                  setSpriteAnimations(prev => {
                    const reset = { ...prev };
                    Object.keys(reset).forEach(key => {
                      reset[key] = { ...reset[key], bounceY: 0 };
                    });
                    return reset;
                  });
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reset
              </button>
              
              <div style={{ color: '#ccc', fontSize: '14px' }}>
                Time: {animationTime.toFixed(1)}s
              </div>
              
              <button
                onClick={exportAnimation}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: '12px'
                }}
              >
                📦 Export WebP
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div style={{
            width: '300px',
            backgroundColor: '#333',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>
              🎛️ Animation Controls
            </h3>

            {/* Animation Presets */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '14px' }}>
                🎭 Animation Presets
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {Object.entries(animationPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPreset(key);
                      preset.apply();
                      if (!isPlaying) {
                        setIsPlaying(true);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '11px',
                      backgroundColor: selectedPreset === key ? '#007bff' : '#495057',
                      color: 'white',
                      border: selectedPreset === key ? '2px solid #0056b3' : '1px solid #6c757d',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    title={preset.description}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                      <div style={{ fontSize: '9px', opacity: 0.8 }}>{preset.description}</div>
                    </div>
                    <div style={{ fontSize: '16px' }}>{preset.preview}</div>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedPreset('custom')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    backgroundColor: selectedPreset === 'custom' ? '#28a745' : '#495057',
                    color: 'white',
                    border: selectedPreset === 'custom' ? '2px solid #1e7e34' : '1px solid #6c757d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>🎛️ Custom Control</div>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>Manual sprite positioning</div>
                </button>
              </div>
            </div>
            
            {selectedSprite ? (
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 12px 0' }}>
                  Selected: {selectedSprite.replace(/_/g, ' ')}
                </h4>
                
                {/* Position Controls */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Position X:</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={spriteAnimations[selectedSprite]?.x || 250}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSpriteAnimations(prev => ({
                        ...prev,
                        [selectedSprite]: { ...prev[selectedSprite], x: value }
                      }));
                    }}
                    style={{ width: '100%', margin: '4px 0' }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Position Y:</label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    value={spriteAnimations[selectedSprite]?.y || 250}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setSpriteAnimations(prev => ({
                        ...prev,
                        [selectedSprite]: { ...prev[selectedSprite], y: value }
                      }));
                    }}
                    style={{ width: '100%', margin: '4px 0' }}
                  />
                </div>
                
                {/* Scale Control */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Scale:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={spriteAnimations[selectedSprite]?.scale || 1}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setSpriteAnimations(prev => ({
                        ...prev,
                        [selectedSprite]: { ...prev[selectedSprite], scale: value }
                      }));
                    }}
                    style={{ width: '100%', margin: '4px 0' }}
                  />
                </div>
                
                {/* Opacity Control */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#ccc', fontSize: '12px' }}>Opacity:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={spriteAnimations[selectedSprite]?.opacity || 1}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setSpriteAnimations(prev => ({
                        ...prev,
                        [selectedSprite]: { ...prev[selectedSprite], opacity: value }
                      }));
                    }}
                    style={{ width: '100%', margin: '4px 0' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                Click on a sprite in the canvas to select and control it
              </div>
            )}
            
            {/* Sprite List */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 12px 0' }}>
                Sprites ({keptSprites.length})
              </h4>
              {keptSprites.map(sprite => (
                <div
                  key={sprite.name}
                  onClick={() => setSelectedSprite(sprite.name)}
                  style={{
                    padding: '8px',
                    margin: '4px 0',
                    backgroundColor: selectedSprite === sprite.name ? '#555' : '#444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                >
                  {sprite.name.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationComposer;