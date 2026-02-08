/**
 * Mode Toggle Header
 * Header component with Animation Lab branding and Simple/Advanced mode toggle
 */

import React from 'react';
import { useAnimationLab } from '../AnimationLabModeProvider';

const ModeToggleHeader: React.FC = () => {
  const { mode, toggleMode } = useAnimationLab();

  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px 24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left side - Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎬 Animation Lab 2.0
          </div>
          <div style={{
            fontSize: '14px',
            opacity: 0.9,
            fontWeight: '400'
          }}>
            Professional Sprite Animation Studio
          </div>
        </div>

        {/* Right side - Mode toggle and controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mode indicator */}
          <div style={{
            fontSize: '12px',
            opacity: 0.8,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Current Mode
          </div>

          {/* Mode toggle button */}
          <button
            onClick={toggleMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              background: mode === 'simple' 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = mode === 'simple' 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {mode === 'simple' ? '🎯' : '🔧'}
            <span>{mode === 'simple' ? 'Simple Mode' : 'Advanced Mode'}</span>
            <span style={{ 
              fontSize: '12px', 
              opacity: 0.7,
              marginLeft: '4px'
            }}>
              {mode === 'simple' ? '→ Switch to Advanced' : '→ Switch to Simple'}
            </span>
          </button>

          {/* Help button */}
          <button
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            ❓ Help
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div style={{
        maxWidth: '1400px',
        margin: '12px auto 0',
        fontSize: '13px',
        opacity: 0.85,
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: '12px'
      }}>
        {mode === 'simple' ? (
          <span>
            🎯 <strong>Simple Mode:</strong> AI-powered animation with smart defaults. Perfect for quick results and beginners.
          </span>
        ) : (
          <span>
            🔧 <strong>Advanced Mode:</strong> Full manual control with professional tools. Complete animation authoring capabilities.
          </span>
        )}
      </div>
    </header>
  );
};

export default ModeToggleHeader;