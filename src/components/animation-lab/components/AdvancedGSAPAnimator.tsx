/**
 * Advanced GSAP Animator Component
 * Professional 8-animation system from V1.0 integrated into V2.0 Advanced Mode
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import ProfessionalTimeline from './ProfessionalTimeline';

interface AnimationConfig {
  duration: number;
  ease: string;
  repeat: number;
  yoyo: boolean;
  delay: number;
  intensity: number;
}

interface SpriteElement {
  id: string;
  name: string;
  element: HTMLElement | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  alpha: number;
}

interface AnimationTrack {
  id: string;
  name: string;
  property: string;
  color: string;
  visible: boolean;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  keyframes: Array<{
    time: number;
    value: number;
    ease: string;
    selected: boolean;
  }>;
  blendMode: 'override' | 'additive' | 'multiply';
}

interface AdvancedGSAPAnimatorProps {
  sprites: SpriteElement[];
  onAnimationUpdate: (sprites: SpriteElement[]) => void;
}

const ANIMATION_PRESETS = {
  glow: {
    name: '✨ Glow',
    icon: '✨',
    description: 'Pulsing glow effect with opacity changes',
    color: '#f39c12',
    defaultConfig: {
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0,
      intensity: 1
    }
  },
  rotation: {
    name: '🔄 Rotation',
    icon: '🔄',
    description: 'Continuous rotation animation',
    color: '#3498db',
    defaultConfig: {
      duration: 4,
      ease: 'none',
      repeat: -1,
      yoyo: false,
      delay: 0,
      intensity: 360
    }
  },
  pulse: {
    name: '💓 Pulse',
    icon: '💓',
    description: 'Scale pulsing with heartbeat rhythm',
    color: '#e74c3c',
    defaultConfig: {
      duration: 1.5,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0,
      intensity: 0.2
    }
  },
  float: {
    name: '☁️ Float',
    icon: '☁️',
    description: 'Gentle floating motion up and down',
    color: '#9b59b6',
    defaultConfig: {
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0,
      intensity: 20
    }
  },
  bounce: {
    name: '⬆️ Bounce',
    icon: '⬆️',
    description: 'Energetic bouncing effect',
    color: '#2ecc71',
    defaultConfig: {
      duration: 1.2,
      ease: 'bounce.out',
      repeat: -1,
      yoyo: false,
      delay: 0,
      intensity: 30
    }
  },
  swing: {
    name: '↩️ Swing',
    icon: '↩️',
    description: 'Pendulum swinging motion',
    color: '#f1c40f',
    defaultConfig: {
      duration: 2.5,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0.5,
      intensity: 15
    }
  },
  particle: {
    name: '🎆 Particle',
    icon: '🎆',
    description: 'Particle-like scattered movement',
    color: '#e67e22',
    defaultConfig: {
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0.2,
      intensity: 0.8
    }
  },
  scale: {
    name: '🔍 Scale',
    icon: '🔍',
    description: 'Dynamic scaling with elastic effect',
    color: '#1abc9c',
    defaultConfig: {
      duration: 2.5,
      ease: 'elastic.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0,
      intensity: 0.3
    }
  }
};

const EASING_OPTIONS = [
  'none', 'sine.inOut', 'power2.inOut', 'power3.inOut',
  'elastic.inOut', 'bounce.out', 'back.inOut', 'circ.inOut'
];

const AdvancedGSAPAnimator: React.FC<AdvancedGSAPAnimatorProps> = ({
  sprites,
  onAnimationUpdate
}) => {
  const [selectedSprites, setSelectedSprites] = useState<Set<string>>(new Set());
  const [selectedAnimation, setSelectedAnimation] = useState<string>('glow');
  const [animationConfigs, setAnimationConfigs] = useState<Record<string, Record<string, AnimationConfig>>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationTracks, setAnimationTracks] = useState<AnimationTrack[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const timelinesRef = useRef<Map<string, gsap.core.Timeline>>(new Map());
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Initialize animation configs for sprites
  useEffect(() => {
    const newConfigs: Record<string, Record<string, AnimationConfig>> = {};
    sprites.forEach(sprite => {
      newConfigs[sprite.id] = {};
      Object.entries(ANIMATION_PRESETS).forEach(([key, preset]) => {
        newConfigs[sprite.id][key] = { ...preset.defaultConfig };
      });
    });
    setAnimationConfigs(newConfigs);
  }, [sprites]);

  // Create animation timeline for a sprite
  const createAnimationTimeline = useCallback((
    sprite: SpriteElement, 
    animationType: string, 
    config: AnimationConfig
  ) => {
    if (!sprite.element) return null;

    const timeline = gsap.timeline({
      repeat: config.repeat,
      yoyo: config.yoyo,
      delay: config.delay
    });

    const element = sprite.element;

    switch (animationType) {
      case 'glow':
        timeline.to(element, {
          duration: config.duration,
          filter: `drop-shadow(0 0 ${config.intensity * 10}px #ffd700) brightness(${1 + config.intensity * 0.5})`,
          ease: config.ease
        });
        break;

      case 'rotation':
        timeline.to(element, {
          duration: config.duration,
          rotation: config.intensity,
          ease: config.ease,
          transformOrigin: 'center center'
        });
        break;

      case 'pulse':
        timeline.to(element, {
          duration: config.duration,
          scale: sprite.scale + config.intensity,
          ease: config.ease,
          transformOrigin: 'center center'
        });
        break;

      case 'float':
        timeline.to(element, {
          duration: config.duration,
          y: sprite.position.y - config.intensity,
          ease: config.ease
        });
        break;

      case 'bounce':
        timeline.to(element, {
          duration: config.duration,
          y: sprite.position.y - config.intensity,
          ease: config.ease
        });
        break;

      case 'swing':
        timeline.to(element, {
          duration: config.duration,
          rotation: config.intensity,
          ease: config.ease,
          transformOrigin: 'center top'
        });
        break;

      case 'particle':
        const randomX = (Math.random() - 0.5) * config.intensity * 20;
        const randomY = (Math.random() - 0.5) * config.intensity * 20;
        timeline.to(element, {
          duration: config.duration,
          x: sprite.position.x + randomX,
          y: sprite.position.y + randomY,
          ease: config.ease
        });
        break;

      case 'scale':
        timeline.to(element, {
          duration: config.duration,
          scaleX: sprite.scale + config.intensity,
          scaleY: sprite.scale + config.intensity,
          ease: config.ease,
          transformOrigin: 'center center'
        });
        break;
    }

    return timeline;
  }, []);

  // Apply animation to selected sprites
  const applyAnimation = useCallback(() => {
    selectedSprites.forEach(spriteId => {
      const sprite = sprites.find(s => s.id === spriteId);
      if (!sprite) return;

      const config = animationConfigs[spriteId]?.[selectedAnimation];
      if (!config) return;

      // Stop existing timeline
      const existingTimeline = timelinesRef.current.get(`${spriteId}-${selectedAnimation}`);
      if (existingTimeline) {
        existingTimeline.kill();
      }

      // Create new timeline
      const timeline = createAnimationTimeline(sprite, selectedAnimation, config);
      if (timeline) {
        timelinesRef.current.set(`${spriteId}-${selectedAnimation}`, timeline);
        
        // Add to master timeline if playing
        if (isPlaying && masterTimelineRef.current) {
          masterTimelineRef.current.add(timeline, 0);
        }
      }
    });

    console.log(`🎭 Applied ${selectedAnimation} to ${selectedSprites.size} sprites`);
  }, [selectedSprites, selectedAnimation, animationConfigs, sprites, createAnimationTimeline, isPlaying]);

  // Play all animations
  const playAnimations = useCallback(() => {
    if (!masterTimelineRef.current) {
      masterTimelineRef.current = gsap.timeline();
    }

    masterTimelineRef.current.clear();
    
    // Add all active animations to master timeline
    timelinesRef.current.forEach((timeline) => {
      masterTimelineRef.current!.add(timeline, 0);
    });

    masterTimelineRef.current.play();
    setIsPlaying(true);
    
    console.log('▶️ Started animation playback');
  }, []);

  // Stop all animations
  const stopAnimations = useCallback(() => {
    if (masterTimelineRef.current) {
      masterTimelineRef.current.pause();
    }
    
    timelinesRef.current.forEach((timeline) => {
      timeline.pause();
    });
    
    setIsPlaying(false);
    console.log('⏸️ Stopped animation playback');
  }, []);

  // Clear all animations
  const clearAnimations = useCallback(() => {
    timelinesRef.current.forEach((timeline) => {
      timeline.kill();
    });
    timelinesRef.current.clear();
    
    if (masterTimelineRef.current) {
      masterTimelineRef.current.kill();
      masterTimelineRef.current = null;
    }
    
    setIsPlaying(false);
    console.log('🧹 Cleared all animations');
  }, []);

  // Update animation config
  const updateAnimationConfig = useCallback((
    spriteId: string, 
    animationType: string, 
    property: string, 
    value: number | string
  ) => {
    setAnimationConfigs(prev => ({
      ...prev,
      [spriteId]: {
        ...prev[spriteId],
        [animationType]: {
          ...prev[spriteId]?.[animationType],
          [property]: value
        }
      }
    }));
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearAnimations();
    };
  }, [clearAnimations]);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>
            🎭 Advanced GSAP Animator
          </h3>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
            Professional 8-animation system with timeline control
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            style={{
              padding: '8px 12px',
              background: showTimeline ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🎬 Timeline
          </button>
          
          <button
            onClick={isPlaying ? stopAnimations : playAnimations}
            style={{
              padding: '8px 16px',
              background: isPlaying ? '#e74c3c' : '#27ae60',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={clearAnimations}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Animation Presets Grid */}
      <div style={{ padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
          Animation Types
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {Object.entries(ANIMATION_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedAnimation(key)}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: selectedAnimation === key ? `2px solid ${preset.color}` : '2px solid #e5e7eb',
                background: selectedAnimation === key ? `${preset.color}15` : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>{preset.icon}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: selectedAnimation === key ? preset.color : '#374151'
                }}>
                  {preset.name}
                </span>
              </div>
              <p style={{
                margin: '0',
                fontSize: '12px',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                {preset.description}
              </p>
            </button>
          ))}
        </div>

        {/* Apply Animation Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={applyAnimation}
            disabled={selectedSprites.size === 0}
            style={{
              padding: '12px 24px',
              background: selectedSprites.size > 0 ? 
                ANIMATION_PRESETS[selectedAnimation]?.color || '#3b82f6' : 
                '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selectedSprites.size > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            🎯 Apply {ANIMATION_PRESETS[selectedAnimation]?.name} to {selectedSprites.size} sprites
          </button>
        </div>

        {/* Selected Sprites */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
            Selected Sprites ({selectedSprites.size})
          </h5>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {sprites.map(sprite => (
              <button
                key={sprite.id}
                onClick={() => {
                  const newSelected = new Set(selectedSprites);
                  if (newSelected.has(sprite.id)) {
                    newSelected.delete(sprite.id);
                  } else {
                    newSelected.add(sprite.id);
                  }
                  setSelectedSprites(newSelected);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: selectedSprites.has(sprite.id) ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  background: selectedSprites.has(sprite.id) ? '#dbeafe' : 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: selectedSprites.has(sprite.id) ? '#1d4ed8' : '#374151'
                }}
              >
                {sprite.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Professional Timeline */}
      {showTimeline && (
        <div style={{
          borderTop: '1px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <ProfessionalTimeline
            tracks={animationTracks}
            onTracksChange={setAnimationTracks}
            onTimelineStateChange={(state) => {
              console.log('Timeline state changed:', state);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedGSAPAnimator;