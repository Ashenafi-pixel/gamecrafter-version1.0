/**
 * Simple Preview Component
 * Live preview of animated sprites in Simple Mode
 */

import React, { useRef, useEffect, useState } from 'react';

interface SimplePreviewProps {
  atlasResult: any;
  selectedPreset: string | null;
  isAnimating: boolean;
}

const SimplePreview: React.FC<SimplePreviewProps> = ({
  atlasResult,
  selectedPreset,
  isAnimating
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (!canvasRef.current || !atlasResult) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center point for layout
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw sprites with preview animations
      atlasResult.spriteElements?.forEach((sprite: any, index: number) => {
        const frame = atlasResult.atlasMetadata.frames[sprite.name];
        if (!frame) return;

        // Calculate position in a grid layout
        const cols = Math.ceil(Math.sqrt(atlasResult.spriteElements.length));
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const spacing = 80;
        const startX = centerX - ((cols - 1) * spacing) / 2;
        const startY = centerY - ((Math.ceil(atlasResult.spriteElements.length / cols) - 1) * spacing) / 2;
        
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        // Apply scaling based on sprite type
        let scale = 0.3;
        if (sprite.type === 'letter') scale = 0.25;
        else if (sprite.type === 'character') scale = 0.2;
        else if (sprite.type === 'object') scale = 0.15;

        const width = frame.frame.w * scale;
        const height = frame.frame.h * scale;

        // Simple animation preview based on preset
        let animationOffset = 0;
        if (isPlaying && selectedPreset) {
          const time = Date.now() / (1000 / playbackSpeed);
          
          switch (selectedPreset) {
            case 'gem_slot':
              animationOffset = Math.sin(time + index * 0.5) * 3;
              break;
            case 'character_slot':
              animationOffset = Math.sin(time * 0.5 + index * 0.3) * 2;
              break;
            case 'scatter_text':
              animationOffset = Math.sin(time * 2 + index * 0.8) * 5;
              break;
            case 'wild_symbol':
              animationOffset = Math.sin(time * 1.5 + index * 0.4) * 4;
              break;
            case 'classic_fruit':
              animationOffset = Math.sin(time * 0.8 + index * 0.2) * 1.5;
              break;
            case 'bonus_special':
              animationOffset = Math.sin(time * 3 + index * 1.2) * 6;
              break;
          }
        }

        // Draw sprite with animation
        ctx.drawImage(
          img,
          frame.frame.x,
          frame.frame.y,
          frame.frame.w,
          frame.frame.h,
          x - width / 2,
          y - height / 2 + animationOffset,
          width,
          height
        );

        // Draw sprite label
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(sprite.name, x, y + height / 2 + 15);
      });

      // Request next frame if playing
      if (isPlaying) {
        requestAnimationFrame(() => {
          img.onload();
        });
      }
    };

    img.src = atlasResult.imageUrl;
  }, [atlasResult, selectedPreset, isPlaying, playbackSpeed]);

  if (!atlasResult) {
    return (
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎬</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Animation preview will appear here
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Preview header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h4 style={{
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Live Preview
        </h4>
        
        {/* Playback controls */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              background: 'white',
              fontSize: '12px'
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      {/* Canvas preview */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #e5e7eb'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}
        />
      </div>

      {/* Animation info */}
      {selectedPreset && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          <div style={{
            fontWeight: '600',
            color: '#0369a1',
            marginBottom: '4px'
          }}>
            Active Animation: {selectedPreset.replace('_', ' ').toUpperCase()}
          </div>
          <div style={{ color: '#0284c7' }}>
            {atlasResult.spriteElements?.length || 0} sprites animated • 
            Speed: {playbackSpeed}x • 
            Status: {isPlaying ? 'Playing' : 'Paused'}
          </div>
        </div>
      )}

      {/* Performance indicator */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        🚀 Optimized for 60fps slot game performance
      </div>
    </div>
  );
};

export default SimplePreview;