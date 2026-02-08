import React, { useState } from 'react';
import PixiAnimatedSymbol from './pixiSpriteSheet';

/**
 * Demo component to showcase sprite sheet alignment features
 * Compares aligned vs non-aligned animations side by side
 */
export default function SpriteAlignmentDemo() {
  const [testSpriteUrl, setTestSpriteUrl] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  const handleSpriteGenerated = (spriteUrl: string) => {
    setTestSpriteUrl(spriteUrl);
    setShowComparison(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🎯 Sprite Sheet Alignment Demo
      </h2>
      
      <div style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Problem & Solution</h3>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Problem:</strong> OpenAI generates sprite sheets where the object (treasure chest) 
          appears in slightly different positions within each frame, causing a "jumping" effect during animation.
        </p>
        <p style={{ margin: '0' }}>
          <strong>Solution:</strong> Frame alignment automatically detects the object in each frame 
          and centers it consistently, creating smooth animations without position jumps.
        </p>
      </div>

      {/* Generation Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Step 1: Generate a Test Sprite Sheet</h3>
        <PixiAnimatedSymbol
          enableGeneration={true}
          enableFrameAlignment={false} // Start without alignment to show the problem
          width={200}
          height={200}
          onSpriteGenerated={handleSpriteGenerated}
        />
      </div>

      {/* Comparison Section */}
      {showComparison && testSpriteUrl && (
        <div>
          <h3>Step 2: Compare Aligned vs Non-Aligned Animation</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginTop: '20px'
          }}>
            {/* Without Alignment */}
            <div style={{
              padding: '20px',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              backgroundColor: '#fff5f5'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                color: '#dc3545',
                textAlign: 'center'
              }}>
                ❌ Without Frame Alignment
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                Notice the "jumping" effect as the object moves between frames
              </p>
              <PixiAnimatedSymbol
                imageUrl={testSpriteUrl}
                enableFrameAlignment={false}
                width={200}
                height={200}
                animationSpeed={0.15}
              />
            </div>

            {/* With Alignment */}
            <div style={{
              padding: '20px',
              border: '2px solid #28a745',
              borderRadius: '8px',
              backgroundColor: '#f8fff9'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                color: '#28a745',
                textAlign: 'center'
              }}>
                ✅ With Frame Alignment
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                Smooth animation with consistent object positioning
              </p>
              <PixiAnimatedSymbol
                imageUrl={testSpriteUrl}
                enableFrameAlignment={true}
                width={200}
                height={200}
                animationSpeed={0.15}
              />
            </div>
          </div>

          {/* Technical Details */}
          <div style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: '#e9ecef',
            border: '1px solid #ced4da',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 12px 0' }}>🔧 Technical Implementation</h4>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li><strong>Object Detection:</strong> Analyzes each frame to find non-transparent pixels</li>
              <li><strong>Bounds Calculation:</strong> Determines the bounding box of the object in each frame</li>
              <li><strong>Center Alignment:</strong> Repositions each object to the center of its frame</li>
              <li><strong>Consistent Sizing:</strong> Ensures all frames have the same dimensions</li>
              <li><strong>New Sprite Sheet:</strong> Generates an aligned sprite sheet for smooth animation</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
