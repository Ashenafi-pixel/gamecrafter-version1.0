/**
 * Animation Selection Modal
 * Allows users to choose and configure animations for individual assets
 */

import React, { useState } from 'react';

interface AnimationConfig {
  name: string;
  duration: number;
  delay: number;
  loop: boolean;
  easing: string;
  parameters?: Record<string, any>;
}

interface AnimationSelectionModalProps {
  isOpen: boolean;
  assetName: string;
  assetType: 'text' | 'character' | 'object' | 'effect';
  currentAnimation: string;
  onClose: () => void;
  onApply: (animationConfig: AnimationConfig) => void;
}

const AnimationSelectionModal: React.FC<AnimationSelectionModalProps> = ({
  isOpen,
  assetName,
  assetType,
  currentAnimation,
  onClose,
  onApply
}) => {
  const [selectedAnimation, setSelectedAnimation] = useState(currentAnimation);
  const [duration, setDuration] = useState(1.5);
  const [delay, setDelay] = useState(0.1);
  const [loop, setLoop] = useState(true);
  const [easing, setEasing] = useState('back.out(1.7)');

  if (!isOpen) return null;

  // Animation definitions by asset type
  const animationsByType = {
    text: [
      {
        name: 'bouncy_wave',
        label: '🌊 Bouncy Wave',
        description: 'Letters bounce in sequence with wave-like timing',
        preview: 'Each letter bounces up with elastic effect'
      },
      {
        name: 'scale_pulse',
        label: '💓 Scale Pulse',
        description: 'Letters grow and shrink in sequence',
        preview: 'Each letter scales up then down rhythmically'
      },
      {
        name: 'typewriter',
        label: '⌨️ Typewriter',
        description: 'Letters appear one by one from left to right',
        preview: 'Classic typing effect with fade-in'
      },
      {
        name: 'elastic_bounce',
        label: '🎾 Elastic Bounce',
        description: 'Letters drop and bounce with elastic physics',
        preview: 'Drop from above with realistic bounce'
      },
      {
        name: 'rotation_wave',
        label: '🌀 Rotation Wave',
        description: 'Letters rotate in a wave pattern',
        preview: 'Smooth rotation with wave timing'
      },
      {
        name: 'glow_reveal',
        label: '✨ Glow Reveal',
        description: 'Letters appear with glowing light effect',
        preview: 'Fade in with bright glow overlay'
      }
    ],
    character: [
      {
        name: 'idle_breathing',
        label: '😤 Idle Breathing',
        description: 'Subtle scale animation simulating breathing',
        preview: 'Gentle scale up/down rhythm'
      },
      {
        name: 'excited_jump',
        label: '🦘 Excited Jump',
        description: 'Character jumps up and down with excitement',
        preview: 'Energetic vertical movement'
      },
      {
        name: 'tail_wag',
        label: '🐕 Tail Wag',
        description: 'Rotation animation for tail wagging',
        preview: 'Side-to-side rotation movement'
      },
      {
        name: 'head_shake',
        label: '🤔 Head Shake',
        description: 'Gentle head shaking motion',
        preview: 'Subtle horizontal shake'
      },
      {
        name: 'victory_pose',
        label: '🏆 Victory Pose',
        description: 'Character strikes a victory pose',
        preview: 'Scale up with rotation'
      }
    ],
    object: [
      {
        name: 'bounce',
        label: '⚽ Bounce',
        description: 'Object bounces up and down',
        preview: 'Vertical bounce with gravity'
      },
      {
        name: 'float',
        label: '🎈 Float',
        description: 'Gentle floating motion',
        preview: 'Smooth up/down movement'
      },
      {
        name: 'spin',
        label: '🌪️ Spin',
        description: 'Object rotates continuously',
        preview: 'Smooth 360° rotation'
      },
      {
        name: 'wobble',
        label: '🫨 Wobble',
        description: 'Wobbling motion like jelly',
        preview: 'Shake with elastic easing'
      },
      {
        name: 'orbit',
        label: '🌍 Orbit',
        description: 'Object moves in circular path',
        preview: 'Circular orbital movement'
      }
    ],
    effect: [
      {
        name: 'glow_pulse',
        label: '💫 Glow Pulse',
        description: 'Pulsing glow effect with scale',
        preview: 'Scale with opacity changes'
      },
      {
        name: 'particle_burst',
        label: '🎆 Particle Burst',
        description: 'Explosive particle effect',
        preview: 'Scale burst with rotation'
      },
      {
        name: 'fade_shimmer',
        label: '✨ Fade Shimmer',
        description: 'Gentle fade with shimmer',
        preview: 'Opacity animation with slight scale'
      },
      {
        name: 'smoke_drift',
        label: '💨 Smoke Drift',
        description: 'Drifting smoke-like movement',
        preview: 'Slow upward movement with fade'
      },
      {
        name: 'energy_field',
        label: '⚡ Energy Field',
        description: 'Electric energy field effect',
        preview: 'Rapid scale pulses with rotation'
      }
    ]
  };

  const animations = animationsByType[assetType] || [];
  const selectedAnimationData = animations.find(anim => anim.name === selectedAnimation);

  const easingOptions = [
    { value: 'back.out(1.7)', label: 'Elastic Bounce' },
    { value: 'power2.inOut', label: 'Smooth' },
    { value: 'bounce.out', label: 'Bouncy' },
    { value: 'elastic.out(1, 0.3)', label: 'Elastic' },
    { value: 'circ.inOut', label: 'Circular' },
    { value: 'expo.out', label: 'Exponential' }
  ];

  const handleApply = () => {
    const config: AnimationConfig = {
      name: selectedAnimation,
      duration,
      delay,
      loop,
      easing,
      parameters: {}
    };

    onApply(config);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              🎨 Animation Selection
            </h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
              Choose animation for {assetName} ({assetType})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            ×
          </button>
        </div>

        {/* Animation Grid */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Available Animations
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {animations.map((animation) => (
              <div
                key={animation.name}
                onClick={() => setSelectedAnimation(animation.name)}
                style={{
                  padding: '12px',
                  border: selectedAnimation === animation.name ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedAnimation === animation.name ? '#f3f4f6' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                  {animation.label}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                  {animation.description}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                  {animation.preview}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Configuration */}
        {selectedAnimationData && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Animation Settings
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={delay}
                  onChange={(e) => setDelay(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Easing
                </label>
                <select
                  value={easing}
                  onChange={(e) => setEasing(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {easingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                  />
                  Loop Animation
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              // Preview logic could go here
              console.log('🎬 Previewing animation:', selectedAnimation);
            }}
            disabled={!selectedAnimation}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: selectedAnimation ? '#3b82f6' : '#9ca3af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedAnimation ? 'pointer' : 'not-allowed'
            }}
          >
            👁️ Preview
          </button>
          
          <button
            onClick={handleApply}
            disabled={!selectedAnimation}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: selectedAnimation ? '#10b981' : '#9ca3af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedAnimation ? 'pointer' : 'not-allowed'
            }}
          >
            ✅ Apply Animation
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimationSelectionModal;