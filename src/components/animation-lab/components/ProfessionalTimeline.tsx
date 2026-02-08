/**
 * Professional Timeline Component
 * Advanced timeline interface from V1.0 for keyframe animation editing
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Keyframe {
  time: number;
  value: number;
  ease: string;
  selected: boolean;
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
  keyframes: Keyframe[];
  blendMode: 'override' | 'additive' | 'multiply';
}

interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  loopMode: 'once' | 'forever' | 'ping-pong';
  zoom: number;
  scrollX: number;
  snapToFrames: boolean;
  selectedKeyframes: Set<string>;
}

interface ProfessionalTimelineProps {
  tracks: AnimationTrack[];
  onTracksChange: (tracks: AnimationTrack[]) => void;
  onTimelineStateChange: (state: Partial<TimelineState>) => void;
  initialState?: Partial<TimelineState>;
}

const TRACK_HEIGHT = 40;
const TIMELINE_HEIGHT = 32;
const ZOOM_LEVELS = [0.1, 0.25, 0.5, 1, 2, 4, 8, 16];
const EASING_OPTIONS = [
  'linear', 'sine.inOut', 'power2.inOut', 'power3.inOut', 
  'elastic.inOut', 'bounce.out', 'back.inOut', 'circ.inOut'
];

const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  tracks,
  onTracksChange,
  onTimelineStateChange,
  initialState = {}
}) => {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    duration: 5000,
    isPlaying: false,
    playbackSpeed: 1,
    loopMode: 'forever',
    zoom: 1,
    scrollX: 0,
    snapToFrames: true,
    selectedKeyframes: new Set(),
    ...initialState
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // Playback controls
  const handlePlay = useCallback(() => {
    setTimelineState(prev => {
      const newState = { ...prev, isPlaying: !prev.isPlaying };
      onTimelineStateChange(newState);
      
      if (newState.isPlaying) {
        lastTimestampRef.current = performance.now();
        const animate = (timestamp: number) => {
          const deltaTime = (timestamp - lastTimestampRef.current) * newState.playbackSpeed;
          lastTimestampRef.current = timestamp;
          
          setTimelineState(current => {
            let newTime = current.currentTime + deltaTime;
            
            // Handle loop modes
            if (newTime >= current.duration) {
              switch (current.loopMode) {
                case 'once':
                  newTime = current.duration;
                  return { ...current, currentTime: newTime, isPlaying: false };
                case 'forever':
                  newTime = newTime % current.duration;
                  break;
                case 'ping-pong':
                  // Implementation for ping-pong would go here
                  newTime = current.duration - (newTime - current.duration);
                  break;
              }
            }
            
            const updatedState = { ...current, currentTime: newTime };
            onTimelineStateChange(updatedState);
            return updatedState;
          });
          
          if (newState.isPlaying) {
            playbackTimerRef.current = requestAnimationFrame(animate);
          }
        };
        playbackTimerRef.current = requestAnimationFrame(animate);
      } else {
        if (playbackTimerRef.current) {
          cancelAnimationFrame(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
      }
      
      return newState;
    });
  }, [onTimelineStateChange]);

  const handleStop = useCallback(() => {
    setTimelineState(prev => {
      const newState = { ...prev, isPlaying: false, currentTime: 0 };
      onTimelineStateChange(newState);
      return newState;
    });
    
    if (playbackTimerRef.current) {
      cancelAnimationFrame(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, [onTimelineStateChange]);

  const handleSeek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timelineState.duration));
    setTimelineState(prev => {
      const newState = { ...prev, currentTime: clampedTime };
      onTimelineStateChange(newState);
      return newState;
    });
  }, [timelineState.duration, onTimelineStateChange]);

  // Track management
  const handleTrackVisibilityToggle = useCallback((trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, visible: !track.visible } : track
    );
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  const handleTrackLockToggle = useCallback((trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, locked: !track.locked } : track
    );
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  const handleTrackMuteToggle = useCallback((trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    );
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  // Keyframe management
  const addKeyframe = useCallback((trackId: string, time: number, value: number) => {
    const updatedTracks = tracks.map(track => {
      if (track.id === trackId && !track.locked) {
        const newKeyframe: Keyframe = {
          time,
          value,
          ease: 'sine.inOut',
          selected: false
        };
        return {
          ...track,
          keyframes: [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
        };
      }
      return track;
    });
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  const removeKeyframe = useCallback((trackId: string, keyframeIndex: number) => {
    const updatedTracks = tracks.map(track => {
      if (track.id === trackId && !track.locked) {
        return {
          ...track,
          keyframes: track.keyframes.filter((_, index) => index !== keyframeIndex)
        };
      }
      return track;
    });
    onTracksChange(updatedTracks);
  }, [tracks, onTracksChange]);

  // Time scale calculations
  const timeToPixels = useCallback((time: number) => {
    return (time / timelineState.duration) * 800 * timelineState.zoom;
  }, [timelineState.duration, timelineState.zoom]);

  const pixelsToTime = useCallback((pixels: number) => {
    return (pixels / (800 * timelineState.zoom)) * timelineState.duration;
  }, [timelineState.duration, timelineState.zoom]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      background: '#2d2d2d',
      color: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Timeline Header */}
      <div style={{
        background: '#404040',
        padding: '12px 16px',
        borderBottom: '1px solid #555',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            🎬 Professional Timeline
          </h3>
          <div style={{ fontSize: '12px', color: '#bbb' }}>
            {tracks.length} tracks • {Math.round(timelineState.currentTime)}ms / {timelineState.duration}ms
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={timelineState.loopMode}
            onChange={(e) => setTimelineState(prev => ({ 
              ...prev, 
              loopMode: e.target.value as any 
            }))}
            style={{
              background: '#555',
              color: 'white',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px'
            }}
          >
            <option value="once">Once</option>
            <option value="forever">Loop</option>
            <option value="ping-pong">Ping-Pong</option>
          </select>
          
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={timelineState.playbackSpeed}
            onChange={(e) => setTimelineState(prev => ({ 
              ...prev, 
              playbackSpeed: parseFloat(e.target.value) 
            }))}
            style={{ width: '60px' }}
          />
          <span style={{ fontSize: '11px', minWidth: '30px' }}>
            {timelineState.playbackSpeed}x
          </span>
        </div>
      </div>

      {/* Playback Controls */}
      <div style={{
        background: '#383838',
        padding: '8px 16px',
        borderBottom: '1px solid #555',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={handleStop}
          style={{
            background: '#555',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ⏹️ Stop
        </button>
        
        <button
          onClick={handlePlay}
          style={{
            background: timelineState.isPlaying ? '#d9534f' : '#5cb85c',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          {timelineState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>

        <div style={{ flex: 1, height: '1px', background: '#555', margin: '0 12px' }} />

        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={timelineState.snapToFrames}
            onChange={(e) => setTimelineState(prev => ({ 
              ...prev, 
              snapToFrames: e.target.checked 
            }))}
          />
          Snap to Frames
        </label>

        <select
          value={timelineState.zoom}
          onChange={(e) => setTimelineState(prev => ({ 
            ...prev, 
            zoom: parseFloat(e.target.value) 
          }))}
          style={{
            background: '#555',
            color: 'white',
            border: '1px solid #666',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px'
          }}
        >
          {ZOOM_LEVELS.map(level => (
            <option key={level} value={level}>{level}x</option>
          ))}
        </select>
      </div>

      {/* Timeline Tracks */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {tracks.map((track, trackIndex) => (
          <div
            key={track.id}
            style={{
              display: 'flex',
              borderBottom: trackIndex < tracks.length - 1 ? '1px solid #444' : 'none',
              minHeight: TRACK_HEIGHT
            }}
          >
            {/* Track Header */}
            <div style={{
              width: '200px',
              background: '#353535',
              padding: '8px 12px',
              borderRight: '1px solid #555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500' }}>{track.name}</div>
                <div style={{ fontSize: '10px', color: '#bbb' }}>{track.property}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleTrackVisibilityToggle(track.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: track.visible ? '#5cb85c' : '#666',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px'
                  }}
                  title="Toggle visibility"
                >
                  👁️
                </button>
                
                <button
                  onClick={() => handleTrackLockToggle(track.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: track.locked ? '#d9534f' : '#666',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px'
                  }}
                  title="Toggle lock"
                >
                  🔒
                </button>
                
                <button
                  onClick={() => handleTrackMuteToggle(track.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: track.muted ? '#d9534f' : '#666',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px'
                  }}
                  title="Toggle mute"
                >
                  🔇
                </button>
              </div>
            </div>

            {/* Track Timeline */}
            <div
              ref={timelineRef}
              style={{
                flex: 1,
                background: track.visible ? '#2d2d2d' : '#1a1a1a',
                position: 'relative',
                height: TRACK_HEIGHT,
                cursor: track.locked ? 'not-allowed' : 'crosshair'
              }}
              onDoubleClick={(e) => {
                if (!track.locked) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const time = pixelsToTime(x);
                  addKeyframe(track.id, time, 50); // Default value
                }
              }}
            >
              {/* Keyframes */}
              {track.keyframes.map((keyframe, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${timeToPixels(keyframe.time)}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    background: track.color,
                    borderRadius: '50%',
                    border: keyframe.selected ? '2px solid white' : '1px solid #666',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                  onClick={() => {
                    // Handle keyframe selection
                    console.log(`Selected keyframe at ${keyframe.time}ms`);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    removeKeyframe(track.id, index);
                  }}
                  title={`${keyframe.time}ms: ${keyframe.value} (${keyframe.ease})`}
                />
              ))}

              {/* Playhead */}
              <div
                style={{
                  position: 'absolute',
                  left: `${timeToPixels(timelineState.currentTime)}px`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  background: '#ff6b6b',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Ruler */}
      <div style={{
        height: TIMELINE_HEIGHT,
        background: '#404040',
        borderTop: '1px solid #555',
        position: 'relative',
        marginLeft: '200px'
      }}>
        {/* Time markers */}
        {Array.from({ length: Math.ceil(timelineState.duration / 1000) + 1 }, (_, i) => {
          const time = i * 1000;
          const x = timeToPixels(time);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: '#666',
                display: 'flex',
                alignItems: 'flex-end'
              }}
            >
              <div style={{
                fontSize: '10px',
                color: '#bbb',
                marginLeft: '2px',
                marginBottom: '2px'
              }}>
                {(time / 1000).toFixed(1)}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessionalTimeline;