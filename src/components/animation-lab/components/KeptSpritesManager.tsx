/**
 * Kept Sprites Manager Component
 * Sprite collection and management workflow from V1.0
 */

import React, { useState, useCallback } from 'react';
import { textIndividualizationEngine } from '../../../utils/textIndividualization';

interface KeptSprite {
  id: string;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: {
    type?: string;
    keptAt: number;
    originalPrompt?: string;
    style?: string;
    isIndividualized?: boolean;
    letterData?: any;
  };
  element?: any;
}

interface KeptSpritesManagerProps {
  keptSprites: KeptSprite[];
  onKeptSpritesChange: (sprites: KeptSprite[]) => void;
  onSpriteSelected: (sprite: KeptSprite) => void;
  onOpenAnimationComposer: (sprites: KeptSprite[]) => void;
}

const KeptSpritesManager: React.FC<KeptSpritesManagerProps> = ({
  keptSprites,
  onKeptSpritesChange,
  onSpriteSelected,
  onOpenAnimationComposer
}) => {
  const [selectedSprites, setSelectedSprites] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'type'>('newest');

  // Add sprite to kept collection
  const addKeptSprite = useCallback((spriteElement: any, imageUrl: string, originalImageUrl: string) => {
    const newSprite: KeptSprite = {
      id: `kept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: spriteElement.name || `Sprite_${keptSprites.length + 1}`,
      imageUrl,
      originalImageUrl,
      bounds: spriteElement.bounds || { x: 0, y: 0, width: 100, height: 100 },
      metadata: {
        type: spriteElement.type,
        keptAt: Date.now(),
        originalPrompt: spriteElement.originalPrompt,
        style: spriteElement.style
      },
      element: spriteElement
    };

    const updatedSprites = [...keptSprites, newSprite];
    onKeptSpritesChange(updatedSprites);
    
    console.log('✅ Sprite kept:', newSprite.name);
  }, [keptSprites, onKeptSpritesChange]);

  // Remove sprite from collection
  const removeKeptSprite = useCallback((spriteId: string) => {
    const updatedSprites = keptSprites.filter(sprite => sprite.id !== spriteId);
    onKeptSpritesChange(updatedSprites);
    
    // Remove from selection if selected
    const newSelected = new Set(selectedSprites);
    newSelected.delete(spriteId);
    setSelectedSprites(newSelected);
    
    console.log('🗑️ Sprite removed from kept collection');
  }, [keptSprites, selectedSprites, onKeptSpritesChange]);

  // Regenerate sprite with new parameters
  const regenerateSprite = useCallback(async (sprite: KeptSprite) => {
    if (!sprite.metadata.originalPrompt) {
      alert('Cannot regenerate - no original prompt available');
      return;
    }

    setIsProcessing(prev => new Set(prev).add(sprite.id));

    try {
      // This would call the AI generation system with the original prompt
      console.log('🔄 Regenerating sprite:', sprite.name);
      console.log('Original prompt:', sprite.metadata.originalPrompt);
      
      // Simulate regeneration delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update sprite with new version
      const updatedSprites = keptSprites.map(s => 
        s.id === sprite.id 
          ? { ...s, metadata: { ...s.metadata, keptAt: Date.now() } }
          : s
      );
      
      onKeptSpritesChange(updatedSprites);
      console.log('✅ Sprite regenerated successfully');
      
    } catch (error) {
      console.error('❌ Sprite regeneration failed:', error);
      alert('Failed to regenerate sprite');
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(sprite.id);
        return newSet;
      });
    }
  }, [keptSprites, onKeptSpritesChange]);

  // Individualize text in sprite
  const individualizeSprite = useCallback(async (sprite: KeptSprite) => {
    if (sprite.metadata.isIndividualized) {
      alert('Sprite is already individualized');
      return;
    }

    setIsProcessing(prev => new Set(prev).add(sprite.id));

    try {
      console.log('📝 Individualizing text in sprite:', sprite.name);
      
      const result = await textIndividualizationEngine.individualizeText(
        sprite.imageUrl,
        {
          minLetterWidth: 10,
          minLetterHeight: 15,
          maxGapSize: 50,
          mergeThreshold: 5,
          expectedText: sprite.name.includes('SCATTER') ? 'SCATTER' : undefined
        }
      );

      // Generate individual letter sprites
      const letterSprites = await textIndividualizationEngine.generateLetterSprites(
        sprite.imageUrl,
        result.letters
      );

      // Update sprite with individualization data
      const updatedSprites = keptSprites.map(s => 
        s.id === sprite.id 
          ? { 
              ...s, 
              metadata: { 
                ...s.metadata, 
                isIndividualized: true,
                letterData: {
                  analysisResult: result,
                  letterSprites,
                  totalLetters: result.letters.length
                }
              }
            }
          : s
      );
      
      onKeptSpritesChange(updatedSprites);
      console.log('✅ Text individualization completed:', result);
      
    } catch (error) {
      console.error('❌ Text individualization failed:', error);
      alert('Failed to individualize text');
    } finally {
      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(sprite.id);
        return newSet;
      });
    }
  }, [keptSprites, onKeptSpritesChange]);

  // Toggle sprite selection
  const toggleSpriteSelection = useCallback((spriteId: string) => {
    const newSelected = new Set(selectedSprites);
    if (newSelected.has(spriteId)) {
      newSelected.delete(spriteId);
    } else {
      newSelected.add(spriteId);
    }
    setSelectedSprites(newSelected);
  }, [selectedSprites]);

  // Select all sprites
  const selectAllSprites = useCallback(() => {
    setSelectedSprites(new Set(keptSprites.map(s => s.id)));
  }, [keptSprites]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSprites(new Set());
  }, []);

  // Sort sprites
  const sortedSprites = [...keptSprites].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.metadata.keptAt - a.metadata.keptAt;
      case 'oldest':
        return a.metadata.keptAt - b.metadata.keptAt;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return (a.metadata.type || '').localeCompare(b.metadata.type || '');
      default:
        return 0;
    }
  });

  if (keptSprites.length === 0) {
    return (
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '40px 20px',
        textAlign: 'center',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          No Kept Sprites
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
          Keep sprites from your analysis to build custom animations
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: '#f8fafc',
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            📦 Kept Sprites Collection
          </h3>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {keptSprites.length} sprite{keptSprites.length !== 1 ? 's' : ''} • {selectedSprites.size} selected
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔲
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                background: viewMode === 'list' ? 'white' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📋
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      {keptSprites.length > 0 && (
        <div style={{
          padding: '12px 20px',
          background: '#fafafa',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAllSprites}
              style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          {selectedSprites.size > 0 && (
            <button
              onClick={() => {
                const selected = keptSprites.filter(s => selectedSprites.has(s.id));
                onOpenAnimationComposer(selected);
              }}
              style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎭 Animate Selected ({selectedSprites.size})
            </button>
          )}
        </div>
      )}

      {/* Sprites Grid/List */}
      <div style={{
        padding: '20px',
        display: viewMode === 'grid' ? 'grid' : 'block',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
        gap: viewMode === 'grid' ? '16px' : '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {sortedSprites.map((sprite) => (
          <div
            key={sprite.id}
            style={{
              border: selectedSprites.has(sprite.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: viewMode === 'list' ? 'flex' : 'block',
              alignItems: viewMode === 'list' ? 'center' : undefined,
              gap: viewMode === 'list' ? '12px' : undefined,
              padding: viewMode === 'list' ? '8px' : '0'
            }}
            onClick={() => toggleSpriteSelection(sprite.id)}
          >
            {/* Sprite Image */}
            <div style={{
              width: viewMode === 'list' ? '60px' : '100%',
              height: viewMode === 'list' ? '60px' : '120px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img
                src={sprite.imageUrl}
                alt={sprite.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
              
              {/* Processing Overlay */}
              {isProcessing.has(sprite.id) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  ⏳ Processing...
                </div>
              )}
            </div>

            {/* Sprite Info */}
            <div style={{ 
              padding: viewMode === 'list' ? '0' : '12px',
              flex: viewMode === 'list' ? 1 : undefined
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                {sprite.name}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {sprite.metadata.type || 'Object'} • {new Date(sprite.metadata.keptAt).toLocaleDateString()}
              </div>

              {/* Sprite Actions */}
              <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpriteSelected(sprite);
                  }}
                  style={{
                    padding: '4px 6px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  👁️ View
                </button>

                {sprite.metadata.originalPrompt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      regenerateSprite(sprite);
                    }}
                    disabled={isProcessing.has(sprite.id)}
                    style={{
                      padding: '4px 6px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      opacity: isProcessing.has(sprite.id) ? 0.5 : 1
                    }}
                  >
                    🔄 Regen
                  </button>
                )}

                {!sprite.metadata.isIndividualized && sprite.metadata.type === 'text' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      individualizeSprite(sprite);
                    }}
                    disabled={isProcessing.has(sprite.id)}
                    style={{
                      padding: '4px 6px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      opacity: isProcessing.has(sprite.id) ? 0.5 : 1
                    }}
                  >
                    📝 Letters
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeKeptSprite(sprite.id);
                  }}
                  style={{
                    padding: '4px 6px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    color: '#dc2626'
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Individualization Status */}
              {sprite.metadata.isIndividualized && (
                <div style={{
                  marginTop: '4px',
                  padding: '2px 6px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#059669'
                }}>
                  📝 {sprite.metadata.letterData?.totalLetters || 0} letters individualized
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeptSpritesManager;
export type { KeptSprite };