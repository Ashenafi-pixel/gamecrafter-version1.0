import React from "react";

export const LayerPanel: React.FC<{
  sprites: Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: 'letter' | 'element'}>;
  selectedLayerId: string | null;
  layerVisibility: Record<string, boolean>;
  layerLocks: Record<string, boolean>;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
  setSprites: React.Dispatch<React.SetStateAction<Array<{id: string, x: number, y: number, width: number, height: number, src: string, type: 'letter' | 'element'}>>>;
}> = ({ sprites, selectedLayerId, layerVisibility, layerLocks, onLayerSelect, onLayerVisibilityToggle, onLayerLockToggle, setSprites }) => {
  
  // Create layer data with proper names and icons
  const layers = sprites.map(sprite => {
    let layerName = '';
    let layerIcon = '';
    
    if (sprite.type === 'letter') {
      // Try multiple ways to get the letter name:
      // 1. Check identifiedLetter property (set by GPT Vision)
      // 2. Check displayName property  
      // 3. Extract from sprite ID (for letter-based IDs like "bulletproof_B")
      // 4. Fall back to generic numbering
      const identifiedLetter = (sprite as any).identifiedLetter;
      const displayName = (sprite as any).displayName;
      const idLetter = sprite.id.split('_').pop();
      
      if (identifiedLetter && identifiedLetter.match(/^[A-Z]$/)) {
        layerName = `Letter ${identifiedLetter}`;
      } else if (displayName) {
        layerName = displayName;
      } else if (idLetter && idLetter.match(/^[A-Z]$/)) {
        layerName = `Letter ${idLetter}`;
      } else {
        // Fallback: use sprite index for generic naming
        const letterSprites = sprites.filter(s => s.type === 'letter');
        const spriteIndex = letterSprites.findIndex(s => s.id === sprite.id);
        layerName = `Letter ${spriteIndex + 1}`;
      }
      layerIcon = '📝';
    } else {
      layerName = 'Main Symbol';
      layerIcon = '🎨';
    }
    
    return {
      id: sprite.id,
      name: layerName,
      icon: layerIcon,
      type: sprite.type,
      isVisible: layerVisibility[sprite.id] !== false, // Default to visible
      isLocked: layerLocks[sprite.id] === true // Default to unlocked
    };
  });

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#e60012'
        }}>
          🎭 Layers & Animation
        </h4>
        <div style={{
          fontSize: '11px',
          color: '#6b7280'
        }}>
          {layers.length} layers
        </div>
      </div>

      {layers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '13px',
          padding: '20px'
        }}>
          No layers available. Generate a symbol to see layers.
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => !layer.isLocked && onLayerSelect(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: selectedLayerId === layer.id ? '#fef2f2' : layer.isLocked ? 'white' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: layer.isLocked ? 'not-allowed' : 'pointer',
                opacity: layer.isLocked ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {/* Layer Icon & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '14px' }}>{layer.icon}</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: selectedLayerId === layer.id ? '600' : '500',
                  color: layer.isLocked ? '#9ca3af' : selectedLayerId === layer.id ? '#e60012' : '#374151'
                }}>
                  {layer.name}
                </span>
              </div>

              {/* Layer Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerVisibilityToggle(layer.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: layer.isVisible ? 1 : 0.4,
                    padding: '2px'
                  }}
                  title={layer.isVisible ? 'Hide layer' : 'Show layer'}
                >
                  👁️
                </button>
                
                {/* Letter Edit Button (only for letter layers) */}
                {layer.type === 'letter' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentLetter = layer.id.split('_').pop() || '';
                      const newLetter = prompt(`Edit letter for ${layer.name}:`, currentLetter);
                      if (newLetter && newLetter.length === 1 && /[A-Z]/i.test(newLetter)) {
                        const upperLetter = newLetter.toUpperCase();
                        // Update the sprite ID and reapply template
                        setSprites(prev => prev.map(sprite => {
                          if (sprite.id === layer.id) {
                            const baseName = sprite.id.split('_')[0];
                            return {
                              ...sprite,
                              id: `${baseName}_${upperLetter}`,
                              identifiedLetter: upperLetter
                            };
                          }
                          return sprite;
                        }));
                        console.log(`🏷️ ✏️ Manual edit: ${layer.id} → letter "${upperLetter}"`);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      color: '#6b7280'
                    }}
                    title="Edit letter"
                  >
                    ✏️
                  </button>
                )}

                {/* Lock Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerLockToggle(layer.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: layer.isLocked ? 1 : 0.4,
                    padding: '2px'
                  }}
                  title={layer.isLocked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.isLocked ? '🔒' : '🔓'}
                </button>

                {/* Layer Index */}
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  width: '16px',
                  textAlign: 'center'
                }}>
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};