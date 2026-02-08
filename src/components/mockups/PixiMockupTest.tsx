import React from 'react';
import PixiPreviewWrapper from './PixiPreviewWrapper';
import { useGameStore } from '../../store';

/**
 * Test component for PixiJS mockup components
 * This component can be used to test the PixiPreviewWrapper and PixiSlotMockup components
 */
const PixiMockupTest: React.FC = () => {
  const { config, updateConfig } = useGameStore();

  // Test data
  const testSymbols = [
    '/assets/brand/gold.png',
    '/assets/brand/gold.png',
    '/assets/brand/gold.png'
  ];

  // Initialize test configuration if needed
  React.useEffect(() => {
    if (!config?.reels?.layout) {
      updateConfig({
        ...config,
        reels: {
          layout: {
            reels: 5,
            rows: 3
          }
        },
        theme: {
          generated: {
            symbols: testSymbols
          }
        },
        name: 'Test Slot Game'
      });
    }
  }, [config, updateConfig]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', margin: 0 }}>
          PixiJS Mockup Test
        </h1>
        
        <div style={{ 
          flex: 1,
          border: '2px solid #333',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <PixiPreviewWrapper 
            stepSource="test"
            className="test-preview"
          />
        </div>
        
        <div style={{ 
          color: 'white', 
          fontSize: '12px', 
          textAlign: 'center',
          opacity: 0.7
        }}>
          Test the view mode buttons and verify PixiJS rendering works correctly
        </div>
      </div>
    </div>
  );
};

export default PixiMockupTest;
