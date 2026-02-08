import React, {useState,useEffect,} from "react";
import { SymbolConfig } from "../../types/EnhancedAnimationLabStep4";
import { ANIMATION_TEMPLATES } from "./Layout-Animation-Template";

export const TimelineControls: React.FC<{
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSave: () => void;
  selectedSymbol: SymbolConfig | null;
  animationFrame: number;
  onFrameSeek: (frame: number) => void;
  totalFrames?: number;
  selectedAnimationTemplate: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave';
  applyAnimationTemplate: (templateId: 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave') => void;
}> = ({ isPlaying, onPlay, onPause, onStop, onSave, selectedSymbol, animationFrame, onFrameSeek, totalFrames = 100, selectedAnimationTemplate, applyAnimationTemplate }) => {
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [localFrame, setLocalFrame] = useState(animationFrame);
  
  // Update local frame when animation frame changes (but not when dragging)
  useEffect(() => {
    if (!isDraggingScrubber) {
      setLocalFrame(animationFrame);
    }
  }, [animationFrame, isDraggingScrubber]);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrame = parseInt(e.target.value);
    setLocalFrame(newFrame);
    onFrameSeek(newFrame);
  };

  const handleScrubberMouseDown = () => {
    setIsDraggingScrubber(true);
  };

  const handleScrubberMouseUp = () => {
    setIsDraggingScrubber(false);
  };

  return (
    <div style={{
      background: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Top Row: Playback Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!selectedSymbol}
            style={{
              background: '#e60012',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: selectedSymbol ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol ? 1 : 0.5
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={onStop}
            disabled={!selectedSymbol}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: selectedSymbol ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol ? 1 : 0.5
            }}
          >
            ⏹️ Stop
          </button>
        </div>
        
        <div style={{
          flex: 1,
          height: '40px',
          background: 'white',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px'
        }}>
          <div style={{
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Animation Presets:
          </div>
          <select
            disabled={!selectedSymbol}
            value={selectedAnimationTemplate}
            style={{
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              color: '#374151',
              cursor: selectedSymbol ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol ? 1 : 0.5
            }}
            onChange={(e) => {
              if (selectedSymbol && e.target.value) {
                const templateId = e.target.value as 'bounce' | 'pulse' | 'glow' | 'rotate' | 'shake' | 'sparkle' | 'flash' | 'wave';
                console.log('🎬 Applying Animation Template:', templateId);
                applyAnimationTemplate(templateId);
              }
            }}
          >
            <option value="">Select Preset</option>
            {ANIMATION_TEMPLATES.map(template => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>
          <div style={{
            marginLeft: 'auto',
            color: '#9ca3af',
            fontSize: '11px'
          }}>
            {selectedSymbol ? `${selectedSymbol.animationComplexity} • ${selectedSymbol.size}` : 'No symbol'}
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={!selectedSymbol}
          style={{
            background: '#e60012',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: selectedSymbol ? 'pointer' : 'not-allowed',
            opacity: selectedSymbol ? 1 : 0.5
          }}
        >
          💾 Save Symbol
        </button>
      </div>

      {/* Bottom Row: Timeline Scrubber */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 0'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#e60012',
          minWidth: '60px'
        }}>
          🎬 Timeline
        </div>
        
        {/* Frame Counter */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          minWidth: '60px',
          textAlign: 'center'
        }}>
          {Math.round(localFrame)}/{totalFrames}
        </div>

        {/* Timeline Scrubber */}
        <div style={{
          flex: 1,
          position: 'relative',
          height: '30px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="range"
            min="0"
            max={totalFrames}
            value={localFrame}
            onChange={handleScrubberChange}
            onMouseDown={handleScrubberMouseDown}
            onMouseUp={handleScrubberMouseUp}
            disabled={!selectedSymbol}
            className="timeline-scrubber"
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: selectedSymbol ? 
                `linear-gradient(to right, #e60012 0%, #e60012 ${(localFrame / totalFrames) * 100}%, #e5e7eb ${(localFrame / totalFrames) * 100}%, #e5e7eb 100%)` :
                '#e5e7eb',
              outline: 'none',
              cursor: selectedSymbol ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol ? 1 : 0.5
            }}
          />
        </div>

        {/* Frame Navigation Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onFrameSeek(Math.max(0, localFrame - 1))}
            disabled={!selectedSymbol || localFrame <= 0}
            style={{
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: selectedSymbol && localFrame > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol && localFrame > 0 ? 1 : 0.5
            }}
          >
            ⏮️
          </button>
          <button
            onClick={() => onFrameSeek(Math.min(totalFrames, localFrame + 1))}
            disabled={!selectedSymbol || localFrame >= totalFrames}
            style={{
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: selectedSymbol && localFrame < totalFrames ? 'pointer' : 'not-allowed',
              opacity: selectedSymbol && localFrame < totalFrames ? 1 : 0.5
            }}
          >
            ⏭️
          </button>
        </div>
      </div>
    </div>
  );
};