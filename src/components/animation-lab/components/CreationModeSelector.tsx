/**
 * Creation Mode Selector Component
 * Toggle between Upload and Generate modes from V1.0
 */

import React from 'react';

interface CreationModeSelectorProps {
  mode: 'upload' | 'generate';
  onModeChange: (mode: 'upload' | 'generate') => void;
  disabled?: boolean;
}

const CreationModeSelector: React.FC<CreationModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      padding: '4px',
      display: 'inline-flex',
      marginBottom: '20px'
    }}>
      <button
        onClick={() => onModeChange('upload')}
        disabled={disabled}
        style={{
          padding: '12px 20px',
          border: 'none',
          borderRadius: '8px',
          background: mode === 'upload' ? 
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
            'transparent',
          color: mode === 'upload' ? 'white' : '#6b7280',
          fontSize: '14px',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span style={{ fontSize: '16px' }}>📁</span>
        Upload Image
      </button>
      
      <button
        onClick={() => onModeChange('generate')}
        disabled={disabled}
        style={{
          padding: '12px 20px',
          border: 'none',
          borderRadius: '8px',
          background: mode === 'generate' ? 
            'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 
            'transparent',
          color: mode === 'generate' ? 'white' : '#6b7280',
          fontSize: '14px',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span style={{ fontSize: '16px' }}>🎨</span>
        Generate with AI
      </button>
    </div>
  );
};

export default CreationModeSelector;