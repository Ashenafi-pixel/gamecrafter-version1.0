/**
 * Transform Controls Component
 * Professional transform controls panel for precise sprite manipulation
 */

import React, { useState, useCallback } from 'react';

interface SpriteTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
}

interface TransformControlsProps {
  selectedSprites: Array<{
    id: string;
    name: string;
    transform: SpriteTransform;
  }>;
  onTransformChange: (spriteId: string, transform: Partial<SpriteTransform>) => void;
  onTransformMultiple: (transform: Partial<SpriteTransform>) => void;
}

const TransformControls: React.FC<TransformControlsProps> = ({
  selectedSprites,
  onTransformChange,
  onTransformMultiple
}) => {
  const [activeTab, setActiveTab] = useState<'position' | 'scale' | 'rotation' | 'opacity'>('position');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Calculate average values for multi-selection
  const getAverageTransform = useCallback((): SpriteTransform | null => {
    if (selectedSprites.length === 0) return null;
    
    const sum = selectedSprites.reduce((acc, sprite) => ({
      x: acc.x + sprite.transform.x,
      y: acc.y + sprite.transform.y,
      scaleX: acc.scaleX + sprite.transform.scaleX,
      scaleY: acc.scaleY + sprite.transform.scaleY,
      rotation: acc.rotation + sprite.transform.rotation,
      alpha: acc.alpha + sprite.transform.alpha
    }), { x: 0, y: 0, scaleX: 0, scaleY: 0, rotation: 0, alpha: 0 });

    return {
      x: Math.round(sum.x / selectedSprites.length),
      y: Math.round(sum.y / selectedSprites.length),
      scaleX: Number((sum.scaleX / selectedSprites.length).toFixed(2)),
      scaleY: Number((sum.scaleY / selectedSprites.length).toFixed(2)),
      rotation: Math.round(sum.rotation / selectedSprites.length),
      alpha: Number((sum.alpha / selectedSprites.length).toFixed(2))
    };
  }, [selectedSprites]);

  const averageTransform = getAverageTransform();

  // Handle single property change
  const handlePropertyChange = useCallback((property: keyof SpriteTransform, value: number) => {
    if (selectedSprites.length === 1) {
      onTransformChange(selectedSprites[0].id, { [property]: value });
    } else if (selectedSprites.length > 1) {
      onTransformMultiple({ [property]: value });
    }
  }, [selectedSprites, onTransformChange, onTransformMultiple]);

  // Handle scale change with aspect ratio lock
  const handleScaleChange = useCallback((axis: 'X' | 'Y', value: number) => {
    if (lockAspectRatio) {
      onTransformMultiple({ scaleX: value, scaleY: value });
    } else {
      onTransformMultiple({ [`scale${axis}`]: value });
    }
  }, [lockAspectRatio, onTransformMultiple]);

  // Snap to grid
  const snapValue = useCallback((value: number, gridSize: number = 10): number => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  }, [snapToGrid]);

  // Reset transforms
  const resetTransforms = useCallback(() => {
    onTransformMultiple({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alpha: 1
    });
  }, [onTransformMultiple]);

  // Alignment functions
  const alignLeft = useCallback(() => {
    if (selectedSprites.length === 0) return;
    const minX = Math.min(...selectedSprites.map(s => s.transform.x));
    selectedSprites.forEach(sprite => {
      onTransformChange(sprite.id, { x: minX });
    });
  }, [selectedSprites, onTransformChange]);

  const alignCenter = useCallback(() => {
    if (selectedSprites.length === 0) return;
    const avgX = selectedSprites.reduce((sum, s) => sum + s.transform.x, 0) / selectedSprites.length;
    selectedSprites.forEach(sprite => {
      onTransformChange(sprite.id, { x: avgX });
    });
  }, [selectedSprites, onTransformChange]);

  const alignRight = useCallback(() => {
    if (selectedSprites.length === 0) return;
    const maxX = Math.max(...selectedSprites.map(s => s.transform.x));
    selectedSprites.forEach(sprite => {
      onTransformChange(sprite.id, { x: maxX });
    });
  }, [selectedSprites, onTransformChange]);

  const distributeHorizontally = useCallback(() => {
    if (selectedSprites.length < 3) return;
    
    const sorted = [...selectedSprites].sort((a, b) => a.transform.x - b.transform.x);
    const leftmostX = sorted[0].transform.x;
    const rightmostX = sorted[sorted.length - 1].transform.x;
    const spacing = (rightmostX - leftmostX) / (sorted.length - 1);
    
    sorted.forEach((sprite, index) => {
      if (index > 0 && index < sorted.length - 1) {
        onTransformChange(sprite.id, { x: leftmostX + spacing * index });
      }
    });
  }, [selectedSprites, onTransformChange]);

  if (selectedSprites.length === 0) {
    return (
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Select sprites to show transform controls
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: '#f8fafc',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            🎛️ Transform Controls
          </h4>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            {selectedSprites.length} sprite{selectedSprites.length > 1 ? 's' : ''} selected
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={lockAspectRatio}
              onChange={(e) => setLockAspectRatio(e.target.checked)}
            />
            Lock Aspect
          </label>
          
          <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
            Snap Grid
          </label>
          
          <button
            onClick={resetTransforms}
            style={{
              padding: '4px 8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#fafafa'
      }}>
        {(['position', 'scale', 'rotation', 'opacity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: activeTab === tab ? 'white' : 'transparent',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              fontSize: '12px',
              fontWeight: '500',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'position' && '📍'} {tab === 'scale' && '🔍'} {tab === 'rotation' && '🔄'} {tab === 'opacity' && '👁️'} {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'position' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  X Position
                </label>
                <input
                  type="number"
                  value={averageTransform?.x || 0}
                  onChange={(e) => handlePropertyChange('x', snapValue(parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Y Position
                </label>
                <input
                  type="number"
                  value={averageTransform?.y || 0}
                  onChange={(e) => handlePropertyChange('y', snapValue(parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            {/* Alignment Tools */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Alignment
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={alignLeft} style={alignButtonStyle}>⬅️</button>
                <button onClick={alignCenter} style={alignButtonStyle}>↕️</button>
                <button onClick={alignRight} style={alignButtonStyle}>➡️</button>
                <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
                <button 
                  onClick={distributeHorizontally}
                  disabled={selectedSprites.length < 3}
                  style={{
                    ...alignButtonStyle,
                    opacity: selectedSprites.length < 3 ? 0.5 : 1,
                    cursor: selectedSprites.length < 3 ? 'not-allowed' : 'pointer'
                  }}
                >
                  📏
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scale' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Scale X
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={averageTransform?.scaleX || 1}
                  onChange={(e) => handleScaleChange('X', parseFloat(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Scale Y
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={averageTransform?.scaleY || 1}
                  onChange={(e) => handleScaleChange('Y', parseFloat(e.target.value) || 1)}
                  disabled={lockAspectRatio}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    opacity: lockAspectRatio ? 0.5 : 1
                  }}
                />
              </div>
            </div>

            {/* Scale Presets */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Quick Scale
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(scale => (
                  <button
                    key={scale}
                    onClick={() => onTransformMultiple({ scaleX: scale, scaleY: scale })}
                    style={{
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rotation' && (
          <div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Rotation (degrees)
              </label>
              <input
                type="number"
                value={averageTransform?.rotation || 0}
                onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Rotation Presets */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Quick Rotate
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[-90, -45, 0, 45, 90, 180].map(angle => (
                  <button
                    key={angle}
                    onClick={() => handlePropertyChange('rotation', angle)}
                    style={{
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {angle}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opacity' && (
          <div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={averageTransform?.alpha || 1}
                onChange={(e) => handlePropertyChange('alpha', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  marginBottom: '8px'
                }}
              />
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                {Math.round((averageTransform?.alpha || 1) * 100)}%
              </div>
            </div>

            {/* Opacity Presets */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Quick Opacity
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 0.25, 0.5, 0.75, 1].map(alpha => (
                  <button
                    key={alpha}
                    onClick={() => handlePropertyChange('alpha', alpha)}
                    style={{
                      padding: '4px 8px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {Math.round(alpha * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const alignButtonStyle = {
  padding: '6px 8px',
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '12px',
  cursor: 'pointer'
};

export default TransformControls;