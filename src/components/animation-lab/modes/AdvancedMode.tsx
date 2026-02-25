/**
 * Advanced Mode - Professional Animation Interface
 * Wraps the existing complex animation lab with mode context
 */

import React, { useCallback, useRef, useState } from 'react';
import { useAnimationLab } from '../AnimationLabModeProvider';
import ProfessionalAtlasPreview from '../components/ProfessionalAtlasPreview';
import AdvancedGSAPAnimator from '../components/AdvancedGSAPAnimator';
import InteractiveCanvas from '../components/InteractiveCanvas';
import TransformControls from '../components/TransformControls';
import { professionalSpriteAtlas } from '../../../utils/professionalSpriteAtlas';

const AdvancedMode: React.FC = () => {
  const { atlasResult, setAtlasResult } = useAnimationLab();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState<'sprites' | 'canvas' | 'animation'>('sprites');
  const [sprites, setSprites] = useState<Array<{
    id: string;
    name: string;
    element: HTMLElement | null;
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    alpha: number;
  }>>([]);
  const [canvasSprites, setCanvasSprites] = useState<Array<{
    id: string;
    name: string;
    imageUrl: string;
    bounds: { x: number; y: number; width: number; height: number };
    transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number; alpha: number };
    selected: boolean;
    type?: string;
  }>>([]);
  const [selectedSpriteIds, setSelectedSpriteIds] = useState<string[]>([]);

  const processAdvancedImage = useCallback(async (file: File) => {
    try {
      console.log('🔧 Processing image in Advanced Mode:', file.name);
      
      // Create image URL
      const imageUrl = URL.createObjectURL(file);

      // Create atlas with full professional settings
      const atlasResult = await professionalSpriteAtlas.createAtlasWithPixelPerfectBounds(
        imageUrl,
        {
          alphaThreshold: 30, // More sensitive for advanced users
          minSpriteSize: 50,  // Smaller sprites allowed
          maxSprites: 25,     // More sprites allowed
          mergeDistance: 2,   // Finer control
          useGPTLabeling: true // Full AI features enabled
        }
      );

      if (atlasResult.success) {
        console.log('✅ Advanced sprite detection complete:', atlasResult);
        setAtlasResult(atlasResult);
        
        // Convert atlas result to sprite elements for animation system
        const spriteElements = atlasResult.spriteElements?.map((sprite: any, index: number) => ({
          id: `sprite_${index}`,
          name: sprite.name,
          element: null, // Will be populated when rendered
          position: { x: sprite.x || 0, y: sprite.y || 0 },
          scale: sprite.scale || 1,
          rotation: 0,
          alpha: 1
        })) || [];
        
        setSprites(spriteElements);

        // Convert to canvas sprites for interactive canvas
        const canvasSpriteElements = atlasResult.spriteElements?.map((sprite: any, index: number) => {
          const frame = atlasResult.atlasMetadata.frames[sprite.name];
          return {
            id: `sprite_${index}`,
            name: sprite.name,
            imageUrl: atlasResult.imageUrl,
            bounds: {
              x: frame?.frame.x || 0,
              y: frame?.frame.y || 0,
              width: frame?.frame.w || 100,
              height: frame?.frame.h || 100
            },
            transform: {
              x: 50 + index * 120, // Spread sprites out horizontally
              y: 50 + (index % 3) * 100, // Stack vertically in groups of 3
              scaleX: 0.5, // Start with smaller scale for better view
              scaleY: 0.5,
              rotation: 0,
              alpha: 1
            },
            selected: false,
            type: sprite.type
          };
        }) || [];
        
        setCanvasSprites(canvasSpriteElements);
      } else {
        throw new Error(atlasResult.error || 'Failed to process image');
      }

    } catch (error) {
      console.error('Advanced image processing failed:', error);
      alert('Failed to process image. Please check the image format and try again.');
    }
  }, [setAtlasResult]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    processAdvancedImage(file);
  }, [processAdvancedImage]);

  // Canvas interaction handlers
  const handleCanvasSpritesChange = useCallback((updatedSprites: typeof canvasSprites) => {
    setCanvasSprites(updatedSprites);
  }, []);

  const handleSelectionChange = useCallback((selectedIds: string[]) => {
    setSelectedSpriteIds(selectedIds);
  }, []);

  const handleTransformChange = useCallback((spriteId: string, transform: Partial<typeof canvasSprites[0]['transform']>) => {
    setCanvasSprites(prev => prev.map(sprite => 
      sprite.id === spriteId 
        ? { ...sprite, transform: { ...sprite.transform, ...transform } }
        : sprite
    ));
  }, []);

  const handleTransformMultiple = useCallback((transform: Partial<typeof canvasSprites[0]['transform']>) => {
    setCanvasSprites(prev => prev.map(sprite => 
      selectedSpriteIds.includes(sprite.id)
        ? { ...sprite, transform: { ...sprite.transform, ...transform } }
        : sprite
    ));
  }, [selectedSpriteIds]);

  return (
    <div style={{
      background: '#f8fafc',
      minHeight: 'calc(100vh - 120px)'
    }}>
      {/* Advanced mode introduction */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              🔧 Advanced Animation Studio
            </h2>
            <p style={{
              margin: '0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Professional-grade animation authoring with full manual control
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              padding: '6px 12px',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              💡 Pro Tip: Use Simple Mode for quick results
            </div>
          </div>
        </div>
      </div>

      {/* Main advanced interface */}
      <div style={{ padding: '24px' }}>
        {atlasResult ? (
          <div>
            {/* Tab Navigation */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setSelectedTab('sprites')}
                  style={{
                    padding: '16px 20px',
                    border: 'none',
                    background: selectedTab === 'sprites' ? '#f3f4f6' : 'transparent',
                    borderBottom: selectedTab === 'sprites' ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: selectedTab === 'sprites' ? '#3b82f6' : '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎯 Sprite Analysis
                </button>
                <button
                  onClick={() => setSelectedTab('canvas')}
                  style={{
                    padding: '16px 20px',
                    border: 'none',
                    background: selectedTab === 'canvas' ? '#f3f4f6' : 'transparent',
                    borderBottom: selectedTab === 'canvas' ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: selectedTab === 'canvas' ? '#3b82f6' : '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🖼️ Interactive Canvas
                </button>
                <button
                  onClick={() => setSelectedTab('animation')}
                  style={{
                    padding: '16px 20px',
                    border: 'none',
                    background: selectedTab === 'animation' ? '#f3f4f6' : 'transparent',
                    borderBottom: selectedTab === 'animation' ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: selectedTab === 'animation' ? '#3b82f6' : '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎭 GSAP Animation
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {selectedTab === 'sprites' && (
              <ProfessionalAtlasPreview 
                atlasResult={atlasResult}
                onExport={(format) => {
                  console.log(`📤 Exporting as ${format}`);
                }}
                onUsePixelPerfectBounds={() => {
                  console.log('🎯 Using pixel-perfect bounds');
                }}
              />
            )}

            {selectedTab === 'canvas' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                height: '600px'
              }}>
                {/* Interactive Canvas */}
                <div>
                  <InteractiveCanvas
                    sprites={canvasSprites}
                    onSpritesChange={handleCanvasSpritesChange}
                    onSelectionChange={handleSelectionChange}
                    canvasSize={{ width: 800, height: 600 }}
                    backgroundImage={atlasResult?.imageUrl}
                  />
                </div>

                {/* Transform Controls Panel */}
                <div>
                  <TransformControls
                    selectedSprites={canvasSprites
                      .filter(sprite => selectedSpriteIds.includes(sprite.id))
                      .map(sprite => ({
                        id: sprite.id,
                        name: sprite.name,
                        transform: {
                          x: sprite.transform.x,
                          y: sprite.transform.y,
                          scaleX: sprite.transform.scaleX,
                          scaleY: sprite.transform.scaleY,
                          rotation: sprite.transform.rotation,
                          alpha: sprite.transform.alpha
                        }
                      }))
                    }
                    onTransformChange={handleTransformChange}
                    onTransformMultiple={handleTransformMultiple}
                  />
                </div>
              </div>
            )}

            {selectedTab === 'animation' && (
              <AdvancedGSAPAnimator
                sprites={sprites}
                onAnimationUpdate={setSprites}
              />
            )}
          </div>
        ) : (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '40px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                Ready for Professional Animation
              </h3>
              <p style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}>
                Upload a sprite image to start creating professional animations with full manual control.
                Or switch to Simple Mode for AI-powered quick results.
              </p>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
              
              {/* Upload area for advanced mode */}
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '32px',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#dbeafe';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
                handleFileSelect(e.dataTransfer.files);
              }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Drag & Drop Image Here
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '12px'
                }}>
                  Or click to browse files
                </div>
                
                {/* Advanced mode features */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '12px'
                }}>
                  <span>⚡ GPT Vision AI</span>
                  <span>🎯 Pixel-Perfect Detection</span>
                  <span>🔧 Full Manual Control</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMode;