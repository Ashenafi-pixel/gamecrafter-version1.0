/**
 * Auto-Animate Section Component
 * Primary action for applying AI-powered smart animation defaults
 */

import React from 'react';

interface AutoAnimateSectionProps {
  onAutoAnimate: () => void;
  isAnimating: boolean;
  disabled: boolean;
}

const AutoAnimateSection: React.FC<AutoAnimateSectionProps> = ({
  onAutoAnimate,
  isAnimating,
  disabled
}) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '12px',
      padding: '20px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>🤖</div>
          <h3 style={{
            margin: '0',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            AI Auto-Animate
          </h3>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Recommended
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          opacity: 0.9,
          lineHeight: '1.5'
        }}>
          Let our AI analyze your sprites and apply the perfect animations automatically. 
          Great for quick results and beginners.
        </p>

        {/* Features list */}
        <div style={{
          marginBottom: '20px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          <div style={{ marginBottom: '4px' }}>✨ Smart animation selection</div>
          <div style={{ marginBottom: '4px' }}>⚡ Optimized timing coordination</div>
          <div style={{ marginBottom: '4px' }}>🎯 Perfect for slot symbols</div>
        </div>

        {/* Main action button */}
        <button
          onClick={onAutoAnimate}
          disabled={disabled || isAnimating}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: disabled ? 'rgba(255,255,255,0.2)' : 
                       isAnimating ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
            color: disabled ? 'rgba(255,255,255,0.5)' : 
                   isAnimating ? 'white' : '#1d4ed8',
            fontSize: '16px',
            fontWeight: '700',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isAnimating) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !isAnimating) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {isAnimating ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Processing...
            </>
          ) : (
            <>
              🚀 Auto-Animate Now
            </>
          )}
        </button>

        {/* Help text */}
        {disabled && (
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            opacity: 0.7,
            textAlign: 'center'
          }}>
            Upload an image first to enable auto-animation
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AutoAnimateSection;