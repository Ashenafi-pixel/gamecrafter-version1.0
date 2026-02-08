/**
 * Quick Presets Component
 * One-click animation presets for common slot symbol types
 */

import React, { useState } from 'react';

interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  bestFor: string;
  color: string;
}

const presets: Preset[] = [
  {
    id: 'gem_slot',
    name: 'Gem Slot',
    icon: '💎',
    description: 'Sparkling gems with subtle bounces',
    bestFor: 'Gem symbols, jewels, crystals',
    color: '#ec4899'
  },
  {
    id: 'character_slot',
    name: 'Character Slot',
    icon: '🎭',
    description: 'Breathing characters with personality',
    bestFor: 'Mascots, animals, people',
    color: '#f59e0b'
  },
  {
    id: 'scatter_text',
    name: 'Scatter Text',
    icon: '🌊',
    description: 'Bouncy wave text reveals',
    bestFor: 'SCATTER, BONUS, FREE text',
    color: '#10b981'
  },
  {
    id: 'wild_symbol',
    name: 'Wild Symbol',
    icon: '⚡',
    description: 'Powerful glow and energy effects',
    bestFor: 'WILD symbols, special icons',
    color: '#8b5cf6'
  },
  {
    id: 'classic_fruit',
    name: 'Classic Fruit',
    icon: '🍒',
    description: 'Simple pulses and gentle movement',
    bestFor: 'Fruits, classic symbols',
    color: '#ef4444'
  },
  {
    id: 'bonus_special',
    name: 'Bonus Special',
    icon: '🎁',
    description: 'Exciting burst and celebration',
    bestFor: 'Bonus symbols, special features',
    color: '#06b6d4'
  }
];

interface QuickPresetsProps {
  onPresetSelected: (presetId: string) => void;
  selectedPreset: string | null;
  disabled: boolean;
}

const QuickPresets: React.FC<QuickPresetsProps> = ({
  onPresetSelected,
  selectedPreset,
  disabled
}) => {
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '20px' }}>⚡</div>
        <h3 style={{
          margin: '0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Quick Presets
        </h3>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 20px 0',
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5'
      }}>
        Choose a preset that matches your symbol type for instant professional animations.
      </p>

      {/* Preset grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {presets.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const isHovered = hoveredPreset === preset.id;
          
          return (
            <button
              key={preset.id}
              onClick={() => onPresetSelected(preset.id)}
              disabled={disabled}
              onMouseEnter={() => setHoveredPreset(preset.id)}
              onMouseLeave={() => setHoveredPreset(null)}
              style={{
                padding: '16px 12px',
                borderRadius: '8px',
                border: isSelected ? `2px solid ${preset.color}` : '2px solid #e5e7eb',
                background: disabled ? '#f9fafb' : 
                           isSelected ? `${preset.color}15` : 
                           isHovered ? '#f8fafc' : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                opacity: disabled ? 0.5 : 1,
                transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered && !disabled ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                {preset.icon}
              </div>

              {/* Name */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isSelected ? preset.color : '#374151',
                marginBottom: '4px'
              }}>
                {preset.name}
              </div>

              {/* Description */}
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                lineHeight: '1.3'
              }}>
                {preset.description}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  marginTop: '8px',
                  padding: '2px 8px',
                  background: preset.color,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help text */}
      {disabled && (
        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Upload an image first to select presets
        </div>
      )}

      {/* Selected preset info */}
      {selectedPreset && !disabled && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px'
        }}>
          {(() => {
            const preset = presets.find(p => p.id === selectedPreset);
            return preset ? (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0369a1',
                  marginBottom: '4px'
                }}>
                  {preset.icon} {preset.name} Selected
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#0284c7'
                }}>
                  Best for: {preset.bestFor}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default QuickPresets;