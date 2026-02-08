import React from 'react';

const BlackBarUI: React.FC<{ isGamePreview?: boolean }> = ({ isGamePreview = false }) => {
  // Hard-coded UI bar with absolute positioning for game preview
  return (
    <div
      style={{
        position: isGamePreview ? 'absolute' : 'fixed', // Position absolute for game preview, fixed for viewport
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: 'black',
        width: '100%',
        zIndex: 999999, // Ultra high z-index
        margin: 0,
        padding: 0,
        overflow: 'visible',
        boxSizing: 'border-box',
        // Remove border and shadow for cleaner edge
        borderTop: 0,
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0
      }}
    >
      {/* Simple UI controls */}
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        {/* Left side - Balance */}
        <div>
          <span style={{ fontSize: '12px', color: '#999', display: 'block', textTransform: 'uppercase' }}>BALANCE</span>
          <span style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>€1,000.00</span>
        </div>
        
        {/* Center - Spin button */}
        <div style={{ position: 'absolute', left: '50%', top: '-22px', transform: 'translateX(-50%)' }}>
          <button
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 100%)',
              border: '5px solid rgba(255,255,255,0.25)',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 20 20" fill="white">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </button>
        </div>
        
        {/* Right side - Bet controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#555',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '22px',
              fontWeight: 'bold'
            }}
          >−</button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#999', display: 'block', textTransform: 'uppercase' }}>TOTAL BET</span>
            <span style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>€5.00</span>
          </div>
          <button
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#555',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '22px',
              fontWeight: 'bold'
            }}
          >+</button>
        </div>
      </div>
    </div>
  );
};

export default BlackBarUI;
